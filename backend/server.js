/**
 * Programmable Digital Rupee – Intent-Bound Money Protocol
 * Backend Server Entry Point
 * 
 * Architecture: Express.js REST API
 * This layer sits between user wallets and UPI settlement rails
 * enforcing programmable spending rules before payment execution
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const intentRoutes = require('./routes/intents');
const transactionRoutes = require('./routes/transactions');
const escrowRoutes = require('./routes/escrow');
const analyticsRoutes = require('./routes/analytics');

const { getUserById } = require('./data/users');
const { merchants } = require('./data/merchants');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

// Rate limiting – production would use Redis-backed distributed limits
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,  // 1 minute
    max: 300,                   // 300 req/min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Slow down.' }
});
app.use('/api/', limiter);

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Parsers ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logger ────────────────────────────────────────────────────────────────────
app.use(morgan('dev'));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/intents', intentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── Core User Route ───────────────────────────────────────────────────────────
app.get('/api/users/:id', (req, res) => {
    const user = getUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, user });
});

// Merchants list (also available under /api/transactions/merchants)
app.get('/api/merchants', (req, res) => {
    return res.json({ success: true, merchants });
});

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Digital Rupee Programmable Wallet API',
        version: '1.0.0-mvp',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ── Root ──────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        name: 'Programmable Digital Rupee – Intent-Bound Money Protocol',
        description: 'Wallet middleware layer enforcing programmable spending rules before UPI settlement',
        version: '1.0.0-mvp',
        endpoints: {
            intents: '/api/intents',
            transactions: '/api/transactions',
            escrow: '/api/escrow',
            analytics: '/api/analytics',
            health: '/api/health'
        }
    });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
    res.status(404).json({ success: false, error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ success: false, error: 'Internal server error', detail: err.message });
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════════════════╗');
    console.log('  ║   🏦 Digital Rupee Programmable Wallet – Backend     ║');
    console.log(`  ║   🚀 Server running on http://localhost:${PORT}         ║`);
    console.log('  ║   📡 UPI Simulation Layer: ACTIVE                    ║');
    console.log('  ║   🔒 Rule Engine: ONLINE                             ║');
    console.log('  ╚══════════════════════════════════════════════════════╝');
    console.log('');
});

module.exports = app;
