// packages/hipaa-compliance/lib/HipaaLoggerAccess.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Access the global HipaaLogger from the main app
export const getHipaaLogger = function() {
  if (Meteor.isClient) {
    return get(window, 'HipaaLogger') || get(Meteor, 'HipaaLogger');
  } else if (Meteor.isServer) {
    // On server, try global first, then Meteor
    return get(global, 'HipaaLogger') || get(Meteor, 'HipaaLogger');
  }
  return null;
};

// Export a wrapper that provides the same interface
export const HipaaLogger = {
  logEvent: function(...args) {
    const logger = getHipaaLogger();
    if (logger && logger.logEvent) {
      return logger.logEvent(...args);
    }
    // Silently fail - HipaaLogger might not be available during startup
    // This is expected behavior as packages load before the main app
    return null;
  },
  
  logAuditEvent: function(...args) {
    const logger = getHipaaLogger();
    if (logger && logger.logAuditEvent) {
      return logger.logAuditEvent(...args);
    }
    // Silently fail - HipaaLogger might not be available during startup
    // This is expected behavior as packages load before the main app
    return null;
  },
  
  logPatientAccess: function(...args) {
    const logger = getHipaaLogger();
    if (logger && logger.logPatientAccess) {
      return logger.logPatientAccess(...args);
    }
    // Silently fail - HipaaLogger might not be available during startup
    // This is expected behavior as packages load before the main app
    return null;
  },
  
  logDataModification: function(...args) {
    const logger = getHipaaLogger();
    if (logger && logger.logDataModification) {
      return logger.logDataModification(...args);
    }
    // Silently fail - HipaaLogger might not be available during startup
    // This is expected behavior as packages load before the main app
    return null;
  },
  
  logSystemEvent: function(...args) {
    const logger = getHipaaLogger();
    if (logger && logger.logSystemEvent) {
      return logger.logSystemEvent(...args);
    }
    // Silently fail - HipaaLogger might not be available during startup
    // This is expected behavior as packages load before the main app
    return null;
  },
  
  logSecurityEvent: function(...args) {
    const logger = getHipaaLogger();
    if (logger && logger.logSecurityEvent) {
      return logger.logSecurityEvent(...args);
    }
    // Silently fail - HipaaLogger might not be available during startup
    // This is expected behavior as packages load before the main app
    return null;
  },
  
  // Initialize is no-op since we're using the global logger
  initialize: function() {
    return true;
  },
  
  setInvocation: function(...args) {
    const logger = getHipaaLogger();
    if (logger && logger.setInvocation) {
      return logger.setInvocation(...args);
    }
    return null;
  }
};