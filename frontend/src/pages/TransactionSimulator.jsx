// src/pages/TransactionSimulator.jsx
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { validateTransaction, getMerchants, getUserIntents } from '../api/client';
import { CreditCard, CheckCircle, XCircle, ShieldCheck, ShieldX, Zap, ChevronRight, AlertTriangle, Info } from 'lucide-react';

const CATEGORY_COLORS = {
    books: '#3b82f6', food: '#f59e0b', grocery: '#10b981',
    electronics: '#8b5cf6', medical: '#ef4444', education: '#06b6d4', mixed: '#ef4444'
};

const CHECK_LABELS = {
    intentStatus: 'Intent Status',
    amountCap: 'Amount Cap',
    timeWindow: 'Time Window',
    geoFence: 'Geo-Fence',
    merchantCategory: 'MCC Category',
    merchantTier: 'Merchant Tier',
    proofRequirement: 'Proof Requirement'
};

const QUICK_SCENARIOS = [
    { label: '✅ Books Purchase (Should Pass)', merchantId: 'MRC001', intentId: 'INT001', amount: 320, desc: 'Bookworm Paradise matches books intent' },
    { label: '❌ Restaurant (Should Fail)', merchantId: 'MRC002', intentId: 'INT001', amount: 180, desc: 'Category mismatch: food vs books' },
    { label: '✅ Grocery Purchase (Should Pass)', merchantId: 'MRC003', intentId: 'INT002', amount: 450, desc: 'Metro Supermart matches grocery intent' },
    { label: '❌ Mixed Merchant (Should Fail)', merchantId: 'MRC006', intentId: 'INT001', amount: 200, desc: 'Mixed-category merchant blocked' },
    { label: '✅ Medical w/ Proof (Should Pass)', merchantId: 'MRC007', intentId: 'INT003', amount: 300, proofProvided: true, desc: 'Apollo with proof = escrow release' },
];

