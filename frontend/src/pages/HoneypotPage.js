import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

function HoneypotPage() {
    const navigate = useNavigate();
    const [sessionId, setSessionId] = useState(null);
    const [fakeBalance, setFakeBalance] = useState(null);
    const [actions, setActions] = useState([]);
    const [showFakeData, setShowFakeData] = useState(false);

    useEffect(() => {
        // Generate fake session ID
        const fakeSession = 'honeypot_' + Math.random().toString(36).substring(7);
        setSessionId(fakeSession);
        
        // Track entry
        trackAction('entered_honeypot');
        
        // Show fake data after a delay (to look realistic)
        setTimeout(() => {
            setShowFakeData(true);
            fetchFakeBalance();
        }, 2000);
    }, []);

    const trackAction = async (actionType, details = {}) => {
        try {
            await fetch('/api/honeypot/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    action_type: actionType,
                    ...details
                })
            });
        } catch (error) {
            console.log('Honeypot tracking:', actionType);
        }
        
        setActions(prev => [...prev, { type: actionType, timestamp: new Date() }]);
    };

    const fetchFakeBalance = async () => {
        try {
            const response = await fetch(`/api/honeypot/fake-balance?session_id=${sessionId}`);
            const data = await response.json();
            setFakeBalance(data);
        } catch (error) {
            console.error('Failed to fetch fake balance:', error);
        }
    };

    const handleFakeTransfer = async () => {
        await trackAction('transfer_attempt', { amount: 5000 });
        
        try {
            const response = await fetch('/api/honeypot/fake-transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    amount: 5000,
                    to_account: 'FAKE****1234'
                })
            });
            
            const data = await response.json();
            alert(`Demo: Transfer of ₹5000 initiated!\nTransaction ID: ${data.transaction_id}`);
        } catch (error) {
            console.error('Transfer failed:', error);
        }
    };

    const handleAdminClick = () => {
        trackAction('click_admin_link');
        alert('⚠️ Admin access restricted. This attempt has been logged.');
    };

    const handleLogout = () => {
        trackAction('logout_attempt');
        navigate('/');
    };

    return (
        <div className="honeypot-container">
            <div className="honeypot-header">
                <h1>🏦 Indian Bank - Enhanced Security Verification</h1>
                <div className="security-badge">
                    🔒 Honeypot Environment - Test System
                </div>
            </div>

            {!showFakeData ? (
                <div className="loading-screen">
                    <div className="spinner"></div>
                    <p>Verifying your credentials...</p>
                </div>
            ) : (
                <div className="honeypot-content">
                    <div className="welcome-message">
                        <h2>Welcome to Indian Bank NetBanking</h2>
                        <p>This is a simulated environment for verification purposes.</p>
                    </div>

                    <div className="accounts-grid">
                        {fakeBalance?.balances?.map((account, index) => (
                            <div key={index} className="account-card">
                                <h3>{account.account}</h3>
                                <p className="balance">{account.balance}</p>
                                <button 
                                    className="view-details"
                                    onClick={() => trackAction('view_balance')}
                                >
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="total-wealth">
                        <h3>Total Net Worth</h3>
                        <p className="total-amount">{fakeBalance?.total_net_worth}</p>
                    </div>

                    <div className="action-buttons">
                        <button 
                            className="transfer-btn"
                            onClick={handleFakeTransfer}
                        >
                            💸 Transfer Money
                        </button>
                        <button 
                            className="admin-btn"
                            onClick={handleAdminClick}
                        >
                            👤 Admin Panel
                        </button>
                        <button 
                            className="logout-btn"
                            onClick={handleLogout}
                        >
                            🚪 Logout
                        </button>
                    </div>

                    <div className="fraud-trap" style={{ display: 'none' }}>
                        {/* Hidden trap for fraudsters */}
                        <a 
                            href="#" 
                            onClick={(e) => {
                                e.preventDefault();
                                trackAction('hidden_trap_triggered');
                                alert('Security trap triggered! Your activity is being monitored.');
                            }}
                        >
                            Hidden Admin Access
                        </a>
                    </div>

                    <div className="verification-note">
                        <p>⚠️ This is a test environment. Any sensitive actions are being monitored for security purposes.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HoneypotPage;