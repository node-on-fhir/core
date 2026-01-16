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

console.log('Starting accounts client module...');

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
  console.log('User logged in');
  
  // Subscribe to user-specific data
  Meteor.subscribe('accounts.currentUser');
  
  // Set the current user in session
  const user = Meteor.user();
  if (user) {
    console.log('Setting currentUser in session:', user);
    Session.set('currentUser', user);
    
    // Get the login token (which serves as the session access token)
    const loginToken = Accounts._storedLoginToken();
    if (loginToken) {
      console.log('Setting accountsAccessToken in session');
      Session.set('accountsAccessToken', loginToken);
    }
  }
  
  // Check if two-factor is required
  Meteor.call('accounts.checkTwoFactor', (error, result) => {
    if (result?.required && !result?.verified) {
      Session.set('twoFactorRequired', true);
    }
  });
  
  // Note: Actual navigation should be handled in React components
  // that can use the useNavigate hook
});

// Handle logout
Accounts.onLogout(() => {
  console.log('User logged out');
  
  // Clear session data
  Session.set('selectedPatientId', null);
  Session.set('selectedPatient', null);
  Session.set('twoFactorRequired', false);
  
  // Note: Navigation should be handled by React components
});

// Handle login failures
Accounts.onLoginFailure((error) => {
  console.error('Login failed:', error);
  
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

// Password reset handling
Accounts.onResetPasswordLink((token, done) => {
  Session.set('resetPasswordToken', token);
  // Navigation to reset password page should be handled by the app
  done();
});

// Email verification handling
Accounts.onEmailVerificationLink((token, done) => {
  Accounts.verifyEmail(token, (error) => {
    if (error) {
      console.error('Email verification failed:', error);
      Session.set('emailVerificationError', error.reason);
    } else {
      console.log('Email verified successfully');
      Session.set('emailVerificationSuccess', true);
    }
  });
  done();
});

// Enrollment handling (for invited users)
Accounts.onEnrollmentLink((token, done) => {
  Session.set('enrollmentToken', token);
  // Navigation to enrollment page should be handled by the app
  done();
});

// Auto-logout on idle
const idleTimeout = get(Meteor, 'settings.public.accounts.session.idleTimeout', 0);
if (idleTimeout > 0) {
  let idleTimer;
  
  const resetIdleTimer = () => {
    clearTimeout(idleTimer);
    
    if (Meteor.userId()) {
      idleTimer = setTimeout(() => {
        console.log('Auto-logout due to inactivity');
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
      console.log('Updating currentUser in session from tracker');
      Session.set('currentUser', user);
    } else if (!user && currentSessionUser) {
      console.log('Clearing currentUser from session');
      Session.set('currentUser', null);
    }
    
    // Also ensure token is set if we have a user but no token
    if (user && !Session.get('accountsAccessToken')) {
      const loginToken = Accounts._storedLoginToken();
      if (loginToken) {
        console.log('Setting missing accountsAccessToken');
        Session.set('accountsAccessToken', loginToken);
      }
    }
  });
});

console.log('Accounts client module started');