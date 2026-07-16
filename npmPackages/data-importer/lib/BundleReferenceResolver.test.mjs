// npmPackages/data-importer/lib/BundleReferenceResolver.test.mjs
// Run with: node --test npmPackages/data-importer/lib/BundleReferenceResolver.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFullUrlIndex, resolveBundleReferences } from './BundleReferenceResolver.js';

// Miniature self-contained document bundle modeled on the PACIO pseudo-EHR
// output (Bundle/502): urn:uuid fullUrls, resource ids that do NOT align with
// the fullUrls, and urn:uuid-style intra-bundle references.
function makeDocumentBundle() {
  return {
    resourceType: 'Bundle',
    type: 'document',
    entry: [
      {
        fullUrl: 'urn:uuid:97c41b0c-e779-4e35-9dd5-e8a6d858995a',
        resource: {
          resourceType: 'Composition',
          id: '489',
          subject: { reference: 'urn:uuid:422a02aa-0c9b-4844-afb1-c595d71ed534' },
          author: [{ reference: 'urn:uuid:197a4498-39b3-40f2-89fb-d24e116a0bb8' }],
          section: [
            {
              title: 'Allergies',
              entry: [{ reference: 'urn:uuid:e523cbbc-47df-470d-b05a-83011b0e86ca' }]
            }
          ]
        }
      },
      {
        fullUrl: 'urn:uuid:422a02aa-0c9b-4844-afb1-c595d71ed534',
        resource: { resourceType: 'Patient', id: 'patient-betsysmith-johnson01' }
      },
      {
        fullUrl: 'urn:uuid:197a4498-39b3-40f2-89fb-d24e116a0bb8',
        resource: {
          resourceType: 'PractitionerRole',
          id: 'PractitionerRole-DNP-JudySalas',
          // reference pointing OUTSIDE the bundle — must stay untouched
          practitioner: { reference: 'urn:uuid:00000000-dead-beef-0000-000000000000' },
          // already-relative reference — must stay untouched
          organization: { reference: 'Organization/org-Motown-Home-Health' }
        }
      },
      {
        fullUrl: 'urn:uuid:e523cbbc-47df-470d-b05a-83011b0e86ca',
        resource: {
          resourceType: 'AllergyIntolerance',
          id: 'betsysmith-johnson01-AllergyACE',
          patient: { reference: 'urn:uuid:422a02aa-0c9b-4844-afb1-c595d71ed534' }
        }
      },
      {
        // entry without resource.id — id derived from the urn:uuid suffix
        fullUrl: 'urn:uuid:85f239a1-4210-44cb-b6e3-ace8b09038c5',
        resource: {
          resourceType: 'QuestionnaireResponse',
          // canonical URI field, not a Reference — must stay untouched
          questionnaire: 'http://example.org/fhir/Questionnaire/PHQ9Questionnaire',
          subject: { reference: 'urn:uuid:422a02aa-0c9b-4844-afb1-c595d71ed534' }
        }
      }
    ]
  };
}

test('buildFullUrlIndex maps fullUrl to ResourceType/id', function() {
  const index = buildFullUrlIndex(makeDocumentBundle());
  assert.equal(index['urn:uuid:422a02aa-0c9b-4844-afb1-c595d71ed534'], 'Patient/patient-betsysmith-johnson01');
  assert.equal(index['urn:uuid:97c41b0c-e779-4e35-9dd5-e8a6d858995a'], 'Composition/489');
});

test('buildFullUrlIndex derives a missing resource.id from the urn:uuid suffix', function() {
  const bundle = makeDocumentBundle();
  const index = buildFullUrlIndex(bundle);
  assert.equal(index['urn:uuid:85f239a1-4210-44cb-b6e3-ace8b09038c5'],
    'QuestionnaireResponse/85f239a1-4210-44cb-b6e3-ace8b09038c5');
  assert.equal(bundle.entry[4].resource.id, '85f239a1-4210-44cb-b6e3-ace8b09038c5');
});

