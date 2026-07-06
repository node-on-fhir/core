// server/referenceRanges/mergeCandidates.mjs
// Pure function. No Meteor / Package / settings dependencies.
import get from 'lodash/get.js';

function loincOf(def) { return get(def, 'code.coding.0.code'); }

export function mergeCandidates(baseDefs, injectedSets, loinc) {
  const fromBase = (baseDefs || []).filter(function (d) { return loincOf(d) === loinc; });
  const fromInjected = [];
  (injectedSets || []).forEach(function (set) {
    (get(set, 'definitions', []) || []).forEach(function (d) {
      if (loincOf(d) === loinc) fromInjected.push(d);
    });
  });
  return fromBase.concat(fromInjected);
}
