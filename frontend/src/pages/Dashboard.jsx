// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { getDashboardAnalytics } from '../api/client';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    Wallet, TrendingUp, ShieldCheck, AlertTriangle,
    Zap, Lock, Star, ArrowUpRight, CheckCircle, XCircle
} from 'lucide-react';

const CATEGORY_COLORS = {
    books: '#3b82f6',
    food: '#f59e0b',
    grocery: '#10b981',
    electronics: '#8b5cf6',
    medical: '#ef4444',
    education: '#06b6d4',
    mixed: '#6b7280'
};

const formatINR = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatINR(payload[0].value)}</p>
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardAnalytics()
            .then(r => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div>
                <Header title="Overview" subtitle="Digital Rupee Programmable Wallet" />
                <div className="page-container">
                    <div className="loading-overlay"><div className="spinner" /><p>Loading dashboard...</p></div>
                </div>
            </div>
        );
    }

    if (!data) return (
        <div>
            <Header title="Overview" subtitle="Digital Rupee Programmable Wallet" />
            <div className="page-container">
                <div className="alert alert-error"><XCircle size={16} /><span>Failed to load dashboard. Make sure the backend server is running on port 5000.</span></div>
            </div>
        </div>
    );

    const { wallet, stats, categorySpend, spendingTrend, recentTransactions, reputation } = data;

    const pieData = Object.entries(categorySpend || {}).map(([cat, amt]) => ({
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        value: amt,
        color: CATEGORY_COLORS[cat] || '#6b7280'
    }));

    return (
        <div>
            <Header title="Overview" subtitle="Digital Rupee Programmable Wallet" />
            <div className="page-container">

                {/* Wallet Display */}
                <div className="wallet-display" style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <div className="wallet-label">Total Wallet Balance</div>
                            <div className="wallet-amount">
                                <span className="currency">₹</span>
                                {wallet.totalBalance.toLocaleString('en-IN')}
                            </div>
                            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Locked in Intents</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-amber)' }}>₹{wallet.lockedBalance.toLocaleString('en-IN')}</div>
                                </div>
                                <div style={{ width: 1, background: 'var(--border-subtle)' }} />
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Available to Spend</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-green)' }}>₹{wallet.availableBalance.toLocaleString('en-IN')}</div>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4 }}>REPUTATION</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{stats.reputationScore}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/ 1000</div>
                            </div>
                            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4 }}>COMPLIANCE</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-green)' }}>{stats.complianceRate}%</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>rate</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stat Grid */}
                <div className="stat-grid">
                    <div className="stat-card">
                        <div className="stat-icon blue"><TrendingUp size={18} /></div>
                        <div className="stat-label">Total Spent</div>
                        <div className="stat-value">₹{stats.totalSpent.toLocaleString('en-IN')}</div>
                        <div className="stat-sub">{stats.approvedTransactions} approved transactions</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green"><ShieldCheck size={18} /></div>
                        <div className="stat-label">Leakage Prevented</div>
                        <div className="stat-value">₹{stats.leakagePrevented.toLocaleString('en-IN')}</div>
                        <div className="stat-sub">{stats.rejectedTransactions} blocked transactions</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon purple"><Zap size={18} /></div>
                        <div className="stat-label">Active Intents</div>
                        <div className="stat-value">{stats.activeIntents}</div>
                        <div className="stat-sub">Programmable spending rules</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon amber"><Lock size={18} /></div>
                        <div className="stat-label">Active Escrows</div>
                        <div className="stat-value">{stats.activeEscrows}</div>
                        <div className="stat-sub">Milestone-based payments</div>
                    </div>
                </div>

                <div className="grid-2" style={{ marginBottom: 24 }}>
                    {/* Spending Trend Chart */}
                    <div className="card card-p">
                        <div className="card-header">
                            <div>
                                <h3 style={{ fontSize: '0.9rem' }}>Spending Trend</h3>
                                <p>Last 7 days</p>
                            </div>
                            <span className="badge badge-active">Live</span>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={spendingTrend}>
                                <defs>
                                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fill="url(#spendGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Spend by Category Pie */}
                    <div className="card card-p">
                        <div className="card-header">
                            <div>
                                <h3 style={{ fontSize: '0.9rem' }}>Spending by Category</h3>
                                <p>Intent-classified breakdown</p>
                            </div>
                        </div>
                        {pieData.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                <ResponsiveContainer width={140} height={140}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60}
                                            dataKey="value" stroke="none">
                                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ flex: 1 }}>
                                    {pieData.map((item) => (
                                        <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item.name}</span>
                                            </div>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{item.value.toLocaleString('en-IN')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state"><div className="empty-icon">📊</div><h4>No spending data yet</h4><p>Simulate transactions to see breakdown</p></div>
                        )}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="card card-p">
                    <div className="card-header">
                        <div>
                            <h3 style={{ fontSize: '0.9rem' }}>Recent Transactions</h3>
                            <p>All transaction attempts with validation results</p>
                        </div>
                        <a href="/simulate" style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            Simulate <ArrowUpRight size={12} />
                        </a>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Merchant</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>UPI Ref</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No transactions yet</td></tr>
                                ) : recentTransactions.map(txn => (
                                    <tr key={txn.id}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{txn.merchantName}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MCC {txn.merchantMCC}</div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 20, background: `${CATEGORY_COLORS[txn.merchantCategory]}18`, color: CATEGORY_COLORS[txn.merchantCategory] || '#6b7280' }}>
                                                {txn.merchantCategory}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{txn.amount.toLocaleString('en-IN')}</td>
                                        <td>
                                            {txn.status === 'approved' ? (
                                                <span className="badge badge-approved"><CheckCircle size={10} /> Approved</span>
                                            ) : (
                                                <span className="badge badge-rejected"><XCircle size={10} /> Rejected</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                            {txn.upiSettlementRef ? txn.upiSettlementRef.substring(0, 18) + '...' : '—'}
                                        </td>
                                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {new Date(txn.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
