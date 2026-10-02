// npmPackages/structured-data-capture/client/components/ActionButtons.jsx
//
// SDC CONSOLE action row — chip-button console styling (submit = filled accent
// variant). Signature unchanged; lastSaved readout kept behind showLastSaved
// for non-console callers (the console masthead owns save state and passes
// showLastSaved=false).

import React from 'react';
import {
  Box,
  Typography
} from '@mui/material';
import moment from 'moment';

export function ActionButtons(props) {
  const {
    onSubmit,
    onSave,
    onCancel,
    onClearAll,
    isSubmitting = false,
    isSaving = false,
    lastSaved,
    canSubmit = true,
    submitLabel = 'Submit',
    saveLabel = 'Save',
    cancelLabel = 'Cancel',
    clearLabel = 'Clear All',
    showLastSaved = true,
    fullWidth = false,
    // Legacy theming props — accepted, superseded by console vars
    isDark = false,
    cardTextColor = 'rgba(0, 0, 0, 0.87)',
    borderColor = 'rgba(0, 0, 0, 0.23)'
  } = props;

  const getLastSavedText = function() {
    if (!lastSaved) return null;

    const now = moment();
    const saved = moment(lastSaved);
    const diffMinutes = now.diff(saved, 'minutes');

    if (diffMinutes < 1) {
      return 'SAVED JUST NOW';
    } else if (diffMinutes < 60) {
      return 'SAVED ' + diffMinutes + 'M AGO';
    } else {
      return 'SAVED ' + saved.format('HH:mm');
    }
  };

  const lastSavedText = getLastSavedText();
  const busy = isSubmitting || isSaving;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2
      }}
    >
      {/* Primary actions */}
      <Box sx={{ display: 'flex', gap: 1.5, flex: fullWidth ? '1 1 100%' : 'auto' }}>
        {onSubmit && (
          <button
            id="submitQuestionnaireButton"
            type="button"
            className="sdc-chip-btn sdc-chip-btn--accent"
            onClick={onSubmit}
            disabled={!canSubmit || busy}
          >
            {isSubmitting ? 'Transmitting…' : submitLabel}
          </button>
        )}

        {onSave && (
          <button
            id="saveQuestionnaireButton"
            type="button"
            className="sdc-chip-btn"
            onClick={onSave}
            disabled={busy}
          >
            {isSaving ? 'Saving…' : saveLabel}
          </button>
        )}
      </Box>

      {/* Secondary actions and status */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {showLastSaved && lastSavedText && (
          <Typography
            component="span"
            sx={{
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              letterSpacing: '0.18em',
              color: 'var(--green)'
            }}
          >
            {lastSavedText}
          </Typography>
        )}

        {onClearAll && (
          <button
            id="clearAllAnswersButton"
            type="button"
            className="sdc-chip-btn sdc-chip-btn--danger"
            onClick={onClearAll}
            disabled={busy}
            title="Clear all answers"
          >
            {clearLabel}
          </button>
        )}

        {onCancel && (
          <button
            id="cancelQuestionnaireButton"
            type="button"
            className="sdc-chip-btn"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
        )}
      </Box>
    </Box>
  );
}
