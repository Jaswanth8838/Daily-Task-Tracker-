import unittest
import os
from datetime import datetime, date, timedelta
from app import create_app, db
from models import User, Intern, DailyTracker, DailyUpdate, Notification, AuditLog, TrackerAccessOverride
from services.tracker_service import evaluate_intern_access, get_today_local, get_now_local


class TestFreezeAndDeadlineFlow(unittest.TestCase):
    def setUp(self):
        os.environ['JWT_SECRET_KEY'] = 'test-secret-key-1234567890'
        os.environ['APP_TIMEZONE'] = 'Asia/Kolkata'
        os.environ['DAILY_CUTOFF_TIME'] = '23:59:59'
        os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

        # Provision HR Account
        self.hr = User(
            name='Suma Tirunamala',
            email='stirunamala@wscs.ai',
            employee_id='HR-WS-001',
            role='hr',
            department='Human Resources',
            status='active'
        )
        self.hr.set_password('Suma@12345')
        db.session.add(self.hr)

        # Provision Intern Account
        self.intern = User(
            name='Aarav Sharma',
            email='aarav.sharma@wallstreet.com',
            employee_id='INT-AAR-01',
            role='intern',
            department='Python Development',
            status='active',
            tracker_access_status='ACTIVE',
            created_at=datetime(2026, 8, 27, 8, 0, 0)
        )
        self.intern.set_password('intern123')
        db.session.add(self.intern)

        intern_profile = Intern(
            user=self.intern,
            employee_id='INT-AAR-01',
            joining_date=date(2026, 8, 27),
            status='active'
        )
        db.session.add(intern_profile)
        db.session.commit()

        # Get tokens
        hr_login = self.client.post('/api/auth/login', json={'email': 'stirunamala@wscs.ai', 'password': 'Suma@12345'})
        hr_data = hr_login.get_json()
        self.hr_token = hr_data.get('data', {}).get('token') or hr_data.get('token')
        self.hr_headers = {'Authorization': f'Bearer {self.hr_token}'}

        intern_login = self.client.post('/api/auth/login', json={'email': 'aarav.sharma@wallstreet.com', 'password': 'intern123'})
        intern_data = intern_login.get_json()
        self.intern_token = intern_data.get('data', {}).get('token') or intern_data.get('token')
        self.intern_headers = {'Authorization': f'Bearer {self.intern_token}'}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def _get_payload(self, res):
        data = res.get_json()
        if isinstance(data, dict) and 'data' in data and data.get('success') is True:
            return data['data']
        return data

    def test_example_a_and_b_before_deadline(self):
        """
        Example A: 27-Aug 10:00 AM -> Allowed
        Example B: 27-Aug 11:58 PM -> Allowed
        """
        # Set test clock to 27-Aug 10:00 AM
        headers_10am = {**self.intern_headers, 'X-Test-Time': '2026-08-27T10:00:00'}

        # 1. Save Session 1 draft
        res1 = self.client.post('/api/tracker/update', json={
            'date': '2026-08-27',
            'session_number': 1,
            'session_name': 'Session 1',
            'trainer_name': 'Rajesh Kumar',
            'technology_name': 'Python',
            'concepts_covered': 'List Comprehensions',
            'duration_hrs': 2.0,
            'update_text': 'Completed nested comprehensions'
        }, headers=headers_10am)
        self.assertEqual(res1.status_code, 201)

        # 2. At 11:58 PM -> Still allowed
        headers_1158pm = {**self.intern_headers, 'X-Test-Time': '2026-08-27T23:58:00'}
        res2 = self.client.post('/api/tracker/update', json={
            'date': '2026-08-27',
            'session_number': 2,
            'session_name': 'Session 2',
            'trainer_name': 'Rajesh Kumar',
            'technology_name': 'Python',
            'concepts_covered': 'Functions & Lambdas',
            'duration_hrs': 2.0,
            'update_text': 'Completed lambda functions and map/filter'
        }, headers=headers_1158pm)
        self.assertEqual(res2.status_code, 201)

        # Verify tracker is still draft and access is ACTIVE
        res_today = self.client.get('/api/tracker/today', headers=headers_1158pm)
        self.assertEqual(res_today.status_code, 200)
        today_data = self._get_payload(res_today)
        self.assertEqual(today_data['access_status'], 'ACTIVE')
        self.assertFalse(today_data['is_blocked'])

    def test_three_mandatory_sessions_enforced(self):
        """
        Partial submission with only 2 sessions must be rejected with INCOMPLETE_SESSIONS.
        """
        headers = {**self.intern_headers, 'X-Test-Time': '2026-08-27T20:00:00'}

        # Submit with 2 sessions only
        res = self.client.post('/api/tracker/submit', json={
            'date': '2026-08-27',
            'sessions': [
                {
                    'session_number': 1,
                    'trainer_name': 'Rajesh Kumar',
                    'technology_name': 'Python',
                    'concepts_covered': 'Syntax',
                    'duration_hrs': 2.0,
                    'update_text': 'Done session 1'
                },
                {
                    'session_number': 2,
                    'trainer_name': 'Rajesh Kumar',
                    'technology_name': 'Python',
                    'concepts_covered': 'Loops',
                    'duration_hrs': 2.0,
                    'update_text': 'Done session 2'
                }
            ]
        }, headers=headers)

        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        error_info = data.get('error', {})
        if isinstance(error_info, dict):
            self.assertEqual(error_info.get('code'), 'INCOMPLETE_SESSIONS')

    def test_midnight_freeze_blocking_and_hr_notification(self):
        """
        Example C: 28-Aug 00:00:00 -> 27-Aug = FROZEN, Intern Access = BLOCKED, HR Notification & AuditLog created.
        Example D: 28-Aug 09:00 AM -> Direct submission of 27-Aug is FORBIDDEN.
        Example E: 28-Aug 09:00 AM -> Direct submission of 28-Aug is FORBIDDEN while blocked.
        """
        # Day 27: Intern saves draft for sessions 1 and 2, but leaves it unsubmitted
        headers_day27 = {**self.intern_headers, 'X-Test-Time': '2026-08-27T22:00:00'}
        self.client.post('/api/tracker/save', json={
            'date': '2026-08-27',
            'sessions': [
                {
                    'session_number': 1,
                    'trainer_name': 'Rajesh Kumar',
                    'technology_name': 'Python',
                    'concepts_covered': 'Basics',
                    'duration_hrs': 2.0,
                    'update_text': 'Session 1 text'
                }
            ]
        }, headers=headers_day27)

        # MIDNIGHT: 28-Aug 00:00:00
        headers_midnight = {**self.intern_headers, 'X-Test-Time': '2026-08-28T00:00:00'}

        # Intern visits /api/tracker/today or calls any tracker endpoint
        res_today = self.client.get('/api/tracker/today', headers=headers_midnight)
        self.assertEqual(res_today.status_code, 200)
        today_data = self._get_payload(res_today)
        self.assertEqual(today_data['access_status'], 'BLOCKED')
        self.assertTrue(today_data['is_blocked'])
        self.assertTrue(today_data['is_frozen'])
        self.assertEqual(today_data['missed_date'], '2026-08-27')

        # Verify 27-Aug tracker in DB is FROZEN
        tracker_27 = DailyTracker.query.filter_by(user_id=self.intern.id, date=date(2026, 8, 27)).first()
        self.assertIsNotNone(tracker_27)
        self.assertEqual(tracker_27.status, 'frozen')

        # Verify HR Notification was generated
        notif = Notification.query.filter_by(user_id=self.hr.id).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.title, 'Intern Daily Task Not Submitted')
        self.assertIn('Aarav Sharma', notif.message)
        self.assertIn('27-Aug-2026', notif.message)
        self.assertIn('INT-AAR-01', notif.message)
        self.assertFalse(notif.is_read)

        # Verify Audit Log entry was generated
        audit_log = AuditLog.query.filter_by(user_id=self.intern.id, action='AUTO_FREEZE_MISSED_TRACKER').first()
        self.assertIsNotNone(audit_log)
        self.assertIn('2026-08-27', audit_log.details)

        # Idempotency Test: calling endpoint again at 28-Aug 08:30 AM must not duplicate notification or audit log
        headers_morning = {**self.intern_headers, 'X-Test-Time': '2026-08-28T08:30:00'}
        self.client.get('/api/tracker/today', headers=headers_morning)
        self.assertEqual(Notification.query.filter_by(user_id=self.hr.id).count(), 1)
        self.assertEqual(AuditLog.query.filter_by(user_id=self.intern.id, action='AUTO_FREEZE_MISSED_TRACKER').count(), 1)

        # Example D: Intern tries to submit 27-Aug on 28-Aug -> 403 FORBIDDEN
        res_submit_past = self.client.post('/api/tracker/submit', json={
            'date': '2026-08-27',
            'sessions': [
                {'session_number': 1, 'trainer_name': 'T', 'technology_name': 'Python', 'concepts_covered': 'C', 'duration_hrs': 2, 'update_text': 'Text'},
                {'session_number': 2, 'trainer_name': 'T', 'technology_name': 'Python', 'concepts_covered': 'C', 'duration_hrs': 2, 'update_text': 'Text'},
                {'session_number': 3, 'trainer_name': 'T', 'technology_name': 'Python', 'concepts_covered': 'C', 'duration_hrs': 2, 'update_text': 'Text'},
            ]
        }, headers=headers_morning)
        self.assertEqual(res_submit_past.status_code, 403)

        # Example E: Intern tries to submit 28-Aug while BLOCKED -> 403 FORBIDDEN
        res_submit_curr = self.client.post('/api/tracker/submit', json={
            'date': '2026-08-28',
            'sessions': [
                {'session_number': 1, 'trainer_name': 'T', 'technology_name': 'Python', 'concepts_covered': 'C', 'duration_hrs': 2, 'update_text': 'Text'},
                {'session_number': 2, 'trainer_name': 'T', 'technology_name': 'Python', 'concepts_covered': 'C', 'duration_hrs': 2, 'update_text': 'Text'},
                {'session_number': 3, 'trainer_name': 'T', 'technology_name': 'Python', 'concepts_covered': 'C', 'duration_hrs': 2, 'update_text': 'Text'},
            ]
        }, headers=headers_morning)
        self.assertEqual(res_submit_curr.status_code, 403)

        # Intern tries to save/create for future 29-Aug -> 403 FORBIDDEN
        res_future = self.client.post('/api/tracker/save', json={
            'date': '2026-08-29',
            'sessions': [{'session_number': 1, 'trainer_name': 'T', 'technology_name': 'P', 'concepts_covered': 'C', 'duration_hrs': 2, 'update_text': 'U'}]
        }, headers=headers_morning)
        self.assertEqual(res_future.status_code, 403)

    def test_hr_grant_access_flow(self):
        """
        HR logs in:
        1. Checks notification unread count and marks notification read.
        2. Views blocked intern in Tracker Access.
        3. Grants access.
        4. 27-Aug remains frozen.
        5. Intern access becomes ACTIVE.
        6. Intern can now submit 28-Aug with 3 sessions.
        """
        # Trigger freeze on 28-Aug
        headers_freeze = {**self.intern_headers, 'X-Test-Time': '2026-08-28T09:00:00'}
        self.client.get('/api/tracker/today', headers=headers_freeze)

        hr_headers = {**self.hr_headers, 'X-Test-Time': '2026-08-28T09:30:00'}

        # 1. HR Notification check
        unread_res = self.client.get('/api/notifications/unread-count', headers=hr_headers)
        self.assertEqual(unread_res.status_code, 200)
        self.assertEqual(self._get_payload(unread_res)['unread_count'], 1)

        notifs_res = self.client.get('/api/notifications', headers=hr_headers)
        notifs_data = self._get_payload(notifs_res)
        self.assertEqual(len(notifs_data), 1)
        notif_id = notifs_data[0]['id']

        # Mark read
        read_res = self.client.post(f'/api/notifications/{notif_id}/read', headers=hr_headers)
        self.assertEqual(read_res.status_code, 200)

        unread_res2 = self.client.get('/api/notifications/unread-count', headers=hr_headers)
        self.assertEqual(self._get_payload(unread_res2)['unread_count'], 0)

        # 2. HR Views Tracker Access list
        access_res = self.client.get('/api/admin/tracker-access', headers=hr_headers)
        self.assertEqual(access_res.status_code, 200)
        records = self._get_payload(access_res)
        intern_rec = next(r for r in records if r['intern_id'] == self.intern.id)
        self.assertEqual(intern_rec['tracker_access_status'], 'BLOCKED')
        self.assertEqual(intern_rec['frozen_date'], '27-Aug-2026')
        self.assertEqual(intern_rec['frozen_status'], 'FROZEN')
        self.assertIn('Daily task not submitted before deadline for 27-Aug-2026', intern_rec['latest_reason'])

        # 3. HR Grants Access
        grant_res = self.client.post(f'/api/admin/tracker-access/{self.intern.id}/grant', json={
            'reason': 'Approved leave granted for yesterday'
        }, headers=hr_headers)
        self.assertEqual(grant_res.status_code, 200)
        self.assertEqual(self._get_payload(grant_res)['tracker_access_status'], 'ACTIVE')

        # Check Audit Log for grant
        grant_audit = AuditLog.query.filter_by(action='GRANT_TRACKER_ACCESS').first()
        self.assertIsNotNone(grant_audit)
        self.assertIn('Approved leave granted for yesterday', grant_audit.details)

        # 4. Historical date 27-Aug remains frozen
        tracker_27 = DailyTracker.query.filter_by(user_id=self.intern.id, date=date(2026, 8, 27)).first()
        self.assertEqual(tracker_27.status, 'frozen')

        # 5. Intern revalidates on 28-Aug -> access is now ACTIVE
        intern_headers_active = {**self.intern_headers, 'X-Test-Time': '2026-08-28T10:00:00'}
        today_res = self.client.get('/api/tracker/today', headers=intern_headers_active)
        self.assertEqual(today_res.status_code, 200)
        today_data = self._get_payload(today_res)
        self.assertEqual(today_data['access_status'], 'ACTIVE')
        self.assertFalse(today_data['is_blocked'])

        # 6. Intern can now submit 28-Aug with 3 sessions
        submit_res = self.client.post('/api/tracker/submit', json={
            'date': '2026-08-28',
            'sessions': [
                {'session_number': 1, 'trainer_name': 'Rajesh Kumar', 'technology_name': 'Python', 'concepts_covered': 'Modules', 'duration_hrs': 2.0, 'update_text': 'Created custom modules'},
                {'session_number': 2, 'trainer_name': 'Rajesh Kumar', 'technology_name': 'Python', 'concepts_covered': 'File I/O', 'duration_hrs': 2.0, 'update_text': 'Worked with file streams'},
                {'session_number': 3, 'trainer_name': 'Rajesh Kumar', 'technology_name': 'Python', 'concepts_covered': 'JSON serialization', 'duration_hrs': 2.0, 'update_text': 'Stored structured data'}
            ]
        }, headers=intern_headers_active)
        self.assertEqual(submit_res.status_code, 200)
        self.assertEqual(self._get_payload(submit_res)['tracker']['status'], 'submitted')

    def test_submitted_tracker_remains_submitted_at_midnight(self):
        """
        Criteria 9: If the intern successfully submits before midnight:
        27-Aug = SUBMITTED. At midnight, 27-Aug remains SUBMITTED and intern remains ACTIVE.
        """
        headers_day27 = {**self.intern_headers, 'X-Test-Time': '2026-08-27T21:00:00'}
        sub_res = self.client.post('/api/tracker/submit', json={
            'date': '2026-08-27',
            'sessions': [
                {'session_number': 1, 'trainer_name': 'Rajesh Kumar', 'technology_name': 'Python', 'concepts_covered': 'Syntax', 'duration_hrs': 2.0, 'update_text': 'Completed session 1'},
                {'session_number': 2, 'trainer_name': 'Rajesh Kumar', 'technology_name': 'Python', 'concepts_covered': 'OOP', 'duration_hrs': 2.0, 'update_text': 'Completed session 2'},
                {'session_number': 3, 'trainer_name': 'Rajesh Kumar', 'technology_name': 'Python', 'concepts_covered': 'Algorithms', 'duration_hrs': 2.0, 'update_text': 'Completed session 3'}
            ]
        }, headers=headers_day27)
        self.assertEqual(sub_res.status_code, 200)

        # Midnight 28-Aug 00:00:00 arrives
        headers_midnight = {**self.intern_headers, 'X-Test-Time': '2026-08-28T00:00:00'}
        today_res = self.client.get('/api/tracker/today', headers=headers_midnight)
        self.assertEqual(today_res.status_code, 200)
        today_data = self._get_payload(today_res)
        self.assertEqual(today_data['access_status'], 'ACTIVE')
        self.assertFalse(today_data['is_blocked'])

        tracker_27 = DailyTracker.query.filter_by(user_id=self.intern.id, date=date(2026, 8, 27)).first()
        self.assertEqual(tracker_27.status, 'submitted')

    def test_reopen_historical_date_separate_from_grant_access(self):
        """
        Criteria 23: Separate Grant General Access from Reopen Historical Date.
        """
        # Trigger freeze on 28-Aug for missed 27-Aug
        headers_freeze = {**self.intern_headers, 'X-Test-Time': '2026-08-28T08:00:00'}
        self.client.get('/api/tracker/today', headers=headers_freeze)

        tracker_27 = DailyTracker.query.filter_by(user_id=self.intern.id, date=date(2026, 8, 27)).first()
        self.assertEqual(tracker_27.status, 'frozen')

        hr_headers = {**self.hr_headers, 'X-Test-Time': '2026-08-28T09:00:00'}

        # 1. HR grants general access -> intern is ACTIVE, but 27-Aug is STILL frozen
        self.client.post(f'/api/admin/tracker-access/{self.intern.id}/grant', json={
            'reason': 'General access restore'
        }, headers=hr_headers)

        db.session.refresh(tracker_27)
        self.assertEqual(tracker_27.status, 'frozen')

        # 2. HR explicitly reopens the historical date 27-Aug
        reopen_res = self.client.post(f'/api/admin/trackers/{tracker_27.id}/reopen', json={
            'reason': 'Permission to submit missed date'
        }, headers=hr_headers)
        self.assertEqual(reopen_res.status_code, 200)

        db.session.refresh(tracker_27)
        self.assertEqual(tracker_27.status, 'draft')

        # Check Audit Log for REOPEN
        reopen_audit = AuditLog.query.filter_by(action='REOPEN_SPECIFIC_DATE').first()
        self.assertIsNotNone(reopen_audit)
        self.assertIn('Permission to submit missed date', reopen_audit.details)


if __name__ == '__main__':
    unittest.main()
