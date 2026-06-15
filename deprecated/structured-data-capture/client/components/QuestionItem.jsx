// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/components/QuestionItem.jsx

import React, { memo } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  IconButton,
  Tooltip,
  Chip,
  FormHelperText
} from '@mui/material';
import { 
  Clear as ClearIcon,
  QrCode as QrCodeIcon,
  Info as InfoIcon
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
    value,
    onChange,
    onClear,
    onFocus,
    readOnly = false,
    showLinkId = false,
    renderItems,
    validationError,
    // Dark mode theming props
    isDark = false,
    cardBgColor = '#ffffff',
    cardTextColor = 'rgba(0, 0, 0, 0.87)',
    paperBgColor = '#ffffff',
    borderColor = 'rgba(0, 0, 0, 0.23)'
  } = props;

  // Theme-aware colors
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const errorBgColor = isDark ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.1)';
  const hoverBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';

  const type = get(item, 'type');
  const linkId = get(item, 'linkId');
  const text = get(item, 'text');
  const required = get(item, 'required', false);
  const repeats = get(item, 'repeats', false);
  const readOnlyItem = get(item, 'readOnly', false) || readOnly;
  const helpText = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl'
  )?.valueString;

  // Handle group items
  if (type === 'group') {
    return (
      <Card
        id={`question-${linkId}`}
        variant={depth === 0 ? 'outlined' : 'elevation'}
        elevation={depth === 0 ? 0 : 1}
        sx={{
          mb: 2,
          ml: depth * 2,
          backgroundColor: depth === 0 ? 'transparent' : paperBgColor,
          borderColor: borderColor
        }}
      >
        <CardContent>
          <Typography variant={depth === 0 ? 'h6' : 'subtitle1'} gutterBottom sx={{ color: cardTextColor }}>
            {text}
          </Typography>
          {renderItems && renderItems(get(item, 'item', []), depth + 1)}
        </CardContent>
      </Card>
    );
  }

  // Handle display items
  if (type === 'display') {
    return (
      <Box
        id={`question-${linkId}`}
        sx={{ mb: 2, ml: depth * 2 }}
      >
        <Typography variant="body1" sx={{ color: secondaryTextColor }}>
          {text}
        </Typography>
      </Box>
    );
  }

  // Get the appropriate question component
  const QuestionComponent = questionComponents[type];
  if (!QuestionComponent) {
    console.warn('Unknown question type:', type);
    return null;
  }

  return (
    <Box
      id={`question-${linkId}`}
      sx={{
        mb: 3,
        ml: depth * 2,
        p: 2,
        borderRadius: 1,
        backgroundColor: validationError ? errorBgColor : 'transparent',
        '&:hover': {
          backgroundColor: readOnlyItem ? 'transparent' : hoverBgColor
        }
      }}
      onFocus={onFocus}
    >
      {/* Question header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body1" component="div" sx={{ color: cardTextColor }}>
            {text}
            {required && (
              <Typography component="span" sx={{ ml: 0.5, color: isDark ? '#f44336' : '#d32f2f' }}>
                *
              </Typography>
            )}
            {repeats && (
              <Chip
                label="Multiple"
                size="small"
                sx={{ ml: 1, color: cardTextColor, borderColor: borderColor }}
                variant="outlined"
              />
            )}
          </Typography>

          {helpText && (
            <FormHelperText sx={{ color: secondaryTextColor }}>{helpText}</FormHelperText>
          )}
        </Box>
        
        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {showLinkId && (
            <Tooltip title={`LinkId: ${linkId}`}>
              <IconButton size="small" sx={{ color: secondaryTextColor }}>
                <QrCodeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {get(item, 'definition') && (
            <Tooltip title={get(item, 'definition')}>
              <IconButton size="small" sx={{ color: secondaryTextColor }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {!readOnlyItem && value && onClear && (
            <Tooltip title="Clear answer">
              <IconButton
                size="small"
                onClick={onClear}
                sx={{ color: isDark ? '#f44336' : '#d32f2f' }}
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