# @node-on-fhir/fhircast-module

FHIRcast STU3 real-time context synchronization module for Node on FHIR. Provides a hub, subscriber client, and publisher client for clinical workflow event coordination.

## Overview

FHIRcast enables clinical applications to share context in real time. When a user opens a patient chart in one application, all subscribed applications receive the event and can synchronize. This module implements:

- **Hub** -- In-memory subscription registry with WebSocket and HTTP callback delivery
- **Subscriber** -- Subscribe to topics, receive events via WebSocket or DDP
- **Publisher** -- Publish events to the hub via REST, with auto-publish from record lifecycle events

## Quick Start

```bash
# From the Honeycomb root
EXTRA_WORKFLOWS=@node-on-fhir/fhircast-module meteor run \
  --settings npmPackages/fhircast/settings/settings.fhircast.json
```

The hub starts on the Meteor server. Default endpoints:

| Endpoint | URL |
|----------|-----|
| Hub REST API | `http://localhost:3200/api/hub` |
| WebSocket bind | `ws://localhost:3200/bind/<endpoint>` |
| Client callback | `http://localhost:3200/client` |

## Architecture

```
                    +-------------------+
                    |    FHIRcast Hub    |
                    |  (server/hub.js)  |
                    +--------+----------+
                             |
              +--------------+--------------+
              |                             |
     WebSocket /bind/:id            HTTP POST callback
              |                             |
    +---------+----------+       +----------+---------+
    |  Subscribe Client  |       |  External Systems  |
    | (SubscribePage.jsx)|       |  (EHR, PACS, etc.) |
    +--------------------+       +--------------------+
              |
         DDP pub/sub
         (fallback)
              |
    +---------+----------+
    |   Publish Client   |
    | (PublishPage.jsx)  |
    +--------------------+
```

## Pages

### /fhircast-config
Combined subscription and WebSocket panel. Subscribe to a hub topic, then publish events through the bound WebSocket connection.

### /fhircast-subscribe
Full subscription management with event filtering. Supports URL parameters:
- `?topic=PatientXYZ` -- Pre-fill the topic field
- `?authorization=true` -- Show the authorization header field

Received events display in an expandable accordion with filtering by event type.

### /fhircast-publish
Two- or three-column layout for event publishing and monitoring:
- **Column 1** -- Hub connection, subscription management, resource publish config
- **Column 2** -- Hub events feed (merged WebSocket + DDP events)
- **Column 3** -- Audit events trail (optional, 3-column mode)

Supports two publish modes:
- **Auto** -- Lifecycle events from monitored collections trigger FHIRcast events automatically
- **Ad-Hoc** -- Manual event creation with topic, event type, and JSON context

## Supported Events

FHIRcast STU3 event types:

| Event | Description |
|-------|-------------|
| `patient-open` | Patient chart opened |
| `patient-close` | Patient chart closed |
| `imagingstudy-open` | Imaging study opened |
| `imagingstudy-close` | Imaging study closed |
| `encounter-open` | Encounter opened |
| `encounter-close` | Encounter closed |
| `diagnosticreport-open` | Diagnostic report opened |
| `diagnosticreport-close` | Diagnostic report closed |
| `diagnosticreport-select` | Diagnostic report selected |
| `*-update` | Resource updated (patient, imagingstudy, encounter, diagnosticreport) |
| `syncerror` | Synchronization error |
| `userlogout` | User logged out |
| `userhibernate` | Session hibernated |

## Hub API

### GET /api/hub

Returns hub status and active subscriptions.

```json
{
  "status": "active",
  "hub": "FHIRcast STU3 Hub",
  "version": "0.1.0",
  "totalTopics": 1,
  "totalSubscribers": 2,
  "topics": {
    "DrXRay": [
      { "events": ["patient-open", "patient-close"], "channelType": "websocket", "createdAt": "..." }
    ]
  }
}
```

### POST /api/hub

**Subscribe/Unsubscribe:**

