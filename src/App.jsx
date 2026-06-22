import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles, Send, Lock } from 'lucide-react';
import Hero from './components/Hero';
import CinematicTextReveal from './components/CinematicTextReveal';
import PhotoGrid, { PHOTO_DATA } from './components/PhotoGrid';
import Lightbox from './components/Lightbox';
import AdminPanel from './components/AdminPanel';
import CustomCursor from './components/CustomCursor';
import MagneticWrapper from './components/MagneticWrapper';
import profileImg from '../imgs/20260305_121542.jpg';

const DEFAULT_PROFILE = {
  name: "UDAYJPATEL",
  tagline: "Cinematic Travel & Adventure Photographer",
  titleLine1: "Warm Light,",
  titleLine2: "Remote Trails.",
  description: "Odyssey documents the raw beauty of our world—from sun-drenched European alleys and mist-shrouded peaks to quiet moments in distant lands. Each frame is a story of exploration, rich colors, and warm atmospheric light.",
  email: "contact@udayjpatel.com",
  photoUrl: profileImg,
  location: "Chamonix, FR",
  instaUrl: "https://www.instagram.com/uday_j_patel_/",
  aboutTitle: "Chasing the golden hour across distant horizons.",
  aboutPara1: "Every journey is a search for connection. As a visual storyteller, I believe the most profound travel photographs aren't just of places, but of feelings. My lens documents the warmth of the sun on ancient stone, the vastness of quiet wilderness, and the stories written on the faces of people I meet along the way.",
  aboutPara2: "By embracing rich color grading, warm shadows, and authentic moments, each image becomes an invitation to wander. Through {name}'s lens, we traverse the boundary between the familiar and the wild, celebrating the rich storytelling built directly into the fabric of our world.",
  inquiriesTitle: "Let's capture the next adventure.",
  galleryTitle: "Visual Archive",
  gallerySubtitle: "Curated collection of frames"
};

