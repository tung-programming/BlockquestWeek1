import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { motion } from "framer-motion";
import { db } from "../firebase/firebase";
import {
  doc,
  onSnapshot,
  runTransaction,
  collection,
} from "firebase/firestore";
import { FaArrowUp, FaArrowDown, FaCube, FaLink, FaArrowLeft } from "react-icons/fa";

import { useAuth } from "../hooks/useAuth";
import { useBlockchainTx } from "../hooks/useBlockchainTx";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState(0);
  const txInfo = useBlockchainTx(post?.anchorTx);
  

  // Fetch post (live)
  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "posts", id);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setPost({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  // Fetch current user’s vote (if logged in)
  useEffect(() => {
    if (!user || !post) return;
    const voteRef = doc(db, "posts", post.id, "userVotes", user.uid);
    const unsub = onSnapshot(voteRef, (snap) => {
      if (snap.exists()) setUserVote(snap.data().vote);
      else setUserVote(0);
    });
    return () => unsub();
  }, [user, post]);

  // Voting handler
  const handleVote = async (type) => {
    if (!user || !post) return alert("Please log in to vote.");
    const postRef = doc(db, "posts", post.id);
    const voteRef = doc(db, "posts", post.id, "userVotes", user.uid);
    await runTransaction(db, async (tx) => {
      const postDoc = await tx.get(postRef);
      if (!postDoc.exists()) throw "Post not found.";
      const data = postDoc.data();
      const voteSnap = await tx.get(voteRef);
      const prev = voteSnap.exists() ? voteSnap.data().vote : 0;

      let up = data.upvotes || 0;
      let down = data.downvotes || 0;

      if (prev === 1 && type === "upvote") {
        up--; tx.update(postRef, { upvotes: up }); tx.delete(voteRef); return;
      }
      if (prev === -1 && type === "downvote") {
        down--; tx.update(postRef, { downvotes: down }); tx.delete(voteRef); return;
      }
      if (prev === 1 && type === "downvote") {
        up--; down++; tx.update(postRef, { upvotes: up, downvotes: down }); tx.set(voteRef, { vote: -1 }); return;
      }
      if (prev === -1 && type === "upvote") {
        down--; up++; tx.update(postRef, { upvotes: up, downvotes: down }); tx.set(voteRef, { vote: 1 }); return;
      }
      if (prev === 0 && type === "upvote") {
        up++; tx.update(postRef, { upvotes: up }); tx.set(voteRef, { vote: 1 }); return;
      }
      if (prev === 0 && type === "downvote") {
        down++; tx.update(postRef, { downvotes: down }); tx.set(voteRef, { vote: -1 }); return;
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh] text-gray-400">
        Loading post details...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex justify-center items-center h-[80vh] text-gray-400">
        Post not found.
      </div>
    );
  }

  return (
    <>
    <div className="max-w-3xl mx-auto mt-8 mb-2">
      <button
        onClick={() => navigate("/feed")}
        className="flex items-center gap-2 text-sm text-gray-300 hover:text-indigo-400 transition"
      >
        <FaArrowLeft />
        Back to Feed
      </button>
    </div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto mt-10 p-6 rounded-2xl border border-gray-800 bg-[#0d0d12]/80 text-gray-200 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
    >
      
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 text-indigo-400 text-sm">
          <FaLink />
          <span className="truncate max-w-[250px]">{post.url}</span>
        </div>
        {post.anchored && (
          <span className="text-xs text-green-400">✅ Verified & Archived</span>
        )}
      </div>

      <p className="text-gray-300 mb-4">{post.description || "No description."}</p>

      {/* Vote Section */}
      <div className="flex items-center gap-4 mb-6 text-sm">
        <button
          onClick={() => handleVote("upvote")}
          className={`flex items-center gap-1 ${
            userVote === 1
              ? "text-indigo-400 font-semibold"
              : "hover:text-indigo-400"
          } transition`}
        >
          <FaArrowUp /> {post.upvotes || 0}
        </button>

        <button
          onClick={() => handleVote("downvote")}
          className={`flex items-center gap-1 ${
            userVote === -1
              ? "text-red-400 font-semibold"
              : "hover:text-red-400"
          } transition`}
        >
          <FaArrowDown /> {post.downvotes || 0}
        </button>
      </div>

      {/* IPFS + Blockchain Section */}
      {post.anchored && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="p-4 rounded-xl bg-[#101020]/60 border border-indigo-700/40 mb-4"
        >
          <h3 className="text-indigo-400 font-semibold flex items-center gap-2 mb-2">
            <FaCube /> Blockchain Verification
          </h3>

          <div className="text-xs text-gray-400 space-y-1">
            <p>
              <strong>Tx Hash:</strong>{" "}
              <a
                href={
                  post.anchorTxUrl ||
                  `https://amoy.polygonscan.com/tx/${post.anchorTx}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-green-400 underline break-all"
              >
                {post.anchorTx}
              </a>
            </p>
            <p><strong>Block:</strong> {txInfo?.blockNumber || "—"}</p>
            <p><strong>Anchored At:</strong> {txInfo?.timestamp || "—"}</p>
            <p><strong>Confirmations:</strong> {txInfo?.confirmations || 0}</p>
          </div>

          <div className="flex gap-3 mt-3 flex-wrap">
            {post.ipfsGateway && (
              <button
                onClick={() => window.open(post.ipfsGateway, "_blank")}
                className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 text-xs transition"
              >
                🌐 View on IPFS
              </button>
            )}
            {post.backupLink && (
              <button
                onClick={() => window.open(post.backupLink, "_blank")}
                className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 text-xs transition"
              >
                🗂️ Backup (w3s.link)
              </button>
            )}
          </div>
        </motion.div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        Posted by <span className="text-indigo-400">{post.authorName || "Unknown"}</span>{" "}
        • {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : "N/A"}
      </div>
    </motion.div>
    </>
  );
}
