// packages/pacio-core/lib/constants/AdiConstants.js
//
// Central source of truth for PACIO Advance Directive Interoperability (ADI) IG
// profile URLs, document type codes, and Provenance activity codes.
// Based on the ADI IG CI build (build.fhir.org/ig/HL7/fhir-pacio-adi/), v2.0.0-ballot.
//
// Advance directives are stored as DocumentReference resources in the shared
// DocumentReferences collection (there is no separate AdvanceDirectives
// collection). Use adiSelectorQuery() to distinguish ADI documents from other
// DocumentReferences (e.g., ToC Transfer Summary Notes).

import { AdvanceDirectiveUtils } from '../utilities/AdvanceDirectiveUtils';

export const AdiConstants = {
  // ===== Profile URLs =====
  profiles: {
    ADI_DOCUMENT_REFERENCE: 'http://hl7.org/fhir/us/pacio-adi/StructureDefinition/ADI-DocumentReference',
    ADI_PROVENANCE: 'http://hl7.org/fhir/us/pacio-adi/StructureDefinition/ADI-Provenance'
  },

  // ===== Code Systems =====
  codeSystems: {
    LOINC: 'http://loinc.org',
    V3_DATA_OPERATION: 'http://terminology.hl7.org/CodeSystem/v3-DataOperation',
    PROVENANCE_PARTICIPANT_TYPE: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type'
  },

  // ===== ADI Document Type LOINC Codes =====
  // Single source: AdvanceDirectiveUtils.DirectiveTypes
  // 42348-3 Living will, 81334-5 Healthcare proxy, 89666-0 DNR,
  // 89897-1 POLST, 75320-2 Advance directive
  typeCodes: Object.values(AdvanceDirectiveUtils.DirectiveTypes),

  // ===== DocumentReference Category =====
  // US Core requires category from us-core-documentreference-category;
  // matches the connectathon sample data (bsj-adi-documentreference.json)
  category: {
    coding: [{
      system: 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category',
      code: 'clinical-note',
      display: 'Clinical Note'
    }]
  },

  // ===== Provenance Activity Codes (v3-DataOperation) =====
  provenanceActivities: {
    CREATE: { code: 'CREATE', display: 'create' },
    UPDATE: { code: 'UPDATE', display: 'revise' },
    NULLIFY: { code: 'NULLIFY', display: 'nullify' }
  }
};

// Mongo selector that matches ADI DocumentReferences (by stamped profile or
// by directive type code) without matching ToC or other DocumentReferences.
export function adiSelectorQuery() {
  return {
    $or: [
      { 'meta.profile': AdiConstants.profiles.ADI_DOCUMENT_REFERENCE },
      { 'type.coding.code': { $in: AdiConstants.typeCodes } }
    ]
  };
}

// Check whether a single DocumentReference document is an ADI document
// (stamped profile or directive type code). Mirrors adiSelectorQuery().
export function isAdiDocument(doc) {
  if (!doc) {
    return false;
  }
  const profiles = (doc.meta && doc.meta.profile) || [];
  if (profiles.includes(AdiConstants.profiles.ADI_DOCUMENT_REFERENCE)) {
    return true;
  }
  const codings = (doc.type && doc.type.coding) || [];
  return codings.some(function(coding) {
    return AdiConstants.typeCodes.includes(coding.code);
  });
}

// Merge the ADI selector into an existing query. If the caller's query already
// uses $or (e.g., reference variants), combine with $and so neither is lost.
export function mergeAdiSelector(query) {
  const adiSelector = adiSelectorQuery();
  if (!query || Object.keys(query).length === 0) {
    return adiSelector;
  }
  if (query.$or) {
    return { $and: [query, adiSelector] };
  }
  return Object.assign({}, query, adiSelector);
}
