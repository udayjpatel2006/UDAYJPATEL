import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, MapPin, Compass, Eye } from 'lucide-react';
import Watermark from './Watermark';

export default function Lightbox({ photo, onClose, onPrev, onNext, artistName = "UDAYJPATEL" }) {
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = 0;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distanceX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distanceX > minSwipeDistance) {
      onNext();
    } else if (distanceX < -minSwipeDistance) {
      onPrev();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  useEffect(() => {
    // Prevent background scrolling while open
    document.body.style.overflow = 'hidden';
    
    // Keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onPrev, onNext]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm md:backdrop-blur-md"
        style={{ willChange: 'opacity' }}
        data-cursor="pointer"
      />

      {/* Close button top right */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: 0.2 }}
        onClick={onClose}
        className="absolute top-6 right-6 z-55 w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:border-white/30 flex items-center justify-center text-white/70 hover:text-white transition-colors duration-300"
        aria-label="Close lightbox"
        data-cursor="pointer"
      >
        <X className="w-5 h-5" />
      </motion.button>

      {/* Navigation - Left Arrow */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ delay: 0.2 }}
        onClick={onPrev}
        className="absolute left-6 z-55 w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:border-white/30 hidden md:flex items-center justify-center text-white/70 hover:text-white transition-colors duration-300"
        aria-label="Previous photo"
        data-cursor="pointer"
      >
        <ArrowLeft className="w-5 h-5" />
      </motion.button>

      {/* Navigation - Right Arrow */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ delay: 0.2 }}
        onClick={onNext}
        className="absolute right-6 z-55 w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:border-white/30 hidden md:flex items-center justify-center text-white/70 hover:text-white transition-colors duration-300"
        aria-label="Next photo"
        data-cursor="pointer"
      >
        <ArrowRight className="w-5 h-5" />
      </motion.button>

      {/* Core Container */}
      <div className="relative z-54 w-full max-w-5xl px-4 md:px-6 flex flex-col items-center justify-center h-full max-h-[90vh] md:max-h-[85vh]">
        
        {/* Animated Card Container */}
        <motion.div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ willChange: 'transform, opacity' }}
          className="relative w-full overflow-y-auto md:overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 flex flex-col md:flex-row shadow-2xl max-h-[85vh] md:max-h-none"
        >
          {/* Left Side: Photo Frame with watermark and overlay protection */}
          <div className="relative flex-1 bg-neutral-950 flex items-center justify-center h-[50vh] md:h-[65vh] overflow-hidden select-none">
            <div className="relative inline-block max-h-full max-w-full">
              <img
                src={photo.url}
                alt={photo.title}
                className="max-h-[50vh] md:max-h-[65vh] max-w-full object-contain block filter contrast-[1.05] pointer-events-none select-none"
              />
              {/* Transparent protection overlay */}
              <div className="absolute inset-0 z-10 bg-transparent pointer-events-auto" />
              
              {/* Bottom-right soft watermark overlay */}
              <Watermark text={artistName} position="bottom-right" opacity={0.25} size="text-xs" />
            </div>
          </div>

          {/* Right Side: Editorial Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: 0.05, duration: 0.25 }}
            style={{ willChange: 'transform, opacity' }}
            className="w-full md:w-80 p-5 md:p-8 flex flex-col justify-between bg-neutral-950 border-t md:border-t-0 md:border-l border-white/10"
          >
            {/* Upper details */}
            <div className="space-y-4 md:space-y-6">
              <div>
                <span className="text-[10px] font-semibold tracking-[0.25em] text-[#8c8c8c] uppercase block mb-1 md:mb-2">
                  {photo.category}
                </span>
                <h3 className="font-display text-lg md:text-2xl font-bold tracking-tight text-white leading-tight">
                  {photo.title}
                </h3>
              </div>

              <div className="space-y-2 md:space-y-3 pt-3 md:pt-4 border-t border-white/5">
                <div className="flex items-center space-x-3 text-xs text-[#8c8c8c]">
                  <MapPin className="w-4 h-4 text-white/40" />
                  <span>{photo.location}</span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-[#8c8c8c]">
                  <Compass className="w-4 h-4 text-white/40" />
                  <span>Original Print Available</span>
                </div>
              </div>
            </div>

            {/* Lower Details - Camera Settings */}
            <div className="mt-4 md:mt-8 pt-4 md:pt-6 border-t border-white/5 space-y-3 md:space-y-4">
              <div>
                <span className="text-[9px] font-semibold tracking-widest text-[#8c8c8c] uppercase block mb-1">EXIF DATA</span>
                <span className="text-xs font-mono text-white/80">{photo.settings}</span>
              </div>


            </div>

          </motion.div>
        </motion.div>

        {/* Mobile Swipe / Click Navigation Guide */}
        <div className="mt-4 flex md:hidden items-center justify-between w-full max-w-sm px-4">
          <button 
            onClick={onPrev}
            className="text-xs uppercase tracking-widest text-white/50 hover:text-white py-2 px-4"
            data-cursor="pointer"
          >
            ← Prev
          </button>
          <span className="text-xs font-mono text-white/30">SWIPE OR USE ARROWS</span>
          <button 
            onClick={onNext}
            className="text-xs uppercase tracking-widest text-white/50 hover:text-white py-2 px-4"
            data-cursor="pointer"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
