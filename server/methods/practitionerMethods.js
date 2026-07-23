// server/methods/practitionerMethods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { Practitioners } from '../../imports/lib/schemas/SimpleSchemas/Practitioners';
import { PractitionerRoles } from '../../imports/lib/schemas/SimpleSchemas/PractitionerRoles';

// Imported directly (not via the Meteor.ServerMethods global) so this module
// works regardless of load order relative to server/rpc/rpcSetup.js.
import ServerMethods from '/imports/lib/ServerMethods.js';

/**
 * Link a practitioner ID to the current user's account
 */
ServerMethods.define('users.linkPractitionerId', {
  description: 'Link a Practitioner record to the current user account',
  positionalParams: ['practitionerId'],
  schemaObject: {
    type: 'object',
    properties: { practitionerId: { type: 'string' } },
    required: ['practitionerId']
  }
}, async function(params, context) {
  const practitionerId = params.practitionerId;

  // Verify the practitioner exists
  const practitioner = await Practitioners.findOneAsync({
    $or: [
      { id: practitionerId },
      { _id: practitionerId }
    ]
  });

  if (!practitioner) {
    throw new Meteor.Error('not-found', 'Practitioner record not found');
  }

  // Update the user's practitionerId
  const result = await Meteor.users.updateAsync(
    { _id: context.userId },
    {
      $set: {
        practitionerId: get(practitioner, 'id', practitionerId),
        'profile.isPractitioner': true
      }
    }
  );

  context.log.info('Linked practitioner to user', { data: { practitionerId: practitionerId, userId: context.userId } });

  return result;
});

/**
 * Link a practitioner role ID to the current user's account
 */
ServerMethods.define('users.linkPractitionerRoleId', {
  description: 'Link a PractitionerRole record to the current user account',
  positionalParams: ['practitionerRoleId'],
  schemaObject: {
    type: 'object',
    properties: { practitionerRoleId: { type: 'string' } },
    required: ['practitionerRoleId']
  }
}, async function(params, context) {
  const practitionerRoleId = params.practitionerRoleId;

  // Verify the practitioner role exists
  const practitionerRole = await PractitionerRoles.findOneAsync({
    $or: [
      { id: practitionerRoleId },
      { _id: practitionerRoleId }
    ]
  });

  if (!practitionerRole) {
    throw new Meteor.Error('not-found', 'Practitioner role not found');
  }

  // Update the user's practitionerRoleId
  const result = await Meteor.users.updateAsync(
    { _id: context.userId },
    {
      $set: {
        practitionerRoleId: get(practitionerRole, 'id', practitionerRoleId)
      }
    }
  );

  context.log.info('Linked practitioner role to user', { data: { practitionerRoleId: practitionerRoleId, userId: context.userId } });

  return result;
});

/**
 * Unlink practitioner records from the current user's account
 */
ServerMethods.define('users.unlinkPractitionerRecords', {
  description: 'Remove practitioner and practitioner-role links from the current user account'
}, async function(params, context) {
  // Remove practitioner-related fields from the user
  const result = await Meteor.users.updateAsync(
    { _id: context.userId },
    {
      $unset: {
        practitionerId: '',
        practitionerRoleId: '',
        'profile.isPractitioner': ''
      }
    }
  );

  context.log.info('Unlinked practitioner records from user', { data: { userId: context.userId } });

  return result;
});

/**
 * Get practitioner-related resources for a user
 */
ServerMethods.define('users.getPractitionerResources', {
  description: 'Fetch the Practitioner and PractitionerRole records linked to a user account',
  // Pre-migration this only required a resolvable userId (explicit param OR
  // this.userId) — it was callable unauthenticated with an explicit userId.
  // requireAuth now applies (the default); behavior change noted.
  positionalParams: ['userId'],
  schemaObject: {
    type: 'object',
    properties: { userId: { type: 'string' } }
  }
}, async function(params, context) {
  const targetUserId = params.userId || context.userId;

  if (!targetUserId) {
    throw new Meteor.Error('not-authorized', 'User ID required');
  }

  const user = await Meteor.users.findOneAsync(targetUserId);
  if (!user) {
    throw new Meteor.Error('not-found', 'User not found');
  }

  const result = {
    practitioner: null,
    practitionerRole: null
  };

  // Get practitioner record
  if (user.practitionerId) {
    result.practitioner = await Practitioners.findOneAsync({
      $or: [
        { id: user.practitionerId },
        { _id: user.practitionerId }
      ]
    });
  }

  // Get practitioner role
  if (user.practitionerRoleId) {
    result.practitionerRole = await PractitionerRoles.findOneAsync({
      $or: [
        { id: user.practitionerRoleId },
        { _id: user.practitionerRoleId }
      ]
    });
  }

  return result;
});

