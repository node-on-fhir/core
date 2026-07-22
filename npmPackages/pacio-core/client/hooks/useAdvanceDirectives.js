// /packages/pacio-core/client/hooks/useAdvanceDirectives.js

import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { mergeAdiSelector } from '../../lib/constants/AdiConstants';

// Advance directives are DocumentReferences (no separate collection).
// Resolve the shared collection at startup per the package convention.
let DocumentReferences;
Meteor.startup(function() {
  DocumentReferences = Meteor.Collections && Meteor.Collections.DocumentReferences;
  if (!DocumentReferences) {
    console.warn('[useAdvanceDirectives] DocumentReferences collection not available');
  }
});

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

    // Fetch data — filter to ADI documents so ToC DocumentReferences
    // published by other subscriptions don't leak into the directives list
    const advanceDirectives = DocumentReferences
      ? DocumentReferences.find(mergeAdiSelector(query), subscriptionOptions).fetch()
      : [];
    
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

    const advanceDirective = DocumentReferences
      ? DocumentReferences.findOne({ _id: directiveId })
      : null;
    
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
  async function revokeDirective(directiveId, reason, callback) {
    if (!directiveId) {
      if (callback) callback(new Error('No directive ID provided'));
      return;
    }

    try {
      const result = await Meteor.rpc('pacio.revokeAdvanceDirective', { directiveId: directiveId, reason: reason });
      if (callback) callback(null, result);
    } catch (error) {
      if (callback) callback(error);
    }
  }

  async function createDirective(directiveData, callback) {
    try {
      const result = await Meteor.rpc('pacio.createAdvanceDirective', { directiveData: directiveData });
      if (callback) callback(null, result);
    } catch (error) {
      if (callback) callback(error);
    }
  }

  async function updateDirective(directiveId, updates, callback) {
    if (!directiveId) {
      if (callback) callback(new Error('No directive ID provided'));
      return;
    }

    try {
      const result = await Meteor.rpc('pacio.updateAdvanceDirective', { directiveId: directiveId, updates: updates });
      if (callback) callback(null, result);
    } catch (error) {
      if (callback) callback(error);
    }
  }

  function uploadDocument(directiveId, file, callback) {
    if (!directiveId) {
      if (callback) callback(new Error('No directive ID provided'));
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async function(event) {
      const base64Data = event.target.result.split(',')[1];

      try {
        const result = await Meteor.rpc('pacio.uploadAdvanceDirectiveDocument', {
          directiveId: directiveId,
          fileData: {
            contentType: file.type,
            data: base64Data,
            title: file.name,
            size: file.size
          }
        });
        if (callback) callback(null, result);
      } catch (error) {
        if (callback) callback(error);
      }
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