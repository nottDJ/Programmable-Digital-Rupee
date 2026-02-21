// src/pages/EscrowManager.jsx
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { getUserEscrows, releaseMilestone, initiateClawback, modifyEscrow } from '../api/client';
import { useUser } from '../context/UserContext';
import {
    Lock, Unlock, RefreshCw, CheckCircle, Clock, AlertCircle,
    ArrowDownLeft, Edit2, X, Plus, Trash2, Save
} from 'lucide-react';

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
    const { user } = useUser();
    const [escrows, setEscrows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clawbackMsg, setClawbackMsg] = useState({});

    // Edit Modal State
    const [editingEscrow, setEditingEscrow] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', milestones: [] });
    const [saving, setSaving] = useState(false);

    const load = () => {
        if (!user) return;
        setLoading(true);
        getUserEscrows(user.id).then(r => setEscrows(r.data.escrows)).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [user]);

    const handleClawback = async (escrowId, partial) => {
        try {
            const r = await initiateClawback(escrowId, 'unused', partial);
            setClawbackMsg(prev => ({ ...prev, [escrowId]: r.data }));
            setTimeout(load, 1500);
        } catch (e) {
            setClawbackMsg(prev => ({ ...prev, [escrowId]: { error: e.response?.data?.error } }));
        }
    };

    const openEditModal = (escrow) => {
        setEditingEscrow(escrow);
        setEditForm({
            title: escrow.title,
            milestones: [...escrow.milestones.map(m => ({ ...m }))]
        });
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            await modifyEscrow(editingEscrow.id, editForm);
            setEditingEscrow(null);
            load();
        } catch (e) {
            console.error(e);
            alert('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const updateMilestone = (index, field, value) => {
        const updated = [...editForm.milestones];
        updated[index] = { ...updated[index], [field]: field === 'amount' ? parseFloat(value) : value };
        setEditForm({ ...editForm, milestones: updated });
    };

    const addMilestone = () => {
        setEditForm({
            ...editForm,
            milestones: [...editForm.milestones, { description: 'New Milestone', amount: 500, proofRequired: 'receipt', status: 'pending' }]
        });
    };

    const removeMilestone = (index) => {
        if (editForm.milestones[index].status === 'completed') return;
        setEditForm({
            ...editForm,
            milestones: editForm.milestones.filter((_, i) => i !== index)
        });
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>{escrow.title}</h3>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                <StatusBadge status={escrow.status} />
                                                <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 6 }}>{escrow.id}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(escrow)} title="Edit Escrow">
                                                <Edit2 size={13} /> Edit
                                            </button>
                                            <button className="btn btn-ghost btn-sm" onClick={load} title="Refresh">
                                                <RefreshCw size={13} />
                                            </button>
                                        </div>
                                    </div>

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

                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                                            <span>Release Progress</span>
                                            <span>{releasedPct.toFixed(0)}%</span>
                                        </div>
                                        <div className="progress-bar-outer" style={{ height: 8 }}>
                                            <div className="progress-bar-inner" style={{ width: `${releasedPct}%`, background: 'var(--gradient-green)' }} />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Milestones</div>
                                        {escrow.milestones.map(m => (
                                            <MilestoneRow key={m.id} m={m} escrowId={escrow.id} onRefresh={load} />
                                        ))}
                                    </div>

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

            {/* Edit Modal Overlay */}
            {editingEscrow && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div className="card card-p animate-slide-in" style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: '1.2rem' }}>Modify Escrow</h3>
                            <button className="btn btn-ghost" onClick={() => setEditingEscrow(null)}><X size={20} /></button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Escrow Title</label>
                            <input className="input" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                        </div>

                        <div style={{ marginTop: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <label className="form-label">Milestones</label>
                                <button className="btn btn-ghost btn-sm" onClick={addMilestone}><Plus size={14} /> Add</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {editForm.milestones.map((m, i) => (
                                    <div key={i} className="card" style={{ padding: 12, background: 'var(--bg-secondary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <input className="input-sm" style={{ flex: 1, marginRight: 8 }} value={m.description} onChange={e => updateMilestone(i, 'description', e.target.value)} disabled={m.status === 'completed'} />
                                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-red)' }} onClick={() => removeMilestone(i)} disabled={m.status === 'completed'}><Trash2 size={14} /></button>
                                        </div>
                                        <div className="grid-2">
                                            <div className="form-group-sm">
                                                <label style={{ fontSize: '0.65rem' }}>Amount (₹)</label>
                                                <input type="number" className="input-sm" value={m.amount} onChange={e => updateMilestone(i, 'amount', e.target.value)} disabled={m.status === 'completed'} />
                                            </div>
                                            <div className="form-group-sm">
                                                <label style={{ fontSize: '0.65rem' }}>Proof Key</label>
                                                <input className="input-sm" value={m.proofRequired} onChange={e => updateMilestone(i, 'proofRequired', e.target.value)} disabled={m.status === 'completed'} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingEscrow(null)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveEdit} disabled={saving}>
                                {saving ? <div className="spinner" /> : <><Save size={16} /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
