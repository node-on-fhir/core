import test from 'node:test';
import assert from 'node:assert/strict';
import LoggerModule from './Logger.js';
import RedactModule from './loggerRedact.js';
const { Logger } = LoggerModule;
const { redactPhi } = RedactModule;

function fakeBackend() { const records = []; return { records, write: function(r){ records.push(r); } }; }

test('threshold filters below-level records', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'warn', backend, isDevelopment: false, source: 'server' });
  const log = Logger.for('TestModule');
  log.debug('hidden'); log.warn('shown');
  assert.equal(backend.records.length, 1);
  assert.equal(backend.records[0].level, 'warn');
  assert.equal(backend.records[0].module, 'TestModule');
});

test('log aliases info; record shape is complete', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'client' });
  const log = Logger.for('M');
  log.log('hello', { a: 1 });
  const r = backend.records[0];
  assert.equal(r.level, 'info');
  assert.equal(r.msg, 'hello');
  assert.deepEqual(r.data, { a: 1 });
  assert.equal(r.source, 'client');
  assert.equal(r.phi, false);
  assert.ok(r.ts.includes('T'));
});

test('group/groupEnd builds group path', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  const log = Logger.for('M');
  log.group('outer'); log.group('inner'); log.info('x'); log.groupEnd(); log.info('y'); log.groupEnd();
  const records = backend.records.filter(r => r.msg !== '◂');
  assert.deepEqual(records.find(r => r.msg === 'x').group, ['outer', 'inner']);
  assert.deepEqual(records.find(r => r.msg === 'y').group, ['outer']);
});

test('redactPhi collapses patient-compartment resources and PHI fields', function() {
  const patient = { resourceType: 'Patient', id: 'p1', name: [{ family: 'Smith' }], birthDate: '1990-01-01' };
  assert.deepEqual(redactPhi(patient), { redacted: true, resourceType: 'Patient', id: 'p1' });
  const mixed = { count: 2, name: [{ family: 'Smith' }], status: 'final' };
  const redacted = redactPhi(mixed);
  assert.equal(redacted.count, 2);
  assert.equal(redacted.status, 'final');
  assert.deepEqual(redacted.name, { redacted: true });
});

test('phi() emits redacted operational record and calls phiSink', function() {
  const backend = fakeBackend();
  const sunk = [];
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server',
    phiSink: function(evt){ sunk.push(evt); } });
  const log = Logger.for('Chart');
  log.phi('viewed patient', { resourceType: 'Patient', id: 'p1', name: [{ family: 'S' }] }, { action: 'read' });
  const r = backend.records[0];
  assert.equal(r.phi, true);
  assert.deepEqual(r.data, { redacted: true, resourceType: 'Patient', id: 'p1' });
  assert.equal(JSON.stringify(r).includes('"S"'), false);
  assert.equal(sunk[0].resourceType, 'Patient');
  assert.equal(sunk[0].context.action, 'read');
});

test('phi() with no phiSink does not throw (warns once)', function() {
  Logger.init({ threshold: 'trace', backend: fakeBackend(), isDevelopment: false, source: 'server' });
  Logger.for('M').phi('x', { resourceType: 'Patient', id: 'p1' });
});
