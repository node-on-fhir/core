// tests/unit/extensions/personal-area-network/phdObservationFactory.test.mjs
//
// node --test suite for the PHD resource factory (pure, Meteor-free).
// Run via: npm run test:pan-lib

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PROFILE_URLS, SOURCE_TAG_SYSTEM, PAN_SOURCE_CODE, UCUM_SYSTEM, ucumCodeFor,
  buildPhdDevice, buildPhgDevice, buildDeviceMetric,
  buildNumericObservation, buildCompoundNumericObservation
} from '../../../../extensions/personal-area-network/lib/phdObservationFactory.js';
import {
  MDC_SYSTEM, EUI64_SYSTEM, MDC_PHD_TYPE_CODE, MDC_PHG_TYPE_CODE,
  deviceSpecializationOf
} from '../../../../extensions/personal-area-network/lib/mdc.js';

test('buildPhdDevice: profile shape (fixed type, specialization, EUI-64, PAN tag)', function() {
  const device = buildPhdDevice({
    eui64: 'aabbccddeeff0011',
    specialization: '528391',
    manufacturer: 'Acme',
    model: 'BP-1',
    serial: 'SN42',
    patientId: 'patient-123'
  });

  assert.equal(device.resourceType, 'Device');
  assert.deepEqual(device.meta.profile, [PROFILE_URLS.PhdDevice]);
  // Fixed Device.type = 65573; the specialization lives in Device.specialization.
  assert.equal(device.type.coding[0].system, MDC_SYSTEM);
  assert.equal(device.type.coding[0].code, MDC_PHD_TYPE_CODE);
  assert.equal(deviceSpecializationOf(device), '528391');
  // EUI-64 identifier, normalized presentation.
  assert.equal(device.identifier[0].system, EUI64_SYSTEM);
  assert.equal(device.identifier[0].value, 'AA-BB-CC-DD-EE-FF-00-11');
  // Patient linkage + onboarding tag KnownDevicesCard reads.
  assert.equal(device.patient.reference, 'Patient/patient-123');
  assert.equal(device.meta.tag[0].system, SOURCE_TAG_SYSTEM);
  assert.equal(device.meta.tag[0].code, PAN_SOURCE_CODE);
  assert.equal(device.manufacturer, 'Acme');
  assert.equal(device.modelNumber, 'BP-1');
  assert.equal(device.serialNumber, 'SN42');
  // Display name derived from the specialization.
  assert.equal(device.deviceName[0].name, 'Blood pressure');
  // No ids — ingestion assigns them.
  assert.equal(device._id, undefined);
  assert.equal(device.id, undefined);
});

test('buildPhgDevice: gateway type code, no patient linkage', function() {
  const gateway = buildPhgDevice({ eui64: '1122334455667788', name: 'My phone' });
  assert.deepEqual(gateway.meta.profile, [PROFILE_URLS.PhgDevice]);
  assert.equal(gateway.type.coding[0].code, MDC_PHG_TYPE_CODE);
  assert.equal(gateway.patient, undefined);
  assert.equal(gateway.deviceName[0].name, 'My phone');
});

test('buildDeviceMetric: PhdDeviceMetric shape', function() {
  const metric = buildDeviceMetric({ deviceId: 'dev-1', mdcCode: '150017', unit: 'mmHg' });
  assert.equal(metric.resourceType, 'DeviceMetric');
  assert.deepEqual(metric.meta.profile, [PROFILE_URLS.PhdDeviceMetric]);
  assert.equal(metric.type.coding[0].system, MDC_SYSTEM);
  assert.equal(metric.type.coding[0].code, '150017');
  assert.equal(metric.source.reference, 'Device/dev-1');
  assert.equal(metric.category, 'measurement');
  assert.equal(metric.unit.coding[0].system, UCUM_SYSTEM);
  assert.equal(metric.unit.coding[0].code, 'mm[Hg]');
});

test('ucumCodeFor maps display units to UCUM', function() {
  assert.equal(ucumCodeFor('mmHg'), 'mm[Hg]');
  assert.equal(ucumCodeFor('Cel'), 'Cel');
  assert.equal(ucumCodeFor('kg'), 'kg');
  assert.equal(ucumCodeFor('%'), '%');
  assert.equal(ucumCodeFor('weird-unit'), 'weird-unit'); // pass-through
});

test('buildNumericObservation: MDC code, UCUM quantity, references, profile', function() {
  const observation = buildNumericObservation({
    patientId: 'patient-123',
    deviceId: 'device-456',
    mdcCode: '150364',
    value: 37.1,
    unit: 'Cel',
    effectiveDateTime: '2026-09-21T08:30:00Z'
  });

  assert.equal(observation.resourceType, 'Observation');
  assert.deepEqual(observation.meta.profile, [PROFILE_URLS.PhdNumericObservation]);
  assert.equal(observation.status, 'final');
  assert.equal(observation.code.coding[0].system, MDC_SYSTEM);
  assert.equal(observation.code.coding[0].code, '150364');
  assert.equal(observation.subject.reference, 'Patient/patient-123');
  assert.equal(observation.device.reference, 'Device/device-456');
  assert.equal(observation.effectiveDateTime, '2026-09-21T08:30:00Z');
  assert.deepEqual(observation.valueQuantity, {
    value: 37.1, unit: 'Cel', system: UCUM_SYSTEM, code: 'Cel'
  });
  assert.equal(observation.dataAbsentReason, undefined);
});

test('buildNumericObservation: Mder special → dataAbsentReason, no valueQuantity', function() {
  const observation = buildNumericObservation({
    patientId: 'p', deviceId: 'd', mdcCode: '150364',
    effectiveDateTime: '2026-09-21T08:30:00Z',
    special: 'nan'
  });
  assert.equal(observation.valueQuantity, undefined);
  assert.equal(observation.dataAbsentReason.coding[0].code, 'not-a-number');
});

test('buildCompoundNumericObservation: components carry MDC codes + quantities', function() {
  const observation = buildCompoundNumericObservation({
    patientId: 'patient-123',
    deviceId: 'device-456',
    mdcCode: '150016',
    effectiveDateTime: '2026-09-21T08:30:00Z',
    components: [
      { mdcCode: '150017', value: 122, unit: 'mmHg' },
      { mdcCode: '150018', value: 78, unit: 'mmHg' },
      { mdcCode: '150019', special: 'nres' }
    ]
  });

  assert.deepEqual(observation.meta.profile, [PROFILE_URLS.PhdCompoundNumericObservation]);
  assert.equal(observation.code.coding[0].code, '150016');
  assert.equal(observation.component.length, 3);
  assert.equal(observation.component[0].code.coding[0].code, '150017');
  assert.equal(observation.component[0].valueQuantity.value, 122);
  assert.equal(observation.component[0].valueQuantity.code, 'mm[Hg]');
  assert.equal(observation.component[1].valueQuantity.value, 78);
  // Mder special on a component → dataAbsentReason, no valueQuantity.
  assert.equal(observation.component[2].valueQuantity, undefined);
  assert.equal(observation.component[2].dataAbsentReason.coding[0].code, 'error');
  // Compound has no top-level value.
  assert.equal(observation.valueQuantity, undefined);
});

test('buildCompoundNumericObservation tolerates missing components', function() {
  const observation = buildCompoundNumericObservation({
    patientId: 'p', deviceId: 'd', mdcCode: '150016',
    effectiveDateTime: '2026-09-21T08:30:00Z'
  });
  assert.deepEqual(observation.component, []);
});
