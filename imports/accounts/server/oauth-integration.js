// imports/accounts/server/oauth-integration.js

import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { get } from 'lodash';

// OAuth integration for various providers
export const OAuthIntegration = {
  // Initialize OAuth providers
  initialize() {
    console.log('Initializing OAuth providers...');

    const providers = get(Meteor, 'settings.private.oauth', {});
    
    // Configure each enabled provider
    Object.keys(providers).forEach(provider => {
      if (providers[provider]?.enabled) {
        this.configureProvider(provider, providers[provider]);
      }
    });

    // Setup custom OAuth hooks
    this.setupOAuthHooks();

    console.log('OAuth providers initialized');
  },

  // Configure individual OAuth provider
  configureProvider(provider, config) {
    console.log(`Configuring OAuth provider: ${provider}`);

    switch (provider) {
      case 'google':
        this.configureGoogle(config);
        break;
      case 'github':
        this.configureGithub(config);
        break;
      case 'facebook':
        this.configureFacebook(config);
        break;
      case 'microsoft':
        this.configureMicrosoft(config);
        break;
      case 'okta':
        this.configureOkta(config);
        break;
      case 'saml':
        this.configureSAML(config);
        break;
      default:
        console.warn(`Unknown OAuth provider: ${provider}`);
    }
  },

  // Google OAuth configuration
  configureGoogle(config) {
    ServiceConfiguration.configurations.upsert(
      { service: 'google' },
      {
        $set: {
          clientId: config.clientId,
          secret: config.clientSecret,
          loginStyle: config.loginStyle || 'popup'
        }
      }
    );

    // Configure additional Google-specific settings
    if (config.hostedDomain) {
      Accounts.config({
        restrictCreationByEmailDomain: config.hostedDomain
      });
    }
  },

  // GitHub OAuth configuration
  configureGithub(config) {
    ServiceConfiguration.configurations.upsert(
      { service: 'github' },
      {
        $set: {
          clientId: config.clientId,
          secret: config.clientSecret,
          loginStyle: config.loginStyle || 'popup'
        }
      }
    );

    // GitHub-specific: Check organization membership
    if (config.requiredOrg) {
      Accounts.validateNewUser((user) => {
        if (user.services?.github) {
          // TODO: Check GitHub org membership via API
          // This would require additional API calls to GitHub
          return true;
        }
        return true;
      });
    }
  },

  // Facebook OAuth configuration
  configureFacebook(config) {
    ServiceConfiguration.configurations.upsert(
      { service: 'facebook' },
      {
        $set: {
          appId: config.appId,
          secret: config.appSecret,
          loginStyle: config.loginStyle || 'popup'
        }
      }
    );
  },

  // Microsoft/Azure AD OAuth configuration
  configureMicrosoft(config) {
    ServiceConfiguration.configurations.upsert(
      { service: 'microsoft' },
      {
        $set: {
          clientId: config.clientId,
          secret: config.clientSecret,
          tenant: config.tenant || 'common',
          loginStyle: config.loginStyle || 'popup'
        }
      }
    );

    // Register custom OAuth handler for Microsoft
    OAuth.registerService('microsoft', 2, null, (query) => {
      const config = ServiceConfiguration.configurations.findOne({ service: 'microsoft' });
      if (!config) {
        throw new ServiceConfiguration.ConfigError();
      }

      const response = this.getMicrosoftAccessToken(query, config);
      const identity = this.getMicrosoftIdentity(response.accessToken);

      return {
        serviceData: {
          id: identity.id,
          accessToken: OAuth.sealSecret(response.accessToken),
          refreshToken: OAuth.sealSecret(response.refreshToken),
          scope: response.scope,
          ...identity
        },
        options: {
          profile: {
            name: identity.displayName
          }
        }
      };
    });
  },

  // Okta OAuth configuration
  configureOkta(config) {
    ServiceConfiguration.configurations.upsert(
      { service: 'okta' },
      {
        $set: {
          clientId: config.clientId,
          secret: config.clientSecret,
          serverUrl: config.serverUrl,
          authorizationServerId: config.authorizationServerId || 'default',
          loginStyle: config.loginStyle || 'popup'
        }
      }
    );

    // Register custom OAuth handler for Okta
    OAuth.registerService('okta', 2, null, (query) => {
      const config = ServiceConfiguration.configurations.findOne({ service: 'okta' });
      if (!config) {
        throw new ServiceConfiguration.ConfigError();
      }

      const response = this.getOktaAccessToken(query, config);
      const identity = this.getOktaIdentity(response.accessToken, config);

      return {
        serviceData: {
          id: identity.sub,
          accessToken: OAuth.sealSecret(response.accessToken),
          refreshToken: OAuth.sealSecret(response.refreshToken),
          scope: response.scope,
          ...identity
        },
        options: {
          profile: {
            name: identity.name,
            email: identity.email
          }
        }
      };
    });
  },

  // SAML configuration
  configureSAML(config) {
    // SAML requires a different approach than OAuth
    // This is a placeholder for SAML configuration
    console.log('SAML configuration:', config);
    
    // You would typically use a package like meteor-saml
    // and configure it here
  },

  // Setup OAuth hooks for all providers
  setupOAuthHooks() {
    // Hook into the OAuth login process
    Accounts.onExternalLogin((options, user) => {
      // Log OAuth login if HIPAA logging is enabled
      if (get(Meteor, 'settings.private.hipaa.enabled', false)) {
        Meteor.call('hipaa.logEvent', {
          eventType: 'oauth-login',
          userId: user._id,
          metadata: {
            service: options.type
          }
        });
      }

      // Custom user data mapping
      const service = user.services[options.type];
      
      // Map common fields from different providers
      if (service) {
        // Update user profile with OAuth data
        const updates = {};
        
        // Name mapping
        if (service.name || service.displayName || service.given_name) {
          updates['profile.name'] = service.name || 
                                   service.displayName || 
                                   `${service.given_name} ${service.family_name}`.trim();
        }
        
        // Picture mapping
        if (service.picture || service.avatar_url || service.photoUrl) {
          updates['profile.picture'] = service.picture || 
                                      service.avatar_url || 
                                      service.photoUrl;
        }
        
        // Email mapping (if not already set)
        if (!user.emails && service.email) {
          updates.emails = [{
            address: service.email,
            verified: service.email_verified !== false
          }];
        }

        if (Object.keys(updates).length > 0) {
          Meteor.users.update(user._id, { $set: updates });
        }
      }

      return true;
    });
  },

  // Microsoft OAuth token exchange
  async getMicrosoftAccessToken(query, config) {
    const tokenUrl = `https://login.microsoftonline.com/${config.tenant}/oauth2/v2.0/token`;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.secret,
        code: query.code,
        redirect_uri: OAuth._redirectUri('microsoft', config),
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get Microsoft access token');
    }

    return await response.json();
  },

  // Microsoft identity retrieval
  async getMicrosoftIdentity(accessToken) {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get Microsoft user identity');
    }

    return await response.json();
  },

  // Okta OAuth token exchange
  async getOktaAccessToken(query, config) {
    const tokenUrl = `${config.serverUrl}/oauth2/${config.authorizationServerId}/v1/token`;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.secret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        code: query.code,
        redirect_uri: OAuth._redirectUri('okta', config),
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get Okta access token');
    }

    return await response.json();
  },

  // Okta identity retrieval
  async getOktaIdentity(accessToken, config) {
    const response = await fetch(`${config.serverUrl}/oauth2/${config.authorizationServerId}/v1/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get Okta user identity');
    }

    return await response.json();
  }
};