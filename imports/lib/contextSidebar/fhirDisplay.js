// imports/lib/contextSidebar/fhirDisplay.js
//
// Pure display resolvers for the ContextSidebar stash panel: derive a human
// label, a one-line summary, and a type badge from a FHIR resource, per the
// ContextSidebar design (fable/superpowers/specs/2026-11-07-context-sidebar-
// design.md §Display label resolvers). No Meteor imports — unit-tested with
// node --test (tests/unit/imports/lib/contextSidebar/). lodash arrives via
// default-import interop: it is CJS, and named imports break under raw node
// ESM (the unit-test context) while default import works in both.
import lodash from 'lodash';

const get = lodash.get;

// Short display names for common terminology systems (summary lines).
const SYSTEM_SHORT_NAMES = {
  'http://snomed.info/sct': 'SNOMED',
  'http://loinc.org': 'LOINC',
  'http://www.nlm.nih.gov/research/umls/rxnorm': 'RxNorm',
  'http://hl7.org/fhir/sid/icd-10': 'ICD-10',
  'http://hl7.org/fhir/sid/icd-10-cm': 'ICD-10-CM',
  'http://www.ama-assn.org/go/cpt': 'CPT',
  'http://unitsofmeasure.org': 'UCUM'
};

export function isFhirResource(value) {
  return !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof value.resourceType === 'string' &&
    value.resourceType.length > 0;
}

function humanName(resource) {
  const name = get(resource, 'name.0', null);
  if (!name) return '';
  const family = get(name, 'family', '');
  const given = get(name, 'given.0', '');
  if (family && given) return family + ', ' + given;
  return get(name, 'text', family || given || '');
}

function codeableText(concept) {
  if (!concept) return '';
  return get(concept, 'text', '') || get(concept, 'coding.0.display', '');
}

function bundleEntryCounts(resource) {
  const counts = {};
  const order = [];
  (get(resource, 'entry', []) || []).forEach(function(entry) {
    const type = get(entry, 'resource.resourceType', null);
    if (!type) return;
    if (!counts[type]) {
      counts[type] = 0;
      order.push(type);
    }
    counts[type]++;
  });
  return { counts: counts, order: order };
}

export function deriveLabel(resource) {
  if (!isFhirResource(resource)) return '';
  const type = resource.resourceType;

  if (type === 'Patient' || type === 'Practitioner' || type === 'RelatedPerson' || type === 'Person') {
    const name = humanName(resource);
    if (name) return name;
  }
  if (type === 'Condition' || type === 'Observation' || type === 'Procedure' ||
      type === 'AllergyIntolerance' || type === 'ServiceRequest' || type === 'DiagnosticReport') {
    const text = codeableText(get(resource, 'code'));
    if (text) return text;
  }
  if (type === 'MedicationRequest' || type === 'MedicationStatement' || type === 'MedicationAdministration') {
    const med = codeableText(get(resource, 'medicationCodeableConcept'));
    if (med) return med;
  }
  if (type === 'Encounter') {
    const cls = get(resource, 'class.code', get(resource, 'class.display', ''));
    const encType = codeableText(get(resource, 'type.0'));
    const label = [cls, encType].filter(Boolean).join(' · ');
    if (label) return label;
  }
  if (type === 'Bundle') {
    const total = (get(resource, 'entry', []) || []).length;
    return 'Bundle · ' + total + ' entr' + (total === 1 ? 'y' : 'ies');
  }
  if (type === 'ValueSet' || type === 'CodeSystem' || type === 'Questionnaire' ||
      type === 'StructureDefinition' || type === 'List') {
    const named = get(resource, 'title', '') || get(resource, 'name', '');
    if (named) return named;
  }

  return type + '/' + get(resource, 'id', '?');
}

export function deriveSummary(resource) {
  if (!isFhirResource(resource)) return '';
  const type = resource.resourceType;

  if (type === 'Bundle') {
    const { counts, order } = bundleEntryCounts(resource);
    return order.map(function(t) { return t + ' ' + counts[t]; }).join(' · ');
  }

  const coding = get(resource, 'code.coding.0', null) ||
    get(resource, 'medicationCodeableConcept.coding.0', null);
  if (coding) {
    const system = get(coding, 'system', '');
    const short = SYSTEM_SHORT_NAMES[system] || '';
    const code = get(coding, 'code', '');
    if (code) return (short ? short + ' ' : '') + code;
  }
  return '';
}

export function deriveBadge(resource) {
  if (!isFhirResource(resource)) return { type: '', detail: '' };
  const details = [];
  if (resource.resourceType === 'Bundle') {
    if (resource.type) details.push(resource.type);
  } else {
    if (typeof resource.status === 'string') details.push(resource.status);
    if (typeof resource.intent === 'string') details.push(resource.intent);
  }
  return { type: resource.resourceType, detail: details.join(' · ') };
}

export function byteSize(payload) {
  if (typeof payload === 'string') return payload.length;
  try {
    return JSON.stringify(payload).length;
  } catch (error) {
    return 0;
  }
}

export function formatBytes(n) {
  const kb = (Number(n) || 0) / 1024;
  return (Math.round(kb * 10) / 10) + ' KB';
}
