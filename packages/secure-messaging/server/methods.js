// packages/secure-messaging/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get, has } from 'lodash';
import { Random } from 'meteor/random';

Meteor.methods({
  /**
   * Send a secure message (Direct or Patient Portal)
   */
  'secureMessaging.send': async function(messageData) {
    console.log('SecureMessaging.send', messageData);
    
    check(messageData, {
      to: String,
      subject: String,
      body: String,
      type: Match.OneOf('direct', 'patient'),
      encrypted: Match.Optional(Boolean),
      requestMDN: Match.Optional(Boolean),
      attachments: Match.Optional([String]),
      threadId: Match.Optional(String)
    });
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to send messages');
    }
    
    // Create FHIR Communication resource
    const communication = {
      resourceType: 'Communication',
      id: Random.id(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString()
      },
      status: 'in-progress',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/communication-category',
          code: messageData.type === 'direct' ? 'notification' : 'instruction',
          display: messageData.type === 'direct' ? 'Direct Message' : 'Patient Portal Message'
        }]
      }],
      priority: 'routine',
      subject: {
        reference: `Patient/${this.userId}`,
        display: 'Current User'
      },
      topic: {
        text: messageData.subject
      },
      sent: new Date().toISOString(),
      recipient: [{
        display: messageData.to
      }],
      sender: {
        reference: `Practitioner/${this.userId}`
      },
      payload: [{
        contentString: messageData.body
      }]
    };
    
    // Add Direct-specific extensions
    if (messageData.type === 'direct') {
      communication.extension = communication.extension || [];
      communication.extension.push({
        url: 'http://hl7.org/fhir/StructureDefinition/communication-encrypted',
        valueBoolean: messageData.encrypted || true
      });
      
      if (messageData.requestMDN) {
        communication.extension.push({
          url: 'http://hl7.org/fhir/StructureDefinition/communication-mdn-requested',
          valueBoolean: true
        });
      }
    }
    
    // Handle attachments
    if (messageData.attachments && messageData.attachments.length > 0) {
      for (let attachment of messageData.attachments) {
        communication.payload.push({
          contentAttachment: {
            url: attachment,
            title: attachment.split('/').pop()
          }
        });
      }
    }
    
    // Store in Communications collection if available
    let communicationId;
    if (global.Collections?.Communications) {
      const Communications = await global.Collections.Communications;
      if (Communications && typeof Communications.insertAsync === 'function') {
        communicationId = await Communications.insertAsync(communication);
        console.log('Created Communication:', communicationId);
      }
    } else {
      // Fallback if collection not available
      communicationId = communication.id;
    }
    
    // Create audit event for compliance
    await logMessageSend({
      userId: this.userId,
      messageId: communicationId,
      type: messageData.type,
      recipient: messageData.to,
      encrypted: messageData.encrypted,
      timestamp: new Date()
    });
    
    // If Direct message, initiate Direct protocol send
    if (messageData.type === 'direct') {
      Meteor.defer(() => {
        sendDirectMessage(communication, messageData);
      });
    }
    
    return {
      success: true,
      messageId: communicationId,
      status: 'sent'
    };
  },

  /**
   * Get message inbox
   */
  'secureMessaging.getInbox': async function(options = {}) {
    console.log('SecureMessaging.getInbox', options);
    
    check(options, {
      type: Match.Optional(Match.OneOf('all', 'direct', 'patient')),
      status: Match.Optional(Match.OneOf('all', 'unread', 'read', 'delivered')),
      limit: Match.Optional(Number),
      offset: Match.Optional(Number)
    });
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to view messages');
    }
    
    const query = {
      $or: [
        { 'sender.reference': `Practitioner/${this.userId}` },
        { 'recipient.reference': `Practitioner/${this.userId}` },
        { 'subject.reference': `Patient/${this.userId}` }
      ]
    };
    
    if (options.type && options.type !== 'all') {
      query['category.coding.code'] = options.type === 'direct' ? 'notification' : 'instruction';
    }
    
    if (options.status && options.status !== 'all') {
      query.status = options.status;
    }
    
    if (global.Collections?.Communications) {
      const Communications = await global.Collections.Communications;
      if (Communications && typeof Communications.findAsync === 'function') {
        const messages = await Communications.findAsync(query, {
          sort: { sent: -1 },
          limit: options.limit || 50,
          skip: options.offset || 0
        }).fetchAsync();
        
        return messages;
      }
    }
    
    // Return sample data if collection not available
    return [];
  },

  /**
   * Mark message as read
   */
  'secureMessaging.markAsRead': async function(messageId) {
    console.log('SecureMessaging.markAsRead', messageId);
    
    check(messageId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    if (global.Collections?.Communications) {
      const Communications = await global.Collections.Communications;
      if (Communications && typeof Communications.updateAsync === 'function') {
        await Communications.updateAsync(messageId, {
          $set: {
            status: 'completed',
            'extension': [{
              url: 'http://hl7.org/fhir/StructureDefinition/communication-read-timestamp',
              valueDateTime: new Date().toISOString()
            }]
          }
        });
        
        // Create read receipt if Direct message
        const message = await Communications.findOneAsync(messageId);
        if (message?.category?.[0]?.coding?.[0]?.code === 'notification') {
          await sendMDN(message, 'displayed');
        }
      }
    }
    
    return { success: true };
  },

  /**
   * Verify Direct address certificate
   */
  'secureMessaging.verifyDirectAddress': async function(directAddress) {
    console.log('SecureMessaging.verifyDirectAddress', directAddress);
    
    check(directAddress, String);
    
    // Validate Direct address format
    const directPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.direct\.[a-zA-Z]{2,}$/;
    if (!directPattern.test(directAddress)) {
      throw new Meteor.Error('invalid-address', 'Invalid Direct address format');
    }
    
    // In production, this would query certificate authorities
    // For demo, we'll simulate certificate verification
    const verified = await verifyX509Certificate(directAddress);
    
    return {
      address: directAddress,
      verified: verified,
      certificate: verified ? {
        subject: directAddress,
        issuer: 'Demo Certificate Authority',
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
        algorithm: 'RSA-SHA256'
      } : null
    };
  },

  /**
   * Get message thread
   */
  'secureMessaging.getThread': async function(threadId) {
    console.log('SecureMessaging.getThread', threadId);
    
    check(threadId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    if (global.Collections?.Communications) {
      const Communications = await global.Collections.Communications;
      if (Communications && typeof Communications.findAsync === 'function') {
        const messages = await Communications.findAsync({
          'partOf.reference': `Communication/${threadId}`
        }, {
          sort: { sent: 1 }
        }).fetchAsync();
        
        return messages;
      }
    }
    
    return [];
  }
});

