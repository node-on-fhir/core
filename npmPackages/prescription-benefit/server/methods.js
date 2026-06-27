// npmPackages/prescription-benefit/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { fetch } from 'meteor/fetch';
import { get } from 'lodash';

import { PrescriptionBenefitRequest, PrescriptionBenefitResponse } from '../lib/collections.js';
import { jsonToRequestXml, jsonToResponseXml, responseXmlToJson } from '../lib/RtpbXml.js';
import { buildMockResponse } from '../lib/mockResponder.js';
import { buildInventoryResponse } from '../lib/inventoryResponder.js';
import { summarizeResponse } from '../lib/RtpbModel.js';
import { listResponders, getResponder, DEFAULT_RESPONDER_ID } from '../lib/responders.js';

// Sentinel responder id for the external (settings-driven) live endpoint.
const LIVE_ENDPOINT_ID = 'live-endpoint';

function endpointSetting() {
  return get(Meteor, 'settings.private.prescriptionBenefit.endpoint', '');
}

// =============================================================================
// METEOR METHODS (Meteor v3 Async Pattern)
// =============================================================================

Meteor.methods({
  /**
   * Module status (kept from the stub).
   */
  'prescriptionBenefit.getStatus': async function() {
    console.log('[prescriptionBenefit.getStatus] Checking status');
    return {
      name: 'prescription-benefit',
      version: '0.1.0',
      status: 'active',
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Report transaction config to the client WITHOUT leaking the endpoint/secret.
   * Returns the addressable responder registry (in-process responders + an
   * external-endpoint entry when one is configured) plus the default selection.
   * @returns {Object} { responders, defaultResponderId, liveEndpointConfigured,
   *                     mode, endpointConfigured }
   */
  'prescriptionBenefit.getConfig': async function() {
    const endpoint = endpointSetting();
    const configured = typeof endpoint === 'string' && endpoint.length > 0;

    const responders = listResponders();
    if (configured) {
      // Surface the external endpoint as a selectable responder WITHOUT its URL.
      responders.unshift({
        id: LIVE_ENDPOINT_ID,
        name: 'External Live Endpoint',
        type: 'formulary',
        url: '(external endpoint — configured)',
        description: 'Live RTPB counterparty configured in server settings.',
        location: '',
        itemCount: null
      });
    }

    const defaultResponderId = configured ? LIVE_ENDPOINT_ID : DEFAULT_RESPONDER_ID;
    console.log('[prescriptionBenefit.getConfig] responders=%d liveEndpoint=%s',
      responders.length, configured);

    return {
      responders: responders,
      defaultResponderId: defaultResponderId,
      liveEndpointConfigured: configured,
      // Back-compat keys.
      mode: configured ? 'live' : 'mock',
      endpointConfigured: configured
    };
  },

  /**
   * Perform a full RTPB transaction: persist the request, render it to XML,
   * obtain an RTPBResponse (mock or live endpoint), persist the response, and
   * return both JSON + XML payloads for display.
   *
   * @param {Object} requestJson - canonical RTPBRequest (see lib/RtpbModel.js)
   * @param {Object} [options]   - { medicationRequestId, responderId }
   */
  'prescriptionBenefit.submitRequest': async function(requestJson, options) {
    check(requestJson, Object);
    check(options, Match.Maybe(Object));

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to run a prescription benefit check.');
    }

    const opts = options || {};
    const requestId = Random.id();
    const now = new Date().toISOString();
    const patientId = get(requestJson, 'patient.id', '');

    // Resolve the target responder. Default: the external endpoint when configured,
    // otherwise the built-in mock PBM. An explicit live-endpoint selection with no
    // endpoint configured falls back to the default in-process responder.
    const endpoint = endpointSetting();
    let responderId = get(opts, 'responderId', '') || (endpoint ? LIVE_ENDPOINT_ID : DEFAULT_RESPONDER_ID);
    const useLiveEndpoint = (responderId === LIVE_ENDPOINT_ID) && !!endpoint;

    let responder = null;
    if (!useLiveEndpoint) {
      if (responderId === LIVE_ENDPOINT_ID) responderId = DEFAULT_RESPONDER_ID;
      responder = getResponder(responderId);
      if (!responder) {
        responderId = DEFAULT_RESPONDER_ID;
        responder = getResponder(DEFAULT_RESPONDER_ID);
      }
    }
    const responderType = useLiveEndpoint ? 'formulary' : get(responder, 'type', 'formulary');

    // Stamp + normalize the canonical request, then render the wire XML.
    const stampedRequest = Object.assign({}, requestJson, {
      transactionType: 'RTPBRequest',
      requestId: requestId,
      sentTime: now
    });
    const requestXml = jsonToRequestXml(stampedRequest);

    // Wire 'mode' label: live | inventory | mock (kept for back-compat display).
    const mode = useLiveEndpoint ? 'live' : (responderType === 'inventory' ? 'inventory' : 'mock');

    console.log('[prescriptionBenefit.submitRequest] requestId=%s responder=%s type=%s patient=%s product=%s',
      requestId, responderId, responderType, patientId, get(stampedRequest, 'product.rxnorm', ''));

    // Persist the request half.
    await PrescriptionBenefitRequest.insertAsync({
      _id: requestId,
      id: requestId,
      patientId: patientId,
      medicationRequestId: get(opts, 'medicationRequestId', null),
      responderId: responderId,
      responderType: responderType,
      mode: mode,
      status: 'sent',
      requestJson: stampedRequest,
      requestXml: requestXml,
      createdAt: now,
      createdBy: this.userId
    });

    // Obtain the response.
    let responseJson;
    let responseXml;
    let source;

    if (useLiveEndpoint) {
      // Live counterparty: POST the XML and parse the XML reply back to JSON.
      source = 'live';
      const authHeader = get(Meteor, 'settings.private.prescriptionBenefit.authorizationHeader', '');
      const headers = { 'Content-Type': 'application/xml', 'Accept': 'application/xml' };
      if (authHeader) headers['Authorization'] = authHeader;

      let replyText;
      try {
        const res = await fetch(endpoint, { method: 'POST', headers: headers, body: requestXml });
        replyText = await res.text();
        if (!res.ok) {
          throw new Meteor.Error('rtpb-endpoint-error', 'RTPB endpoint returned status ' + res.status);
        }
      } catch (error) {
        await PrescriptionBenefitRequest.updateAsync({ _id: requestId }, { $set: { status: 'error' } });
        console.error('[prescriptionBenefit.submitRequest] live endpoint failure:', get(error, 'message', error));
        throw new Meteor.Error('rtpb-endpoint-error', get(error, 'reason', get(error, 'message', 'RTPB endpoint request failed')));
      }

      responseXml = replyText;
      responseJson = await responseXmlToJson(replyText);
      responseJson.responderType = responseJson.responderType || 'formulary';
      // Stamp linkage if the counterparty omitted it.
      responseJson.requestId = responseJson.requestId || requestId;
      responseJson.responseId = responseJson.responseId || Random.id();
      responseJson.responseTime = responseJson.responseTime || new Date().toISOString();
    } else if (responderType === 'inventory') {
      // In-process inventory responder (kit/cart stock check).
      source = 'inventory';
      const body = buildInventoryResponse(stampedRequest, responder);
      responseJson = Object.assign(body, {
        responseId: Random.id(),
        requestId: requestId,
        responseTime: new Date().toISOString()
      });
      responseXml = jsonToResponseXml(responseJson);
    } else {
      // Built-in mock PBM (formulary).
      source = 'mock';
      const body = buildMockResponse(stampedRequest);
      responseJson = Object.assign(body, {
        responderType: 'formulary',
        responseId: Random.id(),
        requestId: requestId,
        responseTime: new Date().toISOString()
      });
      responseXml = jsonToResponseXml(responseJson);
    }

    const summary = summarizeResponse(responseJson);
    const responseId = responseJson.responseId;

    // Persist the response half.
    await PrescriptionBenefitResponse.insertAsync({
      _id: responseId,
      id: responseId,
      requestId: requestId,
      patientId: patientId,
      responderId: responderId,
      responderType: responderType,
      source: source,
      responseJson: responseJson,
      responseXml: responseXml,
      summary: summary,
      createdAt: responseJson.responseTime
    });

    await PrescriptionBenefitRequest.updateAsync({ _id: requestId }, { $set: { status: 'completed' } });

    return {
      requestId: requestId,
      responseId: responseId,
      responderId: responderId,
      responderType: responderType,
      mode: source,
      requestJson: stampedRequest,
      requestXml: requestXml,
      responseJson: responseJson,
      responseXml: responseXml,
      summary: summary
    };
  }
});

console.log('[prescription-benefit] Server methods registered');
