import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { FaUserEdit, FaSave, FaTimes, FaCamera, FaArrowLeft } from "react-icons/fa";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    async function fetchProfile() {
      try {
        const refDoc = doc(db, "users", user.uid);
        const snap = await getDoc(refDoc);
        if (snap.exists()) setProfile(snap.data());
      } catch (err) {
        console.error("Profile fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleGenderChange = (e) => {
    setProfile({ ...profile, gender: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const imageRef = ref(storage, `profileImages/${user.uid}/${file.name}`);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      setProfile((prev) => ({ ...prev, photoURL: url }));

      // instantly update user context image (Navbar)
      user.photoURL = url;
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image. Check console for details.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const refDoc = doc(db, "users", user.uid);
      await updateDoc(refDoc, {
        displayName: profile.displayName || "",
        username: profile.username || "",
        email: profile.email || "",
        gender: profile.gender || "",
        photoURL: profile.photoURL || "",
      });

      // update Navbar info live
      user.photoURL = profile.photoURL || user.photoURL;
      user.displayName = profile.displayName || user.displayName;

      setEditing(false);
    } catch (err) {
      console.error("Profile update failed:", err);
      alert("Error updating profile. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh] text-gray-400">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-[70vh] text-gray-400">
        No profile found.
      </div>
    );
  }

  return (
    <>
      {/* Back to Feed */}
      <div className="max-w-3xl mx-auto mt-8 mb-2">
        <button
          onClick={() => navigate("/feed")}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-indigo-400 transition"
        >
          <FaArrowLeft />
          Back to Feed
        </button>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto mt-4 p-6 bg-[#0d0d12]/90 rounded-2xl border border-gray-800 text-gray-200 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
      >
        <div className="flex flex-col items-center text-center">
          {/* Profile Picture Section */}
          <div className="relative">
            <motion.img
              src={
                profile.photoURL ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${
                  profile.username || "user"
                }`
              }
              alt="Profile"
              className="w-28 h-28 rounded-full border-2 border-indigo-500 shadow-lg mb-4 object-cover"
              whileHover={{ scale: 1.05 }}
            />
            {editing && (
              <label
                htmlFor="fileUpload"
                className="absolute bottom-5 right-2 bg-indigo-600 hover:bg-indigo-500 p-2 rounded-full cursor-pointer"
              >
                <FaCamera />
                <input
                  type="file"
                  id="fileUpload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Display Name */}
          <motion.h2
            className="text-2xl font-semibold text-indigo-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {profile.displayName || "Anonymous User"}
          </motion.h2>
          <p className="text-gray-400 text-sm mt-1">{profile.email}</p>

          {/* Edit / Save Buttons */}
          <div className="mt-4 flex gap-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md transition text-sm font-medium"
              >
                <FaUserEdit /> Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md transition text-sm font-medium ${
                    saving ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  <FaSave /> {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition text-sm font-medium"
                >
                  <FaTimes /> Cancel
                </button>
              </>
            )}
          </div>

          {uploading && (
            <p className="text-xs text-gray-400 mt-2">Uploading image...</p>
          )}
        </div>

        {/* Editable Fields */}
        <motion.div
          className="mt-8 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[
            { label: "Display Name", name: "displayName" },
            { label: "Username", name: "username" },
            { label: "Email", name: "email" },
          ].map((field, i) => (
            <div key={i}>
              <label className="block text-sm text-gray-400 mb-1">
                {field.label}
              </label>
              {editing ? (
                <input
                  type="text"
                  name={field.name}
                  value={profile[field.name] || ""}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-[#101020] border border-indigo-700/40 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
              ) : (
                <p className="text-gray-300 bg-[#101020] border border-gray-800 rounded-md px-3 py-2">
                  {profile[field.name] || "—"}
                </p>
              )}
            </div>
          ))}

          {/* Gender Dropdown */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Gender</label>
            {editing ? (
              <select
                name="gender"
                value={profile.gender || ""}
                onChange={handleGenderChange}
                className="w-full p-3 rounded-lg bg-[#101020] border border-indigo-700/40 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition cursor-pointer"
              >
                <option value="">Select Gender</option>
                <option value="Male" className="bg-[#0d0d12]">
                  Male
                </option>
                <option value="Female" className="bg-[#0d0d12]">
                  Female
                </option>
                <option value="Other" className="bg-[#0d0d12]">
                  Other
                </option>
              </select>
            ) : (
              <p className="text-gray-300 bg-[#101020] border border-gray-800 rounded-md px-3 py-2">
                {profile.gender || "—"}
              </p>
            )}
          </div>
        </motion.div>

        {/* Joined Date */}
        <p className="text-xs text-gray-500 mt-6 text-right">
          Joined:{" "}
          {profile.joinedAt
            ? new Date(profile.joinedAt.seconds * 1000).toLocaleString()
            : "N/A"}
        </p>
      </motion.div>
    </>
  );
}
