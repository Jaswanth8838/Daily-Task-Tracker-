from flask import Blueprint, request, jsonify
from app import db
from models import User, Intern
from middleware import role_required
from datetime import datetime

users_bp = Blueprint('users', __name__)


@users_bp.route('/api/users', methods=['GET'])
@role_required('hr')
def get_users():
    role = request.args.get('role')
    query = User.query
    if role:
        query = query.filter_by(role=role)
    users = query.all()
    return jsonify([u.to_dict() for u in users]), 200


@users_bp.route('/api/users', methods=['POST'])
@role_required('hr')
def create_user():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    employee_id = (data.get('employee_id') or data.get('employeeId') or '').strip()
    role = data.get('role')
    password = data.get('password')
    department = (data.get('department') or 'Engineering').strip()

    if not all([name, email, employee_id, role, password]):
        return jsonify({'error': 'Name, Email, Employee ID, Role, and Password are required.'}), 400

    # Only intern and hr are valid roles now
    if role not in ('intern', 'hr'):
        return jsonify({'error': 'Role must be intern or hr'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists.'}), 400

    existing_emp_user = User.query.filter_by(employee_id=employee_id).first()
    existing_emp_intern = Intern.query.filter_by(employee_id=employee_id).first()
    if existing_emp_user or existing_emp_intern:
        return jsonify({'error': 'Employee ID already exists.'}), 400

    user = User(
        name=name,
        email=email,
        employee_id=employee_id,
        role=role,
        status=data.get('status', 'active')
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    if role == 'intern':
        intern = Intern(user_id=user.id, employee_id=employee_id)
        db.session.add(intern)
        db.session.commit()

    return jsonify(user.to_dict()), 201


@users_bp.route('/api/users/<int:user_id>', methods=['PUT'])
@role_required('hr')
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}

    if 'name' in data and data['name'].strip():
        user.name = data['name'].strip()
    if 'email' in data and data['email'].strip():
        user.email = data['email'].strip().lower()
    if 'status' in data:
        user.status = data['status']
    if 'password' in data and data['password']:
        user.set_password(data['password'])

    db.session.commit()
    return jsonify(user.to_dict()), 200


@users_bp.route('/api/interns', methods=['GET'])
@role_required('hr')
def get_interns():
    interns = Intern.query.all()
    return jsonify([i.to_dict() for i in interns]), 200


@users_bp.route('/api/interns/<int:intern_id>', methods=['PUT'])
@role_required('hr')
def update_intern(intern_id):
    intern = Intern.query.get_or_404(intern_id)
    data = request.get_json() or {}

    if 'manager_id' in data:
        intern.manager_id = data['manager_id'] or None
    if 'employee_id' in data:
        intern.employee_id = data['employee_id']
    if 'department' in data:
        intern.department = data['department']
    if 'joining_date' in data and data['joining_date']:
        try:
            intern.joining_date = datetime.strptime(data['joining_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    db.session.commit()
    return jsonify(intern.to_dict()), 200
