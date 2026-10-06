import sharp from 'sharp';
import fs from 'fs';

async function processImage() {
  const inputPath = 'public/assets/floral_gold_frame.jpg';
  const outputPath = 'public/assets/floral_gold_frame.png';

  const image = sharp(inputPath);
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Check if pixel is pure/near white (background)
    const minVal = Math.min(r, g, b);
    const maxVal = Math.max(r, g, b);
    const avg = (r + g + b) / 3;

    if (minVal >= 238 && (maxVal - minVal) < 14) {
      // Completely transparent white / near-white background
      data[i + 3] = 0;
    } else if (minVal >= 222 && (maxVal - minVal) < 14) {
      // Soft anti-aliasing on the edge
      const factor = (minVal - 222) / 16;
      data[i + 3] = Math.round(255 * (1 - factor));
    } else {
      // Fully opaque flower / leaf / gold metallic line
      data[i + 3] = 255;
    }
  }

  await sharp(data, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputPath);

  console.log('Successfully created transparent PNG:', outputPath);
}

processImage().catch(console.error);
