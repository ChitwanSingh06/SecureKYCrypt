import os
from datetime import timedelta

class Config:
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.environ.get('FLASK_DEBUG', True)
    
    # Session settings
    SESSION_TYPE = 'filesystem'
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=30)
    
    # Rate limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_DEFAULT = "100 per day"
    
    # Database settings (for production)
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/honeykyc')
    
    # Risk thresholds
    RISK_THRESHOLDS = {
        'LOW': 30,
        'MEDIUM': 60,
        'HIGH': 80,
        'CRITICAL': 100
    }
    
    # Honeypot settings
    HONEYPOT_ENABLED = True
    HONEYPOT_REDIRECT_URL = '/honeypot'