import os
from datetime import date
from sqlalchemy import text
from app import create_app, db
from models import (
    User, Intern, Technology, Trainer, TrainingConcept,
    DailyTracker, DailyUpdate, Notification, AuditLog, TrackerAccessOverride
)

app = create_app()

with app.app_context():
    # 0. Always ensure all tables exist and columns are updated
    db.create_all()
    try:
        db.session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50) UNIQUE;"))
        db.session.commit()
    except Exception as e:
        db.session.rollback()

    # 1. PURGE ALL SAMPLE / TEST BUSINESS DATA
    print("==> Purging all sample and test records from PostgreSQL...")
    try:
        TrackerAccessOverride.query.delete()
        DailyUpdate.query.delete()
        DailyTracker.query.delete()
        Notification.query.delete()
        AuditLog.query.delete()
        Intern.query.delete()
        TrainingConcept.query.delete()
        Technology.query.delete()
        Trainer.query.delete()
        User.query.delete()
        db.session.commit()
        print("  [CLEAN] Purged all test/sample records from PostgreSQL.")
    except Exception as err:
        db.session.rollback()
        print(f"  [WARN] Failed to purge tables cleanly: {err}")

    # 2. PROVISION INITIAL HR ACCOUNT ONLY
    initial_email = os.getenv('INITIAL_HR_EMAIL', 'stirunamala@wscs.ai')
    initial_password = os.getenv('INITIAL_HR_PASSWORD', 'Suma@12345')
    initial_name = os.getenv('INITIAL_HR_NAME', 'Suma Tirunamala')
    initial_emp_id = os.getenv('INITIAL_HR_EMP_ID', 'HR-WS-001')

    hr_user = User.query.filter_by(email=initial_email).first()
    if not hr_user:
        hr_user = User(
            name=initial_name,
            email=initial_email,
            employee_id=initial_emp_id,
            role='hr',
            department='Human Resources',
            status='active',
            tracker_access_status='ACTIVE'
        )
        hr_user.set_password(initial_password)
        db.session.add(hr_user)
        db.session.flush()
        print(f"  [CREATED] Initial HR Account: {initial_email}")
    else:
        hr_user.name = initial_name
        hr_user.employee_id = initial_emp_id
        hr_user.role = 'hr'
        hr_user.department = 'Human Resources'
        hr_user.status = 'active'
        hr_user.tracker_access_status = 'ACTIVE'
        hr_user.set_password(initial_password)

    db.session.commit()
    print("\nDatabase initialization complete! Only initial HR account provisions.")
    print(f"  HR Email: {initial_email}")
