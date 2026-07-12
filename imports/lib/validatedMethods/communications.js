
// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/lib/validatedMethods/communications.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { get } from 'lodash';
import moment from 'moment';
import { Communications } from '../schemas/SimpleSchemas/Communications';

const COMMUNICATION_STATUSES = ["preparation", "in-progress", "not-done", "on-hold", "stopped", "completed", "entered-in-error", "unknown"];

// Helper function to convert date strings to valid Date objects
const convertCommunicationDates = function(document){
  // Convert sent date if present
  if (document.sent) {
    // Check if it's already a valid date string or Date object
    let sentDate;
    
    // Handle moment objects
    if (moment.isMoment(document.sent)) {
      sentDate = document.sent.toDate();
    } else if (typeof document.sent === 'string' && document.sent.trim() !== '') {
      // Only try to parse if it's a non-empty string
      const momentDate = moment(document.sent);
      if (momentDate.isValid()) {
        sentDate = momentDate.toDate();
      }
    } else if (document.sent instanceof Date) {
      sentDate = document.sent;
    }
    
    if (sentDate && Object.prototype.toString.call(sentDate) === "[object Date]" && !isNaN(sentDate.getTime())) {
      document.sent = sentDate;
    } else {
      console.log('Invalid sent date, removing:', document.sent);
      delete document.sent;
    }
  }

  // Convert received date if present
  if (document.received) {
    // Check if it's already a valid date string or Date object
    let receivedDate;
    
    // Handle moment objects
    if (moment.isMoment(document.received)) {
      receivedDate = document.received.toDate();
    } else if (typeof document.received === 'string' && document.received.trim() !== '') {
      // Only try to parse if it's a non-empty string
      const momentDate = moment(document.received);
      if (momentDate.isValid()) {
        receivedDate = momentDate.toDate();
      }
    } else if (document.received instanceof Date) {
      receivedDate = document.received;
    }
    
    if (receivedDate && Object.prototype.toString.call(receivedDate) === "[object Date]" && !isNaN(receivedDate.getTime())) {
      document.received = receivedDate;
    } else {
      console.log('Invalid received date, removing:', document.received);
      delete document.received;
    }
  }

  return document;
};

export const insertCommunication = new ValidatedMethod({
  name: 'communications.insert',
  validate(document) {
    check(document, Object);
    check(document.resourceType, Match.Optional(String));
    check(document.status, Match.Where(function(status) {
      if (!COMMUNICATION_STATUSES.includes(status)) {
        console.warn('[communications.insert] invalid status:', status);
        return false;
      }
      return true;
    }));
    check(document.subject, Match.Optional(Object));
    check(document.sender, Match.Optional(Object));
    check(document.recipient, Match.Optional([Object]));
    check(document.sent, Match.Optional(String));
    check(document.received, Match.Optional(String));
    check(document.payload, Match.Optional([Object]));
    check(document.category, Match.Optional([Object]));
    check(document.medium, Match.Optional([Object]));
    check(document.identifier, Match.Optional([Object]));
    check(document.note, Match.Optional([Object]));
  },
  async run(document) {
    console.log("insertCommunication", document);

    // Ensure resourceType is set
    if (!document.resourceType) {
      document.resourceType = 'Communication';
    }

    // Convert date strings to Date objects
    document = convertCommunicationDates(document);
    console.log("convertCommunicationDates", document);

    // Set test flag based on environment
    if (process.env.NODE_ENV === "test") {
      document.test = true;
    } else {
      document.test = false;
    }

    // Check if this is an intervention approval communication and set recipient from settings
    if (Meteor.isServer) {
      console.log('Server-side check for intervention approval communication');
      console.log('Category code:', document.category?.[0]?.coding?.[0]?.code);
      console.log('Recipient reference:', document.recipient?.[0]?.reference);
      
      if (document.category?.[0]?.coding?.[0]?.code === 'intervention-approval' &&
          document.recipient?.[0]?.reference === 'Practitioner/chief-medical-officer') {
        const chiefMedicalOfficer = get(Meteor.settings, 'private.pacio.chiefMedicalOfficer', {
          reference: 'Practitioner/chief-medical-officer',
          display: 'Chief Medical Officer'
        });
        console.log('Setting Chief Medical Officer recipient from private settings:', chiefMedicalOfficer);
        document.recipient = [chiefMedicalOfficer];
      }
    }

    // Insert the document using async method for Meteor v3
    const result = await Communications.insertAsync(document);
    console.log('Communication inserted with ID:', result);
    
    // Verify it was inserted
    const inserted = await Communications.findOneAsync(result);
    console.log('Verified communication in database:', inserted);
    
    return result;
  }
});