test('resolveBundleReferences rewrites intra-bundle urn:uuid references to relative form', function() {
  const result = resolveBundleReferences(makeDocumentBundle());
  const byType = {};
  result.resources.forEach(function(r) { byType[r.resourceType] = r; });

  assert.equal(byType.Composition.subject.reference, 'Patient/patient-betsysmith-johnson01');
  assert.equal(byType.Composition.author[0].reference, 'PractitionerRole/PractitionerRole-DNP-JudySalas');
  assert.equal(byType.Composition.section[0].entry[0].reference, 'AllergyIntolerance/betsysmith-johnson01-AllergyACE');
  assert.equal(byType.AllergyIntolerance.patient.reference, 'Patient/patient-betsysmith-johnson01');
  assert.equal(byType.QuestionnaireResponse.subject.reference, 'Patient/patient-betsysmith-johnson01');
});

test('unresolvable, already-relative, and canonical values are left untouched', function() {
  const result = resolveBundleReferences(makeDocumentBundle());
  const role = result.resources.find(function(r) { return r.resourceType === 'PractitionerRole'; });
  assert.equal(role.practitioner.reference, 'urn:uuid:00000000-dead-beef-0000-000000000000');
  assert.equal(role.organization.reference, 'Organization/org-Motown-Home-Health');

  const qr = result.resources.find(function(r) { return r.resourceType === 'QuestionnaireResponse'; });
  assert.equal(qr.questionnaire, 'http://example.org/fhir/Questionnaire/PHQ9Questionnaire');
});

test('resolvedCount reflects the number of rewrites', function() {
  const result = resolveBundleReferences(makeDocumentBundle());
  // subject + author + section.entry + patient + qr subject = 5
  assert.equal(result.resolvedCount, 5);
});

test('no-op for bundles without fullUrls (searchset / synthesized collection)', function() {
  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
      { resource: { resourceType: 'Observation', id: 'obs-1', subject: { reference: 'urn:uuid:not-in-bundle' } } }
    ]
  };
  const result = resolveBundleReferences(bundle);
  assert.equal(result.resolvedCount, 0);
  assert.equal(result.resources.length, 1);
  assert.equal(result.resources[0].subject.reference, 'urn:uuid:not-in-bundle');
});

test('tolerates empty and malformed input', function() {
  const empty = { resources: [], resolvedCount: 0, nestedBundleCount: 0, containedCount: 0 };
  assert.deepEqual(resolveBundleReferences(null), empty);
  assert.deepEqual(resolveBundleReferences({}), empty);
  assert.deepEqual(resolveBundleReferences({ resourceType: 'Bundle', entry: [{}] }), empty);
});

// ---------------------------------------------------------------------------
// Nested Bundles + contained promotion

test('nested Bundle entries are flattened — children staged, wrapper dropped', function() {
  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
      { resource: { resourceType: 'Patient', id: 'outer-patient' } },
      {
        resource: {
          resourceType: 'Bundle',
          type: 'document',
          entry: [
            {
              fullUrl: 'urn:uuid:11111111-1111-1111-1111-111111111111',
              resource: { resourceType: 'Patient', id: 'inner-patient' }
            },
            {
              fullUrl: 'urn:uuid:22222222-2222-2222-2222-222222222222',
              resource: {
                resourceType: 'Observation',
                id: 'inner-obs',
                subject: { reference: 'urn:uuid:11111111-1111-1111-1111-111111111111' }
              }
            }
          ]
        }
      }
    ]
  };

  const result = resolveBundleReferences(bundle);
  const types = result.resources.map(function(r) { return r.resourceType; }).sort();

  assert.deepEqual(types, ['Observation', 'Patient', 'Patient']);
  assert.equal(result.nestedBundleCount, 1);
  // the inner bundle's references resolved against ITS OWN fullUrl index
  const obs = result.resources.find(function(r) { return r.resourceType === 'Observation'; });
  assert.equal(obs.subject.reference, 'Patient/inner-patient');
  assert.equal(result.resolvedCount, 1);
});

