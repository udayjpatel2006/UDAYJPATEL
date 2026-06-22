import React from 'react';
import { motion } from 'framer-motion';

export default function CinematicTextReveal({ text = "", className = "" }) {
  if (!text) return null;
  const words = text.split(" ");
  
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.04,
      }
    }
  };
  
  const wordVariants = {
    hidden: { 
      opacity: 0, 
      y: "100%",
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1], // easeOutExpo
      }
    }
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: "-100px" }}
      className={`inline-flex flex-wrap ${className}`}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em] py-0.5">
          <motion.span variants={wordVariants} className="inline-block origin-bottom">
            {word}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
