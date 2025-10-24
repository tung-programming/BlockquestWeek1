import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaFire, FaCheckCircle } from "react-icons/fa";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../hooks/useAuth";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getCountFromServer,
  doc,
  getDoc,
} from "firebase/firestore";

export default function RightPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trendingPosts, setTrendingPosts] = useState([]);
  const [anchoredPosts, setAnchoredPosts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🧠 Fetch User Info + Posts Count
  useEffect(() => {
    if (!user) return;

    async function fetchUserData() {
      try {
        // User Info
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) setUserData(snap.data());

        // Posts Count
        const postsRef = collection(db, "posts");
        const postsQuery = query(postsRef, where("authorId", "==", user.uid));
        const snapshot = await getCountFromServer(postsQuery);
        setPostCount(snapshot.data().count);
      } catch (err) {
        console.error("Error loading profile data:", err);
      }
    }

    fetchUserData();
  }, [user]);

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

  const showTrending = trendingPosts || [];
  const showAnchored = anchoredPosts || [];

  return (
    <div className="sticky top-20 space-y-6 p-4">
      {/* USER SNAPSHOT */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#0d0d12]/80 border border-indigo-800/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(99,102,241,0.15)] backdrop-blur-md"
      >
        <h3 className="text-lg font-semibold text-white mb-3">Your Profile</h3>

        <div className="flex items-center gap-3 mb-3">
          {userData?.photoURL || user?.photoURL ? (
            <img
              src={userData?.photoURL || user?.photoURL}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover border border-indigo-500"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
              {user?.displayName ? user.displayName[0].toUpperCase() : "U"}
            </div>
          )}

          <div>
            <div className="text-white font-medium text-sm">
              {user?.displayName || "Guest User"}
            </div>
            <div className="text-xs text-gray-400">
              {user?.email || "Not signed in"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
          <span>Badges</span>
          <span className="font-semibold text-indigo-400">
            {userData?.badges?.length || 0}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-300 mb-3">
          <span>Posts</span>
          <span className="font-semibold text-indigo-400">{postCount}</span>
        </div>

        <button
          onClick={() => navigate("/profile")}
          className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-700 font-semibold hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all duration-300 text-sm"
        >
          View Full Profile
        </button>
      </motion.div>

      {/* 🔥 TRENDING REPORTS */}
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
        transition={{ delay: 0.2, duration: 0.4 }}
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

      <p className="text-[10px] text-gray-500 text-center mt-6">
        © 2025 PhishBlock — powered by community & blockchain.
      </p>
    </div>
  );
}
