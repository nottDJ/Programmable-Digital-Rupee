/**
 * Simulated User Database
 * In production: PostgreSQL with encrypted fields, KYC verification
 */

const users = [
    {
        id: "USR001",
        name: "Priya Sharma",
        phone: "+91-9876543210",
        upiId: "priya.sharma@cbdc",
        walletBalance: 25000.00,   // Digital Rupee balance in INR
        lockedBalance: 5000.00,    // Amount locked in active intents
        availableBalance: 20000.00,
        kycStatus: "verified",
        city: "Chennai",
        state: "Tamil Nadu",
        lat: 13.0827,
        lng: 80.2707,
        reputationScore: 820,      // Out of 1000
        creditEligibility: "medium",
        createdAt: "2024-01-15"
    },
    {
        id: "USR002",
        name: "Rahul Verma",
        phone: "+91-9123456789",
        upiId: "rahul.verma@cbdc",
        walletBalance: 15000.00,
        lockedBalance: 2000.00,
        availableBalance: 13000.00,
        kycStatus: "verified",
        city: "Mumbai",
        state: "Maharashtra",
        lat: 19.0760,
        lng: 72.8777,
        reputationScore: 710,
        creditEligibility: "low",
        createdAt: "2024-02-20"
    }
];

// In-memory store - will be mutated during simulation
const userStore = users.map(u => ({ ...u }));

const getUserById = (id) => userStore.find(u => u.id === id);
const updateUserBalance = (id, newBalance, newLocked) => {
    const user = userStore.find(u => u.id === id);
    if (user) {
        user.walletBalance = newBalance;
        user.lockedBalance = newLocked;
        user.availableBalance = newBalance - newLocked;
    }
};
const updateReputationScore = (id, delta) => {
    const user = userStore.find(u => u.id === id);
    if (user) {
        user.reputationScore = Math.min(1000, Math.max(0, user.reputationScore + delta));
        // Update credit eligibility based on score
        if (user.reputationScore >= 800) user.creditEligibility = "high";
        else if (user.reputationScore >= 600) user.creditEligibility = "medium";
        else user.creditEligibility = "low";
    }
};

module.exports = { userStore, getUserById, updateUserBalance, updateReputationScore };
