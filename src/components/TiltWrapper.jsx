import React, { useRef, useState, useEffect } from 'react';

/**
 * Reusable TiltWrapper component to add 3D tilt and depth/parallax displacement to images.
 * Automatically disabled on mobile/touch viewports for performance.
 */
export default function TiltWrapper({ children, maxRotation = 8, maxParallax = 10 }) {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(true);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, translateImgX: 0, translateImgY: 0 });

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

  const handleMouseMove = (e) => {
    if (isMobile || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Mouse coordinates relative to target element boundaries
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Center mapping normalized from -0.5 to 0.5
    const normalizedX = (mouseX / width) - 0.5;
    const normalizedY = (mouseY / height) - 0.5;

    // Map to angles
    const rotX = -normalizedY * maxRotation;
    const rotY = normalizedX * maxRotation;

    // Map to opposite offset direction for parallax effect
    const transX = -normalizedX * maxParallax;
    const transY = -normalizedY * maxParallax;

    setTilt({
      rotateX: rotX,
      rotateY: rotY,
      translateImgX: transX,
      translateImgY: transY
    });
  };

  const handleMouseLeave = () => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      translateImgX: 0,
      translateImgY: 0
    });
  };

  if (isMobile) return children;

  const { rotateX, rotateY, translateImgX, translateImgY } = tilt;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="perspective-1000 preserve-3d w-full h-full"
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: rotateX === 0 && rotateY === 0 ? 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        willChange: 'transform'
      }}
    >
      <div 
        className="w-full h-full preserve-3d"
        style={{
          transform: `translate3d(${translateImgX}px, ${translateImgY}px, 0)`,
          transition: translateImgX === 0 && translateImgY === 0 ? 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          willChange: 'transform'
        }}
      >
        {children}
      </div>
    </div>
  );
}
