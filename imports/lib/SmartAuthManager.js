// imports/lib/SmartAuthManager.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { Random } from 'meteor/random';
import { oauth2 as SMART } from "fhirclient";

/**
 * SMART on FHIR Authentication Manager
 * 
 * This module provides a unified interface for handling various OAuth2 token exchange
 * methods required by different FHIR servers. It implements strategies based on 
 * OAuth2 RFC specifications rather than vendor-specific requirements.
 * 
 * Supported OAuth2 flows:
 * - RFC 6749: Standard Authorization Code, Client Credentials
 * - RFC 7523: JWT Bearer Token Profile 
 * - RFC 7636: PKCE (Proof Key for Code Exchange)
 * - RFC 6749: Client Authentication Methods
 */

// Base Strategy class
class TokenExchangeStrategy {
  constructor(config) {
    this.config = config;
  }
  
  async execute(authCode, codeVerifier, redirectUri) {
    throw new Error('Strategy must implement execute method');
  }
  
  getTokenEndpoint() {
    return get(this.config, 'token_endpoint') || 
           get(this.config, 'tokenUri') ||
           get(this.config, 'fhirServiceUrl', '').replace('/api/FHIR/R4', '/oauth2/token');
  }
  
  async makeTokenRequest(endpoint, body, headers = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { ...defaultHeaders, ...headers },
      body: body
    });
    
    const responseText = await response.text();
    console.log('Token response status:', response.status);
    
    if (process.env.DEBUG_OAUTH) {
      console.log('Token response:', responseText);
    }
    
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status} - ${responseText}`);
    }
    
    return JSON.parse(responseText);
  }
}

// RFC 6749 - Standard Authorization Code Flow
class StandardSmartStrategy extends TokenExchangeStrategy {
  async execute(authCode, codeVerifier, redirectUri) {
    console.log('Using Standard SMART Authorization Code flow');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', authCode);
    params.append('redirect_uri', redirectUri);
    params.append('client_id', get(this.config, 'client_id'));
    
    const endpoint = this.getTokenEndpoint();
    return this.makeTokenRequest(endpoint, params.toString());
  }
}

// RFC 7636 - PKCE Only (Public Client)
class PkceOnlyStrategy extends TokenExchangeStrategy {
  async execute(authCode, codeVerifier, redirectUri) {
    console.log('Using PKCE-only flow for public client');
    
    if (!codeVerifier) {
      throw new Error('Code verifier is required for PKCE flow');
    }
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', authCode);
    params.append('redirect_uri', redirectUri);
    params.append('client_id', get(this.config, 'client_id'));
    params.append('code_verifier', codeVerifier);
    
    const endpoint = this.getTokenEndpoint();
    return this.makeTokenRequest(endpoint, params.toString());
  }
}

// RFC 7523 - JWT Bearer Token Profile
class JwtBearerStrategy extends TokenExchangeStrategy {
  async execute(authCode, codeVerifier, redirectUri) {
    console.log('Using JWT Bearer Assertion flow');
    
    const clientId = get(this.config, 'client_id');
    const tokenEndpoint = this.getTokenEndpoint();
    
    // Generate JWT assertion
    const jwtAssertion = await this.generateJwtAssertion(clientId, tokenEndpoint);
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', authCode);
    params.append('redirect_uri', redirectUri);
    params.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
    params.append('client_assertion', jwtAssertion);
    
    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }
    
    return this.makeTokenRequest(tokenEndpoint, params.toString());
  }
  
  async generateJwtAssertion(clientId, audience) {
    return new Promise((resolve, reject) => {
      const expiresIn = get(this.config, 'tokenExchange.jwtExpiresIn', 300);
      
      Meteor.call('generateClientAssertionJwt', 
        clientId, 
        audience,
        null, // Will use private key from settings
        expiresIn,
        (error, result) => {
          if (error) {
            console.error('Failed to generate JWT assertion:', error);
            reject(error);
          } else {
            resolve(result.jwt);
          }
        }
      );
    });
  }
}

// RFC 6749 - Client Secret in POST Body
class ClientSecretPostStrategy extends TokenExchangeStrategy {
  async execute(authCode, codeVerifier, redirectUri) {
    console.log('Using Client Secret POST authentication');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', authCode);
    params.append('redirect_uri', redirectUri);
    params.append('client_id', get(this.config, 'client_id'));
    params.append('client_secret', get(this.config, 'client_secret'));
    
    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }
    
    const endpoint = this.getTokenEndpoint();
    return this.makeTokenRequest(endpoint, params.toString());
  }
}

// RFC 6749 - Client Secret via Basic Auth
class ClientSecretBasicStrategy extends TokenExchangeStrategy {
  async execute(authCode, codeVerifier, redirectUri) {
    console.log('Using Client Secret Basic authentication');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', authCode);
    params.append('redirect_uri', redirectUri);
    
    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }
    
    // Create Basic Auth header
    const clientId = get(this.config, 'client_id');
    const clientSecret = get(this.config, 'client_secret');
    const credentials = btoa(`${clientId}:${clientSecret}`);
    
    const headers = {
      'Authorization': `Basic ${credentials}`
    };
    
    const endpoint = this.getTokenEndpoint();
    return this.makeTokenRequest(endpoint, params.toString(), headers);
  }
}

// RFC 6749 - Client Credentials Grant
class ClientCredentialsStrategy extends TokenExchangeStrategy {
  async execute(scope) {
    console.log('Using Client Credentials grant for system-to-system auth');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('scope', scope || get(this.config, 'scope', 'system/*.read'));
    
    // Determine authentication method
    const authMethod = get(this.config, 'tokenExchange.clientAuth', 'client_secret_post');
    
    if (authMethod === 'jwt_bearer') {
      const clientId = get(this.config, 'client_id');
      const tokenEndpoint = this.getTokenEndpoint();
      const jwtAssertion = await new JwtBearerStrategy(this.config).generateJwtAssertion(clientId, tokenEndpoint);
      
      params.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
      params.append('client_assertion', jwtAssertion);
    } else if (authMethod === 'client_secret_basic') {
      // Will add Basic Auth header below
      const clientId = get(this.config, 'client_id');
      const clientSecret = get(this.config, 'client_secret');
      const credentials = btoa(`${clientId}:${clientSecret}`);
      
      const headers = {
        'Authorization': `Basic ${credentials}`
      };
      
      const endpoint = this.getTokenEndpoint();
      return this.makeTokenRequest(endpoint, params.toString(), headers);
    } else {
      // Default to client_secret_post
      params.append('client_id', get(this.config, 'client_id'));
      params.append('client_secret', get(this.config, 'client_secret'));
    }
    
    const endpoint = this.getTokenEndpoint();
    return this.makeTokenRequest(endpoint, params.toString());
  }
}

// Main SmartAuthManager class
export class SmartAuthManager {
  constructor(smartConfig) {
    this.config = smartConfig;
  }
  
  /**
   * Exchange authorization code for access token using the configured strategy
   */
  async exchangeCodeForToken(authCode, codeVerifier, redirectUri) {
    const strategy = this.getTokenExchangeStrategy();
    
    try {
      const tokenResponse = await strategy.execute(authCode, codeVerifier, redirectUri);
      
      // Store the token response for use by the app
      sessionStorage.setItem('smart_token_response', JSON.stringify(tokenResponse));
      
      return tokenResponse;
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  }
  
  /**
   * Get the appropriate token exchange strategy based on configuration
   */
  getTokenExchangeStrategy() {
    const method = get(this.config, 'tokenExchange.method', 'standard');
    
    console.log(`Selected token exchange method: ${method}`);
    
    switch(method) {
      case 'jwt_bearer':
        return new JwtBearerStrategy(this.config);
      case 'client_secret_post':
        return new ClientSecretPostStrategy(this.config);
      case 'client_secret_basic':
        return new ClientSecretBasicStrategy(this.config);
      case 'client_credentials':
        return new ClientCredentialsStrategy(this.config);
      case 'pkce_only':
        return new PkceOnlyStrategy(this.config);
      case 'standard':
      default:
        return new StandardSmartStrategy(this.config);
    }
  }
  
  /**
   * Perform client credentials flow for backend service authentication
   */
  async authenticateBackendService(scope) {
    const strategy = new ClientCredentialsStrategy(this.config);
    return strategy.execute(scope);
  }
  
  /**
   * Check if we should use custom token exchange or fall back to fhirclient
   */
  static shouldUseCustomAuth(config) {
    // Use custom auth if specific token exchange method is configured
    const method = get(config, 'tokenExchange.method');
    const hasCustomMethod = method && method !== 'standard';
    
    // Or if JWT assertions are explicitly enabled
    const useJwtAssertions = get(config, 'tokenExchange.useJwtAssertions', false);
    
    return hasCustomMethod || useJwtAssertions;
  }
  
  /**
   * Get stored token response
   */
  static getStoredTokenResponse() {
    const stored = sessionStorage.getItem('smart_token_response');
    return stored ? JSON.parse(stored) : null;
  }
  
  /**
   * Clear stored tokens
   */
  static clearStoredTokens() {
    sessionStorage.removeItem('smart_token_response');
  }
}

export default SmartAuthManager;