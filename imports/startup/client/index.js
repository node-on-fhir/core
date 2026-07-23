// imports/startup/client/index.js

import './extensions.js';

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

const log = (typeof Meteor !== 'undefined' && Meteor.Logger) ? Meteor.Logger.for('ClientStartup') : console;

// Core startup (always runs)
import './core-startup';

// Initialize collections (always runs)
import './collections';

// Register FHIR Detail components with fhir-react dispatcher
import './fhir-resource-registry';

// Register FHIR Preview components with DynamicFhirViews dispatcher
import './fhir-preview-registry';

// Session overrides for ObjectID handling
import './session-overrides';

// Patient subscription tracking
import './patient-subscription-tracker';

// Conditional imports based on configuration
Meteor.startup(() => {
  // Check if accounts module is enabled
  const accountsEnabled = get(Meteor, 'settings.public.modules.accounts.enabled', true);
  
  if (accountsEnabled) {
    log.info('Loading accounts module...');
    import('./accounts-startup').then(() => {
      log.info('Accounts module loaded');
    }).catch(error => {
      log.error('Failed to load accounts module', { error: error && error.message });
    });
  }

  // Check if OAuth is configured
  const oauthEnabled = Object.keys(get(Meteor, 'settings.public.accounts.oauth', {}))
    .some(provider => get(Meteor, `settings.public.accounts.oauth.${provider}`, false));
  
  if (oauthEnabled) {
    log.info('Loading OAuth module...');
    import('./oauth-startup').then(() => {
      log.info('OAuth module loaded');
    }).catch(error => {
      log.error('Failed to load OAuth module', { error: error && error.message });
    });
  }

  // Load additional modules based on configuration
  const modules = get(Meteor, 'settings.public.modules', {});

  // Analytics module
  if (modules.analytics?.enabled) {
    import(/* webpackIgnore: true */ './analytics-startup').catch(error => {
      log.warn('Analytics startup module not found', { error: error.message });
    });
  } else {
    log.info('Analytics module disabled in settings');
  }

  // Chat module
  if (modules.chat?.enabled) {
    import(/* webpackIgnore: true */ './chat-startup').catch(error => {
      log.warn('Chat startup module not found', { error: error.message });
    });
  } else {
    log.info('Chat module disabled in settings');
  }

  // Notifications module
  if (modules.notifications?.enabled) {
    import(/* webpackIgnore: true */ './notifications-startup').catch(error => {
      log.warn('Notifications startup module not found', { error: error.message });
    });
  } else {
    log.info('Notifications module disabled in settings');
  }

  // DICOM Viewer with Cornerstone3D
  // (Previously dumped the entire Meteor.settings + settings.public here —
  // trimmed to the one relevant config object.)
  const dicomEnabled = get(Meteor, 'settings.public.modules.DicomViewer.enabled', false);
  log.info('DICOM viewer settings', { enabled: dicomEnabled, config: get(Meteor, 'settings.public.modules.DicomViewer') });

  if (dicomEnabled) {
    log.info('Loading DICOM viewer (Cornerstone3D)...');
    import('./cornerstone-setup').then(({ initializeCornerstone3D }) => {
      log.debug('Calling initializeCornerstone3D()...');
      return initializeCornerstone3D();
    }).then(result => {
      if (result) {
        log.info('Cornerstone3D initialized and ready', { modules: Object.keys(result || {}) });
      } else {
        log.info('Cornerstone3D initialization skipped (disabled in settings)');
      }
    }).catch(error => {
      log.error('Failed to initialize Cornerstone3D', { error: error && error.message });
    });
  } else {
    log.info('DICOM viewer disabled in settings');
  }
});