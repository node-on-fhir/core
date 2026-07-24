// npmPackages/provider-directory/server/methods.directory.js
//
// CMS National Directory (directory.cms.gov) bulk-file loader.
//
// The site publishes a manifest at GET {baseUrl}/downloads/manifest.json (the
// path is declared in the site's /assets/runtime-config.json as
// dataDownloadsManifestUrl). The manifest's `files` is an OBJECT keyed by
// uncompressed filename (e.g. "Practitioner_2026-05-07_2128.ndjson") with only
// byte counts; resource name + release date are parsed from the filename. Each
// file downloads at {baseUrl}/downloads/{filename}.zst. Both the manifest and
// the file URLs 302-redirect to pre-signed S3 URLs (1-hour expiry) — fetch
// follows redirects, and every download re-hits the redirect endpoint so it
// always gets a fresh signature. 6 FHIR R4 NDJSON files, Zstandard-compressed:
// Practitioner, PractitionerRole, Organization, OrganizationAffiliation,
// Location, Endpoint (~2.1 GB compressed / ~32.7 GB uncompressed).
// "Find the latest file" = read the manifest — no crawling.
//
// All work runs server-side (the Electron renderer has no fs; the embedded desktop
// server does). The flow streams end-to-end and never materializes the 32.7 GB:
//   fetch -> temp .zst on disk -> createZstdDecompress -> readline -> batched
//   rawCollection().bulkWrite into Directory.* (lib/DirectoryCollections.js).
// Fetch/Install run as BACKGROUND jobs: their RPCs return immediately and the
// client polls providerDirectory.directoryProgress for per-resource progress
// (download bytes, install bytes/lines) — no long-held HTTP request.
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

// e.g. "Practitioner_2026-05-07_2128.ndjson" -> resourceName + release date
const FILENAME_PATTERN = /^(.+)_(\d{4}-\d{2}-\d{2})_\d{4}\.ndjson$/;

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];
function formatBytes(bytes) {
  if (typeof bytes !== 'number' || !isFinite(bytes) || bytes < 0) { return undefined; }
  if (bytes === 0) { return '0 B'; }
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), SIZE_UNITS.length - 1);
  const value = bytes / Math.pow(1024, exp);
  return (exp === 0 ? Math.round(value) : value.toFixed(1)) + ' ' + SIZE_UNITS[exp];
}

// Fetch {baseUrl}/downloads/manifest.json (302 -> pre-signed S3; fetch follows)
// and normalize its object-keyed `files` into the array shape the fetch/install
// methods and the client panel consume.
async function loadManifest() {
  const url = baseUrl() + '/downloads/manifest.json';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Meteor.Error('manifest-fetch-failed', response.status + ' ' + response.statusText + ' for ' + url);
  }
  const manifest = await response.json();

  const files = [];
  const rawFiles = get(manifest, 'files', {}) || {};
  Object.keys(rawFiles).forEach(function (fileName) {
    const match = FILENAME_PATTERN.exec(fileName);
    if (!match) { return; }
    const resourceName = match[1];
    if (KNOWN_RESOURCE_NAMES.indexOf(resourceName) === -1) { return; }
    const meta = rawFiles[fileName] || {};
    files.push({
      resource_name: resourceName,
      release_date: match[2],
      filename: fileName + '.zst',
      download_path: '/downloads/' + fileName + '.zst',
      compressed_bytes: get(meta, 'compressed_bytes'),
      original_bytes: get(meta, 'original_bytes'),
      compressed_size: formatBytes(get(meta, 'compressed_bytes')),
      original_size: formatBytes(get(meta, 'original_bytes'))
    });
  });
  files.sort(function (a, b) { return a.resource_name.localeCompare(b.resource_name); });

  const releaseDate = files.reduce(function (latest, f) {
    return (!latest || f.release_date > latest) ? f.release_date : latest;
  }, undefined);

  const totals = get(manifest, 'totals', {}) || {};
  return {
    release_date: releaseDate,
    totals: Object.assign({}, totals, {
      compressed_size: formatBytes(get(totals, 'compressed_bytes')),
      original_size: formatBytes(get(totals, 'original_bytes'))
    }),
    compression: {
      algorithm: get(manifest, 'compression_algorithm'),
      level: get(manifest, 'compression_level')
    },
    files: files
  };
}

