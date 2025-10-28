// imports/startup/client/index.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Core startup (always runs)
import './core-startup';

// Initialize collections (always runs)
import './collections';

// Session overrides for ObjectID handling
import './session-overrides';

// Patient subscription tracking
import './patient-subscription-tracker';

// Conditional imports based on configuration
Meteor.startup(() => {
  // Check if accounts module is enabled
  const accountsEnabled = get(Meteor, 'settings.public.modules.accounts.enabled', true);
  
  if (accountsEnabled) {
    console.log('Loading accounts module...');
    import('./accounts-startup').then(() => {
      console.log('Accounts module loaded');
    }).catch(error => {
      console.error('Failed to load accounts module:', error);
    });
  }

  // Check if OAuth is configured
  const oauthEnabled = Object.keys(get(Meteor, 'settings.public.accounts.oauth', {}))
    .some(provider => get(Meteor, `settings.public.accounts.oauth.${provider}`, false));
  
  if (oauthEnabled) {
    console.log('Loading OAuth module...');
    import('./oauth-startup').then(() => {
      console.log('OAuth module loaded');
    }).catch(error => {
      console.error('Failed to load OAuth module:', error);
    });
  }

  // Load additional modules based on configuration
  const modules = get(Meteor, 'settings.public.modules', {});

  // Analytics module
  if (modules.analytics?.enabled) {
    import(/* webpackIgnore: true */ './analytics-startup').catch(error => {
      console.warn('Analytics startup module not found:', error.message);
    });
  } else {
    console.log('Analytics module disabled in settings');
  }

  // Chat module
  if (modules.chat?.enabled) {
    import(/* webpackIgnore: true */ './chat-startup').catch(error => {
      console.warn('Chat startup module not found:', error.message);
    });
  } else {
    console.log('Chat module disabled in settings');
  }

  // Notifications module
  if (modules.notifications?.enabled) {
    import(/* webpackIgnore: true */ './notifications-startup').catch(error => {
      console.warn('Notifications startup module not found:', error.message);
    });
  } else {
    console.log('Notifications module disabled in settings');
  }
});