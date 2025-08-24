
// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/lib/validatedMethods/communications.js

import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { get } from 'lodash';
import moment from 'moment';
import { Communications } from '../schemas/SimpleSchemas/Communications';

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
  validate: new SimpleSchema({
    'resourceType': { type: String, optional: true, defaultValue: 'Communication' },
    'status': { 
      type: String, 
      allowedValues: ["preparation", "in-progress", "not-done", "on-hold", "stopped", "completed", "entered-in-error", "unknown"],
      defaultValue: 'completed'
    },
    'subject': { type: Object, optional: true, blackbox: true },
    'subject.reference': { type: String, optional: true },
    'subject.display': { type: String, optional: true },
    'sender': { type: Object, optional: true, blackbox: true },
    'sender.reference': { type: String, optional: true },
    'sender.display': { type: String, optional: true },
    'recipient': { type: Array, optional: true },
    'recipient.$': { type: Object, blackbox: true },
    'sent': { type: String, optional: true },
    'received': { type: String, optional: true },
    'payload': { type: Array, optional: true },
    'payload.$': { type: Object, blackbox: true },
    'payload.$.contentString': { type: String, optional: true },
    'category': { type: Array, optional: true },
    'category.$': { type: Object, blackbox: true },
    'medium': { type: Array, optional: true },
    'medium.$': { type: Object, blackbox: true },
    'identifier': { type: Array, optional: true },
    'identifier.$': { type: Object, blackbox: true },
    'note': { type: Array, optional: true },
    'note.$': { type: Object, blackbox: true },
    'note.$.text': { type: String, optional: true }
  }).validator(),
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
  validate: new SimpleSchema({
    _id: { type: String },
    'update': { type: Object, blackbox: true, optional: true }
  }).validator(),
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
  validate: new SimpleSchema({
    _id: { type: String }
  }).validator(),
  async run({ _id }) {
    console.log("Removing communication " + _id);
    return await Communications.removeAsync({_id: _id});
  }
});

export const getCommunication = new ValidatedMethod({
  name: 'communications.get',
  validate: new SimpleSchema({
    _id: { type: String }
  }).validator(),
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
  validate: new SimpleSchema({
    query: { type: Object, blackbox: true, optional: true },
    options: { type: Object, blackbox: true, optional: true }
  }).validator(),
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


