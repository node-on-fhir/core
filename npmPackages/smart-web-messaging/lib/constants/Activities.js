// packages/smart-web-messaging/lib/constants/Activities.js

/**
 * Activity Catalog
 * Defines standard activities that can be launched via SMART Web Messaging
 * Based on the SMART Web Messaging IG specification
 */
Activities = {
  // Activity types
  APPOINTMENT_BOOK: 'appointment-book',
  ORDER_REVIEW: 'order-review',
  PROBLEM_REVIEW: 'problem-review',
  
  // Activity definitions
  DEFINITIONS: {
    'appointment-book': {
      id: 'appointment-book',
      name: 'Appointment Book',
      description: 'Launch appointment booking workflow',
      acceptsContext: {
        resourceType: ['Bundle'],
        bundleType: ['collection'],
        bundleContents: ['Appointment']
      },
      returnsContext: {
        resourceType: ['Appointment', 'Bundle']
      }
    },
    
    'order-review': {
      id: 'order-review',
      name: 'Order Review',
      description: 'Review and modify draft orders',
      acceptsContext: {
        resourceType: ['ServiceRequest', 'MedicationRequest', 'Bundle'],
        status: ['draft']
      },
      returnsContext: {
        resourceType: ['ServiceRequest', 'MedicationRequest', 'Bundle']
      }
    },
    
    'problem-review': {
      id: 'problem-review',
      name: 'Problem Review',
      description: 'Add problems to patient problem list',
      acceptsContext: {
        reference: ['Condition']
      },
      returnsContext: {
        resourceType: ['Condition']
      }
    }
  },
  
  // Helper methods
  isValid: function(activityId) {
    return Object.keys(this.DEFINITIONS).includes(activityId);
  },
  
  getDefinition: function(activityId) {
    return this.DEFINITIONS[activityId] || null;
  },
  
  // Check if a resource matches activity requirements
  acceptsResource: function(activityId, resource) {
    const definition = this.getDefinition(activityId);
    if (!definition || !definition.acceptsContext) return false;
    
    const { resourceType, bundleType, bundleContents, status } = definition.acceptsContext;
    
    // Check resource type
    if (resourceType && !resourceType.includes(resource.resourceType)) {
      return false;
    }
    
    // For bundles, check bundle type and contents
    if (resource.resourceType === 'Bundle') {
      if (bundleType && !bundleType.includes(resource.type)) {
        return false;
      }
      if (bundleContents && resource.entry) {
        const hasRequiredContent = resource.entry.some(entry => 
          bundleContents.includes(entry.resource?.resourceType)
        );
        if (!hasRequiredContent) return false;
      }
    }
    
    // Check status if specified
    if (status && resource.status && !status.includes(resource.status)) {
      return false;
    }
    
    return true;
  }
};