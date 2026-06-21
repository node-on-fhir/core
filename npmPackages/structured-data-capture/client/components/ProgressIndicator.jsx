// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/components/ProgressIndicator.jsx

import React from 'react';
import { 
  Box, 
  LinearProgress, 
  Typography, 
  Chip
} from '@mui/material';
import { 
  CheckCircle as CompleteIcon,
  RadioButtonUnchecked as IncompleteIcon
} from '@mui/icons-material';

export function ProgressIndicator(props) {
  const {
    total = 0,
    answered = 0,
    percentage = 0,
    showDetails = true,
    variant = 'linear',
    color = 'primary',
    size = 'medium',
    // Dark mode theming props
    isDark = false,
    cardTextColor = 'rgba(0, 0, 0, 0.87)',
    paperBgColor = '#ffffff'
  } = props;

  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  if (variant === 'circular') {
    const primaryColor = isDark ? '#90caf9' : '#1976d2';
    const successColor = isDark ? '#81c784' : '#2e7d32';
    const bgColor = isDark ? '#424242' : '#e0e0e0';

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <Box
            sx={{
              width: size === 'small' ? 40 : size === 'large' ? 80 : 60,
              height: size === 'small' ? 40 : size === 'large' ? 80 : 60,
              borderRadius: '50%',
              background: `conic-gradient(
                ${color === 'primary' ? primaryColor : successColor} ${percentage * 3.6}deg,
                ${bgColor} ${percentage * 3.6}deg
              )`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box
              sx={{
                width: '85%',
                height: '85%',
                borderRadius: '50%',
                backgroundColor: paperBgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography
                variant={size === 'small' ? 'caption' : size === 'large' ? 'h6' : 'body2'}
                fontWeight="bold"
                sx={{ color: cardTextColor }}
              >
                {percentage}%
              </Typography>
            </Box>
          </Box>
        </Box>

        {showDetails && (
          <Box>
            <Typography variant="body2" sx={{ color: secondaryTextColor }}>
              {answered} of {total} questions answered
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  if (variant === 'chips') {
    const chipBorderColor = isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)';

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          icon={percentage === 100 ? <CompleteIcon /> : <IncompleteIcon />}
          label={`${percentage}% Complete`}
          color={percentage === 100 ? 'success' : 'default'}
          size={size}
          sx={percentage !== 100 ? { color: cardTextColor, bgcolor: isDark ? '#424242' : undefined } : {}}
        />
        {showDetails && (
          <Chip
            label={`${answered} / ${total} answered`}
            variant="outlined"
            size={size}
            sx={{ color: cardTextColor, borderColor: chipBorderColor }}
          />
        )}
      </Box>
    );
  }

  // Default linear variant
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ color: secondaryTextColor }}>
          Progress
        </Typography>
        <Typography variant="body2" sx={{ color: secondaryTextColor }}>
          {percentage}% Complete
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={percentage}
        color={percentage === 100 ? 'success' : color}
        sx={{
          height: size === 'small' ? 4 : size === 'large' ? 12 : 8,
          borderRadius: 1,
          bgcolor: isDark ? '#424242' : '#e0e0e0'
        }}
      />

      {showDetails && (
        <Typography variant="caption" sx={{ mt: 0.5, color: secondaryTextColor }}>
          {answered} of {total} questions answered
        </Typography>
      )}
    </Box>
  );
}