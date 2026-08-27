from flask import Blueprint, request, jsonify, g
from datetime import datetime, date, timedelta
from app import db
from models import User, Intern, DailyTracker, DailyUpdate, AuditLog
from middleware import auth_required, admin_required, role_required
from services.tracker_service import get_today_local, evaluate_intern_access

hr_interns_bp = Blueprint('hr_interns', __name__)

@hr_interns_bp.route('/api/hr/interns', methods=['GET'])
@auth_required
@role_required('hr', 'admin')
def get_hr_interns():
    search = (request.args.get('q') or '').strip().lower()
    interns = User.query.filter_by(role='intern').all()
    result = []

    today = get_today_local()
    for intern in interns:
        access_status = evaluate_intern_access(intern)
        intern_profile = Intern.query.filter_by(user_id=intern.id).first()
        emp_id = intern_profile.employee_id if intern_profile else f"INT-{intern.id:04d}"

        # Filtering
        if search:
            match_name = search in (intern.name or '').lower()
            match_email = search in (intern.email or '').lower()
            match_emp = search in emp_id.lower()
            if not (match_name or match_email or match_emp):
                continue

        # Calculate Today's Task status
        today_tracker = DailyTracker.query.filter_by(user_id=intern.id, date=today).first()
        if access_status == 'BLOCKED':
            today_task = 'BLOCKED'
        elif today_tracker:
            if today_tracker.status == 'submitted':
                today_task = 'SUBMITTED'
            elif today_tracker.status in ('frozen', 'missed'):
                today_task = 'FROZEN'
            else:
                today_task = 'PENDING'
        else:
            today_task = 'NOT_SUBMITTED'

        all_updates = DailyUpdate.query.filter_by(user_id=intern.id).all()
        total_hours = sum(u.duration_hrs or 0.0 for u in all_updates)

        submitted_days = DailyTracker.query.filter_by(user_id=intern.id, status='submitted').count()
        missed_days = DailyTracker.query.filter(
            DailyTracker.user_id == intern.id,
            DailyTracker.status.in_(['frozen', 'missed'])
        ).count()

        result.append({
            'id': intern.id,
            'name': intern.name,
            'email': intern.email,
            'employee_id': emp_id,
            'tracker_access_status': access_status,
            'is_blocked': access_status == 'BLOCKED',
            'today_task': today_task,
            'total_training_hours': round(total_hours, 1),
            'submitted_days': submitted_days,
            'missed_days': missed_days,
            'joining_date': intern_profile.joining_date.isoformat() if (intern_profile and intern_profile.joining_date) else None,
            'created_at': intern.created_at.isoformat() if intern.created_at else None
        })

    return jsonify(result), 200


