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
        os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def _get_payload(self, res):
        data = res.get_json()
        if isinstance(data, dict) and 'data' in data and data.get('success') is True:
            return data['data']
        return data

    def test_signup_disabled(self):
        res = self.client.post('/api/auth/signup', json={
            'name': 'Hacker HR',
            'email': 'hacker@example.com',
            'password': 'password123',
            'role': 'hr'
        })
        self.assertEqual(res.status_code, 403)

    def test_multi_session_tracker_workflow(self):
        intern = User(name='John Intern', email='john@example.com', role='intern')
        intern.set_password('password123')
        db.session.add(intern)
        db.session.commit()

        # Login
        res = self.client.post('/api/auth/login', json={'email': 'john@example.com', 'password': 'password123'})
        token = self._get_payload(res)['token']
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
        data1 = self._get_payload(res1)
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
        data2 = self._get_payload(res2)
        self.assertEqual(data2['update']['session_name'], 'Session 2')

        # 3. Add Session 3
        res3 = self.client.post('/api/tracker/update', json={
            'trainer_name': 'Sarah Connor',
            'technology_name': 'React',
            'concepts_covered': 'Redux Toolkit',
            'duration_hrs': 2.0,
            'update_text': 'Built state store'
        }, headers=headers)
        self.assertEqual(res3.status_code, 201)
        data3 = self._get_payload(res3)
        self.assertEqual(data3['update']['session_name'], 'Session 3')

        # 4. Fetch today tracker
        res_today = self.client.get('/api/tracker/today', headers=headers)
        self.assertEqual(res_today.status_code, 200)
        today_data = self._get_payload(res_today)
        self.assertEqual(len(today_data['tracker']['sessions']), 3)
        self.assertFalse(today_data['is_submitted'])

        # 5. Submit Daily Tracker
        res_sub = self.client.post('/api/tracker/submit', json={}, headers=headers)
        self.assertEqual(res_sub.status_code, 200)
        self.assertEqual(self._get_payload(res_sub)['tracker']['status'], 'submitted')

        # 6. Try adding another session after submission -> should be rejected
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
        token = self._get_payload(login_res)['token']
        headers = {'Authorization': f'Bearer {token}'}

        res = self.client.post('/api/tracker/update', json={
            'trainer_name': 'Trainer A',
            'technology_name': 'Python',
            'update_text': 'Daily update'
        }, headers=headers)
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        error_msg = data.get('error', {}).get('message') if isinstance(data.get('error'), dict) else data.get('error', '')
        self.assertIn('BLOCKED', error_msg)

        # Admin logs in and grants access
        admin_login = self.client.post('/api/auth/login', json={'email': 'admin@example.com', 'password': 'adminpass'})
        admin_token = self._get_payload(admin_login)['token']
        admin_headers = {'Authorization': f'Bearer {admin_token}'}

        grant_res = self.client.post(f'/api/admin/tracker-access/{intern.id}/grant', json={
            'reason': 'Medical leave approved'
        }, headers=admin_headers)
        self.assertEqual(grant_res.status_code, 200)
        self.assertEqual(self._get_payload(grant_res)['tracker_access_status'], 'ACTIVE')

        # Now Intern can submit
        res_after = self.client.post('/api/tracker/update', json={
            'trainer_name': 'Trainer A',
            'technology_name': 'Python',
            'update_text': 'Daily update after unblock'
        }, headers=headers)
        self.assertEqual(res_after.status_code, 201)


if __name__ == '__main__':
    unittest.main()
