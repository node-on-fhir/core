// tests/unit/extensions/personal-area-network/mdc.test.mjs
//
// node --test suite for the PHD MDC nomenclature lib (pure, Meteor-free).
// Run via: npm run test:pan-lib  (npm-importing tier — needs node_modules)

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MDC_SYSTEM, EUI64_SYSTEM,
  partitionOf, termCodeOf,
  DEVICE_SPECIALIZATIONS, METRIC_CODES,
  mdcCoding, mdcConcept, isMdcCoded, mdcCodeOf,
  hasEui64Identifier, formatEui64,
  deviceSpecializationOf, MDC_PHD_TYPE_CODE, MDC_PHG_TYPE_CODE,
  MDER_SPECIALS, dataAbsentReasonFor, DATA_ABSENT_REASON_SYSTEM
} from '../../../../extensions/personal-area-network/lib/mdc.js';

test('partition math: device specializations live in partition 8', function() {
  assert.equal(partitionOf('528391'), 8);
  assert.equal(termCodeOf('528391'), 4103);
  assert.equal(partitionOf(528391), 8);
  assert.equal(partitionOf('not-a-number'), null);
  assert.equal(termCodeOf('garbage'), null);
});

test('partition math: SCADA metrics live in partition 2', function() {
  assert.equal(partitionOf('150364'), 2);   // MDC_TEMP_BODY
  assert.equal(partitionOf('150017'), 2);   // systolic
});

test('verified specialization codes match the IG value set', function() {
  assert.equal(DEVICE_SPECIALIZATIONS['528391'].refId, 'MDC_DEV_SPEC_PROFILE_BP');
  assert.equal(DEVICE_SPECIALIZATIONS['528402'].refId, 'MDC_DEV_SPEC_PROFILE_COAG');
  assert.equal(DEVICE_SPECIALIZATIONS['528405'].refId, 'MDC_DEV_SPEC_PROFILE_PEFM');
  assert.equal(DEVICE_SPECIALIZATIONS['528409'].refId, 'MDC_DEV_SPEC_PROFILE_CGM');
});

test('mdcCoding / mdcConcept round-trip', function() {
  const coding = mdcCoding('150364');
  assert.equal(coding.system, MDC_SYSTEM);
  assert.equal(coding.code, '150364');
  assert.equal(coding.display, 'Body Temperature');

  const concept = mdcConcept(150364);
  assert.equal(concept.coding[0].code, '150364');
  assert.equal(concept.text, 'Body Temperature');

  // Unknown codes still produce a valid coding, just without display.
  const unknown = mdcCoding('999999');
  assert.equal(unknown.code, '999999');
  assert.equal(unknown.display, undefined);
});

test('isMdcCoded / mdcCodeOf read code and type', function() {
  const observation = { code: { coding: [{ system: MDC_SYSTEM, code: '150364' }] } };
  assert.equal(isMdcCoded(observation), true);
  assert.equal(mdcCodeOf(observation), '150364');

  const loincOnly = { code: { coding: [{ system: 'http://loinc.org', code: '8310-5' }] } };
  assert.equal(isMdcCoded(loincOnly), false);
  assert.equal(mdcCodeOf(loincOnly), null);

  assert.equal(isMdcCoded({}), false);
  assert.equal(mdcCodeOf({}), null);
});

test('EUI-64 identifier detection and formatting', function() {
  const device = { identifier: [{ system: EUI64_SYSTEM, value: 'AA-BB-CC-DD-EE-FF-00-11' }] };
  assert.equal(hasEui64Identifier(device), true);
  assert.equal(hasEui64Identifier({ identifier: [{ system: 'other', value: 'x' }] }), false);
  assert.equal(hasEui64Identifier({}), false);

  assert.equal(formatEui64('aabbccddeeff0011'), 'AA-BB-CC-DD-EE-FF-00-11');
  assert.equal(formatEui64('AA:BB:CC:DD:EE:FF:00:11'), 'AA-BB-CC-DD-EE-FF-00-11');
  assert.equal(formatEui64('AA-BB-CC-DD-EE-FF-00-11'), 'AA-BB-CC-DD-EE-FF-00-11');
  assert.equal(formatEui64('too-short'), null);
  assert.equal(formatEui64(''), null);
  assert.equal(formatEui64(null), null);
});

test('deviceSpecializationOf prefers Device.specialization, skips fixed type codes', function() {
  const profiled = {
    type: { coding: [{ system: MDC_SYSTEM, code: MDC_PHD_TYPE_CODE }] },
    specialization: [{ systemType: { coding: [{ system: MDC_SYSTEM, code: '528391' }] } }]
  };
  assert.equal(deviceSpecializationOf(profiled), '528391');

  // Fallback: MDC code directly on type (pre-profile data) — but never the
  // fixed PHD/PHG object codes themselves.
  const loose = { type: { coding: [{ system: MDC_SYSTEM, code: '528392' }] } };
  assert.equal(deviceSpecializationOf(loose), '528392');

  const phgOnly = { type: { coding: [{ system: MDC_SYSTEM, code: MDC_PHG_TYPE_CODE }] } };
  assert.equal(deviceSpecializationOf(phgOnly), null);

  assert.equal(deviceSpecializationOf({}), null);
});

test('Mder specials map to dataAbsentReason', function() {
  assert.equal(MDER_SPECIALS.nan.float, 0x007FFFFF);
  assert.equal(MDER_SPECIALS.nan.sfloat, 0x07FF);

  const nan = dataAbsentReasonFor('nan');
  assert.equal(nan.coding[0].system, DATA_ABSENT_REASON_SYSTEM);
  assert.equal(nan.coding[0].code, 'not-a-number');
  assert.equal(dataAbsentReasonFor('pinf').coding[0].code, 'positive-infinity');
  assert.equal(dataAbsentReasonFor('ninf').coding[0].code, 'negative-infinity');
  assert.equal(dataAbsentReasonFor('nres').coding[0].code, 'error');
  assert.equal(dataAbsentReasonFor('nope'), null);
  assert.equal(dataAbsentReasonFor(undefined), null);
});
