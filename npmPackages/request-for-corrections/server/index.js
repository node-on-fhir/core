// packages/request-for-corrections/server/index.js

import { Meteor } from 'meteor/meteor';

// Import startup configuration
import './startup';

// Import and register methods
import './methods/correctionRequests';
import './methods/correctionWorkflow';
import './methods/correctionOperations';

// Import and register publications
import './publications/correctionRequests';
import './publications/correctionCommunications';

// Import collections to ensure they're initialized
import { CorrectionRequests } from '../lib/collections/CorrectionRequests';
import { CorrectionCommunications } from '../lib/collections/CorrectionCommunications';
import { CorrectionTasks } from '../lib/collections/CorrectionTasks';

// Export collections for server-side use
export {
  CorrectionRequests,
  CorrectionCommunications,
  CorrectionTasks
};

// Import workflow
import { CorrectionWorkflow } from '../lib/CorrectionWorkflow';

// (Removed the Atmosphere api.export shim that assigned `this.CorrectionRequests`
// etc. — in a strict ES module `this` is undefined, so it would throw under
// Rspack. The collections/workflow are already published via the `export {}`
// statements above; the WorkflowRegistry server loader needs no globals here.)