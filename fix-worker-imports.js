// fix-worker-imports.js
// Add .js extensions to ESM imports for browser compatibility

const fs = require('fs');

const filePath = './public/workers/decodeImageFrameWorker-original.js';
const outputPath = './public/workers/decodeImageFrameWorker.js';

let content = fs.readFileSync(filePath, 'utf8');

// Fix comlink import (external dependency)
content = content.replace(
  "import { expose } from 'comlink';",
  "import { expose } from './comlink/comlink.js';"
);

// Fix relative imports - add .js extension to imports that don't have it
content = content.replace(
  /from '(\.\/[^']+)';/g,
  function(match, path) {
    // Skip if already has .js extension
    if (path.endsWith('.js')) {
      return match;
    }
    // Add .js extension
    return `from '${path}.js';`;
  }
);

fs.writeFileSync(outputPath, content);
console.log('✅ Fixed worker imports');
