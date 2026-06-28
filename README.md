# Odyssey: Premium Cinematic Travel & Adventure Photography Portfolio

Odyssey is a premium, state-of-the-art photography portfolio and administrative content management system. Crafted for visual storytellers, it features a fluid, highly responsive frontend, high-performance WebGL animations, and a secure backend admin panel designed for lightning-fast image delivery and intuitive collection management.

---

## 🚀 Key Features

### 🌌 Immersive Front-End
- **Fluid Sizing & Typography**: Custom responsive design system using CSS `clamp()` scaling, supporting viewports from mobile (320px) up to ultra-wide displays (2560px+) seamlessly.
- **WebGL Cinematic Background**: Ambient, GPU-accelerated auroral smoke wave and floating interactive particle field using Three.js. Supports the `prefers-reduced-motion` media feature, stopping the animation loop automatically to preserve CPU/GPU cycles.
- **Masonry Bento Layout**: A visual grid implementation for the homepage gallery and Featured Highlights section, stacking unequal aspect ratio portraits/landscapes without empty spaces or cell gaps.
- **Animated Hamburger Menu**: Dynamic sliding mobile navigation drawer using Framer Motion for responsive menu access.
- **Image Theft Protection**: Direct context menu clicks, user text/image selection, and image drag events are natively blocked to deter casual saving of original creative work.

### 🛡️ Secure Admin Panel
- **Session-Based Authentication**: Secure login mechanism requiring a personal administrative passcode, validated using server-side PBKDF2 hashing with unique random salts.
- **Forgot & Reset Password Workflow**: Secure passcode reset flow including temporary tokens, validation checking, and automated on-screen reset links when SMTP services are unconfigured.
- **Settings Console**: A settings workspace containing profile updates (name, title, location, general email, bio statement), and a Change Passcode form validating character complexity rules.
- **Passcode Complexity Rules**: Enforces robust credential requirements:
  - Minimum 8 characters.
  - At least one uppercase letter.
  - At least one lowercase letter.
  - At least one numerical digit.
  - At least one special character.

### ⚡ Performance Refactoring & Storage
- **Local Disk Storage**: Large smartphone and DSLR uploads (10MB–25MB) are stored as physical static files in the `/uploads/` directory on the server disk instead of inside SQLite Base64 database columns.
- **API File Uploader**: An optimized `/api/upload` endpoint decodes binary buffers, structures file sizes, and returns asset paths, reducing API JSON response weight from hundreds of megabytes to a few kilobytes.
- **Auto-Migration Pipeline**: Integrated `migrateBase64ToFiles()` database startup task automatically extracts existing Base64 strings from SQLite, moves them to local disk files, and updates database records on launch.

---

## 🛠️ Technology Stack

- **Frontend**: React, Tailwind CSS, Vite, Framer Motion, Lucide React, Three.js (WebGL).
- **Backend**: Node.js, Express, SQLite, Rate Limiters, Body Parsers.
- **Libraries**: ExifReader, heic2any.

---

## ⚙️ Project Setup

### 📦 Prerequisites
Install [Node.js](https://nodejs.org/) (v16+ recommended).

### 🔧 Installation
1. Clone the repository and navigate to the project root.
2. Install all dependencies:
   ```bash
   npm install
   ```

### 🖥️ Running Locally (Development)
Launch the Express backend database API (listening on port 5000) and the Vite development frontend client (listening on port 3000) concurrently:
```bash
npm run dev
```
Open **`http://localhost:3000/`** in your browser.

### 🔐 Admin Authentication
- Access the Admin Panel at: **`http://localhost:3000/admin`**
- Default testing Passcode: **`Uday@12345#`**

### 🏗️ Production Build & Static Serving
Compile the frontend asset bundles for deployment:
```bash
npm run build
```
Start the production server:
```bash
npm start
```

---

## ☁️ Deployment on Vercel

Vercel is a serverless hosting provider that runs on an ephemeral (temporary) file system. Because all of your uploaded photos, locations, and settings are **already saved locally inside the committed `/uploads/` folder and `database.sqlite` file**, Vercel will serve your portfolio flawlessly in **read-only mode**:
- **Existing Content**: All your photos, locations, settings, and categories will load and display perfectly.
- **Updating Content / Uploading New Photos**:
  1. Run the project locally on your machine (`npm run dev`).
  2. Upload new photos and arrange their grid positions through your local admin panel (`http://localhost:3000/admin`).
  3. Commit and push the updated `database.sqlite` and the new image assets inside the `uploads/` directory to GitHub.
  4. Vercel will automatically trigger a redeploy, showing your new content online within seconds!

### ⚙️ Vercel Import Steps
1. Log in to [Vercel](https://vercel.com/) and click **Add New** -> **Project**.
2. Select your repository: `udayjpatel-portfolio`.
3. Vercel will automatically parse the `vercel.json` file.
4. Click **Deploy**. Your site will be online in about 1-2 minutes!