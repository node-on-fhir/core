// npmPackages/data-importer/lib/RecursiveDocumentFetcher.test.mjs
// Run with: node --test npmPackages/data-importer/lib/RecursiveDocumentFetcher.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractAttachmentUrls,
  resolveAttachmentUrl,
  resourceKey,
  isJsonish,
  stableStringify,
  recursivelyFetchDocuments as recursivelyFetchDocumentsRaw
} from './RecursiveDocumentFetcher.mjs';
import { resolveBundleReferences } from './BundleReferenceResolver.js';

const BASE = 'https://fhir.example.org/baseR4';

// Quiet logger for tests
const silentLog = { debug() {}, info() {}, warn() {}, error() {} };

// The walker takes resolveBundle by injection (it must stay require-free for
// the rspack client bundle); bake it in for every test.
function recursivelyFetchDocuments(options) {
  return recursivelyFetchDocumentsRaw(Object.assign({ resolveBundle: resolveBundleReferences }, options));
}

function jsonResponse(body, contentType) {
  return {
    status: 200,
    headers: { get: function() { return contentType || 'application/fhir+json'; } },
    text: async function() { return typeof body === 'string' ? body : JSON.stringify(body); }
  };
}

function makeFetchStub(routes) {
  const calls = [];
  const fetchFn = async function(url) {
    calls.push(url);
    if (Object.prototype.hasOwnProperty.call(routes, url)) {
      const entry = routes[url];
      return typeof entry === 'function' ? entry() : jsonResponse(entry);
    }
    return { status: 404, headers: { get: function() { return 'application/json'; } }, text: async function() { return '{}'; } };
  };
  fetchFn.calls = calls;
  return fetchFn;
}

function docRef(id, url, contentType) {
  return {
    resourceType: 'DocumentReference',
    id: id,
    content: [{ attachment: { url: url, contentType: contentType || 'application/fhir+json' } }]
  };
}

function collectionBundle(resources) {
  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: resources.map(function(r) { return { resource: r }; })
  };
}

// ---------------------------------------------------------------------------
// URL resolution
// ---------------------------------------------------------------------------

test('resolveAttachmentUrl: absolute http(s) passes through', () => {
  assert.equal(resolveAttachmentUrl('https://other.org/fhir/Bundle/1', BASE), 'https://other.org/fhir/Bundle/1');
});

test('resolveAttachmentUrl: relative reference resolves against the FHIR base (last segment kept)', () => {
  assert.equal(resolveAttachmentUrl('Composition/123', BASE), BASE + '/Composition/123');
  assert.equal(resolveAttachmentUrl('Bundle/abc', BASE + '/'), BASE + '/Bundle/abc');
});

test('resolveAttachmentUrl: site-absolute path resolves against the base origin', () => {
  assert.equal(resolveAttachmentUrl('/gridfs/file-1', BASE), 'https://fhir.example.org/gridfs/file-1');
});

test('resolveAttachmentUrl: urn: and data: urls are skipped', () => {
  assert.equal(resolveAttachmentUrl('urn:uuid:1234', BASE), null);
  assert.equal(resolveAttachmentUrl('data:application/json;base64,e30=', BASE), null);
});

