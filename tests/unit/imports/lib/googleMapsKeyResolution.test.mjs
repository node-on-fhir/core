// tests/unit/imports/lib/googleMapsKeyResolution.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { resolveMapsKey, MAPS_PROVIDER_ID } =
  require('../../../../imports/lib/googleMapsKeyResolution.js');

test('provider id is the userApiKeys registry key', function() {
  assert.equal(MAPS_PROVIDER_ID, 'googleMaps');
});

test('deployment settings key wins over user key (operator-managed deploys)', function() {
  const result = resolveMapsKey({
    settingsKey: 'AIzaSettings',
    userEntry: { provider: 'googleMaps', value: 'AIzaUser' }
  });
  assert.deepEqual(result, { apiKey: 'AIzaSettings', source: 'settings' });
});

test('user key used when no settings key (BYOK desktop builds)', function() {
  const result = resolveMapsKey({
    settingsKey: '',
    userEntry: { provider: 'googleMaps', value: ' AIzaUser ' }
  });
  assert.deepEqual(result, { apiKey: 'AIzaUser', source: 'user' }); // trimmed
});

test('no key anywhere resolves to null (caller shows the onramp)', function() {
  assert.deepEqual(resolveMapsKey({}), { apiKey: null, source: null });
  assert.deepEqual(resolveMapsKey({ settingsKey: '   ', userEntry: null }),
    { apiKey: null, source: null });
  assert.deepEqual(resolveMapsKey({ userEntry: { provider: 'googleMaps', value: '' } }),
    { apiKey: null, source: null });
});
