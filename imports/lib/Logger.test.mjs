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

// ── PHI debugging flag tests ──────────────────────────────────────────────────

test('setPhiDebugging OFF: record has no raw field even for PHI-bearing data', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  Logger.setPhiDebugging(false);
  const log = Logger.for('PhiDbgTest');
  log.info('patient', { name: [{ family: 'Smith' }], status: 'final' });
  const r = backend.records[0];
  assert.equal('raw' in r, false, 'record must not have raw field when phiDebugging is off');
});

test('setPhiDebugging ON: record.data is redacted, record.raw carries original PHI', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  Logger.setPhiDebugging(true);
  try {
    const log = Logger.for('PhiDbgTest');
    log.info('patient', { name: [{ family: 'Smith' }], status: 'final' });
    const r = backend.records[0];
    assert.deepEqual(r.data.name, { redacted: true }, 'data.name must be redacted');
    assert.equal(r.data.status, 'final', 'non-PHI field must be preserved in data');
    assert.equal(r.raw.name[0].family, 'Smith', 'raw must carry original family name');
    assert.equal(JSON.stringify(r.data).includes('Smith'), false, 'PHI must not appear in data');
  } finally {
    Logger.setPhiDebugging(false);
  }
});

test('phi() with setPhiDebugging ON: stub in data, full resource in raw', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server', phiSink: function() {} });
  Logger.setPhiDebugging(true);
  try {
    const log = Logger.for('PhiDbgTest');
    const patient = { resourceType: 'Patient', id: 'p1', name: [{ family: 'Smith' }] };
    log.phi('viewed patient', patient, { action: 'read' });
    const r = backend.records[0];
    assert.deepEqual(r.data, { redacted: true, resourceType: 'Patient', id: 'p1' }, 'data must be stub');
    assert.equal(r.raw.name[0].family, 'Smith', 'raw must carry original resource');
    assert.equal(JSON.stringify(r.data).includes('Smith'), false, 'PHI must not appear in data');
  } finally {
    Logger.setPhiDebugging(false);
  }
});

test('setPhiDebugging ON: structuredClone failure (function in data) → no raw field, no throw', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  Logger.setPhiDebugging(true);
  try {
    const log = Logger.for('PhiDbgTest');
    // Functions cannot be structuredClone'd; clone throws DataCloneError, raw is skipped silently.
    const dataWithFn = { status: 'final', fn: function() {} };
    assert.doesNotThrow(function() { log.info('with fn', dataWithFn); });
    const r = backend.records[0];
    assert.equal('raw' in r, false, 'no raw field when structuredClone fails');
  } finally {
    Logger.setPhiDebugging(false);
  }
});

test('setPhiDebugging(false) stops raw attachment on subsequent records', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'server' });
  const log = Logger.for('PhiDbgTest');
  Logger.setPhiDebugging(true);
  log.info('on', { name: [{ family: 'Smith' }] });
  Logger.setPhiDebugging(false);
  log.info('off', { name: [{ family: 'Jones' }] });
  assert.ok('raw' in backend.records[0], 'first record (flag on) must have raw');
  assert.equal('raw' in backend.records[1], false, 'second record (flag off) must not have raw');
});

// ── mongoBackend tests ────────────────────────────────────────────────────────

const { createMongoBackend, makeFanout } = require('./loggerBackends/mongoBackend.js');

function makeRecord(overrides) {
  return Object.assign({ ts: '2026-01-01T00:00:00.000Z', level: 'info', module: 'T', msg: 'hello', group: [], source: 'server', phi: false }, overrides || {});
}

test('mongoBackend: threshold filter drops below-level records', function() {
  const backend = createMongoBackend({ threshold: 'warn' });
  const captured = [];
  backend.connect(function(docs) { captured.push(...docs); return Promise.resolve(); });
  backend.write(makeRecord({ level: 'debug' }));  // below warn — dropped
  backend.write(makeRecord({ level: 'warn' }));   // at threshold — kept
  backend.flush();
  assert.equal(captured.length, 1, 'only warn-level record should reach insertMany');
  assert.equal(captured[0].level, 'warn');
  backend.stop();
});