test('resolveAttachmentUrl: relative url with no base is skipped', () => {
  assert.equal(resolveAttachmentUrl('Composition/123', ''), null);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

test('extractAttachmentUrls: all content entries considered, missing urls skipped', () => {
  const resources = [
    {
      resourceType: 'DocumentReference',
      id: 'multi',
      content: [
        { attachment: { url: 'Bundle/a', contentType: 'application/fhir+json' } },
        { attachment: { contentType: 'application/pdf' } },
        { attachment: { url: 'Bundle/b', contentType: 'application/pdf' } }
      ]
    },
    { resourceType: 'Patient', id: 'p1' }
  ];
  const urls = extractAttachmentUrls(resources);
  assert.deepEqual(urls.map(u => u.url), ['Bundle/a', 'Bundle/b']);
});

test('resourceKey and stableStringify basics', () => {
  assert.equal(resourceKey({ resourceType: 'Patient', id: '1' }), 'Patient/1');
  assert.equal(resourceKey({ resourceType: 'Patient' }), null);
  assert.equal(stableStringify({ b: 1, a: [2, 1] }), stableStringify({ a: [2, 1], b: 1 }));
  assert.notEqual(stableStringify({ a: [1, 2] }), stableStringify({ a: [2, 1] }));
});

test('isJsonish: json-ish and sniffable types pass, binary types fail', () => {
  assert.equal(isJsonish('application/fhir+json'), true);
  assert.equal(isJsonish('application/json; charset=utf-8'), true);
  assert.equal(isJsonish(undefined), true);
  assert.equal(isJsonish('application/octet-stream'), true);
  assert.equal(isJsonish('application/pdf'), false);
  assert.equal(isJsonish('image/jpeg'), false);
});

// ---------------------------------------------------------------------------
// Walker
// ---------------------------------------------------------------------------

test('walker: follows attachment url from seed resources and stages fetched bundle', async () => {
  const fetchFn = makeFetchStub({
    [BASE + '/Bundle/toc']: collectionBundle([
      { resourceType: 'Condition', id: 'c1' },
      { resourceType: 'CarePlan', id: 'cp1' }
    ])
  });
  const result = await recursivelyFetchDocuments({
    seedResources: [docRef('d1', 'Bundle/toc'), { resourceType: 'Patient', id: 'p1' }],
    fetchBase: BASE,
    fetchFn,
    log: silentLog
  });
  assert.equal(result.stats.documentsFetched, 1);
  assert.deepEqual(
    result.resources.map(r => resourceKey(r)).sort(),
    ['CarePlan/cp1', 'Condition/c1', 'DocumentReference/d1', 'Patient/p1']
  );
});

test('walker: seeds from seedUrl when seedResources is empty', async () => {
  const fetchFn = makeFetchStub({
    [BASE + '/Patient/553/$everything?_count=200']: collectionBundle([
      { resourceType: 'Patient', id: '553' },
      docRef('d1', 'Bundle/toc')
    ]),
    [BASE + '/Bundle/toc']: collectionBundle([{ resourceType: 'Condition', id: 'c1' }])
  });
  const result = await recursivelyFetchDocuments({
    seedResources: [],
    seedUrl: BASE + '/Patient/553/$everything?_count=200',
    fetchBase: BASE,
    fetchFn,
    log: silentLog
  });
  assert.equal(result.resources.length, 3);
  assert.equal(result.stats.documentsFetched, 1); // seed fetch isn't a "document"
});

test('walker: true recursion — DocumentReference inside fetched bundle is followed', async () => {
  const fetchFn = makeFetchStub({
    [BASE + '/Bundle/level1']: collectionBundle([docRef('d2', 'Bundle/level2')]),
    [BASE + '/Bundle/level2']: collectionBundle([{ resourceType: 'Observation', id: 'o1' }])
  });
  const result = await recursivelyFetchDocuments({
    seedResources: [docRef('d1', 'Bundle/level1')],
    fetchBase: BASE,
    fetchFn,
    log: silentLog
  });
  assert.equal(result.stats.documentsFetched, 2);
  assert.ok(result.resources.some(r => resourceKey(r) === 'Observation/o1'));
});

test('walker: cycle guard — A references B references A, each fetched once', async () => {
  const fetchFn = makeFetchStub({
    [BASE + '/Bundle/a']: collectionBundle([docRef('db', 'Bundle/b')]),
    [BASE + '/Bundle/b']: collectionBundle([docRef('da', 'Bundle/a')])
  });
  const result = await recursivelyFetchDocuments({
    seedResources: [docRef('seed', 'Bundle/a')],
    fetchBase: BASE,
    fetchFn,
    log: silentLog,
    maxDepth: 10
  });
  assert.equal(result.stats.documentsFetched, 2);
  assert.equal(fetchFn.calls.filter(u => u === BASE + '/Bundle/a').length, 1);
});

test('walker: depth cap stops recursion', async () => {
  const fetchFn = makeFetchStub({
    [BASE + '/Bundle/1']: collectionBundle([docRef('d2', 'Bundle/2')]),
    [BASE + '/Bundle/2']: collectionBundle([docRef('d3', 'Bundle/3')]),
    [BASE + '/Bundle/3']: collectionBundle([{ resourceType: 'Observation', id: 'deep' }])
  });
  const result = await recursivelyFetchDocuments({
    seedResources: [docRef('d1', 'Bundle/1')],
    fetchBase: BASE,
    fetchFn,
    log: silentLog,
    maxDepth: 2
  });
  // depth 0 seed → enqueue Bundle/1 (d1) → fetched at depth 1 → enqueue Bundle/2
  // at depth 2 → fetched → its docRef d3 is NOT enqueued (depth >= maxDepth)
  assert.equal(result.stats.documentsFetched, 2);
  assert.ok(!result.resources.some(r => resourceKey(r) === 'Observation/deep'));
});

test('walker: exact duplicates suppressed, id collisions staged as both copies', async () => {
  const conditionV1 = { resourceType: 'Condition', id: 'c1', clinicalStatus: { text: 'active' } };
  const conditionV1Copy = { clinicalStatus: { text: 'active' }, resourceType: 'Condition', id: 'c1' }; // key order shuffled
  const conditionV2 = { resourceType: 'Condition', id: 'c1', clinicalStatus: { text: 'resolved' } };
  const fetchFn = makeFetchStub({
    [BASE + '/Bundle/toc']: collectionBundle([conditionV1Copy, conditionV2])
  });
  const result = await recursivelyFetchDocuments({
    seedResources: [conditionV1, docRef('d1', 'Bundle/toc')],
    fetchBase: BASE,
    fetchFn,
    log: silentLog
  });
  assert.equal(result.stats.duplicatesSuppressed, 1);   // conditionV1Copy
  assert.equal(result.stats.idCollisionsStaged, 1);      // conditionV2
  const conditionCopies = result.resources.filter(r => resourceKey(r) === 'Condition/c1');
  assert.equal(conditionCopies.length, 2);               // both copies staged
});

test('walker: resources without id are always staged', async () => {
  const fetchFn = makeFetchStub({});
  const result = await recursivelyFetchDocuments({
    seedResources: [
      { resourceType: 'Observation' },
      { resourceType: 'Observation' }
    ],
    fetchBase: BASE,
    fetchFn,
    log: silentLog
  });
  assert.equal(result.resources.length, 2);
});

test('walker: non-JSON attachment skipped by declared contentType (no network call)', async () => {
  const fetchFn = makeFetchStub({});
  const result = await recursivelyFetchDocuments({
    seedResources: [docRef('d1', 'Binary/pdf-1', 'application/pdf')],
    fetchBase: BASE,
    fetchFn,
    log: silentLog
  });
  assert.equal(fetchFn.calls.length, 0);
  assert.equal(result.stats.documentsSkipped, 1);
});

test('walker: fetch failure recorded as error, run continues', async () => {
  const fetchFn = makeFetchStub({
    [BASE + '/Bundle/good']: collectionBundle([{ resourceType: 'Condition', id: 'c1' }])
    // Bundle/bad is unrouted → 404
  });
  const result = await recursivelyFetchDocuments({
    seedResources: [docRef('d1', 'Bundle/bad'), docRef('d2', 'Bundle/good')],
    fetchBase: BASE,
    fetchFn,
    log: silentLog
  });
  assert.equal(result.stats.errors.length, 1);
  assert.match(result.stats.errors[0].reason, /HTTP 404/);
  assert.ok(result.resources.some(r => resourceKey(r) === 'Condition/c1'));
});

test('walker: non-JSON response body skipped without aborting', async () => {
  const fetchFn = makeFetchStub({
    [BASE + '/Bundle/pdfish']: () => jsonResponse('%PDF-1.4 not json', 'application/pdf')
  });
  const result = await recursivelyFetchDocuments({
    // declared contentType is json-ish, so the fetch is attempted; response
    // header + body reveal a PDF → skip, not error
    seedResources: [docRef('d1', 'Bundle/pdfish', 'application/fhir+json')],
    fetchBase: BASE,
    fetchFn,
    log: silentLog
  });
  assert.equal(result.stats.errors.length, 0);
  assert.equal(result.stats.documentsSkipped, 1);
});

test('walker: urn:uuid document bundle gets references resolved before staging', async () => {
  const documentBundle = {
    resourceType: 'Bundle',
    type: 'document',
    entry: [
      {
        fullUrl: 'urn:uuid:comp-1',
        resource: {
          resourceType: 'Composition',
          id: 'comp-real-id',
          subject: { reference: 'urn:uuid:pat-1' }
        }
      },
      {
        fullUrl: 'urn:uuid:pat-1',
        resource: { resourceType: 'Patient', id: 'patient-real-id' }
      }
    ]
  };
  const fetchFn = makeFetchStub({ [BASE + '/Bundle/doc']: documentBundle });
  const result = await recursivelyFetchDocuments({
    seedResources: [docRef('d1', 'Bundle/doc')],
    fetchBase: BASE,
    fetchFn,
    log: silentLog
  });
  const composition = result.resources.find(r => resourceKey(r) === 'Composition/comp-real-id');
  assert.equal(composition.subject.reference, 'Patient/patient-real-id');
});

test('walker: maxDocuments cap halts the queue', async () => {
  const routes = {};
  const seeds = [];
  for (let i = 0; i < 5; i++) {
    routes[BASE + '/Bundle/b' + i] = collectionBundle([{ resourceType: 'Observation', id: 'o' + i }]);
    seeds.push(docRef('d' + i, 'Bundle/b' + i));
  }
  const fetchFn = makeFetchStub(routes);
  const result = await recursivelyFetchDocuments({
    seedResources: seeds,
    fetchBase: BASE,
    fetchFn,
    log: silentLog,
    maxDocuments: 2
  });
  assert.equal(result.stats.documentsFetched, 2);
});

test('walker: follows link[relation=next] paging within a fetched bundle', async () => {
  const page2Url = BASE + '/Bundle/toc?page=2';
  const fetchFn = makeFetchStub({
    [BASE + '/Bundle/toc']: {
      resourceType: 'Bundle',
      type: 'searchset',
      link: [{ relation: 'next', url: page2Url }],
      entry: [{ resource: { resourceType: 'Condition', id: 'c1' } }]
    },
    [page2Url]: {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{ resource: { resourceType: 'Condition', id: 'c2' } }]
    }
  });
  const result = await recursivelyFetchDocuments({
    seedResources: [docRef('d1', 'Bundle/toc')],
    fetchBase: BASE,
    fetchFn,
    log: silentLog
  });
  assert.ok(result.resources.some(r => resourceKey(r) === 'Condition/c1'));
  assert.ok(result.resources.some(r => resourceKey(r) === 'Condition/c2'));
  assert.equal(result.stats.documentsFetched, 1);
});

test('walker: onProgress reports fetched/queued counts', async () => {
  const fetchFn = makeFetchStub({
    [BASE + '/Bundle/a']: collectionBundle([{ resourceType: 'Condition', id: 'c1' }]),
    [BASE + '/Bundle/b']: collectionBundle([{ resourceType: 'Condition', id: 'c2' }])
  });
  const events = [];
  await recursivelyFetchDocuments({
    seedResources: [docRef('d1', 'Bundle/a'), docRef('d2', 'Bundle/b')],
    fetchBase: BASE,
    fetchFn,
    log: silentLog,
    onProgress: function(p) { events.push(p); }
  });
  assert.ok(events.some(e => e.phase === 'fetching'));
  assert.equal(events[events.length - 1].phase, 'done');
  assert.equal(events[events.length - 1].fetched, 2);
});
