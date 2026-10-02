// npmPackages/structured-data-capture/lib/PrefillUtils.js
//
// Pure helpers for "Kill the Clipboard" AI intake prefill: extract the IPS
// rendered narrative from a Composition, build the llm.chat prompt for a FHIR
// Questionnaire, and parse/validate the model's JSON answers.
// Genuine CJS (no ESM syntax): consumed by the Meteor server bundle AND
// directly by node --test (tests/unit/...); ESM .js breaks the node runner.

'use strict';

const { get, isArray } = require('lodash');

const PREFILL_SYSTEM_PROMPT = 'You extract structured intake-form answers from a patient summary narrative. You respond with strict JSON only — no prose, no markdown code fences.';

function stripNarrativeHtml(div) {
  if (!div || typeof div !== 'string') { return ''; }
  return div
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractNarrativeFromComposition(composition) {
  const sections = get(composition, 'section', []);
  if (!isArray(sections)) { return null; }
  const narrativeSection = sections.find(function(s) {
    return get(s, 'title') === 'Narrative Summary' && get(s, 'text.div');
  }) || sections.find(function(s) {
    return get(s, 'text.div');
  });
  if (!narrativeSection) { return null; }
  const text = stripNarrativeHtml(get(narrativeSection, 'text.div'));
  return text.length > 0 ? text : null;
}

function flattenAnswerableItems(questionnaire) {
  const items = [];
  function walk(list) {
    if (!isArray(list)) { return; }
    list.forEach(function(item) {
      const type = get(item, 'type');
      if (type && type !== 'group' && type !== 'display') {
        const entry = {
          linkId: get(item, 'linkId'),
          text: get(item, 'text'),
          type: type,
          repeats: get(item, 'repeats', false)
        };
        const options = get(item, 'answerOption');
        if (isArray(options)) {
          entry.answerOptions = options.map(function(o) {
            return { code: get(o, 'valueCoding.code'), display: get(o, 'valueCoding.display') };
          });
        }
        items.push(entry);
      }
      walk(get(item, 'item'));
    });
  }
  walk(get(questionnaire, 'item', []));
  return items;
}

function buildPrefillPrompt(questionnaire, narrativeText) {
  const catalog = flattenAnswerableItems(questionnaire);
  return [
    'Fill out the following intake form using ONLY facts stated in the patient summary.',
    '',
    'PATIENT SUMMARY:',
    narrativeText,
    '',
    'FORM QUESTIONS (JSON):',
    JSON.stringify(catalog, null, 2),
    '',
    'INSTRUCTIONS:',
    '- Answer only questions whose answer is directly supported by the summary. Omit everything else — never guess.',
    '- Respond with ONLY a JSON array of objects: [{"linkId": "...", "value": ...}]',
    '- choice questions: value is one of the answerOptions codes; if repeats is true, value is an array of codes.',
    '- boolean: true or false. date: "YYYY-MM-DD". integer/decimal: a number. string/text: a string.'
  ].join('\n');
}

function matchChoiceOption(catalogItem, rawValue) {
  const options = get(catalogItem, 'answerOptions', []);
  const raw = (rawValue && typeof rawValue === 'object') ? get(rawValue, 'code', '') : rawValue;
  const needle = String(raw).toLowerCase();
  return options.find(function(o) {
    return String(get(o, 'code', '')).toLowerCase() === needle ||
           String(get(o, 'display', '')).toLowerCase() === needle;
  }) || null;
}

function coerceAnswerValue(catalogItem, rawValue) {
  const type = get(catalogItem, 'type');
  switch (type) {
    case 'boolean':
      if (rawValue === true || rawValue === 'true') { return true; }
      if (rawValue === false || rawValue === 'false') { return false; }
      return undefined;
    case 'integer': {
      const n = parseInt(rawValue, 10);
      return Number.isNaN(n) ? undefined : n;
    }
    case 'decimal': {
      const n = parseFloat(rawValue);
      return Number.isNaN(n) ? undefined : n;
    }
    case 'date': {
      const m = String(rawValue).match(/^\d{4}-\d{2}-\d{2}/);
      return m ? m[0] : undefined;
    }
    case 'dateTime':
    case 'time':
      return (typeof rawValue === 'string' && rawValue.length > 0) ? rawValue : undefined;
    case 'choice': {
      // repeats: array of option codes — stored as one valueCoding answer per code by ResponseUtils.createAnswerFromValue
      if (get(catalogItem, 'repeats') && isArray(rawValue)) {
        const codes = rawValue.map(function(v) {
          const opt = matchChoiceOption(catalogItem, v);
          return opt ? opt.code : null;
        }).filter(Boolean);
        return codes.length > 0 ? codes : undefined;
      }
      const single = isArray(rawValue) ? rawValue[0] : rawValue;
      const opt = matchChoiceOption(catalogItem, single);
      return opt ? { code: opt.code, display: opt.display } : undefined;
    }
    case 'open-choice': {
      const opt = matchChoiceOption(catalogItem, rawValue);
      if (opt) { return { code: opt.code, display: opt.display }; }
      return (typeof rawValue === 'string' && rawValue.length > 0) ? rawValue : undefined;
    }
    case 'string':
    case 'text':
    case 'url': {
      const s = (typeof rawValue === 'string') ? rawValue : String(rawValue === null || rawValue === undefined ? '' : rawValue);
      return s.trim().length > 0 ? s : undefined;
    }
    default:
      return undefined;
  }
}

function parsePrefillAnswers(content, questionnaire) {
  if (!content || typeof content !== 'string') { throw new Error('empty LLM response'); }
  let jsonText = content.trim();
  const fenced = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) { jsonText = fenced[1].trim(); }
  if (jsonText.charAt(0) !== '[') {
    const start = jsonText.indexOf('[');
    const end = jsonText.lastIndexOf(']');
    if (start === -1 || end <= start) { throw new Error('no JSON array in LLM response'); }
    jsonText = jsonText.slice(start, end + 1);
  }
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error('invalid JSON: ' + err.message);
  }
  if (!isArray(parsed)) { throw new Error('LLM response is not a JSON array'); }

  const catalog = flattenAnswerableItems(questionnaire);
  const byLinkId = {};
  catalog.forEach(function(c) { byLinkId[c.linkId] = c; });

  const answers = [];
  parsed.forEach(function(entry) {
    const linkId = get(entry, 'linkId');
    const catalogItem = byLinkId[linkId];
    if (!catalogItem) { return; }
    const value = coerceAnswerValue(catalogItem, get(entry, 'value'));
    if (value === undefined) { return; }
    answers.push({ linkId: linkId, value: value, type: catalogItem.type });
  });
  return answers;
}

const PrefillUtils = {
  PREFILL_SYSTEM_PROMPT: PREFILL_SYSTEM_PROMPT,
  stripNarrativeHtml: stripNarrativeHtml,
  extractNarrativeFromComposition: extractNarrativeFromComposition,
  flattenAnswerableItems: flattenAnswerableItems,
  buildPrefillPrompt: buildPrefillPrompt,
  parsePrefillAnswers: parsePrefillAnswers
};

exports.PrefillUtils = PrefillUtils;
