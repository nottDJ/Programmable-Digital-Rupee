/**
 * Transaction Routes
 * POST /api/transactions/validate  - Validate & simulate a UPI transaction
 * GET  /api/transactions/user/:id  - Get transaction history for user
 * GET  /api/transactions/all       - All transactions (analytics)
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { validateTransaction } = require('../services/ruleEngine');
const { getActiveIntentsByUser, getIntentById, updateIntentUsage, recordViolation } = require('../data/intents');
const { merchants } = require('../data/merchants');
const { getUserById } = require('../data/users');
const { addTransaction, getTransactionsByUser, getAllTransactions } = require('../data/transactions');
const { recordReputationEvent } = require('../services/reputationEngine');

/**
 * POST /api/transactions/validate
 * Main transaction validation endpoint
 * Simulates the UPI pre-settlement interception layer
 */
router.post('/validate', (req, res) => {
    try {
        const { userId, intentId, merchantId, amount, proofProvided = false } = req.body;

        // Fetch user
        const user = getUserById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // Fetch merchant
        const merchant = merchants.find(m => m.id === merchantId);
        if (!merchant) return res.status(404).json({ success: false, error: 'Merchant not found' });

        // Find matching intent
        let intent;
        if (intentId) {
            intent = getIntentById(intentId);
        } else {
            // Auto-select best matching active intent
            const activeIntents = getActiveIntentsByUser(userId);
            intent = activeIntents.find(i => i.amountRemaining >= amount);
        }

        if (!intent) {
            return res.status(404).json({
                success: false,
                error: 'No active intent found for this transaction. Please create an intent first.'
            });
        }

        // Run the rule engine
        const validationResult = validateTransaction(intent, merchant, amount, { proofProvided });

        const txnId = `TXN${String(Date.now()).slice(-8)}`;

        // Build transaction record
        const txnRecord = {
            id: txnId,
            userId,
            intentId: intent.id,
            merchantId: merchant.id,
            merchantName: merchant.name,
            merchantMCC: merchant.mcc,
            merchantCategory: merchant.category,
            amount,
            status: validationResult.approved ? 'approved' : 'rejected',
            timestamp: new Date().toISOString(),
            validationDetails: {
                checks: validationResult.checks,
                processingTimeMs: validationResult.processingTimeMs
            },
            upiSettlementRef: validationResult.upiSettlementRef,
            violationReason: validationResult.violationReason,
            riskAssessment: validationResult.riskAssessment
        };

        addTransaction(txnRecord);

        if (validationResult.approved) {
            // Update intent usage
            updateIntentUsage(intent.id, amount);
            // Update reputation
            recordReputationEvent(userId, 'intent_compliance',
                `Compliant transaction of ₹${amount} at ${merchant.name}`);
        } else {
            // Record violation
            recordViolation(intent.id);
            // Penalize reputation
            recordReputationEvent(userId, 'intent_violation_attempt',
                `Blocked transaction at ${merchant.name}: ${validationResult.violationReason?.substring(0, 80)}`);
        }

        return res.json({
            success: true,
            transactionId: txnId,
            approved: validationResult.approved,
            validationResult,
            transaction: txnRecord,
            intent: {
                id: intent.id,
                amountRemaining: intent.amountRemaining - (validationResult.approved ? amount : 0),
                amountUsed: intent.amountUsed + (validationResult.approved ? amount : 0)
            }
        });

    } catch (err) {
        console.error('Transaction validation error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Get transaction history for user
router.get('/user/:userId', (req, res) => {
    try {
        const txns = getTransactionsByUser(req.params.userId);
        return res.json({ success: true, transactions: txns.reverse(), count: txns.length });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Get all transactions (analytics)
router.get('/all', (req, res) => {
    try {
        const txns = getAllTransactions();
        return res.json({ success: true, transactions: txns.reverse(), count: txns.length });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Get merchants list (for simulation dropdown)
router.get('/merchants', (req, res) => {
    return res.json({ success: true, merchants });
});

module.exports = router;
