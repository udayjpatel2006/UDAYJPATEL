import React from 'react';
import { Camera } from 'lucide-react';

/**
 * Reusable Watermark Component to overlay name/logo on portfolio images.
 * Note: Designed to deter casual copying; cannot prevent direct screenshot captures.
 */
export default function Watermark({ 
  text = "UDAYJPATEL", 
  position = "bottom-right", // Options: top-left, top-right, bottom-left, bottom-right, center
  opacity = 0.25,
  size = "text-[10px]"
}) {
  const positionStyles = {
    'top-left': { top: '16px', left: '16px', bottom: 'auto', right: 'auto', transform: 'none' },
    'top-right': { top: '16px', right: '16px', bottom: 'auto', left: 'auto', transform: 'none' },
    'bottom-left': { bottom: '16px', left: '16px', top: 'auto', right: 'auto', transform: 'none' },
    'bottom-right': { bottom: '16px', right: '16px', top: 'auto', left: 'auto', transform: 'none' },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bottom: 'auto', right: 'auto' }
  };

  return (
    <div 
      className={`absolute z-20 pointer-events-none select-none font-display ${size} font-bold tracking-[0.25em] text-white uppercase flex items-center gap-1.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]`}
      style={{ opacity, ...(positionStyles[position] || positionStyles['bottom-right']) }}
    >
      <Camera className="w-3 h-3" />
      <span>{text}</span>
    </div>
  );
}
