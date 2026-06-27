// npmPackages/patient-matching/lib/Deduplicator.js
//
// Deduplicator — entity resolution for FHIR resource batches at import time.
//
// Two classes of duplicate are resolved differently:
//   1. Patients          → probabilistic match via MatchingAlgorithm, clustered by
//                          confidence band (certain / probable / possible).
//   2. Everything else   → deterministic: shared business identifier (system|value),
//                          else a content fingerprint (resourceType + clinically
//                          significant fields + reconciled subject reference).
//
// `analyze()` is non-destructive (returns a plan). `reconcile()` applies a plan:
// re-points child references onto the surviving Patient, collapses duplicates,
// produces composite Patient.link merges, and emits Provenance for merged identities.
// `mergePatients()` builds a single composite from N source Patients, unioning
// non-conflicting datums and resolving conflicts (phone/address) by meta.lastUpdated.
//
// Pure JS + lodash + MatchingAlgorithm — client-safe (no Meteor imports), so the
// import page can run the whole analysis in the browser against the parsed bundle.

import { get, set, cloneDeep } from 'lodash';
import { MatchingAlgorithm } from './utils/matchingAlgorithm.js';

const MERGE_PROVENANCE_SYSTEM = 'https://honeycomb.care/fhir/merge-provenance';
const DEFAULT_PATIENT_THRESHOLD = 0.80; // 'probable' and above cluster together
const DEFAULT_MAX_PATIENTS = 750;       // O(n^2) clustering guard

// =============================================================================
// Low-level helpers
// =============================================================================

function generateId() {
  // App-runtime only (not a workflow script) — Date/Math.random are available.
  return (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
}

function nowIso() {
  return new Date().toISOString();
}

// Deterministic JSON with sorted object keys, so two structurally-equal resources
// stringify identically regardless of property insertion order.
function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  return '{' + keys.map(function(k) {
    return JSON.stringify(k) + ':' + stableStringify(value[k]);
  }).join(',') + '}';
}

// djb2 → base36. Not cryptographic; only needs to be stable + collision-resistant
// enough to bucket identical resources.
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

function lastUpdatedMillis(resource) {
  const lu = get(resource, 'meta.lastUpdated');
  if (!lu) return 0;
  const t = Date.parse(lu);
  return isNaN(t) ? 0 : t;
}

function resourceKeyCount(resource) {
  return Object.keys(resource || {}).length;
}

// Pull the bare id out of a reference string: 'Patient/123' → '123',
// 'urn:uuid:123' → '123', 'https://x/fhir/Patient/123' → '123', '123' → '123'.
function extractRefId(ref) {
  if (typeof ref !== 'string' || !ref) return null;
  if (ref.indexOf('urn:uuid:') === 0) return ref.slice('urn:uuid:'.length);
  if (ref.indexOf('/') >= 0) {
    const parts = ref.split('/');
    return parts[parts.length - 1];
  }
  return ref;
}

// Recursively re-point any { reference: 'Patient/old' } onto the survivor id.
// Only ids present in idRemap are touched (these are always merged Patient ids),
// so non-patient references are left alone. Mutates in place; bumps counter.n.
function remapReferencesInPlace(node, idRemap, counter) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach(function(child) { remapReferencesInPlace(child, idRemap, counter); });
    return;
  }
  Object.keys(node).forEach(function(key) {
    const value = node[key];
    if (key === 'reference' && typeof value === 'string') {
      const id = extractRefId(value);
      if (id && Object.prototype.hasOwnProperty.call(idRemap, id)) {
        node[key] = 'Patient/' + idRemap[id];
        counter.n++;
      }
    } else if (value && typeof value === 'object') {
      remapReferencesInPlace(value, idRemap, counter);
    }
  });
}

