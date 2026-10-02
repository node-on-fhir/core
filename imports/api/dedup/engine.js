// imports/api/dedup/engine.js
//
// Server-side dedup orchestration over the live database. The entity-
// resolution MATH lives in @node-on-fhir/patient-matching's Deduplicator
// (union-find patient clustering, identifier/content-fingerprint grouping);
// this module owns everything the pure library cannot: loading scoped
// candidate sets from Mongo, stripping import-run provenance tags before
// fingerprinting (identical resources from different runs must group), finding
// and re-pointing inbound references, applying deletions, and emitting
// Provenance.
//
// The Deduplicator lib is imported STATICALLY (not feature-detected via the
// Package registry like UI consumers do): patient-matching is tracked in this
// monorepo so the workspace symlink always exists, the lib subpath is pure JS
// with zero Meteor imports or side effects, and a static import works whether
// or not the patient-matching WORKFLOW is enabled — while a runtime
// Npm.require of an ESM file would die in Meteor's patched loader.
//
// analyze is non-destructive; applyReconcile deletes and is only reachable
// through the settings-gated dedup.reconcile method (methods.js).

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get, cloneDeep } from 'lodash';

import { Deduplicator } from '@node-on-fhir/patient-matching/lib/Deduplicator';
import { findSimilarPairs } from '@node-on-fhir/patient-matching/lib/resourceSimilarity';
import ImportRunTags from '/imports/lib/importRunTags.js';
import { REFERENCE_PATHS } from './referencePaths.js';

const log = Meteor.Logger ? Meteor.Logger.for('dedup') : console;

const DEFAULT_SCOPE_LIMIT = 5000;

// ---------------------------------------------------------------------------
// Collection resolution
// ---------------------------------------------------------------------------

// global.Collections keys are plural ('MolecularSequences'); scopes name the
// FHIR resourceType ('MolecularSequence'). Resolve either spelling.
function resolveCollection(nameOrType) {
  const Collections = global.Collections || {};
  if (Collections[nameOrType]) {
    return { name: nameOrType, collection: Collections[nameOrType] };
  }
  const candidates = [nameOrType + 's', nameOrType + 'es'];
  for (const candidate of candidates) {
    if (Collections[candidate]) {
      return { name: candidate, collection: Collections[candidate] };
    }
  }
  return null;
}

function eachFhirCollection(callback) {
  const Collections = global.Collections || {};
  Object.keys(Collections).forEach(function(name) {
    const collection = Collections[name];
    if (collection && typeof collection.find === 'function') {
      callback(name, collection);
    }
  });
}

// ---------------------------------------------------------------------------
// Sanitization — the cross-run fingerprint fix
// ---------------------------------------------------------------------------

// Deduplicator.contentFingerprint strips meta.lastUpdated/versionId/source but
// NOT meta.tag, so two identical resources stamped by different import runs
// fingerprint differently. Strip the provenance tag systems (run + type)
// before analysis; other tags (security labels, merge markers) are kept —
// they are content.
export function sanitizeForDedup(doc) {
  const clone = cloneDeep(doc);
  const tags = get(clone, 'meta.tag');
  if (Array.isArray(tags)) {
    const kept = tags.filter(function(tag) {
      return tag
        && tag.system !== ImportRunTags.IMPORT_RUN_TAG_SYSTEM
        && tag.system !== ImportRunTags.IMPORT_TYPE_TAG_SYSTEM;
    });
    if (kept.length > 0) {
      clone.meta.tag = kept;
    } else {
      delete clone.meta.tag;
      if (Object.keys(clone.meta).length === 0) {
        delete clone.meta;
      }
    }
  }
  return clone;
}

// ---------------------------------------------------------------------------
// Scope loading
// ---------------------------------------------------------------------------

