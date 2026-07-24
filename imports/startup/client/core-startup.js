// imports/startup/client/core-startup.js

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { get } from 'lodash';

import { initializeKeyboardShortcuts } from './hotkeys';

const log = (typeof Meteor !== 'undefined' && Meteor.Logger) ? Meteor.Logger.for('CoreStartup') : console;

// Core client initialization that always runs
log.info('Initializing Honeycomb client...');

// Set up global error handling
window.addEventListener('error', (event) => {
  log.error('Global error', { error: event.error && event.error.message, stack: event.error && event.error.stack });
  
  // Report to server if configured
  if (get(Meteor, 'settings.public.errorReporting.enabled', false)) {
    Meteor.call('errors.report', {
      message: event.error.message,
      stack: event.error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date()
    });
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  log.error('Unhandled promise rejection', { reason: event.reason && event.reason.message || String(event.reason) });
  
  // Report to server if configured
  if (get(Meteor, 'settings.public.errorReporting.enabled', false)) {
    Meteor.call('errors.report', {
      message: 'Unhandled promise rejection',
      reason: event.reason,
      url: window.location.href,
      timestamp: new Date()
    });
  }
});

// Initialize session variables
Session.setDefault('selectedPatientId', null);
Session.setDefault('selectedPatient', null);
Session.setDefault('mainAppDialogOpen', false);
Session.setDefault('theme', get(Meteor, 'settings.public.theme.default', 'light'));
Session.setDefault('sidebarOpen', true);
Session.setDefault('accountsDialogTab', 0);
Session.setDefault('showAdminLinks', false);
Session.setDefault('displayNavbars', get(Meteor, 'settings.public.defaults.displayNavbars', true));

// Set up connection monitoring
Meteor.startup(() => {
  // Monitor connection status
  Tracker.autorun(() => {
    const status = Meteor.status();
    Session.set('connectionStatus', status);
    
    if (!status.connected) {
      log.warn('Lost connection to server');
    } else if (status.connected && Session.get('wasDisconnected')) {
      log.info('Reconnected to server');
      Session.set('wasDisconnected', false);
      
      // Refresh subscriptions after reconnection
      if (Meteor.userId()) {
        // Re-subscribe to user data
        Meteor.subscribe('accounts.currentUser');
      }
    }
    
    if (!status.connected) {
      Session.set('wasDisconnected', true);
    }
  });

  // Set up viewport monitoring
  const updateViewport = () => {
    Session.set('viewport', {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth < 768,
      isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
      isDesktop: window.innerWidth >= 1024
    });
  };

  updateViewport();
  window.addEventListener('resize', updateViewport);

  // Browser compatibility check
  checkBrowserCompatibility();

  // Load user preferences
  loadUserPreferences();

  // Initialize keyboard shortcuts
  initializeKeyboardShortcuts();

  log.info('Core client startup complete');
});

// Check browser compatibility
function checkBrowserCompatibility() {
  const warnings = [];
  
  // Check for required features
  if (!window.Promise) {
    warnings.push('Promise support is required');
  }
  
  if (!window.fetch) {
    warnings.push('Fetch API is required');
  }
  
  if (!window.localStorage) {
    warnings.push('LocalStorage is required');
  }
  
  // Check browser version
  const userAgent = navigator.userAgent;
  const isIE = /MSIE|Trident/.test(userAgent);
  
  if (isIE) {
    warnings.push('Internet Explorer is not supported. Please use a modern browser.');
  }
  
  if (warnings.length > 0) {
    log.warn('Browser compatibility issues', { warnings: warnings });
    Session.set('browserWarnings', warnings);
  }
}

// Load user preferences from local storage
function loadUserPreferences() {
  try {
    const savedTheme = localStorage.getItem('userTheme');
    if (savedTheme) {
      Session.set('theme', savedTheme);
    }
    
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    if (savedSidebarState !== null) {
      Session.set('sidebarOpen', savedSidebarState === 'true');
    }
    
    const savedLanguage = localStorage.getItem('userLanguage');
    if (savedLanguage) {
      Session.set('language', savedLanguage);
    }
  } catch (error) {
    log.error('Failed to load user preferences', { error: error && error.message });
  }
}

// Export utility functions
export const ClientUtils = {
  // Get current theme
  getCurrentTheme() {
    return Session.get('theme');
  },
  
  // Set theme
  setTheme(theme) {
    Session.set('theme', theme);
    localStorage.setItem('userTheme', theme);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
  },
  
  // Check if mobile
  isMobile() {
    return Session.get('viewport')?.isMobile || false;
  },
  
  // Check if tablet
  isTablet() {
    return Session.get('viewport')?.isTablet || false;
  },
  
  // Check if desktop
  isDesktop() {
    return Session.get('viewport')?.isDesktop || true;
  },
  
  // Get connection status
  getConnectionStatus() {
    return Session.get('connectionStatus');
  },
  
  // Check if connected
  isConnected() {
    return Session.get('connectionStatus')?.connected || false;
  }
};