// Fingerprint of clinically-significant content, with volatile bookkeeping fields
// stripped and patient references reconciled, so the "same" resource exported by
// two systems (different id, different subject pointer) fingerprints identically.
function contentFingerprint(resource, idRemap) {
  const clone = cloneDeep(resource);
  delete clone._id;
  delete clone.id;
  if (clone.meta) {
    delete clone.meta.lastUpdated;
    delete clone.meta.versionId;
    delete clone.meta.source;
    if (Object.keys(clone.meta).length === 0) delete clone.meta;
  }
  if (idRemap && Object.keys(idRemap).length) {
    remapReferencesInPlace(clone, idRemap, { n: 0 });
  }
  return hashString(stableStringify(clone));
}

// Sorted system|value list of business identifiers, or '' when none.
function identifierKey(resource) {
  const ids = get(resource, 'identifier', []);
  if (!Array.isArray(ids) || ids.length === 0) return '';
  const parts = ids
    .map(function(id) {
      const system = get(id, 'system', '');
      const value = get(id, 'value', '');
      return value ? (system + '|' + value) : '';
    })
    .filter(Boolean)
    .sort();
  return parts.join(',');
}

// Identity key for a non-Patient resource. Prefers business identifier (deterministic,
// gold-standard); falls back to content fingerprint. Returns { key, reason }.
function childIdentityKey(resource, idRemap) {
  const type = get(resource, 'resourceType', 'Unknown');
  const idKey = identifierKey(resource);
  if (idKey) {
    return { key: type + '#id#' + idKey, reason: 'identifier' };
  }
  return { key: type + '#hash#' + contentFingerprint(resource, idRemap), reason: 'content' };
}

// =============================================================================
// Patient clustering (union-find over pairwise match scores)
// =============================================================================

function chooseRepresentative(members) {
  let best = members[0];
  let bestScore = -1;
  let bestKeys = -1;
  members.forEach(function(m) {
    const lu = lastUpdatedMillis(m.resource);
    const keys = resourceKeyCount(m.resource);
    if (lu > bestScore || (lu === bestScore && keys > bestKeys)) {
      best = m;
      bestScore = lu;
      bestKeys = keys;
    }
  });
  return best;
}

function detectPatientConflicts(members) {
  const conflicts = [];
  const fields = ['telecom', 'address', 'maritalStatus', 'communication', 'name'];
  fields.forEach(function(field) {
    const seen = {};
    members.forEach(function(m) {
      const value = get(m.resource, field);
      if (value !== undefined && value !== null) {
        seen[stableStringify(value)] = true;
      }
    });
    if (Object.keys(seen).length > 1) conflicts.push(field);
  });
  return conflicts;
}

// MatchingAlgorithm normalizes by the weight of every field it attempts, so fields
// absent on a patient still score 0 and drag the result down (two identical patients
// lacking identifier/address/telecom score only ~0.5). For dedup we instead compare
// only fields BOTH patients carry — missing data shouldn't penalize a match. We do
// this by zeroing the weight of any field not present on both sides for that pair.
const FIELD_PRESENCE = {
  identifier: function(p) { return (get(p, 'identifier', []) || []).length > 0; },
  name: function(p) { return (get(p, 'name', []) || []).length > 0; },
  birthDate: function(p) { return !!get(p, 'birthDate'); },
  gender: function(p) { return !!get(p, 'gender'); },
  address: function(p) { return (get(p, 'address', []) || []).length > 0; },
  telecom: function(p) { return (get(p, 'telecom', []) || []).length > 0; }
};

function pairWeights(p1, p2, baseWeights) {
  const weights = Object.assign({}, baseWeights || {});
  Object.keys(FIELD_PRESENCE).forEach(function(field) {
    const present = FIELD_PRESENCE[field](p1) && FIELD_PRESENCE[field](p2);
    if (!present) weights[field] = 0;
  });
  return weights;
}

