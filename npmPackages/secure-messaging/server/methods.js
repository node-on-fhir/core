// packages/secure-messaging/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get, has } from 'lodash';
import { Random } from 'meteor/random';

// rpc-migration: Meteor.methods -> Meteor.ServerMethods.define (npmPackages
// exemplar — GLOBAL Meteor.ServerMethods). Names already dotted-canonical
// (secureMessaging.*), no renames/aliases. send/getInbox/markAsRead/getThread
// had `this.userId` guards -> requireAuth (default true) and phi: true (message
// content / inbox). verifyDirectAddress was guard-less (validates a Direct
// address + cert, no patient data) and checkSmtpRelay was guard-less (settings
// check returning a boolean, never leaks the relay) -> requireAuth: false, no PHI.

/**
 * Send a secure message (Direct or Patient Portal)
 */
Meteor.ServerMethods.define('secureMessaging.send', {
  description: 'Send a secure Direct or patient-portal message as a FHIR Communication resource',
  phi: true,
  positionalParams: ['messageData'],
  schemaObject: {
    type: 'object',
    properties: {
      messageData: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
          type: { type: 'string', enum: ['direct', 'patient'] },
          encrypted: { type: 'boolean' },
          requestMDN: { type: 'boolean' },
          attachments: { type: 'array', items: { type: 'string' } },
          threadId: { type: 'string' }
        },
        required: ['to', 'subject', 'body', 'type']
      }
    },
    required: ['messageData']
  }
}, async function(params, context){
    const messageData = params.messageData;
    context.log.info('secureMessaging.send');

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
        reference: `Patient/${context.userId}`,
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
        reference: `Practitioner/${context.userId}`
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
      userId: context.userId,
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
});

/**
 * Get message inbox
 */
Meteor.ServerMethods.define('secureMessaging.getInbox', {
  description: 'Return the current user\'s secure-messaging inbox (FHIR Communications), filtered by type/status',
  phi: true,
  positionalParams: ['options'],
  schemaObject: {
    type: 'object',
    properties: {
      options: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['all', 'direct', 'patient'] },
          status: { type: 'string', enum: ['all', 'unread', 'read', 'delivered'] },
          limit: { type: 'number' },
          offset: { type: 'number' }
        }
      }
    }
  }
}, async function(params, context){
    const options = params.options || {};
    context.log.info('secureMessaging.getInbox');

    const query = {
      $or: [
        { 'sender.reference': `Practitioner/${context.userId}` },
        { 'recipient.reference': `Practitioner/${context.userId}` },
        { 'subject.reference': `Patient/${context.userId}` }
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
});

/**
 * Mark message as read
 */
Meteor.ServerMethods.define('secureMessaging.markAsRead', {
  description: 'Mark a secure message as read and emit a Direct MDN when applicable',
  phi: true,
  positionalParams: ['messageId'],
  schemaObject: {
    type: 'object',
    properties: { messageId: { type: 'string' } },
    required: ['messageId']
  }
}, async function(params, context){
    const messageId = params.messageId;
    context.log.info('secureMessaging.markAsRead', { messageId });

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
});

/**
 * Verify Direct address certificate
 */
Meteor.ServerMethods.define('secureMessaging.verifyDirectAddress', {
  description: 'Validate a Direct address format and verify its X.509 certificate',
  // Guard-less pre-migration; validates a supplied Direct address + public cert
  // check, no patient data. Public.
  requireAuth: false,
  phi: false,
  positionalParams: ['directAddress'],
  schemaObject: {
    type: 'object',
    properties: { directAddress: { type: 'string' } },
    required: ['directAddress']
  }
}, async function(params, context){
    const directAddress = params.directAddress;
    context.log.info('secureMessaging.verifyDirectAddress');

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
});

/**
 * Get message thread
 */
Meteor.ServerMethods.define('secureMessaging.getThread', {
  description: 'Return all messages (FHIR Communications) belonging to a thread',
  phi: true,
  positionalParams: ['threadId'],
  schemaObject: {
    type: 'object',
    properties: { threadId: { type: 'string' } },
    required: ['threadId']
  }
}, async function(params, context){
    const threadId = params.threadId;
    context.log.info('secureMessaging.getThread', { threadId });

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
});

/**
 * Check whether the SMTP relay is configured (settings-gated check method).
 * Reads settings.private.email.smtp server-side only — never leaks the relay
 * to the client; returns just a boolean. Mirrors the relay logic in
 * imports/accounts/server/email-config.js.
 */
Meteor.ServerMethods.define('secureMessaging.checkSmtpRelay', {
  description: 'Report whether an SMTP relay is configured without leaking the relay settings',
  // Public by design (settings-gated check): returns only a boolean so the UI
  // can render its relay state before auth resolves; never exposes credentials.
  requireAuth: false
}, async function(){
    const smtp = get(Meteor, 'settings.private.email.smtp', {});
    const host = get(smtp, 'host', '');
    const username = get(smtp, 'username', '');
    const password = get(smtp, 'password', '');
    const configured = !!process.env.MAIL_URL ||
      (!!host && !!username && username !== 'YOUR_SMTP_USERNAME' && !!password);
    console.log('[secureMessaging.checkSmtpRelay] configured:', configured);
    return { configured: configured };
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