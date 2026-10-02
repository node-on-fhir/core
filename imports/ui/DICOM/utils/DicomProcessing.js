// imports/ui/DICOM/utils/DicomProcessing.js
// In-browser DICOM tag filtering, de-identification, and batch-consistent
// UID regeneration, built on the dcmjs event-stream API (libraries/dcmjs
// submodule): fromPart10 -> [filters] -> Part10Writer -> cleanTags -> write.
//
// The SetFilter/DropFilter shapes are ported from dcmjs-commands
// src/commands/filter.js @ d8759fd (PR #3), which is Node-only CLI; this
// module is the browser-safe home for the same patterns. Per the
// EventStreamListener contract, `this` inside filter methods is the SHARED
// listener — all filter state lives in closures, never on `this`.
//
// PHI-safety invariant: processDicomArrayBuffer throws when dcmjs cannot
// parse the file. Callers running de-identification must treat that as a
// hard block for the file — never fall back to uploading the original,
// still-identified bytes.
//
// Isomorphic: works on client, server, and under node --test (no Meteor
// imports; Meteor.Logger is feature-detected).

import dcmjs from 'dcmjs';
import get from 'lodash/get.js';

import { parseDicomWithDcmjs } from './DcmjsMetadata.js';

const log = (typeof Meteor !== 'undefined' && Meteor.Logger)
  ? Meteor.Logger.for('DicomProcessing')
  : console;

const { fromPart10, Part10Writer } = dcmjs.eventStream;
const { cleanTags, getTagsNameToEmpty } = dcmjs.anonymizer;
const { DicomMetaDictionary } = dcmjs.data;

// UI-VR tags remapped by the batch UID mapper. 00020003
// (MediaStorageSOPInstanceUID, file meta group) is remapped through the same
// chain and then SYNCED to the dataset SOPInstanceUID after collection —
// real-world files sometimes carry a meta UID that disagrees with the
// dataset (rewritten headers), and PS3.10 requires the two to match.
const UID_TAGS_TO_REMAP = [
  '0020000D', // StudyInstanceUID
  '0020000E', // SeriesInstanceUID
  '00080018', // SOPInstanceUID
  '00200052', // FrameOfReferenceUID
  '00081155', // ReferencedSOPInstanceUID (any sequence depth)
  '00020003'  // MediaStorageSOPInstanceUID (file meta)
];

/**
 * Accept '00100010', '0010,0010' or '(0010,0010)'; return canonical 8-hex.
 * Throws on anything that does not reduce to exactly 8 hex digits.
 * @param {String} text
 * @returns {String} - 'GGGGEEEE'
 */
export function normalizeTag(text) {
  const hex = String(text || '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (hex.length !== 8) {
    throw new Error('invalid tag "' + text + '" — expected 8 hex digits');
  }
  return hex;
}

/**
 * Replace the values of matching elements; collapses multi-valued elements
 * to the single replacement value. Ported from dcmjs-commands filter.js.
 * @param {Array<{tag: String, value: String}>} assignments
 * @returns {Object} - EventStreamListener-shaped filter
 */
export function makeSetFilter(assignments) {
  const replacements = new Map();
  (assignments || []).forEach(function(assignment) {
    replacements.set(normalizeTag(get(assignment, 'tag')), get(assignment, 'value', ''));
  });

  let currentTag = null;
  let injected = false;
  return {
    startElement(next, tag, info) {
      currentTag = replacements.has(tag) ? tag : null;
      injected = false;
      return next(tag, info);
    },
    endElement(next) {
      currentTag = null;
      return next();
    },
    value(next, v, opts) {
      if (currentTag === null) {
        return next(v, opts);
      }
      if (injected) {
        return; // collapse multi-valued elements to the one replacement
      }
      injected = true;
      return next(replacements.get(currentTag), opts);
    }
  };
}

/**
 * Swallow every event belonging to a dropped element or sequence (at any
 * nesting depth). Ported from dcmjs-commands filter.js.
 * @param {Array<String>} tags - tag strings in any normalizeTag-accepted form
 * @returns {Object} - EventStreamListener-shaped filter
 */
