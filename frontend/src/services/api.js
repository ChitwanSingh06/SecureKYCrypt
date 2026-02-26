import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.sessionId = null;
    }

    async startVerification(userData) {
        try {
            const response = await axios.post(`${API_BASE}/verify/start`, userData);
            this.sessionId = response.data.session_id;
            return response.data;
        } catch (error) {
            console.error('Start verification error:', error);
            throw error;
        }
    }

    async checkNameMatch(mobile, name) {
        try {
            const response = await axios.post(`${API_BASE}/verify/name-check`, {
                mobile,
                name
            });
            return response.data;
        } catch (error) {
            console.error('Name check error:', error);
            // Return default for demo
            return {
                match: true,
                telecom_owner: name,
                sim_age_days: 365
            };
        }
    }

    async getRiskAssessment() {
        try {
            const response = await axios.post(`${API_BASE}/verify/risk`, {
                session_id: this.sessionId
            });
            return response.data;
        } catch (error) {
            console.error('Risk assessment error:', error);
            // Return default based on mobile
            const mobile = sessionStorage.getItem('userMobile');
            if (mobile === '8888888888') {
                return { risk_score: 85, risk_level: 'HIGH' };
            } else {
                return { risk_score: 20, risk_level: 'LOW' };
            }
        }
    }
}

export default new ApiService();