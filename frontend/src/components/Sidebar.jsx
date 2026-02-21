// src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Zap, CreditCard, Shield, BarChart3,
    Lock, Coins, BookOpen, Settings, ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
    { label: 'Overview', path: '/', icon: LayoutDashboard },
    { label: 'Intent Builder', path: '/intent', icon: Zap },
    { label: 'Simulate UPI', path: '/simulate', icon: CreditCard },
    { label: 'Escrow Manager', path: '/escrow', icon: Lock },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
];

const MORE_ITEMS = [
    { label: 'Reputation Score', path: '/reputation', icon: Shield },
    { label: 'Architecture', path: '/architecture', icon: BookOpen },
];

export default function Sidebar() {
    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="logo-mark">
                    <div className="logo-icon">₹</div>
                    <div className="logo-text">
                        <span className="logo-title">Digital Rupee</span>
                        <span className="logo-sub">Programmable Wallet</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section-label">Main</div>
                {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={path === '/'}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Icon size={15} />
                        {label}
                    </NavLink>
                ))}

                <div className="nav-section-label" style={{ marginTop: 16 }}>Insights</div>
                {MORE_ITEMS.map(({ label, path, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Icon size={15} />
                        {label}
                    </NavLink>
                ))}

                {/* CBDC Status */}
                <div style={{ marginTop: 24, padding: '12px', background: 'rgba(59,130,246,0.06)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.12)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>RBI CBDC Node</span>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        UPI Simulation Layer Active<br />
                        Rule Engine: Online<br />
                        NPCI Mock: Connected
                    </p>
                </div>
            </nav>

            {/* User Footer */}
            <div className="sidebar-footer">
                <div className="user-chip">
                    <div className="user-avatar">PS</div>
                    <div className="user-info">
                        <div className="user-name">Priya Sharma</div>
                        <div className="user-id">USR001 • Chennai</div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
            </div>
        </aside>
    );
}
