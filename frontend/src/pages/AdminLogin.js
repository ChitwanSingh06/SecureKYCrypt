import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (credentials.username === 'admin' && credentials.password === 'admin123') {
            sessionStorage.setItem('admin', 'true');
            navigate('/admin/dashboard');
        } else {
            setError('Invalid admin credentials');
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-box">
                <h1>🛡️ Admin Portal</h1>
                <p>Fraud Monitoring Dashboard</p>
                
                {error && <div className="error">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={credentials.username}
                            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                            placeholder="Enter admin username"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={credentials.password}
                            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                            placeholder="Enter password"
                            required
                        />
                    </div>
                    
                    <button type="submit">Access Dashboard</button>
                </form>
                
                <div className="demo-creds">
                    <p><strong>Demo:</strong> admin / admin123</p>
                    <a href="/">← Back to User Login</a>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;