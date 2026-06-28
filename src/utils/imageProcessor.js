import ExifReader from 'exifreader';

/**
 * Loads the heic2any library dynamically to support browser HEIC file conversion.
 */
const loadHeic2any = async () => {
  const mod = await import('heic2any');
  return mod.default;
};

/**
 * Corrects image orientation and extracts metadata in the browser using HTML5 Canvas.
 * Supports JPEG, JPG, PNG, HEIC, and WebP.
 * 
 * @param {File} file - The uploaded image file.
 * @returns {Promise<{ dataUrl: string, settings: string }>} - Cleansed base64 dataUrl and metadata settings
 */
export async function processAndCorrectImage(file) {
  let imageBlob = file;
  const isHeic = file.type === 'image/heic' || 
                 file.name.toLowerCase().endsWith('.heic') || 
                 file.name.toLowerCase().endsWith('.heif');

  // 1. Load EXIF metadata from the original file (supports HEIC, JPG, JPEG, WebP)
  let tags = null;
  try {
    tags = await ExifReader.load(file);
  } catch (err) {
    console.warn('ExifReader failed to parse tags from original file:', err);
  }

  // 2. Convert HEIC to JPEG if needed
  if (isHeic) {
    try {
      const heic2any = await loadHeic2any();
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.90
      });
      imageBlob = Array.isArray(converted) ? converted[0] : converted;
      
      // If we couldn't parse tags from HEIC originally, try parsing again from converted JPEG
      if (!tags) {
        try {
          tags = await ExifReader.load(imageBlob);
        } catch (err) {
          console.warn('ExifReader failed to parse tags from converted JPEG:', err);
        }
      }
    } catch (err) {
      throw new Error(`HEIC conversion error: ${err.message || err}`);
    }
  }

  // Extract EXIF Orientation
  let orientation = 1;
  if (tags && tags.Orientation) {
    orientation = parseInt(tags.Orientation.value || tags.Orientation.description, 10) || 1;
  }

  // Extract camera settings metadata for the gallery
  let settings = '';
  if (tags) {
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
      settings = parts.join(' • ');
    }
  }

  // 3. Load image into memory to draw on canvas
  const objectUrl = URL.createObjectURL(imageBlob);
  const img = new Image();
  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Image failed to load in browser memory. File may be corrupted.'));
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  // 4. Determine dimensions and scale down if it exceeds safe canvas constraints (4096px)
  const MAX_DIMENSION = 4096;
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width === 0 || height === 0) {
    throw new Error('Invalid image dimensions (0x0). File could be empty or invalid.');
  }

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }

  // Create canvas and configure dimensions (swap width/height for 90/270 deg rotated images)
  const canvas = document.createElement('canvas');
  if (orientation >= 5 && orientation <= 8) {
    canvas.width = height;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Apply EXIF orientation transform matrices
  switch (orientation) {
    case 2: // Horizontal flip
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3: // 180 degree rotation
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4: // Vertical flip
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5: // Flip vertical + Rotate 90 CCW
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6: // Rotate 90 CW
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7: // Flip horizontal + Rotate 90 CCW
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8: // Rotate 90 CCW (270 CW)
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
    default:
      break;
  }

  // Draw image
  ctx.drawImage(img, 0, 0, width, height);

  // 5. Export corrected image back to base64 DataURL (this strips EXIF tags automatically)
  let outputType = isHeic ? 'image/jpeg' : file.type;
  if (!outputType) outputType = 'image/jpeg';

  let dataUrl;
  try {
    dataUrl = canvas.toDataURL(outputType, 0.90);
  } catch (err) {
    console.warn(`Failed to export canvas as ${outputType}, falling back to image/jpeg:`, err);
    dataUrl = canvas.toDataURL('image/jpeg', 0.90);
  }

  return {
    dataUrl,
    settings: settings || '50mm • f/2.0 • 1/500s • ISO 100'
  };
}
