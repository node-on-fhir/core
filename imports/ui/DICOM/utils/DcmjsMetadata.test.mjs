// imports/ui/DICOM/utils/DcmjsMetadata.test.mjs
// Run with: npm run test:dicom
//
// Proves the dcmjs-based metadata extraction (libraries/dcmjs submodule,
// consumed as the "dcmjs" file: dependency) produces the same
// { patient, study, series, instance } shape as the legacy dicom-parser
// pipeline. Fixture: the submodule's own committed sample-dicom.dcm (an MR
// study), which is guaranteed present wherever this suite can run — the
// suite already requires the submodule to be checked out and built.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dicomParser from 'dicom-parser';

import {
  parseDicomWithDcmjs,
  nestedMetadataFromNaturalized,
  extractAllDicomMetadataFromArrayBuffer,
  flattenDicomMetadataForGridFS,
  isDicomPart10
} from './DcmjsMetadata.js';
import { extractAllDicomMetadata } from './DicomFhirMapping.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(
  here,
  '../../../../libraries/dcmjs/test/sample-dicom.dcm'
);

function loadFixtureArrayBuffer() {
  const buf = fs.readFileSync(fixturePath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

test('fixture exists', function() {
  assert.ok(fs.existsSync(fixturePath), 'sample .dcm fixture should exist at ' + fixturePath);
});

test('isDicomPart10 detects the DICM magic', function() {
  assert.equal(isDicomPart10(loadFixtureArrayBuffer()), true);

  const json = new TextEncoder().encode(JSON.stringify({ resourceType: 'Patient' })).buffer;
  assert.equal(isDicomPart10(json), false);

  assert.equal(isDicomPart10(new ArrayBuffer(10)), false);
  assert.equal(isDicomPart10(null), false);
});

test('parseDicomWithDcmjs returns naturalized dataset and file meta', function() {
  const { dicomDict, dataset, meta } = parseDicomWithDcmjs(loadFixtureArrayBuffer());

  assert.ok(dicomDict, 'dicomDict should be returned');
  assert.equal(dataset.Modality, 'MR');
  assert.equal(dataset.PatientID, '11791306742903');
  assert.match(String(dataset.StudyInstanceUID), /^[\d.]+$/);
  assert.ok(meta, 'namified file meta should be returned');
});

test('extractAllDicomMetadataFromArrayBuffer produces the legacy shape with correct values', function() {
  const metadata = extractAllDicomMetadataFromArrayBuffer(loadFixtureArrayBuffer());

  assert.ok(metadata, 'metadata should be extracted');
  assert.deepEqual(Object.keys(metadata).sort(), ['instance', 'parser', 'patient', 'series', 'study']);
  assert.equal(metadata.parser, 'dcmjs', 'provenance marker records the dcmjs path');

  // Values known from the fixture (dcmjs sample MR study)
  assert.equal(metadata.patient.patientId, '11791306742903');
  assert.equal(metadata.patient.name.family, 'Fall 3');
  assert.equal(metadata.patient.name.given, '');
  assert.equal(metadata.patient.gender, 'other');
  assert.equal(
    metadata.study.studyInstanceUid,
    '1.2.276.0.50.192168001092.11156604.14547392.4'
  );
  assert.equal(
    metadata.series.seriesInstanceUid,
    '1.2.276.0.50.192168001092.11156604.14547392.303'
  );
  assert.equal(
    metadata.instance.sopInstanceUid,
    '1.2.276.0.50.192168001092.11156604.14547392.313'
  );
  assert.equal(metadata.series.modality, 'MR');
  assert.equal(metadata.study.description, 'MRT Oberbauch');
  assert.equal(metadata.study.accessionNumber, '11791306742801');
  assert.equal(metadata.study.started, '2001-01-01T10:22:31');
  assert.equal(metadata.instance.rows, 512);
  assert.equal(metadata.instance.columns, 512);

  // IS-VR integers: dcmjs naturalizes to real numbers (the legacy
  // dataSet.uint16() misread these text-encoded tags as raw bytes)
  assert.equal(metadata.series.number, 2101);
  assert.equal(metadata.instance.number, 10);
});

test('equivalence with the legacy dicom-parser pipeline on shared fields', function() {
  const arrayBuffer = loadFixtureArrayBuffer();

  const dcmjsMetadata = extractAllDicomMetadataFromArrayBuffer(arrayBuffer);

  const legacyDataSet = dicomParser.parseDicom(new Uint8Array(arrayBuffer));
  const legacyMetadata = extractAllDicomMetadata(legacyDataSet);

  // Full sub-object equivalence where every field is string-typed
  assert.deepEqual(dcmjsMetadata.patient, legacyMetadata.patient);
  assert.deepEqual(dcmjsMetadata.study, legacyMetadata.study);

  // Series/instance: compare everything except the IS-VR numeric fields,
  // where legacy uint16() reads text bytes as binary (a latent bug dcmjs fixes)
  const stripNumbers = function({ number, numberOfFrames, ...rest }) { return rest; };
  assert.deepEqual(stripNumbers(dcmjsMetadata.series), stripNumbers(legacyMetadata.series));

  const { number: n1, numberOfFrames: f1, ...dcmjsInstance } = dcmjsMetadata.instance;
  const { number: n2, numberOfFrames: f2, ...legacyInstance } = legacyMetadata.instance;
  assert.deepEqual(dcmjsInstance, legacyInstance);
});

test('nestedMetadataFromNaturalized reshapes via the dcmjs.fhir mappers', function() {
  const { dataset } = parseDicomWithDcmjs(loadFixtureArrayBuffer());
  const metadata = nestedMetadataFromNaturalized(dataset);

  assert.equal(metadata.series.modality, 'MR');
  assert.equal(metadata.patient.patientId, '11791306742903');
  assert.equal(metadata.patient.name.family, 'Fall 3');
  assert.equal(metadata.instance.rows, 512);
  assert.equal(metadata.series.number, 2101);
});

test('the naturalized dataset rides along non-enumerably for FHIR consumers', function() {
  const metadata = extractAllDicomMetadataFromArrayBuffer(loadFixtureArrayBuffer());

  assert.ok(metadata.dataset, 'hidden dataset property should be attached');
  assert.equal(metadata.dataset.Modality, 'MR');
  // Non-enumerable: never leaks into Object.keys / JSON / GridFS metadata
  assert.equal(Object.keys(metadata).includes('dataset'), false);
  assert.equal(JSON.stringify(metadata).includes('"dataset"'), false);
});

test('flattenDicomMetadataForGridFS produces the flat shape /api/dicom/upload persists', function() {
  const metadata = extractAllDicomMetadataFromArrayBuffer(loadFixtureArrayBuffer());
  const flat = flattenDicomMetadataForGridFS(metadata);

  assert.equal(flat.studyInstanceUid, metadata.study.studyInstanceUid);
  assert.equal(flat.seriesInstanceUid, metadata.series.seriesInstanceUid);
  assert.equal(flat.sopInstanceUid, metadata.instance.sopInstanceUid);
  assert.equal(flat.modality, 'MR');
  assert.equal(flat.dicomPatientName, 'Fall 3');
  assert.equal(flat.dicomPatientId, '11791306742903');
  assert.equal(flat.rows, 512);
  assert.equal(flat.columns, 512);
  assert.equal(flat.parser, 'dcmjs', 'GridFS metadata records parser provenance');

  assert.equal(flattenDicomMetadataForGridFS(null), null);
});

test('garbage input falls back gracefully and returns null', function() {
  const garbage = new TextEncoder().encode('definitely not dicom content at all').buffer;
  const metadata = extractAllDicomMetadataFromArrayBuffer(garbage);
  assert.equal(metadata, null);
});
