// npmPackages/prescription-benefit/lib/responders.js
//
// Responder registry for the RTPB workflow. A "responder" is the counterparty an
// RTPBRequest is sent to. Two kinds ship in-process:
//   - formulary : a PBM coverage/pricing check (lib/mockResponder.js + sampleDrugs.json)
//   - inventory : a physical-stock check against a kit/cart (lib/inventoryResponder.js)
//
// Each responder carries a local pseudo-URL so the requester UI can display *where*
// a request is going. A real external endpoint (settings.private.prescriptionBenefit
// .endpoint) is NOT part of this static registry — it is secret-bearing and surfaced
// separately (boolean only) by server/methods.js.
//
// Isomorphic (client + server), no Meteor dependencies.

import { get } from 'lodash';
import sampleDrugs from '../data/sampleDrugs.json';
import communityPharmacy from '../data/inventories/community-pharmacy.json';
import erCrashCart from '../data/inventories/er-crash-cart.json';
import emtFieldKit from '../data/inventories/emt-field-kit.json';
import rvCamperVan from '../data/inventories/rv-camper-van.json';

// Address space for in-process responders. The path segment is the responder id.
function localUrl(id) {
  return 'local://responders/' + id;
}

export const RESPONDERS = [
  {
    id: 'mock-pbm',
    name: 'Sample PBM Plan',
    type: 'formulary',
    url: localUrl('mock-pbm'),
    description: 'Built-in mock pharmacy benefit manager; derives coverage + patient cost from a formulary.',
    formulary: get(sampleDrugs, 'drugs', [])
  },
  {
    id: 'community-pharmacy',
    name: 'Community Pharmacy',
    type: 'inventory',
    url: localUrl('community-pharmacy'),
    description: get(communityPharmacy, 'name', 'Community Pharmacy') + ' retail stock room.',
    inventory: communityPharmacy
  },
  {
    id: 'er-crash-cart',
    name: 'ER Crash Cart',
    type: 'inventory',
    url: localUrl('er-crash-cart'),
    description: 'Hospital emergency department ACLS crash cart.',
    inventory: erCrashCart
  },
  {
    id: 'emt-field-kit',
    name: 'EMT Field Kit',
    type: 'inventory',
    url: localUrl('emt-field-kit'),
    description: 'Paramedic field drug box carried on an ambulance.',
    inventory: emtFieldKit
  },
  {
    id: 'rv-camper-van',
    name: 'RV Camper Van Crash Cart',
    type: 'inventory',
    url: localUrl('rv-camper-van'),
    description: 'Consumer/travel first-aid kit aboard an RV camper van.',
    inventory: rvCamperVan
  }
];

// Count of catalog/stock items a responder backs.
function itemCount(responder) {
  if (get(responder, 'type') === 'formulary') {
    return get(responder, 'formulary', []).length;
  }
  return get(responder, 'inventory.items', []).length;
}

// Client-safe summary (no backing data) for selectors + the provider page list.
export function listResponders() {
  return RESPONDERS.map(function(r) {
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      url: r.url,
      description: r.description,
      location: get(r, 'inventory.location', ''),
      itemCount: itemCount(r)
    };
  });
}

export function getResponder(id) {
  return RESPONDERS.find(function(r) { return r.id === id; });
}

// Default in-process responder when the caller doesn't specify one.
export const DEFAULT_RESPONDER_ID = 'mock-pbm';
