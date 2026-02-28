#!/usr/bin/env python3
"""
Production-ready application runner for ContentGenie
"""

import os
from app import create_app
from models import db

# Determine environment
env = os.environ.get('FLASK_ENV', 'development')

# Create app instance
app = create_app(env)

if __name__ == '__main__':
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
    
    # Run the application
    port = int(os.environ.get('PORT', 5001))
    debug = env == 'development'
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )