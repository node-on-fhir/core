# Patient Publications and Subscriptions Architecture

This document explains how to properly implement pub/sub for the PatientDirectory module without relying on autopublish.

## Overview

The patient pub/sub system provides several publication methods with different levels of access control and filtering capabilities. The system is designed to work in both development and production environments with appropriate security measures.

## Publications Available

### 1. `patients.search`
**File:** `/server/publications/patients.js`

The main publication for searching and filtering patients with authentication and access control.

**Parameters:**
- `query` (Object): MongoDB query for filtering patients
- `options` (Object): Options like limit, sort, fields

**Features:**
- Requires authentication in production
- Optional authentication in development (configurable)
- Supports complex search queries
- Implements access control based on user roles
- Limits results to prevent performance issues (max 1000)

**Usage:**
```javascript
Meteor.subscribe('patients.search', {
  $or: [
    {'name.0.family': {$regex: /smith/i}},
    {'name.0.given': {$regex: /john/i}}
  ]
}, { limit: 100 });
```

### 2. `patients.all`
**File:** `/server/publications/patients.js`

Development-only publication that returns all patients. This publication is disabled in production.

**Usage:**
```javascript
// Only works in development
Meteor.subscribe('patients.all');
```

### 3. `patients.byId`
**File:** `/server/publications/patients.js`

Returns a single patient by ID with access control.

**Parameters:**
- `patientId` (String): The patient's _id or id field

**Features:**
- Requires authentication
- Patients can only access their own record
- Searches by both _id and id fields

**Usage:**
```javascript
Meteor.subscribe('patients.byId', 'patient-123');
```

### 4. `patients.forPractitioner`
**File:** `/server/publications/patients.js`

Returns patients assigned to a specific practitioner.

**Parameters:**
- `practitionerId` (String, optional): If not provided, uses current user's practitionerId

**Usage:**
```javascript
Meteor.subscribe('patients.forPractitioner', 'practitioner-456');
```

### 5. `autopublish.Patients`
**File:** `/server/publications/autopublish.js`

Legacy autopublish publication that's only enabled when `autopublishSubscriptions` is true in settings. Should not be used in production.

## Client-Side Implementation

### PatientDirectory Component

The PatientDirectory component (`/imports/ui-modules/PatientsDirectory.jsx`) automatically selects the appropriate publication based on:

1. **Autopublish enabled**: Uses `autopublish.Patients`
2. **Development mode without search**: Uses `patients.all`
3. **Development/Production with search**: Uses `patients.search`
4. **Production without search**: Uses `patients.search` with empty query

## Configuration

### Settings Configuration

```json
{
  "public": {
    "environment": "development|production",
    "defaults": {
      "autopublish": false
    },
    "modules": {
      "patientDirectory": {
        "enabled": true
      },
      "fhir": {
        "Patients": {
          "allowUnauthenticatedAccess": false,
          "requireAuthInDev": false
        }
      }
    }
  },
  "private": {
    "fhir": {
      "autopublishSubscriptions": false
    }
  }
}
```

### Environment Variables

- `NODE_ENV`: Set to 'development' or 'production'
- `ENABLE_AUTOPUBLISH`: Set to 'true' to force enable autopublish (testing only)

## Security Considerations

### Authentication
- All patient publications require authentication in production
- Development mode can optionally allow unauthenticated access for testing
- Use `allowUnauthenticatedAccess` and `requireAuthInDev` settings to control access

### Access Control
The publications implement basic access control:
- Patients can only see their own record (when user.patientId is set)
- Practitioners see patients assigned to them (future implementation)
- Admins see all patients (future implementation)

### PHI Protection
- Limit queries to prevent large data exports
- Log all access attempts
- Implement field-level restrictions based on user roles (future)

## Migration from Autopublish

To migrate from autopublish to proper publications:

1. **Disable autopublish** in settings:
```json
{
  "private": {
    "fhir": {
      "autopublishSubscriptions": false
    }
  }
}
```

2. **Update client subscriptions** - The PatientDirectory component already handles this automatically

3. **Test authentication** - Ensure users can log in and access appropriate patients

4. **Monitor logs** - Check server logs for unauthorized access attempts

## Testing

### Development Testing
```bash
# Run with autopublish disabled
meteor run --settings configs/settings.honeycomb.localhost.json

# Override to enable autopublish for testing
ENABLE_AUTOPUBLISH=true meteor run --settings configs/settings.honeycomb.localhost.json
```

### Access Control Testing
1. Create test users with different roles (patient, practitioner, admin)
2. Verify each user can only see appropriate patients
3. Test search functionality with various queries
4. Verify production mode blocks unauthenticated access

## Future Enhancements

1. **Role-based access control**: Implement comprehensive RBAC using alanning:roles
2. **Field-level security**: Restrict sensitive fields based on user permissions
3. **Audit logging**: Track all patient data access for HIPAA compliance
4. **Performance optimization**: Add indexes and implement pagination
5. **Care team access**: Allow care team members to see assigned patients
6. **Consent-based access**: Integrate with consent engine for patient-controlled access

## Troubleshooting

### No patients showing up
1. Check if user is authenticated: `Meteor.userId()`
2. Verify publication is subscribed: Check browser console for subscription logs
3. Check server logs for access denied messages
4. Verify patients exist in database: `Patients.find().count()`

### Search not working
1. Ensure search query is properly formatted
2. Check if fields being searched have the correct structure
3. Verify regex patterns are valid
4. Check browser console for subscription errors

### Authentication issues
1. Verify user is logged in
2. Check user roles and permissions
3. Ensure patientId/practitionerId is set on user record if needed
4. Review server logs for authentication failures