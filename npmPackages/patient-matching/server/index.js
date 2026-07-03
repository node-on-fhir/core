// /packages/patient-matching/server/index.js

// Import main namespace
import '../lib/PatientMatching.js';

// Import schemas (shared between client and server)
import '../lib/schemas/IdiPatient.js';
import '../lib/schemas/IdiMatchBundle.js';
import '../lib/schemas/IdiMatchParameters.js';
import '../lib/schemas/DigitalIdentifier.js';

// Import constants (shared between client and server)
import '../lib/constants/identityLevels.js';
import '../lib/constants/matchWeights.js';
import '../lib/constants/identifierTypes.js';

// Import utilities (shared between client and server)
import '../lib/utils/matchingAlgorithm.js';
import '../lib/utils/identityValidation.js';
import '../lib/utils/digitalIdGenerator.js';

// Import methods (shared between client and server)
import '../lib/methods/idiMatch.js';
import '../lib/methods/verifyIdentity.js';
import '../lib/methods/calculateMatchScore.js';
import './methods/listPatients.js';

// Import server-specific modules
import './startup/index.js';
import './startup/registerOperations.js';
import './rest/idiMatchEndpoint.js';
import './fhir/IdiPatient.js';
import './fhir/IdiMatchOperation.js';
import './security/aal2Authentication.js';
import './security/auditLogging.js';
import './publications/patients.js';

// Server initialization
Meteor.startup(function(){
  console.log('PatientMatching package initialized on server'); // phi-audit: ok
});