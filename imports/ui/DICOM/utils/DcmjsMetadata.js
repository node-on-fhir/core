// imports/ui/DICOM/utils/DcmjsMetadata.js
// DICOM metadata extraction backed by the dcmjs rewrite (libraries/dcmjs
// submodule, consumed via the "dcmjs" file: dependency).
//
// The DICOM→FHIR value mapping lives in the library (dcmjs.fhir — the
// @dcmjs/fhir sink); this module is a thin consumer that reshapes the
// naturalized dataset into honeycomb's legacy nested
// { patient, study, series, instance } contract and the flat GridFS
// metadata POST /api/dicom/upload expects. dicom-parser remains the
// safety-net parser via the legacy extractors in DicomFhirMapping.js.
//
// Isomorphic: works on client, server, and under node --test (no Meteor
// imports; Meteor.Logger is feature-detected).

import dcmjs from 'dcmjs';
import dicomParser from 'dicom-parser';
import get from 'lodash/get.js';

import { extractAllDicomMetadata } from './DicomFhirMapping.js';

const log = (typeof Meteor !== 'undefined' && Meteor.Logger)
  ? Meteor.Logger.for('DcmjsMetadata')
  : console;

const { DicomMessage, DicomMetaDictionary } = dcmjs.data;
const fhir = dcmjs.fhir;
const eventStream = dcmjs.eventStream;

/**
 * Check for the DICOM Part 10 magic bytes ('DICM' at offset 128).
 * Useful for content-based classification of dropped files regardless
 * of their extension.
 * @param {ArrayBuffer} arrayBuffer
 * @returns {boolean}
 */
