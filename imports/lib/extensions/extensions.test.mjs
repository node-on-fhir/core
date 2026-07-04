// imports/lib/extensions/extensions.test.mjs -- npm run test:extensions
import test from 'node:test';
import assert from 'node:assert/strict';
import SessionModule from './SessionExtensions.js';
import StringModule from './StringExtensions.js';
const { installSessionExtensions } = SessionModule;
const { installStringExtensions } = StringModule;

function fakeSession() {
  const store = {};
  return { get(k){ return store[k]; }, set(k,v){ store[k]=v; } };
}

test('Session.toggle flips true<->false, returns true', function() {
  const S = fakeSession(); installSessionExtensions(S);
  S.set('flag', true);
  assert.equal(S.toggle('flag'), true);
  assert.equal(S.get('flag'), false);
  S.toggle('flag');
  assert.equal(S.get('flag'), true);
});
test('Session.clear -> null, remove -> undefined, setAll bulk', function() {
  const S = fakeSession(); installSessionExtensions(S);
  S.set('x', 5); assert.equal(S.clear('x'), true); assert.equal(S.get('x'), null);
  S.set('y', 5); assert.equal(S.remove('y'), true); assert.equal(S.get('y'), undefined);
  assert.equal(S.setAll({ a: 1, b: 2 }), true);
  assert.equal(S.get('a'), 1); assert.equal(S.get('b'), 2);
});
test('String.addUnderscores operates on `this` (bug fixed)', function() {
  installStringExtensions();
  assert.equal('Quick brown fox'.addUnderscores(), 'Quick_brown_fox');
});
