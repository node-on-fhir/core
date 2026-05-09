// packages/data-importer/lib/FhirResourceBuilder.js
//
// Builds FHIR resources from uploaded binary file metadata for the binary
// import pipeline. Routes by file type:
//   .wav → Device + Media + Observations + DiagnosticReport
//   .dcm → ImagingStudy
//   .pdf → DocumentReference

import { Random } from 'meteor/random';
import { get } from 'lodash';

/**
 * Content-type mapping by classified file type.
 */
var CONTENT_TYPES = {
  'dicom': 'application/dicom',
  'ecg-wav': 'audio/wav',
  'pcg-wav': 'audio/wav',
  'pdf': 'application/pdf'
};

/**
 * DICOM modality code mapping by classified file type.
 */
var MODALITY_CODES = {
  'dicom': 'ECG',
  'ecg-wav': 'AU',
  'pcg-wav': 'AU',
  'pdf': 'OT'
};

/**
 * Media type coding by classified file type.
 */
var MEDIA_TYPE_CODINGS = {
  'ecg-wav': { code: 'audio', display: 'Audio' },
  'pcg-wav': { code: 'audio', display: 'Audio' },
  'dicom': { code: 'image', display: 'Image' },
  'pdf': { code: 'document', display: 'Document' }
};

/**
 * Build a Device resource for the recording device.
 *
 * @param {object} options
 * @param {string} options.deviceManufacturer
 * @param {string} options.deviceName
 * @param {object|null} wavMeta - WAV metadata from WavHeaderParser (optional)
 * @returns {object} FHIR Device resource
 */
function buildDevice(options, wavMeta) {
  var deviceId = Random.id();
  var device = {
    resourceType: 'Device',
    _id: deviceId,
    id: deviceId,
    manufacturer: get(options, 'deviceManufacturer', 'Eko Health'),
    deviceName: [{
      name: get(options, 'deviceName', 'Eko DUO Digital Stethoscope + ECG'),
      type: 'user-friendly-name'
    }],
    type: {
      text: 'Digital stethoscope with single-lead ECG capability'
    },
    meta: {
      tag: [{ code: 'binary-import', display: 'Binary File Import' }]
    }
  };

  // Add device properties from WAV metadata if available
  if (wavMeta) {
    device.property = [];
    if (wavMeta.sampleRateHz) {
      device.property.push({
        type: { text: 'ECG Sampling Frequency' },
        valueQuantity: [{ value: wavMeta.sampleRateHz, unit: 'Hz' }]
      });
    }
    if (wavMeta.channels) {
      device.property.push({
        type: { text: 'Number of Channels' },
        valueQuantity: [{ value: wavMeta.channels, unit: 'channels' }]
      });
    }
    if (wavMeta.bitsPerSample) {
      device.property.push({
        type: { text: 'Bits Per Sample' },
        valueQuantity: [{ value: wavMeta.bitsPerSample, unit: 'bits' }]
      });
    }
  }

  return device;
}

/**
 * Build a Media resource for a single uploaded file.
 *
 * @param {object} fileInfo - Uploaded file info with GridFS response
 * @param {string} deviceId - Reference to Device resource
 * @param {object} options - Import options (patientId, patientDisplay)
 * @returns {object} FHIR Media resource
 */
function buildMedia(fileInfo, deviceId, options) {
  var mediaId = Random.id();
  var fileType = get(fileInfo, 'type', 'pdf');
  var typeCoding = MEDIA_TYPE_CODINGS[fileType] || { code: 'document', display: 'Document' };

  var media = {
    resourceType: 'Media',
    _id: mediaId,
    id: mediaId,
    status: 'completed',
    type: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/media-type',
        code: typeCoding.code,
        display: typeCoding.display
      }]
    },
    modality: {
      coding: [{
        system: 'http://dicom.nema.org/resources/ontology/DCM',
        code: MODALITY_CODES[fileType] || 'OT'
      }],
      text: get(fileInfo, 'label', 'Unknown')
    },
    device: {
      reference: 'Device/' + deviceId,
      display: get(options, 'deviceName', 'Eko DUO Digital Stethoscope + ECG')
    },
    content: {
      contentType: CONTENT_TYPES[fileType] || 'application/octet-stream',
      url: get(fileInfo, 'gridfsUrl', ''),
      title: get(fileInfo, 'fileName', 'unknown'),
      size: get(fileInfo, 'fileSize', 0)
    },
    meta: {
      tag: [{ code: 'binary-import', display: 'Binary File Import' }]
    }
  };

  // Add patient subject if available
  var patientId = get(options, 'patientId');
  if (patientId) {
    media.subject = {
      reference: 'Patient/' + patientId,
      display: get(options, 'patientDisplay', '')
    };
  }

  // Add WAV metadata as note if available
  var wavMeta = get(fileInfo, 'wavMeta');
  if (wavMeta) {
    var parts = [];
    if (wavMeta.sampleRateHz) parts.push(wavMeta.sampleRateHz + ' Hz');
    if (wavMeta.channels) parts.push(wavMeta.channels + ' channel' + (wavMeta.channels > 1 ? 's' : ''));
    if (wavMeta.bitsPerSample) parts.push(wavMeta.bitsPerSample + '-bit');
    if (wavMeta.durationSec) parts.push(wavMeta.durationSec + 's duration');
    if (parts.length > 0) {
      media.note = [{ text: 'WAV: ' + parts.join(', ') }];
    }
  }

  return media;
}

