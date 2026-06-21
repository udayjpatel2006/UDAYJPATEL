import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function LeafBackground() {
  const cursorX = useMotionValue(-1000);
  const cursorY = useMotionValue(-1000);

  // Use framer-motion springs instead of React state for 60fps zero-lag performance
  const springConfig = { damping: 30, stiffness: 300, mass: 0.5 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      cursorX.set(e.clientX - 400); // offset by half the orb size to center it
      cursorY.set(e.clientY - 400);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [cursorX, cursorY]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-transparent">
      
      {/* Dynamic Cursor Glow - Higher visibility, smooth following */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          x: smoothX,
          y: smoothY,
          background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 60%)",
        }}
      />

      {/* 1. Ambient Color Spots (Slow drifting blurred orbs) */}
      
      {/* Dim Slate Orb (Top Right) */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-slate-500/5 blur-[150px]"
      />

      {/* Dim Neutral Orb (Bottom Left) */}
      <motion.div
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.85, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full bg-neutral-600/5 blur-[160px]"
      />

      {/* Dim Zinc Orb (Middle Right) */}
      <motion.div
        animate={{
          x: [0, 30, -30, 0],
          y: [0, 60, -20, 0],
          scale: [0.9, 1.1, 0.95, 0.9],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/3 -right-20 w-[450px] h-[450px] rounded-full bg-zinc-500/5 blur-[130px]"
      />
    </div>
  );
}
