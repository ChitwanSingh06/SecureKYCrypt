import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState({
        users: [],
        transactions: [],
        suspicious_activity: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionStorage.getItem('admin')) {
            navigate('/admin');
            return;
        }
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, [navigate]);

    const loadData = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/admin/dashboard', {
                headers: { 'Authorization': 'admin-secret' }
            });
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (score) => {
        if (score < 30) return '#4CAF50';
        if (score < 50) return '#FFC107';
        if (score < 70) return '#FF9800';
        return '#F44336';
    };

    const handleLogout = () => {
        sessionStorage.removeItem('admin');
        navigate('/admin');
    };

    if (loading) return <div className="loading">Loading dashboard...</div>;

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1>🛡️ Fraud Detection Dashboard</h1>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Users</h3>
                    <p className="stat-value">{data.users?.length || 0}</p>
                </div>
                <div className="stat-card warning">
                    <h3>High Risk</h3>
                    <p className="stat-value">
                        {data.users?.filter(u => u.risk_score >= 70).length || 0}
                    </p>
                </div>
                <div className="stat-card danger">
                    <h3>Suspicious Events</h3>
                    <p className="stat-value">{data.suspicious_activity?.length || 0}</p>
                </div>
                <div className="stat-card info">
                    <h3>Transactions</h3>
                    <p className="stat-value">{data.transactions?.length || 0}</p>
                </div>
            </div>

            {/* Users Table */}
            <div className="users-section">
                <h2>👥 Users & Risk Scores</h2>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>Risk Score</th>
                            <th>Risk Level</th>
                            <th>Logins</th>
                            <th>Transactions</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.users?.map(user => (
                            <tr key={user.mobile}>
                                <td>{user.name}</td>
                                <td>{user.mobile}</td>
                                <td>
                                    <div className="score-cell">
                                        <span>{user.risk_score}</span>
                                        <div className="score-bar">
                                            <div 
                                                className="score-fill" 
                                                style={{
                                                    width: `${user.risk_score}%`,
                                                    backgroundColor: getRiskColor(user.risk_score)
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span 
                                        className="risk-badge"
                                        style={{backgroundColor: getRiskColor(user.risk_score)}}
                                    >
                                        {user.risk_level}
                                    </span>
                                </td>
                                <td>{user.total_logins || 1}</td>
                                <td>{user.transaction_count || 0}</td>
                                <td>
                                    {user.risk_score > 70 ? '🚨 High Risk' : 
                                     user.risk_score > 50 ? '⚠️ Monitor' : '✅ Safe'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Suspicious Activity */}
            <div className="activity-section">
                <h2>🚨 Live Suspicious Activity</h2>
                <div className="activity-list">
                    {data.suspicious_activity?.map((act, i) => (
                        <div key={i} className="activity-item">
                            <span className="activity-icon">🚨</span>
                            <div className="activity-details">
                                <strong>{act.user_name}</strong>
                                <p>{act.reason}</p>
                                <small>{new Date(act.timestamp).toLocaleTimeString()}</small>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="transactions-section">
                <h2>💳 Recent Transactions</h2>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.transactions?.map((txn, i) => (
                            <tr key={i} className={txn.status === 'failed' ? 'failed' : ''}>
                                <td>{txn.user_name}</td>
                                <td>{txn.type === 'credit' ? '📥 Credit' : '📤 Debit'}</td>
                                <td>₹{txn.amount}</td>
                                <td>
                                    <span className={`status ${txn.status}`}>
                                        {txn.status === 'failed' ? '❌ Failed' : 
                                         txn.status === 'monitored' ? '🔍 Monitored' : '✅ Success'}
                                    </span>
                                </td>
                                <td>{new Date(txn.timestamp).toLocaleTimeString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminDashboard;