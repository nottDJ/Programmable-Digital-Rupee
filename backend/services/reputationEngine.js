/**
 * Reputation Scoring Engine
 * Tracks user behavior against intent compliance
 * Powers the Behavior-Based Credit Layer
 * 
 * Score Range: 0–1000
 * 800–1000: Excellent (High credit eligibility, premium features)
 * 600–799: Good (Medium credit eligibility)
 * 400–599: Fair (Low credit eligibility, enhanced monitoring)
 * 0–399: Poor (Basic mode only, no credit access)
 */

const { getUserById, updateReputationScore } = require('../data/users');

// In-memory reputation events log
const reputationEvents = [
    {
        id: "REP001",
        userId: "USR001",
        event: "intent_compliance",
        delta: +10,
        description: "Successful compliant transaction at Bookworm Paradise",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: "REP002",
        userId: "USR001",
        event: "intent_violation",
        delta: -15,
        description: "Attempted transaction at non-compliant merchant (Saravana Bhavan) under books intent",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
        id: "REP003",
        userId: "USR001",
        event: "intent_compliance",
        delta: +8,
        description: "Compliant grocery purchase at Metro Supermart",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }
];

const reputationStore = reputationEvents;

const SCORE_DELTAS = {
    intent_compliance: +10,         // Successful compliant transaction
    intent_violation_attempt: -15,  // Tried to violate rule
    escrow_released: +20,           // Properly completed an escrow
    escrow_clawback_misuse: -30,    // Clawback due to misuse
    proof_submitted: +5,            // Proactively submitted proof
    emergency_override: -5,         // Emergency override used (small penalty)
    intent_created: +2,             // Creating a new intent (positive behavior)
    savings_milestone: +15          // Reached savings milestones
};

const recordReputationEvent = (userId, eventType, description) => {
    const user = getUserById(userId);
    if (!user) return null;

    const delta = SCORE_DELTAS[eventType] || 0;
    updateReputationScore(userId, delta);

    const event = {
        id: `REP${String(Date.now()).slice(-6)}`,
        userId,
        event: eventType,
        delta,
        description,
        timestamp: new Date().toISOString(),
        newScore: getUserById(userId)?.reputationScore
    };

    reputationStore.push(event);
    return event;
};

const getReputationByUser = (userId) => {
    const user = getUserById(userId);
    const events = reputationStore.filter(e => e.userId === userId);

    if (!user) return null;

    const totalTransactions = events.filter(e => e.event === 'intent_compliance').length +
        events.filter(e => e.event === 'intent_violation_attempt').length;
    const compliantCount = events.filter(e => e.event === 'intent_compliance').length;
    const violationCount = events.filter(e => e.event === 'intent_violation_attempt').length;
    const complianceRate = totalTransactions > 0 ? (compliantCount / totalTransactions * 100).toFixed(1) : 100;

    const getCreditTier = (score) => {
        if (score >= 800) return { tier: 'PREMIUM', maxLoan: 100000, interestRate: 8.5 };
        if (score >= 600) return { tier: 'STANDARD', maxLoan: 25000, interestRate: 12.0 };
        if (score >= 400) return { tier: 'BASIC', maxLoan: 5000, interestRate: 18.0 };
        return { tier: 'RESTRICTED', maxLoan: 0, interestRate: null };
    };

    return {
        userId,
        currentScore: user.reputationScore,
        creditEligibility: user.creditEligibility,
        creditTier: getCreditTier(user.reputationScore),
        stats: {
            totalTransactions,
            compliantCount,
            violationCount,
            complianceRate: parseFloat(complianceRate)
        },
        recentEvents: events.slice(-10).reverse(),
        levelLabel: user.reputationScore >= 800 ? 'Excellent' :
            user.reputationScore >= 600 ? 'Good' :
                user.reputationScore >= 400 ? 'Fair' : 'Poor'
    };
};

module.exports = { reputationStore, recordReputationEvent, getReputationByUser, SCORE_DELTAS };