test('mongoBackend: ts is converted to a Date instance (not a string)', function() {
  const backend = createMongoBackend();
  const captured = [];
  backend.connect(function(docs) { captured.push(...docs); return Promise.resolve(); });
  backend.write(makeRecord({ ts: '2026-06-01T12:00:00.000Z' }));
  backend.flush();
  assert.ok(captured[0].ts instanceof Date, 'ts should be a Date instance for BSON TTL index');
  assert.equal(captured[0].ts.toISOString(), '2026-06-01T12:00:00.000Z', 'Date value should match original ISO string');
  backend.stop();
});

test('mongoBackend: sentinel msg is skipped (no record buffered)', function() {
  const backend = createMongoBackend();
  const captured = [];
  backend.connect(function(docs) { captured.push(...docs); return Promise.resolve(); });
  backend.write(makeRecord({ msg: '◂' }));
  backend.flush();
  assert.equal(captured.length, 0, 'sentinel record should not reach insertMany');
  backend.stop();
});

test('mongoBackend: buffer-then-connect flushes boot records in order', function() {
  const backend = createMongoBackend();
  // Write 3 records before connect (simulates boot-time log records).
  backend.write(makeRecord({ msg: 'first' }));
  backend.write(makeRecord({ msg: 'second' }));
  backend.write(makeRecord({ msg: 'third' }));
  const captured = [];
  backend.connect(function(docs) { captured.push(...docs); return Promise.resolve(); });
  assert.equal(captured.length, 3, 'all 3 boot records should be flushed on connect');
  assert.equal(captured[0].msg, 'first',  'order preserved: first');
  assert.equal(captured[1].msg, 'second', 'order preserved: second');
  assert.equal(captured[2].msg, 'third',  'order preserved: third');
  backend.stop();
});

test('mongoBackend: maxBatch triggers immediate flush without waiting for timer', function() {
  const backend = createMongoBackend({ maxBatch: 3, flushIntervalMs: 60000 });
  const captured = [];
  backend.connect(function(docs) { captured.push(...docs); return Promise.resolve(); });
  backend.write(makeRecord({ msg: 'a' }));  // 1 — timer set, no flush yet
  backend.write(makeRecord({ msg: 'b' }));  // 2 — timer already set
  assert.equal(captured.length, 0, 'no flush before batch limit');
  backend.write(makeRecord({ msg: 'c' }));  // 3 == maxBatch → immediate flush
  assert.equal(captured.length, 3, 'flush should fire synchronously when batch limit reached');
  backend.stop();
});

test('mongoBackend: buffer cap drops oldest records; dropped counter increments', function() {
  const backend = createMongoBackend({ maxBuffer: 3 });
  // Write 5 records before connect — only last 3 survive.
  backend.write(makeRecord({ msg: 'drop-1' }));
  backend.write(makeRecord({ msg: 'drop-2' }));
  backend.write(makeRecord({ msg: 'keep-1' }));
  backend.write(makeRecord({ msg: 'keep-2' }));
  backend.write(makeRecord({ msg: 'keep-3' }));
  const s = backend.stats();
  assert.equal(s.buffered, 3, 'only maxBuffer records should remain');
  assert.equal(s.dropped,  2, 'two oldest should be counted as dropped');
  const captured = [];
  backend.connect(function(docs) { captured.push(...docs); return Promise.resolve(); });
  assert.equal(captured.length, 3, 'only the 3 surviving records flushed');
  assert.equal(captured[0].msg, 'keep-1', 'oldest survivor is keep-1');
  backend.stop();
});

