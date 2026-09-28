// imports/api/dedup/methods.js
//
// On-demand dedup/matching methods (JSON-RPC via ServerMethods registry).
//
//   dedup.analyze        - non-destructive duplicate analysis over a scope
//                          (patient / collection / importRun); optionally
//                          persists a DedupFindings record
//   dedup.reconcile      - apply an analysis: collapse duplicate groups,
//                          re-point references, delete losers, emit MERGE
//                          Provenance. Settings-gated + dry-runnable.
//   dedup.checkSettings  - tri-state client support (settings-gated pattern)
//   dedup.getFindings    - list persisted findings (open/reconciled/dismissed)
//
// Safety posture: analyze is free; reconcile requires
// settings.private.dedup.allowReconcile and never merges probabilistic
// patient clusters unless the caller names them in options.clusterStrategies.

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { DedupFindings } from './DedupFindings.js';
import { analyzeScope, applyReconcile } from './engine.js';

const MAX_PERSISTED_GROUPS = 200;

function isReconcileAllowed() {
  return get(Meteor, 'settings.private.dedup.allowReconcile', false) === true;
}

function scopeFromParams(params) {
  const scope = {
    kind: get(params, 'scope'),
    patientId: get(params, 'patientId'),
    resourceType: get(params, 'resourceType'),
    importRunId: get(params, 'importRunId')
  };
  if (!scope.kind) {
    throw new Meteor.Error('missing-param', 'scope is required (patient | collection | importRun)');
  }
  return scope;
}

// Compact a fuzzy candidate pair for persistence/return (drops the full docs).
function compactFuzzyCandidate(candidate) {
  return {
    resourceType: candidate.resourceType,
    score: candidate.score,
    components: candidate.components,
    profileKey: candidate.profileKey,
    threshold: candidate.threshold,
    aId: candidate.a._id,
    bId: candidate.b._id,
    collectionName: candidate.a.collectionName
  };
}

// Compact a hydrated analysis into a persistable finding document.
function buildFindingDoc(scope, analyzed, trigger) {
  const groups = analyzed.duplicateGroups.slice(0, MAX_PERSISTED_GROUPS).map(function(group) {
    return {
      resourceType: group.resourceType,
      reason: group.reason,
      keepId: group.keep._id,
      memberIds: group.members.map(function(m) { return m._id; })
    };
  });
  const fuzzyCandidates = (analyzed.fuzzyCandidates || [])
    .slice(0, MAX_PERSISTED_GROUPS)
    .map(compactFuzzyCandidate);
  return {
    _id: Random.id(),
    createdAt: new Date(),
    trigger: trigger,
    scope: scope,
    stats: analyzed.stats,
    patientClusters: analyzed.patientClusters.map(function(cluster) {
      return {
        representativeId: cluster.representativeId,
        score: cluster.score,
        confidence: cluster.confidence,
        conflicts: cluster.conflicts,
        memberIds: cluster.members.map(function(m) { return m._id; })
      };
    }),
    groups: groups,
    groupsTruncated: Math.max(0, analyzed.duplicateGroups.length - groups.length),
    fuzzyCandidates: fuzzyCandidates,
    fuzzyCandidatesTruncated: Math.max(0, (analyzed.fuzzyCandidates || []).length - fuzzyCandidates.length),
    status: 'open'
  };
}

// Persist a finding, superseding any prior open finding for the same scope so
// repeated analyses (especially cron) don't accumulate stale open findings.
export async function persistFinding(scope, analyzed, trigger) {
  const doc = buildFindingDoc(scope, analyzed, trigger);
  await DedupFindings.updateAsync(
    { status: 'open', 'scope.kind': scope.kind, 'scope.patientId': scope.patientId || null,
      'scope.resourceType': scope.resourceType || null, 'scope.importRunId': scope.importRunId || null },
    { $set: { status: 'dismissed', supersededAt: new Date() } },
    { multi: true }
  );
  await DedupFindings.insertAsync(doc);
  return doc._id;
}

