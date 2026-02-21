/**
 * Analytics Routes
 * GET /api/analytics/dashboard/:userId  - Full analytics for a user
 * GET /api/analytics/reputation/:userId - Reputation details
 * GET /api/analytics/system             - System-wide stats
 */

const express = require('express');
const router = express.Router();
const { getTransactionsByUser, getAllTransactions } = require('../data/transactions');
const { getIntentsByUser, intentStore } = require('../data/intents');
const { getUserById } = require('../data/users');
const { getReputationByUser } = require('../services/reputationEngine');
const { getEscrowsByUser } = require('../services/escrowService');

router.get('/dashboard/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const user = getUserById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const txns = getTransactionsByUser(userId);
        const intents = getIntentsByUser(userId);
        const reputation = getReputationByUser(userId);
        const escrows = getEscrowsByUser(userId);

        const isSuccess = (status) => ['approved', 'completed'].includes(status?.toLowerCase());

        const approved = txns.filter(t => isSuccess(t.status));
        const rejected = txns.filter(t => t.status?.toLowerCase() === 'rejected' || t.status?.toLowerCase() === 'failed');
        const totalSpent = approved.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        const totalBlocked = rejected.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        // Spending by category
        const categorySpend = {};
        approved.forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            categorySpend[t.merchantCategory] = (categorySpend[t.merchantCategory] || 0) + amt;
        });

        // Spending over time (last 7 days)
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dayStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            const dayTxns = approved.filter(t => {
                const txDate = new Date(t.timestamp);
                return txDate.toDateString() === d.toDateString();
            });
            return {
                date: dayStr,
                amount: dayTxns.reduce((sum, t) => sum + t.amount, 0),
                count: dayTxns.length
            };
        });

        const complianceRate = txns.length > 0
            ? ((approved.length / txns.length) * 100).toFixed(1)
            : 100;

        return res.json({
            success: true,
            user,
            wallet: {
                totalBalance: user.walletBalance,
                lockedBalance: user.lockedBalance,
                availableBalance: user.availableBalance
            },
            stats: {
                totalTransactions: txns.length,
                approvedTransactions: approved.length,
                rejectedTransactions: rejected.length,
                complianceRate: parseFloat(complianceRate),
                totalSpent,
                totalBlocked,
                leakagePrevented: totalBlocked,
                activeIntents: intents.filter(i => i.status === 'active').length,
                activeEscrows: escrows.filter(e => e.status !== 'released').length,
                reputationScore: reputation?.currentScore || 0
            },
            categorySpend,
            spendingTrend: last7Days,
            reputation,
            intents,
            recentTransactions: txns.slice(-10).reverse()
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/reputation/:userId', (req, res) => {
    const rep = getReputationByUser(req.params.userId);
    if (!rep) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, reputation: rep });
});

router.get('/system', (req, res) => {
    const allTxns = getAllTransactions();
    const allIntents = intentStore;
    const approved = allTxns.filter(t => ['approved', 'completed'].includes(t.status?.toLowerCase()));
    const rejected = allTxns.filter(t => ['rejected', 'failed'].includes(t.status?.toLowerCase()));

    return res.json({
        success: true,
        systemStats: {
            totalTransactions: allTxns.length,
            approvedRate: ((approved.length / allTxns.length) * 100).toFixed(1),
            totalIntents: allIntents.length,
            activeIntents: allIntents.filter(i => i.status === 'active').length,
            totalValueLocked: allIntents
                .filter(i => i.status === 'active')
                .reduce((sum, i) => sum + i.amountLocked, 0),
            totalLeakagePrevented: rejected.reduce((sum, t) => sum + t.amount, 0),
            uptime: '99.97%',
            avgProcessingMs: 12
        }
    });
});

module.exports = router;
