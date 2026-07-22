// npmPackages/provider-directory/server/methods.directory.js
//
// CMS National Directory (directory.cms.gov) bulk-file loader.
//
// The site publishes a manifest at GET {baseUrl}/api/release.json listing 6 FHIR
// R4 NDJSON files, Zstandard-compressed (.ndjson.zst): Practitioner,
// PractitionerRole, Organization, OrganizationAffiliation, Location, Endpoint
// (~2.1 GB compressed / ~32.7 GB uncompressed). "Find the latest file" = read the
// manifest's files[].download_path — no crawling.
//
// All work runs server-side (the Electron renderer has no fs; the embedded desktop
// server does). The flow streams end-to-end and never materializes the 32.7 GB:
//   fetch -> temp .zst on disk -> createZstdDecompress -> readline -> batched
//   rawCollection().bulkWrite into Directory.* (lib/DirectoryCollections.js).
//
// Gated on settings.private.directory.enabled (tri-state check pattern,
// .claude/rules/meteor/settings-gated-features.md). Methods are namespaced
// `providerDirectory.*` and registered through the collision guard idiom used by
// server/methods.js, so they never clash with core method names.

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { fetch } from 'meteor/fetch';
import { get } from 'lodash';

import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import readline from 'readline';

import { DIRECTORY_RESOURCES, getDirectoryCollection } from '../lib/DirectoryCollections.js';

const DEFAULT_BASE_URL = 'https://directory.cms.gov';
const BATCH_SIZE = 2000;
const KNOWN_RESOURCE_NAMES = DIRECTORY_RESOURCES.map(function (r) { return r.resourceName; });

// ---------------------------------------------------------------------------
// Settings helpers (private settings — server only)

function directorySettings() {
  return get(Meteor, 'settings.private.directory', {}) || {};
}
function isEnabled() {
  return get(directorySettings(), 'enabled', false) === true;
}
function baseUrl() {
  return String(get(directorySettings(), 'baseUrl', DEFAULT_BASE_URL)).replace(/\/+$/, '');
}
function tempDir() {
  const configured = get(directorySettings(), 'tempPath', '');
  return (configured && configured.length)
    ? configured
    : path.join(os.tmpdir(), 'honeycomb-directory');
}
function ensureEnabled() {
  if (!isEnabled()) {
    throw new Meteor.Error('feature-disabled',
      'National Directory import is disabled. Set Meteor.settings.private.directory.enabled to true.');
  }
}
function ensureTempDir() {
  const dir = tempDir();
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
  return dir;
}

// zstd: prefer Node's built-in streaming decompressor (Node >= 22.15 / Electron 39).
// There is no viable streaming fallback at these file sizes (a one-shot
// buffer-based lib would have to hold ~18 GB in memory), so fail loud if absent.
function createZstdDecompressStream() {
  if (typeof zlib.createZstdDecompress === 'function') {
    return zlib.createZstdDecompress();
  }
  throw new Meteor.Error('zstd-unavailable',
    'No streaming Zstandard decompressor in this Node runtime (need Node >= 22.15 with zlib.createZstdDecompress). ' +
    'Check the Meteor bundle: process.versions.node = ' + process.versions.node + '.');
}

// Best-effort free-space guard (fs.statfsSync exists on Node 18.15+/22+).
function assertFreeSpace(dir, neededBytes) {
  if (!neededBytes || typeof fs.statfsSync !== 'function') { return; }
  try {
    const stats = fs.statfsSync(dir);
    const free = stats.bsize * stats.bavail;
    if (free < neededBytes * 1.5) {
      throw new Meteor.Error('insufficient-disk',
        'Not enough free space in ' + dir + ' (need ~' +
        Math.round((neededBytes * 1.5) / 1e6) + ' MB free for the compressed download + headroom).');
    }
  } catch (error) {
    if (error && error.error === 'insufficient-disk') { throw error; }
    // statfs unavailable / failed — skip the guard rather than block the operation
  }
}

// ---------------------------------------------------------------------------
// Manifest

async function loadManifest() {
  const url = baseUrl() + '/api/release.json';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Meteor.Error('manifest-fetch-failed', response.status + ' ' + response.statusText + ' for ' + url);
  }
  const manifest = await response.json();
  // Keep only the 6 known resource files (drop the manifest.json self-entry).
  const files = (get(manifest, 'files', []) || []).filter(function (f) {
    return KNOWN_RESOURCE_NAMES.indexOf(get(f, 'resource_name')) !== -1;
  });
  return {
    release_date: get(manifest, 'release_date'),
    generated_at: get(manifest, 'generated_at'),
    totals: get(manifest, 'totals'),
    compression: get(manifest, 'compression'),
    files: files
  };
}

// ---------------------------------------------------------------------------
// Download (stream URL -> temp .zst). Pattern adapted from
// extensions/mcp/server/ModelDownloadService.js downloadModel().

async function downloadToFile(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Meteor.Error('download-failed', 'Download failed: ' + response.status + ' ' + response.statusText);
  }
  const writeStream = fs.createWriteStream(filePath);
  try {
    if (response.body && response.body.pipe) {
      await new Promise(function (resolve, reject) {
        response.body.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);
        response.body.pipe(writeStream);
      });
    } else {
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
    }
  } catch (error) {
    try { if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); } } catch (e) { /* ignore */ }
    throw error;
  }
  return fs.statSync(filePath).size;
}

// Locate a downloaded temp file for a resource. Filenames are date-stamped
// (e.g. Practitioner_2026-05-07_2128.ndjson.zst); the trailing underscore after
// the resource name disambiguates Practitioner vs PractitionerRole and
// Organization vs OrganizationAffiliation.
function findTempFile(dir, resourceName) {
  if (!fs.existsSync(dir)) { return null; }
  const candidates = fs.readdirSync(dir).filter(function (name) {
    return name.indexOf(resourceName + '_') === 0 && name.endsWith('.ndjson.zst');
  });
  if (!candidates.length) { return null; }
  candidates.sort(); // date-stamped names sort chronologically; take the newest
  return path.join(dir, candidates[candidates.length - 1]);
}

// ---------------------------------------------------------------------------
// Install (stream temp .zst -> decompress -> readline -> batched bulkWrite)

async function installResource(resourceName, dir) {
  const collection = getDirectoryCollection(resourceName);
  if (!collection) { throw new Meteor.Error('unknown-resource', 'Unknown directory resource: ' + resourceName); }

  const file = findTempFile(dir, resourceName);
  if (!file) {
    throw new Meteor.Error('not-fetched', 'No downloaded file for ' + resourceName + ' in ' + dir + ' — run Fetch first.');
  }

  const raw = collection.rawCollection();
  let ops = [];
  let lines = 0, inserted = 0, upserted = 0, modified = 0, errors = 0;

  async function flush() {
    if (!ops.length) { return; }
    const batch = ops;
    ops = [];
    const res = await raw.bulkWrite(batch, { ordered: false });
    inserted += (res.insertedCount || 0);
    upserted += (res.upsertedCount || 0);
    modified += (res.modifiedCount || 0);
  }

  const source = fs.createReadStream(file);
  const decompress = createZstdDecompressStream();
  // Forward source errors into the decompress stream so the for-await rejects.
  source.on('error', function (e) { decompress.destroy(e); });
  const input = source.pipe(decompress);
  const rl = readline.createInterface({ input: input, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) { continue; }
    lines++;
    let resource;
    try {
      resource = JSON.parse(trimmed);
    } catch (e) {
      errors++;
      continue;
    }
    const id = get(resource, 'id');
    if (!id) { errors++; continue; }
    resource._id = id;
    ops.push({ replaceOne: { filter: { _id: id }, replacement: resource, upsert: true } });
    if (ops.length >= BATCH_SIZE) { await flush(); }
  }
  await flush();

  // Drop the temp .zst after a successful install (we keep nothing on disk).
  try { fs.unlinkSync(file); } catch (e) { /* ignore */ }

  return { lines: lines, inserted: inserted, upserted: upserted, modified: modified, errors: errors };
}

// ---------------------------------------------------------------------------
// Methods

// rpc-migration (Loop 1): converted to Meteor.ServerMethods.define (global
// registry). Names keep the pre-existing `providerDirectory.directory*`
// namespace (distinct from server/methods.js providerDirectory.sync* and from
// core). These methods had NO auth guard but ARE settings-gated (ensureEnabled).
// Read-only status probes stay public (requireAuth:false, the settings-gated
// tri-state check pattern); the mutating fetch/install default to requireAuth
// true. this.unblock() deleted. Directory data is NOT patient PHI. Helper
// functions above are untouched.

