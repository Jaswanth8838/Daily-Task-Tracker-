from flask import Blueprint, jsonify
from models import AuditLog
from middleware import auth_required, role_required

audit_bp = Blueprint('audit', __name__)


@audit_bp.route('/api/audit-logs', methods=['GET'])
@auth_required
@role_required('hr')
def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(100).all()
    return jsonify([l.to_dict() for l in logs]), 200
