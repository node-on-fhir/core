// imports/accounts/client/hooks/useDevAutoLogin.js

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { useEffect, useState } from 'react';
import { logger } from '../../lib/AccountsLogger';

export function useDevAutoLogin() {
  const [autoLoginStatus, setAutoLoginStatus] = useState('idle');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Only run in development and if not already logged in
    if (!Meteor.isDevelopment || Meteor.userId()) {
      return;
    }
    
    // Check if auto-login is enabled via public settings
    const autoLoginEnabled = Meteor.settings?.public?.devAutoLoginEnabled;
    if (!autoLoginEnabled) {
      logger.debug('Dev auto-login not enabled in settings');
      return;
    }
    
    const performAutoLogin = async () => {
      setAutoLoginStatus('loading');
      logger.group('DevAutoLogin');
      logger.info('Attempting development auto-login...');
      
      try {
        // Request auto-login token from server
        // No credentials are sent - server generates token based on env vars
        const loginData = await new Promise((resolve, reject) => {
          Meteor.call('dev.getAutoLoginToken', (error, result) => {
            if (error) {
              logger.error('Failed to get auto-login token:', error);
              reject(error);
            } else {
              logger.info('Received auto-login token');
              resolve(result);
            }
          });
        });
        
        // Use the token to log in
        // This is the same as Meteor does internally after password validation
        await new Promise((resolve, reject) => {
          Accounts.loginWithToken(loginData.token, (error) => {
            if (error) {
              logger.error('Failed to login with token:', error);
              reject(error);
            } else {
              logger.info('Successfully logged in with dev account');
              resolve();
            }
          });
        });
        
        setAutoLoginStatus('success');
        
        // Show development mode warning
        console.warn('%c⚠️ DEVELOPMENT AUTO-LOGIN ACTIVE', 
          'background: #ff6b6b; color: white; padding: 5px 10px; font-size: 14px; font-weight: bold;');
        
      } catch (err) {
        logger.error('Auto-login failed:', err);
        setError(err.reason || err.message);
        setAutoLoginStatus('error');
      } finally {
        logger.groupEnd();
      }
    };
    
    // Small delay to ensure Meteor connection is ready
    const timeoutId = setTimeout(performAutoLogin, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  return { autoLoginStatus, error };
}