// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/components/ThankYouPage.jsx

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button,
  LinearProgress,
  Container
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export function ThankYouPage(props) {
  const {
    message = 'Thank you for completing the questionnaire!',
    subMessage = 'Your responses have been saved.',
    redirectUrl,
    redirectDelay = 5000,
    onClose,
    showRedirectProgress = true,
    customContent,
    successIcon = true
  } = props;

  const navigate = useNavigate();
  const [redirectCountdown, setRedirectCountdown] = useState(Math.floor(redirectDelay / 1000));
  const [redirectProgress, setRedirectProgress] = useState(0);

  useEffect(function() {
    if (!redirectUrl) return;

    const startTime = Date.now();
    const interval = setInterval(function() {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, redirectDelay - elapsed);
      const countdown = Math.ceil(remaining / 1000);
      const progress = Math.min(100, (elapsed / redirectDelay) * 100);
      
      setRedirectCountdown(countdown);
      setRedirectProgress(progress);
      
      if (remaining <= 0) {
        clearInterval(interval);
        if (redirectUrl.startsWith('http')) {
          window.location.href = redirectUrl;
        } else {
          navigate(redirectUrl);
        }
      }
    }, 100);

    return function() {
      clearInterval(interval);
    };
  }, [redirectUrl, redirectDelay, navigate]);

  const handleRedirectNow = function() {
    if (redirectUrl) {
      if (redirectUrl.startsWith('http')) {
        window.location.href = redirectUrl;
      } else {
        navigate(redirectUrl);
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 4,
          textAlign: 'center'
        }}
      >
        {successIcon && (
          <Box sx={{ mb: 3 }}>
            <SuccessIcon 
              sx={{ 
                fontSize: 80, 
                color: 'success.main',
                animation: 'pulse 2s infinite'
              }} 
            />
          </Box>
        )}
        
        <Typography variant="h4" gutterBottom>
          {message}
        </Typography>
        
        {subMessage && (
          <Typography variant="body1" color="textSecondary" paragraph>
            {subMessage}
          </Typography>
        )}
        
        {customContent && (
          <Box sx={{ my: 3 }}>
            {customContent}
          </Box>
        )}
        
        {redirectUrl && (
          <>
            {showRedirectProgress && (
              <Box sx={{ mt: 4, mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Redirecting in {redirectCountdown} seconds...
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={redirectProgress}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
            )}
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={handleRedirectNow}
              >
                Continue Now
              </Button>
              
              {onClose && (
                <Button
                  variant="outlined"
                  onClick={onClose}
                >
                  Stay Here
                </Button>
              )}
            </Box>
          </>
        )}
        
        {!redirectUrl && onClose && (
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={onClose}
            >
              Continue
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

// Add CSS animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}