# System Authentication: Migration from Basic Auth to JWT/JWK

## Current State

The system currently supports Basic Auth for SYSTEM role authentication, which is functional but has security limitations. This document outlines the migration path to JWT/JWK-based authentication for system accounts.

## Security Considerations for Basic Auth

While Basic Auth works for development and testing, it has several limitations in production:

1. **Credentials transmitted with every request** - Increases exposure risk
2. **No token expiration** - Credentials remain valid indefinitely
3. **Limited scope control** - All-or-nothing access model
4. **Credential storage** - Clients must store plaintext passwords
5. **No refresh mechanism** - Can't rotate credentials without downtime

## JWT/JWK Implementation Plan

### Phase 1: JWT Backend Services (RFC 7523)

Implement SMART Backend Services authentication flow:

```javascript
// Settings configuration
{
  "private": {
    "accessControl": {
      "enableBasicAuth": true,  // Keep for backward compatibility
      "enableJwtBackendServices": true,  // Enable JWT auth
      "systemSecret": "DEPRECATED-USE-JWT",
      "jwtConfig": {
        "issuer": "https://your-server.com",
        "audience": "https://your-server.com/baseR4",
        "expiresIn": "5m",
        "algorithm": "RS384"
      }
    }
  }
}
```

### Phase 2: JWK Set Endpoint

Implement JWKS endpoint for public key distribution:

```javascript
// GET /.well-known/jwks.json
{
  "keys": [{
    "kty": "RSA",
    "use": "sig",
    "kid": "system-key-2024",
    "alg": "RS384",
    "n": "...",  // RSA modulus
    "e": "AQAB"  // RSA exponent
  }]
}
```

### Phase 3: Client Authentication Flow

Clients will authenticate using signed JWTs:

```javascript
// 1. Client creates JWT assertion
const jwt = {
  iss: "system-service-client-id",
  sub: "system-service-client-id",
  aud: "https://server.com/oauth/token",
  exp: Math.floor(Date.now() / 1000) + 300,
  jti: crypto.randomUUID()
};

// 2. Sign with private key
const assertion = jwt.sign(jwt, privateKey, { algorithm: 'RS384' });

// 3. Request access token
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&
client_assertion={signed_jwt}

// 4. Use access token
GET /baseR4/Patient
Authorization: Bearer {access_token}
```

## Implementation TODO List

### Server-Side Changes

- [ ] Implement JWT verification in `parseUserAuthorization()`
- [ ] Add JWKS endpoint handler
- [ ] Create token introspection endpoint
- [ ] Implement token expiration and refresh
- [ ] Add scope-based permissions for system accounts
- [ ] Create key rotation mechanism
- [ ] Add audit logging for system token usage

### Client-Side Changes

- [ ] Generate RSA key pairs for system clients
- [ ] Implement JWT assertion creation
- [ ] Add token caching and refresh logic
- [ ] Update all system API calls to use Bearer tokens
- [ ] Implement key rotation handling

### Security Enhancements

- [ ] Require TLS for all JWT auth endpoints
- [ ] Implement rate limiting for token requests
- [ ] Add IP allowlisting for system accounts
- [ ] Create separate scopes for different system operations
- [ ] Implement token revocation mechanism
- [ ] Add monitoring and alerting for suspicious activity

## Migration Strategy

### Step 1: Parallel Support (3 months)
- Enable both Basic Auth and JWT
- Log deprecation warnings for Basic Auth usage
- Monitor adoption metrics

### Step 2: Soft Deprecation (3 months)
- Require explicit flag to use Basic Auth
- Send notifications to clients still using Basic Auth
- Provide migration assistance

### Step 3: Hard Deprecation (1 month)
- Disable Basic Auth for new clients
- Existing clients must request extension
- Set final sunset date

### Step 4: Removal
- Remove Basic Auth code
- Archive documentation
- Final security audit

## Example JWT Implementation

```javascript
// In server/FhirEndpoints.js
async function parseUserAuthorization(req) {
  // ... existing code ...
  
  // JWT BACKEND SERVICES
  if (get(Meteor, 'settings.private.accessControl.enableJwtBackendServices')) {
    const authHeader = get(req, 'headers.authorization', '');
    
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        // Verify JWT with public key from JWKS
        const decoded = await verifyJWT(token);
        
        // Check if this is a system service account
        if (decoded.sub && decoded.scope?.includes('system')) {
          authorizationContext = {
            role: "SYSTEM",
            userId: decoded.sub,
            isSystemAccount: true,
            isJWT: true,
            scopes: decoded.scope.split(' ')
          };
          console.log('System role authenticated via JWT');
        }
      } catch (error) {
        console.error('JWT verification failed:', error);
      }
    }
  }
  
  // ... rest of function
}
```

## Testing JWT Authentication

```bash
# Generate test JWT
node scripts/generate-system-jwt.js

# Test with curl
curl -H "Authorization: Bearer ${JWT_TOKEN}" \
  https://localhost:3000/baseR4/Patient

# Test with Postman
# 1. Set Authorization Type to "Bearer Token"
# 2. Paste JWT in Token field
# 3. Token will be automatically added to headers
```

## Benefits of JWT/JWK

1. **Enhanced Security**
   - No passwords transmitted
   - Short-lived tokens
   - Cryptographic signatures

2. **Better Control**
   - Scope-based permissions
   - Token expiration
   - Revocation capability

3. **Standards Compliance**
   - SMART Backend Services
   - OAuth 2.0 RFC 7523
   - OpenID Connect compatible

4. **Operational Benefits**
   - Key rotation without downtime
   - Audit trail improvements
   - Integration with existing OAuth infrastructure

## References

- [RFC 7523: JWT Profile for OAuth 2.0](https://tools.ietf.org/html/rfc7523)
- [SMART Backend Services](https://hl7.org/fhir/smart-app-launch/backend-services.html)
- [JSON Web Key (JWK)](https://tools.ietf.org/html/rfc7517)
- [OAuth 2.0 Client Credentials](https://oauth.net/2/grant-types/client-credentials/)

## Notes

**IMPORTANT**: Basic Auth for system accounts should be considered a temporary solution. Production deployments MUST use JWT/JWK authentication for proper security.

**Timeline**: Target Q2 2025 for full JWT implementation and Q4 2025 for Basic Auth deprecation.