test('contained resources are promoted, #refs rewritten, contained stripped', function() {
  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
      {
        resource: {
          resourceType: 'MedicationRequest',
          id: 'medrx-1',
          contained: [
            { resourceType: 'Medication', id: 'med-local', code: { text: 'Lisinopril' } }
          ],
          medicationReference: { reference: '#med-local' }
        }
      }
    ]
  };

  const result = resolveBundleReferences(bundle);
  const types = result.resources.map(function(r) { return r.resourceType; }).sort();
  assert.deepEqual(types, ['Medication', 'MedicationRequest']);
  assert.equal(result.containedCount, 1);

  const medRx = result.resources.find(function(r) { return r.resourceType === 'MedicationRequest'; });
  assert.equal(medRx.medicationReference.reference, 'Medication/med-local');
  assert.equal(medRx.contained, undefined);
});

test('non-standard contained/_contained on the Bundle root is promoted', function() {
  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    contained: [{ resourceType: 'Organization', id: 'org-root' }],
    _contained: [{ resourceType: 'Location', id: 'loc-root' }],
    entry: [
      {
        resource: {
          resourceType: 'Encounter',
          id: 'enc-1',
          serviceProvider: { reference: '#org-root' }
        }
      }
    ]
  };

  const result = resolveBundleReferences(bundle);
  const types = result.resources.map(function(r) { return r.resourceType; }).sort();
  assert.deepEqual(types, ['Encounter', 'Location', 'Organization']);
  assert.equal(result.containedCount, 2);
  assert.equal(bundle.contained, undefined);
  assert.equal(bundle._contained, undefined);

  // Bundle-level contained rewrite scope is the whole bundle tree
  const enc = result.resources.find(function(r) { return r.resourceType === 'Encounter'; });
  assert.equal(enc.serviceProvider.reference, 'Organization/org-root');
});

test('id-less contained resources get a derived id', function() {
  const bundle = {
    resourceType: 'Bundle',
    entry: [
      {
        resource: {
          resourceType: 'Observation',
          id: 'obs-9',
          contained: [{ resourceType: 'Specimen' }]
        }
      }
    ]
  };

  const result = resolveBundleReferences(bundle);
  const specimen = result.resources.find(function(r) { return r.resourceType === 'Specimen'; });
  assert.equal(specimen.id, 'obs-9-contained-0');
});

test('contained-of-contained is promoted too', function() {
  const bundle = {
    resourceType: 'Bundle',
    entry: [
      {
        resource: {
          resourceType: 'DiagnosticReport',
          id: 'dr-1',
          contained: [
            {
              resourceType: 'Observation',
              id: 'obs-inner',
              contained: [{ resourceType: 'Specimen', id: 'spec-inner' }],
              specimen: [{ reference: '#spec-inner' }]
            }
          ],
          result: [{ reference: '#obs-inner' }]
        }
      }
    ]
  };

  const result = resolveBundleReferences(bundle);
  const types = result.resources.map(function(r) { return r.resourceType; }).sort();
  assert.deepEqual(types, ['DiagnosticReport', 'Observation', 'Specimen']);
  assert.equal(result.containedCount, 2);

  const dr = result.resources.find(function(r) { return r.resourceType === 'DiagnosticReport'; });
  const obs = result.resources.find(function(r) { return r.resourceType === 'Observation'; });
  assert.equal(dr.result[0].reference, 'Observation/obs-inner');
  assert.equal(obs.specimen[0].reference, 'Specimen/spec-inner');
  assert.equal(obs.contained, undefined);
});

test('deeply nested bundles flatten through multiple levels', function() {
  // three levels: outer > middle > inner, one Patient at the bottom
  const bundle = {
    resourceType: 'Bundle',
    entry: [{
      resource: {
        resourceType: 'Bundle',
        entry: [{
          resource: {
            resourceType: 'Bundle',
            entry: [{ resource: { resourceType: 'Patient', id: 'deep-patient' } }]
          }
        }]
      }
    }]
  };

  const result = resolveBundleReferences(bundle);
  assert.equal(result.resources.length, 1);
  assert.equal(result.resources[0].resourceType, 'Patient');
  assert.equal(result.nestedBundleCount, 2);
});
