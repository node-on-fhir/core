// packages/vital-signs/lib/valueSets/devices/ThermometerTypes.js

/**
 * Thermometer Types Value Set
 * Based on FHIR Vital Signs IG
 * SNOMED CT codes for temperature measurement devices
 */

export const ThermometerTypes = {
  url: 'http://hl7.org/fhir/ValueSet/thermometer-types',
  version: '1.0.0',
  name: 'ThermometerTypes',
  title: 'Thermometer Types',
  status: 'draft',
  experimental: false,
  date: '2024-01-01',
  publisher: 'Honeycomb3',
  description: 'Types of thermometers used for temperature measurement',
  compose: {
    include: [{
      system: 'http://snomed.info/sct',
      concept: [
        {
          code: '467862003',
          display: 'Tympanic thermometer'
        },
        {
          code: '448735006',
          display: 'Digital thermometer'
        },
        {
          code: '462635008',
          display: 'Mercury thermometer'
        },
        {
          code: '706158002',
          display: 'Infrared thermometer'
        },
        {
          code: '840617001',
          display: 'Non-contact infrared thermometer'
        },
        {
          code: '706159005',
          display: 'Temporal artery thermometer'
        },
        {
          code: '713177003',
          display: 'Axillary thermometer'
        },
        {
          code: '713178008',
          display: 'Rectal thermometer'
        },
        {
          code: '713179000',
          display: 'Oral thermometer'
        },
        {
          code: '840618006',
          display: 'Disposable thermometer'
        },
        {
          code: '472121005',
          display: 'Electronic thermometer'
        },
        {
          code: '840619003',
          display: 'Chemical dot thermometer'
        }
      ]
    }]
  }
};

// Helper function to get thermometer type display
export function getThermometerTypeDisplay(code) {
  const concept = ThermometerTypes.compose.include[0].concept.find(c => c.code === code);
  return concept ? concept.display : code;
}

// Export commonly used thermometer type codes
export const THERMOMETER_CODES = {
  TYMPANIC: '467862003',
  DIGITAL: '448735006',
  MERCURY: '462635008',
  INFRARED: '706158002',
  NON_CONTACT_INFRARED: '840617001',
  TEMPORAL_ARTERY: '706159005',
  AXILLARY: '713177003',
  RECTAL: '713178008',
  ORAL: '713179000',
  DISPOSABLE: '840618006',
  ELECTRONIC: '472121005',
  CHEMICAL_DOT: '840619003'
};