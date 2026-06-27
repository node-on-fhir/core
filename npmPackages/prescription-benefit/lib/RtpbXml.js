// npmPackages/prescription-benefit/lib/RtpbXml.js
//
// Bidirectional XML <-> JSON conversion for the RTPB wire format
// (representative NCPDP RTPB IG v13 subset). JSON is canonical; this module
// renders it to XML for transmission and reconstructs canonical JSON from a
// received XML response. Server-side (uses xml2js).

import { Builder, parseStringPromise } from 'xml2js';
import { get } from 'lodash';

const BUILDER = new Builder({ renderOpts: { pretty: true, indent: '  ', newline: '\n' } });
const PARSE_OPTS = { explicitArray: false, explicitRoot: true, trim: true };

// Drop empty/undefined keys so optional elements don't render as <Empty/>.
function clean(obj) {
  const out = {};
  Object.keys(obj).forEach(function(key) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== '') {
      out[key] = value;
    }
  });
  return out;
}

function num(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return isNaN(n) ? fallback : n;
}

function bool(value) {
  return value === true || value === 'true';
}

// =============================================================================
// JSON -> XML
// =============================================================================

export function jsonToRequestXml(requestJson) {
  const wire = {
    RTPBRequest: {
      Header: clean({
        RequestId: get(requestJson, 'requestId', ''),
        SentTime: get(requestJson, 'sentTime', '')
      }),
      Patient: clean({
        Id: get(requestJson, 'patient.id', ''),
        FirstName: get(requestJson, 'patient.firstName', ''),
        LastName: get(requestJson, 'patient.lastName', ''),
        DateOfBirth: get(requestJson, 'patient.dob', ''),
        Gender: get(requestJson, 'patient.gender', '')
      }),
      Product: clean({
        RxNorm: get(requestJson, 'product.rxnorm', ''),
        NDC: get(requestJson, 'product.ndc', ''),
        Description: get(requestJson, 'product.display', ''),
        Quantity: get(requestJson, 'quantity', ''),
        DaysSupply: get(requestJson, 'daysSupply', '')
      }),
      Prescriber: clean({
        NPI: get(requestJson, 'prescriber.npi', ''),
        Name: get(requestJson, 'prescriber.name', '')
      }),
      Pharmacy: clean({
        NcpdpId: get(requestJson, 'pharmacy.ncpdpId', ''),
        Name: get(requestJson, 'pharmacy.name', '')
      }),
      Coverage: clean({
        PayerName: get(requestJson, 'coverage.payerName', ''),
        BIN: get(requestJson, 'coverage.bin', ''),
        PCN: get(requestJson, 'coverage.pcn', ''),
        GroupId: get(requestJson, 'coverage.groupId', ''),
        MemberId: get(requestJson, 'coverage.memberId', '')
      })
    }
  };
  return BUILDER.buildObject(wire);
}

function productWire(p) {
  return clean({
    RxNorm: get(p, 'rxnorm', ''),
    NDC: get(p, 'ndc', ''),
    Description: get(p, 'display', ''),
    Quantity: get(p, 'quantity', ''),
    DaysSupply: get(p, 'daysSupply', ''),
    PatientPayAmount: get(p, 'patientPayAmount', ''),
    PlanPayAmount: get(p, 'planPayAmount', ''),
    CombinedSavings: get(p, 'savings', ''),
    CoverageStatus: get(p, 'coverageStatus', ''),
    PriorAuthRequired: get(p, 'priorAuthRequired') === undefined
      ? '' : String(get(p, 'priorAuthRequired')),
    Pharmacy: get(p, 'pharmacy', ''),
    // Inventory fields (empty -> dropped by clean() for formulary responses).
    QuantityOnHand: get(p, 'qtyOnHand') === undefined ? '' : String(get(p, 'qtyOnHand')),
    ParLevel: get(p, 'parLevel') === undefined ? '' : String(get(p, 'parLevel')),
    InStock: get(p, 'inStock') === undefined ? '' : String(get(p, 'inStock')),
    Lot: get(p, 'lot', ''),
    Expiry: get(p, 'expiry', ''),
    Location: get(p, 'location', '')
  });
}

export function jsonToResponseXml(responseJson) {
  const alternatives = get(responseJson, 'alternatives', []);
  const messages = get(responseJson, 'messages', []);
  const wire = {
    RTPBResponse: {
      Header: clean({
        ResponseId: get(responseJson, 'responseId', ''),
        RequestId: get(responseJson, 'requestId', ''),
        ResponseTime: get(responseJson, 'responseTime', ''),
        ResponderType: get(responseJson, 'responderType', '')
      }),
      Coverage: clean({
        Status: get(responseJson, 'coverage.status', ''),
        PayerName: get(responseJson, 'coverage.payerName', '')
      }),
      RequestedProduct: productWire(get(responseJson, 'requestedProduct', {})),
      Alternatives: {
        AlternativeProduct: alternatives.map(productWire)
      },
      Messages: {
        Message: messages
      }
    }
  };
  return BUILDER.buildObject(wire);
}

