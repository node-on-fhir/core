# Testing Your AI-Powered A2A Agent

## Overview

This guide provides test scenarios and commands to verify your A2A (Application-to-Application) agent with local LLM assistance is working correctly.

## Prerequisites

1. **Meteor server running**: `meteor run --settings configs/settings.honeycomb.localhost.json`
2. **Navigate to**: `http://localhost:3000/a2a-admin`
3. **Enable AI Assistant**: Toggle the "🤖 AI Assistant (Local LLM)" switch
4. **Wait for model to load**: Should see "Ready to analyze A2A tasks"

## Quick Test Commands

### 1. Basic Prior Authorization Request

```bash
curl -X POST http://localhost:3000/api/a2a \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "test-prior-auth-1",
    "method": "message/send",
    "params": {
      "message": {
        "parts": [{
          "kind": "text",
          "text": "Patient John Doe needs prior authorization for lumbar MRI. Has tried 6 weeks of physical therapy without improvement. Diagnosis: Chronic lower back pain with radiculopathy."
        }]
      }
    }
  }'
```

### 2. Specialist Referral Request

```bash
curl -X POST http://localhost:3000/api/a2a \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "test-referral-1",
    "method": "message/send",
    "params": {
      "message": {
        "parts": [{
          "kind": "text",
          "text": "Referring patient Jane Smith (DOB: 1985-03-15) for cardiology consultation. Recent ECG shows irregular rhythm. Patient reports chest pain and shortness of breath during exercise."
        }]
      }
    }
  }'
```

### 3. Medication Prior Authorization

```bash
curl -X POST http://localhost:3000/api/a2a \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "test-med-auth-1",
    "method": "message/send",
    "params": {
      "message": {
        "parts": [{
          "kind": "text",
          "text": "Requesting authorization for Humira (adalimumab) for patient with severe rheumatoid arthritis. Failed methotrexate and two other DMARDs. RA factor positive, CCP antibodies elevated."
        }]
      }
    }
  }'
```

## Postman Collection

Import this collection into Postman for easy testing:

```json
{
  "info": {
    "name": "Honeycomb A2A AI Testing",
    "description": "Test the AI-powered A2A agent"
  },
  "item": [
    {
      "name": "Prior Auth - MRI",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": \"mri-{{$timestamp}}\",\n  \"method\": \"message/send\",\n  \"params\": {\n    \"message\": {\n      \"parts\": [{\n        \"kind\": \"text\",\n        \"text\": \"Prior authorization request for brain MRI with contrast. Patient: {{$randomFirstName}} {{$randomLastName}}. Symptoms: Persistent headaches, vision changes. Duration: 3 months.\"\n      }]\n    }\n  }\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/a2a",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "a2a"]
        }
      }
    },
    {
      "name": "Specialist Referral",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": \"referral-{{$timestamp}}\",\n  \"method\": \"message/send\",\n  \"params\": {\n    \"message\": {\n      \"parts\": [{\n        \"kind\": \"text\",\n        \"text\": \"Urgent referral to neurology. Patient presenting with sudden onset weakness left side, slurred speech. CT scan negative for hemorrhage.\"\n      }]\n    }\n  }\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/a2a",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "a2a"]
        }
      }
    },
    {
      "name": "Check Task Status",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": \"status-check\",\n  \"method\": \"tasks/get\",\n  \"params\": {\n    \"id\": \"{{task_id}}\"\n  }\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/a2a",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "a2a"]
        }
      }
    }
  ]
}
```

## Test Script (save as `test-a2a.sh`)

