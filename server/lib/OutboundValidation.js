// server/lib/OutboundValidation.js
// Single shared egress-validation helper. Channels: 'rest', 'bulkExport',
// 'relay'. Policy per channel from settings; absent keys mean 'off' so
// deployments without config keep today's behavior exactly.
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import FhirValidator from '/imports/lib/FhirValidator.js';

const VALID_MODES = ['off', 'warn', 'annotate', 'block'];

export function getEgressPolicy(channel) {
  const mode = get(Meteor, 'settings.private.fhir.schemaValidation.egress.' + channel, 'off');
  if (!VALID_MODES.includes(mode)) {
    console.warn('[OutboundValidation] invalid egress mode "' + mode + '" for channel ' + channel + ' - treating as off');
    return 'off';
  }
  return mode;
}

export function validateOutbound(resource, channel) {
  const policy = getEgressPolicy(channel);
  if (policy === 'off') {
    return { action: 'pass' };
  }
  const result = FhirValidator.validateResource(resource);
  if (result.valid) {
    return { action: 'pass' };
  }
  const operationOutcome = FhirValidator.toOperationOutcome(result.errors, resource);
  console.warn('[OutboundValidation] channel=' + channel + ' policy=' + policy + ' ' +
    get(resource, 'resourceType', '?') + '/' + get(resource, 'id', '?') +
    ' failed schema validation (' + result.errors.length + ' issue(s))');
  if (policy === 'warn') { return { action: 'pass', operationOutcome: operationOutcome }; }
  if (policy === 'annotate') { return { action: 'annotate', operationOutcome: operationOutcome }; }
  return { action: 'block', operationOutcome: operationOutcome };
}

export function annotateResource(resource) {
  const annotated = JSON.parse(JSON.stringify(resource));
  if (!annotated.meta) { annotated.meta = {}; }
  if (!Array.isArray(annotated.meta.tag)) { annotated.meta.tag = []; }
  annotated.meta.tag.push({
    system: 'http://hl7.org/fhir/tools/CodeSystem/validation-status',
    code: 'validation-failed'
  });
  return annotated;
}
