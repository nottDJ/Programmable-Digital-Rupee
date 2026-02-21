// src/pages/SimulateUPI.jsx
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { validateTransaction, getMerchants, getUserIntents } from '../api/client';
import { useUser } from '../context/UserContext';
import {
    ShieldCheck, ShieldX, CreditCard, Send, AlertCircle,
    CheckCircle, XCircle, Clock, MapPin, Tag, Zap, Store, AlertTriangle
} from 'lucide-react';

const CHECK_LABELS = {
    intentStatus: { label: 'Intent Active', icon: '🔵' },
    amountCap: { label: 'Amount Cap', icon: '💰' },
    timeWindow: { label: 'Time Window', icon: '⏰' },
    geoFence: { label: 'Geo-Fence', icon: '📍' },
    merchantCategory: { label: 'MCC Category', icon: '🏪' },
    merchantTier: { label: 'Merchant Tier', icon: '✅' },
    proofRequirement: { label: 'Proof / Invoice', icon: '📄' },
};

const CATEGORY_COLORS = {
    books: '#3b82f6', food: '#f59e0b', grocery: '#10b981',
    electronics: '#8b5cf6', medical: '#ef4444', education: '#06b6d4',
    mixed: '#6b7280'
};

export default function SimulateUPI() {
    const { user, refreshUser } = useUser();
    const [merchants, setMerchants] = useState([]);
    const [intents, setIntents] = useState([]);
    const [form, setForm] = useState({ merchantId: '', intentId: '', amount: '', proofProvided: false });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [emergencyMode, setEmergencyMode] = useState(false);
    const [emergencyReason, setEmergencyReason] = useState('');

    useEffect(() => {
        getMerchants().then(r => setMerchants(r.data.merchants)).catch(console.error);
        if (user) {
            getUserIntents(user.id).then(r => setIntents(r.data.intents.filter(i => i.status === 'active'))).catch(console.error);
        }
    }, [user]);

    const selectedMerchant = merchants.find(m => m.id === form.merchantId);
    const selectedIntent = intents.find(i => i.id === form.intentId);

    const handleSimulate = async (isEmergency = false) => {
        if (!form.merchantId || !form.amount) return;

        if (isEmergency && !emergencyReason) {
            setEmergencyMode(true);
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const payload = {
                userId: user.id,
                merchantId: form.merchantId,
                intentId: form.intentId || null,
                amount: parseFloat(form.amount),
                proofProvided: form.proofProvided,
                emergencyReason: isEmergency ? emergencyReason : null
            };
            const r = await validateTransaction(payload);
            setResult(r.data);
            setHistory(prev => [r.data, ...prev].slice(0, 12));
            if (isEmergency) {
                setEmergencyMode(false);
                setEmergencyReason('');
            }
            // Refresh user data (balance) in context
            refreshUser();
        } catch (e) {
            setResult({ error: e.response?.data?.error || 'Simulation failed. Is the backend running?' });
        } finally {
            setLoading(false);
        }
    };

    const quickScenarios = [
        {
            label: '✅ Books — Approved',
            desc: 'Buy books at bookstore under books intent',
            merchantId: 'MRC001', intentId: intents[0]?.id || '', amount: '320', proofProvided: false,
        },
        {
            label: '❌ Food — Blocked',
            desc: 'Try to eat at restaurant under books intent',
            merchantId: 'MRC002', intentId: intents[0]?.id || '', amount: '180', proofProvided: false,
        },
    ];

    return (
        <div>
            <Header title="Simulate UPI" subtitle="Test rule enforcement with live scenarios" />
            <div className="page-container">

                <div className="grid-2">
                    {/* ── Left: Configuration Panel ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="card card-p">
                            <div className="card-header">
                                <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Store size={16} style={{ color: 'var(--accent-primary)' }} />
                                    Transaction Context
                                </h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Merchant</label>
                                    <select
                                        className="input"
                                        value={form.merchantId}
                                        onChange={e => setForm({ ...form, merchantId: e.target.value })}
                                    >
                                        <option value="">Select a merchant...</option>
                                        {merchants.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.categoryLabel})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Active Intent Rule</label>
                                    <select
                                        className="input"
                                        value={form.intentId}
                                        onChange={e => setForm({ ...form, intentId: e.target.value })}
                                    >
                                        <option value="">Let system auto-detect intent...</option>
                                        {intents.map(i => (
                                            <option key={i.id} value={i.id}>{i.rawText}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Amount (₹)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        placeholder="0.00"
                                        value={form.amount}
                                        onChange={e => setForm({ ...form, amount: e.target.value })}
                                    />
                                </div>

                                <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <input
                                        type="checkbox"
                                        id="proof"
                                        checked={form.proofProvided}
                                        onChange={e => setForm({ ...form, proofProvided: e.target.checked })}
                                    />
                                    <label htmlFor="proof" className="form-label" style={{ marginBottom: 0 }}>
                                        Proof / Invoice provided
                                    </label>
                                </div>

                                {emergencyMode && (
                                    <div className="animate-fade-in" style={{ background: 'rgba(239,68,68,0.05)', padding: 12, borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>
                                        <label className="form-label" style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>Emergency Reason Required</label>
                                        <textarea
                                            className="textarea"
                                            rows={2}
                                            placeholder="Why do you need to bypass rules?"
                                            value={emergencyReason}
                                            onChange={e => setEmergencyReason(e.target.value)}
                                            style={{ borderColor: 'var(--accent-red)' }}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleSimulate(false)}
                                        disabled={loading || !form.merchantId || !form.amount}
                                        style={{ flex: 1, justifyContent: 'center' }}
                                    >
                                        {loading ? <div className="spinner" /> : <><Send size={15} /> Simulate UPI</>}
                                    </button>

                                    {!result?.approved && result && (
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => handleSimulate(true)}
                                            disabled={loading}
                                            style={{ background: 'var(--accent-red)', color: 'white', border: 'none' }}
                                        >
                                            <AlertTriangle size={15} /> Emergency Pay
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Result Panel ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {result && (
                            <div className={`card card-p animate-slide-in ${result.approved ? 'border-success' : 'border-error'}`}
                                style={{ borderLeft: `4px solid ${result.approved ? 'var(--accent-green)' : 'var(--accent-red)'}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    {result.approved ? <ShieldCheck size={24} color="var(--accent-green)" /> : <ShieldX size={24} color="var(--accent-red)" />}
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem' }}>{result.approved ? 'Approved' : 'Blocked'}</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{result.validationResult?.upiSettlementRef || 'Policy Violation'}</p>
                                    </div>
                                </div>

                                {!result.approved && (
                                    <div style={{ background: 'rgba(239,68,68,0.05)', padding: 12, borderRadius: 8, fontSize: '0.85rem', color: 'var(--accent-red)' }}>
                                        <strong>Violation:</strong> {result.validationResult?.violationReason}
                                    </div>
                                )}

                                {result.approved && result.validationResult?.isEmergency && (
                                    <div style={{ background: 'rgba(245,158,11,0.1)', padding: 12, borderRadius: 8, fontSize: '0.85rem', color: 'var(--accent-amber)', marginTop: 10 }}>
                                        <strong>Emergency Override Active:</strong> Rules bypassed for this transaction.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="card card-p">
                            <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Simulation History</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {history.map((h, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <span>{h.transaction?.merchantName}</span>
                                        <span style={{ color: h.approved ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                                            {h.approved ? '+' : '✗'} ₹{h.transaction?.amount}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
