// imports/ui/DICOM/utils/DcmjsMetadata.test.mjs
// Run with: npm run test:dicom
//
// Proves the dcmjs-based metadata extraction (libraries/dcmjs submodule,
// consumed as the "dcmjs" file: dependency) produces the same
// { patient, study, series, instance } shape as the legacy dicom-parser
// pipeline, using the radiology-workflow sample chest X-ray as fixture.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dicomParser from 'dicom-parser';

import {
  parseDicomWithDcmjs,
  createDataSetAdapter,
  extractAllDicomMetadataFromArrayBuffer,
  flattenDicomMetadataForGridFS,
  isDicomPart10
} from './DcmjsMetadata.js';
import { extractAllDicomMetadata } from './DicomFhirMapping.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(
  here,
  '../../../../npmPackages/radiology-workflow/data/XR_Chest_IM-0031-0001.dcm'
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
  assert.equal(dataset.Modality, 'CR');
  assert.equal(dataset.PatientID, 'LIDC-IDRI-0132');
  assert.match(String(dataset.StudyInstanceUID), /^[\d.]+$/);
  assert.ok(meta, 'namified file meta should be returned');
});

test('extractAllDicomMetadataFromArrayBuffer produces the legacy shape with correct values', function() {
  const metadata = extractAllDicomMetadataFromArrayBuffer(loadFixtureArrayBuffer());

  assert.ok(metadata, 'metadata should be extracted');
  assert.deepEqual(Object.keys(metadata).sort(), ['instance', 'patient', 'series', 'study']);

  // Values known from the fixture (LIDC-IDRI chest CR)
  assert.equal(metadata.patient.patientId, 'LIDC-IDRI-0132');
  assert.equal(metadata.patient.name.family, 'SIIM');
  assert.equal(metadata.patient.name.given, 'Ravi');
  assert.equal(
    metadata.study.studyInstanceUid,
    '1.3.6.1.4.1.14519.5.2.1.6279.6001.300027087262813745730072134723'
  );
  assert.equal(
    metadata.series.seriesInstanceUid,
    '1.3.6.1.4.1.14519.5.2.1.6279.6001.513114548408601984123939083099'
  );
  assert.equal(
    metadata.instance.sopInstanceUid,
    '1.3.6.1.4.1.14519.5.2.1.6279.6001.197993217821785409800235232773'
  );
  assert.equal(metadata.series.modality, 'CR');
  assert.equal(metadata.series.bodyPartExamined, 'CHEST');
  assert.equal(metadata.study.started, '2000-01-01');
  assert.equal(metadata.instance.rows, 2927);
  assert.equal(metadata.instance.columns, 2570);

  // IS-VR integers: dcmjs naturalizes to real numbers (the legacy
  // dataSet.uint16() misread these text-encoded tags as raw bytes)
  assert.equal(metadata.series.number, 3172);
  assert.equal(metadata.instance.number, 1);
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

test('createDataSetAdapter answers string() and uint16() like dicom-parser', function() {
  const { dataset, meta } = parseDicomWithDcmjs(loadFixtureArrayBuffer());
  const adapter = createDataSetAdapter(dataset, meta);

  assert.equal(adapter.string('x00080060'), 'CR');            // Modality
  assert.equal(adapter.string('x00100020'), 'LIDC-IDRI-0132'); // PatientID
  assert.equal(adapter.string('x00100010'), 'SIIM^Ravi');      // PatientName (PN coerced to raw)
  assert.equal(adapter.uint16('x00280010'), 2927);             // Rows
  assert.equal(adapter.string('x00020010'), '1.2.840.10008.1.2.1'); // TransferSyntaxUID (file meta)
  assert.equal(adapter.string('x7fe00010'), undefined);        // tag outside DICOM_TAGS
});

test('flattenDicomMetadataForGridFS produces the flat shape /api/dicom/upload persists', function() {
  const metadata = extractAllDicomMetadataFromArrayBuffer(loadFixtureArrayBuffer());
  const flat = flattenDicomMetadataForGridFS(metadata);

  assert.equal(flat.studyInstanceUid, metadata.study.studyInstanceUid);
  assert.equal(flat.seriesInstanceUid, metadata.series.seriesInstanceUid);
  assert.equal(flat.sopInstanceUid, metadata.instance.sopInstanceUid);
  assert.equal(flat.modality, 'CR');
  assert.equal(flat.dicomPatientName, 'SIIM Ravi');
  assert.equal(flat.dicomPatientId, 'LIDC-IDRI-0132');
  assert.equal(flat.rows, 2927);
  assert.equal(flat.columns, 2570);

  assert.equal(flattenDicomMetadataForGridFS(null), null);
});

test('garbage input falls back gracefully and returns null', function() {
  const garbage = new TextEncoder().encode('definitely not dicom content at all').buffer;
  const metadata = extractAllDicomMetadataFromArrayBuffer(garbage);
  assert.equal(metadata, null);
});
