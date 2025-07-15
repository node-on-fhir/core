// /packages/pacio-core/client/hooks/useAdvanceDirectives.js

import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { AdvanceDirectives } from '/imports/lib/schemas/SimpleSchemas/AdvanceDirectives';

export function useAdvanceDirectives(options = {}) {
  const {
    patientId,
    status,
    includeRevoked = false,
    sortBy = 'date',
    sortOrder = -1,
    limit
  } = options;
  
  return useTracker(function() {
    // Build query
    const query = {};
    
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    } else if (!includeRevoked) {
      query.status = { $ne: 'entered-in-error' };
    }
    
    // Build options
    const subscriptionOptions = {
      sort: { [sortBy]: sortOrder }
    };
    
    if (limit) {
      subscriptionOptions.limit = limit;
    }
    
    // Subscribe
    const subscription = Meteor.subscribe('pacio.advanceDirectives', patientId);
    const loading = !subscription.ready();
    
    // Fetch data
    const advanceDirectives = AdvanceDirectives.find(query, subscriptionOptions).fetch();
    
    // Calculate counts
    const counts = {
      total: advanceDirectives.length,
      current: 0,
      superseded: 0,
      revoked: 0,
      draft: 0
    };
    
    advanceDirectives.forEach(function(directive) {
      const directiveStatus = get(directive, 'status');
      if (directiveStatus === 'active' || directiveStatus === 'completed') {
        counts.current++;
      } else if (directiveStatus === 'superseded') {
        counts.superseded++;
      } else if (directiveStatus === 'entered-in-error') {
        counts.revoked++;
      } else if (directiveStatus === 'draft') {
        counts.draft++;
      }
    });
    
    // Get most recent directive
    const mostRecent = advanceDirectives.length > 0 ? advanceDirectives[0] : null;
    
    // Get current (non-superseded, non-revoked) directives
    const currentDirectives = advanceDirectives.filter(function(directive) {
      const directiveStatus = get(directive, 'status');
      return directiveStatus === 'active' || directiveStatus === 'completed';
    });
    
    return {
      advanceDirectives,
      currentDirectives,
      mostRecent,
      counts,
      loading,
      ready: !loading,
      subscription
    };
  }, [patientId, status, includeRevoked, sortBy, sortOrder, limit]);
}

// Hook for a single advance directive
export function useAdvanceDirective(directiveId) {
  return useTracker(function() {
    if (!directiveId) {
      return {
        advanceDirective: null,
        loading: false,
        ready: true,
        error: 'No directive ID provided'
      };
    }
    
    const subscription = Meteor.subscribe('pacio.advanceDirectives', null, directiveId);
    const loading = !subscription.ready();
    
    const advanceDirective = AdvanceDirectives.findOne(directiveId);
    
    return {
      advanceDirective,
      loading,
      ready: !loading,
      error: !loading && !advanceDirective ? 'Advance directive not found' : null,
      subscription
    };
  }, [directiveId]);
}

// Hook for managing advance directive operations
export function useAdvanceDirectiveOperations() {
  function revokeDirective(directiveId, reason, callback) {
    if (!directiveId) {
      if (callback) callback(new Error('No directive ID provided'));
      return;
    }
    
    Meteor.call('pacio.revokeAdvanceDirective', directiveId, reason, callback);
  }
  
  function createDirective(directiveData, callback) {
    Meteor.call('pacio.createAdvanceDirective', directiveData, callback);
  }
  
  function updateDirective(directiveId, updates, callback) {
    if (!directiveId) {
      if (callback) callback(new Error('No directive ID provided'));
      return;
    }
    
    Meteor.call('pacio.updateAdvanceDirective', directiveId, updates, callback);
  }
  
  function uploadDocument(directiveId, file, callback) {
    if (!directiveId) {
      if (callback) callback(new Error('No directive ID provided'));
      return;
    }
    
    // Convert file to base64
    const reader = new FileReader();
    reader.onload = function(event) {
      const base64Data = event.target.result.split(',')[1];
      
      Meteor.call('pacio.uploadAdvanceDirectiveDocument', directiveId, {
        contentType: file.type,
        data: base64Data,
        title: file.name,
        size: file.size
      }, callback);
    };
    reader.readAsDataURL(file);
  }
  
  return {
    revokeDirective,
    createDirective,
    updateDirective,
    uploadDocument
  };
}