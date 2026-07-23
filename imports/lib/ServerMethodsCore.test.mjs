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

test('define/get with aliases; canonical duplicates rejected', function() {
  const registry = createRegistry();
  const handler = async function() { return 1; };
  registry.define('consents.save', { description: 'x', aliases: ['saveConsent'] }, handler);
  assert.equal(registry.get('consents.save').handler, handler);
  assert.equal(registry.get('saveConsent').viaAlias, true);
  assert.equal(registry.get('nope'), null);
  assert.throws(function() { registry.define('consents.save', {}, handler); }, /already defined/);
  assert.throws(function() { registry.define('badName', {}, handler); }, /name/);
});

// Hardened collision semantics (IPS zombie-boot incident, 2026-07-22):
// aliases are never load-bearing — contested aliases are dropped with a
// warning, and a later canonical define evicts a squatting alias. Only
// canonical-vs-canonical duplicates stay fatal.
test('alias colliding with existing canonical is dropped, not fatal', function() {
  const warnings = [];
  const registry = createRegistry({ onWarn: function(msg) { warnings.push(msg); } });
  const coreHandler = async function() { return 'core'; };
  const pkgHandler = async function() { return 'pkg'; };
  registry.define('compositions.insert', {}, coreHandler);
  // Package requests the core-owned name as a legacy alias — dropped, no throw.
  const entry = registry.define('ips.saveComposition', { aliases: ['compositions.insert'] }, pkgHandler);
  assert.deepEqual(entry.options.aliases, []);                       // alias not kept
  assert.equal(registry.get('compositions.insert').handler, coreHandler); // core untouched
  assert.equal(registry.get('ips.saveComposition').handler, pkgHandler);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /dropped/);
});

test('canonical define evicts a squatting alias (package loaded before core)', function() {
  const warnings = [];
  const registry = createRegistry({ onWarn: function(msg) { warnings.push(msg); } });
  const pkgHandler = async function() { return 'pkg'; };
  const coreHandler = async function() { return 'core'; };
  // Package loads first and claims the legacy name as an alias...
  registry.define('ips.saveComposition', { aliases: ['compositions.insert'] }, pkgHandler);
  assert.equal(registry.get('compositions.insert').viaAlias, true);
  // ...then core canonically defines it: must succeed, evicting the alias.
  registry.define('compositions.insert', {}, coreHandler);
  const resolved = registry.get('compositions.insert');
  assert.equal(resolved.viaAlias, false);
  assert.equal(resolved.handler, coreHandler);
  // The evicted alias is removed from the package entry's kept-alias list.
  assert.deepEqual(registry.get('ips.saveComposition').options.aliases, []);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /evicted/);
});

test('alias colliding with an existing alias is dropped (first claim wins)', function() {
  const warnings = [];
  const registry = createRegistry({ onWarn: function(msg) { warnings.push(msg); } });
  const h1 = async function() { return 1; };
  const h2 = async function() { return 2; };
  registry.define('alpha.save', { aliases: ['legacySave'] }, h1);
  const entry2 = registry.define('beta.save', { aliases: ['legacySave'] }, h2);
  assert.equal(registry.get('legacySave').handler, h1);   // first claim intact
  assert.deepEqual(entry2.options.aliases, []);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /already aliased/);
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
