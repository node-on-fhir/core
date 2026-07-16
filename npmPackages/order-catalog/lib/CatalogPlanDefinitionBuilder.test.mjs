// npmPackages/order-catalog/lib/CatalogPlanDefinitionBuilder.test.mjs
//
// Bare-checkout unit tests (no npm install required):
//   node --test npmPackages/order-catalog/lib/CatalogPlanDefinitionBuilder.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

import builder from './CatalogPlanDefinitionBuilder.js';

const {
  buildMedicationPlanDefinition,
  buildProcedurePlanDefinition,
  flattenCatalogPlanDefinition,
  RXNORM_SYSTEM,
  CPT_SYSTEM
} = builder;

test('buildMedicationPlanDefinition builds an order-set PlanDefinition from an RxNorm concept', function() {
  const planDefinition = buildMedicationPlanDefinition({
    rxcui: '861007',
    name: 'metformin hydrochloride 500 MG Oral Tablet',
    tty: 'SCD'
  });

  assert.equal(planDefinition.resourceType, 'PlanDefinition');
  assert.equal(planDefinition.id, 'rxnorm-861007');
  assert.equal(planDefinition._id, 'rxnorm-861007');
  assert.equal(planDefinition.status, 'active');
  assert.equal(planDefinition.type.coding[0].code, 'order-set');
  assert.equal(planDefinition.useContext[0].code.code, 'medications');
  assert.equal(planDefinition.identifier[0].system, RXNORM_SYSTEM);
  assert.equal(planDefinition.identifier[0].value, '861007');

  const coding = planDefinition.action[0].code[0].coding[0];
  assert.equal(coding.system, RXNORM_SYSTEM);
  assert.equal(coding.code, '861007');
  assert.equal(coding.display, 'metformin hydrochloride 500 MG Oral Tablet');

  const ttyExtension = planDefinition.action[0].extension.find(function(extension) {
    return extension.url.endsWith('rxnorm-tty');
  });
  assert.equal(ttyExtension.valueString, 'SCD');
});

test('buildMedicationPlanDefinition is deterministic (idempotent upsert key)', function() {
  const first = buildMedicationPlanDefinition({ rxcui: '1049221', name: 'a' });
  const second = buildMedicationPlanDefinition({ rxcui: '1049221', name: 'b' });
  assert.equal(first._id, second._id);
});

test('buildMedicationPlanDefinition tolerates missing fields', function() {
  assert.equal(buildMedicationPlanDefinition({}), null);
  assert.equal(buildMedicationPlanDefinition(null), null);

  const minimal = buildMedicationPlanDefinition({ rxcui: 12345 });
  assert.equal(minimal.id, 'rxnorm-12345');
  assert.equal(minimal.title, 'RxNorm concept 12345');
  assert.equal(minimal.action[0].extension.length, 0);
});

test('buildProcedurePlanDefinition builds a CPT order-set PlanDefinition', function() {
  const planDefinition = buildProcedurePlanDefinition({
    code: '99213',
    name: 'Office or other outpatient visit, established patient'
  });

  assert.equal(planDefinition.id, 'cpt-99213');
  assert.equal(planDefinition.useContext[0].code.code, 'procedures');
  assert.equal(planDefinition.action[0].code[0].coding[0].system, CPT_SYSTEM);
  assert.equal(planDefinition.action[0].definitionCanonical, 'ServiceRequest/cpt-99213');
});

test('buildProcedurePlanDefinition tolerates missing fields', function() {
  assert.equal(buildProcedurePlanDefinition({}), null);
  assert.equal(buildProcedurePlanDefinition(undefined), null);
});

test('flattenCatalogPlanDefinition inverts the builders', function() {
  const planDefinition = buildMedicationPlanDefinition({
    rxcui: '861007',
    name: 'metformin hydrochloride 500 MG Oral Tablet',
    tty: 'SCD'
  });

  const item = flattenCatalogPlanDefinition(planDefinition);
  assert.equal(item.id, 'rxnorm-861007');
  assert.equal(item.code, '861007');
  assert.equal(item.system, RXNORM_SYSTEM);
  assert.equal(item.display, 'metformin hydrochloride 500 MG Oral Tablet');
  assert.equal(item.category, 'medications');
  assert.equal(item.tty, 'SCD');
});

test('flattenCatalogPlanDefinition tolerates sparse documents', function() {
  assert.equal(flattenCatalogPlanDefinition(null), null);

  const sparse = flattenCatalogPlanDefinition({ _id: 'x' });
  assert.equal(sparse.id, 'x');
  assert.equal(sparse.code, '');
  assert.equal(sparse.tty, '');
});
