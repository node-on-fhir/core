// packages/healthcare-surveys/server/fhir/transforms/bundleTransforms.js

import { get, set } from 'lodash';
import moment from 'moment';

// Transform resources for inclusion in a bundle
export const transformResourceForBundle = function(resource, baseUrl) {
  if (!resource) return null;
  
  const resourceType = get(resource, 'resourceType', 'Unknown');
  const resourceId = get(resource, '_id', get(resource, 'id'));
  
  // Remove MongoDB _id field
  const cleanResource = { ...resource };
  delete cleanResource._id;
  
  // Ensure proper id field
  if (resourceId && !cleanResource.id) {
    cleanResource.id = resourceId;
  }
  
  return {
    fullUrl: `${baseUrl}/${resourceType}/${resourceId}`,
    resource: cleanResource
  };
};

// Create a content bundle from a composition and related resources
export const createContentBundle = function(composition, relatedResources = {}, bundleId = null) {
  const bundle = {
    resourceType: 'Bundle',
    id: bundleId || Meteor.uuid(),
    type: 'collection',
    timestamp: moment().toISOString(),
    entry: []
  };
  
  // Add composition as first entry
  if (composition) {
    bundle.entry.push(transformResourceForBundle(composition, 'urn:uuid'));
  }
  
  // Add related resources by type
  Object.keys(relatedResources).forEach(resourceType => {
    const resources = relatedResources[resourceType];
    if (Array.isArray(resources)) {
      resources.forEach(resource => {
        const entry = transformResourceForBundle(resource, 'urn:uuid');
        if (entry) {
          bundle.entry.push(entry);
        }
      });
    }
  });
  
  // Add total count
  bundle.total = bundle.entry.length;
  
  return bundle;
};

// Create a reporting bundle (message bundle)
export const createReportingBundle = function(contentBundle, messageHeader, bundleId = null) {
  const bundle = {
    resourceType: 'Bundle',
    id: bundleId || Meteor.uuid(),
    type: 'message',
    timestamp: moment().toISOString(),
    entry: []
  };
  
  // Ensure message header is first
  const defaultMessageHeader = {
    resourceType: 'MessageHeader',
    id: Meteor.uuid(),
    eventCoding: {
      system: 'http://hl7.org/fhir/us/ph-library/CodeSystem/us-ph-codesystem-message-types',
      code: 'hcs-report',
      display: 'Healthcare Survey Report'
    },
    source: {
      endpoint: Meteor.absoluteUrl()
    },
    response: {
      identifier: bundleId || bundle.id,
      code: 'ok'
    }
  };
  
  const finalMessageHeader = { ...defaultMessageHeader, ...messageHeader };
  bundle.entry.push({
    fullUrl: `urn:uuid:${finalMessageHeader.id}`,
    resource: finalMessageHeader
  });
  
  // Add content bundle as second entry
  if (contentBundle) {
    bundle.entry.push({
      fullUrl: `urn:uuid:${get(contentBundle, 'id', Meteor.uuid())}`,
      resource: contentBundle
    });
  }
  
  return bundle;
};

// Extract resources from a bundle
export const extractResourcesFromBundle = function(bundle) {
  if (!bundle || get(bundle, 'resourceType') !== 'Bundle') {
    return {};
  }
  
  const resources = {};
  const entries = get(bundle, 'entry', []);
  
  entries.forEach(entry => {
    const resource = get(entry, 'resource');
    if (resource) {
      const resourceType = get(resource, 'resourceType', 'Unknown');
      
      if (!resources[resourceType]) {
        resources[resourceType] = [];
      }
      
      resources[resourceType].push(resource);
    }
  });
  
  return resources;
};

