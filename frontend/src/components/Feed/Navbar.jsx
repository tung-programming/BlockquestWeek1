import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineMenu } from "react-icons/hi";
import { FiSearch } from "react-icons/fi";
import { IoNotificationsOutline } from "react-icons/io5";
import {useAuth} from "../../hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebase";

/**
 * Navbar:
 * - left: hamburger (toggles sidebar), brand
 * - center: search input (desktop)
 * - right: notifications, profile avatar (dropdown)
 *
 * Props:
 * - onToggleSidebar: function to open the left drawer on mobile
 */
export default function Navbar({ onToggleSidebar, onCreate }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth(); // expects { user } or null

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/"); // return to landing or login
    } catch (err) {
      console.error(err);
      alert("Logout failed");
    }
  };

  return (
    <header className="w-full sticky top-0 z-40 bg-[#060608]/60 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: hamburger + brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md md:hidden hover:bg-[#0f1118]/50 transition"
              aria-label="Open sidebar"
            >
              <HiOutlineMenu className="text-xl text-gray-200" />
            </button>
            <div
              onClick={() => navigate("/feed")}
              className="cursor-pointer text-white font-semibold text-lg"
            >
              PhishBlock
            </div>
          </div>

          {/* Center: search (hidden on small screens) */}
          <div className="hidden md:flex items-center flex-1 justify-center px-6">
            <div className="w-full max-w-xl">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reports, domains, users..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-[#0b0b0d]/70 border border-gray-800 placeholder:text-gray-500 text-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onCreate}
              className="hidden md:inline-block px-3 py-1 rounded-md bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-medium hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition"
            >
              Create
            </button>

            <button className="p-2 rounded-md hover:bg-[#0f1118]/50 transition" title="Notifications">
              <IoNotificationsOutline className="text-xl text-gray-200" />
            </button>

            {/* Profile avatar */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="flex items-center gap-2 rounded-full py-1 px-2 hover:bg-[#0f1118]/60 transition"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                  {user?.displayName ? user.displayName[0].toUpperCase() : "U"}
                </div>
                <div className="hidden md:block text-sm text-gray-200">
                  {user?.displayName || "User"}
                </div>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-2 w-48 bg-[#0b0b0d]/90 border border-gray-800 rounded-md shadow-lg py-2"
                  >
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate(`/profile/${user?.uid}`);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#101018]"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/settings");
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#101018]"
                    >
                      Settings
                    </button>
                    <div className="border-t border-gray-800 my-1" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-red-400 hover:bg-[#101018]"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
