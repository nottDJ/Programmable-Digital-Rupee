// src/components/Header.jsx
import { Bell, Wifi, Shield } from 'lucide-react';

export default function Header({ title, subtitle }) {
    return (
        <header className="header">
            <div className="header-title">
                <h2>{title}</h2>
                {subtitle && <p>{subtitle}</p>}
            </div>
            <div className="header-actions">
                <div className="badge-live">
                    <span className="live-dot" />
                    UPI Live
                </div>
                <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '7px', borderRadius: 8 }}
                    title="Notifications"
                >
                    <Bell size={16} />
                </button>
                <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '7px', borderRadius: 8 }}
                    title="Security"
                >
                    <Shield size={16} />
                </button>
            </div>
        </header>
    );
}
