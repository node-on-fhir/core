// packages/pacio-core/lib/PacioSubscriptions.js

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { get } from 'lodash';

function getClinicianId(currentUser){
  if(get(currentUser, 'isClinician') === true){
    return get(currentUser, 'id')
  }
}

if(Meteor.isClient){
  // Single tracker for all PHI resource subscriptions
  Tracker.autorun((computation) => {
    const clinicianId = getClinicianId(Session.get('currentUser'));
    const clientSecretOrBearerToken = Session.get('clientSecretOrBearerToken');
    const selectedPatientId = Session.get('selectedPatientId');
    
    console.log('PACIO PHI Subscriptions - selectedPatientId:', selectedPatientId);
    
    // Only subscribe if we have a patient selected
    if(selectedPatientId) {
      // PHI Resources
      const subscriptions = [
        'AllergyIntolerances',
        'CarePlans', 
        'Compositions',
        'Conditions',
        'Consents',
        'DocumentReferences',
        'Goals',
        'Immunizations',
        'Lists',
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
        console.log(`Subscribing to pacio.${resourceType} for patient ${selectedPatientId}`);
      });
      
      // Patient resource subscription
      Meteor.subscribe('pacio.Patients', selectedPatientId, clinicianId, clientSecretOrBearerToken);
    } else {
      console.log('No patient selected, skipping PHI subscriptions');
    }
  });
}

if(Meteor.isServer){
  // Define all PACIO PHI publications
  
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
    
    console.log('pacio.AllergyIntolerances publishing for patient:', patientId, 'query:', query);
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
    
    console.log('pacio.CarePlans publishing for patient:', patientId, 'query:', query);
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
    
    console.log('pacio.Compositions publishing for patient:', patientId, 'query:', query);
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
    
    console.log('pacio.Conditions publishing for patient:', patientId, 'query:', query);
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
    
    console.log('pacio.Consents publishing for patient:', patientId, 'query:', query);
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
    
    console.log('pacio.DocumentReferences publishing for patient:', patientId, 'query:', query);
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
    
    console.log('pacio.Goals publishing for patient:', patientId, 'query:', query);
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
    
    console.log('pacio.Immunizations publishing for patient:', patientId, 'query:', query);
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
    
    console.log('pacio.Lists publishing for patient:', patientId, 'query:', query);
    return Lists.find(query, { sort: { date: -1 } });
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
    
    console.log('pacio.MedicationAdministrations publishing for patient:', patientId, 'query:', query);
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
    
    console.log('pacio.MedicationRequests publishing for patient:', patientId, 'query:', query);
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
    
    console.log('pacio.NutritionOrders publishing for patient:', patientId, 'query:', query);
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
    
    console.log('pacio.Observations publishing for patient:', patientId, 'query:', query);
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
    
    console.log('pacio.Procedures publishing for patient:', patientId, 'query:', query);
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
    
    console.log('pacio.QuestionnaireResponses publishing for patient:', patientId, 'query:', query);
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
    
    console.log('pacio.ServiceRequests publishing for patient:', patientId, 'query:', query);
    return ServiceRequests.find(query, { sort: { authoredOn: -1 } });
  });

  Meteor.publish('pacio.Patients', function(patientId, clinicianId, clientSecretOrBearerToken){
    const Patients = Meteor.Collections && Meteor.Collections.Patients;
    if (!Patients) {
      console.warn('Patients collection not yet initialized');
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
    
    console.log('pacio.Patients publishing for patient:', patientId, 'query:', patientsQuery);
    return Patients.find(patientsQuery);
  });
}