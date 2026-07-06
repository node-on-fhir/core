// imports/ui/DICOM/utils/DicomFhirMapping.js
// DICOM to FHIR ImagingStudy Mapping Library
// Based on IHE Radiology Technical Framework - MADO Supplement
// Isomorphic: works on both client and server

// =============================================================================
// SECTION 1: DICOM TAG CONSTANTS
// =============================================================================

/**
 * DICOM Tag Dictionary
 * Based on IHE Radiology Technical Framework - MADO Supplement
 * Tags in lowercase hex format for dicom-parser compatibility
 */
export const DICOM_TAGS = {
  // === File Meta Information ===
  TransferSyntaxUID: 'x00020010',

  // === Patient Module ===
  PatientName: 'x00100010',
  PatientID: 'x00100020',
  PatientBirthDate: 'x00100030',
  PatientSex: 'x00100040',

  // === General Study Module ===
  StudyInstanceUID: 'x0020000d',
  StudyDate: 'x00080020',
  StudyTime: 'x00080030',
  ReferringPhysicianName: 'x00080090',
  StudyID: 'x00200010',
  AccessionNumber: 'x00080050',
  StudyDescription: 'x00081030',

  // === General Series Module ===
  SeriesInstanceUID: 'x0020000e',
  SeriesDate: 'x00080021',
  SeriesTime: 'x00080031',
  Modality: 'x00080060',
  SeriesDescription: 'x0008103e',
  SeriesNumber: 'x00200011',
  BodyPartExamined: 'x00180015',
  Laterality: 'x00200060',

  // === General Image Module / SOP Common ===
  SOPClassUID: 'x00080016',
  SOPInstanceUID: 'x00080018',
  InstanceNumber: 'x00200013',

  // === Image Pixel Module ===
  Rows: 'x00280010',
  Columns: 'x00280011',
  BitsAllocated: 'x00280100',
  NumberOfFrames: 'x00280008',

  // === VOI LUT Module ===
  WindowCenter: 'x00281050',
  WindowWidth: 'x00281051',

  // === Retrieval ===
  RetrieveAETitle: 'x00080054',
  RetrieveURL: 'x00081190',
  RetrieveURI: 'x0040e010',
  RetrieveLocationUID: 'x0040e011'
};

// =============================================================================
// SECTION 2: MODALITY CODE SYSTEM
// =============================================================================

/**
 * DICOM Modality to Display Name mapping
 * System: http://dicom.nema.org/resources/ontology/DCM
 */
export const MODALITY_DISPLAY = {
  'AR': 'Autorefraction',
  'AU': 'Audio',
  'BDUS': 'Bone Densitometry (Ultrasound)',
  'BI': 'Biomagnetic Imaging',
  'BMD': 'Bone Densitometry (X-Ray)',
  'CR': 'Computed Radiography',
  'CT': 'Computed Tomography',
  'DG': 'Diaphanography',
  'DOC': 'Document',
  'DX': 'Digital Radiography',
  'ECG': 'Electrocardiography',
  'EPS': 'Cardiac Electrophysiology',
  'ES': 'Endoscopy',
  'GM': 'General Microscopy',
  'HC': 'Hard Copy',
  'HD': 'Hemodynamic Waveform',
  'IO': 'Intra-Oral Radiography',
  'IVUS': 'Intravascular Ultrasound',
  'KO': 'Key Object Selection',
  'LS': 'Laser Surface Scan',
  'MG': 'Mammography',
  'MR': 'Magnetic Resonance',
  'NM': 'Nuclear Medicine',
  'OAM': 'Ophthalmic Axial Measurements',
  'OCT': 'Optical Coherence Tomography',
  'OP': 'Ophthalmic Photography',
  'OPM': 'Ophthalmic Mapping',
  'OPT': 'Ophthalmic Tomography',
  'OPV': 'Ophthalmic Visual Field',
  'OT': 'Other',
  'PR': 'Presentation State',
  'PT': 'Positron Emission Tomography',
  'PX': 'Panoramic X-Ray',
  'REG': 'Registration',
  'RF': 'Radio Fluoroscopy',
  'RG': 'Radiographic Imaging',
  'RTDOSE': 'Radiotherapy Dose',
  'RTIMAGE': 'Radiotherapy Image',
  'RTPLAN': 'Radiotherapy Plan',
  'RTRECORD': 'RT Treatment Record',
  'RTSTRUCT': 'Radiotherapy Structure Set',
  'SEG': 'Segmentation',
  'SM': 'Slide Microscopy',
  'SMR': 'Stereometric Relationship',
  'SR': 'Structured Report',
  'SRF': 'Subjective Refraction',
  'TG': 'Thermography',
  'US': 'Ultrasound',
  'VA': 'Visual Acuity',
  'XA': 'X-Ray Angiography',
  'XC': 'External-Camera Photography'
};

export const DICOM_MODALITY_SYSTEM = 'http://dicom.nema.org/resources/ontology/DCM';
export const DICOM_UID_SYSTEM = 'urn:dicom:uid';

