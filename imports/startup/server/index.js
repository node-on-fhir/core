// imports/startup/server/index.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Core startup (always runs)
import './core-startup';

// Conditional imports based on configuration
Meteor.startup(() => {
  // Check if accounts module is enabled
  const accountsEnabled = get(Meteor, 'settings.public.modules.accounts.enabled', true);
  
  if (accountsEnabled) {
    console.log('Loading accounts server module...');
    import('./accounts-startup').then(() => {
      console.log('Accounts server module loaded');
    }).catch(error => {
      console.error('Failed to load accounts server module:', error);
    });
  }

  // Load middleware based on authentication mode
  const authMode = get(Meteor, 'settings.private.accounts.authMode', 'traditional');
  console.log(`Loading ${authMode} authentication middleware...`);
  
  switch (authMode) {
    case 'traditional':
      import('./middleware-traditional').catch(console.error);
      break;
    case 'vpn':
      import('./middleware-vpn').catch(console.error);
      break;
    case 'anonymous':
      import('./middleware-anonymous').catch(console.error);
      break;
    case 'mobile':
      import('./middleware-mobile').catch(console.error);
      break;
    default:
      console.warn(`Unknown auth mode: ${authMode}, loading traditional`);
      import('./middleware-traditional').catch(console.error);
  }

  // Load additional server modules
  const modules = get(Meteor, 'settings.private.modules', {});
  
  // Email module
  if (modules.email?.enabled) {
    import(/* webpackIgnore: true */ './email-startup').catch(error => {
      console.warn('Email startup module not found:', error.message);
    });
  } else {
    console.log('Email module disabled in settings');
  }

  // Scheduler module
  if (modules.scheduler?.enabled) {
    import(/* webpackIgnore: true */ './scheduler-startup').catch(error => {
      console.warn('Scheduler startup module not found:', error.message);
    });
  } else {
    console.log('Scheduler module disabled in settings');
  }

  // Monitoring module
  if (modules.monitoring?.enabled) {
    import(/* webpackIgnore: true */ './monitoring-startup').catch(error => {
      console.warn('Monitoring startup module not found:', error.message);
    });
  } else {
    console.log('Monitoring module disabled in settings');
  }
});