from datetime import date
from app import create_app, db
from models import User, Intern, DailyTracker, DailyUpdate

app = create_app()

with app.app_context():
    sample_interns = [
        ('Aarav Sharma', 'aarav.sharma@wallstreet.com', 'Session 1', 'Rajesh Kumar', 'Python', 'List Comprehension, Functions', 2.0, 'Completed exercises on nested comprehensions and lambda functions.', 'submitted'),
        ('Ananya Patel', 'ananya.patel@wallstreet.com', 'Session 1', 'Rajesh Kumar', 'Python', 'List Comprehension, Functions', 2.0, 'Implemented custom sorting algorithms and map/filter helpers.', 'submitted'),
        ('Rohan Mehta', 'rohan.mehta@wallstreet.com', 'Session 2', 'Rajesh Kumar', 'Python', 'Modules, File Handling', 2.0, 'Created custom python package modules and JSON file persistence routines.', 'submitted'),
        ('Simran Kaur', 'simran.kaur@wallstreet.com', 'Session 2', 'Rajesh Kumar', 'Python', 'Modules, File Handling', 2.0, 'Worked on CSV parser module and exception handling for file streams.', 'draft'),
        ('Vivek Singh', 'vivek.singh@wallstreet.com', 'Session 1', 'Rajesh Kumar', 'Python', 'OOP Basics, Classes', 2.0, 'Draft update pending final submission.', 'locked')
    ]

    for name, email, session, trainer, tech, concepts, duration, text, status in sample_interns:
        u = User.query.filter_by(email=email).first()
        if not u:
            u = User(name=name, email=email, role='intern', department='Python Development', status='active')
            u.set_password('intern123')
            db.session.add(u)
            db.session.flush()

            intern_prof = Intern(user_id=u.id, employee_id=f'INT-{name[:3].upper()}-01', department='Python', joining_date=date.today(), status='active')
            db.session.add(intern_prof)

        # Check if update exists
        upd = DailyUpdate.query.filter_by(user_id=u.id, session_name=session).first()
        if not upd:
            tracker = DailyTracker.query.filter_by(user_id=u.id, date=date.today()).first()
            if not tracker:
                tracker = DailyTracker(user_id=u.id, date=date.today(), status=status if status in ('submitted', 'frozen') else 'draft')
                db.session.add(tracker)
                db.session.flush()

            upd = DailyUpdate(
                user_id=u.id,
                tracker_id=tracker.id,
                date=date.today(),
                trainer_name=trainer,
                technology_name=tech,
                session_name=session,
                concepts_covered=concepts,
                duration_hrs=duration,
                update_text=text,
                status=status
            )
            db.session.add(upd)

    db.session.commit()
    print("Sample updates seeded successfully!")
