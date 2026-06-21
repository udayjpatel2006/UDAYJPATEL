import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Set large limit to handle Base64 image payload sizes
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

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

  // Create photos table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY,
      title TEXT,
      category TEXT,
      location TEXT,
      url TEXT,
      sizeClass TEXT,
      settings TEXT
    )
  `);

  // Create subsections table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS subsections (
      name TEXT PRIMARY KEY
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
      gallerySubtitle: "Curated collection of frames"
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
      }
    ];

    const stmt = await db.prepare('INSERT INTO photos (id, title, category, location, url, sizeClass, settings) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const photo of defaultPhotos) {
      await stmt.run(photo.id, photo.title, photo.category, photo.location, photo.url, photo.sizeClass, photo.settings);
    }
    await stmt.finalize();
  }
}

// ---------------- API ENDPOINTS ----------------

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
app.post('/api/profile', async (req, res) => {
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
app.post('/api/photos', async (req, res) => {
  try {
    const photos = req.body;
    
    // DB transaction for write safety
    await db.exec('BEGIN TRANSACTION');
    try {
      await db.run('DELETE FROM photos');
      
      const stmt = await db.prepare('INSERT INTO photos (id, title, category, location, url, sizeClass, settings) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const p of photos) {
        await stmt.run(p.id, p.title, p.category, p.location, p.url, p.sizeClass, p.settings);
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
app.post('/api/subsections', async (req, res) => {
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

// Production: Catch-all to serve react application client
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize and Listen
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`[LOG] [${new Date().toISOString()}] Backend server listening on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error(`[CRITICAL ERROR] [${new Date().toISOString()}] Failed to start database/server:`, err);
});
