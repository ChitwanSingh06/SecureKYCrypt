from flask import Blueprint, request, jsonify, session
from datetime import datetime
import json
import uuid

honeypot_bp = Blueprint('honeypot', __name__, url_prefix='/api/honeypot')

# Store honeypot sessions
honeypot_sessions = {}

@honeypot_bp.route('/enter', methods=['POST'])
def enter_honeypot():
    """Log when user enters honeypot"""
    data = request.json
    session_id = data.get('session_id', str(uuid.uuid4()))
    
    honeypot_sessions[session_id] = {
        'entry_time': datetime.now().isoformat(),
        'ip_address': request.remote_addr,
        'user_agent': request.headers.get('User-Agent'),
        'actions': [],
        'fraud_score': 0
    }
    
    return jsonify({
        'session_id': session_id,
        'message': 'Welcome to verification sandbox',
        'fake_balance': '₹10,000',
        'fake_accounts': ['Savings ****1234', 'Current ****5678']
    })

@honeypot_bp.route('/track', methods=['POST'])
def track_honeypot_action():
    """Track user actions in honeypot"""
    data = request.json
    session_id = data.get('session_id')
    
    if session_id not in honeypot_sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    action = {
        'type': data.get('action_type'),
        'page': data.get('page'),
        'timestamp': datetime.now().isoformat(),
        'details': data.get('details', {})
    }
    
    honeypot_sessions[session_id]['actions'].append(action)
    
    # Calculate fraud score based on actions
    fraud_score = calculate_fraud_score(honeypot_sessions[session_id]['actions'])
    honeypot_sessions[session_id]['fraud_score'] = fraud_score
    
    # Check if fraudster is trying to do suspicious things
    if is_fraud_pattern_detected(honeypot_sessions[session_id]):
        return jsonify({
            'status': 'fraud_confirmed',
            'message': 'Suspicious activity detected',
            'redirect': '/blocked'
        })
    
    return jsonify({
        'status': 'tracked',
        'fraud_score': fraud_score
    })

@honeypot_bp.route('/fake-transfer', methods=['POST'])
def fake_transfer():
    """Fake money transfer in honeypot"""
    data = request.json
    session_id = data.get('session_id')
    
    if session_id not in honeypot_sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    # Log this as suspicious activity
    honeypot_sessions[session_id]['actions'].append({
        'type': 'transfer_attempt',
        'amount': data.get('amount'),
        'to_account': data.get('to_account'),
        'timestamp': datetime.now().isoformat()
    })
    
    # This is highly suspicious - fraudster trying to steal money
    return jsonify({
        'status': 'processing',
        'message': 'Transfer initiated (demo)',
        'transaction_id': f'TXN{datetime.now().strftime("%Y%m%d%H%M%S")}',
        'fake_success': True
    })

@honeypot_bp.route('/fake-balance', methods=['GET'])
def fake_balance():
    """Return fake balance"""
    session_id = request.args.get('session_id')
    
    if session_id not in honeypot_sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    # Return different fake balances to confuse fraudster
    import random
    fake_balances = [
        {'account': 'Savings ****1234', 'balance': f'₹{random.randint(5000, 50000)}'},
        {'account': 'Current ****5678', 'balance': f'₹{random.randint(10000, 100000)}'},
        {'account': 'FD ****9012', 'balance': f'₹{random.randint(100000, 500000)}'}
    ]
    
    return jsonify({
        'balances': fake_balances,
        'total_net_worth': f'₹{random.randint(200000, 1000000)}'
    })

@honeypot_bp.route('/fraud-report', methods=['POST'])
def generate_fraud_report():
    """Generate fraud report for bank"""
    session_id = request.json.get('session_id')
    
    if session_id not in honeypot_sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    session_data = honeypot_sessions[session_id]
    
    report = {
        'fraud_score': session_data['fraud_score'],
        'ip_address': session_data['ip_address'],
        'user_agent': session_data['user_agent'],
        'actions_taken': len(session_data['actions']),
        'suspicious_patterns': identify_suspicious_patterns(session_data['actions']),
        'recommendation': 'BLOCK_USER' if session_data['fraud_score'] > 70 else 'MONITOR',
        'timestamp': datetime.now().isoformat()
    }
    
    return jsonify(report)

def calculate_fraud_score(actions):
    """Calculate fraud score based on actions"""
    score = 0
    
    for action in actions:
        if action['type'] == 'transfer_attempt':
            score += 40
        elif action['type'] == 'view_balance':
            score += 5
        elif action['type'] == 'click_admin_link':
            score += 30
        elif action['type'] == 'multiple_login_attempts':
            score += 25
        elif action['type'] == 'page_scraping':
            score += 35
    
    return min(score, 100)

def is_fraud_pattern_detected(session):
    """Detect fraud patterns"""
    actions = session['actions']
    
    # Check for rapid succession of sensitive actions
    sensitive_actions = [a for a in actions if a['type'] in ['transfer_attempt', 'view_balance', 'click_admin_link']]
    
    if len(sensitive_actions) > 3:
        return True
    
    # Check for automation patterns
    timestamps = [a['timestamp'] for a in actions]
    if len(timestamps) > 5:
        # Calculate average time between actions
        from datetime import datetime
        times = [datetime.fromisoformat(t) for t in timestamps]
        intervals = [(times[i+1] - times[i]).total_seconds() for i in range(len(times)-1)]
        avg_interval = sum(intervals) / len(intervals)
        
        if avg_interval < 0.5:  # Less than 0.5 seconds between actions
            return True
    
    return False

def identify_suspicious_patterns(actions):
    """Identify specific suspicious patterns"""
    patterns = []
    
    action_types = [a['type'] for a in actions]
    
    if 'transfer_attempt' in action_types:
        patterns.append("Attempted unauthorized transfer")
    
    if action_types.count('view_balance') > 5:
        patterns.append("Excessive balance checking")
    
    if 'click_admin_link' in action_types:
        patterns.append("Attempted to access admin functions")
    
    return patterns