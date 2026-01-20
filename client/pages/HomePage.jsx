// client/pages/HomePage.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const currentUser = useTracker(() => Meteor.user());
  const accountsEnabled = useTracker(() => 
    Meteor.settings?.public?.modules?.accounts?.enabled ?? true
  );

  return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h2" gutterBottom>
        Welcome to Honeycomb
      </Typography>
      
      {currentUser ? (
        <>
          <Typography variant="h5" gutterBottom>
            Hello, {currentUser.username || currentUser.emails?.[0]?.address}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You are successfully logged in.
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Please log in to continue.
          </Typography>
          {accountsEnabled && (
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                onClick={() => navigate('/login')}
                sx={{ mr: 2 }}
              >
                Sign In
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/register')}
              >
                Register
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}