import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [cursorType, setCursorType] = useState('default');
  const [cursorText, setCursorText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  // Mouse coordinates tracking
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth spring physics configuration for lag effect
  const springConfig = { damping: 30, stiffness: 180, mass: 0.8 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

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

    // Hide normal cursor when custom cursor is active
    document.documentElement.classList.add('custom-cursor-active');

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeaveWindow);
      document.removeEventListener('mouseenter', handleMouseEnterWindow);
      document.documentElement.classList.remove('custom-cursor-active');
    };
  }, [isMobile, isVisible, mouseX, mouseY]);

  if (isMobile || !isVisible) return null;

  // Variants for cursor sizing and blend modes
  const cursorVariants = {
    default: {
      width: 60,
      height: 60,
      opacity: 0.9,
    },
    pointer: {
      width: 90,
      height: 90,
      opacity: 1,
    },
    view: {
      width: 140,
      height: 140,
      opacity: 1,
    },
    text: {
      width: 140,
      height: 140,
      opacity: 1,
    }
  };

  const isViewOrText = cursorType === 'view' || cursorType === 'text';

  return (
    <>
      {/* Outer Spring Cursor Ring */}
      <motion.div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          translateX: cursorX,
          translateY: cursorY,
          x: '-50%',
          y: '-50%',
          pointerEvents: 'none',
          zIndex: 9999,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mixBlendMode: 'normal',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.1) 40%, rgba(255, 255, 255, 0) 70%)',
          boxShadow: '0 0 35px 8px rgba(255, 255, 255, 0.22), inset 0 0 15px 3px rgba(255, 255, 255, 0.18)',
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

      {/* Tiny inner dot following exactly with no lag */}
      <motion.div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          x: mouseX,
          y: mouseY,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 10000,
          width: 6,
          height: 6,
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          mixBlendMode: 'normal',
          boxShadow: '0 0 8px 2px rgba(255, 255, 255, 0.6)',
        }}
        animate={{
          scale: cursorType !== 'default' ? 0 : 1,
        }}
        transition={{ duration: 0.2 }}
      />
    </>
  );
}
