import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

function LoginPage() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Start verification
            await apiService.startVerification(formData);

            // Check name match
            const nameCheck = await apiService.checkNameMatch(formData.mobile, formData.name);

            // Get risk assessment
            const risk = await apiService.getRiskAssessment();

            // Store user info
            sessionStorage.setItem('userName', formData.name);
            sessionStorage.setItem('userMobile', formData.mobile);
            sessionStorage.setItem('riskScore', risk.risk_score);
            sessionStorage.setItem('sessionId', apiService.sessionId);
            sessionStorage.setItem('isNewUser', 'false');

            // Track login
            await fetch('http://localhost:5000/api/track/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: apiService.sessionId,
                    action: {
                        action: 'login',
                        page: 'login',
                        details: { method: 'password' }
                    }
                })
            });

            // Redirect based on risk
            if (risk.risk_score > 50) {
                navigate('/fake-wallet');
            } else {
                navigate('/wallet');
            }

        } catch (error) {
            setError('Login failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            // Start verification
            await apiService.startVerification(formData);

            // Store user info - NEW USERS ARE AUTOMATICALLY SUSPICIOUS
            sessionStorage.setItem('userName', formData.name);
            sessionStorage.setItem('userMobile', formData.mobile);
            sessionStorage.setItem('riskScore', '75'); // High risk for new users
            sessionStorage.setItem('sessionId', apiService.sessionId);
            sessionStorage.setItem('isNewUser', 'true');

            // Track new account creation
            await fetch('http://localhost:5000/api/track/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: apiService.sessionId,
                    action: {
                        action: 'account_creation',
                        page: 'signup',
                        details: { isNewUser: true }
                    }
                })
            });

            // New users go to fake wallet for monitoring
            navigate('/fake-wallet');

        } catch (error) {
            setError('Signup failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>🏦 SecureKYCrypt</h1>
                    <p>Next-Gen Fraud Detection System</p>
                </div>

                <div className="auth-tabs">
                    <button 
                        className={`tab ${isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(true)}
                    >
                        Login
                    </button>
                    <button 
                        className={`tab ${!isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(false)}
                    >
                        Create Account
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={isLogin ? handleLogin : handleSignup}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Mobile Number</label>
                        <input
                            type="tel"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                            placeholder="10 digit mobile number"
                            pattern="[0-9]{10}"
                            required
                        />
                    </div>

                    {!isLogin && (
                        <>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create password"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm password"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Admin? <a href="/admin">Access Dashboard →</a></p>
                    <div className="demo-accounts">
                        <p><strong>Demo:</strong></p>
                        <p>✅ Real User: Rahul Sharma / 9876543210</p>
                        <p>🚫 Fraud Test: Fake Name / 8888888888</p>
                        <p>🆕 New Account: Create account → Auto suspicious</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;