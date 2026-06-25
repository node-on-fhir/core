// npmPackages/decision-support/lib/evaluator.js
//
// Evaluate active DSI PlanDefinitions against an order/patient context.
// Returns the matched interventions with their action message + source
// attributes, for both the synchronous pre-submit alert and the after-insert
// hook. Isomorphic (pure), lodash only.

import { get } from 'lodash';
import { matchCriteria } from './criteria.js';
import { getCriteria, getActionMessage, getSourceAttributes, isActive } from './DsiModel.js';

// activeInterventions: PlanDefinition[]  (caller filters to status active)
// context: { serviceRequest, bundle, referenceYear? }
export function evaluateInterventions(activeInterventions, context) {
  const matched = [];
  (activeInterventions || []).forEach(function(dsi) {
    if (!isActive(dsi)) return;
    const criteria = getCriteria(dsi);
    const result = matchCriteria(criteria, context);
    if (result.matched) {
      matched.push({
        interventionId: get(dsi, '_id', get(dsi, 'id')),
        title: get(dsi, 'title'),
        message: getActionMessage(dsi),
        reasons: result.reasons,
        sourceAttributes: getSourceAttributes(dsi)
      });
    }
  });
  return matched;
}
