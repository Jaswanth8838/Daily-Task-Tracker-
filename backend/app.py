import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'default_secret')

    CORS(app, resources={r'/api/*': {'origins': '*'}})

    db.init_app(app)

    # Import all models so Flask-Migrate and db.create_all detect them
    from models import (  # noqa: F401
        User, Trainer, Technology, TrainingConcept, Intern,
        DailyUpdate, TrainingSession, AuditLog,
        EmployeeDailyReport, InternDailyReport, Notification, AssignedMeeting
    )

    migrate.init_app(app, db)

    with app.app_context():
        db.create_all()

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

    return app


app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
