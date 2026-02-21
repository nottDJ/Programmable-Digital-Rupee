// src/pages/IntentBuilder.jsx
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { parseIntent, createIntent, getUserIntents, bulkCreateIntents } from '../api/client';
import { useUser } from '../context/UserContext';
import {
    Zap, CheckCircle, XCircle, Plus, Trash2, Clock, MapPin, Tag,
    DollarSign, AlertCircle, ChevronRight, Lightbulb, Users, Settings2, FileText
} from 'lucide-react';

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

const EMPLOYEES = [
    { id: "USR001", name: "Priya Sharma (Admin)" },
    { id: "USR002", name: "Rahul Verma" },
    { id: "USR003", name: "Ananya Iyer" },
    { id: "USR004", name: "Vikram Malhotra" },
];

export default function IntentBuilder() {
    const { user } = useUser();
    const [mode, setMode] = useState('nlp'); // 'nlp' or 'manual'
    const [text, setText] = useState('');
    const [parseResult, setParseResult] = useState(null);
    const [parsing, setParsing] = useState(false);
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState(null);
    const [intents, setIntents] = useState([]);
    const [loadingIntents, setLoadingIntents] = useState(true);

    // Manual Rule State
    const [manualAmount, setManualAmount] = useState('500');
    const [manualCategory, setManualCategory] = useState('5942');
    const [manualDays, setManualDays] = useState('30');
    const [manualCity, setManualCity] = useState(user?.city || 'Chennai');
    const [manualProof, setManualProof] = useState(false);

    // Bulk State
    const [isBulk, setIsBulk] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([user?.id]);

    useEffect(() => {
        loadIntents();
    }, [user]);

    const loadIntents = async () => {
        if (!user) return;
        try {
            const r = await getUserIntents(user.id);
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
            setMessage({ type: 'error', text: 'Failed to parse intent.' });
        } finally { setParsing(false); }
    };

    const handleCreate = async () => {
        let policy;
        let raw;

        if (mode === 'nlp') {
            if (!parseResult?.success) return;
            policy = parseResult.parsedPolicy;
            raw = text;
        } else {
            policy = {
                amount: parseFloat(manualAmount),
                timeLimit: parseInt(manualDays),
                timeUnit: 'days',
                categoryKeys: [MCC_LABELS[manualCategory]],
                allowedMCCs: [manualCategory],
                geoRestriction: { city: manualCity, state: null, radius: 20 },
                enforcementTier: manualProof ? 3 : 1,
                proofRequired: manualProof
            };
            raw = `Allow ₹${manualAmount} for ${MCC_LABELS[manualCategory]} in ${manualCity} for ${manualDays} days`;
        }

        setCreating(true);
        try {
            if (isBulk && selectedUsers.length > 0) {
                await bulkCreateIntents({ userIds: selectedUsers, rawText: raw, parsedPolicy: policy });
                setMessage({ type: 'success', text: `Bulk rule deployed to ${selectedUsers.length} wallets!` });
            } else {
                await createIntent(raw, policy, user.id);
                setMessage({ type: 'success', text: `Intent created! ₹${policy.amount} locked successfully.` });
            }
            setText('');
            setParseResult(null);
            loadIntents();
        } catch (e) {
            setMessage({ type: 'error', text: e.response?.data?.error || 'Failed to create intent' });
        } finally { setCreating(false); }
    };

    const toggleUserSelection = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const policy = parseResult?.parsedPolicy;
    const tierLabel = { 1: 'Tier 1 – MCC Filtering', 2: 'Tier 2 – Merchant-Tagged', 3: 'Tier 3 – Proof + Invoice' };

    return (
        <div>
            <Header title="Intent Builder" subtitle="Define spending rules & deploy in bulk" />
            <div className="page-container">

                <div className="grid-2" style={{ alignItems: 'start' }}>
                    {/* Left: Builder Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Mode Selector */}
                        <div className="tabs" style={{ background: 'var(--bg-secondary)', padding: 4, borderRadius: 12, display: 'inline-flex', alignSelf: 'start', marginBottom: 4 }}>
                            <button className={`tab ${mode === 'nlp' ? 'active' : ''}`} onClick={() => setMode('nlp')} style={{ padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem' }}>
                                <Zap size={14} style={{ marginRight: 6 }} /> NLP AI
                            </button>
                            <button className={`tab ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')} style={{ padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem' }}>
                                <Settings2 size={14} style={{ marginRight: 6 }} /> Manual
                            </button>
                        </div>

                        {/* Builder Card */}
                        <div className="card card-p">
                            {mode === 'nlp' ? (
                                <>
                                    <div className="form-group" style={{ marginBottom: 12 }}>
                                        <label className="form-label">Describe your spending rule</label>
                                        <textarea
                                            className="textarea"
                                            value={text}
                                            onChange={e => setText(e.target.value)}
                                            placeholder='e.g. "Allow ₹500 for books only for 30 days in Chennai"'
                                            rows={3}
                                        />
                                    </div>
                                    <div style={{ marginBottom: 14 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            {SAMPLE_INTENTS.map((s, i) => (
                                                <button key={i} onClick={() => setText(s)} className="btn btn-ghost" style={{ justifyContent: 'start', textAlign: 'left', fontWeight: 400, fontSize: '0.78rem' }}>
                                                    "{s}"
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div className="grid-2">
                                        <div className="form-group">
                                            <label className="form-label">Amount (₹)</label>
                                            <input type="number" className="input" value={manualAmount} onChange={e => setManualAmount(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Category</label>
                                            <select className="input" value={manualCategory} onChange={e => setManualCategory(e.target.value)}>
                                                {Object.entries(MCC_LABELS).map(([mcc, label]) => (
                                                    <option key={mcc} value={mcc}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid-2">
                                        <div className="form-group">
                                            <label className="form-label">Time Window (Days)</label>
                                            <input type="number" className="input" value={manualDays} onChange={e => setManualDays(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">City Bound</label>
                                            <input type="text" className="input" value={manualCity} onChange={e => setManualCity(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <input type="checkbox" checked={manualProof} onChange={e => setManualProof(e.target.checked)} id="proof-req" />
                                        <label htmlFor="proof-req" className="form-label" style={{ marginBottom: 0 }}>Require Proof / Invoice (Tier 3)</label>
                                    </div>
                                </div>
                            )}

                            {/* Bulk Deployment Section */}
                            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <h4 style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Users size={15} style={{ color: 'var(--accent-primary)' }} /> Bulk Deployment
                                    </h4>
                                    <div className="switch-container" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: '0.75rem', color: isBulk ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{isBulk ? 'Enabled' : 'Disabled'}</span>
                                        <input type="checkbox" checked={isBulk} onChange={e => { setIsBulk(e.target.checked); if (!e.target.checked) setSelectedUsers([user.id]); }} />
                                    </div>
                                </div>

                                {isBulk && (
                                    <div className="grid-2" style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10 }}>
                                        {EMPLOYEES.map(emp => (
                                            <div key={emp.id}
                                                onClick={() => toggleUserSelection(emp.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 6, cursor: 'pointer',
                                                    background: selectedUsers.includes(emp.id) ? 'rgba(59,130,246,0.1)' : 'transparent',
                                                    border: `1px solid ${selectedUsers.includes(emp.id) ? 'var(--accent-primary)' : 'transparent'}`
                                                }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedUsers.includes(emp.id) ? 'var(--accent-primary)' : 'var(--border-subtle)' }} />
                                                <span style={{ fontSize: '0.75rem' }}>{emp.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {message && (
                                <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`} style={{ marginTop: 16 }}>
                                    {message.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                                    <span>{message.text}</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                {mode === 'nlp' && (
                                    <button className="btn btn-secondary" onClick={handleParse} disabled={parsing || !text.trim()} style={{ flex: 1 }}>
                                        {parsing ? <div className="spinner" /> : 'Parse Intent'}
                                    </button>
                                )}
                                <button className="btn btn-primary" onClick={handleCreate} disabled={creating || (mode === 'nlp' && !parseResult)} style={{ flex: 1 }}>
                                    {creating ? <div className="spinner" /> : (isBulk ? 'Deploy Bulk Rule' : 'Create & Lock')}
                                </button>
                            </div>
                        </div>

                        {/* Parse Result Preview (NLP Mode Only) */}
                        {mode === 'nlp' && parseResult && policy && (
                            <div className="card card-p animate-slide-in">
                                <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Extracted Policy</h3>
                                <div className="grid-2">
                                    <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10 }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>AMOUNT</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>₹{policy.amount}</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10 }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>CATEGORY</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{policy.categoryKeys?.[0] || 'Any'}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Active Intents */}
                    <div>
                        <div className="card card-p">
                            <div className="card-header">
                                <h3 style={{ fontSize: '0.9rem' }}>Active Rules</h3>
                                <span className="badge badge-active">{intents.filter(i => i.status === 'active').length} Active</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {intents.map(intent => (
                                    <div key={intent.id} className="card card-p" style={{ padding: 12 }}>
                                        <div style={{ fontSize: '0.78rem', marginBottom: 6 }}>"{intent.rawText}"</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className={`badge badge-tier${intent.enforcementTier}`}>Tier {intent.enforcementTier}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>₹{intent.amountRemaining} left</span>
                                        </div>
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
