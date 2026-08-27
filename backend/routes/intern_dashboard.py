from flask import Blueprint, jsonify, g
from datetime import date, timedelta
from app import db
from models import User, DailyTracker, DailyUpdate
from middleware import auth_required
from services.tracker_service import get_today_local, evaluate_intern_access

intern_dashboard_bp = Blueprint('intern_dashboard', __name__)


@intern_dashboard_bp.route('/api/intern/dashboard', methods=['GET'])
@auth_required
def intern_dashboard():
    """
    Returns a summary for the intern dashboard page.
    Accessible by intern role (and hr for preview).
    """
    user_id = g.current_user['id']
    role = g.current_user['role']

    if role not in ('intern', 'hr', 'admin'):
        return jsonify({'error': 'Forbidden'}), 403

    today = get_today_local()

    # Today's tracker
    tracker = DailyTracker.query.filter_by(user_id=user_id, date=today).first()
    tracker_status = tracker.status if tracker else 'not_started'
    sessions_today = len(tracker.sessions) if tracker else 0
    hours_today = sum(s.duration_hrs for s in tracker.sessions) if tracker else 0.0

    # Access status
    user = User.query.get(user_id)
    access_status = evaluate_intern_access(user) if user else 'ACTIVE'

    # Recent updates (last 5)
    recent = (
        DailyUpdate.query
        .filter_by(user_id=user_id)
        .order_by(DailyUpdate.date.desc(), DailyUpdate.created_at.desc())
        .limit(5)
        .all()
    )

    recent_list = []
    for u in recent:
        status_label = 'Submitted' if u.status == 'submitted' else ('Locked' if u.status == 'locked' else 'Draft')
        recent_list.append({
            'id': u.id,
            'date': u.date.strftime('%d %b %Y') if u.date else '',
            'session': u.session_name,
            'technology': u.technology_name,
            'trainer': u.trainer_name,
            'duration': f'{u.duration_hrs:.1f} hrs',
            'status': status_label,
        })

    # All-time totals
    all_sessions = DailyUpdate.query.filter_by(user_id=user_id).all()
    total_hours = sum(s.duration_hrs for s in all_sessions)
    total_sessions = len(all_sessions)
    submitted_days = DailyTracker.query.filter_by(user_id=user_id, status='submitted').count()

    # Status label for today
    status_display_map = {
        'submitted': 'Submitted',
        'draft': 'Draft',
        'frozen': 'Frozen',
        'missed': 'Missed',
        'not_started': 'Not Started',
    }
    today_status_label = status_display_map.get(tracker_status, 'Not Started')

    return jsonify({
        'today': today.isoformat(),
        'today_status': tracker_status,
        'today_status_label': today_status_label,
        'sessions_today': sessions_today,
        'hours_today': round(hours_today, 1),
        'access_status': access_status,
        'is_blocked': access_status == 'BLOCKED',
        'is_submitted': tracker_status == 'submitted',
        'recent_updates': recent_list,
        'totals': {
            'total_hours': round(total_hours, 1),
            'total_sessions': total_sessions,
            'submitted_days': submitted_days,
        }
    }), 200
