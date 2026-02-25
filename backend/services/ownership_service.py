import json
from datetime import datetime
from utils.helpers import calculate_sim_risk, mask_sensitive_data

class OwnershipService:
    def __init__(self):
        with open('data/telecom_mock_data.json', 'r') as f:
            self.telecom_data = json.load(f)
    
    def verify_ownership(self, mobile_number, submitted_name, device_data=None):
        """
        Verify if the submitted name matches the real owner of the mobile number
        This is the core solution for Problem Statement 3
        """
        result = {
            'verified': False,
            'confidence_score': 0,
            'owner_name': None,
            'risk_factors': [],
            'verification_methods': [],
            'timestamp': datetime.now().isoformat()
        }
        
        # Check if mobile number exists in telecom database
        if mobile_number not in self.telecom_data:
            result['risk_factors'].append('Mobile number not found in telecom database')
            result['confidence_score'] = 0
            return result
        
        telecom_record = self.telecom_data[mobile_number]
        telecom_owner = telecom_record['owner_name']
        result['owner_name'] = telecom_owner
        
        # METHOD 1: Direct name match (Primary verification)
        name_match = self._compare_names(submitted_name, telecom_owner)
        
        if name_match['exact_match']:
            result['verification_methods'].append({
                'method': 'direct_name_match',
                'status': 'passed',
                'score': 40,
                'details': 'Name exactly matches telecom records'
            })
            result['confidence_score'] += 40
        elif name_match['partial_match']:
            result['verification_methods'].append({
                'method': 'direct_name_match',
                'status': 'partial',
                'score': 20,
                'details': f'Partial match: Telecom has "{telecom_owner}", you entered "{submitted_name}"'
            })
            result['confidence_score'] += 20
            result['risk_factors'].append('Name mismatch with telecom records')
        else:
            result['verification_methods'].append({
                'method': 'direct_name_match',
                'status': 'failed',
                'score': 0,
                'details': f'Name mismatch: Telecom owner is "{telecom_owner}"'
            })
            result['risk_factors'].append(f'Name mismatch: Should be "{telecom_owner}"')
        
        # METHOD 2: SIM age analysis
        sim_risk = calculate_sim_risk(telecom_record['activation_date'])
        if sim_risk['score'] == 0:
            result['verification_methods'].append({
                'method': 'sim_age_analysis',
                'status': 'passed',
                'score': 15,
                'details': 'SIM is well-established'
            })
            result['confidence_score'] += 15
        elif sim_risk['score'] < 20:
            result['verification_methods'].append({
                'method': 'sim_age_analysis',
                'status': 'warning',
                'score': 10,
                'details': sim_risk['reason']
            })
            result['confidence_score'] += 10
        else:
            result['verification_methods'].append({
                'method': 'sim_age_analysis',
                'status': 'failed',
                'score': 0,
                'details': sim_risk['reason']
            })
            result['risk_factors'].append(sim_risk['reason'])
        
        # METHOD 3: KYC status check
        if telecom_record.get('kyc_status') == 'verified':
            result['verification_methods'].append({
                'method': 'kyc_status',
                'status': 'passed',
                'score': 20,
                'details': 'Mobile number has completed KYC'
            })
            result['confidence_score'] += 20
        else:
            result['risk_factors'].append('Mobile number has incomplete KYC')
        
        # METHOD 4: Aadhar/PAN linkage
        if telecom_record.get('aadhar_linked') and telecom_record.get('pan_linked'):
            result['verification_methods'].append({
                'method': 'identity_linkage',
                'status': 'passed',
                'score': 15,
                'details': 'Aadhar and PAN linked to mobile'
            })
            result['confidence_score'] += 15
        elif telecom_record.get('aadhar_linked') or telecom_record.get('pan_linked'):
            result['verification_methods'].append({
                'method': 'identity_linkage',
                'status': 'partial',
                'score': 5,
                'details': 'Partial identity linkage'
            })
            result['confidence_score'] += 5
        
        # METHOD 5: Device consistency (if device data provided)
        if device_data:
            device_score = self._check_device_consistency(mobile_number, device_data)
            result['verification_methods'].append({
                'method': 'device_consistency',
                'status': 'passed' if device_score > 0 else 'failed',
                'score': device_score,
                'details': 'Device fingerprint analysis'
            })
            result['confidence_score'] += device_score
        
        # Final verification decision
        result['verified'] = result['confidence_score'] >= 60
        result['requires_manual_review'] = 40 <= result['confidence_score'] < 60
        
        return result
    
    def _compare_names(self, submitted_name, telecom_owner):
        """Compare names with fuzzy matching"""
        if not submitted_name or not telecom_owner:
            return {'exact_match': False, 'partial_match': False}
        
        # Normalize names
        submitted = submitted_name.lower().strip()
        owner = telecom_owner.lower().strip()
        
        # Exact match
        if submitted == owner:
            return {'exact_match': True, 'partial_match': True}
        
        # Check if one is subset of the other
        submitted_parts = set(submitted.split())
        owner_parts = set(owner.split())
        
        common_parts = submitted_parts.intersection(owner_parts)
        
        if len(common_parts) > 0:
            return {'exact_match': False, 'partial_match': True}
        
        return {'exact_match': False, 'partial_match': False}
    
    def _check_device_consistency(self, mobile_number, device_data):
        """Check if device has been used with this number before"""
        # In production, query database for historical device data
        # For hackathon, simulate based on device age
        
        score = 0
        
        if device_data.get('is_emulator'):
            return 0  # Emulators are suspicious
        
        if not device_data.get('is_new_device'):
            score += 10  # Established device
        
        if not device_data.get('vpn_detected'):
            score += 5  # No VPN is good
        
        return score
    
    def get_owner_details(self, mobile_number):
        """Get owner details from telecom database"""
        if mobile_number not in self.telecom_data:
            return None
        
        record = self.telecom_data[mobile_number].copy()
        # Mask sensitive data for logging
        return mask_sensitive_data(record)
    
    def get_verification_history(self, mobile_number):
        """Get verification history for a mobile number"""
        # In production, query database
        # For hackathon, return mock data
        return {
            'mobile_number': mobile_number,
            'total_verifications': 3,
            'last_verification': '2026-02-24T10:30:00',
            'verification_success_rate': '66%',
            'suspicious_attempts': 1
        }