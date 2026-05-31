// imports/lib/Anonymizer.js
//
// HIPAA Safe Harbor De-Identification Library
// Pure data transformation: arrays in, arrays out.
// No collections, no Session, no subscriptions.

import { get, set, cloneDeep, unset, merge } from 'lodash';
import { Random } from 'meteor/random';

// ============================================================================
// HIPAA Safe Harbor 18 Identifiers - Per-Resource PHI Field Map
// ============================================================================
//
// Categories reference the 18 Safe Harbor identifiers:
//  1. Names                      10. Account numbers
//  2. Geographic (< state)       11. Certificate/license numbers
//  3. Dates (except year)        12. Vehicle identifiers/serial numbers
//  4. Phone numbers              13. Device identifiers/serial numbers
//  5. Fax numbers                14. Web URLs
//  6. Email addresses            15. IP addresses
//  7. Social Security numbers    16. Biometric identifiers
//  8. Medical record numbers     17. Full-face photos
//  9. Health plan beneficiary #  18. Any other unique identifying number
//
// Actions:
//   'remove'    - unset the field entirely
//   'pixelate'  - reduce precision (dates→year, ZIP→3 digits, age 89+→90)
//   'scrub'     - inspect sub-fields selectively (e.g. name array)

const PHI_FIELD_MAP = {
  'Patient': {
    'name':       { category: [1],       label: 'Names',              action: 'remove' },
    'address':    { category: [2],       label: 'Geographic',         action: 'pixelate' },
    'birthDate':  { category: [3],       label: 'Dates',              action: 'pixelate' },
    'telecom':    { category: [4, 5, 6], label: 'Phone/Fax/Email',   action: 'remove' },
    'identifier': { category: [7, 8, 9, 10, 11, 18], label: 'SSN/MRN/IDs', action: 'remove' },
    'photo':      { category: [17],      label: 'Photos',             action: 'remove' },
    'contact':    { category: [1, 4, 6], label: 'Contact persons',   action: 'remove' },
    'communication': { category: [],     label: 'Communication prefs', action: 'remove' },
    'link':       { category: [18],      label: 'Patient links',     action: 'remove' },
    'text':       { category: [1, 2, 3, 4, 6], label: 'Narrative',   action: 'remove' }
  },
  'Practitioner': {
    'name':          { category: [1],       label: 'Names',           action: 'remove' },
    'identifier':    { category: [11, 18],  label: 'License/NPI',     action: 'remove' },
    'telecom':       { category: [4, 5, 6], label: 'Phone/Fax/Email', action: 'remove' },
    'address':       { category: [2],       label: 'Geographic',      action: 'remove' },
    'photo':         { category: [17],      label: 'Photos',          action: 'remove' },
    'qualification': { category: [11],      label: 'Qualifications',  action: 'remove' },
    'text':          { category: [1],       label: 'Narrative',       action: 'remove' }
  },
  'RelatedPerson': {
    'name':       { category: [1],       label: 'Names',              action: 'remove' },
    'telecom':    { category: [4, 5, 6], label: 'Phone/Fax/Email',   action: 'remove' },
    'address':    { category: [2],       label: 'Geographic',         action: 'remove' },
    'photo':      { category: [17],      label: 'Photos',             action: 'remove' },
    'birthDate':  { category: [3],       label: 'Dates',              action: 'pixelate' },
    'text':       { category: [1],       label: 'Narrative',          action: 'remove' }
  },
  'Coverage': {
    'identifier':  { category: [9, 10], label: 'Health plan numbers', action: 'remove' },
    'subscriber':  { category: [1],     label: 'Subscriber info',    action: 'scrub' },
    'text':        { category: [1],     label: 'Narrative',           action: 'remove' }
  },
  'Device': {
    'identifier':  { category: [13],    label: 'Device identifiers',  action: 'remove' },
    'udiCarrier':  { category: [13],    label: 'UDI serial numbers',  action: 'remove' },
    'serialNumber': { category: [13],   label: 'Serial number',       action: 'remove' },
    'text':        { category: [13],    label: 'Narrative',            action: 'remove' }
  },
  'AuditEvent': {
    'agent':  { category: [15],   label: 'Agent network/IP',   action: 'scrub' },
    'entity': { category: [1],    label: 'Entity names',       action: 'scrub' },
    'text':   { category: [1, 15], label: 'Narrative',          action: 'remove' }
  }
};

// Default PHI fields present on most FHIR resources (catch-all)
const DEFAULT_PHI_FIELDS = {
  'text':      { category: [1, 2, 3], label: 'Narrative (text.div)', action: 'remove' }
};