export const updateCommunication = new ValidatedMethod({
  name: 'communications.update',
  validate({ _id, update }) {
    check(_id, String);
    check(update, Match.Optional(Object));
  },
  async run({ _id, update }) {
    console.log("updateCommunication");
    console.log("_id", _id);
    console.log("update", update);

    // Convert date strings in the update
    update = convertCommunicationDates(update);

    // Find the existing communication
    let communication = await Communications.findOneAsync({_id: _id});
    
    if (!communication) {
      throw new Meteor.Error('communication-not-found', 'Communication not found');
    }

    // Remove internal Meteor properties
    delete communication._id;
    delete communication._document;
    delete communication._super_;
    delete communication._collection;

    // Update fields that are provided
    if (update.status) {
      communication.status = update.status;
    }
    
    if (update.subject) {
      communication.subject = update.subject;
    }
    
    if (update.sender) {
      communication.sender = update.sender;
    }
    
    if (update.recipient) {
      communication.recipient = update.recipient;
    }
    
    if (update.sent !== undefined) {
      communication.sent = update.sent;
    }
    
    if (update.received !== undefined) {
      communication.received = update.received;
    }
    
    if (update.payload) {
      communication.payload = update.payload;
    }
    
    if (update.category) {
      communication.category = update.category;
    }
    
    if (update.medium) {
      communication.medium = update.medium;
    }
    
    if (update.identifier) {
      communication.identifier = update.identifier;
    }
    
    if (update.note) {
      communication.note = update.note;
    }

    console.log("updatedCommunication", communication);
    return await Communications.updateAsync({_id: _id}, { $set: communication });
  }
});

export const removeCommunicationById = new ValidatedMethod({
  name: 'communications.removeById',
  validate({ _id }) {
    check(_id, String);
  },
  async run({ _id }) {
    console.log("[Server] Attempting to remove communication:", _id);
    
    // First, check if the communication exists
    const existingComm = await Communications.findOneAsync({
      $or: [
        { _id: _id },
        { id: _id }
      ]
    });
    
    if (!existingComm) {
      console.error("[Server] Communication not found for deletion:", _id);
      throw new Meteor.Error('communication-not-found', `Communication ${_id} not found for deletion`);
    }
    
    console.log("[Server] Found communication to delete:", {
      _id: existingComm._id,
      id: existingComm.id,
      category: existingComm.category?.[0]?.coding?.[0]?.code,
      status: existingComm.status
    });
    
    // Use the actual _id for deletion
    const actualId = existingComm._id;
    const result = await Communications.removeAsync({ _id: actualId });
    
    console.log("[Server] Communication removal result:", result);
    
    // Verify it was deleted
    const stillExists = await Communications.findOneAsync({ _id: actualId });
    if (stillExists) {
      console.error("[Server] Communication still exists after deletion attempt!");
      throw new Meteor.Error('deletion-failed', 'Communication was not deleted');
    } else {
      console.log("[Server] Verified communication was successfully deleted");
    }
    
    return result;
  }
});

export const getCommunication = new ValidatedMethod({
  name: 'communications.get',
  validate({ _id }) {
    check(_id, String);
  },
  async run({ _id }) {
    console.log("Getting communication " + _id);
    
    const communication = await Communications.findOneAsync({_id: _id});
    
    if (!communication) {
      throw new Meteor.Error('communication-not-found', 'Communication not found');
    }
    
    return communication;
  }
});

export const searchCommunications = new ValidatedMethod({
  name: 'communications.search',
  validate({ query, options }) {
    check(query, Match.Optional(Object));
    check(options, Match.Optional(Object));
  },
  async run({ query = {}, options = {} }) {
    console.log("Searching communications", query, options);
    
    // Default options
    const defaultOptions = {
      limit: 100,
      sort: { sent: -1 }
    };
    
    const finalOptions = Object.assign({}, defaultOptions, options);
    
    const cursor = Communications.find(query, finalOptions);
    return await cursor.fetchAsync();
  }
});


