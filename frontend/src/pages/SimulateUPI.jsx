// src/pages/SimulateUPI.jsx
// UPI Transaction Simulation Screen — the core demo of rule enforcement
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { validateTransaction, getMerchants, getUserIntents } from '../api/client';
import {
    ShieldCheck, ShieldX, CreditCard, Send, AlertCircle,
    CheckCircle, XCircle, Clock, MapPin, Tag, Zap, Store
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
    const [merchants, setMerchants] = useState([]);
    const [intents, setIntents] = useState([]);
    const [form, setForm] = useState({ merchantId: '', intentId: '', amount: '', proofProvided: false });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        getMerchants().then(r => setMerchants(r.data.merchants)).catch(console.error);
        getUserIntents().then(r => setIntents(r.data.intents.filter(i => i.status === 'active'))).catch(console.error);
    }, []);

    const selectedMerchant = merchants.find(m => m.id === form.merchantId);
    const selectedIntent = intents.find(i => i.id === form.intentId);

    const handleSimulate = async () => {
        if (!form.merchantId || !form.intentId || !form.amount) return;
        setLoading(true);
        setResult(null);
        try {
            const r = await validateTransaction({
                userId: 'USR001',
                intentId: form.intentId,
                merchantId: form.merchantId,
                amount: parseFloat(form.amount),
                proofProvided: form.proofProvided,
            });
            setResult(r.data);
            setHistory(prev => [r.data, ...prev].slice(0, 12));
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
        {
            label: '⚠️ Mixed — Flagged',
            desc: 'Mixed-category merchant flagged by engine',
            merchantId: 'MRC006', intentId: intents[0]?.id || '', amount: '250', proofProvided: false,
        },
        {
            label: '✅ Grocery — Approved',
            desc: 'Grocery purchase under grocery intent',
            merchantId: 'MRC003', intentId: intents[1]?.id || '', amount: '450', proofProvided: false,
        },
    ];

    return (
        <div>
            <Header title="Simulate UPI" subtitle="Test rule enforcement before settlement" />
            <div className="page-container">

                <div className="grid-2" style={{ alignItems: 'start', gap: 24 }}>

                    {/* ── Left: Simulation Form ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Quick Scenarios */}
                        <div className="card card-p">
                            <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Quick Scenarios</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {quickScenarios.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setForm({ merchantId: s.merchantId, intentId: s.intentId, amount: s.amount, proofProvided: s.proofProvided })}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                                            borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                                            transition: 'var(--transition-fast)', textAlign: 'left',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                                    >
                                        <div>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.desc}</div>
                                        </div>
                                        <Zap size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Manual Form */}
                        <div className="card card-p">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                                <div className="title-icon" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent-primary)' }}>
                                    <CreditCard size={14} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '0.9rem' }}>Transaction Parameters</h3>
                                    <p>Configure UPI payment to simulate</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                                {/* Intent Select */}
                                <div className="form-group">
                                    <label className="form-label">Active Intent Rule</label>
                                    <select className="select" value={form.intentId} onChange={e => setForm(f => ({ ...f, intentId: e.target.value }))}>
                                        <option value="">— Select intent —</option>
                                        {intents.map(i => (
                                            <option key={i.id} value={i.id}>
                                                {i.rawText.substring(0, 50)}... (₹{i.amountRemaining} left)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Merchant Select */}
                                <div className="form-group">
                                    <label className="form-label">Merchant (UPI QR)</label>
                                    <select className="select" value={form.merchantId} onChange={e => setForm(f => ({ ...f, merchantId: e.target.value }))}>
                                        <option value="">— Select merchant —</option>
                                        {merchants.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} — {m.categoryLabel} (MCC {m.mcc}) · {m.city}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Amount */}
                                <div className="form-group">
                                    <label className="form-label">Amount (₹)</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 700 }}>₹</span>
                                        <input
                                            type="number"
                                            className="input"
                                            style={{ paddingLeft: 28 }}
                                            placeholder="0"
                                            min="1"
                                            value={form.amount}
                                            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                {/* Proof toggle */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border-subtle)' }}>
                                    <input
                                        type="checkbox"
                                        id="proof"
                                        checked={form.proofProvided}
                                        onChange={e => setForm(f => ({ ...f, proofProvided: e.target.checked }))}
                                        style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="proof" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        📄 Proof/Invoice provided (required for Tier 3 escrow intents)
                                    </label>
                                </div>

                                {/* Merchant Preview */}
                                {selectedMerchant && (
                                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border-subtle)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Merchant Preview</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{selectedMerchant.name}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{selectedMerchant.upiId}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 20, background: `${CATEGORY_COLORS[selectedMerchant.category]}18`, color: CATEGORY_COLORS[selectedMerchant.category] }}>
                                                    {selectedMerchant.categoryLabel}
                                                </span>
                                                <div style={{ display: 'flex', gap: 6, marginTop: 4, justifyContent: 'flex-end' }}>
                                                    <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 4 }}>MCC {selectedMerchant.mcc}</span>
                                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>📍{selectedMerchant.city}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {selectedMerchant.warning && (
                                            <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <AlertCircle size={11} /> {selectedMerchant.warning}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={handleSimulate}
                                    disabled={loading || !form.merchantId || !form.intentId || !form.amount}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    {loading
                                        ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Validating with Rule Engine...</>
                                        : <><Send size={15} /> Simulate UPI Payment</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Result Panel ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Validation Result */}
                        {result && !result.error && (
                            <div className={result.approved ? 'validation-approved' : 'validation-rejected'} style={{ borderRadius: 16 }}>
                                {/* Result Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                                    <div style={{
                                        width: 52, height: 52, borderRadius: '50%',
                                        background: result.approved ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: `2px solid ${result.approved ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                                        flexShrink: 0
                                    }}>
                                        {result.approved
                                            ? <ShieldCheck size={24} style={{ color: '#10b981' }} />
                                            : <ShieldX size={24} style={{ color: '#ef4444' }} />
                                        }
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', color: result.approved ? '#6ee7b7' : '#fca5a5', marginBottom: 2 }}>
                                            {result.approved ? 'Transaction Approved' : 'Transaction Blocked'}
                                        </h3>
                                        <p style={{ fontSize: '0.78rem', color: result.approved ? '#6ee7b7cc' : '#fca5a5cc' }}>
                                            {result.approved
                                                ? `✓ UPI payment forwarded to settlement layer`
                                                : `✗ Rule violation — payment rejected before settlement`
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* UPI Ref */}
                                {result.approved && result.validationResult?.upiSettlementRef && (
                                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontFamily: 'monospace', fontSize: '0.75rem', color: '#6ee7b7' }}>
                                        UPI Ref: {result.validationResult.upiSettlementRef}
                                    </div>
                                )}

                                {/* Violation Reason */}
                                {!result.approved && result.validationResult?.violationReason && (
                                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                                        <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Violation Reason</div>
                                        <p style={{ fontSize: '0.8rem', color: '#fca5a5', lineHeight: 1.6 }}>{result.validationResult.violationReason}</p>
                                    </div>
                                )}

                                {/* Validation Checks */}
                                <div style={{ marginBottom: 14 }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                        Validation Pipeline ({result.validationResult?.processingTimeMs || 0}ms)
                                    </div>
                                    <div className="check-list">
                                        {(result.validationResult?.checks || []).map((check, idx) => (
                                            <div key={idx} className={`check-item ${check.passed ? 'pass' : 'fail'}`}>
                                                {check.passed ? <CheckCircle size={13} /> : <XCircle size={13} />}
                                                <span style={{ fontWeight: 600, flex: 1 }}>{CHECK_LABELS[check.check]?.label || check.check}</span>
                                                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{check.passed ? 'PASS' : 'FAIL'}</span>
                                            </div>
                                        ))}
                                        {/* Unchecked steps (after failure) */}
                                        {!result.approved && (() => {
                                            const allKeys = Object.keys(CHECK_LABELS);
                                            const checked = (result.validationResult?.checks || []).map(c => c.check);
                                            return allKeys.filter(k => !checked.includes(k)).map(k => (
                                                <div key={k} className="check-item skip">
                                                    <span style={{ fontSize: '12px' }}>⏭</span>
                                                    <span style={{ flex: 1 }}>{CHECK_LABELS[k]?.label}</span>
                                                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>SKIPPED</span>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>

                                {/* Risk Assessment */}
                                {result.validationResult?.riskAssessment && (
                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 14px' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Risk Assessment</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                                                background: result.validationResult.riskAssessment.riskLevel === 'low' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                                                color: result.validationResult.riskAssessment.riskLevel === 'low' ? '#10b981' : '#f59e0b'
                                            }}>
                                                {result.validationResult.riskAssessment.riskLevel?.toUpperCase()} RISK
                                            </span>
                                            {result.validationResult.riskAssessment.risks?.map((r, i) => (
                                                <span key={i} style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>• {r}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {result?.error && (
                            <div className="alert alert-error"><XCircle size={15} /><span>{result.error}</span></div>
                        )}

                        {/* Simulation History */}
                        {history.length > 0 && (
                            <div className="card card-p">
                                <h3 style={{ fontSize: '0.9rem', marginBottom: 14 }}>Simulation History</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {history.map((h, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 12px', borderRadius: 10,
                                            background: h.approved ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                                            border: `1px solid ${h.approved ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                {h.approved ? <CheckCircle size={14} style={{ color: '#10b981' }} /> : <XCircle size={14} style={{ color: '#ef4444' }} />}
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{h.transaction?.merchantName}</div>
                                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>₹{h.transaction?.amount} · MCC {h.transaction?.merchantMCC}</div>
                                                </div>
                                            </div>
                                            <span className={`badge ${h.approved ? 'badge-approved' : 'badge-rejected'}`}>
                                                {h.approved ? 'PASS' : 'FAIL'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!result && !loading && (
                            <div className="card card-p">
                                <div className="empty-state">
                                    <div className="empty-icon">🛡️</div>
                                    <h4>Rule Engine Ready</h4>
                                    <p>Select a scenario or configure a transaction, then click Simulate to see the validation pipeline in action.</p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
