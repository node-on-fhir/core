// imports/ui/pages/WelcomePage.jsx

import React, { useLayoutEffect, useRef } from 'react';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { Box, Card, CardActionArea, CardMedia } from '@mui/material';

// Pre-render circuit breaker: Meteor.settings are bundled with the app,
// so we can read the hideNavbars config and set the displayNavbars Session
// variable before any component renders — preventing the navbar flash.
let modulePreRenderState;
const hideNavbarsConfig = get(Meteor, 'settings.public.welcome.hideNavbars', true);
if (hideNavbarsConfig) {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  const defaultRoute = get(Meteor, 'settings.public.defaults.route');
  if (pathname === '/welcome-to-node-on-fhir' || (pathname === '/' && (!defaultRoute || defaultRoute === '/welcome-to-node-on-fhir'))) {
    modulePreRenderState = Session.get('displayNavbars');
    Session.set('displayNavbars', false);
  }
}

let useNavigate;
Meteor.startup(function() {
  useNavigate = Meteor.useNavigate;
});

export function WelcomePage() {
  const navigate = useNavigate();

  const imageUrl = get(Meteor, 'settings.public.welcome.imageUrl', '/NodeOnFHIR-NASA.png');
  const nextPath = get(Meteor, 'settings.public.welcome.next', '/getting-started');
  const hideNavbars = hideNavbarsConfig;

  const previousNavbarState = useRef(null);

  useLayoutEffect(function() {
    if (hideNavbars) {
      if (modulePreRenderState !== undefined) {
        previousNavbarState.current = modulePreRenderState;
        modulePreRenderState = undefined;
      } else {
        previousNavbarState.current = Session.get('displayNavbars');
      }
      Session.set('displayNavbars', false);
    }

    return function() {
      if (hideNavbars) {
        Session.set('displayNavbars', previousNavbarState.current !== undefined ? previousNavbarState.current : true);
      }
    };
  }, [hideNavbars]);

  function handleClick() {
    navigate(nextPath);
  }

  return (
    <Box
      id="welcomePage"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        pb: '200px',
        backgroundColor: 'background.default'
      }}
    >
      <Card
        sx={{
          maxWidth: '800px',
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <CardActionArea onClick={handleClick}>
          <CardMedia
            component="img"
            image={imageUrl}
            alt="Welcome to Node on FHIR"
            sx={{
              objectFit: 'contain'
            }}
          />
        </CardActionArea>
      </Card>
    </Box>
  );
}

export default WelcomePage;
