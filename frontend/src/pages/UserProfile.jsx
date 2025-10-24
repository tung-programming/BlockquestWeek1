import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { db } from "../firebase/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { FaArrowLeft } from "react-icons/fa";

export default function UserProfile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setUserData(snap.data());
        }

        // Fetch posts by that user
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("authorId", "==", uid));
        const postSnap = await getDocs(q);
        setUserPosts(postSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh] text-gray-400">
        Loading profile...
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex justify-center items-center h-[80vh] text-gray-400">
        User not found.
      </div>
    );
  }

  return (
    <>
      {/* Back to Feed */}
      <div className="max-w-3xl mx-auto mt-8 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-indigo-400 transition"
        >
          <FaArrowLeft /> Back
        </button>
      </div>

      {/* Profile Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto mt-4 p-6 bg-[#0d0d12]/90 rounded-2xl border border-gray-800 text-gray-200 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
      >
        <div className="flex flex-col items-center text-center">
          <img
            src={
              userData.photoURL ||
              `https://api.dicebear.com/7.x/identicon/svg?seed=${userData.username}`
            }
            alt="Profile"
            className="w-28 h-28 rounded-full border-2 border-indigo-500 shadow-lg mb-3 object-cover"
          />
          <h2 className="text-2xl font-semibold text-indigo-400">
            {userData.displayName || "Anonymous User"}
          </h2>
          <p className="text-gray-400 text-sm mt-1">{userData.email}</p>
          <p className="text-sm text-gray-400 mt-1">
            @{userData.username || "unknown"}
          </p>
        </div>

        {/* User Stats */}
        <div className="flex justify-around mt-6 text-center">
          <div>
            <p className="text-indigo-400 text-lg font-bold">{userPosts.length}</p>
            <p className="text-gray-400 text-xs">Posts</p>
          </div>
          <div>
            <p className="text-indigo-400 text-lg font-bold">
              {userData.badges?.length || 0}
            </p>
            <p className="text-gray-400 text-xs">Badges</p>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-3">
            Recent Reports
          </h3>
          {userPosts.length > 0 ? (
            <ul className="space-y-3">
              {userPosts.map((p) => (
                <li
                  key={p.id}
                  onClick={() => navigate(`/post/${p.id}`)}
                  className="border border-gray-800 rounded-lg p-3 hover:bg-[#101020] transition cursor-pointer"
                >
                  <p className="text-sm text-indigo-400 truncate">{p.url}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {p.description || ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No posts yet.</p>
          )}
        </div>
      </motion.div>
    </>
  );
}
