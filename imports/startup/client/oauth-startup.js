// imports/startup/client/oauth-startup.js

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Session } from 'meteor/session';
import { get } from 'lodash';

console.log('Starting OAuth client module...');

// Configure OAuth login options
const oauthConfig = get(Meteor, 'settings.public.accounts.oauth', {});

// Google OAuth configuration
if (oauthConfig.google) {
  Meteor.loginWithGoogle = function(options, callback) {
    const defaultOptions = {
      requestPermissions: ['email', 'profile'],
      loginStyle: 'popup',
      ...options
    };

    Accounts.oauth.loginWithGoogle(defaultOptions, callback);
  };

  // Add Google login button handler
  window.loginWithGoogle = () => {
    Meteor.loginWithGoogle({}, (error) => {
      if (error) {
        console.error('Google login failed:', error);
        Session.set('oauthError', error.reason || 'Google login failed');
      } else {
        console.log('Google login successful');
        Session.set('oauthError', null);
      }
    });
  };
}

// GitHub OAuth configuration
if (oauthConfig.github) {
  Meteor.loginWithGithub = function(options, callback) {
    const defaultOptions = {
      requestPermissions: ['user:email'],
      loginStyle: 'popup',
      ...options
    };

    Accounts.oauth.loginWithGithub(defaultOptions, callback);
  };

  window.loginWithGithub = () => {
    Meteor.loginWithGithub({}, (error) => {
      if (error) {
        console.error('GitHub login failed:', error);
        Session.set('oauthError', error.reason || 'GitHub login failed');
      } else {
        console.log('GitHub login successful');
        Session.set('oauthError', null);
      }
    });
  };
}

// Facebook OAuth configuration
if (oauthConfig.facebook) {
  Meteor.loginWithFacebook = function(options, callback) {
    const defaultOptions = {
      requestPermissions: ['email', 'public_profile'],
      loginStyle: 'popup',
      ...options
    };

    Accounts.oauth.loginWithFacebook(defaultOptions, callback);
  };

  window.loginWithFacebook = () => {
    Meteor.loginWithFacebook({}, (error) => {
      if (error) {
        console.error('Facebook login failed:', error);
        Session.set('oauthError', error.reason || 'Facebook login failed');
      } else {
        console.log('Facebook login successful');
        Session.set('oauthError', null);
      }
    });
  };
}

// Microsoft OAuth configuration
if (oauthConfig.microsoft) {
  // Custom Microsoft OAuth implementation
  window.loginWithMicrosoft = () => {
    const config = oauthConfig.microsoft;
    const tenant = config.tenant || 'common';
    const clientId = config.clientId;
    const redirectUri = `${window.location.origin}/_oauth/microsoft`;
    const scope = 'openid profile email';
    
    const authUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_mode=query&` +
      `state=${Random.id()}`;
    
    // Open OAuth popup
    const popup = window.open(
      authUrl,
      'microsoft-oauth',
      'width=500,height=600,left=100,top=100'
    );
    
    // Listen for OAuth callback
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        // Check if login was successful
        if (Meteor.userId()) {
          console.log('Microsoft login successful');
          Session.set('oauthError', null);
        }
      }
    }, 500);
  };
}

// Okta OAuth configuration
if (oauthConfig.okta) {
  window.loginWithOkta = () => {
    const config = oauthConfig.okta;
    const authUrl = `${config.serverUrl}/oauth2/${config.authorizationServerId || 'default'}/v1/authorize?` +
      `client_id=${config.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(`${window.location.origin}/_oauth/okta`)}&` +
      `scope=${encodeURIComponent('openid profile email')}&` +
      `state=${Random.id()}`;
    
    // Open OAuth popup
    const popup = window.open(
      authUrl,
      'okta-oauth',
      'width=500,height=600,left=100,top=100'
    );
    
    // Listen for OAuth callback
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        // Check if login was successful
        if (Meteor.userId()) {
          console.log('Okta login successful');
          Session.set('oauthError', null);
        }
      }
    }, 500);
  };
}

// OAuth popup styling
const styleOAuthPopup = () => {
  // Add CSS for OAuth buttons
  const style = document.createElement('style');
  style.textContent = `
    .oauth-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 10px 16px;
      margin: 8px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;
    }
    
    .oauth-button:hover {
      background: #f5f5f5;
      border-color: #bbb;
    }
    
    .oauth-button.google {
      color: #4285f4;
      border-color: #4285f4;
    }
    
    .oauth-button.github {
      color: #333;
      border-color: #333;
    }
    
    .oauth-button.facebook {
      color: #1877f2;
      border-color: #1877f2;
    }
    
    .oauth-button.microsoft {
      color: #0078d4;
      border-color: #0078d4;
    }
    
    .oauth-button.okta {
      color: #007dc1;
      border-color: #007dc1;
    }
    
    .oauth-divider {
      display: flex;
      align-items: center;
      margin: 20px 0;
    }
    
    .oauth-divider::before,
    .oauth-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #ddd;
    }
    
    .oauth-divider span {
      padding: 0 16px;
      color: #666;
      font-size: 14px;
    }
  `;
  document.head.appendChild(style);
};

// Initialize OAuth styling
Meteor.startup(() => {
  styleOAuthPopup();
  
  // Handle OAuth errors from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const oauthError = urlParams.get('oauth_error');
  if (oauthError) {
    Session.set('oauthError', decodeURIComponent(oauthError));
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});

// Export OAuth utilities
export const OAuthUtils = {
  // Get available OAuth providers
  getAvailableProviders() {
    const providers = [];
    const config = get(Meteor, 'settings.public.accounts.oauth', {});
    
    if (config.google) providers.push({ name: 'google', label: 'Google' });
    if (config.github) providers.push({ name: 'github', label: 'GitHub' });
    if (config.facebook) providers.push({ name: 'facebook', label: 'Facebook' });
    if (config.microsoft) providers.push({ name: 'microsoft', label: 'Microsoft' });
    if (config.okta) providers.push({ name: 'okta', label: 'Okta' });
    
    return providers;
  },
  
  // Login with provider
  loginWithProvider(provider) {
    switch (provider) {
      case 'google':
        window.loginWithGoogle();
        break;
      case 'github':
        window.loginWithGithub();
        break;
      case 'facebook':
        window.loginWithFacebook();
        break;
      case 'microsoft':
        window.loginWithMicrosoft();
        break;
      case 'okta':
        window.loginWithOkta();
        break;
      default:
        console.error(`Unknown OAuth provider: ${provider}`);
    }
  },
  
  // Get provider icon
  getProviderIcon(provider) {
    const icons = {
      google: '🔍',
      github: '🐙',
      facebook: '📘',
      microsoft: '🪟',
      okta: '🔐'
    };
    
    return icons[provider] || '🔑';
  }
};

console.log('OAuth client module started');