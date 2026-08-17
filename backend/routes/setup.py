from flask import Blueprint, request, jsonify
from app import db
from models import User

setup_bp = Blueprint('setup', __name__)


@setup_bp.route('/api/setup/status', methods=['GET'])
def setup_status():
    """Returns whether the first HR account has been created."""
    hr_exists = User.query.filter_by(role='hr').first() is not None
    return jsonify({'initialized': hr_exists}), 200


@setup_bp.route('/api/setup/init', methods=['POST'])
def setup_init():
    """Creates the first HR user. Blocked if any HR already exists."""
    # Block if already initialized
    if User.query.filter_by(role='hr').first():
        return jsonify({'error': 'Application already initialized'}), 409

    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    confirm = data.get('confirm_password') or ''

    errors = {}
    if not name:
        errors['name'] = 'Name is required'
    if not email or '@' not in email:
        errors['email'] = 'Valid email is required'
    if len(password) < 8:
        errors['password'] = 'Password must be at least 8 characters'
    if password != confirm:
        errors['confirm_password'] = 'Passwords do not match'

    if errors:
        return jsonify({'errors': errors}), 422

    # Check email not already taken
    if User.query.filter_by(email=email).first():
        return jsonify({'errors': {'email': 'Email already in use'}}), 422

    user = User(name=name, email=email, role='hr', status='active')
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'HR account created successfully'}), 201
