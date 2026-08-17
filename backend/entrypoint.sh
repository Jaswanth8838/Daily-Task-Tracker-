#!/bin/bash
set -e

echo "Waiting for database to be ready..."

# Flask-Migrate: init if first time, then upgrade
if [ ! -d "migrations" ]; then
    echo "Initializing Flask-Migrate..."
    flask db init
    flask db migrate -m "initial: users table"
fi

echo "Running database migrations..."
flask db upgrade

echo "Starting Flask..."
exec flask run --host=0.0.0.0 --port=5000 --reload
