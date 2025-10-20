import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { useEffect } from "react";
export default function ImageModal({ imageURL, onClose }) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
        }, [onClose]);
  return (
    <AnimatePresence>
      {imageURL && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 40 }}
            transition={{ duration: 0.25 }}
            className="relative max-w-4xl w-[90%] max-h-[85vh] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.3)]"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 text-gray-300 hover:text-white bg-black/40 p-2 rounded-full transition"
            >
              <FaTimes size={18} />
            </button>

            <img
              src={imageURL}
              alt="Full"
              className="w-full h-full object-contain bg-black"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
