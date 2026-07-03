import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import LoggerModule from './Logger.js';
import RedactModule from './loggerRedact.js';
const { Logger } = LoggerModule;
const { redactPhi } = RedactModule;
const require = createRequire(import.meta.url);

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

test('circular reference: log.info does not throw; record marks circular', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  const log = Logger.for('M');
  const a = {};
  a.self = a;
  assert.doesNotThrow(function() { log.info('circular', a); });
  const r = backend.records[0];
  assert.ok(r, 'record should exist');
  // data should either be { redactionFailed: true } from try/catch or have { circular: true } somewhere
  const dataStr = JSON.stringify(r.data);
  assert.ok(dataStr.includes('circular') || dataStr.includes('redactionFailed'), 'should mark circular or redactionFailed');
});

test('redactPhi preserves Error message and stack', function() {
  const err = new Error('boom');
  const result = redactPhi(err);
  assert.equal(result.message, 'boom');
  assert.ok(typeof result.stack === 'string', 'stack should be a string');
});

test('redactPhi converts Date to ISO string', function() {
  const d = new Date('2026-01-01T00:00:00.000Z');
  const result = redactPhi(d);
  assert.equal(result, '2026-01-01T00:00:00.000Z');
});

test('jsonBackend: writes one parseable JSON line; sentinel writes nothing', function() {
  const jsonBackend = require('./loggerBackends/jsonBackend.js');
  const lines = [];
  const origWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function(chunk) { lines.push(chunk); };
  try {
    jsonBackend.write({ ts: '2026-01-01T00:00:00.000Z', level: 'info', module: 'T', msg: 'hello', group: [], source: 'server', phi: false });
    jsonBackend.write({ ts: '2026-01-01T00:00:00.000Z', level: 'info', module: 'T', msg: '◂', group: [], source: 'server', phi: false });
  } finally {
    process.stdout.write = origWrite;
  }
  assert.equal(lines.length, 1, 'sentinel should not produce output');
  const parsed = JSON.parse(lines[0]);
  assert.equal(parsed.msg, 'hello');
  assert.equal(parsed.level, 'info');
});
