// client/debug-accounts.js
// Emergency debug for accounts system

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

// Override the connection's call method to intercept all DDP calls
const originalCall = Meteor.connection.call.bind(Meteor.connection);

Meteor.connection.call = function(name, ...args) {
  if (name === 'createUser' || name === 'login') {
    console.group(`[Debug DDP] ${name}`);
    console.log('Method:', name);
    console.log('Arguments:', args);
    console.log('Stack trace:', new Error().stack);
    console.groupEnd();
  }
  
  return originalCall.apply(this, [name, ...args]);
};

// Override Accounts._loginRequest to see what's happening
const original_loginRequest = Accounts._loginRequest.bind(Accounts);
Accounts._loginRequest = function(methodName, methodArguments, callback) {
  console.group('[Debug] Accounts._loginRequest');
  console.log('Method name:', methodName);
  console.log('Method arguments:', methodArguments);
  console.log('Callback:', typeof callback);
  
  const wrappedCallback = callback ? function(error, result) {
    console.log('Login request callback - error:', error);
    console.log('Login request callback - result:', result);
    console.groupEnd();
    return callback(error, result);
  } : callback;
  
  return original_loginRequest(methodName, methodArguments, wrappedCallback);
};

// Check if there are any validators
console.log('[Debug] Checking for validators...');
console.log('Accounts._restrictionValidators:', Accounts._restrictionValidators);
console.log('Accounts._validateNewUserHooks:', Accounts._validateNewUserHooks);
console.log('Accounts._options:', Accounts._options);

// Create a test function to bypass all client validation
window.debugCreateUser = function(options) {
  console.group('[Debug] Direct DDP createUser call');
  
  Meteor.connection.call('createUser', options, (error, result) => {
    if (error) {
      console.error('Direct createUser error:', error);
      console.error('Error details:', {
        error: error.error,
        reason: error.reason,
        details: error.details,
        message: error.message
      });
    } else {
      console.log('Direct createUser success:', result);
    }
    console.groupEnd();
  });
};

console.log('[Debug] Accounts debug loaded. Try window.debugCreateUser({ username: "test", email: "test@example.com", password: "password123" })');