function clusterPatients(list, indices, threshold, weights) {
  const parent = {};
  indices.forEach(function(i) { parent[i] = i; });

  function find(x) {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  }
  function union(a, b) { parent[find(a)] = find(b); }

  const pairScores = {}; // 'ia|ib' → score, for worst-link confidence
  for (let a = 0; a < indices.length; a++) {
    for (let b = a + 1; b < indices.length; b++) {
      const ia = indices[a];
      const ib = indices[b];
      const result = MatchingAlgorithm.calculateMatchScore(list[ia], list[ib], {
        weights: pairWeights(list[ia], list[ib], weights)
      });
      if (result.score >= threshold) {
        union(ia, ib);
        pairScores[ia + '|' + ib] = result.score;
        pairScores[ib + '|' + ia] = result.score;
      }
    }
  }

  const groups = {};
  indices.forEach(function(i) {
    const root = find(i);
    if (!groups[root]) groups[root] = [];
    groups[root].push(i);
  });

  return Object.keys(groups).map(function(root) {
    const memberIndices = groups[root];
    const members = memberIndices.map(function(i) {
      return { index: i, id: get(list[i], 'id') || get(list[i], '_id'), resource: list[i] };
    });
    const rep = chooseRepresentative(members);

    // Worst pairwise link within the cluster → conservative confidence.
    let minScore = 1;
    for (let a = 0; a < memberIndices.length; a++) {
      for (let b = a + 1; b < memberIndices.length; b++) {
        const s = pairScores[memberIndices[a] + '|' + memberIndices[b]];
        if (typeof s === 'number' && s < minScore) minScore = s;
      }
    }
    if (members.length < 2) minScore = 1;

    return {
      resourceType: 'Patient',
      members: members,
      size: members.length,
      representativeIndex: rep.index,
      representativeId: rep.id,
      score: minScore,
      confidence: MatchingAlgorithm.getConfidenceLevel(minScore),
      conflicts: members.length > 1 ? detectPatientConflicts(members) : []
    };
  });
}

// =============================================================================
// Non-Patient duplicate grouping
// =============================================================================

function findDuplicateGroups(list, nonPatientIndices, idRemap) {
  const buckets = {};
  nonPatientIndices.forEach(function(i) {
    const resource = list[i];
    const identity = childIdentityKey(resource, idRemap);
    if (!buckets[identity.key]) {
      buckets[identity.key] = { resourceType: get(resource, 'resourceType', 'Unknown'), reason: identity.reason, indices: [] };
    }
    buckets[identity.key].indices.push(i);
  });

  return Object.keys(buckets)
    .map(function(key) { return buckets[key]; })
    .filter(function(group) { return group.indices.length > 1; })
    .map(function(group) {
      // Keep the most recently updated member; tie → most complete.
      let keepIndex = group.indices[0];
      let bestLu = -1;
      let bestKeys = -1;
      group.indices.forEach(function(i) {
        const lu = lastUpdatedMillis(list[i]);
        const keys = resourceKeyCount(list[i]);
        if (lu > bestLu || (lu === bestLu && keys > bestKeys)) {
          keepIndex = i; bestLu = lu; bestKeys = keys;
        }
      });
      return {
        resourceType: group.resourceType,
        reason: group.reason,
        indices: group.indices,
        keepIndex: keepIndex,
        members: group.indices.map(function(i) { return { index: i, id: get(list[i], 'id') || get(list[i], '_id') }; })
      };
    });
}

// =============================================================================
// Patient merge helpers
// =============================================================================

function unionByKey(composite, field, sources, keyFn) {
  const result = (get(composite, field, []) || []).slice();
  const seen = {};
  result.forEach(function(item) { seen[keyFn(item)] = true; });
  sources.forEach(function(src) {
    (get(src, field, []) || []).forEach(function(item) {
      const k = keyFn(item);
      if (!seen[k]) { seen[k] = true; result.push(cloneDeep(item)); }
    });
  });
  if (result.length) set(composite, field, result);
}

