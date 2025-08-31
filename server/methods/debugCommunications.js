// server/methods/debugCommunications.js

import { Meteor } from 'meteor/meteor';
import { Communications } from '../../imports/lib/schemas/SimpleSchemas/Communications';
import { get } from 'lodash';

Meteor.methods({
  'debug.getCommunicationsInfo': async function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    
    // Get all communications
    const allComms = await Communications.find({}).fetchAsync();
    
    // Get user's practitioner ID
    const user = await Meteor.users.findOneAsync(this.userId);
    const practitionerId = get(user, 'practitionerId');
    
    // Debug info
    const debugInfo = {
      totalCommunications: allComms.length,
      userPractitionerId: practitionerId,
      userIsPractitioner: get(user, 'profile.isPractitioner'),
      communicationsSummary: []
    };
    
    // Summarize each communication
    allComms.forEach(comm => {
      debugInfo.communicationsSummary.push({
        id: comm._id,
        status: comm.status,
        category: get(comm, 'category.0.coding.0.code', 'no-category'),
        recipient: get(comm, 'recipient.0.reference', 'no-recipient'),
        sender: get(comm, 'sender.reference', 'no-sender'),
        sent: comm.sent,
        payloadText: get(comm, 'payload.0.contentString', '').substring(0, 50) + '...'
      });
    });
    
    // Check specific queries
    if (practitionerId) {
      // Check communications for this practitioner
      const practitionerComms = await Communications.find({
        'recipient.0.reference': `Practitioner/${practitionerId}`
      }).fetchAsync();
      
      debugInfo.communicationsForPractitioner = practitionerComms.length;
      
      // Check with the exact query from MainPage
      const mainPageQuery = {
        $and: [
          {
            $or: [
              { 'recipient.reference': `Practitioner/${practitionerId}` },
              { 
                'recipient.reference': 'Practitioner/chief-medical-officer',
                'category.0.coding.0.code': 'intervention-approval'
              }
            ]
          },
          { status: { $in: ['in-progress', 'preparation'] } },
          { 'category.0.coding.0.code': { $in: ['intervention-approval', 'alert', 'notification'] } }
        ]
      };
      
      const mainPageComms = await Communications.find(mainPageQuery).fetchAsync();
      debugInfo.mainPageQueryCount = mainPageComms.length;
      debugInfo.mainPageQuery = mainPageQuery;
    }
    
    // Check for chief medical officer communications
    const cmoComms = await Communications.find({
      'recipient.0.reference': 'Practitioner/chief-medical-officer'
    }).fetchAsync();
    
    debugInfo.chiefMedicalOfficerComms = cmoComms.length;
    
    // Check for intervention approval communications
    const approvalComms = await Communications.find({
      'category.0.coding.0.code': 'intervention-approval'
    }).fetchAsync();
    
    debugInfo.interventionApprovalComms = approvalComms.length;
    
    return debugInfo;
  },
  
  'debug.linkCurrentUserToCMO': async function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    
    // Get the CMO practitioner ID from settings
    const cmoRef = get(Meteor.settings, 'private.pacio.chiefMedicalOfficer.reference', '');
    const cmoPractitionerId = cmoRef.replace('Practitioner/', '');
    
    if (!cmoPractitionerId) {
      throw new Meteor.Error('not-configured', 'Chief Medical Officer not configured');
    }
    
    // Update the current user
    const result = await Meteor.users.updateAsync(
      { _id: this.userId },
      { 
        $set: { 
          practitionerId: cmoPractitionerId,
          'profile.isPractitioner': true
        } 
      }
    );
    
    console.log(`Linked user ${this.userId} to CMO practitioner ${cmoPractitionerId}`);
    
    return { 
      success: true, 
      practitionerId: cmoPractitionerId,
      message: `Successfully linked to Chief Medical Officer (${cmoPractitionerId})`
    };
  }
});