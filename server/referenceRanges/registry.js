// server/referenceRanges/registry.js
// Lazy discovery of injected reference-range override sets. Server-only.
// LOAD-ORDER: reads `Package` at CALL time, never at module load. See
// .claude/rules/fhir/package-registry.md.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { ObservationDefinitions } from '/imports/lib/schemas/SimpleSchemas/ObservationDefinitions';
import { mergeCandidates } from './mergeCandidates.mjs';

export function discoverInjectedSets() {
  const sets = [];
  const pkg = (typeof Package !== 'undefined') ? Package : {};
  Object.keys(pkg).forEach(function (name) {
    const rrs = get(pkg[name], 'ReferenceRangeSet');
    if (rrs && Array.isArray(rrs.definitions)) sets.push(rrs);
  });
  const settingsOverrides = get(Meteor, 'settings.private.referenceRanges.overrides', []) || [];
  settingsOverrides.forEach(function (o) {
    if (o && Array.isArray(o.definitions)) sets.push(o);
  });
  return sets;
}

export async function gatherCandidates(loinc) {
  const baseDefs = await ObservationDefinitions.find({ 'code.coding.code': loinc }).fetchAsync();
  return mergeCandidates(baseDefs, discoverInjectedSets(), loinc);
}