// Conflict-aware merge for array-of-complex-value fields grouped by `systemOrKey`.
// Newest source's value per group keeps its `use`; older distinct values get use:'old'.
function mergeConflictAware(composite, field, sortedSources, groupFn, valueFn) {
  const result = [];
  const seenValues = {};   // groupKey → Set-ish of values already present
  const groupHasPrimary = {};
  sortedSources.forEach(function(src) {
    (get(src, field, []) || []).forEach(function(item) {
      const groupKey = groupFn(item);
      const valueKey = valueFn(item);
      if (!seenValues[groupKey]) seenValues[groupKey] = {};
      if (seenValues[groupKey][valueKey]) return; // exact duplicate value
      seenValues[groupKey][valueKey] = true;
      const clone = cloneDeep(item);
      if (groupHasPrimary[groupKey]) {
        clone.use = 'old';
      } else {
        groupHasPrimary[groupKey] = true;
      }
      result.push(clone);
    });
  });
  if (result.length) set(composite, field, result);
}

function buildProvenance(composite, sources, options) {
  const now = nowIso();
  return {
    resourceType: 'Provenance',
    id: generateId(),
    target: [{ reference: 'Patient/' + get(composite, 'id') }],
    recorded: now,
    occurredDateTime: now,
    activity: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-DataOperation', code: 'MERGE', display: 'merge' }]
    },
    agent: [{ who: { display: get(options, 'agentName', 'Honeycomb data-importer deduplication') } }],
    entity: sources.map(function(src) {
      const id = get(src, 'id') || get(src, '_id');
      return {
        role: 'source',
        what: {
          reference: 'Patient/' + id,
          display: get(src, 'meta.source') || get(options, 'sourceName') || 'imported record ' + id
        }
      };
    })
  };
}

// =============================================================================
// Public API
// =============================================================================

