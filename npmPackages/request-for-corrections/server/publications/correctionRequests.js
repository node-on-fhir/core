// packages/request-for-corrections/server/publications/correctionRequests.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { CorrectionRequests } from '../../lib/collections/CorrectionRequests';
import { CorrectionTasks } from '../../lib/collections/CorrectionTasks';
import { CorrectionCommunications } from '../../lib/collections/CorrectionCommunications';

const log = (Meteor.Logger ? Meteor.Logger.for('correctionRequests') : console);

// Publish correction requests for a specific patient (as patient or practitioner)
Meteor.publish('correctionRequests.patient', function(patientId) {
  log.debug('[correctionRequests.patient] Starting publication for patient:', { patientId });
  const startTime = Date.now();
  
  check(patientId, Match.Maybe(String));
  
  if (!this.userId) {
    console.log('[correctionRequests.patient] No userId, returning ready'); // phi-audit: ok
    return this.ready();
  }
  
  if (!patientId) {
    console.log('[correctionRequests.patient] No patientId, returning ready'); // phi-audit: ok
    return this.ready();
  }
  
  // Note: In publications, we can't use async/await directly
  // We'll skip the user lookup for now and just use the patient ID
  
  // Build query for tasks related to this patient
  let tasksQuery = {
    $and: [
      {
        $or: [
          { 'for.reference': `Patient/${patientId}` },  // Tasks for this patient
          { 'requester.reference': `Patient/${patientId}` }  // Tasks requested by this patient
        ]
      },
      {
        'code.coding': { 
          $elemMatch: { 
            code: { $in: ['patient-correction', 'medRecCxReq'] }
          }
        }
      }
    ]
  };
  
  log.debug('[correctionRequests.patient] Finding tasks with query:', { tasksQuery });
  
  const tasksPublication = CorrectionTasks.find(tasksQuery, {
    sort: { 'meta.lastUpdated': -1 }
  });
  
  // Note: count() is not available on server in Meteor v3, just log the query
  log.debug('[correctionRequests.patient] Publishing tasks with query:', { tasksQuery });
  
  // For communications, we'll use a reactive approach
  // In Meteor v3, we need to handle this differently
  const tasksCursor = CorrectionTasks.find(tasksQuery);
  
  // Use the cursor's map method directly (synchronous in publications)
  const taskIds = [];
  tasksCursor.forEach(task => {
    taskIds.push(task._id);
  });
  log.debug('[correctionRequests.patient] Task IDs for communications:', { taskIds });
  
  // Publish communications for those tasks
  const commsQuery = { 'about.reference': { $in: taskIds.map(id => `Task/${id}`) } };
  const commsPublication = CorrectionCommunications.find(commsQuery);
  
  log.debug('[correctionRequests.patient] Publishing communications with query:', { commsQuery });
  
  const endTime = Date.now();
  console.log('[correctionRequests.patient] Publication setup completed in', endTime - startTime, 'ms'); // phi-audit: ok
  
  return [tasksPublication, commsPublication];
});

// Publish a single correction task with all related data
Meteor.publish('correctionRequests.task', async function(taskId) {
  check(taskId, String);
  
  console.log('[correctionRequests.task] Publishing task:', taskId);
  
  if (!this.userId) {
    return this.ready();
  }
  
  // Try to find the task in the main Tasks collection first
  const Tasks = Meteor.Collections?.Tasks || global.Collections?.Tasks;
  let task = null;
  let useMainTasks = false;
  
  if (Tasks) {
    task = await Tasks.findOneAsync(taskId);
    if (task) {
      console.log('[correctionRequests.task] Found in main Tasks collection');
      useMainTasks = true;
    }
  }
  
  // Fallback to CorrectionTasks if not found
  if (!task) {
    task = await CorrectionTasks.findOneAsync(taskId);
    if (task) {
      console.log('[correctionRequests.task] Found in CorrectionTasks collection');
    }
  }
  
  if (!task) {
    console.log('[correctionRequests.task] Task not found:', taskId);
    return this.ready();
  }
  
  // TODO: Check permissions - user should have access to this patient's data
  
  // Publish the task from the appropriate collection
  let taskPublication;
  if (useMainTasks && Tasks) {
    console.log('[correctionRequests.task] Publishing from main Tasks collection');
    taskPublication = Tasks.find({ _id: taskId });
  } else {
    console.log('[correctionRequests.task] Publishing from CorrectionTasks collection');
    taskPublication = CorrectionTasks.find({ _id: taskId });
  }
  
  // Publish all communications related to this task
  const commsPublication = CorrectionCommunications.find({
    'about.reference': `Task/${taskId}`
  });
  
  console.log('[correctionRequests.task] Publishing task and communications');
  
  return [taskPublication, commsPublication];
});

