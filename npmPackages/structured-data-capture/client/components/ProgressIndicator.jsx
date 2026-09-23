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

  // Default linear variant — console readout: mono ANSWERED NN/NN — PP% over a
  // thin scan rail (accent fill, green at 100%, shimmer while incomplete).
  const pad2 = function(n) { return String(n).padStart(2, '0'); };
  const complete = percentage === 100;
  const fillColor = complete ? 'var(--green)' : 'var(--accent)';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
        <Typography
          component="span"
          sx={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.28em', color: 'var(--stone)' }}
        >
          PROGRESS
        </Typography>
        {showDetails && (
          <Typography
            component="span"
            sx={{
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '0.14em',
              fontVariantNumeric: 'tabular-nums',
              color: complete ? 'var(--green)' : 'var(--stone)'
            }}
          >
            ANSWERED {pad2(answered)}/{pad2(total)} — {percentage}%
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          position: 'relative',
          height: '2px',
          bgcolor: 'color-mix(in srgb, var(--stone) 18%, transparent)',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: percentage + '%',
            bgcolor: fillColor,
            transition: 'width 0.4s cubic-bezier(0.2, 0.9, 0.25, 1)',
            overflow: 'hidden'
          }}
        >
          {!complete && percentage > 0 && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                width: '40%',
                background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--ink) 35%, transparent), transparent)',
                animation: 'sdcShimmer 2.4s ease-in-out infinite'
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}