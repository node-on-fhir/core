// imports/api/dedup/cron.js
//
// Nightly dedup analysis (SyncedCron). Two gates must BOTH be on for this to
// run: the global SyncedCron start (ENABLE_SYNCED_CRON=true env or
// settings.private.enableCronAutomation — see server/main.js) AND
// settings.private.dedup.enableCronAnalysis. The job only ANALYZES and
// persists findings; nothing is deleted unless
// settings.private.dedup.cronAutoReconcileExact is additionally true, and
// even then only exact content-fingerprint groups collapse — identifier
// duplicates and probabilistic patient clusters always stay findings-only for
// human review.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import { analyzeScope, applyReconcile } from './engine.js';
import { persistFinding } from './methods.js';

const log = Meteor.Logger ? Meteor.Logger.for('dedup') : console;

const DEFAULT_CRON_RESOURCE_TYPES = [
  'MolecularSequence',
  'DocumentReference',
  'Observation',
  'Condition',
  'MedicationRequest'
];
const CRON_SCOPE_LIMIT = 5000;

// Called from server/main.js (which owns the SyncedCron singleton and its
// start gates) rather than importing /server from /imports.
export function registerDedupCron(SyncedCron) {
  const enabled = get(Meteor, 'settings.private.dedup.enableCronAnalysis', false) === true;
  if (!enabled) {
    log.debug('Dedup cron analysis disabled (settings.private.dedup.enableCronAnalysis)');
    return;
  }

  const scheduleText = get(Meteor, 'settings.private.dedup.cronSchedule', 'at 2:30 am');
  const resourceTypes = get(Meteor, 'settings.private.dedup.cronResourceTypes', DEFAULT_CRON_RESOURCE_TYPES);
  const autoReconcileExact = get(Meteor, 'settings.private.dedup.cronAutoReconcileExact', false) === true;

  SyncedCron.add({
    name: 'dedup-nightly-analysis',
    schedule: function(parser) {
      return parser.text(scheduleText);
    },
    job: async function() {
      const runSummary = { scopes: 0, duplicateGroups: 0, autoCollapsed: 0, errors: 0 };

      for (const resourceType of resourceTypes) {
        const scope = { kind: 'collection', resourceType: resourceType };
        try {
          const analyzed = await analyzeScope(scope, { limit: CRON_SCOPE_LIMIT });
          runSummary.scopes++;
          runSummary.duplicateGroups += analyzed.duplicateGroups.length;

          if (analyzed.duplicateGroups.length > 0 || analyzed.patientClusters.length > 0) {
            await persistFinding(scope, analyzed, 'cron');
          }

          if (autoReconcileExact && analyzed.duplicateGroups.some(function(g) { return g.reason === 'content'; })) {
            const result = await applyReconcile(analyzed, {
              collapseExact: true,
              dedupeChildrenByIdentifier: false,   // identifier dups need human review
              clusterStrategies: {},               // patient clusters never auto-merge
              dryRun: false,
              trigger: 'cron'
            });
            runSummary.autoCollapsed += result.summary.duplicatesRemoved;
          }
        } catch (error) {
          runSummary.errors++;
          log.warn('Dedup cron scope failed', { resourceType: resourceType, error: error.message });
        }
      }

      log.info('Dedup nightly analysis complete', runSummary);
      return runSummary;
    }
  });

  log.info('Dedup nightly analysis registered', {
    schedule: scheduleText, resourceTypes: resourceTypes, autoReconcileExact: autoReconcileExact
  });
}
