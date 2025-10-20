// src/pages/FeedPage.jsx
import React, { useState } from "react";
import Navbar from "../components/Feed/Navbar";
import Sidebar from "../components/Feed/Sidebar";
import RightPanel from "../components/Feed/RightPanel"; // optional (we'll add next)
import PostCard from "../components/Feed/PostCard";

export default function FeedPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f1020] to-[#07070a] text-white">
      <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Post form and posts list */}
          <div className="space-y-6">
            {/* Insert PostForm component here when ready */}
            <PostCard />
            {/* map posts -> <PostCard /> */}
          </div>
        </main>
        {/* RightPanel will be visible on md+ */}
        <div className="hidden lg:block lg:w-80 xl:w-96">
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
