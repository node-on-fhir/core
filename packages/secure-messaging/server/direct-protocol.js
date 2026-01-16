// packages/secure-messaging/server/direct-protocol.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

/**
 * Direct Protocol Implementation
 * Handles S/MIME encryption, certificate management, and MDN processing
 * for ONC §170.315(h)(1) compliance
 */

export const DirectProtocol = {
  /**
   * Initialize Direct messaging endpoints
   */
  initialize() {
    console.log('Initializing Direct Protocol handlers');
    
    // Register webhook for incoming Direct messages
    if (Meteor.isServer) {
      WebApp.connectHandlers.use('/direct/receive', this.handleIncomingDirect.bind(this));
      WebApp.connectHandlers.use('/direct/mdn', this.handleMDN.bind(this));
    }
  },

  /**
   * Handle incoming Direct message via webhook
   */
  async handleIncomingDirect(req, res) {
    console.log('Received incoming Direct message');
    
    try {
      // Parse S/MIME message
      const message = await this.parseSMIME(req.body);
      
      // Verify sender certificate
      const verified = await this.verifySenderCertificate(message.from);
      
      if (!verified) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Certificate verification failed' 
        }));
        return;
      }
      
      // Decrypt message if encrypted
      let content = message.content;
      if (message.encrypted) {
        content = await this.decryptMessage(message.content);
      }
      
      // Create FHIR Communication resource
      const communication = {
        resourceType: 'Communication',
        id: Random.id(),
        meta: {
          source: 'direct-protocol',
          profile: ['http://hl7.org/fhir/StructureDefinition/direct-communication']
        },
        status: 'completed',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/communication-category',
            code: 'notification',
            display: 'Direct Message'
          }]
        }],
        sent: message.date || new Date().toISOString(),
        received: new Date().toISOString(),
        sender: {
          display: message.from
        },
        recipient: [{
          display: message.to
        }],
        topic: {
          text: message.subject
        },
        payload: [{
          contentString: content
        }],
        extension: [{
          url: 'http://hl7.org/fhir/StructureDefinition/direct-message-id',
          valueString: message.messageId
        }, {
          url: 'http://hl7.org/fhir/StructureDefinition/direct-encrypted',
          valueBoolean: message.encrypted
        }]
      };
      
      // Store message
      await this.storeIncomingMessage(communication);
      
      // Send MDN if requested
      if (message.mdnRequested) {
        await this.sendMDN(message, 'processed');
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true,
        messageId: communication.id
      }));
      
    } catch (error) {
      console.error('Error processing Direct message:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Failed to process message' 
      }));
    }
  },

  /**
   * Handle MDN receipt
   */
  async handleMDN(req, res) {
    console.log('Received MDN');
    
    try {
      const mdn = await this.parseMDN(req.body);
      
      // Update original message status
      if (global.Collections?.Communications) {
        const Communications = await global.Collections.Communications;
        await Communications.updateAsync(
          { 'extension.valueString': mdn.originalMessageId },
          {
            $set: {
              status: mdn.disposition === 'displayed' ? 'completed' : 'in-progress'
            },
            $push: {
              extension: {
                url: 'http://hl7.org/fhir/StructureDefinition/mdn-received',
                valueDateTime: new Date().toISOString()
              }
            }
          }
        );
      }
      
      res.writeHead(200);
      res.end();
      
    } catch (error) {
      console.error('Error processing MDN:', error);
      res.writeHead(500);
      res.end();
    }
  },

  /**
   * Parse S/MIME message
   */
  async parseSMIME(rawMessage) {
    // In production, use a proper S/MIME library
    // For demonstration, parse basic structure
    const lines = rawMessage.split('\n');
    const headers = {};
    let bodyStart = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === '') {
        bodyStart = i + 1;
        break;
      }
      const [key, value] = lines[i].split(': ');
      headers[key.toLowerCase()] = value;
    }
    
    return {
      messageId: headers['message-id'],
      from: headers['from'],
      to: headers['to'],
      subject: headers['subject'],
      date: headers['date'],
      encrypted: headers['content-type']?.includes('pkcs7-mime'),
      mdnRequested: headers['disposition-notification-to'] !== undefined,
      content: lines.slice(bodyStart).join('\n')
    };
  },

  /**
   * Parse MDN
   */
  async parseMDN(rawMDN) {
    // Parse RFC 3798 MDN format
    const lines = rawMDN.split('\n');
    const mdn = {
      originalMessageId: null,
      disposition: null
    };
    
    for (let line of lines) {
      if (line.startsWith('Original-Message-ID:')) {
        mdn.originalMessageId = line.split(':')[1].trim();
      }
      if (line.startsWith('Disposition:')) {
        mdn.disposition = line.includes('displayed') ? 'displayed' : 'processed';
      }
    }
    
    return mdn;
  },

  /**
   * Verify sender's X.509 certificate
   */
  async verifySenderCertificate(senderAddress) {
    // In production:
    // 1. Extract certificate from message
    // 2. Verify certificate chain
    // 3. Check revocation via CRL/OCSP
    // 4. Validate certificate matches sender address
    
    // For demonstration, check if address is from trusted domain
    const trustedDomains = [
      '.direct.org',
      '.direct.healthcare',
      '.securehie.org'
    ];
    
    return trustedDomains.some(domain => senderAddress.includes(domain));
  },

  /**
   * Decrypt S/MIME encrypted message
   */
  async decryptMessage(encryptedContent) {
    // In production, use private key to decrypt
    // For demonstration, return as-is
    console.log('Decrypting message (simulated)');
    return encryptedContent;
  },

  /**
   * Encrypt message with recipient's public key
   */
  async encryptMessage(content, recipientCert) {
    // In production, use recipient's public key to encrypt
    // For demonstration, return marked as encrypted
    console.log('Encrypting message (simulated)');
    return `[ENCRYPTED:${content}]`;
  },

  /**
   * Store incoming message
   */
  async storeIncomingMessage(communication) {
    if (global.Collections?.Communications) {
      const Communications = await global.Collections.Communications;
      if (Communications && typeof Communications.insertAsync === 'function') {
        const id = await Communications.insertAsync(communication);
        console.log('Stored incoming Direct message:', id);
        return id;
      }
    }
    return communication.id;
  },

  /**
   * Send MDN for received message
   */
  async sendMDN(originalMessage, disposition) {
    const mdn = {
      'Message-ID': `<${Random.id()}@${Meteor.settings.public.directDomain || 'direct.local'}>`,
      'From': originalMessage.to,
      'To': originalMessage.from,
      'Subject': `Disposition Notification for ${originalMessage.subject}`,
      'Date': new Date().toUTCString(),
      'Content-Type': 'multipart/report; report-type=disposition-notification',
      'Original-Message-ID': originalMessage.messageId,
      'Disposition': `automatic-action/MDN-sent-automatically; ${disposition}`
    };
    
    console.log('Sending MDN:', mdn);
    
    // In production, send via SMTP
    // For demonstration, log the MDN
    return mdn;
  },

  /**
   * Look up recipient certificate from DNS
   */
  async lookupCertificate(directAddress) {
    // In production:
    // 1. Query DNS CERT record for domain
    // 2. Query LDAP if configured
    // 3. Check local certificate store
    
    console.log('Looking up certificate for:', directAddress);
    
    // For demonstration, return mock certificate
    return {
      subject: directAddress,
      publicKey: 'mock-public-key',
      validFrom: new Date(),
      validTo: new Date(Date.now() + 365*24*60*60*1000)
    };
  }
};

// Initialize on startup
Meteor.startup(() => {
  DirectProtocol.initialize();
});