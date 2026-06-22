import React, { useRef, useState, useEffect } from 'react';

/**
 * Reusable MagneticWrapper component to pull child elements slightly towards the cursor on hover.
 * Automatically disabled on mobile/touch viewports for performance.
 */
export default function MagneticWrapper({ children, range = 50, strength = 0.3 }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(true);

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

    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.hypot(distanceX, distanceY);

      if (distance < range) {
        // Interpolate position relative to distance
        setPosition({
          x: distanceX * strength,
          y: distanceY * strength
        });
      } else {
        setPosition({ x: 0, y: 0 });
      }
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isMobile, range, strength]);

  if (isMobile) return children;

  const { x, y } = position;
  const child = React.Children.only(children);

  return React.cloneElement(child, {
    ref,
    style: {
      ...child.props.style,
      transform: `translate3d(${x}px, ${y}px, 0)`,
      transition: x === 0 && y === 0 ? 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
      willChange: 'transform'
    },
    'data-cursor': 'magnetic'
  });
}
