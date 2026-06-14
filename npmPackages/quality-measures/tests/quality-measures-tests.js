// packages/quality-measures/tests/quality-measures-tests.js
//
// Tinytest unit tests for the pure measure-evaluation helpers.
// Run with: meteor test-packages ./packages/quality-measures

import { Tinytest } from 'meteor/tinytest';
import { checkSectionCompleteness, calculateAge } from '../server/evaluators/pacio-data-connector';
import { REQUIRED_TOC_SECTION_CODES } from '../lib/toc-sections';
import { isPacioMeasure, getPacioMeasure } from '../lib/pacio-measures';

Tinytest.add('quality-measures - checkSectionCompleteness - complete composition', function(test) {
  const composition = {
    section: REQUIRED_TOC_SECTION_CODES.map(function(code) {
      return {
        code: { coding: [{ code: code }] },
        entry: [{ reference: 'Observation/x' }]
      };
    })
  };

  const result = checkSectionCompleteness(composition, REQUIRED_TOC_SECTION_CODES);
  test.isTrue(result.complete, 'all sections present => complete');
  test.equal(result.presentSections.length, 15);
  test.equal(result.missingSections.length, 0);
  test.equal(result.completionRate, 1);
});

Tinytest.add('quality-measures - checkSectionCompleteness - missing and empty sections', function(test) {
  const composition = {
    section: [
      { code: { coding: [{ code: '42348-3' }] }, entry: [{ reference: 'DocumentReference/x' }] },
      // present but EMPTY section must not count
      { code: { coding: [{ code: '48765-2' }] }, entry: [] }
    ]
  };

  const result = checkSectionCompleteness(composition, REQUIRED_TOC_SECTION_CODES);
  test.isFalse(result.complete);
  test.equal(result.presentSections, ['42348-3']);
  test.isTrue(result.missingSections.indexOf('48765-2') !== -1, 'empty section counts as missing');
  test.equal(result.missingSections.length, 14);
});

Tinytest.add('quality-measures - calculateAge - boundary handling', function(test) {
  test.equal(calculateAge('1950-11-15', '2026-01-01'), 75);
  test.equal(calculateAge('2008-10-01', '2026-01-01'), 17, 'under 18 at period start');
  test.equal(calculateAge('2008-01-01', '2026-01-01'), 18, 'birthday on the boundary counts');
});

Tinytest.add('quality-measures - isPacioMeasure - membership not prefix', function(test) {
  test.isTrue(isPacioMeasure('PACIO-ICARE-v1'));
  test.isTrue(isPacioMeasure('CMS1317v1'), 'CMS1317v1 is evaluator-backed despite no PACIO- prefix');
  test.isFalse(isPacioMeasure('CMS2v13'));
  test.isFalse(isPacioMeasure('PACIO-ADI-ACP-v1'), 'old measure id retired');
});

Tinytest.add('quality-measures - CMS1317v1 definition carries authoritative code lists', function(test) {
  const measure = getPacioMeasure('CMS1317v1');
  test.isNotNull(measure);
  // From the official CMS1317-v1.0.000 spec package (specs/cms1317/qdm/)
  test.equal(measure._pacio.dnrOrderCodes, ['Z66']);
  test.equal(measure._pacio.dnrConditionCodes, ['Z66']);
  test.equal(measure._pacio.acpDiscussionAssessmentCodes, ['75773-2']);
  test.equal(measure._pacio.acpDiscussionValueSetOid, '2.16.840.1.113762.1.4.1170.45');
  test.equal(measure._pacio.valueSetOids.encounterInpatient, '2.16.840.1.113883.3.666.5.307');
  test.equal(measure._pacio.adiDocumentLoincCodes.length, 5);
  test.equal(measure._pacio.inpatientEncounterTypeCodes, ['183452005', '32485007', '8715000']);
  test.equal(measure._pacio.inpatientEncounterClassCodes, ['IMP', 'ACUTE']);
});
