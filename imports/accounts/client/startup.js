// imports/accounts/client/startup.js

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { get } from 'lodash';
import { logger } from '../lib/AccountsLogger';

// Configure accounts UI and client behavior
Meteor.startup(() => {
  logger.group('Accounts Client Startup');
  logger.info('Initializing accounts client...');

  // Accounts UI configuration is handled in accounts-startup.js to avoid conflicts

  // Configure client-side accounts behavior
  // Note: We're removing forbidClientAccountCreation from client config
  // as it should only be set on the server
  const clientConfig = {
    sendVerificationEmail: get(Meteor, 'settings.public.accounts.features.requireEmailVerification', false),
    restrictCreationByEmailDomain: get(Meteor, 'settings.public.accounts.allowedDomains', null),
    loginExpirationInDays: get(Meteor, 'settings.public.accounts.session.expirationDays', 90)
  };
  
  logger.info('Client accounts configuration:', clientConfig);
  Accounts.config(clientConfig);

  // Setup OAuth service configurations if available
  const oauthConfig = get(Meteor, 'settings.public.accounts.oauth', {});
  
  if (oauthConfig.google) {
    ServiceConfiguration.configurations.upsert(
      { service: 'google' },
      {
        $set: {
          loginStyle: 'popup',
          ...oauthConfig.google
        }
      }
    );
  }

  if (oauthConfig.github) {
    ServiceConfiguration.configurations.upsert(
      { service: 'github' },
      {
        $set: {
          loginStyle: 'popup',
          ...oauthConfig.github
        }
      }
    );
  }

  if (oauthConfig.facebook) {
    ServiceConfiguration.configurations.upsert(
      { service: 'facebook' },
      {
        $set: {
          loginStyle: 'popup',
          ...oauthConfig.facebook
        }
      }
    );
  }

  // Note: Account validation is handled on the server side
  // Client-side validation can be done in the UI before submission

  // Handle account enrollment (for invited users)
  Accounts.onEnrollmentLink((token, done) => {
    // Custom enrollment handling
    console.log('Enrollment token received:', token);
    // Navigate to enrollment page with token
    window.location.href = `/enroll-account/${token}`;
    done();
  });

  // Handle password reset
  Accounts.onResetPasswordLink((token, done) => {
    // Custom password reset handling
    console.log('Password reset token received:', token);
    // Navigate to password reset page with token
    window.location.href = `/reset-password/${token}`;
    done();
  });

  // Handle email verification
  Accounts.onEmailVerificationLink((token, done) => {
    // Custom email verification handling
    Accounts.verifyEmail(token, (error) => {
      if (error) {
        console.error('Email verification failed:', error);
        // Show error message to user
      } else {
        console.log('Email verified successfully');
        // Show success message to user
      }
      done();
    });
  });

  // Session activity tracking
  if (get(Meteor, 'settings.public.accounts.session.trackActivity', true)) {
    let activityTimer;
    const activityTimeout = get(Meteor, 'settings.public.accounts.session.activityTimeout', 5000);
    
    const trackActivity = () => {
      if (Meteor.userId()) {
        clearTimeout(activityTimer);
        activityTimer = setTimeout(() => {
          Meteor.call('accounts.recordActivity');
        }, activityTimeout);
      }
    };

    // Track various user activities
    ['click', 'keypress', 'mousemove', 'touchstart'].forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });
  }

  // Auto-logout on inactivity
  const sessionTimeout = get(Meteor, 'settings.public.accounts.session.timeout', 30) * 60 * 1000;
  if (sessionTimeout > 0) {
    let inactivityTimer;
    
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      if (Meteor.userId()) {
        inactivityTimer = setTimeout(() => {
          console.log('Session timeout - logging out');
          Meteor.logout();
        }, sessionTimeout);
      }
    };

    // Reset timer on activity
    ['click', 'keypress', 'mousemove', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    // Start timer
    resetInactivityTimer();
  }

  logger.info('Accounts client initialized successfully');
  logger.groupEnd();
});