// packages/request-for-corrections/server/startup.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

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

  // Initialize indexes for better performance
  const { CorrectionTasks } = await import('../lib/collections/CorrectionTasks');
  const { CorrectionCommunications } = await import('../lib/collections/CorrectionCommunications');
  
  // Create indexes for efficient querying
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