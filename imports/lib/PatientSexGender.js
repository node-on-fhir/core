// /Volumes/MobileDev/Code/honeycomb/imports/lib/PatientSexGender.js
//
// Single source of truth for Patient sex/gender/karyotype value sets, labels,
// and extraction. Isomorphic (no Meteor deps) so it can be unit-tested and used
// from client, server, and the DICOM mapper alike.
//
// Terminology stack this module owns (deliberately kept as FOUR independent
// concepts — a Patient may carry all of them without them agreeing):
//   - Patient.gender ............ administrative gender (FHIR normative, worldwide)
//   - us-core-birthsex .......... sex assigned at birth (valueCode M/F/UNK/ASKU)
//   - us-core-sex ............... Sex for Clinical Use / SFCU (USCDI v7 direction)
//   - patient-karyotype ......... genotype (custom extension, SNOMED CodeableConcept)
//
// Pluckers return { code, label, confirmed, inferredFrom } or null when there is
// nothing to show. `confirmed: false` means the value was EXTRAPOLATED from other
// data (not recorded) and must be surfaced as provisional and never written back.

import get from 'lodash/get.js';

// ---------------------------------------------------------------------------
// Extension URLs + code systems
// ---------------------------------------------------------------------------
export const US_CORE_BIRTHSEX_URL = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex';
export const US_CORE_SEX_URL      = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-sex';
export const PATIENT_KARYOTYPE_URL = 'http://hl7.org/fhir/StructureDefinition/patient-karyotype';

export const SNOMED_SYSTEM = 'http://snomed.info/sct';
export const SEX_FOR_CLINICAL_USE_SYSTEM = 'http://terminology.hl7.org/CodeSystem/sex-for-clinical-use';

// ---------------------------------------------------------------------------
// Value sets (with display labels)
// ---------------------------------------------------------------------------

// Patient.gender — FHIR administrative-gender
export const ADMINISTRATIVE_GENDER = [
  { value: 'male',    label: 'Male' },
  { value: 'female',  label: 'Female' },
  { value: 'other',   label: 'Other' },
  { value: 'unknown', label: 'Unknown' }
];

// us-core-birthsex valueCode
export const BIRTH_SEX_OPTIONS = [
  { value: 'M',    label: 'Male' },
  { value: 'F',    label: 'Female' },
  { value: 'UNK',  label: 'Unknown' },
  { value: 'ASKU', label: 'Choose Not to Disclose' }
];

// us-core-sex — Sex for Clinical Use (SFCU).
//
// VALUE-SET CHURN NOTICE: USCDI v7 (draft) restricts "Sex" to a TWO-code SNOMED
// value set (Female 248152002 / Male 248153007). That is expected to overcorrect
// — it recreates the intersex/undisclosed erasure the gender approach avoided —
// so a v8+ is likely to re-expand toward something neither ultra-restrictive nor
// ultra-permissive. This map is the single extension point for that churn: it
// tolerates the SFCU CodeSystem codes, the v7 SNOMED codes, and bare values, each
// resolving to a label. To adopt a future value set, add its codes here only.
export const SEX_FOR_CLINICAL_USE_OPTIONS = [
  { value: 'male-typical',   label: 'Male (typical)' },
  { value: 'female-typical', label: 'Female (typical)' },
  { value: 'specified',      label: 'Specified' },
  { value: 'unknown',        label: 'Unknown' }
];

// USCDI v7 restricted SNOMED value set — kept explicit for traceability.
export const USCDI_V7_SEX = {
  '248152002': 'Female',
  '248153007': 'Male'
};

// patient-karyotype — SNOMED valueCodeableConcept. Single source shared with the
// patient edit form (PatientFormView / PatientDetail).
export const KARYOTYPE_OPTIONS = [
  { value: '734002005', label: 'XX' },
  { value: '734003000', label: 'XY' },
  { value: '80427008',  label: 'X0 (Turner Syndrome)' },
  { value: '41979000',  label: 'XXY (Klinefelter Syndrome)' },
  { value: '20704005',  label: "XYY (Jacob's Syndrome)" },
  { value: '30699003',  label: 'XXX (Triple X Syndrome)' },
  { value: '261665006', label: 'Unknown' },
  { value: 'OTH',       label: 'Other' }
];

