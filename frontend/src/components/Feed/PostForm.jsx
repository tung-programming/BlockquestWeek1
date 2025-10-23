import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import { FaTimes } from "react-icons/fa";

export default function PostForm({ open, onClose }) {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please log in to create a post.");

    if (!url || !description) {
      alert("Please fill in both URL and description.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "posts"), {
        url,
        description,
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
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error submitting post: " + err.message);
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
              <div>
                <label className="block text-sm text-gray-400 mb-1">Website URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#101020] border border-indigo-700/40 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
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
