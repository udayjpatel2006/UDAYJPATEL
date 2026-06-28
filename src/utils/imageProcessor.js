import ExifReader from 'exifreader';

/**
 * Loads the heic2any library dynamically to support browser HEIC file conversion.
 */
const loadHeic2any = async () => {
  const mod = await import('heic2any');
  return mod.default;
};

/**
 * Reads the raw image file as a Base64 dataURL without canvas rotation/resizing.
 * Converts HEIC to JPEG if needed, extracting settings metadata.
 * 
 * @param {File} file - The uploaded image file.
 * @returns {Promise<{ dataUrl: string, settings: string }>} - Original dataUrl and metadata settings
 */
export async function processAndCorrectImage(file) {
  let imageBlob = file;
  const isHeic = file.type === 'image/heic' || 
                 file.name.toLowerCase().endsWith('.heic') || 
                 file.name.toLowerCase().endsWith('.heif');

  // 1. Load EXIF metadata from the original file
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
        quality: 0.95
      });
      imageBlob = Array.isArray(converted) ? converted[0] : converted;

      // Try reading tags again if original read failed
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

  // 3. Read the image blob as a Base64 dataURL (bypasses canvas completely)
  const reader = new FileReader();
  const dataUrl = await new Promise((resolve, reject) => {
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('FileReader failed to read the file. File may be corrupted.'));
    reader.readAsDataURL(imageBlob);
  });

  return {
    dataUrl,
    settings: settings || '50mm • f/2.0 • 1/500s • ISO 100'
  };
}
