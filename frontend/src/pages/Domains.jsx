// src/pages/Domains.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaGlobe, FaSearch, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import BackButton from "../components/BackButton";

export default function Domains() {
  const [domain, setDomain] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Function URL - automatically use correct endpoint based on environment
  const SAFE_TOOLS_URL = import.meta.env.VITE_SAFE_TOOLS_URL || 
    "https://safetools-qtxnl6sgzq-el.a.run.app";

  const handleLookup = async () => {
    if (!domain.trim()) {
      setError("Please enter a domain or URL");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      console.log("🔍 Checking domain:", domain);
      console.log("🌐 Using endpoint:", SAFE_TOOLS_URL);

      const url = `${SAFE_TOOLS_URL}?url=${encodeURIComponent(domain)}`;
      console.log("📡 Fetch URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📥 Response status:", response.status);
      console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()));

      // Try to parse JSON even if response is not ok
      let json;
      try {
        json = await response.json();
        console.log("📦 Response data:", json);
      } catch (parseError) {
        console.error("❌ Failed to parse JSON:", parseError);
        throw new Error("Invalid response from server");
      }

      // Check for errors
      if (!response.ok) {
        throw new Error(json.error || json.details || `Server returned ${response.status}`);
      }

      if (json.error) {
        throw new Error(json.error);
      }

      if (!json.ok) {
        throw new Error(json.error || "API returned ok: false");
      }

      setData(json);
      console.log("✅ Lookup successful!");
    } catch (err) {
      console.error("❌ Lookup error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleLookup();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-semibold text-white flex items-center gap-2"
      >
        <FaGlobe className="text-indigo-400" /> Domain Verification
      </motion.h2>
      <div className="mt-2">
        <BackButton />
      </div>
      {/* Input box + button */}
      <div className="bg-[#0d0d12]/80 border border-indigo-800/40 rounded-2xl p-5 shadow-[0_0_15px_rgba(99,102,241,0.15)] backdrop-blur-sm">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter domain or URL (e.g., example.com)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 p-3 rounded-lg bg-[#101020] border border-indigo-700/40 text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          />
          <button
            onClick={handleLookup}
            disabled={loading || !domain.trim()}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-lg text-white font-semibold hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span> Checking...
              </span>
            ) : (
              <>
                <FaSearch className="inline mr-2" /> Lookup
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 text-red-400 text-sm bg-red-900/20 border border-red-700/30 rounded-lg p-3"
          >
            <div className="flex items-start gap-2">
              <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
              <div>
                <strong>Error:</strong> {error}
                <div className="mt-2 text-xs text-red-300/70">
                  💡 <strong>Troubleshooting:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Check browser console (F12) for detailed errors</li>
                    <li>Verify API keys are set in Firebase Functions config</li>
                    <li>Ensure the function is deployed: <code className="bg-red-950/50 px-1 rounded">firebase deploy --only functions:safeTools</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Display */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            {/* Safety Status Banner */}
            <div className={`p-4 rounded-lg border ${
              data.safeBrowsing?.safe === true 
                ? "bg-green-900/20 border-green-700/30" 
                : data.safeBrowsing?.safe === false
                ? "bg-red-900/20 border-red-700/30"
                : "bg-yellow-900/20 border-yellow-700/30"
            }`}>
              <div className="flex items-center gap-3">
                {data.safeBrowsing?.safe === true && (
                  <>
                    <FaCheckCircle className="text-green-400 text-2xl" />
                    <div>
                      <div className="text-green-400 font-semibold text-lg">
                        ✅ Domain Appears Safe
                      </div>
                      <div className="text-green-300/70 text-sm">
                        No known threats detected by Google Safe Browsing
                      </div>
                    </div>
                  </>
                )}
                {data.safeBrowsing?.safe === false && (
                  <>
                    <FaExclamationTriangle className="text-red-400 text-2xl" />
                    <div>
                      <div className="text-red-400 font-semibold text-lg">
                        ⚠️ Threat Detected!
                      </div>
                      <div className="text-red-300/70 text-sm">
                        {data.safeBrowsing.threatTypes?.length > 0 
                          ? `Threats: ${data.safeBrowsing.threatTypes.join(", ")}`
                          : "This domain may be unsafe or involved in phishing"}
                      </div>
                    </div>
                  </>
                )}
                {data.safeBrowsing?.safe === null && (
                  <>
                    <FaInfoCircle className="text-yellow-400 text-2xl" />
                    <div>
                      <div className="text-yellow-400 font-semibold text-lg">
                        ⚠️ Unable to Verify
                      </div>
                      <div className="text-yellow-300/70 text-sm">
                        {data.safeBrowsing?.error || "Error checking domain safety"}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Domain Details */}
            <div className="bg-[#101020]/50 border border-indigo-800/30 rounded-lg p-4 space-y-2 text-sm text-gray-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500">Input:</span>
                  <div className="text-white font-mono">{data.input}</div>
                </div>
                <div>
                  <span className="text-gray-500">Normalized URL:</span>
                  <div className="text-white font-mono break-all">{data.normalizedUrl}</div>
                </div>
                <div>
                  <span className="text-gray-500">Domain:</span>
                  <div className="text-white font-mono">{data.domain}</div>
                </div>
                <div>
                  <span className="text-gray-500">Checked:</span>
                  <div className="text-white">{new Date(data.timestamp).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* WHOIS Information */}
            {data.whois && !data.whois.error && (
              <div className="bg-[#101020]/50 border border-indigo-800/30 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <FaGlobe className="text-indigo-400" /> WHOIS Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                  <div>
                    <span className="text-gray-500">Registrar:</span>
                    <div className="text-white">{data.whois.registrar_name || "Unknown"}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <div className="text-white">{data.whois.creation_date || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Expires:</span>
                    <div className="text-white">{data.whois.expiration_date || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated:</span>
                    <div className="text-white">{data.whois.updated_date || "N/A"}</div>
                  </div>
                  {data.whois.name_servers && (
                    <div className="col-span-1 md:col-span-2">
                      <span className="text-gray-500">Name Servers:</span>
                      <div className="text-white font-mono text-xs mt-1">
                        {Array.isArray(data.whois.name_servers) 
                          ? data.whois.name_servers.join(", ")
                          : data.whois.name_servers}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* WHOIS Error */}
            {data.whois?.error && (
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 text-sm text-yellow-300">
                <FaInfoCircle className="inline mr-2" />
                WHOIS lookup failed: {data.whois.error}
              </div>
            )}

            {/* API Attribution */}
            <div className="text-xs text-gray-400 border-t border-gray-800/50 pt-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">•</span>
                <span><strong>Safe Browsing:</strong> Google Safe Browsing API v4</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">•</span>
                <span><strong>WHOIS Data:</strong> API Ninjas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">•</span>
                <span className="italic text-gray-500">Powered by PhishBlock SafeTools</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Initial State - Show Example */}
        {!data && !error && !loading && (
          <div className="mt-5 text-sm text-gray-400 bg-indigo-900/10 border border-indigo-800/30 rounded-lg p-3">
            <FaInfoCircle className="inline mr-2 text-indigo-400" />
            <strong>Try these examples:</strong>
            <div className="mt-2 space-y-1 text-xs">
              <button 
                onClick={() => { setDomain("google.com"); handleLookup(); }}
                className="block text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                • google.com (safe domain)
              </button>
              <button 
                onClick={() => { setDomain("testsafebrowsing.appspot.com/s/malware.html"); handleLookup(); }}
                className="block text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                • testsafebrowsing.appspot.com/s/malware.html (test malware)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}