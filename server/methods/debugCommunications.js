// server/methods/debugCommunications.js
// NOTE: currently NOT imported anywhere (dead code kept for debugging).
// Converted to the ServerMethods registry so it is safe to re-enable.

import { Meteor } from 'meteor/meteor';
import { Communications } from '../../imports/lib/schemas/SimpleSchemas/Communications';
import { get } from 'lodash';

// Imported directly (not via the Meteor.ServerMethods global) so this module
// works regardless of load order relative to server/rpc/rpcSetup.js.
import ServerMethods from '/imports/lib/ServerMethods.js';

ServerMethods.define('debug.getCommunicationsInfo', {
  description: 'Report Communication counts and per-record summaries for the current practitioner (debug)',
  phi: true    // patient Communication content and recipients
}, async function(params, context) {
  // Get all communications
  const allComms = await Communications.find({}).fetchAsync();

  // Get user's practitioner ID
  const user = await Meteor.users.findOneAsync(context.userId);
  const practitionerId = get(user, 'practitionerId');

  // Debug info
  const debugInfo = {
    totalCommunications: allComms.length,
    userPractitionerId: practitionerId,
    userIsPractitioner: get(user, 'profile.isPractitioner'),
    communicationsSummary: []
  };

  // Summarize each communication
  allComms.forEach(comm => {
    debugInfo.communicationsSummary.push({
      id: comm._id,
      status: comm.status,
      category: get(comm, 'category.0.coding.0.code', 'no-category'),
      recipient: get(comm, 'recipient.0.reference', 'no-recipient'),
      sender: get(comm, 'sender.reference', 'no-sender'),
      sent: comm.sent,
      payloadText: get(comm, 'payload.0.contentString', '').substring(0, 50) + '...'
    });
  });

  // Check specific queries
  if (practitionerId) {
    // Check communications for this practitioner
    const practitionerComms = await Communications.find({
      'recipient.0.reference': `Practitioner/${practitionerId}`
    }).fetchAsync();

    debugInfo.communicationsForPractitioner = practitionerComms.length;

    // Check with the exact query from MainPage
    const mainPageQuery = {
      $and: [
        {
          $or: [
            { 'recipient.reference': `Practitioner/${practitionerId}` },
            {
              'recipient.reference': 'Practitioner/chief-medical-officer',
              'category.0.coding.0.code': 'intervention-approval'
            }
          ]
        },
        { status: { $in: ['in-progress', 'preparation'] } },
        { 'category.0.coding.0.code': { $in: ['intervention-approval', 'alert', 'notification'] } }
      ]
    };

    const mainPageComms = await Communications.find(mainPageQuery).fetchAsync();
    debugInfo.mainPageQueryCount = mainPageComms.length;
    debugInfo.mainPageQuery = mainPageQuery;
  }

  // Check for chief medical officer communications
  const cmoComms = await Communications.find({
    'recipient.0.reference': 'Practitioner/chief-medical-officer'
  }).fetchAsync();

  debugInfo.chiefMedicalOfficerComms = cmoComms.length;

  // Check for intervention approval communications
  const approvalComms = await Communications.find({
    'category.0.coding.0.code': 'intervention-approval'
  }).fetchAsync();

  debugInfo.interventionApprovalComms = approvalComms.length;

  return debugInfo;
});

// 'debug.linkCurrentUserToCMO' was ALSO defined here pre-migration — a
// boot-time duplicate of the (live, superset) definition in
// server/methods/practitionerMethods.js, which now registers the canonical
// ServerMethods entry. The duplicate body was removed from this dead file so
// re-enabling it can never throw "method already defined" at startup.
