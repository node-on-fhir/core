# Patient Matching Package Structure

```
packages/patient-matching/
├── package.js                    # Atmosphere package definition
├── README.md                     # Package documentation
├── LICENSE                       # MIT license
├── STRUCTURE.md                  # This file - directory layout
│
├── lib/                         # Isomorphic code (client & server)
│   ├── PatientMatching.js       # Main namespace
│   ├── schemas/
│   │   ├── IdiPatient.js        # Schema for IDI Patient profiles (L0, L1, L2)
│   │   ├── IdiMatchBundle.js    # Schema for match operation response bundles
│   │   ├── IdiMatchParameters.js # Input/output parameters for $IDI-match
│   │   └── DigitalIdentifier.js  # Schema for UUID v4 digital identifiers
│   │
│   ├── methods/
│   │   ├── idiMatch.js          # Validated method for $IDI-match operation
│   │   ├── verifyIdentity.js    # Identity verification methods (IAL levels)
│   │   └── calculateMatchScore.js # Weighted scoring algorithm
│   │
│   ├── constants/
│   │   ├── identityLevels.js    # ✓ IDIAL1, IDIAL1.5, IDIAL1.8, IDIAL2 definitions
│   │   ├── matchWeights.js      # ✓ Attribute weights for matching algorithm
│   │   └── identifierTypes.js   # ✓ STID, SSN4, and other identifier codes
│   │
│   └── utils/
│       ├── matchingAlgorithm.js  # Core patient matching logic
│       ├── identityValidation.js # Identity assurance validation
│       └── digitalIdGenerator.js # UUID v4 generator for digital IDs
│
├── server/                      # Server-only code
│   ├── rest/
│   │   └── idiMatchEndpoint.js  # REST endpoint for $IDI-match operation
│   │
│   ├── fhir/
│   │   ├── IdiPatient.js        # FHIR Patient profile handlers
│   │   └── IdiMatchOperation.js # $IDI-match operation implementation
│   │
│   ├── security/
│   │   ├── aal2Authentication.js # AAL2+ authentication enforcement
│   │   └── auditLogging.js      # Match operation audit logging
│   │
│   └── startup/
│       ├── index.js             # Server initialization
│       └── registerOperations.js # Register FHIR operations
│
├── client/                      # Client-only code
│   ├── components/
│   │   ├── PatientMatcher/
│   │   │   ├── PatientMatcher.jsx         # Main matching interface
│   │   │   ├── MatchResults.jsx           # Display match results
│   │   │   └── MatchConfidenceIndicator.jsx # Visual confidence score
│   │   │
│   │   ├── IdentityVerification/
│   │   │   ├── IdentityLevelSelector.jsx  # Choose IAL level
│   │   │   ├── IdentityProofing.jsx       # Identity proofing workflow
│   │   │   └── DigitalIdDisplay.jsx       # Show digital identifier
│   │   │
│   │   └── MatchConfiguration/
│   │       ├── WeightConfiguration.jsx     # Configure match weights
│   │       └── ConsumerMatchToggle.jsx     # B2B vs consumer matching
│   │
│   ├── hooks/
│   │   ├── usePatientMatch.js   # React hook for matching operations
│   │   └── useIdentityLevel.js  # Hook for identity assurance
│   │
│   └── pages/
│       ├── PatientMatchingPage.jsx    # Main UI page
│       └── IdentityAssurancePage.jsx  # Identity verification page
│
├── tests/
│   ├── unit/
│   │   ├── matchingAlgorithm.tests.js
│   │   ├── identityValidation.tests.js
│   │   └── schemas.tests.js
│   │
│   ├── integration/
│   │   ├── idiMatchOperation.tests.js
│   │   └── identityWorkflow.tests.js
│   │
│   └── fixtures/
│       ├── patients/             # Test patient data at different IDI levels
│       └── matchScenarios/       # Various matching test cases
│
├── public/                      # Public assets
│   └── images/
│       └── identity-levels.png   # Visual guide for IAL levels
│
└── examples/                    # Example implementations
    ├── basicMatching.js         # Simple patient matching example
    ├── consumerMatching.js      # Consumer-facing matching example
    └── b2bMatching.js           # B2B matching with user auth

## Status Key:
✓ = Created
[blank] = Placeholder/To be implemented
```