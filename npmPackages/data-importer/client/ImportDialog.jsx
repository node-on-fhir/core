// packages/data-importer/client/ImportDialog.jsx
//
// Import destination dialog — lets users choose between
// "Temporary (Browser)" and "Permanent (Database)" before importing.
// Supports both standard (JSON/NDJSON) and Apple Health import modes.

import React, { useState } from 'react';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  LinearProgress,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Typography
} from '@mui/material';

import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import StorageIcon from '@mui/icons-material/Storage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

import { get } from 'lodash';

import MedicalRecordImporter from '../lib/MedicalRecordImporter';
import { patchResourcesWithUploadResults } from '../lib/FhirResourceBuilder';
import { useImportStore } from './ImportStoreContext.jsx';
import { reconcileResources } from './useDeduplicator.js';

const log = (Meteor.Logger ? Meteor.Logger.for('ImportDialog') : console);

/**
 * Upload a single file to GridFS via the DICOM upload endpoint.
 *
 * @param {File} file
 * @param {object} metadata - { contentType, modality, studyInstanceUid, seriesInstanceUid, sopInstanceUid }
 * @returns {Promise<{ fileId: string, url: string, filename: string, size: number }>}
 */
function uploadFileToGridFS(file, metadata) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var response = JSON.parse(xhr.responseText);
          if (response.success) {
            resolve({
              fileId: response.fileId,
              url: response.url,
              filename: response.filename,
              size: response.size
            });
          } else {
            reject(new Error(response.error || 'Upload failed'));
          }
        } catch (e) {
          reject(new Error('Invalid server response'));
        }
      } else {
        var errorMsg = 'Upload failed (HTTP ' + xhr.status + ')';
        try {
          var errBody = JSON.parse(xhr.responseText);
          if (errBody.error) errorMsg = errBody.error;
        } catch (e) {
          // use default message
        }
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = function() {
      reject(new Error('Network error during upload'));
    };

    xhr.open('POST', '/api/dicom/upload');

    var token = Meteor._localStorage.getItem('Meteor.loginToken');
    if (token) {
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    }

    var formData = new FormData();
    formData.append('dicomFile', file, file.name);
    formData.append('dicomMetadata', JSON.stringify(metadata));

    xhr.send(formData);
  });
}

//============================================================================================================================
// THEMING

var useTheme;
var useNavigate;
Meteor.startup(function(){
  useTheme = Meteor.useTheme;
  if(window.ReactRouter){
    useNavigate = window.ReactRouter.useNavigate;
  }
});

//============================================================================================================================
// HELPERS

function isNdjsonExtension(ext){
  var ndjsonExtensions = ['ndjson', 'phr', 'sphr', 'application/ndjson', 'application/ndjson+fhir', 'application/phr', 'application/sphr'];
  return ndjsonExtensions.includes(ext);
}

function countResourcesInData(data, isNdjson){
  var counts = {};

  if(isNdjson){
    var lines = data;
    if(typeof data === 'string'){
      lines = data.split('\n');
    }
    if(Array.isArray(lines)){
      lines.forEach(function(line){
        var parsed;
        try {
          if(typeof line === 'string'){
            parsed = JSON.parse(line);
          } else {
            parsed = line;
          }
        } catch(e){
          // skip unparseable lines
        }
        if(parsed && get(parsed, 'resourceType')){
          var rt = get(parsed, 'resourceType');
          counts[rt] = (counts[rt] || 0) + 1;
        }
      });
    }
  } else {
    // Array of resources
    if(Array.isArray(data)){
      data.forEach(function(resource){
        var rt = get(resource, 'resourceType');
        if(rt){
          counts[rt] = (counts[rt] || 0) + 1;
        }
      });
    // Bundle
    } else if(get(data, 'resourceType') === 'Bundle' && Array.isArray(get(data, 'entry'))){
      data.entry.forEach(function(entry){
        var rt = get(entry, 'resource.resourceType');
        if(rt){
          counts[rt] = (counts[rt] || 0) + 1;
        }
      });
    // Single resource
    } else if(get(data, 'resourceType')){
      var rt = get(data, 'resourceType');
      counts[rt] = (counts[rt] || 0) + 1;
    }
  }

  return counts;
}