// =============================================================================
// SECTION 3: UTILITY FUNCTIONS
// =============================================================================

/**
 * Format DICOM UID to FHIR OID format
 * @param {string} uid - Raw DICOM UID (e.g., "1.2.840.113619.2.1.1")
 * @returns {string} - FHIR formatted (e.g., "urn:oid:1.2.840.113619.2.1.1")
 */
export function formatUidForFhir(uid) {
  if (!uid) return null;
  const cleanUid = uid.trim();
  if (cleanUid.startsWith('urn:oid:')) return cleanUid;
  return `urn:oid:${cleanUid}`;
}

/**
 * Convert DICOM date (YYYYMMDD) and time (HHMMSS.ffffff) to ISO 8601
 * @param {string} dicomDate - DICOM date format YYYYMMDD
 * @param {string} dicomTime - DICOM time format HHMMSS.ffffff (optional)
 * @returns {string} - ISO 8601 datetime (e.g., "2024-01-15T10:30:00")
 */
export function formatDicomDateTime(dicomDate, dicomTime) {
  if (!dicomDate || dicomDate.length < 8) return null;

  const year = dicomDate.substring(0, 4);
  const month = dicomDate.substring(4, 6);
  const day = dicomDate.substring(6, 8);

  let isoString = `${year}-${month}-${day}`;

  if (dicomTime && dicomTime.length >= 6) {
    const hours = dicomTime.substring(0, 2);
    const minutes = dicomTime.substring(2, 4);
    const seconds = dicomTime.substring(4, 6);
    isoString += `T${hours}:${minutes}:${seconds}`;
  }

  return isoString;
}

/**
 * Parse DICOM Person Name (PN) format
 * Format: FamilyName^GivenName^MiddleName^Prefix^Suffix
 * @param {string} dicomName - DICOM PN format string
 * @returns {Object} - { family, given, prefix, suffix, text }
 */
export function parseDicomPersonName(dicomName) {
  if (!dicomName) return null;

  const parts = dicomName.split('^');
  return {
    family: parts[0] || '',
    given: parts[1] || '',
    middle: parts[2] || '',
    prefix: parts[3] || '',
    suffix: parts[4] || '',
    text: parts.filter(p => p).join(' ')
  };
}

/**
 * Map DICOM sex code to FHIR gender
 * @param {string} dicomSex - 'M', 'F', 'O', or empty
 * @returns {string} - FHIR gender code
 */
export function mapDicomSexToFhirGender(dicomSex) {
  const mapping = {
    'M': 'male',
    'F': 'female',
    'O': 'other'
  };
  return mapping[dicomSex] || 'unknown';
}

/**
 * Map DICOM sex code to US Core birthsex extension code
 * @param {string} dicomSex - 'M', 'F', 'O', or empty
 * @returns {string} - US Core birthsex code (M, F, UNK)
 */
export function mapDicomSexToBirthSex(dicomSex) {
  const mapping = {
    'M': 'M',
    'F': 'F',
    'O': 'UNK'
  };
  return mapping[dicomSex] || 'UNK';
}

/**
 * Build US Core birthsex extension
 * @param {string} dicomSex - DICOM PatientSex value
 * @returns {Object} - FHIR Extension for birthsex
 */
export function buildBirthSexExtension(dicomSex) {
  if (!dicomSex) return null;

  return {
    url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex',
    valueCode: mapDicomSexToBirthSex(dicomSex)
  };
}

/**
 * Build US Core sex extension (sex for clinical use)
 * @param {string} dicomSex - DICOM PatientSex value
 * @returns {Object} - FHIR Extension for sex
 */
export function buildSexExtension(dicomSex) {
  if (!dicomSex) return null;

  // Maps to sex-for-clinical-use when more granular than administrative gender
  const sexMapping = {
    'M': 'male-typical',
    'F': 'female-typical',
    'O': 'specified'
  };

  return {
    url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-sex',
    valueCodeableConcept: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/sex-for-clinical-use',
        code: sexMapping[dicomSex] || 'unknown',
        display: sexMapping[dicomSex] || 'Unknown'
      }]
    }
  };
}

/**
 * Build FHIR CodeableConcept for modality
 * @param {string} modalityCode - DICOM modality code (e.g., 'CT', 'MR')
 * @returns {Object} - FHIR Coding object
 */
export function buildModalityCoding(modalityCode) {
  if (!modalityCode) return null;

  return {
    system: DICOM_MODALITY_SYSTEM,
    code: modalityCode,
    display: MODALITY_DISPLAY[modalityCode] || modalityCode
  };
}

// =============================================================================
// SECTION 4: DICOM EXTRACTION FUNCTIONS
// =============================================================================

/**
 * Extract patient demographics from DICOM dataset
 * Includes US Core extensions for birthsex and sex-for-clinical-use
 * @param {Object} dataSet - Parsed dicom-parser dataset
 * @returns {Object} - Patient demographic data with extensions
 */