test('mongoBackend: insertMany rejection writes exactly one stderr line; does not throw', async function() {
  const backend = createMongoBackend({ maxBatch: 1 });  // flush immediately on first write when connected
  const stderrLines = [];
  const origStderr = process.stderr.write.bind(process.stderr);
  process.stderr.write = function(chunk) { stderrLines.push(chunk); };
  try {
    backend.connect(function() { return Promise.reject(new Error('DB down')); });
    backend.write(makeRecord({ msg: 'fail-me' }));  // maxBatch=1 → immediate flush → rejection
    // Wait for the microtask queue (Promise.catch handler) to drain.
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(stderrLines.length, 1, 'exactly one stderr line on rejection');
    assert.ok(stderrLines[0].includes('[mongoBackend] insert failed:'), 'stderr line identifies the source');
    assert.ok(stderrLines[0].includes('DB down'), 'stderr line includes the error message');
  } finally {
    process.stderr.write = origStderr;
    backend.stop();
  }
});

test('mongoBackend: setThreshold valid level changes threshold; stats reflects it', function() {
  const backend = createMongoBackend({ threshold: 'info' });
  backend.setThreshold('debug');
  assert.equal(backend.stats().threshold, 'debug', 'threshold should update to debug');
});

test('mongoBackend: setThreshold invalid level writes stderr note and does not change threshold', function() {
  const backend = createMongoBackend({ threshold: 'info' });
  const stderrLines = [];
  const origStderr = process.stderr.write.bind(process.stderr);
  process.stderr.write = function(chunk) { stderrLines.push(chunk); };
  try {
    backend.setThreshold('bogus');
    assert.equal(backend.stats().threshold, 'info', 'threshold should be unchanged for invalid level');
    assert.ok(stderrLines.length >= 1, 'invalid level should produce a stderr note');
  } finally {
    process.stderr.write = origStderr;
  }
});

// ── Logger.setThreshold / getThreshold facade tests ──────────────────────────

test('Logger.setThreshold raises global gate; getThreshold reflects it', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'info', backend, isDevelopment: false, source: 'server' });
  assert.equal(Logger.getThreshold(), 'info', 'initial threshold should be info');
  const log = Logger.for('GateTest');
  log.debug('hidden');  // below info threshold
  assert.equal(backend.records.length, 0, 'debug record should be dropped at info threshold');
  Logger.setThreshold('debug');
  assert.equal(Logger.getThreshold(), 'debug', 'getThreshold should return debug after setThreshold');
  log.debug('shown');
  assert.equal(backend.records.length, 1, 'debug record should pass after threshold lowered to debug');
  assert.equal(backend.records[0].msg, 'shown');
});

test('Logger.setThreshold: invalid level warns nativeConsole and does not change threshold', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'warn', backend, isDevelopment: false, source: 'server' });
  Logger.setThreshold('nonsense');
  assert.equal(Logger.getThreshold(), 'warn', 'threshold should be unchanged after invalid setThreshold call');
});

// ── mongoBackend: PHI-debug record tagging ────────────────────────────────────

test('mongoBackend: raw-bearing record gets phiDebug:true and expiresAt Date at ~phiRetentionHours', function() {
  const phiRetentionHours = 12;
  const backend = createMongoBackend({ phiRetentionHours });
  const captured = [];
  backend.connect(function(docs) { captured.push(...docs); return Promise.resolve(); });
  const before = Date.now();
  backend.write(makeRecord({ msg: 'phi-raw', raw: { name: [{ family: 'Smith' }] } }));
  backend.flush();
  assert.equal(captured.length, 1, 'raw-bearing record should be stored');
  const doc = captured[0];
  assert.equal(doc.phiDebug, true, 'phiDebug must be true for raw-bearing records');
  assert.ok(doc.expiresAt instanceof Date, 'expiresAt must be a Date instance');
  const expectedMs = phiRetentionHours * 3600 * 1000;
  assert.ok(Math.abs(doc.expiresAt.getTime() - (before + expectedMs)) < 5000, 'expiresAt must be ~phiRetentionHours ahead of write time');
  backend.stop();
});

