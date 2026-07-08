// imports/ui/DICOM/utils/DcmjsMetadata.js
// DICOM metadata extraction for the main branch — backed by dicom-parser and
// the legacy extractors in DicomFhirMapping.js (no dcmjs dependency on main).
//
// This provides the extraction/flatten contract that radiology-workflow's
// TechDashboard upload flow expects. The dcmjs-backed implementation (which
// adds a dcmjs.fhir mapping path and keeps this dicom-parser route as its
// safety net) lives on the dcmjs-integration branch and supersedes this file
// when that branch merges — same filename, same exports, same nested
// { patient, study, series, instance } contract and flat GridFS shape.
//
// Isomorphic: works on client, server, and under node --test (no Meteor
// imports; Meteor.Logger is feature-detected).

import dicomParser from 'dicom-parser';
import get from 'lodash/get.js';

import { extractAllDicomMetadata } from './DicomFhirMapping.js';

const log = (typeof Meteor !== 'undefined' && Meteor.Logger)
  ? Meteor.Logger.for('DcmjsMetadata')
  : console;

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
 * Flatten the nested { patient, study, series, instance } metadata into
 * the flat object POST /api/dicom/upload expects in its dicomMetadata
 * form field (DicomEndpoints.js writes these keys into dicom.files
 * metadata.*).
 * @param {Object|null} metadata - From extractAllDicomMetadataFromArrayBuffer
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
    parser: get(metadata, 'parser')
  };
}

/**
 * One-call parse+extract: parses a DICOM Part 10 buffer with dicom-parser and
 * reshapes it into honeycomb's nested { patient, study, series, instance }
 * contract via the legacy DicomFhirMapping extractors. Returns null when the
 * buffer can't be parsed.
 * @param {ArrayBuffer} arrayBuffer - File contents
 * @returns {Object|null} - { patient, study, series, instance } or null
 */
export function extractAllDicomMetadataFromArrayBuffer(arrayBuffer) {
  try {
    const dataSet = dicomParser.parseDicom(new Uint8Array(arrayBuffer));
    const metadata = extractAllDicomMetadata(dataSet);
    // Provenance marker: rides through flattenDicomMetadataForGridFS into
    // dicom.files metadata.parser, so every stored file records which
    // parser produced its metadata.
    if (metadata) { metadata.parser = 'dicom-parser'; }
    log.info('[DcmjsMetadata] extracted metadata via dicom-parser', { studyInstanceUid: get(metadata, 'study.studyInstanceUid') });
    return metadata;
  } catch (parseError) {
    // dicom-parser throws plain strings, not Error instances
    log.warn('[DcmjsMetadata] dicom-parser parse failed', { error: String(parseError && parseError.message || parseError) });
    return null;
  }
}
