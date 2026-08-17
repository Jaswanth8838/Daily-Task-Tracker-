import json
from datetime import datetime, date as date_type
from flask import Blueprint, request, jsonify, g
from app import db
from models import (
    User, EmployeeDailyReport, InternDailyReport,
    AuditLog, get_today_local
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
        User.role.in_(['employee', 'manager']), User.status == 'active'
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
    """Returns per-intern today's status, section breakdown, submission state, lacking areas."""
    today = get_today_local()

    # All active interns
    interns = User.query.filter_by(role='intern', status='active').all()

    # Today's intern reports keyed by user_id
    today_reports = {
        r.user_id: r
        for r in InternDailyReport.query.filter_by(date=today).all()
    }

    # All intern reports (all time) for aggregate stats
    all_reports = InternDailyReport.query.join(User, InternDailyReport.user_id == User.id).all()

    # ── Per-intern rows ──
    intern_rows = []
    submitted_today = 0
    not_submitted_today = 0

    for intern in interns:
        report = today_reports.get(intern.id)
        submitted = report is not None

        if submitted:
            submitted_today += 1
            report.check_and_freeze()
            training_s = report.training_status or 'not_started'
            meeting_s  = report.meeting_status  or 'not_started'
            practice_s = report.practice_status or 'not_started'
            overall_s  = report.overall_status  or report.compute_overall_status()
            training_p = report.training_progress or 0
            practice_p = report.practice_progress or 0
            training_d = (report.training_details or '')[:120]
            meeting_d  = (report.meeting_details or '')[:120]
            practice_d = (report.practice_details or '')[:120]
        else:
            not_submitted_today += 1
            training_s = meeting_s = practice_s = overall_s = 'not_submitted'
            training_p = practice_p = 0
            training_d = meeting_d = practice_d = ''

        # Lacking areas: any section that is blocked or not_started when others are further ahead
        lacking = []
        if submitted:
            if training_s == 'blocked':  lacking.append('Training')
            if meeting_s  == 'blocked':  lacking.append('Meeting')
            if practice_s == 'blocked':  lacking.append('Practice')
            if training_p < 30 and training_s not in ('completed',):
                if 'Training' not in lacking: lacking.append('Training (low progress)')
            if practice_p < 30 and practice_s not in ('completed',):
                if 'Practice' not in lacking: lacking.append('Practice (low progress)')

        intern_rows.append({
            'id': intern.id,
            'name': intern.name,
            'email': intern.email,
            'department': intern.department or '—',
            'submitted_today': submitted,
            'overall_status': overall_s,
            'training_status': training_s,
            'training_progress': training_p,
            'training_details': training_d,
            'meeting_status': meeting_s,
            'meeting_details': meeting_d,
            'practice_status': practice_s,
            'practice_progress': practice_p,
            'practice_details': practice_d,
            'lacking_areas': lacking,
        })

    # ── Aggregate section stats (all time) ──
    def status_counts(status_list):
        from collections import Counter
        c = Counter(status_list)
        return {
            'completed': c.get('completed', 0),
            'in_progress': c.get('in_progress', 0),
            'not_started': c.get('not_started', 0),
            'blocked': c.get('blocked', 0),
        }

    training_statuses = [r.training_status or 'not_started' for r in all_reports]
    meeting_statuses  = [r.meeting_status  or 'not_started' for r in all_reports]
    practice_statuses = [r.practice_status or 'not_started' for r in all_reports]
    overall_statuses  = [r.overall_status  or 'not_started' for r in all_reports]

    # ── Department breakdown ──
    from collections import Counter, defaultdict
    dept_map = defaultdict(lambda: {'total': 0, 'submitted': 0, 'completed': 0, 'blocked': 0})
    for intern in interns:
        dept = intern.department or 'Unassigned'
        dept_map[dept]['total'] += 1
        if intern.id in today_reports:
            dept_map[dept]['submitted'] += 1
            r = today_reports[intern.id]
            if r.overall_status == 'completed':
                dept_map[dept]['completed'] += 1
            if r.overall_status == 'blocked':
                dept_map[dept]['blocked'] += 1

    dept_breakdown = [
        {'dept': k, **v} for k, v in dept_map.items()
    ]

    db.session.commit()

    return jsonify({
        'today': today.isoformat(),
        'total_interns': len(interns),
        'submitted_today': submitted_today,
        'not_submitted_today': not_submitted_today,
        'intern_rows': intern_rows,
        'aggregate': {
            'training': status_counts(training_statuses),
            'meeting':  status_counts(meeting_statuses),
            'practice': status_counts(practice_statuses),
            'overall':  status_counts(overall_statuses),
        },
        'dept_breakdown': dept_breakdown,
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
