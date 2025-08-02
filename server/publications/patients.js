// server/publications/patients.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

// Main patients publication with search and filtering
Meteor.publish('patients.search', function(query = {}, options = {}) {
  // Check if user is authenticated
  if (!this.userId) {
    // In production, always require authentication
    if (get(Meteor, 'settings.public.environment') === 'production') {
      console.log('Unauthorized access attempt to patients.search');
      return this.ready();
    }
    
    // In development, check if we should allow unauthenticated access
    const isDevelopment = get(Meteor, 'settings.public.environment') === 'development' || 
                         process.env.NODE_ENV === 'development';
    const allowDevAccess = get(Meteor, 'settings.public.modules.fhir.Patients.allowUnauthenticatedAccess', false);
    
    if (!isDevelopment || !allowDevAccess) {
      console.log('Authentication required for patients.search');
      return this.ready();
    }
    
    console.log('Allowing unauthenticated access to patients.search in development mode');
  }
  
  // Validate parameters
  check(query, Match.Maybe(Object));
  check(options, Match.Maybe(Object));
  
  // Default options
  options = Object.assign({
    limit: 100,
    sort: { 'meta.lastUpdated': -1 }
  }, options);
  
  // Apply reasonable limits
  if (options.limit > 1000) {
    options.limit = 1000;
  }
  
  // Log the publication request
  console.log('Publishing patients.search with query:', JSON.stringify(query), 'options:', options);
  
  // TODO: Add patient access control based on user roles and permissions
  // For now, authenticated users can see all patients
  // In production, implement proper PHI access controls:
  // - Practitioners see their assigned patients
  // - Patients see only their own record
  // - Admins see all patients
  // - Care team members see patients they're assigned to
  
  if (this.userId) {
    const user = Meteor.users.findOne(this.userId);
    
    // If user has a patientId, they can only see their own record
    if (user && user.patientId) {
      query._id = user.patientId;
      console.log('User is a patient, restricting to their own record:', user.patientId);
    }
    
    // TODO: Add more sophisticated access control
    // Example: Check if user is practitioner and filter by assigned patients
    // if (user && user.practitionerId) {
    //   // Get patients assigned to this practitioner
    //   query['generalPractitioner.reference'] = `Practitioner/${user.practitionerId}`;
    // }
  }
  
  return Patients.find(query, options);
});

// Simple publication for all patients (development only)
Meteor.publish('patients.all', function() {
  // This publication should only be available in development
  const isProduction = get(Meteor, 'settings.public.environment') === 'production';
  const isDevelopment = !isProduction && (
    get(Meteor, 'settings.public.environment') === 'development' || 
    process.env.NODE_ENV === 'development' || 
    process.env.NODE_ENV === 'test'
  );
  
  if (isProduction) {
    console.error('patients.all publication is not available in production');
    return this.ready();
  }
  
  if (!isDevelopment) {
    console.error('patients.all publication is only available in development');
    return this.ready();
  }
  
  // In development, optionally require authentication
  const requireAuth = get(Meteor, 'settings.public.modules.fhir.Patients.requireAuthInDev', false);
  if (requireAuth && !this.userId) {
    console.log('Authentication required for patients.all in development');
    return this.ready();
  }
  
  console.log('Publishing all patients for development');
  return Patients.find({}, { limit: 1000 });
});

// Publication for a single patient by ID
Meteor.publish('patients.byId', function(patientId) {
  check(patientId, String);
  
  if (!this.userId) {
    console.log('Authentication required for patients.byId');
    return this.ready();
  }
  
  // TODO: Check if user has access to this specific patient
  const user = Meteor.users.findOne(this.userId);
  
  // Patients can only see their own record
  if (user && user.patientId && user.patientId !== patientId) {
    console.log('User attempted to access another patient record');
    return this.ready();
  }
  
  console.log('Publishing patient by ID:', patientId);
  
  // Try to find by _id or id field
  return Patients.find({
    $or: [
      { _id: patientId },
      { id: patientId }
    ]
  }, { limit: 1 });
});

// Publication for patients assigned to a practitioner
Meteor.publish('patients.forPractitioner', function(practitionerId) {
  check(practitionerId, Match.Maybe(String));
  
  if (!this.userId) {
    console.log('Authentication required for patients.forPractitioner');
    return this.ready();
  }
  
  // If no practitionerId provided, use the current user's practitionerId
  if (!practitionerId) {
    const user = Meteor.users.findOne(this.userId);
    practitionerId = user && user.practitionerId;
    
    if (!practitionerId) {
      console.log('User is not a practitioner');
      return this.ready();
    }
  }
  
  // TODO: Verify that the current user has access to this practitioner's patients
  
  console.log('Publishing patients for practitioner:', practitionerId);
  
  // Find patients where this practitioner is the general practitioner
  return Patients.find({
    'generalPractitioner.reference': `Practitioner/${practitionerId}`
  }, {
    limit: 500,
    sort: { 'name.0.family': 1, 'name.0.given.0': 1 }
  });
});

// Publication for patients in a care team
Meteor.publish('patients.forCareTeam', function(careTeamId) {
  check(careTeamId, String);
  
  if (!this.userId) {
    console.log('Authentication required for patients.forCareTeam');
    return this.ready();
  }
  
  // TODO: Verify that the current user is a member of this care team
  
  console.log('Publishing patients for care team:', careTeamId);
  
  // This would need to be implemented based on your care team structure
  // For now, return empty
  return this.ready();
});

console.log('Patient publications registered');