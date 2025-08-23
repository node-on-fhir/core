// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/api/communications/client.js

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';
import { Communications } from '../../lib/schemas/SimpleSchemas/Communications';

// Client-side helper methods
export const CommunicationsClient = {
  // Subscribe to communications with reactive handling
  subscribe: function(publicationName, ...args) {
    return Meteor.subscribe(publicationName, ...args);
  },
  
  // Get communications for a specific patient
  getByPatient: function(patientId, options = {}) {
    const defaultOptions = {
      sort: { sent: -1 },
      limit: 100
    };
    
    return Communications.find({
      $or: [
        { 'subject.reference': `Patient/${patientId}` },
        { 'recipient.reference': `Patient/${patientId}` }
      ]
    }, Object.assign({}, defaultOptions, options));
  },
  
  // Get communications between two parties
  getBetween: function(party1Reference, party2Reference, options = {}) {
    const defaultOptions = {
      sort: { sent: -1 }
    };
    
    return Communications.find({
      $or: [
        {
          'sender.reference': party1Reference,
          'recipient.reference': party2Reference
        },
        {
          'sender.reference': party2Reference,
          'recipient.reference': party1Reference
        }
      ]
    }, Object.assign({}, defaultOptions, options));
  },
  
  // Get unread communications (received but not yet marked as read)
  getUnread: function(recipientReference, options = {}) {
    const defaultOptions = {
      sort: { received: -1 }
    };
    
    return Communications.find({
      'recipient.reference': recipientReference,
      status: { $nin: ['completed', 'entered-in-error'] }
    }, Object.assign({}, defaultOptions, options));
  },
  
  // Count communications by status
  countByStatus: function(status) {
    return Communications.find({ status: status }).count();
  },
  
  // Get recent communications (reactive)
  getRecent: function(hours = 24, options = {}) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);
    
    const defaultOptions = {
      sort: { sent: -1 },
      limit: 50
    };
    
    return Communications.find({
      $or: [
        { sent: { $gte: cutoffDate } },
        { received: { $gte: cutoffDate } }
      ]
    }, Object.assign({}, defaultOptions, options));
  },
  
  // Helper to format communication for display
  formatForDisplay: function(communication) {
    const formatted = {
      id: communication._id,
      status: communication.status,
      sender: communication.sender ? communication.sender.display || communication.sender.reference : 'Unknown',
      recipient: communication.recipient && communication.recipient[0] 
        ? communication.recipient[0].display || communication.recipient[0].reference 
        : 'Unknown',
      subject: communication.subject ? communication.subject.display || communication.subject.reference : null,
      sent: communication.sent,
      received: communication.received,
      message: ''
    };
    
    // Extract message content
    if (communication.payload && communication.payload.length > 0) {
      const payload = communication.payload[0];
      if (payload.contentString) {
        formatted.message = payload.contentString;
      } else if (payload.contentAttachment && payload.contentAttachment.data) {
        formatted.message = '[Attachment]';
      } else if (payload.contentReference) {
        formatted.message = '[Reference: ' + payload.contentReference.reference + ']';
      }
    }
    
    // Format dates
    if (formatted.sent) {
      formatted.sentFormatted = moment(formatted.sent).format('MMM D, YYYY h:mm A');
      formatted.sentRelative = moment(formatted.sent).fromNow();
    }
    
    if (formatted.received) {
      formatted.receivedFormatted = moment(formatted.received).format('MMM D, YYYY h:mm A');
      formatted.receivedRelative = moment(formatted.received).fromNow();
    }
    
    return formatted;
  }
};

// Make it available globally on the client
if (Meteor.isClient) {
  window.CommunicationsClient = CommunicationsClient;
}