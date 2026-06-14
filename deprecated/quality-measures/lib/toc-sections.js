// packages/quality-measures/lib/toc-sections.js
//
// The 15 required ToC Composition sections (all 1..1 MS in the profile),
// used by the I-CARE evaluator (server) and PacioMeasureDetail (client).
//
// Keep in sync with packages/pacio-core/lib/constants/TocConstants.js
// sections[] (duplicated deliberately — no cross-package api.use coupling).
// Verified 2026-06-11 against the ToC IG CI source
// (github.com/HL7/fhir-transitions-of-care-ig, input/fsh/TOCComposition.fsh).

export const REQUIRED_TOC_SECTIONS = [
  { code: '42348-3', display: 'Advance Directives' },
  { code: '48765-2', display: 'Allergies and Adverse Reactions' },
  { code: 'behavioral_health_summary', display: 'Behavioral Health' },
  { code: '47420-5', display: 'Functional Status' },
  { code: '11369-6', display: 'Immunizations' },
  { code: '69730-0', display: 'Discharge Instructions' },
  { code: '46264-8', display: 'Medical Devices' },
  { code: '10160-0', display: 'Medications' },
  { code: '18776-5', display: 'Discharge Care Plan' },
  { code: '11450-4', display: 'Problems' },
  { code: '47519-4', display: 'Procedures' },
  { code: '42349-1', display: 'Reason for Transfer' },
  { code: '30954-2', display: 'Clinical Results' },
  { code: '29762-2', display: 'Social History' },
  { code: '8716-3', display: 'Vital Signs' }
];

export const REQUIRED_TOC_SECTION_CODES = REQUIRED_TOC_SECTIONS.map(function(section) {
  return section.code;
});
