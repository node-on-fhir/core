// imports/ui/DICOM/utils/DcmjsMetadata.js
// DICOM metadata extraction backed by the dcmjs rewrite (libraries/dcmjs
// submodule, consumed via the "dcmjs" file: dependency).
//
// dcmjs parses to a naturalized (keyword-keyed) dataset; the legacy
// extraction pipeline in DicomFhirMapping.js reads a dicom-parser dataSet
// via hex tags (dataSet.string('x0020000d')). createDataSetAdapter bridges
// the two so every extract*FromDicom() function runs unmodified against a
// dcmjs parse.
//
// Isomorphic: works on client, server, and under node --test (no Meteor
// imports; Meteor.Logger is feature-detected).

import dcmjs from 'dcmjs';
import dicomParser from 'dicom-parser';
import get from 'lodash/get.js';

import { DICOM_TAGS, extractAllDicomMetadata } from './DicomFhirMapping.js';

const log = (typeof Meteor !== 'undefined' && Meteor.Logger)
  ? Meteor.Logger.for('DcmjsMetadata')
  : console;

const { DicomMessage, DicomMetaDictionary } = dcmjs.data;

// Reverse lookup: 'x0020000d' -> 'StudyInstanceUID'
const HEX_TAG_TO_KEYWORD = Object.entries(DICOM_TAGS).reduce(function(acc, [keyword, hexTag]) {
  acc[hexTag] = keyword;
  return acc;
}, {});

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

// Coerce a naturalized dcmjs value to the raw string dicom-parser would
// return: PN objects/proxies back to 'Family^Given', multi-values joined
// with backslash, numbers stringified.
function coerceToDicomString(value) {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) {
    const parts = value.map(coerceToDicomString).filter(function(v) { return v !== undefined; });
    return parts.length > 0 ? parts.join('\\') : undefined;
  }
  if (typeof value === 'object') {
    // Person Name: naturalized as { Alphabetic: 'Family^Given' } (or a PN
    // proxy exposing the same property); denaturalized file-meta values
    // carry { Value: [...] }
    if (value.Alphabetic !== undefined) return String(value.Alphabetic);
    if (Array.isArray(value.Value)) return coerceToDicomString(value.Value);
    return undefined;
  }
  return String(value);
}

/**
 * Wrap a naturalized dcmjs dataset in a dicom-parser-compatible dataSet
 * interface (string()/uint16() keyed by lowercase hex tags), so the legacy
 * extraction functions in DicomFhirMapping.js work unmodified.
 * Only tags present in DICOM_TAGS are answerable — which is exactly the
 * surface the extractors use.
 * @param {Object} dataset - Naturalized main dataset
 * @param {Object} [meta] - Namified file meta (for TransferSyntaxUID etc.)
 * @returns {{ string: Function, uint16: Function }}
 */
export function createDataSetAdapter(dataset, meta) {
  function lookup(hexTag) {
    const keyword = HEX_TAG_TO_KEYWORD[hexTag];
    if (!keyword) return undefined;
    if (dataset && dataset[keyword] !== undefined) return dataset[keyword];
    if (meta && meta[keyword] !== undefined) return meta[keyword];
    return undefined;
  }

  return {
    string: function(hexTag) {
      return coerceToDicomString(lookup(hexTag));
    },
    uint16: function(hexTag) {
      const value = lookup(hexTag);
      if (value === undefined || value === null) return undefined;
      const num = Number(Array.isArray(value) ? value[0] : value);
      return Number.isFinite(num) ? num : undefined;
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
    transferSyntaxUid: get(metadata, 'instance.transferSyntaxUid')
  };
}

/**
 * One-call replacement for the legacy
 *   dicomParser.parseDicom(bytes) + extractAllDicomMetadata(dataSet)
 * pair. Parses with dcmjs and runs the existing extraction pipeline;
 * falls back to dicom-parser if the dcmjs parse fails (dcmjs is
 * 1.0.0-beta — keep the safety net), and returns null when both fail.
 * @param {ArrayBuffer} arrayBuffer - File contents
 * @param {Object} [options] - Passed to parseDicomWithDcmjs
 * @returns {Object|null} - { patient, study, series, instance } or null
 */
export function extractAllDicomMetadataFromArrayBuffer(arrayBuffer, options = {}) {
  try {
    const { dataset, meta } = parseDicomWithDcmjs(arrayBuffer, options);
    return extractAllDicomMetadata(createDataSetAdapter(dataset, meta));
  } catch (dcmjsError) {
    log.warn('[DcmjsMetadata] dcmjs parse failed, falling back to dicom-parser', { error: String(dcmjsError && dcmjsError.message || dcmjsError) });
  }

  try {
    const dataSet = dicomParser.parseDicom(new Uint8Array(arrayBuffer));
    const metadata = extractAllDicomMetadata(dataSet);
    log.info('[DcmjsMetadata] extracted metadata via dicom-parser fallback');
    return metadata;
  } catch (fallbackError) {
    // dicom-parser throws plain strings, not Error instances
    log.warn('[DcmjsMetadata] dicom-parser fallback also failed', { error: String(fallbackError && fallbackError.message || fallbackError) });
    return null;
  }
}
