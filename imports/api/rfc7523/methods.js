// /imports/api/rfc7523/methods.js  (formerly /imports/api/epic/methods.js)
//
// RFC 7523 JWT-bearer backend-services auth flow (Epic-style). AUTH-ADJACENT:
// pre-migration NONE of these methods had a this.userId guard (they are used
// by the BackendAuthPage flow, which may run before an app login exists), so
// each keeps requireAuth: false to preserve the exact pre-migration posture.
// Flagged for security review — see the rpc migration notes.
import { Meteor } from 'meteor/meteor';
import { fetch } from 'meteor/fetch';
import { get } from 'lodash';
import jwt from 'jsonwebtoken';

// Public by pre-migration behavior (no auth guard): returns only whether a
// private key is configured plus its key id — no key material leaks.
Meteor.ServerMethods.define('rfc7523.checkPrivateKeyExists', {
  description: 'Report whether an RFC 7523 signing private key is configured in server settings',
  requireAuth: false
}, async function() {
  const privateKey = get(Meteor, 'settings.private.x509.privateKey', '');
  const keyId = get(Meteor, 'settings.private.jwk.keyId', 'trialx-data-fetch-key-001');

  return {
    exists: !!privateKey,
    keyId
  };
});

// Public by pre-migration behavior (no auth guard — auth-adjacent: this mints
// the client-assertion JWT that BOOTSTRAPS the backend auth flow, so it cannot
// depend on an existing login). Preserved exactly; flagged for review.
Meteor.ServerMethods.define('rfc7523.generateJwtAssertion', {
  description: 'Sign an RFC 7523 client-assertion JWT with the server private key',
  requireAuth: false,
  schemaObject: {
    type: 'object',
    properties: { clientId: { type: 'string' }, tokenEndpoint: { type: 'string' } },
    required: ['clientId', 'tokenEndpoint']
  }
}, async function(params, context) {
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
      iss: params.clientId,
      sub: params.clientId,
      aud: params.tokenEndpoint,
      jti: `${params.clientId}-${Date.now()}`,
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

    context.log.info('JWT assertion generated successfully');
    return {
      assertion,
      keyId
    };
  } catch (error) {
    context.log.error('JWT generation error', { message: error.message });
    throw new Meteor.Error('jwt-generation-error', error.message);
  }
});

// Public by pre-migration behavior (no auth guard — part of the same
// pre-login backend auth bootstrap). Preserved exactly; flagged for review.
Meteor.ServerMethods.define('rfc7523.exchangeBackendToken', {
  description: 'Exchange an RFC 7523 client assertion for an access token at a remote token endpoint',
  requireAuth: false,
  schemaObject: {
    type: 'object',
    properties: { tokenEndpoint: { type: 'string' }, formData: { type: 'string' } },
    required: ['tokenEndpoint', 'formData']
  }
}, async function(params, context) {
  context.log.info('rfc7523.exchangeBackendToken called', { tokenEndpoint: params.tokenEndpoint });

  try {
    context.log.debug('Making POST request to token endpoint...');

    const response = await fetch(params.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.formData
    });

    context.log.debug('Token endpoint response', { status: response.status });

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      context.log.error('Failed to parse response as JSON', { message: parseError.message });
      throw new Meteor.Error('invalid-response', `Invalid response from server: ${responseText}`);
    }

    if (!response.ok) {
      context.log.error('Token exchange failed', { status: response.status, error: data.error, description: data.error_description });

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

    context.log.info('Token exchange successful');
    return data;
  } catch (error) {
    if (error instanceof Meteor.Error) {
      throw error;
    }
    context.log.error('Backend token exchange error', { message: error.message });
    throw new Meteor.Error('backend-auth-error', error.message);
  }
});

// Public by pre-migration behavior (no auth guard): the caller supplies its
// own bearer accessToken, which the remote FHIR server enforces. Preserved
// exactly; flagged for review.
Meteor.ServerMethods.define('rfc7523.makeFhirRequest', {
  description: 'Proxy a GET request to a remote FHIR server using a caller-supplied bearer token',
  requireAuth: false,
  phi: true,
  schemaObject: {
    type: 'object',
    properties: { url: { type: 'string' }, accessToken: { type: 'string' } },
    required: ['url', 'accessToken']
  }
}, async function(params, context) {
  try {
    context.log.info('Making FHIR request', { url: params.url });

    const response = await fetch(params.url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${params.accessToken}`,
        'Accept': 'application/json'
      },
      // Add timeout to prevent hanging
      timeout: 30000 // 30 seconds
    });

    // Check content length to prevent memory issues
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
      context.log.warn('Response too large', { contentLength: contentLength });
      throw new Meteor.Error('response-too-large', 'Response exceeds 10MB limit');
    }

    const data = await response.json();

    if (!response.ok) {
      context.log.error('FHIR request failed', { status: response.status });
      throw new Meteor.Error('fhir-request-failed',
        `FHIR request failed: ${data.issue?.[0]?.diagnostics || response.statusText}`
      );
    }

    context.log.info('FHIR request successful');

    // Limit the response size to prevent client crashes
    if (data.entry && data.entry.length > 100) {
      context.log.warn('Truncating FHIR response', { originalEntries: data.entry.length, truncatedTo: 100 });
      data.entry = data.entry.slice(0, 100);
      data.truncated = true;
      data.originalCount = data.total;
    }

    // Log response size for monitoring
    const responseSize = JSON.stringify(data).length;
    context.log.debug('FHIR response size', { bytes: responseSize });

    return data;
  } catch (error) {
    if (error instanceof Meteor.Error) {
      throw error;
    }
    context.log.error('FHIR request error', { message: error.message });
    throw new Meteor.Error('fhir-error', error.message);
  }
});
