// packages/smart-web-messaging/lib/constants/MessageTypes.js

/**
 * SMART Web Messaging Message Types
 * Based on the SMART Web Messaging IG specification
 */
MessageTypes = {
  // Status messages - Connection handshake
  STATUS: {
    HANDSHAKE: 'status.handshake',
    READY: 'status.ready',
    RESPONSE: 'status.response'
  },
  
  // UI control messages
  UI: {
    DONE: 'ui.done',
    LAUNCH_ACTIVITY: 'ui.launchActivity'
  },
  
  // Scratchpad operations - temporary FHIR resource management
  SCRATCHPAD: {
    CREATE: 'scratchpad.create',
    READ: 'scratchpad.read',
    UPDATE: 'scratchpad.update',
    DELETE: 'scratchpad.delete'
  },
  
  // FHIR operations proxy
  FHIR: {
    HTTP: 'fhir.http'
  },
  
  // Helper function to validate message type
  isValid: function(messageType) {
    const allTypes = [
      ...Object.values(this.STATUS),
      ...Object.values(this.UI),
      ...Object.values(this.SCRATCHPAD),
      ...Object.values(this.FHIR)
    ];
    return allTypes.includes(messageType);
  },
  
  // Get category from message type (e.g., 'status' from 'status.ready')
  getCategory: function(messageType) {
    if (!messageType || typeof messageType !== 'string') return null;
    const parts = messageType.split('.');
    return parts.length > 0 ? parts[0] : null;
  },
  
  // Get action from message type (e.g., 'ready' from 'status.ready')
  getAction: function(messageType) {
    if (!messageType || typeof messageType !== 'string') return null;
    const parts = messageType.split('.');
    return parts.length > 1 ? parts[1] : null;
  }
};