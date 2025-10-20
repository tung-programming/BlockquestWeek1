import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, createUserProfile } from "../firebase/firebase";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // --- Email Signup ---
  const handleSignup = async () => {
    if (password !== confirmPassword)
      return alert("Passwords do not match.");
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: email.split("@")[0] });
      await createUserProfile(user);
      navigate("/feed");
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Google Signup ---
  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserProfile(result.user);
      navigate("/feed");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#0f1020] to-[#07070a] text-white">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-[#0d0d0f]/90 border border-indigo-700/30 rounded-2xl p-8 w-[90%] sm:w-[400px] shadow-[0_0_20px_rgba(99,102,241,0.2)]"
      >
        <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent mb-6">
          Create Account
        </h2>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <input
            type="email"
            className="w-full p-3 rounded-lg bg-[#101020] border border-indigo-700/40 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="mb-4 relative">
          <label className="block text-sm text-gray-400 mb-1">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            className="w-full p-3 pr-10 rounded-lg bg-[#101020] border border-indigo-700/40 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-indigo-400 transition"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="mb-6 relative">
          <label className="block text-sm text-gray-400 mb-1">Re-enter Password</label>
          <input
            type={showConfirm ? "text" : "password"}
            className="w-full p-3 pr-10 rounded-lg bg-[#101020] border border-indigo-700/40 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-9 text-gray-400 hover:text-indigo-400 transition"
          >
            {showConfirm ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Signup Button */}
        <button
          onClick={handleSignup}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-700 font-semibold hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all duration-300"
        >
          Create Account
        </button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-[1px] bg-gray-700"></div>
          <span className="px-3 text-gray-400 text-sm">or</span>
          <div className="flex-1 h-[1px] bg-gray-700"></div>
        </div>

        {/* Google Signup */}
        <button
          onClick={handleGoogleSignup}
          className="w-full flex items-center justify-center gap-3 py-3 border border-indigo-700/50 rounded-lg hover:bg-[#0f0f1f] transition"
        >
          <FcGoogle className="text-2xl" />
          <span className="font-medium text-gray-300">Sign up with Google</span>
        </button>

        {/* Login Redirect */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <span
            className="text-indigo-400 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Log In
          </span>
        </p>
      </motion.div>
    </div>
  );
}
