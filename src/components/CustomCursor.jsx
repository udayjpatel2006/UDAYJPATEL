import React, { useEffect, useRef, useState } from 'react';

/**
 * Premium custom cursor system with inner dot, smooth lerped follow ring,
 * magnetic snapping behaviors, canvas particle trail, and mix-blend color inversion.
 * Automatically disabled on mobile/touch viewports for performance.
 */
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [isMobile, setIsMobile] = useState(true);
  const [cursorText, setCursorText] = useState('');

  // Refs for animation values to keep updates outside react state
  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100, w: 20, h: 20, r: 10 });
  const targetRing = useRef({ x: -100, y: -100, w: 20, h: 20, r: 10, isMagnetic: false });
  const particles = useRef([]);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const checkDevice = () => {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const isSmallScreen = window.innerWidth < 1024;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isTouch || isSmallScreen || isMobileUA);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      // Spawn trail particles based on mouse movement speed/distance
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4 && particles.current.length < 50) {
        const count = Math.min(2, Math.floor(dist / 10) + 1);
        for (let i = 0; i < count; i++) {
          particles.current.push({
            x: e.clientX + (Math.random() - 0.5) * 6,
            y: e.clientY + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            size: Math.random() * 1.5 + 0.8,
            alpha: 0.6,
            decay: Math.random() * 0.02 + 0.015
          });
        }
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    };

    // Target tracking for size transformations and magnetic snapping
    const handleMouseOver = (e) => {
      const target = e.target.closest('[data-cursor], a, button, input, textarea, select');
      if (target) {
        const type = target.getAttribute('data-cursor') || 'pointer';
        const text = target.getAttribute('data-cursor-text') || '';
        
        if (type === 'magnetic') {
          const rect = target.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          
          targetRing.current.x = cx;
          targetRing.current.y = cy;
          targetRing.current.w = rect.width + 12;
          targetRing.current.h = rect.height + 12;
          
          const style = window.getComputedStyle(target);
          const br = parseFloat(style.borderRadius) || 8;
          targetRing.current.r = br + 4;
          targetRing.current.isMagnetic = true;
          setCursorText('');
        } else if (type === 'view' || type === 'text') {
          targetRing.current.w = 70;
          targetRing.current.h = 70;
          targetRing.current.r = 35;
          targetRing.current.isMagnetic = false;
          setCursorText(text || (type === 'view' ? 'VIEW' : ''));
        } else { // default pointer
          targetRing.current.w = 34;
          targetRing.current.h = 34;
          targetRing.current.r = 17;
          targetRing.current.isMagnetic = false;
          setCursorText('');
        }
      } else {
        // Reset to default sizing
        targetRing.current.w = 20;
        targetRing.current.h = 20;
        targetRing.current.r = 10;
        targetRing.current.isMagnetic = false;
        setCursorText('');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    let animId;
    const update = () => {
      // 1. Move Inner Dot instantly (offset by half size = 2px)
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouse.current.x - 2}px, ${mouse.current.y - 2}px, 0)`;
      }

      // 2. Lerp Outer Ring position & dimensions
      let rx = mouse.current.x;
      let ry = mouse.current.y;
      
      if (targetRing.current.isMagnetic) {
        rx = targetRing.current.x;
        ry = targetRing.current.y;
      }

      // Smooth lag interpolation
      ring.current.x += (rx - ring.current.x) * 0.16;
      ring.current.y += (ry - ring.current.y) * 0.16;
      ring.current.w += (targetRing.current.w - ring.current.w) * 0.16;
      ring.current.h += (targetRing.current.h - ring.current.h) * 0.16;
      ring.current.r += (targetRing.current.r - ring.current.r) * 0.16;

      if (ringRef.current) {
        const tx = ring.current.x - ring.current.w / 2;
        const ty = ring.current.y - ring.current.h / 2;
        ringRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        ringRef.current.style.width = `${ring.current.w}px`;
        ringRef.current.style.height = `${ring.current.h}px`;
        ringRef.current.style.borderRadius = `${ring.current.r}px`;
      }

      // 3. Draw trail particles
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(animId);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9998,
          mixBlendMode: 'difference'
        }}
      />
      
      {/* Inner Dot */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          pointerEvents: 'none',
          zIndex: 10000,
          mixBlendMode: 'difference',
          transform: 'translate3d(-100px, -100px, 0)',
          willChange: 'transform'
        }}
      />
      
      {/* Outer follow ring */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: '1.2px solid #ffffff',
          pointerEvents: 'none',
          zIndex: 9999,
          mixBlendMode: 'difference',
          transform: 'translate3d(-100px, -100px, 0)',
          willChange: 'transform, width, height, border-radius',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {cursorText && (
          <span
            style={{
              fontSize: '8px',
              fontFamily: 'var(--font-display, Syne, sans-serif)',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#ffffff',
              transform: 'scale(0.85)',
              willChange: 'transform'
            }}
          >
            {cursorText}
          </span>
        )}
      </div>
    </>
  );
}
