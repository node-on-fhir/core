// packages/data-importer/lib/resourceSummary.js
//
// Shared utility functions for FHIR resource display:
// emoji icons, human-readable summaries, and alert severity mapping.

import { get } from 'lodash';

/**
 * Get emoji icon for FHIR resource type
 * @param {string} resourceType - FHIR resource type
 * @returns {string} Emoji representing the resource
 */
export function getResourceEmoji(resourceType) {
  var emojiMap = {
    'Patient': '\u{1F464}',
    'Observation': '\u{1F52C}',
    'Condition': '\u{1F3E5}',
    'Procedure': '\u2695\uFE0F',
    'Encounter': '\u{1F3E8}',
    'MedicationRequest': '\u{1F48A}',
    'AllergyIntolerance': '\u26A0\uFE0F',
    'Immunization': '\u{1F489}',
    'CarePlan': '\u{1F4CB}',
    'Goal': '\u{1F3AF}',
    'DiagnosticReport': '\u{1F4CA}',
    'DocumentReference': '\u{1F4C4}',
    'Organization': '\u{1F3E2}',
    'Practitioner': '\u{1F9D1}\u200D\u2695\uFE0F',
    'Medication': '\u{1F48A}',
    'OperationOutcome': '\u{1F6A8}',
    'Bundle': '\u{1F4E6}'
  };
  return emojiMap[resourceType] || '\u{1F4CC}';
}

/**
 * Get display summary from a FHIR resource.
 * Tries: Patient name, code.text, code.coding display, summary field, or truncated id.
 * @param {Object} resource - FHIR resource object
 * @returns {string} Human-readable summary text
 */
export function getResourceSummary(resource) {
  if (!resource) return '';

  var resourceType = get(resource, 'resourceType', '');

  // Patient: show name
  if (resourceType === 'Patient') {
    var given = get(resource, 'name.0.given.0', '');
    var family = get(resource, 'name.0.family', '');
    if (given || family) {
      return ((given + ' ' + family).trim());
    }
  }

  // Resources with code (Observation, Condition, Procedure, etc.)
  var codeText = get(resource, 'code.text', '');
  if (codeText) {
    return codeText.length > 40 ? codeText.substring(0, 37) + '...' : codeText;
  }

  var codingDisplay = get(resource, 'code.coding.0.display', '');
  if (codingDisplay) {
    return codingDisplay.length > 40 ? codingDisplay.substring(0, 37) + '...' : codingDisplay;
  }

  // Server-populated summary field
  if (resource.summary) {
    return resource.summary.length > 40 ? resource.summary.substring(0, 37) + '...' : resource.summary;
  }

  // Fallback to truncated id
  var id = get(resource, 'id', '');
  if (id) {
    return id.length > 12 ? id.substring(0, 12) + '...' : id;
  }

  return '';
}

/**
 * Get MUI Alert severity for a FHIR resource type.
 * @param {string} resourceType - FHIR resource type
 * @returns {'success'|'warning'|'error'|'info'} Alert severity
 */
export function getResourceAlertSeverity(resourceType) {
  switch (resourceType) {
    case 'Patient':
      return 'success';
    case 'AllergyIntolerance':
      return 'warning';
    case 'OperationOutcome':
      return 'error';
    default:
      return 'info';
  }
}
