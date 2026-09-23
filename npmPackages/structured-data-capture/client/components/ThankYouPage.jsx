// npmPackages/structured-data-capture/client/components/ThankYouPage.jsx
//
// SDC CONSOLE completion panel — TRANSMISSION RECEIVED confirmation with
// bracketed framing, boot reveal, and a thin accent redirect rail. Redirect/
// countdown logic unchanged.

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Container
} from '@mui/material';
import { CheckCircle as SuccessIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Brackets } from '../consoleTheme';

export function ThankYouPage(props) {
  const {
    message = 'Thank you for completing the questionnaire!',
    subMessage = 'Your responses have been saved.',
    redirectUrl,
    redirectDelay = 5000,
    onClose,
    showRedirectProgress = true,
    customContent,
    successIcon = true,
    // Legacy theming props — accepted, superseded by console vars
    isDark = false,
    cardBgColor = '#ffffff',
    cardTextColor = 'rgba(0, 0, 0, 0.87)',
    paperBgColor = '#ffffff'
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
      <Box
        className="sdc-boot"
        sx={{
          position: 'relative',
          p: 4,
          mt: 4,
          textAlign: 'center',
          bgcolor: 'var(--panel)',
          border: '1px solid var(--hairline)',
          color: 'var(--ink)'
        }}
      >
        <Brackets color="var(--accent-dim)" />

        <Typography
          component="div"
          sx={{
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            letterSpacing: '0.28em',
            color: 'var(--green)',
            mb: 2
          }}
        >
          TRANSMISSION RECEIVED
        </Typography>

        {successIcon && (
          <Box sx={{ mb: 2 }}>
            <SuccessIcon sx={{ fontSize: 64, color: 'var(--green)' }} />
          </Box>
        )}

        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontFamily: 'var(--display)', fontWeight: 700, letterSpacing: '0.03em', color: 'var(--ink)' }}
        >
          {message}
        </Typography>

        {subMessage && (
          <Typography variant="body1" sx={{ color: 'var(--stone)' }} paragraph>
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
                <Typography
                  component="div"
                  gutterBottom
                  sx={{
                    fontFamily: 'var(--mono)',
                    fontSize: '10px',
                    letterSpacing: '0.18em',
                    color: 'var(--stone)'
                  }}
                >
                  REDIRECTING IN {redirectCountdown}S
                </Typography>
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
                      width: redirectProgress + '%',
                      bgcolor: 'var(--accent)',
                      transition: 'width 0.1s linear'
                    }}
                  />
                </Box>
              </Box>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 1.5, justifyContent: 'center' }}>
              <button
                type="button"
                className="sdc-chip-btn sdc-chip-btn--accent"
                onClick={handleRedirectNow}
              >
                Continue Now
              </button>

              {onClose && (
                <button
                  type="button"
                  className="sdc-chip-btn"
                  onClick={onClose}
                >
                  Stay Here
                </button>
              )}
            </Box>
          </>
        )}

        {!redirectUrl && onClose && (
          <Box sx={{ mt: 3 }}>
            <button
              type="button"
              className="sdc-chip-btn sdc-chip-btn--accent"
              onClick={onClose}
            >
              Continue
            </button>
          </Box>
        )}
      </Box>
    </Container>
  );
}
