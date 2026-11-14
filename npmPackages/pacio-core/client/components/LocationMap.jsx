// /packages/pacio-core/client/components/LocationMap.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { Meteor } from 'meteor/meteor';
import GoogleMapReact from 'google-map-react';
import { get } from 'lodash';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { ensureGoogleMapsScript } from '/imports/lib/GoogleMapsLoader';
import MapGuard from '/imports/ui/guards/MapGuard.jsx';

// Google Maps "night mode" styling (https://developers.google.com/maps/documentation/javascript/examples/style-array)
const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
];

const Marker = function({ text, isDark }) {
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
        backgroundColor: isDark ? '#2a2a2a' : 'white',
        color: isDark ? 'rgba(255, 255, 255, 0.87)' : '#333',
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

// LocationMapInner renders the actual map once a key has been resolved by
// MapGuard. It manages its own mapsReady probe so GoogleMapReact is never
// mounted before the script is confirmed loadable.
const LocationMapInner = function({ apiKey, latitude, longitude, name, height, zoom, isDark }) {
  // Tri-state: null = script load in flight, true = usable, false = failed.
  // Mounting <GoogleMapReact> before the Maps script is known-loadable lets
  // its internal loader retry forever and throw unhandled rejections when
  // the script is blocked (offline, CSP without maps.googleapis.com).
  const [mapsReady, setMapsReady] = useState(null);
  const [mapsError, setMapsError] = useState(null);

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  useEffect(function() {
    var mounted = true;
    setMapsReady(null);
    ensureGoogleMapsScript(apiKey)
      .then(function() {
        if (mounted) setMapsReady(true);
      })
      .catch(function(err) {
        console.warn('[LocationMap] Google Maps unavailable, rendering placeholder:', err.message);
        if (mounted) {
          setMapsError(err.message);
          setMapsReady(false);
        }
      });
    return function() { mounted = false; };
  }, [apiKey]);

  if (mapsReady === null) {
    return (
      <Box sx={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 1 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (mapsReady === false) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 1,
          bgcolor: 'action.hover',
          px: 2,
          textAlign: 'center'
        }}
      >
        <LocationOnIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" color="text.primary">
          {name || 'Facility Location'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Map unavailable: {mapsError}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
      <GoogleMapReact
        key={isDark ? 'dark' : 'light'}
        bootstrapURLKeys={{ key: apiKey }}
        defaultCenter={{ lat, lng }}
        defaultZoom={zoom}
        options={{
          fullscreenControl: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          styles: isDark ? darkMapStyles : undefined
        }}
      >
        <Marker
          lat={lat}
          lng={lng}
          text={name || 'Facility Location'}
          isDark={isDark}
        />
      </GoogleMapReact>
    </Box>
  );
};

const LocationMap = function({ latitude, longitude, name, height = 300, zoom = 14 }) {
  const appTheme = Meteor.useTheme ? Meteor.useTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Validate coordinates before attempting to render any map.
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    return (
      <Alert severity="info" sx={{ height }}>
        This location doesn't have valid coordinates.
      </Alert>
    );
  }

  // MapGuard variant="card" with no fallback: when no key resolves the
  // component returns null, so the parent layout (Paper/Card) reflows
  // naturally without empty chrome. The wrap point is the component root —
  // all three consumers (ExamRoomPage, MainPage, NursingHomeDashboard) render
  // LocationMap inside a Paper alongside a Typography header; keeping the
  // guard here lets each parent decide its own empty-state chrome.
  return (
    <MapGuard variant="card">
      {function(resolvedKey) {
        return (
          <LocationMapInner
            apiKey={resolvedKey}
            latitude={latitude}
            longitude={longitude}
            name={name}
            height={height}
            zoom={zoom}
            isDark={isDark}
          />
        );
      }}
    </MapGuard>
  );
};

export default LocationMap;