/**
 * Get the current user's practitioner ID
 */
ServerMethods.define('users.getCurrentPractitionerId', {
  description: 'Return the practitioner ID linked to the current user, or null when signed out',
  // Public by design (pre-migration behavior): returns null rather than
  // throwing when no user is signed in — pacio-core pages probe it before
  // auth state resolves.
  requireAuth: false
}, async function(params, context) {
  if (!context.userId) {
    return null;
  }

  const user = await Meteor.users.findOneAsync(context.userId);
  context.log.debug('getCurrentPractitionerId', { data: { username: user?.username, practitionerId: user?.practitionerId } });

  return user?.practitionerId || null;
});

/**
 * Dev helper: Link house user to Chief Medical Officer
 * Run in browser console: Meteor.call('dev.linkHouseToCMO')
 */
ServerMethods.define('dev.linkHouseToCMO', {
  description: 'Development helper: link the house demo user to the configured Chief Medical Officer practitioner',
  // Public by design (pre-migration behavior): dev-console helper, self-gated
  // by the Meteor.isProduction throw below.
  requireAuth: false
}, async function(params, context) {
  if (Meteor.isProduction) {
    throw new Meteor.Error('not-allowed', 'This method is only available in development');
  }

  const houseUser = await Meteor.users.findOneAsync({ username: 'house' });
  if (!houseUser) {
    throw new Meteor.Error('not-found', 'House user not found');
  }

  const chiefMedicalOfficerId = get(Meteor.settings, 'private.pacio.chiefMedicalOfficer.reference', '').replace('Practitioner/', '');

  if (!chiefMedicalOfficerId) {
    throw new Meteor.Error('not-configured', 'Chief Medical Officer not configured in settings');
  }

  await Meteor.users.updateAsync(
    { _id: houseUser._id },
    {
      $set: {
        practitionerId: chiefMedicalOfficerId,
        'profile.isPractitioner': true
      }
    }
  );

  context.log.info('Linked house user to Chief Medical Officer', { data: { practitionerId: chiefMedicalOfficerId } });
  return { success: true, practitionerId: chiefMedicalOfficerId };
});

/**
 * Set user as practitioner without requiring a linked practitioner record
 * This allows users to see intervention approvals and other practitioner-specific content
 */
ServerMethods.define('users.setAsPractitioner', {
  description: 'Set or clear the practitioner flag on the current user profile',
  positionalParams: ['isPractitioner'],
  schemaObject: {
    type: 'object',
    properties: { isPractitioner: { type: 'boolean' } }
  }
}, async function(params, context) {
  // Legacy default: calling with no argument means true
  const isPractitioner = (params.isPractitioner === undefined) ? true : params.isPractitioner;

  const result = await Meteor.users.updateAsync(
    { _id: context.userId },
    {
      $set: {
        'profile.isPractitioner': isPractitioner
      }
    }
  );

  context.log.info('Set user isPractitioner flag', { data: { userId: context.userId, isPractitioner: isPractitioner } });

  return result;
});

/**
 * Debug method: Link current user to Chief Medical Officer
 * This is for development/testing purposes only
 */
ServerMethods.define('debug.linkCurrentUserToCMO', {
  description: 'Link the current user to the configured (or default) Chief Medical Officer practitioner (debug)'
}, async function(params, context) {
  const chiefMedicalOfficerId = get(Meteor.settings, 'private.pacio.chiefMedicalOfficer.reference', '').replace('Practitioner/', '');

  if (!chiefMedicalOfficerId) {
    // Create a default CMO practitioner ID if not configured
    const defaultCMOId = 'chief-medical-officer';

    await Meteor.users.updateAsync(
      { _id: context.userId },
      {
        $set: {
          practitionerId: defaultCMOId,
          'profile.isPractitioner': true
        }
      }
    );

    context.log.info('Linked user to default Chief Medical Officer', { data: { userId: context.userId, practitionerId: defaultCMOId } });
    return { success: true, practitionerId: defaultCMOId, message: 'Linked to default Chief Medical Officer' };
  }

  await Meteor.users.updateAsync(
    { _id: context.userId },
    {
      $set: {
        practitionerId: chiefMedicalOfficerId,
        'profile.isPractitioner': true
      }
    }
  );

  context.log.info('Linked user to Chief Medical Officer', { data: { userId: context.userId, practitionerId: chiefMedicalOfficerId } });
  return { success: true, practitionerId: chiefMedicalOfficerId, message: `Linked to Chief Medical Officer (${chiefMedicalOfficerId})` };
});
