import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dmrcwtzib',
  api_key: process.env.CLOUDINARY_API_KEY || '689444139574263',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'YeNGtw1j9Xr7-Lj3TiN_hf6ICfk'
});

const app = express();
const PORT = process.env.PORT || 5000;

// Secure PBKDF2 Hashing Helpers
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedValue) {
  if (!storedValue || !storedValue.includes(':')) return false;
  const [salt, originalHash] = storedValue.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

// Enforce HTTPS middleware in production
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// Configure Helmet with Vite-friendly Content Security Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://*.unsplash.com"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));

// Set up rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes.' }
});

// Apply rate limiters to API routes
app.use('/api/', generalLimiter);
app.use('/api/login', loginLimiter);

app.use(cors());
// Set large limit to handle Base64 image payload sizes
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

// Serve uploaded images from 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static assets from 'dist' in production
app.use(express.static(path.join(__dirname, 'dist')));

// No-cache header middleware to prevent stale loads
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

let db;

async function migrateBase64ToFiles(db) {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 1. Migrate profile settings photo
  try {
    const profilePhotoRow = await db.get("SELECT value FROM profile_settings WHERE key = 'photoUrl'");
    if (profilePhotoRow && profilePhotoRow.value && profilePhotoRow.value.startsWith('data:image/')) {
      const dataUrl = profilePhotoRow.value;
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        let extension = 'jpg';
        if (mimeType.includes('png')) extension = 'png';
        else if (mimeType.includes('webp')) extension = 'webp';
        
        const filename = `profile-${Date.now()}.${extension}`;
        fs.writeFileSync(path.join(uploadsDir, filename), buffer);
        
        const newUrl = `/uploads/${filename}`;
        await db.run("UPDATE profile_settings SET value = ? WHERE key = 'photoUrl'", [newUrl]);
        console.log(`[MIGRATION] Migrated profile photo to disk: ${newUrl}`);
      }
    }
  } catch (err) {
    console.error('[MIGRATION ERROR] Profile photo migration failed:', err);
  }

  // 2. Migrate photos database
  try {
    const photos = await db.all("SELECT id, title, url FROM photos");
    let migratedCount = 0;
    for (const photo of photos) {
      if (photo.url && photo.url.startsWith('data:image/')) {
        const dataUrl = photo.url;
        const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          let extension = 'jpg';
          if (mimeType.includes('png')) extension = 'png';
          else if (mimeType.includes('webp')) extension = 'webp';
          
          const cleanTitle = (photo.title || 'photo').replace(/[^A-Za-z0-9]/g, '_').substring(0, 30);
          const filename = `${cleanTitle}-${photo.id}-${Date.now()}.${extension}`;
          fs.writeFileSync(path.join(uploadsDir, filename), buffer);
          
          const newUrl = `/uploads/${filename}`;
          await db.run("UPDATE photos SET url = ? WHERE id = ?", [newUrl, photo.id]);
          migratedCount++;
        }
      }
    }
    if (migratedCount > 0) {
      console.log(`[MIGRATION] Migrated ${migratedCount} photos from Base64 to disk files.`);
    }
  } catch (err) {
    console.error('[MIGRATION ERROR] Photos table migration failed:', err);
  }
}

