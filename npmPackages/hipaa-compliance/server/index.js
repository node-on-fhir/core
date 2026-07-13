// npmPackages/hipaa-compliance/server/index.js
//
// Server mainModule. Wires the server-only security pipeline (encryption +
// signature) into the logger before any server file logs, then loads
// methods, publications, hooks, encryption methods, policy methods, and
// startup (last).

import { HipaaLogger } from '../lib/HipaaLogger.js';
import { EncryptionManager } from '../lib/EncryptionManager.js';

HipaaLogger.attachSecurityPipeline(EncryptionManager);

import './methods.js';
import './publications.js';
import './hooks.js';
import './encryption.js';
import './policyMethods.js';
import './startup.js';
