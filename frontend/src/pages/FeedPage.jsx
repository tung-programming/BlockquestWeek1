// src/pages/FeedPage.jsx
import React, { useState } from "react";
import Navbar from "../components/Feed/Navbar";
import Sidebar from "../components/Feed/Sidebar";
import RightPanel from "../components/Feed/RightPanel";
import PostCard from "../components/Feed/PostCard";

export default function FeedPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-b from-[#0a0a0a] via-[#0f1020] to-[#07070a] text-white overflow-hidden">
      {/* Navbar stays fixed */}
      <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <div className="hidden md:flex md:w-64 md:flex-shrink-0 border-r border-gray-800">
          <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>

        {/* MAIN FEED */}
        <main className="flex-1 h-full overflow-y-auto px-4 sm:px-6 py-8 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          <div className="max-w-3xl mx-auto space-y-6">
            <PostCard />
            <PostCard />
            <PostCard />
            {/* Later: Map Firestore posts */}
          </div>
        </main>

        {/* RIGHT PANEL */}
        <div className="hidden lg:block lg:w-80 xl:w-96 border-l border-gray-800">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            <RightPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
