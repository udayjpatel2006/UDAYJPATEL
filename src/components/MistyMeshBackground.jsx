import React from 'react';
import { motion } from 'framer-motion';

export default function MistyMeshBackground() {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden bg-[#fcfaf7] pointer-events-none">
      {/* Subtle Blue Orb - Top Left Area */}
      <motion.div
        animate={{
          x: [-40, 40, -20, -40],
          y: [-60, 20, -30, -60],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-[20%] -left-[20%] w-[80vw] h-[80vw] rounded-full bg-[#dce8f2] blur-[120px] opacity-[0.85] mix-blend-multiply"
      />

      {/* Muted Sage Green Orb - Bottom Right Area */}
      <motion.div
        animate={{
          x: [50, -40, 20, 50],
          y: [40, -40, 10, 40],
          scale: [0.95, 1.12, 0.88, 0.95],
        }}
        transition={{
          duration: 38,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -bottom-[20%] -right-[20%] w-[90vw] h-[90vw] rounded-full bg-[#d0e0d4] blur-[150px] opacity-[0.9] mix-blend-multiply"
      />

      {/* Soft Sand Creme Orb - Center Left */}
      <motion.div
        animate={{
          x: [-30, 50, -10, -30],
          y: [40, -30, 50, 40],
          scale: [1.1, 0.88, 1.15, 1.1],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[20%] -left-[30%] w-[75vw] h-[75vw] rounded-full bg-[#ebdcd0] blur-[130px] opacity-[0.75] mix-blend-multiply"
      />

      {/* Auxiliary Misty Blue-Green Orb - Top Right */}
      <motion.div
        animate={{
          x: [20, -30, 40, 20],
          y: [-30, 40, -20, -30],
          scale: [0.9, 1.05, 0.95, 0.9],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-[10%] -right-[15%] w-[65vw] h-[65vw] rounded-full bg-[#e3ebf2] blur-[110px] opacity-[0.8] mix-blend-multiply"
      />

      {/* Subtle organic noise texture overlay for tactile, high-end feel */}
      <div 
        className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none mix-blend-overlay" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
