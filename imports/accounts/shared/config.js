// imports/accounts/shared/config.js

// Shared configuration constants and utilities for accounts module

export const AccountsConfig = {
  // User roles
  roles: {
    ADMIN: 'admin',
    USER: 'user',
    CLINICIAN: 'clinician',
    PATIENT: 'patient',
    DEVELOPER: 'developer',
    AUDITOR: 'auditor',
    GUEST: 'guest'
  },

  // Authentication methods
  authMethods: {
    PASSWORD: 'password',
    OAUTH: 'oauth',
    SAML: 'saml',
    LDAP: 'ldap',
    API_KEY: 'api-key',
    MOBILE_TOKEN: 'mobile-token',
    VPN: 'vpn',
    ANONYMOUS: 'anonymous'
  },

  // OAuth providers
  oauthProviders: {
    GOOGLE: 'google',
    GITHUB: 'github',
    FACEBOOK: 'facebook',
    MICROSOFT: 'microsoft',
    OKTA: 'okta',
    CUSTOM: 'custom'
  },

  // Session configuration defaults
  sessionDefaults: {
    timeout: 30, // minutes
    extendOnActivity: true,
    singleSession: false,
    rememberMeDays: 30
  },

  // Password policy defaults
  passwordPolicyDefaults: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    preventReuse: 5, // Remember last N passwords
    expirationDays: 90,
    warningDays: 14
  },

  // Two-factor authentication
  twoFactorDefaults: {
    enabled: false,
    required: false,
    methods: ['totp', 'sms', 'email'],
    backupCodes: 10,
    rememberDeviceDays: 30
  },

  // Account lockout policy
  lockoutPolicyDefaults: {
    enabled: true,
    maxAttempts: 5,
    lockoutDuration: 30, // minutes
    resetAttemptsAfter: 60 // minutes
  },

  // Email verification
  emailVerificationDefaults: {
    required: false,
    tokenExpirationHours: 24,
    resendCooldown: 60 // seconds
  },

  // API key configuration
  apiKeyDefaults: {
    enabled: true,
    maxKeysPerUser: 5,
    expirationDays: 365,
    allowedScopes: ['read', 'write', 'admin']
  },

  // Profile fields
  profileFields: {
    required: ['name'],
    optional: ['bio', 'avatar', 'phone', 'organization', 'title', 'preferences'],
    public: ['name', 'avatar', 'bio'],
    private: ['phone', 'organization', 'title']
  },

  // Regular expressions for validation
  regex: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    username: /^[a-zA-Z0-9_-]{3,20}$/,
    phone: /^\+?[\d\s\-\(\)]+$/,
    strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  },

  // Error messages
  errors: {
    INVALID_CREDENTIALS: 'Invalid username or password',
    ACCOUNT_LOCKED: 'Account is locked due to too many failed attempts',
    EMAIL_NOT_VERIFIED: 'Please verify your email address',
    TWO_FACTOR_REQUIRED: 'Two-factor authentication code required',
    SESSION_EXPIRED: 'Your session has expired',
    PASSWORD_TOO_WEAK: 'Password does not meet security requirements',
    USERNAME_TAKEN: 'Username is already taken',
    EMAIL_TAKEN: 'Email address is already registered',
    INVALID_TOKEN: 'Invalid or expired token',
    NOT_AUTHORIZED: 'You are not authorized to perform this action',
    RATE_LIMITED: 'Too many attempts. Please try again later'
  },

  // Success messages
  messages: {
    WELCOME: 'Welcome! Your account has been created successfully',
    LOGIN_SUCCESS: 'You have been logged in successfully',
    LOGOUT_SUCCESS: 'You have been logged out successfully',
    PASSWORD_RESET_SENT: 'Password reset instructions have been sent to your email',
    PASSWORD_CHANGED: 'Your password has been changed successfully',
    EMAIL_VERIFIED: 'Your email has been verified successfully',
    PROFILE_UPDATED: 'Your profile has been updated successfully',
    TWO_FACTOR_ENABLED: 'Two-factor authentication has been enabled',
    API_KEY_CREATED: 'API key has been created successfully'
  }
};

// Utility functions
export const AccountsUtils = {
  // Validate email format
  isValidEmail(email) {
    return AccountsConfig.regex.email.test(email);
  },

  // Validate username format
  isValidUsername(username) {
    return AccountsConfig.regex.username.test(username);
  },

  // Check password strength
  getPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    
    const levels = ['very-weak', 'weak', 'fair', 'good', 'strong', 'very-strong'];
    return {
      score: strength,
      level: levels[Math.min(strength, levels.length - 1)]
    };
  },

  // Generate random password
  generatePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  },

  // Format user display name
  getUserDisplayName(user) {
    if (!user) return 'Unknown User';
    
    return user.profile?.name || 
           user.username || 
           user.emails?.[0]?.address?.split('@')[0] || 
           'User';
  },

  // Get user avatar URL
  getUserAvatar(user) {
    if (!user) return null;
    
    return user.profile?.avatar ||
           user.services?.google?.picture ||
           user.services?.github?.avatar_url ||
           user.services?.facebook?.picture?.data?.url ||
           null;
  },

  // Check if user has role
  userHasRole(user, role, group) {
    if (!user || !user.roles) return false;
    
    if (group) {
      return user.roles[group]?.includes(role);
    }
    
    return user.roles.includes(role);
  },

  // Get user's primary email
  getUserEmail(user) {
    if (!user) return null;
    
    return user.emails?.[0]?.address || 
           user.services?.google?.email ||
           user.services?.github?.email ||
           null;
  },

  // Check if email is verified
  isEmailVerified(user) {
    if (!user || !user.emails) return false;
    return user.emails[0]?.verified === true;
  },

  // Format last login time
  formatLastLogin(date) {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    
    return date.toLocaleDateString();
  }
};