// Publish correction requests for provider view
Meteor.publish('correctionRequests.provider', function(options = {}) {
  check(options, {
    status: Match.Maybe([String]),
    limit: Match.Maybe(Number),
    skip: Match.Maybe(Number)
  });
  
  if (!this.userId) {
    return this.ready();
  }
  
  // Get practitioner ID for current user
  // In Meteor v3 publications, we can't use findOne, so we'll use settings
  const practitionerId = get(Meteor, 'settings.private.chiefMedicalOfficer.id') ||
                         get(Meteor, 'settings.private.cmo.id') ||
                         this.userId;
  
  const query = {
    $or: [
      { 'owner.reference': `Practitioner/${practitionerId}` },
      { 'performer.reference': `Practitioner/${practitionerId}` }
    ]
  };
  
  if (options.status) {
    query.status = { $in: options.status };
  }
  
  const tasksPublication = CorrectionTasks.find(query, {
    sort: { 'meta.lastUpdated': -1 },
    limit: options.limit || 50,
    skip: options.skip || 0
  });
  
  return tasksPublication;
});

// Publish correction requests assigned to practitioner (analemma pattern)
Meteor.publish('correctionRequests.practitioner', async function() {
  console.log('[correctionRequests.practitioner] Starting publication');
  
  if (!this.userId) {
    console.log('[correctionRequests.practitioner] No userId, returning ready');
    return this.ready();
  }
  
  // Get the current user
  const user = await Meteor.users.findOneAsync(this.userId);
  const userPractitionerId = get(user, 'practitionerId');
  
  // Get CMO configuration from settings
  const cmoReference = get(Meteor, 'settings.private.chiefMedicalOfficer.reference') ||
                       get(Meteor, 'settings.private.cmo.reference');
  
  const cmoId = get(Meteor, 'settings.private.chiefMedicalOfficer.id') ||
                get(Meteor, 'settings.private.cmo.id') ||
                'chief-medical-officer';
  
  // Check if this user is the CMO by comparing their practitionerId with CMO settings
  const isCMO = userPractitionerId && (
    userPractitionerId === cmoId || 
    `Practitioner/${userPractitionerId}` === cmoReference ||
    `PractitionerRole/${userPractitionerId}` === cmoReference
  );
  
  console.log('[correctionRequests.practitioner] User:', this.userId);
  console.log('[correctionRequests.practitioner] User practitionerId:', userPractitionerId);
  console.log('[correctionRequests.practitioner] CMO ID from settings:', cmoId);
  console.log('[correctionRequests.practitioner] Is user CMO?', isCMO);
  
  // If user is not a practitioner at all, return empty
  if (!userPractitionerId) {
    console.log('[correctionRequests.practitioner] User is not a practitioner, returning empty');
    return this.ready();
  }
  
  // Use the user's practitioner ID for the query
  const practitionerId = userPractitionerId;
  
  // Try main Tasks collection first
  const Tasks = global.Collections?.Tasks || Meteor.Collections?.Tasks;
  
  console.log('[correctionRequests.practitioner] Checking for Tasks collection:', {
    hasGlobalCollections: !!global.Collections,
    hasGlobalTasks: !!global.Collections?.Tasks,
    hasMeteorCollections: !!Meteor.Collections,
    hasMeteorTasks: !!Meteor.Collections?.Tasks
  });
  
  if (Tasks) {
    // Build query based on whether user is CMO or regular practitioner
    let tasksQuery;
    
    if (isCMO) {
      // CMO sees ALL correction requests
      console.log('[correctionRequests.practitioner] CMO detected - returning ALL correction requests');
      // Query for correction request tasks - fixed to match actual structure
      tasksQuery = {
        'code.coding.code': { 
          $in: ['patient-correction', 'medRecCxReq', 'medRecCxDenialDisagree'] 
        }
      };
    } else {
      // Regular practitioner only sees requests assigned to them
      // Check for both Practitioner and PractitionerRole references
      tasksQuery = {
        $and: [
          {
            $or: [
              { 'owner.reference': `Practitioner/${practitionerId}` },
              { 'owner.reference': `PractitionerRole/${practitionerId}` },
              { 'performer.0.reference': `Practitioner/${practitionerId}` },
              { 'performer.0.reference': `PractitionerRole/${practitionerId}` }
            ]
          },
          {
            'code.coding.code': { 
              $in: ['patient-correction', 'medRecCxReq', 'medRecCxDenialDisagree'] 
            }
          }
        ]
      };
    }
    
    console.log('[correctionRequests.practitioner] Using main Tasks collection with query:', JSON.stringify(tasksQuery, null, 2));
    
    // Simply return the cursor - Meteor will handle the reactive publication
    const result = Tasks.find(tasksQuery, {
      sort: { 'meta.lastUpdated': -1, 'authoredOn': -1 }
    });
    
    // In Meteor v3 publications, we can't use fetch() synchronously for debugging
    // The cursor itself is what matters for the publication
    console.log('[correctionRequests.practitioner] Returning Tasks cursor with query');
    
    return result;
  } else {
    // Fallback to CorrectionTasks
    let query;
    
    if (isCMO) {
      // CMO sees all requests
      query = {};
    } else {
      // Regular practitioner query
      query = {
        $or: [
          { 'owner.reference': `Practitioner/${practitionerId}` },
          { 'performer.0.reference': `Practitioner/${practitionerId}` }
        ]
      };
    }
    
    console.log('[correctionRequests.practitioner] Using CorrectionTasks with query:', query);
    
    return CorrectionTasks.find(query, {
      sort: { 'meta.lastUpdated': -1 }
    });
  }
});