/**
 * Build a Heart Rate Observation derived from ECG waveform data.
 *
 * @param {string} deviceId - Reference to Device resource
 * @param {string[]} ecgMediaIds - IDs of ECG-type Media resources
 * @param {object} options - Import options (patientId, patientDisplay)
 * @returns {object} FHIR Observation resource
 */
function buildHeartRateObservation(deviceId, ecgMediaIds, options) {
  var obsId = Random.id();
  var obs = {
    resourceType: 'Observation',
    _id: obsId,
    id: obsId,
    status: 'preliminary',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '8867-4',
        display: 'Heart rate'
      }]
    },
    effectiveDateTime: new Date().toISOString(),
    device: {
      reference: 'Device/' + deviceId
    },
    method: {
      text: 'Derived from digital stethoscope ECG waveform export'
    },
    valueQuantity: {
      value: 0,
      unit: '/min',
      system: 'http://unitsofmeasure.org',
      code: '/min'
    },
    note: [{
      text: 'Placeholder value pending formal signal processing pipeline.'
    }],
    derivedFrom: ecgMediaIds.map(function(id) {
      return { reference: 'Media/' + id };
    }),
    meta: {
      tag: [{ code: 'binary-import', display: 'Binary File Import' }]
    }
  };

  // Add patient subject if available
  var patientId = get(options, 'patientId');
  if (patientId) {
    obs.subject = {
      reference: 'Patient/' + patientId,
      display: get(options, 'patientDisplay', '')
    };
  }

  return obs;
}

/**
 * Build an RR Interval Summary Observation derived from ECG waveform data.
 *
 * @param {string} deviceId - Reference to Device resource
 * @param {string[]} ecgMediaIds - IDs of ECG-type Media resources
 * @param {object} options - Import options (patientId, patientDisplay)
 * @returns {object} FHIR Observation resource
 */
function buildRRIntervalObservation(deviceId, ecgMediaIds, options) {
  var obsId = Random.id();
  var obs = {
    resourceType: 'Observation',
    _id: obsId,
    id: obsId,
    status: 'preliminary',
    category: [{
      text: 'cardiology'
    }],
    code: {
      text: 'RR interval summary'
    },
    effectiveDateTime: new Date().toISOString(),
    method: {
      text: 'Derived from R-peak detection on ECG waveform export'
    },
    component: [
      {
        code: { text: 'Mean RR interval' },
        valueQuantity: {
          value: 0,
          unit: 's',
          system: 'http://unitsofmeasure.org',
          code: 's'
        }
      },
      {
        code: { text: 'Rhythm regularity' },
        valueCodeableConcept: {
          text: 'Pending analysis'
        }
      }
    ],
    note: [{
      text: 'Placeholder values pending ECG signal ingestion and analysis.'
    }],
    derivedFrom: ecgMediaIds.map(function(id) {
      return { reference: 'Media/' + id };
    }),
    meta: {
      tag: [{ code: 'binary-import', display: 'Binary File Import' }]
    }
  };

  // Add patient subject if available
  var patientId = get(options, 'patientId');
  if (patientId) {
    obs.subject = {
      reference: 'Patient/' + patientId,
      display: get(options, 'patientDisplay', '')
    };
  }

  return obs;
}

