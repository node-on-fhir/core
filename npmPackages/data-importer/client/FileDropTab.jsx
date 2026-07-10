// packages/data-importer/client/FileDropTab.jsx
//
// File drop + resource list preview.
// Adapted from merkalis ResourceList.jsx — uses ImportStoreContext, no merkle state.

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  IconButton,
  Tooltip,
  Badge,
  Button,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  ViewList as AccordionIcon,
  Code as RawIcon,
  UnfoldMore as ExpandAllIcon,
  UnfoldLess as CollapseAllIcon,
  DeleteSweep as ClearIcon,
  Description as NdjsonIcon,
  FolderSpecial as BundleIcon,
  Storage as CollectionIcon,
  UploadFile as UploadFileIcon,
  CreateNewFolder as FolderIcon,
  Favorite as AppleHealthIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';

import { get } from 'lodash';
import { useImportStore } from './ImportStoreContext.jsx';
import ImportParamsPanel from './ImportParamsPanel.jsx';
import { isDeduplicationAvailable, analyzeResources, fetchVersioningModes } from './useDeduplicator.js';
import ResourceListAccordion from './ResourceListAccordion.jsx';
import AppleHealthPreview from './AppleHealthPreview.jsx';
import AppleHealthPatientPanel from './AppleHealthPatientPanel.jsx';
import BinaryImportPreview from './BinaryImportPreview.jsx';
import ImportDialog from './ImportDialog.jsx';
import MedicalRecordImporter from '../lib/MedicalRecordImporter';
import { resolveBundleReferences } from '../lib/BundleReferenceResolver.js';
import { isBinaryImportFile, classifyFiles } from '../lib/BinaryFileClassifier';
import { parseWavHeader, parseWavSamples } from '../lib/WavHeaderParser';

var INITIAL_RENDER_COUNT = 50;
var BATCH_SIZE = 50;

function parseFileContents(fileName, rawText) {
  // Strip BOM (UTF-8/UTF-16) and trim whitespace
  var text = rawText.replace(/^\uFEFF/, '').trim();
  if (!text) {
    throw new Error('File is empty');
  }

  // Try parsing as a single JSON document first (Bundle, array, or resource)
  var jsonResult = tryParseJson(text);
  if (jsonResult) {
    console.log('[parseFileContents] Parsed', fileName, 'as', jsonResult.source);
    return jsonResult;
  }

  // If single-JSON failed, try NDJSON (newline-delimited JSON)
  var ndjsonResult = tryParseNdjson(text);
  if (ndjsonResult) {
    console.log('[parseFileContents] Parsed', fileName, 'as ndjson (' + ndjsonResult.resources.length + ' resources)');
    return ndjsonResult;
  }

  throw new Error('Unrecognized format — expected FHIR Bundle JSON, NDJSON, or single resource');
}

function tryParseJson(text) {
  try {
    var parsed = JSON.parse(text);
  } catch (e) {
    return null;
  }

  var resources = [];

  // FHIR Bundle → extract entry[].resource, resolving intra-bundle
  // urn:uuid/fullUrl references to relative form first (self-contained
  // document bundles; entry.fullUrl doesn't survive the resource list)
  if (parsed && parsed.resourceType === 'Bundle' && Array.isArray(parsed.entry)) {
    var resolved = resolveBundleReferences(parsed);
    if (resolved.resolvedCount > 0) {
      console.log('[FileDropTab] Resolved ' + resolved.resolvedCount + ' intra-bundle references via the fullUrl index');
    }
    return { resources: resolved.resources, source: 'bundle' };
  }

  // Array of resources
  if (Array.isArray(parsed)) {
    return { resources: parsed, source: 'bundle' };
  }

  // Single FHIR resource (has resourceType)
  if (parsed && typeof parsed === 'object' && parsed.resourceType) {
    return { resources: [parsed], source: 'bundle' };
  }

  // Generic JSON object (no resourceType) — still importable
  if (parsed && typeof parsed === 'object') {
    return { resources: [parsed], source: 'bundle' };
  }

  return null;
}

function tryParseNdjson(text) {
  var lines = text.split('\n').filter(function(l) { return l.trim(); });
  if (lines.length < 1) return null;

  var resources = [];
  var failures = 0;

  lines.forEach(function(line) {
    try {
      resources.push(JSON.parse(line));
    } catch (e) {
      failures++;
    }
  });

  // Accept if we parsed at least one resource and the majority of lines succeeded
  if (resources.length > 0 && resources.length >= failures) {
    return { resources: resources, source: 'ndjson' };
  }

  return null;
}

// =============================================================================
// EMPTY STATE PANEL
// =============================================================================

