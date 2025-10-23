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
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { FaArrowUp, FaArrowDown, FaComment, FaShareAlt, FaLink } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";

export default function PostCard() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  // ✅ Fetch posts live
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(fetched);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Fetch user votes for all posts (on login)
  useEffect(() => {
    if (!user) return;
    const unsubscribes = [];

    posts.forEach((post) => {
      const voteRef = doc(db, "posts", post.id, "userVotes", user.uid);
      const unsub = onSnapshot(voteRef, (snap) => {
        if (snap.exists()) {
          setUserVotes((prev) => ({ ...prev, [post.id]: snap.data().vote }));
        } else {
          setUserVotes((prev) => {
            const newVotes = { ...prev };
            delete newVotes[post.id];
            return newVotes;
          });
        }
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach((u) => u());
  }, [user, posts]);

  // ✅ Fetch archived content from IPFS if needed
  useEffect(() => {
    async function fetchArchived(post) {
      if (post.archived && post.decentralized?.cid && !post.description) {
        try {
          const res = await fetch(`https://ipfs.io/ipfs/${post.decentralized.cid}/post.json`);
          const data = await res.json();
          post.description = data.desc || "";
          post.imageURL = `https://ipfs.io/ipfs/${post.decentralized.cid}/image.jpg`;
          setPosts((prev) =>
            prev.map((p) => (p.id === post.id ? { ...p, ...post } : p))
          );
        } catch (e) {
          console.error("Error fetching IPFS content", e);
        }
      }
    }

    posts.forEach((p) => fetchArchived(p));
  }, [posts]);

  // ✅ Vote handling logic
  const handleVote = async (postId, type) => {
    if (!user) return alert("Please log in to vote.");
    const postRef = doc(db, "posts", postId);
    const voteRef = doc(db, "posts", postId, "userVotes", user.uid);

    await runTransaction(db, async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists()) throw "Post does not exist";

      const postData = postDoc.data();
      const userVoteDoc = await transaction.get(voteRef);
      const prevVote = userVoteDoc.exists() ? userVoteDoc.data().vote : 0;

      let newUpvotes = postData.upvotes || 0;
      let newDownvotes = postData.downvotes || 0;

      if (prevVote === 1 && type === "upvote") {
        newUpvotes -= 1;
        transaction.update(postRef, { upvotes: newUpvotes });
        transaction.delete(voteRef);
        return;
      }

      if (prevVote === -1 && type === "downvote") {
        newDownvotes -= 1;
        transaction.update(postRef, { downvotes: newDownvotes });
        transaction.delete(voteRef);
        return;
      }

      if (prevVote === 1 && type === "downvote") {
        newUpvotes -= 1;
        newDownvotes += 1;
        transaction.update(postRef, {
          upvotes: newUpvotes,
          downvotes: newDownvotes,
        });
        transaction.set(voteRef, { vote: -1 });
        return;
      }

      if (prevVote === -1 && type === "upvote") {
        newDownvotes -= 1;
        newUpvotes += 1;
        transaction.update(postRef, {
          upvotes: newUpvotes,
          downvotes: newDownvotes,
        });
        transaction.set(voteRef, { vote: 1 });
        return;
      }

      if (prevVote === 0 && type === "upvote") {
        newUpvotes += 1;
        transaction.update(postRef, { upvotes: newUpvotes });
        transaction.set(voteRef, { vote: 1 });
        return;
      }

      if (prevVote === 0 && type === "downvote") {
        newDownvotes += 1;
        transaction.update(postRef, { downvotes: newDownvotes });
        transaction.set(voteRef, { vote: -1 });
        return;
      }
    });
  };

  // ✅ Share URL
  const handleShare = (postUrl) => {
    navigator.clipboard.writeText(postUrl);
    alert("Post URL copied to clipboard!");
  };

  if (posts.length === 0) {
    return (
      <div className="text-center text-gray-400 py-20">
        <p className="text-lg">No posts yet 💤</p>
        <p className="text-sm text-gray-500">
          Be the first to report a phishing site!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => {
        const userVote = userVotes[post.id] || 0;
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
                <span className="truncate max-w-[220px] sm:max-w-[300px]">
                  {post.url}
                </span>
              </div>
              {post.anchored && (
                <div className="text-xs text-green-400 flex items-center gap-1">
                  ✅ Anchored
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-300 text-sm mb-3">
              {post.description || "No description provided."}
            </p>

            {/* ✅ Image Preview (clickable) */}
            {post.imageURL && (
              <div
                className="rounded-lg overflow-hidden mb-3 border border-gray-700 cursor-pointer hover:opacity-90 transition"
                onClick={() => setSelectedImage(post.imageURL)}
              >
                <img
                  src={post.imageURL}
                  alt="Post"
                  className="w-full object-cover max-h-64"
                />
              </div>
            )}

            {/* ✅ Anchored / View on IPFS */}
            {post.anchored && post.decentralized?.cid && (
              <div className="mt-3 flex items-center justify-between text-xs text-indigo-400">
                <div className="flex items-center gap-1">
                  ✅ <span>Verified & Archived</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      window.open(
                        `https://ipfs.io/ipfs/${post.decentralized.cid}/post.json`,
                        "_blank"
                      )
                    }
                    className="text-indigo-400 hover:text-indigo-300 underline"
                  >
                    View on IPFS
                  </button>
                  {post.anchorTx && (
                    <button
                      onClick={() =>
                        window.open(
                          `https://amoy.polygonscan.com/tx/${post.anchorTx}`,
                          "_blank"
                        )
                      }
                      className="text-green-400 hover:text-green-300 underline"
                    >
                      View on Blockchain
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between text-gray-400 text-sm mt-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleVote(post.id, "upvote")}
                  className={`flex items-center gap-1 ${
                    userVote === 1
                      ? "text-indigo-400 font-semibold"
                      : "hover:text-indigo-400"
                  } transition`}
                >
                  <FaArrowUp /> {post.upvotes || 0}
                </button>

                <button
                  onClick={() => handleVote(post.id, "downvote")}
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
                onClick={() => handleShare(post.url)}
                className="flex items-center gap-1 hover:text-indigo-400 transition"
              >
                <FaShareAlt /> Share
              </button>
            </div>

            {/* Author */}
            <div className="mt-4 text-xs text-gray-500">
              Posted by{" "}
              <span className="text-indigo-400">{post.authorName}</span>{" "}
              on {post.createdAt?.toDate?.().toLocaleString() || "Unknown"}
            </div>
          </motion.div>
        );
      })}

      {/* ✅ Image Modal */}
      <ImageModal
        imageURL={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}
