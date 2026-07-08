// imports/lib/referenceRanges/resolveReferenceRange.js
// Pure, isomorphic two-stage resolver. NO Meteor / Mongo / Package / settings.
import get from 'lodash/get.js';
import { EXT, LAYER_PRECEDENCE, matchesContext, specificity, intervalPopulation, intervalJurisdiction } from './qualifiers.js';

function defExt(def, url) {
  const exts = get(def, 'extension', []) || [];
  const found = exts.find(function (e) { return get(e, 'url') === url; });
  return get(found, 'valueCode', get(found, 'valueString'));
}
function layerOf(def) { return defExt(def, EXT.layer) || 'base'; }
function unitOf(def) { return get(def, 'quantitativeDetails.unit.coding.0.code'); }
function codeOf(def) { return get(def, 'code.coding.0.code'); }

function matchedBy(interval) {
  const by = [];
  if (get(interval, 'gender') !== undefined) by.push('sex');
  if (get(interval, 'age.low.value') !== undefined || get(interval, 'age.high.value') !== undefined) by.push('age');
  if (get(interval, 'condition')) by.push('condition');
  if (intervalPopulation(interval) !== undefined) by.push('population');
  if (intervalJurisdiction(interval) !== undefined) by.push('jurisdiction');
  return by;
}

function band(interval) {
  return {
    interpretation: get(interval, 'interpretation.0.coding.0.code'),
    category: get(interval, 'category', 'reference'),
    range: get(interval, 'range'),
    label: get(interval, 'context.text')
  };
}

export function resolveReferenceRange({ loinc, candidates, context }) {
  if (!candidates || candidates.length === 0) return null;
  const ctx = context || {};

  // Flatten every interval, tagged with its definition metadata.
  const flat = [];
  candidates.forEach(function (def) {
    (get(def, 'qualifiedInterval', []) || []).forEach(function (interval) {
      flat.push({ def, interval, layer: layerOf(def) });
    });
  });

  const eligible = flat.filter(function (f) { return matchesContext(f.interval, ctx); });

  if (eligible.length === 0) {
    // Informational fallback: report the highest-layer candidate, no gauge.
    const top = candidates.slice().sort(function (a, b) {
      return (LAYER_PRECEDENCE[layerOf(b)] || 0) - (LAYER_PRECEDENCE[layerOf(a)] || 0);
    })[0];
    return {
      code: codeOf(top), unit: unitOf(top), bandProfile: 'informational',
      normal: null, bands: [],
      matched: { layer: layerOf(top), source: defExt(top, EXT.source), version: defExt(top, EXT.version), by: [] },
      skipped: []
    };
  }

  // Rank: layer precedence desc, then specificity desc.
  function score(f) { return (LAYER_PRECEDENCE[f.layer] || 0) * 1000 + specificity(f.interval); }
  eligible.sort(function (a, b) { return score(b) - score(a); });

  const winner = eligible[0];
  const winningDef = winner.def;

  // Bands = all eligible intervals belonging to the winning definition.
  const winnerIntervals = eligible.filter(function (f) { return f.def === winningDef; }).map(function (f) { return f.interval; });
  const referenceInterval = winnerIntervals
    .filter(function (i) { return get(i, 'category', 'reference') === 'reference'; })
    .sort(function (a, b) { return specificity(b) - specificity(a); })[0];

  const bands = winnerIntervals.map(band);
  const skipped = candidates
    .filter(function (d) { return d !== winningDef; })
    .map(function (d) { return { source: defExt(d, EXT.source), reason: 'lower-precedence-or-no-eligible-interval' }; });

  return {
    code: codeOf(winningDef),
    unit: unitOf(winningDef),
    bandProfile: defExt(winningDef, EXT.bandProfile) || 'low-normal-high',
    normal: referenceInterval ? get(referenceInterval, 'range') : null,
    bands,
    matched: {
      layer: winner.layer,
      source: defExt(winningDef, EXT.source),
      version: defExt(winningDef, EXT.version),
      by: matchedBy(referenceInterval || winner.interval)
    },
    skipped
  };
}