function EmptyStatePanel(props) {
  var dispatch = props.dispatch;
  var isDark = props.isDark;
  var onAppleHealthDetected = props.onAppleHealthDetected;
  var onBinaryFilesDetected = props.onBinaryFilesDetected;

  var isDragOverState = useState(false);
  var isDragOver = isDragOverState[0];
  var setIsDragOver = isDragOverState[1];

  var textSecondary = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

  var fileInputRef = useRef(null);
  var folderInputRef = useRef(null);

  // Read a single file as text and process through JSON/NDJSON pipeline
  function readFileAsText(file, allResources, source, errors, onDone) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var result = parseFileContents(file.name, e.target.result);
        allResources.resources = allResources.resources.concat(result.resources);
        if (result.source === 'ndjson') allResources.source = 'ndjson';
      } catch (err) {
        errors.push(file.name + ': ' + err.message);
        console.error('[FileDropTab] Failed to parse', file.name, err);
      }
      onDone();
    };
    reader.onerror = function() {
      errors.push(file.name + ': read error');
      onDone();
    };
    reader.readAsText(file);
  }

  function processFiles(files) {
    var fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Priority 0: Check for binary medical files (.dcm, .wav, .pdf)
    var hasBinaryFiles = fileArray.some(function(f) { return isBinaryImportFile(f); });
    if (hasBinaryFiles) {
      console.log('[FileDropTab] Detected binary medical files — routing to binary import');
      var classified = classifyFiles(fileArray);

      // Parse WAV headers for metadata enrichment
      var wavFiles = classified.filter(function(c) { return c.type === 'ecg-wav' || c.type === 'pcg-wav'; });
      if (wavFiles.length === 0) {
        // No WAV files to parse, proceed immediately
        if (onBinaryFilesDetected) onBinaryFilesDetected(classified);
        return;
      }

      var pending = wavFiles.length;
      wavFiles.forEach(function(classifiedEntry) {
        var reader = new FileReader();
        var isEcg = classifiedEntry.type === 'ecg-wav';

        reader.onload = function(e) {
          if (isEcg) {
            // ECG: parse full file for both header metadata and PCM samples
            var samplesResult = parseWavSamples(e.target.result, { maxSeconds: 3 });
            if (samplesResult) {
              classifiedEntry.wavMeta = {
                channels: samplesResult.channels,
                sampleRateHz: samplesResult.sampleRateHz,
                bitsPerSample: samplesResult.bitsPerSample,
                dataSize: samplesResult.dataSize,
                durationSec: samplesResult.durationSec
              };
              classifiedEntry.wavSamples = samplesResult.samples;
              classifiedEntry.wavSamplesMeta = {
                totalSamples: samplesResult.totalSamples,
                extractedSeconds: samplesResult.extractedSeconds
              };
              console.log('[FileDropTab] ECG WAV samples:', classifiedEntry.file.name,
                samplesResult.samples.length, 'samples /', samplesResult.extractedSeconds + 's of',
                samplesResult.durationSec + 's total');
            }
          } else {
            // PCG: header-only parsing (1KB read)
            var wavMeta = parseWavHeader(e.target.result);
            if (wavMeta) {
              classifiedEntry.wavMeta = wavMeta;
              console.log('[FileDropTab] PCG WAV metadata:', classifiedEntry.file.name, wavMeta);
            }
          }
          pending--;
          if (pending === 0 && onBinaryFilesDetected) {
            onBinaryFilesDetected(classified);
          }
        };
        reader.onerror = function() {
          pending--;
          if (pending === 0 && onBinaryFilesDetected) {
            onBinaryFilesDetected(classified);
          }
        };

        if (isEcg) {
          // Read full file for ECG sample extraction
          reader.readAsArrayBuffer(classifiedEntry.file);
        } else {
          // Only read first 1 KB for PCG header parsing
          reader.readAsArrayBuffer(classifiedEntry.file.slice(0, 1024));
        }
      });
      return;
    }

    // Classify files
    var zipFiles = [];
    var xmlFiles = [];
    var jsonFiles = [];
    var exportXmlFile = null;
    var clinicalRecordJsonFiles = [];

    fileArray.forEach(function(file) {
      var name = file.name.toLowerCase();
      var relativePath = (file.webkitRelativePath || '').toLowerCase();

      // Check if this is export.xml from an Apple Health directory
      if (name === 'export.xml' || relativePath.indexOf('export.xml') !== -1) {
        exportXmlFile = file;
      } else if (relativePath.indexOf('clinical-records/') !== -1 && name.endsWith('.json')) {
        clinicalRecordJsonFiles.push(file);
      } else if (name.endsWith('.zip')) {
        zipFiles.push(file);
      } else if (name.endsWith('.xml')) {
        xmlFiles.push(file);
      } else {
        jsonFiles.push(file);
      }
    });

    // Priority 1: Directory with export.xml → Apple Health
    if (exportXmlFile) {
      console.log('[FileDropTab] Found export.xml in folder — treating as Apple Health export');
      var reader = new FileReader();
      reader.onload = function(e) {
        onAppleHealthDetected(e.target.result);

        // Also process clinical-records JSON files through existing pipeline
        if (clinicalRecordJsonFiles.length > 0) {
          console.log('[FileDropTab] Also found', clinicalRecordJsonFiles.length, 'clinical-records JSON files');
          processJsonFiles(clinicalRecordJsonFiles);
        }
      };
      reader.onerror = function() {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to read export.xml' });
      };
      reader.readAsText(exportXmlFile);
      return;
    }

    // Priority 2: ZIP file → Apple Health ZIP
    if (zipFiles.length > 0) {
      console.log('[FileDropTab] Detected .zip file — treating as Apple Health export');
      var zipReader = new FileReader();
      zipReader.onload = function(e) {
        onAppleHealthDetected(e.target.result);
      };
      zipReader.onerror = function() {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to read ZIP file: ' + zipFiles[0].name });
      };
      zipReader.readAsArrayBuffer(zipFiles[0]);
      return;
    }

    // Priority 3: Standalone XML → check if Apple Health
    if (xmlFiles.length > 0 && jsonFiles.length === 0) {
      var xmlReader = new FileReader();
      xmlReader.onload = function(e) {
        var xmlText = e.target.result;
        if (MedicalRecordImporter.isAppleHealthXml(xmlText)) {
          console.log('[FileDropTab] Detected Apple Health XML file');
          onAppleHealthDetected(xmlText);
        } else {
          // Not Apple Health XML — show error (XML not otherwise supported)
          dispatch({ type: 'SET_ERROR', payload: xmlFiles[0].name + ': XML file is not an Apple Health export. Expected JSON, NDJSON, or Apple Health XML.' });
        }
      };
      xmlReader.onerror = function() {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to read XML file: ' + xmlFiles[0].name });
      };
      xmlReader.readAsText(xmlFiles[0]);
      return;
    }

    // Priority 4: JSON/NDJSON files → existing pipeline (include any XML files mixed with JSON)
    var allFiles = jsonFiles.concat(xmlFiles);
    if (allFiles.length > 0) {
      processJsonFiles(allFiles);
    }
  }

  // Process JSON/NDJSON files through the existing pipeline
  function processJsonFiles(files) {
    var accumulator = { resources: [], source: 'bundle' };
    var errors = [];
    var pending = files.length;

    files.forEach(function(file) {
      readFileAsText(file, accumulator, null, errors, function() {
        pending--;
        if (pending === 0) {
          if (errors.length > 0 && accumulator.resources.length === 0) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to parse file(s): ' + errors.join('; ') });
          } else {
            console.log('[FileDropTab] Parsed', accumulator.resources.length, 'resources from', files.length, 'file(s)');
            dispatch({ type: 'SET_RESOURCE_LIST', payload: { resources: accumulator.resources, source: accumulator.source } });
            Session.set('importBuffer', accumulator.resources);
            Session.set('fileExtension', accumulator.source === 'ndjson' ? 'ndjson' : 'json');
          }
        }
      });
    });
  }

  // Recursively traverse a FileSystemDirectoryEntry to collect files
  function traverseDirectory(entry) {
    return new Promise(function(resolve) {
      if (entry.isFile) {
        entry.file(function(file) {
          // Preserve the full path for classification
          Object.defineProperty(file, 'webkitRelativePath', {
            value: entry.fullPath,
            writable: false
          });
          resolve([file]);
        }, function() { resolve([]); });
      } else if (entry.isDirectory) {
        var dirReader = entry.createReader();
        var allEntries = [];

        // readEntries may return results in batches
        function readBatch() {
          dirReader.readEntries(function(entries) {
            if (entries.length === 0) {
              // Done reading — now traverse each entry
              Promise.all(allEntries.map(traverseDirectory)).then(function(results) {
                var flat = [];
                results.forEach(function(r) { flat = flat.concat(r); });
                resolve(flat);
              });
            } else {
              allEntries = allEntries.concat(Array.from(entries));
              readBatch();
            }
          }, function() { resolve([]); });
        }
        readBatch();
      } else {
        resolve([]);
      }
    });
  }

  var handleDragOver = useCallback(function(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  var handleDragLeave = useCallback(function(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  var handleDrop = useCallback(function(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // Check for directory entries via DataTransferItem API
    var items = e.dataTransfer.items;
    if (items && items.length > 0) {
      var entries = [];
      var hasDirectory = false;

      for (var i = 0; i < items.length; i++) {
        var entry = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : null;
        if (entry) {
          entries.push(entry);
          if (entry.isDirectory) hasDirectory = true;
        }
      }

      if (hasDirectory) {
        // Traverse directories to collect all files, then process
        Promise.all(entries.map(traverseDirectory)).then(function(results) {
          var allFiles = [];
          results.forEach(function(r) { allFiles = allFiles.concat(r); });
          if (allFiles.length > 0) {
            processFiles(allFiles);
          }
        });
        return;
      }
    }

    // Fallback: regular file drop
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, []);

  function handleFileSelect(e) {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2, overflow: 'auto', flex: 1 }}>

      {/* Import from File */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <UploadFileIcon sx={{ fontSize: 20, color: textSecondary }} />
          <Typography variant="subtitle2" sx={{ color: textSecondary }}>
            Import from File
          </Typography>
        </Box>
        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: '2px dashed',
            borderColor: isDragOver ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: isDragOver
              ? (isDark ? 'rgba(144,202,249,0.08)' : 'rgba(25,118,210,0.04)')
              : 'transparent',
            transition: 'border-color 0.2s, background-color 0.2s',
            cursor: 'pointer'
          }}
          onClick={function() { if (fileInputRef.current) fileInputRef.current.click(); }}
        >
          <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
            Drop .json, .ndjson, .zip, .xml, .dcm, .wav, .pdf, .mp4, .jpg, .png, or Apple Health export here
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadFileIcon />}
              onClick={function(e) {
                e.stopPropagation();
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              sx={isDark ? {
                color: 'rgba(255,255,255,0.7)',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { borderColor: 'rgba(255,255,255,0.5)' }
              } : {}}
            >
              Select File
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FolderIcon />}
              onClick={function(e) {
                e.stopPropagation();
                if (folderInputRef.current) folderInputRef.current.click();
              }}
              sx={isDark ? {
                color: 'rgba(255,255,255,0.7)',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { borderColor: 'rgba(255,255,255,0.5)' }
              } : {}}
            >
              Select Folder
            </Button>
          </Box>
        </Box>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.ndjson,.phr,.fhir,.zip,.xml,.dcm,.wav,.pdf,.mp4,.jpg,.jpeg,.png"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <input
          ref={folderInputRef}
          type="file"
          webkitdirectory=""
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </Box>
    </Box>
  );
}

// =============================================================================
// FILE DROP TAB
// =============================================================================

function FileDropTab() {
  var storeCtx = useImportStore();
  var state = storeCtx.state;
  var dispatch = storeCtx.dispatch;
  var accordionRef = useRef(null);

  // Apple Health state: null = not active, ArrayBuffer = ZIP, string = XML
  var appleHealthState = useState(null);
  var appleHealthBuffer = appleHealthState[0];
  var setAppleHealthBuffer = appleHealthState[1];

  // Binary import state: null = not active, array = classified files
  var binaryFilesState = useState(null);
  var binaryFiles = binaryFilesState[0];
  var setBinaryFiles = binaryFilesState[1];

  // Pending binary upload state: holds raw File objects + metadata for deferred upload
  var pendingBinaryUploadState = useState(null);
  var pendingBinaryUpload = pendingBinaryUploadState[0];
  var setPendingBinaryUpload = pendingBinaryUploadState[1];

  // Import Dialog state
  var importDialogOpenState = useState(false);
  var importDialogOpen = importDialogOpenState[0];
  var setImportDialogOpen = importDialogOpenState[1];

  var importDialogModeState = useState('standard');
  var importDialogMode = importDialogModeState[0];
  var setImportDialogMode = importDialogModeState[1];

  var appleHealthImportOptionsState = useState(null);
  var appleHealthImportOptions = appleHealthImportOptionsState[0];
  var setAppleHealthImportOptions = appleHealthImportOptionsState[1];

  var appleHealthDemographicsState = useState(null);
  var appleHealthDemographics = appleHealthDemographicsState[0];
  var setAppleHealthDemographics = appleHealthDemographicsState[1];

  var appleHealthPatientConfirmedState = useState(false);
  var appleHealthPatientConfirmed = appleHealthPatientConfirmedState[0];
  var setAppleHealthPatientConfirmed = appleHealthPatientConfirmedState[1];

  var appleHealthSelectionState = useState({ selectedCount: 0, selectedTypes: [], timeRange: 'all' });
  var appleHealthSelection = appleHealthSelectionState[0];
  var setAppleHealthSelection = appleHealthSelectionState[1];

  // Navigation for post-import redirect
  var useNavigate = Meteor.useNavigate;
  var navigate = useNavigate ? useNavigate() : function() {};
  var useLocation = Meteor.useLocation;
  var routerLocation = useLocation ? useLocation() : { search: '' };

  // Detect dark mode from app theme
  var isDark = false;
  var useAppTheme = null;
  if (typeof Meteor !== 'undefined' && Meteor.useTheme) {
    useAppTheme = Meteor.useTheme;
  }
  if (useAppTheme) {
    var appTheme = useAppTheme();
    isDark = appTheme.theme === 'dark';
  }

  var cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  var cardTextColor = isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)';
  var dividerColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  var textSecondary = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

  useEffect(function() {
    dispatch({ type: 'SET_IS_DARK', payload: isDark });
  }, [isDark, dispatch]);

  // Watch for "Load Data" button signal from DataFooterButtons
  useEffect(function() {
    var interval = setInterval(function() {
      if(Session.get('importDialogRequested')){
        Session.set('importDialogRequested', false);
        setImportDialogMode('standard');
        setImportDialogOpen(true);
      }
    }, 200);
    return function() { clearInterval(interval); };
  }, []);

  // Detect optional @node-on-fhir/patient-matching + load server versioning modes once.
  useEffect(function() {
    dispatch({ type: 'SET_DEDUP_AVAILABLE', payload: isDeduplicationAvailable() });
    fetchVersioningModes().then(function(modes) {
      dispatch({ type: 'SET_VERSIONING_MODES', payload: modes });
    });
  }, [dispatch]);

  // Re-run deduplication analysis whenever the parsed resource list changes. The
  // analysis is pure browser-side work; defer it a tick so the list renders first.
  useEffect(function() {
    if (!isDeduplicationAvailable() || state.resourceList.length === 0) {
      return undefined;
    }
    dispatch({ type: 'SET_DEDUP_RUNNING', payload: true });
    var timer = setTimeout(function() {
      var analysis = analyzeResources(state.resourceList, {});
      dispatch({ type: 'SET_DEDUP_ANALYSIS', payload: analysis });
    }, 0);
    return function() { clearTimeout(timer); };
  }, [state.resourceList, dispatch]);

  function handleAppleHealthDetected(buffer) {
    console.log('[FileDropTab] Apple Health export detected, type:',
      buffer instanceof ArrayBuffer ? 'ZIP (' + buffer.byteLength + ' bytes)' : 'XML (' + buffer.length + ' chars)');
    setAppleHealthBuffer(buffer);
  }

  function handleAppleHealthClear() {
    setAppleHealthBuffer(null);
    setAppleHealthDemographics(null);
    setAppleHealthPatientConfirmed(false);
  }

  function handleBinaryFilesDetected(classifiedFiles) {
    console.log('[FileDropTab] Binary files detected:', classifiedFiles.length, 'files');
    setBinaryFiles(classifiedFiles);
  }

  function handleBinaryClear() {
    setBinaryFiles(null);
  }

  function handleBinaryImportComplete(resources, pendingUploadInfo) {
    console.log('[FileDropTab] Binary import complete:', resources.length, 'FHIR resources');
    dispatch({ type: 'SET_RESOURCE_LIST', payload: { resources: resources, source: 'binary-import' } });
    Session.set('importBuffer', resources);
    Session.set('fileExtension', 'json');

    // Store pending upload info for deferred GridFS upload in ImportDialog
    if (pendingUploadInfo) {
      console.log('[FileDropTab] Storing pending binary upload info for deferred upload');
      setPendingBinaryUpload(pendingUploadInfo);
    }

    // Clear binary mode so the normal resource list view takes over
    setBinaryFiles(null);
  }

  function handleAppleHealthImport(options) {
    console.log('[FileDropTab] Apple Health import requested, opening dialog');
    setAppleHealthImportOptions(options);
    setImportDialogMode('appleHealth');
    setImportDialogOpen(true);
  }

  function handleAnalysisComplete(analysisResult) {
    setAppleHealthDemographics(get(analysisResult, 'demographics', null));
  }

  function handlePatientConfirmed(patient) {
    setAppleHealthPatientConfirmed(!!patient);
  }

  function handleAppleHealthSelectionChange(selectionInfo) {
    setAppleHealthSelection(selectionInfo);
  }

  // Chunked rendering: progressively render items in batches
  var renderCountState = useState(INITIAL_RENDER_COUNT);
  var renderCount = renderCountState[0];
  var setRenderCount = renderCountState[1];

  // Reset render count when resource list changes
  useEffect(function() {
    setRenderCount(INITIAL_RENDER_COUNT);
  }, [state.resourceList]);

  // Progressively render more items via requestAnimationFrame
  useEffect(function() {
    if (renderCount >= state.resourceList.length) return;

    var rafId = requestAnimationFrame(function() {
      setRenderCount(function(prev) {
        return Math.min(prev + BATCH_SIZE, state.resourceList.length);
      });
    });

    return function() { cancelAnimationFrame(rafId); };
  }, [renderCount, state.resourceList.length]);

  var visibleResources = state.resourceList.slice(0, renderCount);

  function handleModeChange(e, newMode) {
    if (newMode !== null) {
      dispatch({ type: 'SET_RESOURCE_LIST_VIEW_MODE', payload: newMode });
    }
  }

  function handleExpandAll() {
    if (accordionRef.current) {
      accordionRef.current.expandAll();
    }
  }

  function handleCollapseAll() {
    if (accordionRef.current) {
      accordionRef.current.collapseAll();
    }
  }

  function handleClear() {
    dispatch({ type: 'CLEAR_RESOURCE_LIST' });
    Session.set('importBuffer', null);
    Session.set('fileExtension', null);
    setPendingBinaryUpload(null);
  }

  function handleSelectResource(index, resource) {
    dispatch({ type: 'SET_SELECTED_RESOURCE_INDEX', payload: index });
    dispatch({ type: 'SET_PATIENT_JSON', payload: JSON.stringify(resource, null, 2) });
  }

  // Collapse the Resource Preview column → back to the 2-column layout.
  function handleClosePreview() {
    dispatch({ type: 'SET_SELECTED_RESOURCE_INDEX', payload: -1 });
  }

  function handleImportDialogClose(wasCompleted) {
    setImportDialogOpen(false);
    setAppleHealthImportOptions(null);
    if(wasCompleted){
      // ?next=<route-slug> redirects after a completed import (internal
      // routes only — reject anything that could leave the app).
      var nextParam = (new URLSearchParams(routerLocation.search).get('next') || '').trim();
      var isSafeNext = nextParam.length > 0 &&
        !nextParam.includes('://') &&
        !nextParam.includes('\\') &&
        !nextParam.startsWith('//');
      if (isSafeNext) {
        navigate('/' + nextParam.replace(/^\/+/, ''));
      } else {
        navigate('/');
      }
    }
  }

  // Source indicator icon
  var sourceIcon = null;
  if (state.resourceListSource === 'ndjson') {
    sourceIcon = (
      <Tooltip title="Source: NDJSON">
        <NdjsonIcon sx={{ fontSize: 16, color: textSecondary }} />
      </Tooltip>
    );
  } else if (state.resourceListSource === 'bundle') {
    sourceIcon = (
      <Tooltip title="Source: FHIR Bundle">
        <BundleIcon sx={{ fontSize: 16, color: textSecondary }} />
      </Tooltip>
    );
  } else if (state.resourceListSource === 'collection') {
    sourceIcon = (
      <Tooltip title="Source: Minimongo Collection">
        <CollectionIcon sx={{ fontSize: 16, color: textSecondary }} />
      </Tooltip>
    );
  } else if (state.resourceListSource === 'binary-import') {
    sourceIcon = (
      <Tooltip title="Source: Binary File Import">
        <UploadFileIcon sx={{ fontSize: 16, color: textSecondary }} />
      </Tooltip>
    );
  }

  var isEmpty = state.resourceList.length === 0 && appleHealthBuffer === null && binaryFiles === null;

  var DynamicFhirViews = Meteor.DynamicFhirViews;

  // Get selected resource for preview
  var selectedResource = null;
  if (state.selectedResourceIndex >= 0 && state.selectedResourceIndex < state.resourceList.length) {
    selectedResource = state.resourceList[state.selectedResourceIndex];
  }

  // =========================================================================
  // Import Dialog (rendered in both modes)
  // =========================================================================
  var importDialogElement = (
    <ImportDialog
      open={importDialogOpen}
      onClose={handleImportDialogClose}
      importMode={importDialogMode}
      appleHealthBuffer={appleHealthBuffer}
      appleHealthOptions={appleHealthImportOptions}
      pendingBinaryUpload={pendingBinaryUpload}
    />
  );

  // =========================================================================
  // Apple Health mode: full-width preview
  // =========================================================================
  if (appleHealthBuffer !== null) {
    return (
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 2,
        p: 2,
        flex: 1,
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* Left Column: Apple Health Preview */}
        <Card sx={{
          display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
          bgcolor: cardBgColor, color: cardTextColor,
          '& .MuiCardHeader-title': { color: cardTextColor },
          '& .MuiIconButton-root': { color: cardTextColor },
          '& .MuiTableCell-root': { color: cardTextColor, borderColor: dividerColor },
          '& .MuiInputLabel-root': { color: cardTextColor },
          '& .MuiInputBase-root': { color: cardTextColor },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: dividerColor },
          '& .MuiSelect-icon': { color: cardTextColor },
          '& .MuiCheckbox-root': { color: cardTextColor },
          '& .MuiChip-root': { color: cardTextColor },
          '& .MuiButton-root': { color: cardTextColor }
        }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AppleHealthIcon sx={{ fontSize: 20, color: isDark ? '#ff6b6b' : '#e53935' }} />
                  <Typography variant="h6">Apple Health Import</Typography>
                </Box>
                <Tooltip title="Clear and start over">
                  <IconButton size="small" onClick={handleAppleHealthClear}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
            sx={{ pb: 0 }}
          />
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, pt: 1, overflow: 'auto' }}>
            <AppleHealthPreview
              importBuffer={appleHealthBuffer}
              onImport={handleAppleHealthImport}
              onAnalysisComplete={handleAnalysisComplete}
              importDisabled={!appleHealthPatientConfirmed}
              onSelectionChange={handleAppleHealthSelectionChange}
            />
          </CardContent>
        </Card>

        {/* Right Column: Patient Assignment */}
        <Card sx={{
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          bgcolor: cardBgColor, color: cardTextColor,
          '& .MuiCardHeader-title': { color: cardTextColor },
          '& .MuiIconButton-root': { color: cardTextColor },
          '& .MuiButton-root': { color: cardTextColor }
        }}>
          <CardHeader
            title="Patient Assignment"
            sx={{
              borderBottom: 1,
              borderColor: dividerColor,
              flexShrink: 0,
              '& .MuiCardHeader-title': { fontSize: '1.1rem' }
            }}
          />
          <CardContent sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <AppleHealthPatientPanel
              demographics={appleHealthDemographics}
              onPatientConfirmed={handlePatientConfirmed}
              isDark={isDark}
              onImport={function() {
                handleAppleHealthImport({
                  selectedTypes: appleHealthSelection.selectedTypes,
                  summarizeTypes: appleHealthSelection.summarizeTypes || {},
                  timeRange: appleHealthSelection.timeRange,
                  includeWorkouts: true,
                  includeClinicalRecords: true
                });
              }}
              importDisabled={!appleHealthPatientConfirmed}
              selectedCount={appleHealthSelection.selectedCount}
              importSummary={appleHealthSelection.importSummary || []}
            />
            <Box sx={{ mt: 2, p: 1 }}>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                {appleHealthBuffer instanceof ArrayBuffer
                  ? 'Source: ZIP archive (' + Math.round(appleHealthBuffer.byteLength / 1024 / 1024) + ' MB)'
                  : 'Source: XML file (' + Math.round(appleHealthBuffer.length / 1024 / 1024) + ' MB)'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
        {importDialogElement}
      </Box>
    );
  }

  // =========================================================================
  // Binary import mode: .dcm, .wav, .pdf, .mp4, .jpg, .jpeg, .png files
  // =========================================================================
  if (binaryFiles !== null) {
    return (
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 2,
        p: 2,
        flex: 1,
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* Left Column: Binary Import Preview */}
        <Card sx={{
          display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
          bgcolor: cardBgColor, color: cardTextColor,
          '& .MuiCardHeader-title': { color: cardTextColor },
          '& .MuiIconButton-root': { color: cardTextColor },
          '& .MuiButton-root': { color: cardTextColor }
        }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UploadFileIcon sx={{ fontSize: 20, color: isDark ? '#90caf9' : '#1976d2' }} />
                  <Typography variant="h6">Binary File Import</Typography>
                </Box>
                <Tooltip title="Clear and start over">
                  <IconButton size="small" onClick={handleBinaryClear}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
            sx={{ pb: 0 }}
          />
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, pt: 1, overflow: 'auto' }}>
            <BinaryImportPreview
              files={binaryFiles}
              onImportComplete={handleBinaryImportComplete}
              onClear={handleBinaryClear}
              isDark={isDark}
            />
          </CardContent>
        </Card>

        {/* Right Column: Resource Preview */}
        <Card sx={{
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          bgcolor: cardBgColor, color: cardTextColor,
          '& .MuiCardHeader-title': { color: cardTextColor },
          '& .MuiIconButton-root': { color: cardTextColor }
        }}>
          <CardHeader
            title="Resource Preview"
            sx={{
              borderBottom: 1,
              borderColor: dividerColor,
              flexShrink: 0,
              '& .MuiCardHeader-title': { fontSize: '1.1rem' }
            }}
          />
          <CardContent sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {selectedResource && DynamicFhirViews ? (
              <DynamicFhirViews
                fhirResource={selectedResource}
                embedded={true}
                isDark={isDark}
              />
            ) : selectedResource ? (
              <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <AceEditor
                  mode="json"
                  theme={isDark ? 'monokai' : 'github'}
                  value={JSON.stringify(selectedResource, null, 2)}
                  readOnly={true}
                  name="binary-resource-preview-editor"
                  editorProps={{ $blockScrolling: true }}
                  width="100%"
                  height="100%"
                  fontSize={12}
                  showPrintMargin={false}
                  showGutter={true}
                  highlightActiveLine={false}
                  wrapEnabled={true}
                  setOptions={{
                    showLineNumbers: true,
                    tabSize: 2,
                    useWorker: false
                  }}
                  style={{ flex: 1, minHeight: 200 }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body2" sx={{ color: textSecondary }}>
                  Upload files to generate FHIR resources. They will appear here for preview.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        {importDialogElement}
      </Box>
    );
  }

  // =========================================================================
  // Normal mode: JSON/NDJSON resource list
  // =========================================================================
  // Layout adapts to selection: 2 columns by default (Resource List | Import & Dedup),
  // 3 columns when a resource is selected (Resource List | Resource Preview | Import & Dedup).
  var hasPreview = selectedResource != null;
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: hasPreview ? '1fr 1.3fr 1fr' : '1fr 1fr' },
      gap: 2,
      p: 2,
      flex: 1,
      minHeight: 0,
      overflow: 'hidden'
    }}>
      {/* Left Column: Resource List */}
      <Card sx={{
        display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
        bgcolor: cardBgColor, color: cardTextColor,
        '& .MuiCardHeader-title': { color: cardTextColor },
        '& .MuiIconButton-root': { color: cardTextColor },
        '& .MuiToggleButton-root': { color: cardTextColor, borderColor: dividerColor },
        '& .MuiInputLabel-root': { color: cardTextColor },
        '& .MuiInputBase-root': { color: cardTextColor },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: dividerColor },
        '& .MuiChip-root': { color: cardTextColor },
        '& .MuiAutocomplete-popupIndicator': { color: cardTextColor },
        '& .MuiAutocomplete-clearIndicator': { color: cardTextColor },
        '& .MuiAccordionSummary-expandIconWrapper': { color: cardTextColor }
      }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={state.resourceList.length} color="primary" max={9999}>
                  <Typography variant="h6">Resource List</Typography>
                </Badge>
                {sourceIcon}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {state.resourceListViewMode === 'accordion' && !isEmpty && (
                  <>
                    <Tooltip title="Expand all">
                      <IconButton size="small" onClick={handleExpandAll}>
                        <ExpandAllIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Collapse all">
                      <IconButton size="small" onClick={handleCollapseAll}>
                        <CollapseAllIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                {state.resourceList.length > 0 && (
                  <Tooltip title="Clear list">
                    <IconButton size="small" onClick={handleClear}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <ToggleButtonGroup
                  value={state.resourceListViewMode}
                  exclusive
                  onChange={handleModeChange}
                  size="small"
                >
                  <ToggleButton value="accordion">
                    <AccordionIcon sx={{ fontSize: 16 }} />
                  </ToggleButton>
                  <ToggleButton value="raw">
                    <RawIcon sx={{ fontSize: 16 }} />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
          }
          sx={{ pb: 0 }}
        />
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, pt: 1, overflow: 'hidden' }}>
          {state.resourceList.length === 0 ? (
            <EmptyStatePanel dispatch={dispatch} isDark={isDark} onAppleHealthDetected={handleAppleHealthDetected} onBinaryFilesDetected={handleBinaryFilesDetected} />
          ) : state.resourceListViewMode === 'accordion' ? (
            <>
              <ResourceListAccordion
                ref={accordionRef}
                resources={visibleResources}
                selectedIndex={state.selectedResourceIndex}
                onSelectResource={handleSelectResource}
              />
              {renderCount < state.resourceList.length && (
                <Typography variant="caption" sx={{ color: textSecondary, textAlign: 'center', py: 1 }}>
                  Rendering {renderCount} of {state.resourceList.length} resources...
                </Typography>
              )}
            </>
          ) : (
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <AceEditor
                mode="json"
                theme={isDark ? 'monokai' : 'github'}
                value={JSON.stringify(state.resourceList, null, 2)}
                readOnly={true}
                name="resource-list-raw"
                editorProps={{ $blockScrolling: true }}
                width="100%"
                height="100%"
                fontSize={11}
                showPrintMargin={false}
                showGutter={true}
                highlightActiveLine={false}
                wrapEnabled={true}
                setOptions={{
                  showLineNumbers: true,
                  tabSize: 2,
                  useWorker: false
                }}
                style={{ flex: 1, minHeight: 200 }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Middle Column: Resource Preview — only present when a resource is selected */}
      {hasPreview && (
      <Card sx={{
        display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', minHeight: 0,
        bgcolor: cardBgColor, color: cardTextColor,
        '& .MuiCardHeader-title': { color: cardTextColor },
        '& .MuiIconButton-root': { color: cardTextColor }
      }}>
        <CardHeader
          title="Resource Preview"
          action={
            <Tooltip title="Close preview">
              <IconButton size="small" onClick={handleClosePreview}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
          sx={{
            borderBottom: 1,
            borderColor: dividerColor,
            flexShrink: 0,
            '& .MuiCardHeader-title': { fontSize: '1.1rem' }
          }}
        />
        <CardContent sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {selectedResource && DynamicFhirViews ? (
            <DynamicFhirViews
              fhirResource={selectedResource}
              embedded={true}
              isDark={isDark}
            />
          ) : (
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <AceEditor
                mode="json"
                theme={isDark ? 'monokai' : 'github'}
                value={JSON.stringify(selectedResource, null, 2)}
                readOnly={true}
                name="resource-preview-editor"
                editorProps={{ $blockScrolling: true }}
                width="100%"
                height="100%"
                fontSize={12}
                showPrintMargin={false}
                showGutter={true}
                highlightActiveLine={false}
                wrapEnabled={true}
                setOptions={{
                  showLineNumbers: true,
                  tabSize: 2,
                  useWorker: false
                }}
                style={{ flex: 1, minHeight: 200 }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
      )}

      {/* Right Column: Import & Dedup — always present, full height */}
      <Card sx={{
        display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', minHeight: 0,
        bgcolor: cardBgColor, color: cardTextColor,
        '& .MuiCardHeader-title': { color: cardTextColor },
        '& .MuiIconButton-root': { color: cardTextColor },
        '& .MuiInputBase-root': { color: cardTextColor },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: dividerColor },
        '& .MuiSelect-icon': { color: cardTextColor }
      }}>
        <CardHeader
          title="Import &amp; Dedup"
          sx={{
            borderBottom: 1,
            borderColor: dividerColor,
            flexShrink: 0,
            '& .MuiCardHeader-title': { fontSize: '1.1rem' }
          }}
        />
        <CardContent sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <ImportParamsPanel />
        </CardContent>
      </Card>
      {importDialogElement}
    </Box>
  );
}

export { FileDropTab };
export default FileDropTab;
