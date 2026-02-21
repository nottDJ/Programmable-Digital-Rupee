import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Login() {
    const [upiId, setUpiId] = useState('priya.sharma@cbdc');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useUser();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await login(upiId, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page" style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)'
        }}>
            <div className="card card-p" style={{ width: '100%', maxWidth: 400, border: '1px solid var(--border-subtle)' }}>
                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 60, height: 60,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        color: 'white',
                        marginBottom: 16
                    }}>
                        <ShieldCheck size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Programmable Rupee</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Secure Digital Currency Protocol</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                        <label className="form-label">UPI ID</label>
                        <input
                            type="text"
                            className="input"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="username@cbdc"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="alert alert-error" style={{ fontSize: '0.85rem' }}>
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                        style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                    >
                        {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <><LogIn size={16} /> Login to Wallet</>}
                    </button>
                </form>

                <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 10 }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Demo Credentials:<br />
                        <b>priya.sharma@cbdc</b> / <b>password123</b>
                    </p>
                </div>
            </div>
        </div>
    );
}