// Validate bundle structure
export const validateBundle = function(bundle, bundleType = 'collection') {
  const errors = [];
  
  if (!bundle) {
    errors.push('Bundle is null or undefined');
    return errors;
  }
  
  if (get(bundle, 'resourceType') !== 'Bundle') {
    errors.push('resourceType must be Bundle');
  }
  
  if (get(bundle, 'type') !== bundleType) {
    errors.push(`Bundle type must be ${bundleType}`);
  }
  
  const entries = get(bundle, 'entry', []);
  
  if (bundleType === 'message') {
    // Message bundle validations
    if (entries.length < 2) {
      errors.push('Message bundle must contain at least 2 entries');
    }
    
    const firstEntry = entries[0];
    if (get(firstEntry, 'resource.resourceType') !== 'MessageHeader') {
      errors.push('First entry in message bundle must be MessageHeader');
    }
    
    const secondEntry = entries[1];
    if (get(secondEntry, 'resource.resourceType') !== 'Bundle') {
      errors.push('Second entry in message bundle must be a Bundle');
    }
  } else if (bundleType === 'collection') {
    // Content bundle validations
    const compositions = entries.filter(e => 
      get(e, 'resource.resourceType') === 'Composition'
    );
    
    if (compositions.length !== 1) {
      errors.push('Content bundle must contain exactly one Composition');
    }
  }
  
  // Validate each entry
  entries.forEach((entry, index) => {
    if (!get(entry, 'resource')) {
      errors.push(`Entry ${index} missing resource`);
    }
    if (!get(entry, 'resource.resourceType')) {
      errors.push(`Entry ${index} resource missing resourceType`);
    }
  });
  
  return errors;
};

// Create bundle response for search results
export const createSearchBundle = function(resources, query = {}, baseUrl) {
  const bundle = {
    resourceType: 'Bundle',
    type: 'searchset',
    timestamp: moment().toISOString(),
    total: resources.length,
    link: [],
    entry: []
  };
  
  // Add self link
  bundle.link.push({
    relation: 'self',
    url: `${baseUrl}?${new URLSearchParams(query).toString()}`
  });
  
  // Add entries
  resources.forEach(resource => {
    const entry = transformResourceForBundle(resource, baseUrl);
    if (entry) {
      // Add search mode
      entry.search = {
        mode: 'match'
      };
      bundle.entry.push(entry);
    }
  });
  
  return bundle;
};

// Resolve references within a bundle
export const resolveReferences = function(bundle) {
  const entries = get(bundle, 'entry', []);
  const resourceMap = {};
  
  // First pass: build resource map
  entries.forEach(entry => {
    const fullUrl = get(entry, 'fullUrl');
    const resource = get(entry, 'resource');
    if (fullUrl && resource) {
      resourceMap[fullUrl] = resource;
      
      // Also map by resource type and id
      const resourceType = get(resource, 'resourceType');
      const resourceId = get(resource, 'id');
      if (resourceType && resourceId) {
        resourceMap[`${resourceType}/${resourceId}`] = resource;
      }
    }
  });
  
  // Second pass: resolve references
  entries.forEach(entry => {
    const resource = get(entry, 'resource');
    if (resource) {
      resolveResourceReferences(resource, resourceMap);
    }
  });
  
  return bundle;
};

// Recursively resolve references in a resource
const resolveResourceReferences = function(obj, resourceMap) {
  if (!obj || typeof obj !== 'object') return;
  
  Object.keys(obj).forEach(key => {
    if (key === 'reference' && typeof obj[key] === 'string') {
      // Check if this reference exists in our map
      const referencedResource = resourceMap[obj[key]];
      if (referencedResource && !obj.display) {
        // Add display text if not present
        obj.display = generateResourceDisplay(referencedResource);
      }
    } else if (typeof obj[key] === 'object') {
      resolveResourceReferences(obj[key], resourceMap);
    }
  });
};

// Generate display text for a resource
const generateResourceDisplay = function(resource) {
  const resourceType = get(resource, 'resourceType');
  
  switch (resourceType) {
    case 'Patient':
      const given = get(resource, 'name[0].given[0]', '');
      const family = get(resource, 'name[0].family', '');
      return `${given} ${family}`.trim() || 'Patient';
      
    case 'Practitioner':
      return get(resource, 'name[0].text', 'Practitioner');
      
    case 'Organization':
      return get(resource, 'name', 'Organization');
      
    case 'Encounter':
      return get(resource, 'type[0].coding[0].display', 'Encounter');
      
    default:
      return resourceType;
  }
};