// ---------------------------------------------------------------------------
// Job progress (in-memory; single server process, resets on restart)
//
// progress[resourceName] = {
//   phase: 'downloading' | 'downloaded' | 'installing' | 'installed' | 'error',
//   bytesDownloaded, bytesTotal,                 // download (compressed bytes)
//   compressedBytesRead, compressedBytesTotal,   // install (bytes read off the .zst)
//   lines, inserted, upserted, modified, errors, // install row counters
//   error, startedAt, finishedAt, updatedAt
// }
// The client polls providerDirectory.directoryProgress to render progress bars.

const progress = {};
let activeJob = null; // 'fetch' | 'install' | null — one bulk job at a time

function startProgress(resourceName, phase, extra) {
  progress[resourceName] = Object.assign({
    phase: phase,
    startedAt: new Date(),
    updatedAt: new Date()
  }, extra || {});
  return progress[resourceName];
}
function touchProgress(prog, fields) {
  Object.assign(prog, fields || {});
  prog.updatedAt = new Date();
}
function finishProgress(prog, phase, fields) {
  touchProgress(prog, Object.assign({ phase: phase, finishedAt: new Date() }, fields || {}));
}
function failProgress(prog, error) {
  finishProgress(prog, 'error', { error: error.reason || error.message || String(error) });
}
function ensureNoActiveJob() {
  if (activeJob) {
    throw new Meteor.Error('busy', 'A directory ' + activeJob + ' job is already running — wait for it to finish.');
  }
}

// ---------------------------------------------------------------------------
// Download (stream URL -> temp .zst). Pattern adapted from
// extensions/mcp/server/ModelDownloadService.js downloadModel().

