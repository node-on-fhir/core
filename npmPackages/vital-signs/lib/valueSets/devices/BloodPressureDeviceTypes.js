// packages/vital-signs/lib/valueSets/devices/BloodPressureDeviceTypes.js

/**
 * Blood Pressure Device Types Value Set
 * Based on FHIR Vital Signs IG
 * SNOMED CT codes for blood pressure measurement devices
 */

export const BloodPressureDeviceTypes = {
  url: 'http://hl7.org/fhir/ValueSet/blood-pressure-device-types',
  version: '1.0.0',
  name: 'BloodPressureDeviceTypes',
  title: 'Blood Pressure Device Types',
  status: 'draft',
  experimental: false,
  date: '2024-01-01',
  publisher: 'Honeycomb3',
  description: 'Types of devices used for blood pressure measurement',
  compose: {
    include: [{
      system: 'http://snomed.info/sct',
      concept: [
        {
          code: '43770009',
          display: 'Doppler device'
        },
        {
          code: '258057004',
          display: 'Non-invasive blood pressure monitor'
        },
        {
          code: '445949006',
          display: 'Electronic sphygmomanometer'
        },
        {
          code: '464069000',
          display: 'Mercury sphygmomanometer'
        },
        {
          code: '462983003',
          display: 'Aneroid sphygmomanometer'
        },
        {
          code: '706172005',
          display: 'Automated blood pressure monitor'
        },
        {
          code: '720737000',
          display: 'Ambulatory blood pressure monitor'
        },
        {
          code: '840616009',
          display: 'Home blood pressure monitor'
        },
        {
          code: '309642005',
          display: 'Manual blood pressure monitor'
        }
      ]
    }]
  }
};

// Helper function to get device type display
export function getDeviceTypeDisplay(code) {
  const concept = BloodPressureDeviceTypes.compose.include[0].concept.find(c => c.code === code);
  return concept ? concept.display : code;
}

// Export commonly used device type codes
export const BP_DEVICE_CODES = {
  DOPPLER: '43770009',
  NON_INVASIVE_MONITOR: '258057004',
  ELECTRONIC_SPHYGMOMANOMETER: '445949006',
  MERCURY_SPHYGMOMANOMETER: '464069000',
  ANEROID_SPHYGMOMANOMETER: '462983003',
  AUTOMATED_MONITOR: '706172005',
  AMBULATORY_MONITOR: '720737000',
  HOME_MONITOR: '840616009',
  MANUAL_MONITOR: '309642005'
};