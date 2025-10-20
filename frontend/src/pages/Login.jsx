import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase/firebase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // --- Email Login ---
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/feed");
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Google Login ---
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/feed");
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Forgot Password ---
  const handleForgotPassword = async () => {
    if (!email) return alert("Enter your email first.");
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent!");
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
          Welcome Back
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
        <div className="mb-2 relative">
          <label className="block text-sm text-gray-400 mb-1">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            className="w-full p-3 pr-10 rounded-lg bg-[#101020] border border-indigo-700/40 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            placeholder="Enter your password"
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

        {/* Forgot Password */}
        <div
          onClick={handleForgotPassword}
          className="text-right text-sm text-indigo-400 hover:underline cursor-pointer mb-4"
        >
          Forgot Password?
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-700 font-semibold hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all duration-300"
        >
          Log In
        </button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-[1px] bg-gray-700"></div>
          <span className="px-3 text-gray-400 text-sm">or</span>
          <div className="flex-1 h-[1px] bg-gray-700"></div>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 border border-indigo-700/50 rounded-lg hover:bg-[#0f0f1f] transition"
        >
          <FcGoogle className="text-2xl" />
          <span className="font-medium text-gray-300">Continue with Google</span>
        </button>

        {/* Signup Link */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Don’t have an account?{" "}
          <span
            className="text-indigo-400 cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p>
      </motion.div>
    </div>
  );
}