test('mongoBackend: normal record (no raw) has no phiDebug or expiresAt fields', function() {
  const backend = createMongoBackend({ phiRetentionHours: 24 });
  const captured = [];
  backend.connect(function(docs) { captured.push(...docs); return Promise.resolve(); });
  backend.write(makeRecord({ msg: 'normal' }));
  backend.flush();
  assert.equal(captured.length, 1, 'normal record should be stored');
  const doc = captured[0];
  assert.equal('phiDebug' in doc, false, 'normal record must not have phiDebug');
  assert.equal('expiresAt' in doc, false, 'normal record must not have expiresAt');
  backend.stop();
});

// ── makeFanout: raw stripped for primary, kept for secondary ──────────────────

test('makeFanout: primary receives record without raw; secondary receives full record with raw', function() {
  const primaryRecs = [];
  const secondaryRecs = [];
  const primary   = { write: function(r) { primaryRecs.push(r); } };
  const secondary = { write: function(r) { secondaryRecs.push(r); } };
  const fanout = makeFanout(primary, secondary);

  // Record WITH raw — primary must not see it; secondary must have it.
  fanout.write({ ts: 't', level: 'info', module: 'M', msg: 'phi-rec', raw: { secret: 'S' } });
  assert.equal('raw' in primaryRecs[0], false, 'primary must not receive raw field');
  assert.equal(primaryRecs[0].msg, 'phi-rec', 'primary must still receive the rest of the record');
  assert.equal(secondaryRecs[0].raw.secret, 'S', 'secondary must receive raw field intact');

  // Record WITHOUT raw — both backends receive it; neither has a raw property.
  fanout.write({ ts: 't', level: 'info', module: 'M', msg: 'clean-rec' });
  assert.equal('raw' in primaryRecs[1], false,   'primary must not have raw for clean record');
  assert.equal('raw' in secondaryRecs[1], false,  'secondary must not have raw for clean record');
  assert.equal(primaryRecs[1].msg, 'clean-rec',  'primary receives clean record');
  assert.equal(secondaryRecs[1].msg, 'clean-rec', 'secondary receives clean record');
});

test('makeFanout: rawToPrimary:true passes raw to primary; both backends receive the same object', function() {
  const primaryRecs = [];
  const secondaryRecs = [];
  const primary   = { write: function(r) { primaryRecs.push(r); } };
  const secondary = { write: function(r) { secondaryRecs.push(r); } };
  const fanout = makeFanout(primary, secondary, { rawToPrimary: true });

  fanout.write({ ts: 't', level: 'info', module: 'M', msg: 'dev-phi', raw: { secret: 'dev' } });
  assert.equal('raw' in primaryRecs[0], true,        'primary must receive raw when rawToPrimary:true');
  assert.equal(primaryRecs[0].raw.secret, 'dev',     'primary raw value must be intact');
  assert.equal(secondaryRecs[0].raw.secret, 'dev',   'secondary raw value must be intact');
  // Both should be the same object reference (no copy was made).
  assert.equal(primaryRecs[0], secondaryRecs[0],     'same record reference forwarded to both backends');
});

// ── stripRaw ──────────────────────────────────────────────────────────────────

const { stripRaw } = require('./loggerBackends/mongoBackend.js');

test('stripRaw: removes raw field, passes everything else, does not mutate original', function() {
  const delegateRecs = [];
  const delegate = { write: function(r) { delegateRecs.push(r); } };
  const wrapped = stripRaw(delegate);

  // Record WITH raw — delegate receives a copy without raw.
  const original = { ts: 't', level: 'info', module: 'M', msg: 'msg', raw: { secret: 'X' }, data: { count: 1 } };
  wrapped.write(original);
  assert.equal(delegateRecs.length, 1, 'delegate should receive one record');
  assert.equal('raw' in delegateRecs[0], false,   'delegate must not see raw field');
  assert.equal(delegateRecs[0].msg, 'msg',         'msg must pass through');
  assert.deepEqual(delegateRecs[0].data, { count: 1 }, 'data must pass through');
  // Original must not be mutated.
  assert.equal('raw' in original, true,            'original record must not be mutated');
  assert.equal(original.raw.secret, 'X',           'original raw value must be intact');

  // Record WITHOUT raw — delegate receives the same reference (no copy).
  const clean = { ts: 't', level: 'info', module: 'M', msg: 'clean' };
  wrapped.write(clean);
  assert.equal(delegateRecs[1], clean,             'clean record passed through as same reference');
});