// Load the candidate set for a scope. Returns { entries, truncated } where
// entries = [{ collectionName, doc }] and doc is the RAW stored document
// (sanitization happens at analysis time; apply needs the raw _id).
export async function loadScope(scope, options) {
  const limit = get(options, 'limit', DEFAULT_SCOPE_LIMIT);
  const entries = [];
  let truncated = false;

  async function collect(collectionName, collection, selector) {
    const remaining = limit - entries.length;
    if (remaining <= 0) {
      truncated = true;
      return;
    }
    const docs = await collection.find(selector, { limit: remaining + 1 }).fetchAsync();
    docs.slice(0, remaining).forEach(function(doc) {
      entries.push({ collectionName: collectionName, doc: doc });
    });
    if (docs.length > remaining) {
      truncated = true;
    }
  }

  const kind = get(scope, 'kind');
  if (kind === 'collection') {
    const resolved = resolveCollection(get(scope, 'resourceType', ''));
    if (!resolved) {
      throw new Meteor.Error('unknown-collection',
        'No collection found for resourceType ' + get(scope, 'resourceType'));
    }
    await collect(resolved.name, resolved.collection, {});
  } else if (kind === 'patient') {
    const patientId = get(scope, 'patientId');
    if (!patientId) {
      throw new Meteor.Error('missing-param', 'patient scope requires patientId');
    }
    const patientRef = 'Patient/' + patientId;
    const collections = [];
    eachFhirCollection(function(name, collection) { collections.push({ name: name, collection: collection }); });
    for (const entry of collections) {
      if (entry.name === 'Patients') { continue; }
      await collect(entry.name, entry.collection, {
        $or: [
          { 'subject.reference': patientRef },
          { 'patient.reference': patientRef }
        ]
      });
    }
  } else if (kind === 'importRun') {
    const importRunId = get(scope, 'importRunId');
    if (!importRunId) {
      throw new Meteor.Error('missing-param', 'importRun scope requires importRunId');
    }
    const selector = ImportRunTags.importRunTagQuery(importRunId);
    const collections = [];
    eachFhirCollection(function(name, collection) { collections.push({ name: name, collection: collection }); });
    for (const entry of collections) {
      await collect(entry.name, entry.collection, selector);
    }
  } else {
    throw new Meteor.Error('unknown-scope', 'scope.kind must be patient, collection, or importRun');
  }

  return { entries: entries, truncated: truncated };
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

// Load a scope, sanitize, run Deduplicator.analyze, and rehydrate group
// members back onto the stored docs. Returns
// { entries, analysis, duplicateGroups, patientClusters, fuzzyCandidates, stats }.
// duplicateGroups members carry { collectionName, _id, doc } so applyReconcile
// (and callers) never need the analysis index space.
//
// options.fuzzy === true additionally runs the weighted per-resource-type
// similarity scoring (PHR IG algorithm — resourceSimilarity.js) over the
// sanitized candidates and reports pairs clearing their profile threshold as
// fuzzyCandidates. REPORT-ONLY: applyReconcile never touches them — a fuzzy
// pair is a suggestion for human review, same safety posture as probabilistic
// patient clusters.
export async function analyzeScope(scope, options) {
  const loaded = await loadScope(scope, options);
  const sanitized = loaded.entries.map(function(entry) { return sanitizeForDedup(entry.doc); });

  const analysis = Deduplicator.analyze(sanitized, {
    patientThreshold: get(options, 'patientThreshold'),
    maxPatientsForClustering: get(options, 'maxPatientsForClustering'),
    weights: get(options, 'weights'),
    normalizeIdentifiers: get(options, 'normalizeIdentifiers') === true
  });

  function hydrate(index) {
    const entry = loaded.entries[index];
    return { collectionName: entry.collectionName, _id: entry.doc._id, doc: entry.doc };
  }

  const duplicateGroups = analysis.duplicateGroups.map(function(group) {
    return {
      resourceType: group.resourceType,
      reason: group.reason,
      keep: hydrate(group.keepIndex),
      members: group.indices.map(hydrate)
    };
  });

  const patientClusters = analysis.patientClusters
    .filter(function(cluster) { return cluster.size > 1; })
    .map(function(cluster) {
      return {
        representativeId: cluster.representativeId,
        score: cluster.score,
        confidence: cluster.confidence,
        conflicts: cluster.conflicts,
        members: cluster.members.map(function(m) { return hydrate(m.index); })
      };
    });

  // Optional fuzzy pass. Pairs already grouped deterministically (identifier
  // or exact fingerprint) are certainties, not candidates — exclude them.
  let fuzzyCandidates = [];
  const stats = Object.assign({}, analysis.stats, { scopeTruncated: loaded.truncated });
  if (get(options, 'fuzzy') === true) {
    const groupedTogether = {};
    analysis.duplicateGroups.forEach(function(group) {
      for (let a = 0; a < group.indices.length; a++) {
        for (let b = a + 1; b < group.indices.length; b++) {
          const lo = Math.min(group.indices[a], group.indices[b]);
          const hi = Math.max(group.indices[a], group.indices[b]);
          groupedTogether[lo + '|' + hi] = true;
        }
      }
    });

    const fuzzy = findSimilarPairs(sanitized, {
      threshold: get(options, 'fuzzyThreshold'),
      maxComparisons: get(options, 'fuzzyMaxComparisons')
    });
    fuzzyCandidates = fuzzy.pairs
      .filter(function(pair) {
        const lo = Math.min(pair.aIndex, pair.bIndex);
        const hi = Math.max(pair.aIndex, pair.bIndex);
        return !groupedTogether[lo + '|' + hi];
      })
      .map(function(pair) {
        return {
          resourceType: pair.resourceType,
          score: pair.score,
          components: pair.components,
          profileKey: pair.profileKey,
          threshold: pair.threshold,
          a: hydrate(pair.aIndex),
          b: hydrate(pair.bIndex)
        };
      });
    stats.fuzzyCandidates = fuzzyCandidates.length;
    stats.fuzzyComparisons = fuzzy.comparisons;
    stats.fuzzyTruncated = fuzzy.truncated;
  }

  return {
    entries: loaded.entries,
    analysis: analysis,
    duplicateGroups: duplicateGroups,
    patientClusters: patientClusters,
    fuzzyCandidates: fuzzyCandidates,
    stats: stats
  };
}

// ---------------------------------------------------------------------------
// Inbound references
// ---------------------------------------------------------------------------

// Every stored document that references resourceType/id through a known
// reference path. Returns [{ collectionName, _id }].
export async function findInboundReferences(resourceType, id) {
  const ref = resourceType + '/' + id;
  const or = REFERENCE_PATHS.map(function(path) {
    const clause = {};
    clause[path] = ref;
    return clause;
  });
  const hits = [];
  const collections = [];
  eachFhirCollection(function(name, collection) { collections.push({ name: name, collection: collection }); });
  for (const entry of collections) {
    const docs = await entry.collection.find({ $or: or }, { fields: { _id: 1 } }).fetchAsync();
    docs.forEach(function(doc) {
      hits.push({ collectionName: entry.name, _id: doc._id });
    });
  }
  return hits;
}

// Recursively rewrite 'Type/oldId' reference strings to 'Type/newId'. Returns
// the number of rewrites. Mutates node in place.
function rewriteReferences(node, fromRef, toRef) {
  if (!node || typeof node !== 'object') { return 0; }
  let count = 0;
  if (Array.isArray(node)) {
    node.forEach(function(child) { count += rewriteReferences(child, fromRef, toRef); });
    return count;
  }
  Object.keys(node).forEach(function(key) {
    const value = node[key];
    if ((key === 'reference' || key === 'url') && value === fromRef) {
      node[key] = toRef;
      count++;
    } else if (value && typeof value === 'object') {
      count += rewriteReferences(value, fromRef, toRef);
    }
  });
  return count;
}

async function repointInboundReferences(resourceType, loserId, keeperId, dryRun) {
  const fromRef = resourceType + '/' + loserId;
  const toRef = resourceType + '/' + keeperId;
  const hits = await findInboundReferences(resourceType, loserId);
  const ops = [];
  for (const hit of hits) {
    const resolved = resolveCollection(hit.collectionName);
    if (!resolved) { continue; }
    const doc = await resolved.collection.findOneAsync({ _id: hit._id });
    if (!doc) { continue; }
    const mutated = cloneDeep(doc);
    const rewrites = rewriteReferences(mutated, fromRef, toRef);
    if (rewrites === 0) { continue; }
    ops.push({ op: 'repoint', collection: hit.collectionName, _id: hit._id, from: fromRef, to: toRef, rewrites: rewrites });
    if (!dryRun) {
      const setFields = {};
      Object.keys(mutated).forEach(function(key) {
        if (key === '_id') { return; }
        if (JSON.stringify(mutated[key]) !== JSON.stringify(doc[key])) {
          setFields[key] = mutated[key];
        }
      });
      if (Object.keys(setFields).length > 0) {
        await resolved.collection.updateAsync({ _id: hit._id }, { $set: setFields });
      }
    }
  }
  return ops;
}

// ---------------------------------------------------------------------------
// Import-time existence check
// ---------------------------------------------------------------------------

// Cheap pre-insert duplicate probe for importers: is there an existing stored
// record equivalent to `resource` (same business identifier, else same content
// fingerprint after run-tag stripping)? Candidates are bounded to the same
// subject/patient when the resource carries one. Degrades to null on any
// failure — an importer must never break because dedup couldn't run.
// Returns the existing stored doc, or null.
export async function findExistingDuplicate(collection, resource, options) {
  if (!collection || typeof collection.find !== 'function' || !resource) {
    return null;
  }
  try {
    const limit = get(options, 'limit', 200);
    const refs = [
      get(resource, 'subject.reference'),
      get(resource, 'patient.reference')
    ].filter(Boolean);
    const selector = {};
    if (refs.length > 0) {
      selector.$or = [
        { 'subject.reference': { $in: refs } },
        { 'patient.reference': { $in: refs } }
      ];
    }
    // transform: null is load-bearing — BaseModel collection transforms attach
    // `_document` (the raw doc, _id included) to every fetched instance, which
    // makes each candidate contentFingerprint unique and the probe never match.
    const candidates = await collection.find(selector, { limit: limit, transform: null }).fetchAsync();

    const target = sanitizeForDedup(resource);
    const targetIdKey = Deduplicator.identifierKey(target);
    const targetFingerprint = Deduplicator.contentFingerprint(target);

    for (const candidate of candidates) {
      if (candidate._id && resource._id && candidate._id === resource._id) {
        continue; // same stored doc, not a duplicate of it
      }
      const clean = sanitizeForDedup(candidate);
      if (targetIdKey && Deduplicator.identifierKey(clean) === targetIdKey) {
        return candidate;
      }
      if (Deduplicator.contentFingerprint(clean) === targetFingerprint) {
        return candidate;
      }
    }
    return null;
  } catch (error) {
    log.warn('findExistingDuplicate degraded to no-op', { error: error.message });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Reconcile (destructive — gate at the method layer)
// ---------------------------------------------------------------------------

function buildMergeProvenance(resourceType, keeperId, loserIds, trigger) {
  const now = new Date().toISOString();
  const provenanceId = Random.id();
  return {
    _id: provenanceId,
    id: provenanceId,
    resourceType: 'Provenance',
    target: [{ reference: resourceType + '/' + keeperId }],
    recorded: now,
    occurredDateTime: now,
    activity: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-DataOperation', code: 'MERGE', display: 'merge' }]
    },
    agent: [{ who: { display: 'Honeycomb dedup engine (' + (trigger || 'on-demand') + ')' } }],
    entity: loserIds.map(function(loserId) {
      return {
        role: 'source',
        what: { reference: resourceType + '/' + loserId, display: 'duplicate record ' + loserId }
      };
    })
  };
}

// Apply an analyzeScope result to the database: for each collapsible
// duplicate group keep one member, re-point inbound references onto it,
// delete the rest, and record a MERGE Provenance. Patient clusters are only
// touched when options.clusterStrategies names them explicitly — probabilistic
// patient merges never happen implicitly.
//
// options: { collapseExact = true, dedupeChildrenByIdentifier = false,
//            clusterStrategies = {}, dryRun = false, trigger }
// Returns { ops, summary }.
export async function applyReconcile(analyzed, options) {
  const opts = options || {};
  const collapseExact = opts.collapseExact !== false;
  const dedupeByIdentifier = opts.dedupeChildrenByIdentifier === true;
  const clusterStrategies = opts.clusterStrategies || {};
  const dryRun = opts.dryRun === true;

  const ops = [];
  const summary = {
    groupsCollapsed: 0, duplicatesRemoved: 0, referencesRepointed: 0,
    provenanceCreated: 0, groupsSkipped: 0, patientsMerged: 0
  };
  const Provenances = get(global, 'Collections.Provenances');

  for (const group of analyzed.duplicateGroups) {
    const shouldCollapse = group.reason === 'content' ? collapseExact : dedupeByIdentifier;
    if (!shouldCollapse) {
      summary.groupsSkipped++;
      continue;
    }

    // Keeper policy: the analysis keep (newest, tie → most complete), unless
    // exactly one member already has inbound references — keep that one so
    // no re-pointing is needed at all in the common case.
    let keeper = group.keep;
    const inboundByMember = {};
    for (const member of group.members) {
      inboundByMember[member._id] = await findInboundReferences(group.resourceType, member._id);
    }
    const referencedMembers = group.members.filter(function(m) { return inboundByMember[m._id].length > 0; });
    if (referencedMembers.length === 1) {
      keeper = referencedMembers[0];
    }

    const losers = group.members.filter(function(m) { return m._id !== keeper._id; });
    if (losers.length === 0) {
      continue;
    }

    for (const loser of losers) {
      const repointOps = await repointInboundReferences(group.resourceType, loser._id, keeper._id, dryRun);
      repointOps.forEach(function(op) { ops.push(op); });
      summary.referencesRepointed += repointOps.reduce(function(sum, op) { return sum + op.rewrites; }, 0);

      // Never delete a doc whose references could not be re-pointed.
      const residual = dryRun ? [] : await findInboundReferences(group.resourceType, loser._id);
      if (residual.length > 0) {
        log.warn('Skipping delete: inbound references survived re-pointing', {
          resourceType: group.resourceType, id: loser._id, residual: residual.length
        });
        summary.groupsSkipped++;
        continue;
      }

      ops.push({ op: 'delete', collection: loser.collectionName, _id: loser._id, resourceType: group.resourceType });
      if (!dryRun) {
        const resolved = resolveCollection(loser.collectionName);
        if (resolved) {
          await resolved.collection.removeAsync({ _id: loser._id });
        }
      }
      summary.duplicatesRemoved++;
    }

    if (Provenances && losers.length > 0) {
      const provenance = buildMergeProvenance(
        group.resourceType, keeper._id,
        losers.map(function(l) { return l._id; }),
        opts.trigger
      );
      ops.push({ op: 'provenance', _id: provenance._id, target: group.resourceType + '/' + keeper._id });
      if (!dryRun) {
        await Provenances.insertAsync(provenance);
      }
      summary.provenanceCreated++;
    }
    summary.groupsCollapsed++;
  }

  // Patient clusters: explicit opt-in per cluster only.
  for (const cluster of analyzed.patientClusters) {
    const strategy = clusterStrategies[cluster.representativeId];
    if (!strategy || strategy === 'keep-all') { continue; }

    const Patients = get(global, 'Collections.Patients');
    if (!Patients) { continue; }

    const memberDocs = cluster.members.map(function(m) { return m.doc; });
    if (strategy === 'merge') {
      const merged = Deduplicator.mergePatients(memberDocs, {
        representativeId: cluster.representativeId,
        agentName: 'Honeycomb dedup engine'
      });
      if (!merged.patient) { continue; }
      ops.push({ op: 'merge-patient', keeperId: cluster.representativeId, memberIds: cluster.members.map(function(m) { return m._id; }) });
      if (!dryRun) {
        for (const member of cluster.members) {
          if (member._id === cluster.representativeId) { continue; }
          await repointInboundReferences('Patient', member._id, cluster.representativeId, false);
          await Patients.removeAsync({ _id: member._id });
        }
        const replacement = Object.assign({}, merged.patient, { _id: cluster.representativeId });
        await Patients.updateAsync({ _id: cluster.representativeId }, { $set: replacement });
        if (merged.provenance && get(global, 'Collections.Provenances')) {
          const provDoc = Object.assign({}, merged.provenance, { _id: merged.provenance.id });
          await global.Collections.Provenances.insertAsync(provDoc);
          summary.provenanceCreated++;
        }
      }
      summary.patientsMerged += cluster.members.length;
    }
  }

  return { ops: ops, summary: summary };
}

// ---------------------------------------------------------------------------
// Package-facing facade
// ---------------------------------------------------------------------------

// NPM workflow packages must not import host paths — they consume core
// helpers via Meteor.* globals (Meteor.ImportRunTags precedent). Registered at
// module load (server-only file, imported from server/main.js before any
// workflow server entry runs its startup).
Meteor.DedupEngine = {
  sanitizeForDedup: sanitizeForDedup,
  findExistingDuplicate: findExistingDuplicate,
  findInboundReferences: findInboundReferences,
  analyzeScope: analyzeScope,
  applyReconcile: applyReconcile
};
