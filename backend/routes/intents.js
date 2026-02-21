/**
 * Intent Routes
 * POST /api/intents/parse   - Parse natural language intent
 * POST /api/intents/create  - Create a new intent
 * GET  /api/intents/:userId - Get all intents for a user
 * GET  /api/intents/detail/:id - Get intent detail
 * DELETE /api/intents/:id   - Cancel an intent
 */

const express = require('express');
const router = express.Router();
const { parseIntent } = require('../services/intentParser');
const { getIntentsByUser, getIntentById, createIntent, intentStore } = require('../data/intents');
const { getUserById, updateUserBalance } = require('../data/users');
const { recordReputationEvent } = require('../services/reputationEngine');

// Parse natural language intent (simulate LLM call)
router.post('/parse', (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length < 5) {
            return res.status(400).json({ success: false, error: 'Intent text is required (minimum 5 chars)' });
        }

        const result = parseIntent(text.trim());
        return res.json(result);
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Create and activate an intent
router.post('/create', (req, res) => {
    try {
        const { userId, rawText, parsedPolicy } = req.body;

        if (!userId || !rawText || !parsedPolicy) {
            return res.status(400).json({ success: false, error: 'userId, rawText, and parsedPolicy are required' });
        }

        const user = getUserById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // Check if user has sufficient balance
        if (parsedPolicy.amount > user.availableBalance) {
            return res.status(400).json({
                success: false,
                error: `Insufficient balance. Available: ₹${user.availableBalance.toLocaleString('en-IN')}, Required: ₹${parsedPolicy.amount.toLocaleString('en-IN')}`
            });
        }

        const newIntent = createIntent(userId, rawText, parsedPolicy);

        // Lock funds in user wallet
        updateUserBalance(
            userId,
            user.walletBalance,
            user.lockedBalance + parsedPolicy.amount
        );

        // Reputation boost for creating intent
        recordReputationEvent(userId, 'intent_created', `Created intent: "${rawText.substring(0, 50)}..."`);

        return res.status(201).json({
            success: true,
            intent: newIntent,
            message: `Intent created & ₹${parsedPolicy.amount} locked successfully`
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Get all intents for a user
router.get('/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const intents = getIntentsByUser(userId);
        return res.json({ success: true, intents, count: intents.length });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Get intent detail
router.get('/detail/:id', (req, res) => {
    try {
        const intent = getIntentById(req.params.id);
        if (!intent) return res.status(404).json({ success: false, error: 'Intent not found' });
        return res.json({ success: true, intent });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Cancel an intent and release funds
router.delete('/:id', (req, res) => {
    try {
        const intent = intentStore.find(i => i.id === req.params.id);
        if (!intent) return res.status(404).json({ success: false, error: 'Intent not found' });
        if (intent.status !== 'active') return res.status(400).json({ success: false, error: 'Intent is not active' });

        const user = getUserById(intent.userId);
        const unusedAmount = intent.amountRemaining;

        intent.status = 'cancelled';

        // Release unused funds back
        if (user) {
            updateUserBalance(user.id, user.walletBalance, Math.max(0, user.lockedBalance - unusedAmount));
        }

        return res.json({
            success: true,
            message: `Intent cancelled. ₹${unusedAmount} returned to available balance.`,
            releasedAmount: unusedAmount
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Get all intents (admin view)
router.get('/all', (req, res) => {
    return res.json({ success: true, intents: intentStore, count: intentStore.length });
});

module.exports = router;
