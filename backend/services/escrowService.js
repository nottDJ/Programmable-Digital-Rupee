/**
 * Escrow Service
 * Milestone-based programmable payment system
 * In production: Smart contract equivalent on RBI's DLT infrastructure
 */

const { v4: uuidv4 } = require('uuid');

// In-memory escrow store
const escrows = [
    {
        id: "ESC001",
        userId: "USR001",
        intentId: "INT003",
        title: "Medical Treatment Escrow",
        totalAmount: 1500,
        releasedAmount: 0,
        pendingAmount: 1500,
        status: "locked",    // locked | partially_released | released | clawback
        milestones: [
            {
                id: "MST001",
                description: "Initial consultation fee",
                amount: 300,
                status: "completed",
                proofRequired: "consultation_receipt",
                proofProvided: true,
                completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                merchantId: "MRC007"
            },
            {
                id: "MST002",
                description: "Lab tests and diagnostics",
                amount: 700,
                status: "pending",
                proofRequired: "lab_report",
                proofProvided: false,
                completedAt: null,
                merchantId: null
            },
            {
                id: "MST003",
                description: "Medication purchase",
                amount: 500,
                status: "pending",
                proofRequired: "pharmacy_invoice",
                proofProvided: false,
                completedAt: null,
                merchantId: null
            }
        ],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
];

const escrowStore = escrows;

const getEscrowsByUser = (userId) => escrowStore.filter(e => e.userId === userId);
const getEscrowById = (id) => escrowStore.find(e => e.id === id);

/**
 * Release escrow milestone on proof submission
 */
const releaseMilestone = (escrowId, milestoneId, proof) => {
    const escrow = escrowStore.find(e => e.id === escrowId);
    if (!escrow) return { success: false, error: 'Escrow not found' };

    const milestone = escrow.milestones.find(m => m.id === milestoneId);
    if (!milestone) return { success: false, error: 'Milestone not found' };
    if (milestone.status === 'completed') return { success: false, error: 'Milestone already completed' };

    // Validate proof
    if (milestone.proofRequired && !proof) {
        return { success: false, error: `Proof required: ${milestone.proofRequired}` };
    }

    milestone.status = 'completed';
    milestone.proofProvided = true;
    milestone.completedAt = new Date().toISOString();

    escrow.releasedAmount += milestone.amount;
    escrow.pendingAmount -= milestone.amount;

    if (escrow.pendingAmount <= 0) {
        escrow.status = 'released';
    } else if (escrow.releasedAmount > 0) {
        escrow.status = 'partially_released';
    }

    return {
        success: true,
        milestoneId,
        amountReleased: milestone.amount,
        totalReleased: escrow.releasedAmount,
        pendingAmount: escrow.pendingAmount,
        escrowStatus: escrow.status,
        upiRef: `UPI-ESC-${Date.now()}`
    };
};

/**
 * Clawback Service
 * Recovers unused funds; applies penalty if applicable
 */
const initiateClawback = (escrowId, reason, partialAmount = null) => {
    const escrow = escrowStore.find(e => e.id === escrowId);
    if (!escrow) return { success: false, error: 'Escrow not found' };

    const pendingAmt = escrow.pendingAmount;
    const clawbackAmount = partialAmount || pendingAmt;
    const penaltyRate = reason === 'misuse' ? 0.02 : 0; // 2% penalty for misuse
    const penalty = Math.round(clawbackAmount * penaltyRate);
    const netReturned = clawbackAmount - penalty;

    escrow.status = 'clawback';
    escrow.pendingAmount = Math.max(0, escrow.pendingAmount - clawbackAmount);

    return {
        success: true,
        clawbackAmount,
        penaltyAmount: penalty,
        netReturnedToWallet: netReturned,
        investedInSavings: Math.round(netReturned * 0.3), // 30% auto-invested
        reason,
        timestamp: new Date().toISOString()
    };
};

/**
 * Create a new escrow
 */
const createEscrow = (userId, intentId, title, milestones) => {
    const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
    const newEscrow = {
        id: `ESC${String(Date.now()).slice(-6)}`,
        userId,
        intentId,
        title,
        totalAmount,
        releasedAmount: 0,
        pendingAmount: totalAmount,
        status: 'locked',
        milestones: milestones.map((m, i) => ({
            id: `MST${String(Date.now()).slice(-4)}${i}`,
            ...m,
            status: 'pending',
            proofProvided: false,
            completedAt: null,
            merchantId: null
        })),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    escrowStore.push(newEscrow);
    return newEscrow;
};

const modifyEscrow = (id, payload) => {
    const escrow = escrowStore.find(e => e.id === id);
    if (!escrow) return { success: false, error: 'Escrow not found' };

    if (payload.title) escrow.title = payload.title;
    if (payload.milestones) {
        // Simple modification: replace existing pending milestones or add new ones
        // In a real system, this would be highly restricted
        escrow.milestones = payload.milestones.map((m, i) => ({
            id: m.id || `MST-M-${Date.now()}-${i}`,
            ...m,
            status: m.status || 'pending',
            proofProvided: m.proofProvided || false
        }));
        escrow.totalAmount = escrow.milestones.reduce((sum, m) => sum + m.amount, 0);
        escrow.pendingAmount = escrow.totalAmount - escrow.releasedAmount;
    }

    return { success: true, escrow };
};

module.exports = { escrowStore, getEscrowsByUser, getEscrowById, releaseMilestone, initiateClawback, createEscrow, modifyEscrow };

