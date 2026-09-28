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
import dcmjs from 'dcmjs';

import {
  parseDicomWithDcmjs,
  nestedMetadataFromNaturalized,
  extractAllDicomMetadataFromArrayBuffer,
  flattenDicomMetadataForGridFS,
  isDicomPart10,
  classifyDicomHeader,
  sniffDicomFile,
  summarizeDicomdirDataset,
  parseDicomdirIndex,
  MEDIA_STORAGE_DIRECTORY_SOP_CLASS_UID
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

// Synthetic Part 10 header whose file meta group carries the Media Storage
// Directory SOP Class UID — the shape a DICOMDIR's (0002,0002) has on disk.
function buildSyntheticDicomdirBuffer() {
  const preamble = new Uint8Array(128);
  const magic = new TextEncoder().encode('DICM');
  const uid = new TextEncoder().encode(MEDIA_STORAGE_DIRECTORY_SOP_CLASS_UID + '\0');
  // (0002,0002) MediaStorageSOPClassUID, explicit VR UI, little-endian length
  const tag = new Uint8Array([0x02, 0x00, 0x02, 0x00, 0x55, 0x49, uid.length, 0x00]);
  const out = new Uint8Array(preamble.length + magic.length + tag.length + uid.length);
  out.set(preamble, 0);
  out.set(magic, 128);
  out.set(tag, 132);
  out.set(uid, 140);
  return out.buffer;
}

test('classifyDicomHeader: image DICOM classifies as dicom', function() {
  assert.equal(classifyDicomHeader(loadFixtureArrayBuffer(), 'sample-dicom.dcm'), 'dicom');
  assert.equal(classifyDicomHeader(loadFixtureArrayBuffer(), 'IM000001'), 'dicom');
});

test('classifyDicomHeader: DICOMDIR by SOP Class UID in the file meta', function() {
  assert.equal(classifyDicomHeader(buildSyntheticDicomdirBuffer(), 'DICOMDIR'), 'dicomdir');
  // Renamed directory file — UID scan alone must still catch it
  assert.equal(classifyDicomHeader(buildSyntheticDicomdirBuffer(), 'copied-index.dcm'), 'dicomdir');
});

test('classifyDicomHeader: DICOMDIR by exact filename with DICM magic', function() {
  assert.equal(classifyDicomHeader(loadFixtureArrayBuffer(), 'DICOMDIR'), 'dicomdir');
  assert.equal(classifyDicomHeader(loadFixtureArrayBuffer(), 'dicomdir'), 'dicomdir');
});

test('classifyDicomHeader: UID scan does not match longer UID siblings', function() {
  const preamble = new Uint8Array(128);
  const magic = new TextEncoder().encode('DICM');
  const longer = new TextEncoder().encode(MEDIA_STORAGE_DIRECTORY_SOP_CLASS_UID + '.99');
  const out = new Uint8Array(160);
  out.set(preamble, 0);
  out.set(magic, 128);
  out.set(longer, 132);
  assert.equal(classifyDicomHeader(out.buffer, 'whatever'), 'dicom');
});

test('classifyDicomHeader: non-DICOM content classifies as not-dicom', function() {
  const junk = new TextEncoder().encode('AUTORUN viewer payload, definitely not dicom').buffer;
  assert.equal(classifyDicomHeader(junk, 'AUTORUN.INF'), 'not-dicom');
  assert.equal(classifyDicomHeader(new ArrayBuffer(10), 'tiny'), 'not-dicom');
  assert.equal(classifyDicomHeader(null, 'DICOMDIR'), 'not-dicom');
  // Name alone is not trusted without the DICM magic
  const named = new TextEncoder().encode('plain text pretending').buffer;
  assert.equal(classifyDicomHeader(named, 'DICOMDIR'), 'not-dicom');
});

test('sniffDicomFile reads only the header from a Blob and classifies it', async function() {
  const dicomBlob = new Blob([loadFixtureArrayBuffer()]);
  assert.equal(await sniffDicomFile(dicomBlob), 'dicom');

  const dirBlob = new Blob([buildSyntheticDicomdirBuffer()]);
  dirBlob.name = 'DICOMDIR';
  assert.equal(await sniffDicomFile(dirBlob), 'dicomdir');

  const junkBlob = new Blob([new TextEncoder().encode('not dicom')]);
  assert.equal(await sniffDicomFile(junkBlob), 'not-dicom');
});

const DICOMDIR_RECORDS = [
  { DirectoryRecordType: 'PATIENT', PatientName: 'Doe^Jane', PatientID: 'PAT001' },
  { DirectoryRecordType: 'STUDY', StudyDescription: 'CT NECK SOFT TISSUE W CONTRAST' },
  { DirectoryRecordType: 'SERIES', Modality: 'CT' },
  { DirectoryRecordType: 'IMAGE', ReferencedFileID: ['DICOM', 'IM000001'] },
  { DirectoryRecordType: 'IMAGE', ReferencedFileID: ['DICOM', 'IM000002'] },
  { DirectoryRecordType: 'IMAGE', ReferencedFileID: ['DICOM', 'IM000003'] }
];

test('summarizeDicomdirDataset counts records and collects labels/paths', function() {
  const summary = summarizeDicomdirDataset({ DirectoryRecordSequence: DICOMDIR_RECORDS });

  assert.equal(summary.patientCount, 1);
  assert.equal(summary.studyCount, 1);
  assert.equal(summary.seriesCount, 1);
  assert.equal(summary.imageCount, 3);
  assert.equal(summary.recordCount, 6);
  assert.deepEqual(summary.patientLabels, ['Doe^Jane']);
  assert.deepEqual(summary.studyLabels, ['CT NECK SOFT TISSUE W CONTRAST']);
  assert.deepEqual(summary.referencedPaths, ['DICOM/IM000001', 'DICOM/IM000002', 'DICOM/IM000003']);
});

test('summarizeDicomdirDataset returns null without a DirectoryRecordSequence', function() {
  assert.equal(summarizeDicomdirDataset({ Modality: 'MR' }), null);
  assert.equal(summarizeDicomdirDataset(null), null);
});

test('parseDicomdirIndex round-trips a dcmjs-written DICOMDIR', function() {
  const { DicomDict, DicomMetaDictionary } = dcmjs.data;

  const meta = DicomMetaDictionary.denaturalizeDataset({
    MediaStorageSOPClassUID: MEDIA_STORAGE_DIRECTORY_SOP_CLASS_UID,
    MediaStorageSOPInstanceUID: '1.2.826.0.1.3680043.99.1',
    TransferSyntaxUID: '1.2.840.10008.1.2.1',
    ImplementationClassUID: '1.2.826.0.1.3680043.99.2'
  });
  const dicomDict = new DicomDict(meta);
  dicomDict.dict = DicomMetaDictionary.denaturalizeDataset({
    FileSetID: 'HONEYCOMB_TEST',
    DirectoryRecordSequence: DICOMDIR_RECORDS
  });

  const buffer = dicomDict.write();
  assert.equal(isDicomPart10(buffer), true, 'written DICOMDIR should be Part 10');
  assert.equal(classifyDicomHeader(buffer, 'DICOMDIR'), 'dicomdir');
  assert.equal(classifyDicomHeader(buffer, 'renamed-file'), 'dicomdir', 'SOP Class UID scan catches renames');

  const summary = parseDicomdirIndex(buffer);
  assert.ok(summary, 'index should parse');
  assert.equal(summary.imageCount, 3);
  assert.equal(summary.studyCount, 1);
  assert.equal(summary.referencedPaths.length, 3);
});

test('parseDicomdirIndex returns null for non-directory input', function() {
  // A regular image study parses fine but has no DirectoryRecordSequence
  assert.equal(parseDicomdirIndex(loadFixtureArrayBuffer()), null);
  // Garbage doesn't parse at all
  assert.equal(parseDicomdirIndex(new TextEncoder().encode('junk').buffer), null);
});

test('garbage input falls back gracefully and returns null', function() {
  const garbage = new TextEncoder().encode('definitely not dicom content at all').buffer;
  const metadata = extractAllDicomMetadataFromArrayBuffer(garbage);
  assert.equal(metadata, null);
});
