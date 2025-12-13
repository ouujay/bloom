#!/bin/bash

# Azure Web App Startup Script for Bloom Backend

echo "=== Starting Bloom Backend ==="

# Navigate to the app directory
cd /home/site/wwwroot

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate --noinput

# Seed demo data (only creates if not exists)
python manage.py seed_all

# Collect static files
python manage.py collectstatic --noinput

# Start gunicorn
gunicorn mamalert.wsgi:application --bind 0.0.0.0:8000 --workers 2
