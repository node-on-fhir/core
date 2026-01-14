// packages/multi-factor-auth/server/index.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { MFACore, DefaultMFAPolicies } from '../lib/MFACore';

// Import server-side methods
import './methods.js';

console.log('Multi-Factor Authentication package server-side loaded');

// Enhanced MFA login hooks - only set up if Accounts is available
Meteor.startup(function() {
  // Check if Accounts package is available
  if (typeof Accounts !== 'undefined') {
    console.log('Setting up MFA login hooks with Accounts package');
    
    // Hook into the login process to check MFA requirements
    Accounts.onLogin(function(loginInfo) {
      const user = loginInfo.user;
      
      if (user && MFACore.requiresMFA(user, DefaultMFAPolicies.roleBasedStandard)) {
        const mfaEnabled = get(user, 'mfa.totp.enabled', false);
        
        if (!mfaEnabled) {
          console.log(`User ${user._id} requires MFA but hasn't configured it yet`);
          // Don't prevent login, but log for tracking
        }
      }
    });
  } else {
    console.log('Accounts package not available - MFA hooks not installed');
  }

  // Add MFA status to user publications
  Meteor.publish('mfa.status', function() {
    if (!this.userId) {
      return this.ready();
    }

    return Meteor.users.find(
      { _id: this.userId },
      {
        fields: {
          'mfa.totp.enabled': 1,
          'mfa.backup.enabled': 1,
          'mfa.backup.codesRemaining': 1,
          'mfa.lastUsed': 1,
          'mfa.lastSetup': 1
        }
      }
    );
  });
});