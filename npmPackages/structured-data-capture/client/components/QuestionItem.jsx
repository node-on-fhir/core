// npmPackages/structured-data-capture/client/components/QuestionItem.jsx
//
// SDC CONSOLE question row — left accent rail on hover/focus, accent required
// dot (no red asterisk), mono microcopy chips, row-reveal stagger on first
// mount only (key=linkId keeps answer edits from remounting/re-animating).
// Colors ride the .sdc-console vars delivered through the color props.

import React, { memo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  FormHelperText
} from '@mui/material';
import {
  Clear as ClearIcon,
  QrCode as QrCodeIcon,
  Info as InfoIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { get } from 'lodash';

// Import question type components
import { BooleanQuestion } from './QuestionTypes/BooleanQuestion';
import { ChoiceQuestion } from './QuestionTypes/ChoiceQuestion';
import { DateQuestion } from './QuestionTypes/DateQuestion';
import { DecimalQuestion } from './QuestionTypes/DecimalQuestion';
import { IntegerQuestion } from './QuestionTypes/IntegerQuestion';
import { StringQuestion } from './QuestionTypes/StringQuestion';
import { TextQuestion } from './QuestionTypes/TextQuestion';
import { AttachmentQuestion } from './QuestionTypes/AttachmentQuestion';
import { resolveQuestionComponent } from './QuestionTypes/questionRendererRegistry';

const questionComponents = {
  boolean: BooleanQuestion,
  choice: ChoiceQuestion,
  'open-choice': ChoiceQuestion,
  date: DateQuestion,
  dateTime: DateQuestion,
  time: DateQuestion,
  decimal: DecimalQuestion,
  integer: IntegerQuestion,
  string: StringQuestion,
  text: TextQuestion,
  url: StringQuestion,
  attachment: AttachmentQuestion,
  reference: StringQuestion,
  quantity: DecimalQuestion
};

export const QuestionItem = memo(function QuestionItem(props) {
  const {
    item,
    depth = 0,
    revealIndex = 0,
    value,
    onChange,
    onClear,
    onFocus,
    readOnly = false,
    showLinkId = false,
    renderItems,
    validationError,
    aiFilled = false,
    // Legacy theming props — accepted, superseded by console vars
    isDark = false,
    cardBgColor = '#ffffff',
    cardTextColor = 'rgba(0, 0, 0, 0.87)',
    paperBgColor = '#ffffff',
    borderColor = 'rgba(0, 0, 0, 0.23)'
  } = props;

  const type = get(item, 'type');
  const linkId = get(item, 'linkId');
  const text = get(item, 'text');
  const required = get(item, 'required', false);
  const repeats = get(item, 'repeats', false);
  const readOnlyItem = get(item, 'readOnly', false) || readOnly;
  const helpText = get(item, 'extension', []).find(e =>
    e.url === 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl'
  )?.valueString;

  // Handle group items — display-font section header with a drawn rule
  if (type === 'group') {
    return (
      <Box
        id={`question-${linkId}`}
        className="sdc-row"
        style={{ '--sdc-i': revealIndex }}
        sx={{ mb: 3, ml: depth * 2 }}
      >
        <Typography
          component="div"
          sx={{
            fontFamily: 'var(--display)',
            fontWeight: depth === 0 ? 700 : 500,
            fontSize: depth === 0 ? '18px' : '15px',
            letterSpacing: '0.06em',
            textTransform: depth === 0 ? 'uppercase' : 'none',
            color: 'var(--ink)',
            mb: 0.75
          }}
        >
          {text}
        </Typography>
        <Box className="sdc-rule" sx={{ height: '1px', bgcolor: depth === 0 ? 'var(--accent-dim)' : 'var(--hairline)', mb: 2 }} />
        {renderItems && renderItems(get(item, 'item', []), depth + 1)}
      </Box>
    );
  }

  // Handle display items
  if (type === 'display') {
    return (
      <Box
        id={`question-${linkId}`}
        className="sdc-row"
        style={{ '--sdc-i': revealIndex }}
        sx={{ mb: 2, ml: depth * 2 }}
      >
        <Typography variant="body1" sx={{ color: 'var(--stone)' }}>
          {text}
        </Typography>
      </Box>
    );
  }

  // Get the appropriate question component. Shape-detected renderers (e.g. an
  // ordinal Likert rail) get first refusal; otherwise fall back to the static
  // type -> Component map.
  const QuestionComponent = resolveQuestionComponent(item) || questionComponents[type];
  if (!QuestionComponent) {
    console.warn('Unknown question type:', type);
    return null;
  }

  return (
    <Box
      id={`question-${linkId}`}
      className="sdc-row sdc-question-row"
      style={{ '--sdc-i': revealIndex }}
      sx={{
        mb: 3,
        ml: depth * 2,
        px: 2,
        py: 1.5,
        backgroundColor: validationError
          ? 'color-mix(in srgb, var(--error) 8%, transparent)'
          : 'transparent'
      }}
      onFocus={onFocus}
    >
      {/* Question header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body1" component="div" sx={{ color: 'var(--ink)' }}>
            {required && (
              <Tooltip title="Required">
                <Box component="span" sx={{ color: 'var(--accent)', mr: 1, fontSize: '9px', verticalAlign: 'middle' }}>
                  ●
                </Box>
              </Tooltip>
            )}
            {text}
            {repeats && (
              <Box component="span" className="sdc-micro-chip">MULTI</Box>
            )}
            {aiFilled && value !== null && value !== undefined && (
              <Tooltip title="Suggested from the patient summary — please verify">
                <Box component="span" className="sdc-micro-chip sdc-micro-chip--ai">
                  <AutoAwesomeIcon sx={{ fontSize: 11 }} />
                  AI·VERIFY
                </Box>
              </Tooltip>
            )}
          </Typography>

          {helpText && (
            <FormHelperText sx={{ color: 'var(--stone)' }}>{helpText}</FormHelperText>
          )}
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {showLinkId && (
            <Tooltip title={`LinkId: ${linkId}`}>
              <IconButton size="small" sx={{ color: 'var(--stone)' }}>
                <QrCodeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {get(item, 'definition') && (
            <Tooltip title={get(item, 'definition')}>
              <IconButton size="small" sx={{ color: 'var(--stone)' }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {!readOnlyItem && value && onClear && (
            <Tooltip title="Clear answer">
              <IconButton
                size="small"
                onClick={onClear}
                sx={{ color: 'var(--error)' }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Question input */}
      <QuestionComponent
        item={item}
        value={value}
        onChange={onChange}
        readOnly={readOnlyItem}
        error={!!validationError}
        helperText={validationError?.message}
        isDark={isDark}
        cardTextColor={cardTextColor}
        borderColor={borderColor}
      />

      {/* Nested items */}
      {renderItems && get(item, 'item') && (
        <Box sx={{ mt: 2, ml: 2 }}>
          {renderItems(get(item, 'item', []), depth + 1)}
        </Box>
      )}
    </Box>
  );
});
