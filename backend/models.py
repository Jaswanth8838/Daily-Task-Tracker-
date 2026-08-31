from datetime import datetime, date
import os
import pytz
from app import db
from werkzeug.security import generate_password_hash, check_password_hash


def get_today_local():
    tz = pytz.timezone(os.environ.get('APP_TIMEZONE', 'Asia/Kolkata'))
    return datetime.now(tz).date()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)   # intern | manager | employee | hr | admin
    status = db.Column(db.String(20), default='active', nullable=False)
    department = db.Column(db.String(100), nullable=True)
    employee_id = db.Column(db.String(50), unique=True, nullable=True)
    tracker_access_status = db.Column(db.String(20), default='ACTIVE', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        intern_prof = Intern.query.filter_by(user_id=self.id).first() if self.id else None
        emp_id = self.employee_id or (intern_prof.employee_id if intern_prof else None) or f"EMP-{self.id:04d}" if self.id else None
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'employee_id': emp_id,
            'role': self.role,
            'status': self.status,
            'tracker_access_status': self.tracker_access_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Trainer(db.Model):
    __tablename__ = 'trainers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=True)
    specialization = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(20), default='active', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'email': self.email,
            'specialization': self.specialization, 'status': self.status
        }


class Technology(db.Model):
    __tablename__ = 'technologies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    status = db.Column(db.String(20), default='active', nullable=False)
    concepts = db.relationship('TrainingConcept', backref='technology', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'status': self.status}


class TrainingConcept(db.Model):
    __tablename__ = 'training_concepts'
    id = db.Column(db.Integer, primary_key=True)
    technology_id = db.Column(db.Integer, db.ForeignKey('technologies.id'), nullable=False)
    concept = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default='active', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id, 'technology_id': self.technology_id,
            'concept': self.concept, 'status': self.status,
            'technology_name': self.technology.name if self.technology else None
        }


class Intern(db.Model):
    __tablename__ = 'interns'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    manager_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    employee_id = db.Column(db.String(50), nullable=True)
    department = db.Column(db.String(100), nullable=True)
    joining_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), default='active', nullable=False)
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('intern_profile', uselist=False))
    manager = db.relationship('User', foreign_keys=[manager_id])

    def to_dict(self):
        return {
            'id': self.id, 'user_id': self.user_id, 'manager_id': self.manager_id,
            'employee_id': self.employee_id,
            'joining_date': self.joining_date.isoformat() if self.joining_date else None,
            'status': self.status,
            'name': self.user.name if self.user else 'Unknown',
            'email': self.user.email if self.user else 'Unknown',
            'user': self.user.to_dict() if self.user else None,
            'manager': self.manager.to_dict() if self.manager else None
        }


class TrackerAccessOverride(db.Model):
    __tablename__ = 'tracker_access_overrides'
    id = db.Column(db.Integer, primary_key=True)
    intern_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)  # GRANT | REVOKE | REOPEN
    reason = db.Column(db.Text, nullable=False)
    enabled_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    effective_from = db.Column(db.Date, nullable=False)
    effective_until = db.Column(db.Date, nullable=True)
    target_date = db.Column(db.Date, nullable=True)

    intern = db.relationship('User', foreign_keys=[intern_id])
    admin = db.relationship('User', foreign_keys=[enabled_by])

    def to_dict(self):
        return {
            'id': self.id,
            'intern_id': self.intern_id,
            'intern_name': self.intern.name if self.intern else 'Unknown',
            'action': self.action,
            'reason': self.reason,
            'enabled_by': self.enabled_by,
            'admin_name': self.admin.name if self.admin else 'Unknown',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'effective_from': self.effective_from.isoformat() if self.effective_from else None,
            'effective_until': self.effective_until.isoformat() if self.effective_until else None,
            'target_date': self.target_date.isoformat() if self.target_date else None
        }


