# ONC 170.315 Certification Mapping

This document maps ONC 170.315 certification requirements to Honeycomb packages and modules.

## Updated Package Organization

### Core Honeycomb Modules

#### honeycomb/accounts
- **170.315(d)(5)** - Automatic access time-out
  - Status: ✅ Algo | ✅ Implemented | ✅ v3
  - Location: Core Meteor accounts system
  - Features: Session timeout, automatic logout, configurable timeout periods

#### honeycomb/mongo
- **170.315(d)(6)** - Encryption at rest
  - Status: ✅ Algo | ✅ Implemented | ✅ v3
  - Location: MongoDB encryption configuration
  - Features: Database encryption, encrypted storage, field-level encryption

#### honeycomb/cordova
- **170.315(d)(7)** - Encryption of data in motion
  - Status: ✅ Algo | ✅ Implemented | ✅ v3
  - Location: Cordova mobile app configuration
  - Features: TLS/SSL for mobile communications, certificate pinning

#### honeycomb/security
- **170.315(b)(7)** - Security tags (patient data segmentation)
  - Status: ✅ Algo | ✅ Implemented | ✅ v3
  - Location: Core security module
  - Features: Security labels, data segmentation, consent-based access control
  
- **170.315(b)(8)** - Security tags (summary and encounter)
  - Status: ✅ Algo | ✅ Implemented | ✅ v3
  - Location: Core security module
  - Features: Document-level security tags, encounter segmentation

### HIPAA Compliance Package

#### packages/hipaa-compliance
- **170.315(d)(2)** - Auditable events and tamper-resistance
  - Status: ✅ Algo | ✅ Implemented | ✅ v3
  - Features: Comprehensive audit logging, tamper detection, integrity checks
  
- **170.315(d)(3)** - Audit report(s)
  - Status: ✅ Algo | ✅ Implemented | ✅ v3
  - Features: Audit report generation, filtering, export capabilities
  
- **170.315(d)(10)** - Auditing actions on health information
  - Status: ✅ Algo | ✅ Implemented | ✅ v3
  - Features: CRUD operation logging, user action tracking, access logging

### Standalone Certification Packages

#### packages/force-ssl
- **170.315(d)(9)** - Trusted connection
  - Status: ✅ Algo | ✅ Implemented | ✅ v3
  - Features: SSL/TLS enforcement, HSTS headers, secure cookies

## Implementation Notes

### Core Modules (honeycomb/*)
These requirements are implemented in Honeycomb's core framework:
- Built into the Meteor platform
- Configured via settings files
- No separate package required

### HIPAA Compliance Package
Consolidates all audit and compliance requirements:
- Single location for audit logging
- Unified reporting interface
- Centralized compliance management

### Migration Strategy
1. Core security features remain in framework
2. Audit requirements consolidated in hipaa-compliance
3. Specialized features in dedicated packages

## Compliance Checklist

| Requirement | Package/Module | Algo | Implemented | v3 |
|------------|---------------|------|-------------|-----|
| 170.315(d)(2) | hipaa-compliance | ✅ | ✅ | ✅ |
| 170.315(d)(3) | hipaa-compliance | ✅ | ✅ | ✅ |
| 170.315(d)(5) | honeycomb/accounts | ✅ | ✅ | ✅ |
| 170.315(d)(6) | honeycomb/mongo | ✅ | ✅ | ✅ |
| 170.315(d)(7) | honeycomb/cordova | ✅ | ✅ | ✅ |
| 170.315(d)(9) | force-ssl | ✅ | ✅ | ✅ |
| 170.315(d)(10) | hipaa-compliance | ✅ | ✅ | ✅ |
| 170.315(b)(7) | honeycomb/security | ✅ | ✅ | ✅ |
| 170.315(b)(8) | honeycomb/security | ✅ | ✅ | ✅ |