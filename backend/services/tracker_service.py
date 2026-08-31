import os
from datetime import datetime, date, timedelta
import pytz
from flask import request
from app import db
from models import User, Intern, DailyTracker, DailyUpdate, TrackerAccessOverride, AuditLog, Notification


def get_today_local() -> date:
    # 1. Check Flask request header for test clock (development / test suite)
    try:
        if request:
            test_date_hdr = request.headers.get('X-Test-Date') or request.headers.get('X-Mock-Date')
            if test_date_hdr:
                try:
                    return datetime.strptime(test_date_hdr.strip(), '%Y-%m-%d').date()
                except ValueError:
                    pass
    except RuntimeError:
        pass

    # 2. Check environment variable for test clock
    env_mock = os.environ.get('TEST_MOCK_DATE')
    if env_mock:
        try:
            return datetime.strptime(env_mock.strip(), '%Y-%m-%d').date()
        except ValueError:
            pass

    tz_name = os.environ.get('APP_TIMEZONE', 'Asia/Kolkata')
    tz = pytz.timezone(tz_name)
    return datetime.now(tz).date()


def evaluate_intern_access(user: User) -> str:
    """
    Evaluates whether an intern's tracker submission access should be ACTIVE or BLOCKED.
    Auto-freezes historical trackers that were not submitted in time before 23:59:59 Asia/Kolkata.
    Generates HR notification and audit logs idempotently upon state transition.
    """
    if user.role != 'intern':
        return 'ACTIVE'

    today = get_today_local()

    # 1. Fetch all trackers for this user
    trackers = DailyTracker.query.filter_by(user_id=user.id).all()
    tracker_by_date = {t.date: t for t in trackers}

    # 2. Auto-freeze past trackers that were left in draft or missed
    past_unsubmitted_dates = []
    for t in trackers:
        if t.date < today:
            if t.status in ('draft', 'missed'):
                t.status = 'frozen'
            if t.status != 'submitted':
                past_unsubmitted_dates.append(t.date)

    # 3. Check for missing tracker rows between creation/joining date and yesterday
    start_date = user.created_at.date() if user.created_at else today
    intern_profile = Intern.query.filter_by(user_id=user.id).first()
    if intern_profile and intern_profile.joining_date:
        start_date = min(start_date, intern_profile.joining_date)

    # Check up to 30 days in the past
    check_start = max(start_date, today - timedelta(days=30))
    curr_d = check_start
    while curr_d < today:
        t = tracker_by_date.get(curr_d)
        if not t:
            # Create a missed/frozen record for past date
            missed_tracker = DailyTracker(
                user_id=user.id,
                date=curr_d,
                status='frozen'
            )
            db.session.add(missed_tracker)
            if curr_d not in past_unsubmitted_dates:
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
            TrackerAccessOverride.action == 'GRANT',
            TrackerAccessOverride.effective_from <= today
        ).order_by(TrackerAccessOverride.created_at.desc()).first()

        if active_grant and active_grant.created_at.date() >= latest_missed_date:
            user.tracker_access_status = 'ACTIVE'
        else:
            user.tracker_access_status = 'BLOCKED'

            # Generate HR notification & audit log idempotently
            date_str = latest_missed_date.strftime('%d-%b-%Y')
            emp_id_str = user.employee_id or (intern_profile.employee_id if intern_profile else None) or f"INT-{user.id:04d}"

            # Check existing HR notification using unique employee ID and missed date
            notif_title = 'Intern Daily Task Not Submitted'
            existing_notif = Notification.query.filter(
                Notification.title == notif_title,
                Notification.message.like(f"%{emp_id_str}%"),
                Notification.message.like(f"%{date_str}%")
            ).first()

            if not existing_notif:
                # Find HR user recipient
                hr_user = User.query.filter_by(role='hr', status='active').first()
                if not hr_user:
                    hr_user = User.query.filter_by(role='admin', status='active').first()
                
                notif_msg = f"{user.name} ({emp_id_str}) did not submit the daily task for {date_str} before the 11:59 PM deadline. The tracker has been frozen and the intern's tracker access has been blocked."
                
                new_notif = Notification(
                    user_id=hr_user.id if hr_user else None,
                    title=notif_title,
                    message=notif_msg,
                    is_read=False
                )
                db.session.add(new_notif)

            # Check existing audit log using unique user_id and missed date
            existing_audit = AuditLog.query.filter_by(
                user_id=user.id,
                action='TRACKER_FROZEN_BLOCKED'
            ).filter(AuditLog.details.like(f"%{date_str}%")).first()

            if not existing_audit:
                audit = AuditLog(
                    user_id=user.id,
                    user_name=user.name,
                    user_role='intern',
                    action='TRACKER_FROZEN_BLOCKED',
                    details=f"Daily task for {date_str} not submitted before deadline. Access BLOCKED."
                )
                db.session.add(audit)
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

    db.session.commit()
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
