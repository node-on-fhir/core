// /imports/api/epic/methods.js
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { check } from 'meteor/check';
import { fetch } from 'meteor/fetch';
import { get } from 'lodash';
import jwt from 'jsonwebtoken';

Meteor.methods({
  'rfc7523.checkPrivateKeyExists': function() {
    const privateKey = get(Meteor, 'settings.private.x509.privateKey', '');
    const keyId = get(Meteor, 'settings.private.jwk.keyId', 'trialx-data-fetch-key-001');
    
    return {
      exists: !!privateKey,
      keyId
    };
  },
  
  'rfc7523.generateJwtAssertion': function(args) {
    check(args, {
      clientId: String,
      tokenEndpoint: String
    });

    try {
      // Get private key from server settings
      const privateKeyRaw = get(Meteor, 'settings.private.x509.privateKey', '');
      const privateKey = privateKeyRaw.replace(/\\r\\n/g, '\n');
      const keyId = get(Meteor, 'settings.private.jwk.keyId', 'trialx-data-fetch-key-001');
      
      if (!privateKey) {
        throw new Meteor.Error('missing-private-key', 'Private key not configured in server settings');
      }

      const now = Math.floor(Date.now() / 1000);
      const jwtPayload = {
        iss: args.clientId,
        sub: args.clientId,
        aud: args.tokenEndpoint,
        jti: `${args.clientId}-${Date.now()}`,
        exp: now + 300, // 5 minutes
        iat: now
      };

      // Sign with private key
      const assertion = jwt.sign(jwtPayload, privateKey, { 
        algorithm: 'RS384',
        header: {
          typ: 'JWT',
          kid: keyId
        }
      });

      console.log('JWT assertion generated successfully');
      return {
        assertion,
        keyId
      };
    } catch (error) {
      console.error('JWT generation error:', error);
      throw new Meteor.Error('jwt-generation-error', error.message);
    }
  },
  'rfc7523.exchangeBackendToken': async function(args) {
    check(args, {
      tokenEndpoint: String,
      formData: String
    });

    console.log('=== rfc7523.exchangeBackendToken called ===');
    console.log('Token endpoint:', args.tokenEndpoint);
    console.log('Form data:', args.formData);

    try {
      console.log('Making POST request to token endpoint...');
      
      const response = await fetch(args.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: args.formData
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Meteor.Error('invalid-response', `Invalid response from server: ${responseText}`);
      }
      
      if (!response.ok) {
        console.error('Token exchange failed with status:', response.status);
        console.error('Error response:', data);
        
        // Provide more specific guidance for common errors
        let errorMessage = `Token exchange failed (${response.status}): ${data.error_description || data.error || response.statusText}`;
        
        if (data.error === 'invalid_client') {
          errorMessage += '\n\nThis usually means:\n' +
            '1. Epic cannot verify your client credentials\n' +
            '2. Your JWK Set URL is not accessible to Epic (localhost issue)\n' +
            '3. The client_id or key_id doesn\'t match Epic\'s configuration\n' +
            '4. The JWT signature verification failed';
        }
        
        throw new Meteor.Error('token-exchange-failed', errorMessage);
      }

      console.log('Token exchange successful!');
      console.log('Token response:', data);
      return data;
    } catch (error) {
      console.error('Backend token exchange error:', error);
      if (error instanceof Meteor.Error) {
        throw error;
      }
      throw new Meteor.Error('backend-auth-error', error.message);
    }
  },

  'rfc7523.makeFhirRequest': async function(args) {
    check(args, {
      url: String,
      accessToken: String
    });

    try {
      console.log('Making FHIR request to:', args.url);
      
      const response = await fetch(args.url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${args.accessToken}`,
          'Accept': 'application/json'
        },
        // Add timeout to prevent hanging
        timeout: 30000 // 30 seconds
      });

      // Check content length to prevent memory issues
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
        console.warn('Response too large:', contentLength, 'bytes');
        throw new Meteor.Error('response-too-large', 'Response exceeds 10MB limit');
      }

      const data = await response.json();
      
      if (!response.ok) {
        console.error('FHIR request failed:', data);
        throw new Meteor.Error('fhir-request-failed', 
          `FHIR request failed: ${data.issue?.[0]?.diagnostics || response.statusText}`
        );
      }

      console.log('FHIR request successful');
      
      // Limit the response size to prevent client crashes
      if (data.entry && data.entry.length > 100) {
        console.warn(`Truncating response from ${data.entry.length} entries to 100`);
        data.entry = data.entry.slice(0, 100);
        data.truncated = true;
        data.originalCount = data.total;
      }
      
      // Log response size for monitoring
      const responseSize = JSON.stringify(data).length;
      console.log(`FHIR response size: ${responseSize} bytes`);
      
      return data;
    } catch (error) {
      console.error('FHIR request error:', error);
      if (error instanceof Meteor.Error) {
        throw error;
      }
      throw new Meteor.Error('fhir-error', error.message);
    }
  }
});