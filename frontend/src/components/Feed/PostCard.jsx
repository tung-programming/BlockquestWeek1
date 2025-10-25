import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../../firebase/firebase";
import ImageModal from "./ImageModal";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  runTransaction,
} from "firebase/firestore";
import {
  FaArrowUp,
  FaArrowDown,
  FaComment,
  FaShareAlt,
  FaLink,
  FaCube,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { useBlockchainTx } from "../../hooks/useBlockchainTx";

function PostCardItem({ post, user, userVote, onVote, onShare }) {
  const [showChain, setShowChain] = useState(false);
  const txInfo = useBlockchainTx(post.anchorTx);

  return (
    <motion.div
      key={post.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#0d0d12]/80 border border-gray-800 rounded-2xl p-5 shadow-[0_0_20px_rgba(99,102,241,0.15)] backdrop-blur-sm hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] transition-all"
    >
      {/* URL + Anchored */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium">
          <FaLink />
          <span className="truncate max-w-[240px] sm:max-w-[350px]">
            {post.url}
          </span>
        </div>

        {post.anchored && (
          <motion.div
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs text-green-400 flex items-center gap-1"
          >
            ✅ Verified & Archived
          </motion.div>
        )}
      </div>

      {/* Description / IPFS note */}
      <p className="text-gray-300 text-sm mb-3">
        {post.anchored
          ? "Reporter name and description are permanently stored on IPFS."
          : post.description || "No description provided."}
      </p>

      {/* Quick Access Links */}
      {post.anchored && (
        <div className="mt-3 border-t border-gray-800 pt-3">
          <div className="flex flex-wrap gap-3 text-xs">
            {post.ipfsGateway && (
              <button
                onClick={() => window.open(post.ipfsGateway, "_blank")}
                className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition"
              >
                🌐 View on IPFS
              </button>
            )}
            {post.backupLink && (
              <button
                onClick={() => window.open(post.backupLink, "_blank")}
                className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition"
              >
                🗂️ Backup (w3s.link)
              </button>
            )}
            {post.anchorTxUrl && (
              <button
                onClick={() => window.open(post.anchorTxUrl, "_blank")}
                className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300 transition"
              >
                🔗 View on Blockchain
              </button>
            )}
          </div>

          {/* Blockchain Visualization Toggle */}
          <button
            onClick={() => setShowChain(!showChain)}
            className="mt-3 text-xs text-indigo-400 underline hover:text-indigo-300 transition"
          >
            {showChain ? "Hide Blockchain Record" : "View Blockchain Record"}
          </button>

          {showChain && txInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-2 bg-[#101020]/60 border border-gray-700 rounded-lg p-3 text-xs text-gray-300"
            >
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                <FaCube /> Blockchain Record
              </div>
              <p>
                <strong>Tx Hash:</strong>{" "}
                <a
                  href={post.anchorTxUrl}
                  target="_blank"
                  className="text-green-400 underline break-all"
                >
                  {post.anchorTx}
                </a>
              </p>
              <p><strong>Block Number:</strong> {txInfo.blockNumber}</p>
              <p><strong>Gas Used:</strong> {txInfo.gasUsed}</p>
              <p><strong>Confirmations:</strong> {txInfo.confirmations}</p>
              <p><strong>Anchored At:</strong> {txInfo.timestamp}</p>
              <p><strong>From:</strong> {txInfo.from}</p>
              <p><strong>To:</strong> {txInfo.to}</p>
              {post.evidenceHash && (
                <p>
                  <strong>Evidence Hash:</strong>{" "}
                  <span className="text-gray-400 break-all">
                    {post.evidenceHash}
                  </span>
                </p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between text-gray-400 text-sm mt-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onVote(post.id, "upvote")}
            className={`flex items-center gap-1 ${
              userVote === 1
                ? "text-indigo-400 font-semibold"
                : "hover:text-indigo-400"
            } transition`}
          >
            <FaArrowUp /> {post.upvotes || 0}
          </button>
          <button
            onClick={() => onVote(post.id, "downvote")}
            className={`flex items-center gap-1 ${
              userVote === -1
                ? "text-red-400 font-semibold"
                : "hover:text-red-400"
            } transition`}
          >
            <FaArrowDown /> {post.downvotes || 0}
          </button>
          <button className="flex items-center gap-1 hover:text-indigo-400 transition">
            <FaComment /> {post.commentsCount || 0}
          </button>
        </div>
        <button
          onClick={() => onShare(post.url)}
          className="flex items-center gap-1 hover:text-indigo-400 transition"
        >
          <FaShareAlt /> Share
        </button>
      </div>

      {/* Author + Timestamp */}
      <div className="mt-4 text-xs text-gray-500">
        Posted by{" "}
        <span className="text-indigo-400">
          {post.authorName || "Unknown"}
        </span>{" "}
        on{" "}
        {post.createdAt?.toDate?.().toLocaleString
          ? post.createdAt.toDate().toLocaleString()
          : post.createdAt || "Unknown"}
      </div>
    </motion.div>
  );
}

export default function PostCard() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch posts
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(fetched);
    });
    return () => unsub();
  }, []);

  // Fetch votes
  useEffect(() => {
    if (!user) return;
    const subs = [];
    posts.forEach((post) => {
      const ref = doc(db, "posts", post.id, "userVotes", user.uid);
      const unsub = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setUserVotes((prev) => ({ ...prev, [post.id]: snap.data().vote }));
        } else {
          setUserVotes((prev) => {
            const c = { ...prev };
            delete c[post.id];
            return c;
          });
        }
      });
      subs.push(unsub);
    });
    return () => subs.forEach((u) => u());
  }, [user, posts]);

  const handleVote = async (id, type) => {
    if (!user) return alert("Please log in to vote.");
    const postRef = doc(db, "posts", id);
    const voteRef = doc(db, "posts", id, "userVotes", user.uid);
    await runTransaction(db, async (tx) => {
      const docSnap = await tx.get(postRef);
      if (!docSnap.exists()) throw "Post not found.";
      const d = docSnap.data();
      const voteDoc = await tx.get(voteRef);
      const prev = voteDoc.exists() ? voteDoc.data().vote : 0;
      let up = d.upvotes || 0;
      let down = d.downvotes || 0;

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

  const handleShare = (url) => {
    navigator.clipboard.writeText(url);
    alert("Post URL copied!");
  };

  if (posts.length === 0)
    return (
      <div className="text-center text-gray-400 py-20">
        <p className="text-lg">No posts yet 💤</p>
        <p className="text-sm text-gray-500">
          Be the first to report a phishing site!
        </p>
      </div>
    );

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCardItem
          key={post.id}
          post={post}
          user={user}
          userVote={userVotes[post.id]}
          onVote={handleVote}
          onShare={handleShare}
        />
      ))}
      <ImageModal imageURL={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}
