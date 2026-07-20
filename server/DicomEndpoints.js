// server/DicomEndpoints.js
// HTTP endpoints for DICOM file upload and download via GridFS
// Uses the same auth pipeline as FhirEndpoints.js (shared from server/lib/FhirAuth.js)

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { get } from 'lodash';

import {
  limiter,
  acl,
  parseUserAuthorization,
  isAuthorized,
  isResourceScopeAuthorized
} from './lib/FhirAuth.js';

import GridFSManager from './lib/GridFSManager.js';
import { corsMiddleware } from './lib/Cors.js';

const log = (Meteor.Logger ? Meteor.Logger.for('DicomEndpoints') : console);

console.log('[DicomEndpoints] Registering DICOM HTTP endpoints...');

// =============================================================================
// CORS Preflight
// Configured via Meteor.settings.private.cors — see server/lib/Cors.js
// (the legacy settings.private.fhir.corsOrigin key still works as a fallback)
// =============================================================================

WebApp.connectHandlers.use('/api/dicom', corsMiddleware());

// =============================================================================
// POST /api/dicom/upload - Upload DICOM file to GridFS
// =============================================================================

WebApp.connectHandlers.use('/api/dicom/upload', async function(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    // ---- Rate Limiting ----
    const hasTokens = await limiter.tryRemoveTokens(1);
    if (!hasTokens) {
      console.warn('[DicomEndpoints] Rate limit exceeded for upload');
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }));
      return;
    }

    // ---- Authentication ----
    const authorizationContext = await parseUserAuthorization(req);
    if (!authorizationContext || !(await isAuthorized(authorizationContext))) {
      console.warn('[DicomEndpoints] Upload unauthorized');
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized. Provide a valid session or Bearer token.' }));
      return;
    }

    // ---- Resource Scope Check ----
    if (!isResourceScopeAuthorized(authorizationContext, 'DocumentReference')) {
      console.warn('[DicomEndpoints] Upload forbidden - insufficient scope for DocumentReference');
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Insufficient scope for DocumentReference' }));
      return;
    }

    // ---- ACL Check ----
    // Skip ACL for 'noauth' role (dev mode with disableOauth, matches FhirEndpoints behavior)
    const userRole = get(authorizationContext, 'role', 'PAT');
    if (userRole !== 'noauth') {
      try {
        const permission = await acl.can(userRole).execute('access').on('DocumentReference');
        if (!permission.granted) {
          console.warn('[DicomEndpoints] Upload denied by ACL for role:', userRole);
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Access denied for role: ' + userRole }));
          return;
        }
      } catch (aclError) {
        console.warn('[DicomEndpoints] ACL check error:', aclError.message);
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Access denied' }));
        return;
      }
    }

    // ---- GridFS Check ----
    if (!GridFSManager.isInitialized()) {
      console.error('[DicomEndpoints] GridFS not initialized');
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'DICOM storage not available. GridFS not initialized.' }));
      return;
    }

    // ---- Parse Multipart Form Data ----
    // Dynamically import formidable (installed as dependency)
    const { default: formidable } = await import('formidable');

    const form = formidable({
      maxFileSize: 500 * 1024 * 1024, // 500 MB max
      // Stream directly to GridFS instead of buffering to disk
      fileWriteStreamHandler: function(file) {
        const metadata = {
          userId: get(authorizationContext, 'userId'),
          patientId: get(authorizationContext, 'patientId', ''),
          contentType: 'application/dicom',
          originalName: file ? file.originalFilename : 'unknown.dcm'
        };

        const uploadStream = GridFSManager.openUploadStream(
          metadata.originalName,
          metadata
        );

        // Store the GridFS file ID on the stream for later retrieval
        file._gridfsId = uploadStream.id.toString();

        return uploadStream;
      }
    });

    const [fields, files] = await form.parse(req);

    // Get the uploaded file info
    const dicomFile = files.dicomFile ? files.dicomFile[0] : null;
    if (!dicomFile) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No dicomFile field in upload. Use FormData with key "dicomFile".' }));
      return;
    }

    const fileId = dicomFile._gridfsId;
    const filename = dicomFile.originalFilename || 'unknown.dcm';
    const size = dicomFile.size || 0;

    console.log('[DicomEndpoints] Upload complete:', filename, '(' + size + ' bytes)', 'fileId:', fileId);

    // ---- Update GridFS Metadata with DICOM fields ----
    // Client can send parsed DICOM metadata to be stored in GridFS
    const dicomMetadataField = fields.dicomMetadata ? fields.dicomMetadata[0] : null;
    if (dicomMetadataField) {
      try {
        const dicomMetadata = JSON.parse(dicomMetadataField);
        console.log('[DicomEndpoints] Updating GridFS metadata with DICOM fields:', Object.keys(dicomMetadata));

        // Update the dicom.files document with DICOM metadata
        const bucket = GridFSManager.getBucket();
        const db = bucket.s.db;
        const filesCollection = db.collection('dicom.files');

        const { ObjectId } = await import('mongodb');
        await filesCollection.updateOne(
          { _id: new ObjectId(fileId) },
          {
            $set: {
              'metadata.studyInstanceUid': get(dicomMetadata, 'studyInstanceUid'),
              'metadata.seriesInstanceUid': get(dicomMetadata, 'seriesInstanceUid'),
              'metadata.sopInstanceUid': get(dicomMetadata, 'sopInstanceUid'),
              'metadata.sopClassUid': get(dicomMetadata, 'sopClassUid'),
              'metadata.modality': get(dicomMetadata, 'modality'),
              'metadata.studyDate': get(dicomMetadata, 'studyDate'),
              'metadata.studyDescription': get(dicomMetadata, 'studyDescription'),
              'metadata.seriesDescription': get(dicomMetadata, 'seriesDescription'),
              'metadata.seriesNumber': get(dicomMetadata, 'seriesNumber'),
              'metadata.instanceNumber': get(dicomMetadata, 'instanceNumber'),
              'metadata.dicomPatientName': get(dicomMetadata, 'dicomPatientName'),
              'metadata.dicomPatientId': get(dicomMetadata, 'dicomPatientId'),
              'metadata.dicomPatientBirthDate': get(dicomMetadata, 'dicomPatientBirthDate'),
              'metadata.dicomPatientSex': get(dicomMetadata, 'dicomPatientSex'),
              'metadata.rows': get(dicomMetadata, 'rows'),
              'metadata.columns': get(dicomMetadata, 'columns'),
              'metadata.bitsAllocated': get(dicomMetadata, 'bitsAllocated'),
              'metadata.transferSyntaxUid': get(dicomMetadata, 'transferSyntaxUid'),
              // Provenance: which client-side parser produced this metadata
              // ('dcmjs' | 'dicom-parser' fallback) — see DcmjsMetadata.js
              'metadata.parser': get(dicomMetadata, 'parser'),
              // Only update contentType if client provided it (non-DICOM files like MP4)
              ...(get(dicomMetadata, 'contentType') ? { 'metadata.contentType': dicomMetadata.contentType } : {})
            }
          }
        );

        console.log('[DicomEndpoints] GridFS metadata updated for fileId:', fileId);
      } catch (metadataError) {
        console.warn('[DicomEndpoints] Failed to update DICOM metadata:', metadataError.message);
        // Continue anyway - file is uploaded, metadata update is non-critical
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      fileId: fileId,
      filename: filename,
      size: size,
      url: '/api/dicom/files/' + fileId,
      message: 'DICOM file uploaded to GridFS'
    }));

  } catch (error) {
    console.error('[DicomEndpoints] Upload error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Upload failed: ' + error.message }));
  }
});

// =============================================================================
// GET /api/dicom/files/:fileId - Download DICOM file from GridFS
// =============================================================================

WebApp.connectHandlers.use('/api/dicom/files/', async function(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    // ---- Rate Limiting ----
    const hasTokens = await limiter.tryRemoveTokens(1);
    if (!hasTokens) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
      return;
    }

    // ---- Authentication ----
    const authorizationContext = await parseUserAuthorization(req);
    if (!authorizationContext || !(await isAuthorized(authorizationContext))) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    // ---- Resource Scope Check ----
    if (!isResourceScopeAuthorized(authorizationContext, 'DocumentReference')) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Insufficient scope' }));
      return;
    }

    // ---- GridFS Check ----
    if (!GridFSManager.isInitialized()) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'DICOM storage not available' }));
      return;
    }

    // ---- Extract File ID from URL ----
    // URL format: /api/dicom/files/{fileId}
    const urlPath = req.url.split('?')[0]; // Remove query params
    const fileId = urlPath.replace(/^\//, ''); // Remove leading slash

    if (!fileId || fileId.length < 12) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid file ID' }));
      return;
    }

    // ---- Find File Metadata ----
    const fileMeta = await GridFSManager.findFile(fileId);
    if (!fileMeta) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File not found' }));
      return;
    }

    // ---- Patient Compartment Check ----
    // If the requester is a patient, they can only access their own files
    if (get(authorizationContext, 'role') === 'patient') {
      const filePatientId = get(fileMeta, 'metadata.patientId');
      const requestPatientId = get(authorizationContext, 'patientId');
      if (filePatientId && requestPatientId && filePatientId !== requestPatientId) {
        log.warn('Patient compartment violation', { requestPatientId, filePatientId });
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Access denied - patient compartment restriction' }));
        return;
      }
    }

    // ---- Stream File ----
    const contentType = get(fileMeta, 'metadata.contentType', 'application/dicom');
    const filename = fileMeta.filename || 'download.dcm';
    const fileLength = fileMeta.length || 0;

    // Check for Range request (partial content)
    const rangeHeader = get(req, 'headers.range');
    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : fileLength - 1;
        const chunkSize = end - start + 1;

        res.writeHead(206, {
          'Content-Type': contentType,
          'Content-Length': chunkSize,
          'Content-Range': 'bytes ' + start + '-' + end + '/' + fileLength,
          'Accept-Ranges': 'bytes',
          'Content-Disposition': 'inline; filename="' + filename + '"'
        });

        const downloadStream = GridFSManager.openDownloadStream(fileId, { start: start, end: end + 1 });
        downloadStream.pipe(res);
        return;
      }
    }

    // Full file response
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': fileLength,
      'Accept-Ranges': 'bytes',
      'Content-Disposition': 'inline; filename="' + filename + '"'
    });

    const downloadStream = GridFSManager.openDownloadStream(fileId);
    downloadStream.on('error', function(error) {
      console.error('[DicomEndpoints] Download stream error:', error.message);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Download failed' }));
      }
    });

    downloadStream.pipe(res);

  } catch (error) {
    console.error('[DicomEndpoints] Download error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Download failed: ' + error.message }));
    }
  }
});

console.log('[DicomEndpoints] DICOM HTTP endpoints registered: POST /api/dicom/upload, GET /api/dicom/files/:fileId');
