import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import { FaTimes } from "react-icons/fa";

export default function PostForm({ open, onClose }) {
  const { user } = useAuth();
  const [type, setType] = useState("url"); // "url" or "wallet"
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidWallet = (val) => {
    // basic Ethereum address check: 0x + 40 hex chars
    return /^0x[a-fA-F0-9]{40}$/.test(val.trim());
  };

  const isValidUrl = (val) => {
    try {
      // ensure it has a protocol; the native URL check is good and robust
      const u = new URL(val.trim());
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please log in to create a post.");

    // require description as before
    if (!description.trim()) {
      alert("Please provide a description / reason.");
      return;
    }

    if (!url.trim()) {
      alert(`Please provide a ${type === "url" ? "website URL" : "wallet address"}.`);
      return;
    }

    // validation based on chosen type
    if (type === "url") {
      if (!isValidUrl(url)) {
        alert("Please enter a valid URL (must include http:// or https://).");
        return;
      }
    } else {
      // wallet
      if (!isValidWallet(url)) {
        const confirmSave = window.confirm(
          "The wallet address doesn't match the basic 0x.. pattern. Do you still want to submit it as provided?"
        );
        if (!confirmSave) return;
      }
      // NOTE: we still save wallet into the same `url` field as requested
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "posts"), {
        url: url.trim(),
        description: description.trim(),
        // no image
        authorId: user.uid,
        authorName: user.displayName || user.email.split("@")[0],
        upvotes: 0,
        downvotes: 0,
        anchored: false,
        anchorTx: "",
        createdAt: serverTimestamp(),
      });

      setUrl("");
      setDescription("");
      setType("url");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error submitting post: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 40 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0d0d12]/95 border border-indigo-800/40 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)] p-6 w-[90%] max-w-md text-white relative"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>

            <h3 className="text-xl font-semibold mb-4 text-center bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
              Report a Phishing Site
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type toggle */}
              <div className="flex items-center gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setType("url")}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                    type === "url"
                      ? "bg-indigo-600 text-white shadow-[0_6px_18px_rgba(99,102,241,0.18)]"
                      : "bg-[#0f1020] text-gray-300 border border-indigo-800/40 hover:bg-[#121225]"
                  }`}
                >
                  Website URL
                </button>
                <button
                  type="button"
                  onClick={() => setType("wallet")}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                    type === "wallet"
                      ? "bg-indigo-600 text-white shadow-[0_6px_18px_rgba(99,102,241,0.18)]"
                      : "bg-[#0f1020] text-gray-300 border border-indigo-800/40 hover:bg-[#121225]"
                  }`}
                >
                  Wallet Address
                </button>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {type === "url" ? "Website URL" : "Wallet Address"}
                </label>
                <input
                  type="text"
                  placeholder={type === "url" ? "https://example.com" : "0x1234... (Ethereum / Polygon address)"}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#101020] border border-indigo-700/40 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {type === "url"
                    ? "Include the full URL (must start with http:// or https://)."
                    : "Provide the full wallet address (0x...); ENS names are not validated here."}
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description / Reason</label>
                <textarea
                  placeholder="Why do you think this site is phishing?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#101020] border border-indigo-700/40 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition h-28 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 rounded-lg font-semibold text-white transition-all duration-300 ${
                  loading
                    ? "bg-indigo-900 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 to-indigo-700 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                }`}
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