```json
{
  "hub.mode": "subscribe",
  "hub.topic": "DrXRay",
  "hub.events": "patient-open,patient-close",
  "hub.secret": "secret",
  "hub.lease": 999,
  "hub.channel.type": "websocket",
  "hub.callback": "http://localhost:3200/client",
  "hub.channel.endpoint": "abc123"
}
```

Response (202 Accepted):
```json
{
  "hub.channel.endpoint": "ws://localhost:3200/bind/abc123",
  "hub.topic": "DrXRay",
  "hub.events": "patient-open,patient-close"
}
```

**Publish Event:**

```json
{
  "timestamp": "2026-04-23T12:00:00.000Z",
  "id": "event-123",
  "event": {
    "hub.topic": "DrXRay",
    "hub.event": "patient-open",
    "context": [
      {
        "key": "patient",
        "resource": {
          "resourceType": "Patient",
          "id": "ewUbXT9RWEbSj5wPEdgRaBw3"
        }
      }
    ]
  }
}
```

### WebSocket /bind/:endpoint

After subscribing with `hub.channel.type: "websocket"`, connect to the returned endpoint. The hub sends `{ "bound": true }` on successful binding, then forwards matching events as JSON frames.

## Meteor Methods

| Method | Description |
|--------|-------------|
| `fhircast.subscribe(hubUrl, data, authorization?)` | Forward subscription to hub |
| `fhircast.unsubscribe(hubUrl, data, authorization?)` | Forward unsubscription to hub |
| `fhircast.publishEvent(hubUrl, eventData)` | Publish event to hub + store via DDP |
| `fhircast.getHubStatus(hubUrl)` | Check hub status |
| `fhircast.getPublishConfig()` | Get publish config per resource type |
| `fhircast.setTopic(topic)` | Set active topic (in-memory) |
| `fhircast.setTopicMode(mode)` | Set topic mode (in-memory) |
| `fhircast.setResourceFhircast(resourceType, config)` | Configure per-resource publishing |
| `fhircast.getStatus()` | Module health check |

All methods use Meteor v3 async patterns and require authentication (`this.userId`).

## Exported Components

Import reusable components directly:

```javascript
// Subscription management panel
import SubscriptionPanel from '@node-on-fhir/fhircast-module/components/SubscriptionPanel';

// WebSocket status and controls
import WebSocketPanel from '@node-on-fhir/fhircast-module/components/WebSocketPanel';

// Expandable event list with filtering
import EventsAccordion from '@node-on-fhir/fhircast-module/components/EventsAccordion';

// Active subscription table
import SubscriptionList from '@node-on-fhir/fhircast-module/components/SubscriptionList';

// Subscribe button
import SubscribeButton from '@node-on-fhir/fhircast-module/components/SubscribeButton';

// WebSocket hooks
import { useFhircastWebSocket, useWebSocket } from '@node-on-fhir/fhircast-module/hooks/useFhircastWebSocket';

// Type definitions and constants
import { EventType, SubscriptionParams, SubscriptionMode } from '@node-on-fhir/fhircast-module/lib/types';
import { DEFAULT_HUB_URL, DEFAULT_WS_URL } from '@node-on-fhir/fhircast-module/lib/constants';
```

## Hooks

### useFhircastWebSocket

```javascript
var ws = useFhircastWebSocket({
  url: 'ws://localhost:3200/bind',
  endpoint: 'my-endpoint-id',
  connect: true,
  onBind: function(endpoint) { console.log('Bound:', endpoint); },
  onEvent: function(event) { console.log('Event:', event); },
  onUnbind: function() { console.log('Unbound'); }
});

// ws.status   -- WebSocketStatus enum (Closed, Opening, Open)
// ws.isBound  -- true after hub confirms binding
// ws.publishEvent(event, id) -- send event through WebSocket
```

### useWebSocket

Low-level WebSocket hook:

```javascript
var ws = useWebSocket({
  url: 'ws://localhost:3200/bind/endpoint',
  onMessage: function(e) { console.log(JSON.parse(e.data)); },
  onOpen: function() { console.log('Connected'); },
  onClose: function() { console.log('Disconnected'); }
});

// ws.open()   -- connect
// ws.close()  -- disconnect
// ws.send(msg) -- send string
// ws.status   -- WebSocketStatus enum
```

