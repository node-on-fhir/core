// imports/startup/client/index.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Core startup (always runs)
import './core-startup';

// Initialize collections (always runs)
import './collections';

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
    import('./analytics-startup').catch(console.error);
  }

  // Chat module
  if (modules.chat?.enabled) {
    import('./chat-startup').catch(console.error);
  }

  // Notifications module
  if (modules.notifications?.enabled) {
    import('./notifications-startup').catch(console.error);
  }
});