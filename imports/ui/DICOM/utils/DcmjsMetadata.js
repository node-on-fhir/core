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
    parser: get(metadata, 'parser')
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