export function makeDropFilter(tags) {
  const drop = new Set((tags || []).map(normalizeTag));
  let skipElement = false;
  let skipSeqDepth = 0;
  const skipping = () => skipElement || skipSeqDepth > 0;
  const gate = () => (next, ...args) => {
    if (skipping()) {
      return;
    }
    return next(...args);
  };
  return {
    startElement(next, tag, info) {
      if (skipSeqDepth > 0) {
        return;
      }
      if (drop.has(tag)) {
        skipElement = true;
        return;
      }
      return next(tag, info);
    },
    endElement(next) {
      if (skipSeqDepth > 0) {
        return;
      }
      if (skipElement) {
        skipElement = false;
        return;
      }
      return next();
    },
    startSequence(next, tag, info) {
      if (skipSeqDepth > 0) {
        skipSeqDepth++;
        return;
      }
      if (drop.has(tag)) {
        skipSeqDepth = 1;
        return;
      }
      return next(tag, info);
    },
    endSequence(next) {
      if (skipSeqDepth > 0) {
        skipSeqDepth--;
        return;
      }
      return next();
    },
    value: gate(),
    startBinary: gate(),
    binaryFragment: gate(),
    endBinary: gate(),
    bulkDataReference: gate(),
    startItem: gate(),
    endItem: gate()
  };
}

/**
 * Per-batch UID mapper. Create ONE per upload batch and pass it into every
 * processDicomArrayBuffer call in that batch, so the same original
 * StudyInstanceUID maps to the same replacement across all files — keeping
 * multi-file studies aggregated into one ImagingStudy.
 *
 * `filter()` mints a fresh filter (fresh closure state) for each file's
 * writer while every filter shares the one uidMap.
 * @returns {{ filter: Function, map: Function, entries: Function }}
 */
export function createBatchUidMapper() {
  const uidMap = new Map();

  function map(originalUid) {
    if (!originalUid || typeof originalUid !== 'string') {
      return originalUid;
    }
    if (!uidMap.has(originalUid)) {
      uidMap.set(originalUid, DicomMetaDictionary.uid());
    }
    return uidMap.get(originalUid);
  }

  function filter() {
    let remapActive = false;
    return {
      startElement(next, tag, info) {
        remapActive = UID_TAGS_TO_REMAP.indexOf(tag) !== -1;
        return next(tag, info);
      },
      endElement(next) {
        remapActive = false;
        return next();
      },
      value(next, v, opts) {
        if (remapActive) {
          return next(map(v), opts);
        }
        return next(v, opts);
      }
    };
  }

  return {
    filter: filter,
    map: map,
    entries: function() { return Array.from(uidMap.entries()); }
  };
}

/**
 * Run a DICOM Part 10 buffer through the drop/set/UID filter chain and the
 * dcmjs anonymizer, producing a new Part 10 buffer for upload.
 *
 * Pipeline: fromPart10 -> Part10Writer(dropFilter, setFilter, uidFilter)
 *           -> cleanTags(collected dict) -> write().
 * Output is semantically equal, re-encoded Part 10 — byte-identity is a
 * non-goal (see Part10Writer notes).
 *
 * Throws when dcmjs cannot parse the input; callers de-identifying MUST
 * block that file rather than fall back to the original bytes.
 *
 * @param {ArrayBuffer} arrayBuffer
 * @param {Object} [options]
 * @param {Boolean} [options.anonymize] - run dcmjs.anonymizer.cleanTags
 * @param {Object} [options.replacements] - { patientName, patientId }
 * @param {Array<String>} [options.extraTagsToEmpty] - extra tag NAMES to
 *        empty, appended to the anonymizer's default list
 * @param {Array<{tag, value}>} [options.setRules] - explicit tag overwrites
 * @param {Array<String>} [options.dropTags] - tags to remove entirely
 * @param {Object} [options.uidMapper] - from createBatchUidMapper()
 * @returns {Promise<{ outputBuffer: ArrayBuffer, changed: Boolean, deidMethod: String|undefined }>}
 */