// Display reference fields that appear across many resource types.
// These contain patient/practitioner names in .display sub-fields.
const DISPLAY_REFERENCE_PATHS = [
  'subject.display',
  'patient.display',
  'performer.0.display',
  'performer.0.actor.display',
  'participant.0.individual.display',
  'participant.0.actor.display',
  'author.0.display',
  'requester.display',
  'recorder.display',
  'asserter.display',
  'informant.0.display',
  'encounter.display',
  'custodian.display'
];

// Date/time fields to scan for pixelation
const DATE_FIELDS = [
  'effectiveDateTime', 'effectivePeriod.start', 'effectivePeriod.end',
  'issued', 'recorded', 'recordedDate',
  'onsetDateTime', 'onsetPeriod.start', 'onsetPeriod.end',
  'abatementDateTime', 'abatementPeriod.start', 'abatementPeriod.end',
  'authoredOn', 'period.start', 'period.end',
  'performedDateTime', 'performedPeriod.start', 'performedPeriod.end',
  'occurrenceDateTime', 'occurrencePeriod.start', 'occurrencePeriod.end',
  'meta.lastUpdated', 'date', 'created', 'sent', 'received'
];

// Note/annotation fields that may contain free-text PHI
const NOTE_FIELDS = [
  'note', 'text.div'
];

// ============================================================================
// Public API
// ============================================================================

