import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaVirus, FaSearch, FaShieldAlt } from "react-icons/fa";

export default function Tools() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setReport(null);

    // Placeholder for API integration (VirusTotal or URLScan)
    setTimeout(() => {
      setReport({
        url,
        vt_status: "No threats detected",
        vt_score: 0,
        urlscan_result: "Clean",
        scannedAt: new Date().toLocaleString(),
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-semibold text-white flex items-center gap-2"
      >
        <FaShieldAlt className="text-indigo-400" /> Security Tools
      </motion.h2>

      <div className="bg-[#0d0d12]/80 border border-indigo-800/40 rounded-2xl p-5 shadow-[0_0_15px_rgba(99,102,241,0.15)] backdrop-blur-sm">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter URL to scan"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 p-3 rounded-lg bg-[#101020] border border-indigo-700/40 text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          />
          <button
            onClick={handleScan}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-lg text-white font-semibold hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all duration-300"
          >
            {loading ? "Scanning..." : <><FaSearch className="inline mr-2" /> Scan</>}
          </button>
        </div>

        {report && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-sm text-gray-300 space-y-2"
          >
            <div><strong>URL:</strong> {report.url}</div>
            <div><strong>VirusTotal:</strong> {report.vt_status}</div>
            <div><strong>Threat Score:</strong> {report.vt_score}</div>
            <div><strong>URLScan Result:</strong> {report.urlscan_result}</div>
            <div><strong>Scanned At:</strong> {report.scannedAt}</div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
