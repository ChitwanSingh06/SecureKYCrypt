import json
from datetime import datetime

class TelecomService:
    def __init__(self):
        with open('data/telecom_mock_data.json', 'r') as f:
            self.telecom_data = json.load(f)
    
    def verify_owner(self, mobile_number, submitted_name):
        """Verify if the submitted name matches the telecom owner"""
        
        if mobile_number not in self.telecom_data:
            return {
                'verified': False,
                'match': False,
                'message': 'Mobile number not found in database',
                'risk_score': 50
            }
        
        record = self.telecom_data[mobile_number]
        telecom_owner = record['owner_name']
        
        # Check if names match (case-insensitive)
        name_match = telecom_owner.lower() == submitted_name.lower()
        
        # Calculate SIM age
        activation_date = datetime.strptime(record['activation_date'], '%Y-%m-%d')
        sim_age_days = (datetime.now() - activation_date).days
        
        risk_score = 0
        if not name_match:
            risk_score = 80
        elif sim_age_days < 30:
            risk_score = 40
        elif sim_age_days < 90:
            risk_score = 20
        else:
            risk_score = 10
        
        return {
            'verified': name_match,
            'match': name_match,
            'telecom_owner': telecom_owner,
            'sim_age_days': sim_age_days,
            'sim_age_category': self._get_age_category(sim_age_days),
            'provider': record['provider'],
            'risk_score': risk_score,
            'message': 'Name matches' if name_match else 'Name mismatch detected'
        }
    
    def _get_age_category(self, days):
        if days < 30:
            return 'new'
        elif days < 180:
            return 'medium'
        else:
            return 'established'