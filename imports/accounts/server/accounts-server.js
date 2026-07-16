// imports/accounts/server/accounts-server.js

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { get, set } from 'lodash';
import { logger } from '../lib/AccountsLogger';

// Track if hooks have been initialized to prevent duplicates
let hooksInitialized = false;

// Server-side accounts configuration
export const AccountsServer = {
  // Initialize server-side accounts settings
  async initialize() {
    logger.group('AccountsServer.initialize');
    logger.info('Initializing accounts server...');

    try {
      // Configure account creation settings
      this.configureAccountCreation();
      
      // Configure email templates
      this.configureEmailTemplates();
      
      // Setup account creation hooks
      this.setupAccountHooks();
      
      // Configure password policy
      this.configurePasswordPolicy();
      
      // Setup rate limiting
      this.setupRateLimiting();
      
      // Configure OAuth services
      await this.configureOAuthServices();

      logger.info('Accounts server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize accounts server:', error);
      throw error;
    } finally {
      logger.groupEnd();
    }
  },

  // Configure account creation settings
  configureAccountCreation() {
    logger.group('configureAccountCreation');
    
    // Check if signup is allowed
    const allowSignup = get(Meteor, 'settings.public.accounts.features.allowSignup', true);
    const allowRegistration = get(Meteor, 'settings.public.modules.accounts.allowRegistration', true);
    
    logger.info('Account creation settings:', { allowSignup, allowRegistration });
    logger.debug('Settings paths checked:', {
      'settings.public.accounts.features.allowSignup': allowSignup,
      'settings.public.modules.accounts.allowRegistration': allowRegistration
    });
    
    // Only forbid client account creation if explicitly disabled
    if (!allowSignup || !allowRegistration) {
      logger.warn('Disabling client account creation');
      Accounts.config({
        forbidClientAccountCreation: true
      });
      logger.error('Client account creation is DISABLED');
    } else {
      logger.info('Enabling client account creation');
      Accounts.config({
        forbidClientAccountCreation: false
      });
      logger.info('Client account creation is ENABLED');
    }
    
    logger.groupEnd();
  },

  // Configure email templates
  configureEmailTemplates() {
    const siteName = get(Meteor, 'settings.public.appName', 'Honeycomb');
    const from = get(Meteor, 'settings.private.accounts.emailFrom', 'noreply@honeycomb.app');
    
    Accounts.emailTemplates.siteName = siteName;
    Accounts.emailTemplates.from = `${siteName} <${from}>`;

    // Configure clean URLs for email links (instead of Meteor's default hash-based URLs)
    Accounts.urls.verifyEmail = function(token) {
      return Meteor.absoluteUrl('verify-email/' + token);
    };
    Accounts.urls.resetPassword = function(token) {
      return Meteor.absoluteUrl('reset-password/' + token);
    };
    Accounts.urls.enrollAccount = function(token) {
      return Meteor.absoluteUrl('enroll-account/' + token);
    };
    
    // Verification email
    Accounts.emailTemplates.verifyEmail = {
      subject() {
        return `Verify your email address for ${siteName}`;
      },
      text(user, url) {
        const name = user.profile?.name || 'there';
        return `Hello ${name},\n\n` +
          `Please verify your email address by clicking the link below:\n\n` +
          `${url}\n\n` +
          `If you didn't create an account with us, please ignore this email.\n\n` +
          `Thanks,\n${siteName} Team`;
      },
      html(user, url) {
        // TODO: Return nice HTML email template
        return null; // Falls back to text
      }
    };

    // Reset password email
    Accounts.emailTemplates.resetPassword = {
      subject() {
        return `Reset your password for ${siteName}`;
      },
      text(user, url) {
        const name = user.profile?.name || 'there';
        return `Hello ${name},\n\n` +
          `You requested a password reset. Click the link below to set a new password:\n\n` +
          `${url}\n\n` +
          `If you didn't request this, please ignore this email.\n\n` +
          `Thanks,\n${siteName} Team`;
      }
    };

    // Enrollment email (for invited users)
    Accounts.emailTemplates.enrollAccount = {
      subject() {
        return `You've been invited to ${siteName}`;
      },
      text(user, url) {
        const name = user.profile?.name || 'there';
        const invitedBy = user.profile?.invitedBy || 'administrator';
        return `Hello ${name},\n\n` +
          `You've been invited to join ${siteName} by ${invitedBy}.\n\n` +
          `Please click the link below to set up your account:\n\n` +
          `${url}\n\n` +
          `Thanks,\n${siteName} Team`;
      }
    };
  },

  // Setup account creation and modification hooks
  setupAccountHooks() {
    logger.info('Setting up account hooks...');
    
    // Prevent duplicate hook registration
    if (hooksInitialized) {
      logger.warn('Account hooks already initialized, skipping...');
      return;
    }
    
    // logger.debug('Accounts object:', Object.keys(Accounts || {}));
    
    // Validate new users
    // TODO: In Meteor 3, validateNewUser might not be available immediately
    // Check if the method exists before using it
    if (Accounts && typeof Accounts.validateNewUser === 'function') {
      Accounts.validateNewUser((user) => {
      logger.group('validateNewUser');
      logger.info('Validating new user:', {
        username: user.username,
        email: user.emails?.[0]?.address,
        profile: user.profile,
        roles: user.roles
      });
      
      try {
        // Check email format
        if (user.emails && user.emails[0]) {
          const email = user.emails[0].address;
          logger.debug('Checking email format:', { email });
          
          if (!Match.test(email, Match.Where(email => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          }))) {
            logger.error('Email validation failed - invalid format:', { email });
            throw new Meteor.Error('invalid-email', 'Invalid email address');
          } else {
            logger.log('Email format valid');
          }
        } else {
          logger.warn('No email address provided');
        }

        // Check against blocked domains
        const blockedDomains = get(Meteor, 'settings.private.accounts.blockedDomains', []);
        logger.debug('Blocked domains:', blockedDomains);
        
        if (blockedDomains.length > 0 && user.emails?.[0]) {
          const domain = user.emails[0].address.split('@')[1];
          logger.debug('Checking domain:', domain);
          
          if (blockedDomains.includes(domain)) {
            logger.error('Domain is blocked:', domain);
            throw new Meteor.Error('blocked-domain', 'Email domain is not allowed');
          } else {
            logger.log('Domain is allowed:', domain);
          }
        } else {
          logger.debug('No domain blocking configured or no email to check');
        }

        logger.info('User validation passed');
        logger.groupEnd();
        return true;
      } catch (error) {
        logger.error('User validation failed:', error);
        logger.groupEnd();
        throw error;
      }
    });
    } else {
      logger.warn('Accounts.validateNewUser is not available in Meteor 3');
    }

    // On user creation
    if (Accounts && typeof Accounts.onCreateUser === 'function') {
      Accounts.onCreateUser((options, user) => {
      logger.group('onCreateUser');
      logger.info('Creating user');
      logger.debug('User object:', {
        username: user.username,
        email: user.emails?.[0]?.address,
        services: Object.keys(user.services || {}),
        _id: user._id
      });
      logger.debug('Options:', options);
      
      // Set default profile
      user.profile = options.profile || {};
      
      // Add creation metadata
      user.createdAt = new Date();
      user.lastActivityAt = new Date();
      
      // Set default roles from settings (array) or fall back to ['user', 'patient']
      const defaultRoles = get(Meteor, 'settings.private.accounts.defaultRole', ['user', 'patient']);
      user.roles = Array.isArray(defaultRoles) ? defaultRoles : [defaultRoles, 'patient'];
      
      // Handle OAuth data
      if (user.services?.google) {
        user.profile.name = user.services.google.name;
        user.profile.picture = user.services.google.picture;
        if (!user.emails) {
          user.emails = [{
            address: user.services.google.email,
            verified: true
          }];
        }
      }
      
      if (user.services?.github) {
        user.profile.name = user.services.github.name || user.services.github.username;
        user.profile.picture = user.services.github.avatar_url;
        if (!user.emails && user.services.github.email) {
          user.emails = [{
            address: user.services.github.email,
            verified: true
          }];
        }
      }

      // Send welcome email if configured
      if (get(Meteor, 'settings.private.accounts.sendWelcomeEmail', false)) {
        logger.info('Welcome email enabled, scheduling send');
        Meteor.defer(() => {
          this.sendWelcomeEmail(user._id);
        });
      } else {
        logger.debug('Welcome email disabled');
      }

      logger.info('User creation completed');
      logger.groupEnd();
      return user;
    });
    } else {
      logger.warn('Accounts.onCreateUser is not available in Meteor 3');
    }

    // After login
    if (Accounts && typeof Accounts.onLogin === 'function') {
      Accounts.onLogin(async (info) => {
      // Update last login time
      await Meteor.users.updateAsync(info.user._id, {
        $set: {
          lastLoginAt: new Date(),
          lastActivityAt: new Date()
        }
      });

      // Login audit events are emitted by @node-on-fhir/hipaa-compliance's
      // own Accounts hooks (server/hooks.js) when that package is loaded.
    });
    } else {
      logger.warn('Accounts.onLogin is not available in Meteor 3');
    }

    // After logout
    if (Accounts && typeof Accounts.onLogout === 'function') {
      Accounts.onLogout((info) => {
      // Logout audit events are emitted by @node-on-fhir/hipaa-compliance's
      // own Accounts hooks (server/hooks.js) when that package is loaded.
    });
    } else {
      logger.warn('Accounts.onLogout is not available in Meteor 3');
    }

    // Failed login attempts
    if (Accounts && typeof Accounts.onLoginFailure === 'function') {
      Accounts.onLoginFailure((info) => {
      // Failed-login audit events are emitted by @node-on-fhir/hipaa-compliance's
      // own Accounts hooks (server/hooks.js) when that package is loaded.
    });
    } else {
      logger.warn('Accounts.onLoginFailure is not available in Meteor 3');
    }
    
    // Mark hooks as initialized to prevent duplicate registration
    hooksInitialized = true;
    logger.info('Account hooks initialized successfully');
  },

  // Configure password policy
  configurePasswordPolicy() {
    const policy = get(Meteor, 'settings.private.accounts.passwordPolicy', {});
    
    // Set minimum password length
    Accounts._options.passwordMinLength = policy.minLength || 8;
    
    // Custom password validation
    Accounts.validatePassword = (password) => {
      if (password.length < Accounts._options.passwordMinLength) {
        throw new Meteor.Error('password-too-short', 
          `Password must be at least ${Accounts._options.passwordMinLength} characters`);
      }

      if (policy.requireUppercase && !/[A-Z]/.test(password)) {
        throw new Meteor.Error('password-no-uppercase', 
          'Password must contain at least one uppercase letter');
      }

      if (policy.requireLowercase && !/[a-z]/.test(password)) {
        throw new Meteor.Error('password-no-lowercase', 
          'Password must contain at least one lowercase letter');
      }

      if (policy.requireNumbers && !/\d/.test(password)) {
        throw new Meteor.Error('password-no-numbers', 
          'Password must contain at least one number');
      }

      if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throw new Meteor.Error('password-no-special', 
          'Password must contain at least one special character');
      }

      return true;
    };
  },

  // Setup rate limiting for account methods
  setupRateLimiting() {
    const rateLimits = get(Meteor, 'settings.private.accounts.rateLimits', {});
    
    // Login attempts
    Accounts.addAutopublishFields({
      forLoggedInUser: ['services.resume'],
      forOtherUsers: []
    });

    // Configure rate limiting rules
    const rules = [
      {
        userId: null,
        clientAddress: null,
        type: 'method',
        name: 'login',
        connectionId: null,
        numRequests: rateLimits.loginAttempts || 5,
        timeInterval: rateLimits.loginInterval || 60000 // 1 minute
      },
      {
        userId: null,
        clientAddress: null,
        type: 'method',
        name: 'createUser',
        connectionId: null,
        numRequests: rateLimits.signupAttempts || 3,
        timeInterval: rateLimits.signupInterval || 3600000 // 1 hour
      },
      {
        userId: null,
        clientAddress: null,
        type: 'method',
        name: 'forgotPassword',
        connectionId: null,
        numRequests: rateLimits.passwordResetAttempts || 3,
        timeInterval: rateLimits.passwordResetInterval || 3600000 // 1 hour
      }
    ];

    // Apply rate limiting rules
    rules.forEach(rule => {
      DDPRateLimiter.addRule(rule, (allowed, timeToReset) => {
        if (!allowed) {
          throw new Meteor.Error('too-many-requests', 
            `Too many requests. Please wait ${Math.ceil(timeToReset / 1000)} seconds.`);
        }
      });
    });
  },

  // Configure OAuth services
  async configureOAuthServices() {
    const oauthConfig = get(Meteor, 'settings.private.accounts.oauth', {});
    
    // Google OAuth
    if (oauthConfig.google) {
      await ServiceConfiguration.configurations.upsertAsync(
        { service: 'google' },
        {
          $set: {
            clientId: oauthConfig.google.clientId,
            secret: oauthConfig.google.secret,
            loginStyle: 'popup'
          }
        }
      );
    }

    // GitHub OAuth
    if (oauthConfig.github) {
      await ServiceConfiguration.configurations.upsertAsync(
        { service: 'github' },
        {
          $set: {
            clientId: oauthConfig.github.clientId,
            secret: oauthConfig.github.secret,
            loginStyle: 'popup'
          }
        }
      );
    }

    // Facebook OAuth
    if (oauthConfig.facebook) {
      await ServiceConfiguration.configurations.upsertAsync(
        { service: 'facebook' },
        {
          $set: {
            appId: oauthConfig.facebook.appId,
            secret: oauthConfig.facebook.secret,
            loginStyle: 'popup'
          }
        }
      );
    }
  },

  // Send welcome email to new users
  async sendWelcomeEmail(userId) {
    check(userId, String);
    
    const user = await Meteor.users.findOneAsync(userId);
    if (!user || !user.emails?.[0]?.address) return;

    const siteName = get(Meteor, 'settings.public.appName', 'Honeycomb');
    const from = get(Meteor, 'settings.private.accounts.emailFrom', 'noreply@honeycomb.app');
    
    try {
      Email.send({
        to: user.emails[0].address,
        from: `${siteName} <${from}>`,
        subject: `Welcome to ${siteName}!`,
        text: `Hello ${user.profile?.name || 'there'},\n\n` +
          `Welcome to ${siteName}! We're excited to have you on board.\n\n` +
          `If you have any questions, please don't hesitate to reach out.\n\n` +
          `Thanks,\n${siteName} Team`
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }
};