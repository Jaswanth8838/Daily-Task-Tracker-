from flask import Blueprint, request, jsonify, g
from datetime import datetime, date
from sqlalchemy import or_
from app import db
from models import DailyUpdate, TrainingSession, User, Intern, AuditLog, EmployeeDailyReport, InternDailyReport, Notification, AssignedMeeting
from middleware import auth_required, role_required

tracker_bp = Blueprint('tracker', __name__)


@tracker_bp.route('/api/tracker/update', methods=['POST'])
@auth_required
def create_daily_update():
    user_id = g.current_user['id']
    data = request.get_json(silent=True) or {}

    trainer_name = (data.get('trainer_name') or '').strip()
    technology_name = (data.get('technology_name') or '').strip()
    session_name = (data.get('session_name') or 'Session 1').strip()
    concepts_covered = (data.get('concepts_covered') or '').strip()
    duration_hrs = float(data.get('duration_hrs') or 2.0)
    update_text = (data.get('update_text') or '').strip()

    if not trainer_name or not technology_name or not update_text:
        return jsonify({'error': 'Trainer, technology, and update text are required'}), 400

    # Parse date if provided or default to today
    entry_date = date.today()
    if data.get('date'):
        try:
            entry_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    daily_update = DailyUpdate(
        user_id=user_id,
        date=entry_date,
        trainer_name=trainer_name,
        technology_name=technology_name,
        session_name=session_name,
        concepts_covered=concepts_covered,
        duration_hrs=duration_hrs,
        update_text=update_text,
        status='submitted'
    )
    db.session.add(daily_update)

    log = AuditLog(
        user_name=g.current_user['name'],
        user_role=g.current_user['role'],
        action='SUBMIT_UPDATE',
        details=f"Submitted update for {entry_date.isoformat()} in {technology_name}"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({'message': 'Update submitted successfully', 'update': daily_update.to_dict()}), 201


@tracker_bp.route('/api/tracker/my-updates', methods=['GET'])
@auth_required
def get_my_updates():
    user_id = g.current_user['id']
    updates = DailyUpdate.query.filter_by(user_id=user_id).order_by(DailyUpdate.date.desc()).all()
    return jsonify([u.to_dict() for u in updates]), 200


@tracker_bp.route('/api/tracker/team-updates', methods=['GET'])
@auth_required
def get_team_updates():
    user_role = g.current_user['role']
    user_id = g.current_user['id']

    query = DailyUpdate.query.join(User, DailyUpdate.user_id == User.id)

    if user_role == 'manager':
        # Get intern user_ids assigned to this manager
        managed_interns = Intern.query.filter_by(manager_id=user_id).all()
        managed_user_ids = [i.user_id for i in managed_interns]
        query = query.filter(DailyUpdate.user_id.in_(managed_user_ids))
    elif user_role == 'intern':
        # Intern only sees their own
        query = query.filter(DailyUpdate.user_id == user_id)

    # Optional date or status filter
    status = request.args.get('status')
    if status:
        query = query.filter(DailyUpdate.status == status)

    updates = query.order_by(DailyUpdate.date.desc()).all()
    return jsonify([u.to_dict() for u in updates]), 200


@tracker_bp.route('/api/tracker/update/<int:update_id>/lock', methods=['PUT'])
@auth_required
@role_required('hr', 'manager')
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

    # 1. Fetch Employee Daily Reports
    emp_q = EmployeeDailyReport.query.join(User, EmployeeDailyReport.user_id == User.id)
    if user_role == 'intern':
        emp_q = emp_q.filter(EmployeeDailyReport.user_id == user_id)
    elif user_role == 'manager':
        managed_interns = Intern.query.filter_by(manager_id=user_id).all()
        managed_user_ids = [i.user_id for i in managed_interns]
        emp_q = emp_q.filter(or_(EmployeeDailyReport.user_id == user_id, EmployeeDailyReport.user_id.in_(managed_user_ids)))
    
    emp_reports = emp_q.order_by(EmployeeDailyReport.created_at.desc()).limit(10).all()

    # 2. Fetch Intern Daily Reports
    intern_q = InternDailyReport.query.join(User, InternDailyReport.user_id == User.id)
    if user_role == 'intern':
        intern_q = intern_q.filter(InternDailyReport.user_id == user_id)
    elif user_role == 'manager':
        managed_interns = Intern.query.filter_by(manager_id=user_id).all()
        managed_user_ids = [i.user_id for i in managed_interns]
        intern_q = intern_q.filter(InternDailyReport.user_id.in_(managed_user_ids))
    
    intern_reports = intern_q.order_by(InternDailyReport.created_at.desc()).limit(10).all()

    # 3. Combine and Format
    combined = []
    for r in emp_reports:
        r.check_and_freeze()
        combined.append({
            'id': f'emp_{r.id}',
            'type': 'employee',
            'user_name': r.user.name if r.user else 'Unknown',
            'user_email': r.user.email if r.user else '',
            'date': r.date.isoformat() if r.date else None,
            'summary': f"Work: {r.today_work} | Learned: {r.what_learned}",
            'status': r.daily_status,
            'progress': r.overall_progress,
            'is_frozen': r.is_frozen,
            'created_at': r.created_at.isoformat()
        })

    for r in intern_reports:
        r.check_and_freeze()
        summary_parts = []
        if r.training_details:
            summary_parts.append(f"Training: {r.training_details}")
        if r.meeting_details:
            summary_parts.append(f"Meetings: {r.meeting_details}")
        if r.practice_details:
            summary_parts.append(f"Practice: {r.practice_details}")
        
        combined.append({
            'id': f'intern_{r.id}',
            'type': 'intern',
            'user_name': r.user.name if r.user else 'Unknown',
            'user_email': r.user.email if r.user else '',
            'date': r.date.isoformat() if r.date else None,
            'summary': " | ".join(summary_parts) if summary_parts else 'No details logged',
            'status': r.overall_status,
            'progress': int((r.training_progress + r.practice_progress) / 2),
            'is_frozen': r.is_frozen,
            'created_at': r.created_at.isoformat()
        })

    db.session.commit()
    # Sort by created_at desc and return top 10
    combined.sort(key=lambda x: x['created_at'], reverse=True)
    return jsonify(combined[:10]), 200


@tracker_bp.route('/api/tracker/sessions', methods=['GET'])
@auth_required
def get_sessions():
    sessions = TrainingSession.query.order_by(TrainingSession.date.desc()).all()
    return jsonify([s.to_dict() for s in sessions]), 200


@tracker_bp.route('/api/tracker/sessions', methods=['POST'])
@auth_required
@role_required('hr', 'manager')
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
@role_required('hr', 'manager', 'admin')
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
@role_required('hr', 'manager', 'admin')
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
@role_required('hr', 'manager', 'admin')
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


