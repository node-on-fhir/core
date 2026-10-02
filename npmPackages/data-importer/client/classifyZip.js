// npmPackages/data-importer/client/classifyZip.js
//
// Peek inside a dropped .zip to decide what KIND of export it is, WITHOUT loading
// the whole archive into memory. The old FileDropTab assumed every .zip was an
// Apple Health export; a Facebook "Download Your Information" zip (up to ~2.5GB)
// was mis-routed to the Apple Health preview (0 records) — and loading a 2.5GB zip
// via JSZip.loadAsync just to classify would OOM the tab.
//
// Instead we STREAM the zip from the front with fflate and read only entry NAMES
// (local file headers carry the filename). We never call entry.start(), so nothing
// is inflated; the classifying markers live in the first entries, so we resolve
// after reading ~tens of KB and then stop pumping. Same streaming discipline as
// extensions/facebook-parser/client/lib/extractFacebookJson.js, but lighter.
//
// classifyZip(file) -> Promise<'apple-health' | 'facebook' | 'unknown'>

import { Unzip } from 'fflate';

// Top-level directory markers (matched at the start of an entry name, or after a
// wrapping folder). Apple Health: apple_health_export/export.xml. Facebook:
// your_facebook_activity/, connections/friends/, personal_information/profile_information/.
export const APPLE_HEALTH_MARKERS = ['apple_health_export/'];
export const FACEBOOK_MARKERS = [
  'your_facebook_activity/',
  'connections/friends/',
  'personal_information/profile_information/'
];

// Bounds so an unrecognized (or maliciously large) zip can't stream forever.
const MAX_ENTRIES = 400;
const MAX_BYTES = 4 * 1024 * 1024;

// Classify a single entry name → 'apple-health' | 'facebook' | null (no match).
export function classifyEntryName(name) {
  const lower = (name || '').toLowerCase();
  if (!lower) return null;
  for (let i = 0; i < APPLE_HEALTH_MARKERS.length; i++) {
    const m = APPLE_HEALTH_MARKERS[i];
    if (lower.startsWith(m) || lower.indexOf('/' + m) !== -1) return 'apple-health';
  }
  for (let i = 0; i < FACEBOOK_MARKERS.length; i++) {
    const m = FACEBOOK_MARKERS[i];
    if (lower.startsWith(m) || lower.indexOf('/' + m) !== -1) return 'facebook';
  }
  return null;
}

export async function classifyZip(file) {
  if (!file || typeof file.stream !== 'function') return 'unknown';

  return await new Promise(function(resolve) {
    let settled = false;
    let entriesSeen = 0;
    const finish = function(kind) {
      if (settled) return;
      settled = true;
      resolve(kind);
    };

    // No inflater is registered and we never call entry.start(): fflate parses the
    // local headers and skips each entry's data by its recorded size — no inflation,
    // no buffering of media binaries.
    const unzip = new Unzip(function(entry) {
      if (settled) return;
      entriesSeen++;
      const kind = classifyEntryName(entry.name);
      if (kind) { finish(kind); return; }
      if (entriesSeen >= MAX_ENTRIES) finish('unknown');
    });

    (async function pump() {
      try {
        const reader = file.stream().getReader();
        let bytes = 0;
        // eslint-disable-next-line no-constant-condition
        while (!settled) {
          const { done, value } = await reader.read();
          if (done) { unzip.push(new Uint8Array(0), true); break; }
          unzip.push(value, false);
          bytes += value.length;
          if (bytes >= MAX_BYTES) break; // read enough of the front to decide
        }
        if (typeof reader.releaseLock === 'function') reader.releaseLock();
      } catch (error) {
        // Unreadable / corrupt zip → let the caller treat it as unknown.
      }
      finish('unknown');
    })();
  });
}
