// imports/api/importAttachment/methods.js
//
// Import-attachment preview method (design v2 §B / §E, PR4). Side-effect-free:
// given the client's selected patient and the import payload's own Patient list,
// it returns which patient the import WOULD attach to and why, so the UI can
// render ImportAttachmentBanner (PR6) before any data is written. Creates
// nothing, writes nothing — a pure resolver query.
//
// Delegates to imports/lib/resolveImportPatient.js (precedence:
// selected → profile-linked → payload-created → unlinked). phi:false — it only
// echoes ids/display the caller already holds, no clinical content.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import { resolveImportPatient } from '/imports/lib/resolveImportPatient.js';

Meteor.ServerMethods.define('importAttachment.preview', {
  description: 'Preview which patient an import would attach to (selected → profile-linked → payload-created → unlinked); side-effect-free',
  phi: false,
  positionalParams: ['params'],
  schemaObject: {
    type: 'object',
    properties: {
      params: {
        type: 'object',
        properties: {
          clientPatientId: { type: ['string', 'null'] },
          payloadPatients: { type: 'array' }
        }
      }
    }
  }
}, async function(params, context){
  const inner = get(params, 'params') || {};
  const clientPatientId = get(inner, 'clientPatientId', null);
  const payloadPatients = get(inner, 'payloadPatients', []);

  const result = await resolveImportPatient(context.userId, {
    clientPatientId: clientPatientId,
    payloadPatients: Array.isArray(payloadPatients) ? payloadPatients : []
  });

  context.log.debug('Import attachment preview', {
    source: result.source,
    hasSelection: !!clientPatientId,
    payloadCount: Array.isArray(payloadPatients) ? payloadPatients.length : 0
  });

  return result;
});
