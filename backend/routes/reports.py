from flask import Blueprint, jsonify, request, g, Response
from datetime import datetime, date, timedelta
from app import db
from models import DailyUpdate, User, Intern
from middleware import auth_required
from sqlalchemy import func
import csv
import io

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/api/reports/summary', methods=['GET'])
@auth_required
def get_reports_summary():
    user_role = g.current_user['role']
    user_id = g.current_user['id']

    query = DailyUpdate.query
    if user_role == 'intern':
        query = query.filter_by(user_id=user_id)

    all_updates = query.all()

    # 1. Total hours by technology
    tech_hours = {}
    for u in all_updates:
        tech = u.technology_name or 'General'
        tech_hours[tech] = round(tech_hours.get(tech, 0) + float(u.duration_hrs or 0), 2)

    tech_data = [{'name': k, 'hours': v} for k, v in tech_hours.items()]

    # 2. Daily trend (past 7 days)
    today = date.today()
    trend = []
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        day_updates = [u for u in all_updates if u.date == target_date]
        day_hours = sum(float(u.duration_hrs or 0) for u in day_updates)
        trend.append({
            'date': target_date.strftime('%d %b'),
            'hours': round(day_hours, 2),
            'count': len(day_updates)
        })

    # 3. Status breakdown
    status_counts = {'submitted': 0, 'locked': 0, 'approved': 0}
    for u in all_updates:
        s = u.status or 'submitted'
        status_counts[s] = status_counts.get(s, 0) + 1

    status_data = [{'name': k.title(), 'value': v} for k, v in status_counts.items() if v > 0]

    return jsonify({
        'total_updates': len(all_updates),
        'total_hours': round(sum(float(u.duration_hrs or 0) for u in all_updates), 2),
        'tech_breakdown': tech_data,
        'weekly_trend': trend,
        'status_breakdown': status_data
    }), 200


@reports_bp.route('/api/reports/export', methods=['GET'])
@auth_required
def export_reports_csv():
    user_role = g.current_user['role']
    user_id = g.current_user['id']

    query = DailyUpdate.query.join(User, DailyUpdate.user_id == User.id)
    if user_role == 'intern':
        query = query.filter(DailyUpdate.user_id == user_id)

    updates = query.order_by(DailyUpdate.date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Intern Name', 'Email', 'Date', 'Technology', 'Trainer', 'Session', 'Concepts Covered', 'Duration (Hrs)', 'Status', 'Update Description'])

    for u in updates:
        writer.writerow([
            u.id,
            u.user.name if u.user else '',
            u.user.email if u.user else '',
            u.date.isoformat() if u.date else '',
            u.technology_name,
            u.trainer_name,
            u.session_name,
            u.concepts_covered,
            u.duration_hrs,
            u.status,
            u.update_text
        ])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=daily_task_tracker_report.csv"}
    )
