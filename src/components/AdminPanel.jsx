import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Edit3, Plus, RotateCcw, Download, Upload, Lock, Unlock, Check, Image } from 'lucide-react';
import ExifReader from 'exifreader';

export default function AdminPanel({
  profileData,
  onUpdateProfile,
  photoList,
  onUpdatePhotos,
  onResetDefaults,
  onClose,
  subsections = [],
  onUpdateSubsections,
  authToken,
  onLoginSuccess,
  onLogout
}) {
  const [passcode, setPasscode] = useState('');
  const isLoggedIn = !!authToken;
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [successMsg, setSuccessMsg] = useState('');

  // Local state for profile inputs
  const [profileForm, setProfileForm] = useState({
    name: '',
    tagline: '',
    titleLine1: '',
    titleLine2: '',
    description: '',
    email: '',
    photoUrl: '',
    location: '',
    instaUrl: '',
    aboutTitle: '',
    aboutPara1: '',
    aboutPara2: '',
    inquiriesTitle: '',
    galleryTitle: '',
    gallerySubtitle: '',
    highlightsTitle: '',
    web3FormsKey: ''
  });

  // Local state for photo editing
  const [editingPhoto, setEditingPhoto] = useState(null); // null if not editing, or a photo object
  const [isAddingNew, setIsAddingNew] = useState(false); // boolean flag
  
  // Local state for photo inputs (used for both Add and Edit)
  const [photoForm, setPhotoForm] = useState({
    title: '',
    category: '',
    location: '',
    url: '',
    sizeClass: 'md:col-span-1 md:row-span-1',
    settings: '50mm • f/2.0 • 1/500s • ISO 100',
    isHighlight: 0
  });

  // Local state for subsections management
  const [newSubsectionName, setNewSubsectionName] = useState('');
  const [editingSubsectionIndex, setEditingSubsectionIndex] = useState(-1);
  const [editingSubsectionName, setEditingSubsectionName] = useState('');

  // Local state for custom confirmation dialogs
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [subsectionToDelete, setSubsectionToDelete] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);


  // Sync profile form when profileData loads
  useEffect(() => {
    if (profileData) {
      setProfileForm({
        name: profileData.name || '',
        tagline: profileData.tagline || '',
        titleLine1: profileData.titleLine1 || '',
        titleLine2: profileData.titleLine2 || '',
        description: profileData.description || '',
        email: profileData.email || '',
        photoUrl: profileData.photoUrl || '',
        location: profileData.location || '',
        instaUrl: profileData.instaUrl !== undefined ? profileData.instaUrl : 'https://www.instagram.com/uday_j_patel_/',
        aboutTitle: profileData.aboutTitle || 'Chasing the golden hour across distant horizons.',
        aboutPara1: profileData.aboutPara1 || 'Every journey is a search for connection. As a visual storyteller, I believe the most profound travel photographs aren\'t just of places, but of feelings. My lens documents the warmth of the sun on ancient stone, the vastness of quiet wilderness, and the stories written on the faces of people I meet along the way.',
        aboutPara2: profileData.aboutPara2 || 'By embracing rich color grading, warm shadows, and authentic moments, each image becomes an invitation to wander. Through {name}\'s lens, we traverse the boundary between the familiar and the wild, celebrating the rich storytelling built directly into the fabric of our world.',
        inquiriesTitle: profileData.inquiriesTitle || 'Let\'s capture the next adventure.',
        galleryTitle: profileData.galleryTitle || 'Visual Archive',
        gallerySubtitle: profileData.gallerySubtitle || 'Curated collection of frames',
        highlightsTitle: profileData.highlightsTitle || 'Featured Highlights',
        web3FormsKey: profileData.web3FormsKey || ''
      });
    }
  }, [profileData]);

  // Handle Admin Passcode Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.token);
        setErrorMsg('');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Invalid Passcode. Please try again.');
        setPasscode('');
      }
    } catch (err) {
      setErrorMsg('Server connection failed. Please try again.');
    }
  };

  // Trigger Success Banner
  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Save Profile Changes
  const handleSaveProfile = (e) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    triggerSuccess('Profile information updated successfully!');
  };

  // Convert and handle direct local image uploads as Base64 strings with compression and EXIF metadata extraction
  const handleImageUpload = async (e, targetForm) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1048576 * 25) {
        alert("Warning: This file exceeds 25MB. Please choose a smaller image.");
        return;
      }

      let extractedSettings = null;
      if (targetForm === 'photo') {
        try {
          const tags = await ExifReader.load(file);
          
          let focalLength = '';
          if (tags.FocalLength) {
            focalLength = String(tags.FocalLength.description).replace(/\s+/g, '');
            if (!focalLength.toLowerCase().endsWith('mm')) focalLength += 'mm';
          }
          
          let aperture = '';
          if (tags.FNumber) {
            const desc = String(tags.FNumber.description).trim();
            aperture = desc.toLowerCase().startsWith('f/') ? desc : `f/${desc}`;
          }
          
          let shutterSpeed = '';
          if (tags.ExposureTime) {
            const desc = String(tags.ExposureTime.description).trim();
            shutterSpeed = desc.endsWith('s') ? desc : `${desc}s`;
          }
          
          let iso = '';
          const isoTag = tags.ISOSpeedRatings || tags.PhotographicSensitivity;
          if (isoTag) {
            const desc = String(isoTag.description).trim();
            iso = desc.toLowerCase().startsWith('iso') ? desc : `ISO ${desc}`;
          }
          
          const parts = [focalLength, aperture, shutterSpeed, iso].filter(Boolean);
          if (parts.length > 0) {
            extractedSettings = parts.join(' • ');
          }
        } catch (error) {
          console.warn('Failed to parse EXIF metadata:', error);
        }
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.75 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);

          if (targetForm === 'profile') {
            setProfileForm(prev => ({ ...prev, photoUrl: compressedDataUrl }));
            triggerSuccess('Local profile image loaded and compressed!');
          } else if (targetForm === 'photo') {
            setPhotoForm(prev => ({ 
              ...prev, 
              url: compressedDataUrl,
              ...(extractedSettings ? { settings: extractedSettings } : {})
            }));
            triggerSuccess(extractedSettings 
              ? 'Local gallery image loaded with EXIF metadata!' 
              : 'Local gallery image loaded and compressed!');
          }
        };
        img.onerror = () => {
          alert("Failed to load image. Please select a valid image file.");
        };
        img.src = event.target.result;
      };
      reader.onerror = () => {
        alert("Failed to read file.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Start Editing a Photo
  const startEditPhoto = (photo) => {
    setEditingPhoto(photo);
    setIsAddingNew(false);
    setPhotoForm({
      title: photo.title || '',
      category: photo.category || '',
      location: photo.location || '',
      url: photo.url || '',
      sizeClass: photo.sizeClass || 'md:col-span-1 md:row-span-1',
      settings: photo.settings || '50mm • f/2.0 • 1/500s • ISO 100',
      isHighlight: photo.isHighlight || 0
    });
  };

  // Start Adding a Photo
  const startAddPhoto = () => {
    setIsAddingNew(true);
    setEditingPhoto(null);
    setPhotoForm({
      title: '',
      category: subsections[0] || '',
      location: '',
      url: '',
      sizeClass: 'md:col-span-1 md:row-span-1',
      settings: '50mm • f/2.0 • 1/500s • ISO 100',
      isHighlight: 0
    });
  };

  // Save/Submit Photo Form (Add or Edit)
  const handleSavePhoto = (e) => {
    e.preventDefault();
    if (isAddingNew) {
      const newId = photoList.length > 0 ? Math.max(...photoList.map(p => p.id)) + 1 : 1;
      const newPhoto = { id: newId, ...photoForm };
      onUpdatePhotos([...photoList, newPhoto]);
      triggerSuccess('New photo added successfully!');
      setIsAddingNew(false);
    } else if (editingPhoto) {
      const updatedPhotos = photoList.map(p => 
        String(p.id) === String(editingPhoto.id) ? { ...p, ...photoForm } : p
      );
      onUpdatePhotos(updatedPhotos);
      triggerSuccess('Photo details updated successfully!');
      setEditingPhoto(null);
    }
  };

  // Delete a Photo
  const handleDeletePhoto = (photoId) => {
    const photo = photoList.find(p => String(p.id) === String(photoId));
    if (photo) {
      setPhotoToDelete(photo);
    }
  };

  // Export JSON Database Backup
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ profileData, photoList, subsections }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `portfolio_backup_${profileData.name || 'uday'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerSuccess('Database backup file exported!');
  };

  // Import JSON Database Backup
  const handleImportData = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.profileData && parsed.photoList) {
            onUpdateProfile(parsed.profileData);
            onUpdatePhotos(parsed.photoList);
            if (parsed.subsections && onUpdateSubsections) {
              onUpdateSubsections(parsed.subsections);
            }
            triggerSuccess('Database imported successfully!');
          } else {
            alert('Invalid backup file format. Must contain profileData and photoList fields.');
          }
        } catch (error) {
          alert('Failed to parse JSON file.');
        }
      };
    }
  };

  // Reset to Defaults Trigger
  const handleReset = () => {
    setIsResetConfirmOpen(true);
  };

  // Subsection Management Handlers
  const handleCreateSubsection = (e) => {
    e.preventDefault();
    const name = newSubsectionName.trim();
    if (!name) return;
    if (subsections.includes(name)) {
      alert('Subsection already exists.');
      return;
    }
    onUpdateSubsections([...subsections, name]);
    setNewSubsectionName('');
    triggerSuccess(`Subsection "${name}" created!`);
  };

  const handleRenameSubsection = (index, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const oldName = subsections[index];
    if (oldName === trimmed) {
      setEditingSubsectionIndex(-1);
      return;
    }
    if (subsections.includes(trimmed)) {
      alert('A subsection with that name already exists.');
      return;
    }
    
    const updated = [...subsections];
    updated[index] = trimmed;
    onUpdateSubsections(updated);
    
    const updatedPhotos = photoList.map(photo => 
      photo.category === oldName ? { ...photo, category: trimmed } : photo
    );
    onUpdatePhotos(updatedPhotos);
    
    setEditingSubsectionIndex(-1);
    triggerSuccess(`Subsection renamed to "${trimmed}"!`);
  };

  const handleDeleteSubsection = (name) => {
    setSubsectionToDelete(name);
  };

  const handleBulkImageUpload = (e, category) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const oversizedFiles = files.filter(f => f.size > 1048576 * 25);
    if (oversizedFiles.length > 0) {
      alert("Some files exceed 25MB and were skipped.");
    }
    
    const validFiles = files.filter(f => f.size <= 1048576 * 25);
    let loadedPhotos = [];
    let processedCount = 0;
    
    validFiles.forEach((file) => {
      ExifReader.load(file).then(tags => {
        let focalLength = '';
        if (tags.FocalLength) {
          focalLength = String(tags.FocalLength.description).replace(/\s+/g, '');
          if (!focalLength.toLowerCase().endsWith('mm')) focalLength += 'mm';
        }
        
        let aperture = '';
        if (tags.FNumber) {
          const desc = String(tags.FNumber.description).trim();
          aperture = desc.toLowerCase().startsWith('f/') ? desc : `f/${desc}`;
        }
        
        let shutterSpeed = '';
        if (tags.ExposureTime) {
          const desc = String(tags.ExposureTime.description).trim();
          shutterSpeed = desc.endsWith('s') ? desc : `${desc}s`;
        }
        
        let iso = '';
        const isoTag = tags.ISOSpeedRatings || tags.PhotographicSensitivity;
        if (isoTag) {
          const desc = String(isoTag.description).trim();
          iso = desc.toLowerCase().startsWith('iso') ? desc : `ISO ${desc}`;
        }
        
        const parts = [focalLength, aperture, shutterSpeed, iso].filter(Boolean);
        const settings = parts.length > 0 ? parts.join(' • ') : '50mm • f/2.0 • 1/500s • ISO 100';

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
            const title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            
            loadedPhotos.push({
              title: title,
              category: category,
              location: profileData.location || "Available Worldwide",
              url: compressedDataUrl,
              sizeClass: 'md:col-span-1 md:row-span-1',
              settings: settings
            });
            
            processedCount++;
            if (processedCount === validFiles.length) {
              let currentPhotos = [...photoList];
              let startId = currentPhotos.length > 0 ? Math.max(...currentPhotos.map(p => p.id)) + 1 : 1;
              
              const newPhotosWithIds = loadedPhotos.map((p, idx) => ({
                id: startId + idx,
                ...p
              }));
              
              onUpdatePhotos([...currentPhotos, ...newPhotosWithIds]);
              triggerSuccess(`Successfully uploaded and compressed ${newPhotosWithIds.length} images into "${category}"!`);
            }
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }).catch(err => {
        console.warn('Failed to parse EXIF metadata for file:', file.name, err);
        const settings = '50mm • f/2.0 • 1/500s • ISO 100';
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
            const title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            
            loadedPhotos.push({
              title: title,
              category: category,
              location: profileData.location || "Available Worldwide",
              url: compressedDataUrl,
              sizeClass: 'md:col-span-1 md:row-span-1',
              settings: settings
            });
            
            processedCount++;
            if (processedCount === validFiles.length) {
              let currentPhotos = [...photoList];
              let startId = currentPhotos.length > 0 ? Math.max(...currentPhotos.map(p => p.id)) + 1 : 1;
              
              const newPhotosWithIds = loadedPhotos.map((p, idx) => ({
                id: startId + idx,
                ...p
              }));
              
              onUpdatePhotos([...currentPhotos, ...newPhotosWithIds]);
              triggerSuccess(`Successfully uploaded and compressed ${newPhotosWithIds.length} images into "${category}"!`);
            }
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl md:px-4 md:py-8 overflow-y-auto">
      <AnimatePresence>
        {!isLoggedIn ? (
          /* Login Dialog */
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-md bg-neutral-950 border border-white/10 rounded-3xl p-8 shadow-2xl relative mx-4 md:mx-0"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-[#8c8c8c] hover:text-white transition-colors duration-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white uppercase">Admin Login</h2>
              <p className="text-xs text-[#8c8c8c] mt-1 text-center">Authentication required to customize portfolio</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold block">Passcode</label>
                <input
                  type="password"
                  required
                  placeholder="Enter admin passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none tracking-wide text-white transition-colors"
                />
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-rose-500 tracking-wide text-center">{errorMsg}</p>
              )}

              <button
                type="submit"
                className="w-full bg-white text-black py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-neutral-200 transition-colors"
              >
                Access Panel
              </button>
            </form>
          </motion.div>
        ) : (
          /* Admin Main Portal */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full md:max-w-5xl bg-neutral-950 md:border border-white/10 md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-full md:h-auto md:max-h-[85vh]"
          >
            {/* Sidebar Navigation */}
            <div className="w-full md:w-60 bg-neutral-900/40 border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col justify-between">
              <div className="space-y-8">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                    <Unlock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block uppercase tracking-wider leading-none">Console</span>
                    <span className="text-[9px] text-[#8c8c8c] tracking-widest uppercase">Admin Mode</span>
                  </div>
                </div>

                <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                  <button
                    onClick={() => { setActiveTab('profile'); setEditingPhoto(null); setIsAddingNew(false); }}
                    className={`px-4 py-2.5 rounded-full text-left text-xs uppercase tracking-widest font-semibold transition-colors w-full whitespace-nowrap ${
                      activeTab === 'profile' ? 'bg-white text-black' : 'text-[#8c8c8c] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Profile Data
                  </button>
                  <button
                    onClick={() => { setActiveTab('texts'); setEditingPhoto(null); setIsAddingNew(false); }}
                    className={`px-4 py-2.5 rounded-full text-left text-xs uppercase tracking-widest font-semibold transition-colors w-full whitespace-nowrap ${
                      activeTab === 'texts' ? 'bg-white text-black' : 'text-[#8c8c8c] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Website Texts
                  </button>
                  <button
                    onClick={() => { setActiveTab('gallery'); setEditingPhoto(null); setIsAddingNew(false); }}
                    className={`px-4 py-2.5 rounded-full text-left text-xs uppercase tracking-widest font-semibold transition-colors w-full whitespace-nowrap ${
                      activeTab === 'gallery' ? 'bg-white text-black' : 'text-[#8c8c8c] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Gallery Images
                  </button>
                  <button
                    onClick={() => { setActiveTab('settings'); setEditingPhoto(null); setIsAddingNew(false); }}
                    className={`px-4 py-2.5 rounded-full text-left text-xs uppercase tracking-widest font-semibold transition-colors w-full whitespace-nowrap ${
                      activeTab === 'settings' ? 'bg-white text-black' : 'text-[#8c8c8c] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    System Control
                  </button>
                  
                  {/* Mobile Exit & Logout */}
                  <button
                    onClick={onClose}
                    className="md:hidden px-4 py-2.5 rounded-full text-xs uppercase tracking-widest font-semibold text-[#8c8c8c] hover:text-white hover:bg-white/5 whitespace-nowrap"
                  >
                    Exit
                  </button>
                  <button
                    onClick={onLogout}
                    className="md:hidden px-4 py-2.5 rounded-full text-xs uppercase tracking-widest font-semibold text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 whitespace-nowrap"
                  >
                    Logout
                  </button>
                </nav>
              </div>

              <div className="hidden md:flex flex-col gap-2 border-t border-white/5 pt-4">
                <button
                  onClick={onClose}
                  className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[#8c8c8c] hover:text-white py-2 transition-colors w-full text-left"
                >
                  <X className="w-4 h-4" />
                  <span>Exit Console</span>
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 text-xs uppercase tracking-widest text-rose-500 hover:text-rose-400 py-2 transition-colors w-full text-left"
                >
                  <Lock className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Core Working Area */}
            <div className="flex-1 p-8 overflow-y-auto flex flex-col justify-between relative bg-black/20">
              
              {/* Success Alert Banner */}
              <AnimatePresence>
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-6 left-8 right-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2.5 z-10"
                  >
                    <Check className="w-4 h-4" />
                    <span className="font-semibold uppercase tracking-wider">{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tab Contents */}
              <div className="flex-1">
                {activeTab === 'profile' && (
                  /* PROFILE TAB */
                  <div>
                    <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-6">Profile Settings</h3>
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Artist Name</label>
                          <input
                            type="text"
                            required
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Artist Tagline</label>
                          <input
                            type="text"
                            required
                            value={profileForm.tagline}
                            onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                            className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Hero Title Line 1</label>
                          <input
                            type="text"
                            required
                            value={profileForm.titleLine1}
                            onChange={(e) => setProfileForm({ ...profileForm, titleLine1: e.target.value })}
                            className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Hero Title Line 2 (Gradients)</label>
                          <input
                            type="text"
                            required
                            value={profileForm.titleLine2}
                            onChange={(e) => setProfileForm({ ...profileForm, titleLine2: e.target.value })}
                            className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">General Contact Email</label>
                          <input
                            type="email"
                            required
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Base Location</label>
                          <input
                            type="text"
                            required
                            value={profileForm.location}
                            onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                            className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Instagram Link</label>
                          <input
                            type="url"
                            pattern="^https?:\/\/(www\.)?instagram\.com\/.*$"
                            title="Please enter a valid Instagram URL (e.g., https://www.instagram.com/username/)"
                            value={profileForm.instaUrl}
                            onChange={(e) => setProfileForm({ ...profileForm, instaUrl: e.target.value })}
                            placeholder="https://instagram.com/username"
                            className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                        <div className="md:col-span-8 space-y-2">
                          <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Profile Photo URL or Path</label>
                          <input
                            type="text"
                            required
                            value={profileForm.photoUrl}
                            onChange={(e) => setProfileForm({ ...profileForm, photoUrl: e.target.value })}
                            className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                          />
                        </div>
                        <div className="md:col-span-4 space-y-2">
                          <label htmlFor="profile-photo-upload" className="flex items-center justify-center space-x-2 bg-neutral-900 border border-white/10 hover:border-white text-white px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors w-full text-center">
                            <Upload className="w-4 h-4" />
                            <span>Upload File</span>
                          </label>
                          <input
                            id="profile-photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'profile')}
                            className="hidden"
                          />
                        </div>
                      </div>
                      
                      {profileForm.photoUrl && (
                        <div className="mt-2 flex items-center space-x-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-neutral-900 flex-shrink-0">
                            <img src={profileForm.photoUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] text-[#8c8c8c]">Profile Image Preview</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Artist Description Bio Statement</label>
                        <textarea
                          rows={4}
                          required
                          value={profileForm.description}
                          onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                          className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="bg-white text-black px-8 py-3.5 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-neutral-200 transition-colors"
                      >
                        Save Profile Settings
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'texts' && (
                  /* WEBSITE TEXTS TAB */
                  <div>
                    <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-6">Website Texts</h3>
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                      <div className="space-y-6">
                        <div className="border-b border-white/5 pb-4">
                          <h4 className="text-xs font-semibold text-white tracking-widest uppercase mb-4">Gallery Section</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Gallery Title</label>
                              <input
                                type="text"
                                required
                                value={profileForm.galleryTitle}
                                onChange={(e) => setProfileForm({ ...profileForm, galleryTitle: e.target.value })}
                                className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Gallery Subtitle</label>
                              <input
                                type="text"
                                required
                                value={profileForm.gallerySubtitle}
                                onChange={(e) => setProfileForm({ ...profileForm, gallerySubtitle: e.target.value })}
                                className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-b border-white/5 pb-4">
                          <h4 className="text-xs font-semibold text-white tracking-widest uppercase mb-4">Highlights Section</h4>
                          <div className="space-y-2">
                            <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Highlights Title</label>
                            <input
                              type="text"
                              required
                              value={profileForm.highlightsTitle}
                              onChange={(e) => setProfileForm({ ...profileForm, highlightsTitle: e.target.value })}
                              className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                            />
                          </div>
                        </div>

                        <div className="border-b border-white/5 pb-4">
                          <h4 className="text-xs font-semibold text-white tracking-widest uppercase mb-4">About / Artist Statement Section</h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Artist Statement Title</label>
                              <input
                                type="text"
                                required
                                value={profileForm.aboutTitle}
                                onChange={(e) => setProfileForm({ ...profileForm, aboutTitle: e.target.value })}
                                className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">About Paragraph 1</label>
                              <textarea
                                rows={3}
                                required
                                value={profileForm.aboutPara1}
                                onChange={(e) => setProfileForm({ ...profileForm, aboutPara1: e.target.value })}
                                className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors resize-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">About Paragraph 2 (Use {"{name}"} as a placeholder for the artist name)</label>
                              <textarea
                                rows={3}
                                required
                                value={profileForm.aboutPara2}
                                onChange={(e) => setProfileForm({ ...profileForm, aboutPara2: e.target.value })}
                                className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-white tracking-widest uppercase mb-4">Inquiries Section</h4>
                          <div className="space-y-2">
                            <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Inquiries Title</label>
                            <input
                              type="text"
                              required
                              value={profileForm.inquiriesTitle}
                              onChange={(e) => setProfileForm({ ...profileForm, inquiriesTitle: e.target.value })}
                              className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="bg-white text-black px-8 py-3.5 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-neutral-200 transition-colors"
                      >
                        Save Website Texts
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'gallery' && (
                  /* GALLERY TAB */
                  <div>
                    {!editingPhoto && !isAddingNew ? (
                      /* PHOTO LIST TABLE WITH SUBSECTION MANAGER */
                      <div>
                        {/* Subsection Management Section */}
                        <div className="mb-10 bg-neutral-900/30 border border-white/5 rounded-2xl p-6">
                          <h4 className="text-xs font-semibold text-white tracking-widest uppercase mb-4">Manage Gallery Subsections</h4>
                          
                          {/* Add New Subsection */}
                          <form onSubmit={handleCreateSubsection} className="flex gap-3 mb-6">
                            <input
                              type="text"
                              required
                              placeholder="New Subsection Name (e.g. Travel, Portraits)"
                              value={newSubsectionName}
                              onChange={(e) => setNewSubsectionName(e.target.value)}
                              className="flex-1 bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:border-white focus:outline-none text-white transition-colors"
                            />
                            <button
                              type="submit"
                              className="flex items-center space-x-1.5 bg-white text-black px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create</span>
                            </button>
                          </form>

                          {/* Subsections List with Inline Editing & Bulk Uploading */}
                          {subsections.length === 0 ? (
                            <p className="text-xs text-[#8c8c8c]">No subsections created yet. Create one above to organize your gallery.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {subsections.map((sub, index) => (
                                <div key={sub} className="bg-neutral-950/80 border border-white/5 rounded-xl p-4 flex flex-col justify-between gap-3">
                                  <div className="flex items-center justify-between">
                                    {editingSubsectionIndex === index ? (
                                      <div className="flex items-center gap-2 flex-1 mr-2">
                                        <input
                                          type="text"
                                          value={editingSubsectionName}
                                          onChange={(e) => setEditingSubsectionName(e.target.value)}
                                          className="flex-1 bg-neutral-900 border border-white/20 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-white text-white"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleRenameSubsection(index, editingSubsectionName)}
                                          className="text-emerald-400 hover:text-emerald-300"
                                          title="Save"
                                        >
                                          <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingSubsectionIndex(-1)}
                                          className="text-neutral-500 hover:text-neutral-300"
                                          title="Cancel"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between flex-1">
                                        <span className="text-xs font-bold text-white uppercase tracking-wider">{sub}</span>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingSubsectionIndex(index);
                                              setEditingSubsectionName(sub);
                                            }}
                                            className="text-[#8c8c8c] hover:text-white transition-colors"
                                            title="Rename"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteSubsection(sub)}
                                            className="text-[#8c8c8c] hover:text-rose-500 transition-colors"
                                            title="Delete"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Stats & Bulk Upload */}
                                  <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-[#8c8c8c]">
                                    <span>{photoList.filter(p => p.category === sub).length} frames</span>
                                    
                                    <div>
                                      <label
                                        htmlFor={`bulk-upload-${index}`}
                                        className="flex items-center space-x-1 cursor-pointer bg-white/5 hover:bg-white/10 text-white border border-white/10 px-2.5 py-1 rounded-md transition-all font-semibold uppercase tracking-wider text-[9px]"
                                      >
                                        <Upload className="w-3 h-3" />
                                        <span>Upload Files</span>
                                      </label>
                                      <input
                                        id={`bulk-upload-${index}`}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => handleBulkImageUpload(e, sub)}
                                        className="hidden"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center mb-6">
                          <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white font-semibold">Gallery Images</h3>
                          <button
                            onClick={startAddPhoto}
                            className="flex items-center space-x-2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Photo</span>
                          </button>
                        </div>

                        <div className="border border-white/5 rounded-2xl overflow-hidden bg-neutral-950/40 max-h-[50vh] overflow-y-auto overflow-x-auto">
                          <table className="w-full border-collapse text-left text-xs text-[#8c8c8c] min-w-[700px] md:min-w-0">
                            <thead className="bg-neutral-900/50 text-[10px] tracking-widest text-white uppercase border-b border-white/5 font-semibold">
                              <tr>
                                <th className="p-4">Frame</th>
                                <th className="p-4">Details</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Highlight</th>
                                <th className="p-4">Size Grid</th>
                                <th className="p-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-light">
                              {photoList.map(photo => (
                                <tr key={photo.id} className="hover:bg-white/5 transition-colors">
                                  <td className="p-4">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-neutral-900">
                                      <img 
                                        src={photo.url} 
                                        alt={photo.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  </td>
                                  <td className="p-4 text-white">
                                    <span className="font-semibold block">{photo.title}</span>
                                    <span className="text-[10px] text-[#8c8c8c] block mt-0.5">{photo.location}</span>
                                  </td>
                                  <td className="p-4">
                                    <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-white rounded-full text-[9px] uppercase tracking-wider font-semibold">
                                      {photo.category}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    {photo.isHighlight === 1 ? (
                                      <span className="px-2.5 py-0.5 bg-white text-black text-[9px] uppercase tracking-wider font-bold rounded">
                                        Yes
                                      </span>
                                    ) : (
                                      <span className="text-neutral-600 font-bold">-</span>
                                    )}
                                  </td>
                                  <td className="p-4 font-mono text-[10px]">
                                    {photo.sizeClass.includes('aspect-[16/9]') 
                                      ? 'Landscape (16:9)' 
                                      : photo.sizeClass.includes('aspect-[9/16]') 
                                      ? 'Portrait (9:16)' 
                                      : photo.sizeClass.includes('col-span-2') && photo.sizeClass.includes('row-span-2')
                                      ? 'Large Featured'
                                      : photo.sizeClass.includes('col-span-2') 
                                      ? 'Double Width' 
                                      : photo.sizeClass.includes('row-span-2') 
                                      ? 'Double Height' 
                                      : 'Standard'}
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                      <button
                                        onClick={() => startEditPhoto(photo)}
                                        className="w-8 h-8 rounded-full border border-white/10 hover:border-white/30 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                                        title="Edit"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeletePhoto(photo.id)}
                                        className="w-8 h-8 rounded-full border border-white/10 hover:border-rose-500/30 flex items-center justify-center text-[#8c8c8c] hover:text-rose-500 transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      /* PHOTO ADD/EDIT FORM */
                      <div>
                        <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-6">
                          {isAddingNew ? 'Add New Photo' : `Edit Frame: ${editingPhoto?.title}`}
                        </h3>
                        <form onSubmit={handleSavePhoto} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Photo Title</label>
                              <input
                                type="text"
                                required
                                value={photoForm.title}
                                onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
                                className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Subsection (Category)</label>
                              <select
                                required
                                value={photoForm.category}
                                onChange={(e) => setPhotoForm({ ...photoForm, category: e.target.value })}
                                className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                              >
                                <option value="" disabled>Select a Subsection</option>
                                {subsections.map(sub => (
                                  <option key={sub} value={sub}>{sub}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Location</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Kyoto, Japan"
                                value={photoForm.location}
                                onChange={(e) => setPhotoForm({ ...photoForm, location: e.target.value })}
                                className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">EXIF Camera Settings</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. 35mm • f/1.8 • 1/500s • ISO 100"
                                value={photoForm.settings}
                                onChange={(e) => setPhotoForm({ ...photoForm, settings: e.target.value })}
                                className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Bento Grid Size Layout</label>
                              <select
                                value={photoForm.sizeClass}
                                onChange={(e) => setPhotoForm({ ...photoForm, sizeClass: e.target.value })}
                                className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                              >
                                <option value="md:col-span-1 md:row-span-1">Standard Card (1x1)</option>
                                <option value="md:col-span-2 md:row-span-1">Double Width Card (2x1)</option>
                                <option value="md:col-span-1 md:row-span-2">Double Height Card (1x2)</option>
                                <option value="md:col-span-2 md:row-span-2">Large Featured Card (2x2)</option>
                                <option value="md:col-span-2 aspect-[16/9] h-auto">Landscape Card (16:9)</option>
                                <option value="md:col-span-1 aspect-[9/16] h-auto">Portrait Card (9:16)</option>
                              </select>
                            </div>
                            <div className="space-y-2 flex flex-col justify-end">
                              <div className="flex items-center space-x-3 bg-neutral-900/40 border border-white/10 rounded-xl px-4 py-3 h-[46px]">
                                <input
                                  type="checkbox"
                                  id="isHighlight"
                                  checked={photoForm.isHighlight === 1}
                                  onChange={(e) => setPhotoForm({ ...photoForm, isHighlight: e.target.checked ? 1 : 0 })}
                                  className="w-4 h-4 bg-neutral-950 border-white/10 rounded focus:ring-0 focus:ring-offset-0 text-white cursor-pointer"
                                />
                                <label htmlFor="isHighlight" className="text-xs text-white cursor-pointer font-medium select-none">
                                  Showcase in Highlights
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                            <div className="md:col-span-8 space-y-2">
                              <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Image URL or Path</label>
                              <input
                                type="text"
                                required
                                placeholder="Unsplash link or path"
                                value={photoForm.url}
                                onChange={(e) => setPhotoForm({ ...photoForm, url: e.target.value })}
                                className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none text-white font-light tracking-wide transition-colors"
                              />
                            </div>
                            <div className="md:col-span-4 space-y-2">
                              <label htmlFor="gallery-photo-upload" className="flex items-center justify-center space-x-2 bg-neutral-900 border border-white/10 hover:border-white text-white px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors w-full text-center">
                                <Upload className="w-4 h-4" />
                                <span>Upload File</span>
                              </label>
                              <input
                                id="gallery-photo-upload"
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'photo')}
                                className="hidden"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            {photoForm.url && (
                              <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-neutral-900 flex-shrink-0">
                                  <img src={photoForm.url} alt="Photo Preview" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[10px] text-[#8c8c8c]">Gallery Image Preview</span>
                              </div>
                            )}
                            <div className="text-[9px] text-[#8c8c8c] max-w-md leading-relaxed">
                              * Note: Recommending images under 1.5MB. Local uploads are saved as base64 data URLs in your local browser storage.
                            </div>
                          </div>

                          <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                            <button
                              type="submit"
                              className="bg-white text-black px-8 py-3.5 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-neutral-200 transition-colors"
                            >
                              {isAddingNew ? 'Create Photo Frame' : 'Save Frame Changes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditingPhoto(null); setIsAddingNew(false); }}
                              className="border border-white/10 hover:border-white text-white px-8 py-3.5 rounded-full font-bold uppercase tracking-widest text-xs transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'settings' && (
                  /* SYSTEM/SETTINGS TAB */
                  <div className="space-y-8">
                    <div>
                      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-2">System Backups</h3>
                      <p className="text-xs text-[#8c8c8c] leading-relaxed max-w-xl font-light">
                        Export your entire layout configuration, including profile settings and photo grid items, as a `.json` backup file. You can load this backup file later to recover your settings.
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-5">
                        <button
                          onClick={handleExportData}
                          className="flex items-center space-x-2 bg-neutral-900 border border-white/10 hover:border-white text-white px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export Database JSON</span>
                        </button>
                        
                        <label htmlFor="import-backup-upload" className="flex items-center space-x-2 bg-neutral-900 border border-white/10 hover:border-white text-white px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          <span>Import Backup JSON</span>
                        </label>
                        <input
                          id="import-backup-upload"
                          type="file"
                          accept=".json"
                          onChange={handleImportData}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-8">
                      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-2">Inquiry Form Email Settings</h3>
                      <p className="text-xs text-[#8c8c8c] leading-relaxed max-w-xl font-light mb-4">
                        To receive form inquiries directly in your email inbox, register your email at <a href="https://web3forms.com/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline font-semibold" data-cursor="pointer">Web3Forms</a> to get a free Access Key, then enter it below.
                      </p>
                      
                      <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                        <div className="space-y-2">
                          <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold block">Web3Forms Access Key</label>
                          <input
                            type="text"
                            placeholder="e.g. 12345678-abcd-1234-abcd-1234567890ab"
                            value={profileForm.web3FormsKey || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, web3FormsKey: e.target.value })}
                            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none tracking-wide text-white transition-colors"
                          />
                        </div>
                        <button
                          type="submit"
                          className="bg-white text-black px-6 py-2.5 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-200 transition-colors"
                        >
                          Save Email Key
                        </button>
                      </form>
                    </div>

                    <div className="border-t border-white/5 pt-8">
                      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-rose-500 mb-2">Reset Site</h3>
                      <p className="text-xs text-[#8c8c8c] leading-relaxed max-w-xl font-light">
                        Wipe all customized changes from `localStorage` and restore the site to its original design template presets (the cinematic travel theme). This action is permanent.
                      </p>
                      
                      <button
                        onClick={handleReset}
                        className="flex items-center space-x-2 bg-rose-950/20 border border-rose-500/20 hover:border-rose-500 text-rose-400 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest mt-5 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Restore Defaults</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Exit & Logout Links */}
              <div className="flex flex-col gap-3 border-t border-white/10 mt-8 pt-4 w-full">
                <button
                  onClick={onClose}
                  className="flex md:hidden items-center justify-center space-x-2 text-xs uppercase tracking-widest text-[#8c8c8c] hover:text-white py-3 w-full"
                >
                  <X className="w-4 h-4" />
                  <span>Exit Admin Console</span>
                </button>
                <button
                  onClick={onLogout}
                  className="flex md:hidden items-center justify-center space-x-2 text-xs uppercase tracking-widest text-rose-500 hover:text-rose-400 py-3 w-full"
                >
                  <Lock className="w-4 h-4" />
                  <span>Logout Admin</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modals */}
      <AnimatePresence>
        {photoToDelete && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-neutral-950 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="space-y-2">
                <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">Confirm Deletion</h3>
                <p className="text-xs text-[#8c8c8c] leading-relaxed">
                  Are you sure you want to permanently delete the photo <strong className="text-white">"{photoToDelete.title}"</strong>? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    const updatedPhotos = photoList.filter(p => String(p.id) !== String(photoToDelete.id));
                    onUpdatePhotos(updatedPhotos);
                    triggerSuccess('Photo deleted successfully.');
                    if (editingPhoto && String(editingPhoto.id) === String(photoToDelete.id)) {
                      setEditingPhoto(null);
                    }
                    setPhotoToDelete(null);
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-colors cursor-pointer animate-none"
                >
                  Delete Photo
                </button>
                <button
                  onClick={() => setPhotoToDelete(null)}
                  className="flex-1 border border-white/10 hover:border-white text-white py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {subsectionToDelete && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-neutral-950 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="space-y-2">
                <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">Delete Subsection</h3>
                <p className="text-xs text-[#8c8c8c] leading-relaxed">
                  Are you sure you want to delete the subsection <strong className="text-white">"{subsectionToDelete}"</strong>? Existing photos in this subsection will have their category cleared.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    const updated = subsections.filter(s => s !== subsectionToDelete);
                    onUpdateSubsections(updated);
                    
                    const updatedPhotos = photoList.map(photo => 
                      photo.category === subsectionToDelete ? { ...photo, category: '' } : photo
                    );
                    onUpdatePhotos(updatedPhotos);
                    
                    triggerSuccess(`Subsection "${subsectionToDelete}" deleted.`);
                    setSubsectionToDelete(null);
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-colors cursor-pointer"
                >
                  Delete Subsection
                </button>
                <button
                  onClick={() => setSubsectionToDelete(null)}
                  className="flex-1 border border-white/10 hover:border-white text-white py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isResetConfirmOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-neutral-950 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="space-y-2">
                <h3 className="font-display text-lg font-bold text-rose-500 uppercase tracking-wider">Restore Defaults</h3>
                <p className="text-xs text-[#8c8c8c] leading-relaxed">
                  WARNING: This will wipe all custom changes and restore original defaults. Are you sure you want to proceed?
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    onResetDefaults();
                    triggerSuccess('Restored site database defaults.');
                    setEditingPhoto(null);
                    setIsAddingNew(false);
                    setIsResetConfirmOpen(false);
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-colors cursor-pointer"
                >
                  Restore Defaults
                </button>
                <button
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="flex-1 border border-white/10 hover:border-white text-white py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
