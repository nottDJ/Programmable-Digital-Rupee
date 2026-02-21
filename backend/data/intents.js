/**
 * In-Memory Intent (Rule) Store
 * In production: PostgreSQL table `intents`
 * 
 * Intent Structure:
 * {
 *   id, userId, rawText, parsedPolicy,
 *   status: active|expired|exhausted|cancelled,
 *   amountUsed, createdAt, expiresAt,
 *   nftTokenId, enforcementTier
 * }
 */

const { v4: uuidv4 } = require('uuid');

let intents = [
    {
        id: "INT001",
        userId: "USR001",
        rawText: "Allow ₹500 for books only for 30 days in Chennai",
        parsedPolicy: {
            amount: 500,
            amountUsed: 0,
            currency: "INR",
            allowedCategories: ["books", "education", "stationery"],
            allowedMCCs: ["5942", "8299"],
            timeLimit: 30,
            timeUnit: "days",
            geoRestriction: { city: "chennai", radius: null },
            proofRequired: false,
            enforcementTier: 1,
            splitRules: null,
            escrowEnabled: false,
            emergencyOverride: false
        },
        status: "active",
        amountLocked: 500,
        amountUsed: 0,
        amountRemaining: 500,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        nftTokenId: "NFT-INT001-PRIYA",
        enforcementTier: 1,
        violationCount: 0,
        approvedTransactions: 0
    },
    {
        id: "INT002",
        userId: "USR001",
        rawText: "Reserve ₹3000 for groceries and split 70% spending 30% savings this month in Chennai",
        parsedPolicy: {
            amount: 3000,
            amountUsed: 0,
            currency: "INR",
            allowedCategories: ["grocery", "food", "daily-essentials"],
            allowedMCCs: ["5411"],
            timeLimit: 30,
            timeUnit: "days",
            geoRestriction: { city: "chennai", radius: null },
            proofRequired: false,
            enforcementTier: 1,
            splitRules: { spending: 0.70, savings: 0.30 },
            escrowEnabled: false,
            emergencyOverride: false
        },
        status: "active",
        amountLocked: 3000,
        amountUsed: 800,
        amountRemaining: 2200,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
        nftTokenId: "NFT-INT002-PRIYA",
        enforcementTier: 1,
        violationCount: 1,
        approvedTransactions: 3
    },
    {
        id: "INT003",
        userId: "USR001",
        rawText: "Escrow ₹1500 for medical expenses with proof required",
        parsedPolicy: {
            amount: 1500,
            amountUsed: 0,
            currency: "INR",
            allowedCategories: ["medical", "healthcare", "pharmacy"],
            allowedMCCs: ["5912", "8099"],
            timeLimit: 90,
            timeUnit: "days",
            geoRestriction: null,
            proofRequired: true,
            enforcementTier: 3,
            splitRules: null,
            escrowEnabled: true,
            emergencyOverride: true
        },
        status: "active",
        amountLocked: 1500,
        amountUsed: 0,
        amountRemaining: 1500,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 89 * 24 * 60 * 60 * 1000).toISOString(),
        nftTokenId: "NFT-INT003-PRIYA",
        enforcementTier: 3,
        violationCount: 0,
        approvedTransactions: 0
    }
];

const intentStore = intents;

const getIntentsByUser = (userId) => intentStore.filter(i => i.userId === userId);
const getActiveIntentsByUser = (userId) => intentStore.filter(i => i.userId === userId && i.status === 'active');
const getIntentById = (id) => intentStore.find(i => i.id === id);

const createIntent = (userId, rawText, parsedPolicy) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + parsedPolicy.timeLimit * 24 * 60 * 60 * 1000);
    const newIntent = {
        id: `INT${String(Date.now()).slice(-6)}`,
        userId,
        rawText,
        parsedPolicy,
        status: "active",
        amountLocked: parsedPolicy.amount,
        amountUsed: 0,
        amountRemaining: parsedPolicy.amount,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        nftTokenId: `NFT-${uuidv4().slice(0, 8).toUpperCase()}`,
        enforcementTier: parsedPolicy.enforcementTier || 1,
        violationCount: 0,
        approvedTransactions: 0
    };
    intentStore.push(newIntent);
    return newIntent;
};

const updateIntentUsage = (intentId, amount) => {
    const intent = intentStore.find(i => i.id === intentId);
    if (intent) {
        intent.amountUsed += amount;
        intent.amountRemaining = intent.amountLocked - intent.amountUsed;
        intent.approvedTransactions += 1;
        if (intent.amountRemaining <= 0) intent.status = 'exhausted';
    }
    return intent;
};

const recordViolation = (intentId) => {
    const intent = intentStore.find(i => i.id === intentId);
    if (intent) intent.violationCount += 1;
};

module.exports = {
    intentStore,
    getIntentsByUser,
    getActiveIntentsByUser,
    getIntentById,
    createIntent,
    updateIntentUsage,
    recordViolation
};
