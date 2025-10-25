import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaFire, FaCheckCircle, FaClock } from "react-icons/fa";
import { db } from "../../firebase/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

export default function RightPanel() {
  const navigate = useNavigate();
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [anchoredPosts, setAnchoredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  // 🔥 Trending & ⛓️ Anchored (Real-time)
  useEffect(() => {
    const postsRef = collection(db, "posts");

    // Trending (Top 3 upvoted)
    const trendingQuery = query(postsRef, orderBy("upvotes", "desc"), limit(3));
    const unsubTrending = onSnapshot(trendingQuery, (snapshot) => {
      const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTrendingPosts(posts);
      setLoading(false);
    });

    // Anchored (recent 3)
    const anchoredQuery = query(
      postsRef,
      where("anchored", "==", true),
      orderBy("archivedAt", "desc"),
      limit(3)
    );
    const unsubAnchored = onSnapshot(anchoredQuery, (snapshot) => {
      const anchors = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAnchoredPosts(anchors);
      setLoading(false);
    });

    return () => {
      unsubTrending();
      unsubAnchored();
    };
  }, []);

  // 🕒 Real-time clock (updates every second)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatted = now.toLocaleString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentTime(formatted);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const showTrending = trendingPosts || [];
  const showAnchored = anchoredPosts || [];

  return (
    <div className="sticky top-20 space-y-6 p-4">
      {/* 🔥 TRENDING REPORTS */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#0d0d12]/80 border border-indigo-800/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(99,102,241,0.15)] backdrop-blur-md"
      >
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <FaFire className="text-indigo-400" /> Trending Reports
        </h3>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : showTrending.length > 0 ? (
          <ul className="space-y-3">
            {showTrending.map((post) => (
              <li
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                className="text-gray-300 text-sm flex items-center justify-between border-b border-gray-800/50 pb-2 cursor-pointer hover:text-indigo-300 transition"
              >
                <span className="truncate max-w-[150px]">{post.url}</span>
                <span className="text-indigo-400 font-semibold flex-shrink-0">
                  ▲ {post.upvotes || 0}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No trending posts yet.</p>
        )}
      </motion.div>

      {/* ⛓️ BLOCKCHAIN ANCHORS */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-[#0d0d12]/80 border border-indigo-800/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(99,102,241,0.15)] backdrop-blur-md"
      >
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <FaCheckCircle className="text-indigo-400" /> Blockchain Anchors
        </h3>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : showAnchored.length > 0 ? (
          <ul className="space-y-3">
            {showAnchored.map((post) => (
              <li
                key={post.id}
                className="text-gray-300 text-sm border-b border-gray-800/50 pb-2"
              >
                <div className="truncate max-w-[200px]">{post.url}</div>
                <a
                  href={
                    post.anchorTxUrl ||
                    `https://amoy.polygonscan.com/tx/${post.anchorTx}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 truncate hover:underline block"
                >
                  {post.anchorTx || "—"}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No anchors yet.</p>
        )}
      </motion.div>

      {/* 🕒 REAL-TIME DATE & TIME */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-[#0d0d12]/80 border border-indigo-800/40 rounded-2xl p-4 shadow-[0_0_20px_rgba(99,102,241,0.15)] text-center text-xs text-gray-400"
      >
        <div className="flex flex-col items-center gap-2">
          <FaClock className="text-indigo-400 text-base" />
          <div className="text-[11px] font-mono tracking-wide text-gray-300">
            {currentTime}
          </div>
        </div>
      </motion.div>

      <p className="text-[10px] text-gray-500 text-center mt-4">
        © 2025 PhishBlock — powered by community & blockchain.
      </p>
    </div>
  );
}
