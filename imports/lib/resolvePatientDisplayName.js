// imports/lib/resolvePatientDisplayName.js
//
// Resolve a human-readable display name from any of the patient shapes the
// app passes around: raw FHIR Patient (name[] of HumanName), FhirDehydrator
// flattened ({fullName, givenName, familyName}), reference picks ({display}),
// and remote-table rows where `name` is already a plain string.
//
// Returns '' when nothing resolves — the caller owns last-resort presentation
// (e.g. "Patient <id>"). Dependency-free and isomorphic; unit-tested by
// tests/unit/imports/lib/resolvePatientDisplayName.test.mjs.

function clean(value) {
  return (typeof value === 'string') ? value.trim() : '';
}

function fromHumanName(nameEntry) {
  if (!nameEntry || typeof nameEntry !== 'object') {
    return '';
  }
  const text = clean(nameEntry.text);
  if (text) {
    return text;
  }
  const given = Array.isArray(nameEntry.given) ? nameEntry.given.map(clean).filter(Boolean) : [];
  const family = clean(nameEntry.family);
  return given.concat(family ? [family] : []).join(' ').trim();
}

export function resolvePatientDisplayName(patient) {
  if (!patient || typeof patient !== 'object') {
    return '';
  }

  // Raw FHIR name[] — or the loose variants (name as string, name[] of strings)
  const name = patient.name;
  if (typeof name === 'string') {
    return clean(name);
  }
  if (Array.isArray(name) && name.length > 0) {
    const first = name[0];
    const resolved = (typeof first === 'string') ? clean(first) : fromHumanName(first);
    if (resolved) {
      return resolved;
    }
  }

  // Flattened (FhirDehydrator) fields
  const fullName = clean(patient.fullName);
  if (fullName) {
    return fullName;
  }
  const flatAssembly = [clean(patient.givenName), clean(patient.familyName)].filter(Boolean).join(' ');
  if (flatAssembly) {
    return flatAssembly;
  }

  // Reference-pick shape
  return clean(patient.display);
}

export default resolvePatientDisplayName;