export const Deduplicator = {
  version: '0.1.0',

  // Non-destructive analysis → a plan describing duplicate clusters/groups.
  analyze: function(resources, options) {
    const opts = options || {};
    const list = Array.isArray(resources) ? resources : [];
    const patientThreshold = opts.patientThreshold != null ? opts.patientThreshold : DEFAULT_PATIENT_THRESHOLD;
    const maxPatients = opts.maxPatientsForClustering != null ? opts.maxPatientsForClustering : DEFAULT_MAX_PATIENTS;

    const byType = {};
    const nonPatientIndices = [];
    list.forEach(function(resource, i) {
      const type = get(resource, 'resourceType', 'Unknown');
      if (!byType[type]) byType[type] = [];
      byType[type].push(i);
      if (type !== 'Patient') nonPatientIndices.push(i);
    });

    const patientIndices = byType['Patient'] || [];
    let patientClusters = [];
    let clusteringSkipped = false;
    if (patientIndices.length > maxPatients) {
      clusteringSkipped = true; // too many to compare pairwise safely in the browser
    } else {
      patientClusters = clusterPatients(list, patientIndices, patientThreshold, opts.weights);
    }

    // idRemap proposal: every non-representative cluster member → representative.
    const idRemap = {};
    patientClusters.forEach(function(cluster) {
      if (cluster.size < 2) return;
      cluster.members.forEach(function(m) {
        if (m.id && m.id !== cluster.representativeId) idRemap[m.id] = cluster.representativeId;
      });
    });

    const duplicateGroups = findDuplicateGroups(list, nonPatientIndices, idRemap);

    const dupPatientClusters = patientClusters.filter(function(c) { return c.size > 1; });
    const stats = {
      total: list.length,
      byType: Object.keys(byType).reduce(function(acc, type) { acc[type] = byType[type].length; return acc; }, {}),
      patientClusters: dupPatientClusters.length,
      patientDuplicates: dupPatientClusters.reduce(function(sum, c) { return sum + (c.size - 1); }, 0),
      exactDuplicateGroups: duplicateGroups.filter(function(g) { return g.reason === 'content'; }).length,
      identifierDuplicateGroups: duplicateGroups.filter(function(g) { return g.reason === 'identifier'; }).length,
      childDuplicates: duplicateGroups.reduce(function(sum, g) { return sum + (g.indices.length - 1); }, 0),
      clusteringSkipped: clusteringSkipped
    };
    // Rough surviving-count estimate (assumes default collapse strategies).
    stats.estimatedAfterDedup = stats.total - stats.patientDuplicates - stats.childDuplicates;

    return {
      patientClusters: patientClusters,
      duplicateGroups: duplicateGroups,
      idRemap: idRemap,
      stats: stats
    };
  },

  // Build one composite Patient from N sources. Returns { patient, provenance }.
  mergePatients: function(patients, options) {
    const opts = options || {};
    const valid = (patients || []).filter(Boolean);
    if (valid.length === 0) return { patient: null, provenance: null };
    if (valid.length === 1) return { patient: cloneDeep(valid[0]), provenance: null };

    // Primary: forced representative if given, else newest.
    const newestFirst = valid.slice().sort(function(a, b) { return lastUpdatedMillis(b) - lastUpdatedMillis(a); });
    let primary = newestFirst[0];
    if (opts.representativeId) {
      const forced = valid.find(function(p) { return (get(p, 'id') || get(p, '_id')) === opts.representativeId; });
      if (forced) primary = forced;
    }
    const compositeId = opts.representativeId || get(primary, 'id') || get(primary, '_id');
    const composite = cloneDeep(primary);
    set(composite, 'id', compositeId);

    // Conflict precedence: primary first, then remaining sources newest → oldest.
    const ordered = [primary].concat(newestFirst.filter(function(p) { return p !== primary; }));

    unionByKey(composite, 'identifier', valid, function(id) {
      return get(id, 'system', '') + '|' + get(id, 'value', '');
    });
    unionByKey(composite, 'name', valid, function(name) {
      return get(name, 'use', '') + '|' + get(name, 'family', '') + '|' + (get(name, 'given', []) || []).join(' ');
    });
    mergeConflictAware(composite, 'telecom', ordered,
      function(item) { return get(item, 'system', 'unknown'); },
      function(item) { return (get(item, 'value', '') + '').replace(/\D/g, '') || get(item, 'value', ''); });
    mergeConflictAware(composite, 'address', ordered,
      function(item) { return get(item, 'use', 'home'); },
      function(item) {
        return [get(item, 'postalCode', ''), get(item, 'city', ''), (get(item, 'line', []) || []).join(' ')]
          .join('|').toLowerCase();
      });
    unionByKey(composite, 'communication', valid, function(comm) {
      return get(comm, 'language.coding.0.code', stableStringify(comm));
    });
    unionByKey(composite, 'extension', valid, function(ext) { return get(ext, 'url', stableStringify(ext)); });

    if (!get(composite, 'maritalStatus')) {
      const withMs = valid.find(function(p) { return get(p, 'maritalStatus'); });
      if (withMs) set(composite, 'maritalStatus', cloneDeep(get(withMs, 'maritalStatus')));
    }

    // Patient.link — composite 'replaces' each source identity.
    const links = (get(composite, 'link', []) || []).slice();
    const linkSeen = {};
    links.forEach(function(l) { linkSeen[get(l, 'other.reference', '')] = true; });
    valid.forEach(function(src) {
      const sid = get(src, 'id') || get(src, '_id');
      const ref = 'Patient/' + sid;
      if (sid && sid !== compositeId && !linkSeen[ref]) {
        linkSeen[ref] = true;
        links.push({ other: { reference: ref }, type: 'replaces' });
      }
    });
    if (links.length) set(composite, 'link', links);

    // Merge marker tag (fallback provenance when Provenance can't be persisted).
    const tags = (get(composite, 'meta.tag', []) || []).slice();
    tags.push({ system: MERGE_PROVENANCE_SYSTEM, code: 'merged', display: 'Composite of ' + valid.length + ' source records' });
    set(composite, 'meta.tag', tags);

    return { patient: composite, provenance: buildProvenance(composite, valid, opts) };
  },

  // Apply a plan → { resources, provenance, summary, idRemap }. Non-mutating on input.
  reconcile: function(resources, plan) {
    const self = this;
    const opts = plan || {};
    const list = Array.isArray(resources) ? resources : [];
    const analysis = opts.analysis || self.analyze(list, opts);

    const patientStrategy = opts.patientStrategy || 'merge';      // merge | keep-newest | keep-all
    const clusterStrategies = opts.clusterStrategies || {};        // representativeId → strategy override
    const collapseExact = opts.collapseExact !== false;            // collapse reason='content' groups
    const dedupeByIdentifier = opts.dedupeChildrenByIdentifier !== false; // collapse reason='identifier'
    const versioning = opts.versioning || {};                      // resourceType → 'versioned'|'no-version'

    const cloned = list.map(cloneDeep);
    const dropIndices = {};
    const addResources = [];
    const provenanceResources = [];
    const summary = {
      patientsMerged: 0, patientClustersResolved: 0, duplicatesCollapsed: 0,
      versionedKept: 0, referencesRepointed: 0, provenanceCreated: 0
    };

    // 1. Effective idRemap — only for clusters that actually collapse/merge.
    const idRemap = {};
    if (patientStrategy !== 'keep-all') {
      analysis.patientClusters.forEach(function(cluster) {
        if (cluster.size < 2) return;
        const strat = clusterStrategies[cluster.representativeId] || patientStrategy;
        if (strat === 'keep-all') return;
        cluster.members.forEach(function(m) {
          if (m.id && m.id !== cluster.representativeId) idRemap[m.id] = cluster.representativeId;
        });
      });
    }

    // 2. Re-point child references onto survivors.
    const counter = { n: 0 };
    cloned.forEach(function(r) { remapReferencesInPlace(r, idRemap, counter); });
    summary.referencesRepointed = counter.n;

    // 3. Resolve patient clusters.
    analysis.patientClusters.forEach(function(cluster) {
      if (cluster.size < 2) return;
      const strat = clusterStrategies[cluster.representativeId] || patientStrategy;
      if (strat === 'keep-all') return;

      if (strat === 'merge') {
        const memberResources = cluster.members.map(function(m) { return cloned[m.index]; });
        const merged = self.mergePatients(memberResources, {
          representativeId: cluster.representativeId,
          sourceName: opts.sourceName,
          agentName: opts.agentName
        });
        cluster.members.forEach(function(m) { dropIndices[m.index] = true; });
        if (merged.patient) addResources.push(merged.patient);
        if (merged.provenance) { provenanceResources.push(merged.provenance); summary.provenanceCreated++; }
        summary.patientsMerged += cluster.size;
      } else { // keep-newest
        cluster.members.forEach(function(m) {
          if (m.index !== cluster.representativeIndex) dropIndices[m.index] = true;
        });
      }
      summary.patientClustersResolved++;
    });

    // 4. Resolve non-Patient duplicate groups.
    analysis.duplicateGroups.forEach(function(group) {
      const shouldCollapse = group.reason === 'content' ? collapseExact : dedupeByIdentifier;
      if (!shouldCollapse) return;

      const isVersioned = versioning[group.resourceType] === 'versioned';
      if (isVersioned && group.reason === 'identifier') {
        // Same business identity, differing content → legitimate version history.
        // Unify ids and stamp ascending meta.versionId instead of collapsing.
        const ordered = group.indices.slice().sort(function(a, b) {
          return lastUpdatedMillis(cloned[a]) - lastUpdatedMillis(cloned[b]);
        });
        const survivingId = get(cloned[group.keepIndex], 'id') || get(cloned[group.keepIndex], '_id');
        ordered.forEach(function(idx, version) {
          if (survivingId) set(cloned[idx], 'id', survivingId);
          set(cloned[idx], 'meta.versionId', String(version + 1));
        });
        summary.versionedKept += ordered.length;
        return;
      }

      // Collapse: keep one, drop the rest.
      group.indices.forEach(function(i) {
        if (i !== group.keepIndex) { dropIndices[i] = true; summary.duplicatesCollapsed++; }
      });
    });

    // 5. Assemble.
    const result = [];
    cloned.forEach(function(r, i) { if (!dropIndices[i]) result.push(r); });
    addResources.forEach(function(r) { result.push(r); });
    provenanceResources.forEach(function(r) { result.push(r); });

    return { resources: result, provenance: provenanceResources, summary: summary, idRemap: idRemap };
  }
};

export default Deduplicator;
