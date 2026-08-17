import json
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app import db
from models import EmployeeDailyReport, AuditLog, User, get_today_local
from middleware import auth_required

emp_reports_bp = Blueprint('emp_reports', __name__)

VALID_STATUSES = {'not_started', 'in_progress', 'completed', 'blocked'}


def _log(action, record_id=None, table=None, old=None, new=None, details=None):
    log = AuditLog(
        user_id=g.current_user['id'],
        user_name=g.current_user['name'],
        user_role=g.current_user['role'],
        action=action,
        details=details,
        affected_record_id=record_id,
        affected_table=table,
        old_value=json.dumps(old) if old else None,
        new_value=json.dumps(new) if new else None,
        ip_address=getattr(g, 'client_ip', None)
    )
    db.session.add(log)


@emp_reports_bp.route('/api/reports/my', methods=['GET'])
@auth_required
def get_my_reports():
    reports = EmployeeDailyReport.query.filter_by(
        user_id=g.current_user['id']
    ).order_by(EmployeeDailyReport.date.desc()).all()

    result = []
    for r in reports:
        r.check_and_freeze()
        result.append(r.to_dict())
    db.session.commit()
    return jsonify(result), 200


@emp_reports_bp.route('/api/reports/my/<string:date_str>', methods=['GET'])
@auth_required
def get_my_report_by_date(date_str):
    from datetime import date as date_type
    try:
        target = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    report = EmployeeDailyReport.query.filter_by(
        user_id=g.current_user['id'], date=target
    ).first()

    if not report:
        return jsonify(None), 200

    report.check_and_freeze()
    db.session.commit()
    return jsonify(report.to_dict()), 200


@emp_reports_bp.route('/api/reports', methods=['POST'])
@auth_required
def create_report():
    today = get_today_local()
    existing = EmployeeDailyReport.query.filter_by(
        user_id=g.current_user['id'], date=today
    ).first()
    if existing:
        return jsonify({'error': 'A report for today already exists. Use PUT to update it.', 'report_id': existing.id}), 409

    data = request.get_json(silent=True) or {}
    status = data.get('daily_status', 'not_started')
    if status not in VALID_STATUSES:
        return jsonify({'error': f'Invalid daily_status. Must be one of: {", ".join(VALID_STATUSES)}'}), 400

    progress = int(data.get('overall_progress', 0))
    if not (0 <= progress <= 100):
        return jsonify({'error': 'overall_progress must be between 0 and 100'}), 400

    report = EmployeeDailyReport(
        user_id=g.current_user['id'],
        date=today,
        today_work=data.get('today_work', ''),
        what_learned=data.get('what_learned', ''),
        daily_status=status,
        overall_progress=progress,
        remarks=data.get('remarks', '')
    )
    db.session.add(report)
    db.session.flush()
    _log('EMPLOYEE_REPORT_CREATED', record_id=report.id, table='employee_daily_reports',
         new=report.to_dict(), details=f'Report created for {today.isoformat()}')
    db.session.commit()
    return jsonify(report.to_dict()), 201


@emp_reports_bp.route('/api/reports/<int:report_id>', methods=['PUT'])
@auth_required
def update_report(report_id):
    report = EmployeeDailyReport.query.get(report_id)
    if not report:
        return jsonify({'error': 'Report not found'}), 404

    # Ownership check
    if report.user_id != g.current_user['id']:
        return jsonify({'error': 'Access denied: this is not your report'}), 403

    # Server-side freeze check
    report.check_and_freeze()
    if not report.is_editable():
        db.session.commit()
        return jsonify({'error': 'This report is frozen and cannot be modified. The reporting day has ended.'}), 403

    data = request.get_json(silent=True) or {}
    old_snapshot = {k: v for k, v in report.to_dict().items() if k in ['today_work', 'what_learned', 'daily_status', 'overall_progress', 'remarks']}

    if 'today_work' in data:
        report.today_work = data['today_work']
    if 'what_learned' in data:
        report.what_learned = data['what_learned']
    if 'daily_status' in data:
        if data['daily_status'] not in VALID_STATUSES:
            return jsonify({'error': f'Invalid daily_status'}), 400
        report.daily_status = data['daily_status']
    if 'overall_progress' in data:
        p = int(data['overall_progress'])
        if not (0 <= p <= 100):
            return jsonify({'error': 'overall_progress must be 0–100'}), 400
        report.overall_progress = p
    if 'remarks' in data:
        report.remarks = data['remarks']

    new_snapshot = {k: getattr(report, k) for k in ['today_work', 'what_learned', 'daily_status', 'overall_progress', 'remarks']}
    _log('EMPLOYEE_REPORT_UPDATED', record_id=report.id, table='employee_daily_reports',
         old=old_snapshot, new=new_snapshot, details=f'Report #{report.id} updated for {report.date.isoformat()}')
    db.session.commit()
    return jsonify(report.to_dict()), 200
