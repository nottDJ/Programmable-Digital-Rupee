/**
 * Rule Engine Service
 * 
 * The core enforcement engine that validates UPI transactions
 * against user-defined intent policies BEFORE settlement.
 * 
 * Validation Pipeline:
 * 1. Intent validity check (active, not expired, not exhausted)
 * 2. Amount cap validation
 * 3. Time validity check
 * 4. Geo-fencing check
 * 5. MCC category matching
 * 6. Merchant tier verification
 * 7. Proof requirement check (Tier 3)
 * 
 * If ALL checks pass → forward to UPI settlement
 * If ANY check fails → reject transaction, log violation
 */

const { mccCategoryMap, cityGeoBounds } = require('../data/merchants');
const { getIntentsByUser, getIntentById, updateIntentUsage, recordViolation } = require('../data/intents');

/**
 * Check 1: Intent Status Validation
 */
const validateIntentStatus = (intent) => {
    if (intent.status !== 'active') {
        return {
            passed: false,
            check: 'intentStatus',
            reason: `Intent is ${intent.status}. Cannot process transaction against an ${intent.status} intent.`
        };
    }

    // Check expiry
    if (new Date() > new Date(intent.expiresAt)) {
        return {
            passed: false,
            check: 'intentStatus',
            reason: `Intent expired on ${new Date(intent.expiresAt).toLocaleDateString('en-IN')}. Please create a new intent.`
        };
    }

    return { passed: true, check: 'intentStatus' };
};

/**
 * Check 2: Amount Cap Validation
 */
const validateAmount = (intent, transactionAmount) => {
    const remaining = intent.amountRemaining;

    if (transactionAmount > remaining) {
        return {
            passed: false,
            check: 'amountCap',
            reason: `Transaction amount ₹${transactionAmount} exceeds remaining intent balance ₹${remaining}. 
               Total locked: ₹${intent.amountLocked}, Used: ₹${intent.amountUsed}.`
        };
    }

    if (transactionAmount <= 0) {
        return {
            passed: false,
            check: 'amountCap',
            reason: 'Invalid transaction amount.'
        };
    }

    return { passed: true, check: 'amountCap', remaining };
};

/**
 * Check 3: Time Validity
 */
const validateTimeWindow = (intent) => {
    const now = new Date();
    const created = new Date(intent.createdAt);
    const expires = new Date(intent.expiresAt);

    if (now < created || now > expires) {
        return {
            passed: false,
            check: 'timeWindow',
            reason: `Transaction is outside the allowed time window. 
               Intent valid from ${created.toLocaleDateString('en-IN')} to ${expires.toLocaleDateString('en-IN')}.`
        };
    }

    return { passed: true, check: 'timeWindow' };
};

/**
 * Check 4: Geo-Fencing Validation
 * Checks if merchant is within the geo-restriction of the intent
 */
const validateGeoFence = (intent, merchant) => {
    const geoRestriction = intent.parsedPolicy.geoRestriction;

    if (!geoRestriction) {
        return { passed: true, check: 'geoFence', note: 'No geo-restriction on this intent' };
    }

    if (geoRestriction.city) {
        const bounds = cityGeoBounds[geoRestriction.city.toLowerCase()];

        if (!bounds) {
            return { passed: true, check: 'geoFence', note: 'City geo bounds not available, skipping check' };
        }

        // Check if merchant lat/lng is within city bounds
        const inBounds = (
            merchant.lat >= bounds.minLat &&
            merchant.lat <= bounds.maxLat &&
            merchant.lng >= bounds.minLng &&
            merchant.lng <= bounds.maxLng
        );

        if (!inBounds) {
            return {
                passed: false,
                check: 'geoFence',
                reason: `Merchant "${merchant.name}" is located in ${merchant.city}, outside the geo-restriction: ${geoRestriction.city.charAt(0).toUpperCase() + geoRestriction.city.slice(1)} only.`
            };
        }

        // Also check merchant city string as fallback
        if (merchant.city.toLowerCase() !== geoRestriction.city.toLowerCase()) {
            return {
                passed: false,
                check: 'geoFence',
                reason: `Merchant city "${merchant.city}" does not match intent restriction "${geoRestriction.city}".`
            };
        }
    }

    return { passed: true, check: 'geoFence' };
};

