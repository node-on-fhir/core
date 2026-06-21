// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/accounts/server/publications.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

// Publication for accounts management - admin/clinician only
Meteor.publish('accounts.userManagement', function(options = {}) {
  check(options, {
    limit: Match.Optional(Number),
    skip: Match.Optional(Number),
    search: Match.Optional(String)
  });
  
  // Check authentication
  if (!this.userId) {
    return this.ready();
  }
  
  // Check if user has admin or clinician role
  const currentUser = Meteor.users.findOne(this.userId);
  if (!currentUser || (!currentUser.roles?.includes('admin') && !currentUser.roles?.includes('clinician'))) {
    return this.ready();
  }
  
  const { limit = 50, skip = 0, search = '' } = options;
  
  let query = {};
  if (search) {
    query = {
      $or: [
        { 'emails.address': { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { 'profile.name': { $regex: search, $options: 'i' } }
      ]
    };
  }
  
  return Meteor.users.find(query, {
    limit: limit,
    skip: skip,
    sort: { createdAt: -1 },
    fields: {
      username: 1,
      emails: 1,
      profile: 1,
      roles: 1,
      status: 1,
      createdAt: 1,
      lastLogin: 1
    }
  });
});

// Publication for detailed user information - admin only
Meteor.publish('accounts.userDetails', function(userId) {
  check(userId, String);
  
  // Check authentication
  if (!this.userId) {
    return this.ready();
  }
  
  // Check if user has admin role
  const currentUser = Meteor.users.findOne(this.userId);
  if (!currentUser?.roles?.includes('admin')) {
    return this.ready();
  }
  
  return Meteor.users.find(userId, {
    fields: {
      username: 1,
      emails: 1,
      profile: 1,
      roles: 1,
      status: 1,
      createdAt: 1,
      lastLogin: 1,
      'services.resume.loginTokens': 1,
      'services.twoFactor': 1,
      'services.oauth': 1,
      practitionerId: 1,
      patientId: 1
    }
  });
});