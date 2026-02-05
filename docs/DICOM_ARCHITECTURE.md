# DICOM Upload Architecture & BSON Size Limit Bug

## Bug Summary

Uploading a DICOM file (`.dcm`) on the `/dicom/upload` route fails with:

```
The value of "offset" is out of range. It must be >= 0 && <= 17825792. Received 17825794
[upload-processing-failed]
```

**Root cause**: The entire DICOM file is base64-encoded on the client, sent via DDP to a Meteor method, and stored inline in a single MongoDB document. MongoDB documents have a 16 MB BSON limit. A 33.5 MB DICOM file becomes ~44.6 MB when base64-encoded, far exceeding this limit.

## Current Data Flow

```
Client (UploadPage.jsx)
  1. FileReader reads .dcm as ArrayBuffer
  2. ArrayBuffer converted to base64 string (~44.6 MB for a 33.5 MB file)
  3. Meteor.call('dicom.processUploadedFile', { filename, data: base64String, size })
     └── Entire base64 string sent over DDP WebSocket

Server (imports/api/dicom/server/methods.js)
  4. Receives fileInfo with full base64 data
  5. Builds FHIR DocumentReference with data embedded in content[0].attachment.data
  6. DocumentReferences.insertAsync(documentReference)
     └── BSON serializer fails: document exceeds 16 MB limit
```

## Affected Files

### Client

| File | Role |
|------|------|
| `imports/ui/DICOM/UploadPage.jsx` | Upload UI, file reading, base64 conversion, method calls |
| `imports/ui/DICOM/components/SimpleDicomViewport.jsx` | DICOM image preview after upload |

### Server

| File | Role |
|------|------|
| `imports/api/dicom/server/methods.js` | Two Meteor methods that store DICOM data |

### Methods

| Method | Line | Problem |
|--------|------|---------|
| `dicom.processUploadedFile` | L16-111 | Stores base64 data in `content[0].attachment.data` (L80) |
| `dicom.convertToFHIR` | L116-264 | Same pattern (L183), also creates ImagingStudy |

## Why It Fails

MongoDB's maximum BSON document size is **16 MB** (16,777,216 bytes). The BSON serializer allocates a buffer and fails when the document overflows it:

- Raw DICOM file: **33.5 MB**
- Base64-encoded: **~44.6 MB** (base64 adds ~33% overhead)
- Plus JSON structure, field names, metadata: **~44.7 MB**
- BSON buffer limit: **~17.8 MB** (serializer internal limit)

The error fires at `Buffer.write` inside the BSON serializer when it tries to write the base64 string past the buffer boundary.

## Additional Problems

Beyond the BSON limit, the current approach has other issues:

1. **DDP payload size**: Meteor's DDP WebSocket isn't designed for ~45 MB payloads. Even if MongoDB accepted the document, the DDP message may timeout or cause memory pressure.

2. **Client-side Minimongo insertion** (`UploadPage.jsx:280-330`): After server-side conversion, the client also inserts the full base64 data into Minimongo, consuming browser memory.

3. **No DICOM parsing**: The server method (`methods.js:147`) notes "For now, we'll extract basic info - in production, you'd use dicom-parser." The ImagingStudy created has hardcoded modality (`CT`) and dummy UIDs.

4. **No file size validation**: Neither client nor server checks file size before attempting the upload.

## Solution Approaches

### Option A: GridFS (MongoDB-native)

Store the DICOM binary in MongoDB GridFS, which chunks files into 255 KB pieces across a `fs.chunks` collection. Store only a reference in the DocumentReference.

**Pros**: No external storage dependency, stays within MongoDB ecosystem.
**Cons**: GridFS adds query complexity; not ideal for very large imaging studies.

### Option B: Filesystem + Reference

Write the DICOM file to the server filesystem (e.g., `private/dicom/`) and store the file path in the DocumentReference attachment. Serve files via a Meteor route or Express middleware.

**Pros**: Simple, no size limits, fast read/write.
**Cons**: Not portable across servers, no built-in replication.

### Option C: HTTP Upload + Filesystem (Recommended)

Replace the DDP-based upload with an HTTP multipart upload endpoint (Express/WebApp). Stream the file to disk or object storage. Store a URL reference in the FHIR DocumentReference's `content[0].attachment.url` field instead of `content[0].attachment.data`.

```javascript
// Instead of storing inline data:
content: [{
  attachment: {
    contentType: 'application/dicom',
    data: base64Data,  // 44.6 MB inline - BREAKS
    size: fileInfo.size
  }
}]

// Store a URL reference:
content: [{
  attachment: {
    contentType: 'application/dicom',
    url: `/api/dicom/files/${fileId}`,  // Reference to stored file
    size: fileInfo.size,
    title: fileInfo.filename
  }
}]
```

**Pros**: FHIR-compliant (`Attachment.url` is the standard approach for large files), eliminates base64 overhead, supports any file size, streaming-friendly.
**Cons**: Requires an HTTP endpoint and file serving route.

### Option D: Object Storage (S3/GCS)

Upload directly to cloud object storage with pre-signed URLs. Store the object URL in the DocumentReference.

**Pros**: Scalable, CDN-compatible, offloads storage from app server.
**Cons**: Requires cloud infrastructure, adds external dependency.

## FHIR Compliance Notes

The FHIR `Attachment` data type has two ways to reference content:

- `Attachment.data` (base64Binary): For small inline content. The FHIR spec notes: *"if both data and url are provided, the url SHALL point to the same content as the data contains."*
- `Attachment.url` (url): For externally-hosted content. This is the standard approach for large files like DICOM images.

For medical imaging, `Attachment.url` pointing to a WADO-RS endpoint or file serving route is the expected pattern. Using `Attachment.data` for multi-megabyte DICOM files is not a standard practice.

## Implementation Sketch (Option C)

### 1. Add HTTP Upload Endpoint

```javascript
// server/dicom-upload-endpoint.js
import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import path from 'path';
import fs from 'fs';

const DICOM_STORAGE_PATH = process.env.DICOM_STORAGE_PATH || 'private/dicom';

WebApp.connectHandlers.use('/api/dicom/upload', async (req, res) => {
  // Authenticate via token header
  // Parse multipart form data (use busboy or formidable)
  // Stream file to DICOM_STORAGE_PATH/{fileId}.dcm
  // Return { fileId, filename, size }
});

WebApp.connectHandlers.use('/api/dicom/files/', async (req, res) => {
  // Authenticate
  // Stream file from DICOM_STORAGE_PATH back to client
});
```

### 2. Update Client Upload

```javascript
// UploadPage.jsx - use fetch() instead of Meteor.call()
const formData = new FormData();
formData.append('dicomFile', file);

const response = await fetch('/api/dicom/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${Accounts._storedLoginToken()}` },
  body: formData
});

const { fileId } = await response.json();

// Then call Meteor method with fileId (not file data)
Meteor.call('dicom.processUploadedFile', { filename, fileId, size });
```

### 3. Update Server Method

```javascript
// Store reference, not data
content: [{
  attachment: {
    contentType: 'application/dicom',
    url: `/api/dicom/files/${fileId}`,
    title: fileInfo.filename,
    size: fileInfo.size
  }
}]
```

## Quick Fix (Stopgap)

If the goal is just to unblock uploads before a proper architecture is in place, a minimal fix would be:

1. Add client-side file size validation (reject files > 12 MB with a clear error message)
2. For files under the limit, the current flow works fine
3. For large files, show a message: "Files over 12 MB are not yet supported"

This doesn't solve the underlying architecture problem but prevents the cryptic BSON error.
