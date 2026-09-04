// tests/unit/imports/lib/themePersistence.clinicThemes.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

// themePersistence guards on window.localStorage — provide a stub BEFORE import.
const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: function(k) { return store.has(k) ? store.get(k) : null; },
    setItem: function(k, v) { store.set(k, String(v)); },
    removeItem: function(k) { store.delete(k); }
  }
};

const { loadClinicThemes, saveClinicTheme, deleteClinicTheme } =
  await import('../../../../imports/lib/themePersistence.js');

test('loadClinicThemes returns [] when nothing saved', function() {
  store.clear();
  assert.deepEqual(loadClinicThemes(), []);
});

test('saveClinicTheme generates an id, stamps updatedAt, and upserts', function() {
  store.clear();
  const list1 = saveClinicTheme({ name: 'Clinic Blue', draft: { primary: '#2196f3' } });
  assert.equal(list1.length, 1);
  assert.ok(list1[0].id.startsWith('ct-'));
  assert.ok(list1[0].updatedAt);
  const id = list1[0].id;

  const list2 = saveClinicTheme({ id: id, name: 'Clinic Blue v2', draft: { primary: '#1976d2' } });
  assert.equal(list2.length, 1);                       // upsert, not append
  assert.equal(list2[0].name, 'Clinic Blue v2');

  const list3 = saveClinicTheme({ name: 'Another', draft: {} });
  assert.equal(list3.length, 2);
  assert.notEqual(list3[1].id, id);
});

test('deleteClinicTheme removes by id', function() {
  store.clear();
  const list = saveClinicTheme({ name: 'A', draft: {} });
  const after = deleteClinicTheme(list[0].id);
  assert.deepEqual(after, []);
});

test('corrupt storage degrades to []', function() {
  store.clear();
  store.set('honeycomb.clinicThemes', '{not json');
  assert.deepEqual(loadClinicThemes(), []);
});
