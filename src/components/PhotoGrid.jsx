import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CinematicTextReveal from './CinematicTextReveal';
import Watermark from './Watermark';

// Curated high-end travel and adventure photography dataset
const PHOTO_DATA = [
  {
    id: 1,
    title: "Alpenglow Peaks",
    category: "Landscapes",
    location: "Dolomites, Italy",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop",
    sizeClass: "md:col-span-2 md:row-span-1",
    settings: "28mm • f/4.0 • 1/200s • ISO 100",
    isHighlight: 1,
  },
  {
    id: 2,
    title: "Amalfi Golden Hour",
    category: "Sunsets",
    location: "Positano, Italy",
    url: "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop",
    sizeClass: "md:col-span-1 md:row-span-2",
    settings: "35mm • f/2.0 • 1/400s • ISO 100",
    isHighlight: 1,
  },
  {
    id: 3,
    title: "The Nomad's Gaze",
    category: "Portraits",
    location: "Sahara, Morocco",
    url: "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1200&auto=format&fit=crop",
    sizeClass: "md:col-span-1 md:row-span-1",
    settings: "85mm • f/1.4 • 1/1250s • ISO 100",
    isHighlight: 1,
  },
  {
    id: 4,
    title: "Vicolo de' Fiori",
    category: "Streets",
    location: "Rome, Italy",
    url: "https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?q=80&w=1200&auto=format&fit=crop",
    sizeClass: "md:col-span-2 md:row-span-2",
    settings: "50mm • f/1.8 • 1/320s • ISO 200",
    isHighlight: 0,
  },
  {
    id: 5,
    title: "Cappadocia Sunrise",
    category: "Sunsets",
    location: "Anatolia, Turkey",
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200&auto=format&fit=crop",
    sizeClass: "md:col-span-1 md:row-span-1",
    settings: "24mm • f/2.8 • 1/500s • ISO 100",
    isHighlight: 0,
  },
  {
    id: 6,
    title: "Neon Trails",
    category: "Streets",
    location: "Shinjuku, Japan",
    url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop",
    sizeClass: "md:col-span-1 md:row-span-1",
    settings: "35mm • f/2.8 • 1/30s • ISO 1600",
    isHighlight: 0,
  },
  {
    id: 7,
    title: "Monk in Reflection",
    category: "Portraits",
    location: "Leh Ladakh, India",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop",
    sizeClass: "md:col-span-1 md:row-span-2",
    settings: "50mm • f/1.8 • 1/250s • ISO 400",
    isHighlight: 0,
  },
  {
    id: 8,
    title: "Nordic Fjords",
    category: "Landscapes",
    location: "Lofoten, Norway",
    url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop",
    sizeClass: "md:col-span-2 md:row-span-1",
    settings: "16mm • f/8.0 • 1/160s • ISO 100",
    isHighlight: 0,
  },
];

