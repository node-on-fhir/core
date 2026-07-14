// npmPackages/data-importer/lib/RecursiveDocumentFetcher.mjs
//
// Recursive DocumentReference attachment walker for the REST API import tab.
//
// A plain Patient/$everything fetch stages the patient's resources but stops
// at DocumentReferences: PACIO-style documents (ToC bundles, advance
// directives, compositions) live behind `content[].attachment.url` and never
// get imported. `recursivelyFetchDocuments()` takes the already-staged
// resource list (or fetches the seed URL itself), follows every attachment
// URL it can resolve, stages the fetched resources, and repeats for
// DocumentReferences discovered inside those payloads — bounded by a
// visited-URL set, a depth cap, a total-documents cap, and the same
// link[relation=next] paging cap as the tab's executeFetch.
//
// Dedupe / id-alignment posture (per import-pipeline contract):
//  - every fetched Bundle goes through resolveBundleReferences() first, so
//    urn:uuid fullUrl references are rewritten to ResourceType/id and id-less
//    entries get derived ids BEFORE any dedupe keying;
//  - resources keyed by ResourceType/id: exact duplicates (stable-stringify
//    equal) are suppressed; same key with DIFFERENT content is staged anyway
//    (counted in stats.idCollisionsStaged) — the downstream Deduplicator and
//    insertBundleIntoWarehouse versioning arbitrate;
//  - resources without an id are always staged.
//
// Isomorphic AND dependency-free — no imports, no requires: the CI lib-test
// tier runs `node --test` straight off a bare checkout (no npm install). All
// collaborators are injected: `fetchFn`, `log`, and `resolveBundle` (the
// sibling BundleReferenceResolver's resolveBundleReferences — callers import
// it themselves and pass it in).
//
// Module system: pure ESM in a `.mjs` file — deliberately, and differently
// from BundleReferenceResolver.js (CJS .js). The three constraints are:
//  (1) rspack's client bundle in this app rejects `module.exports` assignment
//      in this file ("ES Modules may not assign module.exports") even with
//      zero requires — ESM export syntax is the only safe form;
//  (2) bare `node --test` classifies .js as CJS here (no "type": "module" in
//      package.json), so ESM syntax in a .js breaks the test tier;
//  (3) .mjs satisfies both: Node treats it as ESM natively, and rspack
//      bundles explicit-extension .mjs imports as strict ESM.
// Don't "simplify" this back to .js/CJS — both failure modes were hit live.

// Shallow guarded read — the local stand-in for lodash.get(obj, key).
function prop(obj, key) {
  return (obj && typeof obj === 'object') ? obj[key] : undefined;
}

var FETCH_HEADERS = {
  'Accept': 'application/fhir+json, application/json'
};

// Deterministic deep stringify (sorted object keys) so content comparison is
// insensitive to key order across servers. Arrays keep their order — FHIR
// primitive-array order is semantically meaningful.
export function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  return '{' + Object.keys(value).sort().map(function(key) {
    return JSON.stringify(key) + ':' + stableStringify(value[key]);
  }).join(',') + '}';
}

// 'ResourceType/id', or null when the resource has no id (keyless resources
// are always staged).
export function resourceKey(resource) {
  var resourceType = prop(resource, 'resourceType');
  var id = prop(resource, 'id');
  if (!resourceType || !id) return null;
  return resourceType + '/' + id;
}

// True when a declared contentType (or response Content-Type header) could be
// FHIR JSON: application/fhir+json, application/json, any '+json' suffix, or
// absent/unknown (sniff by attempting a parse).
export function isJsonish(contentType) {
  if (!contentType || typeof contentType !== 'string') return true;
  var normalized = contentType.toLowerCase();
  return normalized.indexOf('json') !== -1 ||
    normalized.indexOf('application/octet-stream') !== -1 ||
    normalized.indexOf('text/plain') !== -1;
}

// Collect candidate attachment URLs from an array of resources. Every
// content[] entry of every DocumentReference is considered (not just [0]).
export function extractAttachmentUrls(resources) {
  var found = [];
  (Array.isArray(resources) ? resources : []).forEach(function(resource) {
    if (prop(resource, 'resourceType') !== 'DocumentReference') return;
    var contents = prop(resource, 'content');
    if (!Array.isArray(contents)) return;
    contents.forEach(function(content) {
      var attachment = prop(content, 'attachment');
      var url = prop(attachment, 'url');
      if (typeof url === 'string' && url.length > 0) {
        found.push({ url: url, contentType: prop(attachment, 'contentType') });
      }
    });
  });
  return found;
}

