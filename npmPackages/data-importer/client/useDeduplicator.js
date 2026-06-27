// npmPackages/data-importer/client/useDeduplicator.js
//
// Feature-detect bridge to @node-on-fhir/patient-matching. The data-importer does
// NOT depend on patient-matching (it's optional) — so we never static-import it.
// Instead we read the runtime Package registry that the workflow client-loader
// populates (`Package['@node-on-fhir/patient-matching'] = module.default || module`,
// per .claude/rules/fhir/package-registry.md). The Deduplicator lives on that
// default-export object.

import { get } from 'lodash';

// Returns the Deduplicator object, or null when patient-matching isn't loaded.
export function getDeduplicator() {
  var registry = (typeof Package !== 'undefined' && Package) ||
    (typeof globalThis !== 'undefined' && globalThis.Package) || null;
  if (!registry) return null;
  var mod = registry['@node-on-fhir/patient-matching'];
  if (!mod) return null;
  // Could be the default-export object or the namespace, depending on loader form.
  return get(mod, 'Deduplicator', null) || get(mod, 'default.Deduplicator', null);
}

export function isDeduplicationAvailable() {
  return !!getDeduplicator();
}

// Run analysis over a parsed resource list. Returns the analysis plan, or null when
// dedup isn't available. Synchronous + pure (browser-side), so safe to call inline.
export function analyzeResources(resources, options) {
  var deduplicator = getDeduplicator();
  if (!deduplicator) return null;
  try {
    return deduplicator.analyze(resources || [], options || {});
  } catch (error) {
    console.error('[data-importer] Deduplicator.analyze failed:', error);
    return null;
  }
}

// Apply a reconcile plan over a resource list. Returns { resources, provenance,
// summary, idRemap }, or a passthrough { resources } when dedup isn't available.
export function reconcileResources(resources, plan) {
  var deduplicator = getDeduplicator();
  if (!deduplicator) return { resources: resources || [], provenance: [], summary: {}, idRemap: {} };
  try {
    return deduplicator.reconcile(resources || [], plan || {});
  } catch (error) {
    console.error('[data-importer] Deduplicator.reconcile failed:', error);
    return { resources: resources || [], provenance: [], summary: {}, idRemap: {} };
  }
}

// Fetch the server's per-resource-type versioning mode from the CapabilityStatement
// (the safe, client-visible source — private settings never reach the client).
// Resolves to { resourceType: 'versioned' | 'no-version', ... }.
export function fetchVersioningModes() {
  return fetch('/metadata', { headers: { Accept: 'application/fhir+json' } })
    .then(function(response) {
      if (!response.ok) throw new Error('metadata ' + response.status);
      return response.json();
    })
    .then(function(capabilityStatement) {
      var modes = {};
      var rest = get(capabilityStatement, 'rest', []);
      rest.forEach(function(restEntry) {
        get(restEntry, 'resource', []).forEach(function(resource) {
          var type = get(resource, 'type');
          if (type) modes[type] = get(resource, 'versioning', 'no-version');
        });
      });
      return modes;
    })
    .catch(function(error) {
      console.warn('[data-importer] Could not fetch versioning modes from /metadata:', error);
      return {};
    });
}
