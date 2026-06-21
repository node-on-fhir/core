// packages/vital-signs/lib/valueSets/qualifiers/MeasurementLocations.js

/**
 * Measurement Locations Value Set
 * Based on FHIR Vital Signs IG
 * SNOMED CT codes for body sites used in vital sign measurements
 */

export const MeasurementLocations = {
  url: 'http://hl7.org/fhir/ValueSet/vital-sign-measurement-locations',
  version: '1.0.0',
  name: 'VitalSignMeasurementLocations',
  title: 'Vital Sign Measurement Locations',
  status: 'draft',
  experimental: false,
  date: '2024-01-01',
  publisher: 'Honeycomb3',
  description: 'Body sites for vital sign measurements',
  compose: {
    include: [{
      system: 'http://snomed.info/sct',
      concept: [
        // Blood pressure measurement sites
        {
          code: '368209003',
          display: 'Right arm'
        },
        {
          code: '368208006',
          display: 'Left arm'
        },
        {
          code: '69536005',
          display: 'Right thigh'
        },
        {
          code: '61396006',
          display: 'Left thigh'
        },
        {
          code: '7569003',
          display: 'Right ankle'
        },
        {
          code: '51636004',
          display: 'Left ankle'
        },
        {
          code: '368505008',
          display: 'Right wrist'
        },
        {
          code: '368504007',
          display: 'Left wrist'
        },
        // Temperature measurement sites
        {
          code: '42859004',
          display: 'Tympanic membrane'
        },
        {
          code: '123851003',
          display: 'Oral cavity'
        },
        {
          code: '34402009',
          display: 'Rectum'
        },
        {
          code: '91470000',
          display: 'Axilla'
        },
        {
          code: '52795006',
          display: 'Forehead'
        },
        {
          code: '265785006',
          display: 'Temporal region'
        },
        {
          code: '71836000',
          display: 'Nasopharynx'
        },
        {
          code: '181227005',
          display: 'Esophagus'
        },
        {
          code: '21082005',
          display: 'Urinary bladder'
        },
        {
          code: '39937001',
          display: 'Skin'
        },
        // Pulse oximetry sites
        {
          code: '7569003',
          display: 'Finger'
        },
        {
          code: '29707007',
          display: 'Toe'
        },
        {
          code: '117590005',
          display: 'Ear'
        },
        {
          code: '52795006',
          display: 'Forehead'
        },
        {
          code: '46862004',
          display: 'Nose'
        }
      ]
    }]
  }
};

// Helper function to get measurement location display
export function getMeasurementLocationDisplay(code) {
  const concept = MeasurementLocations.compose.include[0].concept.find(c => c.code === code);
  return concept ? concept.display : code;
}

// Export commonly used measurement location codes by category
export const MEASUREMENT_LOCATION_CODES = {
  // Blood pressure sites
  BP_SITES: {
    RIGHT_ARM: '368209003',
    LEFT_ARM: '368208006',
    RIGHT_THIGH: '69536005',
    LEFT_THIGH: '61396006',
    RIGHT_ANKLE: '7569003',
    LEFT_ANKLE: '51636004',
    RIGHT_WRIST: '368505008',
    LEFT_WRIST: '368504007'
  },
  // Temperature sites
  TEMP_SITES: {
    TYMPANIC: '42859004',
    ORAL: '123851003',
    RECTAL: '34402009',
    AXILLARY: '91470000',
    FOREHEAD: '52795006',
    TEMPORAL: '265785006',
    NASOPHARYNX: '71836000',
    ESOPHAGUS: '181227005',
    BLADDER: '21082005',
    SKIN: '39937001'
  },
  // Pulse oximetry sites
  PULSE_OX_SITES: {
    FINGER: '7569003',
    TOE: '29707007',
    EAR: '117590005',
    FOREHEAD: '52795006',
    NOSE: '46862004'
  }
};

// Helper function to get appropriate sites for a vital sign type
export function getSitesForVitalSign(vitalSignType) {
  switch (vitalSignType) {
    case 'blood-pressure':
      return Object.entries(MEASUREMENT_LOCATION_CODES.BP_SITES).map(([key, code]) => ({
        code,
        display: getMeasurementLocationDisplay(code)
      }));
    case 'body-temperature':
      return Object.entries(MEASUREMENT_LOCATION_CODES.TEMP_SITES).map(([key, code]) => ({
        code,
        display: getMeasurementLocationDisplay(code)
      }));
    case 'oxygen-saturation':
      return Object.entries(MEASUREMENT_LOCATION_CODES.PULSE_OX_SITES).map(([key, code]) => ({
        code,
        display: getMeasurementLocationDisplay(code)
      }));
    default:
      return [];
  }
}