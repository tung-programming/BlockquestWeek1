import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function SearchDropdown({ searchQuery, onClose }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === "") {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      const postsRef = collection(db, "posts");
      const usersRef = collection(db, "users");
      const qLower = searchQuery.toLowerCase();

      const [postsSnap, usersSnap] = await Promise.all([
        getDocs(query(postsRef, orderBy("createdAt", "desc"), limit(20))),
        getDocs(query(usersRef, limit(20))),
      ]);

      const postResults = postsSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data(), type: "post" }))
        .filter(
          (p) =>
            p.url?.toLowerCase().includes(qLower) ||
            p.description?.toLowerCase().includes(qLower) ||
            p.authorName?.toLowerCase().includes(qLower)
        );

      const userResults = usersSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data(), type: "user" }))
        .filter(
          (u) =>
            u.displayName?.toLowerCase().includes(qLower) ||
            u.username?.toLowerCase().includes(qLower)
        );

      setResults([...postResults.slice(0, 5), ...userResults.slice(0, 5)]);
      setLoading(false);
    };

    fetchResults();
  }, [searchQuery]);

  if (!searchQuery || searchQuery.trim() === "") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute w-full mt-2 rounded-lg bg-[#0b0b0d]/95 border border-gray-800 shadow-lg backdrop-blur-md z-50"
      >
        {loading ? (
          <div className="text-gray-400 text-sm p-3 text-center">
            Searching...
          </div>
        ) : results.length > 0 ? (
          <ul className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
            {results.map((item) => (
              <li
                key={item.id}
                onClick={() => {
                  if (item.type === "post") navigate(`/post/${item.id}`);
                  else navigate(`/profile/${item.id}`);
                  onClose();
                }}
                className="px-4 py-2 text-sm text-gray-300 hover:bg-[#11111a] cursor-pointer transition flex flex-col"
              >
                {item.type === "post" ? (
                  <>
                    <span className="font-semibold text-indigo-400 truncate">
                      {item.url || "Post"}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {item.description || ""}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-blue-400">
                      {item.displayName || item.username}
                    </span>
                    <span className="text-xs text-gray-500">User</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500 text-sm p-3 text-center">
            No results found.
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
