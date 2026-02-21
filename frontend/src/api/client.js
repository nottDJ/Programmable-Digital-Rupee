// src/api/client.js
// Centralized API client for all backend calls
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:5000/api';
const DEFAULT_USER = 'USR001'; // Simulated logged-in user

const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Auth ──────────────────────────────────────────────────────
export const login = (upiId, password) => api.post('/auth/login', { upiId, password });
export const logout = () => api.post('/auth/logout');

// ── User ─────────────────────────────────────────────────────
export const getUser = (userId) => api.get(`/users/${userId}`);

// ── Intents ──────────────────────────────────────────────────
export const parseIntent = (text) => api.post('/intents/parse', { text });
export const createIntent = (rawText, parsedPolicy, userId) =>
    api.post('/intents/create', { userId, rawText, parsedPolicy });
export const getUserIntents = (userId) => api.get(`/intents/user/${userId}`);
export const bulkCreateIntents = (payload) => api.post('/intents/bulk-create', payload);
export const cancelIntent = (intentId) => api.delete(`/intents/${intentId}`);

// ── Transactions ─────────────────────────────────────────────
export const validateTransaction = (payload) => api.post('/transactions/validate', payload);
export const getUserTransactions = (userId) => api.get(`/transactions/user/${userId}`);
export const getAllTransactions = () => api.get('/transactions/all');
export const getMerchants = () => api.get('/transactions/merchants');

// ── Escrow ────────────────────────────────────────────────────
export const getUserEscrows = (userId) => api.get(`/escrow/user/${userId}`);
export const getEscrowDetail = (id) => api.get(`/escrow/${id}`);
export const releaseMilestone = (escrowId, milestoneId, proof) =>
    api.post(`/escrow/${escrowId}/release/${milestoneId}`, { proof });
export const initiateClawback = (escrowId, reason, partialAmount) =>
    api.post(`/escrow/${escrowId}/clawback`, { reason, partialAmount });
export const modifyEscrow = (id, payload) => api.post(`/escrow/${id}/modify`, payload);

// ── Analytics ─────────────────────────────────────────────────
export const getDashboardAnalytics = (userId) => api.get(`/analytics/dashboard/${userId}`);
export const getReputation = (userId) => api.get(`/analytics/reputation/${userId}`);
export const getSystemStats = () => api.get('/analytics/system');


