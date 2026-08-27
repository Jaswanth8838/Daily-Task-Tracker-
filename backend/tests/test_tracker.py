import unittest
import os
from datetime import datetime, date, timedelta
from app import create_app, db
from models import User, Intern, DailyTracker, DailyUpdate, TrackerAccessOverride
from services.tracker_service import evaluate_intern_access, get_today_local


class TestTrackerAndAuth(unittest.TestCase):
    def setUp(self):
        os.environ['JWT_SECRET_KEY'] = 'test-secret-key-1234567890'
        os.environ['APP_TIMEZONE'] = 'Asia/Kolkata'
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_role_escalation_prevented(self):
        res = self.client.post('/api/auth/signup', json={
            'name': 'Hacker HR',
            'email': 'hacker@example.com',
            'password': 'password123',
            'role': 'hr'
        })
        self.assertIn(res.status_code, (201, 400))
        if res.status_code == 201:
            data = res.get_json()
            self.assertEqual(data['user']['role'], 'intern')

    def test_multi_session_tracker_workflow(self):
        intern = User(name='John Intern', email='john@example.com', role='intern')
        intern.set_password('password123')
        db.session.add(intern)
        db.session.commit()

        # Login
        res = self.client.post('/api/auth/login', json={'email': 'john@example.com', 'password': 'password123'})
        token = res.get_json()['token']
        headers = {'Authorization': f'Bearer {token}'}

        # 1. Add Session 1
        res1 = self.client.post('/api/tracker/update', json={
            'trainer_name': 'Sarah Connor',
            'technology_name': 'React',
            'concepts_covered': 'Hooks, State',
            'duration_hrs': 2.0,
            'update_text': 'Learned useState and useEffect'
        }, headers=headers)
        self.assertEqual(res1.status_code, 201)
        data1 = res1.get_json()
        self.assertEqual(data1['update']['session_name'], 'Session 1')

        # 2. Add Session 2
        res2 = self.client.post('/api/tracker/update', json={
            'trainer_name': 'Sarah Connor',
            'technology_name': 'React',
            'concepts_covered': 'Context API',
            'duration_hrs': 1.5,
            'update_text': 'Built global theme context'
        }, headers=headers)
        self.assertEqual(res2.status_code, 201)
        data2 = res2.get_json()
        self.assertEqual(data2['update']['session_name'], 'Session 2')

        # 3. Fetch today tracker
        res_today = self.client.get('/api/tracker/today', headers=headers)
        self.assertEqual(res_today.status_code, 200)
        today_data = res_today.get_json()
        self.assertEqual(len(today_data['tracker']['sessions']), 2)
        self.assertFalse(today_data['is_submitted'])

        # 4. Submit Daily Tracker
        res_sub = self.client.post('/api/tracker/submit', json={}, headers=headers)
        self.assertEqual(res_sub.status_code, 200)
        self.assertEqual(res_sub.get_json()['tracker']['status'], 'submitted')

        # 5. Try adding another session after submission -> should be rejected
        res_locked = self.client.post('/api/tracker/update', json={
            'trainer_name': 'Sarah Connor',
            'technology_name': 'React',
            'concepts_covered': 'Redux',
            'duration_hrs': 1.0,
            'update_text': 'Trying to add to locked tracker'
        }, headers=headers)
        self.assertEqual(res_locked.status_code, 403)

    def test_auto_freeze_and_admin_override(self):
        admin = User(name='Admin User', email='admin@example.com', role='hr')
        admin.set_password('adminpass')
        db.session.add(admin)

        intern = User(
            name='Late Intern',
            email='late@example.com',
            role='intern',
            created_at=datetime.utcnow() - timedelta(days=3)
        )
        intern.set_password('internpass')
        db.session.add(intern)
        db.session.commit()

        # Intern missed past days -> evaluate access
        status = evaluate_intern_access(intern)
        self.assertEqual(status, 'BLOCKED')

        # Intern tries to submit today -> blocked
        login_res = self.client.post('/api/auth/login', json={'email': 'late@example.com', 'password': 'internpass'})
        token = login_res.get_json()['token']
        headers = {'Authorization': f'Bearer {token}'}

        res = self.client.post('/api/tracker/update', json={
            'trainer_name': 'Trainer A',
            'technology_name': 'Python',
            'update_text': 'Daily update'
        }, headers=headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn('BLOCKED', res.get_json()['error'])

        # Admin logs in and grants access
        admin_login = self.client.post('/api/auth/login', json={'email': 'admin@example.com', 'password': 'adminpass'})
        admin_token = admin_login.get_json()['token']
        admin_headers = {'Authorization': f'Bearer {admin_token}'}

        grant_res = self.client.post(f'/api/admin/tracker-access/{intern.id}/grant', json={
            'reason': 'Medical leave approved'
        }, headers=admin_headers)
        self.assertEqual(grant_res.status_code, 200)
        self.assertEqual(grant_res.get_json()['tracker_access_status'], 'ACTIVE')

        # Now Intern can submit
        res_after = self.client.post('/api/tracker/update', json={
            'trainer_name': 'Trainer A',
            'technology_name': 'Python',
            'update_text': 'Daily update after unblock'
        }, headers=headers)
        self.assertEqual(res_after.status_code, 201)


if __name__ == '__main__':
    unittest.main()
