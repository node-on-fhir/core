# SMART Web Messaging Package

Implementation of the [SMART Web Messaging](https://build.fhir.org/ig/HL7/smart-web-messaging/) specification for Meteor/Honeycomb applications.

## Overview

SMART Web Messaging enables SMART applications running in iframes to communicate with their host EHR systems using HTML5's `window.postMessage` API. This package provides:

- Complete implementation of all message types defined in the IG
- Client-side message handling and routing
- Server-side OAuth scope management
- React components for easy integration
- Scratchpad for temporary FHIR resource storage
- Activity launching framework
- FHIR proxy for secure API access

## Installation

```bash
meteor add clinical:smart-web-messaging
```

## Quick Start

### Client-Side Usage

```javascript
import { SmartMessagingClient } from 'meteor/clinical:smart-web-messaging';

// Initialize the client
await SmartMessagingClient.initialize();

// Signal app completion
await SmartMessagingClient.done({ 
  navigationHint: { type: 'replace', url: '/patients' } 
});

// Launch an activity
const result = await SmartMessagingClient.launchActivity('appointment-book', {
  patient: 'Patient/123',
  resources: [appointmentBundle]
});

// Use scratchpad
const created = await SmartMessagingClient.scratchpad.create({
  resourceType: 'Observation',
  status: 'draft',
  code: { text: 'Blood pressure' }
});
```

### React Integration

```jsx
import { SmartMessagingProvider, useSmartMessaging } from 'meteor/clinical:smart-web-messaging';

// Wrap your app
export function App() {
  return (
    <SmartMessagingProvider>
      <YourAppContent />
    </SmartMessagingProvider>
  );
}

// Use in components
function MyComponent() {
  const { done, launchActivity, scratchpad, ready } = useSmartMessaging();
  
  if (!ready) return <div>Connecting...</div>;
  
  const handleComplete = async () => {
    await done({ status: 'completed' });
  };
  
  return <button onClick={handleComplete}>Done</button>;
}
```

### Server-Side Usage

```javascript
import { SmartMessagingServer } from 'meteor/clinical:smart-web-messaging';

// Generate context for SMART launch
const messagingContext = SmartMessagingServer.generateMessagingContext(
  userId,
  clientId,
  {
    origin: 'https://ehr.example.com',
    scopes: ['messaging/scratchpad.*', 'messaging/ui.*']
  }
);

// Add to SMART launch response
launchContext.smart_web_messaging_handle = messagingContext.smart_web_messaging_handle;
launchContext.smart_web_messaging_origin = messagingContext.smart_web_messaging_origin;
```

## Message Types

### Status Messages
- `status.handshake` - Initial connection handshake
- `status.ready` - Confirm readiness
- `status.response` - Generic status responses

### UI Control Messages
- `ui.done` - Signal app completion
- `ui.launchActivity` - Launch EHR activities

### Scratchpad Messages
- `scratchpad.create` - Create temporary resource
- `scratchpad.read` - Read temporary resource
- `scratchpad.update` - Update temporary resource
- `scratchpad.delete` - Delete temporary resource

### FHIR Proxy Messages
- `fhir.http` - Make FHIR API requests through messaging

## Activities

The package supports these standard activities:

- `appointment-book` - Launch appointment booking
- `order-review` - Review draft orders
- `problem-review` - Add to problem list

## OAuth Scopes

Required scopes for different operations:

- `messaging/scratchpad.read` - Read scratchpad resources
- `messaging/scratchpad.write` - Create/update/delete scratchpad
- `messaging/ui.done` - Send done signal
- `messaging/ui.launchActivity` - Launch activities
- `messaging/fhir.proxy` - Use FHIR proxy
- `messaging/*` - All messaging capabilities

## Configuration

Configure via Meteor settings:

```json
{
  "public": {
    "smartWebMessaging": {
      "debug": true,
      "allowedOrigins": ["https://ehr.example.com"],
      "defaultTimeout": 30000,
      "enableScratchpad": true,
      "enableFhirProxy": true
    }
  }
}
```

## Security

- Origin validation for all messages
- OAuth scope enforcement
- Messaging handle correlation
- Automatic context expiration

## Debugging

Use the included debug panel:

```jsx
import { MessagingDebugPanel } from 'meteor/clinical:smart-web-messaging';

// Add to your dev UI
<MessagingDebugPanel defaultOpen={true} />
```

## API Reference

### SmartMessagingClient

- `initialize(options)` - Initialize the client
- `done(result)` - Signal completion
- `launchActivity(type, params, context)` - Launch activity
- `scratchpad.create/read/update/delete()` - Scratchpad operations
- `fhir.get/post/put/delete()` - FHIR proxy operations
- `onMessage(type, handler)` - Register message handlers

### SmartMessagingServer

- `generateMessagingContext(userId, clientId, options)` - Generate context
- `validateMessagingHandle(handle)` - Validate handle
- `checkScope(handle, scope)` - Check authorization

### React Hooks

- `useSmartMessaging()` - Access messaging functionality

## License

Apache 2.0