export default function PhotoGrid({ onPhotoClick, photoList = PHOTO_DATA, profileData = {}, subsections = [] }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return true;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const isSmallScreen = window.innerWidth < 1024;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isTouch || isSmallScreen || isMobileUA;
  });

  useEffect(() => {
    const checkMobile = () => {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const isSmallScreen = window.innerWidth < 1024;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isTouch || isSmallScreen || isMobileUA);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const highlights = useMemo(() => {
    return photoList
      .filter(photo => photo.isHighlight > 0)
      .sort((a, b) => a.isHighlight - b.isHighlight);
  }, [photoList]);

  const categories = useMemo(() => {
    return ["All", ...subsections];
  }, [subsections]);

  const filteredPhotos = useMemo(() => {
    if (activeCategory === "All") {
      return photoList;
    }
    return photoList
      .filter(photo => photo.category === activeCategory)
      .sort((a, b) => {
        const posA = a.position || 999;
        const posB = b.position || 999;
        if (posA !== posB) return posA - posB;
        return a.id - b.id;
      });
  }, [photoList, activeCategory]);

  const getCardAspectRatioClass = (sizeClass = '') => {
    if (sizeClass.includes('aspect-')) {
      const match = sizeClass.match(/aspect-\[[^\]]+\]/);
      return match ? match[0] : 'aspect-square';
    }
    if (sizeClass.includes('col-span-2') && sizeClass.includes('row-span-2')) {
      return 'aspect-square';
    }
    if (sizeClass.includes('col-span-2')) {
      return 'aspect-[2/1]';
    }
    if (sizeClass.includes('row-span-2')) {
      return 'aspect-[3/4]';
    }
    return 'aspect-square';
  };

  const getCardClasses = (sizeClass = '') => {
    if (sizeClass.includes('aspect-')) {
      return `${sizeClass} w-full`;
    }
    if (sizeClass.includes('col-span-2') && sizeClass.includes('row-span-2')) {
      return 'md:col-span-2 aspect-square w-full h-auto';
    }
    if (sizeClass.includes('col-span-2')) {
      return 'md:col-span-2 aspect-[2/1] w-full h-auto';
    }
    if (sizeClass.includes('row-span-2')) {
      return 'md:col-span-1 aspect-[3/4] w-full h-auto';
    }
    return 'md:col-span-1 aspect-square w-full h-auto';
  };

  return (
    <section id="gallery" className="w-full max-w-7xl mx-auto px-6 py-12">
      {/* Highlights Showcase */}
      {highlights.length > 0 && (
        <div className="mb-20">
          <div className="flex flex-col mb-8">
            <h3 className="font-display text-2xl font-bold tracking-tight text-white uppercase">
              <CinematicTextReveal text={profileData.highlightsTitle || "Featured Highlights"} />
            </h3>
          </div>
          
          <div className="columns-1 sm:columns-2 md:columns-3 gap-6">
            {highlights.map((photo) => (
              <motion.div
                key={`highlight-${photo.id}`}
                onClick={() => onPhotoClick(photo)}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`relative overflow-hidden rounded-2xl border border-white/10 group cursor-pointer break-inside-avoid mb-6 inline-block w-full ${getCardClasses(photo.sizeClass)}`}
                data-cursor="view"
                data-cursor-text="OPEN"
              >
                {/* Image element with protection overlay and watermark */}
                <div className="relative w-full h-full overflow-hidden select-none">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    loading="lazy"
                    className="w-full h-full object-cover filter grayscale contrast-[1.1] brightness-[0.95] gallery-image gallery-image-hover-effect pointer-events-none select-none"
                  />
                  {/* Transparent protection overlay to block save actions */}
                  <div className="absolute inset-0 z-10 bg-transparent pointer-events-auto" />
                  
                  {/* Subtle dynamic watermark */}
                  <Watermark text={profileData.name} position="bottom-right" opacity={0.25} />
                </div>

                {/* Hover Dark Vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out pointer-events-none" />

                {/* Hover Metadata (Slide up) */}
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none flex flex-col justify-end">
                  <span className="text-[10px] font-semibold text-white/50 tracking-widest uppercase mb-1">
                    {photo.category} // {photo.location}
                  </span>
                  <h3 className="font-display text-lg font-bold text-white tracking-tight leading-none mb-2">
                    {photo.title}
                  </h3>
                  <span className="text-[10px] font-mono text-white/70 tracking-widest">
                    {photo.settings}
                  </span>
                </div>

                {/* Decorative line frame border visible on hover */}
                <div className="absolute inset-4 border border-white/0 group-hover:border-white/20 rounded-xl transition-all duration-500 ease-out pointer-events-none" />
              </motion.div>
            ))}
          </div>
          
          <div className="w-full h-[1px] bg-white/5 mt-16" />
        </div>
      )}

      {/* Category Filter Navbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            <CinematicTextReveal text={profileData.galleryTitle || "Visual Archive"} />
          </h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
            className="text-xs text-[#8c8c8c] tracking-wider mt-1 uppercase"
          >
            {profileData.gallerySubtitle || "Curated collection of frames"}
          </motion.p>
        </div>
        {/* Filters */}
        <div className="flex flex-nowrap overflow-x-auto scrollbar-none gap-2 pb-2 max-w-full md:max-w-[460px]">
          {categories.map(category => (
            <button
              key={category}
              onClick={(e) => {
                setActiveCategory(category);
                const btn = e.currentTarget;
                const container = btn.parentElement;
                if (container) {
                  const btnRect = btn.getBoundingClientRect();
                  const containerRect = container.getBoundingClientRect();
                  const relativeLeft = btnRect.left - containerRect.left + container.scrollLeft;
                  const btnWidth = btnRect.width;
                  const containerWidth = containerRect.width;
                  const targetScrollLeft = relativeLeft - (containerWidth / 2) + (btnWidth / 2);
                  container.scrollTo({
                    left: targetScrollLeft,
                    behavior: 'smooth'
                  });
                }
              }}
              className={`relative px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors duration-300 rounded-full flex-shrink-0 ${
                activeCategory === category ? 'text-black' : 'text-[#8c8c8c] hover:text-white'
              }`}
              data-cursor="pointer"
            >
              {activeCategory === category && (
                <motion.span
                  layoutId="activeFilter"
                  className="absolute inset-0 bg-white rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Bento Grid */}
      <motion.div 
        className="columns-1 sm:columns-2 md:columns-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredPhotos.map((photo) => (
            <motion.div
              layout={!isMobile ? "position" : false}
              key={photo.id}
              onClick={() => onPhotoClick(photo)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: 'transform, opacity' }}
              className={`relative overflow-hidden rounded-2xl border border-white/10 group cursor-pointer break-inside-avoid mb-6 inline-block w-full ${getCardClasses(photo.sizeClass)}`}
              data-cursor="view"
              data-cursor-text="OPEN"
            >
              {/* Image element with watermark and overlay protection */}
              <div className="relative w-full h-full overflow-hidden select-none">
                <img
                  src={photo.url}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover filter grayscale contrast-[1.1] brightness-[0.95] gallery-image gallery-image-hover-effect pointer-events-none select-none"
                />
                {/* Transparent protection overlay to block save actions */}
                <div className="absolute inset-0 z-10 bg-transparent pointer-events-auto" />
                
                {/* Subtle dynamic watermark */}
                <Watermark text={profileData.name} position="bottom-right" opacity={0.25} />
              </div>

              {/* Hover Dark Vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out pointer-events-none" />

              {/* Hover Metadata (Slide up) */}
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none flex flex-col justify-end">
                <span className="text-[10px] font-semibold text-white/50 tracking-widest uppercase mb-1">
                  {photo.category} // {photo.location}
                </span>
                <h3 className="font-display text-lg font-bold text-white tracking-tight leading-none mb-2">
                  {photo.title}
                </h3>
                <span className="text-[10px] font-mono text-white/70 tracking-widest">
                  {photo.settings}
                </span>
              </div>

              {/* Decorative line frame border visible on hover */}
              <div className="absolute inset-4 border border-white/0 group-hover:border-white/20 rounded-xl transition-all duration-500 ease-out pointer-events-none" />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
export { PHOTO_DATA };
