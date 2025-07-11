// /packages/pacio-core/server/publications/pacioPublications.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { 
  PatientSyncStatus, 
  AdvanceDirectiveTemplates,
  GoalAchievements 
} from '../../lib/collections/PacioCollections';
import { Beds } from '../../lib/collections/BedsCollection';

// Publish advance directives
Meteor.publish('pacio.advanceDirectives', function(patientId, directiveId) {
  check(patientId, Match.Maybe(String));
  check(directiveId, Match.Maybe(String));
  
  if (!this.userId) {
    return this.ready();
  }
  
  const query = {};
  
  if (directiveId) {
    query._id = directiveId;
  } else if (patientId) {
    query['subject.reference'] = `Patient/${patientId}`;
  }
  
  const AdvanceDirectives = Meteor.Collections && Meteor.Collections.AdvanceDirectives;
  if (!AdvanceDirectives) {
    return this.ready();
  }
  
  return AdvanceDirectives.find(query, {
    sort: { date: -1 }
  });
});

// Publish all compositions
Meteor.publish('pacio.compositions', function(patientId) {
  check(patientId, Match.Maybe(String));
  
  if (!this.userId) {
    return this.ready();
  }
  
  const query = {};
  if (patientId) {
    query['subject.reference'] = `Patient/${patientId}`;
  }
  
  const Compositions = Meteor.Collections && Meteor.Collections.Compositions;
  if (!Compositions) {
    return this.ready();
  }
  
  return Compositions.find(query, {
    sort: { date: -1 }
  });
});

// Publish transition of care documents
Meteor.publish('pacio.transitionOfCare', function(patientId, compositionId) {
  check(patientId, Match.Maybe(String));
  check(compositionId, Match.Maybe(String));
  
  if (!this.userId) {
    return this.ready();
  }
  
  const query = {
    $or: [
      { 'type.coding.code': 'transition-of-care' },
      { 'type.coding.code': 'continuity-of-care-document' },
      { 'type.coding.code': '18776-5' },
      { 'type.coding.code': '34133-9' }
    ]
  };
  
  if (compositionId) {
    query._id = compositionId;
  } else if (patientId) {
    query['subject.reference'] = `Patient/${patientId}`;
  }
  
  const Compositions = Meteor.Collections && Meteor.Collections.Compositions;
  if (!Compositions) {
    return this.ready();
  }
  
  return Compositions.find(query, {
    sort: { date: -1 }
  });
});

// Publish medication lists
Meteor.publish('pacio.medicationLists', function(patientId) {
  check(patientId, Match.Maybe(String));
  
  if (!this.userId) {
    return this.ready();
  }
  
  const query = {
    $or: [
      { 'code.coding.code': 'medications' },
      { 'code.coding.code': '10160-0' },
      { 'code.coding.code': '29549-3' }
    ]
  };
  
  if (patientId) {
    query['subject.reference'] = `Patient/${patientId}`;
  }
  
  const Lists = Meteor.Collections && Meteor.Collections.Lists;
  if (!Lists) {
    return this.ready();
  }
  
  return Lists.find(query, {
    sort: { date: -1 }
  });
});

// Publish enhanced goals with achievements
Meteor.publish('pacio.goalsWithAchievements', function(patientId) {
  check(patientId, String);
  
  if (!this.userId) {
    return this.ready();
  }
  
  const Goals = Meteor.Collections && Meteor.Collections.Goals;
  if (!Goals) {
    return this.ready();
  }
  
  const publications = [
    Goals.find({
      'subject.reference': `Patient/${patientId}`
    }),
    GoalAchievements.find({ patientId })
  ];
  
  return publications;
});

// Publish nutrition orders
Meteor.publish('pacio.nutritionOrders', function(patientId) {
  check(patientId, Match.Maybe(String));
  
  if (!this.userId) {
    return this.ready();
  }
  
  const query = {};
  if (patientId) {
    query['patient.reference'] = `Patient/${patientId}`;
  }
  
  const NutritionOrders = Meteor.Collections && Meteor.Collections.NutritionOrders;
  if (!NutritionOrders) {
    return this.ready();
  }
  
  return NutritionOrders.find(query, {
    sort: { dateTime: -1 }
  });
});

// Publish service requests
Meteor.publish('pacio.serviceRequests', function(patientId) {
  check(patientId, Match.Maybe(String));
  
  if (!this.userId) {
    return this.ready();
  }
  
  const query = {};
  if (patientId) {
    query['subject.reference'] = `Patient/${patientId}`;
  }
  
  const ServiceRequests = Meteor.Collections && Meteor.Collections.ServiceRequests;
  if (!ServiceRequests) {
    return this.ready();
  }
  
  return ServiceRequests.find(query, {
    sort: { authoredOn: -1 }
  });
});

// Publish document references
Meteor.publish('pacio.documentReferences', function(patientId) {
  check(patientId, Match.Maybe(String));
  
  if (!this.userId) {
    return this.ready();
  }
  
  const query = {};
  if (patientId) {
    query['subject.reference'] = `Patient/${patientId}`;
  }
  
  const DocumentReferences = Meteor.Collections && Meteor.Collections.DocumentReferences;
  if (!DocumentReferences) {
    return this.ready();
  }
  
  return DocumentReferences.find(query, {
    sort: { date: -1 }
  });
});

