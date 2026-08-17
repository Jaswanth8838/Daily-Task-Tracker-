import json
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app import db
from models import InternDailyReport, AuditLog, get_today_local
from middleware import auth_required

intern_reports_bp = Blueprint('intern_reports', __name__)

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


@intern_reports_bp.route('/api/intern-reports/my', methods=['GET'])
@auth_required
def get_my_intern_reports():
    reports = InternDailyReport.query.filter_by(
        user_id=g.current_user['id']
    ).order_by(InternDailyReport.date.desc()).all()

    result = []
    for r in reports:
        r.check_and_freeze()
        result.append(r.to_dict())
    db.session.commit()
    return jsonify(result), 200


@intern_reports_bp.route('/api/intern-reports/my/<string:date_str>', methods=['GET'])
@auth_required
def get_my_intern_report_by_date(date_str):
    try:
        target = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    report = InternDailyReport.query.filter_by(
        user_id=g.current_user['id'], date=target
    ).first()

    if not report:
        return jsonify(None), 200

    report.check_and_freeze()
    db.session.commit()
    return jsonify(report.to_dict()), 200


@intern_reports_bp.route('/api/intern-reports', methods=['POST'])
@auth_required
def create_intern_report():
    today = get_today_local()
    existing = InternDailyReport.query.filter_by(
        user_id=g.current_user['id'], date=today
    ).first()
    if existing:
        return jsonify({'error': "Today's report already exists.", 'report_id': existing.id}), 409

    data = request.get_json(silent=True) or {}

    def _validate_status(val):
        return val if val in VALID_STATUSES else 'not_started'

    def _validate_progress(val):
        try:
            p = int(val)
            return max(0, min(100, p))
        except Exception:
            return 0

    report = InternDailyReport(
        user_id=g.current_user['id'],
        date=today,
        training_details=data.get('training_details', ''),
        training_status=_validate_status(data.get('training_status', 'not_started')),
        training_progress=_validate_progress(data.get('training_progress', 0)),
        meeting_details=data.get('meeting_details', ''),
        meeting_status=_validate_status(data.get('meeting_status', 'not_started')),
        meeting_notes=data.get('meeting_notes', ''),
        practice_details=data.get('practice_details', ''),
        practice_status=_validate_status(data.get('practice_status', 'not_started')),
        practice_progress=_validate_progress(data.get('practice_progress', 0)),
    )
    report.overall_status = report.compute_overall_status()
    db.session.add(report)
    db.session.flush()
    _log('INTERN_REPORT_CREATED', record_id=report.id, table='intern_daily_reports',
         new=report.to_dict(), details=f'Intern report created for {today.isoformat()}')
    db.session.commit()
    return jsonify(report.to_dict()), 201


@intern_reports_bp.route('/api/intern-reports/<int:report_id>', methods=['PUT'])
@auth_required
def update_intern_report(report_id):
    report = InternDailyReport.query.get(report_id)
    if not report:
        return jsonify({'error': 'Report not found'}), 404

    if report.user_id != g.current_user['id']:
        return jsonify({'error': 'Access denied: this is not your report'}), 403

    report.check_and_freeze()
    if not report.is_editable():
        db.session.commit()
        return jsonify({'error': 'This report is frozen. The reporting day has ended.'}), 403

    data = request.get_json(silent=True) or {}
    old_snap = report.to_dict()

    def _vs(val):
        return val if val in VALID_STATUSES else report.training_status

    def _vp(val, current):
        try:
            return max(0, min(100, int(val)))
        except Exception:
            return current

    if 'training_details' in data:
        report.training_details = data['training_details']
    if 'training_status' in data:
        report.training_status = _vs(data['training_status'])
    if 'training_progress' in data:
        report.training_progress = _vp(data['training_progress'], report.training_progress)
    if 'meeting_details' in data:
        report.meeting_details = data['meeting_details']
    if 'meeting_status' in data:
        report.meeting_status = _vs(data['meeting_status'])
    if 'meeting_notes' in data:
        report.meeting_notes = data['meeting_notes']
    if 'practice_details' in data:
        report.practice_details = data['practice_details']
    if 'practice_status' in data:
        report.practice_status = _vs(data['practice_status'])
    if 'practice_progress' in data:
        report.practice_progress = _vp(data['practice_progress'], report.practice_progress)

    report.overall_status = report.compute_overall_status()
    _log('INTERN_REPORT_UPDATED', record_id=report.id, table='intern_daily_reports',
         old=old_snap, new=report.to_dict(), details=f'Intern report #{report.id} updated')
    db.session.commit()
    return jsonify(report.to_dict()), 200
