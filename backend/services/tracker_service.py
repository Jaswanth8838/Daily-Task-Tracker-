import os
from datetime import datetime, date, time, timedelta
import pytz
from flask import has_request_context, request, g
from app import db
from models import User, Intern, DailyTracker, DailyUpdate, TrackerAccessOverride, AuditLog, Notification


def get_now_local() -> datetime:
    """
    Returns the current local datetime in the configured timezone (Asia/Kolkata).
    Supports test clock injection via X-Test-Time header, g.test_now, or TEST_CURRENT_TIME environment variable.
    """
    tz_name = os.environ.get('APP_TIMEZONE', 'Asia/Kolkata')
    tz = pytz.timezone(tz_name)

    # 1. Check Flask g context
    if has_request_context() and hasattr(g, 'test_now') and g.test_now:
        test_val = g.test_now
        if isinstance(test_val, str):
            parsed = datetime.fromisoformat(test_val)
            return tz.localize(parsed) if parsed.tzinfo is None else parsed.astimezone(tz)
        if isinstance(test_val, datetime):
            return tz.localize(test_val) if test_val.tzinfo is None else test_val.astimezone(tz)

    # 2. Check HTTP Request Header (for automated testing)
    if has_request_context():
        header_time = request.headers.get('X-Test-Time') or request.headers.get('X-Test-Date') or request.headers.get('X-Mock-Date')
        if header_time:
            try:
                parsed = datetime.fromisoformat(header_time.strip())
                return tz.localize(parsed) if parsed.tzinfo is None else parsed.astimezone(tz)
            except Exception:
                pass

    # 3. Check environment variable
    env_time = os.environ.get('TEST_CURRENT_TIME') or os.environ.get('TEST_MOCK_DATE')
    if env_time:
        try:
            parsed = datetime.fromisoformat(env_time.strip())
            return tz.localize(parsed) if parsed.tzinfo is None else parsed.astimezone(tz)
        except Exception:
            pass

    return datetime.now(tz)


def get_today_local() -> date:
    """Returns today's date in Asia/Kolkata timezone."""
    return get_now_local().date()


def get_hr_recipients():
    """Resolves HR users to receive missed task notifications."""
    hr_users = User.query.filter_by(role='hr', status='active').all()
    if not hr_users:
        # Fallback to configured HR email
        hr_email = os.environ.get('INITIAL_HR_EMAIL', 'stirunamala@wscs.ai')
        hr_users = User.query.filter_by(email=hr_email).all()
    if not hr_users:
        # Fallback to admin users
        hr_users = User.query.filter_by(role='admin', status='active').all()
    return hr_users


def send_freeze_hr_notification(intern: User, missed_date: date):
    """
    Creates an idempotent HR notification when an intern's tracker is frozen due to missed deadline.
    """
    intern_profile = Intern.query.filter_by(user_id=intern.id).first()
    emp_id = intern.employee_id or (intern_profile.employee_id if intern_profile else None) or f"INT-{intern.id:04d}"
    formatted_date = missed_date.strftime('%d-%b-%Y')

    title = "Intern Daily Task Not Submitted"
    message = (
        f"{intern.name} ({emp_id}) did not submit the daily task for "
        f"{formatted_date} before the 11:59 PM deadline. "
        f"The tracker has been frozen and the intern's tracker access has been blocked."
    )

    hr_users = get_hr_recipients()
    for hr in hr_users:
        # Check idempotency: avoid duplicate notification for same intern, date, and HR recipient
        existing = Notification.query.filter(
            Notification.user_id == hr.id,
            Notification.title == title,
            Notification.message.like(f"%{formatted_date}%"),
            Notification.message.like(f"%{intern.name}%")
        ).first()

        if not existing:
            notif = Notification(
                user_id=hr.id,
                title=title,
                message=message,
                is_read=False
            )
            db.session.add(notif)


def send_freeze_intern_notification(intern: User, missed_date: date):
    """
    Creates an idempotent notification to the intern when their daily tracker is frozen.
    """
    formatted_date = missed_date.strftime('%d-%b-%Y')
    title = "Daily Task Tracker Frozen - Access Blocked"
    message = (
        f"Your Daily Task Tracker for {formatted_date} was not submitted before the 11:59:59 PM deadline. "
        f"The tracker has been automatically frozen and your submission access is currently BLOCKED. "
        f"Please submit an Access Request from your dashboard or contact HR to request an access override."
    )

    existing = Notification.query.filter(
        Notification.user_id == intern.id,
        Notification.title == title,
        Notification.message.like(f"%{formatted_date}%")
    ).first()

    if not existing:
        notif = Notification(
            user_id=intern.id,
            title=title,
            message=message,
            is_read=False
        )
        db.session.add(notif)


