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

// For Meteor package exports (api.export) on server
if (typeof Package !== 'undefined') {
  this.CorrectionRequests = CorrectionRequests;
  this.CorrectionCommunications = CorrectionCommunications;
  this.CorrectionTasks = CorrectionTasks;
  this.CorrectionWorkflow = CorrectionWorkflow;
}