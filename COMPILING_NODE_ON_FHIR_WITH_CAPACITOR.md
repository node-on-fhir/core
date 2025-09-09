# Compiling Node-on-FHIR/Meteor Apps with Capacitor

## The Big Picture: Why This Matters

Nobody has successfully compiled a Meteor v3 app with Capacitor yet. This document explains the theoretical path to make it happen. If we pull this off, we'll have:

- Native iPad apps running Node-on-FHIR
- Local LLM inference on Neural Engine
- Offline-first FHIR capabilities
- Real clinical apps on iPad Pro

## The Challenge: Meteor vs Standard Web Apps

Capacitor expects a standard web app (HTML/JS/CSS files). Meteor is... different:

1. **Meteor uses DDP (Distributed Data Protocol)** - WebSocket-based real-time protocol
2. **Meteor has its own build system** - Not webpack/vite
3. **Meteor expects a server** - For Methods, Publications, Accounts
4. **Meteor uses hot code push** - Dynamic code loading

## The Solution Path: Three Approaches

### Approach 1: Static Export with API Bridge (Easiest)
**Feasibility: 70%** - Most likely to work

```bash
# Step 1: Build Meteor as a static web app
meteor build ../output --directory

# Step 2: Extract the client bundle
cd ../output/bundle/programs/web.browser
```

The client bundle contains:
- Your React app
- All client-side code  
- Meteor's client runtime

But it expects a Meteor server at the DDP URL. So we need to:

1. **Replace DDP with REST calls**
   ```javascript
   // Instead of Meteor.call()
   fetch('/api/method', { method: 'POST', body: JSON.stringify(params) })
   ```

2. **Replace subscriptions with polling/fetch**
   ```javascript
   // Instead of Meteor.subscribe()
   fetch('/api/patients').then(data => setState(data))
   ```

3. **Point to a remote Meteor server**
   ```javascript
   // In settings
   Meteor.settings.public.ddpUrl = 'wss://your-server.com/websocket'
   ```

### Approach 2: Embedded Meteor Server (Complex)
**Feasibility: 30%** - Theoretically possible, practically difficult

Run Node.js inside the iOS app using NodeMobile or similar:

1. **Bundle Meteor server code**
2. **Run MongoDB locally** (using Realm or SQLite adapter)
3. **Bridge between Capacitor WebView and Node process**

This is incredibly complex and likely not worth it.

### Approach 3: Progressive Web App Bridge (Recommended)
**Feasibility: 90%** - Best path forward

Keep Meteor as-is, but wrap it intelligently:

```javascript
// capacitor.config.json
{
  "appId": "com.honeycomb.fhir",
  "appName": "Honeycomb FHIR",
  "server": {
    "url": "http://localhost:3000",  // During dev
    "cleartext": true
  }
}
```

## Step-by-Step: Building Node-on-FHIR with Capacitor

### Prerequisites
```bash
# Install Capacitor CLI
npm install -g @capacitor/cli

# Install iOS development tools
xcode-select --install
```

### Step 1: Prepare Meteor for Static Build

Create a build script that generates Capacitor-compatible output:

```javascript
// build-for-capacitor.js
const { exec } = require('child_process');
const fs = require('fs-extra');

async function buildForCapacitor() {
  // 1. Build Meteor
  console.log('Building Meteor app...');
  await exec('meteor build --directory ../capacitor-build');
  
  // 2. Extract client files
  console.log('Extracting client bundle...');
  await fs.copy(
    '../capacitor-build/bundle/programs/web.browser',
    './capacitor-www'
  );
  
  // 3. Create index.html that loads Meteor
  const indexHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Honeycomb FHIR</title>
      <script>
        // Configure Meteor settings
        window.__meteor_runtime_config__ = {
          meteorEnv: { NODE_ENV: "production" },
          PUBLIC_SETTINGS: ${JSON.stringify(Meteor.settings.public)},
          ROOT_URL: "http://localhost:3000",
          DDP_DEFAULT_CONNECTION_URL: "http://localhost:3000"
        };
      </script>
    </head>
    <body>
      <div id="app"></div>
      <script src="./app.js"></script>
    </body>
    </html>
  `;
  
  await fs.writeFile('./capacitor-www/index.html', indexHtml);
}
```

### Step 2: Initialize Capacitor

```bash
# In your Meteor project root
npm init capacitor-app honeycomb-fhir com.honeycomb.fhir

# Add iOS platform
npx cap add ios

# Copy web assets
npx cap copy

# Open in Xcode
npx cap open ios
```

### Step 3: Handle Meteor-Specific Challenges

#### Challenge 1: DDP Connection
Meteor expects WebSocket connection. Solutions:

```javascript
// Option A: Connect to remote server
if (Capacitor.isNativePlatform()) {
  Meteor.connect('wss://your-server.com/websocket');
}

