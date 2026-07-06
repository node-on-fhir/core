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
import { mergeAdiSelector } from '../../lib/constants/AdiConstants';
import { createAdiAccessAuditEvent } from '../methods/adiProvenance';

const log = (Meteor.Logger ? Meteor.Logger.for('pacioPublications') : console);

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

  // Advance directives live in the shared DocumentReferences collection,
  // distinguished by ADI profile / directive type codes
  const DocumentReferences = Meteor.Collections && Meteor.Collections.DocumentReferences;
  if (!DocumentReferences) {
    return this.ready();
  }

  // Record who queried for ADI documents (fire-and-forget; audit failure
  // must never break the publication)
  try {
    createAdiAccessAuditEvent({
      subtype: 'search-type',
      userId: this.userId,
      documentReferenceId: directiveId,
      patientReference: patientId ? `Patient/${patientId}` : undefined
    }).catch(function(error) {
      console.error('[pacio.advanceDirectives] Access audit failed:', error);
    });
  } catch (error) {
    console.error('[pacio.advanceDirectives] Access audit failed:', error);
  }

  return DocumentReferences.find(mergeAdiSelector(query), {
    sort: { date: -1 }
  });
});

// Publish all compositions
Meteor.publish('pacio.compositions', function(queryOrPatientId, options) {
  // Support both old patientId parameter and new query object
  let query = {};
  
  if (typeof queryOrPatientId === 'string') {
    // Old API: patientId as string
    check(queryOrPatientId, Match.Maybe(String));
    if (queryOrPatientId) {
      query['subject.reference'] = `Patient/${queryOrPatientId}`;
    }
  } else if (typeof queryOrPatientId === 'object') {
    // New API: query object for search
    check(queryOrPatientId, Match.Maybe(Object));
    query = queryOrPatientId || {};
  } else {
    check(queryOrPatientId, Match.Maybe(String));
  }
  
  check(options, Match.Maybe(Object));
  
  if (!this.userId) {
    return this.ready();
  }
  
  const Compositions = Meteor.Collections && Meteor.Collections.Compositions;
  if (!Compositions) {
    return this.ready();
  }
  
  // Apply options with defaults
  const queryOptions = Object.assign({
    sort: { date: -1 },
    limit: 1000
  }, options);
  
  return Compositions.find(query, queryOptions);
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
      { 'type.coding.code': '34133-9' },
      { 'type.coding.code': '18761-7' }
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
  // Maybe: clients subscribe with Session.get('selectedPatientId'), which is
  // undefined until a patient is selected — a strict String check throws
  // "Match failed" into the server logs on every such render.
  check(patientId, Match.Maybe(String));

  if (!this.userId || !patientId) {
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

// Publish related persons (emergency contacts / healthcare agents)
Meteor.publish('pacio.relatedPersons', function(patientId) {
  check(patientId, Match.Maybe(String));

  if (!this.userId) {
    return this.ready();
  }

  const query = {};
  if (patientId) {
    query['patient.reference'] = { $in: [`Patient/${patientId}`, `urn:uuid:${patientId}`] };
  }

  const RelatedPersons = Meteor.Collections && Meteor.Collections.RelatedPersons;
  if (!RelatedPersons) {
    return this.ready();
  }

  return RelatedPersons.find(query);
});

// Publish consents (advance-directive care preferences)
Meteor.publish('pacio.consents', function(patientId) {
  check(patientId, Match.Maybe(String));

  if (!this.userId) {
    return this.ready();
  }

  const query = {};
  if (patientId) {
    query['patient.reference'] = { $in: [`Patient/${patientId}`, `urn:uuid:${patientId}`] };
  }

  const Consents = Meteor.Collections && Meteor.Collections.Consents;
  if (!Consents) {
    return this.ready();
  }

  return Consents.find(query, {
    sort: { dateTime: -1 }
  });
});

// Publish patients with role-based ACL
Meteor.publish('pacio.patients', async function(patientId, searchText) {
  check(patientId, Match.Maybe(String));
  check(searchText, Match.Maybe(String));

  if (!this.userId) {
    return this.ready();
  }

  // Get user and determine role
  const user = await Meteor.users.findOneAsync(this.userId);
  if (!user) {
    log.debug('pacio.patients - User not found for userId', { userId: this.userId });
    return this.ready();
  }

  // Role priority: practitioner > provider > patient (mirrors FhirEndpoints.js)
  function getAuthorizedRole(userRoles) {
    const authorizedRoles = ['healthcare practitioner', 'healthcare provider', 'patient'];
    if (Array.isArray(userRoles)) {
      for (const role of authorizedRoles) {
        if (userRoles.includes(role)) {
          return role;
        }
      }
    }
    return 'patient';
  }

  const authorizedRole = getAuthorizedRole(get(user, 'roles', []));
  log.debug('pacio.patients - User role', { authorizedRole, userId: this.userId });

  let query = {};

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

  // ROLE-BASED ACL
  if (authorizedRole === 'healthcare practitioner' || authorizedRole === 'healthcare provider') {
    const practitionerFullAccess = get(Meteor, 'settings.private.accessControl.practitionerFullAccess', true);

    if (practitionerFullAccess) {
      // Full access - no restrictions, query passes through as-is
      console.log('pacio.patients - Practitioner access (full)'); // phi-audit: ok
    } else {
      // Assigned patients only - filter by generalPractitioner.reference
      const practitionerId = user.practitionerId;

      if (practitionerId) {
        const practitionerFilter = {
          $or: [
            { 'meta.security.display': 'unrestricted' },
            { 'generalPractitioner.reference': `Practitioner/${practitionerId}` },
            { 'generalPractitioner.reference': { $regex: practitionerId } }
          ]
        };
        query = Object.keys(query).length > 0 ? { $and: [practitionerFilter, query] } : practitionerFilter;
        console.log('pacio.patients - Practitioner access (assigned-only)'); // phi-audit: ok
      } else {
        // Practitioner role but no practitionerId - show unrestricted only
        query = { 'meta.security.display': 'unrestricted' };
        console.log('pacio.patients - Practitioner role but no practitionerId'); // phi-audit: ok
      }
    }
  } else if (authorizedRole === 'patient') {
    // Patients can ONLY see their own record
    const userPatientId = user.patientId;

    if (userPatientId) {
      const patientFilter = {
        $or: [
          { _id: userPatientId },
          { id: userPatientId }
        ]
      };
      query = Object.keys(query).length > 0 ? { $and: [patientFilter, query] } : patientFilter;
      log.debug('pacio.patients - Patient restricted to own record', { userPatientId });
    } else {
      console.log('pacio.patients - Patient role but no patientId - returning empty'); // phi-audit: ok
      return this.ready();
    }
  } else {
    // Unknown role - deny access
    log.debug('pacio.patients - Unknown role, returning empty', { authorizedRole });
    return this.ready();
  }

  // Get Patients collection from global.Collections
  const Patients = await global.Collections.Patients;
  if (!Patients) {
    console.warn('pacio.patients - Patients collection not found'); // phi-audit: ok
    return this.ready();
  }

  // Limit results for performance
  const options = {
    limit: searchText ? 50 : 100
    // Removed sort due to MongoDB parallel array indexing issues with FHIR name structure
  };

  log.phi('pacio.patients - Final query', { query }, { action: 'search' });
  return Patients.find(query, options);
});

// Publish patient sync status
Meteor.publish('pacio.patientSyncStatus', function(patientId) {
  check(patientId, Match.Maybe(String));

  if (!this.userId || !patientId) {
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
  // Maybe: TransitionOfCarePage subscribes with the Session patient id, which
  // is undefined pre-selection (hooks fire before the page's no-patient guard).
  check(patientId, Match.Maybe(String));

  if (!this.userId || !patientId) {
    return this.ready();
  }
  
  const patientRef = `Patient/${patientId}`;
  
  // Get collections from global.Collections
  const Patients = await global.Collections.Patients;
  const Compositions = await global.Collections.Compositions;
  const Lists = await global.Collections.Lists;
  const Goals = await global.Collections.Goals;
  const NutritionOrders = await global.Collections.NutritionOrders;
  const ServiceRequests = await global.Collections.ServiceRequests;
  const DocumentReferences = await global.Collections.DocumentReferences;
  
  const publications = [];
  
  // Patient record itself (MongoDB _id is the source of truth; loaders set _id = id)
  if (Patients) {
    publications.push(Patients.find({ _id: patientId }));
  }
  
  // Advance Directives are DocumentReferences — covered by the
  // DocumentReferences cursor below (no separate collection)

  // Transition of Care documents
  if (Compositions) {
    publications.push(Compositions.find({
      'subject.reference': patientRef,
      $or: [
        { 'type.coding.code': 'transition-of-care' },
        { 'type.coding.code': '18776-5' },
        { 'type.coding.code': '34133-9' },
        { 'type.coding.code': '18761-7' }
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

// Publish TOC DocumentReferences (filtered by TOC profile)
Meteor.publish('pacio.tocDocumentReferences', function(patientId) {
  check(patientId, Match.Maybe(String));

  if (!this.userId) {
    return this.ready();
  }

  const query = {
    'meta.profile': 'http://hl7.org/fhir/us/pacio-toc/StructureDefinition/TOC-DocumentReference'
  };

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

// Publish PFE QuestionnaireResponses (filtered by PFE profile)
Meteor.publish('pacio.pfeAssessments', function(patientId) {
  check(patientId, Match.Maybe(String));

  if (!this.userId) {
    return this.ready();
  }

  const query = {
    'meta.profile': 'http://hl7.org/fhir/us/pacio-pfe/StructureDefinition/pfe-questionnaire-response'
  };

  if (patientId) {
    query['subject.reference'] = { $in: [
      `Patient/${patientId}`,
      `urn:uuid:${patientId}`
    ]};
  }

  const QuestionnaireResponses = Meteor.Collections && Meteor.Collections.QuestionnaireResponses;
  if (!QuestionnaireResponses) {
    return this.ready();
  }

  return QuestionnaireResponses.find(query, {
    sort: { authored: -1 }
  });
});

// Publish recent updates across all PACIO resources
Meteor.publish('pacio.recentUpdates', function(limit = 10) {
  check(limit, Match.Integer);
  
  if (!this.userId) {
    return this.ready();
  }
  
  // This would ideally use a unified activity log
  // For now, return recent items from each collection
  const DocumentReferences = Meteor.Collections && Meteor.Collections.DocumentReferences;
  const Compositions = Meteor.Collections && Meteor.Collections.Compositions;
  const Goals = Meteor.Collections && Meteor.Collections.Goals;
  const NutritionOrders = Meteor.Collections && Meteor.Collections.NutritionOrders;

  const cursors = [];

  if (DocumentReferences) {
    // Advance directives (ADI DocumentReferences)
    cursors.push(DocumentReferences.find(mergeAdiSelector({}), {
      sort: { 'meta.lastUpdated': -1 },
      limit: Math.floor(limit / 4)
    }));
  } else {
    console.warn('[pacio.recentUpdates] DocumentReferences collection not available');
  }

  if (Compositions) {
    cursors.push(Compositions.find({
      $or: [
        { 'type.coding.code': 'transition-of-care' },
        { 'type.coding.code': '18776-5' }
      ]
    }, {
      sort: { date: -1 },
      limit: Math.floor(limit / 4)
    }));
  } else {
    console.warn('[pacio.recentUpdates] Compositions collection not available');
  }

  if (Goals) {
    cursors.push(Goals.find({}, {
      sort: { startDate: -1 },
      limit: Math.floor(limit / 4)
    }));
  } else {
    console.warn('[pacio.recentUpdates] Goals collection not available');
  }

  if (NutritionOrders) {
    cursors.push(NutritionOrders.find({}, {
      sort: { dateTime: -1 },
      limit: Math.floor(limit / 4)
    }));
  } else {
    console.warn('[pacio.recentUpdates] NutritionOrders collection not available');
  }

  return cursors;
});