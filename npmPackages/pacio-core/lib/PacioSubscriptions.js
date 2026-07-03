// packages/pacio-core/lib/PacioSubscriptions.js

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('PacioSubscriptions') : console);

function getClinicianId(currentUser){
  if(get(currentUser, 'isClinician') === true){
    return get(currentUser, 'id')
  }
}

if(Meteor.isClient){
  const pacioAutoSubscribe = get(Meteor, 'settings.public.pacio.autoSubscribe', false);

  if(pacioAutoSubscribe){
    // PACIO pathway: subscribe to pacio.* publications
    // Store active subscription handles for cleanup
    let activeHandles = [];

    // Single tracker for all PHI resource subscriptions
    Tracker.autorun((computation) => {
      const clinicianId = getClinicianId(Session.get('currentUser'));
      const clientSecretOrBearerToken = Session.get('clientSecretOrBearerToken');
      const selectedPatientId = Session.get('selectedPatientId');

      // Stop all previous subscriptions before creating new ones
      // This prevents subscription multiplication on Session changes
      activeHandles.forEach(handle => {
        if (handle && handle.stop) {
          handle.stop();
        }
      });
      activeHandles = [];

      log.debug('PACIO PHI Subscriptions - selectedPatientId', { selectedPatientId });

      // Only subscribe if we have a patient selected
      if(selectedPatientId) {
        // PHI Resources
        const subscriptions = [
          'AllergyIntolerances',
          'AuditEvents',
          'CarePlans',
          'Compositions',
          'Conditions',
          'Consents',
          'DocumentReferences',
          'Goals',
          'Immunizations',
          'Lists',
          'Locations',
          'MedicationAdministrations',
          'MedicationRequests',
          'NutritionOrders',
          'Observations',
          'Procedures',
          'QuestionnaireResponses',
          'ServiceRequests'
        ];

        subscriptions.forEach(resourceType => {
          const handle = Meteor.subscribe(`pacio.${resourceType}`, selectedPatientId, clinicianId, clientSecretOrBearerToken);
          activeHandles.push(handle);
        });

        // Patient resource subscription
        const patientHandle = Meteor.subscribe('pacio.Patients', selectedPatientId, clinicianId, clientSecretOrBearerToken);
        activeHandles.push(patientHandle);

        log.debug('PACIO: Subscribed to ' + activeHandles.length + ' resources for patient ' + selectedPatientId);
      } else {
        console.log('No patient selected, skipping PHI subscriptions'); // phi-audit: ok
      }
    });
  } else {
    console.log('PACIO: Client subscriptions disabled (pacio.autoSubscribe=false)');
  }
}

