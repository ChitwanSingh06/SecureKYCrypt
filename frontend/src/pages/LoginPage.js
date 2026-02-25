import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import deviceFingerprint from '../utils/deviceFingerprint';
// import BehaviorTracker from '../utils/behaviorTracker';  // COMMENT THIS OUT

function LoginPage() {
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    // const [behaviorTracker, setBehaviorTracker] = useState(null);  // COMMENT THIS OUT

    useEffect(() => {
        // COMMENT OUT ALL THIS
        // const tracker = new BehaviorTracker(apiService);
        // tracker.setupHoneypot();
        // setBehaviorTracker(tracker);
        // tracker.trackLoginSpeed();
        
        console.log('Login page loaded (tracking disabled)');
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // COMMENT THIS OUT
            // if (behaviorTracker) {
            //     behaviorTracker.trackLoginComplete();
            // }

            // Start verification
            await apiService.startVerification(formData);

            // Check name match with telecom database
            const nameCheck = await apiService.checkNameMatch(
                formData.mobile,
                formData.name
            );

            // Generate device fingerprint
            const fingerprint = await deviceFingerprint.generate();
            await apiService.registerDevice(fingerprint);

            // Get final risk assessment
            const risk = await apiService.getRiskAssessment();

            setVerificationResult({
                nameCheck,
                risk
            });

            // Redirect based on risk
            if (risk.risk_level === 'HIGH' || risk.risk_level === 'CRITICAL') {
                setTimeout(() => {
                    window.location.href = '/honeypot';
                }, 2000);
            } else {
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
            }

        } catch (error) {
            console.error('Verification failed:', error);
            alert('Error connecting to server. Make sure backend is running!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h1>HoneyKYC - Mobile Ownership Verification</h1>
            
            {!apiService.sessionId && (
                <div style={{ 
                    background: '#fff3cd', 
                    color: '#856404', 
                    padding: '10px', 
                    borderRadius: '5px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    ⚠️ Make sure backend is running on port 5000
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Full Name (as per bank records)</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Mobile Number</label>
                    <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                        pattern="[0-9]{10}"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Email (optional)</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify Ownership'}
                </button>
            </form>

            {verificationResult && (
                <div className="verification-result">
                    <h3>Verification Result</h3>
                    
                    <div className="result-card">
                        <h4>Telecom Owner Check</h4>
                        <p>Status: {verificationResult.nameCheck.match ? '✅ Match' : '❌ Mismatch'}</p>
                        <p>Telecom Owner: {verificationResult.nameCheck.telecom_owner}</p>
                        <p>SIM Age: {verificationResult.nameCheck.sim_age_days} days</p>
                    </div>

                    <div className="result-card">
                        <h4>Risk Assessment</h4>
                        <p>Risk Score: {verificationResult.risk.risk_score}</p>
                        <p>Risk Level: 
                            <span className={`risk-${verificationResult.risk.risk_level?.toLowerCase()}`}>
                                {verificationResult.risk.risk_level}
                            </span>
                        </p>
                        
                        {verificationResult.risk.risk_factors?.length > 0 && (
                            <div>
                                <h5>Risk Factors:</h5>
                                <ul>
                                    {verificationResult.risk.risk_factors.map((factor, i) => (
                                        <li key={i}>{factor}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default LoginPage;