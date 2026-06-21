// npmPackages/us-core/server.js
//
// Server entry — RE-EXPORTS the server module so the generated workflow
// server-loader (which does `import * as mod from '@node-on-fhir/us-core/server'`)
// captures ProfileSet + ProfileDecorators and registers them into Package[].
export * from './server/index.js';
