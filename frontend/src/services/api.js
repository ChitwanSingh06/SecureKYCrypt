import axios from 'axios';

// Use this exact URL - your backend is running on 5000
const API_BASE = 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.sessionId = null;
    }

    async startVerification(userData) {
        try {
            console.log('Sending to:', `${API_BASE}/verify/start`);
            const response = await axios.post(`${API_BASE}/verify/start`, userData);
            this.sessionId = response.data.session_id;
            return response.data;
        } catch (error) {
            console.error('Error starting verification:', error);
            throw error;
        }
    }

    async registerDevice(fingerprint) {
        try {
            const response = await axios.post(`${API_BASE}/verify/device`, {
                session_id: this.sessionId,
                ...fingerprint
            });
            return response.data;
        } catch (error) {
            console.error('Error registering device:', error);
            throw error;
        }
    }

    async trackBehavior(type, data) {
        try {
            const response = await axios.post(`${API_BASE}/verify/behavior`, {
                session_id: this.sessionId,
                type,
                ...data
            });
            return response.data;
        } catch (error) {
            console.error('Error tracking behavior:', error);
            // Don't throw - just log, so UI doesn't break
            return { status: 'error', message: error.message };
        }
    }

    async getRiskAssessment() {
        try {
            const response = await axios.post(`${API_BASE}/verify/risk`, {
                session_id: this.sessionId
            });
            return response.data;
        } catch (error) {
            console.error('Error getting risk assessment:', error);
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
            console.error('Error checking name match:', error);
            throw error;
        }
    }
}

export default new ApiService();