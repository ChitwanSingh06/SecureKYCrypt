import React from 'react';

function StatusCard({ title, value, unit = '', color = 'blue' }) {
    return (
        <div className={`status-card status-${color}`}>
            <h4 className="status-title">{title}</h4>
            <div className="status-value">
                {value}
                {unit && <span className="status-unit">{unit}</span>}
            </div>
        </div>
    );
}

export default StatusCard;