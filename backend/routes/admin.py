import json
from datetime import datetime, date as date_type
from flask import Blueprint, request, jsonify, g
from app import db
from models import (
    User, EmployeeDailyReport, InternDailyReport,
    AuditLog, get_today_local, DailyTracker, DailyUpdate
)
from middleware import admin_required
from sqlalchemy import or_

admin_bp = Blueprint('admin', __name__)


def _log(action, record_id=None, table=None, old=None, new=None, details=None):
    log = AuditLog(
        user_id=g.current_user['id'],
        user_name=g.current_user['name'],
        user_role=g.current_user['role'],
        action=action, details=details,
        affected_record_id=record_id, affected_table=table,
        old_value=json.dumps(old) if old else None,
        new_value=json.dumps(new) if new else None,
        ip_address=getattr(g, 'client_ip', None)
    )
    db.session.add(log)


# ─── Dashboard Stats ───────────────────────────────────────────────────────────
@admin_bp.route('/api/admin/dashboard/stats', methods=['GET'])
@admin_required
def admin_dashboard_stats():
    today = get_today_local()
    total_users = User.query.count()
    active_employees = User.query.filter(
        User.role == 'employee', User.status == 'active'
    ).count()
    active_interns = User.query.filter_by(role='intern', status='active').count()

    emp_today = EmployeeDailyReport.query.filter_by(date=today).count()
    intern_today = InternDailyReport.query.filter_by(date=today).count()
    reports_today = emp_today + intern_today

    emp_completed = EmployeeDailyReport.query.filter_by(daily_status='completed').count()
    intern_completed = InternDailyReport.query.filter_by(overall_status='completed').count()
    completed_total = emp_completed + intern_completed

    emp_frozen = EmployeeDailyReport.query.filter_by(is_frozen=True).count()
    intern_frozen = InternDailyReport.query.filter_by(is_frozen=True).count()
    frozen_total = emp_frozen + intern_frozen

    emp_pending = EmployeeDailyReport.query.filter(
        EmployeeDailyReport.date == today,
        EmployeeDailyReport.daily_status.in_(['not_started', 'in_progress'])
    ).count()
    intern_pending = InternDailyReport.query.filter(
        InternDailyReport.date == today,
        InternDailyReport.overall_status.in_(['not_started', 'in_progress'])
    ).count()

    return jsonify({
        'total_users': total_users,
        'active_employees': active_employees,
        'active_interns': active_interns,
        'reports_today': reports_today,
        'pending_today': emp_pending + intern_pending,
        'completed_total': completed_total,
        'frozen_total': frozen_total,
    }), 200


# ─── Detailed Intern Overview ──────────────────────────────────────────────────
@admin_bp.route('/api/admin/dashboard/intern-overview', methods=['GET'])
@admin_required
def admin_intern_overview():
    """Returns per-intern today's status, sessions submitted, and last submitted date/time for HR Home Page."""
    today = get_today_local()
    interns = User.query.filter_by(role='intern', status='active').all()

    intern_rows = []
    submitted_today_count = 0
    not_submitted_today_count = 0

    for intern in interns:
        today_tracker = DailyTracker.query.filter_by(user_id=intern.id, date=today).first()

        is_submitted_today = False
        sessions_count = 0

        if today_tracker:
            if today_tracker.status == 'submitted':
                is_submitted_today = True
                sessions_count = 3
            else:
                valid_sessions = [s for s in today_tracker.sessions if s.trainer_name and s.technology_name and s.update_text]
                sessions_count = min(len(valid_sessions), 3)

        if is_submitted_today:
            submitted_today_count += 1
        else:
            not_submitted_today_count += 1

        last_tracker = DailyTracker.query.filter_by(user_id=intern.id, status='submitted').order_by(DailyTracker.updated_at.desc(), DailyTracker.date.desc()).first()

        last_submitted_at = None
        if last_tracker:
            if last_tracker.updated_at:
                last_submitted_at = last_tracker.updated_at.isoformat()
            elif last_tracker.date:
                last_submitted_at = datetime.combine(last_tracker.date, datetime.min.time()).isoformat()

        intern_rows.append({
            'id': intern.id,
            'name': intern.name,
            'email': intern.email,
            'submitted_today': is_submitted_today,
            'sessions_submitted': f"{sessions_count}/3",
            'sessions_count': sessions_count,
            'last_submitted_at': last_submitted_at
        })

    return jsonify({
        'today': today.isoformat(),
        'total_interns': len(interns),
        'submitted_today': submitted_today_count,
        'not_submitted_today': not_submitted_today_count,
        'intern_rows': intern_rows
    }), 200



