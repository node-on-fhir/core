// packages/vital-signs/lib/valueSets/qualifiers/CuffSizes.js

/**
 * Blood Pressure Cuff Sizes Value Set
 * Based on FHIR Vital Signs IG
 * SNOMED CT codes for blood pressure cuff sizes
 */

export const CuffSizes = {
  url: 'http://hl7.org/fhir/ValueSet/blood-pressure-cuff-sizes',
  version: '1.0.0',
  name: 'BloodPressureCuffSizes',
  title: 'Blood Pressure Cuff Sizes',
  status: 'draft',
  experimental: false,
  date: '2024-01-01',
  publisher: 'Honeycomb3',
  description: 'Blood pressure cuff sizes for accurate measurement',
  compose: {
    include: [{
      system: 'http://snomed.info/sct',
      concept: [
        {
          code: '397139002',
          display: 'Pediatric blood pressure cuff'
        },
        {
          code: '720736009',
          display: 'Infant blood pressure cuff'
        },
        {
          code: '720737000',
          display: 'Neonatal blood pressure cuff'
        },
        {
          code: '720740000',
          display: 'Adult small blood pressure cuff'
        },
        {
          code: '255507004',
          display: 'Small adult blood pressure cuff'
        },
        {
          code: '255509001',
          display: 'Standard adult blood pressure cuff'
        },
        {
          code: '255506008',
          display: 'Large adult blood pressure cuff'
        },
        {
          code: '720738005',
          display: 'Adult thigh blood pressure cuff'
        },
        {
          code: '840614008',
          display: 'Extra large adult blood pressure cuff'
        },
        {
          code: '840615009',
          display: 'Bariatric blood pressure cuff'
        }
      ]
    }]
  }
};

// Helper function to get cuff size display
export function getCuffSizeDisplay(code) {
  const concept = CuffSizes.compose.include[0].concept.find(c => c.code === code);
  return concept ? concept.display : code;
}

// Export commonly used cuff size codes
export const CUFF_SIZE_CODES = {
  PEDIATRIC: '397139002',
  INFANT: '720736009',
  NEONATAL: '720737000',
  ADULT_SMALL: '720740000',
  SMALL_ADULT: '255507004',
  STANDARD_ADULT: '255509001',
  LARGE_ADULT: '255506008',
  ADULT_THIGH: '720738005',
  EXTRA_LARGE_ADULT: '840614008',
  BARIATRIC: '840615009'
};

// Helper function to recommend cuff size based on arm circumference (in cm)
export function recommendCuffSize(armCircumference) {
  if (!armCircumference || armCircumference <= 0) {
    return null;
  }
  
  if (armCircumference < 10) {
    return { code: CUFF_SIZE_CODES.NEONATAL, display: 'Neonatal blood pressure cuff' };
  } else if (armCircumference < 16) {
    return { code: CUFF_SIZE_CODES.INFANT, display: 'Infant blood pressure cuff' };
  } else if (armCircumference < 22) {
    return { code: CUFF_SIZE_CODES.PEDIATRIC, display: 'Pediatric blood pressure cuff' };
  } else if (armCircumference < 26) {
    return { code: CUFF_SIZE_CODES.ADULT_SMALL, display: 'Adult small blood pressure cuff' };
  } else if (armCircumference < 34) {
    return { code: CUFF_SIZE_CODES.STANDARD_ADULT, display: 'Standard adult blood pressure cuff' };
  } else if (armCircumference < 44) {
    return { code: CUFF_SIZE_CODES.LARGE_ADULT, display: 'Large adult blood pressure cuff' };
  } else if (armCircumference < 52) {
    return { code: CUFF_SIZE_CODES.ADULT_THIGH, display: 'Adult thigh blood pressure cuff' };
  } else {
    return { code: CUFF_SIZE_CODES.BARIATRIC, display: 'Bariatric blood pressure cuff' };
  }
}