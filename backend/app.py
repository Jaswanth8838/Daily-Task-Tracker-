import os
from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'sqlite:///tasktracker.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    jwt_secret = os.environ.get('JWT_SECRET_KEY')
    flask_env = os.environ.get('FLASK_ENV', 'production')
    if flask_env != 'development' and (not jwt_secret or jwt_secret in ('default_secret', 'default_secret_please_change')):
        raise ValueError("JWT_SECRET_KEY must be set to a secure secret in non-development environments.")
    app.config['JWT_SECRET_KEY'] = jwt_secret or 'default_secret'

    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    CORS(app, resources={r'/api/*': {'origins': [frontend_url]}})

    db.init_app(app)

    # Import all models so Flask-Migrate and SQLAlchemy detect them
    from models import (  # noqa: F401
        User, Trainer, Technology, TrainingConcept, Intern,
        DailyUpdate, TrainingSession, AuditLog,
        EmployeeDailyReport, InternDailyReport, Notification, AssignedMeeting,
        DailyTracker, TrackerAccessOverride, PasswordResetToken
    )

    migrate.init_app(app, db)

    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            app.logger.warning(f"db.create_all skipped/handled: {e}")

    # Register blueprints
    from routes.health import health_bp, dashboard_bp
    from routes.auth import auth_bp
    from routes.setup import setup_bp
    from routes.master_data import master_data_bp
    from routes.users import users_bp
    from routes.tracker import tracker_bp
    from routes.reports import reports_bp
    from routes.audit import audit_bp
    from routes.employee_reports import emp_reports_bp
    from routes.intern_reports import intern_reports_bp
    from routes.admin import admin_bp
    from routes.notifications import notifications_bp
    from routes.intern_dashboard import intern_dashboard_bp
    from routes.hr_interns import hr_interns_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(setup_bp)
    app.register_blueprint(master_data_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(tracker_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(emp_reports_bp)
    app.register_blueprint(intern_reports_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(intern_dashboard_bp)
    app.register_blueprint(hr_interns_bp)

    import json
    @app.after_request
    def standardize_api_response(response):
        if not request.path.startswith('/api/'):
            return response
            
        if response.mimetype == 'application/json':
            try:
                data = json.loads(response.get_data(as_text=True))
            except Exception:
                return response
                
            if isinstance(data, dict) and ('success' in data):
                return response
                
            status_code = response.status_code
            if 200 <= status_code < 400:
                standardized = {
                    "success": True,
                    "data": data
                }
            else:
                code_map = {
                    400: "BAD_REQUEST",
                    401: "UNAUTHORIZED",
                    403: "FORBIDDEN",
                    404: "NOT_FOUND",
                    409: "CONFLICT",
                    422: "VALIDATION_ERROR",
                    500: "SERVER_ERROR"
                }
                err_code = code_map.get(status_code, "ERROR")
                err_msg = "An error occurred."
                if isinstance(data, dict):
                    if 'error' in data:
                        err_msg = data['error']
                    elif 'message' in data:
                        err_msg = data['message']
                    elif 'errors' in data:
                        err_msg = data['errors']
                elif isinstance(data, str):
                    err_msg = data
                    
                standardized = {
                    "success": False,
                    "error": {
                        "code": err_code,
                        "message": err_msg
                    }
                }
                
            response.set_data(json.dumps(standardized))
        return response

    return app


app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
