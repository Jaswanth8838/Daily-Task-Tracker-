from flask import Blueprint, request, jsonify, g
from app import db
from models import Notification
from middleware import auth_required

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/api/notifications', methods=['GET'])
@auth_required
def get_notifications():
    user_id = g.current_user['id']
    # Get user-specific notifications and broadcast ones (user_id is None)
    notes = Notification.query.filter(
        (Notification.user_id == user_id) | (Notification.user_id == None)
    ).order_by(Notification.created_at.desc()).limit(50).all()
    
    return jsonify([n.to_dict() for n in notes]), 200

@notifications_bp.route('/api/notifications/unread-count', methods=['GET'])
@auth_required
def get_unread_count():
    user_id = g.current_user['id']
    count = Notification.query.filter(
        (Notification.user_id == user_id) | (Notification.user_id == None),
        Notification.is_read == False
    ).count()
    return jsonify({'unread_count': count}), 200


@notifications_bp.route('/api/notifications/read', methods=['PUT', 'POST'])
@notifications_bp.route('/api/notifications/read-all', methods=['POST'])
@auth_required
def mark_all_read():
    user_id = g.current_user['id']
    notes = Notification.query.filter(
        (Notification.user_id == user_id) | (Notification.user_id == None),
        Notification.is_read == False
    ).all()
    for n in notes:
        n.is_read = True
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read', 'unread_count': 0}), 200


@notifications_bp.route('/api/notifications/<int:note_id>/read', methods=['PUT', 'POST'])
@auth_required
def mark_one_read(note_id):
    user_id = g.current_user['id']
    note = Notification.query.filter(
        Notification.id == note_id,
        (Notification.user_id == user_id) | (Notification.user_id == None)
    ).first_or_404()

    note.is_read = True
    db.session.commit()
    return jsonify(note.to_dict()), 200
