// npmPackages/structured-data-capture/client/components/QuestionTypes/questionRendererRegistry.js
//
// Shape-detection resolver for questionnaire item renderers.
//
// QuestionItem.jsx dispatches most items via a static `type -> Component` map.
// That map can't distinguish, say, an ordinal Likert scale from an ordinary
// multiple-choice list — both are `type: "choice"`. This registry layers
// *shape-based* detection on top: each matcher inspects the item (its type,
// option count, extensions, ordinal values, itemControl hints) and claims it if
// it fits. The first matcher to claim wins; if none do, the caller falls back to
// the static type map, so behaviour is unchanged for everything else.
//
// To add a new shape-detected widget (NumericRatingScale for 0-10 scales, a VAS
// slider, a choice grid, ...), write the component and register one more matcher
// here — no edits to QuestionItem's core dispatch logic.

import { get } from 'lodash';

import { LikertScaleQuestion } from './LikertScaleQuestion';

const ITEM_CONTROL_URL = 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl';
const ORDINAL_VALUE_URL = 'http://hl7.org/fhir/StructureDefinition/ordinalValue';

// Read the questionnaire-itemControl code, if present (e.g. 'likert', 'slider').
function getItemControlCode(item) {
  const ext = get(item, 'extension', []).find(function(e) {
    return get(e, 'url') === ITEM_CONTROL_URL;
  });
  return get(ext, 'valueCodeableConcept.coding[0].code');
}

// Does every answerOption carry both a valueCoding and an ordinalValue extension?
function allOptionsAreOrdinalCodings(answerOption) {
  return answerOption.every(function(option) {
    const hasCoding = !!get(option, 'valueCoding');
    const hasOrdinal = get(option, 'extension', []).some(function(ext) {
      return get(ext, 'url') === ORDINAL_VALUE_URL;
    });
    return hasCoding && hasOrdinal;
  });
}

// A single-select `choice` whose 3-7 options are all ordinal codings reads best
// as a Likert rail. An explicit itemControl code of 'likert' forces it.
function isLikertItem(item) {
  if (get(item, 'type') !== 'choice') return false;
  if (get(item, 'repeats', false)) return false;

  const answerOption = get(item, 'answerOption', []);
  if (answerOption.length < 3 || answerOption.length > 7) return false;

  if (getItemControlCode(item) === 'likert') return true;

  return allOptionsAreOrdinalCodings(answerOption);
}

// Ordered list of shape matchers. First match wins.
const RENDERER_MATCHERS = [
  { name: 'likert', match: isLikertItem, component: LikertScaleQuestion }
];

// Returns a renderer component for shape-detected items, or null to defer to the
// static type -> Component map in QuestionItem.
export function resolveQuestionComponent(item) {
  if (!item) return null;

  const matcher = RENDERER_MATCHERS.find(function(entry) {
    try {
      return entry.match(item);
    } catch (error) {
      console.warn('[questionRendererRegistry] matcher "' + entry.name + '" threw:', error);
      return false;
    }
  });

  return matcher ? matcher.component : null;
}

export default resolveQuestionComponent;
