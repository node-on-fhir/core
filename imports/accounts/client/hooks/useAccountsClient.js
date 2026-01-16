// imports/accounts/client/hooks/useAccountsClient.js

import { Meteor } from 'meteor/meteor';
import { useState, useEffect, useCallback } from 'react';
import { get } from 'lodash';

// Custom accounts client configuration hook
export function useAccountsClient() {
  const [config, setConfig] = useState({
    oauth: {
      google: false,
      github: false,
      facebook: false
    },
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    },
    twoFactor: {
      enabled: false,
      required: false,
      methods: ['totp', 'sms']
    },
    session: {
      timeout: 30, // minutes
      extendOnActivity: true,
      singleSession: false
    }
  });

  const [features, setFeatures] = useState({
    allowSignup: true,
    allowPasswordReset: true,
    allowProfileEdit: true,
    requireEmailVerification: false,
    allowUsernameLogin: false
  });

  // Load configuration from settings
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Get accounts configuration from settings
        const accountsConfig = get(Meteor, 'settings.public.accounts', {});
        
        setConfig(prev => ({
          ...prev,
          ...accountsConfig.config
        }));
        
        setFeatures(prev => ({
          ...prev,
          ...accountsConfig.features
        }));
      } catch (error) {
        console.error('Error loading accounts configuration:', error);
      }
    };

    loadConfig();
  }, []);

  // OAuth login methods
  const loginWithGoogle = useCallback(() => {
    if (!config.oauth.google) {
      throw new Error('Google OAuth is not configured');
    }
    
    Meteor.loginWithGoogle({
      requestPermissions: ['email', 'profile']
    }, (error) => {
      if (error) {
        console.error('Google login failed:', error);
        throw error;
      }
    });
  }, [config.oauth.google]);

  const loginWithGithub = useCallback(() => {
    if (!config.oauth.github) {
      throw new Error('GitHub OAuth is not configured');
    }
    
    Meteor.loginWithGithub({
      requestPermissions: ['user:email']
    }, (error) => {
      if (error) {
        console.error('GitHub login failed:', error);
        throw error;
      }
    });
  }, [config.oauth.github]);

  const loginWithFacebook = useCallback(() => {
    if (!config.oauth.facebook) {
      throw new Error('Facebook OAuth is not configured');
    }
    
    Meteor.loginWithFacebook({
      requestPermissions: ['email', 'public_profile']
    }, (error) => {
      if (error) {
        console.error('Facebook login failed:', error);
        throw error;
      }
    });
  }, [config.oauth.facebook]);

  // Password validation
  const validatePassword = useCallback((password) => {
    const policy = config.passwordPolicy;
    const errors = [];

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [config.passwordPolicy]);

  // Session management
  const extendSession = useCallback(async () => {
    if (config.session.extendOnActivity) {
      try {
        await Meteor.callAsync('accounts.extendSession');
      } catch (error) {
        console.error('Failed to extend session:', error);
      }
    }
  }, [config.session.extendOnActivity]);

  // Two-factor authentication
  const setupTwoFactor = useCallback(async (method = 'totp') => {
    if (!config.twoFactor.enabled) {
      throw new Error('Two-factor authentication is not enabled');
    }

    if (!config.twoFactor.methods.includes(method)) {
      throw new Error(`Two-factor method ${method} is not supported`);
    }

    try {
      const result = await Meteor.callAsync('accounts.setupTwoFactor', method);
      return result;
    } catch (error) {
      console.error('Failed to setup two-factor authentication:', error);
      throw error;
    }
  }, [config.twoFactor]);

  const verifyTwoFactor = useCallback(async (code, method = 'totp') => {
    try {
      const result = await Meteor.callAsync('accounts.verifyTwoFactor', code, method);
      return result;
    } catch (error) {
      console.error('Failed to verify two-factor code:', error);
      throw error;
    }
  }, []);

  // Email verification
  const sendVerificationEmail = useCallback(async () => {
    try {
      await Meteor.callAsync('accounts.sendVerificationEmail');
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw error;
    }
  }, []);

  const verifyEmail = useCallback(async (token) => {
    try {
      await Meteor.callAsync('accounts.verifyEmail', token);
    } catch (error) {
      console.error('Failed to verify email:', error);
      throw error;
    }
  }, []);

  return {
    // Configuration
    config,
    features,
    
    // OAuth methods
    loginWithGoogle,
    loginWithGithub,
    loginWithFacebook,
    hasOAuthProviders: Object.values(config.oauth).some(v => v),
    
    // Password methods
    validatePassword,
    
    // Session methods
    extendSession,
    sessionTimeout: config.session.timeout,
    
    // Two-factor methods
    setupTwoFactor,
    verifyTwoFactor,
    isTwoFactorEnabled: config.twoFactor.enabled,
    isTwoFactorRequired: config.twoFactor.required,
    
    // Email methods
    sendVerificationEmail,
    verifyEmail,
    requiresEmailVerification: features.requireEmailVerification
  };
}