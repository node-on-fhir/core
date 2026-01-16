// imports/accounts/client/test-accounts.js
// Test file to debug accounts system

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { logger } from '../lib/AccountsLogger';

// Export test functions to window for console debugging
if (Meteor.isClient) {
  window.testAccounts = {
    // Test if accounts system is properly configured
    checkConfig() {
      logger.group('Test: Check Accounts Configuration');
      
      logger.info('Meteor.settings.public:', Meteor.settings?.public);
      logger.info('Accounts._options:', Accounts._options);
      logger.info('Meteor.connection:', {
        status: Meteor.connection.status(),
        connected: Meteor.connection._stream.status.connected,
        retryCount: Meteor.connection._stream.status.retryCount
      });
      
      logger.groupEnd();
    },
    
    // Test direct method call
    async testMethodCall() {
      logger.group('Test: Direct Method Call');
      
      try {
        const result = await new Promise((resolve, reject) => {
          Meteor.call('accounts.checkUsernameAvailability', 'testuser123', (error, result) => {
            if (error) {
              logger.error('Method call error:', error);
              reject(error);
            } else {
              logger.info('Method call result:', result);
              resolve(result);
            }
          });
        });
        
        return result;
      } catch (error) {
        logger.error('Test failed:', error);
        throw error;
      } finally {
        logger.groupEnd();
      }
    },
    
    // Test creating a user with minimal data
    async testMinimalCreate() {
      logger.group('Test: Minimal User Creation');
      
      const testData = {
        username: `test_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'testpass123'
      };
      
      logger.info('Test data:', testData);
      
      try {
        await new Promise((resolve, reject) => {
          logger.time('Accounts.createUser');
          
          Accounts.createUser(testData, (error) => {
            logger.timeEnd('Accounts.createUser');
            
            if (error) {
              logger.error('Create user error:', error);
              logger.error('Error stack:', error.stack);
              reject(error);
            } else {
              logger.info('User created successfully');
              resolve();
            }
          });
        });
        
        logger.info('Test completed successfully');
      } catch (error) {
        logger.error('Test failed:', error);
        throw error;
      } finally {
        logger.groupEnd();
      }
    },
    
    // Inspect Accounts internals
    inspectAccounts() {
      logger.group('Test: Inspect Accounts Internals');
      
      logger.info('Accounts object keys:', Object.keys(Accounts));
      logger.info('Accounts._accountsCallLoginMethod:', typeof Accounts._accountsCallLoginMethod);
      logger.info('Accounts.connection:', Accounts.connection);
      logger.info('Accounts._userObservesForConnections:', Accounts._userObservesForConnections);
      
      // Check for any custom configurations
      if (Accounts._options) {
        logger.info('Accounts._options:', Accounts._options);
      }
      
      if (Accounts._restrictionValidators) {
        logger.info('Restriction validators:', Accounts._restrictionValidators);
      }
      
      logger.groupEnd();
    }
  };
  
  // Auto-run basic check on startup
  Meteor.startup(() => {
    logger.info('Test accounts module loaded. Available commands:');
    logger.info('- window.testAccounts.checkConfig()');
    logger.info('- window.testAccounts.testMethodCall()');
    logger.info('- window.testAccounts.testMinimalCreate()');
    logger.info('- window.testAccounts.inspectAccounts()');
  });
}