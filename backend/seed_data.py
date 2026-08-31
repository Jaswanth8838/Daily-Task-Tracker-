import os
from datetime import date
from sqlalchemy import text
from app import create_app, db
from models import User

app = create_app()

with app.app_context():
    # 0. Always ensure all tables and columns exist
    db.create_all()
    try:
        db.session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50) UNIQUE;"))
        db.session.commit()
    except Exception as e:
        db.session.rollback()

    # 1. PROVISION INITIAL HR ACCOUNT ONLY IF NOT ALREADY PRESENT
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
        db.session.commit()
        print(f"  [CREATED] Initial HR Account: {initial_email}")
    else:
        print(f"  [EXISTS] HR Account: {initial_email} is active.")

    print("\nDatabase initialization complete! User-created data preserved.")

