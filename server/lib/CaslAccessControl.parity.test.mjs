// server/lib/CaslAccessControl.parity.test.mjs
//
// Fast (no Meteor / no Mongo) characterization tests for the role-acl -> CASL
// migration. Run with:  node --test server/lib/CaslAccessControl.parity.test.mjs
//
// Three concerns:
//   1. RBAC parity  — over an unrestricted-label sweep (where the new clearance
//      gate never bites), the CASL facade must return EXACTLY the golden values
//      captured from role-acl (granted, attributes, throw). Proves the coat-check
//      allow-list is preserved bit-for-bit. The golden fixture
//      (CaslAccessControl.parity.golden.json) was generated from role-acl while it
//      was still installed; if role-acl is STILL importable we also assert it
//      still matches the golden (drift guard), otherwise that sub-check is skipped.
//   2. Decision matrix — the NEW confidentiality enforcement (role x record-label).
//   3. Quirks — bare grant() doesn't register; unknown role throws; comma-split;
//      object-form honors conditions.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { AccessControl, AccessControlError } from './CaslAccessControl.js';
import { clearanceForRole, rankOfLabel, labelFromContext } from './PermissionModel.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDEN = JSON.parse(readFileSync(join(HERE, 'CaslAccessControl.parity.golden.json'), 'utf8'));

// role-acl may already be removed; import it lazily for the optional drift guard.
let RoleAcl = null;
try {
  const m = await import('role-acl');
  RoleAcl = m.AccessControl || m.default?.AccessControl || m.default;
} catch { /* removed — golden-only mode */ }

// ----------------------------------------------------------------------------
// Shared grant set — fed IDENTICALLY to both engines. Mirrors the structure of
// FhirAuth.initializeAccessControl(): consent-derived grants (the 7 defaults) +
// a representative slice of the hardcoded grants + the bare PAT grant. MUST stay
// in sync with the generator used to produce the golden fixture.
// ----------------------------------------------------------------------------
function applyGrants(acl) {
  acl.grant('citizen').execute('access').on('Organization', ['*']);
  acl.grant('citizen').execute('access').on('Patient', ['*']);
  acl.grant('citizen').execute('access').on('Practitioner', ['*']);
  acl.grant('healthcare provider').execute('access, correct').on('Organization', ['*']);
  acl.grant('healthcare provider').execute('access, correct').on('Patient', ['*']);
  acl.grant('patient').execute('access').on('Patient', ['*']);
  acl.grant('system').execute('access, correct').on('Patient', ['*']);
  ['PractitionerRole', 'Location', 'HealthcareService', 'Endpoint'].forEach((r) =>
    acl.grant('citizen').execute('access').on(r, ['*']));
  ['Observation', 'Condition', 'AllergyIntolerance', 'Immunization', 'DocumentReference'].forEach((r) =>
    acl.grant('patient').execute('access').on(r, ['*']));
  ['Patient', 'Observation', 'Consent', 'Organization', 'DocumentReference'].forEach((r) =>
    acl.grant('SYSTEM').execute('access').on(r, ['*']));
  ['Patient', 'Observation', 'Condition', 'DocumentReference'].forEach((r) => {
    acl.grant('healthcare practitioner').execute('access').on(r, ['*']);
    acl.grant('healthcare provider').execute('access').on(r, ['*']);
  });
  acl.grant('PAT'); // bare grant, no execute/on -> must NOT register
  return acl;
}

function evalSync(acl, role, action, resource, ctx) {
  try {
    let q = acl.can(role).execute(action);
    if (ctx) q = q.with(ctx);
    const r = q.sync().on(resource);
    return { granted: r.granted, attributes: r.attributes };
  } catch (e) {
    return { threw: e.message };
  }
}

const ROLES = ['citizen', 'patient', 'healthcare provider', 'healthcare practitioner', 'SYSTEM', 'system', 'PAT', 'ghost'];
const RESOURCES = ['Patient', 'Organization', 'Observation', 'Consent', 'VisionPrescription'];
const ACTIONS = ['access', 'read', 'correct'];
const UNRESTRICTED = { securityLabel: 'unrestricted' }; // rank U(0) <= every role's clearance

// ----------------------------------------------------------------------------
// 1. RBAC parity — CASL facade must equal the golden (role-acl) values
// ----------------------------------------------------------------------------
test('RBAC allow-list matches golden (role-acl) values', () => {
  const ca = applyGrants(new AccessControl());
  for (const role of ROLES) {
    for (const resource of RESOURCES) {
      for (const action of ACTIONS) {
        const key = `${role}|${action}|${resource}`;
        const actual = evalSync(ca, role, action, resource, UNRESTRICTED);
        assert.deepEqual(actual, GOLDEN[key], `casl != golden at ${key}\n  golden=${JSON.stringify(GOLDEN[key])}\n  casl  =${JSON.stringify(actual)}`);
      }
    }
  }
});

