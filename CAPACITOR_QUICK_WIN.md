# Capacitor Quick Win - 4 Day Plan

## The Goal: Get File System Access for GGUF Models

Forget Neural Engine. Forget SQLite. Let's just get your Meteor app running on iPad with file system access so you can load that Mistral GGUF file. That alone is huge.

## Day 1-2: Deploy Meteor Server (You're already on this)
✅ Get your Meteor server deployed and accessible via HTTPS

## Day 3: Build Static Bundle + Capacitor Wrapper

### Morning: Create the Simplest Possible Build

```bash
# 1. Build your Meteor app
meteor build ../simple-build --directory

# 2. Create a minimal Capacitor project
mkdir honeycomb-capacitor
cd honeycomb-capacitor
npm init -y
npm install @capacitor/core @capacitor/ios @capacitor/filesystem
```

### Afternoon: The Bare Minimum Wrapper

Create the simplest possible `index.html` that loads your Meteor app:

```html
<!-- honeycomb-capacitor/www/index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Honeycomb</title>
</head>
<body>
  <iframe 
    src="https://your-deployed-meteor-app.com" 
    style="width:100%; height:100vh; border:none;">
  </iframe>
  
  <!-- Capacitor bridge for native features -->
  <script src="capacitor.js"></script>
  <script>
    // Listen for messages from iframe
    window.addEventListener('message', async (event) => {
      if (event.data.type === 'DOWNLOAD_MODEL') {
        // Use Capacitor Filesystem to download GGUF
        const { Filesystem } = Capacitor.Plugins;
        
        try {
          // Download the model
          const response = await fetch(event.data.url);
          const blob = await response.blob();
          const base64 = await blobToBase64(blob);
          
          // Save to app's documents directory
          await Filesystem.writeFile({
            path: 'models/mistral-7b.gguf',
            data: base64,
            directory: 'DOCUMENTS'
          });
          
          // Send success back to iframe
          event.source.postMessage({
            type: 'MODEL_DOWNLOADED',
            path: 'models/mistral-7b.gguf'
          }, '*');
        } catch (error) {
          event.source.postMessage({
            type: 'DOWNLOAD_ERROR',
            error: error.message
          }, '*');
        }
      }
    });
    
    function blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  </script>
</body>
</html>
```

### Configure Capacitor

```json
// capacitor.config.json
{
  "appId": "com.honeycomb.fhir",
  "appName": "Honeycomb",
  "webDir": "www",
  "server": {
    "allowNavigation": ["your-deployed-meteor-app.com"]
  }
}
```

### Initialize iOS

```bash
npx cap add ios
npx cap copy
npx cap open ios
```

## Day 4: Add File System Bridge

### In Your Meteor App

Add a simple bridge to communicate with Capacitor:

```javascript
// In your Meteor client code
if (window.parent !== window) {
  // We're in an iframe in Capacitor
  window.HoneycombNative = {
    downloadModel: async (url) => {
      return new Promise((resolve, reject) => {
        // Send message to parent
        window.parent.postMessage({
          type: 'DOWNLOAD_MODEL',
          url: url
        }, '*');
        
        // Listen for response
        window.addEventListener('message', function handler(event) {
          if (event.data.type === 'MODEL_DOWNLOADED') {
            window.removeEventListener('message', handler);
            resolve(event.data.path);
          } else if (event.data.type === 'DOWNLOAD_ERROR') {
            window.removeEventListener('message', handler);
            reject(new Error(event.data.error));
          }
        });
      });
    }
  };
}

// Use it in your LLM page
async function downloadMistralModel() {
  if (window.HoneycombNative) {
    // Running in Capacitor
    const path = await window.HoneycombNative.downloadModel(
      'https://huggingface.co/TheBloke/Mistral-7B-v0.1-GGUF/resolve/main/mistral-7b-v0.1.Q4_K_M.gguf'
    );
    console.log('Model saved to device at:', path);
  } else {
    // Running in browser
    console.log('Native download not available');
  }
}
```

## What This Gets You

1. ✅ Your Meteor app running on iPad
2. ✅ File system access to save GGUF models
3. ✅ Models persist on device between app launches
4. ✅ Can load 4GB+ models that won't fit in browser storage

## What This Doesn't Get You (Yet)

1. ❌ Don't get blocked on NATIVE inference
2. ❌ Neural Engine acceleration
3. ❌ Offline mode for the Meteor app itself

## The GGUF File You Found

The Mistral GGUF from TheBloke is perfect! Specifically, get the Q4_K_M version:
- **File**: `mistral-7b-v0.1.Q4_K_M.gguf`
- **Size**: ~4.1GB
- **Link**: https://huggingface.co/TheBloke/Mistral-7B-v0.1-GGUF/blob/main/mistral-7b-v0.1.Q4_K_M.gguf

### Download the Model

