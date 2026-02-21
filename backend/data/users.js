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
        password: "password123", // In production: use bcrypt
        walletBalance: 25000.00,
        lockedBalance: 5000.00,
        availableBalance: 20000.00,
        kycStatus: "verified",
        city: "Chennai",
        state: "Tamil Nadu",
        lat: 13.0827,
        lng: 80.2707,
        reputationScore: 820,
        creditEligibility: "high",
        createdAt: "2024-01-15",
        contacts: [
            { id: "USR002", name: "Rahul Verma", upiId: "rahul.verma@cbdc", avatar: "RV" },
            { id: "USR003", name: "Ananya Iyer", upiId: "ananya.iyer@cbdc", avatar: "AI" },
            { id: "USR004", name: "Vikram Malhotra", upiId: "vikram.m@cbdc", avatar: "VM" }
        ]
    },
    {
        id: "USR002",
        name: "Rahul Verma",
        phone: "+91-9123456789",
        upiId: "rahul.verma@cbdc",
        password: "password123",
        walletBalance: 15000.00,
        lockedBalance: 2000.00,
        availableBalance: 13000.00,
        kycStatus: "verified",
        city: "Mumbai",
        state: "Maharashtra",
        lat: 19.0760,
        lng: 72.8777,
        reputationScore: 710,
        creditEligibility: "medium",
        createdAt: "2024-02-20",
        contacts: [
            { id: "USR001", name: "Priya Sharma", upiId: "priya.sharma@cbdc", avatar: "PS" }
        ]
    }
];

// In-memory store - will be mutated during simulation
const userStore = users.map(u => ({ ...u }));

const getUserById = (id) => userStore.find(u => u.id === id);
const getUserByUpiId = (upiId) => userStore.find(u => u.upiId === upiId);

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
        if (user.reputationScore >= 800) user.creditEligibility = "high";
        else if (user.reputationScore >= 600) user.creditEligibility = "medium";
        else user.creditEligibility = "low";
    }
};

module.exports = { userStore, getUserById, getUserByUpiId, updateUserBalance, updateReputationScore };

