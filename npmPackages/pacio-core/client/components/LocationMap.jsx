// /packages/pacio-core/client/components/LocationMap.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { Meteor } from 'meteor/meteor';
import GoogleMapReact from 'google-map-react';
import { get } from 'lodash';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const Marker = function({ text }) {
  return (
    <div style={{
      position: 'absolute',
      transform: 'translate(-50%, -50%)',
      width: '40px',
      height: '40px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '50%',
      backgroundColor: '#d32f2f',
      color: 'white',
      fontWeight: 'bold',
      border: '3px solid white',
      boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
      zIndex: 1
    }}>
      <LocationOnIcon sx={{ fontSize: 24, color: 'white' }} />
      <div style={{
        position: 'absolute',
        width: '200px',
        top: '45px',
        left: '-80px',
        backgroundColor: 'white',
        color: '#333',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '13px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        textAlign: 'center',
        pointerEvents: 'none',
        fontWeight: 'normal'
      }}>
        {text}
      </div>
    </div>
  );
};

const LocationMap = function({ latitude, longitude, name, height = 300, zoom = 14 }) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get API key
  useEffect(function() {
    const getKey = async function() {
      try {
        const key = await Meteor.callAsync('pacio.getGoogleMapsApiKey');
        if (key) {
          console.log('Successfully retrieved Google Maps API key');
          setApiKey(key);
        } else {
          console.warn('Google Maps API key is empty');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error getting Maps API key:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    getKey();
  }, []);

  // Validate coordinates
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  if (isNaN(lat) || isNaN(lng)) {
    return (
      <Alert severity="info" sx={{ height }}>
        This location doesn't have valid coordinates.
      </Alert>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Box 
        sx={{ 
          height, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          borderRadius: 1
        }}
      >
        <CircularProgress size={30} />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert severity="error" sx={{ height }}>
        Error loading map: {error}
      </Alert>
    );
  }

  // Show placeholder if no API key
  if (!apiKey) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 1,
          bgcolor: 'action.hover'
        }}
      >
        <LocationOnIcon
          sx={{
            fontSize: 40,
            color: 'text.secondary',
            mb: 1
          }}
        />
        <Typography variant="caption" color="text.secondary">
          Map requires Google Maps API key
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: apiKey }}
        defaultCenter={{ lat, lng }}
        defaultZoom={zoom}
        options={{
          fullscreenControl: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false
        }}
      >
        <Marker
          lat={lat}
          lng={lng}
          text={name || "Facility Location"}
        />
      </GoogleMapReact>
    </Box>
  );
};

export default LocationMap;