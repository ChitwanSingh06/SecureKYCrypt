import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function RealWallet() {
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

    useEffect(() => {
        const name = sessionStorage.getItem('userName');
        const mobile = sessionStorage.getItem('userMobile');
        const sessId = sessionStorage.getItem('sessionId');
        
        if (!name) {
            navigate('/');
            return;
        }

        setUserName(name);
        setUserMobile(mobile);
        setSessionId(sessId);

        // Load sample transactions
        setTransactions([
            { id: 1, type: 'credit', amount: 25000, description: 'Salary Credit', date: '2026-02-25' },
            { id: 2, type: 'debit', amount: 500, description: 'Swiggy Order', date: '2026-02-24' },
        ]);

        trackAction('page_view', 'real_wallet');
    }, [navigate]);

    const trackAction = async (action, details = {}) => {
        try {
            await fetch('http://localhost:5000/api/track/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    action: { action, page: 'real_wallet', details }
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
                    transaction: transactionData
                })
            });
        } catch (error) {
            console.log('Transaction tracking error:', error);
        }
    };

    const handleSendMoney = async (e) => {
        e.preventDefault();
        const sendAmount = parseFloat(amount);
        
        // CHECK BALANCE FIRST - THIS IS THE FIX
        if (sendAmount > balance) {
            alert('❌ Insufficient balance! You cannot send more than your current balance.');
            
            // Track failed attempt
            await trackAction('failed_transaction', { 
                reason: 'insufficient_balance', 
                amount: sendAmount,
                balance: balance
            });
            
            await trackTransaction({
                type: 'debit',
                amount: sendAmount,
                recipient: recipient,
                status: 'failed',
                reason: 'insufficient_balance'
            });
            
            setShowSend(false);
            setAmount('');
            setRecipient('');
            return;
        }

        // Process successful transaction
        await trackTransaction({
            type: 'debit',
            amount: sendAmount,
            recipient: recipient,
            status: 'completed'
        });

        const newTransaction = {
            id: Date.now(),
            type: 'debit',
            amount: sendAmount,
            description: `Sent to ${recipient}`,
            date: new Date().toLocaleDateString()
        };

        setTransactions([newTransaction, ...transactions]);
        setBalance(balance - sendAmount);
        
        trackAction('transaction_success', { amount: sendAmount, recipient });
        
        setShowSend(false);
        setAmount('');
        setRecipient('');
        
        alert(`✅ ₹${sendAmount} sent successfully!`);
    };

    const handleAddMoney = async (e) => {
        e.preventDefault();
        const addAmount = parseFloat(amount);

        await trackTransaction({
            type: 'credit',
            amount: addAmount,
            recipient: 'self',
            status: 'completed'
        });

        const newTransaction = {
            id: Date.now(),
            type: 'credit',
            amount: addAmount,
            description: 'Added to wallet',
            date: new Date().toLocaleDateString()
        };

        setTransactions([newTransaction, ...transactions]);
        setBalance(balance + addAmount);
        
        trackAction('add_money', { amount: addAmount });
        
        setShowAdd(false);
        setAmount('');
        
        alert(`✅ ₹${addAmount} added to wallet!`);
    };

    const handleLogout = () => {
        trackAction('logout');
        sessionStorage.clear();
        navigate('/');
    };

    return (
        <div className="wallet-container real">
            <div className="wallet-header">
                <div>
                    <h1>SecureKYCrypt Bank</h1>
                    <p>{userName} • {userMobile}</p>
                </div>
                <div>
                    <span className="badge">✅ Verified</span>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </div>

            <div className="balance-card">
                <div className="balance-label">Total Balance</div>
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
                        <form onSubmit={handleSendMoney}>
                            <input
                                type="text"
                                placeholder="Recipient (UPI ID/Mobile)"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="1"
                                max={balance}
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
                        <form onSubmit={handleAddMoney}>
                            <input
                                type="number"
                                placeholder="Amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="1"
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
                <h2>Recent Transactions</h2>
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
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RealWallet;