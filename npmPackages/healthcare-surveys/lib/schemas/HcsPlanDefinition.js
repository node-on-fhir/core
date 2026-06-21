// packages/healthcare-surveys/lib/schemas/HcsPlanDefinition.js

import SimpleSchema from 'simpl-schema';
import { BaseSchema } from 'meteor/clinical:hl7-resource-datatypes';
import { PlanDefinitionSchema } from 'meteor/clinical:hl7-fhir-resources';

// Define action codes from US-PH-PlanDefinition-Action
const HCS_PLANDEFINITION_ACTION_CODES = {
  START_WORKFLOW: 'start-workflow',
  CHECK_REPORTABILITY: 'check-reportability',
  EXECUTE_REPORTING_WORKFLOW: 'execute-reporting-workflow',
  CREATE_REPORT: 'create-report',
  VALIDATE_REPORT: 'validate-report',
  SUBMIT_REPORT: 'submit-report',
  COMPLETE_REPORTING: 'complete-reporting'
};

// Extend the base PlanDefinition schema
const HcsPlanDefinitionSchema = globalThis.HcsPlanDefinitionSchema = new SimpleSchema([
  PlanDefinitionSchema,
  {
    // Required actions per the profile
    'action': {
      type: Array,
      minCount: 5 // Profile requires 5 specific action slices
    },
    'action.$': {
      type: Object
    },
    'action.$.id': {
      type: String
    },
    'action.$.code': {
      type: Array,
      minCount: 1
    },
    'action.$.code.$': {
      type: Object
    },
    'action.$.code.$.coding': {
      type: Array,
      minCount: 1
    },
    'action.$.code.$.coding.$': {
      type: Object
    },
    'action.$.code.$.coding.$.system': {
      type: String,
      defaultValue: 'http://hl7.org/fhir/us/ph-library/CodeSystem/us-ph-plandefinition-actions'
    },
    'action.$.code.$.coding.$.code': {
      type: String
    },
    'action.$.trigger': {
      type: Array,
      optional: true
    },
    'action.$.trigger.$': {
      type: Object
    },
    'action.$.trigger.$.type': {
      type: String
    },
    'action.$.trigger.$.name': {
      type: String,
      optional: true
    },
    'action.$.condition': {
      type: Array,
      optional: true
    },
    'action.$.condition.$': {
      type: Object
    },
    'action.$.relatedAction': {
      type: Array,
      optional: true
    },
    'action.$.relatedAction.$': {
      type: Object
    },
    'action.$.relatedAction.$.actionId': {
      type: String
    },
    'action.$.relatedAction.$.relationship': {
      type: String,
      allowedValues: ['before', 'after', 'concurrent', 'concurrent-with-start', 'concurrent-with-end']
    },
    'action.$.input': {
      type: Array,
      optional: true
    },
    'action.$.input.$': {
      type: Object
    },
    'action.$.output': {
      type: Array,
      optional: true
    },
    'action.$.output.$': {
      type: Object
    },
    'action.$.action': {
      type: Array,
      optional: true // For nested actions
    }
  }
]);

// Add validation for required action structure
HcsPlanDefinitionSchema.addValidator(function() {
  const actions = this.value.action || [];
  
  // Check for required action codes
  const requiredActionIds = [
    'start-workflow',
    'execute-reporting-workflow',
    'create-report',
    'validate-report',
    'submit-hcs-report'
  ];
  
  const actionIds = actions.map(a => a.id);
  
  for (const reqId of requiredActionIds) {
    if (!actionIds.includes(reqId)) {
      return `Required action missing: ${reqId}`;
    }
  }
  
  // Validate start-workflow has encounter-end trigger
  const startWorkflow = actions.find(a => a.id === 'start-workflow');
  if (startWorkflow && (!startWorkflow.trigger || !startWorkflow.trigger.some(t => t.name === 'encounter-end'))) {
    return 'start-workflow action must have encounter-end trigger';
  }
});

// Create collection
const HcsPlanDefinition = globalThis.HcsPlanDefinition = new Mongo.Collection('HcsPlanDefinition');
HcsPlanDefinition.attachSchema(HcsPlanDefinitionSchema);

// Export
export { HcsPlanDefinition, HcsPlanDefinitionSchema, HCS_PLANDEFINITION_ACTION_CODES };