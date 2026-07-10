// packages/request-for-corrections/server/startup.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { CorrectionTasks } from '../lib/collections/CorrectionTasks';
import { CorrectionCommunications } from '../lib/collections/CorrectionCommunications';

// Server startup configuration
Meteor.startup(async function() {
  console.log('Request for Corrections package starting up...');

  // Get package configuration from settings
  const enableNotifications = get(Meteor.settings, 'public.requestForCorrections.enableNotifications', false);
  const autoAssignReviewers = get(Meteor.settings, 'private.requestForCorrections.autoAssignReviewers', false);
  
  // Log configuration
  console.log('Request for Corrections configuration:', {
    enableNotifications,
    autoAssignReviewers,
    defaultReviewTimeoutDays: get(Meteor.settings, 'public.requestForCorrections.defaultReviewTimeoutDays', 30),
    requireApprovalForAmendments: get(Meteor.settings, 'private.requestForCorrections.requireApprovalForAmendments', true)
  });

  // Create indexes for efficient querying
  // (CorrectionTasks / CorrectionCommunications are imported statically at the
  // top of this file — importing them dynamically here returned a
  // temporal-dead-zone binding under Rspack and crashed boot.)
  if (CorrectionTasks && CorrectionTasks.rawCollection) {
    await CorrectionTasks.rawCollection().createIndex({ 'subject.reference': 1, status: 1 });
    await CorrectionTasks.rawCollection().createIndex({ businessStatus: 1 });
    await CorrectionTasks.rawCollection().createIndex({ 'meta.lastUpdated': -1 });
  }

  if (CorrectionCommunications && CorrectionCommunications.rawCollection) {
    await CorrectionCommunications.rawCollection().createIndex({ 'about.reference': 1 });
    await CorrectionCommunications.rawCollection().createIndex({ 'subject.reference': 1 });
    await CorrectionCommunications.rawCollection().createIndex({ 'sender.reference': 1 });
    await CorrectionCommunications.rawCollection().createIndex({ 'meta.lastUpdated': -1 });
  }

  console.log('Request for Corrections package initialized successfully');
});