export default function App() {
  const [profileData, setProfileData] = useState(DEFAULT_PROFILE);
  const [photoList, setPhotoList] = useState(PHOTO_DATA);
  const [subsections, setSubsections] = useState(["Landscapes", "Sunsets", "Portraits", "Streets"]);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem('admin_token') || '');

  const handleLogout = () => {
    setAuthToken('');
    sessionStorage.removeItem('admin_token');
  };

  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', message: '' });
  const [inquiryStatus, setInquiryStatus] = useState({ submitting: false, success: false, error: null });

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setInquiryStatus({ submitting: true, success: false, error: null });
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inquiryForm.name,
          email: inquiryForm.email,
          message: inquiryForm.message
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      setInquiryStatus({ submitting: false, success: true, error: null });
      setInquiryForm({ name: '', email: '', message: '' });
      setTimeout(() => {
        setInquiryStatus(prev => ({ ...prev, success: false }));
      }, 6000);
    } catch (err) {
      console.error('[ERROR] Failed to submit inquiry:', err);
      setInquiryStatus({ submitting: false, success: false, error: err.message });
    }
  };

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  });


  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[LOG] Loading portfolio configurations from database...');
        // Append a timestamp parameter to prevent API caching (Requirement 6)
        const res = await fetch(`/api/data?t=${Date.now()}`);
        if (!res.ok) throw new Error('Database fetch returned non-200 response');
        
        const data = await res.json();
        
        // LocalStorage migration logic (Requirement 8):
        const localProfile = localStorage.getItem('uday_profile_data');
        const localPhotos = localStorage.getItem('uday_photo_list');
        const localSubsections = localStorage.getItem('uday_subsections');

        let activeProfile = data.profileData;
        let activePhotos = data.photoList;
        let activeSubsections = data.subsections;
        let needsMigrationSync = false;

        // Determine if database is at default seed
        const isDbProfileDefault = (data.profileData.name === "UDAYJPATEL" && !data.profileData.photoUrl);

        if (localProfile && isDbProfileDefault) {
          console.log('[LOG] Detected local storage profile. Migrating to database...');
          try {
            const parsed = JSON.parse(localProfile);
            activeProfile = parsed;
            needsMigrationSync = true;
            await fetch('/api/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: localProfile
            });
          } catch (e) {
            console.error('[ERROR] Failed to migrate profile from localStorage:', e);
          }
        }

        if (localPhotos && data.photoList.length === 8 && data.photoList[0].url.includes('unsplash.com')) {
          console.log('[LOG] Detected local storage photo edits. Migrating to database...');
          try {
            const parsed = JSON.parse(localPhotos);
            activePhotos = parsed;
            needsMigrationSync = true;
            await fetch('/api/photos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: localPhotos
            });
          } catch (e) {
            console.error('[ERROR] Failed to migrate photos from localStorage:', e);
          }
        }

        if (localSubsections && data.subsections.length === 4) {
          console.log('[LOG] Detected local storage subsections. Migrating to database...');
          try {
            const parsed = JSON.parse(localSubsections);
            activeSubsections = parsed;
            needsMigrationSync = true;
            await fetch('/api/subsections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: localSubsections
            });
          } catch (e) {
            console.error('[ERROR] Failed to migrate subsections from localStorage:', e);
          }
        }

        setProfileData(activeProfile);
        setPhotoList(activePhotos);
        setSubsections(activeSubsections);

        if (needsMigrationSync) {
          console.log('[LOG] Successful client localStorage migration completed.');
        } else {
          console.log('[LOG] Successfully loaded portfolio data from SQLite.');
        }
      } catch (err) {
        console.error('[ERROR] [FS_DB] Failed to retrieve data from database. Falling back to localStorage caching:', err);
        // Fallback to localStorage caching if offline
        const localProfile = localStorage.getItem('uday_profile_data');
        const localPhotos = localStorage.getItem('uday_photo_list');
        const localSubsections = localStorage.getItem('uday_subsections');

        if (localProfile) setProfileData(JSON.parse(localProfile));
        if (localPhotos) setPhotoList(JSON.parse(localPhotos));
        if (localSubsections) setSubsections(JSON.parse(localSubsections));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Global image protection handlers (prevents right-clicks and dragging)
  // Note: Client-side protection prevents casual saving but does not protect against screenshots or network tab extraction.
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    const handleDragStart = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  const handleUpdateProfile = async (newData) => {
    // 1. Instantly update React state for latency-free frontend response
    setProfileData(newData);
    
    // 2. Cache locally
    try {
      localStorage.setItem('uday_profile_data', JSON.stringify(newData));
    } catch (e) {
      console.warn('[WARN] LocalStorage quota exceeded. Using backend persistence only.');
    }

    // 3. Persist in database immediately (Requirement 3)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newData)
      });
      if (res.status === 401) {
        handleLogout();
        alert('Session expired or unauthorized. Please log in again.');
        return;
      }
      if (!res.ok) throw new Error('Backend responded with HTTP error status: ' + res.status);
      console.log('[LOG] Profile changes saved successfully to backend SQLite database.');
    } catch (err) {
      console.error('[ERROR] [DB_WRITE_FAIL] Profile update failed to save in SQLite:', err);
      alert('Error: Failed to save profile changes to the server database. Changes may be lost on server restart.');
    }
  };

  const handleUpdatePhotos = async (newList) => {
    setPhotoList(newList);
    try {
      localStorage.setItem('uday_photo_list', JSON.stringify(newList));
    } catch (e) {
      console.warn('[WARN] LocalStorage quota exceeded. Using backend persistence only.');
    }

    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newList)
      });
      if (res.status === 401) {
        handleLogout();
        alert('Session expired or unauthorized. Please log in again.');
        return;
      }
      if (!res.ok) throw new Error('Backend responded with HTTP error status: ' + res.status);
      console.log('[LOG] Photos collection synced successfully with backend SQLite database.');
    } catch (err) {
      console.error('[ERROR] [DB_WRITE_FAIL] Gallery update failed to save in SQLite:', err);
      alert('Error: Failed to save photo gallery changes to the server database.');
    }
  };

  const handleUpdateSubsections = async (newSubsections) => {
    setSubsections(newSubsections);
    try {
      localStorage.setItem('uday_subsections', JSON.stringify(newSubsections));
    } catch (e) {
      console.warn('[WARN] LocalStorage quota exceeded. Using backend persistence only.');
    }

    try {
      const res = await fetch('/api/subsections', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newSubsections)
      });
      if (res.status === 401) {
        handleLogout();
        alert('Session expired or unauthorized. Please log in again.');
        return;
      }
      if (!res.ok) throw new Error('Backend responded with HTTP error status: ' + res.status);
      console.log('[LOG] Subsections synced successfully with backend SQLite database.');
    } catch (err) {
      console.error('[ERROR] [DB_WRITE_FAIL] Subsections update failed to save in SQLite:', err);
      alert('Error: Failed to save subsection categories to the server database.');
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Are you sure you want to restore defaults? This will overwrite your server database settings.')) {
      return;
    }
    
    // Clear cache
    localStorage.removeItem('uday_profile_data');
    localStorage.removeItem('uday_photo_list');
    localStorage.removeItem('uday_subsections');

    setProfileData(DEFAULT_PROFILE);
    setPhotoList(PHOTO_DATA);
    setSubsections(["Landscapes", "Sunsets", "Portraits", "Streets"]);

    try {
      const res1 = await fetch('/api/profile', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(DEFAULT_PROFILE)
      });
      const res2 = await fetch('/api/photos', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(PHOTO_DATA)
      });
      const res3 = await fetch('/api/subsections', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(["Landscapes", "Sunsets", "Portraits", "Streets"])
      });
      if (res1.status === 401 || res2.status === 401 || res3.status === 401) {
        handleLogout();
        alert('Session expired or unauthorized. Please log in again.');
        return;
      }
      console.log('[LOG] Database reset to original seed defaults.');
      alert('Database restored to default values successfully.');
    } catch (err) {
      console.error('[ERROR] [DB_WRITE_FAIL] Failed to reset database to defaults:', err);
      alert('Error: Failed to reset server database defaults.');
    }
  };

  const [isAdminOpen, setIsAdminOpen] = useState(() => {
    return window.location.pathname === '/admin';
  });

  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Sync state if pathname changes (e.g. back/forward browser button)
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminOpen(window.location.pathname === '/admin');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openAdmin = () => {
    setIsAdminOpen(true);
    window.history.pushState({}, '', '/admin');
  };

  const closeAdmin = () => {
    setIsAdminOpen(false);
    window.history.pushState({}, '', '/');
  };

  const handlePrev = () => {
    if (!selectedPhoto) return;
    const currentIndex = photoList.findIndex((p) => p.id === selectedPhoto.id);
    const prevIndex = (currentIndex - 1 + photoList.length) % photoList.length;
    setSelectedPhoto(photoList[prevIndex]);
  };

  const handleNext = () => {
    if (!selectedPhoto) return;
    const currentIndex = photoList.findIndex((p) => p.id === selectedPhoto.id);
    const nextIndex = (currentIndex + 1) % photoList.length;
    setSelectedPhoto(photoList[nextIndex]);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-full h-full bg-neutral-950 flex flex-col items-center justify-center z-50 text-white font-display">
        <div className="space-y-4 text-center">
          <span className="inline-block w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin" />
          <p className="text-xs tracking-[0.3em] text-[#8c8c8c] uppercase font-semibold">Loading Portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-transparent text-white">
      {/* Custom Cursor */}
      <CustomCursor />

      {/* Hero Section */}
      <Hero profileData={profileData} />

      {/* Photo Grid Section */}
      <PhotoGrid onPhotoClick={setSelectedPhoto} photoList={photoList} profileData={profileData} subsections={subsections} />

      {/* About / Artist Statement Section */}
      <section id="about" className="w-full max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="w-full h-[1px] bg-white/5 mb-20" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white leading-tight">
              <CinematicTextReveal text={profileData.aboutTitle || "Chasing the golden hour across distant horizons."} />
            </h2>
          </div>
          
          <div className="lg:col-span-8 space-y-8 text-neutral-400 font-light text-sm sm:text-base leading-relaxed">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {profileData.aboutPara1 || "Every journey is a search for connection. As a visual storyteller, I believe the most profound travel photographs aren't just of places, but of feelings. My lens documents the warmth of the sun on ancient stone, the vastness of quiet wilderness, and the stories written on the faces of people I meet along the way."}
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            >
              {(profileData.aboutPara2 || "By embracing rich color grading...").replace(/{name}/g, profileData.name).replace(/{profileData.name}/g, profileData.name)}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Booking / Contact Section */}
      <section id="contact" className="w-full max-w-7xl mx-auto px-6 py-20 md:py-32 bg-neutral-950 border-y border-white/5 rounded-3xl mb-16 overflow-hidden relative">
        {/* Background glow ornament */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form info */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <motion.span 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-100px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-xs font-semibold tracking-[0.3em] text-[#8c8c8c] uppercase block"
              >
                INQUIRIES
              </motion.span>
              <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                <CinematicTextReveal text={profileData.inquiriesTitle || "Let's capture the next adventure."} />
              </h2>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="space-y-2"
            >
              <p className="text-xs text-[#8c8c8c]">GENERAL EMAIL</p>
              <a href={`mailto:${profileData.email}`} className="text-lg hover:underline underline-offset-4 font-light text-white" data-cursor="pointer">
                {profileData.email}
              </a>
              <p className="text-xs text-[#8c8c8c] pt-4">LOCATION</p>
              <p className="text-sm font-light text-white">{profileData.location} • Available Worldwide</p>
            </motion.div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-7">
            {inquiryStatus.success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex flex-col items-center justify-center text-center space-y-4 py-12 border border-white/10 rounded-2xl bg-neutral-900/50"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="font-display text-xl font-bold">Proposal Sent Successfully!</h3>
                <p className="text-sm text-neutral-400 max-w-sm">
                  Thank you for reaching out. We will review your project details and get back to you shortly.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">NAME</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                      className="w-full bg-transparent border-b border-white/10 focus:border-white focus:outline-none py-3 text-sm font-light tracking-wide transition-colors duration-300"
                      data-cursor="text"
                      data-cursor-text="TYPE"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">EMAIL</label>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                      className="w-full bg-transparent border-b border-white/10 focus:border-white focus:outline-none py-3 text-sm font-light tracking-wide transition-colors duration-300"
                      data-cursor="text"
                      data-cursor-text="TYPE"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">PROJECT DESCRIPTION</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us about the project scope, destinations, or adventure details"
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                    className="w-full bg-transparent border-b border-white/10 focus:border-white focus:outline-none py-3 text-sm font-light tracking-wide transition-colors duration-300 resize-none"
                    data-cursor="text"
                    data-cursor-text="TYPE"
                  />
                </div>

                {inquiryStatus.error && (
                  <p className="text-xs text-red-500 font-semibold tracking-wide uppercase">
                    {inquiryStatus.error}
                  </p>
                )}

                <MagneticWrapper>
                  <button
                    type="submit"
                    disabled={inquiryStatus.submitting}
                    className="group flex items-center space-x-3 bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-neutral-200 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-cursor="pointer"
                  >
                    <span>{inquiryStatus.submitting ? 'Sending...' : 'Send Proposal'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </MagneticWrapper>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center text-xs text-[#8c8c8c] border-t border-white/5 gap-4">
        <span>© 2026 {profileData.name.toUpperCase()}. ALL RIGHTS RESERVED.</span>
        <div className="flex items-center space-x-6">
          <MagneticWrapper>
            <a href="#gallery" className="hover:text-white transition-colors" data-cursor="pointer">JOURNEYS</a>
          </MagneticWrapper>
          <MagneticWrapper>
            <a href="#about" className="hover:text-white transition-colors" data-cursor="pointer">STORY</a>
          </MagneticWrapper>
          <MagneticWrapper>
            <a href="#contact" className="hover:text-white transition-colors" data-cursor="pointer">CONTACT</a>
          </MagneticWrapper>
        </div>
      </footer>

      {/* Lightbox Pop-up with Shared Layout Animation */}
      <AnimatePresence>
        {selectedPhoto && (
          <Lightbox
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            onPrev={handlePrev}
            onNext={handleNext}
            artistName={profileData.name}
          />
        )}
      </AnimatePresence>

      {/* Admin Panel Console Overlay */}
      {isAdminOpen && (
        <AdminPanel
          profileData={profileData}
          onUpdateProfile={handleUpdateProfile}
          photoList={photoList}
          onUpdatePhotos={handleUpdatePhotos}
          onResetDefaults={handleResetDefaults}
          onClose={closeAdmin}
          subsections={subsections}
          onUpdateSubsections={handleUpdateSubsections}
          authToken={authToken}
          onLoginSuccess={(token) => {
            setAuthToken(token);
            sessionStorage.setItem('admin_token', token);
          }}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
