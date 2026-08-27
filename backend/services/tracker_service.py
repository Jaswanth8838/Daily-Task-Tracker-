import os
from datetime import datetime, date, timedelta
import pytz
from app import db
from models import User, Intern, DailyTracker, DailyUpdate, TrackerAccessOverride, AuditLog


def get_today_local() -> date:
    tz_name = os.environ.get('APP_TIMEZONE', 'Asia/Kolkata')
    tz = pytz.timezone(tz_name)
    return datetime.now(tz).date()


def evaluate_intern_access(user: User) -> str:
    """
    Evaluates whether an intern's tracker submission access should be ACTIVE or BLOCKED.
    Auto-freezes historical trackers that were not submitted in time.
    """
    if user.role != 'intern':
        return 'ACTIVE'

    today = get_today_local()

    # 1. Fetch all trackers for this user
    trackers = DailyTracker.query.filter_by(user_id=user.id).all()
    tracker_by_date = {t.date: t for t in trackers}

    # 2. Auto-freeze past trackers that were left in draft
    past_unsubmitted_dates = []
    for t in trackers:
        if t.date < today and t.status in ('draft', 'missed'):
            t.status = 'frozen'
            past_unsubmitted_dates.append(t.date)

    # 3. Check for missed days between joining/creation date and yesterday
    start_date = user.created_at.date() if user.created_at else today
    intern_profile = Intern.query.filter_by(user_id=user.id).first()
    if intern_profile and intern_profile.joining_date:
        start_date = min(start_date, intern_profile.joining_date)

    # We only check up to 30 days in the past or back to start_date
    check_start = max(start_date, today - timedelta(days=30))
    curr_d = check_start
    while curr_d < today:
        t = tracker_by_date.get(curr_d)
        if not t:
            # Create a missed record
            missed_tracker = DailyTracker(
                user_id=user.id,
                date=curr_d,
                status='missed'
            )
            db.session.add(missed_tracker)
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
