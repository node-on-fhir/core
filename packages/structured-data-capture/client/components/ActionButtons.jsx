// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/components/ActionButtons.jsx

import React from 'react';
import { 
  Box, 
  Button, 
  ButtonGroup,
  CircularProgress,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Send as SubmitIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Cancel as CancelIcon,
  Check as CheckIcon
} from '@mui/icons-material';
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
    variant = 'contained',
    size = 'medium',
    fullWidth = false,
    // Dark mode theming props
    isDark = false,
    cardTextColor = 'rgba(0, 0, 0, 0.87)',
    borderColor = 'rgba(0, 0, 0, 0.23)'
  } = props;

  // Theme-aware colors
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const disabledColor = isDark ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.38)';

  const getLastSavedText = function() {
    if (!lastSaved) return null;
    
    const now = moment();
    const saved = moment(lastSaved);
    const diffMinutes = now.diff(saved, 'minutes');
    
    if (diffMinutes < 1) {
      return 'Saved just now';
    } else if (diffMinutes < 60) {
      return `Saved ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return `Saved at ${saved.format('h:mm A')}`;
    }
  };

  const lastSavedText = getLastSavedText();

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
      <Box sx={{ display: 'flex', gap: 2, flex: fullWidth ? '1 1 100%' : 'auto' }}>
        {onSubmit && (
          <Button
            variant={variant}
            color="primary"
            size={size}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : <SubmitIcon />}
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting || isSaving}
            fullWidth={fullWidth}
          >
            {submitLabel}
          </Button>
        )}
        
        {onSave && (
          <Button
            variant={onSubmit ? 'outlined' : variant}
            color="primary"
            size={size}
            startIcon={isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={onSave}
            disabled={isSaving || isSubmitting}
            fullWidth={fullWidth && !onSubmit}
          >
            {saveLabel}
          </Button>
        )}
      </Box>

      {/* Secondary actions and status */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {showLastSaved && lastSavedText && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckIcon fontSize="small" color="success" />
            <Typography variant="caption" sx={{ color: secondaryTextColor }}>
              {lastSavedText}
            </Typography>
          </Box>
        )}

        {(onCancel || onClearAll) && (
          <ButtonGroup variant="outlined" size={size} sx={{ '& .MuiButton-outlined': { borderColor: borderColor } }}>
            {onClearAll && (
              <Tooltip title="Clear all answers">
                <Button
                  color="error"
                  startIcon={<ClearIcon />}
                  onClick={onClearAll}
                  disabled={isSubmitting || isSaving}
                >
                  {clearLabel}
                </Button>
              </Tooltip>
            )}

            {onCancel && (
              <Button
                startIcon={<CancelIcon />}
                onClick={onCancel}
                disabled={isSubmitting || isSaving}
                sx={{
                  color: cardTextColor,
                  borderColor: borderColor,
                  '&.Mui-disabled': { color: disabledColor }
                }}
              >
                {cancelLabel}
              </Button>
            )}
          </ButtonGroup>
        )}
      </Box>
    </Box>
  );
}