@hr_interns_bp.route('/api/hr/interns/<int:intern_id>/performance', methods=['GET'])
@auth_required
@role_required('hr', 'admin')
def get_intern_performance(intern_id):
    intern = User.query.get_or_404(intern_id)
    if intern.role != 'intern':
        return jsonify({'error': 'Requested user is not an intern'}), 400

    access_status = evaluate_intern_access(intern)
    intern_profile = Intern.query.filter_by(user_id=intern.id).first()
    emp_id = intern_profile.employee_id if intern_profile else f"INT-{intern.id:04d}"

    today = get_today_local()
    today_tracker = DailyTracker.query.filter_by(user_id=intern.id, date=today).first()
    if access_status == 'BLOCKED':
        today_task = 'BLOCKED'
    elif today_tracker:
        if today_tracker.status == 'submitted':
            today_task = 'SUBMITTED'
        elif today_tracker.status in ('frozen', 'missed'):
            today_task = 'FROZEN'
        else:
            today_task = 'PENDING'
    else:
        today_task = 'NOT_SUBMITTED'

    time_range = request.args.get('range', '30d')
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    if time_range == '7d':
        start_date = today - timedelta(days=6)
        end_date = today
    elif time_range == '30d':
        start_date = today - timedelta(days=29)
        end_date = today
    elif time_range == 'month':
        start_date = today.replace(day=1)
        end_date = today
    elif time_range == 'custom' and start_date_str and end_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            start_date = today - timedelta(days=29)
            end_date = today
    else:
        # Default all time or 30 days
        start_date = today - timedelta(days=29)
        end_date = today

    # Trackers in range
    trackers = DailyTracker.query.filter(
        DailyTracker.user_id == intern.id,
        DailyTracker.date >= start_date,
        DailyTracker.date <= end_date
    ).all()
    tracker_by_date = {t.date: t for t in trackers}

    submitted_days = sum(1 for t in trackers if t.status == 'submitted')
    missed_days = sum(1 for t in trackers if t.status in ('frozen', 'missed'))
    pending_days = sum(1 for t in trackers if t.status == 'draft')

    # Daily updates in range
    updates = DailyUpdate.query.filter(
        DailyUpdate.user_id == intern.id,
        DailyUpdate.date >= start_date,
        DailyUpdate.date <= end_date
    ).order_by(DailyUpdate.date.asc()).all()

    total_training_hours = sum(u.duration_hrs or 0.0 for u in updates)
    total_sessions = len(updates)
    days_in_range = max((end_date - start_date).days + 1, 1)
    submission_rate = round(min((submitted_days / days_in_range) * 100, 100.0), 1)

    # 1. Daily Training Hours trend
    daily_hours_map = {}
    curr = start_date
    while curr <= end_date:
        daily_hours_map[curr] = 0.0
        curr += timedelta(days=1)

    for u in updates:
        if u.date in daily_hours_map:
            daily_hours_map[u.date] += (u.duration_hrs or 0.0)

    daily_training_hours = []
    for d, hrs in sorted(daily_hours_map.items()):
        t_obj = tracker_by_date.get(d)
        status_label = t_obj.status.capitalize() if t_obj else 'Not Logged'
        daily_training_hours.append({
            'date': d.isoformat(),
            'display_date': d.strftime('%d %b'),
            'hours': round(hrs, 1),
            'status': status_label
        })

    # 2. Submission Status Distribution
    submission_status = [
        {'name': 'Submitted', 'value': submitted_days, 'color': '#10b981'},
        {'name': 'Missed / Frozen', 'value': missed_days, 'color': '#ef4444'},
        {'name': 'Pending Draft', 'value': pending_days, 'color': '#f59e0b'}
    ]

    # 3. Technology Distribution
    tech_map = {}
    for u in updates:
        t_name = (u.technology_name or 'Other').strip()
        tech_map[t_name] = tech_map.get(t_name, 0.0) + (u.duration_hrs or 0.0)

    technology_distribution = []
    for t_name, t_hrs in sorted(tech_map.items(), key=lambda x: x[1], reverse=True):
        pct = round((t_hrs / (total_training_hours or 1.0)) * 100, 1)
        technology_distribution.append({
            'technology': t_name,
            'hours': round(t_hrs, 1),
            'percentage': pct
        })

    # 4. Session Breakdown (Session 1, Session 2, Session 3)
    session_stats = []
    for s_num in [1, 2, 3]:
        s_updates = [u for u in updates if (u.session_number == s_num or u.session_name == f"Session {s_num}")]
        s_count = len(s_updates)
        s_total_hrs = sum(u.duration_hrs or 0.0 for u in s_updates)
        s_avg_hrs = round(s_total_hrs / s_count, 1) if s_count > 0 else 0.0
        session_stats.append({
            'session_number': s_num,
            'session_name': f"Session {s_num}",
            'completed_count': s_count,
            'total_hours': round(s_total_hrs, 1),
            'average_hours': s_avg_hrs
        })

    # 5. Recent Activity List
    recent_updates = DailyUpdate.query.filter_by(user_id=intern.id).order_by(DailyUpdate.date.desc(), DailyUpdate.id.desc()).limit(50).all()
    recent_sessions = [u.to_dict() for u in recent_updates]

    return jsonify({
        'intern': {
            'id': intern.id,
            'name': intern.name,
            'email': intern.email,
            'employee_id': emp_id,
            'tracker_access_status': access_status,
            'is_blocked': access_status == 'BLOCKED',
            'today_task': today_task,
            'joining_date': intern_profile.joining_date.isoformat() if (intern_profile and intern_profile.joining_date) else None,
        },
        'range': {
            'type': time_range,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        },
        'summary': {
            'training_hours': round(total_training_hours, 1),
            'completed_days': submitted_days,
            'missed_days': missed_days,
            'total_sessions': total_sessions,
            'submission_rate': submission_rate
        },
        'daily_training_hours': daily_training_hours,
        'submission_status': submission_status,
        'technology_distribution': technology_distribution,
        'session_stats': session_stats,
        'recent_sessions': recent_sessions
    }), 200
