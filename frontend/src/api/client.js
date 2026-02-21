// src/api/client.js
// Centralized API client for all backend calls
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const DEFAULT_USER = 'USR001'; // Simulated logged-in user

const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
});

// ── User ─────────────────────────────────────────────────────
export const getUser = (userId = DEFAULT_USER) => api.get(`/users/${userId}`);

// ── Intents ──────────────────────────────────────────────────
export const parseIntent = (text) => api.post('/intents/parse', { text });
export const createIntent = (rawText, parsedPolicy, userId = DEFAULT_USER) =>
    api.post('/intents/create', { userId, rawText, parsedPolicy });
export const getUserIntents = (userId = DEFAULT_USER) => api.get(`/intents/user/${userId}`);
export const cancelIntent = (intentId) => api.delete(`/intents/${intentId}`);

// ── Transactions ─────────────────────────────────────────────
export const validateTransaction = (payload) => api.post('/transactions/validate', payload);
export const getUserTransactions = (userId = DEFAULT_USER) => api.get(`/transactions/user/${userId}`);
export const getAllTransactions = () => api.get('/transactions/all');
export const getMerchants = () => api.get('/transactions/merchants');

// ── Escrow ────────────────────────────────────────────────────
export const getUserEscrows = (userId = DEFAULT_USER) => api.get(`/escrow/user/${userId}`);
export const getEscrowDetail = (id) => api.get(`/escrow/${id}`);
export const releaseMilestone = (escrowId, milestoneId, proof) =>
    api.post(`/escrow/${escrowId}/release/${milestoneId}`, { proof });
export const initiateClawback = (escrowId, reason, partialAmount) =>
    api.post(`/escrow/${escrowId}/clawback`, { reason, partialAmount });

// ── Analytics ─────────────────────────────────────────────────
export const getDashboardAnalytics = (userId = DEFAULT_USER) => api.get(`/analytics/dashboard/${userId}`);
export const getReputation = (userId = DEFAULT_USER) => api.get(`/analytics/reputation/${userId}`);
export const getSystemStats = () => api.get('/analytics/system');

export default api;
export { DEFAULT_USER };