def log_freeze_audit_event(intern: User, missed_date: date):
    """
    Creates an idempotent AuditLog entry for the auto-freeze transition.
    """
    action = 'AUTO_FREEZE_MISSED_TRACKER'
    details = (
        f"Auto-froze tracker for {intern.name} ({intern.email}) for date "
        f"{missed_date.isoformat()} due to missed 11:59:59 PM deadline. "
        f"Tracker access status set to BLOCKED."
    )

    existing = AuditLog.query.filter(
        AuditLog.action == action,
        AuditLog.user_id == intern.id,
        AuditLog.details.like(f"%{missed_date.isoformat()}%")
    ).first()

    if not existing:
        log = AuditLog(
            user_id=intern.id,
            user_name=intern.name,
            user_role=intern.role,
            action=action,
            affected_record_id=intern.id,
            affected_table='daily_trackers',
            details=details
        )
        db.session.add(log)


def evaluate_intern_access(user: User) -> str:
    """
    Evaluates whether an intern's tracker submission access should be ACTIVE or BLOCKED.
    Auto-freezes historical trackers that were not submitted before the 23:59:59 cutoff of that calendar date.
    Generates HR notification, Intern notification, and audit logs idempotently on freeze transition.
    """
    if user.role != 'intern':
        return 'ACTIVE'

    today = get_today_local()

    # 1. Fetch all trackers for this user
    trackers = DailyTracker.query.filter_by(user_id=user.id).all()
    tracker_by_date = {t.date: t for t in trackers}

    # 2. Auto-freeze past trackers that were left in draft or incomplete
    past_unsubmitted_dates = []
    for t in trackers:
        if t.date < today:
            if t.status in ('draft', 'missed'):
                t.status = 'frozen'
                # Also ensure associated sessions are locked
                for s in t.sessions:
                    if s.status == 'draft':
                        s.status = 'locked'
                past_unsubmitted_dates.append(t.date)
            elif t.status == 'frozen':
                past_unsubmitted_dates.append(t.date)

    # 3. Check for missed days between joining/creation date and yesterday
    start_date = user.created_at.date() if user.created_at else today
    intern_profile = Intern.query.filter_by(user_id=user.id).first()
    if intern_profile and intern_profile.joining_date:
        start_date = min(start_date, intern_profile.joining_date)

    # We check up to 30 days in the past or back to start_date
    check_start = max(start_date, today - timedelta(days=30))
    curr_d = check_start
    while curr_d < today:
        t = tracker_by_date.get(curr_d)
        if not t:
            # Create a frozen record for the missed date
            missed_tracker = DailyTracker(
                user_id=user.id,
                date=curr_d,
                status='frozen'
            )
            db.session.add(missed_tracker)
            tracker_by_date[curr_d] = missed_tracker
            past_unsubmitted_dates.append(curr_d)
        elif t.status != 'submitted':
            if curr_d not in past_unsubmitted_dates:
                past_unsubmitted_dates.append(curr_d)
        curr_d += timedelta(days=1)

    # 4. Check for active admin overrides
    if past_unsubmitted_dates:
        latest_missed_date = max(past_unsubmitted_dates)
        # Check if there is a GRANT override created on or after the latest missed event
        active_grant = TrackerAccessOverride.query.filter(
            TrackerAccessOverride.intern_id == user.id,
            TrackerAccessOverride.action == 'GRANT'
        ).order_by(TrackerAccessOverride.created_at.desc()).first()

        # A GRANT is valid if it was granted on or after the day following the latest missed date
        # (i.e. granted after the missed date had concluded and frozen)
        grant_date = active_grant.created_at.date() if active_grant else None
        if active_grant and grant_date and grant_date >= latest_missed_date:
            user.tracker_access_status = 'ACTIVE'
        else:
            previous_status = user.tracker_access_status
            user.tracker_access_status = 'BLOCKED'
            # Trigger HR and Intern notifications and audit log for the latest missed date
            send_freeze_hr_notification(user, latest_missed_date)
            send_freeze_intern_notification(user, latest_missed_date)
            log_freeze_audit_event(user, latest_missed_date)
    else:
        # Check if explicitly revoked by admin
        active_revoke = TrackerAccessOverride.query.filter(
            TrackerAccessOverride.intern_id == user.id,
            TrackerAccessOverride.action == 'REVOKE'
        ).order_by(TrackerAccessOverride.created_at.desc()).first()

        if active_revoke:
            user.tracker_access_status = 'BLOCKED'
        else:
            user.tracker_access_status = 'ACTIVE'

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

    return user.tracker_access_status


def get_or_create_today_tracker(user_id: int) -> DailyTracker:
    today = get_today_local()
    tracker = DailyTracker.query.filter_by(user_id=user_id, date=today).first()
    if not tracker:
        tracker = DailyTracker(
            user_id=user_id,
            date=today,
            status='draft'
        )
        db.session.add(tracker)
        db.session.commit()
    return tracker
