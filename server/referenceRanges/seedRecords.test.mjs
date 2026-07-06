import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { toSeedDocs } from './seedRecords.mjs';

const seed = JSON.parse(readFileSync(fileURLToPath(new URL('../../imports/data/reference-ranges/blood-panel.json', import.meta.url)), 'utf8'));

test('toSeedDocs assigns _id === id (stable, idempotent)', () => {
  const docs = toSeedDocs(seed);
  assert.equal(docs.length, seed.length);
  docs.forEach(function (d) { assert.equal(d._id, d.id); });
  const ids = new Set(docs.map(function (d) { return d._id; }));
  assert.equal(ids.size, docs.length); // no collisions -> upsert is in-place
});
