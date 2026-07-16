// imports/api/rxnorm/rxnormLogic.js
//
// Pure RxNorm/RxClass parsing and matching logic. Plain CJS, zero deps, no
// Meteor imports -- testable with plain `node --test` against recorded RxNav
// JSON fixtures (WorkflowNavigation.js precedent). The network/cache layer
// lives in rxnavClient.js; the Meteor methods in methods.js.

const RXNORM_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';

// --------------------------------------------------------------------------
// RxNav response parsing

// GET /rxcui.json?name=...&search=2
// -> { idGroup: { rxnormId: ['617310'] } }
function parseRxcuiLookupResponse(json) {
  const ids = json && json.idGroup && json.idGroup.rxnormId;
  return Array.isArray(ids) && ids.length ? String(ids[0]) : null;
}

// GET /rxcui/{id}/properties.json
// -> { properties: { rxcui, name, tty } }
function parsePropertiesResponse(json) {
  const properties = json && json.properties;
  if (!properties || !properties.rxcui) {
    return null;
  }
  return {
    rxcui: String(properties.rxcui),
    name: properties.name || '',
    tty: properties.tty || ''
  };
}

// GET /rxcui/{id}/related.json?tty=IN+MIN
// -> { relatedGroup: { conceptGroup: [{ tty, conceptProperties: [...] }] } }
// Returns [{ rxcui, name }] of ingredient (IN/MIN) concepts.
function parseRelatedResponse(json) {
  const groups = (json && json.relatedGroup && json.relatedGroup.conceptGroup) || [];
  const ingredients = [];
  groups.forEach(function(group) {
    const concepts = group && Array.isArray(group.conceptProperties) ? group.conceptProperties : [];
    concepts.forEach(function(concept) {
      if (concept && concept.rxcui) {
        ingredients.push({ rxcui: String(concept.rxcui), name: concept.name || '' });
      }
    });
  });
  return ingredients;
}

// GET /rxclass/class/byRxcui.json?rxcui=...
// -> { rxclassDrugInfoList: { rxclassDrugInfo: [{ rxclassMinConceptItem, rela, relaSource }] } }
// Returns [{ classId, className, classType, relaSource, rela }], de-duplicated.
function parseClassResponse(json) {
  const infos = (json && json.rxclassDrugInfoList && json.rxclassDrugInfoList.rxclassDrugInfo) || [];
  const seen = {};
  const classes = [];
  infos.forEach(function(info) {
    const item = info && info.rxclassMinConceptItem;
    if (!item || !item.classId) {
      return;
    }
    const key = item.classId + '|' + (info.rela || '');
    if (seen[key]) {
      return;
    }
    seen[key] = true;
    classes.push({
      classId: item.classId,
      className: item.className || '',
      classType: item.classType || '',
      relaSource: info.relaSource || '',
      rela: info.rela || ''
    });
  });
  return classes;
}

// --------------------------------------------------------------------------
// Medication coding extraction (mirror of pacio-core's
// MedicationReconciliation.extractMedicationCodings, kept local so this
// host-app module has no cross-package dependency)

function extractMedicationCodings(resource) {
  const concept = resource && resource.medicationCodeableConcept;
  const codings = concept && Array.isArray(concept.coding) ? concept.coding : [];
  return codings.filter(function(coding) {
    return coding && coding.code;
  });
}

function getMedicationDisplay(resource) {
  const concept = resource && resource.medicationCodeableConcept;
  if (concept && concept.text) {
    return concept.text;
  }
  const codings = extractMedicationCodings(resource);
  if (codings.length && codings[0].display) {
    return codings[0].display;
  }
  const reference = resource && resource.medicationReference;
  if (reference && reference.display) {
    return reference.display;
  }
  return 'Unknown Medication';
}

// --------------------------------------------------------------------------
// Matching: statements vs requests by RxCUI, then by shared ingredient

// entries: [{ resourceId, rxcui, ingredients: [{ rxcui, name }] }]
// Returns [{ statementId, requestId, via: 'rxcui'|'ingredient', ingredientName }]
function matchByRxcuiOrIngredient(statementEntries, requestEntries) {
  const matches = [];
  const usedRequestIds = {};

  (statementEntries || []).forEach(function(statement) {
    let matched = null;

    (requestEntries || []).forEach(function(request) {
      if (matched || usedRequestIds[request.resourceId]) {
        return;
      }
      if (statement.rxcui && request.rxcui && statement.rxcui === request.rxcui) {
        matched = { requestId: request.resourceId, via: 'rxcui', ingredientName: '' };
        return;
      }
      const statementIngredients = statement.ingredients || [];
      const requestIngredients = request.ingredients || [];
      const shared = statementIngredients.find(function(ingredient) {
        return requestIngredients.some(function(other) {
          return other.rxcui === ingredient.rxcui;
        });
      });
      if (shared) {
        matched = { requestId: request.resourceId, via: 'ingredient', ingredientName: shared.name };
      }
    });

    if (matched) {
      usedRequestIds[matched.requestId] = true;
      matches.push({
        statementId: statement.resourceId,
        requestId: matched.requestId,
        via: matched.via,
        ingredientName: matched.ingredientName
      });
    }
  });

  return matches;
}

