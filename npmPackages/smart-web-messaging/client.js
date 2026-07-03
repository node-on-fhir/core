// npmPackages/smart-web-messaging/client.js
//
// Client entry — SMART Web Messaging (HL7 postMessage API between EHR and SMART
// app). Migrated from packages/smart-web-messaging (Atmosphere) 2026-06-13.
//
// LIBRARY package, not a route workflow: the Atmosphere package had no
// api.mainModule — it used api.addFiles + api.export to publish SmartWebMessaging,
// MessageTypes, Activities, LaunchStatusCodes and UrlValidator as shared globals.
// Files with no ESM syntax stay non-strict scripts under Rspack (their bare
// `X = {…}` assignments install window globals, as under Atmosphere). Files that
// DO use import/export are strict modules; their bare-global declarations were
// rewritten to `const X = globalThis.X = {…}` so the globals still publish.
//
// Imports below are ordered by the dependency DAG (NOT the api.addFiles order):
// constants -> utilities -> schemas -> SmartWebMessaging -> client modules,
// because SmartWebMessaging and the schemas read those globals at module-init.
// Default export carries empty routes/sidebar (pure infrastructure, no UI nav).

// Constants (leaf — no deps)
import './lib/constants/MessageTypes.js';
import './lib/constants/Activities.js';
import './lib/constants/LaunchStatusCodes.js';

// Utilities (use constants only inside functions)
import './lib/utilities/MessageValidator.js';
import './lib/utilities/OriginChecker.js';

// Schemas (read LaunchStatusCodes at construction time)
import './lib/schemas/MessageSchema.js';
import './lib/schemas/ActivitySchema.js';

// Core namespace (reads constants + utilities + schemas at init)
import './lib/SmartWebMessaging.js';

// Client utils
import './client/utils/UrlValidator.js';

// Client messaging core
import './client/MessageHandler.js';
import './client/SmartMessagingClient.js';

// Client handlers
import './client/handlers/StatusHandlers.js';
import './client/handlers/UIHandlers.js';
import './client/handlers/ScratchpadHandlers.js';
import './client/handlers/FhirHandlers.js';

// Client services
import './client/services/ScratchpadService.js';
import './client/services/ActivityLauncher.js';
import './client/services/MessageDispatcher.js';

// Client React components
import './client/components/SmartMessagingProvider.jsx';
import './client/components/ActivityLaunchModal.jsx';
import './client/components/MessagingDebugPanel.jsx';

export default {
  name: 'smart-web-messaging',
  routes: [],
  sidebarItems: []
};
