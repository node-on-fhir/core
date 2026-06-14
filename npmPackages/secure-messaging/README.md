# Secure Messaging Package

ONC §170.315(e)(2) Secure Messaging & §170.315(h)(1) Direct Project Implementation

## Overview

This package provides comprehensive secure messaging capabilities for the Honeycomb platform, meeting ONC Health IT Certification requirements for both patient-provider secure messaging and Direct Project messaging.

## Features

### Direct Project (§170.315(h)(1))
- **Send and receive Direct messages** using the Direct Protocol
- **S/MIME encryption** for message security
- **X.509 certificate management** and validation
- **Message Disposition Notifications (MDN)** for delivery confirmation
- **DNS/LDAP certificate lookup** for recipient verification
- **Audit logging** of all Direct messaging activities

### Secure Messaging (§170.315(e)(2))
- **Patient-provider messaging** through the patient portal
- **Message threading** for conversation continuity
- **Read receipts** to track message viewing
- **File attachments** up to 25MB per attachment
- **Search and filter** messages by status, type, and content
- **Real-time notifications** for new messages

## ONC Certification Compliance

### Direct Project §170.315(h)(1) Requirements

1. **Edge Protocol**: Implements Direct Protocol using S/MIME over SMTP
2. **Encryption**: All Direct messages are encrypted using X.509 certificates
3. **Trust Framework**: Validates sender certificates against trusted anchors
4. **MDN Support**: Sends and processes Message Disposition Notifications
5. **Address Format**: Enforces Direct address format (user@domain.direct.org)
6. **Audit Trail**: Complete audit logging of all Direct transactions

### Secure Messaging §170.315(e)(2) Requirements

1. **Message Composition**: Patients can compose and send messages to providers
2. **Message Receipt**: Providers receive and can respond to patient messages
3. **Threading**: Messages maintain conversation context
4. **Attachments**: Support for clinical documents and images
5. **Notifications**: Users are notified of new messages
6. **Audit Logging**: All messaging activities are logged

## FHIR Resources

The package uses the following FHIR resources:

- **Communication**: Core messaging resource
- **CommunicationRequest**: Message requests/drafts
- **DocumentReference**: Attached documents
- **Binary**: File attachments
- **AuditEvent**: Compliance audit trail

## Usage

### Routes

- `/secure-messaging` - Main messaging hub
- `/secure-messaging/direct` - Direct Project messages
- `/secure-messaging/patient` - Patient portal messages

### Methods

```javascript
// Send a Direct message
Meteor.call('secureMessaging.send', {
  to: 'dr.smith@hospital.direct.org',
  subject: 'Patient Referral',
  body: 'Please see attached CCD...',
  type: 'direct',
  encrypted: true,
  requestMDN: true,
  attachments: ['file-id']
}, callback);

// Get inbox messages
Meteor.call('secureMessaging.getInbox', {
  type: 'all', // 'direct', 'patient', or 'all'
  status: 'unread',
  limit: 50
}, callback);

// Mark message as read
Meteor.call('secureMessaging.markAsRead', messageId, callback);

// Verify Direct address certificate
Meteor.call('secureMessaging.verifyDirectAddress', 
  'provider@hospital.direct.org', 
  callback
);
```

## Configuration

Add to your settings file:

```json
{
  "public": {
    "modules": {
      "secureMessaging": {
        "enabled": true,
        "showInWorkflows": true,
        "enableDirectMessaging": true,
        "enablePatientMessaging": true,
        "directDomain": "yourclinic.direct.org"
      }
    }
  },
  "private": {
    "secureMessaging": {
      "smtpSettings": {
        "host": "smtp.direct.org",
        "port": 587,
        "secure": true
      },
      "certificateStore": "/path/to/certs",
      "privateKey": "/path/to/private.key",
      "trustAnchors": [
        "DirectTrust",
        "FBCA"
      ]
    }
  }
}
```

## Direct Protocol Implementation

### Sending Direct Messages

1. Lookup recipient's certificate via DNS CERT record
2. Validate certificate against trust anchors
3. Encrypt message using recipient's public key (S/MIME)
4. Send via SMTP with TLS
5. Request MDN if configured
6. Log transaction in AuditEvent

### Receiving Direct Messages

1. Accept incoming SMTP connection
2. Verify sender's certificate
3. Decrypt message using private key
4. Store as FHIR Communication resource
5. Send MDN if requested
6. Notify recipient

## Security Features

- **End-to-end encryption** for Direct messages
- **Certificate-based authentication**
- **TLS transport security**
- **Message integrity verification**
- **Audit logging** of all operations
- **Access control** based on user roles

## User Interface

The package provides an information-dense, single-page interface inspired by:
- **Edward Tufte**: Visual Display of Quantitative Information
- **Borries Schwesinger**: The Form Book

Key UI features:
- Split-pane layout with message list and detail view
- Real-time search and filtering
- Visual indicators for encryption and delivery status
- Inline composition with attachment support
- Thread visualization for conversations
- Compact information display with progressive disclosure

## Testing

The package includes test scenarios for ONC certification:

### Direct Project Tests
1. Send encrypted Direct message with MDN request
2. Receive and decrypt Direct message
3. Process MDN and update message status
4. Validate certificate chain
5. Handle invalid certificates appropriately

### Secure Messaging Tests
1. Patient sends message to provider
2. Provider responds to patient message
3. Message threading maintains conversation
4. Attachments upload and download correctly
5. Read receipts update message status

## Integration Points

- **SMTP Server**: For Direct protocol messaging
- **DNS**: For certificate lookup via CERT records
- **LDAP**: Optional directory for certificate storage
- **Certificate Authority**: For certificate validation
- **Patient Portal**: For secure patient messaging

## References

- [Direct Project Specification](http://wiki.directproject.org/)
- [ONC §170.315(h)(1) Test Method](https://www.healthit.gov/test-method/direct-project)
- [ONC §170.315(e)(2) Test Method](https://www.healthit.gov/test-method/secure-messaging)
- [RFC 5751 - S/MIME](https://tools.ietf.org/html/rfc5751)
- [RFC 3798 - MDN](https://tools.ietf.org/html/rfc3798)

## License

Copyright (c) 2024 Clinical Meteor
Licensed under MIT License