// Resolve a raw attachment url against the inbound fetch base. Returns an
// absolute URL string, or null when the url shouldn't be fetched:
//  - urn:uuid: refs are intra-document (already staged by the bundle resolver)
//  - data: payloads are inline, out of scope for v1
export function resolveAttachmentUrl(rawUrl, fetchBase) {
  if (typeof rawUrl !== 'string' || !rawUrl) return null;
  if (rawUrl.indexOf('urn:') === 0) return null;
  if (rawUrl.indexOf('data:') === 0) return null;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

  var base = (typeof fetchBase === 'string' ? fetchBase : '').replace(/\/+$/, '');
  if (!base) return null;

  try {
    if (rawUrl.charAt(0) === '/') {
      // Site-absolute (e.g. /gridfs/<id>) — resolve against the base's origin
      return new URL(rawUrl, new URL(base).origin).toString();
    }
    // Relative reference (e.g. Composition/123, Bundle/abc) — resolve against
    // the FHIR base. Trailing slash matters: without it URL() drops the last
    // path segment of the base.
    return new URL(rawUrl, base + '/').toString();
  } catch (e) {
    return null;
  }
}

// Fetch a URL and, when the payload is a paged Bundle, accumulate entries by
// following link[relation=next] up to maxPages (same semantics as the REST
// tab's executeFetch). Resolves { parsed, pagesFetched } or throws.
async function fetchWithPaging(url, fetchFn, maxPages, stats) {
  var response = await fetchFn(url, { headers: FETCH_HEADERS });
  if (!response || response.status < 200 || response.status >= 300) {
    throw new Error('HTTP ' + (response ? response.status : 'no response'));
  }
  var headerContentType = null;
  if (response.headers && typeof response.headers.get === 'function') {
    headerContentType = response.headers.get('content-type');
  }
  if (!isJsonish(headerContentType)) {
    // Still attempt one parse — some servers hand JSON back as octet-stream —
    // but flag the expectation so a parse failure reads as a skip, not error.
    var err = new Error('non-JSON content-type: ' + headerContentType);
    err.nonJson = true;
    var body = await response.text();
    try {
      return { parsed: JSON.parse(body), pagesFetched: 1 };
    } catch (parseError) {
      throw err;
    }
  }

  var text = await response.text();
  var parsed = JSON.parse(text);
  var pagesFetched = 1;

  if (parsed && parsed.resourceType === 'Bundle') {
    var entries = Array.isArray(parsed.entry) ? parsed.entry.slice() : [];
    var links = Array.isArray(parsed.link) ? parsed.link : [];
    var nextLink = links.find(function(l) { return prop(l, 'relation') === 'next'; });
    while (nextLink && nextLink.url && pagesFetched < maxPages) {
      var pageResponse = await fetchFn(nextLink.url, { headers: FETCH_HEADERS });
      if (!pageResponse || pageResponse.status < 200 || pageResponse.status >= 300) break;
      var pageBundle = JSON.parse(await pageResponse.text());
      if (Array.isArray(pageBundle.entry)) {
        entries = entries.concat(pageBundle.entry);
      }
      var pageLinks = Array.isArray(pageBundle.link) ? pageBundle.link : [];
      nextLink = pageLinks.find(function(l) { return prop(l, 'relation') === 'next'; });
      pagesFetched++;
    }
    if (pagesFetched > 1) {
      parsed = Object.assign({}, parsed, { entry: entries, link: [], total: entries.length });
    }
  }

  if (stats) stats.pagesFetched += pagesFetched;
  return { parsed: parsed, pagesFetched: pagesFetched };
}

