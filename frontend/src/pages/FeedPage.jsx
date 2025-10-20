import React, { useState } from "react";
import Navbar from "../components/Feed/Navbar";
import Sidebar from "../components/Feed/Sidebar";
import RightPanel from "../components/Feed/RightPanel";
import PostCard from "../components/Feed/PostCard";
import PostForm from "../components/Feed/PostForm";

export default function FeedPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-b from-[#0a0a0a] via-[#0f1020] to-[#07070a] text-white overflow-hidden">
      {/* Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(true)}
        onCreate={() => setShowPostForm(true)}  // pass callback to open modal
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-shrink-0 border-r border-gray-800">
          <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            <Sidebar
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              onCreate={() => setShowPostForm(true)} // also from sidebar
            />
          </div>
        </div>

        {/* Main Feed */}
        <main className="flex-1 h-full overflow-y-auto px-4 sm:px-6 py-8 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          <div className="max-w-3xl mx-auto space-y-6">
            <PostCard />
          </div>
        </main>

        {/* Right Panel */}
        <div className="hidden lg:block lg:w-80 xl:w-96 border-l border-gray-800">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            <RightPanel />
          </div>
        </div>
      </div>

      {/* PostForm Modal */}
      <PostForm open={showPostForm} onClose={() => setShowPostForm(false)} />
    </div>
  );
}