const Anonymizer = {

  /**
   * Returns the merged PHI field map for a given resource type.
   * Combines _default fields with resource-specific overrides.
   */
  phi: function(resourceType) {
    const resourceFields = PHI_FIELD_MAP[resourceType] || {};
    return merge({}, DEFAULT_PHI_FIELDS, resourceFields);
  },

  /**
   * Strips all 18 Safe Harbor identifier categories from resources.
   * Removes name, address details, telecom, identifiers, photos, etc.
   * Returns { resources, removedFields }.
   */
  removePhi: function(resources) {
    const removedFields = {};

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const resourceType = get(resource, 'resourceType', '_default');
      const phiFields = Anonymizer.phi(resourceType);
      const removed = [];

      // Remove resource-specific PHI fields
      for (const [fieldPath, config] of Object.entries(phiFields)) {
        if (config.action === 'remove' && get(resource, fieldPath) !== undefined) {
          removed.push(fieldPath);
          unset(resource, fieldPath);
        }
      }

      // Scrub display references (names in reference.display fields)
      for (let d = 0; d < DISPLAY_REFERENCE_PATHS.length; d++) {
        const displayPath = DISPLAY_REFERENCE_PATHS[d];
        if (get(resource, displayPath)) {
          set(resource, displayPath, 'Anonymous');
          removed.push(displayPath);
        }
      }

      // Scrub note/annotation fields
      for (let n = 0; n < NOTE_FIELDS.length; n++) {
        const notePath = NOTE_FIELDS[n];
        const noteValue = get(resource, notePath);
        if (noteValue) {
          if (Array.isArray(noteValue)) {
            // FHIR Annotation array: [{ text: "..." }]
            for (let a = 0; a < noteValue.length; a++) {
              if (get(noteValue[a], 'text')) {
                set(noteValue[a], 'text', '[REDACTED]');
              }
            }
          } else {
            unset(resource, notePath);
          }
          removed.push(notePath);
        }
      }

      // Handle AuditEvent special scrubbing
      if (resourceType === 'AuditEvent') {
        // Remove IP addresses from agent.network
        const agents = get(resource, 'agent', []);
        for (let a = 0; a < agents.length; a++) {
          if (get(agents[a], 'network')) {
            unset(agents[a], 'network');
            removed.push('agent.' + a + '.network');
          }
          if (get(agents[a], 'who.display')) {
            set(agents[a], 'who.display', 'Anonymous');
            removed.push('agent.' + a + '.who.display');
          }
        }
        // Scrub entity names
        const entities = get(resource, 'entity', []);
        for (let e = 0; e < entities.length; e++) {
          if (get(entities[e], 'name')) {
            set(entities[e], 'name', 'Anonymous');
            removed.push('entity.' + e + '.name');
          }
          if (get(entities[e], 'what.display')) {
            set(entities[e], 'what.display', 'Anonymous');
            removed.push('entity.' + e + '.what.display');
          }
        }
      }

      // Handle Coverage subscriber scrubbing
      if (resourceType === 'Coverage') {
        if (get(resource, 'subscriber.display')) {
          set(resource, 'subscriber.display', 'Anonymous');
          removed.push('subscriber.display');
        }
      }

      if (removed.length > 0) {
        removedFields[get(resource, '_id', 'unknown-' + i)] = removed;
      }
    }

    return { resources: resources, removedFields: removedFields };
  },

  /**
   * Reduces date precision to year only. Ages 89+ become 90.
   * ZIP codes reduced to first 3 digits + "00".
   * Address line/city/district removed, state preserved.
   */
  pixelateEdges: function(resources) {
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const resourceType = get(resource, 'resourceType', '');

      // Pixelate date fields → year only
      for (let d = 0; d < DATE_FIELDS.length; d++) {
        const dateField = DATE_FIELDS[d];
        const dateValue = get(resource, dateField);
        if (dateValue && typeof dateValue === 'string') {
          // Extract year (first 4 characters of ISO date)
          const year = dateValue.substring(0, 4);
          if (year.match(/^\d{4}$/)) {
            set(resource, dateField, year);
          }
        }
      }

      // Pixelate birthDate → year only, age 89+ → "1900" (indicating 90+)
      if (resourceType === 'Patient' || resourceType === 'RelatedPerson') {
        const birthDate = get(resource, 'birthDate');
        if (birthDate && typeof birthDate === 'string') {
          const birthYear = parseInt(birthDate.substring(0, 4), 10);
          const currentYear = new Date().getFullYear();
          const age = currentYear - birthYear;

          if (age > 89) {
            // HIPAA Safe Harbor: ages over 89 aggregated into 90+ category
            set(resource, 'birthDate', '1900');
          } else {
            set(resource, 'birthDate', String(birthYear));
          }
        }
      }

      // Pixelate address → keep state, reduce ZIP to 3 digits
      const addresses = get(resource, 'address', []);
      for (let a = 0; a < addresses.length; a++) {
        const addr = addresses[a];

        // Remove sub-state geographic info
        unset(addr, 'line');
        unset(addr, 'city');
        unset(addr, 'district');
        // Keep state and country

        // Pixelate postal code → first 3 digits + "00"
        const postalCode = get(addr, 'postalCode');
        if (postalCode && typeof postalCode === 'string' && postalCode.length >= 3) {
          set(addr, 'postalCode', postalCode.substring(0, 3) + '00');
        }

        // Remove text (may contain full address)
        unset(addr, 'text');
      }
    }

    return resources;
  },

  /**
   * Renames a patient and updates all display references across linked resources.
   * Finds the Patient resource, updates name[*].family/given/text.
   * Updates subject.display / patient.display on all other resources.
   */
  renamer: function(resources, newName) {
    const newGiven = get(newName, 'given', 'Anonymous');
    const newFamily = get(newName, 'family', 'Patient');
    const newFullName = newGiven + ' ' + newFamily;

    // Find and update Patient resource
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      if (get(resource, 'resourceType') === 'Patient') {
        const names = get(resource, 'name', []);
        for (let n = 0; n < names.length; n++) {
          set(names[n], 'family', newFamily);
          set(names[n], 'given', [newGiven]);
          set(names[n], 'text', newFullName);
        }
        if (names.length === 0) {
          set(resource, 'name', [{ family: newFamily, given: [newGiven], text: newFullName }]);
        }

        // Update contact names if present
        const contacts = get(resource, 'contact', []);
        for (let c = 0; c < contacts.length; c++) {
          const contactNames = get(contacts[c], 'name');
          if (contactNames) {
            if (typeof contactNames === 'object' && !Array.isArray(contactNames)) {
              set(contacts[c], 'name.text', 'Contact of ' + newFullName);
            }
          }
        }
      }
    }

    // Update display references on all linked resources
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      if (get(resource, 'resourceType') === 'Patient') continue;

      for (let d = 0; d < DISPLAY_REFERENCE_PATHS.length; d++) {
        const displayPath = DISPLAY_REFERENCE_PATHS[d];
        if (get(resource, displayPath)) {
          set(resource, displayPath, newFullName);
        }
      }
    }

    return resources;
  },

  /**
   * Replaces all id, _id, and reference strings with new UUIDs.
   * Builds an oldRef→newRef map so references remain internally consistent.
   * Returns { resources, idMap }.
   */
  rereferencer: function(resources, idMap) {
    if (!idMap) {
      idMap = {};
    }

    // Pass 1: Build ID map
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const oldId = get(resource, 'id');
      const oldMongoId = get(resource, '_id');
      const resourceType = get(resource, 'resourceType', 'Resource');

      if (oldId && !idMap['id:' + oldId]) {
        const newId = Random.id();
        idMap['id:' + oldId] = newId;
        // Also map the full reference string
        idMap[resourceType + '/' + oldId] = resourceType + '/' + newId;
      }

      if (oldMongoId && !idMap['_id:' + oldMongoId]) {
        const newMongoId = idMap['id:' + oldId] || Random.id();
        idMap['_id:' + oldMongoId] = newMongoId;
        // Map reference by _id too
        idMap[resourceType + '/' + oldMongoId] = resourceType + '/' + newMongoId;
      }
    }

    // Pass 2: Replace IDs and references
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const oldId = get(resource, 'id');
      const oldMongoId = get(resource, '_id');

      // Replace id and _id
      if (oldId && idMap['id:' + oldId]) {
        set(resource, 'id', idMap['id:' + oldId]);
      }
      if (oldMongoId && idMap['_id:' + oldMongoId]) {
        set(resource, '_id', idMap['_id:' + oldMongoId]);
      }

      // Recursively replace reference strings
      replaceReferences(resource, idMap);
    }

    return { resources: resources, idMap: idMap };
  },

  /**
   * Adds FHIR meta.security tag indicating resource has been pseudonymized.
   */
  addPhiWarning: function(resources) {
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const security = get(resource, 'meta.security', []);

      // Check if tag already exists
      const hasTag = security.some(function(tag) {
        return get(tag, 'code') === 'PSEUDED';
      });

      if (!hasTag) {
        security.push({
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationValue',
          code: 'PSEUDED',
          display: 'pseudonymized'
        });
        set(resource, 'meta.security', security);
      }
    }

    return resources;
  },

  /**
   * Full orchestrator: cloneDeep → removePhi → pixelateEdges → rereferencer → addPhiWarning.
   * Options: { skipRemovePhi, skipPixelate, skipRereference, skipWarning }
   * Returns { resources, idMap, warnings, removedFields }.
   */
  anonymize: function(resources, options) {
    options = options || {};
    const cloned = cloneDeep(resources);

    let removedFields = {};
    let idMap = {};
    const warnings = [];

    // Step 1: Remove PHI fields
    if (!options.skipRemovePhi) {
      const result = Anonymizer.removePhi(cloned);
      removedFields = result.removedFields;
    }

    // Step 2: Pixelate dates and geographic data
    if (!options.skipPixelate) {
      Anonymizer.pixelateEdges(cloned);
    }

    // Step 3: Re-reference (new UUIDs)
    if (!options.skipRereference) {
      const result = Anonymizer.rereferencer(cloned);
      idMap = result.idMap;
    }

    // Step 4: Add PHI warning tags
    if (!options.skipWarning) {
      Anonymizer.addPhiWarning(cloned);
    }

    // Generate warnings about fields that may still contain PHI
    for (let i = 0; i < cloned.length; i++) {
      const resource = cloned[i];
      const resourceType = get(resource, 'resourceType', 'Unknown');

      // Warn about note/annotation fields that were redacted (may need review)
      for (let n = 0; n < NOTE_FIELDS.length; n++) {
        const noteValue = get(resource, NOTE_FIELDS[n]);
        if (noteValue) {
          if (Array.isArray(noteValue)) {
            const hasContent = noteValue.some(function(item) {
              return get(item, 'text') && get(item, 'text') !== '[REDACTED]';
            });
            if (hasContent) {
              warnings.push(resourceType + '/' + get(resource, '_id', '?') + ': ' + NOTE_FIELDS[n] + ' may contain unredacted free text');
            }
          }
        }
      }

      // Warn about extension fields (may contain PHI in valueString, etc.)
      const extensions = get(resource, 'extension', []);
      if (extensions.length > 0) {
        for (let e = 0; e < extensions.length; e++) {
          if (get(extensions[e], 'valueString') || get(extensions[e], 'valueAddress')) {
            warnings.push(resourceType + '/' + get(resource, '_id', '?') + ': extension[' + e + '] may contain PHI');
          }
        }
      }
    }

    return {
      resources: cloned,
      idMap: idMap,
      warnings: warnings,
      removedFields: removedFields
    };
  }
};

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Recursively walks an object and replaces reference strings using the idMap.
 */
function replaceReferences(obj, idMap) {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      replaceReferences(obj[i], idMap);
    }
    return;
  }

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (key === 'reference' && typeof value === 'string') {
      // Try to match and replace the reference
      if (idMap[value]) {
        obj[key] = idMap[value];
      } else {
        // Try matching just the ID portion (after the /)
        const parts = value.split('/');
        if (parts.length === 2) {
          const mappedId = idMap['id:' + parts[1]] || idMap['_id:' + parts[1]];
          if (mappedId) {
            obj[key] = parts[0] + '/' + mappedId;
          }
        }
      }
    } else if (typeof value === 'object') {
      replaceReferences(value, idMap);
    }
  }
}

export { Anonymizer, PHI_FIELD_MAP, DISPLAY_REFERENCE_PATHS, DATE_FIELDS };
export default Anonymizer;