# ─── User Management ───────────────────────────────────────────────────────────
@admin_bp.route('/api/admin/users', methods=['GET'])
@admin_required
def admin_get_users():
    role_filter = request.args.get('role')
    status_filter = request.args.get('status')
    search = request.args.get('search', '').strip()
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    q = User.query
    if role_filter:
        q = q.filter_by(role=role_filter)
    if status_filter:
        q = q.filter_by(status=status_filter)
    if search:
        q = q.filter(or_(User.name.ilike(f'%{search}%'), User.email.ilike(f'%{search}%')))

    paginated = q.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'users': [u.to_dict() for u in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@admin_bp.route('/api/admin/users/<int:user_id>', methods=['GET'])
@admin_required
def admin_get_user(user_id):
    user = User.query.get_or_404(user_id)
    emp_reports = EmployeeDailyReport.query.filter_by(user_id=user_id).order_by(EmployeeDailyReport.date.desc()).limit(10).all()
    intern_reports = InternDailyReport.query.filter_by(user_id=user_id).order_by(InternDailyReport.date.desc()).limit(10).all()
    return jsonify({
        'user': user.to_dict(),
        'employee_reports': [r.to_dict() for r in emp_reports],
        'intern_reports': [r.to_dict() for r in intern_reports],
    }), 200


@admin_bp.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@admin_required
def admin_update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}
    old = user.to_dict()

    if 'status' in data:
        user.status = data['status']
    if 'role' in data:
        user.role = data['role']
    if 'name' in data and data['name'].strip():
        user.name = data['name'].strip()
    if 'department' in data:
        user.department = data['department']

    _log('ADMIN_USER_UPDATED', record_id=user_id, table='users', old=old, new=user.to_dict(),
         details=f'Admin updated user #{user_id}')
    db.session.commit()
    return jsonify(user.to_dict()), 200


# ─── Employee Reports ─────────────────────────────────────────────────────────
@admin_bp.route('/api/admin/reports', methods=['GET'])
@admin_required
def admin_get_emp_reports():
    user_id = request.args.get('user_id')
    status_filter = request.args.get('status')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    search = request.args.get('search', '').strip()
    is_frozen = request.args.get('is_frozen')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    q = EmployeeDailyReport.query.join(User, EmployeeDailyReport.user_id == User.id)

    if user_id:
        q = q.filter(EmployeeDailyReport.user_id == int(user_id))
    if status_filter:
        q = q.filter(EmployeeDailyReport.daily_status == status_filter)
    if is_frozen is not None:
        q = q.filter(EmployeeDailyReport.is_frozen == (is_frozen.lower() == 'true'))
    if date_from:
        q = q.filter(EmployeeDailyReport.date >= datetime.strptime(date_from, '%Y-%m-%d').date())
    if date_to:
        q = q.filter(EmployeeDailyReport.date <= datetime.strptime(date_to, '%Y-%m-%d').date())
    if search:
        q = q.filter(or_(User.name.ilike(f'%{search}%'), User.email.ilike(f'%{search}%'),
                          EmployeeDailyReport.today_work.ilike(f'%{search}%')))

    # Auto-freeze before returning
    all_reports = q.order_by(EmployeeDailyReport.date.desc()).all()
    for r in all_reports:
        r.check_and_freeze()
    db.session.commit()

    total = len(all_reports)
    start = (page - 1) * per_page
    paged = all_reports[start:start + per_page]

    return jsonify({
        'reports': [r.to_dict() for r in paged],
        'total': total,
        'pages': (total + per_page - 1) // per_page,
        'current_page': page
    }), 200


@admin_bp.route('/api/admin/reports/<int:report_id>', methods=['GET'])
@admin_required
def admin_get_emp_report(report_id):
    report = EmployeeDailyReport.query.get_or_404(report_id)
    report.check_and_freeze()
    db.session.commit()
    return jsonify(report.to_dict()), 200


@admin_bp.route('/api/admin/reports/<int:report_id>', methods=['PUT'])
@admin_required
def admin_update_emp_report(report_id):
    report = EmployeeDailyReport.query.get_or_404(report_id)
    data = request.get_json(silent=True) or {}
    old = report.to_dict()

    if 'today_work' in data:
        report.today_work = data['today_work']
    if 'what_learned' in data:
        report.what_learned = data['what_learned']
    if 'daily_status' in data:
        report.daily_status = data['daily_status']
    if 'overall_progress' in data:
        report.overall_progress = max(0, min(100, int(data['overall_progress'])))
    if 'remarks' in data:
        report.remarks = data['remarks']
    if 'admin_remarks' in data:
        report.remarks = (report.remarks or '') + f'\n[Admin Note] {data["admin_remarks"]}'

    _log('ADMIN_REPORT_EDITED', record_id=report_id, table='employee_daily_reports',
         old=old, new=report.to_dict(), details=f'Admin edited employee report #{report_id}')
    db.session.commit()
    return jsonify(report.to_dict()), 200


