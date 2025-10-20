import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaFire, FaTrophy, FaCheckCircle } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../firebase/firebase";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";

export default function RightPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trendingPosts, setTrendingPosts] = useState([]);
  const [anchoredPosts, setAnchoredPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch top upvoted posts + anchored posts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Trending = top upvoted posts
        const trendingQuery = query(
          collection(db, "posts"),
          orderBy("upvotes", "desc"),
          limit(3)
        );
        const trendingSnap = await getDocs(trendingQuery);

        const trending = trendingSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Anchored = posts with anchored: true
        const anchoredQuery = query(
          collection(db, "posts"),
          where("anchored", "==", true),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const anchoredSnap = await getDocs(anchoredQuery);
        const anchored = anchoredSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTrendingPosts(trending);
        setAnchoredPosts(anchored);
      } catch (err) {
        console.error("Firestore fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fallback demo data if database empty
  const fallbackTrending = [
    { id: 1, url: "paypal-verify.xyz", upvotes: 42 },
    { id: 2, url: "instagram-help.net", upvotes: 36 },
    { id: 3, url: "microsoft-auth.xyz", upvotes: 27 },
  ];

  const fallbackAnchored = [
    { id: 1, url: "amazon-rewards.click", anchorTx: "0x4529...af15" },
    { id: 2, url: "netflix-login.info", anchorTx: "0x23df...9ba8" },
  ];

  const showTrending = trendingPosts.length > 0 ? trendingPosts : fallbackTrending;
  const showAnchored = anchoredPosts.length > 0 ? anchoredPosts : fallbackAnchored;

  return (
    <div className="sticky top-20 space-y-6 p-4">
      {/* USER SNAPSHOT CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#0d0d12]/80 border border-indigo-800/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(99,102,241,0.15)] backdrop-blur-md"
      >
        <h3 className="text-lg font-semibold text-white mb-3">Your Profile</h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
            {user?.displayName ? user.displayName[0].toUpperCase() : "U"}
          </div>
          <div>
            <div className="text-white font-medium text-sm">
              {user?.displayName || "Guest User"}
            </div>
            <div className="text-xs text-gray-400">
              {user?.email || "Not signed in"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-300 mb-3">
          <span>Badges</span>
          <span className="font-semibold text-indigo-400">3</span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-300 mb-3">
          <span>Posts</span>
          <span className="font-semibold text-indigo-400">12</span>
        </div>
        <button
          onClick={() => navigate(`/profile/${user?.uid || ""}`)}
          className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-700 font-semibold hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all duration-300 text-sm"
        >
          View Full Profile
        </button>
      </motion.div>

      {/* TRENDING POSTS */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-[#0d0d12]/80 border border-indigo-800/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(99,102,241,0.15)] backdrop-blur-md"
      >
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <FaFire className="text-indigo-400" /> Trending Reports
        </h3>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : (
          <ul className="space-y-3">
            {showTrending.map((post) => (
              <li
                key={post.id}
                className="text-gray-300 text-sm flex items-center justify-between border-b border-gray-800/50 pb-2"
              >
                <span className="truncate w-[70%]">
                  {post.url || "Unknown URL"}
                </span>
                <span className="text-indigo-400 font-semibold">
                  ▲ {post.upvotes || 0}
                </span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* RECENT BLOCKCHAIN ACTIVITY */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-[#0d0d12]/80 border border-indigo-800/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(99,102,241,0.15)] backdrop-blur-md"
      >
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <FaCheckCircle className="text-indigo-400" /> Blockchain Anchors
        </h3>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : (
          <ul className="space-y-3">
            {showAnchored.map((post) => (
              <li
                key={post.id}
                className="text-gray-300 text-sm border-b border-gray-800/50 pb-2"
              >
                <div className="truncate">{post.url}</div>
                <div className="text-xs text-indigo-400 truncate">
                  {post.anchorTx || post.tx || "—"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* FOOTER */}
      <p className="text-[10px] text-gray-500 text-center mt-6">
        © 2025 PhishBlock — powered by community & blockchain.
      </p>
    </div>
  );
}
