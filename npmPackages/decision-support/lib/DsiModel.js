// npmPackages/decision-support/lib/DsiModel.js
//
// PlanDefinition <-> compact-DSI builders + plain-language getters for
// evidence-based Decision Support Interventions (§ 170.315(b)(11)).
//
// A DSI is a FHIR PlanDefinition (type eca-rule):
//   - action[0].condition[0].expression  → JSON criteria (see lib/criteria.js)
//   - relatedArtifact (citation/documentation) → bibliographic citation + funding
//   - publisher / author → developer + contact      (source attr 2)
//   - approvalDate / lastReviewDate / date → release & revision dates (attr 4)
//   - dsi-source-attributes extension → funding + which demographic/SDOH and
//     USCDI data categories the intervention USES ("indicate when used")
// Isomorphic (client + server), lodash only.

import { get } from 'lodash';
import { DSI_SOURCE_ATTR_EXTENSION_URL, DSI_CRITERIA_EXPRESSION_LANGUAGE } from './sourceAttributes.js';

// ---- build ----

// input: {
//   id?, title, description, status ('active'|'draft'|'retired'),
//   developer, publisher, contactEmail, fundingSource,
//   bibliographicCitation, citationUrl, releaseDate, revisionDate,
//   criteria (JSON), usesSourceAttributes (string[]), usesDataCategories (string[]),
//   action: { title, description, message }
// }
export function buildPlanDefinition(input) {
  const id = get(input, 'id') || undefined;
  const relatedArtifact = [];
  if (get(input, 'bibliographicCitation')) {
    relatedArtifact.push({
      type: 'citation',
      label: 'Bibliographic citation',
      citation: get(input, 'bibliographicCitation'),
      document: get(input, 'citationUrl') ? { url: get(input, 'citationUrl') } : undefined
    });
  }
  if (get(input, 'fundingSource')) {
    relatedArtifact.push({
      type: 'documentation',
      label: 'Funding source',
      display: get(input, 'fundingSource')
    });
  }

  const action = [{
    title: get(input, 'action.title', get(input, 'title', '')),
    description: get(input, 'action.description', get(input, 'action.message', '')),
    condition: [{
      kind: 'applicability',
      expression: {
        language: DSI_CRITERIA_EXPRESSION_LANGUAGE,
        expression: JSON.stringify(get(input, 'criteria', {}))
      }
    }],
    dynamicValue: get(input, 'action.message') ? [{
      path: 'message',
      expression: { language: 'text/plain', expression: get(input, 'action.message') }
    }] : undefined
  }];

  const sourceAttrExtension = {
    url: DSI_SOURCE_ATTR_EXTENSION_URL,
    extension: [
      { url: 'developer', valueString: get(input, 'developer', '') },
      { url: 'fundingSource', valueString: get(input, 'fundingSource', '') },
      { url: 'bibliographicCitation', valueString: get(input, 'bibliographicCitation', '') },
      { url: 'usesSourceAttributes', valueString: (get(input, 'usesSourceAttributes', []) || []).join(',') },
      { url: 'usesDataCategories', valueString: (get(input, 'usesDataCategories', []) || []).join(',') }
    ]
  };

  return {
    resourceType: 'PlanDefinition',
    id: id,
    _id: id,
    url: get(input, 'url'),
    name: get(input, 'name', get(input, 'title')),
    title: get(input, 'title'),
    status: get(input, 'status', 'draft'),
    type: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/plan-definition-type',
        code: 'eca-rule',
        display: 'ECA Rule'
      }]
    },
    date: get(input, 'revisionDate', get(input, 'releaseDate')),
    version: get(input, 'version'),
    publisher: get(input, 'publisher', get(input, 'developer')),
    author: get(input, 'developer') ? [{
      name: get(input, 'developer'),
      telecom: get(input, 'contactEmail') ? [{ system: 'email', value: get(input, 'contactEmail') }] : undefined
    }] : undefined,
    description: get(input, 'description'),
    purpose: get(input, 'purpose'),
    approvalDate: get(input, 'releaseDate'),
    lastReviewDate: get(input, 'revisionDate'),
    relatedArtifact: relatedArtifact.length ? relatedArtifact : undefined,
    action: action,
    extension: [sourceAttrExtension]
  };
}

// ---- read ----

export function getCriteria(planDefinition) {
  const expr = get(planDefinition, 'action.0.condition.0.expression.expression');
  if (!expr) return {};
  try {
    return JSON.parse(expr);
  } catch (error) {
    console.error('[decision-support] failed to parse DSI criteria:', get(error, 'message'));
    return {};
  }
}

function readSourceAttrExt(planDefinition) {
  const ext = get(planDefinition, 'extension', []).find(function(e) {
    return get(e, 'url') === DSI_SOURCE_ATTR_EXTENSION_URL;
  });
  const map = {};
  get(ext, 'extension', []).forEach(function(e) { map[get(e, 'url')] = get(e, 'valueString', ''); });
  return map;
}

function csvToArray(value) {
  return String(value || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
}

// Plain-language source attributes (criterion (iv)/(v)). "Unknown" when absent.
export function getSourceAttributes(planDefinition) {
  const ext = readSourceAttrExt(planDefinition);
  const citationArtifact = get(planDefinition, 'relatedArtifact', []).find(function(a) {
    return get(a, 'type') === 'citation';
  });
  const unknown = function(v) { return v && String(v).length ? v : 'Unknown'; };
  return {
    bibliographicCitation: unknown(get(ext, 'bibliographicCitation') || get(citationArtifact, 'citation')),
    citationUrl: get(citationArtifact, 'document.url', ''),
    developer: unknown(get(ext, 'developer') || get(planDefinition, 'publisher')),
    fundingSource: unknown(get(ext, 'fundingSource')),
    releaseDate: unknown(get(planDefinition, 'approvalDate')),
    revisionDate: unknown(get(planDefinition, 'lastReviewDate')),
    usesSourceAttributes: csvToArray(get(ext, 'usesSourceAttributes')),
    usesDataCategories: csvToArray(get(ext, 'usesDataCategories'))
  };
}

export function getActionMessage(planDefinition) {
  return get(planDefinition, 'action.0.dynamicValue.0.expression.expression',
    get(planDefinition, 'action.0.description', get(planDefinition, 'title', '')));
}

export function isActive(planDefinition) {
  return get(planDefinition, 'status') === 'active';
}