```bash
#!/bin/bash

echo "🤖 Testing AI-Powered A2A Agent"
echo "================================"

# Function to send A2A message
send_a2a() {
  local scenario=$1
  local message=$2
  local id="test-$(date +%s)-$scenario"
  
  echo -e "\n📤 Sending: $scenario"
  echo "Message: $message"
  
  response=$(curl -s -X POST http://localhost:3000/api/a2a \
    -H "Content-Type: application/json" \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"id\": \"$id\",
      \"method\": \"message/send\",
      \"params\": {
        \"message\": {
          \"parts\": [{
            \"kind\": \"text\",
            \"text\": \"$message\"
          }]
        }
      }
    }")
  
  echo "Response: $response" | python -m json.tool 2>/dev/null || echo "$response"
  echo "---"
}

# Test scenarios
echo -e "\n🏥 Clinical Test Scenarios\n"

send_a2a "prior-auth" "Need prior auth for cardiac catheterization. Patient has abnormal stress test, chest pain."

sleep 2

send_a2a "referral" "Referring patient for oncology consultation. Suspicious mass found on chest X-ray."

sleep 2

send_a2a "med-auth" "Authorization needed for Remicade infusion. Patient with Crohn's disease, failed oral medications."

echo -e "\n✅ Tests sent! Check http://localhost:3000/a2a-admin to see:"
echo "  1. Tasks appearing in the list"
echo "  2. AI analyzing each task"
echo "  3. Suggested responses from your local LLM"
echo -e "\nNote: Your AI assistant might introduce itself with different names - that's normal! 😄"
```

## Expected Flow

1. **Send test message** → A2A task created
2. **Open `/a2a-admin`** → See task in list
3. **Click on task** → If AI enabled, see:
   - 🤖 AI Analysis section appears
   - Loading indicator while Llama thinks
   - Analysis of the request
   - Suggested response auto-fills the text field
4. **Review/edit response** → Click "Send Response"
5. **Task completes** → Disappears from active list

## Verifying AI Integration

When AI is working correctly, you should see:

### In Browser Console:
```
Loading LLM for A2A: Loading...
A2A AI Assistant ready
```

### In A2A Admin UI:
- Purple AI Analysis box with analysis text
- Suggested response in italic text
- "Use This Response" button
- Response field auto-populated

### AI Response Examples:

**Prior Auth Request:**
> "I understand you need authorization for the MRI. Based on the failed conservative treatment and diagnosis of radiculopathy, this meets medical necessity criteria. I'll process this authorization. Please provide the CPT code and facility information."

**Referral Request:**
> "I'll arrange the cardiology consultation for Jane Smith. Given the ECG findings and symptoms, I recommend expedited appointment within 1-2 weeks. Please have recent labs including troponin and BNP available."

## Troubleshooting

### Tasks not appearing:
- Check Meteor console for errors
- Verify server is running
- Check network tab in browser dev tools

### AI not analyzing:
- Ensure AI Assistant toggle is ON
- Check browser console for WebLLM loading errors
- Verify WebGPU support (Chrome/Edge recommended)
- Wait for "Ready to analyze A2A tasks" message

### AI giving strange responses:
- Normal for Llama-3.2-1B to have personality quirks
- May introduce itself with different names
- Focus on the medical content, which is usually coherent

## Advanced Testing

### Test with attachments:
```json
{
  "jsonrpc": "2.0",
  "id": "test-with-file",
  "method": "message/send",
  "params": {
    "message": {
      "parts": [
        {
          "kind": "text",
          "text": "Prior auth for surgery. See attached clinical notes."
        },
        {
          "kind": "file",
          "file": {
            "name": "clinical-notes.pdf",
            "mimeType": "application/pdf",
            "bytes": "base64-encoded-content-here"
          }
        }
      ]
    }
  }
}
```

### Stream responses (SSE):
```bash
curl -X POST http://localhost:3000/api/a2a \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": "stream-test",
    "method": "message/stream",
    "params": {
      "message": {
        "parts": [{
          "kind": "text",
          "text": "Need immediate authorization for emergency CT scan"
        }]
      }
    }
  }'
```

## Success Metrics

Your AI-powered A2A agent is working when:
- ✅ Tasks appear instantly in admin dashboard
- ✅ AI analyzes within 2-3 seconds
- ✅ Suggested responses are clinically relevant
- ✅ Human can edit before sending
- ✅ Response completes the task workflow

## Notes

- The AI runs entirely in your browser - no data sent to external servers
- First load takes ~30 seconds to download model
- Model is cached for future sessions
- Works offline after initial download
- Your "medical droid" may have multiple personalities but gives helpful suggestions!

Happy testing! 🤖🏥