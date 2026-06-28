import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Edit3, Plus, RotateCcw, Download, Upload, Lock, Unlock, Check, Image } from 'lucide-react';
import { processAndCorrectImage } from '../utils/imageProcessor';

const TablePositionInput = ({ photo, photoList, onUpdatePhotos }) => {
  const [val, setVal] = useState(photo.position !== undefined && photo.position !== null ? photo.position : '');
  
  useEffect(() => {
    setVal(photo.position !== undefined && photo.position !== null ? photo.position : '');
  }, [photo.position]);

  const handleSave = () => {
    const parsed = parseInt(val, 10);
    const newPos = isNaN(parsed) ? 0 : parsed;
    if (newPos !== photo.position) {
      const updated = photoList.map(p => 
        String(p.id) === String(photo.id) ? { ...p, position: newPos } : p
      );
      onUpdatePhotos(updated);
    }
  };

  return (
    <input
      type="number"
      min={0}
      max={999}
      value={val}
      placeholder="-"
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleSave();
          e.target.blur();
        }
      }}
      className="w-16 bg-neutral-900 border border-white/10 rounded px-2 py-1 text-xs text-center text-white focus:outline-none focus:border-white font-mono"
    />
  );
};

const TableHighlightInput = ({ photo, photoList, onUpdatePhotos }) => {
  const isHighlightActive = photo.isHighlight > 0;
  const [val, setVal] = useState(photo.isHighlight || '');

  useEffect(() => {
    setVal(photo.isHighlight || '');
  }, [photo.isHighlight]);

  const handleSave = (newVal) => {
    const parsed = parseInt(newVal, 10);
    const newHighlight = isNaN(parsed) ? 0 : parsed;
    if (newHighlight !== photo.isHighlight) {
      const updated = photoList.map(p => 
        String(p.id) === String(photo.id) ? { ...p, isHighlight: newHighlight } : p
      );
      onUpdatePhotos(updated);
    }
  };

  const handleToggle = (checked) => {
    const newHighlight = checked ? 1 : 0;
    setVal(newHighlight || '');
    const updated = photoList.map(p => 
      String(p.id) === String(photo.id) ? { ...p, isHighlight: newHighlight } : p
    );
    onUpdatePhotos(updated);
  };

  return (
    <div className="flex items-center gap-2 justify-center">
      <input
        type="checkbox"
        checked={isHighlightActive}
        onChange={(e) => handleToggle(e.target.checked)}
        className="w-3.5 h-3.5 bg-neutral-950 border-white/10 rounded text-white cursor-pointer"
      />
      {isHighlightActive && (
        <input
          type="number"
          min={1}
          max={50}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => handleSave(val)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave(val);
              e.target.blur();
            }
          }}
          className="w-12 bg-neutral-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-center text-white focus:outline-none focus:border-white font-mono"
        />
      )}
    </div>
  );
};

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
  const [isUploading, setIsUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');

  // Password reset and management states
  const [loginView, setLoginView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [resetToken, setResetToken] = useState('');
  const [forgotEmailSuccess, setForgotEmailSuccess] = useState('');
  const [forgotEmailError, setForgotEmailError] = useState('');
  const [devResetLink, setDevResetLink] = useState('');
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');

  // Change password states
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken');
    if (token) {
      setResetToken(token);
      setLoginView('reset');
    }
  }, []);

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
    isHighlight: 0,
    position: 0
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

  // Handle Admin Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordRegex.test(passwordForm.newPassword)) {
      setPasswordError('New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPasswordSuccess('Password updated successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setPasswordError(err.message || 'Error updating password.');
    }
  };

  // Handle Forgot Password Form Submission
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotEmailError('');
    setForgotEmailSuccess('');

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset link');
      }

      setForgotEmailSuccess(data.message || 'Reset link sent successfully!');
      if (data.resetLink) {
        setDevResetLink(data.resetLink);
      }
    } catch (err) {
      setForgotEmailError(err.message || 'Error processing forgot password request.');
    }
  };

  // Handle Reset Password Form Submission
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetPasswordError('');
    setResetPasswordSuccess('');

    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      setResetPasswordError('Passwords do not match.');
      return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordRegex.test(resetPasswordForm.newPassword)) {
      setResetPasswordError('Password must be at least 8 characters long and contain at least one uppercase, one lowercase, one number, and one special character.');
      return;
    }

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: resetPasswordForm.newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setResetPasswordSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        setLoginView('login');
        setResetPasswordForm({ newPassword: '', confirmPassword: '' });
        window.history.replaceState({}, '', '/admin');
      }, 2000);
    } catch (err) {
      setResetPasswordError(err.message || 'Failed to reset password.');
    }
  };

  // Convert and handle direct local image uploads as Base64 strings with compression and EXIF metadata extraction, sending files to disk storage
  const handleImageUpload = async (e, targetForm) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1048576 * 25) {
        alert("Warning: This file exceeds 25MB. Please choose a smaller image.");
        return;
      }

      setIsUploading(true);
      try {
        const result = await processAndCorrectImage(file);
        
        // Upload the corrected base64 to server
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            dataUrl: result.dataUrl,
            filename: file.name
          })
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Failed to upload image file to server');
        }
        const fileUrl = uploadData.url;
        
        if (targetForm === 'profile') {
          setProfileForm(prev => ({ ...prev, photoUrl: fileUrl }));
          triggerSuccess('Profile image uploaded and optimized successfully!');
        } else if (targetForm === 'photo') {
          setPhotoForm(prev => ({ 
            ...prev, 
            url: fileUrl,
            settings: result.settings
          }));
          triggerSuccess('Gallery image uploaded and optimized successfully!');
        }
      } catch (error) {
        console.error('Failed to process image:', error);
        alert(`Failed to load and correct the image:\n\n${error.message || error}`);
      } finally {
        setIsUploading(false);
      }
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
      isHighlight: photo.isHighlight || 0,
      position: photo.position || 0
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
      isHighlight: 0,
      position: 0
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

  const handleBulkImageUpload = async (e, category) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setIsUploading(true);
    const oversizedFiles = files.filter(f => f.size > 1048576 * 25);
    if (oversizedFiles.length > 0) {
      alert("Some files exceed 25MB and were skipped.");
    }
    
    const validFiles = files.filter(f => f.size <= 1048576 * 25);
    const loadedPhotos = [];
    const errors = [];
    
    // Process all valid files concurrently
    await Promise.all(validFiles.map(async (file) => {
      try {
        const result = await processAndCorrectImage(file);
        const title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        
        // Upload the corrected base64 to server
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            dataUrl: result.dataUrl,
            filename: file.name
          })
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Upload failed');
        }
        const fileUrl = uploadData.url;

        loadedPhotos.push({
          title: title,
          category: category,
          location: profileData.location || "Available Worldwide",
          url: fileUrl,
          sizeClass: 'md:col-span-1 md:row-span-1',
          settings: result.settings
        });
      } catch (err) {
        console.error(`Failed to process ${file.name}:`, err);
        errors.push(`${file.name}: ${err.message || 'Unknown processing error'}`);
      }
    }));
    
    setIsUploading(false);
    
    if (errors.length > 0) {
      alert(`The following images could not be corrected and were not uploaded:\n\n${errors.join('\n')}`);
    }
    
    if (loadedPhotos.length > 0) {
      let currentPhotos = [...photoList];
      let startId = currentPhotos.length > 0 ? Math.max(...currentPhotos.map(p => p.id)) + 1 : 1;
      
      const newPhotosWithIds = loadedPhotos.map((p, idx) => ({
        id: startId + idx,
        ...p
      }));
      
      onUpdatePhotos([...currentPhotos, ...newPhotosWithIds]);
      triggerSuccess(`Successfully uploaded and corrected ${newPhotosWithIds.length} images into "${category}"!`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl md:px-4 md:py-8 overflow-y-auto">
      {isUploading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex flex-col items-center justify-center space-y-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-white animate-spin"></div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-white font-medium text-xs tracking-[0.2em] uppercase">Processing Images</p>
            <p className="text-[#8c8c8c] text-[10px] uppercase tracking-wider font-light">Correcting orientation & optimizing...</p>
          </div>
        </div>
      )}
      <AnimatePresence>
        {!isLoggedIn ? (
          loginView === 'reset' ? (
            /* Reset Password Dialog */
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="w-full max-w-md bg-neutral-950 border border-white/10 rounded-3xl p-8 shadow-2xl relative mx-4 md:mx-0"
              key="reset-view"
            >
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-[#8c8c8c] hover:text-white transition-colors duration-300"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 mb-4">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-white uppercase">Reset Password</h2>
                <p className="text-xs text-[#8c8c8c] mt-1 text-center font-light">Set a strong new passcode for your account</p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold block">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={resetPasswordForm.newPassword}
                    onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none tracking-wide text-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold block">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={resetPasswordForm.confirmPassword}
                    onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none tracking-wide text-white transition-colors"
                  />
                </div>

                {resetPasswordError && (
                  <p className="text-xs text-rose-500 font-light text-center">{resetPasswordError}</p>
                )}
                {resetPasswordSuccess && (
                  <p className="text-xs text-emerald-500 font-light text-center">{resetPasswordSuccess}</p>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-white hover:bg-neutral-200 text-black py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors w-full text-center"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginView('login');
                      setDevResetLink('');
                      window.history.replaceState({}, '', '/admin');
                    }}
                    className="flex-1 bg-transparent hover:bg-white/5 border border-white/10 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors w-full text-center"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          ) : loginView === 'forgot' ? (
            /* Forgot Password Dialog */
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="w-full max-w-md bg-neutral-950 border border-white/10 rounded-3xl p-8 shadow-2xl relative mx-4 md:mx-0"
              key="forgot-view"
            >
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-[#8c8c8c] hover:text-white transition-colors duration-300"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 mb-4">
                  <Image className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-white uppercase">Forgot Password</h2>
                <p className="text-xs text-[#8c8c8c] mt-1 text-center font-light">Send a password reset link to your registered email</p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                <p className="text-xs text-[#8c8c8c] leading-relaxed text-center font-light">
                  For security, we will send a password reset link to the registered administrator email address associated with this portfolio.
                </p>

                {forgotEmailError && (
                  <p className="text-xs text-rose-500 font-light text-center">{forgotEmailError}</p>
                )}
                {forgotEmailSuccess && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3">
                    <p className="text-xs text-emerald-400 font-light text-center leading-relaxed">
                      {forgotEmailSuccess}
                    </p>
                    {devResetLink && (
                      <div className="text-center pt-2">
                        <a
                          href={devResetLink}
                          className="inline-block bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-lg text-xs font-bold transition-colors w-full text-center"
                        >
                          Go to Reset Password Form
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    className="bg-white hover:bg-neutral-200 text-black py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors w-full text-center"
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginView('login');
                      setDevResetLink('');
                    }}
                    className="bg-transparent hover:bg-white/5 border border-white/10 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors w-full text-center"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            /* Login Dialog */
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="w-full max-w-md bg-neutral-950 border border-white/10 rounded-3xl p-8 shadow-2xl relative mx-4 md:mx-0"
              key="login-view"
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
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold block">Passcode</label>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginView('forgot');
                        setForgotEmailError('');
                        setForgotEmailSuccess('');
                        setDevResetLink('');
                      }}
                      className="text-[10px] tracking-wider text-[#8c8c8c] hover:text-white uppercase transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
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
          )
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
                            accept="image/*,.heic,.HEIC"
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
                                        accept="image/*,.heic,.HEIC"
                                        onChange={(e) => handleBulkImageUpload(e, sub)}
                                        className="hidden"
                                      />
                                    </div>
                                  </div>

                                  {/* Nested photo list for category position ordering */}
                                  <div className="border-t border-white/5 pt-3 mt-2">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Subsection Order</span>
                                    </div>
                                    {photoList.filter(p => p.category === sub).length === 0 ? (
                                      <p className="text-[10px] text-neutral-600 italic">No photos in this subsection yet.</p>
                                    ) : (
                                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                                        {photoList
                                          .filter(p => p.category === sub)
                                          .sort((a, b) => {
                                            const posA = a.position !== undefined && a.position !== null ? a.position : 999;
                                            const posB = b.position !== undefined && b.position !== null ? b.position : 999;
                                            const sortA = posA === 0 ? 999 : posA;
                                            const sortB = posB === 0 ? 999 : posB;
                                            if (sortA !== sortB) return sortA - sortB;
                                            return a.id - b.id;
                                          })
                                          .map(photo => (
                                            <div key={photo.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg p-1.5 hover:bg-white/10 transition-colors">
                                              <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-6 h-6 rounded overflow-hidden border border-white/10 flex-shrink-0 bg-neutral-900">
                                                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-[10px] text-white font-medium truncate max-w-[120px]">{photo.title}</span>
                                              </div>
                                              <TablePositionInput 
                                                photo={photo} 
                                                photoList={photoList} 
                                                onUpdatePhotos={onUpdatePhotos} 
                                              />
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                          <div className="flex items-center gap-4">
                            <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white font-semibold">Gallery Images</h3>
                            <div className="flex items-center gap-2 bg-neutral-900/60 border border-white/10 rounded-xl px-3 py-1.5">
                              <span className="text-[10px] text-[#8c8c8c] uppercase tracking-wider font-semibold">Filter:</span>
                              <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="bg-transparent border-0 focus:ring-0 focus:outline-none text-xs text-white font-medium cursor-pointer"
                              >
                                <option value="All" className="bg-neutral-950">All Subsections</option>
                                {subsections.map(sub => (
                                  <option key={sub} value={sub} className="bg-neutral-950">{sub}</option>
                                ))}
                              </select>
                            </div>
                          </div>
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
                                <th className="p-4 text-center">Highlight Pos</th>
                                <th className="p-4">Size Grid</th>
                                <th className="p-4 text-center">Gallery Pos</th>
                                <th className="p-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-light">
                              {photoList
                                .filter(photo => filterCategory === 'All' || photo.category === filterCategory)
                                .sort((a, b) => {
                                  const posA = a.position !== undefined && a.position !== null ? a.position : 999;
                                  const posB = b.position !== undefined && b.position !== null ? b.position : 999;
                                  const sortA = posA === 0 ? 999 : posA;
                                  const sortB = posB === 0 ? 999 : posB;
                                  if (sortA !== sortB) return sortA - sortB;
                                  return a.id - b.id;
                                })
                                .map(photo => (
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
                                    <td className="p-4 text-center">
                                      <TableHighlightInput 
                                        photo={photo} 
                                        photoList={photoList} 
                                        onUpdatePhotos={onUpdatePhotos} 
                                      />
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
                                    <td className="p-4 text-center">
                                      <TablePositionInput 
                                        photo={photo} 
                                        photoList={photoList} 
                                        onUpdatePhotos={onUpdatePhotos} 
                                      />
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
                              <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Subsection Category & Position</label>
                              <div className="flex items-center gap-3 bg-neutral-900/40 border border-white/10 rounded-xl px-4 py-1.5 h-[50px]">
                                <div className="flex-1">
                                  <select
                                    required
                                    value={photoForm.category}
                                    onChange={(e) => setPhotoForm({ ...photoForm, category: e.target.value })}
                                    className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-xs text-white font-medium select-none cursor-pointer"
                                  >
                                    <option value="" disabled className="bg-neutral-950">Select Category</option>
                                    {subsections.map(sub => (
                                      <option key={sub} value={sub} className="bg-neutral-950">{sub}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex items-center space-x-2 ml-auto">
                                  <span className="text-[10px] text-[#8c8c8c] uppercase font-semibold">Position:</span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={999}
                                    value={photoForm.position !== undefined && photoForm.position !== null ? photoForm.position : ''}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      setPhotoForm({ ...photoForm, position: isNaN(val) ? 0 : val });
                                    }}
                                    className="w-16 bg-neutral-950 border border-white/10 rounded px-2 py-1 text-xs text-center text-white focus:outline-none focus:border-white font-mono"
                                  />
                                </div>
                              </div>
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
                            <div className="space-y-2">
                              <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold">Highlights Setting</label>
                              <div className="flex items-center gap-3 bg-neutral-900/40 border border-white/10 rounded-xl px-4 py-1.5 h-[50px]">
                                <label htmlFor="isHighlight" className="flex items-center space-x-2.5 text-xs text-white cursor-pointer font-medium select-none">
                                  <input
                                    type="checkbox"
                                    id="isHighlight"
                                    checked={photoForm.isHighlight > 0}
                                    onChange={(e) => {
                                      const isChecked = e.target.checked;
                                      setPhotoForm({ ...photoForm, isHighlight: isChecked ? 1 : 0 });
                                    }}
                                    className="w-4 h-4 bg-neutral-950 border-white/10 rounded focus:ring-0 focus:ring-offset-0 text-white cursor-pointer"
                                  />
                                  <span>Showcase in Highlights</span>
                                </label>
                                {photoForm.isHighlight > 0 && (
                                  <div className="flex items-center space-x-2 ml-auto">
                                    <span className="text-[10px] text-[#8c8c8c] uppercase font-semibold">Position:</span>
                                    <input
                                      type="number"
                                      min={1}
                                      max={50}
                                      value={photoForm.isHighlight}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value, 10) || 1;
                                        setPhotoForm({ ...photoForm, isHighlight: Math.max(1, val) });
                                      }}
                                      className="w-14 bg-neutral-950 border border-white/10 rounded px-2 py-1 text-xs text-center text-white focus:outline-none focus:border-white font-mono"
                                    />
                                  </div>
                                )}
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
                                accept="image/*,.heic,.HEIC"
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
                      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-2">Change Password</h3>
                      <p className="text-xs text-[#8c8c8c] leading-relaxed max-w-xl font-light mb-4">
                        Update your administrator passcode. Strong passwords require at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.
                      </p>
                      
                      <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                        <div className="space-y-2">
                          <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold block">Current Password</label>
                          <input
                            type="password"
                            required
                            placeholder="Enter current password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none tracking-wide text-white transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold block">New Password</label>
                          <input
                            type="password"
                            required
                            placeholder="Enter new password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none tracking-wide text-white transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] tracking-widest text-[#8c8c8c] uppercase font-semibold block">Confirm New Password</label>
                          <input
                            type="password"
                            required
                            placeholder="Confirm new password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white focus:outline-none tracking-wide text-white transition-colors"
                          />
                        </div>
                        {passwordError && (
                          <p className="text-xs text-rose-500 font-light">{passwordError}</p>
                        )}
                        {passwordSuccess && (
                          <p className="text-xs text-emerald-500 font-light">{passwordSuccess}</p>
                        )}
                        <button
                          type="submit"
                          className="bg-white text-black px-6 py-2.5 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-200 transition-colors"
                        >
                          Update Password
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
