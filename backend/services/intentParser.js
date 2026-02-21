/**
 * NLP Intent Parser Service
 * 
 * In production: Calls an LLM API (Gemini/GPT-4/Claude) with structured output schema
 * For MVP: Deterministic rule-based parser simulating LLM output
 * 
 * Parses natural language like:
 * "Allow ₹500 for books only for 30 days in Chennai"
 * Into structured policy JSON
 */

const { mccCategoryMap } = require('../data/merchants');

// Category keyword maps → MCC codes
const CATEGORY_KEYWORDS = {
    books: { categories: ["books", "education", "stationery"], mccs: ["5942", "8299"] },
    food: { categories: ["food", "restaurant", "dining", "beverages", "meals"], mccs: ["5812", "5411"] },
    grocery: { categories: ["grocery", "groceries", "daily-essentials", "vegetables"], mccs: ["5411"] },
    medical: { categories: ["medical", "healthcare", "pharmacy", "hospital", "medicines"], mccs: ["5912", "8099"] },
    electronics: { categories: ["electronics", "technology", "gadgets", "laptop", "phone"], mccs: ["5732"] },
    education: { categories: ["education", "school", "tuition", "course", "training"], mccs: ["8299"] },
    travel: { categories: ["travel", "transport", "flight", "hotel", "cab"], mccs: ["4111", "7011", "4511"] },
    entertainment: { categories: ["entertainment", "movies", "games", "sports"], mccs: ["7832", "7993"] }
};

// Indian cities for geo-restriction parsing
const KNOWN_CITIES = [
    "chennai", "mumbai", "delhi", "bengaluru", "bangalore", "hyderabad",
    "pune", "kolkata", "ahmedabad", "jaipur", "surat", "lucknow",
    "kanpur", "nagpur", "indore", "thane", "bhopal", "visakhapatnam"
];

// Amount extractor: handles ₹500, Rs500, 500 rupees, INR 500
const extractAmount = (text) => {
    const patterns = [
        /₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/,
        /rs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
        /inr\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
        /([0-9,]+(?:\.[0-9]{1,2})?)\s*rupees?/i,
        /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:INR|rs)/i
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return parseFloat(match[1].replace(/,/g, ''));
        }
    }
    return null;
};

// Time limit extractor: 30 days, 1 month, 2 weeks
const extractTimeLimit = (text) => {
    const dayMatch = text.match(/(\d+)\s*days?/i);
    const weekMatch = text.match(/(\d+)\s*weeks?/i);
    const monthMatch = text.match(/(\d+)\s*months?/i);
    const yearMatch = text.match(/(\d+)\s*years?/i);

    if (dayMatch) return { limit: parseInt(dayMatch[1]), unit: 'days' };
    if (weekMatch) return { limit: parseInt(weekMatch[1]) * 7, unit: 'days' };
    if (monthMatch) return { limit: parseInt(monthMatch[1]) * 30, unit: 'days' };
    if (yearMatch) return { limit: parseInt(yearMatch[1]) * 365, unit: 'days' };

    // 'this month' → 30 days, 'this week' → 7 days
    if (/this\s+month/i.test(text)) return { limit: 30, unit: 'days' };
    if (/this\s+week/i.test(text)) return { limit: 7, unit: 'days' };

    return { limit: 30, unit: 'days' }; // default
};

// Category extractor
const extractCategories = (text) => {
    const lowerText = text.toLowerCase();
    const matched = [];

    for (const [key, value] of Object.entries(CATEGORY_KEYWORDS)) {
        if (value.categories.some(kw => lowerText.includes(kw))) {
            matched.push({ key, ...value });
        }
    }

    return matched;
};

// Geo-restriction extractor
const extractGeoRestriction = (text) => {
    const lowerText = text.toLowerCase();

    for (const city of KNOWN_CITIES) {
        if (lowerText.includes(city)) {
            return { city: city === 'bangalore' ? 'bengaluru' : city, radius: null };
        }
    }

    // State-level restrictions
    if (lowerText.includes('maharashtra')) return { state: 'maharashtra', city: null };
    if (lowerText.includes('tamil nadu') || lowerText.includes('tamilnadu')) return { state: 'tamilnadu', city: null };

    return null;
};

