import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Mail, ArrowUpRight, Globe, Camera } from 'lucide-react';
import MagneticWrapper from './MagneticWrapper';
import TiltWrapper from './TiltWrapper';
import profileImg from '../../imgs/20260305_121542.jpg';
import heroBg from '../../imgs/hero_bg.png';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
    },
  },
};

const imageVariants = {
  hidden: { scale: 1.05, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
    },
  },
};

export default function Hero({ profileData = {} }) {
  const {
    name = "UDAYJPATEL",
    tagline = "Cinematic Travel & Adventure Photographer",
    titleLine1 = "Warm Light,",
    titleLine2 = "Remote Trails.",
    description = "Odyssey documents the raw beauty of our world—from sun-drenched European alleys and mist-shrouded peaks to quiet moments in distant lands. Each frame is a story of exploration, rich colors, and warm atmospheric light.",
    email = "contact@udayjpatel.com",
    photoUrl = profileImg,
    location = "Chamonix, FR"
  } = profileData;

  // Formatted name with spacing
  const formattedName = name.split('').join(' ');

  return (
    <motion.header
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full min-h-[90vh] bg-transparent"
    >

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-10 pb-16 md:py-24 flex flex-col justify-between min-h-[90vh]">
        {/* Top Navbar */}
      <motion.div 
        variants={itemVariants} 
        className="flex justify-between items-center w-full mb-16 md:mb-0"
      >
        <div className="flex items-center space-x-2">
          <Camera className="w-5 h-5 text-white stroke-[1.5]" />
          <span className="font-display font-bold tracking-[0.25em] text-sm uppercase">{formattedName}</span>
        </div>
        <nav className="hidden md:flex space-x-8 text-xs font-medium uppercase tracking-widest text-[#8c8c8c]">
          <MagneticWrapper>
            <a href="#gallery" className="hover:text-white transition-colors duration-300" data-cursor="pointer">Gallery</a>
          </MagneticWrapper>
          <MagneticWrapper>
            <a href="#about" className="hover:text-white transition-colors duration-300" data-cursor="pointer">About</a>
          </MagneticWrapper>
          <MagneticWrapper>
            <a href="#contact" className="hover:text-white transition-colors duration-300" data-cursor="pointer">Contact</a>
          </MagneticWrapper>
        </nav>
        <div className="w-[100px] md:hidden" /> {/* Spacer for alignment */}
      </motion.div>

      {/* Main Grid Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-center my-auto">
        
        {/* Left Column: Typographic Details */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-8">
          <motion.div variants={itemVariants} className="space-y-4">
            <span className="text-xs font-semibold tracking-[0.3em] text-[#8c8c8c] uppercase flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {tagline}
            </span>
            <h1 className="font-display text-4xl sm:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05] text-white">
              {titleLine1} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">{titleLine2}</span>
            </h1>
          </motion.div>

          <motion.p 
            variants={itemVariants}
            className="text-sm sm:text-base text-[#8c8c8c] leading-relaxed max-w-lg font-light"
          >
            {description}
          </motion.p>

          {/* Call to Actions & Socials */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-6 pt-4">
            <MagneticWrapper>
              <a 
                href="#gallery" 
                className="group flex items-center space-x-2 text-xs font-bold tracking-widest uppercase bg-white text-black px-6 py-4 rounded-full hover:bg-neutral-200 transition-colors duration-300"
                data-cursor="pointer"
              >
                <span>Explore Works</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </a>
            </MagneticWrapper>
            
            <div className="flex items-center space-x-4">
              {profileData.instaUrl && (
                <MagneticWrapper>
                  <a 
                    href={profileData.instaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-[#8c8c8c] hover:text-white hover:border-white/20 transition-all duration-300 hover:scale-105"
                    data-cursor="pointer"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                </MagneticWrapper>
              )}
              <MagneticWrapper>
                <a 
                  href={`mailto:${email || 'udayjpatel2006@gmail.com'}`} 
                  className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-[#8c8c8c] hover:text-white hover:border-white/20 transition-all duration-300 hover:scale-105"
                  data-cursor="pointer"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </MagneticWrapper>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Visual Frame with overlay protection */}
        <div className="lg:col-span-5 relative w-full h-[400px] sm:h-[500px] md:h-[550px] select-none">
          <TiltWrapper>
            <div className="relative w-full h-full overflow-hidden rounded-2xl border border-white/10 group select-none">
              {/* Decorative frame overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none" />
              
              <motion.img 
                variants={imageVariants}
                src={photoUrl} 
                alt={`${name} — Profile`} 
                className="w-full h-full object-cover filter grayscale contrast-[1.1] brightness-[0.95] group-hover:scale-105 group-hover:filter-none transition-all duration-700 ease-out object-center pointer-events-none select-none"
                data-cursor="view"
                data-cursor-text="EXPLORE"
              />

              {/* Transparent protection overlay to block save/drag */}
              <div className="absolute inset-0 z-11 bg-transparent pointer-events-auto" />

              {/* Bottom indicator */}
              <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end">
                <div>
                  <span className="text-sm font-semibold tracking-wider text-white">{name} // PORTFOLIO</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-white/50">
                  <Globe className="w-3 h-3 animate-spin-[20s]" />
                  <span>{location}</span>
                </div>
              </div>
            </div>
          </TiltWrapper>
        </div>

      </div>

      </div>

      {/* Decorative footer line */}
      <motion.div 
        variants={itemVariants}
        className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent absolute bottom-0 left-0 z-10"
      />
    </motion.header>
  );
}