export default function TransactionSimulator() {
    const [merchants, setMerchants] = useState([]);
    const [intents, setIntents] = useState([]);
    const [selectedMerchant, setSelectedMerchant] = useState('');
    const [selectedIntent, setSelectedIntent] = useState('');
    const [amount, setAmount] = useState('');
    const [proofProvided, setProofProvided] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        Promise.all([getMerchants(), getUserIntents()])
            .then(([mRes, iRes]) => {
                setMerchants(mRes.data.merchants);
                setIntents(iRes.data.intents.filter(i => i.status === 'active'));
            })
            .catch(console.error);
    }, []);

    const handleSimulate = async (overrides = {}) => {
        const merchantId = overrides.merchantId || selectedMerchant;
        const intentId = overrides.intentId || selectedIntent;
        const txnAmount = parseFloat(overrides.amount || amount);
        const proof = overrides.proofProvided !== undefined ? overrides.proofProvided : proofProvided;

        if (!merchantId || !intentId || !txnAmount) return;

        setLoading(true);
        setResult(null);

        try {
            const r = await validateTransaction({
                userId: 'USR001',
                intentId,
                merchantId,
                amount: txnAmount,
                proofProvided: proof
            });

            const txnResult = r.data;
            setResult(txnResult);

            // Add to history
            setHistory(prev => [{
                ...txnResult,
                merchantName: merchants.find(m => m.id === merchantId)?.name || merchantId,
                timestamp: new Date().toISOString()
            }, ...prev.slice(0, 19)]);

        } catch (e) {
            const errMsg = e.response?.data?.error || 'Simulation failed';
            setResult({ error: errMsg, approved: false });
        } finally { setLoading(false); }
    };

    const merchant = merchants.find(m => m.id === selectedMerchant);

    return (
        <div>
            <Header title="UPI Simulator" subtitle="Simulate programmable Digital Rupee transactions before settlement" />
            <div className="page-container">

                {/* Quick Scenarios */}
                <div className="card card-p" style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>🎯 Quick Scenarios</h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {QUICK_SCENARIOS.map((s, i) => (
                            <button key={i}
                                onClick={() => handleSimulate(s)}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 8, padding: '8px 14px',
                                    cursor: 'pointer', fontSize: '0.78rem',
                                    color: 'var(--text-secondary)', transition: 'all 0.15s ease'
                                }}
                                title={s.desc}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid-2" style={{ alignItems: 'start' }}>
                    {/* Left Column: Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Transaction Form */}
                        <div className="card card-p">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div className="title-icon" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)' }}>
                                    <CreditCard size={14} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '0.9rem' }}>UPI Transaction</h3>
                                    <p>Intercepted before NPCI settlement</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {/* Select Intent */}
                                <div className="form-group">
                                    <label className="form-label">Active Intent / Rule</label>
                                    <select className="select" value={selectedIntent} onChange={e => setSelectedIntent(e.target.value)}>
                                        <option value="">Select intent...</option>
                                        {intents.map(i => (
                                            <option key={i.id} value={i.id}>
                                                {i.id} – ₹{i.amountRemaining} remaining ({i.parsedPolicy.categoryKeys?.join(', ') || 'general'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Select Merchant */}
                                <div className="form-group">
                                    <label className="form-label">Merchant</label>
                                    <select className="select" value={selectedMerchant} onChange={e => setSelectedMerchant(e.target.value)}>
                                        <option value="">Select merchant...</option>
                                        {merchants.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} – MCC {m.mcc} ({m.categoryLabel})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Merchant Info Card */}
                                {merchant && (
                                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 14px' }}>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${CATEGORY_COLORS[merchant.category]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                                                {merchant.category === 'books' ? '📚' : merchant.category === 'food' ? '🍽' : merchant.category === 'grocery' ? '🛒' : merchant.category === 'medical' ? '🏥' : merchant.category === 'mixed' ? '⚠️' : '🏪'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{merchant.name}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{merchant.city} • MCC {merchant.mcc} • Tier {merchant.tier}</div>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', background: `${CATEGORY_COLORS[merchant.category]}18`, color: CATEGORY_COLORS[merchant.category] || '#6b7280', padding: '2px 8px', borderRadius: 12 }}>
                                                {merchant.categoryLabel}
                                            </span>
                                        </div>
                                        {merchant.warning && (
                                            <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.72rem', color: 'var(--accent-amber)', background: 'rgba(245,158,11,0.08)', padding: '6px 10px', borderRadius: 6 }}>
                                                <AlertTriangle size={12} /> {merchant.warning}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Amount */}
                                <div className="form-group">
                                    <label className="form-label">Transaction Amount (₹)</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 700 }}>₹</span>
                                        <input
                                            type="number"
                                            className="input"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            min="1"
                                            style={{ paddingLeft: 28 }}
                                        />
                                    </div>
                                </div>

                                {/* Proof toggle */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        <div
                                            onClick={() => setProofProvided(!proofProvided)}
                                            style={{ width: 36, height: 20, borderRadius: 10, background: proofProvided ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: '1px solid var(--border-default)', position: 'relative', cursor: 'pointer', transition: 'var(--transition-fast)' }}
                                        >
                                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: proofProvided ? 18 : 2, transition: 'var(--transition-fast)' }} />
                                        </div>
                                        Proof / Invoice Provided
                                    </label>
                                </div>

                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleSimulate()}
                                    disabled={loading || !selectedMerchant || !selectedIntent || !amount}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    {loading ? (
                                        <><div className="spinner" style={{ width: 14, height: 14 }} /> Validating...</>
                                    ) : (
                                        <><Zap size={14} /> Simulate UPI Transaction</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Transaction History Mini */}
                        {history.length > 0 && (
                            <div className="card card-p">
                                <h3 style={{ fontSize: '0.85rem', marginBottom: 12 }}>Session History</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {history.slice(0, 5).map((h, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                                            {h.approved ? <CheckCircle size={14} style={{ color: 'var(--accent-green)', flexShrink: 0 }} /> : <XCircle size={14} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />}
                                            <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.merchantName}</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{h.transaction?.amount?.toLocaleString('en-IN')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Result */}
                    <div>
                        {!result && !loading && (
                            <div className="card card-p" style={{ textAlign: 'center', padding: '48px 24px' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
                                <h3 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Awaiting Transaction</h3>
                                <p>Configure the transaction details on the left and click "Simulate UPI Transaction"</p>
                                <p style={{ marginTop: 8 }}>Or try one of the Quick Scenarios above</p>
                            </div>
                        )}

                        {loading && (
                            <div className="card card-p">
                                <div className="loading-overlay" style={{ padding: '48px' }}>
                                    <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                                    <p style={{ fontSize: '0.9rem' }}>Intercepting UPI transaction...</p>
                                    <p style={{ fontSize: '0.75rem' }}>Running rule engine validation pipeline</p>
                                </div>
                            </div>
                        )}

                        {result && !loading && (
                            <div className={result.approved ? 'validation-approved' : 'validation-rejected'}>
                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                                    <div style={{ width: 52, height: 52, borderRadius: 14, background: result.approved ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {result.approved ? <ShieldCheck size={26} style={{ color: 'var(--accent-green)' }} /> : <ShieldX size={26} style={{ color: 'var(--accent-red)' }} />}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', color: result.approved ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                            {result.approved ? '✅ Transaction Approved' : '❌ Transaction Rejected'}
                                        </h3>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                            {result.approved ? `UPI Ref: ${result.validationResult?.upiSettlementRef}` : 'Blocked before UPI settlement'}
                                        </div>
                                    </div>
                                </div>

                                {/* UPI forwarded badge */}
                                <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: result.approved ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: result.approved ? 'var(--accent-green)' : 'var(--accent-red)', border: `1px solid ${result.approved ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                                        {result.approved ? '🚀 Forwarded to NPCI UPI Rail' : '🛑 Intercepted – Not Forwarded to NPCI'}
                                    </span>
                                    {result.validationResult?.processingTimeMs && (
                                        <span style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                            {result.validationResult.processingTimeMs}ms
                                        </span>
                                    )}
                                </div>

                                {/* Violation reason */}
                                {!result.approved && result.validationResult?.violationReason && (
                                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px', marginBottom: 16 }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                            <AlertTriangle size={14} style={{ color: 'var(--accent-red)', flexShrink: 0, marginTop: 2 }} />
                                            <div>
                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-red)', marginBottom: 4 }}>VIOLATION REASON</div>
                                                <div style={{ fontSize: '0.8rem', color: '#fca5a5', lineHeight: 1.6 }}>{result.validationResult.violationReason}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Validation Checks */}
                                {result.validationResult?.checks && (
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                                            Validation Pipeline
                                        </div>
                                        <div className="check-list">
                                            {result.validationResult.checks.map((check, i) => (
                                                <div key={i} className={`check-item ${check.passed ? 'pass' : 'fail'}`}>
                                                    {check.passed ? <CheckCircle size={13} /> : <XCircle size={13} />}
                                                    <div style={{ flex: 1 }}>
                                                        <span style={{ fontWeight: 600 }}>{CHECK_LABELS[check.check] || check.check}</span>
                                                        {check.note && <span style={{ marginLeft: 8, fontSize: '0.72rem', opacity: 0.7 }}>({check.note})</span>}
                                                    </div>
                                                    <ChevronRight size={12} style={{ opacity: 0.5 }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Risk Assessment */}
                                {result.validationResult?.riskAssessment && (
                                    <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Risk Assessment</div>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                                                background: result.validationResult.riskAssessment.riskLevel === 'high' ? 'rgba(239,68,68,0.15)' : result.validationResult.riskAssessment.riskLevel === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                                                color: result.validationResult.riskAssessment.riskLevel === 'high' ? 'var(--accent-red)' : result.validationResult.riskAssessment.riskLevel === 'medium' ? 'var(--accent-amber)' : 'var(--accent-green)'
                                            }}>
                                                {result.validationResult.riskAssessment.riskLevel.toUpperCase()} RISK
                                            </span>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Score: {(result.validationResult.riskAssessment.riskScore * 100).toFixed(0)}%</span>
                                        </div>
                                        {result.validationResult.riskAssessment.risks?.map((r, i) => (
                                            <div key={i} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <Info size={10} /> {r}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Merchant Info */}
                                {result.validationResult?.merchantInfo && (
                                    <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        {Object.entries(result.validationResult.merchantInfo).map(([k, v]) => (
                                            <div key={k} style={{ flex: 1, minWidth: '40%' }}>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Error state */}
                        {result?.error && (
                            <div className="alert alert-error">
                                <XCircle size={16} />
                                <span>{result.error}</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
