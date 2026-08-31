from flask import Blueprint, request, jsonify, g
from datetime import datetime, date
from sqlalchemy import or_
from app import db
from models import (
    DailyUpdate, TrainingSession, User, Intern, AuditLog,
    EmployeeDailyReport, InternDailyReport, Notification, AssignedMeeting,
    DailyTracker, TrackerAccessOverride
)
from middleware import auth_required, role_required, admin_required
from services.tracker_service import get_today_local, evaluate_intern_access, get_or_create_today_tracker

tracker_bp = Blueprint('tracker', __name__)


def _clean_concepts(val):
    if not val:
        return ''
    if isinstance(val, list):
        return ', '.join(str(x).strip() for x in val if x)
    return str(val).strip()


@tracker_bp.route('/api/tracker/today', methods=['GET'])
@auth_required
def get_today_tracker():
    user_id = g.current_user['id']
    user = User.query.get_or_404(user_id)
    today = get_today_local()

    # Evaluate access state
    access_status = evaluate_intern_access(user)

    tracker = DailyTracker.query.filter_by(user_id=user_id, date=today).first()
    if not tracker:
        tracker = DailyTracker(user_id=user_id, date=today, status='draft')
        db.session.add(tracker)
        db.session.commit()

    # Find latest missed/frozen date if blocked
    latest_missed_date = None
    if access_status == 'BLOCKED':
        frozen_tracker = DailyTracker.query.filter(
            DailyTracker.user_id == user_id,
            DailyTracker.status.in_(['frozen', 'missed']),
            DailyTracker.date < today
        ).order_by(DailyTracker.date.desc()).first()
        if frozen_tracker:
            latest_missed_date = frozen_tracker.date.isoformat()

    session_count = len(tracker.sessions)
    next_session_name = f"Session {session_count + 1}"

    return jsonify({
        'today': today.isoformat(),
        'tracker': tracker.to_dict(),
        'access_status': access_status,
        'is_blocked': access_status == 'BLOCKED',
        'is_frozen': tracker.status in ('frozen', 'missed') or access_status == 'BLOCKED',
        'is_submitted': tracker.status == 'submitted',
        'missed_date': latest_missed_date,
        'next_session_name': next_session_name
    }), 200


