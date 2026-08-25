// tests/unit/imports/ui/DICOM/utils/DicomProcessing.test.mjs
// Run with: npm run test:dicom-processing
//
// Proves the DicomProcessing filter/anonymize/UID-remap pipeline (built on
// dcmjs.eventStream: fromPart10 -> filters -> Part10Writer) produces valid,
// correctly modified Part 10 output. Fixtures: the dcmjs submodule's own
// committed samples (sample-dicom.dcm MR study; sample-sr.dcm for
// sequence-drop coverage) — present wherever the submodule is checked out
// and built, which this suite requires anyway (it imports the built bundle).

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dcmjs from 'dcmjs';

import {
  normalizeTag,
  makeSetFilter,
  makeDropFilter,
  createBatchUidMapper,
  processDicomArrayBuffer,
  diffDicomTags
} from '../../../../../../imports/ui/DICOM/utils/DicomProcessing.js';
import {
  parseDicomWithDcmjs,
  isDicomPart10
} from '../../../../../../imports/ui/DICOM/utils/DcmjsMetadata.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.resolve(here, '../../../../../../libraries/dcmjs/test');

function loadArrayBuffer(name) {
  const buf = fs.readFileSync(path.join(fixtureDir, name));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function metaValue(meta, name) {
  const entry = meta && meta[name];
  if (entry && Array.isArray(entry.Value)) {
    return entry.Value[0];
  }
  return entry;
}

test('fixtures exist', function() {
  assert.ok(fs.existsSync(path.join(fixtureDir, 'sample-dicom.dcm')));
  assert.ok(fs.existsSync(path.join(fixtureDir, 'sample-sr.dcm')));
});

test('normalizeTag accepts the documented forms and rejects garbage', function() {
  assert.equal(normalizeTag('00100010'), '00100010');
  assert.equal(normalizeTag('0010,0010'), '00100010');
  assert.equal(normalizeTag('(0010,0010)'), '00100010');
  assert.equal(normalizeTag('0020000d'), '0020000D');
  assert.throws(function() { normalizeTag('123'); });
  assert.throws(function() { normalizeTag('not a tag'); });
  assert.throws(function() { normalizeTag(''); });
});

test('no options is a zero-copy passthrough', async function() {
  const input = loadArrayBuffer('sample-dicom.dcm');
  const result = await processDicomArrayBuffer(input, {});
  assert.equal(result.changed, false);
  assert.equal(result.outputBuffer, input);
});

test('set rule replaces an existing value; output is valid Part 10', async function() {
  const input = loadArrayBuffer('sample-dicom.dcm');
  const result = await processDicomArrayBuffer(input, {
    setRules: [{ tag: '0010,0010', value: 'TEST^NAME' }]
  });

  assert.equal(result.changed, true);
  assert.equal(result.deidMethod, 'dcmjs.filter');
  assert.ok(isDicomPart10(result.outputBuffer), 'output must carry the DICM magic');

  const { dataset } = parseDicomWithDcmjs(result.outputBuffer);
  assert.equal(String(dataset.PatientName), 'TEST^NAME');
});

test('set rule collapses multi-valued elements to the one replacement', async function() {
  const input = loadArrayBuffer('sample-dicom.dcm');
  const before = parseDicomWithDcmjs(input).dataset;
  if (!Array.isArray(before.ImageType) || before.ImageType.length < 2) {
    // Fixture has no multi-valued ImageType — exercise via a different tag
    // would be fiction; the single-value path is already covered above.
    return;
  }

  const result = await processDicomArrayBuffer(input, {
    setRules: [{ tag: '00080008', value: 'DERIVED' }]
  });
  const after = parseDicomWithDcmjs(result.outputBuffer).dataset;
  assert.equal(String(after.ImageType), 'DERIVED');
});

test('drop removes an element while other tags survive re-parse', async function() {
  const input = loadArrayBuffer('sample-dicom.dcm');
  const before = parseDicomWithDcmjs(input).dataset;
  assert.ok(before.PatientName, 'fixture should carry PatientName');

  const result = await processDicomArrayBuffer(input, { dropTags: ['00100010'] });
  const after = parseDicomWithDcmjs(result.outputBuffer).dataset;

  assert.equal(after.PatientName, undefined, 'dropped tag must be gone');
  assert.equal(String(after.StudyInstanceUID), String(before.StudyInstanceUID));
  assert.equal(String(after.SOPInstanceUID), String(before.SOPInstanceUID));
  assert.equal(String(after.Modality), String(before.Modality));
});

test('drop swallows a whole sequence (SR fixture)', async function() {
  const input = loadArrayBuffer('sample-sr.dcm');
  const { dicomDict } = parseDicomWithDcmjs(input);

  // Find a sequence tag actually present in the fixture.
  const sqTag = Object.keys(dicomDict.dict).find(function(tag) {
    return dicomDict.dict[tag] && dicomDict.dict[tag].vr === 'SQ';
  });
  assert.ok(sqTag, 'SR fixture should contain at least one sequence');

  const result = await processDicomArrayBuffer(input, { dropTags: [sqTag] });
  const afterDict = parseDicomWithDcmjs(result.outputBuffer).dicomDict.dict;
  assert.equal(afterDict[sqTag], undefined, 'sequence ' + sqTag + ' must be gone');
  assert.ok(isDicomPart10(result.outputBuffer));
});

test('anonymize applies default replacements and leaves UIDs untouched', async function() {
  const input = loadArrayBuffer('sample-dicom.dcm');
  const before = parseDicomWithDcmjs(input).dataset;

  const result = await processDicomArrayBuffer(input, { anonymize: true });
  assert.equal(result.deidMethod, 'dcmjs.cleanTags');

  const after = parseDicomWithDcmjs(result.outputBuffer).dataset;
  assert.equal(String(after.PatientName), 'ANON^PATIENT');
  assert.equal(String(after.PatientID), 'ANON^ID');
  assert.equal(String(after.StudyInstanceUID), String(before.StudyInstanceUID));
  assert.equal(String(after.SeriesInstanceUID), String(before.SeriesInstanceUID));
  assert.equal(String(after.SOPInstanceUID), String(before.SOPInstanceUID));
});

test('anonymize honors custom replacements', async function() {
  const input = loadArrayBuffer('sample-dicom.dcm');
  const result = await processDicomArrayBuffer(input, {
    anonymize: true,
    replacements: { patientName: 'STUDY^SUBJECT', patientId: 'SUBJ-001' }
  });
  const after = parseDicomWithDcmjs(result.outputBuffer).dataset;
  assert.equal(String(after.PatientName), 'STUDY^SUBJECT');
  assert.equal(String(after.PatientID), 'SUBJ-001');
});

test('batch UID mapper keeps UIDs consistent across files and meta', async function() {
  const input = loadArrayBuffer('sample-dicom.dcm');
  const before = parseDicomWithDcmjs(input).dataset;
  const uidMapper = createBatchUidMapper();

  const first = await processDicomArrayBuffer(input, { anonymize: true, uidMapper: uidMapper });
  const second = await processDicomArrayBuffer(input, { anonymize: true, uidMapper: uidMapper });
  assert.equal(first.deidMethod, 'dcmjs.cleanTags+uidremap');

  const a = parseDicomWithDcmjs(first.outputBuffer);
  const b = parseDicomWithDcmjs(second.outputBuffer);

  // Remapped, not original
  assert.notEqual(String(a.dataset.StudyInstanceUID), String(before.StudyInstanceUID));
  assert.notEqual(String(a.dataset.SOPInstanceUID), String(before.SOPInstanceUID));

  // Same original UIDs -> same replacements across the batch
  assert.equal(String(a.dataset.StudyInstanceUID), String(b.dataset.StudyInstanceUID));
  assert.equal(String(a.dataset.SeriesInstanceUID), String(b.dataset.SeriesInstanceUID));
  assert.equal(String(a.dataset.SOPInstanceUID), String(b.dataset.SOPInstanceUID));

  // File meta MediaStorageSOPInstanceUID rides the same mapping as the
  // dataset SOPInstanceUID (00020003 flows through the same filter chain)
  assert.equal(
    String(metaValue(a.meta, 'MediaStorageSOPInstanceUID')),
    String(a.dataset.SOPInstanceUID)
  );

  // Deterministic lookup surface for callers stamping provenance
  assert.equal(uidMapper.map(String(before.StudyInstanceUID)), String(a.dataset.StudyInstanceUID));
});

test('diffDicomTags reports replaced / emptied / dropped / remapped actions', async function() {
  const input = loadArrayBuffer('sample-dicom.dcm');
  const uidMapper = createBatchUidMapper();
  const result = await processDicomArrayBuffer(input, {
    anonymize: true,
    uidMapper: uidMapper,
    dropTags: ['00080060'] // Modality — present in the MR fixture
  });

  const diffs = diffDicomTags(input, result.outputBuffer);
  assert.ok(diffs.length > 0, 'anonymization must surface diffs');

  const byName = {};
  diffs.forEach(function(d) { byName[d.name] = d; });

  assert.equal(byName.PatientName.action, 'replaced');
  assert.equal(byName.PatientName.after, 'ANON^PATIENT');
  assert.equal(byName.Modality.action, 'dropped');
  assert.equal(byName.StudyInstanceUID.action, 'remapped');

  const emptied = diffs.filter(function(d) { return d.action === 'emptied'; });
  assert.ok(emptied.length > 0, 'cleanTags should empty at least one populated tag');

  diffs.forEach(function(d) {
    assert.ok(d.name, 'every diff row carries a name');
    assert.ok(['emptied', 'replaced', 'dropped', 'remapped'].indexOf(d.action) !== -1);
  });
});

test('unparseable input throws (never silently passes identified bytes)', async function() {
  const garbage = new TextEncoder().encode('definitely not dicom').buffer;
  await assert.rejects(function() {
    return processDicomArrayBuffer(garbage, { anonymize: true });
  });
});

test('filters and anonymize compose in one pass', async function() {
  const input = loadArrayBuffer('sample-dicom.dcm');
  const result = await processDicomArrayBuffer(input, {
    anonymize: true,
    setRules: [{ tag: '00080080', value: 'MyLab' }],
    dropTags: ['00081030']
  });
  const afterDict = parseDicomWithDcmjs(result.outputBuffer).dicomDict.dict;
  const after = parseDicomWithDcmjs(result.outputBuffer).dataset;

  assert.equal(String(after.PatientName), 'ANON^PATIENT');
  assert.equal(afterDict['00081030'], undefined, 'StudyDescription element dropped');
  // InstitutionName is only set when the element existed in the source —
  // dcmjs set-rules replace values, they do not inject new elements.
  const hadInstitution = !!parseDicomWithDcmjs(input).dicomDict.dict['00080080'];
  if (hadInstitution) {
    assert.equal(String(after.InstitutionName), 'MyLab');
  }
});
