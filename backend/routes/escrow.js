/**
 * Escrow Routes
 * GET  /api/escrow/user/:userId       - Get all escrows for user
 * POST /api/escrow/create             - Create new escrow
 * POST /api/escrow/:id/release/:msId  - Release a milestone
 * POST /api/escrow/:id/clawback       - Initiate clawback
 */

const express = require('express');
const router = express.Router();
const { getEscrowsByUser, getEscrowById, releaseMilestone, initiateClawback, createEscrow } = require('../services/escrowService');
const { recordReputationEvent } = require('../services/reputationEngine');

router.get('/user/:userId', (req, res) => {
    const escrows = getEscrowsByUser(req.params.userId);
    return res.json({ success: true, escrows });
});

router.get('/:id', (req, res) => {
    const escrow = getEscrowById(req.params.id);
    if (!escrow) return res.status(404).json({ success: false, error: 'Escrow not found' });
    return res.json({ success: true, escrow });
});

router.post('/create', (req, res) => {
    try {
        const { userId, intentId, title, milestones } = req.body;
        if (!userId || !milestones?.length) {
            return res.status(400).json({ success: false, error: 'userId and milestones are required' });
        }
        const escrow = createEscrow(userId, intentId, title, milestones);
        return res.status(201).json({ success: true, escrow });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/:id/release/:milestoneId', (req, res) => {
    try {
        const { proof } = req.body;
        const result = releaseMilestone(req.params.id, req.params.milestoneId, proof);

        if (result.success) {
            const escrow = getEscrowById(req.params.id);
            recordReputationEvent(escrow?.userId, 'escrow_released',
                `Milestone released: ₹${result.amountReleased} from escrow ${req.params.id}`);
        }

        return res.json(result);
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/:id/clawback', (req, res) => {
    try {
        const { reason, partialAmount } = req.body;
        const result = initiateClawback(req.params.id, reason || 'unused', partialAmount);

        if (result.success) {
            const escrow = getEscrowById(req.params.id);
            if (reason === 'misuse') {
                recordReputationEvent(escrow?.userId, 'escrow_clawback_misuse',
                    `Clawback initiated for misuse: ₹${result.clawbackAmount}`);
            }
        }

        return res.json(result);
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