if(Meteor.isServer){
  const pacioAutoPublish = get(Meteor, 'settings.private.pacio.autoPublish', false);

  if(pacioAutoPublish){
  // Define all PACIO PHI publications

  Meteor.publish('pacio.AuditEvents', function(patientId, clinicianId, clientSecretOrBearerToken){
    const AuditEvents = Meteor.Collections && Meteor.Collections.AuditEvents;
    if (!AuditEvents) {
      console.warn('AuditEvents collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    // if (patientId) {
    //   query['patient.reference'] = `Patient/${patientId}`;
    // }
    
    log.debug('pacio.AuditEvents publishing for patient', { patientId, query });
    return AuditEvents.find(query, { sort: { date: -1 } });
  });
  
  Meteor.publish('pacio.AllergyIntolerances', function(patientId, clinicianId, clientSecretOrBearerToken){
    const AllergyIntolerances = Meteor.Collections && Meteor.Collections.AllergyIntolerances;
    if (!AllergyIntolerances) {
      console.warn('AllergyIntolerances collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['patient.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.AllergyIntolerances publishing for patient', { patientId, query });
    return AllergyIntolerances.find(query, { sort: { date: -1 } });
  });

  Meteor.publish('pacio.CarePlans', function(patientId, clinicianId, clientSecretOrBearerToken){
    const CarePlans = Meteor.Collections && Meteor.Collections.CarePlans;
    if (!CarePlans) {
      console.warn('CarePlans collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.CarePlans publishing for patient', { patientId, query });
    return CarePlans.find(query, { sort: { created: -1 } });
  });

  Meteor.publish('pacio.Compositions', function(patientId, clinicianId, clientSecretOrBearerToken){
    const Compositions = Meteor.Collections && Meteor.Collections.Compositions;
    if (!Compositions) {
      console.warn('Compositions collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.Compositions publishing for patient', { patientId, query });
    return Compositions.find(query, { sort: { date: -1 } });
  });

  Meteor.publish('pacio.Conditions', function(patientId, clinicianId, clientSecretOrBearerToken){
    const Conditions = Meteor.Collections && Meteor.Collections.Conditions;
    if (!Conditions) {
      console.warn('Conditions collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.Conditions publishing for patient', { patientId, query });
    return Conditions.find(query, { sort: { recordedDate: -1 } });
  });

  Meteor.publish('pacio.Consents', function(patientId, clinicianId, clientSecretOrBearerToken){
    const Consents = Meteor.Collections && Meteor.Collections.Consents;
    if (!Consents) {
      console.warn('Consents collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['patient.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.Consents publishing for patient', { patientId, query });
    return Consents.find(query, { sort: { dateTime: -1 } });
  });

  Meteor.publish('pacio.DocumentReferences', function(patientId, clinicianId, clientSecretOrBearerToken){
    const DocumentReferences = Meteor.Collections && Meteor.Collections.DocumentReferences;
    if (!DocumentReferences) {
      console.warn('DocumentReferences collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.DocumentReferences publishing for patient', { patientId, query });
    return DocumentReferences.find(query, { sort: { date: -1 } });
  });

  Meteor.publish('pacio.Goals', function(patientId, clinicianId, clientSecretOrBearerToken){
    const Goals = Meteor.Collections && Meteor.Collections.Goals;
    if (!Goals) {
      console.warn('Goals collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.Goals publishing for patient', { patientId, query });
    return Goals.find(query, { sort: { startDate: -1 } });
  });

  Meteor.publish('pacio.Immunizations', function(patientId, clinicianId, clientSecretOrBearerToken){
    const Immunizations = Meteor.Collections && Meteor.Collections.Immunizations;
    if (!Immunizations) {
      console.warn('Immunizations collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['patient.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.Immunizations publishing for patient', { patientId, query });
    return Immunizations.find(query, { sort: { occurrenceDateTime: -1 } });
  });

  Meteor.publish('pacio.Lists', function(patientId, clinicianId, clientSecretOrBearerToken){
    const Lists = Meteor.Collections && Meteor.Collections.Lists;
    if (!Lists) {
      console.warn('Lists collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.Lists publishing for patient', { patientId, query });
    return Lists.find(query, { sort: { date: -1 } });
  });

    Meteor.publish('pacio.Locations', function(patientId, clinicianId, clientSecretOrBearerToken){
    const Locations = Meteor.Collections && Meteor.Collections.Locations;
    if (!Locations) {
      console.warn('Locations collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    // if (patientId) {
    //   query['subject.reference'] = `Patient/${patientId}`;
    // }
    
    log.debug('pacio.Locations publishing for patient', { patientId, query });
    return Locations.find(query, { sort: { date: -1 } });
  });

  Meteor.publish('pacio.MedicationAdministrations', function(patientId, clinicianId, clientSecretOrBearerToken){
    const MedicationAdministrations = Meteor.Collections && Meteor.Collections.MedicationAdministrations;
    if (!MedicationAdministrations) {
      console.warn('MedicationAdministrations collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.MedicationAdministrations publishing for patient', { patientId, query });
    return MedicationAdministrations.find(query, { sort: { effectiveDateTime: -1 } });
  });

  Meteor.publish('pacio.MedicationRequests', function(patientId, clinicianId, clientSecretOrBearerToken){
    const MedicationRequests = Meteor.Collections && Meteor.Collections.MedicationRequests;
    if (!MedicationRequests) {
      console.warn('MedicationRequests collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.MedicationRequests publishing for patient', { patientId, query });
    return MedicationRequests.find(query, { sort: { authoredOn: -1 } });
  });

  Meteor.publish('pacio.NutritionOrders', function(patientId, clinicianId, clientSecretOrBearerToken){
    const NutritionOrders = Meteor.Collections && Meteor.Collections.NutritionOrders;
    if (!NutritionOrders) {
      console.warn('NutritionOrders collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['patient.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.NutritionOrders publishing for patient', { patientId, query });
    return NutritionOrders.find(query, { sort: { dateTime: -1 } });
  });

  Meteor.publish('pacio.Observations', function(patientId, clinicianId, clientSecretOrBearerToken){
    const Observations = Meteor.Collections && Meteor.Collections.Observations;
    if (!Observations) {
      console.warn('Observations collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.Observations publishing for patient', { patientId, query });
    return Observations.find(query, { sort: { effectiveDateTime: -1 } });
  });

  Meteor.publish('pacio.Procedures', function(patientId, clinicianId, clientSecretOrBearerToken){
    const Procedures = Meteor.Collections && Meteor.Collections.Procedures;
    if (!Procedures) {
      console.warn('Procedures collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.Procedures publishing for patient', { patientId, query });
    return Procedures.find(query, { sort: { performedDateTime: -1 } });
  });

  Meteor.publish('pacio.QuestionnaireResponses', function(patientId, clinicianId, clientSecretOrBearerToken){
    const QuestionnaireResponses = Meteor.Collections && Meteor.Collections.QuestionnaireResponses;
    if (!QuestionnaireResponses) {
      console.warn('QuestionnaireResponses collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.QuestionnaireResponses publishing for patient', { patientId, query });
    return QuestionnaireResponses.find(query, { sort: { authored: -1 } });
  });

  Meteor.publish('pacio.ServiceRequests', function(patientId, clinicianId, clientSecretOrBearerToken){
    const ServiceRequests = Meteor.Collections && Meteor.Collections.ServiceRequests;
    if (!ServiceRequests) {
      console.warn('ServiceRequests collection not yet initialized');
      return this.ready();
    }
    
    const query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    log.debug('pacio.ServiceRequests publishing for patient', { patientId, query });
    return ServiceRequests.find(query, { sort: { authoredOn: -1 } });
  });

  Meteor.publish('pacio.Patients', function(patientId, clinicianId, clientSecretOrBearerToken){
    const Patients = Meteor.Collections && Meteor.Collections.Patients;
    if (!Patients) {
      console.warn('Patients collection not yet initialized'); // phi-audit: ok
      return this.ready();
    }

    let patientsQuery = {};
    if(patientId){
      patientsQuery = { $or: [
        {"_id": patientId},
        {"id": patientId},
        {"id": "Patient/" + patientId},
        {"id": "urn:uuid:Patient/" + patientId},
        {"id": { $regex: ".*Patient/" + patientId}}
      ]}
    }

    log.debug('pacio.Patients publishing for patient', { patientId, query: patientsQuery });
    return Patients.find(patientsQuery);
  });

  } else {
    console.log('PACIO: Server publications disabled (pacio.autoPublish=false)');
  }
}