// npmPackages/fhircast/client/components/SubscribeButton.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import Button from '@mui/material/Button';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';

function SubscribeButton() {
  var navigate = useNavigate();

  var selectedPatientId = useTracker(function() {
    return Session.get('selectedPatientId');
  }, []);

  function handleClick() {
    if (selectedPatientId) {
      navigate('/fhircast-subscribe?topic=' + encodeURIComponent(selectedPatientId));
    } else {
      navigate('/fhircast-subscribe');
    }
  }

  return (
    <Button
      id="fhircast-subscribe-footer-btn"
      variant="text"
      color="inherit"
      size="small"
      startIcon={<SubscriptionsIcon />}
      onClick={handleClick}
      sx={{
        textTransform: 'none',
        minWidth: 0,
        px: 1.5,
        fontSize: '0.75rem'
      }}
    >
      Subscribe
    </Button>
  );
}

export default SubscribeButton;