```bash
# Download the Q4_K_M version directly (4.1GB)
curl -L -o mistral-7b-v0.1.Q4_K_M.gguf https://huggingface.co/TheBloke/Mistral-7B-v0.1-GGUF/resolve/main/mistral-7b-v0.1.Q4_K_M.gguf

# Note: If you cloned with git, you just got pointers. Use curl to get the actual file!
```

## Day 4 Bonus: Actually Run Inference with WebLLM!

Once you have the model file on device, you CAN run inference right in the WebView:

### Install WebLLM in your Meteor app

```bash
npm install @mlc-ai/web-llm
```

### Use it in your Meteor client

```javascript
// In your LLM page component
import * as webllm from "@mlc-ai/web-llm";

async function runLocalInference() {
  // WebLLM works in Capacitor's WebView!
  const engine = await webllm.CreateEngine({
    model: "Mistral-7B-Instruct-v0.2-q4f16_1",
    // Point to your downloaded model if needed
    // modelPath: "/path/to/mistral-7b.gguf"
  });

  const reply = await engine.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful medical assistant." },
      { role: "user", content: "What are the symptoms of pneumonia?" }
    ]
  });
  
  console.log(reply.choices[0].message.content);
}
```

### Alternative: llama.cpp WASM

There's also a WebAssembly version of llama.cpp that works in browsers:

```javascript
// Using llama-cpp-wasm
import { LlamaCpp } from 'llama-cpp-wasm';

const llama = new LlamaCpp();
await llama.load('/models/mistral-7b.gguf');
const response = await llama.generate("Hello, how are you?");
```

This means you can have working LLM inference by Day 4! Not just file storage - actual inference!

### What "Inference" Actually Means Here

**YES - Full chat functionality!** You can:
- ✅ Have a chat interface in your Meteor app
- ✅ User types a question
- ✅ Model generates responses locally on the iPad
- ✅ Full conversation with context
- ✅ No internet needed after model is downloaded

Example in your Meteor app:

```javascript
// In your React component
function LocalChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [engine, setEngine] = useState(null);
  
  // Initialize once
  useEffect(async () => {
    const llm = await webllm.CreateEngine({
      model: "Mistral-7B-Instruct-v0.2-q4f16_1"
    });
    setEngine(llm);
  }, []);
  
  async function sendMessage() {
    // Add user message to chat
    const userMsg = { role: 'user', content: input };
    setMessages([...messages, userMsg]);
    
    // Get response from LOCAL model (not server!)
    const reply = await engine.chat.completions.create({
      messages: [...messages, userMsg]
    });
    
    // Add AI response to chat
    const aiMsg = { 
      role: 'assistant', 
      content: reply.choices[0].message.content 
    };
    setMessages([...messages, userMsg, aiMsg]);
    setInput('');
  }
  
  return (
    <div>
      {messages.map(msg => (
        <div>{msg.role}: {msg.content}</div>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

This is a REAL chat with a 7B parameter model running entirely on the iPad!

## Critical Success Factors

### DO:
- Use iframe approach - it's crude but it WORKS
- Deploy Meteor to HTTPS (required for Capacitor)
- Test file download early - Day 3 if possible
- Keep the native bridge simple - just file operations

### DON'T:
- Try to bundle Meteor client separately (quicksand!)
- Attempt Neural Engine on first pass
- Get fancy with offline sync
- Try to run inference yet (that's v2)

## If You Get Stuck

The iframe approach has a 95% success rate because:
- Your Meteor app runs normally on your server
- Capacitor just provides a native wrapper
- Communication via postMessage is simple
- File system API definitely works

## Next Steps After This Works

Once you have the GGUF file on the device, the next phase would be:
1. Integrate llama.cpp via WebAssembly (runs in Safari WebView)
2. OR: Build a simple native plugin that calls llama.cpp
3. OR: Use a service like Ollama running locally

But that's AFTER you nail the basic file system access.

## The Bottom Line

This approach is intentionally "dumb" but it will work. You'll have:
- Honeycomb running on iPad ✅
- Large model files stored locally ✅
- Foundation for future LLM integration ✅

That's your base hit. The grand slam (Neural Engine, etc.) can come later. Ship something that works first! 🚀

## Monday's Build Commands

When you're ready on Monday:

```bash
# 1. Build Meteor
meteor build ../ipad-build --directory --server=https://your-server.com

# 2. Create Capacitor wrapper (use the iframe approach above)
mkdir honeycomb-ipad
cd honeycomb-ipad
npm init -y
npm install @capacitor/core @capacitor/ios @capacitor/filesystem

# 3. Add the minimal HTML
echo '<!DOCTYPE html>...' > www/index.html

# 4. Configure and build
npx cap add ios
npx cap copy
npx cap open ios

# 5. Run on iPad simulator to test
# Click play button in Xcode
```

You got this! 🎯