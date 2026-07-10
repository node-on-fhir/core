// npmPackages/data-importer/lib/BundleReferenceResolver.js
//
// Resolves intra-Bundle references in self-contained (document) Bundles.
//
// Per FHIR R4 bundle rules (https://hl7.org/fhir/R4/bundle.html#references),
// `entry.fullUrl` — not `resource.id` — is the resolution key inside a Bundle,
// and the two deliberately need not align: a document bundle typically carries
// `fullUrl: "urn:uuid:..."` while each resource keeps the logical id it had on
// the source server. Honeycomb stores resources individually and filters by
// relative references ("Patient/<id>"), so at import time every reference that
// points at another entry's fullUrl is rewritten to that entry's
// "ResourceType/id" form. References that don't resolve within the bundle are
// left untouched (permissive-in philosophy), as are non-reference URI fields
// (e.g. QuestionnaireResponse.questionnaire is a canonical, not a Reference).
//
// Isomorphic AND dependency-free: the CI lib-test tier runs `node --test`
// straight off a bare checkout (no npm install), so this file may not require
// anything — not even lodash. CommonJS because the package has no
// "type": "module" (plain Node classifies .js as CJS; ESM syntax here breaks
// the .test.mjs named imports); the ESM import sites interop fine.

// Shallow guarded read — the local stand-in for lodash.get(obj, key).
function prop(obj, key) {
  return (obj && typeof obj === 'object') ? obj[key] : undefined;
}

// Derive a usable logical id from a fullUrl when the resource carries none:
// 'urn:uuid:<uuid>' → '<uuid>'; otherwise the trailing URL segment.
function idFromFullUrl(fullUrl) {
  if (typeof fullUrl !== 'string' || !fullUrl) return null;
  if (fullUrl.indexOf('urn:uuid:') === 0) return fullUrl.slice('urn:uuid:'.length);
  const parts = fullUrl.split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
}

// Build { fullUrl: 'ResourceType/id' } over a bundle's entries. Entries whose
// resource has no id get one derived from the fullUrl (mutated in place, so the
// stored resource and the index agree).
function buildFullUrlIndex(bundle) {
  const index = {};
  const entries = Array.isArray(prop(bundle, 'entry')) ? bundle.entry : [];
  entries.forEach(function(entry) {
    const fullUrl = prop(entry, 'fullUrl');
    const resource = prop(entry, 'resource');
    const resourceType = prop(resource, 'resourceType');
    if (!fullUrl || !resourceType) return;
    if (!resource.id) {
      const derived = idFromFullUrl(fullUrl);
      if (!derived) return;
      resource.id = derived;
    }
    index[fullUrl] = resourceType + '/' + resource.id;
  });
  return index;
}

// Recursively rewrite any { reference: <string> } whose value exactly matches
// an indexed fullUrl. Mutates in place; bumps counter.n per rewrite. Only the
// `reference` key is touched — display strings, canonicals, and identifiers
// pass through unchanged.
function resolveReferencesInPlace(node, index, counter) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach(function(child) { resolveReferencesInPlace(child, index, counter); });
    return;
  }
  Object.keys(node).forEach(function(key) {
    const value = node[key];
    if (key === 'reference' && typeof value === 'string') {
      if (Object.prototype.hasOwnProperty.call(index, value)) {
        node[key] = index[value];
        counter.n++;
      }
    } else if (value && typeof value === 'object') {
      resolveReferencesInPlace(value, index, counter);
    }
  });
}

// Resolve a whole bundle: index its fullUrls, rewrite every entry's references,
// and return the flattened resource list. Safe no-op for bundles without
// fullUrls (searchset pages, synthesized collection bundles) — resolvedCount
// is 0 and resources come back as-is. Mutates the passed bundle's resources.
function resolveBundleReferences(bundle) {
  const entries = Array.isArray(prop(bundle, 'entry')) ? bundle.entry : [];
  const resources = entries
    .map(function(entry) { return prop(entry, 'resource'); })
    .filter(Boolean);

  const index = buildFullUrlIndex(bundle);
  const counter = { n: 0 };
  if (Object.keys(index).length > 0) {
    resources.forEach(function(resource) { resolveReferencesInPlace(resource, index, counter); });
  }

  return { resources: resources, resolvedCount: counter.n };
}

module.exports = { buildFullUrlIndex, resolveReferencesInPlace, resolveBundleReferences };
