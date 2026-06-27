// npmPackages/prescription-benefit/lib/mockResponder.js
//
// Built-in mock PBM. Deterministically derives a benefit determination from an
// RTPB requestJson: coverage status, patient out-of-pocket cost, optional
// plan-cost/savings, and lower-cost alternative products from the sample
// catalog in the same therapeutic class. No randomness/time (callers stamp ids
// + timestamps), so the same request always yields the same response.

import { get } from 'lodash';
import sampleData from '../data/sampleDrugs.json';

const DRUGS = get(sampleData, 'drugs', []);

// Stable non-negative hash of a string (FNV-1a-ish).
function stableHash(str) {
  let hash = 2166136261;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function findDrug(rxnorm) {
  return DRUGS.find(function(d) { return String(d.rxnorm) === String(rxnorm); });
}

// Derive patient pay + plan pay + coverage status for a catalog drug.
function priceDrug(drug, seedKey) {
  const baseCost = get(drug, 'baseCost', 25 + (stableHash(seedKey) % 200));
  const isBrand = get(drug, 'brand', false);
  const h = stableHash(seedKey + ':' + get(drug, 'rxnorm', ''));

  let patientPay;
  let coverageStatus;
  let priorAuthRequired = false;

  if (isBrand) {
    // Brand: coinsurance 25–40% of list, prior auth on the priciest.
    const coinsurance = 0.25 + (h % 16) / 100; // 0.25 .. 0.40
    patientPay = round2(baseCost * coinsurance);
    if (baseCost > 250) {
      coverageStatus = 'covered-with-restrictions';
      priorAuthRequired = true;
    } else {
      coverageStatus = 'covered';
    }
  } else {
    // Generic: flat copay tier.
    const tiers = [4, 10, 15];
    patientPay = tiers[h % tiers.length];
    coverageStatus = 'covered';
  }

  const planPay = round2(Math.max(0, baseCost - patientPay));
  return { baseCost: round2(baseCost), patientPay, planPay, coverageStatus, priorAuthRequired };
}

// Build the responseJson body (no responseId/requestId/responseTime — the
// server method stamps those).
export function buildMockResponse(requestJson) {
  const reqRxnorm = get(requestJson, 'product.rxnorm', '');
  const reqDisplay = get(requestJson, 'product.display', '');
  const reqNdc = get(requestJson, 'product.ndc', '');
  const quantity = get(requestJson, 'quantity', 30);
  const daysSupply = get(requestJson, 'daysSupply', 30);
  const pharmacyName = get(requestJson, 'pharmacy.name', 'Community Pharmacy');
  const payerName = get(requestJson, 'coverage.payerName', '') || 'Sample PBM Plan';
  const seedKey = get(requestJson, 'patient.id', '') + ':' + (get(requestJson, 'coverage.memberId', '') || 'member');

  const known = findDrug(reqRxnorm);
  const requestedDrug = known || {
    rxnorm: reqRxnorm,
    ndc: reqNdc,
    display: reqDisplay,
    therapeuticClass: 'unknown',
    brand: /[A-Z]/.test((reqDisplay || '').charAt(0)) && !/tablet|capsule/i.test(reqDisplay) ? true : false,
    baseCost: 25 + (stableHash(reqRxnorm) % 200)
  };

  const reqPrice = priceDrug(requestedDrug, seedKey);

  const requestedProduct = {
    rxnorm: get(requestedDrug, 'rxnorm', reqRxnorm),
    ndc: get(requestedDrug, 'ndc', reqNdc),
    display: get(requestedDrug, 'display', reqDisplay),
    quantity: quantity,
    daysSupply: daysSupply,
    patientPayAmount: reqPrice.patientPay,
    planPayAmount: reqPrice.planPay,
    coverageStatus: reqPrice.coverageStatus,
    priorAuthRequired: reqPrice.priorAuthRequired,
    pharmacy: pharmacyName
  };

  // Alternatives: same therapeutic class, cheaper to the patient, up to 3.
  const klass = get(requestedDrug, 'therapeuticClass', 'unknown');
  const alternatives = DRUGS
    .filter(function(d) {
      return d.therapeuticClass === klass && String(d.rxnorm) !== String(requestedProduct.rxnorm);
    })
    .map(function(d) {
      const price = priceDrug(d, seedKey);
      return {
        rxnorm: d.rxnorm,
        ndc: d.ndc,
        display: d.display,
        patientPayAmount: price.patientPay,
        planPayAmount: price.planPay,
        coverageStatus: price.coverageStatus,
        priorAuthRequired: price.priorAuthRequired,
        savings: round2(Math.max(0, reqPrice.patientPay - price.patientPay))
      };
    })
    .filter(function(alt) { return alt.patientPayAmount < reqPrice.patientPay; })
    .sort(function(a, b) { return a.patientPayAmount - b.patientPayAmount; })
    .slice(0, 3);

  const messages = [];
  if (!known) {
    messages.push('Requested product not in formulary catalog; benefit estimated.');
  }
  if (reqPrice.priorAuthRequired) {
    messages.push('Prior authorization required for the requested product.');
  }
  if (alternatives.length > 0) {
    messages.push(alternatives.length + ' lower-cost alternative(s) available.');
  }

  return {
    transactionType: 'RTPBResponse',
    coverage: {
      status: reqPrice.coverageStatus,
      payerName: payerName
    },
    requestedProduct: requestedProduct,
    alternatives: alternatives,
    messages: messages
  };
}
