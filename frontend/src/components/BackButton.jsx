import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function BackButton({ label = "Back" }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-200 bg-[#101020]/80 border border-indigo-700/40 rounded-lg hover:bg-indigo-600/20 hover:text-white transition-all duration-300"
    >
      <FaArrowLeft className="text-indigo-400" /> {label}
    </button>
  );
}
