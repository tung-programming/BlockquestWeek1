import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../firebase/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { FaLink, FaFilter, FaCube } from "react-icons/fa";
import BackButton from "../components/BackButton";


export default function Anchors() {
  const [anchors, setAnchors] = useState([]);
  const [filter, setFilter] = useState("latest");

  useEffect(() => {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, where("anchored", "==", true), orderBy("archivedAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAnchors(docs);
    });
    return () => unsub();
  }, []);

  const sortedAnchors = [...anchors].sort((a, b) => {
    if (filter === "votes") return (b.upvotes || 0) - (a.upvotes || 0);
    if (filter === "date") return new Date(b.archivedAt?.toDate?.() || 0) - new Date(a.archivedAt?.toDate?.() || 0);
    return 0;
  });

  return (
    <div className="p-6 space-y-6">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-semibold text-white flex items-center gap-2"
      >
        <FaCube className="text-indigo-400" /> Blockchain Anchors
      </motion.h2>
      <div className="mt-2">
       <BackButton />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">Explore all verified & archived phishing reports.</p>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-[#101020] text-gray-300 border border-indigo-700/40 rounded-md text-sm px-2 py-1 focus:ring-1 focus:ring-indigo-500"
        >
          <option value="latest">Sort by Latest</option>
          <option value="votes">Sort by Upvotes</option>
          <option value="date">Sort by Date</option>
        </select>
      </div>

      <div className="grid gap-4">
        {sortedAnchors.length > 0 ? (
          sortedAnchors.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0d0d12]/80 border border-indigo-800/40 rounded-2xl p-5 shadow-[0_0_15px_rgba(99,102,241,0.15)] text-gray-300"
            >
              <div className="flex items-center justify-between">
                <a
                  href={post.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 font-medium hover:underline truncate max-w-[300px] flex items-center gap-2"
                >
                  <FaLink /> {post.url}
                </a>
                <span className="text-xs text-gray-400">
                  {post.upvotes || 0} ▲ upvotes
                </span>
              </div>

              <div className="text-xs text-gray-400 mt-2">
                <a
                  href={post.anchorTxUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-indigo-400"
                >
                  View on Blockchain
                </a>
                {" • "}
                <a
                  href={post.ipfsGateway}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-blue-400"
                >
                  View IPFS Metadata
                </a>
              </div>
            </motion.div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No anchored posts yet.</p>
        )}
      </div>
    </div>
  );
}
