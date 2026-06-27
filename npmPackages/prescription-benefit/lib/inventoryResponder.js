// npmPackages/prescription-benefit/lib/inventoryResponder.js
//
// Inventory responder. Answers an RTPBRequest by checking whether the requested
// drug is physically stocked in a kit/cart (lib/responders.js inventory entry),
// reusing the canonical RTPBResponse JSON shape so the requester UI + History work
// unchanged. Coverage semantics are remapped to stock:
//   covered                  = in stock     (qtyOnHand > parLevel)
//   covered-with-restrictions = low stock    (0 < qtyOnHand <= parLevel)
//   not-covered              = out of stock (absent, or qtyOnHand <= 0)
// Pricing fields (patientPayAmount / planPayAmount) are null — inventory has no
// pricing. Inventory fields (qtyOnHand, parLevel, lot, expiry, location, inStock)
// ride alongside. "Alternatives" become same-class items in stock in this kit.
// Isomorphic (client + server); no randomness/time (the server stamps ids + times).

import { get } from 'lodash';

const IN_STOCK = 'covered';
const LOW_STOCK = 'covered-with-restrictions';
const OUT_OF_STOCK = 'not-covered';

function stockStatus(item) {
  const qty = Number(get(item, 'qtyOnHand', 0)) || 0;
  const par = Number(get(item, 'parLevel', 0)) || 0;
  if (qty <= 0) return OUT_OF_STOCK;
  if (qty <= par) return LOW_STOCK;
  return IN_STOCK;
}

function findItem(items, rxnorm) {
  return items.find(function(it) { return String(get(it, 'rxnorm')) === String(rxnorm); });
}

// Project an inventory item into a response product/alternative entry.
function toProduct(item, location, extra) {
  const status = stockStatus(item);
  return Object.assign({
    rxnorm: get(item, 'rxnorm', ''),
    ndc: get(item, 'ndc', ''),
    display: get(item, 'display', ''),
    therapeuticClass: get(item, 'therapeuticClass', 'unknown'),
    patientPayAmount: null,
    planPayAmount: null,
    coverageStatus: status,
    priorAuthRequired: false,
    inStock: status !== OUT_OF_STOCK,
    qtyOnHand: Number(get(item, 'qtyOnHand', 0)) || 0,
    parLevel: Number(get(item, 'parLevel', 0)) || 0,
    lot: get(item, 'lot', ''),
    expiry: get(item, 'expiry', ''),
    location: location
  }, extra || {});
}

// Build the responseJson body (the server method stamps responseId/requestId/time).
export function buildInventoryResponse(requestJson, responder) {
  const inventory = get(responder, 'inventory', {});
  const items = get(inventory, 'items', []);
  const location = get(inventory, 'location', get(responder, 'name', ''));
  const responderName = get(responder, 'name', get(inventory, 'name', 'Inventory'));

  const reqRxnorm = get(requestJson, 'product.rxnorm', '');
  const reqDisplay = get(requestJson, 'product.display', '');
  const reqNdc = get(requestJson, 'product.ndc', '');
  const quantity = get(requestJson, 'quantity', 0);
  const daysSupply = get(requestJson, 'daysSupply', 0);

  const found = findItem(items, reqRxnorm);

  let requestedProduct;
  let requestedClass;
  let requestedStatus;
  if (found) {
    requestedProduct = toProduct(found, location, {
      quantity: quantity,
      daysSupply: daysSupply,
      pharmacy: responderName
    });
    requestedClass = get(found, 'therapeuticClass', 'unknown');
    requestedStatus = requestedProduct.coverageStatus;
  } else {
    // Not stocked at all.
    requestedProduct = {
      rxnorm: reqRxnorm,
      ndc: reqNdc,
      display: reqDisplay,
      therapeuticClass: 'unknown',
      quantity: quantity,
      daysSupply: daysSupply,
      patientPayAmount: null,
      planPayAmount: null,
      coverageStatus: OUT_OF_STOCK,
      priorAuthRequired: false,
      inStock: false,
      qtyOnHand: 0,
      parLevel: 0,
      lot: '',
      expiry: '',
      location: location,
      pharmacy: responderName
    };
    requestedClass = 'unknown';
    requestedStatus = OUT_OF_STOCK;
  }

  // Substitutes: same therapeutic class, currently in stock, excluding the
  // requested item, highest stock first, up to 3.
  const alternatives = items
    .filter(function(it) {
      return get(it, 'therapeuticClass', 'x') === requestedClass &&
        String(get(it, 'rxnorm')) !== String(get(requestedProduct, 'rxnorm')) &&
        (Number(get(it, 'qtyOnHand', 0)) || 0) > 0;
    })
    .map(function(it) { return toProduct(it, location, { savings: 0 }); })
    .sort(function(a, b) { return b.qtyOnHand - a.qtyOnHand; })
    .slice(0, 3);

  const messages = [];
  if (requestedStatus === IN_STOCK) {
    messages.push('In stock: ' + requestedProduct.qtyOnHand + ' unit(s) in ' + responderName + '.');
  } else if (requestedStatus === LOW_STOCK) {
    messages.push('Low stock: ' + requestedProduct.qtyOnHand + ' unit(s) on hand (par ' + requestedProduct.parLevel + ') in ' + responderName + '.');
  } else if (found) {
    messages.push('Out of stock in ' + responderName + '.');
  } else {
    messages.push('Not stocked in ' + responderName + '.');
  }
  if (alternatives.length > 0) {
    messages.push(alternatives.length + ' in-kit substitute(s) available.');
  }

  return {
    transactionType: 'RTPBResponse',
    responderType: 'inventory',
    coverage: {
      status: requestedStatus,
      payerName: responderName
    },
    requestedProduct: requestedProduct,
    alternatives: alternatives,
    messages: messages
  };
}