export async function processDicomArrayBuffer(arrayBuffer, options = {}) {
  const anonymize = !!get(options, 'anonymize');
  const setRules = get(options, 'setRules', []);
  const dropTags = get(options, 'dropTags', []);
  const uidMapper = get(options, 'uidMapper', null);

  const hasWork = anonymize || setRules.length > 0 || dropTags.length > 0 || !!uidMapper;
  if (!hasWork) {
    log.debug('[DicomProcessing] no processing requested, passing buffer through');
    return { outputBuffer: arrayBuffer, changed: false, deidMethod: undefined };
  }

  // Drop outermost (dropped elements never reach the later filters), then
  // explicit sets, then UID remap innermost (sees the surviving stream).
  const filters = [];
  if (dropTags.length > 0) {
    filters.push(makeDropFilter(dropTags));
  }
  if (setRules.length > 0) {
    filters.push(makeSetFilter(setRules));
  }
  if (uidMapper) {
    filters.push(uidMapper.filter());
  }

  const writer = new Part10Writer(...filters);
  await fromPart10(arrayBuffer, writer);

  if (anonymize) {
    const replacements = {
      '00100010': get(options, 'replacements.patientName') || 'ANON^PATIENT',
      '00100020': get(options, 'replacements.patientId') || 'ANON^ID'
    };
    const extraTagsToEmpty = get(options, 'extraTagsToEmpty', []);
    const namesToEmpty = extraTagsToEmpty.length > 0
      ? getTagsNameToEmpty().concat(extraTagsToEmpty)
      : undefined;
    cleanTags(writer.result.dict, replacements, namesToEmpty);

    // Explicit set rules WIN over the anonymizer's empty-list: cleanTags
    // only touches top-level dict entries, so re-asserting the rules here
    // restores exactly what it may have clobbered (nested occurrences were
    // already handled by the stream filter and are untouched by cleanTags).
    setRules.forEach(function(rule) {
      const tag = normalizeTag(get(rule, 'tag'));
      if (writer.result.dict[tag]) {
        writer.result.dict[tag].Value = [get(rule, 'value', '')];
      }
    });
  }

  // PS3.10: MediaStorageSOPInstanceUID must equal the dataset
  // SOPInstanceUID. When regenerating UIDs, sync the collected meta to the
  // (remapped) dataset value — some real-world files disagree in the
  // original, which would otherwise map to two different new UIDs.
  if (uidMapper) {
    const sopEl = writer.result.dict['00080018'];
    const mediaEl = writer.result.meta['00020003'];
    if (sopEl && mediaEl && get(sopEl, 'Value.0')) {
      mediaEl.Value = [get(sopEl, 'Value.0')];
    }
  }

  const outputBuffer = writer.write();

  let deidMethod;
  if (anonymize) {
    deidMethod = uidMapper ? 'dcmjs.cleanTags+uidremap' : 'dcmjs.cleanTags';
  } else {
    deidMethod = 'dcmjs.filter';
  }

  log.info('[DicomProcessing] processed DICOM buffer', {
    anonymize: anonymize,
    setRules: setRules.length,
    dropTags: dropTags.length,
    uidRemap: !!uidMapper,
    inputBytes: arrayBuffer.byteLength,
    outputBytes: outputBuffer.byteLength
  });

  return { outputBuffer: outputBuffer, changed: true, deidMethod: deidMethod };
}

/**
 * Naturalize two Part 10 buffers and report top-level differences, for the
 * before/after de-identification review table.
 * @param {ArrayBuffer} beforeBuffer
 * @param {ArrayBuffer} afterBuffer
 * @returns {Array<{ tag, name, before, after, action }>}
 *          action: 'emptied' | 'replaced' | 'dropped' | 'remapped'
 */
export function diffDicomTags(beforeBuffer, afterBuffer) {
  const before = parseDicomWithDcmjs(beforeBuffer).dataset;
  const after = parseDicomWithDcmjs(afterBuffer).dataset;

  const names = new Set(
    Object.keys(before).concat(Object.keys(after)).filter(function(k) {
      return k.indexOf('_') !== 0;
    })
  );

  const diffs = [];
  names.forEach(function(name) {
    const beforeText = displayValue(before[name]);
    const afterText = name in after ? displayValue(after[name]) : undefined;
    if (beforeText === afterText) {
      return;
    }

    let action;
    if (afterText === undefined) {
      action = 'dropped';
    } else if (afterText === '') {
      action = 'emptied';
    } else if (/UID$/.test(name)) {
      action = 'remapped';
    } else {
      action = 'replaced';
    }

    diffs.push({
      tag: get(DicomMetaDictionary.nameMap, [name, 'tag'], ''),
      name: name,
      before: beforeText,
      after: afterText === undefined ? '' : afterText,
      action: action
    });
  });

  diffs.sort(function(a, b) { return a.name < b.name ? -1 : 1; });
  return diffs;
}

/**
 * Render a naturalized dataset value as a short display string. Binary
 * values are summarized as '<N bytes>'; person-name proxies and other
 * objects stringify via their own toString.
 */
function displayValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.map(displayValue).join('\\');
  }
  if (value instanceof ArrayBuffer) {
    return '<' + value.byteLength + ' bytes>';
  }
  if (ArrayBuffer.isView(value)) {
    return '<' + value.byteLength + ' bytes>';
  }
  if (typeof value === 'object') {
    // Person-name shapes ({ Alphabetic, Ideographic?, Phonetic? }) render as
    // their Alphabetic component, matching how PN values read clinically.
    if (typeof value.Alphabetic === 'string') {
      return value.Alphabetic;
    }
    try {
      const text = String(value);
      return text === '[object Object]' ? JSON.stringify(value) : text;
    } catch (err) {
      return '<unprintable>';
    }
  }
  return String(value);
}
