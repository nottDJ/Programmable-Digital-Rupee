// src/pages/Architecture.jsx
// System Architecture Documentation Page
import Header from '../components/Header';

const Section = ({ title, children, accent = '#3b82f6' }) => (
    <div className="card card-p" style={{ marginBottom: 20, borderLeft: `3px solid ${accent}` }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, display: 'inline-block' }} />
            {title}
        </h3>
        {children}
    </div>
);

const FlowStep = ({ step, title, desc, badge, color = 'var(--accent-primary)' }) => (
    <div style={{ display: 'flex', gap: 14, marginBottom: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${color}20`, border: `1px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color, flexShrink: 0, marginTop: 2 }}>{step}</div>
        <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
                {badge && <span style={{ fontSize: '0.65rem', background: `${color}18`, color, padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>{badge}</span>}
            </div>
            <p style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>{desc}</p>
        </div>
    </div>
);

const ApiEndpoint = ({ method, path, desc }) => {
    const colors = { GET: '#10b981', POST: '#3b82f6', DELETE: '#ef4444', PUT: '#f59e0b' };
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)', marginBottom: 6 }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: colors[method], background: `${colors[method]}15`, padding: '2px 7px', borderRadius: 4, minWidth: 44, textAlign: 'center' }}>{method}</span>
            <code style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1 }}>{path}</code>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{desc}</span>
        </div>
    );
};