// Publish patients
Meteor.publish('pacio.patients', async function(patientId, searchText) {
  check(patientId, Match.Maybe(String));
  check(searchText, Match.Maybe(String));
  
  if (!this.userId) {
    return this.ready();
  }
  
  const query = {};
  
  // If specific patient ID provided
  if (patientId) {
    query.$or = [
      { id: patientId },
      { _id: patientId }
    ];
  }
  
  // If search text provided, search in name fields
  if (searchText && searchText.length > 0) {
    const searchRegex = new RegExp(searchText, 'i');
    query.$or = [
      { 'name.text': searchRegex },
      { 'name.family': searchRegex },
      { 'name.given': searchRegex },
      { 'identifier.value': searchRegex }
    ];
  }
  
  // Get Patients collection from global.Collections
  const Patients = await global.Collections.Patients;
  if (!Patients) {
    console.warn('Patients collection not found in global.Collections');
    return this.ready();
  }
  
  // Limit results for performance
  const options = {
    sort: { 'name.family': 1, 'name.given': 1 },
    limit: searchText ? 50 : 100
  };
  
  console.log('Publishing patients with query:', query, 'options:', options);
  return Patients.find(query, options);
});

// Publish patient sync status
Meteor.publish('pacio.patientSyncStatus', function(patientId) {
  check(patientId, String);
  
  if (!this.userId) {
    return this.ready();
  }
  
  return PatientSyncStatus.find({ patientId });
});

// Publish advance directive templates
Meteor.publish('pacio.advanceDirectiveTemplates', function() {
  if (!this.userId) {
    return this.ready();
  }
  
  return AdvanceDirectiveTemplates.find({ isActive: true });
});

// Publish beds
Meteor.publish('pacio.beds', function(query = {}) {
  check(query, Match.Optional({
    status: Match.Optional(String),
    facilityId: Match.Optional(String),
    bedType: Match.Optional(String),
    ward: Match.Optional(String)
  }));
  
  if (!this.userId) {
    return this.ready();
  }
  
  return Beds.find(query);
});

// Publish all PACIO resources for a patient
Meteor.publish('pacio.patientResources', async function(patientId) {
  check(patientId, String);
  
  if (!this.userId) {
    return this.ready();
  }
  
  const patientRef = `Patient/${patientId}`;
  
  // Get collections from global.Collections
  const Patients = await global.Collections.Patients;
  const AdvanceDirectives = await global.Collections.AdvanceDirectives;
  const Compositions = await global.Collections.Compositions;
  const Lists = await global.Collections.Lists;
  const Goals = await global.Collections.Goals;
  const NutritionOrders = await global.Collections.NutritionOrders;
  const ServiceRequests = await global.Collections.ServiceRequests;
  const DocumentReferences = await global.Collections.DocumentReferences;
  
  const publications = [];
  
  // Patient record itself
  if (Patients) {
    publications.push(Patients.find({
      $or: [
        { id: patientId },
        { _id: patientId }
      ]
    }));
  }
  
  // Advance Directives
  if (AdvanceDirectives) {
    publications.push(AdvanceDirectives.find({
      'subject.reference': patientRef
    }));
  }
  
  // Transition of Care documents
  if (Compositions) {
    publications.push(Compositions.find({
      'subject.reference': patientRef,
      $or: [
        { 'type.coding.code': 'transition-of-care' },
        { 'type.coding.code': '18776-5' },
        { 'type.coding.code': '34133-9' }
      ]
    }));
  }
  
  // Medication Lists
  if (Lists) {
    publications.push(Lists.find({
      'subject.reference': patientRef,
      $or: [
        { 'code.coding.code': 'medications' },
        { 'code.coding.code': '10160-0' },
        { 'code.coding.code': '29549-3' }
      ]
    }));
  }
  
  // Goals with achievements
  if (Goals) {
    publications.push(Goals.find({
      'subject.reference': patientRef
    }));
  }
  publications.push(GoalAchievements.find({ patientId }));
  
  // Nutrition Orders
  if (NutritionOrders) {
    publications.push(NutritionOrders.find({
      'patient.reference': patientRef
    }));
  }
  
  // Service Requests
  if (ServiceRequests) {
    publications.push(ServiceRequests.find({
      'subject.reference': patientRef
    }));
  }
  
  // Document References
  if (DocumentReferences) {
    publications.push(DocumentReferences.find({
      'subject.reference': patientRef
    }));
  }
  
  // Sync Status
  publications.push(PatientSyncStatus.find({ patientId }));
  
  return publications;
});

// Publish recent updates across all PACIO resources
Meteor.publish('pacio.recentUpdates', function(limit = 10) {
  check(limit, Match.Integer);
  
  if (!this.userId) {
    return this.ready();
  }
  
  // This would ideally use a unified activity log
  // For now, return recent items from each collection
  return [
    AdvanceDirectives.find({}, {
      sort: { 'meta.lastUpdated': -1 },
      limit: Math.floor(limit / 4)
    }),
    Compositions.find({
      $or: [
        { 'type.coding.code': 'transition-of-care' },
        { 'type.coding.code': '18776-5' }
      ]
    }, {
      sort: { date: -1 },
      limit: Math.floor(limit / 4)
    }),
    Goals.find({}, {
      sort: { startDate: -1 },
      limit: Math.floor(limit / 4)
    }),
    NutritionOrders.find({}, {
      sort: { dateTime: -1 },
      limit: Math.floor(limit / 4)
    })
  ];
});