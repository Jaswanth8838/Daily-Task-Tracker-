import unittest
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from app import create_app, db
from models import User, PasswordResetToken, Notification, AuditLog


class TestPasswordResetFlow(unittest.TestCase):
    def setUp(self):
        os.environ['JWT_SECRET_KEY'] = 'test-secret-key-1234567890'
        os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
        os.environ['FRONTEND_URL'] = 'http://localhost:3000'
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

        # Provision a test user
        self.user = User(
            name='Test User',
            email='test.user@wallstreet.com',
            role='intern',
            status='active'
        )
        self.user.set_password('oldPassword123')
        db.session.add(self.user)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def _get_payload(self, res):
        data = res.get_json()
        if isinstance(data, dict) and 'data' in data and data.get('success') is True:
            return data['data']
        return data

    def test_forgot_password_generic_response_for_nonexistent_email(self):
        """Generic security response when email does not exist."""
        res = self.client.post('/api/auth/forgot-password', json={'email': 'nonexistent@example.com'})
        self.assertEqual(res.status_code, 200)
        data = self._get_payload(res)
        self.assertEqual(data['message'], 'If an account exists for this email, a password reset link has been sent.')
        # Ensure no token or password is ever returned
        self.assertNotIn('dev_reset_token', data)
        self.assertNotIn('token', data)
        self.assertNotIn('password', data)

    def test_forgot_password_response_never_contains_token_or_password(self):
        """Forgot password response MUST NOT return raw tokens or passwords (Security Requirement)."""
        res = self.client.post('/api/auth/forgot-password', json={'email': 'test.user@wallstreet.com'})
        self.assertEqual(res.status_code, 200)
        data = self._get_payload(res)
        self.assertEqual(data['message'], 'If an account exists for this email, a password reset link has been sent.')
        self.assertNotIn('token', data)
        self.assertNotIn('resetToken', data)
        self.assertNotIn('dev_reset_token', data)
        self.assertNotIn('password', data)
        self.assertNotIn('temporaryPassword', data)
        self.assertNotIn('newPassword', data)

    def test_token_hashed_and_stored_securely_in_db(self):
        """Token must be hashed before saving to database."""
        raw_token = secrets.token_urlsafe(32)
        hashed_token = PasswordResetToken.hash_token(raw_token)
        expires_at = datetime.utcnow() + timedelta(minutes=30)

        reset_token = PasswordResetToken(
            user_id=self.user.id,
            token_hash=hashed_token,
            token=hashed_token,
            expires_at=expires_at
        )
        db.session.add(reset_token)
        db.session.commit()

        db_record = PasswordResetToken.query.filter_by(user_id=self.user.id).first()
        self.assertIsNotNone(db_record)
        self.assertEqual(db_record.token_hash, hashed_token)
        self.assertFalse(db_record.used)
        self.assertIsNone(db_record.used_at)
        self.assertTrue(db_record.is_valid())

    def test_verify_token_endpoint(self):
        """Verify token endpoint returns appropriate status for valid, invalid, expired, and used tokens."""
        raw_token = secrets.token_urlsafe(32)
        hashed_token = PasswordResetToken.hash_token(raw_token)
        expires_at = datetime.utcnow() + timedelta(minutes=30)

        reset_token = PasswordResetToken(
            user_id=self.user.id,
            token_hash=hashed_token,
            token=hashed_token,
            expires_at=expires_at
        )
        db.session.add(reset_token)
        db.session.commit()

        # 1. Valid token
        res_v = self.client.get(f'/api/auth/verify-reset-token/{raw_token}')
        self.assertEqual(res_v.status_code, 200)
        data_v = self._get_payload(res_v)
        self.assertTrue(data_v['valid'])
        self.assertEqual(data_v['email'], 'test.user@wallstreet.com')

        # 2. Invalid token
        res_inv = self.client.get('/api/auth/verify-reset-token/completely-invalid-token')
        self.assertEqual(res_inv.status_code, 400)
        err_msg = res_inv.get_json().get('error', {}).get('message') or res_inv.get_json().get('error')
        self.assertIn('Invalid password reset link.', err_msg)

        # 3. Expired token
        reset_token.expires_at = datetime.utcnow() - timedelta(minutes=5)
        db.session.commit()

        res_exp = self.client.get(f'/api/auth/verify-reset-token/{raw_token}')
        self.assertEqual(res_exp.status_code, 400)
        err_msg = res_exp.get_json().get('error', {}).get('message') or res_exp.get_json().get('error')
        self.assertEqual(err_msg, 'This password reset link has expired.')

        # 4. Used token
        reset_token.expires_at = datetime.utcnow() + timedelta(minutes=30)
        reset_token.used = True
        reset_token.used_at = datetime.utcnow()
        db.session.commit()

        res_used = self.client.get(f'/api/auth/verify-reset-token/{raw_token}')
        self.assertEqual(res_used.status_code, 400)
        err_msg = res_used.get_json().get('error', {}).get('message') or res_used.get_json().get('error')
        self.assertEqual(err_msg, 'This password reset link has already been used.')

    def test_complete_reset_password_flow(self):
        """End-to-end flow: request link -> reset password -> old fails -> new succeeds -> token cannot be reused."""
        raw_token = secrets.token_urlsafe(32)
        hashed_token = PasswordResetToken.hash_token(raw_token)
        expires_at = datetime.utcnow() + timedelta(minutes=30)

        reset_token = PasswordResetToken(
            user_id=self.user.id,
            token_hash=hashed_token,
            token=hashed_token,
            expires_at=expires_at
        )
        db.session.add(reset_token)
        db.session.commit()

        # 1. Short password rejection
        res_short = self.client.post('/api/auth/reset-password', json={
            'token': raw_token,
            'password': '123'
        })
        self.assertEqual(res_short.status_code, 400)

        # 2. Mismatched password rejection
        res_mismatch = self.client.post('/api/auth/reset-password', json={
            'token': raw_token,
            'newPassword': 'brandNewPassword999!',
            'confirmPassword': 'differentPassword999!'
        })
        self.assertEqual(res_mismatch.status_code, 400)

        # 3. Successful password reset with newPassword / confirmPassword format
        res_reset = self.client.post('/api/auth/reset-password', json={
            'token': raw_token,
            'newPassword': 'brandNewPassword999!',
            'confirmPassword': 'brandNewPassword999!'
        })
        self.assertEqual(res_reset.status_code, 200)
        data_reset = self._get_payload(res_reset)
        self.assertEqual(data_reset['message'], 'Password reset successfully. You can now sign in with your new password.')

        # 4. Old password no longer works
        login_old = self.client.post('/api/auth/login', json={
            'email': 'test.user@wallstreet.com',
            'password': 'oldPassword123'
        })
        self.assertEqual(login_old.status_code, 401)

        # 5. New password works
        login_new = self.client.post('/api/auth/login', json={
            'email': 'test.user@wallstreet.com',
            'password': 'brandNewPassword999!'
        })
        self.assertEqual(login_new.status_code, 200)
        self.assertIn('token', self._get_payload(login_new))

        # 6. Reusing the same reset link is rejected
        res_reuse = self.client.post('/api/auth/reset-password', json={
            'token': raw_token,
            'newPassword': 'anotherNewPassword',
            'confirmPassword': 'anotherNewPassword'
        })
        self.assertEqual(res_reuse.status_code, 400)
        err_msg = res_reuse.get_json().get('error', {}).get('message') or res_reuse.get_json().get('error')
        self.assertEqual(err_msg, 'This password reset link has already been used.')


if __name__ == '__main__':
    unittest.main()
