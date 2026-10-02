// imports/lib/patientFilterCore.js
//
// Pure, dependency-free core for the patient-filter query builder. NO Meteor /
// lodash imports: FhirUtilities.addPatientFilterToQuery delegates here, and the
// bare-checkout lib-unit-tests tier imports this file directly (node --test,
// no npm install — importing FhirUtilities.js there dies on its lodash import).
// See tests/unit/imports/lib/resolvePatientSet.test.mjs.
//
// Authored as dependency-free ESM (default export at the bottom, same pattern
// and rationale as patientSetCore.js: the rspack CLIENT bundle rejects
// module.exports). CI runs the test with --experimental-detect-module.

// Build the reference-shape $or clauses for a single patient id. Extracted so
// the multi-id overload can fan the SAME variants across an array without
// duplicating the shape list. Order is preserved so single-id output stays
// byte-compatible with the historical inline form.
function patientFilterClauses(patientId){
  return [
    {"patient.reference": "Patient/" + patientId},
    {"patient.reference": "urn:uuid:" + patientId},

    {"subject.reference": "Patient/" + patientId},
    {"subject.reference": "urn:uuid:" + patientId},

    {"for.reference": "Patient/" + patientId},
    {"for.reference": "urn:uuid:" + patientId},

    // Coverage uses beneficiary.reference for patient
    {"beneficiary.reference": "Patient/" + patientId},
    {"beneficiary.reference": "urn:uuid:" + patientId},

    {"agent.who.reference": "Patient/" + patientId}
  ];
}

// patientId accepts a single id (string) OR an array of ids (link-aware
// patient-set membership, design v2 §A). A single id produces exactly the
// historical output; an array fans the same reference-shape variants across
// every id in one flat $or.
function addPatientFilterToQuery(patientId, currentQuery, practitionerId){

  let returnQuery = {};

  if(typeof currentQuery === "object"){
    Object.assign(returnQuery, currentQuery);
  }

  if(practitionerId){
    returnQuery = {};
  } else {
    // Normalize to a list of non-empty ids. A bare string stays single-id
    // (byte-compatible); an array fans across all members.
    let patientIds = [];
    if(Array.isArray(patientId)){
      patientIds = patientId.filter(function(id){ return id !== null && id !== undefined && id !== ""; });
    } else if(patientId){
      patientIds = [patientId];
    }

    if(patientIds.length > 0){
      let clauses = [];
      patientIds.forEach(function(id){
        clauses = clauses.concat(patientFilterClauses(id));
      });
      returnQuery = {$or: clauses};
    } else {
      returnQuery = {$or: [
        {"patient.reference": "Patient/public"},
        {"patient.reference": "urn:uuid:Patient/public"}
      ]}
    }
  }

  return returnQuery
}

export default {
  patientFilterClauses,
  addPatientFilterToQuery
};
