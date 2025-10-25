// functions/safeTools.js
// Firebase Functions v2 | Node.js 22 | GUARANTEED CORS + Safe Browsing + WHOIS

const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");

const REGION = "asia-south1";
const fetchFn = globalThis.fetch;

// --- Environment Keys ---
// Try both environment variable and Firebase config
const SAFEBROWSING_KEY = process.env.SAFEBROWSING_KEY || 
                         process.env.safebrowsing?.key || 
                         "";
const WHOIS_API_NINJAS = process.env.WHOIS_API_NINJAS || 
                        process.env.whois?.api_ninjas || 
                        "";

// --- Allowed Origins (CORS) ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174", // Vite sometimes uses this
  "http://localhost:3000",
  "https://phishblock-demo.web.app",
  "https://phishblock-demo.firebaseapp.com",
  "https://phishblock.web.app",
  "https://phishblock.firebaseapp.com"
];

// --- CORS Middleware Wrapper ---
// This ensures CORS headers are ALWAYS set, even on errors
function withCors(handler) {
  return async (req, res) => {
    const origin = req.get("origin") || "";
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    
    // Set CORS headers FIRST, before any logic
    res.set("Access-Control-Allow-Origin", corsOrigin);
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "3600");

    // Handle preflight immediately
    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    try {
      await handler(req, res);
    } catch (err) {
      logger.error("Unhandled error in safeTools:", err);
      if (!res.headersSent) {
        return res.status(500).json({ 
          ok: false, 
          error: "Internal server error",
          details: err.message 
        });
      }
    }
  };
}

// --- Helper: Ensure keys exist ---
function ensureKeys() {
  // Debug logging (remove after fixing)
  logger.info("Environment check:", {
    safeBrowsingKeyPresent: !!SAFEBROWSING_KEY,
    safeBrowsingKeyLength: SAFEBROWSING_KEY ? SAFEBROWSING_KEY.length : 0,
    safeBrowsingKeyPrefix: SAFEBROWSING_KEY ? SAFEBROWSING_KEY.substring(0, 10) + "..." : "missing",
    whoisKeyPresent: !!WHOIS_API_NINJAS
  });
  
  const missing = [];
  if (!SAFEBROWSING_KEY) missing.push("SAFEBROWSING_KEY");
  if (!WHOIS_API_NINJAS) missing.push("WHOIS_API_NINJAS");
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}

// --- Google Safe Browsing Check ---
async function checkSafeBrowsing(url) {
  try {
    const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${SAFEBROWSING_KEY}`;
    const body = {
      client: { 
        clientId: "phishblock", 
        clientVersion: "1.0.0" 
      },
      threatInfo: {
        threatTypes: [
          "MALWARE",
          "SOCIAL_ENGINEERING",
          "UNWANTED_SOFTWARE",
          "POTENTIALLY_HARMFUL_APPLICATION"
        ],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }]
      }
    };

    const res = await fetchFn(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    
    if (!res.ok) {
      logger.error(`SafeBrowsing API error: ${res.status} - ${text}`);
      throw new Error(`SafeBrowsing API returned ${res.status}: ${text.substring(0, 200)}`);
    }
    
    const data = text ? JSON.parse(text) : {};
    const matches = data.matches || [];
    
    return { 
      safe: matches.length === 0, 
      threatTypes: matches.map(m => m.threatType),
      raw: data 
    };
  } catch (err) {
    logger.error("SafeBrowsing error:", err.message);
    return { 
      safe: null, 
      error: err.message,
      apiKey: SAFEBROWSING_KEY ? "present" : "missing"
    };
  }
}

// --- WHOIS Lookup ---
async function whoisLookup(domain) {
  try {
    const url = `https://api.api-ninjas.com/v1/whois?domain=${encodeURIComponent(domain)}`;
    const res = await fetchFn(url, {
      method: "GET",
      headers: { "X-Api-Key": WHOIS_API_NINJAS }
    });
    
    const text = await res.text();
    
    if (!res.ok) {
      logger.error(`WHOIS API error: ${res.status} - ${text}`);
      throw new Error(`WHOIS API returned ${res.status}`);
    }
    
    return text ? JSON.parse(text) : {};
  } catch (err) {
    logger.error("WHOIS error:", err.message);
    return { 
      error: err.message,
      apiKey: WHOIS_API_NINJAS ? "present" : "missing"
    };
  }
}

// --- Main Handler (wrapped with CORS) ---
const mainHandler = async (req, res) => {
  logger.info(`safeTools request: ${req.method} from ${req.get("origin") || "unknown"}`);

  // Validate environment keys
  try {
    ensureKeys();
  } catch (err) {
    logger.error("Missing API keys:", err.message);
    return res.status(500).json({ 
      ok: false, 
      error: err.message,
      hint: "Check your Firebase Functions environment variables"
    });
  }

  // Validate URL parameter
  const inputUrl = req.query.url || req.body?.url;
  if (!inputUrl || typeof inputUrl !== "string") {
    return res.status(400).json({ 
      ok: false, 
      error: "Missing or invalid 'url' parameter",
      received: inputUrl
    });
  }

  // Extract domain
  let domain;
  let normalizedUrl = inputUrl;
  
  try {
    // Add protocol if missing
    if (!inputUrl.startsWith("http://") && !inputUrl.startsWith("https://")) {
      normalizedUrl = `https://${inputUrl}`;
    }
    const urlObj = new URL(normalizedUrl);
    domain = urlObj.hostname;
  } catch (err) {
    return res.status(400).json({
      ok: false,
      error: "Invalid URL format",
      input: inputUrl
    });
  }

  // Execute checks in parallel
  try {
    const [safeBrowsing, whois] = await Promise.all([
      checkSafeBrowsing(normalizedUrl),
      whoisLookup(domain)
    ]);

    return res.status(200).json({
      ok: true,
      input: inputUrl,
      normalizedUrl,
      domain,
      safeBrowsing,
      whois,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error("Runtime error during checks:", err);
    return res.status(500).json({ 
      ok: false, 
      error: "Error performing security checks",
      details: err.message
    });
  }
};

// --- Export with CORS wrapper ---
exports.safeTools = onRequest(
  { 
    region: REGION, 
    timeoutSeconds: 60, 
    memory: "512MiB",
    maxInstances: 10,
    cors: true,
    invoker: "public" // ⭐ CRITICAL: Allow unauthenticated access
    // Note: secrets removed - using .env instead
  },
  withCors(mainHandler)
);