async function initDb() {
  const dbPath = path.join(__dirname, 'database.sqlite');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  console.log(`[LOG] [${new Date().toISOString()}] SQLite database opened successfully at: ${dbPath}`);

  // Create profile_settings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS profile_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Create admin_auth table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admin_auth (
      username TEXT PRIMARY KEY,
      password_hash TEXT
    )
  `);

  // Seed default admin password if empty
  const adminCount = await db.get('SELECT COUNT(*) as count FROM admin_auth');
  if (adminCount.count === 0) {
    const defaultHash = hashPassword(process.env.ADMIN_PASSCODE || 'admin');
    await db.run('INSERT INTO admin_auth (username, password_hash) VALUES (?, ?)', ['admin', defaultHash]);
    console.log('[LOG] Default admin credentials seeded successfully into SQLite.');
  }

  // Create photos table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY,
      title TEXT,
      category TEXT,
      location TEXT,
      url TEXT,
      sizeClass TEXT,
      settings TEXT,
      isHighlight INTEGER DEFAULT 0,
      position INTEGER DEFAULT 0
    )
  `);

  // Migrate existing databases to add isHighlight if it doesn't exist
  try {
    await db.exec(`ALTER TABLE photos ADD COLUMN isHighlight INTEGER DEFAULT 0`);
    console.log('[LOG] Migration: Added isHighlight column to photos table');
  } catch (err) {
    if (!err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
      console.error('[ERROR] Failed to run migration for photos table (isHighlight):', err);
    }
  }

  // Migrate existing databases to add position if it doesn't exist
  try {
    await db.exec(`ALTER TABLE photos ADD COLUMN position INTEGER DEFAULT 0`);
    console.log('[LOG] Migration: Added position column to photos table');
  } catch (err) {
    if (!err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
      console.error('[ERROR] Failed to run migration for photos table (position):', err);
    }
  }

  // Create subsections table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS subsections (
      name TEXT PRIMARY KEY
    )
  `);

  // Create inquiries table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      message TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default values if tables are completely empty
  const profileCount = await db.get('SELECT COUNT(*) as count FROM profile_settings');
  if (profileCount.count === 0) {
    console.log('[LOG] Seeding default profile settings into SQLite...');
    const defaultProfile = {
      name: "UDAYJPATEL",
      tagline: "Cinematic Travel & Adventure Photographer",
      titleLine1: "Warm Light,",
      titleLine2: "Remote Trails.",
      description: "Odyssey documents the raw beauty of our world—from sun-drenched European alleys and mist-shrouded peaks to quiet moments in distant lands. Each frame is a story of exploration, rich colors, and warm atmospheric light.",
      email: "contact@udayjpatel.com",
      photoUrl: "",
      location: "Chamonix, FR",
      instaUrl: "https://www.instagram.com/uday_j_patel_/",
      aboutTitle: "Chasing the golden hour across distant horizons.",
      aboutPara1: "Every journey is a search for connection. As a visual storyteller, I believe the most profound travel photographs aren't just of places, but of feelings. My lens documents the warmth of the sun on ancient stone, the vastness of quiet wilderness, and the stories written on the faces of people I meet along the way.",
      aboutPara2: "By embracing rich color grading, warm shadows, and authentic moments, each image becomes an invitation to wander. Through {name}'s lens, we traverse the boundary between the familiar and the wild, celebrating the rich storytelling built directly into the fabric of our world.",
      inquiriesTitle: "Let's capture the next adventure.",
      galleryTitle: "Visual Archive",
      gallerySubtitle: "Curated collection of frames",
      highlightsTitle: "Featured Highlights",
      highlightsSubtitle: "Curated Selection",
      web3FormsKey: ""
    };

    const stmt = await db.prepare('INSERT INTO profile_settings (key, value) VALUES (?, ?)');
    for (const [key, val] of Object.entries(defaultProfile)) {
      await stmt.run(key, val);
    }
    await stmt.finalize();
  }

  const subsectionsCount = await db.get('SELECT COUNT(*) as count FROM subsections');
  if (subsectionsCount.count === 0) {
    console.log('[LOG] Seeding default subsections into SQLite...');
    const defaultSubsections = ["Landscapes", "Sunsets", "Portraits", "Streets"];
    const stmt = await db.prepare('INSERT INTO subsections (name) VALUES (?)');
    for (const sub of defaultSubsections) {
      await stmt.run(sub);
    }
    await stmt.finalize();
  }

  const photosCount = await db.get('SELECT COUNT(*) as count FROM photos');
  if (photosCount.count === 0) {
    console.log('[LOG] Seeding default photos data into SQLite...');
    const defaultPhotos = [
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
      }
    ];

    const stmt = await db.prepare('INSERT INTO photos (id, title, category, location, url, sizeClass, settings, isHighlight, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const photo of defaultPhotos) {
      await stmt.run(photo.id, photo.title, photo.category, photo.location, photo.url, photo.sizeClass, photo.settings, photo.isHighlight, photo.position || 0);
    }
    await stmt.finalize();
  }

  // Run Base64 to disk files migration on startup
  await migrateBase64ToFiles(db);
}

// ---------------- API ENDPOINTS ----------------

// In-memory store for active session tokens mapping token -> expiration Date
const activeSessions = new Map();

// Helper to clean up expired sessions
setInterval(() => {
  const now = new Date();
  for (const [token, expiry] of activeSessions.entries()) {
    if (now > expiry) {
      activeSessions.delete(token);
    }
  }
}, 60 * 1000);

// Passcode config (defaults to 'admin', can be set via env var)
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin';

// Authentication middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }
  
  const token = authHeader.substring(7);
  const expiry = activeSessions.get(token);
  
  if (!expiry || new Date() > expiry) {
    if (expiry) activeSessions.delete(token);
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }
  
  // Extend session duration on active use (2 hours)
  activeSessions.set(token, new Date(Date.now() + 2 * 60 * 60 * 1000));
  next();
}

// File Upload Endpoint (Uploads Base64 payload to Cloudinary)
app.post('/api/upload', requireAuth, async (req, res) => {
  try {
    const { dataUrl } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ error: 'dataUrl is required.' });
    }
    
    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(dataUrl, {
      folder: 'portfolio',
      resource_type: 'auto'
    });
    
    // Return the secure URL from Cloudinary
    res.json({ success: true, url: uploadResponse.secure_url });
  } catch (err) {
    console.error('[ERROR] Failed to upload image to Cloudinary:', err);
    res.status(500).json({ error: `Cloudinary upload failed: ${err.message || err}` });
  }
});

// Admin login endpoint
app.post('/api/login', async (req, res) => {
  const { passcode } = req.body;
  try {
    const adminRecord = await db.get('SELECT password_hash FROM admin_auth WHERE username = ?', ['admin']);
    if (adminRecord && verifyPassword(passcode, adminRecord.password_hash)) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 2 * 60 * 60 * 1000);
      activeSessions.set(token, expiry);
      res.json({ success: true, token });
    } else {
      res.status(401).json({ error: 'Invalid passcode' });
    }
  } catch (err) {
    console.error('[ERROR] Login handler database query failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Store password reset tokens in memory with an expiration time
const resetTokens = new Map();

// Change Password Endpoint (Requires Authentication)
app.post('/api/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  // Enforce strong password complexity policy
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!strongPasswordRegex.test(newPassword)) {
    return res.status(400).json({ 
      error: 'New password does not meet complexity requirements: Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character.' 
    });
  }

  try {
    const adminRecord = await db.get('SELECT password_hash FROM admin_auth WHERE username = ?', ['admin']);
    if (!adminRecord || !verifyPassword(currentPassword, adminRecord.password_hash)) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    const newHash = hashPassword(newPassword);
    await db.run('UPDATE admin_auth SET password_hash = ? WHERE username = ?', [newHash, 'admin']);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('[ERROR] Change password database update failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot Password Endpoint (Sends reset link / Developer console fallback)
app.post('/api/forgot-password', async (req, res) => {
  try {
    const profileEmailRow = await db.get("SELECT value FROM profile_settings WHERE key = 'email'");
    const adminEmail = profileEmailRow ? profileEmailRow.value : null;

    const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT } = process.env;
    const isEmailEnabled = !!(SMTP_HOST && SMTP_USER && SMTP_PASS && adminEmail);

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity
    resetTokens.set(token, { expiry, username: 'admin' });

    const origin = req.headers.origin || 'http://localhost:3000';
    const resetLink = `${origin}/admin?resetToken=${token}`;

    if (!isEmailEnabled) {
      // Developer testing fallback: log to console and inform client
      console.log(`\n==================================================`);
      console.log(`[DEV ONLY] [PASSWORD RESET LINK]: ${resetLink}`);
      console.log(`==================================================\n`);

      return res.json({ 
        success: true, 
        message: 'Email service is not configured. Since you are running in local/development mode, the password reset link is provided below:',
        resetLink: resetLink
      });
    }

    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587', 10),
      secure: parseInt(SMTP_PORT || '587', 10) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: SMTP_USER,
      to: adminEmail,
      subject: 'Password Reset Request - Portfolio Admin',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="font-weight: 600; color: #111;">Password Reset Request</h2>
          <p>You requested a password reset for your photography portfolio admin account.</p>
          <p>Please click the button below to reset your password. This link is valid for 15 minutes.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>If you did not request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #888;">Portfolio Admin Service</p>
        </div>
      `
    });

    res.json({ success: true, message: 'Password reset link sent to your registered email address.' });
  } catch (err) {
    console.error('[ERROR] Forgot password handler failed:', err);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// Reset Password Endpoint
app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Reset token and new password are required.' });
  }

  const tokenData = resetTokens.get(token);
  if (!tokenData || new Date() > tokenData.expiry) {
    if (tokenData) resetTokens.delete(token);
    return res.status(400).json({ error: 'Invalid or expired password reset token.' });
  }

  // Enforce strong password complexity policy
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!strongPasswordRegex.test(newPassword)) {
    return res.status(400).json({ 
      error: 'New password does not meet complexity requirements: Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character.' 
    });
  }

  try {
    const newHash = hashPassword(newPassword);
    await db.run('UPDATE admin_auth SET password_hash = ? WHERE username = ?', [newHash, tokenData.username]);
    resetTokens.delete(token);
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    console.error('[ERROR] Reset password database update failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all data (Profile, Photos, Subsections)
app.get('/api/data', async (req, res) => {
  try {
    const profileRows = await db.all('SELECT * FROM profile_settings');
    const profileData = {};
    profileRows.forEach(row => {
      profileData[row.key] = row.value;
    });

    const photoList = await db.all('SELECT * FROM photos ORDER BY id ASC');
    const subsectionRows = await db.all('SELECT * FROM subsections');
    const subsections = subsectionRows.map(row => row.name);

    res.json({
      profileData,
      photoList,
      subsections
    });
  } catch (error) {
    console.error(`[ERROR] [${new Date().toISOString()}] Failed to fetch data:`, error);
    res.status(500).json({ error: 'Failed to fetch data from database' });
  }
});

// Update profile setting keys
app.post('/api/profile', requireAuth, async (req, res) => {
  try {
    const profile = req.body;
    const stmt = await db.prepare('INSERT OR REPLACE INTO profile_settings (key, value) VALUES (?, ?)');
    for (const [key, val] of Object.entries(profile)) {
      await stmt.run(key, val);
    }
    await stmt.finalize();
    res.json({ success: true, message: 'Profile updated in database' });
  } catch (error) {
    console.error(`[ERROR] [${new Date().toISOString()}] Failed to update profile settings:`, error);
    res.status(500).json({ error: 'Failed to update profile settings in database' });
  }
});

// Sync complete photo dataset
app.post('/api/photos', requireAuth, async (req, res) => {
  try {
    const photos = req.body;
    
    // DB transaction for write safety
    await db.exec('BEGIN TRANSACTION');
    try {
      await db.run('DELETE FROM photos');
      
      const stmt = await db.prepare('INSERT INTO photos (id, title, category, location, url, sizeClass, settings, isHighlight, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const p of photos) {
        await stmt.run(p.id, p.title, p.category, p.location, p.url, p.sizeClass, p.settings, p.isHighlight || 0, p.position || 0);
      }
      await stmt.finalize();
      await db.exec('COMMIT');
      res.json({ success: true, message: 'Photos database synchronized' });
    } catch (err) {
      await db.exec('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error(`[ERROR] [${new Date().toISOString()}] Failed to sync photos list:`, error);
    res.status(500).json({ error: 'Failed to save photos list in database' });
  }
});

// Sync complete subsections list
app.post('/api/subsections', requireAuth, async (req, res) => {
  try {
    const subsections = req.body;
    await db.exec('BEGIN TRANSACTION');
    try {
      await db.run('DELETE FROM subsections');
      const stmt = await db.prepare('INSERT INTO subsections (name) VALUES (?)');
      for (const sub of subsections) {
        await stmt.run(sub);
      }
      await stmt.finalize();
      await db.exec('COMMIT');
      res.json({ success: true, message: 'Subsections database synchronized' });
    } catch (err) {
      await db.exec('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error(`[ERROR] [${new Date().toISOString()}] Failed to sync subsections list:`, error);
    res.status(500).json({ error: 'Failed to save subsections list in database' });
  }
});

// Save client proposal inquiries
app.post('/api/inquiries', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    const stmt = await db.prepare('INSERT INTO inquiries (name, email, message) VALUES (?, ?, ?)');
    await stmt.run(name, email, message);
    await stmt.finalize();
    res.json({ success: true, message: 'Proposal submitted successfully!' });
  } catch (error) {
    console.error(`[ERROR] [${new Date().toISOString()}] Failed to submit inquiry:`, error);
    res.status(500).json({ error: 'Failed to save inquiry in database' });
  }
});

// Production: Catch-all to serve react application client
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize database connection using top-level await
try {
  await initDb();
  console.log(`[LOG] [${new Date().toISOString()}] Database initialized successfully.`);
} catch (err) {
  console.error(`[CRITICAL ERROR] [${new Date().toISOString()}] Failed to start database:`, err);
}

// Only listen on port if not running in a serverless environment (Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[LOG] [${new Date().toISOString()}] Backend server listening on http://localhost:${PORT}`);
  });
}

// Export the Express app as the default handler for Vercel
export default app;