// Set the app-level patient context from an imported Patient resource.
// The session-keys contract expects Session 'selectedPatient' to be the full
// collection document (including the Mongo _id) — a raw bundle resource has
// no _id yet, and downstream consumers (e.g. quality-measures individual
// calculation) read it. Prefer the just-inserted Minimongo document; the
// importer runs before auto-select and assigns _id = resource.id.
function setSelectedPatientFromImport(patientResource){
  var Patients = get(Meteor, 'Collections.Patients');
  var fhirId = get(patientResource, 'id');
  var inserted = null;
  if(Patients && fhirId){
    inserted = Patients.findOne({ _id: fhirId });
    if(!inserted){
      // Subscription-published copies can carry a server-assigned _id that
      // differs from the FHIR id — fall back to a FHIR-id field match.
      inserted = Patients.findOne({ id: fhirId });
    }
  }
  var selected = inserted || patientResource;
  Session.set('selectedPatient', selected);
  Session.set('selectedPatientId', get(selected, 'id'));
  log.debug('ImportDialog Auto-selected patient', {
    patientId: get(selected, 'id'),
    fromCollection: !!inserted
  });
}

function findAndSelectFirstPatient(data, isNdjson){
  if(isNdjson){
    var lines = data;
    if(typeof data === 'string'){
      lines = data.split('\n');
    }
    if(Array.isArray(lines)){
      for(var i = 0; i < lines.length; i++){
        var parsed;
        try {
          if(typeof lines[i] === 'string'){
            parsed = JSON.parse(lines[i]);
          } else {
            parsed = lines[i];
          }
        } catch(e){
          continue;
        }
        if(get(parsed, 'resourceType') === 'Patient'){
          setSelectedPatientFromImport(parsed);
          return true;
        }
      }
    }
  } else {
    // Array of resources
    if(Array.isArray(data)){
      for(var i = 0; i < data.length; i++){
        if(get(data[i], 'resourceType') === 'Patient'){
          setSelectedPatientFromImport(data[i]);
          return true;
        }
      }
    // Single Patient resource
    } else if(get(data, 'resourceType') === 'Patient'){
      setSelectedPatientFromImport(data);
      return true;
    // Bundle with entries
    } else if(get(data, 'resourceType') === 'Bundle' && Array.isArray(get(data, 'entry'))){
      var entries = get(data, 'entry');
      for(var i = 0; i < entries.length; i++){
        if(get(entries[i], 'resource.resourceType') === 'Patient'){
          setSelectedPatientFromImport(get(entries[i], 'resource'));
          return true;
        }
      }
    }
  }

  return false;
}

function prepareBundleForWarehouse(data, isNdjson){
  if(isNdjson){
    var lines = data;
    if(typeof data === 'string'){
      lines = data.split('\n');
    }
    var entries = [];
    if(Array.isArray(lines)){
      lines.forEach(function(line){
        var parsed;
        try {
          if(typeof line === 'string'){
            parsed = JSON.parse(line);
          } else {
            parsed = line;
          }
        } catch(e){
          // skip
        }
        if(parsed && get(parsed, 'resourceType')){
          entries.push({ resource: parsed });
        }
      });
    }
    return {
      resourceType: 'Bundle',
      type: 'collection',
      entry: entries
    };
  }

  // Already a Bundle
  if(get(data, 'resourceType') === 'Bundle' && Array.isArray(get(data, 'entry'))){
    return data;
  }

  // Single resource - wrap it
  if(get(data, 'resourceType')){
    return {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [{ resource: data }]
    };
  }

  // Array of resources
  if(Array.isArray(data)){
    var entries = data.filter(function(r){ return get(r, 'resourceType'); }).map(function(r){
      return { resource: r };
    });
    return {
      resourceType: 'Bundle',
      type: 'collection',
      entry: entries
    };
  }

  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: []
  };
}

