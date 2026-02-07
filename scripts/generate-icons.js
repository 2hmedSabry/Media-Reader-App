const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// SVG icon design
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.95" />
      <stop offset="100%" style="stop-color:#e0e7ff;stop-opacity:0.95" />
    </linearGradient>
  </defs>
  
  <circle cx="512" cy="512" r="480" fill="url(#grad1)"/>
  
  <g transform="translate(512, 512)">
    <circle cx="0" cy="0" r="320" fill="url(#grad2)" opacity="0.15"/>
    <path d="M -120,-180 L 200,0 L -120,180 Z" fill="url(#grad2)"/>
    <rect x="-280" y="-200" width="120" height="16" rx="8" fill="url(#grad2)" opacity="0.7"/>
    <rect x="-280" y="-140" width="80" height="16" rx="8" fill="url(#grad2)" opacity="0.7"/>
    <rect x="-280" y="-80" width="100" height="16" rx="8" fill="url(#grad2)" opacity="0.7"/>
    <rect x="-280" y="80" width="120" height="16" rx="8" fill="url(#grad2)" opacity="0.7"/>
    <rect x="-280" y="140" width="80" height="16" rx="8" fill="url(#grad2)" opacity="0.7"/>
    <rect x="-280" y="200" width="100" height="16" rx="8" fill="url(#grad2)" opacity="0.7"/>
  </g>
  
  <circle cx="512" cy="512" r="480" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="8"/>
</svg>`;

async function generateIcons() {
  const buildDir = path.join(__dirname, '..', 'build');
  const iconsDir = path.join(buildDir, 'icons');
  
  // Create directories
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });
  
  // Save SVG
  const svgPath = path.join(iconsDir, 'icon.svg');
  fs.writeFileSync(svgPath, svgIcon);
  console.log('✅ SVG icon created');
  
  // Generate PNG at 1024x1024
  const pngPath = path.join(buildDir, 'icon.png');
  await sharp(Buffer.from(svgIcon))
    .resize(1024, 1024)
    .png()
    .toFile(pngPath);
  console.log('✅ PNG icon created (1024x1024)');
  
  // Generate PNG at 512x512 for Linux
  const png512Path = path.join(iconsDir, 'icon-512.png');
  await sharp(Buffer.from(svgIcon))
    .resize(512, 512)
    .png()
    .toFile(png512Path);
  console.log('✅ PNG icon created (512x512)');
  
  // Generate PNG at 256x256
  const png256Path = path.join(iconsDir, 'icon-256.png');
  await sharp(Buffer.from(svgIcon))
    .resize(256, 256)
    .png()
    .toFile(png256Path);
  console.log('✅ PNG icon created (256x256)');
  
  console.log('\n🎉 Icons generated successfully!');
  console.log('\n📝 Next step: Install electron-icon-maker to generate platform-specific icons:');
  console.log('   npm install -g electron-icon-maker');
  console.log('   electron-icon-maker --input=build/icon.png --output=./build');
}

generateIcons().catch(console.error);