/**
 * Check 5: MCC Category Matching (Primary enforcement)
 * This is the core of Tier 1 enforcement
 */
const validateMerchantCategory = (intent, merchant) => {
    const allowedMCCs = intent.parsedPolicy.allowedMCCs;
    const allowedCategories = intent.parsedPolicy.allowedCategories;

    // Mixed-category merchant gets extra scrutiny
    if (merchant.category === 'mixed') {
        return {
            passed: false,
            check: 'merchantCategory',
            reason: `"${merchant.name}" is classified as a Mixed-Category Merchant (MCC ${merchant.mcc}). 
               Intent-bound payments cannot be processed at unclassified merchants. 
               Requires Tier 2 product-level verification or manual override.`,
            requiresTier2: true
        };
    }

    // Check MCC match
    const mccMatch = allowedMCCs.includes(merchant.mcc);

    // Dynamic category match using mccCategoryMap
    const merchantCategories = mccCategoryMap[merchant.mcc] || [merchant.category];
    const categoryMatch = allowedCategories.some(allowed =>
        merchantCategories.includes(allowed.toLowerCase()) ||
        merchant.category === allowed.toLowerCase() ||
        merchant.productTags?.some(tag => allowed.toLowerCase().includes(tag) || tag.includes(allowed.toLowerCase()))
    );

    if (!mccMatch && !categoryMatch) {
        return {
            passed: false,
            check: 'merchantCategory',
            reason: `Merchant category mismatch. Merchant "${merchant.name}" is classified as "${merchant.categoryLabel}" (MCC: ${merchant.mcc}). 
               Intent only allows: ${intent.parsedPolicy.categoryKeys?.join(', ') || allowedCategories.join(', ')} purchases (MCC: ${allowedMCCs.join(', ')}).`
        };
    }

    return { passed: true, check: 'merchantCategory', mccMatch, categoryMatch };
};

/**
 * Check 6: Merchant Tier Verification
 * Ensures merchant tier meets or exceeds intent's enforcement tier requirement
 */
const validateMerchantTier = (intent, merchant) => {
    const requiredTier = intent.parsedPolicy.enforcementTier;
    const merchantTier = merchant.tier;

    if (merchantTier < requiredTier) {
        return {
            passed: false,
            check: 'merchantTier',
            reason: `Intent requires Tier ${requiredTier} verification, but merchant is only Tier ${merchantTier} registered. 
               Merchant must be certified in the RBI merchant registry at Tier ${requiredTier} or higher.`
        };
    }

    return { passed: true, check: 'merchantTier' };
};

/**
 * Check 7: Proof Requirement (Tier 3)
 * For loans/subsidies/high-value payments
 */
const validateProofRequirement = (intent, transactionData) => {
    if (!intent.parsedPolicy.proofRequired) {
        return { passed: true, check: 'proofRequirement', note: 'Proof not required for this intent' };
    }

    if (!transactionData.proofProvided) {
        return {
            passed: false,
            check: 'proofRequirement',
            reason: 'This intent requires proof of purchase (invoice/GST receipt) before transaction can be approved. Please upload proof documents.'
        };
    }

    return { passed: true, check: 'proofRequirement' };
};

/**
 * Risk Score Assessment
 * Detects potential merchant spoofing attempts
 */
