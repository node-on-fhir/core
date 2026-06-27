// npmPackages/structured-data-capture/client/components/QuestionTypes/LikertScaleQuestion.jsx
//
// FHIR adapter that renders an ordinal `choice` item as a horizontal Likert rail.
//
// It is a drop-in alternative to ChoiceQuestion (same prop signature, same
// onChange value contract), selected by the shape-detection resolver in
// questionRendererRegistry.js. It extracts the item's answerOption codings and
// their ordinalValue extensions, hands them to the FHIR-agnostic <LikertScale>
// widget, and translates the widget's selected code back into the
// `{ code, display, system }` shape ChoiceQuestion emits — so
// ResponseUtils.createAnswerFromValue(value, 'choice') still produces a
// QuestionnaireResponse answer of `{ valueCoding: {...} }` unchanged.

import React from 'react';
import { get } from 'lodash';

import { LikertScale } from '../widgets/LikertScale';

const ORDINAL_VALUE_URL = 'http://hl7.org/fhir/StructureDefinition/ordinalValue';

export function LikertScaleQuestion(props) {
  const {
    item,
    value,
    onChange,
    readOnly = false,
    error = false,
    helperText
  } = props;

  const answerOption = get(item, 'answerOption', []);

  // Extract options — mirrors ChoiceQuestion's extraction, plus the ordinal
  // score carried on each option's ordinalValue extension.
  const options = answerOption.map(function(option) {
    const coding = get(option, 'valueCoding', {});
    const ordinalExt = get(option, 'extension', []).find(function(ext) {
      return get(ext, 'url') === ORDINAL_VALUE_URL;
    });

    return {
      value: get(coding, 'code', ''),
      label: get(coding, 'display', get(coding, 'code', '')),
      ordinal: get(ordinalExt, 'valueDecimal'),
      system: get(coding, 'system', '')
    };
  });

  // Current selection as a bare code (value may be a valueCoding object or a string).
  const currentCode = (function() {
    if (!value) return '';
    return typeof value === 'string' ? value : get(value, 'code', '');
  })();

  // Translate the selected code back into the choice value contract.
  const handleChange = function(selectedCode) {
    if (readOnly) return;
    const option = options.find(function(opt) {
      return opt.value === selectedCode;
    });

    if (option) {
      onChange({ code: option.value, display: option.label, system: option.system });
    } else {
      onChange(selectedCode);
    }
  };

  return (
    <LikertScale
      name={get(item, 'linkId')}
      options={options}
      value={currentCode}
      onChange={handleChange}
      readOnly={readOnly}
      error={error}
      helperText={helperText}
    />
  );
}

export default LikertScaleQuestion;
