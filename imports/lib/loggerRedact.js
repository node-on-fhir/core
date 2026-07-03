// imports/lib/loggerRedact.js
// PHI redaction net for LogRecords. Plain CJS, no Meteor imports.
const PHI_FIELDS = ['name', 'given', 'family', 'birthDate', 'address', 'telecom', 'photo', 'contact', 'maritalStatus', 'communication'];
const PATIENT_COMPARTMENT = ['Patient', 'RelatedPerson', 'Person', 'Practitioner'];

function redactPhi(value) {
  if (value === null || typeof value !== 'object') { return value; }
  if (PATIENT_COMPARTMENT.includes(value.resourceType)) {
    return { redacted: true, resourceType: value.resourceType, id: value.id };
  }
  if (Array.isArray(value)) { return value.map(redactPhi); }
  const out = {};
  Object.keys(value).forEach(function(key) {
    if (PHI_FIELDS.includes(key)) {
      out[key] = { redacted: true };
    } else if (key === 'identifier') {
      out[key] = { redacted: true };
    } else {
      out[key] = redactPhi(value[key]);
    }
  });
  return out;
}

module.exports = { redactPhi };