function collectAppleHealthResourcesAsBundle(){
  var Collections = window.Collections;
  if(!Collections){
    console.warn('[ImportDialog] window.Collections not available');
    return { resourceType: 'Bundle', type: 'collection', entry: [] };
  }

  var entries = [];
  var collectionNames = ['Observations', 'Procedures', 'Patients', 'Conditions', 'Immunizations', 'MedicationRequests'];

  collectionNames.forEach(function(name){
    var collection = Collections[name];
    if(!collection) return;

    var resources = collection.find({
      $or: [
        { 'meta.source': 'Apple Health' },
        { 'meta.tag': { $elemMatch: { code: 'apple-health-import' } } },
        { 'meta.tag': { $elemMatch: { code: 'apple-health-workout' } } }
      ]
    }).fetch();

    resources.forEach(function(resource){
      entries.push({ resource: resource });
    });
  });

  console.log('[ImportDialog] Collected', entries.length, 'Apple Health resources for warehouse');
  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: entries
  };
}

//============================================================================================================================
// MAIN COMPONENT

export function ImportDialog(props){
  var open = props.open;
  var onClose = props.onClose;
  var importMode = props.importMode || 'standard';
  var appleHealthBuffer = props.appleHealthBuffer;
  var appleHealthOptions = props.appleHealthOptions;
  var pendingBinaryUpload = props.pendingBinaryUpload || null;

  var store = useImportStore();

  // Whether the server should keep version history (honored unless dedup is loaded
  // and the user unchecked it). The server is authoritative via its own settings.
  var honorVersioning = get(store, 'state.importOptions.honorVersioning', true) !== false;

  // Apply the deduplication plan to a parsed resource array before import. Returns
  // the reconciled array (composites, collapsed duplicates, re-pointed references,
  // provenance) — or the input untouched when dedup isn't available/applicable.
  function applyDeduplication(resources) {
    var state = store.state;
    if (!state.dedupAvailable || !state.dedupAnalysis || !Array.isArray(resources) || resources.length === 0) {
      return resources;
    }
    var opts = state.importOptions || {};
    var plan = {
      analysis: state.dedupAnalysis,
      patientStrategy: opts.patientStrategy,
      clusterStrategies: opts.clusterStrategies,
      collapseExact: opts.collapseExact,
      dedupeChildrenByIdentifier: opts.dedupeChildrenByIdentifier,
      versioning: opts.honorVersioning ? (state.versioningModes || {}) : {},
      sourceName: Session.get('fileName') || 'data-importer import'
    };
    var reconciled = reconcileResources(resources, plan);
    console.log('[ImportDialog] Deduplication applied:', reconciled.summary);
    return reconciled.resources;
  }

  var appTheme = useTheme ? useTheme() : { theme: 'light' };
  var isDark = appTheme.theme === 'dark';
  var navigate = useNavigate ? useNavigate() : null;

  var defaultDestination = get(Meteor, 'settings.public.defaults.importDataMode', '') === 'temporary' ? 'client' : 'database';
  var destinationState = useState(defaultDestination);
  var destination = destinationState[0];
  var setDestination = destinationState[1];

  var autoSelectPatientState = useState(true);
  var autoSelectPatient = autoSelectPatientState[0];
  var setAutoSelectPatient = autoSelectPatientState[1];

  var importPhaseState = useState('configure');
  var importPhase = importPhaseState[0];
  var setImportPhase = importPhaseState[1];

  var importResultsState = useState(null);
  var importResults = importResultsState[0];
  var setImportResults = importResultsState[1];

  var errorMessageState = useState('');
  var errorMessage = errorMessageState[0];
  var setErrorMessage = errorMessageState[1];

  // Theme colors
  var cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  var cardTextColor = isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)';
  var dividerColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  function handleClose(){
    if(importPhase === 'importing'){
      return;
    }
    setDestination(defaultDestination);
    setAutoSelectPatient(true);
    setImportPhase('configure');
    setImportResults(null);
    setErrorMessage('');
    if(onClose){
      onClose(importPhase === 'complete');
    }
  }

  async function handleImport(){
    console.log('[ImportDialog] Starting import. Mode:', importMode, 'Destination:', destination);
    setImportPhase('importing');

    try {
      if(importMode === 'appleHealth'){
        if(destination === 'client'){
          await handleAppleHealthClientImport();
        } else {
          await handleAppleHealthDatabaseImport();
        }
      } else {
        // Standard JSON/NDJSON import
        var data = Session.get('importBuffer');
        var fileExtension = Session.get('fileExtension') || 'json';

        if(!data){
          console.warn('[ImportDialog] No data to import');
          setErrorMessage('No data to import. Please load a file first.');
          setImportPhase('error');
          return;
        }

        var isNdjson = isNdjsonExtension(fileExtension);

        // Deduplicate before import. Reconcile produces a flat resource array, so
        // downstream handlers treat the result as a Bundle/array (isNdjson=false).
        var state = store.state;
        if(state.dedupAvailable && state.dedupAnalysis && state.resourceList.length > 0){
          data = applyDeduplication(state.resourceList);
          isNdjson = false;
        }

        if(destination === 'client'){
          await handleClientImport(data, isNdjson);
        } else {
          await handleDatabaseImport(data, isNdjson);
        }
      }
    } catch(error){
      console.error('[ImportDialog] Import error:', error);
      setErrorMessage(error.message || 'An unexpected error occurred during import.');
      setImportPhase('error');
    }
  }

  // ---- Standard import handlers ----

  async function handleClientImport(data, isNdjson){
    var resourceCounts = countResourcesInData(data, isNdjson);
    console.log('[ImportDialog] Resource counts:', resourceCounts);

    if(isNdjson){
      console.log('[ImportDialog] Importing NDJSON data to client');
      await MedicalRecordImporter.importNdjson(data);
    } else {
      console.log('[ImportDialog] Importing Bundle data to client');
      await MedicalRecordImporter.importBundle(data);
    }

    var patientFound = false;
    if(autoSelectPatient){
      patientFound = findAndSelectFirstPatient(data, isNdjson);
    }

    var totalCount = 0;
    Object.keys(resourceCounts).forEach(function(key){
      totalCount = totalCount + resourceCounts[key];
    });

    setImportResults({
      resourceTypes: resourceCounts,
      inserted: totalCount,
      updated: 0,
      errors: [],
      patientFound: patientFound
    });
    setImportPhase('complete');
    console.log('[ImportDialog] Client import complete. Total resources:', totalCount);
  }

  async function handleDatabaseImport(data, isNdjson){
    // If we have pending binary files, upload them to GridFS first and patch resources
    if(pendingBinaryUpload){
      console.log('[ImportDialog] Pending binary upload detected — uploading to GridFS');

      var classifiedFiles = pendingBinaryUpload.classifiedFiles;
      var fileMetadata = pendingBinaryUpload.fileMetadata;
      var uploadResults = [];

      for(var i = 0; i < classifiedFiles.length; i++){
        var classifiedFile = classifiedFiles[i];
        var file = classifiedFile.file;
        var metadata = fileMetadata[i];

        console.log('[ImportDialog] Uploading file', (i + 1), 'of', classifiedFiles.length, ':', file.name);

        var response = await uploadFileToGridFS(file, metadata);

        uploadResults.push({
          fileIndex: i,
          fileId: response.fileId,
          url: response.url,
          fileName: file.name
        });
      }

      console.log('[ImportDialog] All files uploaded. Patching resources with real GridFS references');

      // data is the array of FHIR resources from importBuffer
      var patchedResources = Array.isArray(data) ? data : [];
      patchResourcesWithUploadResults(patchedResources, uploadResults);

      // Wrap patched resources into a bundle for warehouse
      var bundle = prepareBundleForWarehouse(patchedResources, false);
      var entryCount = get(bundle, 'entry.length', 0);
      console.log('[ImportDialog] Prepared patched bundle with', entryCount, 'entries for warehouse');

      var result = await new Promise(function(resolve, reject){
        Meteor.call('insertBundleIntoWarehouse', bundle, { mode: 'local', honorVersioning: honorVersioning }, function(error, result){
          if(error){
            console.error('[ImportDialog] Warehouse error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        });
      });

      console.log('[ImportDialog] Warehouse result:', result);

      // Also load patched resources into client Minimongo
      await MedicalRecordImporter.importBundle(patchedResources);

      var patientFound = false;
      if(autoSelectPatient){
        patientFound = findAndSelectFirstPatient(patchedResources, false);
      }

      Session.set('lastDataImport', Date.now());

      setImportResults({
        resourceTypes: get(result, 'resourceTypes', {}),
        inserted: get(result, 'inserted', 0),
        updated: get(result, 'updated', 0),
        errors: get(result, 'errors', []),
        patientFound: patientFound
      });
      setImportPhase('complete');
      console.log('[ImportDialog] Binary database import complete. Inserted:', get(result, 'inserted', 0));
      return;
    }

    var bundle = prepareBundleForWarehouse(data, isNdjson);
    var entryCount = get(bundle, 'entry.length', 0);
    console.log('[ImportDialog] Prepared bundle with', entryCount, 'entries for warehouse');

    var result = await new Promise(function(resolve, reject){
      Meteor.call('insertBundleIntoWarehouse', bundle, { mode: 'local', honorVersioning: honorVersioning }, function(error, result){
        if(error){
          console.error('[ImportDialog] Warehouse error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    console.log('[ImportDialog] Warehouse result:', result);

    // Also load into client Minimongo so data is immediately visible
    if(isNdjson){
      await MedicalRecordImporter.importNdjson(data);
    } else {
      await MedicalRecordImporter.importBundle(data);
    }

    var patientFound = false;
    if(autoSelectPatient){
      patientFound = findAndSelectFirstPatient(data, isNdjson);
    }

    Session.set('lastDataImport', Date.now());

    setImportResults({
      resourceTypes: get(result, 'resourceTypes', {}),
      inserted: get(result, 'inserted', 0),
      updated: get(result, 'updated', 0),
      errors: get(result, 'errors', []),
      patientFound: patientFound
    });
    setImportPhase('complete');
    console.log('[ImportDialog] Database import complete. Inserted:', get(result, 'inserted', 0), 'Updated:', get(result, 'updated', 0));
  }

  // ---- Apple Health import handlers ----

  async function handleAppleHealthClientImport(){
    console.log('[ImportDialog] Importing Apple Health to client');

    if(appleHealthBuffer instanceof ArrayBuffer){
      await MedicalRecordImporter.importAppleHealthExport(appleHealthBuffer, appleHealthOptions || {});
    } else if(typeof appleHealthBuffer === 'string'){
      await MedicalRecordImporter.processAppleHealthXML(appleHealthBuffer, appleHealthOptions || {});
    } else {
      throw new Error('No Apple Health data available');
    }

    // Count what got imported by scanning Minimongo
    var resourceCounts = {};
    var totalCount = 0;
    var Collections = window.Collections;
    if(Collections){
      ['Observations', 'Procedures', 'Patients', 'Conditions'].forEach(function(name){
        var collection = Collections[name];
        if(collection){
          var count = collection.find({
            $or: [
              { 'meta.source': 'Apple Health' },
              { 'meta.tag': { $elemMatch: { code: 'apple-health-import' } } },
              { 'meta.tag': { $elemMatch: { code: 'apple-health-workout' } } }
            ]
          }).count();
          if(count > 0){
            // Remove trailing 's' for resource type display
            var rtName = name === 'Procedures' ? 'Procedure' :
                         name === 'Observations' ? 'Observation' :
                         name === 'Patients' ? 'Patient' :
                         name === 'Conditions' ? 'Condition' : name;
            resourceCounts[rtName] = count;
            totalCount += count;
          }
        }
      });
    }

    var patientFound = false;
    if(autoSelectPatient){
      // Check if a patient was set during Apple Health import
      if(Session.get('selectedPatientId')){
        patientFound = true;
      }
    }

    setImportResults({
      resourceTypes: resourceCounts,
      inserted: totalCount,
      updated: 0,
      errors: [],
      patientFound: patientFound
    });
    setImportPhase('complete');
    console.log('[ImportDialog] Apple Health client import complete. Total resources:', totalCount);
  }

  async function handleAppleHealthDatabaseImport(){
    console.log('[ImportDialog] Importing Apple Health to database');

    // First import to client Minimongo (generates FHIR resources)
    if(appleHealthBuffer instanceof ArrayBuffer){
      await MedicalRecordImporter.importAppleHealthExport(appleHealthBuffer, appleHealthOptions || {});
    } else if(typeof appleHealthBuffer === 'string'){
      await MedicalRecordImporter.processAppleHealthXML(appleHealthBuffer, appleHealthOptions || {});
    } else {
      throw new Error('No Apple Health data available');
    }

    // Collect the newly-imported Apple Health resources into a Bundle
    var bundle = collectAppleHealthResourcesAsBundle();
    var entryCount = get(bundle, 'entry.length', 0);
    console.log('[ImportDialog] Collected', entryCount, 'Apple Health resources for database');

    if(entryCount === 0){
      setImportResults({
        resourceTypes: {},
        inserted: 0,
        updated: 0,
        errors: ['No Apple Health resources found after import'],
        patientFound: false
      });
      setImportPhase('complete');
      return;
    }

    // Send to server warehouse
    var result = await new Promise(function(resolve, reject){
      Meteor.call('insertBundleIntoWarehouse', bundle, { mode: 'local' }, function(error, result){
        if(error){
          console.error('[ImportDialog] Warehouse error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    console.log('[ImportDialog] Warehouse result:', result);

    var patientFound = false;
    if(autoSelectPatient && Session.get('selectedPatientId')){
      patientFound = true;
    }

    Session.set('lastDataImport', Date.now());

    setImportResults({
      resourceTypes: get(result, 'resourceTypes', {}),
      inserted: get(result, 'inserted', 0),
      updated: get(result, 'updated', 0),
      errors: get(result, 'errors', []),
      patientFound: patientFound
    });
    setImportPhase('complete');
    console.log('[ImportDialog] Apple Health database import complete. Inserted:', get(result, 'inserted', 0));
  }

  // ---- Navigation ----

  function handleGoToPatientChart(){
    handleClose();
    if(navigate){
      navigate('/patient-chart');
    }
  }

  function handleRetry(){
    setImportPhase('configure');
    setErrorMessage('');
    setImportResults(null);
  }

  // ---- Render helpers ----

  function renderDestinationTile(tileDestination, icon, title, description){
    var isSelected = destination === tileDestination;

    return (
      <Card
        onClick={function(){ setDestination(tileDestination); }}
        sx={{
          flex: 1,
          cursor: 'pointer',
          border: isSelected ? '2px solid' : '1px solid',
          borderColor: isSelected
            ? (isDark ? '#90caf9' : '#1976d2')
            : dividerColor,
          backgroundColor: isSelected
            ? (isDark ? 'rgba(144,202,249,0.08)' : 'rgba(25,118,210,0.04)')
            : cardBgColor,
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            borderColor: isDark ? '#90caf9' : '#1976d2',
            backgroundColor: isSelected
              ? (isDark ? 'rgba(144,202,249,0.08)' : 'rgba(25,118,210,0.04)')
              : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)')
          }
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <Box sx={{ mb: 1, color: isSelected ? (isDark ? '#90caf9' : '#1976d2') : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)') }}>
            {icon}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: cardTextColor }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', mt: 0.5 }}>
            {description}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  function renderConfigurePhase(){
    return (
      <Box>
        <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', mb: 2 }}>
          Choose where to store the imported data:
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          {renderDestinationTile(
            'database',
            <StorageIcon sx={{ fontSize: 40 }} />,
            'Permanent (Database)',
            'Persists to server database. Available across sessions and to other users.'
          )}
          {renderDestinationTile(
            'client',
            <LaptopMacIcon sx={{ fontSize: 40 }} />,
            'Temporary (Browser)',
            'Quick preview. Data lives in browser memory only and will be lost on refresh.'
          )}
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={autoSelectPatient}
              onChange={function(e){ setAutoSelectPatient(e.target.checked); }}
              sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : undefined }}
            />
          }
          label="Auto-select first patient after import"
          sx={{ color: cardTextColor }}
        />
      </Box>
    );
  }

  function renderImportingPhase(){
    var label = destination === 'database' ? ' to database' : ' to browser';
    if(importMode === 'appleHealth'){
      label = ' Apple Health data' + label;
    }

    return (
      <Box sx={{ py: 3 }}>
        <Typography variant="body1" sx={{ color: cardTextColor, mb: 2, textAlign: 'center' }}>
          Importing{label}...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  function renderCompletePhase(){
    var resourceTypes = get(importResults, 'resourceTypes', {});
    var resourceKeys = Object.keys(resourceTypes).sort();
    var patientFound = get(importResults, 'patientFound', false);
    var insertedCount = get(importResults, 'inserted', 0);
    var updatedCount = get(importResults, 'updated', 0);
    var errors = get(importResults, 'errors', []);

    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CheckCircleIcon sx={{ color: '#66bb6a', fontSize: 28 }} />
          <Typography variant="h6" sx={{ color: cardTextColor }}>
            Import Complete
          </Typography>
        </Box>

        {destination === 'database' ? (
          <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', mb: 2 }}>
            {insertedCount} inserted, {updatedCount} updated
            {errors.length > 0 ? ', ' + errors.length + ' errors' : ''}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', mb: 2 }}>
            {insertedCount} resources loaded into browser
          </Typography>
        )}

        {resourceKeys.length > 0 ? (
          <Table size="small" sx={{ mb: 2 }}>
            <TableBody>
              {resourceKeys.map(function(key){
                return (
                  <TableRow key={key}>
                    <TableCell sx={{ color: cardTextColor, borderColor: dividerColor }}>{key}</TableCell>
                    <TableCell align="right" sx={{ color: cardTextColor, borderColor: dividerColor }}>{resourceTypes[key]}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : null}

        {errors.length > 0 ? (
          <Alert severity="error" sx={{ mt: 1 }}>
            <AlertTitle>
              {errors.length} Error{errors.length !== 1 ? 's' : ''}
            </AlertTitle>
            {errors.slice(0, 5).map(function(err, idx){
              return (
                <Typography key={idx} variant="caption" sx={{ display: 'block' }}>
                  {typeof err === 'string' ? err : JSON.stringify(err)}
                </Typography>
              );
            })}
            {errors.length > 5 ? (
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                ...and {errors.length - 5} more
              </Typography>
            ) : null}
          </Alert>
        ) : null}

        {autoSelectPatient && patientFound && Session.get('selectedPatientId') ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleGoToPatientChart}
            sx={{ mt: 2 }}
            fullWidth
          >
            Go to Patient Chart
          </Button>
        ) : null}
      </Box>
    );
  }

  function renderErrorPhase(){
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ErrorIcon sx={{ color: '#f44336', fontSize: 28 }} />
          <Typography variant="h6" sx={{ color: cardTextColor }}>
            Import Failed
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#f44336', mb: 2 }}>
          {errorMessage}
        </Typography>
      </Box>
    );
  }

  // ---- Main render ----

  var dialogTitle = 'Import Data';
  if(importPhase === 'importing'){
    dialogTitle = 'Importing...';
  } else if(importPhase === 'complete'){
    dialogTitle = 'Import Results';
  } else if(importPhase === 'error'){
    dialogTitle = 'Import Error';
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={importPhase === 'importing'}
      PaperProps={{
        sx: {
          bgcolor: cardBgColor,
          color: cardTextColor,
          '& .MuiDialogTitle-root': { color: cardTextColor },
          '& .MuiDialogActions-root': { borderTop: '1px solid', borderColor: dividerColor }
        }
      }}
    >
      <DialogTitle>
        {dialogTitle}
      </DialogTitle>
      <DialogContent>
        {importPhase === 'configure' ? renderConfigurePhase() : null}
        {importPhase === 'importing' ? renderImportingPhase() : null}
        {importPhase === 'complete' ? renderCompletePhase() : null}
        {importPhase === 'error' ? renderErrorPhase() : null}
      </DialogContent>
      <DialogActions>
        {importPhase === 'configure' ? (
          <>
            <Button onClick={handleClose} sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleImport}>
              Import
            </Button>
          </>
        ) : null}

        {importPhase === 'complete' ? (
          <Button onClick={handleClose} sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
            Close
          </Button>
        ) : null}

        {importPhase === 'error' ? (
          <>
            <Button onClick={handleClose} sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
              Close
            </Button>
            <Button variant="contained" onClick={handleRetry}>
              Retry
            </Button>
          </>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}

export default ImportDialog;
