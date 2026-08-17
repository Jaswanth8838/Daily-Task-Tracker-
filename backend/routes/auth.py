import os
import jwt
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, g
from app import db
from models import User, Intern, AuditLog
from middleware import auth_required

auth_bp = Blueprint('auth', __name__)

JWT_EXPIRY_HOURS = 24


def _make_token(user: User) -> str:
    secret = os.environ.get('JWT_SECRET_KEY', 'default_secret')
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
    """Direct Sign Up endpoint for users / interns / managers / hr"""
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    role = (data.get('role') or 'intern').strip().lower()
    password = data.get('password') or ''
    department = (data.get('department') or 'Engineering').strip()
    employee_id = (data.get('employee_id') or '').strip()

    if not name:
        return jsonify({'error': 'Name is required'}), 400
    if not email or '@' not in email:
        return jsonify({'error': 'Valid email is required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if role not in ['intern', 'manager', 'hr']:
        role = 'intern'

    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({'error': 'An account with this email already exists'}), 400

    user = User(name=name, email=email, role=role, status='active')
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    if role == 'intern':
        intern = Intern(user_id=user.id, department=department, employee_id=employee_id)
        db.session.add(intern)

    log = AuditLog(user_name=user.name, user_role=user.role, action='SIGNUP', details=f'Account registered: {email} ({role})')
    db.session.add(log)
    db.session.commit()

    token = _make_token(user)
    return jsonify({
        'token': token,
        'user': user.to_dict(),
        'message': 'Account registered successfully'
    }), 201


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
