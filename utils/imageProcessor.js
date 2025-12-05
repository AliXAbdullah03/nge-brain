const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Process and optimize uploaded image
 * Creates multiple sizes: original, medium, thumbnail
 */
async function processImage(filePath) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);
  
  const originalPath = filePath;
  const mediumPath = path.join(dir, `${basename}_medium${ext}`);
  const thumbnailPath = path.join(dir, `${basename}_thumb${ext}`);
  
  try {
    // Create medium size (800px width)
    await sharp(originalPath)
      .resize(800, null, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(mediumPath);
    
    // Create thumbnail (300px width)
    await sharp(originalPath)
      .resize(300, null, { withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    return {
      original: originalPath,
      medium: mediumPath,
      thumbnail: thumbnailPath
    };
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(mediumPath)) fs.unlinkSync(mediumPath);
    if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
    throw error;
  }
}

/**
 * Get image URL (for local storage)
 */
function getImageUrl(filePath) {
  const relativePath = filePath.replace(/^.*public/, '');
  return `${process.env.API_BASE_URL || 'http://localhost:3000'}${relativePath.replace(/\\/g, '/')}`;
}

module.exports = {
  processImage,
  getImageUrl
};

