// /imports/ui-fhir/locations/LocationDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Typography,
  Box,
  Tooltip
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { get, set } from 'lodash';
import GoogleMapReact from 'google-map-react';
import { ensureGoogleMapsScript } from '/imports/lib/GoogleMapsLoader';

import { Locations } from '/imports/lib/schemas/SimpleSchemas/Locations';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import LocationFormView from './LocationFormView';
import LocationPreview from './LocationPreview';

// Map marker component
const LocationMarker = function({ text }) {
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

function LocationDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewLocation = !id || id === 'new';
  const isExistingLocation = id && id !== 'new';

  // Get current user from session/tracker
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [location, setLocation] = useState({
    resourceType: "Location",
    name: "",
    status: "active",
    mode: "instance",
    type: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
        code: "",
        display: ""
      }]
    },
    telecom: [{
      system: "phone",
      value: "",
      use: "work"
    }],
    address: {
      use: "work",
      type: "both",
      line: [""],
      city: "",
      state: "",
      postalCode: "",
      country: ""
    },
    physicalType: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/location-physical-type",
        code: "",
        display: ""
      }]
    },
    position: {
      longitude: null,
      latitude: null,
      altitude: null
    },
    managingOrganization: {
      reference: "",
      display: ""
    },
    partOf: {
      reference: "",
      display: ""
    }
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setLocation(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded);

  // Google Maps state
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  // Tri-state: null = Maps script load in flight, true = usable, false = failed.
  // Gate <GoogleMapReact> on this — its internal loader retries forever and
  // throws unhandled rejections when the script is blocked (offline, CSP
  // without maps.googleapis.com).
  const [mapsReady, setMapsReady] = useState(null);

  // Set default values on component mount for new locations
  useEffect(function() {
    if (isNewLocation) {
      setIsEditing(true);
    }
  }, [id]);

  // Load location if editing
  useEffect(function() {
    async function loadLocation() {
      if (isExistingLocation) {
        setLoading(true);
        try {
          const result = await Meteor.rpc('locations.get', { locationId: id });
          if (result) {
            setLocation(result);
          }
        } catch (err) {
          console.error('[LocationDetail] Error loading location:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }

    loadLocation();
  }, [id]);

  // Fetch Google Maps API key
  useEffect(function() {
    async function fetchApiKey() {
      try {
        const key = await Meteor.rpc('pacio.getGoogleMapsApiKey');
        if (key) {
          console.log('Successfully retrieved Google Maps API key');
          setGoogleMapsApiKey(key);
        } else {
          console.warn('Google Maps API key is empty');
        }
        setMapLoading(false);
      } catch (err) {
        console.error('Error getting Maps API key:', err);
        setMapError(err.message);
        setMapLoading(false);
      }
    }

    fetchApiKey();
  }, []);

  // Probe-load the Maps script before letting GoogleMapReact near it
  useEffect(function() {
    if (!googleMapsApiKey) return undefined;

    let mounted = true;
    ensureGoogleMapsScript(googleMapsApiKey)
      .then(function() {
        if (mounted) setMapsReady(true);
      })
      .catch(function(err) {
        console.warn('[LocationDetail] Google Maps unavailable, rendering placeholder:', err.message);
        if (mounted) {
          setMapError(err.message);
          setMapsReady(false);
        }
      });

    return function() { mounted = false; };
  }, [googleMapsApiKey]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedLocation = { ...location };
    set(updatedLocation, path, value);
    setLocation(updatedLocation);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedLocation);
    }
  }

  // Geocode address to get coordinates
  async function geocodeAddress() {
    if (!isEditing) return;

    const address = [
      get(location, 'address.line[0]', ''),
      get(location, 'address.city', ''),
      get(location, 'address.state', ''),
      get(location, 'address.postalCode', ''),
      get(location, 'address.country', '')
    ].filter(Boolean).join(', ');

    if (!address.trim()) {
      console.log('No address to geocode');
      setError('Please enter an address before geocoding');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Geocoding address:', address);

      const result = await Meteor.rpc('geocoding.geocodeAddress', { address: address });

      if (result) {
        handleChange('position.latitude', result.latitude);
        handleChange('position.longitude', result.longitude);
        console.log('Successfully geocoded to:', result);
        setError(null);
      }
    } catch (err) {
      console.error('Error geocoding address:', err);
      if (err.error === 'no-results') {
        setError('No coordinates found for this address. Please check the address and try again.');
      } else if (err.error === 'no-api-key') {
        setError('Google Maps API key not configured on server. Please contact administrator.');
      } else if (err.error === 'api-key-restriction') {
        setError('API key configuration issue. Please contact administrator to set up geocoding.');
      } else {
        setError(err.reason || 'Failed to geocode address. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle save
  async function handleSave() {
    console.log('[LocationDetail] handleSave called');
    setLoading(true);
    setError(null);

    try {
      if (isExistingLocation) {
        await Meteor.rpc('locations.update', { locationId: id, locationData: location });
        console.log('[LocationDetail] Location updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.rpc('locations.create', location);
        console.log('[LocationDetail] Location created with ID:', newId);
        navigate('/locations');
      }
    } catch (err) {
      console.error('[LocationDetail] Error saving location:', err);
      setError(err.message || err.reason || 'Failed to save location');
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingLocation) return;

    if (window.confirm('Are you sure you want to delete this location?')) {
      setLoading(true);
      try {
        await Meteor.rpc('locations.remove', { locationId: id });
        console.log('[LocationDetail] Location deleted successfully');
        navigate('/locations');
      } catch (err) {
        console.error('[LocationDetail] Error deleting location:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingLocation) {
      setIsEditing(false);
      setError(null);
      async function reloadLocation() {
        try {
          const result = await Meteor.rpc('locations.get', { locationId: id });
          if (result) {
            setLocation(result);
          }
        } catch (err) {
          console.error('[LocationDetail] Error reloading location:', err);
        }
      }
      reloadLocation();
    } else {
      navigate('/locations');
    }
  }

  // Build the header title
  let headerTitle = 'New Location';
  if (isExistingLocation) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Render Google Maps section (stays in Detail, not in FormView)
  function renderMapSection() {
    const lat = get(location, 'position.latitude');
    const lng = get(location, 'position.longitude');
    const hasCoordinates = lat !== null && lat !== undefined && lat !== '' &&
                          lng !== null && lng !== undefined && lng !== '';

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Map</Typography>

        {/* Geocode buttons when editing */}
        {isEditing && (
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              onClick={geocodeAddress}
              disabled={loading}
            >
              Geocode Full Address
            </Button>
            <Button
              variant="outlined"
              onClick={async () => {
                const simpleAddress = [
                  get(location, 'address.city', ''),
                  get(location, 'address.state', '')
                ].filter(Boolean).join(', ');

                if (!simpleAddress.trim()) {
                  setError('Please enter at least city and state');
                  return;
                }

                setLoading(true);
                setError(null);

                try {
                  const result = await Meteor.rpc('geocoding.geocodeAddress', { address: simpleAddress });

                  if (result) {
                    handleChange('position.latitude', result.latitude);
                    handleChange('position.longitude', result.longitude);
                    console.log('Successfully geocoded city/state to:', result);
                  }
                } catch (err) {
                  if (err.error === 'no-results') {
                    setError('Could not find coordinates for city/state');
                  } else {
                    setError('Geocoding failed');
                  }
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              Geocode City/State Only
            </Button>
          </Stack>
        )}

        {(() => {
          if (!hasCoordinates) {
            return (
              <Alert severity="info">
                Enter latitude and longitude coordinates or use the "Geocode Address" button to display a map.
              </Alert>
            );
          }

          if (mapLoading) {
            return (
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: 1
                }}
              >
                <CircularProgress />
              </Box>
            );
          }

          if (mapError) {
            return <Alert severity="error">Error loading map: {mapError}</Alert>;
          }

          if (!googleMapsApiKey) {
            return (
              <Box
                sx={{
                  height: 300,
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

          // Maps script still loading — don't mount GoogleMapReact yet
          if (mapsReady !== true) {
            return (
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 1,
                  bgcolor: 'action.hover'
                }}
              >
                <CircularProgress size={30} />
              </Box>
            );
          }

          // Google Maps with API key
          return (
            <Box sx={{ height: 300, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
              <GoogleMapReact
                bootstrapURLKeys={{ key: googleMapsApiKey }}
                defaultCenter={{
                  lat: parseFloat(lat),
                  lng: parseFloat(lng)
                }}
                center={{
                  lat: parseFloat(lat),
                  lng: parseFloat(lng)
                }}
                defaultZoom={14}
                options={{
                  fullscreenControl: false,
                  zoomControl: true,
                  mapTypeControl: false,
                  scaleControl: false,
                  streetViewControl: false,
                  rotateControl: false
                }}
              >
                <LocationMarker
                  lat={parseFloat(lat)}
                  lng={parseFloat(lng)}
                  text={get(location, 'name', 'Location')}
                />
              </GoogleMapReact>
            </Box>
          );
        })()}
      </Box>
    );
  }

  // Header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle - hidden for new locations */}
        {!isNewLocation && (
          <Tooltip title="Preview">
            <IconButton
              onClick={() => setSearchParams({ view: 'page' })}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Preview"
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle - hidden for new locations */}
        {!isNewLocation && (
          <Tooltip title="Form">
            <IconButton
              onClick={() => setSearchParams({ view: 'form' })}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Form"
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle */}
        {!isNewLocation && (
          <Button
              id="editButton"
              onClick={function() { setIsEditing(!isEditing); }}
              variant="outlined"
              size="small"
              startIcon={isEditing ? <LockOpenIcon /> : <LockIcon />}
            >
              {isEditing ? 'Editing' : 'Edit'}
            </Button>
        )}

        {/* Delete — only for existing records */}
        {!isNewLocation && (
          <Button
              id="deleteButton"
              onClick={handleDelete}
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView() {
    return (
      <>
        <LocationFormView
          resource={location}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* Google Maps section - kept in Detail, rendered after form fields */}
        {renderMapSection()}

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveLocationButton"
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView() {
    return (
      <>
        <LocationPreview
          resource={location}
          resourceId={isExistingLocation ? id : null}
          embedded={isEmbedded}
        />

        {/* Show map in preview mode too */}
        {renderMapSection()}
      </>
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="locationDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          {viewMode === 'form' && renderFormView()}
          {viewMode === 'page' && renderPreviewView()}
        </CardContent>
      </Card>
    </Container>
  );
}

export default LocationDetail;
