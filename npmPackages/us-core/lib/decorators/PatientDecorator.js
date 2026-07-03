// packages/us-core/lib/decorators/PatientDecorator.js
//
// US Core Patient Profile Decorator
// Ensures Patient resources include all required US Core extensions
// when returned via FHIR API.
//
// Reference: http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient

import { get, set, cloneDeep } from 'lodash';
import { ProfileDecorator } from '../ProfileDecorator.js';
import { USCoreExtensions, hasExtension } from '../extensions.js';

/**
 * US Core Patient Decorator
 * Adds missing US Core extensions with appropriate defaults
 */
export class USCorePatientDecorator extends ProfileDecorator {
  constructor() {
    super({
      profileUrl: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient",
      resourceType: "Patient",
      requiredExtensions: ['race', 'ethnicity', 'tribalAffiliation', 'individualSex']
    });
  }

  /**
   * Ensure all required US Core extensions exist on the Patient
   * Missing extensions are added with sensible defaults (data-absent-reason)
   *
   * @param {Object} patient - The Patient resource
   * @returns {Object} - Patient with extensions
   */
  ensureExtensions(patient) {
    let extensions = get(patient, 'extension', []);

    if (!Array.isArray(extensions)) {
      extensions = [];
    }

    // Race - add with "unknown" if missing
    if (!hasExtension(extensions, 'race')) {
      process.env.DEBUG && console.log('USCorePatientDecorator: Adding missing race extension'); // phi-audit: ok
      extensions.push(USCoreExtensions.race.createUnknown());
    }

    // Ethnicity - add with "unknown" if missing
    if (!hasExtension(extensions, 'ethnicity')) {
      process.env.DEBUG && console.log('USCorePatientDecorator: Adding missing ethnicity extension'); // phi-audit: ok
      extensions.push(USCoreExtensions.ethnicity.createUnknown());
    }

    // Tribal Affiliation - add with "asked but unknown" if missing
    if (!hasExtension(extensions, 'tribalAffiliation')) {
      process.env.DEBUG && console.log('USCorePatientDecorator: Adding missing tribalAffiliation extension'); // phi-audit: ok
      extensions.push(USCoreExtensions.tribalAffiliation.createDefault());
    }

    // Individual Sex - add with data-absent-reason if missing
    if (!hasExtension(extensions, 'individualSex')) {
      process.env.DEBUG && console.log('USCorePatientDecorator: Adding missing individualSex extension'); // phi-audit: ok
      extensions.push(USCoreExtensions.individualSex.createUnknown());
    }

    set(patient, 'extension', extensions);

    return patient;
  }

  /**
   * Ensure required Patient elements exist
   * Note: Structural elements like name.use:old and address.use:old
   * represent actual historical data and cannot be fabricated.
   * These must be present in the source data.
   *
   * @param {Object} patient - The Patient resource
   * @returns {Object} - Patient with elements
   */
  ensureElements(patient) {
    // Ensure identifier array exists (required)
    if (!get(patient, 'identifier')) {
      set(patient, 'identifier', []);
    }

    // Ensure name array exists (required)
    if (!get(patient, 'name')) {
      set(patient, 'name', []);
    }

    // Ensure gender exists with data-absent-reason if missing
    // Note: gender is must-support but not required
    // We don't add it if missing - that would be fabricating data

    // Ensure birthDate exists (must-support)
    // Don't fabricate if missing

    return patient;
  }

  /**
   * Get a description of what this decorator does
   * @returns {string}
   */
  getDescription() {
    return 'Adds US Core Patient extensions (race, ethnicity, tribal affiliation, individual sex) ' +
           'with data-absent-reason codes when missing';
  }
}

// Singleton instance for easy import
export const patientDecorator = new USCorePatientDecorator();

export default patientDecorator;
