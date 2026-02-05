// imports/ui/ExternalContentPage.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { get } from 'lodash';

import { Box } from '@mui/material';

import ExternalContentPanel from './ExternalContentPanel';


//==========================================================================================
// Main Component

function ExternalContentPage(){
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // If the 2up side panel is open, redirect away so the iframe only shows in the right panel
  const secondPanelOpen = useTracker(function(){
    return Session.get('secondPanelOpen');
  }, []);

  React.useEffect(function(){
    if(secondPanelOpen){
      const homePage = get(Meteor, 'settings.public.defaults.homePage', '/');
      navigate(homePage);
    }
  }, [secondPanelOpen]);

  // Priority: URL query param > Session > Settings default
  const urlFromParams = searchParams.get('url');
  const urlFromSession = useTracker(function(){
    return Session.get('externalContentUrl');
  }, []);
  const defaultUrl = get(Meteor, 'settings.public.iframe.defaultUrl', 'https://www.ncbi.nlm.nih.gov');

  const showAddressBar = get(Meteor, 'settings.public.iframe.showAddressBar', true);

  const resolvedUrl = urlFromParams || urlFromSession || defaultUrl;

  return (
    <Box
      id="externalContentPage"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <ExternalContentPanel
        url={resolvedUrl}
        showAddressBar={showAddressBar}
        height="100%"
      />
    </Box>
  );
}

export default ExternalContentPage;
