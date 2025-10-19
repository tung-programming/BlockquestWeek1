import React from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  const handleExplore = () => navigate("/signup");
  const handleKnowMore = () => {
    const section = document.getElementById("features");
    section?.scrollIntoView({ behavior: "smooth" });
  };
  
  return (
    
    <div className="bg-[#0d0d0d] text-white min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold tracking-wide">PhishBlock</h1>
        <ul className="flex space-x-8 text-gray-300">
          <li className="hover:text-white cursor-pointer">Home</li>
          <li className="hover:text-white cursor-pointer" onClick={handleKnowMore}>
            Features
          </li>
          <li className="hover:text-white cursor-pointer">
            <a href="#about">About</a>
          </li>
        </ul>
        <div className="space-x-4">
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-grow text-center py-20">
        <h2 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
          Spot. Report. Block. <br /> <span className="text-indigo-500">Together.</span>
        </h2>
        <p className="max-w-2xl text-gray-400 mb-8">
          Join the community-powered platform that detects and verifies phishing threats through
          collective intelligence — where every upvote secures the web.
        </p>
        <div className="space-x-4">
          <button
            onClick={handleExplore}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition"
          >
            Explore
          </button>
          <button
            onClick={handleKnowMore}
            className="px-8 py-3 border border-gray-700 hover:bg-gray-800 rounded-lg font-semibold transition"
          >
            Know More
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-10 bg-[#111111] border-t border-gray-800">
        <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              title: "Community Verification",
              desc: "Posts are upvoted and verified by real users before being anchored on-chain.",
            },
            {
              title: "Blockchain Anchoring",
              desc: "Once a report hits 10+ upvotes, it’s stored immutably on the blockchain.",
            },
            {
              title: "User Profiles & Badges",
              desc: "Earn recognition for accurate reports with unique badge milestones.",
            },
            {
              title: "Real-Time Feed",
              desc: "Stay updated with trending phishing reports as soon as they’re posted.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-2xl hover:shadow-lg hover:shadow-indigo-600/10 transition"
            >
              <h4 className="text-xl font-semibold mb-3">{f.title}</h4>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / About */}
      <footer
        id="about"
        className="bg-[#0b0b0b] border-t border-gray-800 text-gray-400 text-center py-8"
      >
        <p className="mb-2">
          <span className="text-white font-semibold">PhishBlock</span> — a community initiative to
          fight phishing using blockchain.
        </p>
        <p className="mb-1">
          Built by{" "}
          <a
            href="https://github.com/tushar-programming"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline"
          >
            @tushar-programming
          </a>
        </p>
        <p>
          Contact:{" "}
          <a
            href="mailto:tushar@example.com"
            className="text-indigo-500 hover:underline"
          >
            tushar@example.com
          </a>
        </p>
      </footer>
    </div>
  );
}
