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

test('redactPhi covers account-shaped identifiers (email, phone)', function() {
  // email is one of HIPAA's 18 identifiers; account objects carry it under a
  // bare `email` key rather than the FHIR `telecom` shape
  const account = { username: 'janedoe', email: 'janedoe@test.org', phone: '555-1234', hasPassword: true };
  const redacted = redactPhi(account);
  assert.equal(redacted.username, 'janedoe');
  assert.equal(redacted.hasPassword, true);
  assert.deepEqual(redacted.email, { redacted: true });
  assert.deepEqual(redacted.phone, { redacted: true });
  assert.equal(JSON.stringify(redacted).includes('janedoe@test.org'), false);
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

// ── Console capture adapter tests ────────────────────────────────────────────

function makeFakeTarget() {
  const target = {};
  ['log', 'info', 'warn', 'error', 'debug', 'trace', 'dir', 'group', 'groupEnd', 'table'].forEach(function(m) {
    target[m] = function() {};
  });
  return target;
}

test('consoleCapture: level mapping routes each method to correct level', function() {
  const consoleCapture = require('./loggerBackends/consoleCapture.js');
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  const target = makeFakeTarget();
  consoleCapture.install(Logger, { target });
  try {
    target.log('a'); target.info('b'); target.warn('c'); target.error('d');
    target.debug('e'); target.trace('f'); target.dir('g');
    const recs = backend.records.filter(function(r) { return r.module === 'console' && r.msg !== '◂'; });
    const byMsg = {};
    recs.forEach(function(r) { byMsg[r.msg] = r; });
    assert.equal(byMsg['a'].level, 'info',  'log → info');
    assert.equal(byMsg['b'].level, 'info',  'info → info');
    assert.equal(byMsg['c'].level, 'warn',  'warn → warn');
    assert.equal(byMsg['d'].level, 'error', 'error → error');
    assert.equal(byMsg['e'].level, 'debug', 'debug → debug');
    assert.equal(byMsg['f'].level, 'trace', 'trace → trace');
    assert.equal(byMsg['g'].level, 'debug', 'dir → debug');
    recs.forEach(function(r) { assert.equal(r.module, 'console'); });
  } finally {
    consoleCapture.uninstall({ target });
  }
});

test('consoleCapture: args folding - format specifiers, single data, array data, non-string first', function() {
  const consoleCapture = require('./loggerBackends/consoleCapture.js');
  const util = require('util');
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  const target = makeFakeTarget();
  consoleCapture.install(Logger, { target });
  try {
    // Format specifier path: %s → msg = 'x y', no data
    target.log('x %s', 'y');
    const r1 = backend.records[backend.records.length - 1];
    assert.equal(r1.msg, 'x y');
    assert.equal(r1.data, undefined);

    // Multiple remaining args → data is array
    target.log('m', 1, 2);
    const r2 = backend.records[backend.records.length - 1];
    assert.equal(r2.msg, 'm');
    assert.deepEqual(r2.data, [1, 2]);

    // Single remaining arg → data is the arg as-is (after downstream redact)
    target.log('m', { a: 1 });
    const r3 = backend.records[backend.records.length - 1];
    assert.equal(r3.msg, 'm');
    assert.deepEqual(r3.data, { a: 1 });

    // Non-string first arg → msg = util.format of the arg
    target.log({ x: 1 });
    const r4 = backend.records[backend.records.length - 1];
    assert.equal(r4.msg, util.format({ x: 1 }));
    assert.equal(r4.data, undefined);
  } finally {
    consoleCapture.uninstall({ target });
  }
});

test('consoleCapture: redaction - Patient resource in data is collapsed, PHI not in record JSON', function() {
  const consoleCapture = require('./loggerBackends/consoleCapture.js');
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  const target = makeFakeTarget();
  consoleCapture.install(Logger, { target });
  try {
    target.log('patient', { resourceType: 'Patient', id: 'p1', name: [{ family: 'S' }] });
    const rec = backend.records[backend.records.length - 1];
    assert.deepEqual(rec.data, { redacted: true, resourceType: 'Patient', id: 'p1' });
    assert.equal(JSON.stringify(rec).includes('"S"'), false, 'PHI family name must not appear in record JSON');
  } finally {
    consoleCapture.uninstall({ target });
  }
});

test('consoleCapture: format-specifier redaction - %j of Patient does not leak PHI into msg', function() {
  const consoleCapture = require('./loggerBackends/consoleCapture.js');
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  const target = makeFakeTarget();
  consoleCapture.install(Logger, { target });
  try {
    target.log('p %j', { resourceType: 'Patient', id: 'p1', name: [{ family: 'S' }] });
    const rec = backend.records[backend.records.length - 1];
    assert.equal(rec.msg.includes('S'), false, 'PHI family name must not appear in formatted msg');
    assert.equal(rec.data, undefined, 'format-specifier path produces no data field');
  } finally {
    consoleCapture.uninstall({ target });
  }
});

test('consoleCapture: recursion guard - backend throw falls back to bound original, no infinite loop', function() {
  const consoleCapture = require('./loggerBackends/consoleCapture.js');
  const throwingBackend = { write: function() { throw new Error('backend boom'); } };
  Logger.init({ threshold: 'trace', backend: throwingBackend, isDevelopment: false, source: 'server' });
  const calls = [];
  const target = {};
  ['log', 'info', 'warn', 'error', 'debug', 'trace', 'dir', 'group', 'groupEnd', 'table'].forEach(function(m) {
    (function(method) { target[method] = function() { calls.push({ method: method, args: Array.prototype.slice.call(arguments) }); }; })(m);
  });
  consoleCapture.install(Logger, { target });
  try {
    assert.doesNotThrow(function() { target.log('boom'); });
    const fallback = calls.filter(function(c) { return c.method === 'log'; });
    assert.ok(fallback.length >= 1, 'bound original should have received the fallback call');
    assert.equal(fallback[0].args[0], 'boom');
  } finally {
    consoleCapture.uninstall({ target });
  }
});

test('consoleCapture: reentrancy guard - inner call from backend goes to bound original', function() {
  const consoleCapture = require('./loggerBackends/consoleCapture.js');
  const calls = [];
  const target = {};
  ['log', 'info', 'warn', 'error', 'debug', 'trace', 'dir', 'group', 'groupEnd', 'table'].forEach(function(m) {
    (function(method) { target[method] = function() { calls.push({ method: method, args: Array.prototype.slice.call(arguments) }); }; })(m);
  });
  // Backend that calls target.error('inner') during write -- triggers reentrancy path.
  const reentrantBackend = { write: function() { target.error('inner'); } };
  Logger.init({ threshold: 'trace', backend: reentrantBackend, isDevelopment: false, source: 'server' });
  consoleCapture.install(Logger, { target });
  try {
    target.error('outer');
    // 'inner' was emitted while inCapture was true, so it bounced to the bound original.
    const innerCalls = calls.filter(function(c) { return c.args[0] === 'inner'; });
    assert.equal(innerCalls.length, 1, 'inner call should bounce exactly once to bound original');
  } finally {
    consoleCapture.uninstall({ target });
  }
});

test('consoleCapture: groupEnd with no prior group leaves Logger groupPath unchanged', function() {
  const consoleCapture = require('./loggerBackends/consoleCapture.js');
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  const target = makeFakeTarget();
  consoleCapture.install(Logger, { target });
  try {
    // Spurious groupEnd calls with captureGroupDepth = 0 must be no-ops.
    target.groupEnd();
    target.groupEnd();
    // A real module logger should see an unchanged (empty) group path.
    Logger.for('M').info('check');
    const rec = backend.records.find(function(r) { return r.msg === 'check'; });
    assert.ok(rec, 'record should exist');
    assert.deepEqual(rec.group, [], 'Logger groupPath must be unaffected by spurious groupEnd');
  } finally {
    consoleCapture.uninstall({ target });
  }
});

test('consoleCapture: uninstall restores original function identities; double-install is a no-op', function() {
  const consoleCapture = require('./loggerBackends/consoleCapture.js');
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  const originalFns = {};
  const target = {};
  ['log', 'info', 'warn', 'error', 'debug', 'trace', 'dir', 'group', 'groupEnd', 'table'].forEach(function(m) {
    (function(method) {
      originalFns[method] = function() {};
      target[method] = originalFns[method];
    })(m);
  });

  // First install -- methods should be patched.
  consoleCapture.install(Logger, { target });
  assert.notEqual(target.log, originalFns.log, 'log should be patched after install');
  assert.ok(target.__original, '__original escape hatch should exist after install');

  // Second install on the same target -- no-op.
  consoleCapture.install(Logger, { target });
  assert.notEqual(target.log, originalFns.log, 'log should still be patched after double-install');

  // Single uninstall -- must restore all original function references.
  consoleCapture.uninstall({ target });
  assert.equal(target.log,      originalFns.log,      'log should be restored');
  assert.equal(target.error,    originalFns.error,    'error should be restored');
  assert.equal(target.group,    originalFns.group,    'group should be restored');
  assert.equal(target.groupEnd, originalFns.groupEnd, 'groupEnd should be restored');
  assert.equal(target.__original, undefined, '__original should be removed after uninstall');
});

test('jsonBackend: BigInt record writes to stderr, not stdout; normal and sentinel behave correctly', function() {
  const jsonBackend = require('./loggerBackends/jsonBackend.js');
  const stdoutLines = [];
  const stderrLines = [];
  const origStdout = process.stdout.write.bind(process.stdout);
  const origStderr = process.stderr.write.bind(process.stderr);
  process.stdout.write = function(chunk) { stdoutLines.push(chunk); };
  process.stderr.write = function(chunk) { stderrLines.push(chunk); };
  try {
    // Record with BigInt causes JSON.stringify to throw -- nothing on stdout, one line on stderr.
    jsonBackend.write({ ts: '2026-01-01T00:00:00.000Z', level: 'error', module: 'T', msg: 'bigint', group: [], source: 'server', phi: false, data: { value: BigInt(1) } });
    assert.equal(stdoutLines.length, 0, 'BigInt record should produce nothing on stdout');
    assert.equal(stderrLines.length, 1, 'BigInt record should produce exactly one line on stderr');
    assert.ok(stderrLines[0].includes('[jsonBackend]'), 'stderr line should identify the source');

    // Normal record -- exactly one parseable JSON line on stdout.
    jsonBackend.write({ ts: '2026-01-01T00:00:00.000Z', level: 'info', module: 'T', msg: 'normal-ext', group: [], source: 'server', phi: false });
    assert.equal(stdoutLines.length, 1, 'normal record should produce one line on stdout');
    const parsed = JSON.parse(stdoutLines[0]);
    assert.equal(parsed.msg, 'normal-ext');

    // Sentinel -- should not produce additional output.
    jsonBackend.write({ ts: '2026-01-01T00:00:00.000Z', level: 'info', module: 'T', msg: '◂', group: [], source: 'server', phi: false });
    assert.equal(stdoutLines.length, 1, 'sentinel should not produce additional stdout output');
  } finally {
    process.stdout.write = origStdout;
    process.stderr.write = origStderr;
  }
});

// ── consoleCapture: time / timeEnd / timeLog / count / countReset / assert ───

function makeFullTarget() {
  const target = {};
  ['log', 'info', 'warn', 'error', 'debug', 'trace', 'dir', 'group', 'groupEnd', 'table',
   'time', 'timeEnd', 'timeLog', 'count', 'countReset', 'assert'].forEach(function(m) {
    target[m] = function() {};
  });
  return target;
}

test('consoleCapture: time/timeEnd produces one debug record with numeric ms >= 0; timeEnd without time does not throw', function() {
  const consoleCapture = require('./loggerBackends/consoleCapture.js');
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  const target = makeFullTarget();
  consoleCapture.install(Logger, { target });
  try {
    target.time('op');
    target.timeEnd('op');
    const recs = backend.records.filter(function(r) { return r.module === 'console' && r.msg !== '◂'; });
    assert.equal(recs.length, 1, 'should emit exactly one record');
    assert.equal(recs[0].level, 'debug');
    assert.ok(recs[0].msg.includes('op'), 'msg should include label');
    assert.ok(typeof recs[0].data.ms === 'number' && recs[0].data.ms >= 0, 'ms should be a non-negative number');

    // timeEnd without matching time must not throw and still emits a debug record.
    assert.doesNotThrow(function() { target.timeEnd('never-started'); });
    const recs2 = backend.records.filter(function(r) { return r.module === 'console' && r.msg !== '◂'; });
    assert.equal(recs2.length, 2, 'no-start timeEnd should still emit a debug record');
    assert.ok(recs2[1].msg.includes('no start'), 'no-start record should note missing start');
  } finally {
    consoleCapture.uninstall({ target });
  }
});

test('consoleCapture: count increments across calls; countReset resets to zero', function() {
  const consoleCapture = require('./loggerBackends/consoleCapture.js');
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  const target = makeFullTarget();
  consoleCapture.install(Logger, { target });
  try {
    target.count('hits');
    target.count('hits');
    const recs = backend.records.filter(function(r) { return r.module === 'console' && r.msg !== '◂'; });
    assert.equal(recs.length, 2, 'two count calls should emit two records');
    assert.equal(recs[0].data.count, 1, 'first count should be 1');
    assert.equal(recs[1].data.count, 2, 'second count should be 2');

    // countReset: resets counter; emits nothing.
    const before = backend.records.length;
    target.countReset('hits');
    assert.equal(backend.records.length, before, 'countReset should emit no record');

    // After reset the next count starts at 1 again.
    target.count('hits');
    const recs2 = backend.records.filter(function(r) { return r.module === 'console' && r.msg !== '◂'; });
    assert.equal(recs2[recs2.length - 1].data.count, 1, 'count after reset should be 1');
  } finally {
    consoleCapture.uninstall({ target });
  }
});

test('consoleCapture: assert(false) emits one error record; assert(true) emits nothing', function() {
  const consoleCapture = require('./loggerBackends/consoleCapture.js');
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  const target = makeFullTarget();
  consoleCapture.install(Logger, { target });
  try {
    target.assert(false, 'something went wrong');
    const recs = backend.records.filter(function(r) { return r.module === 'console' && r.msg !== '◂'; });
    assert.equal(recs.length, 1, 'false assertion should emit one record');
    assert.equal(recs[0].level, 'error', 'assertion failure should be error level');
    assert.ok(recs[0].msg.includes('Assertion failed'), 'msg should contain "Assertion failed"');
    assert.ok(recs[0].msg.includes('something went wrong'), 'msg should include the provided message');

    // assert(true) emits nothing.
    const before = backend.records.length;
    target.assert(true, 'this is fine');
    assert.equal(backend.records.length, before, 'truthy assertion should emit no record');
  } finally {
    consoleCapture.uninstall({ target });
  }
});
