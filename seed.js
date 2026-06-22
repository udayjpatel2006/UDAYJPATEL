const sqlite = require('sqlite3');
const db = new sqlite.Database('database.sqlite');
const defaultPhotos = [
  {
    id: 1,
    title: 'Alpenglow Peaks',
    category: 'Landscapes',
    location: 'Dolomites, Italy',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
    sizeClass: 'md:col-span-2 md:row-span-1',
    settings: '28mm • f/4.0 • 1/200s • ISO 100',
    isHighlight: 1
  },
  {
    id: 2,
    title: 'Amalfi Golden Hour',
    category: 'Sunsets',
    location: 'Positano, Italy',
    url: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop',
    sizeClass: 'md:col-span-1 md:row-span-2',
    settings: '35mm • f/2.0 • 1/400s • ISO 100',
    isHighlight: 1
  },
  {
    id: 3,
    title: "The Nomad's Gaze",
    category: 'Portraits',
    location: 'Sahara, Morocco',
    url: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1200&auto=format&fit=crop',
    sizeClass: 'md:col-span-1 md:row-span-1',
    settings: '85mm • f/1.4 • 1/1250s • ISO 100',
    isHighlight: 1
  },
  {
    id: 4,
    title: "Vicolo de' Fiori",
    category: 'Streets',
    location: 'Rome, Italy',
    url: 'https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?q=80&w=1200&auto=format&fit=crop',
    sizeClass: 'md:col-span-2 md:row-span-2',
    settings: '50mm • f/1.8 • 1/320s • ISO 200',
    isHighlight: 0
  },
  {
    id: 5,
    title: 'Cappadocia Sunrise',
    category: 'Sunsets',
    location: 'Anatolia, Turkey',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200&auto=format&fit=crop',
    sizeClass: 'md:col-span-1 md:row-span-1',
    settings: '24mm • f/2.8 • 1/500s • ISO 100',
    isHighlight: 0
  },
  {
    id: 6,
    title: 'Neon Trails',
    category: 'Streets',
    location: 'Shinjuku, Japan',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop',
    sizeClass: 'md:col-span-1 md:row-span-1',
    settings: '35mm • f/2.8 • 1/30s • ISO 1600',
    isHighlight: 0
  },
  {
    id: 7,
    title: 'Monk in Reflection',
    category: 'Portraits',
    location: 'Leh Ladakh, India',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop',
    sizeClass: 'md:col-span-1 md:row-span-2',
    settings: '50mm • f/1.8 • 1/250s • ISO 400',
    isHighlight: 0
  },
  {
    id: 8,
    title: 'Nordic Fjords',
    category: 'Landscapes',
    location: 'Lofoten, Norway',
    url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop',
    sizeClass: 'md:col-span-2 md:row-span-1',
    settings: '16mm • f/8.0 • 1/160s • ISO 100',
    isHighlight: 0
  }
];

db.serialize(() => {
  db.run('ALTER TABLE photos ADD COLUMN isHighlight INTEGER DEFAULT 0', (err) => {
    // Ignore error if column already exists
  });
  
  db.run('DELETE FROM photos');
  const stmt = db.prepare('INSERT INTO photos (id, title, category, location, url, sizeClass, settings, isHighlight) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const photo of defaultPhotos) {
    stmt.run(photo.id, photo.title, photo.category, photo.location, photo.url, photo.sizeClass, photo.settings, photo.isHighlight);
  }
  stmt.finalize();
  console.log('Seeded successfully!');
});
