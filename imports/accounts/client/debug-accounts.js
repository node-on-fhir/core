// imports/accounts/client/debug-accounts.js
// Debug utilities for accounts system

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { DDP } from 'meteor/ddp-client';

if (Meteor.isClient) {
  // Override Accounts.createUser to add logging
  const originalCreateUser = Accounts.createUser.bind(Accounts);
  
  Accounts.createUser = function(options, callback) {
    console.group('[Debug] Accounts.createUser');
    console.log('Options:', options);
    console.log('Callback provided:', !!callback);
    
    // Log the actual DDP call
    const originalCall = Meteor.connection.call.bind(Meteor.connection);
    let callIntercepted = false;
    
    Meteor.connection.call = function(...args) {
      if (!callIntercepted && args[0] === 'createUser') {
        callIntercepted = true;
        console.log('[Debug] DDP call intercepted:');
        console.log('Method:', args[0]);
        console.log('Parameters:', args[1]);
        console.log('Callback:', typeof args[args.length - 1]);
      }
      return originalCall.apply(this, args);
    };
    
    try {
      console.log('[Debug] Calling original createUser');
      const result = originalCreateUser(options, function(error) {
        console.log('[Debug] createUser callback fired');
        console.log('Error:', error);
        console.groupEnd();
        
        // Restore original call
        Meteor.connection.call = originalCall;
        
        if (callback) {
          callback(error);
        }
      });
      
      console.log('[Debug] createUser returned:', result);
      return result;
    } catch (error) {
      console.error('[Debug] createUser threw error:', error);
      console.groupEnd();
      
      // Restore original call
      Meteor.connection.call = originalCall;
      
      throw error;
    }
  };
  
  // Also log any DDP messages related to createUser
  Meteor.connection._stream.on('message', function(message) {
    const parsed = DDP._parseDDP(message);
    if (parsed && parsed.id && (parsed.error || parsed.result)) {
      // This might be a response to createUser
      if (parsed.error && parsed.error.reason && parsed.error.reason.includes('credentials')) {
        console.log('[Debug] DDP Error Response:', parsed);
      }
    }
  });
  
  console.log('[Debug] Accounts debug module loaded');
}