const DbTable = ({ name, columns }) => (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 8, fontFamily: 'monospace' }}>⬛ {name}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {columns.map(c => (
                <span key={c} style={{ fontSize: '0.68rem', background: 'var(--bg-elevated)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 6, fontFamily: 'monospace' }}>{c}</span>
            ))}
        </div>
    </div>
);

export default function Architecture() {
    return (
        <div>
            <Header title="System Architecture" subtitle="Production-grade CBDC programmable wallet design" />
            <div className="page-container">

                {/* Overview */}
                <Section title="1. High-Level System Architecture" accent="#3b82f6">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
                        {[
                            { icon: '🧠', label: 'NLP Intent Layer', sub: 'LLM Parser → Policy JSON' },
                            { icon: '⚙️', label: 'Rule Engine', sub: 'MCC + Geo + Time + Amount' },
                            { icon: '🚦', label: 'UPI Intercept Layer', sub: 'Pre-settlement validation' },
                            { icon: '🔒', label: 'Escrow Service', sub: 'Milestone-based release' },
                            { icon: '📊', label: 'Analytics Engine', sub: 'Compliance + ROI metrics' },
                            { icon: '🏆', label: 'Reputation Layer', sub: 'Behaviour-based credit' },
                        ].map(item => (
                            <div key={item.label} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                                <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{item.label}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.sub}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 10, padding: '12px 16px' }}>
                        <p style={{ fontSize: '0.82rem', lineHeight: 1.7 }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Core Principle:</strong> The system sits as a <em>middleware layer</em> between the user's CBDC wallet and NPCI's UPI rails — intercepting payment intents, validating them against programmable rules, and only forwarding compliant transactions to settlement. NPCI infrastructure is never modified.
                        </p>
                    </div>
                </Section>

                {/* UPI Transaction Flow */}
                <Section title="2. UPI Transaction Flow — Step-by-Step Validation" accent="#10b981">
                    <FlowStep step="1" title="User Initiates UPI Payment" desc="User scans QR or enters merchant UPI ID. Payment intent is intercepted by the Programmable Wallet middleware before reaching NPCI." badge="INTERCEPT" color="#3b82f6" />
                    <FlowStep step="2" title="Merchant Metadata Lookup" desc="Engine fetches merchant's MCC code, city/geo coordinates, certified tier, GST-IN, and risk score from the merchant registry." badge="LOOKUP" color="#8b5cf6" />
                    <FlowStep step="3" title="Active Intent Resolution" desc="The engine finds the user's active intent that applies to this transaction (auto-matched or user-selected). Intent NFT token is loaded." badge="MATCH" color="#06b6d4" />
                    <FlowStep step="4" title="Rule Engine Validation Pipeline" desc="7-step pipeline: ① Intent active check ② Amount cap ③ Time window ④ Geo-fence ⑤ MCC category match ⑥ Merchant tier ⑦ Proof requirement" badge="VALIDATE" color="#f59e0b" />
                    <FlowStep step="5a" title="APPROVED → Forward to UPI" desc="If all checks pass, transaction is forwarded to NPCI UPI settlement with a unique UPI reference. Intent balance is decremented. Reputation score +10." badge="SETTLE" color="#10b981" />
                    <FlowStep step="5b" title="REJECTED → Block Before Settlement" desc="If any rule is violated, payment is blocked BEFORE reaching NPCI. Violation is logged. Reputation score -15. User notified with specific reason." badge="BLOCK" color="#ef4444" />
                    <FlowStep step="6" title="Post-Transaction Updates" desc="Intent usage updated. Reputation score adjusted. Analytics data written. If Tier-3: proof verification triggered. If savings split: auto-invest executed." badge="UPDATE" color="#3b82f6" />
                </Section>

                {/* API Endpoints */}
                <Section title="3. API Interaction Flow — REST Endpoints" accent="#8b5cf6">
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Intent Management</div>
                        <ApiEndpoint method="POST" path="/api/intents/parse" desc="Parse NL text → policy JSON" />
                        <ApiEndpoint method="POST" path="/api/intents/create" desc="Create & lock intent funds" />
                        <ApiEndpoint method="GET" path="/api/intents/user/:id" desc="Get all user intents" />
                        <ApiEndpoint method="DELETE" path="/api/intents/:id" desc="Cancel intent, release funds" />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Transaction Simulation</div>
                        <ApiEndpoint method="POST" path="/api/transactions/validate" desc="Run rule engine, simulate UPI" />
                        <ApiEndpoint method="GET" path="/api/transactions/user/:id" desc="Transaction history" />
                        <ApiEndpoint method="GET" path="/api/transactions/merchants" desc="Merchant metadata list" />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Escrow & Analytics</div>
                        <ApiEndpoint method="POST" path="/api/escrow/:id/release/:msId" desc="Release milestone on proof" />
                        <ApiEndpoint method="POST" path="/api/escrow/:id/clawback" desc="Initiate fund clawback" />
                        <ApiEndpoint method="GET" path="/api/analytics/dashboard/:id" desc="Full dashboard data" />
                        <ApiEndpoint method="GET" path="/api/analytics/reputation/:id" desc="Reputation score + events" />
                    </div>
                </Section>

                {/* Database Schema */}
                <Section title="4. Database Schema (PostgreSQL)" accent="#f59e0b">
                    <DbTable name="users" columns={['id PK', 'name', 'upi_id', 'wallet_balance', 'locked_balance', 'kyc_status', 'city', 'lat', 'lng', 'reputation_score', 'credit_tier', 'created_at']} />
                    <DbTable name="intents" columns={['id PK', 'user_id FK', 'raw_text', 'parsed_policy JSONB', 'status', 'amount_locked', 'amount_used', 'nft_token_id', 'enforcement_tier', 'violation_count', 'expires_at', 'created_at']} />
                    <DbTable name="transactions" columns={['id PK', 'user_id FK', 'intent_id FK', 'merchant_id FK', 'amount', 'status', 'validation_checks JSONB', 'upi_settlement_ref', 'violation_reason', 'risk_assessment JSONB', 'timestamp']} />
                    <DbTable name="merchants" columns={['id PK', 'name', 'upi_id', 'mcc', 'category', 'city', 'state', 'lat', 'lng', 'gst_in', 'tier', 'certified', 'product_tags[]', 'risk_score']} />
                    <DbTable name="escrows" columns={['id PK', 'user_id FK', 'intent_id FK', 'title', 'total_amount', 'released_amount', 'status', 'milestones JSONB', 'expires_at']} />
                    <DbTable name="reputation_events" columns={['id PK', 'user_id FK', 'event_type', 'delta', 'description', 'new_score', 'timestamp']} />
                </Section>

                {/* Multi-Tier Model */}
                <Section title="5. Multi-Tier Enforcement Model" accent="#06b6d4">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                            {
                                tier: 1, label: 'MCC-Based Filtering', color: '#10b981',
                                desc: 'Default mode. Merchant Category Code (ISO 18245) is matched against the intent\'s allowed MCC list. No invoice required. Covers 95% of everyday transactions.'
                            },
                            {
                                tier: 2, label: 'Certified Merchant Product-Tagging', color: '#3b82f6',
                                desc: 'Merchant must be registered in the RBI CBDC merchant registry with verified product tags. Used for high-risk or mixed-category merchants.'
                            },
                            {
                                tier: 3, label: 'Invoice + AI HSN Verification', color: '#8b5cf6',
                                desc: 'Required for loans, subsidies, or high-value payments (>₹5000). User must submit GST invoice with HSN product codes. AI validates items match intent categories.'
                            }
                        ].map(t => (
                            <div key={t.tier} style={{ display: 'flex', gap: 14, background: 'var(--bg-secondary)', borderRadius: 12, padding: '14px 16px', border: `1px solid ${t.color}20` }}>
                                <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: `${t.color}15`, border: `1px solid ${t.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: t.color, fontSize: '0.85rem' }}>T{t.tier}</div>
                                <div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem', marginBottom: 4 }}>{t.label}</div>
                                    <p style={{ fontSize: '0.78rem', lineHeight: 1.6 }}>{t.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* Edge Cases */}
                <Section title="6. Edge Case Handling" accent="#ef4444">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                            { title: 'Mixed-Category Merchants', icon: '🏪', desc: 'Merchants like supermarkets selling both books and food are classified as MCC 5999 (Miscellaneous). The rule engine blocks transactions at mixed merchants by default and requires Tier 2 verification.' },
                            { title: 'Merchant Misclassification', icon: '⚠️', desc: 'If a restaurant registers with MCC 5942 (Books), the risk-scoring engine detects anomaly (high risk score + product tag mismatch) and flags for manual review.' },
                            { title: 'Offline Transactions', icon: '📶', desc: 'For NFC/offline UPI payments, intent validation runs on-device with cached policy. Transaction is queued and re-validated when connectivity is restored.' },
                            { title: 'Category Spoofing', icon: '🛡️', desc: 'Merchants cannot change their NPCI-registered MCC. The rule engine validates against the registry, not merchant-provided data. Attempts flagged via anomaly detection.' },
                        ].map(item => (
                            <div key={item.title} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</span>
                                </div>
                                <p style={{ fontSize: '0.76rem', lineHeight: 1.6 }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* RBI Compliance */}
                <Section title="7. RBI / NPCI Compliance & Scalability" accent="#8b5cf6">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Compliance</div>
                            {['RBI CBDC Framework (Oct 2022)', 'NPCI UPI 2.0 Specifications', 'PCI-DSS for wallet security', 'DPDP Act 2023 (data privacy)', 'GST API integration for invoice validation', 'SEBI guidelines for CBDC investments'].map(item => (
                                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    <span style={{ color: '#10b981', fontSize: 10 }}>✓</span> {item}
                                </div>
                            ))}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scalability</div>
                            {['Horizontal microservice scaling', 'Redis-backed rule engine caching', 'Kafka event streaming for txn logs', 'PostgreSQL read replicas for analytics', 'CDN-cached merchant registry', '50ms target p99 validation latency'].map(item => (
                                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    <span style={{ color: '#3b82f6', fontSize: 10 }}>⚡</span> {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </Section>

            </div>
        </div>
    );
}
