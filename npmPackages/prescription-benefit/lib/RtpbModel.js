// npmPackages/prescription-benefit/lib/RtpbModel.js
//
// Canonical JSON shapes for the RTPB transactions (§ 170.315(b)(4)).
// JSON is the source of truth; lib/RtpbXml.js renders/parses the wire XML.
// Isomorphic (client + server), no Meteor dependencies.

import { get } from 'lodash';

export const RXNORM_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';
export const NDC_SYSTEM = 'http://hl7.org/fhir/sid/ndc';

export const CoverageStatus = {
  Covered: 'covered',
  CoveredWithRestrictions: 'covered-with-restrictions',
  NotCovered: 'not-covered'
};

// Empty composer state — the client form binds to this shape.
export function emptyRequest() {
  return {
    transactionType: 'RTPBRequest',
    patient: { id: '', firstName: '', lastName: '', dob: '', gender: '' },
    product: { rxnorm: '', ndc: '', display: '' },
    quantity: 30,
    daysSupply: 30,
    prescriber: { npi: '', name: '' },
    pharmacy: { ncpdpId: '', name: '' },
    coverage: { payerName: '', bin: '', pcn: '', groupId: '', memberId: '' }
  };
}

// Build a request from a FHIR Patient + a chosen drug catalog entry.
export function requestFromPatientAndDrug(patient, drug, overrides) {
  const base = emptyRequest();
  const name = get(patient, 'name.0', {});
  base.patient = {
    id: get(patient, 'id', get(patient, '_id', '')),
    firstName: get(name, 'given.0', ''),
    lastName: get(name, 'family', ''),
    dob: get(patient, 'birthDate', ''),
    gender: get(patient, 'gender', '')
  };
  if (drug) {
    base.product = {
      rxnorm: get(drug, 'rxnorm', ''),
      ndc: get(drug, 'ndc', ''),
      display: get(drug, 'display', '')
    };
  }
  return Object.assign(base, overrides || {});
}

// Extract product/ndc/rxnorm/display from a FHIR MedicationRequest (for prefill).
export function productFromMedicationRequest(medicationRequest) {
  const coding = get(medicationRequest, 'medicationCodeableConcept.coding', []);
  const rxnormCoding = coding.find(function(c) {
    return get(c, 'system', '').indexOf('rxnorm') > -1;
  }) || coding[0] || {};
  const ndcCoding = coding.find(function(c) {
    return get(c, 'system', '').indexOf('ndc') > -1;
  }) || {};
  return {
    rxnorm: get(rxnormCoding, 'code', ''),
    ndc: get(ndcCoding, 'code', ''),
    display: get(medicationRequest, 'medicationCodeableConcept.text',
      get(rxnormCoding, 'display', ''))
  };
}

// Reduce a responseJson to the headline numbers the UI displays.
export function summarizeResponse(responseJson) {
  const requested = get(responseJson, 'requestedProduct', {});
  const alternatives = get(responseJson, 'alternatives', []);
  const altLow = alternatives.reduce(function(min, alt) {
    const amt = get(alt, 'patientPayAmount', Infinity);
    return amt < min ? amt : min;
  }, Infinity);
  return {
    coverageStatus: get(responseJson, 'coverage.status', ''),
    payerName: get(responseJson, 'coverage.payerName', ''),
    requestedDisplay: get(requested, 'display', ''),
    requestedPatientPay: get(requested, 'patientPayAmount', null),
    priorAuthRequired: get(requested, 'priorAuthRequired', false),
    alternativeCount: alternatives.length,
    lowestAlternativePay: altLow === Infinity ? null : altLow
  };
}
