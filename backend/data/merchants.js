/**
 * Simulated Merchant Database
 * In production, this would be fetched from NPCI's merchant registry
 * MCC = Merchant Category Code (ISO 18245)
 */

const merchants = [
    {
        id: "MRC001",
        name: "Bookworm Paradise",
        upiId: "bookworm@okaxis",
        mcc: "5942",         // Book Stores
        category: "books",
        categoryLabel: "Book Store",
        city: "Chennai",
        state: "Tamil Nadu",
        lat: 13.0827,
        lng: 80.2707,
        gstIn: "33AABCT1332L1ZQ",
        tier: 1,             // Tier 1 = MCC-only filtering
        certified: true,
        productTags: ["textbooks", "novels", "stationery"],
        avgTransaction: 350,
        riskScore: 0.05
    },
    {
        id: "MRC002",
        name: "Saravana Bhavan",
        upiId: "saravanabhavan@okhdfc",
        mcc: "5812",         // Eating Places & Restaurants
        category: "food",
        categoryLabel: "Restaurant",
        city: "Chennai",
        state: "Tamil Nadu",
        lat: 13.0569,
        lng: 80.2425,
        gstIn: "33AABCS2234M2ZP",
        tier: 1,
        certified: true,
        productTags: ["meals", "beverages", "snacks"],
        avgTransaction: 280,
        riskScore: 0.08
    },
    {
        id: "MRC003",
        name: "Metro Supermart",
        upiId: "metromart@paytm",
        mcc: "5411",         // Grocery Stores / Supermarkets
        category: "grocery",
        categoryLabel: "Grocery Store",
        city: "Mumbai",
        state: "Maharashtra",
        lat: 19.0760,
        lng: 72.8777,
        gstIn: "27AABCM3456N3ZO",
        tier: 1,
        certified: true,
        productTags: ["groceries", "dairy", "vegetables", "packaged-food"],
        avgTransaction: 650,
        riskScore: 0.06
    },
    {
        id: "MRC004",
        name: "TechZone Electronics",
        upiId: "techzone@upi",
        mcc: "5732",         // Electronics Stores
        category: "electronics",
        categoryLabel: "Electronics Store",
        city: "Bengaluru",
        state: "Karnataka",
        lat: 12.9716,
        lng: 77.5946,
        gstIn: "29AABCT4567O4ZN",
        tier: 2,
        certified: true,
        productTags: ["laptops", "phones", "accessories", "cables"],
        avgTransaction: 8500,
        riskScore: 0.12
    },
    {
        id: "MRC005",
        name: "Healing Touch Pharmacy",
        upiId: "healingtouch@okicici",
        mcc: "5912",         // Drug Stores & Pharmacies
        category: "medical",
        categoryLabel: "Pharmacy",
        city: "Delhi",
        state: "Delhi",
        lat: 28.6139,
        lng: 77.2090,
        gstIn: "07AABCH5678P5ZM",
        tier: 2,
        certified: true,
        productTags: ["medicines", "healthcare", "supplements"],
        avgTransaction: 420,
        riskScore: 0.04
    },
    {
        id: "MRC006",
        name: "MixMart (Mixed Category)",
        upiId: "mixmart@ybl",
        mcc: "5999",         // Miscellaneous & Specialty Retail
        category: "mixed",
        categoryLabel: "Mixed Category Store",
        city: "Chennai",
        state: "Tamil Nadu",
        lat: 13.0878,
        lng: 80.2785,
        gstIn: "33AABCM6789Q6ZL",
        tier: 2,
        certified: false,
        productTags: ["books", "food", "stationery", "beverages"],
        avgTransaction: 400,
        riskScore: 0.35,     // Higher risk - mixed category
        warning: "Mixed category merchant - requires enhanced verification"
    },
    {
        id: "MRC007",
        name: "Apollo Medical Center",
        upiId: "apollo@okaxis",
        mcc: "8099",         // Health Services
        category: "medical",
        categoryLabel: "Medical Center",
        city: "Hyderabad",
        state: "Telangana",
        lat: 17.3850,
        lng: 78.4867,
        gstIn: "36AABCA7890R7ZK",
        tier: 3,
        certified: true,
        productTags: ["consultation", "diagnostics", "surgery"],
        avgTransaction: 2500,
        riskScore: 0.03
    },
    {
        id: "MRC008",
        name: "EduLearn Institute",
        upiId: "edulearn@paytm",
        mcc: "8299",         // Schools & Educational Services
        category: "education",
        categoryLabel: "Educational Institution",
        city: "Pune",
        state: "Maharashtra",
        lat: 18.5204,
        lng: 73.8567,
        gstIn: "27AABCE8901S8ZJ",
        tier: 2,
        certified: true,
        productTags: ["tuition", "courses", "workshops"],
        avgTransaction: 3000,
        riskScore: 0.05
    }
];

// MCC Category mapping for rule engine
const mccCategoryMap = {
    "5942": ["books", "education", "stationery"],
    "5812": ["food", "restaurant", "beverages"],
    "5411": ["grocery", "food", "daily-essentials"],
    "5732": ["electronics", "technology"],
    "5912": ["medical", "healthcare", "pharmacy"],
    "5999": ["mixed", "general"],
    "8099": ["medical", "healthcare", "hospital"],
    "8299": ["education", "school", "training"]
};

// City-to-geo bounding box mapping for geo-fencing
const cityGeoBounds = {
    "chennai": { minLat: 12.9, maxLat: 13.3, minLng: 80.1, maxLng: 80.4 },
    "mumbai": { minLat: 18.9, maxLat: 19.3, minLng: 72.7, maxLng: 73.1 },
    "delhi": { minLat: 28.4, maxLat: 28.9, minLng: 76.8, maxLng: 77.5 },
    "bengaluru": { minLat: 12.8, maxLat: 13.2, minLng: 77.4, maxLng: 77.8 },
    "hyderabad": { minLat: 17.2, maxLat: 17.6, minLng: 78.3, maxLng: 78.7 },
    "pune": { minLat: 18.4, maxLat: 18.7, minLng: 73.7, maxLng: 74.0 }
};

module.exports = { merchants, mccCategoryMap, cityGeoBounds };
