// packages/vital-signs/lib/valueSets/qualifiers/BodyPositions.js

/**
 * Body Positions Value Set
 * Based on FHIR Vital Signs IG
 * SNOMED CT codes for body positions during vital sign measurement
 */

export const BodyPositions = {
  url: 'http://hl7.org/fhir/ValueSet/body-positions',
  version: '1.0.0',
  name: 'BodyPositions',
  title: 'Body Positions',
  status: 'draft',
  experimental: false,
  date: '2024-01-01',
  publisher: 'Honeycomb3',
  description: 'Body positions during vital sign measurement',
  compose: {
    include: [{
      system: 'http://snomed.info/sct',
      concept: [
        {
          code: '33586001',
          display: 'Sitting position'
        },
        {
          code: '30212006',
          display: 'Fowler\'s position'
        },
        {
          code: '426408003',
          display: 'Semi-Fowler\'s position'
        },
        {
          code: '10904000',
          display: 'Standing position'
        },
        {
          code: '102538003',
          display: 'Recumbent position'
        },
        {
          code: '102536004',
          display: 'Left lateral recumbent position'
        },
        {
          code: '102535000',
          display: 'Right lateral recumbent position'
        },
        {
          code: '1240000',
          display: 'Prone position'
        },
        {
          code: '40199007',
          display: 'Supine position'
        },
        {
          code: '414585002',
          display: 'Left lateral tilt'
        },
        {
          code: '415346000',
          display: 'Right lateral tilt'
        },
        {
          code: '34106002',
          display: 'Trendelenburg position'
        },
        {
          code: '423413008',
          display: 'Reverse Trendelenburg position'
        }
      ]
    }]
  }
};

// Helper function to get body position display
export function getBodyPositionDisplay(code) {
  const concept = BodyPositions.compose.include[0].concept.find(c => c.code === code);
  return concept ? concept.display : code;
}

// Export commonly used body position codes
export const BODY_POSITION_CODES = {
  SITTING: '33586001',
  FOWLERS: '30212006',
  SEMI_FOWLERS: '426408003',
  STANDING: '10904000',
  RECUMBENT: '102538003',
  LEFT_LATERAL_RECUMBENT: '102536004',
  RIGHT_LATERAL_RECUMBENT: '102535000',
  PRONE: '1240000',
  SUPINE: '40199007',
  LEFT_LATERAL_TILT: '414585002',
  RIGHT_LATERAL_TILT: '415346000',
  TRENDELENBURG: '34106002',
  REVERSE_TRENDELENBURG: '423413008'
};