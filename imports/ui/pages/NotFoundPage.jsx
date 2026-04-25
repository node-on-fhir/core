// imports/ui/pages/NotFoundPage.jsx

import React, { useState, useEffect } from 'react';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { useLocation } from 'react-router-dom';

import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

let useNavigate;
let useAppTheme;
Meteor.startup(function() {
  useNavigate = Meteor.useNavigate;
  useAppTheme = Meteor.useTheme;
});

export function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const [flatCardMode, setFlatCardMode] = useState(false);

  useEffect(function() {
    function handleKeyDown(e) {
      if (e.ctrlKey && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        e.preventDefault();
        setFlatCardMode(function(prev) { return !prev; });
      }
    }
    function handleToggleFlatCards() {
      setFlatCardMode(function(prev) { return !prev; });
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('toggleFlatCards', handleToggleFlatCards);
    return function() {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('toggleFlatCards', handleToggleFlatCards);
    };
  }, []);

  const title = get(Meteor, 'settings.public.404.title',
    get(Meteor, 'settings.public.defaults.notFoundPage.title', 'Page Not Found'));
  const statusCode = get(Meteor, 'settings.public.defaults.notFoundPage.statusCode', '404');
  const message = get(Meteor, 'settings.public.404.message',
    get(Meteor, 'settings.public.defaults.notFoundPage.message', 'The page you were looking for does not exist. It may have been moved, renamed, or it might be taking a well-deserved break.'));
  const buttonLabel = get(Meteor, 'settings.public.defaults.notFoundPage.buttonLabel', 'Return Home');
  const buttonPath = get(Meteor, 'settings.public.defaults.notFoundPage.buttonPath', '/');
  const imagePath = get(Meteor, 'settings.public.defaults.notFoundPage.imagePath', '');
  const showAttemptedPath = get(Meteor, 'settings.public.defaults.notFoundPage.showAttemptedPath', true);

  function handleReturnHome() {
    navigate(buttonPath);
  }

  let imageElement = null;
  if (imagePath) {
    imageElement = <img src={imagePath} alt="" style={{ maxWidth: '100%', maxHeight: '200px', marginBottom: '16px' }} />;
  }

  return (
    <Box
      id="notFoundPage"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: '100vh',
        paddingTop: { xs: '10vh', md: '12vh' },
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `url(${isDark ? '/HoneycombMesh-Dark.jpg' : '/HoneycombMesh.jpg'})`,
        backgroundPosition: 'bottom center',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundColor: isDark ? '#000000' : '#ffffff'
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontWeight: 100,
          color: flatCardMode ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)') : 'text.disabled',
          fontSize: { xs: '8rem', md: '12rem' },
          lineHeight: 1,
          letterSpacing: '-0.02em',
          mb: flatCardMode ? -4 : 1,
          transition: 'color 300ms ease, margin-bottom 300ms ease, opacity 300ms ease',
          opacity: flatCardMode ? 0.7 : 1,
          userSelect: 'none',
          zIndex: 1
        }}
      >
        {statusCode}
      </Typography>

      <Card
        sx={{
          maxWidth: '600px',
          width: '90%',
          borderRadius: 3,
          boxShadow: flatCardMode ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
          border: flatCardMode ? '1px solid transparent' : '1px solid',
          borderColor: flatCardMode ? 'transparent' : 'divider',
          backgroundColor: flatCardMode ? 'transparent' : (isDark ? '#000000' : '#ffffff'),
          backgroundImage: flatCardMode ? 'none' : undefined,
          transition: 'background-color 300ms ease, box-shadow 300ms ease, border-color 300ms ease',
          zIndex: 2
        }}
      >
        <CardContent sx={{ p: { xs: 4, md: 6 } }}>
          {imageElement}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 500,
              color: 'text.primary',
              mb: 2
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              lineHeight: 1.7,
              maxWidth: '480px',
              mx: 'auto',
              mb: 2
            }}
          >
            {message}
          </Typography>
          {showAttemptedPath && location.pathname !== '/' ? (
            <Typography
              variant="body2"
              sx={{
                color: 'text.disabled',
                fontFamily: 'monospace',
                mb: 3,
                wordBreak: 'break-all'
              }}
            >
              {location.pathname}
            </Typography>
          ) : null}
          <Button
            variant="outlined"
            color="primary"
            size="large"
            startIcon={<HomeIcon />}
            onClick={handleReturnHome}
            sx={{
              mt: 1,
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 500,
              borderRadius: 2,
              textTransform: 'none',
              minHeight: '48px',
              minWidth: '180px',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
              },
              '&:active': {
                backgroundColor: 'primary.dark',
                color: 'primary.contrastText'
              }
            }}
          >
            {buttonLabel}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export default NotFoundPage;
