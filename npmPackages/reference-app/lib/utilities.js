// packages/reference-app/lib/utilities.js

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import { get, set, has } from 'lodash';
import moment from 'moment';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const ReferenceAppUtilities = {
  
  // ---------------------------------------------------------------------------
  // FHIR Resource Utilities
  // ---------------------------------------------------------------------------
  
  /**
   * Create a FHIR-compliant resource
   */
  createFhirResource: function(resourceType, data) {
    const resource = {
      resourceType: resourceType,
      id: Random.id(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString()
      }
    };
    
    // Add common fields based on resource type
    switch(resourceType) {
      case 'Observation':
        resource.status = data.status || 'preliminary';
        resource.code = data.code || { text: 'Unknown' };
        resource.subject = data.subject;
        resource.effectiveDateTime = data.effectiveDateTime || new Date().toISOString();
        resource.issued = new Date().toISOString();
        if (data.value) {
          resource.valueString = data.value;
        }
        break;
        
      case 'Procedure':
        resource.status = data.status || 'preparation';
        resource.code = data.code || { text: 'Unknown' };
        resource.subject = data.subject;
        resource.performedDateTime = data.performedDateTime || new Date().toISOString();
        break;
        
      case 'Condition':
        resource.clinicalStatus = {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: data.clinicalStatus || 'active'
          }]
        };
        resource.code = data.code || { text: 'Unknown' };
        resource.subject = data.subject;
        resource.onsetDateTime = data.onsetDateTime || new Date().toISOString();
        break;
        
      default:
        Object.assign(resource, data);
    }
    
    return resource;
  },
  
  /**
   * Validate a FHIR resource
   */
  validateFhirResource: function(resource) {
    const errors = [];
    
    if (!resource.resourceType) {
      errors.push('Missing resourceType');
    }
    
    if (!resource.id) {
      errors.push('Missing id');
    }
    
    // Resource-specific validation
    switch(resource.resourceType) {
      case 'Observation':
        if (!resource.status) errors.push('Missing status');
        if (!resource.code) errors.push('Missing code');
        if (!resource.subject) errors.push('Missing subject');
        break;
        
      case 'Procedure':
        if (!resource.status) errors.push('Missing status');
        if (!resource.code) errors.push('Missing code');
        if (!resource.subject) errors.push('Missing subject');
        break;
        
      case 'Condition':
        if (!resource.clinicalStatus) errors.push('Missing clinicalStatus');
        if (!resource.code) errors.push('Missing code');
        if (!resource.subject) errors.push('Missing subject');
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },
  
  // ---------------------------------------------------------------------------
  // Data Transformation Utilities
  // ---------------------------------------------------------------------------
  
  /**
   * Convert internal format to FHIR
   */
  toFhir: function(internalData, resourceType) {
    console.log('Converting to FHIR:', resourceType, internalData);
    
    const fhirResource = this.createFhirResource(resourceType, {
      subject: {
        reference: `Patient/${internalData.patientId}`
      },
      code: {
        text: internalData.code,
        coding: [{
          system: internalData.codeSystem || 'http://loinc.org',
          code: internalData.codeValue || internalData.code,
          display: internalData.codeDisplay || internalData.code
        }]
      },
      value: internalData.value,
      status: internalData.status
    });
    
    return fhirResource;
  },
  
  /**
   * Convert FHIR to internal format
   */
  fromFhir: function(fhirResource) {
    console.log('Converting from FHIR:', fhirResource);
    
    const internalData = {
      id: get(fhirResource, 'id'),
      resourceType: get(fhirResource, 'resourceType'),
      patientId: get(fhirResource, 'subject.reference', '').replace('Patient/', ''),
      status: get(fhirResource, 'status'),
      code: get(fhirResource, 'code.text') || get(fhirResource, 'code.coding[0].display'),
      codeSystem: get(fhirResource, 'code.coding[0].system'),
      codeValue: get(fhirResource, 'code.coding[0].code'),
      value: get(fhirResource, 'valueString') || 
             get(fhirResource, 'valueQuantity.value') ||
             get(fhirResource, 'valueCodeableConcept.text'),
      effectiveDate: get(fhirResource, 'effectiveDateTime') || 
                     get(fhirResource, 'performedDateTime') ||
                     get(fhirResource, 'onsetDateTime'),
      lastUpdated: get(fhirResource, 'meta.lastUpdated')
    };
    
    return internalData;
  },
  
  // ---------------------------------------------------------------------------
  // Date/Time Utilities
  // ---------------------------------------------------------------------------
  
  /**
   * Format date for display
   */
  formatDate: function(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    return moment(date).format(format);
  },
  
  /**
   * Format datetime for display
   */
  formatDateTime: function(datetime, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!datetime) return '';
    return moment(datetime).format(format);
  },
  
  /**
   * Get relative time
   */
  getRelativeTime: function(datetime) {
    if (!datetime) return '';
    return moment(datetime).fromNow();
  },
  
  /**
   * Convert to FHIR instant format
   */
  toFhirInstant: function(date) {
    return moment(date).toISOString();
  },
  
  // ---------------------------------------------------------------------------
  // Session Management Utilities
  // ---------------------------------------------------------------------------
  
  /**
   * Save workflow state to session
   */
  saveWorkflowState: function(state) {
    Session.set('referenceAppWorkflowState', state);
  },
  
  /**
   * Get workflow state from session
   */
  getWorkflowState: function() {
    return Session.get('referenceAppWorkflowState') || {};
  },
  
  /**
   * Clear workflow state
   */
  clearWorkflowState: function() {
    Session.set('referenceAppWorkflowState', null);
    Session.set('currentWorkflowId', null);
    Session.set('referenceAppFormData', null);
  },
  
  // ---------------------------------------------------------------------------
  // Validation Utilities
  // ---------------------------------------------------------------------------
  
  /**
   * Validate patient ID
   */
  validatePatientId: function(patientId) {
    if (!patientId) return { isValid: false, error: 'Patient ID is required' };
    if (patientId.length < 3) return { isValid: false, error: 'Patient ID too short' };
    return { isValid: true };
  },
  
  /**
   * Validate code
   */
  validateCode: function(code, codeSystem) {
    if (!code) return { isValid: false, error: 'Code is required' };
    
    // Add specific validation based on code system
    if (codeSystem === 'http://loinc.org') {
      // LOINC code validation
      if (!/^\d{1,5}-\d$/.test(code)) {
        return { isValid: false, error: 'Invalid LOINC code format' };
      }
    }
    
    return { isValid: true };
  },
  
  // ---------------------------------------------------------------------------
  // UI Helper Utilities
  // ---------------------------------------------------------------------------
  
  /**
   * Get status color for Material-UI
   */
  getStatusColor: function(status) {
    const statusColors = {
      'draft': 'grey',
      'preliminary': 'warning',
      'final': 'success',
      'amended': 'info',
      'corrected': 'warning',
      'cancelled': 'error',
      'entered-in-error': 'error',
      'active': 'success',
      'inactive': 'grey',
      'resolved': 'info'
    };
    
    return statusColors[status] || 'default';
  },
  
  /**
   * Get status icon
   */
  getStatusIcon: function(status) {
    const statusIcons = {
      'draft': 'edit',
      'preliminary': 'hourglass_empty',
      'final': 'check_circle',
      'amended': 'edit_note',
      'corrected': 'edit',
      'cancelled': 'cancel',
      'active': 'play_circle',
      'inactive': 'pause_circle',
      'completed': 'check_circle',
      'error': 'error'
    };
    
    return statusIcons[status] || 'help_outline';
  },
  
  // ---------------------------------------------------------------------------
  // Error Handling Utilities
  // ---------------------------------------------------------------------------
  
  /**
   * Handle Meteor method errors
   */
  handleMethodError: function(error, defaultMessage = 'An error occurred') {
    console.error('Method error:', error);
    
    let message = defaultMessage;
    if (error.reason) {
      message = error.reason;
    } else if (error.message) {
      message = error.message;
    }
    
    // You could integrate with a notification system here
    console.error('Error message:', message);
    
    return message;
  },
  
  /**
   * Safe get with logging
   */
  safeGet: function(object, path, defaultValue) {
    const value = get(object, path, defaultValue);
    if (value === defaultValue && defaultValue !== undefined) {
      console.warn(`Path not found: ${path}`);
    }
    return value;
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

export { ReferenceAppUtilities };
export default ReferenceAppUtilities;