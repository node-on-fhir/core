// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/accounts/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get, set } from 'lodash';

// ONC 170.315(d)(1) - Authentication, Access Control, Authorization
Meteor.methods({
  'accounts.getUserList': async function(options = {}) {
    console.log('Getting user list for accounts management', options);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be authenticated');
    }
    
    // Check if user has admin or clinician role
    const currentUser = await Meteor.users.findOneAsync(this.userId);
    if (!currentUser || (!currentUser.roles?.includes('admin') && !currentUser.roles?.includes('clinician'))) {
      throw new Meteor.Error('forbidden', 'User must be admin or clinician');
    }
    
    try {
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
      
      const users = await Meteor.users.find(query, {
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
          lastLogin: 1,
          'services.resume.loginTokens': 1,
          'services.twoFactor': 1
        }
      }).fetchAsync();
      
      const totalCount = await Meteor.users.find(query).countAsync();
      
      return {
        users: users,
        totalCount: totalCount,
        hasMore: (skip + limit) < totalCount
      };
      
    } catch (error) {
      console.error('Error getting user list:', error);
      throw new Meteor.Error('query-failed', 'Failed to get user list', error.message);
    }
  },
  
  'accounts.getUserDetails': async function(userId) {
    console.log('Getting detailed user information', { userId });
    
    check(userId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be authenticated');
    }
    
    // Check if user has admin role for detailed access
    const currentUser = await Meteor.users.findOneAsync(this.userId);
    if (!currentUser?.roles?.includes('admin')) {
      throw new Meteor.Error('forbidden', 'Admin role required for detailed user information');
    }
    
    try {
      const user = await Meteor.users.findOneAsync(userId, {
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
      
      if (!user) {
        throw new Meteor.Error('user-not-found', 'User not found');
      }
      
      // Get authentication tokens (sanitized)
      const loginTokens = user.services?.resume?.loginTokens || [];
      const sanitizedTokens = loginTokens.map(token => ({
        when: token.when,
        hashedToken: token.hashedToken ? token.hashedToken.substring(0, 8) + '...' : null
      }));
      
      // Get authorized applications/services
      const authorizedServices = Object.keys(user.services || {}).filter(key => key !== 'resume');
      
      return {
        user: user,
        authenticationTokens: sanitizedTokens,
        authorizedServices: authorizedServices,
        twoFactorEnabled: user.services?.twoFactor?.enabled || false
      };
      
    } catch (error) {
      console.error('Error getting user details:', error);
      throw new Meteor.Error('query-failed', 'Failed to get user details', error.message);
    }
  },
  
  'accounts.updateUserRoles': async function(userId, roles) {
    console.log('Updating user roles', { userId, roles });
    
    check(userId, String);
    check(roles, [String]);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be authenticated');
    }
    
    // Check if user has admin role
    const currentUser = await Meteor.users.findOneAsync(this.userId);
    if (!currentUser?.roles?.includes('admin')) {
      throw new Meteor.Error('forbidden', 'Admin role required to update user roles');
    }
    
    try {
      await Meteor.users.updateAsync(userId, {
        $set: { roles: roles }
      });
      
      console.log('User roles updated successfully');
      return { success: true };
      
    } catch (error) {
      console.error('Error updating user roles:', error);
      throw new Meteor.Error('update-failed', 'Failed to update user roles', error.message);
    }
  },
  
  'accounts.revokeUserTokens': async function(userId) {
    console.log('Revoking user authentication tokens', { userId });
    
    check(userId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be authenticated');
    }
    
    // Check if user has admin role
    const currentUser = await Meteor.users.findOneAsync(this.userId);
    if (!currentUser?.roles?.includes('admin')) {
      throw new Meteor.Error('forbidden', 'Admin role required to revoke tokens');
    }
    
    try {
      // Clear all login tokens
      await Meteor.users.updateAsync(userId, {
        $unset: { 'services.resume.loginTokens': 1 }
      });
      
      console.log('User tokens revoked successfully');
      return { success: true, revokedAt: new Date().toISOString() };
      
    } catch (error) {
      console.error('Error revoking user tokens:', error);
      throw new Meteor.Error('revoke-failed', 'Failed to revoke user tokens', error.message);
    }
  },
  
  'accounts.getAccessControlMatrix': async function() {
    console.log('Getting access control matrix');
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be authenticated');
    }
    
    // Check if user has admin role
    const currentUser = await Meteor.users.findOneAsync(this.userId);
    if (!currentUser?.roles?.includes('admin')) {
      throw new Meteor.Error('forbidden', 'Admin role required for access control matrix');
    }
    
    try {
      // Get all unique roles from users
      const users = await Meteor.users.find({}, { fields: { roles: 1 } }).fetchAsync();
      const allRoles = [...new Set(users.flatMap(user => user.roles || []))];
      
      // Define system permissions/resources
      const systemResources = [
        'patients.read',
        'patients.write',
        'practitioners.read', 
        'practitioners.write',
        'observations.read',
        'observations.write',
        'encounters.read',
        'encounters.write',
        'medications.read',
        'medications.write',
        'admin.users',
        'admin.system',
        'reports.clinical',
        'reports.quality'
      ];
      
      // Simulate access control matrix
      const accessMatrix = allRoles.map(role => {
        const permissions = systemResources.map(resource => {
          // Simple logic - admins get all, clinicians get clinical resources, users get read-only
          let hasAccess = false;
          if (role === 'admin') {
            hasAccess = true;
          } else if (role === 'clinician') {
            hasAccess = !resource.startsWith('admin');
          } else if (role === 'user') {
            hasAccess = resource.endsWith('.read') && !resource.startsWith('admin');
          }
          
          return {
            resource: resource,
            granted: hasAccess
          };
        });
        
        return {
          role: role,
          permissions: permissions
        };
      });
      
      return {
        roles: allRoles,
        resources: systemResources,
        matrix: accessMatrix
      };
      
    } catch (error) {
      console.error('Error getting access control matrix:', error);
      throw new Meteor.Error('query-failed', 'Failed to get access control matrix', error.message);
    }
  }
});