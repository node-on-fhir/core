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
    size = 'medium'
  } = props;

  if (variant === 'circular') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <Box
            sx={{
              width: size === 'small' ? 40 : size === 'large' ? 80 : 60,
              height: size === 'small' ? 40 : size === 'large' ? 80 : 60,
              borderRadius: '50%',
              background: `conic-gradient(
                ${color === 'primary' ? '#1976d2' : '#2e7d32'} ${percentage * 3.6}deg, 
                #e0e0e0 ${percentage * 3.6}deg
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
                backgroundColor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography 
                variant={size === 'small' ? 'caption' : size === 'large' ? 'h6' : 'body2'}
                fontWeight="bold"
              >
                {percentage}%
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {showDetails && (
          <Box>
            <Typography variant="body2" color="textSecondary">
              {answered} of {total} questions answered
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  if (variant === 'chips') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          icon={percentage === 100 ? <CompleteIcon /> : <IncompleteIcon />}
          label={`${percentage}% Complete`}
          color={percentage === 100 ? 'success' : 'default'}
          size={size}
        />
        {showDetails && (
          <Chip
            label={`${answered} / ${total} answered`}
            variant="outlined"
            size={size}
          />
        )}
      </Box>
    );
  }

  // Default linear variant
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="textSecondary">
          Progress
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {percentage}% Complete
        </Typography>
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={percentage} 
        color={percentage === 100 ? 'success' : color}
        sx={{ 
          height: size === 'small' ? 4 : size === 'large' ? 12 : 8,
          borderRadius: 1
        }}
      />
      
      {showDetails && (
        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
          {answered} of {total} questions answered
        </Typography>
      )}
    </Box>
  );
}