import React, { useEffect, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';

export default function CustomCursor() {
  const [cursorType, setCursorType] = useState('default');
  const [cursorText, setCursorText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  // Mouse coordinates tracking
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  useEffect(() => {
    // Check if it's a touch device or small screen
    const checkDevice = () => {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const isSmallScreen = window.innerWidth < 1024;
      setIsMobile(isTouch || isSmallScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    if (isMobile) return;

    // Show cursor on first mouse move
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    // Global listener to update cursor type based on hovered elements
    const handleMouseOver = (e) => {
      const target = e.target.closest('[data-cursor], a, button, img');
      if (target) {
        const type = target.getAttribute('data-cursor') || 'pointer';
        const text = target.getAttribute('data-cursor-text') || '';
        setCursorType(type);
        setCursorText(text);
      } else {
        setCursorType('default');
        setCursorText('');
      }
    };

    const handleMouseLeaveWindow = () => setIsVisible(false);
    const handleMouseEnterWindow = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeaveWindow);
    document.addEventListener('mouseenter', handleMouseEnterWindow);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeaveWindow);
      document.removeEventListener('mouseenter', handleMouseEnterWindow);
    };
  }, [isMobile, isVisible, mouseX, mouseY]);

  if (isMobile || !isVisible) return null;

  // Variants for cursor sizing and blend modes
  const cursorVariants = {
    default: {
      width: 160,
      height: 160,
      opacity: 0.9,
    },
    pointer: {
      width: 260,
      height: 260,
      opacity: 1,
    },
    view: {
      width: 320,
      height: 320,
      opacity: 1,
    },
    text: {
      width: 320,
      height: 320,
      opacity: 1,
    }
  };

  const isViewOrText = cursorType === 'view' || cursorType === 'text';

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        translateX: mouseX,
        translateY: mouseY,
        x: '-50%',
        y: '-50%',
        pointerEvents: 'none',
        zIndex: 9999,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mixBlendMode: 'normal',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 80%)',
      }}
      animate={cursorType}
      variants={cursorVariants}
      transition={{ type: 'spring', stiffness: 220, damping: 28, mass: 0.7 }}
    >
      {isViewOrText && (
        <motion.span
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-[10px] font-display font-semibold tracking-[0.2em] text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        >
          {cursorText || 'VIEW'}
        </motion.span>
      )}
    </motion.div>
  );
}
