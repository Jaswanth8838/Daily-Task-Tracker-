import unittest
import os
import json
from datetime import datetime, date, timedelta
from app import create_app, db
from models import User, Intern, DailyTracker, DailyUpdate
from services.tracker_service import get_today_local


class TestSubmissionCalendar(unittest.TestCase):
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

        # Create Intern User
        self.intern_user = User(
            email='intern@test.com',
            name='Test Intern',
            role='intern',
            status='active'
        )
        self.intern_user.set_password('Password123!')
        db.session.add(self.intern_user)
        db.session.commit()

        self.intern_profile = Intern(
            user_id=self.intern_user.id,
            employee_id='INT-001',
            department='Engineering',
            joining_date=date(2026, 9, 1)
        )
        db.session.add(self.intern_profile)
        db.session.commit()

        # Create HR User
        self.hr_user = User(
            email='hr@test.com',
            name='Test HR',
            role='hr',
            status='active'
        )
        self.hr_user.set_password('Password123!')
        db.session.add(self.hr_user)
        db.session.commit()

        def _get_payload(res):
            data = res.get_json()
            if isinstance(data, dict) and 'data' in data and data.get('success') is True:
                return data['data']
            return data

        # Helper login tokens
        res_intern = self.client.post('/api/auth/login', json={
            'email': 'intern@test.com',
            'password': 'Password123!'
        })
        self.intern_token = _get_payload(res_intern)['token']

        res_hr = self.client.post('/api/auth/login', json={
            'email': 'hr@test.com',
            'password': 'Password123!'
        })
        self.hr_token = _get_payload(res_hr)['token']

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def _get_data(self, res):
        data = res.get_json()
        if isinstance(data, dict) and 'data' in data and data.get('success') is True:
            return data['data']
        return data

    def test_submission_calendar_empty_and_populated(self):
        # 1. Fetch calendar for September 2026 before adding submissions
        res = self.client.get(
            '/api/tracker/submission-calendar?year=2026&month=9',
            headers={'Authorization': f'Bearer {self.intern_token}'}
        )
        self.assertEqual(res.status_code, 200)
        data = self._get_data(res)
        self.assertEqual(data['year'], 2026)
        self.assertEqual(data['month'], 9)
        self.assertEqual(len(data['calendar_days']), 30)
        self.assertEqual(data['total_days_submitted'], 0)
        self.assertEqual(data['total_sessions_submitted'], 0)

        # 2. Convert 2026-09-10 tracker (created during evaluate_intern_access) to submitted with 3 sessions
        tracker = DailyTracker.query.filter_by(
            user_id=self.intern_user.id,
            date=date(2026, 9, 10)
        ).first()

        if not tracker:
            tracker = DailyTracker(
                user_id=self.intern_user.id,
                date=date(2026, 9, 10),
                status='submitted'
            )
            db.session.add(tracker)
            db.session.flush()
        else:
            tracker.status = 'submitted'
            db.session.flush()

        for s_idx in range(1, 4):
            session = DailyUpdate(
                user_id=self.intern_user.id,
                tracker_id=tracker.id,
                session_number=s_idx,
                date=date(2026, 9, 10),
                trainer_name='Trainer A',
                technology_name='Python',
                session_name=f'Session {s_idx}',
                concepts_covered='Flask, SQLAlchemy',
                duration_hrs=2.0,
                update_text='Finished tasks'
            )
            db.session.add(session)
        db.session.commit()

        # 3. Re-fetch calendar
        res = self.client.get(
            '/api/tracker/submission-calendar?year=2026&month=9',
            headers={'Authorization': f'Bearer {self.intern_token}'}
        )
        self.assertEqual(res.status_code, 200)
        data = self._get_data(res)
        self.assertEqual(data['total_days_submitted'], 1)
        self.assertEqual(data['total_sessions_submitted'], 3)
        self.assertEqual(data['all_time']['submitted_days'], 1)
        self.assertEqual(data['all_time']['total_sessions'], 3)

        # Find Sept 10 in calendar days
        day_10 = next((d for d in data['calendar_days'] if d['date'] == '2026-09-10'), None)
        self.assertIsNotNone(day_10)
        self.assertEqual(day_10['status'], 'submitted')
        self.assertEqual(day_10['sessions_count'], 3)
        self.assertEqual(len(day_10['sessions']), 3)

    def test_hr_interns_and_performance(self):
        # Update or create tracker on 2026-09-15 with 2 sessions
        tracker = DailyTracker.query.filter_by(
            user_id=self.intern_user.id,
            date=date(2026, 9, 15)
        ).first()

        if not tracker:
            tracker = DailyTracker(
                user_id=self.intern_user.id,
                date=date(2026, 9, 15),
                status='submitted'
            )
            db.session.add(tracker)
            db.session.flush()
        else:
            tracker.status = 'submitted'
            db.session.flush()

        s1 = DailyUpdate(
            user_id=self.intern_user.id,
            tracker_id=tracker.id,
            session_number=1,
            date=date(2026, 9, 15),
            trainer_name='Trainer A',
            technology_name='Python',
            session_name='Session 1',
            concepts_covered='Concepts 1',
            duration_hrs=2.0,
            update_text='Text 1'
        )
        s2 = DailyUpdate(
            user_id=self.intern_user.id,
            tracker_id=tracker.id,
            session_number=2,
            date=date(2026, 9, 15),
            trainer_name='Trainer B',
            technology_name='Docker',
            session_name='Session 2',
            concepts_covered='Concepts 2',
            duration_hrs=3.0,
            update_text='Text 2'
        )
        db.session.add_all([s1, s2])
        db.session.commit()

        # 1. HR gets intern list
        res = self.client.get(
            '/api/hr/interns',
            headers={'Authorization': f'Bearer {self.hr_token}'}
        )
        self.assertEqual(res.status_code, 200)
        interns = self._get_data(res)
        self.assertIsInstance(interns, list)
        intern_data = next((i for i in interns if i['id'] == self.intern_user.id), None)
        self.assertIsNotNone(intern_data)
        self.assertEqual(intern_data['submitted_days'], 1)
        self.assertEqual(intern_data['total_sessions'], 2)

        # 2. HR gets intern performance
        res_perf = self.client.get(
            f'/api/hr/interns/{self.intern_user.id}/performance',
            headers={'Authorization': f'Bearer {self.hr_token}'}
        )
        perf_data = self._get_data(res_perf)
        self.assertIn('date_wise_submissions', perf_data)
        submissions = perf_data['date_wise_submissions']
        sub_15 = next((s for s in submissions if s['date'] == '2026-09-15'), None)
        self.assertIsNotNone(sub_15)
        self.assertEqual(sub_15['status'], 'Submitted')
        self.assertEqual(sub_15['sessions'], 2)

        # 3. Intern cannot access HR endpoint
        res_forbidden = self.client.get(
            '/api/hr/interns',
            headers={'Authorization': f'Bearer {self.intern_token}'}
        )
        self.assertEqual(res_forbidden.status_code, 403)
