from flask import Blueprint, jsonify, g
from datetime import date
from middleware import auth_required
from models import User, DailyUpdate, TrainingSession, Intern
from app import db
from sqlalchemy import text

health_bp = Blueprint('health', __name__)
dashboard_bp = Blueprint('dashboard', __name__)


@health_bp.route('/api/health', methods=['GET'])
def health_check():
    try:
        db.session.execute(text('SELECT 1'))
        return jsonify({'status': 'ok'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@dashboard_bp.route('/api/dashboard/stats', methods=['GET'])
@auth_required
def dashboard_stats():
    user_role = g.current_user['role']
    user_id = g.current_user['id']
    today = date.today()

    if user_role == 'intern':
        total_interns = 1
        updates_today = DailyUpdate.query.filter_by(user_id=user_id, date=today).count()
        locked_entries = DailyUpdate.query.filter_by(user_id=user_id, status='locked').count()
    else:  # hr / admin
        total_interns = User.query.filter_by(role='intern', status='active').count()
        updates_today = DailyUpdate.query.filter_by(date=today).count()
        locked_entries = DailyUpdate.query.filter_by(status='locked').count()

    sessions_today = TrainingSession.query.filter_by(date=today).count()

    return jsonify({
        'total_interns': total_interns,
        'updates_today': updates_today,
        'locked_entries': locked_entries,
        'sessions_today': sessions_today,
    }), 200
