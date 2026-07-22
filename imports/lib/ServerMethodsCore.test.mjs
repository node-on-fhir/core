// imports/lib/ServerMethodsCore.test.mjs  — npm run test:rpc
import test from 'node:test';
import assert from 'node:assert/strict';
import Core from './ServerMethodsCore.js';
const { validateMethodName, createRegistry, meteorErrorToRpcError, rpcErrorToMeteorErrorArgs, buildOpenRpcDocument, httpStatusForRpcCode } = Core;

test('name rules: dotted resource.action only', function() {
  assert.equal(validateMethodName('consents.save').valid, true);
  assert.equal(validateMethodName('observations.vitals.insert').valid, true);
  assert.equal(validateMethodName('saveConsent').valid, false);      // no dot
  assert.equal(validateMethodName('Consents.save').valid, false);    // uppercase start
  assert.equal(validateMethodName('consents.').valid, false);
});

test('define/get with aliases; duplicates rejected', function() {
  const registry = createRegistry();
  const handler = async function() { return 1; };
  registry.define('consents.save', { description: 'x', aliases: ['saveConsent'] }, handler);
  assert.equal(registry.get('consents.save').handler, handler);
  assert.equal(registry.get('saveConsent').viaAlias, true);
  assert.equal(registry.get('nope'), null);
  assert.throws(function() { registry.define('consents.save', {}, handler); }, /already defined/);
  assert.throws(function() { registry.define('badName', {}, handler); }, /name/);
});

test('error mapping is lossless for Meteor.Error shape', function() {
  const fake = { error: 'not-authorized', reason: 'no user', details: 'ctx', isClientSafe: true };
  const rpc = meteorErrorToRpcError(fake);
  assert.equal(rpc.code, -32001);
  assert.equal(rpc.data.error, 'not-authorized');
  assert.equal(rpc.data.reason, 'no user');
  assert.equal(httpStatusForRpcCode(rpc.code), 403);
});

test('non-Meteor errors do not leak internals', function() {
  const rpc = meteorErrorToRpcError(new Error('SELECT * FROM secrets failed'));
  assert.equal(rpc.code, -32603);
  assert.equal(rpc.message, 'Internal error');
  assert.equal(rpc.data, undefined);
});

test('rpcErrorToMeteorErrorArgs round-trips the mapped shape', function() {
  const fake = { error: 'not-found', reason: 'no such record', details: { id: 'x1' }, isClientSafe: true };
  const args = rpcErrorToMeteorErrorArgs(meteorErrorToRpcError(fake));
  assert.equal(args.error, 'not-found');
  assert.equal(args.reason, 'no such record');
  assert.deepEqual(args.details, { id: 'x1' });
});

test('OpenRPC document includes methods with schemas and x- flags', function() {
  const registry = createRegistry();
  registry.define('exports.run', { description: 'Run export', streaming: true, phi: true,
    schemaObject: { type: 'object', properties: { types: { type: 'array' } } } }, async function() {});
  const doc = buildOpenRpcDocument(registry, { title: 'honeycomb', version: '1.0.0' });
  assert.equal(doc.openrpc, '1.3.2');
  const method = doc.methods.find(m => m.name === 'exports.run');
  assert.equal(method['x-streaming'], true);
  assert.equal(method['x-phi'], true);
  assert.equal(method.params[0].schema.type, 'object');
});

test('list filters by mcp exposure', function() {
  const registry = createRegistry();
  registry.define('a.one', { mcp: { expose: true } }, async function() {});
  registry.define('a.two', {}, async function() {});
  assert.deepEqual(registry.list({ mcp: true }).map(m => m.name), ['a.one']);
});
