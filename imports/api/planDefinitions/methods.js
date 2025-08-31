// /imports/api/planDefinitions/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';

import { PlanDefinitions } from '/imports/lib/schemas/SimpleSchemas/PlanDefinitions';

Meteor.methods({
  createPlanDefinition: async function(planDefinitionData) {
    console.log('[createPlanDefinition] Creating new plan definition...');
    check(planDefinitionData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create plan definitions');
    }

    // Clean and prepare the plan definition data
    const cleanPlanDefinition = {
      resourceType: 'PlanDefinition',
      id: Random.id(),
      meta: {
        versionId: '1',
        lastUpdated: new Date()
      }
    };

    // Basic fields
    if (planDefinitionData.url) {
      cleanPlanDefinition.url = planDefinitionData.url;
    }
    if (planDefinitionData.version) {
      cleanPlanDefinition.version = planDefinitionData.version;
    }
    if (planDefinitionData.name) {
      cleanPlanDefinition.name = planDefinitionData.name;
    }
    if (planDefinitionData.title) {
      cleanPlanDefinition.title = planDefinitionData.title;
    }

    // Type
    if (planDefinitionData.type && get(planDefinitionData, 'type.coding[0].code')) {
      cleanPlanDefinition.type = {
        coding: [{
          system: get(planDefinitionData, 'type.coding[0].system', 'http://terminology.hl7.org/CodeSystem/plan-definition-type'),
          code: get(planDefinitionData, 'type.coding[0].code', ''),
          display: get(planDefinitionData, 'type.coding[0].display', '')
        }]
      };
    }

    // Status - Required field
    cleanPlanDefinition.status = get(planDefinitionData, 'status', 'draft');

    // Date
    if (planDefinitionData.date) {
      cleanPlanDefinition.date = planDefinitionData.date;
    }

    // Publisher
    if (planDefinitionData.publisher) {
      cleanPlanDefinition.publisher = planDefinitionData.publisher;
    }

    // Description fields
    if (planDefinitionData.description) {
      cleanPlanDefinition.description = planDefinitionData.description;
    }
    if (planDefinitionData.purpose) {
      cleanPlanDefinition.purpose = planDefinitionData.purpose;
    }
    if (planDefinitionData.usage) {
      cleanPlanDefinition.usage = planDefinitionData.usage;
    }
    if (planDefinitionData.copyright) {
      cleanPlanDefinition.copyright = planDefinitionData.copyright;
    }

    // Review dates
    if (planDefinitionData.approvalDate) {
      cleanPlanDefinition.approvalDate = planDefinitionData.approvalDate;
    }
    if (planDefinitionData.lastReviewDate) {
      cleanPlanDefinition.lastReviewDate = planDefinitionData.lastReviewDate;
    }

    // Effective period
    if (planDefinitionData.effectivePeriod && (get(planDefinitionData, 'effectivePeriod.start') || get(planDefinitionData, 'effectivePeriod.end'))) {
      cleanPlanDefinition.effectivePeriod = {
        start: get(planDefinitionData, 'effectivePeriod.start', ''),
        end: get(planDefinitionData, 'effectivePeriod.end', '')
      };
    }

    // Topics
    if (planDefinitionData.topic && planDefinitionData.topic.length > 0) {
      cleanPlanDefinition.topic = planDefinitionData.topic.filter(t => get(t, 'coding[0].code')).map(topic => ({
        coding: [{
          system: get(topic, 'coding[0].system', 'http://terminology.hl7.org/CodeSystem/definition-topic'),
          code: get(topic, 'coding[0].code', ''),
          display: get(topic, 'coding[0].display', '')
        }]
      }));
    }

    // Contributors
    if (planDefinitionData.author && planDefinitionData.author.length > 0) {
      cleanPlanDefinition.author = planDefinitionData.author.filter(a => a.name).map(author => ({
        name: get(author, 'name', '')
      }));
    }
    if (planDefinitionData.editor && planDefinitionData.editor.length > 0) {
      cleanPlanDefinition.editor = planDefinitionData.editor.filter(e => e.name).map(editor => ({
        name: get(editor, 'name', '')
      }));
    }
    if (planDefinitionData.reviewer && planDefinitionData.reviewer.length > 0) {
      cleanPlanDefinition.reviewer = planDefinitionData.reviewer.filter(r => r.name).map(reviewer => ({
        name: get(reviewer, 'name', '')
      }));
    }
    if (planDefinitionData.endorser && planDefinitionData.endorser.length > 0) {
      cleanPlanDefinition.endorser = planDefinitionData.endorser.filter(e => e.name).map(endorser => ({
        name: get(endorser, 'name', '')
      }));
    }

    // Related artifacts
    if (planDefinitionData.relatedArtifact && planDefinitionData.relatedArtifact.length > 0) {
      cleanPlanDefinition.relatedArtifact = planDefinitionData.relatedArtifact.filter(r => r.type).map(artifact => ({
        type: get(artifact, 'type', 'documentation'),
        display: get(artifact, 'display', ''),
        url: get(artifact, 'url', '')
      }));
    }

    // Goals
    if (planDefinitionData.goal && planDefinitionData.goal.length > 0) {
      cleanPlanDefinition.goal = planDefinitionData.goal.filter(g => get(g, 'description.text')).map(goal => {
        const cleanGoal = {
          description: {
            text: get(goal, 'description.text', '')
          }
        };
        
        if (get(goal, 'category.coding[0].code')) {
          cleanGoal.category = {
            coding: [{
              system: get(goal, 'category.coding[0].system', 'http://terminology.hl7.org/CodeSystem/goal-category'),
              code: get(goal, 'category.coding[0].code', ''),
              display: get(goal, 'category.coding[0].display', '')
            }]
          };
        }
        
        if (get(goal, 'priority.coding[0].code')) {
          cleanGoal.priority = {
            coding: [{
              system: get(goal, 'priority.coding[0].system', 'http://terminology.hl7.org/CodeSystem/goal-priority'),
              code: get(goal, 'priority.coding[0].code', ''),
              display: get(goal, 'priority.coding[0].display', '')
            }]
          };
        }
        
        return cleanGoal;
      });
    }

    // Actions
    if (planDefinitionData.action && planDefinitionData.action.length > 0) {
      cleanPlanDefinition.action = planDefinitionData.action.filter(a => a.title || a.description).map(action => ({
        title: get(action, 'title', ''),
        description: get(action, 'description', ''),
        priority: get(action, 'priority', 'routine')
      }));
    }

    // Notes
    if (get(planDefinitionData, 'note[0].text')) {
      cleanPlanDefinition.note = [{
        text: get(planDefinitionData, 'note[0].text', ''),
        time: new Date(),
        authorString: this.userId
      }];
    }

    // Set _id based on environment variable or default behavior
    if (process.env.USE_MONGO_OBJECTID) {
      const { Mongo } = Package.mongo;
      const objectId = new Mongo.ObjectID();
      cleanPlanDefinition._id = objectId.toHexString();
      console.log('[createPlanDefinition] Using MongoDB ObjectID (as hex string):', cleanPlanDefinition._id);
    } else {
      cleanPlanDefinition._id = cleanPlanDefinition.id;
      console.log('[createPlanDefinition] Using Meteor string ID:', cleanPlanDefinition._id);
    }

    try {
      const planDefinitionId = await PlanDefinitions.insertAsync(cleanPlanDefinition);
      console.log('[createPlanDefinition] Plan definition created with ID:', planDefinitionId);
      return planDefinitionId;
    } catch (error) {
      console.error('[createPlanDefinition] Error:', error);
      throw new Meteor.Error('insert-failed', 'Failed to create plan definition: ' + error.message);
    }
  },

  updatePlanDefinition: async function(planDefinitionId, planDefinitionData) {
    console.log('[updatePlanDefinition] Updating plan definition:', planDefinitionId);
    check(planDefinitionId, String);
    check(planDefinitionData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update plan definitions');
    }

    // Find existing plan definition
    const existingPlanDefinition = await PlanDefinitions.findOneAsync({ _id: planDefinitionId });
    if (!existingPlanDefinition) {
      throw new Meteor.Error('not-found', 'Plan definition not found');
    }

    // Build update object
    const updateData = {
      meta: {
        versionId: String(parseInt(get(existingPlanDefinition, 'meta.versionId', '1')) + 1),
        lastUpdated: new Date()
      }
    };

    // Basic fields
    if (planDefinitionData.url !== undefined) {
      updateData.url = planDefinitionData.url;
    }
    if (planDefinitionData.version !== undefined) {
      updateData.version = planDefinitionData.version;
    }
    if (planDefinitionData.name !== undefined) {
      updateData.name = planDefinitionData.name;
    }
    if (planDefinitionData.title !== undefined) {
      updateData.title = planDefinitionData.title;
    }

    // Type
    if (planDefinitionData.type) {
      updateData.type = {
        coding: [{
          system: get(planDefinitionData, 'type.coding[0].system', 'http://terminology.hl7.org/CodeSystem/plan-definition-type'),
          code: get(planDefinitionData, 'type.coding[0].code', ''),
          display: get(planDefinitionData, 'type.coding[0].display', '')
        }]
      };
    }

    // Status
    if (planDefinitionData.status !== undefined) {
      updateData.status = planDefinitionData.status;
    }

    // Date
    if (planDefinitionData.date !== undefined) {
      updateData.date = planDefinitionData.date;
    }

    // Publisher
    if (planDefinitionData.publisher !== undefined) {
      updateData.publisher = planDefinitionData.publisher;
    }

    // Description fields
    if (planDefinitionData.description !== undefined) {
      updateData.description = planDefinitionData.description;
    }
    if (planDefinitionData.purpose !== undefined) {
      updateData.purpose = planDefinitionData.purpose;
    }
    if (planDefinitionData.usage !== undefined) {
      updateData.usage = planDefinitionData.usage;
    }
    if (planDefinitionData.copyright !== undefined) {
      updateData.copyright = planDefinitionData.copyright;
    }

    // Review dates
    if (planDefinitionData.approvalDate !== undefined) {
      updateData.approvalDate = planDefinitionData.approvalDate;
    }
    if (planDefinitionData.lastReviewDate !== undefined) {
      updateData.lastReviewDate = planDefinitionData.lastReviewDate;
    }

    // Effective period
    if (planDefinitionData.effectivePeriod !== undefined) {
      updateData.effectivePeriod = {
        start: get(planDefinitionData, 'effectivePeriod.start', ''),
        end: get(planDefinitionData, 'effectivePeriod.end', '')
      };
    }

    // Topics
    if (planDefinitionData.topic !== undefined) {
      updateData.topic = planDefinitionData.topic.filter(t => get(t, 'coding[0].code')).map(topic => ({
        coding: [{
          system: get(topic, 'coding[0].system', 'http://terminology.hl7.org/CodeSystem/definition-topic'),
          code: get(topic, 'coding[0].code', ''),
          display: get(topic, 'coding[0].display', '')
        }]
      }));
    }

    // Contributors
    if (planDefinitionData.author !== undefined) {
      updateData.author = planDefinitionData.author.filter(a => a.name).map(author => ({
        name: get(author, 'name', '')
      }));
    }
    if (planDefinitionData.editor !== undefined) {
      updateData.editor = planDefinitionData.editor.filter(e => e.name).map(editor => ({
        name: get(editor, 'name', '')
      }));
    }
    if (planDefinitionData.reviewer !== undefined) {
      updateData.reviewer = planDefinitionData.reviewer.filter(r => r.name).map(reviewer => ({
        name: get(reviewer, 'name', '')
      }));
    }
    if (planDefinitionData.endorser !== undefined) {
      updateData.endorser = planDefinitionData.endorser.filter(e => e.name).map(endorser => ({
        name: get(endorser, 'name', '')
      }));
    }

    // Related artifacts
    if (planDefinitionData.relatedArtifact !== undefined) {
      updateData.relatedArtifact = planDefinitionData.relatedArtifact.filter(r => r.type).map(artifact => ({
        type: get(artifact, 'type', 'documentation'),
        display: get(artifact, 'display', ''),
        url: get(artifact, 'url', '')
      }));
    }

    // Goals
    if (planDefinitionData.goal !== undefined) {
      updateData.goal = planDefinitionData.goal.filter(g => get(g, 'description.text')).map(goal => {
        const cleanGoal = {
          description: {
            text: get(goal, 'description.text', '')
          }
        };
        
        if (get(goal, 'category.coding[0].code')) {
          cleanGoal.category = {
            coding: [{
              system: get(goal, 'category.coding[0].system', 'http://terminology.hl7.org/CodeSystem/goal-category'),
              code: get(goal, 'category.coding[0].code', ''),
              display: get(goal, 'category.coding[0].display', '')
            }]
          };
        }
        
        if (get(goal, 'priority.coding[0].code')) {
          cleanGoal.priority = {
            coding: [{
              system: get(goal, 'priority.coding[0].system', 'http://terminology.hl7.org/CodeSystem/goal-priority'),
              code: get(goal, 'priority.coding[0].code', ''),
              display: get(goal, 'priority.coding[0].display', '')
            }]
          };
        }
        
        return cleanGoal;
      });
    }

    // Actions
    if (planDefinitionData.action !== undefined) {
      updateData.action = planDefinitionData.action.filter(a => a.title || a.description).map(action => ({
        title: get(action, 'title', ''),
        description: get(action, 'description', ''),
        priority: get(action, 'priority', 'routine')
      }));
    }

    // Notes
    if (get(planDefinitionData, 'note[0].text')) {
      updateData.note = [{
        text: get(planDefinitionData, 'note[0].text', ''),
        time: new Date(),
        authorString: this.userId
      }];
    }

    try {
      const result = await PlanDefinitions.updateAsync(
        { _id: planDefinitionId },
        { $set: updateData }
      );
      console.log('[updatePlanDefinition] Update result:', result);
      return planDefinitionId;
    } catch (error) {
      console.error('[updatePlanDefinition] Error:', error);
      throw new Meteor.Error('update-failed', 'Failed to update plan definition: ' + error.message);
    }
  },

  removePlanDefinition: async function(planDefinitionId) {
    console.log('[removePlanDefinition] Removing plan definition:', planDefinitionId);
    check(planDefinitionId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove plan definitions');
    }

    // Check if plan definition exists
    const planDefinition = await PlanDefinitions.findOneAsync({ _id: planDefinitionId });
    if (!planDefinition) {
      throw new Meteor.Error('not-found', 'Plan definition not found');
    }

    try {
      const result = await PlanDefinitions.removeAsync({ _id: planDefinitionId });
      console.log('[removePlanDefinition] Remove result:', result);
      return result;
    } catch (error) {
      console.error('[removePlanDefinition] Error:', error);
      throw new Meteor.Error('remove-failed', 'Failed to remove plan definition: ' + error.message);
    }
  }
});