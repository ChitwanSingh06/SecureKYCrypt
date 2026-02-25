import hashlib
import json
import re
from datetime import datetime
import random
import string

def generate_session_id():
    """Generate unique session ID"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_str = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    return f"{timestamp}_{random_str}"

def hash_fingerprint(fingerprint_data):
    """Create hash of device fingerprint"""
    if isinstance(fingerprint_data, dict):
        fingerprint_str = json.dumps(fingerprint_data, sort_keys=True)
    else:
        fingerprint_str = str(fingerprint_data)
    
    return hashlib.sha256(fingerprint_str.encode()).hexdigest()

def validate_mobile_number(mobile):
    """Validate Indian mobile number"""
    pattern = r'^[6-9]\d{9}$'
    return bool(re.match(pattern, mobile))

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def calculate_sim_risk(activation_date):
    """Calculate risk based on SIM age"""
    if isinstance(activation_date, str):
        activation_date = datetime.strptime(activation_date, '%Y-%m-%d')
    
    days_active = (datetime.now() - activation_date).days
    
    if days_active < 30:
        return {'risk': 'HIGH', 'score': 40, 'reason': 'SIM activated recently'}
    elif days_active < 90:
        return {'risk': 'MEDIUM', 'score': 20, 'reason': 'SIM less than 3 months old'}
    elif days_active < 365:
        return {'risk': 'LOW', 'score': 10, 'reason': 'SIM less than 1 year old'}
    else:
        return {'risk': 'VERY_LOW', 'score': 0, 'reason': 'Established SIM'}

def mask_sensitive_data(data):
    """Mask sensitive information for logging"""
    masked = data.copy()
    
    if 'mobile' in masked:
        masked['mobile'] = masked['mobile'][:2] + '****' + masked['mobile'][-2:]
    
    if 'email' in masked:
        email_parts = masked['email'].split('@')
        if len(email_parts) == 2:
            masked['email'] = email_parts[0][:2] + '***@' + email_parts[1]
    
    if 'name' in masked:
        name_parts = masked['name'].split()
        masked['name'] = ' '.join([p[0] + '***' for p in name_parts])
    
    return masked

def calculate_confidence_score(risk_score):
    """Convert risk score to confidence score"""
    # Lower risk = higher confidence
    confidence = max(0, 100 - risk_score)
    return confidence

def format_currency(amount):
    """Format amount in Indian currency format"""
    if amount < 0:
        return f"-₹{format_currency(abs(amount))}"
    
    s = str(amount)
    if len(s) > 3:
        last_three = s[-3:]
        rest = s[:-3]
        rest = rest[::-1]
        rest = ','.join(rest[i:i+2] for i in range(0, len(rest), 2))
        rest = rest[::-1]
        return f"₹{rest},{last_three}"
    else:
        return f"₹{s}"

def detect_vpn(ip_address):
    """Simplified VPN detection"""
    # In production, use VPN detection APIs
    # This is a mock function for demo
    vpn_ips = ['103.0.0.0', '104.0.0.0', '105.0.0.0']
    return ip_address.startswith(tuple(vpn_ips[:2]))

def get_location_from_ip(ip_address):
    """Get location from IP (mock)"""
    # In production, use IP geolocation API
    locations = {
        '127.0.0.1': 'Localhost',
        '192.168.': 'Local Network',
    }
    
    for ip_prefix, location in locations.items():
        if ip_address.startswith(ip_prefix):
            return location
    
    return 'Unknown Location'

def log_fraud_attempt(user_data, risk_score, reason):
    """Log fraud attempt for analysis"""
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'user_data': mask_sensitive_data(user_data),
        'risk_score': risk_score,
        'reason': reason,
        'action': 'BLOCKED'
    }
    
    # In production, write to database or log file
    with open('fraud_logs.json', 'a') as f:
        f.write(json.dumps(log_entry) + '\n')
    
    return log_entry