import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function FakeWallet() {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(50000);
    const [transactions, setTransactions] = useState([]);
    const [showSend, setShowSend] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [userName, setUserName] = useState('');
    const [userMobile, setUserMobile] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);

    useEffect(() => {
        const name = sessionStorage.getItem('userName');
        const mobile = sessionStorage.getItem('userMobile');
        const sessId = sessionStorage.getItem('sessionId');
        const newUser = sessionStorage.getItem('isNewUser');
        
        if (!name) {
            navigate('/');
            return;
        }

        setUserName(name);
        setUserMobile(mobile);
        setSessionId(sessId);
        setIsNewUser(newUser === 'true');

        setTransactions([
            { id: 1, type: 'credit', amount: 25000, description: 'Salary Credit', date: '2026-02-25' },
        ]);

        trackAction('page_view', 'fake_wallet');
        trackAction('suspicious_user_access', { isNewUser: newUser === 'true' });
    }, [navigate]);

    const trackAction = async (action, details = {}) => {
        try {
            await fetch('http://localhost:5000/api/track/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    action: { 
                        action, 
                        page: 'fake_wallet', 
                        details: { ...details, isNewUser, userMobile }
                    }
                })
            });
        } catch (error) {
            console.log('Tracking error:', error);
        }
    };

    const trackTransaction = async (transactionData) => {
        try {
            await fetch('http://localhost:5000/api/track/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    transaction: { ...transactionData, isSuspicious: true }
                })
            });
        } catch (error) {
            console.log('Transaction tracking error:', error);
        }
    };

    const handleSendMoney = async (e) => {
        e.preventDefault();
        const sendAmount = parseFloat(amount);
        
        // CHECK BALANCE FIRST
        if (sendAmount > balance) {
            alert('❌ Insufficient balance!');
            
            await trackAction('failed_transaction', { 
                reason: 'insufficient_balance', 
                amount: sendAmount 
            });
            
            await trackTransaction({
                type: 'debit',
                amount: sendAmount,
                recipient: recipient,
                status: 'failed'
            });
            
            setShowSend(false);
            setAmount('');
            setRecipient('');
            return;
        }

        await trackAction('suspicious_transfer', { amount: sendAmount, recipient });
        await trackTransaction({
            type: 'debit',
            amount: sendAmount,
            recipient: recipient,
            status: 'monitored'
        });

        alert('⚠️ This transaction is being monitored for fraud detection');

        const newTransaction = {
            id: Date.now(),
            type: 'debit',
            amount: sendAmount,
            description: `Sent to ${recipient} (Monitored)`,
            date: new Date().toLocaleDateString()
        };

        setTransactions([newTransaction, ...transactions]);
        setBalance(balance - sendAmount);
        setShowSend(false);
        setAmount('');
        setRecipient('');
    };

    const handleAddMoney = async (e) => {
        e.preventDefault();
        const addAmount = parseFloat(amount);

        await trackAction('suspicious_add_money', { amount: addAmount });
        await trackTransaction({
            type: 'credit',
            amount: addAmount,
            recipient: 'self',
            status: 'monitored'
        });

        alert('⚠️ This transaction is being analyzed');

        const newTransaction = {
            id: Date.now(),
            type: 'credit',
            amount: addAmount,
            description: 'Added to wallet (Monitored)',
            date: new Date().toLocaleDateString()
        };

        setTransactions([newTransaction, ...transactions]);
        setBalance(balance + addAmount);
        setShowAdd(false);
        setAmount('');
    };

    // Hidden honeypot traps
    useEffect(() => {
        const trap = document.createElement('button');
        trap.id = 'admin-trap';
        trap.style.display = 'none';
        trap.onclick = () => trackAction('honeypot_trigger', 'admin_trap');
        document.body.appendChild(trap);

        return () => document.body.removeChild(trap);
    }, []);

    const handleLogout = () => {
        trackAction('logout', { suspicious: true });
        sessionStorage.clear();
        navigate('/');
    };

    return (
        <div className="wallet-container fake">
            <div className="demo-banner">
                🔍 SECURITY MONITORING ACTIVE - DEMO ENVIRONMENT
            </div>

            <div className="wallet-header">
                <div>
                    <h1>SecureKYCrypt Bank</h1>
                    <p>{userName} • {userMobile}</p>
                </div>
                <div>
                    <span className="badge warning">🔍 Under Monitoring</span>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </div>

            <div className="balance-card">
                <div className="balance-label">Available Balance</div>
                <div className="balance-amount">₹{balance.toLocaleString()}</div>
                <div className="balance-actions">
                    <button onClick={() => setShowSend(true)} className="btn send">
                        💸 Send Money
                    </button>
                    <button onClick={() => setShowAdd(true)} className="btn add">
                        📥 Add Money
                    </button>
                </div>
            </div>

            {/* Send Money Modal */}
            {showSend && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Send Money</h3>
                        <p className="modal-note">⚠️ All transactions are monitored</p>
                        <form onSubmit={handleSendMoney}>
                            <input
                                type="text"
                                placeholder="Recipient"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                            <div className="modal-actions">
                                <button type="submit">Send</button>
                                <button type="button" onClick={() => setShowSend(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Money Modal */}
            {showAdd && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Add Money</h3>
                        <p className="modal-note">⚠️ This transaction will be analyzed</p>
                        <form onSubmit={handleAddMoney}>
                            <input
                                type="number"
                                placeholder="Amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                            <div className="modal-actions">
                                <button type="submit">Add</button>
                                <button type="button" onClick={() => setShowAdd(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="transactions">
                <h2>Recent Activity</h2>
                {transactions.map(txn => (
                    <div key={txn.id} className={`transaction ${txn.type}`}>
                        <span>{txn.type === 'credit' ? '📥' : '📤'}</span>
                        <div>
                            <div>{txn.description}</div>
                            <small>{txn.date}</small>
                        </div>
                        <span className={txn.type}>
                            {txn.type === 'credit' ? '+' : '-'} ₹{txn.amount}
                        </span>
                        <span className="monitored">🔍</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FakeWallet;