import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHome,
  FaPlus,
  FaUser,
  FaShieldAlt,
  FaLock,
  FaGlobe,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Sidebar({ open = false, onClose = () => {}, onCreate }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 🧭 Sidebar Items — refined list
  const items = [
    { icon: FaHome, label: "Home", to: "/feed" },
    { icon: FaPlus, label: "Create Post", to: "/post/create" },
    { icon: FaUser, label: "Profile", to: () => `/profile/${user?.uid}` },
    { icon: FaShieldAlt, label: "Anchors", to: "/anchors" },
  ];

  const content = (
    <div className="w-64 h-full flex flex-col py-6 px-4">
      {/* LOGO + HEADER */}
      <div className="mb-6 px-2">
        <div className="text-white font-bold text-lg">PhishBlock</div>
        <div className="text-xs text-gray-400 mt-1">
          Community verification
        </div>
      </div>

      {/* MAIN NAVIGATION */}
      <nav className="flex-1 space-y-1">
        {items.map((it, idx) => {
          const Icon = it.icon;
          const to = typeof it.to === "function" ? it.to() : it.to;
          return (
            <button
              key={idx}
              onClick={() => {
                if (it.label === "Create Post") {
                  if (typeof onCreate === "function") onCreate();
                } else {
                  navigate(to);
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-md hover:bg-[#0f1118]/50 transition"
            >
              <Icon className="text-lg text-indigo-400" />
              <span className="text-gray-200">{it.label}</span>
            </button>
          );
        })}
      </nav>

      {/* TOPICS SECTION */}
      <div className="mt-6 px-3">
        <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">
          Topics
        </div>
        <div className="space-y-2">
          <button
            onClick={() => navigate("/domains")}
            className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-md hover:bg-[#0f1118]/50 transition text-gray-200"
          >
            <FaGlobe className="text-indigo-400" /> Domains
          </button>

          <button
            onClick={() => navigate("/tools")}
            className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-md hover:bg-[#0f1118]/50 transition text-gray-200"
          >
            <FaLock className="text-indigo-400" /> Security Tools
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-8 px-3 text-xs text-gray-400 border-t border-gray-800 pt-4">
        <div className="text-gray-400 text-sm">Built by</div>
        <a
          className="text-indigo-400 hover:underline font-medium mt-1 inline-block"
          href="https://github.com/tung-programming"
          target="_blank"
          rel="noreferrer"
        >
          tung-programming
        </a>
        <div className="text-[10px] text-gray-600 mt-2">with ❤️ for open web</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <div className="hidden md:block md:w-64 md:flex-shrink-0">
        <div className="h-full sticky top-16 bg-[#07070a]/60 backdrop-blur-sm border-r border-gray-800">
          {content}
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-[#07070a]/95 backdrop-blur-sm border-r border-gray-800 md:hidden"
            >
              <div className="h-full overflow-y-auto">{content}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
