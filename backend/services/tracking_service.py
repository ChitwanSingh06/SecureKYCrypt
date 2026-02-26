import json
from datetime import datetime
import os

class TrackingService:
    def __init__(self):
        self.data_file = 'data/user_activity.json'
        self.load_data()
    
    def load_data(self):
        """Load user activity data"""
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r') as f:
                self.data = json.load(f)
        else:
            self.data = {
                'users': {},
                'sessions': {},
                'transactions': [],
                'suspicious_activity': []
            }
            self.save_data()
    
    def save_data(self):
        """Save user activity data"""
        with open(self.data_file, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def track_user_login(self, user_data, risk_score, risk_level, session_id):
        """Track user login"""
        mobile = user_data['mobile']
        
        if mobile not in self.data['users']:
            self.data['users'][mobile] = {
                'name': user_data['name'],
                'mobile': mobile,
                'email': user_data.get('email', ''),
                'created_at': datetime.now().isoformat(),
                'total_logins': 0,
                'total_suspicious_actions': 0,
                'risk_score': risk_score,
                'risk_level': risk_level,
                'transactions': [],
                'sessions': []
            }
        
        user = self.data['users'][mobile]
        user['total_logins'] += 1
        user['last_login'] = datetime.now().isoformat()
        user['risk_score'] = risk_score
        user['risk_level'] = risk_level
        
        # Create session
        self.data['sessions'][session_id] = {
            'user': mobile,
            'user_name': user['name'],
            'login_time': datetime.now().isoformat(),
            'risk_score': risk_score,
            'risk_level': risk_level,
            'actions': [],
            'transactions': [],
            'balance': 50000  # Starting balance
        }
        
        self.save_data()
        return session_id
    
    def track_transaction(self, session_id, transaction_data):
        """Track a transaction"""
        if session_id not in self.data['sessions']:
            return None
        
        session = self.data['sessions'][session_id]
        mobile = session['user']
        
        # Check if sufficient balance
        current_balance = session.get('balance', 50000)
        transaction_amount = transaction_data.get('amount', 0)
        
        if transaction_data['type'] == 'debit' and transaction_amount > current_balance:
            # Track failed transaction
            failed_txn = {
                'id': len(self.data['transactions']) + 1,
                'timestamp': datetime.now().isoformat(),
                'user': mobile,
                'user_name': session['user_name'],
                'type': 'debit',
                'amount': transaction_amount,
                'recipient': transaction_data.get('recipient', ''),
                'status': 'failed',
                'reason': 'insufficient_balance'
            }
            self.data['transactions'].append(failed_txn)
            
            # Log suspicious activity
            self.data['suspicious_activity'].append({
                'user': mobile,
                'user_name': session['user_name'],
                'timestamp': datetime.now().isoformat(),
                'reason': f'Failed transaction attempt: Insufficient balance for ₹{transaction_amount}',
                'details': failed_txn
            })
            
            self.save_data()
            return failed_txn
        
        # Process successful transaction
        transaction = {
            'id': len(self.data['transactions']) + 1,
            'timestamp': datetime.now().isoformat(),
            'user': mobile,
            'user_name': session['user_name'],
            'type': transaction_data['type'],
            'amount': transaction_amount,
            'recipient': transaction_data.get('recipient', ''),
            'status': 'completed'
        }
        
        # Update balance
        if transaction_data['type'] == 'debit':
            session['balance'] = current_balance - transaction_amount
        else:
            session['balance'] = current_balance + transaction_amount
        
        # Add to session
        session['transactions'].append(transaction)
        
        # Add to user
        if mobile in self.data['users']:
            self.data['users'][mobile]['transactions'].append(transaction)
        
        # Add to global transactions
        self.data['transactions'].append(transaction)
        
        # Check if this transaction is suspicious
        self.check_suspicious_activity(mobile, session, transaction)
        
        self.save_data()
        return transaction
    
    def track_action(self, session_id, action_data):
        """Track user action (clicks, navigation, etc.)"""
        if session_id not in self.data['sessions']:
            return
        
        session = self.data['sessions'][session_id]
        
        action = {
            'timestamp': datetime.now().isoformat(),
            'action': action_data['action'],
            'page': action_data.get('page', ''),
            'details': action_data.get('details', {})
        }
        
        session['actions'].append(action)
        
        # Check if action is suspicious
        self.check_suspicious_activity(session['user'], session, action)
        
        self.save_data()
    
    def check_suspicious_activity(self, mobile, session, item):
        """Check if activity is suspicious"""
        suspicious = False
        reason = ""
        
        # Check if new user making large transaction
        if item.get('type') == 'transaction' and item.get('amount', 0) > 10000:
            user = self.data['users'].get(mobile, {})
            if user.get('total_logins', 0) <= 2:
                suspicious = True
                reason = f"New user making large transaction of ₹{item['amount']}"
        
        # Check multiple failed attempts
        if item.get('action') == 'failed_transaction':
            recent_failures = [a for a in session['actions'] if a.get('action') == 'failed_transaction']
            if len(recent_failures) > 2:
                suspicious = True
                reason = "Multiple failed transaction attempts"
        
        # Check rapid transactions
        if item.get('type') == 'transaction':
            recent_txns = [t for t in session['transactions'] 
                          if (datetime.now() - datetime.fromisoformat(t['timestamp'])).total_seconds() < 60]
            if len(recent_txns) > 2:
                suspicious = True
                reason = f"Multiple rapid transactions: {len(recent_txns)} in 60 seconds"
        
        # Check if accessing suspicious pages
        if item.get('action') == 'page_view' and item.get('page') in ['admin', 'settings', 'hidden']:
            suspicious = True
            reason = f"Attempted to access {item['page']} page"
        
        # Check for honeypot triggers
        if item.get('action') == 'honeypot_trigger':
            suspicious = True
            reason = "Honeypot trap triggered"
        
        if suspicious:
            self.data['suspicious_activity'].append({
                'user': mobile,
                'user_name': session['user_name'],
                'timestamp': datetime.now().isoformat(),
                'reason': reason,
                'details': item
            })
            
            # Update user's suspicious count
            if mobile in self.data['users']:
                self.data['users'][mobile]['total_suspicious_actions'] = \
                    self.data['users'][mobile].get('total_suspicious_actions', 0) + 1
    
    def get_admin_dashboard_data(self):
        """Get all data for admin dashboard"""
        users_list = []
        for mobile, user in self.data['users'].items():
            # Get last session for this user
            last_session = None
            for sess_id, sess in self.data['sessions'].items():
                if sess['user'] == mobile:
                    last_session = sess
                    break
            
            users_list.append({
                'name': user['name'],
                'mobile': mobile,
                'email': user.get('email', ''),
                'risk_score': user.get('risk_score', 50),
                'risk_level': user.get('risk_level', 'MEDIUM'),
                'total_logins': user.get('total_logins', 0),
                'suspicious_actions': user.get('total_suspicious_actions', 0),
                'transaction_count': len(user.get('transactions', [])),
                'total_spent': sum(t.get('amount', 0) for t in user.get('transactions', []) if t.get('type') == 'debit'),
                'current_balance': last_session.get('balance', 50000) if last_session else 50000,
                'created_at': user.get('created_at', ''),
                'last_login': user.get('last_login', '')
            })
        
        # Sort by risk score (highest first)
        users_list.sort(key=lambda x: x['risk_score'], reverse=True)
        
        # Get recent suspicious activity
        recent_suspicious = sorted(
            self.data['suspicious_activity'],
            key=lambda x: x['timestamp'],
            reverse=True
        )[:20]
        
        # Get recent transactions
        recent_transactions = sorted(
            self.data['transactions'],
            key=lambda x: x['timestamp'],
            reverse=True
        )[:30]
        
        return {
            'users': users_list,
            'transactions': recent_transactions,
            'suspicious_activity': recent_suspicious,
            'active_sessions': len(self.data['sessions']),
            'stats': {
                'total_users': len(users_list),
                'high_risk_users': len([u for u in users_list if u['risk_score'] >= 70]),
                'total_transactions': len(self.data['transactions']),
                'total_suspicious': len(self.data['suspicious_activity'])
            }
        }

# Create global instance
tracking_service = TrackingService()