// =============================================================================
// XML -> JSON (generic + canonical reconstruction)
// =============================================================================

// Generic parse — returns the raw xml2js object tree.
export async function xmlToJson(xml) {
  return parseStringPromise(xml, PARSE_OPTS);
}

export async function requestXmlToJson(xml) {
  const parsed = await parseStringPromise(xml, PARSE_OPTS);
  const r = get(parsed, 'RTPBRequest', {});
  return {
    transactionType: 'RTPBRequest',
    requestId: get(r, 'Header.RequestId', ''),
    sentTime: get(r, 'Header.SentTime', ''),
    patient: {
      id: get(r, 'Patient.Id', ''),
      firstName: get(r, 'Patient.FirstName', ''),
      lastName: get(r, 'Patient.LastName', ''),
      dob: get(r, 'Patient.DateOfBirth', ''),
      gender: get(r, 'Patient.Gender', '')
    },
    product: {
      rxnorm: get(r, 'Product.RxNorm', ''),
      ndc: get(r, 'Product.NDC', ''),
      display: get(r, 'Product.Description', '')
    },
    quantity: num(get(r, 'Product.Quantity'), 0),
    daysSupply: num(get(r, 'Product.DaysSupply'), 0),
    prescriber: {
      npi: get(r, 'Prescriber.NPI', ''),
      name: get(r, 'Prescriber.Name', '')
    },
    pharmacy: {
      ncpdpId: get(r, 'Pharmacy.NcpdpId', ''),
      name: get(r, 'Pharmacy.Name', '')
    },
    coverage: {
      payerName: get(r, 'Coverage.PayerName', ''),
      bin: get(r, 'Coverage.BIN', ''),
      pcn: get(r, 'Coverage.PCN', ''),
      groupId: get(r, 'Coverage.GroupId', ''),
      memberId: get(r, 'Coverage.MemberId', '')
    }
  };
}

function productFromWire(p) {
  if (!p) return {};
  const out = {
    rxnorm: get(p, 'RxNorm', ''),
    ndc: get(p, 'NDC', ''),
    display: get(p, 'Description', ''),
    patientPayAmount: num(get(p, 'PatientPayAmount'), null),
    coverageStatus: get(p, 'CoverageStatus', ''),
    priorAuthRequired: bool(get(p, 'PriorAuthRequired'))
  };
  if (get(p, 'PlanPayAmount') !== undefined) out.planPayAmount = num(get(p, 'PlanPayAmount'), null);
  if (get(p, 'CombinedSavings') !== undefined) out.savings = num(get(p, 'CombinedSavings'), null);
  if (get(p, 'Quantity') !== undefined) out.quantity = num(get(p, 'Quantity'), null);
  if (get(p, 'DaysSupply') !== undefined) out.daysSupply = num(get(p, 'DaysSupply'), null);
  if (get(p, 'Pharmacy') !== undefined) out.pharmacy = get(p, 'Pharmacy', '');
  // Inventory fields.
  if (get(p, 'QuantityOnHand') !== undefined) out.qtyOnHand = num(get(p, 'QuantityOnHand'), null);
  if (get(p, 'ParLevel') !== undefined) out.parLevel = num(get(p, 'ParLevel'), null);
  if (get(p, 'InStock') !== undefined) out.inStock = bool(get(p, 'InStock'));
  if (get(p, 'Lot') !== undefined) out.lot = get(p, 'Lot', '');
  if (get(p, 'Expiry') !== undefined) out.expiry = get(p, 'Expiry', '');
  if (get(p, 'Location') !== undefined) out.location = get(p, 'Location', '');
  return out;
}

export async function responseXmlToJson(xml) {
  const parsed = await parseStringPromise(xml, PARSE_OPTS);
  const r = get(parsed, 'RTPBResponse', {});

  // xml2js with explicitArray:false yields an object for a single repeated
  // element and an array for many — normalize both to an array.
  let altNode = get(r, 'Alternatives.AlternativeProduct', []);
  if (!Array.isArray(altNode)) altNode = altNode ? [altNode] : [];

  let msgNode = get(r, 'Messages.Message', []);
  if (!Array.isArray(msgNode)) msgNode = msgNode ? [msgNode] : [];

  return {
    transactionType: 'RTPBResponse',
    responderType: get(r, 'Header.ResponderType', '') || 'formulary',
    responseId: get(r, 'Header.ResponseId', ''),
    requestId: get(r, 'Header.RequestId', ''),
    responseTime: get(r, 'Header.ResponseTime', ''),
    coverage: {
      status: get(r, 'Coverage.Status', ''),
      payerName: get(r, 'Coverage.PayerName', '')
    },
    requestedProduct: productFromWire(get(r, 'RequestedProduct', {})),
    alternatives: altNode.map(productFromWire),
    messages: msgNode
  };
}
