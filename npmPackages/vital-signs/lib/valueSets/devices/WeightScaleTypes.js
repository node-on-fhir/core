// packages/vital-signs/lib/valueSets/devices/WeightScaleTypes.js

/**
 * Weight Scale Types Value Set
 * Based on FHIR Vital Signs IG
 * SNOMED CT codes for weight measurement devices
 */

export const WeightScaleTypes = {
  url: 'http://hl7.org/fhir/ValueSet/weight-scale-types',
  version: '1.0.0',
  name: 'WeightScaleTypes',
  title: 'Weight Scale Types',
  status: 'draft',
  experimental: false,
  date: '2024-01-01',
  publisher: 'Honeycomb3',
  description: 'Types of scales used for weight measurement',
  compose: {
    include: [{
      system: 'http://snomed.info/sct',
      concept: [
        {
          code: '469204003',
          display: 'Floor scale'
        },
        {
          code: '58878001',
          display: 'Bed scale'
        },
        {
          code: '462370001',
          display: 'Chair scale'
        },
        {
          code: '701763005',
          display: 'Digital scale'
        },
        {
          code: '701764004',
          display: 'Mechanical scale'
        },
        {
          code: '469787007',
          display: 'Infant scale'
        },
        {
          code: '706229005',
          display: 'Standing scale'
        },
        {
          code: '706230000',
          display: 'Wheelchair scale'
        },
        {
          code: '840613002',
          display: 'Portable scale'
        },
        {
          code: '469199004',
          display: 'Beam balance scale'
        }
      ]
    }]
  }
};

// Helper function to get scale type display
export function getScaleTypeDisplay(code) {
  const concept = WeightScaleTypes.compose.include[0].concept.find(c => c.code === code);
  return concept ? concept.display : code;
}

// Export commonly used scale type codes
export const WEIGHT_SCALE_CODES = {
  FLOOR_SCALE: '469204003',
  BED_SCALE: '58878001',
  CHAIR_SCALE: '462370001',
  DIGITAL_SCALE: '701763005',
  MECHANICAL_SCALE: '701764004',
  INFANT_SCALE: '469787007',
  STANDING_SCALE: '706229005',
  WHEELCHAIR_SCALE: '706230000',
  PORTABLE_SCALE: '840613002',
  BEAM_BALANCE: '469199004'
};