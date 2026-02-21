// src/pages/EscrowManager.jsx
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { getUserEscrows, releaseMilestone, initiateClawback } from '../api/client';
import { Lock, Unlock, RefreshCw, CheckCircle, Clock, AlertCircle, ArrowDownLeft } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const map = {
        locked: { cls: 'badge-locked', label: 'Locked' },
        partially_released: { cls: 'badge-active', label: 'Partial Released' },
        released: { cls: 'badge-approved', label: 'Fully Released' },
        clawback: { cls: 'badge-rejected', label: 'Clawed Back' },
    };
    const { cls, label } = map[status] || { cls: '', label: status };
    return <span className={`badge ${cls}`}>{label}</span>;
};

const MilestoneRow = ({ m, escrowId, onRefresh }) => {
    const [releasing, setReleasing] = useState(false);
    const [msg, setMsg] = useState(null);

    const handleRelease = async () => {
        setReleasing(true);
        setMsg(null);
        try {
            const r = await releaseMilestone(escrowId, m.id, 'proof-doc-simulated');
            setMsg({ type: 'success', text: `₹${r.data.amountReleased} released! UPI Ref: ${r.data.upiRef}` });
            setTimeout(() => { onRefresh(); setMsg(null); }, 2000);
        } catch (e) {
            setMsg({ type: 'error', text: e.response?.data?.error || 'Release failed' });
        } finally { setReleasing(false); }
    };

    return (
        <div style={{
            background: m.status === 'completed' ? 'rgba(16,185,129,0.05)' : 'var(--bg-secondary)',
            border: `1px solid ${m.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'var(--border-subtle)'}`,
            borderRadius: 10, padding: '14px 16px', marginBottom: 8
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {m.status === 'completed'
                            ? <CheckCircle size={14} style={{ color: '#10b981' }} />
                            : <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                        }
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{m.description}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>₹{m.amount.toLocaleString('en-IN')}</span>
                        <span>Proof: <code style={{ color: 'var(--text-secondary)' }}>{m.proofRequired}</code></span>
                        {m.completedAt && <span>Released: {new Date(m.completedAt).toLocaleDateString('en-IN')}</span>}
                    </div>
                </div>
                {m.status === 'pending' && (
                    <button className="btn btn-success btn-sm" onClick={handleRelease} disabled={releasing}>
                        {releasing ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <><Unlock size={12} /> Release</>}
                    </button>
                )}
                {m.status === 'completed' && (
                    <span className="badge badge-approved"><CheckCircle size={10} /> Done</span>
                )}
            </div>
            {msg && (
                <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`} style={{ marginTop: 8, padding: '8px 12px', fontSize: '0.78rem' }}>
                    {msg.type === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    <span>{msg.text}</span>
                </div>
            )}
        </div>
    );
};

export default function EscrowManager() {
    const [escrows, setEscrows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clawbackMsg, setClawbackMsg] = useState({});

    const load = () => {
        setLoading(true);
        getUserEscrows().then(r => setEscrows(r.data.escrows)).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleClawback = async (escrowId, partial) => {
        try {
            const r = await initiateClawback(escrowId, 'unused', partial);
            setClawbackMsg(prev => ({ ...prev, [escrowId]: r.data }));
            setTimeout(load, 1500);
        } catch (e) {
            setClawbackMsg(prev => ({ ...prev, [escrowId]: { error: e.response?.data?.error } }));
        }
    };

    if (loading) return (
        <div>
            <Header title="Escrow Manager" subtitle="Milestone-based programmable payments" />
            <div className="page-container"><div className="loading-overlay"><div className="spinner" /><p>Loading escrows...</p></div></div>
        </div>
    );

    return (
        <div>
            <Header title="Escrow Manager" subtitle="Milestone-based programmable payments with proof verification" />
            <div className="page-container">

                {/* Summary strip */}
                <div className="stat-grid" style={{ marginBottom: 24 }}>
                    {[
                        { label: 'Total Escrows', value: escrows.length, icon: <Lock size={18} />, cls: 'blue' },
                        { label: 'Total Locked', value: `₹${escrows.reduce((s, e) => s + e.totalAmount, 0).toLocaleString('en-IN')}`, icon: '🔒', cls: 'amber' },
                        { label: 'Released', value: `₹${escrows.reduce((s, e) => s + e.releasedAmount, 0).toLocaleString('en-IN')}`, icon: <Unlock size={18} />, cls: 'green' },
                        { label: 'Pending', value: `₹${escrows.reduce((s, e) => s + e.pendingAmount, 0).toLocaleString('en-IN')}`, icon: <Clock size={18} />, cls: 'purple' },
                    ].map((s, i) => (
                        <div key={i} className="stat-card">
                            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-value" style={{ fontSize: '1.3rem' }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {escrows.length === 0 ? (
                    <div className="card card-p">
                        <div className="empty-state">
                            <div className="empty-icon">🔐</div>
                            <h4>No escrows yet</h4>
                            <p>Create an escrow-mode intent to enable milestone-based programmable payments</p>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {escrows.map(escrow => {
                            const releasedPct = escrow.totalAmount > 0 ? (escrow.releasedAmount / escrow.totalAmount * 100) : 0;
                            const cbMsg = clawbackMsg[escrow.id];

                            return (
                                <div key={escrow.id} className="card card-p">
                                    {/* Escrow Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>{escrow.title}</h3>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                <StatusBadge status={escrow.status} />
                                                <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 6 }}>{escrow.id}</span>
                                            </div>
                                        </div>
                                        <button className="btn btn-ghost btn-sm" onClick={load} title="Refresh">
                                            <RefreshCw size={13} />
                                        </button>
                                    </div>

                                    {/* Amount Overview */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                                        {[
                                            { label: 'Total', value: escrow.totalAmount, color: 'var(--text-primary)' },
                                            { label: 'Released', value: escrow.releasedAmount, color: 'var(--accent-green)' },
                                            { label: 'Pending', value: escrow.pendingAmount, color: 'var(--accent-amber)' },
                                        ].map(item => (
                                            <div key={item.label} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                                                <div style={{ fontSize: '1rem', fontWeight: 700, color: item.color }}>₹{item.value.toLocaleString('en-IN')}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Progress */}
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                                            <span>Release Progress</span>
                                            <span>{releasedPct.toFixed(0)}%</span>
                                        </div>
                                        <div className="progress-bar-outer" style={{ height: 8 }}>
                                            <div className="progress-bar-inner" style={{ width: `${releasedPct}%`, background: 'var(--gradient-green)' }} />
                                        </div>
                                    </div>

                                    {/* Milestones */}
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Milestones</div>
                                        {escrow.milestones.map(m => (
                                            <MilestoneRow key={m.id} m={m} escrowId={escrow.id} onRefresh={load} />
                                        ))}
                                    </div>

                                    {/* Clawback section */}
                                    {escrow.status !== 'released' && escrow.status !== 'clawback' && (
                                        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>Recovery Actions</div>
                                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleClawback(escrow.id, null)}>
                                                    <ArrowDownLeft size={13} /> Full Clawback
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleClawback(escrow.id, escrow.pendingAmount * 0.5)}>
                                                    <ArrowDownLeft size={13} /> 50% Partial Clawback
                                                </button>
                                            </div>
                                            {cbMsg && (
                                                <div className={`alert ${cbMsg.error ? 'alert-error' : 'alert-success'}`} style={{ marginTop: 10, fontSize: '0.78rem' }}>
                                                    {cbMsg.error ? cbMsg.error : (
                                                        <span>
                                                            Clawed back ₹{cbMsg.clawbackAmount} · Penalty: ₹{cbMsg.penaltyAmount} ·
                                                            Net returned: ₹{cbMsg.netReturnedToWallet} · Auto-invested: ₹{cbMsg.investedInSavings}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