const assessRiskScore = (merchant, amount) => {
    const risks = [];
    let riskLevel = 'low';

    if (merchant.riskScore > 0.3) {
        risks.push('High merchant risk score');
        riskLevel = 'high';
    }

    if (merchant.category === 'mixed') {
        risks.push('Mixed-category merchant – potential spoofing risk');
        riskLevel = 'high';
    }

    if (!merchant.certified) {
        risks.push('Merchant is not NPCI-certified');
        if (riskLevel === 'low') riskLevel = 'medium';
    }

    if (amount > 10000) {
        risks.push('High-value transaction – enhanced monitoring');
        if (riskLevel === 'low') riskLevel = 'medium';
    }

    return { riskLevel, risks, riskScore: merchant.riskScore };
};

/**
 * Main Rule Engine Validation Function
 * Runs the complete validation pipeline
 */
const validateTransaction = (intent, merchant, transactionAmount, transactionData = {}) => {
    const startTime = Date.now();
    const checks = [];
    const { proofProvided = false, emergencyOverride = false } = transactionData;

    // Handle missing intent for non-emergency transctions
    if (!intent && !emergencyOverride) {
        return buildResult(false, [{
            passed: false,
            check: 'intentStatus',
            reason: 'No applicable spending rule (intent) found for this transaction. Please create an intent or select an active one.'
        }], null, merchant, startTime);
    }

    // Handle Emergency Override
    if (emergencyOverride) {
        return {
            approved: true,
            upiSettlementRef: `UPI-EMER-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            merchant,
            amount: transactionAmount,
            processingTimeMs: Date.now() - startTime,
            checks: [{ name: 'Emergency Override', passed: true, message: 'Bypassed rules due to emergency' }],
            riskAssessment: { score: 10, level: 'low', flagged: true, reason: 'Emergency Override Used' },
            isEmergency: true
        };
    }

    // Run all validation checks in sequence
    const statusCheck = validateIntentStatus(intent);
    checks.push(statusCheck);
    if (!statusCheck.passed) return buildResult(false, checks, null, merchant, startTime);

    const amountCheck = validateAmount(intent, transactionAmount);
    checks.push(amountCheck);
    if (!amountCheck.passed) return buildResult(false, checks, null, merchant, startTime);

    const timeCheck = validateTimeWindow(intent);
    checks.push(timeCheck);
    if (!timeCheck.passed) return buildResult(false, checks, null, merchant, startTime);

    const geoCheck = validateGeoFence(intent, merchant);
    checks.push(geoCheck);
    if (!geoCheck.passed) return buildResult(false, checks, null, merchant, startTime);

    const categoryCheck = validateMerchantCategory(intent, merchant);
    checks.push(categoryCheck);
    if (!categoryCheck.passed) return buildResult(false, checks, null, merchant, startTime);

    const tierCheck = validateMerchantTier(intent, merchant);
    checks.push(tierCheck);
    if (!tierCheck.passed) return buildResult(false, checks, null, merchant, startTime);

    const proofCheck = validateProofRequirement(intent, transactionData);
    checks.push(proofCheck);
    if (!proofCheck.passed) return buildResult(false, checks, null, merchant, startTime);

    // All checks passed!
    const riskAssessment = assessRiskScore(merchant, transactionAmount);
    const upiRef = `UPI-SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    return buildResult(true, checks, upiRef, merchant, startTime, riskAssessment);
};

const buildResult = (approved, checks, upiRef, merchant, startTime, riskAssessment = null) => {
    const failedCheck = checks.find(c => !c.passed);
    const processingTimeMs = Date.now() - startTime;

    return {
        approved,
        checks,
        failedAt: failedCheck ? failedCheck.check : null,
        violationReason: failedCheck ? failedCheck.reason : null,
        upiSettlementRef: approved ? upiRef : null,
        upiForwarded: approved,
        merchantInfo: {
            name: merchant.name,
            mcc: merchant.mcc,
            category: merchant.categoryLabel,
            tier: merchant.tier,
            city: merchant.city
        },
        riskAssessment,
        processingTimeMs
    };
};

module.exports = { validateTransaction, assessRiskScore };
