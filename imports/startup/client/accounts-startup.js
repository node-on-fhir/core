// imports/startup/client/accounts-startup.js

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { get } from 'lodash';

// Import accounts client components
import '../../accounts/client/startup';

// Import test utilities in development
if (Meteor.isDevelopment) {
  import('../../accounts/client/test-accounts');
}

const log = (Meteor.Logger ? Meteor.Logger.for('AccountsStartup') : console);

log.info('Starting accounts client module...');

// Configure accounts UI if available
if (typeof Accounts.ui !== 'undefined') {
  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL',
    minimumPasswordLength: get(Meteor, 'settings.public.accounts.passwordPolicy.minLength', 8),
    defaultFieldValues: {
      username: '',
      email: '',
      password: ''
    }
  });
}

// Handle login redirect
Accounts.onLogin(() => {
  log.info('User logged in');

  // Subscribe to user-specific data
  Meteor.subscribe('accounts.currentUser');

  // Set the current user in session
  const user = Meteor.user();
  if (user) {
    // PII discipline: never dump the user object (emails, profile) into the
    // console — log identifying scalars in the structured data arg only.
    log.info('Setting currentUser in session', { userId: user._id, username: user.username });
    Session.set('currentUser', user);

    // Get the login token (which serves as the session access token)
    const loginToken = Accounts._storedLoginToken();
    if (loginToken) {
      log.info('Setting accountsAccessToken in session');
      Session.set('accountsAccessToken', loginToken);
    }
  }
  
  // Note: Actual navigation should be handled in React components
  // that can use the useNavigate hook
});

// Handle logout
Accounts.onLogout(() => {
  log.info('User logged out');
  
  // Clear session data
  Session.set('selectedPatientId', null);
  Session.set('selectedPatient', null);
  Session.set('twoFactorRequired', false);
  
  // Note: Navigation should be handled by React components
});

// Handle login failures
Accounts.onLoginFailure((error) => {
  log.error('Login failed', { error: error && error.reason || error && error.message });
  
  // Display user-friendly error messages
  let errorMessage = 'Login failed';
  
  switch (error.error) {
    case 'invalid-credentials':
      errorMessage = 'Invalid email or password';
      break;
    case 'user-not-found':
      errorMessage = 'No account found with that email';
      break;
    case 'incorrect-password':
      errorMessage = 'Incorrect password';
      break;
    case 'too-many-requests':
      errorMessage = 'Too many login attempts. Please try again later.';
      break;
    case 'user-blocked':
      errorMessage = 'This account has been blocked. Please contact support.';
      break;
    case 'email-not-verified':
      errorMessage = 'Please verify your email before logging in.';
      break;
    default:
      errorMessage = error.reason || 'An error occurred during login';
  }
  
  Session.set('loginError', errorMessage);
});

// Link handlers (onResetPasswordLink, onEmailVerificationLink, onEnrollmentLink)
// are registered in imports/accounts/client/startup.js to avoid duplicates.

// Auto-logout on idle
const idleTimeout = get(Meteor, 'settings.public.accounts.session.idleTimeout', 0);
if (idleTimeout > 0) {
  let idleTimer;
  
  const resetIdleTimer = () => {
    clearTimeout(idleTimer);
    
    if (Meteor.userId()) {
      idleTimer = setTimeout(() => {
        log.info('Auto-logout due to inactivity');
        Meteor.logout();
        Session.set('idleLogout', true);
      }, idleTimeout * 60 * 1000);
    }
  };
  
  // Events to track user activity
  ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetIdleTimer, true);
  });
  
  // Start the timer
  resetIdleTimer();
}

// Session extension
const extendSession = get(Meteor, 'settings.public.accounts.session.extendOnActivity', true);
if (extendSession) {
  let lastExtension = Date.now();
  const extensionInterval = 5 * 60 * 1000; // 5 minutes
  
  const tryExtendSession = () => {
    if (Meteor.userId() && Date.now() - lastExtension > extensionInterval) {
      Meteor.call('accounts.extendSession', (error) => {
        if (!error) {
          lastExtension = Date.now();
        }
      });
    }
  };
  
  // Extend session on user activity
  ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, tryExtendSession, true);
  });
}

// Check authentication requirement for routes
export const requireAuth = (context, redirect) => {
  if (!Meteor.userId()) {
    Session.set('redirectAfterLogin', context.path);
    redirect('/login');
  }
};

// Check guest access for routes
export const allowGuest = (context, redirect) => {
  if (Meteor.userId()) {
    redirect('/');
  }
};

// Check admin access
export const requireAdmin = (context, redirect) => {
  if (!Meteor.userId()) {
    Session.set('redirectAfterLogin', context.path);
    redirect('/login');
  } else if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) {
    redirect('/unauthorized');
  }
};

// Keep currentUser session variable in sync with Meteor.user()
Meteor.startup(() => {
  Tracker.autorun(() => {
    const user = Meteor.user();
    const currentSessionUser = Session.get('currentUser');
    
    // Update session if user changed
    if (user && (!currentSessionUser || currentSessionUser._id !== user._id)) {
      log.debug('Updating currentUser in session from tracker');
      Session.set('currentUser', user);
    } else if (!user && currentSessionUser) {
      log.debug('Clearing currentUser from session');
      Session.set('currentUser', null);
    }
    
    // Also ensure token is set if we have a user but no token
    if (user && !Session.get('accountsAccessToken')) {
      const loginToken = Accounts._storedLoginToken();
      if (loginToken) {
        log.debug('Setting missing accountsAccessToken');
        Session.set('accountsAccessToken', loginToken);
      }
    }
  });
});

log.info('Accounts client module started');