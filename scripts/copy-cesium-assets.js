// scripts/copy-cesium-assets.js
// Copies CesiumJS static assets (Workers, ThirdParty, Assets, Widgets) from
// node_modules/cesium/Build/Cesium/ to public/cesium/ so they can be served
// at runtime via CESIUM_BASE_URL = '/cesium/'.
//
// Usage: node scripts/copy-cesium-assets.js

const fs = require('fs');
const path = require('path');

const cesiumBuildDir = path.resolve(__dirname, '..', 'node_modules', 'cesium', 'Build', 'Cesium');
const outputDir = path.resolve(__dirname, '..', 'public', 'cesium');

const dirsToCopy = ['Workers', 'ThirdParty', 'Assets', 'Widgets'];

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn('  [skip] Source does not exist:', src);
    return 0;
  }

  fs.mkdirSync(dest, { recursive: true });
  let count = 0;

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      count += copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }

  return count;
}

console.log('Copying CesiumJS static assets...');
console.log('  From:', cesiumBuildDir);
console.log('  To:  ', outputDir);
console.log('');

if (!fs.existsSync(cesiumBuildDir)) {
  console.error('ERROR: CesiumJS build directory not found at', cesiumBuildDir);
  console.error('Run "npm install cesium" first.');
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

let totalFiles = 0;
for (const dir of dirsToCopy) {
  const src = path.join(cesiumBuildDir, dir);
  const dest = path.join(outputDir, dir);
  const fileCount = copyDirSync(src, dest);
  console.log(`  ${dir}: ${fileCount} files`);
  totalFiles += fileCount;
}

console.log('');
console.log(`Done. Copied ${totalFiles} files to public/cesium/`);
