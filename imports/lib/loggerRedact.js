// imports/lib/loggerRedact.js
// PHI redaction net for LogRecords. Plain CJS, no Meteor imports.
const PHI_FIELDS = ['name', 'given', 'family', 'birthDate', 'address', 'telecom', 'photo', 'contact', 'maritalStatus', 'communication', 'email', 'phone'];
const PATIENT_COMPARTMENT = ['Patient', 'RelatedPerson', 'Person', 'Practitioner'];

function redactPhiInner(value, seen) {
  if (value === null || typeof value !== 'object') { return value; }
  // Preserve Error objects: extract message + stack so diagnostics survive
  if (value instanceof Error) {
    const errOut = { message: value.message, stack: value.stack };
    // Redact any enumerable properties on the error that might carry PHI
    Object.keys(value).forEach(function(key) {
      errOut[key] = redactPhiInner(value[key], seen);
    });
    return errOut;
  }
  // Preserve Date objects as ISO strings
  if (value instanceof Date) { return value.toISOString(); }
  // Cycle guard: if we have seen this object already, mark it to avoid infinite loops
  if (seen.has(value)) { return { redacted: true, circular: true }; }
  seen.add(value);
  if (PATIENT_COMPARTMENT.includes(value.resourceType)) {
    seen.delete(value);
    return { redacted: true, resourceType: value.resourceType, id: value.id };
  }
  if (Array.isArray(value)) {
    const arr = value.map(function(item) { return redactPhiInner(item, seen); });
    seen.delete(value);
    return arr;
  }
  const out = {};
  Object.keys(value).forEach(function(key) {
    if (PHI_FIELDS.includes(key)) {
      out[key] = { redacted: true };
    } else if (key === 'identifier') {
      out[key] = { redacted: true };
    } else {
      out[key] = redactPhiInner(value[key], seen);
    }
  });
  seen.delete(value);
  return out;
}

function redactPhi(value) {
  return redactPhiInner(value, new WeakSet());
}

module.exports = { redactPhi };
