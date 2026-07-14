// npmPackages/order-catalog/lib/CatalogPlanDefinitionBuilder.js
//
// Pure builders that turn terminology-service search results (RxNorm concepts
// from RxNav, CPT concepts from the UMLS REST API) into catalog PlanDefinitions,
// plus the inverse flattener the CPOE pages consume.
//
// Follows the catalog convention established by server/RadiologyCatalogInitializer.js:
// one PlanDefinition per orderable — type: order-set, a useContext code marking the
// catalog domain, and a single action carrying the coding + metadata extensions.
//
// Deliberately dependency-free CommonJS so it runs on the bare-checkout
// `node --test` lib tier (no lodash, no Meteor).

'use strict';

const EXTENSION_BASE = 'http://honeycomb3.io/fhir/StructureDefinition/';

const RXNORM_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';
const CPT_SYSTEM = 'http://www.ama-assn.org/go/cpt';
const PLAN_DEFINITION_TYPE_SYSTEM = 'http://terminology.hl7.org/CodeSystem/plan-definition-type';
const USAGE_CONTEXT_TYPE_SYSTEM = 'http://terminology.hl7.org/CodeSystem/usage-context-type';

// Catalog domains → the useContext.code.code each PlanDefinition is tagged
// (and later queried) with. 'imaging' is what RadiologyCatalogInitializer uses.
const CATALOG_USE_CONTEXTS = {
  medication: 'medications',
  procedure: 'procedures',
  imaging: 'imaging'
};

function dig(object, path, defaultValue) {
  let current = object;
  for (const key of path) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = current[key];
  }
  return (current === null || current === undefined) ? defaultValue : current;
}

function baseCatalogPlanDefinition(options) {
  return {
    resourceType: 'PlanDefinition',
    id: options.id,
    _id: options.id,

    identifier: [{
      system: options.system,
      value: options.code,
      use: 'official'
    }],

    status: 'active',
    name: options.id,
    title: options.display,
    description: options.description || options.display,
    date: new Date().toISOString(),
    publisher: 'Honeycomb EHR',

    type: {
      coding: [{
        system: PLAN_DEFINITION_TYPE_SYSTEM,
        code: 'order-set',
        display: 'Order Set'
      }]
    },

    useContext: [{
      code: {
        system: USAGE_CONTEXT_TYPE_SYSTEM,
        code: options.useContextCode,
        display: options.useContextDisplay
      },
      valueCodeableConcept: {
        text: options.useContextDisplay
      }
    }],

    topic: [{
      coding: [{
        system: options.system,
        code: options.code,
        display: options.display
      }],
      text: options.display
    }],

    action: [{
      title: 'Order ' + options.display,
      description: options.description || options.display,
      code: [{
        coding: [{
          system: options.system,
          code: options.code,
          display: options.display
        }]
      }],
      definitionCanonical: options.definitionCanonical,
      extension: []
    }]
  };
}

// Build a medication-catalog PlanDefinition from an RxNorm concept
// ({ rxcui, name, tty, synonym? }, as returned by orderCatalog.searchRxNorm).
// Deterministic ids (rxnorm-{rxcui}) keep hydration idempotent — re-fetching
// upserts rather than duplicating.
function buildMedicationPlanDefinition(concept) {
  const rxcui = String(dig(concept, ['rxcui'], '')).trim();
  if (!rxcui) {
    return null;
  }
  const name = dig(concept, ['name'], 'RxNorm concept ' + rxcui);
  const tty = dig(concept, ['tty'], '');

  const planDefinition = baseCatalogPlanDefinition({
    id: 'rxnorm-' + rxcui,
    system: RXNORM_SYSTEM,
    code: rxcui,
    display: name,
    description: dig(concept, ['synonym'], '') || name,
    useContextCode: CATALOG_USE_CONTEXTS.medication,
    useContextDisplay: 'Medications',
    definitionCanonical: 'MedicationRequest/rxnorm-' + rxcui
  });

  if (tty) {
    planDefinition.action[0].extension.push({
      url: EXTENSION_BASE + 'rxnorm-tty',
      valueString: tty
    });
  }

  return planDefinition;
}

// Build a procedure-catalog PlanDefinition from a CPT concept
// ({ code, name }, as returned by orderCatalog.searchCptCodes).
function buildProcedurePlanDefinition(concept) {
  const code = String(dig(concept, ['code'], '')).trim();
  if (!code) {
    return null;
  }
  const name = dig(concept, ['name'], 'CPT ' + code);

  return baseCatalogPlanDefinition({
    id: 'cpt-' + code,
    system: CPT_SYSTEM,
    code: code,
    display: name,
    description: name,
    useContextCode: CATALOG_USE_CONTEXTS.procedure,
    useContextDisplay: 'Procedures',
    definitionCanonical: 'ServiceRequest/cpt-' + code
  });
}

// Inverse: flatten a catalog PlanDefinition to the flat item shape the CPOE
// pages consume ({ id, code, system, display, ... }).
function flattenCatalogPlanDefinition(planDefinition) {
  if (!planDefinition) {
    return null;
  }

  const coding = dig(planDefinition, ['action', 0, 'code', 0, 'coding', 0], {});
  const extensions = dig(planDefinition, ['action', 0, 'extension'], []);

  function extensionValue(suffix) {
    const found = extensions.find(function(extension) {
      return dig(extension, ['url'], '') === EXTENSION_BASE + suffix;
    });
    return found ? (found.valueString || found.valueCode || dig(found, ['valueCodeableConcept', 'text'], '')) : '';
  }

  return {
    id: dig(planDefinition, ['id'], dig(planDefinition, ['_id'], '')),
    code: dig(coding, ['code'], ''),
    system: dig(coding, ['system'], ''),
    display: dig(planDefinition, ['title'], dig(coding, ['display'], '')),
    longName: dig(planDefinition, ['description'], ''),
    category: dig(planDefinition, ['useContext', 0, 'code', 'code'], ''),
    tty: extensionValue('rxnorm-tty')
  };
}

module.exports = {
  CATALOG_USE_CONTEXTS,
  RXNORM_SYSTEM,
  CPT_SYSTEM,
  buildMedicationPlanDefinition,
  buildProcedurePlanDefinition,
  flattenCatalogPlanDefinition
};
