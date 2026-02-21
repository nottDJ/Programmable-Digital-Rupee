// src/pages/IntentBuilder.jsx
import { useState } from 'react';
import Header from '../components/Header';
import { parseIntent, createIntent, getUserIntents } from '../api/client';
import { Zap, CheckCircle, XCircle, Plus, Trash2, Clock, MapPin, Tag, DollarSign, AlertCircle, ChevronRight, Lightbulb } from 'lucide-react';
import { useEffect } from 'react';

const SAMPLE_INTENTS = [
    "Allow ₹500 for books only for 30 days in Chennai",
    "Reserve ₹3000 for groceries and split 70% spending 30% savings this month in Chennai",
    "Escrow ₹1500 for medical expenses with proof required",
    "Allow ₹2000 for education and books for 60 days",
    "Set ₹800 for food and restaurants for 7 days in Mumbai",
];

const MCC_LABELS = {
    "5942": "Book Stores",
    "8299": "Educational Services",
    "5812": "Restaurants",
    "5411": "Grocery Stores",
    "5912": "Pharmacies",
    "8099": "Health Services",
    "5732": "Electronics",
};

export default function IntentBuilder() {
    const [text, setText] = useState('');
    const [parseResult, setParseResult] = useState(null);
    const [parsing, setParsing] = useState(false);
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState(null);
    const [intents, setIntents] = useState([]);
    const [loadingIntents, setLoadingIntents] = useState(true);

    useEffect(() => {
        loadIntents();
    }, []);

    const loadIntents = async () => {
        try {
            const r = await getUserIntents();
            setIntents(r.data.intents);
        } catch (e) { console.error(e); }
        finally { setLoadingIntents(false); }
    };

    const handleParse = async () => {
        if (!text.trim()) return;
        setParsing(true);
        setMessage(null);
        try {
            const r = await parseIntent(text);
            setParseResult(r.data);
        } catch (e) {
            setMessage({ type: 'error', text: 'Failed to parse intent. Check backend connection.' });
        } finally { setParsing(false); }
    };

    const handleCreate = async () => {
        if (!parseResult?.success) return;
        setCreating(true);
        try {
            await createIntent(text, parseResult.parsedPolicy);
            setMessage({ type: 'success', text: `Intent created! ₹${parseResult.parsedPolicy.amount} locked successfully.` });
            setText('');
            setParseResult(null);
            loadIntents();
        } catch (e) {
            const errMsg = e.response?.data?.error || 'Failed to create intent';
            setMessage({ type: 'error', text: errMsg });
        } finally { setCreating(false); }
    };

    const handleCancel = async (intentId) => {
        try {
            const { cancelIntent } = await import('../api/client');
            await cancelIntent(intentId);
            loadIntents();
        } catch (e) { console.error(e); }
    };

    const policy = parseResult?.parsedPolicy;
    const tierLabel = { 1: 'Tier 1 – MCC Filtering', 2: 'Tier 2 – Merchant-Tagged', 3: 'Tier 3 – Proof + Invoice' };

    return (
        <div>
            <Header title="Intent Builder" subtitle="Define spending rules in natural language" />
            <div className="page-container">

                <div className="grid-2" style={{ alignItems: 'start' }}>
                    {/* Left: Builder Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* NLP Input */}
                        <div className="card card-p">
                            <div className="card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div className="title-icon" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--accent-secondary)' }}>
                                        <Zap size={14} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '0.9rem' }}>Natural Language Intent</h3>
                                        <p>Describe your spending rule in plain English</p>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 12 }}>
                                <textarea
                                    className="textarea"
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    placeholder='e.g. "Allow ₹500 for books only for 30 days in Chennai"'
                                    rows={3}
                                    style={{ fontSize: '0.95rem' }}
                                />
                            </div>

                            {/* Sample intents */}
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Lightbulb size={11} /> Try these examples:
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    {SAMPLE_INTENTS.map((s, i) => (
                                        <button key={i} onClick={() => setText(s)}
                                            style={{ textAlign: 'left', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-secondary)', transition: 'var(--transition-fast)' }}
                                            onMouseEnter={e => e.target.style.borderColor = 'rgba(59,130,246,0.3)'}
                                            onMouseLeave={e => e.target.style.borderColor = 'var(--border-subtle)'}
                                        >
                                            "{s}"
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {message && (
                                <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 12 }}>
                                    {message.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                                    <span>{message.text}</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn btn-primary" onClick={handleParse} disabled={parsing || !text.trim()} style={{ flex: 1 }}>
                                    {parsing ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Parsing...</> : <><Zap size={14} /> Parse Intent</>}
                                </button>
                                {parseResult?.success && (
                                    <button className="btn btn-success" onClick={handleCreate} disabled={creating}>
                                        {creating ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <><Plus size={14} /> Create & Lock</>}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Parse Result Preview */}
                        {parseResult && policy && (
                            <div className={`card card-p animate-slide-in`} style={{ borderColor: parseResult.success ? 'rgba(59,130,246,0.25)' : 'rgba(239,68,68,0.25)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
                                        Policy Extracted
                                    </h3>
                                    <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', padding: '2px 8px', borderRadius: 20 }}>
                                        {Math.round((parseResult.confidence || 0) * 100)}% confidence
                                    </span>
                                </div>

                                {/* Summary */}
                                <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>"{parseResult.summary}"</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {/* Amount */}
                                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                            <DollarSign size={12} style={{ color: 'var(--accent-amber)' }} />
                                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Amount</span>
                                        </div>
                                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>₹{policy.amount.toLocaleString('en-IN')}</div>
                                    </div>

                                    {/* Time */}
                                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                            <Clock size={12} style={{ color: 'var(--accent-primary)' }} />
                                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Time Limit</span>
                                        </div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{policy.timeLimit} {policy.timeUnit}</div>
                                    </div>

                                    {/* Categories */}
                                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px', gridColumn: '1/-1' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                            <Tag size={12} style={{ color: 'var(--accent-secondary)' }} />
                                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Allowed Categories & MCCs</span>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {policy.categoryKeys?.map(c => (
                                                <span key={c} className="badge badge-active">{c}</span>
                                            ))}
                                        </div>
                                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {policy.allowedMCCs?.map(mcc => (
                                                <span key={mcc} style={{ fontSize: '0.68rem', background: 'var(--bg-elevated)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 6, fontFamily: 'monospace' }}>
                                                    MCC {mcc} · {MCC_LABELS[mcc] || 'Other'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Geo */}
                                    {policy.geoRestriction && (
                                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                <MapPin size={12} style={{ color: 'var(--accent-green)' }} />
                                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location</span>
                                            </div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                                                {policy.geoRestriction.city || policy.geoRestriction.state || 'Any'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tier */}
                                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px' }}>
                                        <div style={{ marginBottom: 6, fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Enforcement</div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>{tierLabel[policy.enforcementTier]}</div>
                                    </div>
                                </div>

                                {/* Flags */}
                                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {policy.escrowEnabled && <span className="badge badge-locked">🔒 Escrow Mode</span>}
                                    {policy.proofRequired && <span className="badge badge-tier3">📄 Proof Required</span>}
                                    {policy.splitRules && <span className="badge badge-active">📊 Split: {Math.round(policy.splitRules.spending * 100)}%/{Math.round(policy.splitRules.savings * 100)}%</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Active Intents */}
                    <div>
                        <div className="card card-p">
                            <div className="card-header">
                                <div>
                                    <h3 style={{ fontSize: '0.9rem' }}>Active Intent Rules</h3>
                                    <p>Your programmable spending policies</p>
                                </div>
                                <span className="badge badge-active">{intents.filter(i => i.status === 'active').length} Active</span>
                            </div>

                            {loadingIntents ? (
                                <div className="loading-overlay"><div className="spinner" /></div>
                            ) : intents.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">⚡</div>
                                    <h4>No intents yet</h4>
                                    <p>Create your first programmable spending rule</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {intents.map(intent => {
                                        const pct = intent.amountLocked > 0 ? (intent.amountUsed / intent.amountLocked * 100) : 0;
                                        const daysLeft = Math.max(0, Math.ceil((new Date(intent.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)));
                                        return (
                                            <div key={intent.id} className="card" style={{ padding: '16px', borderColor: intent.status === 'active' ? 'rgba(59,130,246,0.15)' : 'var(--border-subtle)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            "{intent.rawText.substring(0, 55)}{intent.rawText.length > 55 ? '...' : ''}"
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                            <span className={`badge badge-${intent.status}`}>{intent.status}</span>
                                                            <span className={`badge badge-tier${intent.enforcementTier}`}>Tier {intent.enforcementTier}</span>
                                                            {intent.parsedPolicy.escrowEnabled && <span className="badge badge-locked">Escrow</span>}
                                                        </div>
                                                    </div>
                                                    {intent.status === 'active' && (
                                                        <button className="btn btn-ghost btn-sm" onClick={() => handleCancel(intent.id)}
                                                            style={{ padding: '4px', marginLeft: 8, color: 'var(--accent-red)' }}
                                                            title="Cancel intent">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Amount Progress */}
                                                <div style={{ marginBottom: 8 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 5 }}>
                                                        <span>₹{intent.amountUsed.toLocaleString('en-IN')} used</span>
                                                        <span>₹{intent.amountLocked.toLocaleString('en-IN')} total</span>
                                                    </div>
                                                    <div className="progress-bar-outer">
                                                        <div className="progress-bar-inner" style={{ width: `${pct}%`, background: pct > 80 ? 'var(--accent-red)' : pct > 50 ? 'var(--accent-amber)' : 'var(--gradient-brand)' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: 4 }}>
                                                        <span style={{ color: 'var(--accent-green)' }}>₹{intent.amountRemaining.toLocaleString('en-IN')} remaining</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                                                            <Clock size={10} /> {daysLeft}d left
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* NFT Token */}
                                                <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: '14px' }}>🪙</span>
                                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{intent.nftTokenId}</span>
                                                </div>

                                                {/* Violation count */}
                                                {intent.violationCount > 0 && (
                                                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--accent-red)' }}>
                                                        <AlertCircle size={11} /> {intent.violationCount} violation attempt{intent.violationCount > 1 ? 's' : ''} blocked
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