/**
 * Build an ECG Waveform Observation with valueSampledData from decoded PCM samples.
 *
 * @param {string} deviceId - Reference to Device resource
 * @param {string[]} ecgMediaIds - IDs of ECG-type Media resources
 * @param {number[]} samples - Decoded PCM integers (channel 0)
 * @param {object} wavMeta - WAV metadata { sampleRateHz, durationSec, ... }
 * @param {object} samplesMeta - { totalSamples, extractedSeconds }
 * @param {object} options - Import options (patientId, patientDisplay)
 * @returns {object} FHIR Observation resource with valueSampledData
 */
function buildEcgWaveformObservation(deviceId, ecgMediaIds, samples, wavMeta, samplesMeta, options) {
  var obsId = Random.id();
  var sampleRate = get(wavMeta, 'sampleRateHz', 500);
  var periodMs = sampleRate > 0 ? (1000.0 / sampleRate) : 2.0;
  var totalDuration = get(wavMeta, 'durationSec', 0);
  var extractedSec = get(samplesMeta, 'extractedSeconds', 0);

  // Compute min/max from actual samples
  var lowerLimit = 0;
  var upperLimit = 0;
  for (var i = 0; i < samples.length; i++) {
    if (samples[i] < lowerLimit) lowerLimit = samples[i];
    if (samples[i] > upperLimit) upperLimit = samples[i];
  }

  // Build method text describing truncation
  var methodText = 'Digitally acquired from Eko DUO ECG export';
  if (extractedSec > 0 && totalDuration > 0 && extractedSec < totalDuration) {
    methodText += '; first ' + extractedSec + ' seconds of ' + totalDuration + 's recording';
  } else if (extractedSec > 0) {
    methodText += '; ' + extractedSec + ' seconds';
  }

  var obs = {
    resourceType: 'Observation',
    _id: obsId,
    id: obsId,
    status: 'final',
    category: [{
      text: 'cardiology'
    }],
    code: {
      text: 'Single-channel ECG waveform'
    },
    effectiveDateTime: new Date().toISOString(),
    device: {
      reference: 'Device/' + deviceId
    },
    method: {
      text: methodText
    },
    valueSampledData: {
      origin: {
        value: 0,
        unit: 'count'
      },
      period: Math.round(periodMs * 100) / 100,
      factor: 1.0,
      lowerLimit: lowerLimit,
      upperLimit: upperLimit,
      dimensions: 1,
      data: samples.join(' ')
    },
    derivedFrom: ecgMediaIds.map(function(id) {
      return { reference: 'Media/' + id };
    }),
    meta: {
      tag: [{ code: 'binary-import', display: 'Binary File Import' }]
    }
  };

  // Add patient subject if available
  var patientId = get(options, 'patientId');
  if (patientId) {
    obs.subject = {
      reference: 'Patient/' + patientId,
      display: get(options, 'patientDisplay', '')
    };
  }

  return obs;
}

/**
 * Build an ImagingStudy resource for a DICOM file.
 *
 * @param {object} fileInfo - Uploaded file info with GridFS response
 * @param {object} options - Import options (patientId, patientDisplay)
 * @returns {object} FHIR ImagingStudy resource
 */
function buildImagingStudy(fileInfo, options) {
  var studyId = Random.id();
  var seriesUid = '2.25.' + Random.id();
  var instanceUid = '2.25.' + Random.id();

  var study = {
    resourceType: 'ImagingStudy',
    _id: studyId,
    id: studyId,
    status: 'available',
    started: new Date().toISOString(),
    numberOfSeries: 1,
    numberOfInstances: 1,
    series: [{
      uid: seriesUid,
      modality: {
        system: 'http://dicom.nema.org/resources/ontology/DCM',
        code: 'OT'
      },
      numberOfInstances: 1,
      instance: [{
        uid: instanceUid,
        sopClass: {
          system: 'urn:ietf:rfc:3986',
          code: 'urn:oid:1.2.840.10008.5.1.4.1.1.2'
        },
        title: get(fileInfo, 'fileName', 'unknown.dcm')
      }]
    }],
    endpoint: [{
      reference: get(fileInfo, 'gridfsUrl', '')
    }],
    meta: {
      tag: [{ code: 'binary-import', display: 'Binary File Import' }]
    }
  };

  // Add patient subject if available
  var patientId = get(options, 'patientId');
  if (patientId) {
    study.subject = {
      reference: 'Patient/' + patientId,
      display: get(options, 'patientDisplay', '')
    };
  }

  return study;
}