@admin_bp.route('/api/admin/reports/<int:report_id>/freeze', methods=['PUT'])
@admin_required
def admin_freeze_emp_report(report_id):
    report = EmployeeDailyReport.query.get_or_404(report_id)
    report.is_frozen = True
    report.frozen_at = datetime.utcnow()
    _log('ADMIN_REPORT_FROZEN', record_id=report_id, table='employee_daily_reports',
         details=f'Admin froze employee report #{report_id}')
    db.session.commit()
    return jsonify(report.to_dict()), 200


@admin_bp.route('/api/admin/reports/<int:report_id>/unfreeze', methods=['PUT'])
@admin_required
def admin_unfreeze_emp_report(report_id):
    report = EmployeeDailyReport.query.get_or_404(report_id)
    report.is_frozen = False
    report.frozen_at = None
    _log('ADMIN_REPORT_UNFROZEN', record_id=report_id, table='employee_daily_reports',
         details=f'Admin unfroze employee report #{report_id}')
    db.session.commit()
    return jsonify(report.to_dict()), 200


# ─── Intern Reports ───────────────────────────────────────────────────────────
@admin_bp.route('/api/admin/intern-reports', methods=['GET'])
@admin_required
def admin_get_intern_reports():
    user_id = request.args.get('user_id')
    status_filter = request.args.get('status')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    search = request.args.get('search', '').strip()
    is_frozen = request.args.get('is_frozen')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    q = InternDailyReport.query.join(User, InternDailyReport.user_id == User.id)
    if user_id:
        q = q.filter(InternDailyReport.user_id == int(user_id))
    if status_filter:
        q = q.filter(InternDailyReport.overall_status == status_filter)
    if is_frozen is not None:
        q = q.filter(InternDailyReport.is_frozen == (is_frozen.lower() == 'true'))
    if date_from:
        q = q.filter(InternDailyReport.date >= datetime.strptime(date_from, '%Y-%m-%d').date())
    if date_to:
        q = q.filter(InternDailyReport.date <= datetime.strptime(date_to, '%Y-%m-%d').date())
    if search:
        q = q.filter(or_(User.name.ilike(f'%{search}%'), User.email.ilike(f'%{search}%')))

    all_reports = q.order_by(InternDailyReport.date.desc()).all()
    for r in all_reports:
        r.check_and_freeze()
    db.session.commit()

    total = len(all_reports)
    start = (page - 1) * per_page
    paged = all_reports[start:start + per_page]

    return jsonify({
        'reports': [r.to_dict() for r in paged],
        'total': total,
        'pages': (total + per_page - 1) // per_page,
        'current_page': page
    }), 200


@admin_bp.route('/api/admin/intern-reports/<int:report_id>/freeze', methods=['PUT'])
@admin_required
def admin_freeze_intern_report(report_id):
    report = InternDailyReport.query.get_or_404(report_id)
    report.is_frozen = True
    report.frozen_at = datetime.utcnow()
    _log('ADMIN_INTERN_REPORT_FROZEN', record_id=report_id, table='intern_daily_reports',
         details=f'Admin froze intern report #{report_id}')
    db.session.commit()
    return jsonify(report.to_dict()), 200


@admin_bp.route('/api/admin/intern-reports/<int:report_id>/unfreeze', methods=['PUT'])
@admin_required
def admin_unfreeze_intern_report(report_id):
    report = InternDailyReport.query.get_or_404(report_id)
    report.is_frozen = False
    report.frozen_at = None
    _log('ADMIN_INTERN_REPORT_UNFROZEN', record_id=report_id, table='intern_daily_reports',
         details=f'Admin unfroze intern report #{report_id}')
    db.session.commit()
    return jsonify(report.to_dict()), 200


# ─── Activity / Audit Logs ─────────────────────────────────────────────────────
@admin_bp.route('/api/admin/activity-logs', methods=['GET'])
@admin_required
def admin_activity_logs():
    action_filter = request.args.get('action')
    user_filter = request.args.get('user_id')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    search = request.args.get('search', '').strip()
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 30))

    q = AuditLog.query
    if action_filter:
        q = q.filter(AuditLog.action == action_filter)
    if user_filter:
        q = q.filter(AuditLog.user_id == int(user_filter))
    if date_from:
        q = q.filter(AuditLog.created_at >= datetime.strptime(date_from, '%Y-%m-%d'))
    if date_to:
        q = q.filter(AuditLog.created_at <= datetime.strptime(date_to + ' 23:59:59', '%Y-%m-%d %H:%M:%S'))
    if search:
        q = q.filter(or_(AuditLog.user_name.ilike(f'%{search}%'), AuditLog.action.ilike(f'%{search}%'),
                          AuditLog.details.ilike(f'%{search}%')))

    paginated = q.order_by(AuditLog.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'logs': [l.to_dict() for l in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200
