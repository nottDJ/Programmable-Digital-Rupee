// src/pages/Analytics.jsx
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { getDashboardAnalytics } from '../api/client';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { TrendingUp, ShieldCheck, AlertTriangle, Target, Flame, Award } from 'lucide-react';

const MetricCard = ({ label, value, sub, color = '#3b82f6', icon }) => (
    <div className="stat-card" style={{ borderTop: `2px solid ${color}20` }}>
        <div className="stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 14px' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ fontSize: '0.82rem', fontWeight: 700, color: p.color }}>
                    {p.name}: {typeof p.value === 'number' && p.dataKey !== 'count' ? `₹${p.value.toLocaleString('en-IN')}` : p.value}
                </p>
            ))}
        </div>
    );
};

export default function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('overview');

    useEffect(() => {
        getDashboardAnalytics()
            .then(r => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div>
            <Header title="Analytics" subtitle="Spending insights & compliance metrics" />
            <div className="page-container"><div className="loading-overlay"><div className="spinner" /><p>Loading analytics...</p></div></div>
        </div>
    );

    if (!data) return (
        <div>
            <Header title="Analytics" subtitle="Spending insights & compliance metrics" />
            <div className="page-container"><div className="alert alert-error">Failed to load analytics.</div></div>
        </div>
    );

    const { stats, categorySpend, spendingTrend, intents, recentTransactions } = data;

    const categoryData = Object.entries(categorySpend || {}).map(([cat, amt]) => ({
        category: cat.charAt(0).toUpperCase() + cat.slice(1), amount: amt,
        color: { books: '#3b82f6', food: '#f59e0b', grocery: '#10b981', electronics: '#8b5cf6', medical: '#ef4444', education: '#06b6d4' }[cat] || '#6b7280'
    }));

    const intentComplianceData = intents.map(i => ({
        name: i.rawText.substring(0, 20) + '…',
        compliant: i.approvedTransactions,
        violations: i.violationCount,
        usedPct: i.amountLocked > 0 ? Math.round(i.amountUsed / i.amountLocked * 100) : 0
    }));

    const savingsRoiData = intents.map(i => ({
        intent: i.rawText.substring(0, 18) + '…',
        locked: i.amountLocked,
        used: i.amountUsed,
        saved: i.amountRemaining
    }));

    return (
        <div>
            <Header title="Analytics" subtitle="Compliance metrics, spending insights, leakage prevention" />
            <div className="page-container">

                {/* Tabs */}
                <div style={{ marginBottom: 20 }}>
                    <div className="tab-bar">
                        {['overview', 'intents', 'spending'].map(t => (
                            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Overview Tab ── */}
                {tab === 'overview' && (
                    <>
                        <div className="stat-grid" style={{ marginBottom: 24 }}>
                            <MetricCard label="Compliance Rate" value={`${stats.complianceRate}%`} sub={`${stats.approvedTransactions} of ${stats.totalTransactions} txns`} color="#10b981" icon={<ShieldCheck size={18} />} />
                            <MetricCard label="Total Spent" value={`₹${stats.totalSpent.toLocaleString('en-IN')}`} sub="Intent-compliant spending" color="#3b82f6" icon={<TrendingUp size={18} />} />
                            <MetricCard label="Leakage Prevented" value={`₹${stats.leakagePrevented.toLocaleString('en-IN')}`} sub={`${stats.rejectedTransactions} blocked payments`} color="#ef4444" icon={<AlertTriangle size={18} />} />
                            <MetricCard label="Rules Active" value={stats.activeIntents} sub="Programmable spending policies" color="#8b5cf6" icon={<Target size={18} />} />
                        </div>

                        {/* 7 day trend */}
                        <div className="card card-p" style={{ marginBottom: 20 }}>
                            <div className="card-header">
                                <div><h3 style={{ fontSize: '0.9rem' }}>7-Day Spending Trend</h3><p>Intent-compliant vs blocked amounts</p></div>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={spendingTrend} barSize={28}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="amount" name="Approved" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.85} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Leakage ROI */}
                        <div className="card card-p" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(6,182,212,0.04) 100%)', borderColor: 'rgba(16,185,129,0.15)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ fontSize: 40 }}>💵</div>
                                <div>
                                    <h3 style={{ fontSize: '1rem', color: 'var(--accent-green)', marginBottom: 4 }}>Leakage Prevention ROI</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        Your intent rules have <strong style={{ color: 'var(--text-primary)' }}>blocked ₹{stats.leakagePrevented.toLocaleString('en-IN')}</strong> in non-compliant spending.
                                        With a <strong style={{ color: 'var(--text-primary)' }}>{stats.complianceRate}% compliance rate</strong>, your programmable wallet is enforcing intent-bound spending effectively.
                                    </p>
                                    <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                                        <div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Violation Attempts</div>
                                            <div style={{ fontWeight: 700, color: 'var(--accent-red)' }}>{stats.rejectedTransactions}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Active Rules</div>
                                            <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{stats.activeIntents}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Locked Value</div>
                                            <div style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>₹{(data.wallet?.lockedBalance || 0).toLocaleString('en-IN')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ── Intents Tab ── */}
                {tab === 'intents' && (
                    <>
                        <div className="card card-p" style={{ marginBottom: 20 }}>
                            <div className="card-header">
                                <div><h3 style={{ fontSize: '0.9rem' }}>Intent Compliance vs Violations</h3><p>Per-rule performance breakdown</p></div>
                            </div>
                            {intentComplianceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={intentComplianceData} barSize={22} barGap={4}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                                        <Bar dataKey="compliant" name="Compliant" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.85} />
                                        <Bar dataKey="violations" name="Violations" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.85} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div className="empty-state"><div className="empty-icon">📊</div><h4>No intent data</h4></div>}
                        </div>

                        {/* Intent usage table */}
                        <div className="card card-p">
                            <div className="card-header">
                                <h3 style={{ fontSize: '0.9rem' }}>Intent Budget Utilisation</h3>
                            </div>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Intent</th><th>Locked</th><th>Used</th><th>Remaining</th><th>Utilisation</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {intents.map(i => {
                                            const pct = i.amountLocked > 0 ? (i.amountUsed / i.amountLocked * 100) : 0;
                                            return (
                                                <tr key={i.id}>
                                                    <td style={{ maxWidth: 200 }}>
                                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                                            {i.rawText.substring(0, 45)}…
                                                        </div>
                                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{i.nftTokenId}</div>
                                                    </td>
                                                    <td>₹{i.amountLocked.toLocaleString('en-IN')}</td>
                                                    <td style={{ color: 'var(--accent-primary)' }}>₹{i.amountUsed.toLocaleString('en-IN')}</td>
                                                    <td style={{ color: 'var(--accent-green)' }}>₹{i.amountRemaining.toLocaleString('en-IN')}</td>
                                                    <td style={{ minWidth: 120 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <div className="progress-bar-outer" style={{ flex: 1, height: 5 }}>
                                                                <div className="progress-bar-inner" style={{ width: `${pct}%`, background: pct > 80 ? '#ef4444' : '#3b82f6' }} />
                                                            </div>
                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pct.toFixed(0)}%</span>
                                                        </div>
                                                    </td>
                                                    <td><span className={`badge badge-${i.status}`}>{i.status}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* ── Spending Tab ── */}
                {tab === 'spending' && (
                    <>
                        <div className="card card-p" style={{ marginBottom: 20 }}>
                            <div className="card-header">
                                <div><h3 style={{ fontSize: '0.9rem' }}>Spending by Category</h3><p>Intent-classified merchant breakdown</p></div>
                            </div>
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={categoryData} layout="vertical" barSize={18}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                        <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                                        <YAxis type="category" dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="amount" name="Spent" radius={[0, 4, 4, 0]}>
                                            {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div className="empty-state"><div className="empty-icon">📊</div><h4>No spending data yet</h4><p>Simulate transactions to see breakdown</p></div>}
                        </div>

                        {/* Transaction log */}
                        <div className="card card-p">
                            <div className="card-header">
                                <h3 style={{ fontSize: '0.9rem' }}>Full Transaction Log</h3>
                                <span className="badge badge-active">{recentTransactions.length} records</span>
                            </div>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>ID</th><th>Merchant</th><th>MCC</th><th>Amount</th><th>Status</th><th>Processing</th><th>Timestamp</th></tr></thead>
                                    <tbody>
                                        {recentTransactions.length === 0 ? (
                                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No transactions yet</td></tr>
                                        ) : recentTransactions.map(t => (
                                            <tr key={t.id}>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.id}</td>
                                                <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{t.merchantName}</td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{t.merchantMCC}</td>
                                                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{t.amount.toLocaleString('en-IN')}</td>
                                                <td>
                                                    <span className={`badge badge-${t.status === 'approved' ? 'approved' : 'rejected'}`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                    {t.validationDetails?.processingTimeMs ? `${t.validationDetails.processingTimeMs}ms` : '—'}
                                                </td>
                                                <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                    {new Date(t.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
