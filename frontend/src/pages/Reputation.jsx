// src/pages/Reputation.jsx
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { getReputation } from '../api/client';
import { useUser } from '../context/UserContext';
import { Shield, Star, TrendingUp, Award, Zap, CheckCircle, XCircle } from 'lucide-react';

const ScoreArc = ({ score }) => {
    const pct = score / 1000;
    const r = 70;
    const circ = 2 * Math.PI * r;
    const strokeDash = circ * pct;
    const color = score >= 800 ? '#10b981' : score >= 600 ? '#3b82f6' : score >= 400 ? '#f59e0b' : '#ef4444';

    return (
        <svg width="180" height="100" viewBox="0 0 180 100">
            {/* Track */}
            <path
                d="M 20 90 A 70 70 0 0 1 160 90"
                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"
            />
            {/* Score arc */}
            <path
                d="M 20 90 A 70 70 0 0 1 160 90"
                fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(strokeDash / circ) * (Math.PI * r)} ${circ}`}
                strokeDashoffset="0"
                style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            <text x="90" y="80" textAnchor="middle" fill={color} fontSize="28" fontWeight="800">{score}</text>
            <text x="90" y="95" textAnchor="middle" fill="#475569" fontSize="10">/1000</text>
        </svg>
    );
};

const EVENT_ICONS = {
    intent_compliance: { icon: '✅', color: '#10b981' },
    intent_violation_attempt: { icon: '❌', color: '#ef4444' },
    escrow_released: { icon: '🔓', color: '#3b82f6' },
    escrow_clawback_misuse: { icon: '⚠️', color: '#f59e0b' },
    proof_submitted: { icon: '📄', color: '#06b6d4' },
    intent_created: { icon: '⚡', color: '#8b5cf6' },
    savings_milestone: { icon: '💰', color: '#10b981' },
};

export default function Reputation() {
    const [rep, setRep] = useState(null);
    const [loading, setLoading] = useState(true);

    const { user } = useUser();

    useEffect(() => {
        if (!user) return;
        getReputation(user.id)
            .then(r => setRep(r.data.reputation))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    if (loading) return (
        <div>
            <Header title="Reputation Score" subtitle="Behaviour-based credit system" />
            <div className="page-container"><div className="loading-overlay"><div className="spinner" /></div></div>
        </div>
    );

    if (!rep) return (
        <div>
            <Header title="Reputation Score" subtitle="Behaviour-based credit system" />
            <div className="page-container"><div className="alert alert-error">Failed to load reputation data.</div></div>
        </div>
    );

    const levelColor = rep.currentScore >= 800 ? '#10b981' : rep.currentScore >= 600 ? '#3b82f6' : rep.currentScore >= 400 ? '#f59e0b' : '#ef4444';
    const { creditTier } = rep;

    return (
        <div>
            <Header title="Reputation Score" subtitle="Intent compliance powers your credit eligibility" />
            <div className="page-container">

                <div className="grid-2" style={{ alignItems: 'start', gap: 24 }}>

                    {/* ── Left: Score display ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Main Score Card */}
                        <div className="card card-p" style={{ textAlign: 'center', borderColor: `${levelColor}25` }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
                                Programmable Wallet Credit Score
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                                <ScoreArc score={rep.currentScore} />
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: levelColor, marginBottom: 4 }}>{rep.levelLabel}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Intent Compliance Score</div>

                            {/* Score bar ticks */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                {['0', '200', '400', '600', '800', '1000'].map(v => <span key={v}>{v}</span>)}
                            </div>
                            <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                                {[
                                    { pct: 40, color: '#ef4444' }, { pct: 20, color: '#f59e0b' },
                                    { pct: 20, color: '#3b82f6' }, { pct: 20, color: '#10b981' }
                                ].map((seg, i) => (
                                    <div key={i} style={{ position: 'absolute', height: '100%', width: `${seg.pct}%`, left: `${[0, 40, 60, 80][i]}%`, background: seg.color, opacity: 0.5 }} />
                                ))}
                                {/* Needle */}
                                <div style={{ position: 'absolute', left: `${rep.currentScore / 10}%`, top: -2, width: 2, height: 10, background: 'white', borderRadius: 1, transform: 'translateX(-50%)' }} />
                            </div>
                        </div>

                        {/* Credit Tier Card */}
                        <div className="card card-p" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.06) 100%)', borderColor: 'rgba(59,130,246,0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div style={{ fontSize: 28 }}>🏦</div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Credit Tier</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{creditTier.tier}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4 }}>Max Loan</div>
                                    <div style={{ fontWeight: 700, color: creditTier.maxLoan > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                        {creditTier.maxLoan > 0 ? `₹${creditTier.maxLoan.toLocaleString('en-IN')}` : 'Not Eligible'}
                                    </div>
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4 }}>Interest Rate</div>
                                    <div style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>
                                        {creditTier.interestRate ? `${creditTier.interestRate}% p.a.` : '—'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="card card-p">
                            <h3 style={{ fontSize: '0.9rem', marginBottom: 14 }}>Compliance Statistics</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    { label: 'Total Transactions', value: rep.stats.totalTransactions, icon: '📊' },
                                    { label: 'Compliant', value: rep.stats.compliantCount, icon: '✅', color: '#10b981' },
                                    { label: 'Violations', value: rep.stats.violationCount, icon: '❌', color: '#ef4444' },
                                    { label: 'Compliance Rate', value: `${rep.stats.complianceRate}%`, icon: '🎯', color: levelColor },
                                ].map(item => (
                                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ fontSize: 16 }}>{item.icon}</span>
                                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                                        </div>
                                        <span style={{ fontWeight: 700, color: item.color || 'var(--text-primary)', fontSize: '0.9rem' }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Events timeline ── */}
                    <div className="card card-p">
                        <h3 style={{ fontSize: '0.9rem', marginBottom: 16 }}>Score History</h3>
                        {rep.recentEvents.length === 0 ? (
                            <div className="empty-state"><div className="empty-icon">📋</div><h4>No events yet</h4></div>
                        ) : (
                            <div style={{ position: 'relative' }}>
                                {/* Timeline line */}
                                <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 1, background: 'var(--border-subtle)' }} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                    {rep.recentEvents.map((evt, i) => {
                                        const meta = EVENT_ICONS[evt.event] || { icon: '•', color: '#6b7280' };
                                        const isPositive = evt.delta > 0;
                                        return (
                                            <div key={i} style={{ display: 'flex', gap: 14, paddingLeft: 8, paddingBottom: 20, position: 'relative' }}>
                                                {/* Dot */}
                                                <div style={{ width: 18, height: 18, borderRadius: '50%', background: meta.color + '20', border: `2px solid ${meta.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, flexShrink: 0, zIndex: 1, marginTop: 2 }}>
                                                    {meta.icon}
                                                </div>
                                                <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 10, padding: '10px 14px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{evt.description}</span>
                                                        <span style={{ fontWeight: 800, fontSize: '0.82rem', color: isPositive ? '#10b981' : '#ef4444', marginLeft: 8, flexShrink: 0 }}>
                                                            {isPositive ? '+' : ''}{evt.delta}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                                        <span>{new Date(evt.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                        {evt.newScore && <span>Score → <strong style={{ color: 'var(--text-secondary)' }}>{evt.newScore}</strong></span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
