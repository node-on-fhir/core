// imports/accounts/client/hooks/useAuth.js

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { useTracker } from 'meteor/react-meteor-data';
import { useState, useEffect, useCallback } from 'react';
import { get } from 'lodash';

export function useAuth() {
  const [authState, setAuthState] = useState({
    isInitialized: false,
    isConfigured: true,
    accountsEnabled: true
  });

  // Track user authentication state
  const currentUser = useTracker(() => {
    const user = Meteor.user();
    const userId = Meteor.userId();
    const loggingIn = Meteor.loggingIn();
    
    return {
      user,
      userId,
      loggingIn,
      isAuthenticated: !!userId && !loggingIn
    };
  });

  // Check if accounts system is enabled
  useEffect(() => {
    const checkAccountsStatus = async () => {
      try {
        // Check settings for accounts configuration
        const accountsEnabled = get(Meteor, 'settings.public.modules.accounts.enabled', true);
        const isFirstRun = get(Meteor, 'settings.public.firstRun', false);
        
        setAuthState({
          isInitialized: true,
          isConfigured: !isFirstRun,
          accountsEnabled
        });
      } catch (error) {
        console.error('Error checking accounts status:', error);
        setAuthState({
          isInitialized: true,
          isConfigured: true,
          accountsEnabled: true
        });
      }
    };

    checkAccountsStatus();
  }, []);

  // Auth methods
  const login = useCallback(async (email, password) => {
    return new Promise((resolve, reject) => {
      Meteor.loginWithPassword(email, password, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(Meteor.user());
        }
      });
    });
  }, []);

  const logout = useCallback(async () => {
    return new Promise((resolve, reject) => {
      Meteor.logout((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }, []);

  const signup = useCallback(async (options) => {
    return new Promise((resolve, reject) => {
      // TODO: Implement custom signup logic
      // For now, use standard Accounts.createUser
      console.log('Signup options:', options);
      reject(new Error('Signup not implemented'));
    });
  }, []);

  const forgotPassword = useCallback(async (email) => {
    return new Promise((resolve, reject) => {
      // TODO: Implement password reset
      console.log('Password reset for:', email);
      resolve();
    });
  }, []);

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    return new Promise((resolve, reject) => {
      Accounts.changePassword(oldPassword, newPassword, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }, []);

  // Role checking
  const hasRole = useCallback((role, group) => {
    if (!currentUser.userId) return false;
    
    // TODO: Implement role checking based on your roles package
    // This is a placeholder implementation
    const userRoles = get(currentUser.user, 'roles', []);
    if (group) {
      return get(userRoles, group, []).includes(role);
    }
    return userRoles.includes(role);
  }, [currentUser.user, currentUser.userId]);

  const hasAnyRole = useCallback((roles, group) => {
    return roles.some(role => hasRole(role, group));
  }, [hasRole]);

  const hasAllRoles = useCallback((roles, group) => {
    return roles.every(role => hasRole(role, group));
  }, [hasRole]);

  return {
    // State
    ...currentUser,
    ...authState,
    
    // Methods
    login,
    logout,
    signup,
    forgotPassword,
    changePassword,
    
    // Role checking
    hasRole,
    hasAnyRole,
    hasAllRoles,
    
    // Computed properties
    isReady: authState.isInitialized && !currentUser.loggingIn,
    requiresSetup: authState.isInitialized && !authState.isConfigured,
    canUseAccounts: authState.accountsEnabled && authState.isConfigured
  };
}