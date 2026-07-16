// npmPackages/quality-measures/server/index.js
//
// Server entry — loads the quality-measures server modules as side-effect
// imports, in the same order as the Atmosphere package.js api.addFiles. The
// isomorphic lib/* files (pacio-measures, toc-sections, collections — were
// addFiles ['client','server']) are imported first so the evaluators/engine can
// reference them. Re-exported through ../server.js so the generated
// imports/workflows/server-loader.js can namespace-import it (Package registry).

// Shared libs (isomorphic)
import '../lib/pacio-measures.js';
import '../lib/toc-sections.js';
import '../lib/collections.js';

// Server measure pipeline
import './evaluators/pacio-data-connector.js';
import './evaluators/icare-evaluator.js';
import './evaluators/adi-acp-evaluator.js';
import './measure-calculator.js';
import './fqm-engine.js';
import './measure-bundle-methods.js';
import './vsac-methods.js';
import './methods.js';
import './startup.js';

console.log('[quality-measures] Server measure pipeline + methods registered');