@tracker_bp.route('/api/tracker/save', methods=['POST'])
@auth_required
def save_daily_tracker_draft():
    user_id = g.current_user['id']
    user = User.query.get_or_404(user_id)
    today = get_today_local()

    access_status = evaluate_intern_access(user)
    if access_status == 'BLOCKED':
        return jsonify({
            'error': 'Tracker Access is BLOCKED. Your daily task was not submitted before the 11:59 PM deadline. Contact HR/Admin to restore access.'
        }), 403

    data = request.get_json(silent=True) or {}
    entry_date = today
    if data.get('date'):
        try:
            entry_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    if entry_date > today:
        return jsonify({'error': 'Cannot create or submit daily trackers for future dates.'}), 403
    if entry_date < today:
        return jsonify({'error': 'Cannot save draft for an expired past date.'}), 403

    try:
        tracker = DailyTracker.query.filter_by(user_id=user_id, date=entry_date).first()
        if not tracker:
            tracker = DailyTracker(user_id=user_id, date=entry_date, status='draft')
            db.session.add(tracker)
            db.session.flush()

        if tracker.status in ('submitted', 'frozen', 'missed'):
            return jsonify({'error': f'This daily tracker is {tracker.status} and cannot be modified.'}), 403

        sessions_data = data.get('sessions') or []
        for s_data in sessions_data:
            s_num = int(s_data.get('session_number') or 1)
            trainer_name = (s_data.get('trainer_name') or '').strip()
            technology_name = (s_data.get('technology_name') or '').strip()
            concepts_covered = _clean_concepts(s_data.get('concepts_covered'))
            duration_hrs = float(s_data.get('duration_hrs') or 0.0)
            update_text = (s_data.get('update_text') or '').strip()

            existing_session = DailyUpdate.query.filter_by(
                tracker_id=tracker.id,
                session_number=s_num
            ).first()

            if existing_session:
                existing_session.trainer_name = trainer_name
                existing_session.technology_name = technology_name
                existing_session.session_name = f"Session {s_num}"
                existing_session.concepts_covered = concepts_covered
                existing_session.duration_hrs = duration_hrs
                existing_session.update_text = update_text
            else:
                new_session = DailyUpdate(
                    user_id=user_id,
                    tracker_id=tracker.id,
                    session_number=s_num,
                    date=entry_date,
                    trainer_name=trainer_name,
                    technology_name=technology_name,
                    session_name=f"Session {s_num}",
                    concepts_covered=concepts_covered,
                    duration_hrs=duration_hrs,
                    update_text=update_text,
                    status='draft'
                )
                db.session.add(new_session)

        log = AuditLog(
            user_id=user.id,
            user_name=g.current_user['name'],
            user_role=g.current_user['role'],
            action='SAVE_TRACKER_DRAFT',
            details=f"Saved draft for {entry_date.isoformat()} with {len(sessions_data)} sessions"
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database transaction failed: {str(e)}'}), 500

    return jsonify({
        'message': 'Draft saved successfully',
        'tracker': tracker.to_dict()
    }), 200


@tracker_bp.route('/api/tracker/update', methods=['POST'])
@auth_required
def create_daily_update():
    user_id = g.current_user['id']
    user = User.query.get_or_404(user_id)
    today = get_today_local()

    access_status = evaluate_intern_access(user)
    if access_status == 'BLOCKED':
        return jsonify({
            'error': 'Tracker Access is BLOCKED. You missed one or more daily updates. Contact HR/Admin to restore access.'
        }), 403

    data = request.get_json(silent=True) or {}
    trainer_name = (data.get('trainer_name') or '').strip()
    technology_name = (data.get('technology_name') or '').strip()
    concepts_covered = _clean_concepts(data.get('concepts_covered'))
    duration_hrs = float(data.get('duration_hrs') or 2.0)
    update_text = (data.get('update_text') or '').strip()

    if not trainer_name or not technology_name or not update_text:
        return jsonify({'error': 'Trainer, technology, and update text are required'}), 400

    entry_date = today
    if data.get('date'):
        try:
            entry_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    if entry_date > today:
        return jsonify({'error': 'Cannot create or save trackers for future dates.'}), 403

    if entry_date < today:
        return jsonify({'error': 'Cannot submit an update for an expired past date.'}), 403

    try:
        tracker = DailyTracker.query.filter_by(user_id=user_id, date=entry_date).first()
        if not tracker:
            tracker = DailyTracker(user_id=user_id, date=entry_date, status='draft')
            db.session.add(tracker)
            db.session.flush()

        if tracker.status in ('submitted', 'frozen', 'missed'):
            return jsonify({'error': f'This daily tracker is {tracker.status} and cannot be modified.'}), 403

        s_num = int(data.get('session_number') or (len(tracker.sessions) + 1))
        session_name = (data.get('session_name') or f"Session {s_num}").strip()

        existing = DailyUpdate.query.filter_by(tracker_id=tracker.id, session_number=s_num).first()
        if existing:
            existing.trainer_name = trainer_name
            existing.technology_name = technology_name
            existing.session_name = session_name
            existing.concepts_covered = concepts_covered
            existing.duration_hrs = duration_hrs
            existing.update_text = update_text
            daily_update = existing
        else:
            daily_update = DailyUpdate(
                user_id=user_id,
                tracker_id=tracker.id,
                session_number=s_num,
                date=entry_date,
                trainer_name=trainer_name,
                technology_name=technology_name,
                session_name=session_name,
                concepts_covered=concepts_covered,
                duration_hrs=duration_hrs,
                update_text=update_text,
                status='draft'
            )
            db.session.add(daily_update)

        log = AuditLog(
            user_id=user.id,
            user_name=g.current_user['name'],
            user_role=g.current_user['role'],
            action='ADD_SESSION',
            details=f"Saved {session_name} for {entry_date.isoformat()} in {technology_name}"
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database transaction failed: {str(e)}'}), 500

    return jsonify({
        'message': 'Session recorded successfully',
        'update': daily_update.to_dict(),
        'tracker': tracker.to_dict()
    }), 201


@tracker_bp.route('/api/tracker/submit', methods=['POST'])
@auth_required
def submit_daily_tracker():
    user_id = g.current_user['id']
    user = User.query.get_or_404(user_id)
    today = get_today_local()

    access_status = evaluate_intern_access(user)
    if access_status == 'BLOCKED':
        return jsonify({
            'error': 'Tracker Access is BLOCKED. Your daily task was not submitted before the 11:59 PM deadline. Contact HR/Admin to restore access.'
        }), 403

    data = request.get_json(silent=True) or {}
    target_date = today
    if data.get('date'):
        try:
            target_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    if target_date > today:
        return jsonify({'error': 'Cannot create or submit daily trackers for future dates.'}), 403
    if target_date < today:
        return jsonify({'error': 'Cannot submit for an expired past date.'}), 403

    try:
        tracker = DailyTracker.query.filter_by(user_id=user_id, date=target_date).first()
        if not tracker:
            tracker = DailyTracker(user_id=user_id, date=target_date, status='draft')
            db.session.add(tracker)
            db.session.flush()

        if tracker.status in ('frozen', 'missed'):
            return jsonify({'error': 'This tracker is frozen and cannot be submitted.'}), 403

        if tracker.status == 'submitted':
            return jsonify({'error': 'Tracker has already been submitted.'}), 400

        sessions_data = data.get('sessions') or []
        for s_data in sessions_data:
            s_num = int(s_data.get('session_number') or 1)
            trainer_name = (s_data.get('trainer_name') or '').strip()
            technology_name = (s_data.get('technology_name') or '').strip()
            concepts_covered = _clean_concepts(s_data.get('concepts_covered'))
            duration_hrs = float(s_data.get('duration_hrs') or 0.0)
            update_text = (s_data.get('update_text') or '').strip()

            existing_session = DailyUpdate.query.filter_by(
                tracker_id=tracker.id,
                session_number=s_num
            ).first()

            if existing_session:
                existing_session.trainer_name = trainer_name
                existing_session.technology_name = technology_name
                existing_session.session_name = f"Session {s_num}"
                existing_session.concepts_covered = concepts_covered
                existing_session.duration_hrs = duration_hrs
                existing_session.update_text = update_text
            else:
                new_session = DailyUpdate(
                    user_id=user_id,
                    tracker_id=tracker.id,
                    session_number=s_num,
                    date=target_date,
                    trainer_name=trainer_name,
                    technology_name=technology_name,
                    session_name=f"Session {s_num}",
                    concepts_covered=concepts_covered,
                    duration_hrs=duration_hrs,
                    update_text=update_text,
                    status='draft'
                )
                db.session.add(new_session)

        db.session.flush()

        existing_sessions = {s.session_number: s for s in tracker.sessions if s.session_number in (1, 2, 3)}
        
        is_complete = True
        for req_num in [1, 2, 3]:
            s = existing_sessions.get(req_num)
            if not s:
                is_complete = False
                break
            if not s.trainer_name or not s.technology_name or not s.concepts_covered or not s.update_text or (s.duration_hrs or 0) <= 0:
                is_complete = False
                break

        if not is_complete:
            db.session.rollback()
            return jsonify({
                'success': False,
                'error': {
                    'code': 'INCOMPLETE_SESSIONS',
                    'message': 'All three training sessions must be completed before submitting the daily tracker.'
                }
            }), 400

        tracker.status = 'submitted'
        for s in tracker.sessions:
            s.status = 'submitted'

        log = AuditLog(
            user_id=user.id,
            user_name=g.current_user['name'],
            user_role=g.current_user['role'],
            action='SUBMIT_TRACKER',
            details=f"Submitted complete daily tracker for {target_date.isoformat()} with 3 sessions"
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database transaction failed: {str(e)}'}), 500

    return jsonify({
        'message': 'Daily Tracker submitted successfully',
        'tracker': tracker.to_dict()
    }), 200


@tracker_bp.route('/api/tracker/session/<int:session_id>', methods=['DELETE'])
@auth_required
def delete_tracker_session(session_id):
    user_id = g.current_user['id']
    session_item = DailyUpdate.query.get_or_404(session_id)

    if session_item.user_id != user_id and g.current_user['role'] not in ('hr', 'admin'):
        return jsonify({'error': 'Forbidden'}), 403

    if session_item.tracker and session_item.tracker.status == 'submitted':
        return jsonify({'error': 'Cannot delete session from a submitted tracker.'}), 403

    db.session.delete(session_item)
    db.session.commit()
    return jsonify({'message': 'Session removed successfully'}), 200


# ─── Admin Tracker Access Management Endpoints ──────────────────────────────
@tracker_bp.route('/api/admin/tracker-access', methods=['GET'])
@admin_required
def admin_get_tracker_access_list():
    today = get_today_local()
    interns = User.query.filter_by(role='intern').all()
    result = []

    for intern in interns:
        access_status = evaluate_intern_access(intern)
        intern_profile = Intern.query.filter_by(user_id=intern.id).first()
        
        last_submitted = DailyTracker.query.filter_by(
            user_id=intern.id, status='submitted'
        ).order_by(DailyTracker.date.desc()).first()

        latest_frozen = DailyTracker.query.filter(
            DailyTracker.user_id == intern.id,
            DailyTracker.status.in_(['frozen', 'missed'])
        ).order_by(DailyTracker.date.desc()).first()

        latest_override = TrackerAccessOverride.query.filter_by(
            intern_id=intern.id
        ).order_by(TrackerAccessOverride.created_at.desc()).first()

        if access_status == 'BLOCKED' and latest_frozen:
            formatted_frozen_date = latest_frozen.date.strftime('%d-%b-%Y')
            reason_text = latest_override.reason if (latest_override and latest_override.action == 'REVOKE') else f"Daily task not submitted before deadline for {formatted_frozen_date}"
        elif latest_override:
            reason_text = latest_override.reason
        else:
            reason_text = "Normal operation"

        result.append({
            'intern_id': intern.id,
            'intern_name': intern.name,
            'intern_email': intern.email,
            'employee_id': intern_profile.employee_id if intern_profile else '—',
            'manager_name': intern_profile.manager.name if (intern_profile and intern_profile.manager) else 'Unassigned',
            'department': intern.department or '—',
            'tracker_access_status': access_status,
            'last_submission_date': last_submitted.date.strftime('%d-%b-%Y') if last_submitted else 'None',
            'frozen_date': latest_frozen.date.strftime('%d-%b-%Y') if latest_frozen else None,
            'frozen_status': latest_frozen.status.upper() if latest_frozen else None,
            'latest_reason': reason_text
        })

    return jsonify(result), 200


@tracker_bp.route('/api/admin/tracker-access/<int:intern_id>/grant', methods=['POST'])
@admin_required
def admin_grant_tracker_access(intern_id):
    today = get_today_local()
    intern = User.query.get_or_404(intern_id)
    data = request.get_json(silent=True) or {}
    reason = (data.get('reason') or 'Granted by HR/Admin').strip()

    try:
        intern.tracker_access_status = 'ACTIVE'

        override = TrackerAccessOverride(
            intern_id=intern.id,
            action='GRANT',
            reason=reason,
            enabled_by=g.current_user['id'],
            effective_from=today
        )
        db.session.add(override)

        log = AuditLog(
            user_id=g.current_user['id'],
            user_name=g.current_user['name'],
            user_role=g.current_user['role'],
            action='GRANT_TRACKER_ACCESS',
            affected_record_id=intern.id,
            affected_table='users',
            details=f"Granted tracker submission access to {intern.name} ({intern.email}). Reason: {reason}"
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database transaction failed: {str(e)}'}), 500

    return jsonify({
        'message': f'Tracker access granted to {intern.name}',
        'tracker_access_status': 'ACTIVE'
    }), 200


@tracker_bp.route('/api/admin/tracker-access/<int:intern_id>/revoke', methods=['POST'])
@admin_required
def admin_revoke_tracker_access(intern_id):
    today = get_today_local()
    intern = User.query.get_or_404(intern_id)
    data = request.get_json(silent=True) or {}
    reason = (data.get('reason') or 'Revoked by HR/Admin').strip()

    try:
        intern.tracker_access_status = 'BLOCKED'

        override = TrackerAccessOverride(
            intern_id=intern.id,
            action='REVOKE',
            reason=reason,
            enabled_by=g.current_user['id'],
            effective_from=today
        )
        db.session.add(override)

        log = AuditLog(
            user_id=g.current_user['id'],
            user_name=g.current_user['name'],
            user_role=g.current_user['role'],
            action='REVOKE_TRACKER_ACCESS',
            affected_record_id=intern.id,
            affected_table='users',
            details=f"Revoked tracker submission access for {intern.name}. Reason: {reason}"
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database transaction failed: {str(e)}'}), 500

    return jsonify({
        'message': f'Tracker access revoked for {intern.name}',
        'tracker_access_status': 'BLOCKED'
    }), 200


@tracker_bp.route('/api/admin/trackers/<int:tracker_id>/reopen', methods=['POST'])
@admin_required
def admin_reopen_tracker(tracker_id):
    tracker = DailyTracker.query.get_or_404(tracker_id)
    data = request.get_json(silent=True) or {}
    reason = (data.get('reason') or 'Reopened by HR/Admin').strip()

    try:
        tracker.status = 'draft'

        override = TrackerAccessOverride(
            intern_id=tracker.user_id,
            action='REOPEN',
            reason=reason,
            enabled_by=g.current_user['id'],
            effective_from=get_today_local(),
            target_date=tracker.date
        )
        db.session.add(override)

        log = AuditLog(
            user_id=g.current_user['id'],
            user_name=g.current_user['name'],
            user_role=g.current_user['role'],
            action='REOPEN_SPECIFIC_DATE',
            affected_record_id=tracker.id,
            affected_table='daily_trackers',
            details=f"Reopened tracker for date {tracker.date.isoformat()} for user #{tracker.user_id}. Reason: {reason}"
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database transaction failed: {str(e)}'}), 500

    return jsonify({
        'message': f'Tracker for date {tracker.date.isoformat()} reopened successfully',
        'tracker': tracker.to_dict()
    }), 200


@tracker_bp.route('/api/tracker/my-updates', methods=['GET'])
@auth_required
def get_my_updates():
    user_id = g.current_user['id']
    updates = DailyUpdate.query.filter_by(user_id=user_id).order_by(
        DailyUpdate.date.desc(),
        DailyUpdate.session_number.asc(),
        DailyUpdate.id.asc()
    ).all()
    return jsonify([u.to_dict() for u in updates]), 200


@tracker_bp.route('/api/intern/reports/languages', methods=['GET'])
@auth_required
def get_intern_language_reports():
    user_id = g.current_user['id']
    user = User.query.get_or_404(user_id)
    if user.role != 'intern':
        return jsonify({'error': 'Only interns can access intern reports'}), 403

    updates = DailyUpdate.query.filter_by(user_id=user_id).all()
    tech_map = {}
    for u in updates:
        t_name = (u.technology_name or 'Other').strip()
        if not t_name:
            t_name = 'Other'
        if t_name not in tech_map:
            tech_map[t_name] = {'technology': t_name, 'hours': 0.0, 'sessions': 0}
        tech_map[t_name]['hours'] += (u.duration_hrs or 0.0)
        tech_map[t_name]['sessions'] += 1

    tech_list = list(tech_map.values())
    total_hours = sum(t['hours'] for t in tech_list)

    for t in tech_list:
        t['hours'] = round(t['hours'], 1)
        t['percentage'] = round((t['hours'] / (total_hours or 1.0)) * 100, 1)

    tech_list.sort(key=lambda x: x['hours'], reverse=True)
    return jsonify({
        'total_technologies': len(tech_list),
        'total_hours': round(total_hours, 1),
        'total_sessions': sum(t['sessions'] for t in tech_list),
        'technologies': tech_list
    }), 200


@tracker_bp.route('/api/tracker/team-updates', methods=['GET'])
@auth_required
def get_team_updates():
    user_role = g.current_user['role']
    user_id = g.current_user['id']

    query = DailyUpdate.query.join(User, DailyUpdate.user_id == User.id)

    if user_role == 'intern':
        # Intern only sees their own updates
        query = query.filter(DailyUpdate.user_id == user_id)
    # HR sees all

    # Optional date or status filter
    status = request.args.get('status')
    if status:
        query = query.filter(DailyUpdate.status == status)

    updates = query.order_by(DailyUpdate.date.desc()).all()
    return jsonify([u.to_dict() for u in updates]), 200


@tracker_bp.route('/api/tracker/update/<int:update_id>/lock', methods=['PUT'])
@auth_required
@role_required('hr')
def toggle_lock_update(update_id):
    update_item = DailyUpdate.query.get_or_404(update_id)
    data = request.get_json(silent=True) or {}

    new_status = data.get('status', 'locked' if update_item.status != 'locked' else 'submitted')
    update_item.status = new_status
    db.session.commit()

    log = AuditLog(
        user_name=g.current_user['name'],
        user_role=g.current_user['role'],
        action='LOCK_UPDATE',
        details=f"Changed update #{update_id} status to {new_status}"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({'message': f'Update is now {new_status}', 'update': update_item.to_dict()}), 200


@tracker_bp.route('/api/tracker/recent', methods=['GET'])
@auth_required
def get_recent_updates():
    user_role = g.current_user['role']
    user_id = g.current_user['id']

    query = DailyUpdate.query.join(User, DailyUpdate.user_id == User.id)
    if user_role == 'intern':
        # Intern only sees their own recent updates
        query = query.filter(DailyUpdate.user_id == user_id)
    # HR sees all

    recent_updates = query.order_by(DailyUpdate.created_at.desc()).limit(15).all()

    result = []
    for u in recent_updates:
        status_label = 'Submitted'
        if u.tracker and u.tracker.status == 'frozen':
            status_label = 'Locked'
        elif u.status == 'draft':
            status_label = 'Pending'
        elif u.status == 'submitted':
            status_label = 'Submitted'
        elif u.status == 'locked':
            status_label = 'Locked'

        result.append({
            'id': u.id,
            'intern_name': u.user.name if u.user else 'Unknown Intern',
            'intern_email': u.user.email if u.user else '',
            'date': u.date.strftime('%d %b %Y') if u.date else '',
            'date_iso': u.date.isoformat() if u.date else '',
            'session': u.session_name,
            'trainer': u.trainer_name,
            'technology': u.technology_name,
            'concepts': u.concepts_covered,
            'duration': f"{u.duration_hrs:.2f} hrs",
            'duration_val': u.duration_hrs,
            'status': status_label,
            'update_text': u.update_text,
            'created_at': u.created_at.isoformat() if u.created_at else ''
        })

    return jsonify(result), 200


@tracker_bp.route('/api/tracker/sessions', methods=['GET'])
@auth_required
def get_sessions():
    sessions = TrainingSession.query.order_by(TrainingSession.date.desc()).all()
    return jsonify([s.to_dict() for s in sessions]), 200


@tracker_bp.route('/api/tracker/sessions', methods=['POST'])
@auth_required
@role_required('hr')
def create_session():
    data = request.get_json(silent=True) or {}
    title = (data.get('session_title') or '').strip()
    trainer_name = (data.get('trainer_name') or '').strip()
    technology_name = (data.get('technology_name') or '').strip()
    concepts = (data.get('concepts') or '').strip()
    duration_hrs = float(data.get('duration_hrs') or 2.0)

    if not title or not trainer_name or not technology_name:
        return jsonify({'error': 'Title, trainer, and technology are required'}), 400

    session = TrainingSession(
        session_title=title,
        trainer_name=trainer_name,
        technology_name=technology_name,
        concepts=concepts,
        duration_hrs=duration_hrs,
        date=date.today(),
        status='scheduled'
    )
    db.session.add(session)
    db.session.commit()
    return jsonify({'message': 'Session created successfully', 'session': session.to_dict()}), 201


@tracker_bp.route('/api/tracker/sessions/<int:session_id>', methods=['PUT'])
@auth_required
@role_required('hr', 'admin')
def update_session(session_id):
    session = TrainingSession.query.get_or_404(session_id)
    data = request.get_json(silent=True) or {}

    old_status = session.status
    if 'session_title' in data:
        session.session_title = data['session_title']
    if 'trainer_name' in data:
        session.trainer_name = data['trainer_name']
    if 'technology_name' in data:
        session.technology_name = data['technology_name']
    if 'concepts' in data:
        session.concepts = data['concepts']
    if 'duration_hrs' in data:
        session.duration_hrs = float(data['duration_hrs'])
    if 'status' in data:
        session.status = data['status']
    if 'practice_assignment' in data:
        session.practice_assignment = data['practice_assignment']

    db.session.commit()

    # Trigger notification if session status is updated to completed
    if old_status != 'completed' and session.status == 'completed' and session.practice_assignment:
        # Get all active interns
        active_interns = User.query.filter_by(role='intern', status='active').all()
        for intern in active_interns:
            notification = Notification(
                user_id=intern.id,
                title=f"New Practice: {session.technology_name}",
                message=f"Practice task assigned for '{session.session_title}': {session.practice_assignment}",
                is_read=False
            )
            db.session.add(notification)
        db.session.commit()

    return jsonify({'message': 'Session updated successfully', 'session': session.to_dict()}), 200


# ─── Assigned Meetings Endpoints ──────────────────────────────────────────────
@tracker_bp.route('/api/tracker/meetings', methods=['GET'])
@auth_required
def get_meetings():
    # Fetch meetings ordered by date desc
    meetings = AssignedMeeting.query.order_by(AssignedMeeting.date.desc()).all()
    return jsonify([m.to_dict() for m in meetings]), 200


@tracker_bp.route('/api/tracker/meetings', methods=['POST'])
@auth_required
@role_required('hr', 'admin')
def create_meeting():
    data = request.get_json(silent=True) or {}
    title = (data.get('title') or '').strip()
    time = (data.get('time') or '').strip()
    description = (data.get('description') or '').strip()

    if not title:
        return jsonify({'error': 'Title is required'}), 400

    meeting = AssignedMeeting(
        title=title,
        time=time,
        description=description,
        date=date.today(),
        status='scheduled'
      )
    db.session.add(meeting)
    db.session.commit()

    # Notify all active interns about the newly scheduled meeting
    active_interns = User.query.filter_by(role='intern', status='active').all()
    for intern in active_interns:
        notification = Notification(
            user_id=intern.id,
            title="New Meeting Scheduled",
            message=f"Meeting '{title}' has been scheduled for today at {time or 'scheduled time'}.",
            is_read=False
        )
        db.session.add(notification)
    db.session.commit()

    return jsonify({'message': 'Meeting created successfully', 'meeting': meeting.to_dict()}), 201


@tracker_bp.route('/api/tracker/meetings/<int:meeting_id>', methods=['PUT'])
@auth_required
@role_required('hr', 'admin')
def update_meeting(meeting_id):
    meeting = AssignedMeeting.query.get_or_404(meeting_id)
    data = request.get_json(silent=True) or {}

    old_status = meeting.status
    if 'title' in data:
        meeting.title = data['title']
    if 'time' in data:
        meeting.time = data['time']
    if 'description' in data:
        meeting.description = data['description']
    if 'status' in data:
        meeting.status = data['status']

    db.session.commit()

    # Trigger notification if meeting status is updated to completed
    if old_status != 'completed' and meeting.status == 'completed':
        active_interns = User.query.filter_by(role='intern', status='active').all()
        for intern in active_interns:
            notification = Notification(
                user_id=intern.id,
                title="Meeting Completed",
                message=f"The assigned meeting '{meeting.title}' is now completed. Please log your notes in your daily report.",
                is_read=False
            )
            db.session.add(notification)
        db.session.commit()

    return jsonify({'message': 'Meeting updated successfully', 'meeting': meeting.to_dict()}), 200