test('golden fixture still matches role-acl (drift guard)', { skip: RoleAcl ? false : 'role-acl not installed' }, () => {
  const ra = applyGrants(new RoleAcl());
  for (const role of ROLES) {
    for (const resource of RESOURCES) {
      for (const action of ACTIONS) {
        const key = `${role}|${action}|${resource}`;
        assert.deepEqual(evalSync(ra, role, action, resource, UNRESTRICTED), GOLDEN[key], `role-acl != golden at ${key}`);
      }
    }
  }
});

// ----------------------------------------------------------------------------
// 2. Decision matrix — NEW confidentiality enforcement
// ----------------------------------------------------------------------------
test('confidentiality clearance gate (role x record-label)', () => {
  const ca = applyGrants(new AccessControl());
  const G = (role, resource, label) =>
    evalSync(ca, role, 'access', resource, label === undefined ? undefined : { securityLabel: label }).granted;

  // citizen (clearance U): only explicitly-unrestricted records of a granted type
  assert.equal(G('citizen', 'Patient', 'unrestricted'), true);
  assert.equal(G('citizen', 'Patient', 'normal'), false);
  assert.equal(G('citizen', 'Patient', undefined), false); // unlabeled defaults to normal
  assert.equal(G('citizen', 'Patient', 'restricted'), false);

  // patient (clearance N): up to normal, not restricted
  assert.equal(G('patient', 'Patient', 'normal'), true);
  assert.equal(G('patient', 'Patient', undefined), true);
  assert.equal(G('patient', 'Patient', 'restricted'), false);
  assert.equal(G('patient', 'Patient', 'very restricted'), false);

  // healthcare provider (clearance R): up to restricted, not very-restricted
  assert.equal(G('healthcare provider', 'Patient', 'restricted'), true);
  assert.equal(G('healthcare provider', 'Patient', 'very restricted'), false);

  // SYSTEM (clearance V): everything
  assert.equal(G('SYSTEM', 'Patient', 'very restricted'), true);

  // clearance never grants what RBAC denies
  assert.equal(G('SYSTEM', 'VisionPrescription', 'unrestricted'), false);
});

// ----------------------------------------------------------------------------
// 3. Quirks
// ----------------------------------------------------------------------------
test('bare grant() does not register the role (PAT throws)', () => {
  const ca = applyGrants(new AccessControl());
  assert.ok(!ca.getRoles().includes('PAT'));
  const r = evalSync(ca, 'PAT', 'access', 'Patient', null);
  assert.ok(r.threw && /Role not found: "PAT"/.test(r.threw), JSON.stringify(r));
});

test('unknown role throws AccessControlError with the role-acl message', () => {
  const ca = applyGrants(new AccessControl());
  assert.throws(
    () => ca.can('ghost').execute('access').sync().on('Patient'),
    (err) => err instanceof AccessControlError && /Role not found: "ghost"/.test(err.message)
  );
});

test('comma-joined grant action matches a single queried action', () => {
  const ca = applyGrants(new AccessControl());
  assert.equal(evalSync(ca, 'healthcare provider', 'access', 'Organization', UNRESTRICTED).granted, true);
  assert.equal(evalSync(ca, 'healthcare provider', 'correct', 'Organization', UNRESTRICTED).granted, true);
  assert.equal(evalSync(ca, 'healthcare provider', 'delete', 'Organization', UNRESTRICTED).granted, false);
});

test('valid role / no matching rule returns granted:false (no throw)', () => {
  const ca = applyGrants(new AccessControl());
  assert.deepEqual(evalSync(ca, 'patient', 'access', 'VisionPrescription', UNRESTRICTED), { granted: false, attributes: [] });
});

test('object-form constructor honors EQUALS conditions', () => {
  const list = [
    { role: 'healthcare provider', action: 'access', resource: 'Organization', attributes: ['*'],
      condition: { Fn: 'EQUALS', args: { securityLevel: 'restricted' } } }
  ];
  const ca = new AccessControl(list);
  assert.equal(evalSync(ca, 'healthcare provider', 'access', 'Organization', { confidentiality: 'restricted' }).granted, true);
  assert.equal(evalSync(ca, 'healthcare provider', 'access', 'Organization', { confidentiality: 'normal' }).granted, false);
});

test('clearance/label helpers behave as specified', () => {
  assert.equal(rankOfLabel(undefined), 3);
  assert.equal(rankOfLabel('unrestricted'), 0);
  assert.equal(rankOfLabel('R'), 4);
  assert.equal(clearanceForRole('citizen'), 0);
  assert.equal(clearanceForRole('totally-unknown-role'), 5);
  assert.equal(labelFromContext({ securityLevel: 'restricted' }), 'restricted');
  assert.equal(labelFromContext({ confidentiality: 'normal' }), 'normal');
});