async function downloadToFile(url, filePath, onBytes) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Meteor.Error('download-failed', 'Download failed: ' + response.status + ' ' + response.statusText);
  }
  const writeStream = fs.createWriteStream(filePath);
  try {
    if (response.body && response.body.pipe) {
      await new Promise(function (resolve, reject) {
        if (typeof onBytes === 'function') {
          response.body.on('data', function (chunk) { onBytes(chunk.length); });
        }
        response.body.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);
        response.body.pipe(writeStream);
      });
    } else {
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
      if (typeof onBytes === 'function') { onBytes(buffer.length); }
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

async function installResource(resourceName, dir, prog) {
  const collection = getDirectoryCollection(resourceName);
  if (!collection) { throw new Meteor.Error('unknown-resource', 'Unknown directory resource: ' + resourceName); }

  const file = findTempFile(dir, resourceName);
  if (!file) {
    throw new Meteor.Error('not-fetched', 'No downloaded file for ' + resourceName + ' in ' + dir + ' — run Fetch first.');
  }

  const compressedBytesTotal = fs.statSync(file).size;
  if (prog) { touchProgress(prog, { compressedBytesTotal: compressedBytesTotal, compressedBytesRead: 0 }); }

  const raw = collection.rawCollection();
  let ops = [];
  let lines = 0, inserted = 0, upserted = 0, modified = 0, errors = 0;
  let compressedBytesRead = 0;
  let lastLoggedLines = 0;

  async function flush() {
    if (!ops.length) { return; }
    const batch = ops;
    ops = [];
    const res = await raw.bulkWrite(batch, { ordered: false });
    inserted += (res.insertedCount || 0);
    upserted += (res.upsertedCount || 0);
    modified += (res.modifiedCount || 0);
    if (prog) {
      touchProgress(prog, {
        lines: lines, inserted: inserted, upserted: upserted, modified: modified, errors: errors,
        compressedBytesRead: compressedBytesRead
      });
    }
    if (lines - lastLoggedLines >= 250000) {
      lastLoggedLines = lines;
      const pct = compressedBytesTotal ? Math.round((compressedBytesRead / compressedBytesTotal) * 100) : 0;
      console.log('[provider-directory] directoryInstall ' + resourceName + ' progress: ' +
        lines.toLocaleString() + ' lines, ' + pct + '% of compressed file read');
    }
  }

  const source = fs.createReadStream(file);
  // Progress: count compressed bytes as they leave disk — a good proxy for
  // overall install progress since decompress + parse + write stream in lockstep.
  source.on('data', function (chunk) { compressedBytesRead += chunk.length; });
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
  ensureNoActiveJob();

  const dir = ensureTempDir();
  // Load the manifest before returning so a bad manifest fails the RPC loudly.
  const manifest = await loadManifest();
  const filesByName = {};
  manifest.files.forEach(function (f) { filesByName[get(f, 'resource_name')] = f; });

  const resourceNames = options.resourceNames.slice();
  activeJob = 'fetch';
  // Background job: the RPC returns immediately; the client polls
  // providerDirectory.directoryProgress for download progress.
  (async function () {
    for (const resourceName of resourceNames) {
      const fileMeta = filesByName[resourceName];
      if (!fileMeta) {
        failProgress(startProgress(resourceName, 'downloading'), new Meteor.Error('not-in-manifest', 'not in manifest'));
        continue;
      }
      const fileName = get(fileMeta, 'filename') || (resourceName + '.ndjson.zst');
      const filePath = path.join(dir, fileName);
      const url = baseUrl() + get(fileMeta, 'download_path');
      const prog = startProgress(resourceName, 'downloading', {
        bytesDownloaded: 0,
        bytesTotal: get(fileMeta, 'compressed_bytes', 0)
      });
      try {
        assertFreeSpace(dir, get(fileMeta, 'compressed_bytes', 0));
        console.log('[provider-directory] directoryFetch downloading', url);
        const bytes = await downloadToFile(url, filePath, function (chunkBytes) {
          prog.bytesDownloaded += chunkBytes;
          prog.updatedAt = new Date();
        });
        finishProgress(prog, 'downloaded', { bytesDownloaded: bytes });
        console.log('[provider-directory] directoryFetch done', resourceName, bytes.toLocaleString(), 'bytes');
      } catch (error) {
        console.error('[provider-directory] directoryFetch error', resourceName, error.message);
        failProgress(prog, error);
      }
    }
  })().catch(function (error) {
    console.error('[provider-directory] directoryFetch job crashed', error.message);
  }).finally(function () {
    activeJob = null;
  });

  return { started: true, job: 'fetch', tempDir: dir, resourceNames: resourceNames };
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
  ensureNoActiveJob();

  const dir = tempDir();
  const resourceNames = options.resourceNames.slice();
  activeJob = 'install';
  // Background job: the RPC returns immediately; the client polls
  // providerDirectory.directoryProgress for decompress/load progress.
  (async function () {
    for (const resourceName of resourceNames) {
      const prog = startProgress(resourceName, 'installing', {
        lines: 0, inserted: 0, upserted: 0, modified: 0, errors: 0
      });
      try {
        console.log('[provider-directory] directoryInstall loading', resourceName);
        const r = await installResource(resourceName, dir, prog);
        console.log('[provider-directory] directoryInstall done', resourceName, JSON.stringify(r));
        finishProgress(prog, 'installed', r);
      } catch (error) {
        console.error('[provider-directory] directoryInstall error', resourceName, error.message);
        failProgress(prog, error);
      }
    }
  })().catch(function (error) {
    console.error('[provider-directory] directoryInstall job crashed', error.message);
  }).finally(function () {
    activeJob = null;
  });

  return { started: true, job: 'install', resourceNames: resourceNames };
});

Meteor.ServerMethods.define('providerDirectory.directoryProgress', {
  description: 'Live progress of the current/most-recent National Directory fetch or install job',
  // Read-only status probe (same posture as directoryCounts): the client polls
  // this while a job runs to render progress bars. Exposes no secrets, no PHI.
  requireAuth: false
}, async function (params, context) {
  return { active: activeJob, resources: progress };
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
