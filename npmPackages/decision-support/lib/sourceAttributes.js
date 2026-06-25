// npmPackages/decision-support/lib/sourceAttributes.js
//
// Source-attribute usage policy for evidence-based DSIs
// (§ 170.315(b)(11)(iv)(A)(5)-(13)). The rule only requires the module to
// *indicate when* these demographic / SDOH categories are USED by an
// intervention, and which are appropriate is region-dependent. So the package
// supports all of them but lets a deployment toggle which are ALLOWED via
// Meteor.settings.private.decisionSupport.sourceAttributes.* (see the
// ServerConfigs toggle UI). Per-DSI we record which allowed categories are used.

// The nine toggle-able demographic / SDOH source-attribute categories.
export const SOURCE_ATTRIBUTE_KEYS = [
  'race',
  'ethnicity',
  'language',
  'sexualOrientation',
  'genderIdentity',
  'sex',
  'dateOfBirth',
  'sdoh',
  'healthStatus'
];

export const SOURCE_ATTRIBUTE_LABELS = {
  race: 'Race',
  ethnicity: 'Ethnicity',
  language: 'Language',
  sexualOrientation: 'Sexual orientation',
  genderIdentity: 'Gender identity',
  sex: 'Sex',
  dateOfBirth: 'Date of birth',
  sdoh: 'Social determinants of health',
  healthStatus: 'Health status assessments'
};

// Default-deny: nothing is allowed until a deployment opts in (region-dependent).
export function defaultSourceAttributePolicy() {
  const policy = {};
  SOURCE_ATTRIBUTE_KEYS.forEach(function(key) { policy[key] = false; });
  return policy;
}

// USCDI data categories an evidence-based DSI may be based on — § (iii)(A)(1)-(8).
export const DSI_DATA_CATEGORIES = [
  'Problems',
  'Medications',
  'AllergiesIntolerances',
  'Demographics',
  'Laboratory',
  'VitalSigns',
  'UDI',
  'Procedures'
];

// Extension + criteria URLs used on the PlanDefinition.
export const DSI_SOURCE_ATTR_EXTENSION_URL =
  'http://node-on-fhir.org/fhir/StructureDefinition/dsi-source-attributes';
export const DSI_CRITERIA_EXPRESSION_LANGUAGE = 'application/json';
