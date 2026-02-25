import React from 'react';

function RiskMeter({ score }) {
    // Determine color based on score
    const getColor = () => {
        if (score < 30) return '#4CAF50'; // Green
        if (score < 60) return '#FFC107'; // Yellow
        if (score < 80) return '#FF9800'; // Orange
        return '#F44336'; // Red
    };

    // Determine risk label
    const getRiskLabel = () => {
        if (score < 30) return 'Low Risk';
        if (score < 60) return 'Medium Risk';
        if (score < 80) return 'High Risk';
        return 'Critical Risk';
    };

    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="risk-meter">
            <svg width="200" height="200" viewBox="0 0 200 200">
                {/* Background circle */}
                <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="20"
                />
                
                {/* Progress circle */}
                <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke={getColor()}
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 100 100)"
                    style={{ transition: 'stroke-dashoffset 0.5s' }}
                />
                
                {/* Center text */}
                <text
                    x="100"
                    y="100"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="24"
                    fontWeight="bold"
                    fill="#333"
                >
                    {score}
                </text>
                <text
                    x="100"
                    y="130"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fill="#666"
                >
                    Risk Score
                </text>
            </svg>
            
            <div className="risk-label" style={{ color: getColor() }}>
                {getRiskLabel()}
            </div>
        </div>
    );
}

export default RiskMeter;