export function isDicomPart10(arrayBuffer) {
  if (!arrayBuffer || !(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength < 132) {
    return false;
  }
  const magic = new Uint8Array(arrayBuffer, 128, 4);
  return magic[0] === 0x44 && magic[1] === 0x49 && magic[2] === 0x43 && magic[3] === 0x4d; // 'DICM'
}

// Media Storage Directory Storage — the SOP Class of a DICOMDIR file
export const MEDIA_STORAGE_DIRECTORY_SOP_CLASS_UID = '1.2.840.10008.1.3.10';

/**
 * Classify a file header buffer for import-time filtering.
 * A DICOMDIR is recognized either by its canonical filename (with the DICM
 * magic still required — name alone is not trusted) or by the Media Storage
 * Directory SOP Class UID appearing in the file meta group, which survives
 * renames. (0002,0002) sits within the first ~200 bytes, so a 4 KB header
 * read is ample.
 * @param {ArrayBuffer} arrayBuffer - The first bytes of the file (>= 132)
 * @param {string} [fileName]
 * @returns {'dicom'|'dicomdir'|'not-dicom'}
 */
export function classifyDicomHeader(arrayBuffer, fileName) {
  if (!isDicomPart10(arrayBuffer)) {
    return 'not-dicom';
  }
  if (String(fileName || '').toUpperCase() === 'DICOMDIR') {
    return 'dicomdir';
  }
  // Scan the file meta bytes for the directory SOP Class UID string,
  // guarding against longer sibling UIDs (next char must not extend it).
  const metaBytes = new Uint8Array(arrayBuffer, 132);
  let metaText = '';
  for (let i = 0; i < metaBytes.length; i++) {
    metaText += String.fromCharCode(metaBytes[i]);
  }
  const idx = metaText.indexOf(MEDIA_STORAGE_DIRECTORY_SOP_CLASS_UID);
  if (idx !== -1) {
    const next = metaText.charAt(idx + MEDIA_STORAGE_DIRECTORY_SOP_CLASS_UID.length);
    if (!/[\d.]/.test(next)) {
      return 'dicomdir';
    }
  }
  return 'dicom';
}

/**
 * Sniff a File/Blob by reading only its first 4 KB.
 * @param {Blob} file - Browser File (or Blob with an optional .name)
 * @returns {Promise<'dicom'|'dicomdir'|'not-dicom'>}
 */
export async function sniffDicomFile(file) {
  try {
    const head = await file.slice(0, 4096).arrayBuffer();
    return classifyDicomHeader(head, file.name);
  } catch (err) {
    log.warn('[DcmjsMetadata] sniffDicomFile failed to read header', { name: get(file, 'name'), error: get(err, 'message') });
    return 'not-dicom';
  }
}

// Render a naturalized PN value (string or { Alphabetic }) as display text
function personNameLabel(value) {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return get(value, 'Alphabetic', '');
}

/**
 * Summarize a naturalized DICOMDIR dataset's DirectoryRecordSequence.
 * Pure and testable — record hierarchy offsets are ignored; the flat
 * sequence is enough for counts, labels, and referenced file paths.
 * @param {Object} dataset - Naturalized DICOMDIR main dataset
 * @returns {Object|null} - { patientCount, studyCount, seriesCount,
 *   imageCount, recordCount, patientLabels, studyLabels, referencedPaths }
 *   or null when no DirectoryRecordSequence is present
 */
export function summarizeDicomdirDataset(dataset) {
  let records = get(dataset, 'DirectoryRecordSequence');
  if (!records) {
    return null;
  }
  if (!Array.isArray(records)) {
    records = [records];
  }

  const summary = {
    patientCount: 0,
    studyCount: 0,
    seriesCount: 0,
    imageCount: 0,
    recordCount: records.length,
    patientLabels: [],
    studyLabels: [],
    referencedPaths: []
  };

  records.forEach(function(record) {
    const type = String(get(record, 'DirectoryRecordType', '')).toUpperCase();
    if (type === 'PATIENT') {
      summary.patientCount++;
      const label = personNameLabel(get(record, 'PatientName')) || get(record, 'PatientID', '');
      if (label) {
        summary.patientLabels.push(label);
      }
    } else if (type === 'STUDY') {
      summary.studyCount++;
      const label = get(record, 'StudyDescription', '');
      if (label) {
        summary.studyLabels.push(label);
      }
    } else if (type === 'SERIES') {
      summary.seriesCount++;
    } else if (type === 'IMAGE') {
      summary.imageCount++;
    }
    // ReferencedFileID lives on leaf records of any type (IMAGE, but also
    // e.g. SR DOCUMENT); collect wherever it appears
    const ref = get(record, 'ReferencedFileID');
    if (ref) {
      summary.referencedPaths.push(Array.isArray(ref) ? ref.join('/') : String(ref));
    }
  });

  return summary;
}

/**
 * Parse a DICOMDIR file's index. Returns the summary shape from
 * summarizeDicomdirDataset, or null when the buffer can't be parsed as a
 * directory (corrupt, or not actually a DICOMDIR).
 * @param {ArrayBuffer} arrayBuffer - Full DICOMDIR file contents
 * @returns {Object|null}
 */
export function parseDicomdirIndex(arrayBuffer) {
  try {
    const dicomDict = DicomMessage.readFile(arrayBuffer, { ignoreErrors: true });
    const dataset = DicomMetaDictionary.naturalizeDataset(dicomDict.dict);
    const summary = summarizeDicomdirDataset(dataset);
    if (!summary) {
      log.warn('[DcmjsMetadata] parseDicomdirIndex: no DirectoryRecordSequence in file');
    }
    return summary;
  } catch (err) {
    log.warn('[DcmjsMetadata] parseDicomdirIndex failed', { error: get(err, 'message') });
    return null;
  }
}

/**
 * Parse a DICOM Part 10 buffer with dcmjs.
 * @param {ArrayBuffer} arrayBuffer - File contents
 * @param {Object} [options] - Passed through to DicomMessage.readFile
 *   (e.g. { core: 'eager' } to bypass the lazy reader, { ignoreErrors: true })
 * @returns {{ dicomDict: Object, dataset: Object, meta: Object }}
 *   dataset is the naturalized main dataset; meta is the namified file meta
 */
export function parseDicomWithDcmjs(arrayBuffer, options = {}) {
  const dicomDict = DicomMessage.readFile(arrayBuffer, options);
  const dataset = DicomMetaDictionary.naturalizeDataset(dicomDict.dict);
  const meta = DicomMetaDictionary.namifyDataset(dicomDict.meta);
  return { dicomDict, dataset, meta };
}

/**
 * Reshape a naturalized dcmjs dataset into honeycomb's legacy nested
 * { patient, study, series, instance } contract, using the dcmjs.fhir
 * value mappers (person names, dates, sex codes, extensions).
 * @param {Object} dataset - Naturalized main dataset
 * @returns {Object} - { patient, study, series, instance }
 */
export function nestedMetadataFromNaturalized(dataset) {
  const dicomSex = fhir.asString(dataset.PatientSex);
  const extensions = [
    fhir.birthSexExtension(dicomSex),
    fhir.sexExtension(dicomSex)
  ].filter(Boolean);

  return {
    patient: {
      patientId: fhir.asString(dataset.PatientID),
      name: fhir.parsePersonName(dataset.PatientName),
      birthDate: fhir.dicomDateTimeToIso(dataset.PatientBirthDate),
      gender: fhir.sexToGender(dicomSex),
      dicomSex: dicomSex,
      extension: extensions.length > 0 ? extensions : undefined
    },
    study: {
      studyInstanceUid: fhir.asString(dataset.StudyInstanceUID),
      studyDate: fhir.asString(dataset.StudyDate),
      studyTime: fhir.asString(dataset.StudyTime),
      started: fhir.dicomDateTimeToIso(dataset.StudyDate, dataset.StudyTime),
      studyId: fhir.asString(dataset.StudyID),
      accessionNumber: fhir.asString(dataset.AccessionNumber),
      description: fhir.asString(dataset.StudyDescription),
      referringPhysician: fhir.parsePersonName(dataset.ReferringPhysicianName)
    },
    series: {
      seriesInstanceUid: fhir.asString(dataset.SeriesInstanceUID),
      seriesDate: fhir.asString(dataset.SeriesDate),
      seriesTime: fhir.asString(dataset.SeriesTime),
      started: fhir.dicomDateTimeToIso(dataset.SeriesDate, dataset.SeriesTime),
      modality: fhir.asString(dataset.Modality),
      description: fhir.asString(dataset.SeriesDescription),
      number: fhir.asNumber(dataset.SeriesNumber),
      bodyPartExamined: fhir.asString(dataset.BodyPartExamined),
      laterality: fhir.asString(dataset.Laterality)
    },
    instance: {
      sopClassUid: fhir.asString(dataset.SOPClassUID),
      sopInstanceUid: fhir.asString(dataset.SOPInstanceUID),
      number: fhir.asNumber(dataset.InstanceNumber),
      numberOfFrames: fhir.asNumber(dataset.NumberOfFrames),
      rows: fhir.asNumber(dataset.Rows),
      columns: fhir.asNumber(dataset.Columns)
    }
  };
}

/**
 * Flatten the nested { patient, study, series, instance } metadata into
 * the flat object POST /api/dicom/upload expects in its dicomMetadata
 * form field (DicomEndpoints.js writes these keys into dicom.files
 * metadata.*).
 * @param {Object|null} metadata - From extractAllDicomMetadata*
 * @returns {Object|null} - Flat GridFS metadata, or null
 */
export function flattenDicomMetadataForGridFS(metadata) {
  if (!metadata) return null;

  return {
    studyInstanceUid: get(metadata, 'study.studyInstanceUid'),
    seriesInstanceUid: get(metadata, 'series.seriesInstanceUid'),
    sopInstanceUid: get(metadata, 'instance.sopInstanceUid'),
    sopClassUid: get(metadata, 'instance.sopClassUid'),
    modality: get(metadata, 'series.modality'),
    studyDate: get(metadata, 'study.studyDate'),
    studyDescription: get(metadata, 'study.description'),
    seriesDescription: get(metadata, 'series.description'),
    seriesNumber: get(metadata, 'series.number'),
    instanceNumber: get(metadata, 'instance.number'),
    dicomPatientName: get(metadata, 'patient.name.text'),
    dicomPatientId: get(metadata, 'patient.patientId'),
    dicomPatientBirthDate: get(metadata, 'patient.birthDate'),
    dicomPatientSex: get(metadata, 'patient.dicomSex'),
    rows: get(metadata, 'instance.rows'),
    columns: get(metadata, 'instance.columns'),
    bitsAllocated: get(metadata, 'instance.bitsAllocated'),
    transferSyntaxUid: get(metadata, 'instance.transferSyntaxUid'),
    parser: get(metadata, 'parser'),
    // De-identification provenance (set by callers that ran the file
    // through DicomProcessing before upload).
    deidentified: get(metadata, 'deidentified'),
    deidMethod: get(metadata, 'deidMethod')
  };
}

/**
 * One-call replacement for the legacy
 *   dicomParser.parseDicom(bytes) + extractAllDicomMetadata(dataSet)
 * pair. Parses with dcmjs and reshapes via the dcmjs.fhir mappers;
 * falls back to dicom-parser + the legacy extractors if the dcmjs parse
 * fails (dcmjs is 1.0.0-beta — keep the safety net), and returns null
 * when both fail.
 *
 * On the dcmjs path the naturalized dataset rides along as a
 * NON-ENUMERABLE `dataset` property — consumers that need full-fidelity
 * FHIR (dcmjs.fhir.patientFromDataset / imagingStudyFromDatasets) read
 * it without it leaking into Object.keys/JSON of the metadata.
 * @param {ArrayBuffer} arrayBuffer - File contents
 * @param {Object} [options] - Passed to parseDicomWithDcmjs
 * @returns {Object|null} - { patient, study, series, instance } or null
 */
export function extractAllDicomMetadataFromArrayBuffer(arrayBuffer, options = {}) {
  try {
    const { dataset } = parseDicomWithDcmjs(arrayBuffer, options);
    const metadata = nestedMetadataFromNaturalized(dataset);
    // Provenance marker: rides through flattenDicomMetadataForGridFS into
    // dicom.files metadata.parser, so every stored file records which
    // parser produced its metadata.
    metadata.parser = 'dcmjs';
    Object.defineProperty(metadata, 'dataset', { value: dataset, enumerable: false });
    log.info('[DcmjsMetadata] extracted metadata via dcmjs', { studyInstanceUid: get(metadata, 'study.studyInstanceUid') });
    return metadata;
  } catch (dcmjsError) {
    log.warn('[DcmjsMetadata] dcmjs parse failed, falling back to dicom-parser', { error: String(dcmjsError && dcmjsError.message || dcmjsError) });
  }

  try {
    const dataSet = dicomParser.parseDicom(new Uint8Array(arrayBuffer));
    const metadata = extractAllDicomMetadata(dataSet);
    if (metadata) { metadata.parser = 'dicom-parser'; }
    log.info('[DcmjsMetadata] extracted metadata via dicom-parser fallback');
    return metadata;
  } catch (fallbackError) {
    // dicom-parser throws plain strings, not Error instances
    log.warn('[DcmjsMetadata] dicom-parser fallback also failed', { error: String(fallbackError && fallbackError.message || fallbackError) });
    return null;
  }
}

/**
 * Streaming variant of extractAllDicomMetadataFromArrayBuffer: parses via the
 * dcmjs EVENT STREAM (the SAX-style push core — DicomEventStream.fromPart10 →
 * NaturalizedListener) instead of the eager in-place reader. Proven at parity
 * with the eager path across our fixtures (and strictly more robust on
 * malformed files — it recovers metadata where eager throws), so it is the
 * preferred path where an async call site allows it.
 *
 * ASYNC: the event stream is generator-driven with backpressure, so this
 * returns a Promise (unlike the sync eager sibling). Falls back to the sync
 * eager dcmjs → dicom-parser chain on any stream failure, so the fallback net
 * is never weaker than before.
 *
 * Stamps metadata.parser = 'dcmjs-stream' so stored dicom.files records show
 * exactly which parser produced them.
 * @param {ArrayBuffer} arrayBuffer - File contents
 * @param {Object} [options] - Passed to DicomEventStream.fromPart10
 * @returns {Promise<Object|null>} - { patient, study, series, instance } or null
 */
export async function extractAllDicomMetadataFromArrayBufferStream(arrayBuffer, options = {}) {
  try {
    if (!eventStream || !eventStream.DicomEventStream) {
      throw new Error('dcmjs.eventStream unavailable in this bundle');
    }
    const dataset = await eventStream.DicomEventStream
      .fromPart10(arrayBuffer, options)
      .toNaturalized();
    const metadata = nestedMetadataFromNaturalized(dataset);
    metadata.parser = 'dcmjs-stream';
    Object.defineProperty(metadata, 'dataset', { value: dataset, enumerable: false });
    log.info('[DcmjsMetadata] extracted metadata via dcmjs event stream', { studyInstanceUid: get(metadata, 'study.studyInstanceUid') });
    return metadata;
  } catch (streamError) {
    log.warn('[DcmjsMetadata] event-stream parse failed, falling back to eager dcmjs / dicom-parser', { error: String(streamError && streamError.message || streamError) });
    // eager dcmjs → dicom-parser (synchronous), never weaker than before.
    return extractAllDicomMetadataFromArrayBuffer(arrayBuffer, options);
  }
}