// Unambiguous karyotype inference from administrative gender (display-only, never
// persisted). Mirrors the Birth-Sex-from-Gender inference — a convenience default
// that the warning icon flags as provisional, not a clinical assertion.
export const KARYOTYPE_BY_GENDER = {
  female: '734002005', // XX (Typical Female)
  male:   '734003000'  // XY (Typical Male)
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function labelFor(options, code, fallback){
  if(!code){
    return fallback;
  }
  const match = options.find(function(option){ return option.value === code; });
  if(match){
    return match.label;
  }
  return (fallback !== undefined) ? fallback : code;
}

function findExtension(patient, url){
  const extensions = get(patient, 'extension', []);
  if(!Array.isArray(extensions)){
    return null;
  }
  return extensions.find(function(ext){ return get(ext, 'url') === url; }) || null;
}

// ---------------------------------------------------------------------------
// Pluckers
// ---------------------------------------------------------------------------

// Patient.gender → { code, label, confirmed: true } | null
export function pluckGender(patient){
  const code = get(patient, 'gender', '');
  if(!code){
    return null;
  }
  return { code: code, label: labelFor(ADMINISTRATIVE_GENDER, code, code), confirmed: true };
}

// us-core-birthsex → recorded value, else (opt-in) inferred from Patient.gender.
// Inference is marked `confirmed: false` + `inferredFrom: 'gender'` and must never
// be persisted back to the resource.
export function pluckBirthSex(patient, options){
  options = options || {};

  const ext = findExtension(patient, US_CORE_BIRTHSEX_URL);
  const code = get(ext, 'valueCode', '');
  if(code){
    return { code: code, label: labelFor(BIRTH_SEX_OPTIONS, code, code), confirmed: true };
  }

  if(options.inferFromGender){
    const gender = get(patient, 'gender', '');
    const inferred = { male: 'M', female: 'F' }[gender]; // only the unambiguous mappings
    if(inferred){
      return {
        code: inferred,
        label: labelFor(BIRTH_SEX_OPTIONS, inferred, inferred),
        confirmed: false,
        inferredFrom: 'gender'
      };
    }
  }

  return null;
}

// us-core-sex (SFCU) → { code, label, confirmed: true } | null. No inference.
export function pluckSexForClinicalUse(patient){
  const ext = findExtension(patient, US_CORE_SEX_URL);
  if(!ext){
    return null;
  }

  // Tolerate valueCodeableConcept (current writer) or a bare valueCode.
  let code = get(ext, 'valueCodeableConcept.coding.0.code', '');
  const display = get(ext, 'valueCodeableConcept.coding.0.display', '');
  if(!code){
    code = get(ext, 'valueCode', '');
  }
  if(!code){
    return null;
  }

  // Resolve a human label across the tolerated encodings (SFCU codes, v7 SNOMED).
  let label = labelFor(SEX_FOR_CLINICAL_USE_OPTIONS, code, null);
  if(!label){
    label = USCDI_V7_SEX[code] || display || code;
  }
  return { code: code, label: label, confirmed: true };
}

// patient-karyotype → recorded value, else (opt-in) inferred from Patient.gender.
// Inference is marked `confirmed: false` + `inferredFrom: 'gender'` and must never
// be persisted back to the resource.
export function pluckKaryotype(patient, options){
  options = options || {};

  const ext = findExtension(patient, PATIENT_KARYOTYPE_URL);
  const coding = ext ? get(ext, 'valueCodeableConcept.coding.0', null) : null;
  if(coding){
    const code = get(coding, 'code', '');
    const display = get(coding, 'display', '');
    if(code || display){
      return { code: code, label: display || labelFor(KARYOTYPE_OPTIONS, code, code), confirmed: true };
    }
  }

  if(options.inferFromGender){
    const gender = get(patient, 'gender', '');
    const inferred = KARYOTYPE_BY_GENDER[gender]; // only the unambiguous mappings
    if(inferred){
      return {
        code: inferred,
        label: labelFor(KARYOTYPE_OPTIONS, inferred, inferred),
        confirmed: false,
        inferredFrom: 'gender'
      };
    }
  }

  return null;
}