export function extractPatientFromDicom(dataSet) {
  const getString = (tag) => {
    try { return dataSet.string(DICOM_TAGS[tag]) || null; }
    catch (e) { return null; }
  };

  const name = parseDicomPersonName(getString('PatientName'));
  const dicomSex = getString('PatientSex');

  // Build extensions array
  const extensions = [];
  const birthSexExt = buildBirthSexExtension(dicomSex);
  const sexExt = buildSexExtension(dicomSex);

  if (birthSexExt) extensions.push(birthSexExt);
  if (sexExt) extensions.push(sexExt);

  return {
    patientId: getString('PatientID'),
    name: name,
    birthDate: formatDicomDateTime(getString('PatientBirthDate')),
    gender: mapDicomSexToFhirGender(dicomSex),
    // Raw DICOM sex code (M, F, O)
    dicomSex: dicomSex,
    // US Core extensions
    extension: extensions.length > 0 ? extensions : undefined
  };
}

/**
 * Extract study-level data from DICOM dataset
 * Maps to FHIR ImagingStudy root level fields
 * @param {Object} dataSet - Parsed dicom-parser dataset
 * @returns {Object} - Study-level data
 */
export function extractStudyFromDicom(dataSet) {
  const getString = (tag) => {
    try { return dataSet.string(DICOM_TAGS[tag]) || null; }
    catch (e) { return null; }
  };

  return {
    studyInstanceUid: getString('StudyInstanceUID'),
    studyDate: getString('StudyDate'),
    studyTime: getString('StudyTime'),
    started: formatDicomDateTime(getString('StudyDate'), getString('StudyTime')),
    studyId: getString('StudyID'),
    accessionNumber: getString('AccessionNumber'),
    description: getString('StudyDescription'),
    referringPhysician: parseDicomPersonName(getString('ReferringPhysicianName'))
  };
}

/**
 * Extract series-level data from DICOM dataset
 * Maps to FHIR ImagingStudy.series[]
 * @param {Object} dataSet - Parsed dicom-parser dataset
 * @returns {Object} - Series-level data
 */
export function extractSeriesFromDicom(dataSet) {
  const getString = (tag) => {
    try { return dataSet.string(DICOM_TAGS[tag]) || null; }
    catch (e) { return null; }
  };
  const getNumber = (tag) => {
    try { return dataSet.uint16(DICOM_TAGS[tag]) || null; }
    catch (e) { return null; }
  };

  return {
    seriesInstanceUid: getString('SeriesInstanceUID'),
    seriesDate: getString('SeriesDate'),
    seriesTime: getString('SeriesTime'),
    started: formatDicomDateTime(getString('SeriesDate'), getString('SeriesTime')),
    modality: getString('Modality'),
    description: getString('SeriesDescription'),
    number: getNumber('SeriesNumber'),
    bodyPartExamined: getString('BodyPartExamined'),
    laterality: getString('Laterality')
  };
}

/**
 * Extract instance-level data from DICOM dataset
 * Maps to FHIR ImagingStudy.series.instance[]
 * @param {Object} dataSet - Parsed dicom-parser dataset
 * @returns {Object} - Instance-level data
 */
export function extractInstanceFromDicom(dataSet) {
  const getString = (tag) => {
    try { return dataSet.string(DICOM_TAGS[tag]) || null; }
    catch (e) { return null; }
  };
  const getNumber = (tag) => {
    try { return dataSet.uint16(DICOM_TAGS[tag]) || null; }
    catch (e) { return null; }
  };

  return {
    sopClassUid: getString('SOPClassUID'),
    sopInstanceUid: getString('SOPInstanceUID'),
    number: getNumber('InstanceNumber'),
    numberOfFrames: getNumber('NumberOfFrames'),
    rows: getNumber('Rows'),
    columns: getNumber('Columns')
  };
}

/**
 * Extract all metadata from a single DICOM file
 * Combines patient, study, series, and instance data
 * @param {Object} dataSet - Parsed dicom-parser dataset
 * @returns {Object} - Complete DICOM metadata
 */
export function extractAllDicomMetadata(dataSet) {
  return {
    patient: extractPatientFromDicom(dataSet),
    study: extractStudyFromDicom(dataSet),
    series: extractSeriesFromDicom(dataSet),
    instance: extractInstanceFromDicom(dataSet)
  };
}

// =============================================================================
// SECTION 5 (RETIRED): FHIR RESOURCE BUILDERS
// =============================================================================
// The DICOM -> FHIR resource builders (ImagingStudy/Patient construction,
// multi-file aggregation, GridFS metadata) moved into the dcmjs library as
// the FHIR sink: dcmjs.fhir (@dcmjs/fhir in libraries/dcmjs). Consume
// dcmjs.fhir.toFhir / toBundle / imagingStudyFromDatasets /
// patientFromDataset instead. The extractors above remain as the
// dicom-parser fallback pipeline (DcmjsMetadata.js) and for the tables
// that still parse with dicom-parser directly.