// ── consoleBackend: PHI-DEBUG raw rendering ───────────────────────────────────

test('consoleBackend: renders ⚠ PHI-DEBUG raw line when record.raw present', function() {
  const consoleBackend = require('./loggerBackends/consoleBackend.js');
  const warnCalls = [];
  const origWarn = console.warn;
  console.warn = function() { warnCalls.push(Array.prototype.slice.call(arguments)); };
  try {
    consoleBackend.write({ ts: 't', level: 'info', module: 'PatTest', msg: 'patient viewed', data: { redacted: true }, raw: { name: [{ family: 'Smith' }] } });
    assert.equal(warnCalls.length, 1, 'exactly one console.warn call expected');
    assert.ok(warnCalls[0][0].includes('PHI-DEBUG raw'), 'warn line must include PHI-DEBUG raw marker');
    assert.ok(warnCalls[0][0].includes('PatTest'), 'warn line must include the module name');
    assert.equal(warnCalls[0][1].name[0].family, 'Smith', 'raw payload must appear in the warn call');
  } finally {
    console.warn = origWarn;
  }
});

test('consoleBackend: does NOT emit PHI-DEBUG line when record.raw is absent', function() {
  const consoleBackend = require('./loggerBackends/consoleBackend.js');
  const warnCalls = [];
  const origWarn = console.warn;
  console.warn = function() { warnCalls.push(Array.prototype.slice.call(arguments)); };
  try {
    consoleBackend.write({ ts: 't', level: 'info', module: 'PatTest', msg: 'normal record', data: { status: 'final' } });
    assert.equal(warnCalls.length, 0, 'no console.warn calls for records without raw');
  } finally {
    console.warn = origWarn;
  }
});

// ------------------------------------------------ debugging-session toggles

test('module focus: info-and-below only for matching modules; error/warn always pass', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'trace', backend, isDevelopment: false, source: 'client' });
  Logger.setModules('PatientSidebar,Pacio*');
  Logger.for('PatientSidebar').debug('visible');
  Logger.for('PacioSubscriptions').info('visible via prefix glob');
  Logger.for('Footer').debug('hidden');
  Logger.for('Footer').error('errors always pass');
  Logger.for('Footer').warn('warns always pass');
  Logger.setModules(null);   // cleanup for later tests
  const modules = backend.records.map(r => r.module + ':' + r.level);
  assert.deepEqual(modules, [
    'PatientSidebar:debug',
    'PacioSubscriptions:info',
    'Footer:error',
    'Footer:warn'
  ]);
});

test('focus() opens threshold to trace and sets the filter; reset() restores boot config', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'info', backend, isDevelopment: false, source: 'client' });
  Logger.focus('OnlyMe');
  assert.equal(Logger.getThreshold(), 'trace');
  assert.equal(Logger.getModules(), 'OnlyMe');
  Logger.for('OnlyMe').trace('deep detail');
  Logger.for('Other').debug('filtered');
  Logger.reset();
  assert.equal(Logger.getThreshold(), 'info');   // back to init value
  assert.equal(Logger.getModules(), null);
  Logger.for('Other').info('flows again');
  const kept = backend.records.map(r => r.module + ':' + r.level);
  assert.deepEqual(kept, ['OnlyMe:trace', 'Other:info']);
});

test('setModules clears on null, empty string, and star', function() {
  const backend = fakeBackend();
  Logger.init({ threshold: 'debug', backend, isDevelopment: false, source: 'client' });
  ['', '*', null].forEach(function(clearSpec) {
    Logger.setModules('Somebody');
    Logger.setModules(clearSpec);
    assert.equal(Logger.getModules(), null);
  });
  Logger.for('Anyone').debug('unfiltered');
  assert.equal(backend.records.length, 1);
});