// The walker. Options:
//   seedResources  already-staged resources (may be empty)
//   seedUrl        $everything URL fetched first when seedResources is empty
//   fetchBase      inbound FHIR base for relative attachment resolution
//   resolveBundle  REQUIRED: BundleReferenceResolver's resolveBundleReferences
//                  (injected so this file stays require-free)
//   fetchFn        default globalThis.fetch (injectable for tests)
//   log            default console (RestApiTab passes the Meteor.Logger facade)
//   maxDepth       attachment recursion depth (default 3)
//   maxPages       Bundle paging cap per fetch (default 25)
//   maxDocuments   total attachment fetches (default 50, runaway guard)
//   onProgress     function({ phase, fetched, queued, depth, totalResources, currentUrl })
// Resolves { resources, stats }. Individual document failures never abort the
// run — they accumulate in stats.errors.
export async function recursivelyFetchDocuments(options) {
  var opts = options || {};
  var fetchFn = opts.fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
  var log = opts.log || console;
  var maxDepth = typeof opts.maxDepth === 'number' ? opts.maxDepth : 3;
  var maxPages = typeof opts.maxPages === 'number' ? opts.maxPages : 25;
  var maxDocuments = typeof opts.maxDocuments === 'number' ? opts.maxDocuments : 50;
  var onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : function() {};
  var fetchBase = opts.fetchBase || '';

  if (!fetchFn) {
    throw new Error('recursivelyFetchDocuments: no fetch implementation available');
  }
  var resolveBundle = opts.resolveBundle;
  if (typeof resolveBundle !== 'function') {
    throw new Error('recursivelyFetchDocuments: options.resolveBundle is required (pass BundleReferenceResolver.resolveBundleReferences)');
  }

  var stats = {
    documentsFetched: 0,
    documentsSkipped: 0,
    pagesFetched: 0,
    duplicatesSuppressed: 0,
    idCollisionsStaged: 0,
    errors: []
  };

  var resources = [];
  var seenContent = {};   // resourceKey → [stableStringify(content), ...]
  var visited = {};       // normalized absolute URL → true
  var queue = [];         // [{ url, depth }]

  // Merge a batch of resources per the dedupe contract; returns the resources
  // that were actually staged (used to seed the next recursion level).
  function mergeResources(batch) {
    var staged = [];
    (Array.isArray(batch) ? batch : []).forEach(function(resource) {
      if (!resource || typeof resource !== 'object') return;
      var key = resourceKey(resource);
      if (!key) {
        resources.push(resource);
        staged.push(resource);
        return;
      }
      var content = stableStringify(resource);
      var priorVersions = seenContent[key];
      if (priorVersions) {
        if (priorVersions.indexOf(content) !== -1) {
          stats.duplicatesSuppressed++;
          return;
        }
        // Same ResourceType/id, different content — stage BOTH copies and let
        // the Deduplicator / warehouse versioning arbitrate downstream.
        stats.idCollisionsStaged++;
        log.warn('[RecursiveDocumentFetcher] id collision staged (same key, different content): ' + key);
        priorVersions.push(content);
      } else {
        seenContent[key] = [content];
      }
      resources.push(resource);
      staged.push(resource);
    });
    return staged;
  }

  // Queue every fetchable attachment URL found in a batch of newly staged
  // resources. visited is marked at enqueue time so cycles can't double-queue.
  function enqueueAttachments(staged, depth) {
    if (depth >= maxDepth) return;
    extractAttachmentUrls(staged).forEach(function(candidate) {
      if (!isJsonish(candidate.contentType)) {
        stats.documentsSkipped++;
        log.debug('[RecursiveDocumentFetcher] skipping non-JSON attachment (' + candidate.contentType + '): ' + candidate.url);
        return;
      }
      var absolute = resolveAttachmentUrl(candidate.url, fetchBase);
      if (!absolute) {
        stats.documentsSkipped++;
        log.debug('[RecursiveDocumentFetcher] skipping unresolvable attachment url: ' + candidate.url);
        return;
      }
      if (visited[absolute]) return;
      visited[absolute] = true;
      queue.push({ url: absolute, depth: depth + 1 });
    });
  }

  function reportProgress(phase, currentUrl, depth) {
    onProgress({
      phase: phase,
      fetched: stats.documentsFetched,
      queued: queue.length,
      depth: depth || 0,
      totalResources: resources.length,
      currentUrl: currentUrl || null
    });
  }

  // --- Seed ---------------------------------------------------------------
  var seed = Array.isArray(opts.seedResources) ? opts.seedResources : [];
  if (seed.length === 0 && opts.seedUrl) {
    reportProgress('seed', opts.seedUrl, 0);
    var seedResult = await fetchWithPaging(opts.seedUrl, fetchFn, maxPages, stats);
    var seedParsed = seedResult.parsed;
    if (seedParsed && seedParsed.resourceType === 'Bundle' && Array.isArray(seedParsed.entry)) {
      seed = resolveBundle(seedParsed).resources;
    } else if (seedParsed && seedParsed.resourceType && seedParsed.resourceType !== 'OperationOutcome') {
      seed = [seedParsed];
    }
  }

  var stagedSeed = mergeResources(seed);
  enqueueAttachments(stagedSeed, 0);

  // --- Fetch loop (sequential — orderly progress, gentle on the server) ----
  while (queue.length > 0) {
    if (stats.documentsFetched >= maxDocuments) {
      log.warn('[RecursiveDocumentFetcher] maxDocuments cap (' + maxDocuments + ') hit with ' + queue.length + ' url(s) still queued');
      break;
    }
    var item = queue.shift();
    reportProgress('fetching', item.url, item.depth);

    var parsed = null;
    try {
      var fetched = await fetchWithPaging(item.url, fetchFn, maxPages, stats);
      parsed = fetched.parsed;
      stats.documentsFetched++;
    } catch (error) {
      if (error && error.nonJson) {
        stats.documentsSkipped++;
        log.debug('[RecursiveDocumentFetcher] skipped ' + item.url + ' (' + error.message + ')');
      } else {
        stats.errors.push({ url: item.url, reason: (error && error.message) || 'fetch failed' });
        log.warn('[RecursiveDocumentFetcher] failed to fetch ' + item.url + ': ' + ((error && error.message) || error));
      }
      continue;
    }

    var batch = [];
    if (parsed && parsed.resourceType === 'Bundle' && Array.isArray(parsed.entry)) {
      // Rewrites urn:uuid intra-document refs and derives ids for id-less
      // entries — BEFORE dedupe keying, so ids are aligned at merge time.
      batch = resolveBundle(parsed).resources;
    } else if (parsed && parsed.resourceType && parsed.resourceType !== 'OperationOutcome') {
      batch = [parsed];
    }

    var staged = mergeResources(batch);
    enqueueAttachments(staged, item.depth);
  }

  reportProgress('done', null, 0);
  return { resources: resources, stats: stats };
}