Meteor.ServerMethods.define('providerDirectory.directoryCheckEnabled', {
  description: 'Report whether National Directory import is enabled + runtime capabilities (tri-state gate)',
  // Public by design: the client calls this on mount to decide whether to show
  // the import controls (settings-gated-features pattern). Exposes no secrets.
  requireAuth: false
}, async function (params, context) {
  return {
    enabled: isEnabled(),
    baseUrl: baseUrl(),
    tempDir: tempDir(),
    nodeVersion: process.versions.node,
    zstdStreaming: typeof zlib.createZstdDecompress === 'function'
  };
});

Meteor.ServerMethods.define('providerDirectory.directoryManifest', {
  description: 'Fetch the current CMS National Directory release manifest (6 resource files)'
}, async function (params, context) {
  ensureEnabled();
  return await loadManifest();
});

Meteor.ServerMethods.define('providerDirectory.directoryFetch', {
  description: 'Stream-download selected National Directory NDJSON files to the temp dir',
  positionalParams: ['options'],
  schemaObject: {
    type: 'object',
    properties: {
      options: {
        type: 'object',
        properties: { resourceNames: { type: 'array', items: { type: 'string' } } },
        required: ['resourceNames']
      }
    },
    required: ['options']
  }
}, async function (params, context) {
  const options = get(params, 'options');
  check(options, Match.ObjectIncluding({ resourceNames: [String] }));
  ensureEnabled();

  const dir = ensureTempDir();
    const manifest = await loadManifest();
    const filesByName = {};
    manifest.files.forEach(function (f) { filesByName[get(f, 'resource_name')] = f; });

    const results = [];
    for (const resourceName of options.resourceNames) {
      const fileMeta = filesByName[resourceName];
      if (!fileMeta) {
        results.push({ resourceName: resourceName, ok: false, error: 'not in manifest' });
        continue;
      }
      const fileName = get(fileMeta, 'filename') || (resourceName + '.ndjson.zst');
      const filePath = path.join(dir, fileName);
      const url = baseUrl() + get(fileMeta, 'download_path');
      try {
        assertFreeSpace(dir, get(fileMeta, 'compressed_bytes', 0));
        console.log('[provider-directory] directoryFetch downloading', url);
        const bytes = await downloadToFile(url, filePath);
        results.push({ resourceName: resourceName, ok: true, path: filePath, bytes: bytes });
      } catch (error) {
        console.error('[provider-directory] directoryFetch error', resourceName, error.message);
        results.push({ resourceName: resourceName, ok: false, error: error.reason || error.message });
      }
    }
    return { tempDir: dir, results: results };
});

Meteor.ServerMethods.define('providerDirectory.directoryInstall', {
  description: 'Decompress and bulk-load already-fetched National Directory files into Directory.*',
  positionalParams: ['options'],
  schemaObject: {
    type: 'object',
    properties: {
      options: {
        type: 'object',
        properties: { resourceNames: { type: 'array', items: { type: 'string' } } },
        required: ['resourceNames']
      }
    },
    required: ['options']
  }
}, async function (params, context) {
  const options = get(params, 'options');
  check(options, Match.ObjectIncluding({ resourceNames: [String] }));
  ensureEnabled();

  const dir = tempDir();
    const results = [];
    for (const resourceName of options.resourceNames) {
      try {
        console.log('[provider-directory] directoryInstall loading', resourceName);
        const r = await installResource(resourceName, dir);
        console.log('[provider-directory] directoryInstall done', resourceName, JSON.stringify(r));
        results.push(Object.assign({ resourceName: resourceName, ok: true }, r));
      } catch (error) {
        console.error('[provider-directory] directoryInstall error', resourceName, error.message);
        results.push({ resourceName: resourceName, ok: false, error: error.reason || error.message });
      }
    }
    return { results: results };
});

Meteor.ServerMethods.define('providerDirectory.directoryCounts', {
  description: 'Fast per-collection document counts for the loaded National Directory resources',
  // Read-only status (estimatedDocumentCount, no scan, no PHI). Historically
  // guard-less; kept public so status renders without a session.
  requireAuth: false
}, async function (params, context) {
  const counts = {};
  for (const entry of DIRECTORY_RESOURCES) {
    try {
      counts[entry.resourceName] = await getDirectoryCollection(entry.resourceName)
        .rawCollection().estimatedDocumentCount();
    } catch (error) {
      counts[entry.resourceName] = 0;
    }
  }
  return counts;
});

console.log('[provider-directory] National Directory loader methods registered');
