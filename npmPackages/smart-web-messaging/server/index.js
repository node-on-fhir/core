// npmPackages/smart-web-messaging/server/index.js
//
// Server entry — side-effect imports ordered by dependency DAG (constants ->
// utilities -> schemas -> SmartWebMessaging -> server modules), because the
// schemas read LaunchStatusCodes and SmartWebMessaging reads constants/
// utilities/schemas at module-init. Strict files' bare-global declarations were
// rewritten to `const X = globalThis.X = …`; no-ESM files stay non-strict and
// install window globals as under Atmosphere.

// Constants (leaf)
import '../lib/constants/MessageTypes.js';
import '../lib/constants/Activities.js';
import '../lib/constants/LaunchStatusCodes.js';

// Utilities
import '../lib/utilities/MessageValidator.js';
import '../lib/utilities/OriginChecker.js';

// Schemas (read LaunchStatusCodes at construction time)
import '../lib/schemas/MessageSchema.js';
import '../lib/schemas/ActivitySchema.js';

// Core namespace (reads constants + utilities + schemas at init)
import '../lib/SmartWebMessaging.js';

// Server modules
import './SmartMessagingServer.js';
import './authorization/MessagingScopes.js';
import './methods/scratchpadMethods.js';
import './methods/activityMethods.js';
import './publications/scratchpadPublications.js';
