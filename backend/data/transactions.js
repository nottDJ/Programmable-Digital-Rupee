/**
 * Transaction Log Store
 * Tracks all transaction attempts (approved & rejected)
 * In production: immutable append-only ledger with blockchain anchoring
 */

const transactions = [
    {
        id: "TXN001",
        userId: "USR001",
        intentId: "INT002",
        merchantId: "MRC003",
        merchantName: "Metro Supermart",
        merchantMCC: "5411",
        merchantCategory: "grocery",
        amount: 450,
        status: "approved",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        validationDetails: {
            amountCheck: "passed",
            categoryCheck: "passed",
            geoCheck: "passed",
            timeCheck: "passed",
            tier: 1
        },
        upiSettlementRef: "UPI-SIM-TXN001",
        violationReason: null
    },
    {
        id: "TXN002",
        userId: "USR001",
        intentId: "INT001",
        merchantId: "MRC001",
        merchantName: "Bookworm Paradise",
        merchantMCC: "5942",
        merchantCategory: "books",
        amount: 320,
        status: "approved",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        validationDetails: {
            amountCheck: "passed",
            categoryCheck: "passed",
            geoCheck: "passed",
            timeCheck: "passed",
            tier: 1
        },
        upiSettlementRef: "UPI-SIM-TXN002",
        violationReason: null
    },
    {
        id: "TXN003",
        userId: "USR001",
        intentId: "INT001",
        merchantId: "MRC002",
        merchantName: "Saravana Bhavan",
        merchantMCC: "5812",
        merchantCategory: "food",
        amount: 180,
        status: "rejected",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        validationDetails: {
            amountCheck: "passed",
            categoryCheck: "FAILED",
            geoCheck: "passed",
            timeCheck: "passed",
            tier: 1
        },
        upiSettlementRef: null,
        violationReason: "Category mismatch: Intent allows [books] only, merchant is [food/restaurant] (MCC 5812)"
    },
    {
        id: "TXN004",
        userId: "USR001",
        intentId: "INT002",
        merchantId: "MRC003",
        merchantName: "Metro Supermart",
        merchantMCC: "5411",
        merchantCategory: "grocery",
        amount: 350,
        status: "approved",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        validationDetails: {
            amountCheck: "passed",
            categoryCheck: "passed",
            geoCheck: "passed",
            timeCheck: "passed",
            tier: 1
        },
        upiSettlementRef: "UPI-SIM-TXN004",
        violationReason: null
    }
];

const txnStore = transactions;

const addTransaction = (txn) => {
    txnStore.push(txn);
    return txn;
};

const getTransactionsByUser = (userId) => txnStore.filter(t => t.userId === userId);
const getTransactionsByIntent = (intentId) => txnStore.filter(t => t.intentId === intentId);
const getAllTransactions = () => txnStore;

module.exports = { txnStore, addTransaction, getTransactionsByUser, getTransactionsByIntent, getAllTransactions };
