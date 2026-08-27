import os
import jwt
import secrets
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, g, current_app
from app import db
from models import User, Intern, AuditLog, PasswordResetToken
from middleware import auth_required

auth_bp = Blueprint('auth', __name__)

JWT_EXPIRY_HOURS = 24


def _make_token(user: User) -> str:
    secret = current_app.config['JWT_SECRET_KEY']
    payload = {
        'sub': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret, algorithm='HS256')


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email, status='active').first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = _make_token(user)

    # Log action
    log = AuditLog(user_name=user.name, user_role=user.role, action='LOGIN', details=f'User logged in: {user.email}')
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'token': token,
        'user': user.to_dict(),
    }), 200


@auth_bp.route('/api/auth/signup', methods=['POST'])
def signup():
    """Disabled endpoint. Only HR can create intern and user accounts."""
    return jsonify({
        'error': 'Self-registration is disabled. Accounts can only be provisioned by HR Administrators.'
    }), 403


@auth_bp.route('/api/auth/me', methods=['GET'])
@auth_required
def me():
    user = User.query.get(g.current_user['id'])
    if not user or user.status != 'active':
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/api/auth/profile', methods=['PUT'])
@auth_required
def update_profile():
    user = User.query.get(g.current_user['id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json(silent=True) or {}
    if 'name' in data and data['name'].strip():
        user.name = data['name'].strip()
    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        user.set_password(data['password'])

    db.session.commit()
    return jsonify({'user': user.to_dict(), 'message': 'Profile updated successfully'}), 200


@auth_bp.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()

    if not email:
        return jsonify({'error': 'Corporate email is required'}), 400

    generic_msg = 'If an account exists for this email, password reset instructions will be sent.'

    user = User.query.filter_by(email=email, status='active').first()
    dev_token = None
    if user:
        PasswordResetToken.query.filter_by(user_id=user.id, used=False).update({'used': True})

        token_str = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token_str,
            expires_at=expires_at
        )
        db.session.add(reset_token)

        log = AuditLog(
            user_name=user.name,
            user_role=user.role,
            action='FORGOT_PASSWORD_REQUEST',
            details=f'Password reset requested for: {user.email}'
        )
        db.session.add(log)
        db.session.commit()
        dev_token = token_str

    res = {'message': generic_msg}
    if dev_token:
        res['dev_reset_token'] = dev_token

    return jsonify(res), 200


@auth_bp.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json(silent=True) or {}
    token_str = (data.get('token') or '').strip()
    new_password = data.get('password') or ''

    if not token_str or not new_password:
        return jsonify({'error': 'Reset token and new password are required'}), 400

    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400

    reset_token = PasswordResetToken.query.filter_by(token=token_str, used=False).first()
    if not reset_token or not reset_token.is_valid():
        return jsonify({'error': 'Invalid or expired password reset link'}), 400

    user = reset_token.user
    if not user or user.status != 'active':
        return jsonify({'error': 'User account is no longer active'}), 400

    user.set_password(new_password)
    reset_token.used = True

    log = AuditLog(
        user_name=user.name,
        user_role=user.role,
        action='PASSWORD_RESET_SUCCESS',
        details=f'Password reset completed for: {user.email}'
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({'message': 'Password reset successfully. You can now sign in with your new password.'}), 200

