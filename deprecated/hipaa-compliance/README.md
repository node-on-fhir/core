# HIPAA Audit Starter Package

A comprehensive HIPAA-compliant audit logging and compliance management package for Honeycomb v3 healthcare applications.

## Overview

The `clinical:hipaa-compliance` package provides enterprise-grade HIPAA compliance features including automated audit logging, secure data encryption, compliance reporting, and policy management. Built for Meteor v3 with React and Material-UI.

## Features

- **Automated Audit Logging**: Comprehensive tracking of all data access and modifications
- **FHIR-Compliant Audit Events**: Standards-based audit event structure
- **Configurable Security**: Multiple encryption levels and access controls
- **Collection Hooks**: Automatic audit logging for FHIR collections
- **Compliance Reporting**: Generate and export audit reports
- **Policy Management**: Built-in HIPAA policy documentation with 20+ policy templates
- **Role-Based Access**: Granular permissions for audit data access
- **Real-Time Monitoring**: Live audit event tracking
- **Data Retention**: Configurable retention policies (7-year default)
- **Nightwatch Testing**: Comprehensive E2E test suite for audit functionality

## Installation

```bash
meteor add clinical:hipaa-compliance
```

## Quick Start

1. **Configure Settings**: Copy example configuration to your settings file
```bash
cp packages/hipaa-compliance/configs/settings.hipaa.json settings.json
```

2. **Set Environment Variables**:
```bash
export HIPAA_ENCRYPTION_KEY="your-secure-encryption-key"
export HIPAA_SECURITY_LEVEL="aes"
export HIPAA_RETENTION_YEARS="7"
```

3. **Run with HIPAA Configuration**:
```bash
meteor run --settings settings.json
```

## Configuration

### Basic Configuration

Add to your `settings.json`:

```json
{
  "public": {
    "hipaa": {
      "features": {
        "auditLogging": true,
        "automaticHooks": true,
        "complianceReporting": true
      },
      "compliance": {
        "environment": "production",
        "dataRetentionYears": 7
      }
    }
  },
  "private": {
    "hipaa": {
      "security": {
        "encryptionLevel": "aes",
        "requireSecondaryAuth": true
      }
    }
  }
}
```

### Security Levels

| Level | Encryption | Use Case | Performance |
|-------|------------|----------|-------------|
| `none` | None | Development only | Fast |
| `basic` | Base64 | Testing | Fast |
| `aes` | AES-256 | Production | Medium |
| `advanced` | Custom HSM | High-security | Slower |

## API Reference

### Core Logging API

```javascript
import { HipaaLogger } from 'meteor/clinical:hipaa-compliance';

// Log patient access
HipaaLogger.logPatientAccess(patientId, 'view');

// Log data modifications
HipaaLogger.logDataModification('Patients', recordId, 'update');

// Log system events
HipaaLogger.logSystemEvent('login', { userId: this.userId });
```

### Server Methods

```javascript
// Generate compliance report
Meteor.call('hipaa.generateReport', {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  eventTypes: ['view', 'modify', 'delete']
});

// Export audit trail
Meteor.call('hipaa.exportAuditTrail', {
  format: 'csv',
  dateRange: { start: startDate, end: endDate }
});
```

## Collection Hooks

Automatic audit logging can be enabled for any collection:

```javascript
// Automatically monitor FHIR collections
const monitoredCollections = [
  'Patients', 'Observations', 'Encounters', 
  'DiagnosticReports', 'MedicationRequests'
];

// Configure in settings
"hooks": {
  "enableCollectionHooks": true,
  "monitoredCollections": monitoredCollections
}
```

## User Interface

### Audit Log Page
- View all audit events with filtering and search
- Patient-specific audit trails
- Real-time event monitoring
- Export capabilities

### Compliance Reports
- Generate regulatory compliance reports
- Scheduled report generation
- Multi-format export (PDF, CSV, JSON)

### Policy Management
- Built-in HIPAA policy documentation with 20+ policies
- Policy categories: Core, Security, Data Management, Personnel, Incident Management, Risk & Compliance
- Easy navigation through policy menu at `/hipaa/policies`
- Individual policy pages with formatted content
- Customizable policy templates
- Policy acknowledgment tracking

## Security Features

### Access Control
- Role-based permissions (admin, compliance-officer, etc.)
- Patient-specific access validation
- Audit trail protection (write-only)

### Encryption
- Configurable encryption levels
- Key rotation support
- Environment-specific security policies

### Data Integrity
- Immutable audit records
- Cryptographic signatures (advanced mode)
- Tamper detection

## Compliance Features

### HIPAA Requirements
- ✅ Access logging (§164.312(a)(2)(i))
- ✅ Audit controls (§164.312(b))
- ✅ Data integrity (§164.312(c)(1))
- ✅ Person or entity authentication (§164.312(d))
- ✅ Transmission security (§164.312(e))

### Audit Event Types
- `view` - Data access/viewing
- `create` - New record creation
- `modify` - Data updates/changes
- `delete` - Record deletion
- `export` - Data export operations
- `login` - User authentication
- `denied` - Access denied events

## Development and Testing

### Development Mode
```json
{
  "public": {
    "hipaa": {
      "compliance": {
        "environment": "development",
        "auditDetailLevel": "verbose"
      }
    }
  },
  "private": {
    "hipaa": {
      "security": {
        "encryptionLevel": "basic",
        "allowDebugAccess": true
      }
    }
  }
}
```

### Testing
```bash
# Run package tests
meteor test-packages clinical:hipaa-compliance

# Run Nightwatch E2E tests
npm run test:e2e

# Run specific Nightwatch test
nightwatch tests/nightwatch/auditWorkflow.js
```

### Nightwatch Commands

The package includes custom Nightwatch commands:
- `logHipaaEvent(eventData)` - Log a HIPAA audit event
- `reviewHipaaAuditLogPage()` - Verify audit log page elements
- `hipaaLogEntryContains(rowIndex, eventData)` - Verify audit log entry content

## Production Deployment

### Environment Variables
```bash
HIPAA_ENCRYPTION_KEY=your-256-bit-key
HIPAA_SECURITY_LEVEL=aes
HIPAA_RETENTION_YEARS=7
MONGO_URL=mongodb://your-secure-mongodb
```

### Performance Considerations
- Index audit collections for performance
- Configure log rotation for large datasets
- Consider archival strategies for long-term retention

## Troubleshooting

### Common Issues

**Issue**: Audit events not appearing
- Check `auditLogging` feature flag is enabled
- Verify user permissions
- Check server logs for errors

**Issue**: Performance degradation
- Review audit detail level settings
- Check collection hook configuration
- Consider encryption level adjustment

## Support and Documentation

- 📖 [HIPAA Compliance Guide](./docs/compliance.md)
- 🔒 [Security Best Practices](./docs/security.md)
- ⚙️ [Configuration Reference](./docs/configuration.md)
- 🧪 [Testing Guide](./docs/testing.md)

## License

MIT License - see LICENSE file for details

## Contributing

Please read CONTRIBUTING.md for development guidelines and submission process.