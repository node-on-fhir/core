// packages/patient-matching/lib/constants/identifierTypes.js

/**
 * Identifier types from the FHIR Identity Matching IG
 */

export const IDENTIFIER_SYSTEMS = {
  // State-issued ID
  STID: {
    system: 'urn:oid:2.16.840.1.113883.4.3.{state}',
    code: 'STID',
    display: 'State Issued ID',
    description: 'Driver\'s license or state-issued identification'
  },
  
  // SSN Last 4
  SSN4: {
    system: 'urn:oid:2.16.840.1.113883.4.1',
    code: 'SSN4',
    display: 'SSN Last 4',
    description: 'Last four digits of Social Security Number',
    sensitive: true
  },
  
  // Digital Identifier
  DIGITAL_ID: {
    system: 'urn:ietf:rfc:3986',
    code: 'DI',
    display: 'Digital Identifier',
    description: 'UUID v4 digital identifier',
    format: 'uuid-v4'
  },
  
  // Insurance Member ID
  MEMBER_ID: {
    system: 'http://hl7.org/fhir/sid/us-insurance',
    code: 'MB',
    display: 'Member ID',
    description: 'Insurance plan member identifier'
  },
  
  // Medical Record Number
  MRN: {
    system: 'http://hl7.org/fhir/sid/us-mrn',
    code: 'MR',
    display: 'Medical Record Number',
    description: 'Organization-specific medical record number'
  }
};

// State codes for driver's license systems
export const STATE_CODES = {
  'AL': '01', 'AK': '02', 'AZ': '04', 'AR': '05', 'CA': '06',
  'CO': '08', 'CT': '09', 'DE': '10', 'DC': '11', 'FL': '12',
  'GA': '13', 'HI': '15', 'ID': '16', 'IL': '17', 'IN': '18',
  'IA': '19', 'KS': '20', 'KY': '21', 'LA': '22', 'ME': '23',
  'MD': '24', 'MA': '25', 'MI': '26', 'MN': '27', 'MS': '28',
  'MO': '29', 'MT': '30', 'NE': '31', 'NV': '32', 'NH': '33',
  'NJ': '34', 'NM': '35', 'NY': '36', 'NC': '37', 'ND': '38',
  'OH': '39', 'OK': '40', 'OR': '41', 'PA': '42', 'RI': '44',
  'SC': '45', 'SD': '46', 'TN': '47', 'TX': '48', 'UT': '49',
  'VT': '50', 'VA': '51', 'WA': '53', 'WV': '54', 'WI': '55',
  'WY': '56'
};

// Naming system for the IG
export const NAMING_SYSTEM = {
  url: 'http://fhir.org/guides/idi',
  name: 'InteroperableDigitalIdentity',
  title: 'Interoperable Digital Identity and Patient Matching'
};