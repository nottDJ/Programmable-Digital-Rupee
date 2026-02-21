import { useState } from 'react';
import Header from '../components/Header';
import { useUser } from '../context/UserContext';
import { Search, Plus, Send, X, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { validateTransaction } from '../api/client';

export default function Contacts() {
    const { user, refreshUser } = useUser();
    const [search, setSearch] = useState('');
    const [selectedContact, setSelectedContact] = useState(null);
    const [amount, setAmount] = useState('');
    const [paying, setPaying] = useState(false);
    const [result, setResult] = useState(null);

    const contacts = user?.contacts || [];
    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.upiId.toLowerCase().includes(search.toLowerCase())
    );

    const handlePay = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        setPaying(true);
        setResult(null);
        try {
            // Simulated transaction for P2P (Contact)
            // In this demo, we'll treat it like a transaction but it might bypass some merchant rules
            const response = await validateTransaction({
                userId: user.id,
                merchantId: 'MRC001', // Hack: using a bookstore as a proxy for "P2P" in this sim
                intentId: null, // Let backend auto-select
                amount: parseFloat(amount),
                isP2P: true,
                recipientUpi: selectedContact.upiId
            });
            setResult(response.data);
            // Refresh user data (balance) in context
            refreshUser();
        } catch (err) {
            setResult({ success: false, error: 'Failed to process payment' });
        } finally {
            setPaying(false);
        }
    };

    const closeResult = () => {
        setResult(null);
        setSelectedContact(null);
        setAmount('');
    };

    return (
        <div>
            <Header title="Contacts" subtitle="Send Digital Rupee to your contacts" />
            <div className="page-container">

                <div className="card card-p" style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="input"
                                style={{ paddingLeft: 36 }}
                                placeholder="Search name or UPI ID..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-secondary">
                            <Plus size={16} /> New Contact
                        </button>
                    </div>
                </div>

                <div className="grid-4">
                    {filteredContacts.map(contact => (
                        <div key={contact.id} className="card card-p animate-fade-in"
                            style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                            onClick={() => setSelectedContact(contact)}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div style={{
                                width: 64, height: 64, borderRadius: '50%',
                                background: 'var(--bg-secondary)',
                                color: 'var(--accent-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.2rem', fontWeight: 700, margin: '0 auto 12px',
                                border: '2px solid var(--border-subtle)'
                            }}>
                                {contact.avatar}
                            </div>
                            <h4 style={{ fontSize: '0.95rem', marginBottom: 4 }}>{contact.name}</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{contact.upiId}</p>
                        </div>
                    ))}
                </div>

                {/* Payment Modal */}
                {selectedContact && !result && (
                    <div className="modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, backdropFilter: 'blur(4px)'
                    }}>
                        <div className="card card-p animate-slide-in" style={{ width: '100%', maxWidth: 400 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontSize: '1.1rem' }}>Pay Contact</h3>
                                <button className="btn btn-ghost" onClick={() => setSelectedContact(null)}><X size={18} /></button>
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: '50%',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--accent-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.5rem', fontWeight: 700, margin: '0 auto 12px'
                                }}>
                                    {selectedContact.avatar}
                                </div>
                                <h4 style={{ fontSize: '1.2rem', marginBottom: 4 }}>{selectedContact.name}</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedContact.upiId}</p>
                            </div>

                            <div className="form-group" style={{ marginBottom: 24 }}>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: '2rem', fontWeight: 700 }}>₹</span>
                                    <input
                                        type="number"
                                        className="input"
                                        style={{ fontSize: '2.5rem', fontWeight: 700, paddingLeft: 44, textAlign: 'center', height: 80 }}
                                        placeholder="0"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%', justifyContent: 'center', height: 56, fontSize: '1.1rem' }}
                                onClick={handlePay}
                                disabled={paying || !amount}
                            >
                                {paying ? <div className="spinner" /> : <><Send size={18} /> Pay Securely</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* Result Screen */}
                {result && (
                    <div className="modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, backdropFilter: 'blur(4px)'
                    }}>
                        <div className="card card-p animate-slide-in" style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%',
                                background: result.approved ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                color: result.approved ? 'var(--accent-green)' : 'var(--accent-red)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px',
                                border: `2px solid ${result.approved ? 'var(--accent-green)' : 'var(--accent-red)'}`
                            }}>
                                {result.approved ? <CheckCircle size={40} /> : <AlertCircle size={40} />}
                            </div>

                            <h3 style={{ fontSize: '1.5rem', marginBottom: 8 }}>
                                {result.approved ? 'Payment Successful' : 'Payment Blocked'}
                            </h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
                                {result.approved
                                    ? `₹${amount} sent to ${selectedContact.name}`
                                    : result.validationResult?.violationReason || 'Rule violation detected'}
                            </p>

                            {result.approved && (
                                <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, marginBottom: 24, textAlign: 'left' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>UPI Ref ID</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{result.validationResult?.upiSettlementRef || 'UPI-P2P-88273'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 700 }}>VERIFIED BY CBDC</span>
                                    </div>
                                </div>
                            )}

                            <button className="btn btn-secondary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={closeResult}>
                                Done
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