Meteor.ServerMethods.define('dedup.analyze', {
  description: 'Non-destructive duplicate analysis over a scope (patient, collection, or importRun)',
  requireAuth: true,
  phi: true,
  schemaObject: {
    type: 'object',
    properties: {
      scope: { type: 'string', enum: ['patient', 'collection', 'importRun'] },
      patientId: { type: 'string' },
      resourceType: { type: 'string' },
      importRunId: { type: 'string' },
      limit: { type: 'number' },
      persistFindings: { type: 'boolean' },
      fuzzy: { type: 'boolean' },
      fuzzyThreshold: { type: 'number' },
      normalizeIdentifiers: { type: 'boolean' }
    },
    required: ['scope']
  }
}, async function(params, context) {
  const scope = scopeFromParams(params);
  const analyzed = await analyzeScope(scope, {
    limit: get(params, 'limit'),
    fuzzy: get(params, 'fuzzy') === true,
    fuzzyThreshold: get(params, 'fuzzyThreshold'),
    normalizeIdentifiers: get(params, 'normalizeIdentifiers') === true
  });

  context.log.info('Dedup analysis complete', {
    scope: scope, stats: analyzed.stats,
    duplicateGroups: analyzed.duplicateGroups.length,
    patientClusters: analyzed.patientClusters.length,
    fuzzyCandidates: (analyzed.fuzzyCandidates || []).length
  });

  let findingId = null;
  if (get(params, 'persistFindings') === true) {
    findingId = await persistFinding(scope, analyzed, 'on-demand');
  }

  return {
    stats: analyzed.stats,
    duplicateGroups: analyzed.duplicateGroups.map(function(group) {
      return {
        resourceType: group.resourceType,
        reason: group.reason,
        keepId: group.keep._id,
        memberIds: group.members.map(function(m) { return m._id; })
      };
    }),
    patientClusters: analyzed.patientClusters.map(function(cluster) {
      return {
        representativeId: cluster.representativeId,
        score: cluster.score,
        confidence: cluster.confidence,
        conflicts: cluster.conflicts,
        memberIds: cluster.members.map(function(m) { return m._id; })
      };
    }),
    // Report-only: reconcile never acts on fuzzy candidates (see engine.js).
    fuzzyCandidates: (analyzed.fuzzyCandidates || []).map(compactFuzzyCandidate),
    findingId: findingId
  };
});

Meteor.ServerMethods.define('dedup.reconcile', {
  description: 'Apply dedup analysis to a scope: collapse duplicates, re-point references, emit Provenance (settings-gated)',
  requireAuth: true,
  phi: true,
  schemaObject: {
    type: 'object',
    properties: {
      scope: { type: 'string', enum: ['patient', 'collection', 'importRun'] },
      patientId: { type: 'string' },
      resourceType: { type: 'string' },
      importRunId: { type: 'string' },
      findingId: { type: 'string' },
      options: {
        type: 'object',
        properties: {
          collapseExact: { type: 'boolean' },
          dedupeChildrenByIdentifier: { type: 'boolean' },
          clusterStrategies: { type: 'object' },
          dryRun: { type: 'boolean' }
        }
      }
    },
    required: ['scope']
  }
}, async function(params, context) {
  const options = get(params, 'options', {}) || {};
  const dryRun = get(options, 'dryRun') === true;

  if (!dryRun && !isReconcileAllowed()) {
    throw new Meteor.Error('feature-disabled',
      'Dedup reconciliation is disabled. Set Meteor.settings.private.dedup.allowReconcile to true.');
  }

  // Always re-analyze at reconcile time — a persisted finding may be stale
  // against the live database; findingId only marks which finding to resolve.
  const scope = scopeFromParams(params);
  const analyzed = await analyzeScope(scope, { limit: get(params, 'limit') });
  const result = await applyReconcile(analyzed, {
    collapseExact: get(options, 'collapseExact'),
    dedupeChildrenByIdentifier: get(options, 'dedupeChildrenByIdentifier'),
    clusterStrategies: get(options, 'clusterStrategies'),
    dryRun: dryRun,
    trigger: 'on-demand'
  });

  context.log.info('Dedup reconcile ' + (dryRun ? 'dry-run' : 'applied'), {
    scope: scope, summary: result.summary, opCount: result.ops.length
  });

  const findingId = get(params, 'findingId');
  if (findingId && !dryRun) {
    await DedupFindings.updateAsync(
      { _id: findingId },
      { $set: { status: 'reconciled', reconciledAt: new Date(), reconcileSummary: result.summary } }
    );
  }

  return { dryRun: dryRun, summary: result.summary, ops: result.ops };
});

Meteor.ServerMethods.define('dedup.checkSettings', {
  description: 'Report dedup feature gates (for tri-state client rendering)',
  requireAuth: true,
  phi: false,
  schemaObject: { type: 'object' }
}, async function(params, context) {
  return {
    allowReconcile: isReconcileAllowed(),
    cronEnabled: get(Meteor, 'settings.private.dedup.enableCronAnalysis', false) === true,
    cronAutoReconcileExact: get(Meteor, 'settings.private.dedup.cronAutoReconcileExact', false) === true
  };
});

Meteor.ServerMethods.define('dedup.getFindings', {
  description: 'List persisted dedup findings, newest first',
  requireAuth: true,
  phi: true,
  schemaObject: {
    type: 'object',
    properties: {
      status: { type: 'string' },
      limit: { type: 'number' }
    }
  }
}, async function(params, context) {
  const selector = {};
  const status = get(params, 'status');
  if (status) {
    selector.status = status;
  }
  const limit = Math.min(get(params, 'limit', 50), 200);
  const findings = await DedupFindings.find(selector, { sort: { createdAt: -1 }, limit: limit }).fetchAsync();
  return { findings: findings };
});
