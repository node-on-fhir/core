// npmPackages/record-lifecycle/server/hooks.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { buildEventPayload } from '../lib/EventPayload';
import { EventBus } from './EventBus';

// =============================================================================
// COLLECTION HOOKS FOR RECORD LIFECYCLE EVENT BUS
// =============================================================================
//
// Auto-discovered by rspack.workflowParser.js via hooksEntry.
// Registers after.insert, after.update, after.remove hooks on monitored
// collections. Each hook builds a unified payload and emits to the EventBus.
//
// Pattern follows radiology-workflow/server/hooks.js:
//   - Meteor.Collections?.X || global.Collections?.X for collection access
//   - function() not arrow for hook context
//   - Meteor.defer() for async work
//   - try/catch with console.error
// =============================================================================

// Default monitored collections (clinical FHIR resources)
const DEFAULT_MONITORED_COLLECTIONS = [
  'Patients',
  'Observations',
  'Conditions',
  'Encounters',
  'DiagnosticReports',
  'ImagingStudies',
  'ServiceRequests',
  'MedicationRequests',
  'Procedures',
  'AllergyIntolerances',
  'CarePlans',
  'Goals'
];

/**
 * Initialize Record Lifecycle collection hooks.
 * Called by the workflow parser's initializeWorkflowHooks().
 */
export function initRecordLifecycleHooks() {
  // Initialize the EventBus first
  EventBus.initialize();

  if (!EventBus.isEnabled()) {
    console.log('[record-lifecycle] Hooks not registered (EventBus disabled)');
    return;
  }

  const monitoredCollections = get(
    Meteor,
    'settings.private.recordLifecycle.monitoredCollections',
    DEFAULT_MONITORED_COLLECTIONS
  );

  console.log('[record-lifecycle] Registering hooks for collections:', monitoredCollections);

  let registeredCount = 0;

  for (const collectionName of monitoredCollections) {
    try {
      const Collection = Meteor.Collections?.[collectionName] || global.Collections?.[collectionName];

      if (!Collection) {
        console.warn(`[record-lifecycle] Collection ${collectionName} not found, skipping`);
        continue;
      }

      if (!Collection.after) {
        console.warn(`[record-lifecycle] Collection ${collectionName} does not support hooks, skipping`);
        continue;
      }

      // ----- after.insert -----
      Collection.after.insert(function(userId, doc) {
        Meteor.defer(async function() {
          try {
            const payload = buildEventPayload({
              crudOperation: 'insert',
              collectionName: collectionName,
              userId: userId,
              doc: doc
            });

            EventBus.emitLifecycleEvent(payload);

            console.log(`[record-lifecycle] ${payload.lifecycleEvent} — ${collectionName}/${doc._id}`);
          } catch (error) {
            console.error(`[record-lifecycle] Error in ${collectionName}.after.insert hook:`, error);
          }
        });
      });

      // ----- after.update -----
      Collection.after.update(function(userId, doc, fieldNames, modifier, options) {
        Meteor.defer(async function() {
          try {
            // Attempt to get the previous document from the hook context
            const previousDoc = this?.previous || null;

            const payload = buildEventPayload({
              crudOperation: 'update',
              collectionName: collectionName,
              userId: userId,
              doc: doc,
              fieldNames: fieldNames,
              modifier: modifier,
              previousDoc: previousDoc
            });

            EventBus.emitLifecycleEvent(payload);

            console.log(`[record-lifecycle] ${payload.lifecycleEvent} — ${collectionName}/${doc._id} [${fieldNames.join(', ')}]`);
          } catch (error) {
            console.error(`[record-lifecycle] Error in ${collectionName}.after.update hook:`, error);
          }
        });
      });

      // ----- after.remove -----
      Collection.after.remove(function(userId, doc) {
        Meteor.defer(async function() {
          try {
            const payload = buildEventPayload({
              crudOperation: 'remove',
              collectionName: collectionName,
              userId: userId,
              doc: doc
            });

            EventBus.emitLifecycleEvent(payload);

            console.log(`[record-lifecycle] ${payload.lifecycleEvent} — ${collectionName}/${doc._id}`);
          } catch (error) {
            console.error(`[record-lifecycle] Error in ${collectionName}.after.remove hook:`, error);
          }
        });
      });

      registeredCount++;
      console.log(`[record-lifecycle] Hooks registered for ${collectionName}`);

    } catch (error) {
      console.error(`[record-lifecycle] Error setting up hooks for ${collectionName}:`, error);
    }
  }

  console.log(`[record-lifecycle] Hook registration complete: ${registeredCount}/${monitoredCollections.length} collections`);
}
