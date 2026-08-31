#!/bin/bash
set -e

echo "==> Starting Task Tracker backend..."

echo "==> Ensuring all database tables exist..."
python -c "
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    try:
        db.session.execute(db.text('ALTER TABLE daily_updates ADD COLUMN IF NOT EXISTS session_number INTEGER;'))
        db.session.execute(db.text('ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS token_hash VARCHAR(128);'))
        db.session.execute(db.text('ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS used_at TIMESTAMP;'))
        db.session.commit()
    except Exception as e:
        db.session.rollback()
    print('  Tables OK')
"

echo "==> Ensuring initial HR account exists..."
python seed_data.py

echo "==> Starting Flask development server..."
exec flask run --host=0.0.0.0 --port=5000 --reload
