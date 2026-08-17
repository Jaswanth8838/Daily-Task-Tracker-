import os
import jwt
from functools import wraps
from flask import request, jsonify, g
from datetime import datetime, timezone


def _decode_token(token: str):
    secret = os.environ.get('JWT_SECRET_KEY', 'default_secret')
    return jwt.decode(token, secret, algorithms=['HS256'])


def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        token = auth_header.split(' ', 1)[1]
        try:
            payload = _decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        g.current_user = {
            'id': payload['sub'],
            'name': payload['name'],
            'email': payload['email'],
            'role': payload['role'],
        }
        g.client_ip = request.headers.get('X-Forwarded-For', request.remote_addr or 'unknown')
        return f(*args, **kwargs)
    return decorated


def role_required(*roles):
    def decorator(f):
        @wraps(f)
        @auth_required
        def decorated(*args, **kwargs):
            if g.current_user['role'] not in roles:
                return jsonify({'error': 'Forbidden'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


def admin_required(f):
    """Shortcut: only hr/admin role."""
    @wraps(f)
    @auth_required
    def decorated(*args, **kwargs):
        if g.current_user['role'] not in ('hr', 'admin'):
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated
