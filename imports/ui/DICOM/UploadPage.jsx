// imports/ui/DICOM/UploadPage.jsx
//
// DICOM intake console — two-column workstation layout:
//   left  = file manifest (dense, internally-scrolling console rows) +
//           de-identify controls + actions
//   right = always-visible viewer stage with pre-upload preview + tag diff
// The ENTIRE page is the drop target (full-page veil on drag-over; drops
// append with dedupe). Heights flow through the greedy-height flex cascade
// (.claude/rules/ui/layout-patterns.md) — no viewport math.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import-run provenance: register an ImportRuns record for this upload session
// so the batch is flushable from /import-data?tab=runs. Non-fatal — on failure
// the upload proceeds untagged (legacy behavior).
async function startDicomImportRun(filenames, patientId){
  try {
    var startResult = await Meteor.rpc('importRuns.start', { runData: {
      importType: 'dicom',
      origin: 'dicom-upload',
      filenames: filenames || [],
      patientId: patientId || null
    }});
    console.log('[UploadPage] Started import run:', get(startResult, 'importRunId'));
    return get(startResult, 'importRunId');
  } catch(error){
    console.warn('[UploadPage] Could not start import run (continuing without):', error.message);
    return undefined;
  }
}
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Transform as ConvertIcon,
  Security as ShieldIcon,
  Movie as MovieIcon,
  CenterFocusStrong as CrosshairIcon,
  Add as AddIcon,
  FolderOpen as FolderOpenIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import SimpleDicomViewport from './components/SimpleDicomViewport';
import DicomDeidentifyControls, { DEFAULT_DEID_CONTROLS, buildProcessingOptions } from './components/DicomDeidentifyControls';
import DicomTagDiffTable from './components/DicomTagDiffTable';
import ImportAttachmentBanner from '/imports/ui/components/ImportAttachmentBanner.jsx';
import { Session } from 'meteor/session';
import moment from 'moment';

// DICOM parsing imports (dcmjs with dicom-parser fallback)
import { extractAllDicomMetadataFromArrayBufferStream, flattenDicomMetadataForGridFS, isDicomPart10, sniffDicomFile, parseDicomdirIndex } from './utils/DcmjsMetadata';
// In-browser de-identification / tag filtering (dcmjs event-stream pipeline)
import { processDicomArrayBuffer, createBatchUidMapper, diffDicomTags } from './utils/DicomProcessing';

// Workstation console type stack — manifest rows, stats, telemetry
const MONO = '"SF Mono", "Cascadia Code", Menlo, Consolas, monospace';

// Video file detection
function isVideoFile(file) {
  const name = file.name.toLowerCase();
  return name.endsWith('.mp4') || file.type === 'video/mp4';
}

// Generate shared study/series metadata for a batch of video files
function generateVideoStudyMetadata() {
  return {
    studyInstanceUid: crypto.randomUUID(),
    seriesInstanceUid: crypto.randomUUID(),
    modality: 'US',
    studyDate: moment().format('YYYYMMDD'),
    studyDescription: 'Ultrasound Video'
  };
}

// Build per-file metadata for a video file (mirrors DICOM metadata shape)
function buildVideoFileMetadata(file, batchMeta, instanceNumber) {
  return {
    studyInstanceUid: batchMeta.studyInstanceUid,
    seriesInstanceUid: batchMeta.seriesInstanceUid,
    sopInstanceUid: crypto.randomUUID(),
    sopClassUid: '1.2.840.10008.5.1.4.1.1.6.1', // Ultrasound Image Storage
    modality: 'US',
    studyDate: batchMeta.studyDate,
    studyDescription: batchMeta.studyDescription,
    seriesDescription: 'Ultrasound Video Series',
    instanceNumber: instanceNumber,
    contentType: 'video/mp4'
  };
}

// Structured logger for the acquisition pipeline (Meteor.Logger registers at
// startup, so resolve lazily per call)
function getLog() {
  return (typeof Meteor !== 'undefined' && Meteor.Logger && Meteor.Logger.for('DicomUploadPage')) || console;
}

// Stable identity for dedupe when drops append. Includes the folder-relative
// path so same-named files in different series subfolders (IM000001 patterns
// on DICOM CDs) don't collide.
function fileKey(file) {
  const relPath = file.webkitRelativePath || file.honeycombRelativePath || '';
  return relPath + '|' + file.name + '|' + file.size + '|' + file.lastModified;
}

// Folder-relative parent directory of an acquired file ('' for loose files)
function fileFolder(file) {
  const rel = file.webkitRelativePath || file.honeycombRelativePath || '';
  const idx = rel.lastIndexOf('/');
  return idx > 0 ? rel.substring(0, idx) : '';
}

// Natural ordering so IM000002 sorts before IM000010
function naturalCompare(a, b) {
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

// One-line description of a parsed DICOMDIR index for the manifest row
function dicomdirSummaryLabel(summary) {
  if (!summary) {
    return '';
  }
  const parts = [];
  if (summary.imageCount > 0) {
    parts.push(summary.imageCount + ' image' + (summary.imageCount !== 1 ? 's' : ''));
  }
  if (summary.seriesCount > 0) {
    parts.push(summary.seriesCount + ' series');
  }
  if (summary.studyCount > 0) {
    parts.push(summary.studyCount + ' stud' + (summary.studyCount !== 1 ? 'ies' : 'y'));
  }
  if (parts.length === 0) {
    parts.push(summary.recordCount + ' records');
  }
  const label = parts.join(' · ');
  return summary.studyLabels && summary.studyLabels.length > 0
    ? summary.studyLabels[0] + ' — ' + label
    : label;
}

// Folder picking needs webkitdirectory (absent on iOS Safari) — hide the
// folder buttons where unsupported
const FOLDER_SELECT_SUPPORTED = typeof document !== 'undefined'
  && 'webkitdirectory' in document.createElement('input');

// ---------------------------------------------------------------------------
// Drag-and-drop directory traversal (webkitGetAsEntry API)
// ---------------------------------------------------------------------------

// Chrome caps each readEntries() call at 100 entries — loop until empty
function readAllDirectoryEntries(directoryReader) {
  return new Promise(function(resolve, reject) {
    const entries = [];
    function readBatch() {
      directoryReader.readEntries(function(batch) {
        if (batch.length === 0) {
          resolve(entries);
        } else {
          batch.forEach(function(entry) { entries.push(entry); });
          readBatch();
        }
      }, reject);
    }
    readBatch();
  });
}

// Recursively collect File objects from a FileSystemEntry, tagging each with
// its folder-relative path (expando) so fileKey/dedupe stay path-aware
async function traverseEntry(entry, collected) {
  if (!entry) {
    return;
  }
  if (entry.isFile) {
    const file = await new Promise(function(resolve, reject) {
      entry.file(resolve, reject);
    });
    try {
      file.honeycombRelativePath = (entry.fullPath || '').replace(/^\//, '');
    } catch (err) {
      // File expandos are writable in all shipping browsers; harmless if not
    }
    collected.push(file);
  } else if (entry.isDirectory) {
    const children = await readAllDirectoryEntries(entry.createReader());
    for (const child of children) {
      await traverseEntry(child, collected);
    }
  }
}

// Resolve a drop's DataTransfer into a flat File list, traversing dropped
// folders. DataTransferItems are only valid synchronously during the drop
// event, so all entries are snapshotted BEFORE the first await.
async function collectFilesFromDataTransfer(dataTransfer) {
  const items = Array.from(get(dataTransfer, 'items') || []);
  const entries = items
    .filter(function(item) { return item.kind === 'file' && typeof item.webkitGetAsEntry === 'function'; })
    .map(function(item) { return item.webkitGetAsEntry(); })
    .filter(Boolean);

  if (entries.length === 0) {
    // Older browsers (or non-entry drops): fall back to the flat file list
    getLog().info('[DicomUploadPage] webkitGetAsEntry unavailable — using flat dataTransfer.files');
    return Array.from(dataTransfer.files);
  }

  const collected = [];
  for (const entry of entries) {
    await traverseEntry(entry, collected);
  }
  return collected;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

// Theme hook
let useAppTheme;
let useNavigate;
let useSearchParams;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
  if (window.ReactRouter) {
    useNavigate = window.ReactRouter.useNavigate;
    useSearchParams = window.ReactRouter.useSearchParams;
  }
});

function UploadPage() {
  const navigate = useNavigate ? useNavigate() : null;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Parse URL parameters for navigation
  let backUrl = null;
  let nextUrl = null;
  var patientParam = null;
  var serviceRequestParam = null;
  if (useSearchParams) {
    const searchParamsResult = useSearchParams();
    const searchParams = searchParamsResult[0];
    backUrl = searchParams.get('back');
    nextUrl = searchParams.get('next');
    patientParam = searchParams.get('patient');
    serviceRequestParam = searchParams.get('servicerequest');
  }

  // Build forwarding query string for patient and servicerequest params
  var forwardParams = '';
  if (patientParam) {
    forwardParams += (forwardParams ? '&' : '?') + 'patient=' + encodeURIComponent(patientParam);
  }
  if (serviceRequestParam) {
    forwardParams += (forwardParams ? '&' : '?') + 'servicerequest=' + encodeURIComponent(serviceRequestParam);
  }

  // Get theme colors from settings
  const cardBgColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardColor', '#1e1e1e')
    : '#ffffff';
  const cardTextColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardTextColor', 'rgba(255, 255, 255, 0.87)')
    : 'rgba(0, 0, 0, 0.87)';
  const subheaderColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const hairline = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  // Upload state
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState([]);
  const [error, setError] = useState(null);
  const [converting, setConverting] = useState(false);

  // Folder-import acquisition state: detected DICOMDIR study indexes (shown
  // in the manifest, never uploaded), the running count of non-DICOM files
  // filtered by magic-byte sniffing, and scan progress for large folders
  const [dicomdirFiles, setDicomdirFiles] = useState([]);
  // Parsed DirectoryRecordSequence summaries, keyed by fileKey (null while
  // parsing / when unparseable)
  const [dicomdirSummaries, setDicomdirSummaries] = useState({});
  const [skippedCount, setSkippedCount] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(null);

  // Import-attachment preview (design v2 §E): tri-state null → loading → ready.
  // DICOM-derived Patient creation happens at /import-data, not here, so
  // payloadPatients is []. A URL ?patient= param (radiology-workflow flows)
  // takes precedence as the client selection, else the Session selection.
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  // De-identification / tag filter controls (shared control bag —
  // see DicomDeidentifyControls)
  const [deidControls, setDeidControls] = useState(DEFAULT_DEID_CONTROLS);
  // Viewer stage: which file is on the stage, its blob URL, and the
  // processed variant + tag diff after "Preview de-identified"
  const [previewFile, setPreviewFile] = useState(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState(null);
  const [processedPreview, setProcessedPreview] = useState(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  // Per-file phase label shown with the progress bar during upload
  const [processingPhase, setProcessingPhase] = useState(null);
  // Full-page drag-over veil
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);

  // Per-filename upload status for the manifest rows
  const resultsByName = {};
  uploadResults.forEach(function(result) {
    resultsByName[result.filename] = result;
  });

  const totalBytes = files.reduce(function(sum, f) { return sum + f.size; }, 0);
  const processingRequested = !!buildProcessingOptions(deidControls, null);

  // Keep the stage pointed at a valid file: default to the first non-video
  // file whenever the current preview target leaves the manifest.
  useEffect(function() {
    if (previewFile && files.indexOf(previewFile) !== -1) {
      return;
    }
    const firstPreviewable = files.find(function(f) { return !isVideoFile(f); }) || null;
    setPreviewFile(firstPreviewable);
  }, [files]); // eslint-disable-line react-hooks/exhaustive-deps

  // Maintain the stage blob URL for the selected file. Magic-byte check
  // reads only the first 132 bytes — no full-file load.
  useEffect(function() {
    let cancelled = false;
    setProcessedPreview(function(prev) {
      if (prev && prev.url) { URL.revokeObjectURL(prev.url); }
      return null;
    });
    setOriginalPreviewUrl(function(prev) {
      if (prev) { URL.revokeObjectURL(prev); }
      return null;
    });

    if (!previewFile || isVideoFile(previewFile)) {
      return;
    }
    previewFile.slice(0, 132).arrayBuffer().then(function(head) {
      if (!cancelled && isDicomPart10(head)) {
        setOriginalPreviewUrl(URL.createObjectURL(previewFile));
      }
    }).catch(function() {
      // not previewable — leave the stage empty
    });
    return function() { cancelled = true; };
  }, [previewFile]);

  // A control change invalidates any processed preview/diff on display
  useEffect(function() {
    setProcessedPreview(function(prev) {
      if (prev && prev.url) { URL.revokeObjectURL(prev.url); }
      return null;
    });
  }, [deidControls]);

  // Preview which patient this DICOM upload would attach to (design v2 §E).
  // Side-effect-free; non-fatal on error (banner hidden). payloadPatients: []
  // — DICOM-derived Patient creation lives at /import-data, not this page.
  useEffect(function() {
    let cancelled = false;
    setAttachmentPreview(null);
    const clientPatientId = patientParam || Session.get('selectedPatientId') || null;
    Meteor.rpc('importAttachment.preview', {
      clientPatientId: clientPatientId,
      payloadPatients: []
    }).then(function(result) {
      if (!cancelled) { setAttachmentPreview(result); }
    }).catch(function(err) {
      console.warn('[UploadPage] importAttachment.preview failed (banner hidden):', get(err, 'message'));
      if (!cancelled) { setAttachmentPreview(null); }
    });
    return function() { cancelled = true; };
  }, [patientParam]);

  // Append new files (dedupe by name+size+mtime); drops and browses add,
  // they never replace
  const addFiles = useCallback(function(incoming) {
    setFiles(function(prevFiles) {
      const seen = {};
      prevFiles.forEach(function(f) { seen[fileKey(f)] = true; });
      const additions = incoming.filter(function(f) { return !seen[fileKey(f)]; });
      return additions.length > 0 ? prevFiles.concat(additions) : prevFiles;
    });
    setUploadResults([]);
    setError(null);
  }, []);

  // Single acquisition entry point for browse / folder browse / drop.
  // Classifies by content (DICM magic-byte sniff of the first 4 KB), routing
  // DICOMDIR study indexes to their own informational list and counting
  // skipped non-DICOM files — extension filtering is gone, this is the gate.
  const acquireFiles = useCallback(async function(incoming) {
    if (!incoming || incoming.length === 0) {
      return;
    }
    const log = getLog();
    setScanning(true);
    setScanProgress({ done: 0, total: incoming.length });
    try {
      const accepted = [];
      const dicomdirs = [];
      const skippedNames = [];

      // Videos bypass the sniff entirely (no read) — preserves the mp4 path
      const toSniff = [];
      incoming.forEach(function(file) {
        if (isVideoFile(file)) {
          accepted.push(file);
        } else {
          toSniff.push(file);
        }
      });
      let done = incoming.length - toSniff.length;
      setScanProgress({ done: done, total: incoming.length });

      // Chunked concurrency so a multi-thousand-file CD doesn't open
      // unbounded file handles
      const CHUNK = 24;
      for (let i = 0; i < toSniff.length; i += CHUNK) {
        const chunk = toSniff.slice(i, i + CHUNK);
        const kinds = await Promise.all(chunk.map(function(file) { return sniffDicomFile(file); }));
        kinds.forEach(function(kind, j) {
          const file = chunk[j];
          if (kind === 'dicom') {
            accepted.push(file);
          } else if (kind === 'dicomdir') {
            dicomdirs.push(file);
          } else {
            skippedNames.push(file.honeycombRelativePath || file.webkitRelativePath || file.name);
          }
        });
        done += chunk.length;
        setScanProgress({ done: done, total: incoming.length });
      }

      if (dicomdirs.length > 0) {
        log.info('[DicomUploadPage] DICOMDIR study index detected — shown in manifest, not uploaded', {
          count: dicomdirs.length
        });
        setDicomdirFiles(function(prev) {
          const seen = {};
          prev.forEach(function(f) { seen[fileKey(f)] = true; });
          const additions = dicomdirs.filter(function(f) { return !seen[fileKey(f)]; });
          return additions.length > 0 ? prev.concat(additions) : prev;
        });
        // Parse each index (DICOMDIRs are small — a full read is fine) so the
        // manifest row can show what the directory references
        for (const dirFile of dicomdirs) {
          const key = fileKey(dirFile);
          try {
            const dirBuffer = await dirFile.arrayBuffer();
            const summary = parseDicomdirIndex(dirBuffer);
            if (summary) {
              log.info('[DicomUploadPage] Parsed DICOMDIR index', {
                images: summary.imageCount,
                series: summary.seriesCount,
                studies: summary.studyCount
              });
            } else {
              log.warn('[DicomUploadPage] DICOMDIR index could not be parsed', { name: dirFile.name });
            }
            setDicomdirSummaries(function(prev) {
              const next = { ...prev };
              next[key] = summary;
              return next;
            });
          } catch (err) {
            log.warn('[DicomUploadPage] Failed to read DICOMDIR for index parse', { error: get(err, 'message') });
          }
        }
      }
      if (skippedNames.length > 0) {
        log.info('[DicomUploadPage] Skipped non-DICOM files (no DICM signature)', {
          count: skippedNames.length,
          sample: skippedNames.slice(0, 10)
        });
        setSkippedCount(function(prev) { return prev + skippedNames.length; });
      }

      if (accepted.length > 0) {
        addFiles(accepted);
      } else if (dicomdirs.length === 0) {
        setError('No DICOM or video files found in the selection ('
          + skippedNames.length + ' file' + (skippedNames.length !== 1 ? 's' : '') + ' skipped).');
      }
    } finally {
      setScanning(false);
      setScanProgress(null);
    }
  }, [addFiles]);

  const handleFileSelect = function(event) {
    const selection = Array.from(event.target.files);
    event.target.value = ''; // allow re-selecting the same files
    acquireFiles(selection).catch(function(err) {
      getLog().error('[DicomUploadPage] File selection scan failed', { error: get(err, 'message') });
      setError(err.message || 'Failed to read the selected files');
    });
  };

  // Folder input (webkitdirectory) yields a flat recursive FileList with
  // webkitRelativePath populated — same pipeline as loose files
  const handleFolderSelect = function(event) {
    const selection = Array.from(event.target.files);
    event.target.value = '';
    acquireFiles(selection).catch(function(err) {
      getLog().error('[DicomUploadPage] Folder scan failed', { error: get(err, 'message') });
      setError(err.message || 'Failed to read the selected folder');
    });
  };

  // Whole-page drop target with enter/leave counting (child churn fires
  // spurious dragleave events; the counter keeps the veil stable)
  const handleDragEnter = useCallback(function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer && Array.from(event.dataTransfer.types || []).indexOf('Files') !== -1) {
      dragCounter.current++;
      setDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback(function(event) {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback(function(event) {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(function(event) {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current = 0;
    setDragActive(false);
    // Snapshot of DataTransferItems happens synchronously inside
    // collectFilesFromDataTransfer (items die after the first await)
    collectFilesFromDataTransfer(event.dataTransfer).then(function(dropped) {
      return acquireFiles(dropped);
    }).catch(function(err) {
      getLog().error('[DicomUploadPage] Drop traversal failed', { error: get(err, 'message') });
      setError(err.message || 'Failed to read the dropped files');
    });
  }, [acquireFiles]);

  const handleRemoveFile = function(index) {
    setFiles(function(prevFiles) {
      return prevFiles.filter(function(_, i) {
        return i !== index;
      });
    });
  };

  const handleRemoveDicomdir = function(index) {
    setDicomdirFiles(function(prev) {
      return prev.filter(function(_, i) {
        return i !== index;
      });
    });
  };

  const handleClearAll = function() {
    setFiles([]);
    setDicomdirFiles([]);
    setDicomdirSummaries({});
    setSkippedCount(0);
    setUploadResults([]);
    setError(null);
  };

  // The patient this batch imports to: explicit URL param wins, else the
  // Session-selected patient — the same resolution the attachment banner
  // shows. Read at call time so a mid-session selection change is honored.
  const getEffectivePatientId = function() {
    return patientParam || Session.get('selectedPatientId') || null;
  };

  // Helper: Upload a single file to GridFS via HTTP
  // Uses XHR for real upload progress tracking
  // Now accepts optional dicomMetadata to store DICOM UIDs in GridFS
  const uploadFileToGridFS = function(file, onProgress, dicomMetadata) {
    return new Promise(function(resolve, reject) {
      const formData = new FormData();
      formData.append('dicomFile', file);

      // Include parsed DICOM metadata if available
      if (dicomMetadata) {
        formData.append('dicomMetadata', JSON.stringify(dicomMetadata));
      }

      // Attach the importing patient so GridFS metadata.patientId reflects
      // the selection, not just the auth token's patient claim
      const effectivePatientId = getEffectivePatientId();
      if (effectivePatientId) {
        formData.append('patientId', effectivePatientId);
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/dicom/upload');

      // Send Meteor login token for authentication
      const loginToken = localStorage.getItem('Meteor.loginToken');
      if (loginToken) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + loginToken);
      }

      // Real byte-level progress tracking
      xhr.upload.onprogress = function(event) {
        if (event.lengthComputable && onProgress) {
          onProgress((event.loaded / event.total) * 100);
        }
      };

      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        } else if (xhr.status === 401) {
          reject(new Error('Unauthorized. Please log in and try again.'));
        } else if (xhr.status === 429) {
          reject(new Error('Rate limit exceeded. Please wait and try again.'));
        } else if (xhr.status === 503) {
          reject(new Error('DICOM storage not available. GridFS may not be initialized.'));
        } else {
          try {
            const errBody = JSON.parse(xhr.responseText);
            reject(new Error(errBody.error || 'Upload failed'));
          } catch (e) {
            reject(new Error('Upload failed with status ' + xhr.status));
          }
        }
      };

      xhr.onerror = function() {
        reject(new Error('Network error during upload'));
      };

      xhr.send(formData);
    });
  };

  // Prepare a DICOM file for upload: optionally run it through the
  // de-identify/filter pipeline, then extract metadata FROM THE BYTES THAT
  // WILL BE STORED. Returns { uploadFile, dicomMetadata }.
  //
  // PHI-safety: when processing is enabled and the dcmjs parse fails, this
  // THROWS and the file is not uploaded — we never fall back to sending the
  // original identified bytes.
  const prepareDicomFileForUpload = async function(file, uidMapper) {
    const arrayBuffer = await file.arrayBuffer();
    const options = buildProcessingOptions(deidControls, uidMapper);

    if (!options) {
      // Untouched path (legacy behavior): a metadata parse failure is
      // non-blocking — the file still uploads, just without DICOM metadata.
      // Parse via the dcmjs event stream (async; falls back to eager dcmjs →
      // dicom-parser internally). Stamps parser: 'dcmjs-stream' on the result.
      const metadata = await extractAllDicomMetadataFromArrayBufferStream(arrayBuffer);
      if (!metadata) {
        console.warn('[UploadPage] No metadata extracted from DICOM file:', file.name);
      }
      return {
        uploadFile: file,
        dicomMetadata: metadata ? flattenDicomMetadataForGridFS(metadata) : null
      };
    }

    let processed;
    try {
      processed = await processDicomArrayBuffer(arrayBuffer, options);
    } catch (processError) {
      throw new Error('De-identification failed — file NOT uploaded: ' + processError.message);
    }

    const metadata = await extractAllDicomMetadataFromArrayBufferStream(processed.outputBuffer);
    if (metadata) {
      metadata.deidentified = !!options.anonymize;
      metadata.deidMethod = processed.deidMethod;
      console.log('[UploadPage] Processed DICOM file:', file.name, {
        deidMethod: processed.deidMethod,
        studyInstanceUid: get(metadata, 'study.studyInstanceUid')
      });
    }

    return {
      uploadFile: new File([processed.outputBuffer], file.name, { type: 'application/dicom' }),
      dicomMetadata: metadata ? flattenDicomMetadataForGridFS(metadata) : null
    };
  };

  // Run the staged file through the pipeline and show the result + tag diff
  // on the viewer stage (throwaway UID mapper — the real batch mapper is
  // created at upload time).
  const handlePreviewDeidentified = async function() {
    if (!previewFile) { return; }

    setPreviewBusy(true);
    setError(null);
    try {
      const arrayBuffer = await previewFile.arrayBuffer();
      const options = buildProcessingOptions(deidControls, createBatchUidMapper());
      if (!options) {
        setError('Enable de-identify or add tag filters to preview changes.');
        return;
      }
      const processed = await processDicomArrayBuffer(arrayBuffer, options);
      const diff = diffDicomTags(arrayBuffer, processed.outputBuffer);
      const url = URL.createObjectURL(new Blob([processed.outputBuffer], { type: 'application/dicom' }));
      setProcessedPreview(function(prev) {
        if (prev && prev.url) { URL.revokeObjectURL(prev.url); }
        return { url: url, diff: diff };
      });
    } catch (err) {
      console.error('[UploadPage] De-identify preview error:', err);
      setError('De-identify preview failed: ' + (err.message || String(err)));
    } finally {
      setPreviewBusy(false);
    }
  };

  // Handle upload (stores file in GridFS, creates FHIR resources)
  const handleUpload = async function() {
    if (files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    const results = [];
    let firstProcessedFile = null;

    // Pre-generate shared metadata for video files in this batch
    const hasVideoFiles = files.some(isVideoFile);
    const videoBatchMeta = hasVideoFiles ? generateVideoStudyMetadata() : null;
    let videoInstanceCounter = 0;

    // One UID mapper per batch: the same original StudyInstanceUID maps to
    // the same replacement across every file, so regenerated studies still
    // aggregate into one ImagingStudy.
    const batchUidMapper = createBatchUidMapper();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Generate metadata: video files get synthetic metadata, DICOM files
        // run through the (optional) de-identify/filter pipeline
        let dicomMetadata;
        let uploadFile = file;
        if (isVideoFile(file)) {
          videoInstanceCounter++;
          dicomMetadata = buildVideoFileMetadata(file, videoBatchMeta, videoInstanceCounter);
          console.log('[UploadPage] Generated video metadata for', file.name, '(instance', videoInstanceCounter, ')');
        } else {
          setProcessingPhase('Processing ' + (i + 1) + ' of ' + files.length + '…');
          const prepared = await prepareDicomFileForUpload(file, batchUidMapper);
          uploadFile = prepared.uploadFile;
          dicomMetadata = prepared.dicomMetadata;
        }

        // Upload file to GridFS via HTTP (with metadata)
        setProcessingPhase('Uploading ' + (i + 1) + ' of ' + files.length + '…');

        const uploadResult = await uploadFileToGridFS(uploadFile, function(fileProgress) {
          // Combine per-file progress with overall progress
          const overallProgress = ((i + fileProgress / 100) / files.length) * 100;
          setUploadProgress(overallProgress);
        }, dicomMetadata);

        // Store result for later aggregation (don't create FHIR resources per-file)
        results.push({
          filename: file.name,
          success: true,
          fileId: uploadResult.fileId,
          message: 'Uploaded to GridFS with DICOM metadata'
        });

        // Keep the first PROCESSED file for the stage, so what you see is
        // what was stored
        if (!firstProcessedFile && !isVideoFile(file)) {
          firstProcessedFile = uploadFile;
        }
      } catch (err) {
        console.error('Upload error for', file.name, ':', err);
        results.push({
          filename: file.name,
          success: false,
          error: err.message || 'Upload failed'
        });
      }
    }

    // After all files uploaded, create aggregated ImagingStudy resources
    const successfulFileIds = results
      .filter(function(r) { return r.success && r.fileId; })
      .map(function(r) { return r.fileId; });

    if (successfulFileIds.length > 0) {
      console.log('[UploadPage] Creating aggregated ImagingStudy for', successfulFileIds.length, 'files');

      try {
        var uploadMethodOptions = {};
        var uploadPatientId = getEffectivePatientId();
        if (uploadPatientId) {
          uploadMethodOptions.patientId = uploadPatientId;
        } else {
          console.warn('[UploadPage] No patient selected — ImagingStudy will use the server default subject');
        }
        if (serviceRequestParam) {
          uploadMethodOptions.serviceRequestId = serviceRequestParam;
        }

        var uploadRunId = await startDicomImportRun(
          results.filter(function(r){ return r.success; }).map(function(r){ return r.filename; }),
          uploadPatientId
        );
        if (uploadRunId) {
          uploadMethodOptions.importRunId = uploadRunId;
        }

        const aggregationResult = await Meteor.rpc('dicom.createOrUpdateImagingStudy', { gridfsFileIds: successfulFileIds, options: uploadMethodOptions });

        console.log('[UploadPage] ImagingStudy aggregation result:', aggregationResult);

        // Update results with aggregation info
        if (aggregationResult.studies && aggregationResult.studies.length > 0) {
          const studyInfo = aggregationResult.studies.map(function(s) {
            return s.action + ' ImagingStudy with ' + s.instanceCount + ' instances';
          }).join(', ');

          results.forEach(function(r) {
            if (r.success) {
              r.message = r.message + ' (' + studyInfo + ')';
            }
          });
        }
      } catch (aggregationError) {
        console.error('[UploadPage] ImagingStudy aggregation error:', aggregationError);
        // Don't fail the whole upload, just log the error
      }
    }

    setUploadResults(results);
    setUploading(false);
    setUploadProgress(100);
    setProcessingPhase(null);

    // Put the stored bytes on the stage (processed file when de-identifying)
    if (firstProcessedFile) {
      setPreviewFile(firstProcessedFile);
    }
  };

  // Handle convert to FHIR (uploads to GridFS + creates aggregated ImagingStudy, then navigates to studies)
  const handleConvertToFHIR = async function() {
    if (files.length === 0) {
      setError('Please select files to convert');
      return;
    }

    setConverting(true);
    setError(null);
    const results = [];
    const uploadedFileIds = [];

    try {
      // Pre-generate shared metadata for video files in this batch
      const hasVideoFiles = files.some(isVideoFile);
      const videoBatchMeta = hasVideoFiles ? generateVideoStudyMetadata() : null;
      let videoInstanceCounter = 0;

      // One UID mapper per batch (see handleUpload)
      const batchUidMapper = createBatchUidMapper();

      // Step 1: Upload all files to GridFS with DICOM metadata
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          // Generate metadata: video files get synthetic metadata, DICOM
          // files run through the (optional) de-identify/filter pipeline
          let dicomMetadata;
          let uploadFile = file;
          if (isVideoFile(file)) {
            videoInstanceCounter++;
            dicomMetadata = buildVideoFileMetadata(file, videoBatchMeta, videoInstanceCounter);
            console.log('[UploadPage] Generated video metadata for', file.name, '(instance', videoInstanceCounter, ')');
          } else {
            setProcessingPhase('Processing ' + (i + 1) + ' of ' + files.length + '…');
            const prepared = await prepareDicomFileForUpload(file, batchUidMapper);
            uploadFile = prepared.uploadFile;
            dicomMetadata = prepared.dicomMetadata;
          }

          // Upload file to GridFS via HTTP (with metadata)
          const uploadResult = await uploadFileToGridFS(uploadFile, null, dicomMetadata);

          results.push({
            filename: file.name,
            success: true,
            fileId: uploadResult.fileId,
            message: 'Uploaded to GridFS'
          });

          uploadedFileIds.push(uploadResult.fileId);

        } catch (err) {
          console.error('[UploadPage] Conversion error for', file.name, ':', err);
          results.push({
            filename: file.name,
            success: false,
            error: err.message || 'Upload failed'
          });
        }
      }

      // Step 2: Create aggregated ImagingStudy from all uploaded files
      let aggregationResult = null;
      if (uploadedFileIds.length > 0) {
        console.log('[UploadPage] Creating aggregated ImagingStudy for', uploadedFileIds.length, 'files');

        var convertMethodOptions = {};
        var convertPatientId = getEffectivePatientId();
        if (convertPatientId) {
          convertMethodOptions.patientId = convertPatientId;
        } else {
          console.warn('[UploadPage] No patient selected — ImagingStudy will use the server default subject');
        }
        if (serviceRequestParam) {
          convertMethodOptions.serviceRequestId = serviceRequestParam;
        }

        var convertRunId = await startDicomImportRun(
          results.filter(function(r){ return r.success; }).map(function(r){ return r.filename; }),
          convertPatientId
        );
        if (convertRunId) {
          convertMethodOptions.importRunId = convertRunId;
        }

        aggregationResult = await Meteor.rpc('dicom.createOrUpdateImagingStudy', { gridfsFileIds: uploadedFileIds, options: convertMethodOptions });

        console.log('[UploadPage] ImagingStudy aggregation result:', aggregationResult);

        // Update results with aggregation info
        if (aggregationResult.studies && aggregationResult.studies.length > 0) {
          const studyInfo = aggregationResult.studies.map(function(s) {
            return s.action + ' ImagingStudy: ' + s.seriesCount + ' series, ' + s.instanceCount + ' instances';
          }).join('; ');

          results.forEach(function(r) {
            if (r.success) {
              r.message = studyInfo;
            }
          });
        }
      }

      setUploadResults(results);
      setProcessingPhase(null);

      // Check if any conversions succeeded
      const successCount = results.filter(function(r) { return r.success; }).length;
      if (successCount > 0) {
        // Return to the launch tab if one was requested (?next — e.g. the DICOM
        // Files tab override); otherwise default to the Imaging Studies tab to
        // show the new FHIR resources.
        if (navigate) {
          navigate(nextUrl || ('/dicom/studies' + forwardParams), { state: { aggregationResult: aggregationResult } });
        }
      }
    } catch (err) {
      console.error('[UploadPage] FHIR conversion error:', err);
      setError(err.message || 'Failed to convert to FHIR');
    } finally {
      setConverting(false);
      setProcessingPhase(null);
    }
  };

  const busy = uploading || converting || scanning;

  // Manifest rows grouped by source folder (webkitRelativePath / drop
  // traversal path), preserving each file's original index for removal and
  // result lookup. Loose files ('' folder) render first, without a header.
  const fileGroups = {};
  files.forEach(function(file, index) {
    const folder = fileFolder(file);
    if (!fileGroups[folder]) {
      fileGroups[folder] = [];
    }
    fileGroups[folder].push({ file: file, index: index });
  });
  const folderNames = Object.keys(fileGroups).sort(naturalCompare);
  folderNames.forEach(function(folder) {
    fileGroups[folder].sort(function(a, b) { return naturalCompare(a.file.name, b.file.name); });
  });
  const successCount = uploadResults.filter(function(r) { return r.success; }).length;
  const failureCount = uploadResults.length - successCount;
  const stageUrl = processedPreview ? processedPreview.url : originalPreviewUrl;

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <Box
      id="dicomUploadPage"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Full-page drop veil */}
      {dragActive && (
        <Box sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          pointerEvents: 'none',
          bgcolor: isDark ? 'rgba(0, 0, 0, 0.72)' : 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(3px)',
          border: '2px dashed',
          borderColor: 'primary.main',
          m: 1.5,
          borderRadius: 2
        }}>
          <UploadIcon sx={{ fontSize: 64, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontFamily: MONO, letterSpacing: '0.1em', color: cardTextColor }}>
            DROP TO ADD FILES
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: MONO, color: subheaderColor }}>
            DICOM · DICOMDIR folders · .mp4 — added to the current batch
          </Typography>
        </Box>
      )}

      {/* Page header */}
      <Box sx={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'baseline',
        gap: 2,
        px: 3,
        pt: 2.5,
        pb: 1.5
      }}>
        <Typography variant="h5" sx={{ color: cardTextColor, fontWeight: 600 }}>
          DICOM Upload
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: MONO, color: subheaderColor }}>
          {files.length > 0
            ? files.length + ' file' + (files.length !== 1 ? 's' : '') + ' · ' + formatFileSize(totalBytes)
            : 'drop files anywhere on this page'}
        </Typography>
        <Box sx={{ flex: 1 }} />
        {nextUrl && navigate && (
          <Button size="small" variant="outlined" onClick={() => navigate(nextUrl)}>
            Next
          </Button>
        )}
        {backUrl && navigate && (
          <Button size="small" variant="outlined" startIcon={<BackIcon />} onClick={() => navigate(backUrl)} sx={{ color: cardTextColor }}>
            Back
          </Button>
        )}
      </Box>

      {/* Two-column body — greedy height via the flex cascade */}
      <Box sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        px: 3,
        pb: 3,
        overflow: { xs: 'auto', md: 'hidden' }
      }}>

        {/* LEFT — manifest + controls + actions */}
        <Box sx={{
          width: { xs: '100%', md: 420 },
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: { md: 0 },
          gap: 2
        }}>
          {files.length === 0 && dicomdirFiles.length === 0 ? (
            /* Empty state: the hero dropzone IS the manifest panel */
            <Card sx={{ flex: 1, minHeight: 320, bgcolor: cardBgColor, color: cardTextColor, display: 'flex' }}>
              <CardContent sx={{ flex: 1, display: 'flex' }}>
                <Box
                  onClick={() => document.getElementById('file-input').click()}
                  sx={{
                    flex: 1,
                    border: '2px dashed',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 120ms, background-color 120ms',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: isDark ? 'rgba(66, 165, 245, 0.08)' : 'rgba(66, 165, 245, 0.04)'
                    }
                  }}
                >
                  <UploadIcon sx={{ fontSize: 48, color: subheaderColor }} />
                  <Typography variant="h6" sx={{ color: cardTextColor }}>
                    Drag and drop DICOM files, folders, or videos
                  </Typography>
                  <Typography variant="body2" sx={{ color: subheaderColor }}>
                    anywhere on this page, or click to browse
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button variant="contained" component="span">
                      Select Files
                    </Button>
                    {FOLDER_SELECT_SUPPORTED && (
                      <Tooltip title="Your browser will ask you to confirm folder access — that prompt is browser security UI. Dropping the folder onto this page skips it.">
                        <Button
                          id="selectFolderButton"
                          variant="outlined"
                          startIcon={<FolderOpenIcon />}
                          onClick={function(event) {
                            event.stopPropagation();
                            document.getElementById('folder-input').click();
                          }}
                        >
                          Select Folder
                        </Button>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ) : (
            /* Manifest: dense console rows, internally scrolling */
            <Card sx={{
              flex: 1,
              minHeight: { md: 160 },
              maxHeight: { xs: 320, md: 'none' },
              bgcolor: cardBgColor,
              color: cardTextColor,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Manifest header */}
              <Box sx={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                borderBottom: '1px solid ' + hairline
              }}>
                <Typography variant="caption" sx={{ fontFamily: MONO, color: subheaderColor, letterSpacing: '0.08em' }}>
                  MANIFEST
                </Typography>
                <Chip label={files.length} size="small" sx={{ height: 18, fontFamily: MONO, fontSize: '0.7rem' }} />
                {dicomdirFiles.length > 0 && (
                  <Chip
                    label={'+' + dicomdirFiles.length + ' index'}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontFamily: MONO, fontSize: '0.7rem', color: subheaderColor }}
                  />
                )}
                <Box sx={{ flex: 1 }} />
                <Button
                  id="addFilesButton"
                  size="small"
                  startIcon={<AddIcon />}
                  disabled={busy}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  Add
                </Button>
                {FOLDER_SELECT_SUPPORTED && (
                  <Tooltip title="Your browser will ask you to confirm folder access — that prompt is browser security UI. Dropping the folder onto this page skips it.">
                    <Button
                      id="addFolderButton"
                      size="small"
                      startIcon={<FolderOpenIcon />}
                      disabled={busy}
                      onClick={() => document.getElementById('folder-input').click()}
                    >
                      Folder
                    </Button>
                  </Tooltip>
                )}
                <Button size="small" disabled={busy} onClick={handleClearAll} sx={{ color: subheaderColor }}>
                  Clear
                </Button>
              </Box>

              {/* Acquisition notices: scan progress / skipped non-DICOM count */}
              {scanning && (
                <Box sx={{ flexShrink: 0, px: 2, py: 0.5, borderBottom: '1px solid ' + hairline }}>
                  <Typography variant="caption" sx={{ fontFamily: MONO, color: subheaderColor }}>
                    {scanProgress
                      ? 'Scanning ' + scanProgress.done + '/' + scanProgress.total + '…'
                      : 'Scanning…'}
                  </Typography>
                  <LinearProgress sx={{ mt: 0.5, height: 2 }} />
                </Box>
              )}
              {!scanning && skippedCount > 0 && (
                <Box sx={{ flexShrink: 0, px: 2, py: 0.5, borderBottom: '1px solid ' + hairline }}>
                  <Typography variant="caption" sx={{ fontFamily: MONO, color: subheaderColor }}>
                    Skipped {skippedCount} non-DICOM file{skippedCount !== 1 ? 's' : ''} (no DICM signature)
                  </Typography>
                </Box>
              )}

              {/* Scrolling rows */}
              <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {/* DICOMDIR study indexes — informational, never uploaded */}
                {dicomdirFiles.map(function(file, index) {
                  const summary = dicomdirSummaries[fileKey(file)];
                  return (
                    <Box
                      key={fileKey(file)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 0.4,
                        borderLeft: '2px solid transparent',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
                        },
                        '&:hover .row-delete': { opacity: 1 }
                      }}
                    >
                      <Box sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        flexShrink: 0,
                        bgcolor: subheaderColor
                      }} />
                      <ArticleIcon sx={{ fontSize: 14, color: subheaderColor, flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{
                          fontFamily: MONO,
                          fontSize: '0.75rem',
                          color: cardTextColor
                        }}>
                          {file.name}
                        </Typography>
                        {summary && (
                          <Typography noWrap sx={{
                            fontFamily: MONO,
                            fontSize: '0.65rem',
                            color: subheaderColor
                          }}>
                            {dicomdirSummaryLabel(summary)}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label="STUDY INDEX — NOT UPLOADED"
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontFamily: MONO, fontSize: '0.6rem', color: subheaderColor, flexShrink: 0 }}
                      />
                      {!busy && (
                        <IconButton
                          className="row-delete"
                          size="small"
                          aria-label="Delete"
                          onClick={function() { handleRemoveDicomdir(index); }}
                          sx={{ p: 0.25, opacity: 0, transition: 'opacity 120ms', color: subheaderColor }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </Box>
                  );
                })}
                {/* Index-only selection: the browser sandbox can't open files
                    a DICOMDIR references — only a folder selection can */}
                {!scanning && files.length === 0 && dicomdirFiles.length > 0 && (
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="caption" sx={{ fontFamily: MONO, color: subheaderColor }}>
                      This is only the study index — browsers can't open the
                      files it references from the index alone. Use FOLDER (or
                      drop the whole folder) to load the images listed above.
                    </Typography>
                  </Box>
                )}
                {folderNames.map(function(folder) {
                  return (
                    <React.Fragment key={folder || '(loose files)'}>
                      {folder !== '' && (
                        <Box sx={{
                          position: 'sticky',
                          top: 0,
                          zIndex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          px: 2,
                          py: 0.3,
                          bgcolor: cardBgColor,
                          borderBottom: '1px solid ' + hairline
                        }}>
                          <FolderOpenIcon sx={{ fontSize: 12, color: subheaderColor, flexShrink: 0 }} />
                          <Typography noWrap sx={{
                            flex: 1,
                            fontFamily: MONO,
                            fontSize: '0.65rem',
                            letterSpacing: '0.05em',
                            color: subheaderColor
                          }}>
                            {folder}
                          </Typography>
                          <Typography sx={{ fontFamily: MONO, fontSize: '0.65rem', color: subheaderColor, flexShrink: 0 }}>
                            {fileGroups[folder].length}
                          </Typography>
                        </Box>
                      )}
                      {fileGroups[folder].map(function(entry) {
                        const file = entry.file;
                        const index = entry.index;
                  const result = resultsByName[file.name];
                  const isStaged = file === previewFile;
                  const isVideo = isVideoFile(file);
                  const statusColor = result
                    ? (result.success ? 'success.main' : 'error.main')
                    : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)');

                  return (
                    <Tooltip
                      key={fileKey(file)}
                      title={result ? (result.success ? result.message : result.error) : ''}
                      placement="right"
                      disableInteractive
                    >
                      <Box
                        onClick={function() { if (!isVideo) { setPreviewFile(file); } }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 2,
                          py: 0.4,
                          cursor: isVideo ? 'default' : 'pointer',
                          borderLeft: '2px solid',
                          borderLeftColor: isStaged ? 'primary.main' : 'transparent',
                          bgcolor: isStaged ? (isDark ? 'rgba(66, 165, 245, 0.10)' : 'rgba(66, 165, 245, 0.06)') : 'transparent',
                          '&:hover': {
                            bgcolor: isStaged
                              ? (isDark ? 'rgba(66, 165, 245, 0.14)' : 'rgba(66, 165, 245, 0.09)')
                              : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')
                          },
                          '&:hover .row-delete': { opacity: 1 }
                        }}
                      >
                        {/* status dot */}
                        <Box sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          flexShrink: 0,
                          bgcolor: statusColor
                        }} />
                        {isVideo
                          ? <MovieIcon sx={{ fontSize: 14, color: subheaderColor, flexShrink: 0 }} />
                          : <FileIcon sx={{ fontSize: 14, color: subheaderColor, flexShrink: 0 }} />}
                        <Typography noWrap sx={{
                          flex: 1,
                          fontFamily: MONO,
                          fontSize: '0.75rem',
                          color: cardTextColor
                        }}>
                          {file.name}
                        </Typography>
                        <Typography sx={{
                          fontFamily: MONO,
                          fontSize: '0.7rem',
                          color: subheaderColor,
                          flexShrink: 0
                        }}>
                          {formatFileSize(file.size)}
                        </Typography>
                        {!busy && (
                          <IconButton
                            className="row-delete"
                            size="small"
                            aria-label="Delete"
                            onClick={function(event) { event.stopPropagation(); handleRemoveFile(index); }}
                            sx={{ p: 0.25, opacity: 0, transition: 'opacity 120ms', color: subheaderColor }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                    </Tooltip>
                  );
                      })}
                    </React.Fragment>
                  );
                })}
              </Box>
            </Card>
          )}

          {/* No accept attribute: any extension list greys out extension-less
              CD files (DICOMDIR, IM000001, bare-UID names). The DICM
              magic-byte sniff in acquireFiles is the real gate. */}
          <input
            id="file-input"
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <input
            id="folder-input"
            type="file"
            multiple
            webkitdirectory=""
            onChange={handleFolderSelect}
            style={{ display: 'none' }}
          />

          {/* Controls + actions */}
          {files.length > 0 && (
            <Card sx={{
              flexShrink: 0,
              maxHeight: { md: '55%' },
              overflowY: 'auto',
              bgcolor: cardBgColor,
              color: cardTextColor
            }}>
              <CardContent sx={{ pt: 0.5, '&:last-child': { pb: 2 } }}>
                <DicomDeidentifyControls
                  value={deidControls}
                  onChange={setDeidControls}
                  disabled={busy}
                />

                {processingRequested && files.some(function(f) { return f.size > 200 * 1024 * 1024; }) && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    De-identification processes files in browser memory (~2-3× the
                    file size). Files over 200 MB may be slow or fail.
                  </Alert>
                )}

                {error && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {error}
                  </Alert>
                )}

                {uploadResults.length > 0 && !busy && (
                  <Alert severity={failureCount === 0 ? 'success' : 'warning'} sx={{ mt: 1 }}>
                    {successCount} uploaded{failureCount > 0 ? ', ' + failureCount + ' failed — hover rows for details' : ''}
                    {successCount > 0 && get(uploadResults.find(function(r) { return r.success; }), 'message') &&
                      ' — ' + get(uploadResults.find(function(r) { return r.success; }), 'message')}
                  </Alert>
                )}

                {busy && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" sx={{ fontFamily: MONO, color: subheaderColor }}>
                      {processingPhase || (converting ? 'Converting to FHIR resources…' : 'Uploading…')}
                      {uploading ? ' ' + Math.round(uploadProgress) + '%' : ''}
                    </Typography>
                    {uploading
                      ? <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 0.5 }} />
                      : <LinearProgress sx={{ mt: 0.5 }} />}
                  </Box>
                )}

                {/* Import-attachment banner (design v2 §E) — which patient this
                    upload attaches to. Renders nothing until preview resolves. */}
                <ImportAttachmentBanner
                  attachmentSource={get(attachmentPreview, 'source')}
                  display={get(attachmentPreview, 'display')}
                  sx={{ mt: 1 }}
                />

                {!busy && (
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1.5 }}>
                    <Tooltip title="Store the files in GridFS and update the ImagingStudy index — stays on this page" placement="top">
                      <span style={{ flex: 1, display: 'flex' }}>
                        <Button
                          id="uploadToGridfsButton"
                          variant="contained"
                          onClick={handleUpload}
                          disabled={files.length === 0}
                          startIcon={<UploadIcon />}
                          sx={{ flex: 1 }}
                        >
                          Upload {files.length} to GridFS
                        </Button>
                      </span>
                    </Tooltip>
                    <Tooltip title="Upload to GridFS, build FHIR ImagingStudy resources, and open the imaging studies list" placement="top">
                      <span style={{ flex: 1, display: 'flex' }}>
                        <Button
                          id="buildFhirResourcesButton"
                          variant="outlined"
                          onClick={handleConvertToFHIR}
                          disabled={files.length === 0}
                          startIcon={<ConvertIcon />}
                          sx={{ flex: 1 }}
                        >
                          Build FHIR Resources
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Box>

        {/* RIGHT — viewer stage (always visible) */}
        <Box sx={{
          flex: 1,
          minHeight: { xs: 420, md: 0 },
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Card sx={{
            flex: 1,
            minHeight: 0,
            bgcolor: cardBgColor,
            color: cardTextColor,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Stage header */}
            <Box sx={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1,
              borderBottom: '1px solid ' + hairline
            }}>
              <CrosshairIcon sx={{ fontSize: 18, color: subheaderColor }} />
              <Typography variant="caption" sx={{ fontFamily: MONO, color: subheaderColor, letterSpacing: '0.08em' }}>
                {previewFile ? previewFile.name : 'VIEWER'}
              </Typography>
              {processedPreview && (
                <Chip
                  label="DE-IDENTIFIED"
                  size="small"
                  color="info"
                  sx={{ height: 18, fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.05em' }}
                />
              )}
              <Box sx={{ flex: 1 }} />
              {stageUrl && (
                <Button
                  id="previewDeidentifiedButton"
                  size="small"
                  variant="outlined"
                  startIcon={<ShieldIcon />}
                  onClick={handlePreviewDeidentified}
                  disabled={previewBusy || busy || !processingRequested}
                >
                  {previewBusy ? 'Processing…' : 'Preview de-identified'}
                </Button>
              )}
            </Box>

            {/* Stage body */}
            <Box sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}>
              {stageUrl ? (
                <>
                  <SimpleDicomViewport
                    key={stageUrl}
                    dicomUrl={stageUrl}
                  />
                  {processedPreview && (
                    <Box sx={{ p: 2, flexShrink: 0 }}>
                      <Typography variant="subtitle2" sx={{ color: cardTextColor }}>
                        Tag changes ({processedPreview.diff.length})
                      </Typography>
                      <DicomTagDiffTable diffs={processedPreview.diff} />
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  bgcolor: '#000'
                }}>
                  <CrosshairIcon sx={{ fontSize: 56, color: 'rgba(255,255,255,0.18)' }} />
                  <Typography variant="caption" sx={{ fontFamily: MONO, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)' }}>
                    {files.length === 0 ? 'AWAITING FILES' : 'SELECT A FILE TO PREVIEW'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

export default UploadPage;
