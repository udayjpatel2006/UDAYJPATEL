import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CinematicTextReveal from './CinematicTextReveal';

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
  },
  {
    id: 2,
    title: "Amalfi Golden Hour",
    category: "Sunsets",
    location: "Positano, Italy",
    url: "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop",
    sizeClass: "md:col-span-1 md:row-span-2",
    settings: "35mm • f/2.0 • 1/400s • ISO 100",
  },
  {
    id: 3,
    title: "The Nomad's Gaze",
    category: "Portraits",
    location: "Sahara, Morocco",
    url: "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1200&auto=format&fit=crop",
    sizeClass: "md:col-span-1 md:row-span-1",
    settings: "85mm • f/1.4 • 1/1250s • ISO 100",
  },
  {
    id: 4,
    title: "Vicolo de' Fiori",
    category: "Streets",
    location: "Rome, Italy",
    url: "https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?q=80&w=1200&auto=format&fit=crop",
    sizeClass: "md:col-span-2 md:row-span-2",
    settings: "50mm • f/1.8 • 1/320s • ISO 200",
  },
  {
    id: 5,
    title: "Cappadocia Sunrise",
    category: "Sunsets",
    location: "Anatolia, Turkey",
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200&auto=format&fit=crop",
    sizeClass: "md:col-span-1 md:row-span-1",
    settings: "24mm • f/2.8 • 1/500s • ISO 100",
  },
  {
    id: 6,
    title: "Neon Trails",
    category: "Streets",
    location: "Shinjuku, Japan",
    url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop",
    sizeClass: "md:col-span-1 md:row-span-1",
    settings: "35mm • f/2.8 • 1/30s • ISO 1600",
  },
  {
    id: 7,
    title: "Monk in Reflection",
    category: "Portraits",
    location: "Leh Ladakh, India",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop",
    sizeClass: "md:col-span-1 md:row-span-2",
    settings: "50mm • f/1.8 • 1/250s • ISO 400",
  },
  {
    id: 8,
    title: "Nordic Fjords",
    category: "Landscapes",
    location: "Lofoten, Norway",
    url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop",
    sizeClass: "md:col-span-2 md:row-span-1",
    settings: "16mm • f/8.0 • 1/160s • ISO 100",
  },
];

export default function PhotoGrid({ onPhotoClick, photoList = PHOTO_DATA, profileData = {}, subsections = [] }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    return ["All", ...subsections];
  }, [subsections]);

  const filteredPhotos = activeCategory === "All"
    ? photoList
    : photoList.filter(photo => photo.category === activeCategory);

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
      {/* Category Filter Navbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            <CinematicTextReveal text={profileData.galleryTitle || "Visual Archive"} />
          </h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
            className="text-xs text-[#8c8c8c] tracking-wider mt-1 uppercase"
          >
            {profileData.gallerySubtitle || "Curated collection of frames"}
          </motion.p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`relative px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors duration-300 rounded-full ${
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
        layout
        className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto"
      >
        <AnimatePresence mode="popLayout">
          {filteredPhotos.map((photo) => (
            <motion.div
              layout
              key={photo.id}
              layoutId={`card-container-${photo.id}`}
              onClick={() => onPhotoClick(photo)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`relative overflow-hidden rounded-2xl border border-white/10 group cursor-pointer ${getCardClasses(photo.sizeClass)}`}
              data-cursor="view"
              data-cursor-text="OPEN"
            >
              {/* Image element with layoutId for transition */}
              <motion.img
                layoutId={`image-${photo.id}`}
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover filter grayscale contrast-[1.1] brightness-[0.95] group-hover:scale-105 group-hover:filter-none transition-all duration-700 ease-out"
              />

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
              <div className="absolute inset-4 border border-white/0 group-hover:border-white/15 rounded-xl transition-all duration-500 ease-out pointer-events-none" />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
export { PHOTO_DATA };