class DailyTracker(db.Model):
    __tablename__ = 'daily_trackers'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='draft', nullable=False)  # draft | submitted | frozen | missed
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = db.relationship('User', foreign_keys=[user_id])

    __table_args__ = (db.UniqueConstraint('user_id', 'date', name='uq_tracker_user_date'),)

    def to_dict(self):
        sorted_sessions = sorted(self.sessions, key=lambda s: s.session_number or s.id)
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else 'Unknown',
            'date': self.date.isoformat() if self.date else None,
            'status': self.status,
            'sessions': [s.to_dict() for s in sorted_sessions],
            'total_duration': sum((s.duration_hrs or 0) for s in self.sessions),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class DailyUpdate(db.Model):
    __tablename__ = 'daily_updates'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tracker_id = db.Column(db.Integer, db.ForeignKey('daily_trackers.id'), nullable=True)
    session_number = db.Column(db.Integer, nullable=True)
    date = db.Column(db.Date, default=date.today, nullable=False)
    trainer_name = db.Column(db.String(100), nullable=False)
    technology_name = db.Column(db.String(100), nullable=False)
    session_name = db.Column(db.String(100), nullable=False)
    concepts_covered = db.Column(db.Text, nullable=False)
    duration_hrs = db.Column(db.Float, nullable=False)
    update_text = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='submitted', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    user = db.relationship('User', foreign_keys=[user_id])
    tracker = db.relationship('DailyTracker', backref=db.backref('sessions', lazy=True, cascade="all, delete-orphan"))

    __table_args__ = (db.UniqueConstraint('tracker_id', 'session_number', name='uq_tracker_session_number'),)

    def to_dict(self):
        return {
            'id': self.id, 'user_id': self.user_id, 'tracker_id': self.tracker_id,
            'session_number': self.session_number,
            'intern_name': self.user.name if self.user else 'Unknown',
            'intern_email': self.user.email if self.user else '',
            'date': self.date.isoformat() if self.date else None,
            'trainer_name': self.trainer_name, 'technology_name': self.technology_name,
            'session_name': self.session_name, 'concepts_covered': self.concepts_covered,
            'duration_hrs': self.duration_hrs, 'update_text': self.update_text,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


session_concepts = db.Table('session_concepts',
    db.Column('session_id', db.Integer, db.ForeignKey('training_sessions.id'), primary_key=True),
    db.Column('concept_id', db.Integer, db.ForeignKey('training_concepts.id'), primary_key=True)
)


class TrainingSession(db.Model):
    __tablename__ = 'training_sessions'
    id = db.Column(db.Integer, primary_key=True)
    session_title = db.Column(db.String(150), nullable=False)
    trainer_name = db.Column(db.String(100), nullable=False)
    technology_name = db.Column(db.String(100), nullable=False)
    concepts = db.Column(db.Text, nullable=True)
    duration_hrs = db.Column(db.Float, default=2.0, nullable=False)
    date = db.Column(db.Date, default=date.today, nullable=False)
    status = db.Column(db.String(20), default='scheduled', nullable=False)
    practice_assignment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    concepts_normalized = db.relationship('TrainingConcept', secondary=session_concepts, backref=db.backref('sessions', lazy=True))

    def to_dict(self):
        return {
            'id': self.id, 'session_title': self.session_title,
            'trainer_name': self.trainer_name, 'technology_name': self.technology_name,
            'concepts': self.concepts, 'duration_hrs': self.duration_hrs,
            'date': self.date.isoformat() if self.date else None,
            'status': self.status,
            'practice_assignment': self.practice_assignment,
            'concepts_normalized': [c.to_dict() for c in self.concepts_normalized],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # None means broadcast to all
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }



class AssignedMeeting(db.Model):
    __tablename__ = 'assigned_meetings'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    time = db.Column(db.String(50), nullable=True) # e.g. "11:00 AM"
    date = db.Column(db.Date, default=date.today, nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='scheduled', nullable=False) # scheduled | completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'time': self.time,
            'date': self.date.isoformat() if self.date else None,
            'description': self.description,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# ─── NEW: Employee Daily Report ────────────────────────────────────────────────
class EmployeeDailyReport(db.Model):
    __tablename__ = 'employee_daily_reports'
    __table_args__ = (db.UniqueConstraint('user_id', 'date', name='uq_emp_report_user_date'),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=get_today_local)

    today_work = db.Column(db.Text, nullable=False, default='')
    what_learned = db.Column(db.Text, nullable=False, default='')
    daily_status = db.Column(db.String(20), nullable=False, default='not_started')
    # not_started | in_progress | completed | blocked
    overall_progress = db.Column(db.Integer, nullable=False, default=0)  # 0–100
    remarks = db.Column(db.Text, nullable=True)

    is_frozen = db.Column(db.Boolean, default=False, nullable=False)
    frozen_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = db.relationship('User', foreign_keys=[user_id])

    def check_and_freeze(self):
        """Auto-freeze if the report date is in the past."""
        today = get_today_local()
        if self.date < today and not self.is_frozen:
            self.is_frozen = True
            self.frozen_at = datetime.utcnow()

    def is_editable(self):
        today = get_today_local()
        return self.date == today and not self.is_frozen

    def to_dict(self):
        self.check_and_freeze()
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else 'Unknown',
            'user_email': self.user.email if self.user else '',
            'user_role': self.user.role if self.user else '',
            'department': self.user.department if self.user else '',
            'date': self.date.isoformat() if self.date else None,
            'today_work': self.today_work,
            'what_learned': self.what_learned,
            'daily_status': self.daily_status,
            'overall_progress': self.overall_progress,
            'remarks': self.remarks,
            'is_frozen': self.is_frozen,
            'frozen_at': self.frozen_at.isoformat() if self.frozen_at else None,
            'is_editable': self.is_editable(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


# ─── NEW: Intern Daily Report ──────────────────────────────────────────────────
class InternDailyReport(db.Model):
    __tablename__ = 'intern_daily_reports'
    __table_args__ = (db.UniqueConstraint('user_id', 'date', name='uq_intern_report_user_date'),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=get_today_local)

    # Training
    training_details = db.Column(db.Text, nullable=True, default='')
    training_status = db.Column(db.String(30), nullable=True, default='not_started')
    training_progress = db.Column(db.Integer, nullable=True, default=0)

    # Meeting
    meeting_details = db.Column(db.Text, nullable=True, default='')
    meeting_status = db.Column(db.String(30), nullable=True, default='not_started')
    meeting_notes = db.Column(db.Text, nullable=True, default='')

    # Practice
    practice_details = db.Column(db.Text, nullable=True, default='')
    practice_status = db.Column(db.String(30), nullable=True, default='not_started')
    practice_progress = db.Column(db.Integer, nullable=True, default=0)

    overall_status = db.Column(db.String(30), nullable=True, default='not_started')

    is_frozen = db.Column(db.Boolean, default=False, nullable=False)
    frozen_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = db.relationship('User', foreign_keys=[user_id])

    def check_and_freeze(self):
        today = get_today_local()
        if self.date < today and not self.is_frozen:
            self.is_frozen = True
            self.frozen_at = datetime.utcnow()

    def is_editable(self):
        today = get_today_local()
        return self.date == today and not self.is_frozen

    def compute_overall_status(self):
        statuses = [self.training_status, self.meeting_status, self.practice_status]
        if all(s == 'completed' for s in statuses):
            return 'completed'
        if any(s == 'blocked' for s in statuses):
            return 'blocked'
        if any(s in ('in_progress', 'completed') for s in statuses):
            return 'in_progress'
        return 'not_started'

    def to_dict(self):
        self.check_and_freeze()
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else 'Unknown',
            'user_email': self.user.email if self.user else '',
            'department': self.user.department if self.user else '',
            'date': self.date.isoformat() if self.date else None,
            'training_details': self.training_details,
            'training_status': self.training_status,
            'training_progress': self.training_progress,
            'meeting_details': self.meeting_details,
            'meeting_status': self.meeting_status,
            'meeting_notes': self.meeting_notes,
            'practice_details': self.practice_details,
            'practice_status': self.practice_status,
            'practice_progress': self.practice_progress,
            'overall_status': self.overall_status or self.compute_overall_status(),
            'is_frozen': self.is_frozen,
            'frozen_at': self.frozen_at.isoformat() if self.frozen_at else None,
            'is_editable': self.is_editable(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    user_name = db.Column(db.String(100), nullable=False)
    user_role = db.Column(db.String(20), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text, nullable=True)
    affected_record_id = db.Column(db.Integer, nullable=True)
    affected_table = db.Column(db.String(50), nullable=True)
    old_value = db.Column(db.Text, nullable=True)
    new_value = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(60), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user_name,
            'user_role': self.user_role,
            'action': self.action,
            'details': self.details,
            'affected_record_id': self.affected_record_id,
            'affected_table': self.affected_table,
            'old_value': self.old_value,
            'new_value': self.new_value,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(128), nullable=True, index=True)
    token_hash = db.Column(db.String(128), unique=True, nullable=True, index=True)
    used = db.Column(db.Boolean, default=False, nullable=False)
    used_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship('User', foreign_keys=[user_id])

    @staticmethod
    def hash_token(raw_token: str) -> str:
        """Compute SHA-256 hash of a raw token."""
        import hashlib
        return hashlib.sha256(raw_token.strip().encode('utf-8')).hexdigest()

    def is_valid(self) -> bool:
        """Checks if the token is unused and not expired."""
        return not self.used and self.expires_at > datetime.utcnow()

    def is_expired(self) -> bool:
        """Checks if the token has expired."""
        return self.expires_at <= datetime.utcnow()

    def is_already_used(self) -> bool:
        """Checks if the token has already been consumed."""
        return bool(self.used)