// Option B: Implement REST fallback
class MeteorBridge {
  static async call(method, ...args) {
    if (Capacitor.isNativePlatform()) {
      // Use REST API
      return fetch(`/api/methods/${method}`, {
        method: 'POST',
        body: JSON.stringify(args)
      }).then(r => r.json());
    } else {
      // Use normal Meteor.call
      return Meteor.callAsync(method, ...args);
    }
  }
}
```

#### Challenge 2: Accounts System
Meteor's accounts need special handling:

```javascript
// Store auth token in Capacitor secure storage
import { Storage } from '@capacitor/storage';

Accounts.onLogin(async () => {
  const token = Accounts._storedLoginToken();
  await Storage.set({ key: 'meteorLoginToken', value: token });
});

// Restore on app launch
const token = await Storage.get({ key: 'meteorLoginToken' });
if (token) {
  Meteor.loginWithToken(token.value);
}
```

#### Challenge 3: File System Access
For FHIR resources and LLM models:

```javascript
import { Filesystem, Directory } from '@capacitor/filesystem';

// Save FHIR bundle locally
await Filesystem.writeFile({
  path: 'fhir-bundle.json',
  data: JSON.stringify(bundle),
  directory: Directory.Documents
});
```

### Step 4: Add Native Capabilities

This is where Capacitor shines - adding native features:

```javascript
// capacitor.config.json
{
  "plugins": {
    "LocalLLM": {
      "modelPath": "models/mistral-7b.gguf"
    },
    "HealthKit": {
      "readPermissions": ["HKQuantityTypeIdentifierHeartRate"]
    }
  }
}
```

### Step 5: Build and Deploy

```bash
# Build Meteor
meteor build --directory ../build-output

# Copy to Capacitor
cp -r ../build-output/bundle/programs/web.browser/* ios/App/App/public/

# Sync Capacitor
npx cap sync

# Open Xcode and build
npx cap open ios
```

## The Architecture That Actually Works

Here's what I recommend for Honeycomb:

```
┌─────────────────────────────────────┐
│         iPad Capacitor App          │
├─────────────────────────────────────┤
│   React UI (from Meteor client)     │
│   + Capacitor Plugins               │
│   + Local SQLite for offline        │
├─────────────────────────────────────┤
│         Capacitor Bridge            │
├─────────────────────────────────────┤
│   REST API ←→ Meteor Server         │
│   WebSocket for real-time           │
└─────────────────────────────────────┘
              ↓ Internet ↓
┌─────────────────────────────────────┐
│       Meteor Server (Cloud)         │
├─────────────────────────────────────┤
│   - FHIR API                        │
│   - MongoDB                         │
│   - Accounts                        │
│   - Methods/Publications            │
└─────────────────────────────────────┘
```

## Key Insights

1. **Don't try to run Meteor server on device** - Too complex
2. **Use Capacitor for native features** - Camera, filesystem, Neural Engine
3. **Keep Meteor server in cloud** - For sync, auth, and heavy processing
4. **Cache aggressively on device** - SQLite or Filesystem API
5. **Implement offline-first patterns** - Queue changes, sync when online

## Specific to LLM Integration

For the local LLM plugin:

```javascript
// In your Meteor client code
import { LocalLLM } from '@honeycomb/capacitor-llm';

if (Capacitor.isNativePlatform()) {
  // Use local LLM
  const result = await LocalLLM.generate({
    prompt: patientContext,
    maxTokens: 512
  });
} else {
  // Fall back to server API
  const result = await Meteor.callAsync('llm.generate', {
    prompt: patientContext
  });
}
```

## Testing Your Hybrid App

```bash
# Web version (normal Meteor)
meteor run --settings settings.json

# iOS Simulator
npx cap run ios

# Physical iPad
# 1. Open in Xcode: npx cap open ios
# 2. Select your iPad in device list
# 3. Click Run
```

## Gotchas and Solutions

### Gotcha 1: CORS Issues
```javascript
// In Meteor server
WebApp.connectHandlers.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'capacitor://localhost');
  next();
});
```

### Gotcha 2: Secure Storage
```javascript
// Use Capacitor's secure storage for PHI
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

await SecureStoragePlugin.set({
  key: 'patient_data',
  value: JSON.stringify(patientData)
});
```

### Gotcha 3: Hot Code Push
Disable Meteor's hot code push for App Store:
```javascript
if (Capacitor.isNativePlatform()) {
  Reload._onMigrate(() => [false]); // Never reload
}
```

## The Bottom Line

This is uncharted territory. Nobody has done this with Meteor v3 yet because:

1. **Meteor v3 is very new** (2024)
2. **Most Meteor devs use Cordova** (older, more integrated)
3. **Capacitor is typically for simpler apps** (not real-time)

But it's absolutely possible, and the combination would be powerful:
- Meteor's real-time FHIR backend
- Capacitor's modern native APIs
- Local LLM inference on Neural Engine
- Offline-first healthcare apps

## Next Steps

1. **Start simple** - Get basic Meteor client running in Capacitor
2. **Add offline storage** - SQLite for FHIR resources
3. **Implement sync** - Queue changes when offline
4. **Add native features** - Camera for wound photos, etc.
5. **Integrate LLM** - Using the plugin we created

This is pioneering work. You're not blind - you're exploring new territory that could revolutionize healthcare apps on iPad! 🚀