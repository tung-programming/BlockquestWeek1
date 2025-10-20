import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaUsers,
  FaShieldAlt,
  FaAward,
  FaBolt,
  FaLock,
  FaGithub,
} from "react-icons/fa";

export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleExplore = () => navigate("/signup");
  const handleKnowMore = () => {
    const section = document.getElementById("features");
    section?.scrollIntoView({ behavior: "smooth" });
  };

  const features = [
    {
      title: "Community Verification",
      desc: "Posts are upvoted and verified by real users before being anchored on-chain.",
      icon: FaUsers,
    },
    {
      title: "Blockchain Anchoring",
      desc: "Once a report hits 10+ upvotes, it’s stored immutably on the blockchain.",
      icon: FaShieldAlt,
    },
    {
      title: "User Profiles & Badges",
      desc: "Earn recognition for accurate reports with unique badge milestones.",
      icon: FaAward,
    },
    {
      title: "Real-Time Feed",
      desc: "Stay updated with trending phishing reports as soon as they’re posted.",
      icon: FaBolt,
    },
    {
      title: "Secure Storage",
      desc: "All data is handled with strong Firebase and blockchain-backed security.",
      icon: FaLock,
    },
    {
      title: "Open Source",
      desc: "Fully transparent — contribute and verify everything on GitHub.",
      icon: FaGithub,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gradient-to-b from-[#0a0a0a] via-[#0f0f1a] to-[#080808] text-white relative overflow-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-6 border-b border-gray-800 bg-[#0a0a0a]/70 backdrop-blur-md sticky top-0 z-50">
        <h1
          onClick={() => navigate("/")}
          className="text-2xl font-bold tracking-wide text-white hover:text-indigo-400 transition cursor-pointer"
        >
          PhishBlock
        </h1>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="focus:outline-none text-gray-300 hover:text-indigo-400 transition"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Desktop Nav */}
        <ul className="hidden md:flex space-x-8 text-gray-300">
          <li className="hover:text-indigo-400 cursor-pointer transition">Home</li>
          <li className="hover:text-indigo-400 cursor-pointer transition" onClick={handleKnowMore}>
            Features
          </li>
          <li className="hover:text-indigo-400 cursor-pointer transition">
            <a href="#about">About</a>
          </li>
        </ul>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex space-x-4">
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-900 hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-300"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-lg font-semibold hover:shadow-[0_0_25px_rgba(99,102,241,0.8)] transition-all duration-300"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden flex flex-col items-center space-y-4 py-4 bg-[#0a0a0a]/90 border-b border-gray-800">
          <button onClick={handleKnowMore} className="hover:text-indigo-400 transition">
            Features
          </button>
          <a href="#about" className="hover:text-indigo-400 transition">
            About
          </a>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 border border-gray-700 rounded-lg hover:bg-gray-900 transition"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-lg font-semibold hover:shadow-[0_0_25px_rgba(99,102,241,0.8)] transition"
          >
            Sign Up
          </button>
        </div>
      )}

      {/* Hero Section with motion */}
      <motion.section
        className="flex flex-col items-center justify-center flex-grow text-center py-12 md:py-16 px-6 md:px-16"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <motion.h2
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight bg-gradient-to-r from-white via-indigo-400 to-indigo-600 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(99,102,241,0.3)]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Spot. Report. Block. <br />
          <span className="text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]">
            Together.
          </span>
        </motion.h2>

        <motion.p
          className="max-w-2xl text-gray-300 mb-8 text-base sm:text-lg tracking-wide drop-shadow-[0_1px_6px_rgba(255,255,255,0.1)]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Join the community-powered platform that detects and verifies phishing threats through
          collective intelligence — where every upvote secures the web.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <button
            onClick={handleExplore}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-lg font-semibold shadow-[0_0_15px_rgba(99,102,241,0.6)] hover:shadow-[0_0_25px_rgba(99,102,241,0.8)] transition-all duration-300"
          >
            Explore
          </button>
          <button
            onClick={handleKnowMore}
            className="px-8 py-3 border border-gray-700 hover:bg-gray-900 rounded-lg font-semibold transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,255,255,0.3)]"
          >
            Know More
          </button>
        </motion.div>
      </motion.section>

      {/* Features Section with motion */}
      <motion.section
        id="features"
        className="py-12 px-6 sm:px-10 bg-gradient-to-b from-[#0b0b0b]/70 to-[#050505]/90 border-t border-gray-800 relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent)] pointer-events-none"></div>

        <h3 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
          Features
        </h3>
        <div className="h-1 w-24 mx-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 rounded-full mb-12"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                className="relative bg-[#0b0b0c]/80 border border-transparent rounded-2xl p-[1px] hover:-translate-y-1 transition-all duration-500 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-r before:from-indigo-500 before:via-purple-500 before:to-blue-600 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 animate-[float_4s_ease-in-out_infinite]"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="relative z-10 bg-[#121212]/90 rounded-2xl p-6 text-center">
                  <Icon className="text-indigo-400 text-3xl mb-3 mx-auto" />
                  <h4 className="text-xl font-semibold mb-3 text-white">{f.title}</h4>
                  <p className="text-gray-400 text-sm">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Footer */}
      <footer
        id="about"
        className="bg-gradient-to-t from-[#0b0b0b] to-[#0f0f1a] border-t border-indigo-900/50 text-gray-400 text-center py-10 px-6"
      >
        <p className="mb-2 text-sm sm:text-base">
          <span className="text-white font-semibold">PhishBlock</span> — a community initiative to
          fight phishing using blockchain.
        </p>
        <p className="mb-1 text-sm sm:text-base">
          Built by{" "}
          <a
            href="https://github.com/tung-programming"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            @tung-programming
          </a>
        </p>
        <p className="text-sm sm:text-base">
          Contact:{" "}
          <a href="mailto:tusharpradeep24@gmail.com" className="text-indigo-400 hover:underline">
            tusharpradeep24@gmail.com
          </a>
        </p>
      </footer>
    </div>
  );
}