/**
 * Build a DocumentReference resource for a PDF file.
 *
 * @param {object} fileInfo - Uploaded file info with GridFS response
 * @param {object} options - Import options (patientId, patientDisplay)
 * @returns {object} FHIR DocumentReference resource
 */
function buildDocumentReference(fileInfo, options) {
  var docRefId = Random.id();

  var docRef = {
    resourceType: 'DocumentReference',
    _id: docRefId,
    id: docRefId,
    status: 'current',
    docStatus: 'final',
    type: {
      text: 'Clinical report'
    },
    date: new Date().toISOString(),
    content: [{
      attachment: {
        contentType: 'application/pdf',
        url: get(fileInfo, 'gridfsUrl', ''),
        title: get(fileInfo, 'fileName', 'document.pdf'),
        size: get(fileInfo, 'fileSize', 0)
      }
    }],
    meta: {
      tag: [{ code: 'binary-import', display: 'Binary File Import' }]
    }
  };

  // Add patient subject if available
  var patientId = get(options, 'patientId');
  if (patientId) {
    docRef.subject = {
      reference: 'Patient/' + patientId,
      display: get(options, 'patientDisplay', '')
    };
  }

  return docRef;
}

/**
 * Build a DiagnosticReport resource that references all Media resources.
 *
 * @param {object[]} mediaResources - Array of Media FHIR resources
 * @param {object[]} observationResources - Array of Observation FHIR resources
 * @param {object} options - Import options
 * @param {object[]} uploadedFiles - Original classified file info array
 * @returns {object} FHIR DiagnosticReport resource
 */
function buildDiagnosticReport(mediaResources, observationResources, options, uploadedFiles) {
  var reportId = Random.id();

  var report = {
    resourceType: 'DiagnosticReport',
    _id: reportId,
    id: reportId,
    status: 'final',
    category: [{
      text: 'Cardiology'
    }],
    code: {
      text: 'Digital stethoscope recording summary'
    },
    effectiveDateTime: new Date().toISOString(),
    issued: new Date().toISOString(),
    resultsInterpreter: [{
      display: 'Eko export workflow'
    }],
    result: [],
    media: [],
    meta: {
      tag: [{ code: 'binary-import', display: 'Binary File Import' }]
    }
  };

  // Add observation result references
  for (var r = 0; r < observationResources.length; r++) {
    report.result.push({
      reference: 'Observation/' + observationResources[r].id
    });
  }

  // Add patient subject if available
  var patientId = get(options, 'patientId');
  if (patientId) {
    report.subject = {
      reference: 'Patient/' + patientId,
      display: get(options, 'patientDisplay', '')
    };
  }

  // Add media references
  for (var i = 0; i < mediaResources.length; i++) {
    report.media.push({
      link: {
        reference: 'Media/' + mediaResources[i].id,
        display: get(mediaResources[i], 'content.title', '')
      }
    });
  }

  // Add PDF as presentedForm if present
  var pdfFiles = uploadedFiles.filter(function(f) { return f.type === 'pdf'; });
  if (pdfFiles.length > 0) {
    report.presentedForm = pdfFiles.map(function(f) {
      return {
        contentType: 'application/pdf',
        url: get(f, 'gridfsUrl', ''),
        title: get(f, 'fileName', 'Report.pdf')
      };
    });
  }

  // Add conclusion note about uncalibrated data
  var hasWav = uploadedFiles.some(function(f) {
    return f.type === 'ecg-wav' || f.type === 'pcg-wav';
  });
  if (hasWav) {
    report.conclusion = 'Contains uncalibrated waveform data from device recording. Clinical interpretation should consider device calibration status.';
  }

  return report;
}

/**
 * Build a complete import bundle from uploaded file metadata.
 *
 * Routes files by type:
 *   .wav → Device + Media + Observations (HR, RR, Waveform) + DiagnosticReport
 *   .dcm → ImagingStudy
 *   .pdf → DocumentReference
 *
 * Mixed drops generate the union of resources for each file type present.
 *
 * @param {object[]} uploadedFiles - Array of classified + uploaded file info
 *   Each entry has: { type, fileName, fileSize, contentType, gridfsFileId, gridfsUrl, wavMeta?, label }
 * @param {object} options
 *   { patientId?, patientDisplay?, deviceManufacturer?, deviceName? }
 * @returns {object[]} Array of FHIR resources
 */
