// imports/ui/pages/NotFoundPage.jsx

import React from 'react';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { useLocation } from 'react-router-dom';

import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

let useNavigate;
Meteor.startup(function() {
  useNavigate = Meteor.useNavigate;
});

export function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const title = get(Meteor, 'settings.public.defaults.notFoundPage.title', 'Lost in the Comb');
  const statusCode = get(Meteor, 'settings.public.defaults.notFoundPage.statusCode', '404');
  const message = get(Meteor, 'settings.public.defaults.notFoundPage.message', 'The page you were looking for does not exist. It may have been moved, renamed, or it might be taking a well-deserved break.');
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
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center'
      }}
    >
      <Card
        sx={{
          maxWidth: '600px',
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <CardContent sx={{ p: 6 }}>
          {imageElement}
          <Typography
            variant="h1"
            sx={{
              fontWeight: 700,
              color: 'text.disabled',
              mb: 1,
              fontSize: { xs: '4rem', md: '6rem' },
              lineHeight: 1
            }}
          >
            {statusCode}
          </Typography>
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
            variant="contained"
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
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
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