// --------------------------------------------------------------------------
// Duplicate-ingredient detection (the safety signal that replaced DDI after
// NLM retired the RxNav Drug Interaction API in January 2024)

// entries: [{ resourceId, ingredients: [{ rxcui, name }] }]
// Returns [{ ingredientRxcui, ingredientName, memberIds: [resourceId...] }]
// for ingredients shared by 2+ distinct resources.
function findDuplicateIngredients(entries) {
  const byIngredient = {};
  (entries || []).forEach(function(entry) {
    const seenForEntry = {};
    (entry.ingredients || []).forEach(function(ingredient) {
      if (!ingredient.rxcui || seenForEntry[ingredient.rxcui]) {
        return;
      }
      seenForEntry[ingredient.rxcui] = true;
      if (!byIngredient[ingredient.rxcui]) {
        byIngredient[ingredient.rxcui] = { name: ingredient.name, memberIds: [] };
      }
      byIngredient[ingredient.rxcui].memberIds.push(entry.resourceId);
    });
  });

  return Object.keys(byIngredient).filter(function(rxcui) {
    return byIngredient[rxcui].memberIds.length >= 2;
  }).map(function(rxcui) {
    return {
      ingredientRxcui: rxcui,
      ingredientName: byIngredient[rxcui].name,
      memberIds: byIngredient[rxcui].memberIds
    };
  });
}

// --------------------------------------------------------------------------
// Allergy-class matching (HEURISTIC, demo-grade)
//
// This is deliberate string/alias matching of RxClass class names against
// AllergyIntolerance display text -- NOT a real SNOMED<->MED-RT ontology
// mapping. Good enough to flag "lisinopril is an ACE inhibitor" against a
// documented "Substance with angiotensin-converting enzyme inhibitor
// mechanism of action" allergy; not clinical-decision-support grade.

const CLASS_ALIAS_GROUPS = [
  ['ace inhibitor', 'angiotensin converting enzyme inhibitor'],
  ['arb', 'angiotensin ii receptor blocker', 'angiotensin receptor blocker', 'angiotensin ii receptor antagonist'],
  ['nsaid', 'nonsteroidal anti inflammatory drug', 'nonsteroidal antiinflammatory drug', 'non steroidal anti inflammatory agent'],
  ['statin', 'hmg coa reductase inhibitor'],
  ['sulfa', 'sulfonamide'],
  ['penicillin', 'penicillins'],
  ['opioid', 'opioid agonist', 'opioid analgesic'],
  ['benzodiazepine', 'benzodiazepines'],
  ['beta blocker', 'beta adrenergic blocker', 'beta adrenergic receptor antagonist']
];

function normalizeClassText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Returns the alias-group indexes a normalized text hits.
function aliasGroupsFor(normalizedText) {
  const groups = [];
  CLASS_ALIAS_GROUPS.forEach(function(aliases, index) {
    const hit = aliases.some(function(alias) {
      return normalizedText.indexOf(alias) !== -1;
    });
    if (hit) {
      groups.push(index);
    }
  });
  return groups;
}

// conceptEntries: [{ resourceId, display, classes: [{ className, ... }] }]
// allergies: [{ resourceId, display }]  (display = code.text or coding display)
// Returns [{ resourceId, medDisplay, className, allergyDisplay }]
function matchAllergyClasses(conceptEntries, allergies) {
  const warnings = [];
  const seen = {};

  (allergies || []).forEach(function(allergy) {
    const allergyText = normalizeClassText(allergy.display);
    if (!allergyText) {
      return;
    }
    const allergyGroups = aliasGroupsFor(allergyText);

    (conceptEntries || []).forEach(function(entry) {
      (entry.classes || []).forEach(function(medicationClass) {
        const classText = normalizeClassText(medicationClass.className);
        if (!classText) {
          return;
        }
        const substringHit = allergyText.indexOf(classText) !== -1 || classText.indexOf(allergyText) !== -1;
        const aliasHit = aliasGroupsFor(classText).some(function(groupIndex) {
          return allergyGroups.indexOf(groupIndex) !== -1;
        });
        if (!substringHit && !aliasHit) {
          return;
        }
        const key = entry.resourceId + '|' + allergy.resourceId;
        if (seen[key]) {
          return;
        }
        seen[key] = true;
        warnings.push({
          resourceId: entry.resourceId,
          medDisplay: entry.display,
          className: medicationClass.className,
          allergyDisplay: allergy.display
        });
      });
    });
  });

  return warnings;
}

module.exports = {
  RXNORM_SYSTEM: RXNORM_SYSTEM,
  parseRxcuiLookupResponse: parseRxcuiLookupResponse,
  parsePropertiesResponse: parsePropertiesResponse,
  parseRelatedResponse: parseRelatedResponse,
  parseClassResponse: parseClassResponse,
  extractMedicationCodings: extractMedicationCodings,
  getMedicationDisplay: getMedicationDisplay,
  matchByRxcuiOrIngredient: matchByRxcuiOrIngredient,
  findDuplicateIngredients: findDuplicateIngredients,
  matchAllergyClasses: matchAllergyClasses,
  normalizeClassText: normalizeClassText
};