function buildImportBundle(uploadedFiles, options) {
  var opts = options || {};
  var resources = [];

  // Separate files by type
  var wavFiles = [];
  var dicomFiles = [];
  var pdfFiles = [];

  for (var i = 0; i < uploadedFiles.length; i++) {
    var fileType = uploadedFiles[i].type;
    if (fileType === 'ecg-wav' || fileType === 'pcg-wav') {
      wavFiles.push(uploadedFiles[i]);
    } else if (fileType === 'dicom') {
      dicomFiles.push(uploadedFiles[i]);
    } else if (fileType === 'pdf') {
      pdfFiles.push(uploadedFiles[i]);
    }
  }

  // --- WAV workflow (stethoscope/cardiology) ---
  if (wavFiles.length > 0) {
    // Find first WAV metadata for device properties
    var firstWavMeta = null;
    for (var w = 0; w < wavFiles.length; w++) {
      if (wavFiles[w].wavMeta) {
        firstWavMeta = wavFiles[w].wavMeta;
        break;
      }
    }

    // Build Device resource
    var device = buildDevice(opts, firstWavMeta);
    resources.push(device);

    // Build Media resources (one per WAV file)
    var mediaResources = [];
    for (var j = 0; j < wavFiles.length; j++) {
      var media = buildMedia(wavFiles[j], device.id, opts);
      mediaResources.push(media);
      resources.push(media);
    }

    // Build Observation resources (only when ECG WAV data is present)
    var observationResources = [];
    var ecgMediaIds = [];

    // Collect ECG-type Media IDs (ecg-wav only, not dicom)
    for (var m = 0; m < wavFiles.length; m++) {
      if (wavFiles[m].type === 'ecg-wav') {
        ecgMediaIds.push(mediaResources[m].id);
      }
    }

    if (ecgMediaIds.length > 0) {
      var heartRateObs = buildHeartRateObservation(device.id, ecgMediaIds, opts);
      var rrIntervalObs = buildRRIntervalObservation(device.id, ecgMediaIds, opts);
      observationResources.push(heartRateObs);
      observationResources.push(rrIntervalObs);

      // Build ECG waveform Observation if samples were extracted from WAV
      var ecgSamples = null;
      var ecgWavMeta = null;
      var ecgSamplesMeta = null;
      for (var s = 0; s < wavFiles.length; s++) {
        if (wavFiles[s].type === 'ecg-wav' && wavFiles[s].wavSamples && wavFiles[s].wavSamples.length > 0) {
          ecgSamples = wavFiles[s].wavSamples;
          ecgWavMeta = wavFiles[s].wavMeta;
          ecgSamplesMeta = wavFiles[s].wavSamplesMeta;
          break;
        }
      }
      if (ecgSamples && ecgSamples.length > 0) {
        var ecgWaveformObs = buildEcgWaveformObservation(device.id, ecgMediaIds, ecgSamples, ecgWavMeta, ecgSamplesMeta, opts);
        observationResources.push(ecgWaveformObs);
      }
    }

    for (var n = 0; n < observationResources.length; n++) {
      resources.push(observationResources[n]);
    }

    // Build DiagnosticReport referencing WAV Media + Observations
    // Pass pdfFiles so presentedForm can include PDFs if present
    var report = buildDiagnosticReport(mediaResources, observationResources, opts, wavFiles.concat(pdfFiles));
    resources.push(report);
  }

  // --- DICOM workflow (imaging) ---
  for (var d = 0; d < dicomFiles.length; d++) {
    var imagingStudy = buildImagingStudy(dicomFiles[d], opts);
    resources.push(imagingStudy);
  }

  // --- PDF workflow (document references) ---
  for (var p = 0; p < pdfFiles.length; p++) {
    var docRef = buildDocumentReference(pdfFiles[p], opts);
    resources.push(docRef);
  }

  return resources;
}

export { buildImportBundle, buildDevice, buildMedia, buildHeartRateObservation, buildRRIntervalObservation, buildEcgWaveformObservation, buildDiagnosticReport, buildImagingStudy, buildDocumentReference };
export default { buildImportBundle, buildDevice, buildMedia, buildHeartRateObservation, buildRRIntervalObservation, buildEcgWaveformObservation, buildDiagnosticReport, buildImagingStudy, buildDocumentReference };