// Detect proof requirements
const detectProofRequirement = (text) => {
    const proofKeywords = ['proof', 'invoice', 'receipt', 'gst', 'verify', 'verified', 'loan', 'subsidy', 'high-value', 'escrow'];
    return proofKeywords.some(kw => text.toLowerCase().includes(kw));
};

// Detect escrow mode
const detectEscrowMode = (text) => {
    return /escrow|milestone|staged|release on/i.test(text);
};

// Detect split rules
const extractSplitRules = (text) => {
    // "70% spending 30% savings"
    const splitMatch = text.match(/(\d+)%\s*(?:spending|spend)\s+(?:and\s+)?(\d+)%\s*savings?/i);
    if (splitMatch) {
        return {
            spending: parseInt(splitMatch[1]) / 100,
            savings: parseInt(splitMatch[2]) / 100
        };
    }
    // "split 60 40" style
    const shortMatch = text.match(/split\s+(\d+)[\/\-\s](\d+)/i);
    if (shortMatch) {
        const spendPct = parseInt(shortMatch[1]);
        const savePct = parseInt(shortMatch[2]);
        const total = spendPct + savePct;
        return { spending: spendPct / total, savings: savePct / total };
    }
    return null;
};

// Determine enforcement tier
const determineTier = (proofRequired, escrowEnabled, amount) => {
    if (escrowEnabled || proofRequired) return 3;
    if (amount > 5000) return 2;
    return 1;
};

/**
 * Main intent parsing function
 * Simulates LLM structured output
 */
const parseIntent = (rawText) => {
    const amount = extractAmount(rawText);
    if (!amount) {
        return { success: false, error: 'Could not extract amount. Please include an amount like ₹500 or Rs.1000' };
    }

    const timeData = extractTimeLimit(rawText);
    const categories = extractCategories(rawText);
    const geoRestriction = extractGeoRestriction(rawText);
    const proofRequired = detectProofRequirement(rawText);
    const escrowEnabled = detectEscrowMode(rawText);
    const splitRules = extractSplitRules(rawText);

    const allowedCategories = categories.length > 0
        ? [...new Set(categories.flatMap(c => c.categories))]
        : ['general'];

    const allowedMCCs = categories.length > 0
        ? [...new Set(categories.flatMap(c => c.mccs))]
        : Object.keys(mccCategoryMap);

    const tier = determineTier(proofRequired, escrowEnabled, amount);

    const parsedPolicy = {
        amount,
        amountUsed: 0,
        currency: "INR",
        allowedCategories,
        allowedMCCs,
        categoryKeys: categories.map(c => c.key),
        timeLimit: timeData.limit,
        timeUnit: timeData.unit,
        geoRestriction,
        proofRequired,
        enforcementTier: tier,
        splitRules,
        escrowEnabled,
        emergencyOverride: false
    };

    // Build human-readable summary
    const summary = buildSummary(parsedPolicy);

    return {
        success: true,
        rawText,
        parsedPolicy,
        summary,
        confidence: calculateConfidence(parsedPolicy, categories)
    };
};

const buildSummary = (policy) => {
    const parts = [];
    parts.push(`Lock ₹${policy.amount.toLocaleString('en-IN')}`);

    if (policy.categoryKeys && policy.categoryKeys.length > 0) {
        parts.push(`for ${policy.categoryKeys.join(', ')} purchases only`);
    }

    parts.push(`valid for ${policy.timeLimit} days`);

    if (policy.geoRestriction) {
        const loc = policy.geoRestriction.city || policy.geoRestriction.state;
        parts.push(`restricted to ${loc.charAt(0).toUpperCase() + loc.slice(1)}`);
    }

    if (policy.proofRequired) parts.push('with proof/invoice required');
    if (policy.escrowEnabled) parts.push('(Escrow mode – funds released on proof)');
    if (policy.splitRules) {
        parts.push(`split ${Math.round(policy.splitRules.spending * 100)}% spend / ${Math.round(policy.splitRules.savings * 100)}% savings`);
    }

    return parts.join(', ');
};

const calculateConfidence = (policy, categories) => {
    let score = 0.5;
    if (policy.amount > 0) score += 0.2;
    if (categories.length > 0) score += 0.15;
    if (policy.geoRestriction) score += 0.1;
    if (policy.timeLimit !== 30) score += 0.05; // non-default implies explicit
    return Math.min(1, score);
};

module.exports = { parseIntent };
