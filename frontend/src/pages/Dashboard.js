import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import RiskMeter from '../components/RiskMeter';
import StatusCard from '../components/StatusCard';

function Dashboard() {
    const [riskData, setRiskData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(null);

    useEffect(() => {
        loadRiskData();
        
        // Refresh every 30 seconds
        const interval = setInterval(loadRiskData, 30000);
        setRefreshInterval(interval);
        
        return () => clearInterval(interval);
    }, []);

    const loadRiskData = async () => {
        try {
            const data = await apiService.getRiskAssessment();
            setRiskData(data);
        } catch (error) {
            console.error('Failed to load risk data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>HoneyKYC Security Dashboard</h1>
                <div className="timestamp">
                    Last Updated: {new Date().toLocaleTimeString()}
                </div>
            </header>

            <div className="dashboard-grid">
                <div className="grid-item risk-meter">
                    <h3>Risk Assessment</h3>
                    <RiskMeter score={riskData?.risk_score || 0} />
                    <div className={`risk-level risk-${riskData?.risk_level?.toLowerCase()}`}>
                        Risk Level: {riskData?.risk_level}
                    </div>
                </div>

                <div className="grid-item stats">
                    <h3>Statistics</h3>
                    <StatusCard 
                        title="Risk Score" 
                        value={riskData?.risk_score || 0}
                        unit="points"
                        color={riskData?.risk_score > 60 ? 'red' : 'green'}
                    />
                    <StatusCard 
                        title="Risk Factors" 
                        value={riskData?.risk_factors?.length || 0}
                        unit="detected"
                    />
                </div>

                <div className="grid-item factors">
                    <h3>Risk Factors</h3>
                    {riskData?.risk_factors?.length > 0 ? (
                        <ul className="risk-factors-list">
                            {riskData.risk_factors.map((factor, index) => (
                                <li key={index} className="risk-factor-item">
                                    <span className="factor-icon">⚠️</span>
                                    {factor}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-factors">No risk factors detected</p>
                    )}
                </div>

                <div className="grid-item actions">
                    <h3>Recommended Actions</h3>
                    {riskData?.risk_level === 'HIGH' || riskData?.risk_level === 'CRITICAL' ? (
                        <div className="alert alert-danger">
                            <strong>⚠️ Immediate Action Required</strong>
                            <p>User shows high fraud risk. Consider:</p>
                            <ul>
                                <li>Additional KYC verification</li>
                                <li>Manual review required</li>
                                <li>Restrict high-value transactions</li>
                            </ul>
                        </div>
                    ) : riskData?.risk_level === 'MEDIUM' ? (
                        <div className="alert alert-warning">
                            <strong>⚠️ Monitor User</strong>
                            <p>Medium risk detected. Enable:</p>
                            <ul>
                                <li>Transaction limits</li>
                                <li>Additional authentication</li>
                            </ul>
                        </div>
                    ) : (
                        <div className="alert alert-success">
                            <strong>✅ User Verified</strong>
                            <p>Low risk user. Normal operations.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;