// Helper function to send Direct message via Direct protocol
async function sendDirectMessage(communication, messageData) {
  try {
    // In production, this would:
    // 1. Look up recipient's certificate from DNS/LDAP
    // 2. Encrypt message with S/MIME
    // 3. Send via SMTP with TLS
    // 4. Request MDN if configured
    
    console.log('Sending Direct message:', {
      to: messageData.to,
      subject: messageData.subject,
      encrypted: messageData.encrypted,
      mdn: messageData.requestMDN
    });
    
    // Simulate Direct protocol send
    const result = {
      messageId: communication.id,
      status: 'sent',
      timestamp: new Date().toISOString(),
      encrypted: true,
      mdnRequested: messageData.requestMDN
    };
    
    return result;
  } catch (error) {
    console.error('Direct message send failed:', error);
    throw error;
  }
}

// Helper function to send Message Disposition Notification
async function sendMDN(message, disposition) {
  // Create MDN according to RFC 3798
  const mdn = {
    resourceType: 'Communication',
    id: Random.id(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/communication-mdn']
    },
    status: 'completed',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/communication-category',
        code: 'notification',
        display: 'Message Disposition Notification'
      }]
    }],
    inResponseTo: [{
      reference: `Communication/${message.id}`
    }],
    sent: new Date().toISOString(),
    payload: [{
      contentString: `MDN for message ${message.id}: ${disposition}`
    }],
    extension: [{
      url: 'http://hl7.org/fhir/StructureDefinition/mdn-disposition',
      valueCode: disposition // 'displayed', 'processed', 'failed', 'deleted'
    }]
  };
  
  console.log('Sending MDN:', mdn);
  return mdn;
}

// Helper function to verify X.509 certificate
async function verifyX509Certificate(directAddress) {
  // In production, this would:
  // 1. Query DNS for CERT record
  // 2. Validate certificate chain
  // 3. Check revocation status (CRL/OCSP)
  // 4. Verify certificate matches address
  
  // For demo, return true for .direct.org addresses
  return directAddress.endsWith('.direct.org');
}

// Helper function to create audit events
async function logMessageSend(auditData) {
  const auditEvent = {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
      code: 'rest',
      display: 'Secure Messaging'
    },
    subtype: [{
      system: 'http://hl7.org/fhir/restful-interaction',
      code: auditData.type === 'direct' ? 'direct-send' : 'message-send',
      display: auditData.type === 'direct' ? 'Direct Message Sent' : 'Secure Message Sent'
    }],
    action: 'C', // Create
    recorded: auditData.timestamp.toISOString(),
    outcome: '0', // Success
    agent: [{
      who: {
        reference: `Practitioner/${auditData.userId}`
      },
      requestor: true
    }],
    source: {
      site: 'Honeycomb Secure Messaging',
      type: [{
        system: 'http://terminology.hl7.org/CodeSystem/security-source-type',
        code: '4',
        display: 'Application Server'
      }]
    },
    entity: [{
      what: {
        reference: `Communication/${auditData.messageId}`
      },
      type: {
        system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type',
        code: '2',
        display: 'System Object'
      },
      detail: [{
        type: 'encrypted',
        valueString: String(auditData.encrypted)
      }, {
        type: 'recipient',
        valueString: auditData.recipient
      }]
    }]
  };
  
  if (global.Collections?.AuditEvents) {
    const AuditEvents = await global.Collections.AuditEvents;
    if (AuditEvents && typeof AuditEvents.insertAsync === 'function') {
      await AuditEvents.insertAsync(auditEvent);
      console.log('Logged message send audit event');
    }
  }
  
  return auditEvent;
}