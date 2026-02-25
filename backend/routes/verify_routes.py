from flask import Blueprint, request, jsonify, session
from services.risk_service import RiskService
from services.telecom_service import TelecomService
from services.ownership_service import OwnershipService
import uuid
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

verify_bp = Blueprint('verify', __name__)
risk_service = RiskService()
telecom_service = TelecomService()
ownership_service = OwnershipService()

# Store session data (in production, use database)
user_sessions = {}

@verify_bp.route('/api/verify/start', methods=['POST'])
def start_verification():
    """Initial verification step"""
    try:
        data = request.json
        if not data:
            logger.error("No data provided in request")
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        if 'name' not in data or 'mobile' not in data:
            logger.error("Missing required fields")
            return jsonify({'error': 'Name and mobile number are required'}), 400
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Store initial data
        user_sessions[session_id] = {
            'user_data': data,
            'device_data': {},
            'behavior_data': {
                'login_time_ms': 0,
                'pages_visited': [],
                'honeypot_clicked': False,
                'mouse_movements': 0,
                'copied_pasted': False,
                'login_start_time': datetime.now().isoformat()
            },
            'timestamp': datetime.now().isoformat(),
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent')
        }
        
        logger.info(f"Session created: {session_id} for user: {data.get('name')}, mobile: {data.get('mobile')}")
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'message': 'Verification started successfully'
        })
        
    except Exception as e:
        logger.error(f"Error in start_verification: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@verify_bp.route('/api/verify/device', methods=['POST'])
def register_device():
    """Register device fingerprint"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'Session ID required'}), 400
            
        if session_id not in user_sessions:
            logger.warning(f"Invalid session ID: {session_id}")
            return jsonify({'error': 'Invalid session'}), 400
        
        # Check if device is emulator
        user_agent = data.get('userAgent', '')
        platform = data.get('platform', '')
        
        is_emulator = False
        if 'android' in user_agent.lower() and 'linux' in platform.lower():
            is_emulator = True
        
        # Check if new device (in production, check against database)
        is_new_device = True  # Simplified for demo
        
        # Store device data
        user_sessions[session_id]['device_data'] = {
            'fingerprint': data.get('fingerprint', 'unknown'),
            'userAgent': user_agent,
            'platform': platform,
            'screenResolution': data.get('screenResolution'),
            'language': data.get('language'),
            'timezone': data.get('timezone'),
            'is_emulator': is_emulator,
            'is_new_device': is_new_device,
            'vpn_detected': data.get('vpn_detected', False),
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Device registered for session: {session_id}")
        
        return jsonify({
            'success': True,
            'status': 'registered'
        })
        
    except Exception as e:
        logger.error(f"Error in register_device: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@verify_bp.route('/api/verify/behavior', methods=['POST'])
def track_behavior():
    """Track user behavior"""
    try:
        data = request.json
        if not data:
            logger.error("No data provided in behavior tracking")
            return jsonify({'error': 'No data provided'}), 400
            
        session_id = data.get('session_id')
        
        if not session_id:
            logger.error("No session ID provided")
            return jsonify({'error': 'Session ID required'}), 400
            
        if session_id not in user_sessions:
            logger.warning(f"Invalid session ID in behavior tracking: {session_id}")
            return jsonify({'error': 'Invalid session'}), 400
        
        # Get behavior data
        behavior = user_sessions[session_id]['behavior_data']
        behavior_type = data.get('type')
        
        if not behavior_type:
            return jsonify({'error': 'Behavior type required'}), 400
        
        logger.info(f"Tracking behavior: {behavior_type} for session: {session_id}")
        
        # Handle different behavior types
        if behavior_type == 'login_speed':
            behavior['login_time_ms'] = data.get('duration', 0)
            
        elif behavior_type == 'page_view':
            if 'pages_visited' not in behavior:
                behavior['pages_visited'] = []
            behavior['pages_visited'].append({
                'page': data.get('page'),
                'timestamp': datetime.now().isoformat()
            })
            
            # Calculate pages per minute
            if len(behavior['pages_visited']) > 1:
                first_time = datetime.fromisoformat(behavior['pages_visited'][0]['timestamp'])
                last_time = datetime.now()
                minutes = (last_time - first_time).total_seconds() / 60
                if minutes > 0:
                    behavior['pages_visited_per_minute'] = len(behavior['pages_visited']) / minutes
            
        elif behavior_type == 'honeypot_click':
            behavior['honeypot_clicked'] = True
            behavior['honeypot_element'] = data.get('element', 'unknown')
            
            logger.warning(f"HONEYPOT TRIGGERED for session: {session_id}")
            
            # IMMEDIATE FRAUD DETECTION
            try:
                risk_result = risk_service.calculate_risk_score(
                    user_sessions[session_id]['user_data'],
                    user_sessions[session_id]['device_data'],
                    behavior
                )
                
                return jsonify({
                    'status': 'fraud_detected',
                    'risk_result': risk_result,
                    'redirect': '/honeypot',
                    'message': 'Suspicious activity detected'
                })
            except Exception as e:
                logger.error(f"Error calculating risk for honeypot: {str(e)}")
                return jsonify({
                    'status': 'fraud_detected',
                    'redirect': '/honeypot'
                })
            
        elif behavior_type == 'mouse_movement':
            behavior['mouse_movements'] = behavior.get('mouse_movements', 0) + 1
            
        elif behavior_type == 'copy_paste':
            behavior['copied_pasted'] = True
            
        elif behavior_type == 'login_attempt':
            behavior['login_attempts'] = behavior.get('login_attempts', 0) + 1
            
        elif behavior_type == 'tab_switch':
            behavior['tab_switches'] = behavior.get('tab_switches', 0) + 1
            
        elif behavior_type == 'dev_tools_detected':
            behavior['dev_tools_opened'] = True
            logger.warning(f"Dev tools detected for session: {session_id}")
            
        elif behavior_type == 'automation_detected':
            behavior['automation_detected'] = True
            logger.warning(f"Automation tool detected for session: {session_id}")
            
        elif behavior_type == 'scroll_behavior':
            behavior['scroll_count'] = behavior.get('scroll_count', 0) + 1
            
        else:
            logger.warning(f"Unknown behavior type: {behavior_type}")
            return jsonify({'error': 'Unknown behavior type'}), 400
        
        return jsonify({
            'success': True,
            'status': 'tracked',
            'behavior_type': behavior_type
        })
        
    except Exception as e:
        logger.error(f"Error in track_behavior: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@verify_bp.route('/api/verify/risk', methods=['POST'])
def get_risk_assessment():
    """Get final risk assessment"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'Session ID required'}), 400
            
        if session_id not in user_sessions:
            logger.warning(f"Invalid session ID for risk assessment: {session_id}")
            return jsonify({'error': 'Invalid session'}), 400
        
        session_data = user_sessions[session_id]
        
        # Calculate risk
        risk_result = risk_service.calculate_risk_score(
            session_data['user_data'],
            session_data['device_data'],
            session_data['behavior_data']
        )
        
        # Add session info
        risk_result['session_id'] = session_id
        risk_result['verification_time'] = datetime.now().isoformat()
        
        logger.info(f"Risk assessment for session {session_id}: {risk_result['risk_level']} (score: {risk_result['risk_score']})")
        
        return jsonify(risk_result)
        
    except Exception as e:
        logger.error(f"Error in get_risk_assessment: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@verify_bp.route('/api/verify/name-check', methods=['POST'])
def check_name_match():
    """Check if name matches telecom owner"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        mobile = data.get('mobile')
        name = data.get('name')
        
        if not mobile or not name:
            return jsonify({'error': 'Mobile number and name are required'}), 400
        
        # Validate mobile number format
        if not mobile.isdigit() or len(mobile) != 10:
            return jsonify({'error': 'Invalid mobile number format'}), 400
        
        # Use ownership service for verification
        result = ownership_service.verify_ownership(mobile, name)
        
        # Add telecom service result as backup
        telecom_result = telecom_service.verify_owner(mobile, name)
        
        # Combine results
        response = {
            'verified': result.get('verified', False),
            'match': result.get('verified', False),
            'confidence_score': result.get('confidence_score', 0),
            'telecom_owner': result.get('owner_name', telecom_result.get('telecom_owner', 'Unknown')),
            'sim_age_days': telecom_result.get('sim_age_days', 0),
            'sim_age_category': telecom_result.get('sim_age_category', 'unknown'),
            'provider': telecom_result.get('provider', 'Unknown'),
            'risk_factors': result.get('risk_factors', []),
            'verification_methods': result.get('verification_methods', []),
            'requires_manual_review': result.get('requires_manual_review', False)
        }
        
        logger.info(f"Name check for {mobile}: {'Match' if response['match'] else 'Mismatch'}")
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in check_name_match: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@verify_bp.route('/api/verify/session/<session_id>', methods=['GET'])
def get_session_info(session_id):
    """Get session information (for debugging)"""
    try:
        if session_id not in user_sessions:
            return jsonify({'error': 'Session not found'}), 404
        
        session_data = user_sessions[session_id].copy()
        
        # Don't send sensitive data
        if 'user_data' in session_data:
            session_data['user_data'] = {
                'name': session_data['user_data'].get('name'),
                'mobile': session_data['user_data'].get('mobile')[:4] + '****' + session_data['user_data'].get('mobile')[-2:] if session_data['user_data'].get('mobile') else None
            }
        
        return jsonify(session_data)
        
    except Exception as e:
        logger.error(f"Error in get_session_info: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@verify_bp.route('/api/verify/clear-session', methods=['POST'])
def clear_session():
    """Clear session data (for testing)"""
    try:
        data = request.json
        session_id = data.get('session_id')
        
        if session_id and session_id in user_sessions:
            del user_sessions[session_id]
            logger.info(f"Session cleared: {session_id}")
            return jsonify({'success': True, 'message': 'Session cleared'})
        
        return jsonify({'success': False, 'message': 'Session not found'})
        
    except Exception as e:
        logger.error(f"Error in clear_session: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Error handlers
@verify_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@verify_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method not allowed'}), 405

@verify_bp.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500