# System Authentication Examples

This document provides examples of how to authenticate as a SYSTEM role user with the Honeycomb FHIR server.

## Configuration

First, ensure your settings file has Basic Auth enabled and a system secret configured:

```json
{
  "private": {
    "accessControl": {
      "enableBasicAuth": true,
      "systemSecret": "your-super-secure-system-secret-here"
    }
  }
}
```

## CURL Examples

### Basic Authentication
```bash
# Simple format
curl -u "system:your-super-secure-system-secret-here" \
  http://localhost:3000/baseR4/Patient

# With explicit header
curl -H "Authorization: Basic $(echo -n 'system:your-super-secure-system-secret-here' | base64)" \
  http://localhost:3000/baseR4/Patient
```

### GET Requests
```bash
# Get all patients
curl -u "system:your-super-secure-system-secret-here" \
  http://localhost:3000/baseR4/Patient

# Get specific patient
curl -u "system:your-super-secure-system-secret-here" \
  http://localhost:3000/baseR4/Patient/patient-123

# Search with parameters
curl -u "system:your-super-secure-system-secret-here" \
  "http://localhost:3000/baseR4/Patient?name=Smith&birthdate=1970-01-01"
```

### POST Requests
```bash
# Create a new patient
curl -u "system:your-super-secure-system-secret-here" \
  -X POST \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "name": [{
      "family": "Test",
      "given": ["System"]
    }],
    "gender": "male",
    "birthDate": "1990-01-01"
  }' \
  http://localhost:3000/baseR4/Patient

# Create a consent
curl -u "system:your-super-secure-system-secret-here" \
  -X POST \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Consent",
    "status": "active",
    "scope": {
      "coding": [{
        "system": "http://terminology.hl7.org/CodeSystem/consentscope",
        "code": "patient-privacy"
      }]
    },
    "category": [{
      "coding": [{
        "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        "code": "IDSCL"
      }]
    }]
  }' \
  http://localhost:3000/baseR4/Consent
```

### PUT Requests
```bash
# Update a resource
curl -u "system:your-super-secure-system-secret-here" \
  -X PUT \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "id": "patient-123",
    "name": [{
      "family": "Updated",
      "given": ["System"]
    }]
  }' \
  http://localhost:3000/baseR4/Patient/patient-123
```

### DELETE Requests
```bash
# Delete a resource
curl -u "system:your-super-secure-system-secret-here" \
  -X DELETE \
  http://localhost:3000/baseR4/Patient/patient-123
```

### Bundle Operations
```bash
# Submit a transaction bundle
curl -u "system:your-super-secure-system-secret-here" \
  -X POST \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Bundle",
    "type": "transaction",
    "entry": [{
      "request": {
        "method": "POST",
        "url": "Patient"
      },
      "resource": {
        "resourceType": "Patient",
        "name": [{"family": "Bundle", "given": ["Test"]}]
      }
    }]
  }' \
  http://localhost:3000/baseR4/
```

## Postman Configuration

### 1. Basic Setup
1. Create a new request
2. Go to the "Authorization" tab
3. Select "Basic Auth" from the Type dropdown
4. Enter:
   - Username: `system`
   - Password: `your-super-secure-system-secret-here`

### 2. Environment Variables (Recommended)
Create environment variables for reusability:

1. Create a new environment
2. Add variables:
   - `fhir_base_url`: `http://localhost:3000/baseR4`
   - `system_username`: `system`
   - `system_password`: `your-super-secure-system-secret-here`

3. In your requests:
   - URL: `{{fhir_base_url}}/Patient`
   - Authorization: Basic Auth
   - Username: `{{system_username}}`
   - Password: `{{system_password}}`

### 3. Pre-request Script (Alternative)
```javascript
// Automatically set Basic Auth header
const username = pm.environment.get("system_username") || "system";
const password = pm.environment.get("system_password") || "your-super-secure-system-secret-here";
const encodedAuth = btoa(username + ":" + password);

pm.request.headers.add({
    key: "Authorization",
    value: "Basic " + encodedAuth
});
```

### 4. Collection Setup
For multiple requests, set authorization at the collection level:

1. Edit collection
2. Go to "Authorization" tab
3. Select "Basic Auth"
4. Configure with system credentials
5. All requests in the collection will inherit this auth

## Security Considerations

1. **Never commit real secrets to version control** - Use environment variables
2. **Use strong, unique secrets** in production
3. **Rotate secrets regularly**
4. **Use HTTPS in production** to prevent credential interception
5. **Consider upgrading to JWT** for better security (RFC 7523)

## OAuth Client Alternative

You can also create an OAuth client with system role:

```javascript
// In MongoDB or via API
{
  "client_id": "system-service-client",
  "client_secret": "another-secure-secret",
  "client_name": "System Service Client",
  "role": "system",
  "grant_types": ["client_credentials"]
}
```

Then use:
```bash
curl -u "system-service-client:another-secure-secret" \
  http://localhost:3000/baseR4/Patient
```

## Troubleshooting

1. **401 Unauthorized**: Check credentials and ensure Basic Auth is enabled
2. **403 Forbidden**: System role may not have permission for the resource
3. **Connection refused**: Ensure server is running on the correct port
4. **Invalid auth header**: Ensure proper Base64 encoding of credentials
5. **Empty results**: If you get an empty Bundle with 200 OK:
   - The server code may need updating to handle SYSTEM role
   - Restart the Meteor server after code changes
   - Check server logs for access control messages
   - Ensure data exists in the database: `Patients.find().count()` in Meteor shell

## Testing System Access

Test that system authentication is working:

```bash
# Should return a Bundle of all patients
curl -u "system:your-super-secure-system-secret-here" \
  -w "\nHTTP Status: %{http_code}\n" \
  http://localhost:3000/baseR4/Patient

# Should return 401 with wrong credentials
curl -u "system:wrong-password" \
  -w "\nHTTP Status: %{http_code}\n" \
  http://localhost:3000/baseR4/Patient
```

## Next Steps

Consider implementing:
- JWT authentication (RFC 7523) for better security
- API key authentication as an alternative
- Rate limiting for system accounts
- Audit logging for all system-level access
- IP allowlisting for system accounts