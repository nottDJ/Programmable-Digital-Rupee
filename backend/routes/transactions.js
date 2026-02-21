/**
 * Transaction Routes
 */

const express = require('express');
const router = express.Router();
const { validateTransaction } = require('../services/ruleEngine');
const { getIntentsByUser, getIntentById, updateIntentUsage, recordViolation } = require('../data/intents');
const { merchants } = require('../data/merchants');
const { getUserById, updateUserBalance } = require('../data/users');
const { addTransaction, getTransactionsByUser, transactions } = require('../data/transactions');
const { recordReputationEvent } = require('../services/reputationEngine');

/**
 * Validate and Process a UPI Transaction
 * POST /api/transactions/validate
 */
router.post('/validate', (req, res) => {
    try {
        const { userId, intentId, merchantId, amount, proofProvided = false, emergencyReason = null } = req.body;
        const emergencyOverride = !!emergencyReason;

        const user = getUserById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const merchant = merchants.find(m => m.id === merchantId);
        if (!merchant) return res.status(404).json({ success: false, error: 'Merchant not found' });

        // Auto-select intent if not provided
        let intent = intentId ? getIntentById(intentId) : null;
        if (!intent && !emergencyOverride) {
            intent = getIntentsByUser(userId).find(i => i.status === 'active' && i.amountRemaining >= amount);
        }

        // Pre-validation: Check if user has enough funds
        if (emergencyOverride) {
            if (user.walletBalance < amount) {
                return res.status(400).json({ success: false, error: 'Insufficient total balance for emergency payment' });
            }
        } else {
            // For regular transactions, we check against available balance
            if (user.availableBalance < amount && (!intent || intent.amountRemaining < amount)) {
                return res.status(400).json({ success: false, error: 'Insufficient available balance' });
            }
        }

        // Run the rule engine
        const validationResult = validateTransaction(intent, merchant, amount, { proofProvided, emergencyOverride });

        const txnId = `TXN-${Date.now()}`;

        // Build transaction record
        const txnRecord = {
            id: txnId,
            userId,
            userName: user.name,
            intentId: intent ? intent.id : null,
            merchantId: merchant.id,
            merchantName: merchant.name,
            merchantCategory: merchant.category,
            merchantMCC: merchant.mcc,
            amount: parseFloat(amount),
            status: validationResult.approved ? 'approved' : 'rejected',
            timestamp: new Date().toISOString(),
            upiRef: validationResult.upiSettlementRef,
            checks: validationResult.checks,
            isEmergency: emergencyOverride,
            emergencyReason,
            validationDetails: validationResult,
            riskAssessment: validationResult.riskAssessment
        };

        addTransaction(txnRecord);

        if (validationResult.approved) {
            const parsedAmount = parseFloat(amount);
            if (emergencyOverride) {
                updateUserBalance(userId, user.walletBalance - parsedAmount, user.lockedBalance);
                recordReputationEvent(userId, 'emergency_override', `Emergency payment of ₹${parsedAmount} at ${merchant.name}. Reason: ${emergencyReason}`);
            } else if (intent) {
                updateIntentUsage(intent.id, parsedAmount);
                updateUserBalance(userId, user.walletBalance - parsedAmount, user.lockedBalance - parsedAmount);
                recordReputationEvent(userId, 'intent_compliance', `Compliant transaction of ₹${parsedAmount} at ${merchant.name}`);
            }
        } else {
            if (intent) {
                recordViolation(intent.id);
            }
            recordReputationEvent(userId, 'intent_violation_attempt', `Blocked transaction at ${merchant.name}: ${validationResult.violationReason?.substring(0, 80)}`);
        }

        return res.json({
            success: true,
            transactionId: txnId,
            approved: validationResult.approved,
            validationResult,
            transaction: txnRecord
        });

    } catch (err) {
        console.error('Transaction validation error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Get recent transactions for a user
router.get('/user/:userId', (req, res) => {
    try {
        const history = getTransactionsByUser(req.params.userId);
        return res.json({ success: true, transactions: history });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Get all transactions (admin view)
router.get('/all', (req, res) => {
    return res.json({ success: true, transactions: transactions });
});

// Get all merchants
router.get('/merchants', (req, res) => {
    return res.json({ success: true, merchants });
});

module.exports = router;