## Settings

Configure via Meteor settings JSON. Three example configs are provided in `settings/`.

### Public Settings

```json
{
  "public": {
    "fhircast": {
      "hubUrl": "http://localhost:3200/api/hub",
      "wsUrl": "ws://localhost:3200/bind",
      "clientUrl": "http://localhost:3200/client",
      "topic": "DrXRay"
    }
  }
}
```

### Private Settings (per-resource publish config)

```json
{
  "private": {
    "fhir": {
      "rest": {
        "Patient": {
          "fhircast": {
            "publish": true,
            "events": ["originate", "amend", "attest", "access"]
          }
        },
        "ImagingStudy": {
          "fhircast": {
            "publish": true,
            "events": ["originate", "amend"]
          }
        }
      }
    }
  }
}
```

## Record Lifecycle Integration

When `recordLifecycle.fhircastBridge` is enabled in settings, lifecycle events (originate, amend, attest, etc.) from monitored collections are bridged to FHIRcast events automatically:

| Lifecycle Event | FHIRcast Action |
|----------------|-----------------|
| `originate` | `*-open` |
| `amend` | `*-update` |
| `attest` | `*-close` |
| `destroy` | `*-close` |
| `access` | `*-open` |

The resource type determines the event prefix (e.g., `originate` on a Patient becomes `patient-open`).

## File Structure

```
fhircast/
├── package.json
├── workflow.json
├── client.js                       # Client entry (routes, sidebar, footer)
├── server.js                       # Server entry (methods + hub)
├── lib/
│   ├── FhircastEvents.js           # MongoDB collection
│   └── sanitize.js                 # Dotted-key sanitization for MongoDB
├── client/
│   ├── FhircastConfigPage.jsx      # Config page
│   ├── FhircastPublishPage.jsx     # Publish page
│   ├── FhircastSubscribePage.jsx   # Subscribe page
│   ├── hooks/
│   │   └── useFhircastWebSocket.js # WebSocket hooks
│   ├── lib/
│   │   ├── constants.js            # Default URLs, topic, context
│   │   └── types.js                # Event types, subscription params
│   └── components/
│       ├── CollectionsToPublish.jsx # Resource publish configuration
│       ├── EventsAccordion.jsx     # Expandable event list
│       ├── PublishEvent.jsx        # Event creation form
│       ├── SubscriptionPanel.jsx   # Subscription management
│       ├── SubscriptionList.jsx    # Active subscriptions table
│       ├── SubscribeButton.jsx     # Standalone subscribe button
│       ├── WebSocketPanel.jsx      # WebSocket controls
│       ├── HubEventsFeed.jsx       # Tabbed event feed
│       ├── ReceivedEvents.jsx      # Received events table
│       ├── AuditEventsColumn.jsx   # Audit trail placeholder
│       └── FhircastNavButtons.jsx  # Footer navigation
├── server/
│   ├── hub.js                      # FHIRcast hub (HTTP + WebSocket)
│   ├── methods.js                  # Meteor methods + publications
│   └── clientEndpoint.js           # Hub callback receiver
├── settings/
│   ├── settings.fhircast.json
│   ├── settings.fhircast.2.json
│   └── settings.fhircast.examroom.json
└── data/
    └── *.phr                       # Sample patient health records
```

## Implementation Notes

- **In-memory subscriptions** -- Hub subscriptions are stored in a JavaScript Map and are lost on server restart. This is suitable for development and demos.
- **Dotted key sanitization** -- MongoDB forbids dots in field names. The `sanitizeDottedKeys()` utility converts `hub.topic` to `hub_topic` before storage.
- **Dual delivery** -- Events are always stored via DDP (Meteor pub/sub) even if the hub is unreachable, so clients receive events regardless of WebSocket status.
- **Raw WebSocket** -- The hub uses manual WebSocket frame encoding (no Socket.io dependency).
- **Peer dependencies** -- React 18 and Material-UI v5 are peer dependencies; they come from the host Meteor application.



## License

Apache 2.0
