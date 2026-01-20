// /imports/ui-fhir/locations/LocationDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Stack,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  Link,
  CircularProgress,
  Alert
} from '@mui/material';

import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { get, set } from 'lodash';
import moment from 'moment';
import GoogleMapReact from 'google-map-react';

import { Locations } from '/imports/lib/schemas/SimpleSchemas/Locations';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

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
  const navigate = useNavigate();
  const { id } = useParams();
  
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Google Maps state
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(null);

  // Set default values on component mount for new locations
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new locations
      setIsEditing(true);
    } else {
      // Viewing existing location - start in read-only mode
      setIsEditing(false);
    }
  }, [id]);

  // Load location if editing
  useEffect(function() {
    async function loadLocation() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('locations.get', id);
          if (result) {
            setLocation(result);
          }
        } catch (err) {
          console.error('Error loading location:', err);
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
        const key = await Meteor.callAsync('pacio.getGoogleMapsApiKey');
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

  // Handle field changes
  function handleChange(path, value) {
    const updatedLocation = { ...location };
    set(updatedLocation, path, value);
    setLocation(updatedLocation);
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
      
      const result = await Meteor.callAsync('geocodeAddress', address);
      
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
    console.log('=== handleSave called ===');
    console.log('Location data to save:', JSON.stringify(location, null, 2));
    console.log('Current user:', Meteor.userId());
    
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing location
        console.log('Updating existing location with id:', id);
        await Meteor.callAsync('locations.update', id, location);
        console.log('Location updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new location
        console.log('Creating new location...');
        const newId = await Meteor.callAsync('locations.create', location);
        console.log('Location created with ID:', newId);
        
        // Check if location was actually saved
        if (typeof Locations !== 'undefined') {
          const savedLocation = Locations.findOne({_id: newId});
          console.log('Verification - saved location:', savedLocation);
          console.log('Total locations in collection:', Locations.find().count());
        }
        
        // Navigate back to locations list for new locations
        navigate('/locations');
      }
    } catch (err) {
      console.error('Error saving location:', err);
      console.error('Error details:', err.error, err.reason, err.details);
      setError(err.message || err.reason || 'Failed to save location');
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this location?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('locations.remove', id);
        console.log('Location deleted successfully');
        navigate('/locations');
      } catch (err) {
        console.error('Error deleting location:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/locations');
  }

  const statusOptions = ['active', 'suspended', 'inactive'];
  const modeOptions = ['instance', 'kind'];

  return (
    <Container id="locationDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Location' : 'New Location'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}
          
          {/* System ID Barcode */}
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}
          
          <Stack spacing={3}>
            <TextField
              id="nameInput"
              fullWidth
              label="Name"
              value={get(location, 'name', '')}
              onChange={(e) => handleChange('name', e.target.value)}
              helperText="Name of the location"
              disabled={!isEditing}
            />
            
            <TextField
              id="identifierInput"
              fullWidth
              label="Identifier"
              value={get(location, 'identifier[0].value', '')}
              onChange={(e) => handleChange('identifier[0].value', e.target.value)}
              helperText="Unique identifier for the location"
              disabled={!isEditing}
            />
            
            <TextField
              id="descriptionTextarea"
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={get(location, 'description', '')}
              onChange={(e) => handleChange('description', e.target.value)}
              helperText="Description of the location"
              disabled={!isEditing}
            />
            
            <TextField
              id="emailInput"
              fullWidth
              label="Email"
              value={get(location, 'telecom[1].value', '')}
              onChange={(e) => {
                handleChange('telecom[1].system', 'email');
                handleChange('telecom[1].value', e.target.value);
              }}
              helperText="Contact email address"
              disabled={!isEditing}
            />
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Status</InputLabel>
              <Select
                id="statusSelect"
                value={get(location, 'status', 'active')}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                {statusOptions.map(status => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Operational Status</InputLabel>
              <Select
                id="operationalStatusSelect"
                value={get(location, 'operationalStatus.code', '')}
                onChange={(e) => handleChange('operationalStatus.code', e.target.value)}
                label="Operational Status"
              >
                <MenuItem value="operational">Operational</MenuItem>
                <MenuItem value="housekeeping">Housekeeping</MenuItem>
                <MenuItem value="overflow">Overflow</MenuItem>
                <MenuItem value="contaminated">Contaminated</MenuItem>
                <MenuItem value="decontamination">Decontamination</MenuItem>
                <MenuItem value="underway">Underway</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Mode</InputLabel>
              <Select
                value={get(location, 'mode', 'instance')}
                onChange={(e) => handleChange('mode', e.target.value)}
                label="Mode"
              >
                {modeOptions.map(mode => (
                  <MenuItem key={mode} value={mode}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              id="typeSelect"
              fullWidth
              label="Type Code"
              value={get(location, 'type.coding[0].code', '')}
              onChange={(e) => handleChange('type.coding[0].code', e.target.value)}
              helperText="Location type code (e.g., ER, ICU)"
              disabled={!isEditing}
            />
            
            <TextField
              id="typeDisplayInput"
              fullWidth
              label="Type Display"
              value={get(location, 'type.coding[0].display', '')}
              onChange={(e) => handleChange('type.coding[0].display', e.target.value)}
              helperText="Human-readable location type"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              label="Physical Type Code"
              value={get(location, 'physicalType.coding[0].code', '')}
              onChange={(e) => handleChange('physicalType.coding[0].code', e.target.value)}
              helperText="Physical type code (e.g., ro for room)"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              label="Physical Type Display"
              value={get(location, 'physicalType.coding[0].display', '')}
              onChange={(e) => handleChange('physicalType.coding[0].display', e.target.value)}
              helperText="Human-readable physical type"
              disabled={!isEditing}
            />
            
            <Typography variant="h6" sx={{ mt: 2 }}>Address</Typography>
            
            <TextField
              id="addressLineInput"
              fullWidth
              label="Address Line"
              value={get(location, 'address.line[0]', '')}
              onChange={(e) => handleChange('address.line[0]', e.target.value)}
              helperText="Street address"
              disabled={!isEditing}
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="cityInput"
                fullWidth
                label="City"
                value={get(location, 'address.city', '')}
                onChange={(e) => handleChange('address.city', e.target.value)}
                disabled={!isEditing}
              />
              
              <TextField
                id="stateInput"
                fullWidth
                label="State"
                value={get(location, 'address.state', '')}
                onChange={(e) => handleChange('address.state', e.target.value)}
                disabled={!isEditing}
              />
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="postalCodeInput"
                fullWidth
                label="Postal Code"
                value={get(location, 'address.postalCode', '')}
                onChange={(e) => handleChange('address.postalCode', e.target.value)}
                disabled={!isEditing}
              />
              
              <TextField
                id="countryInput"
                fullWidth
                label="Country"
                value={get(location, 'address.country', '')}
                onChange={(e) => handleChange('address.country', e.target.value)}
                disabled={!isEditing}
              />
            </Stack>
            
            <TextField
              id="phoneInput"
              fullWidth
              label="Phone"
              value={get(location, 'telecom[0].value', '')}
              onChange={(e) => handleChange('telecom[0].value', e.target.value)}
              helperText="Contact phone number"
              disabled={!isEditing}
            />
            
            <Typography variant="h6" sx={{ mt: 2 }}>Position</Typography>
            
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Latitude"
                value={get(location, 'position.latitude', '')}
                onChange={(e) => handleChange('position.latitude', parseFloat(e.target.value) || null)}
                type="number"
                disabled={!isEditing}
              />
              
              <TextField
                fullWidth
                label="Longitude"
                value={get(location, 'position.longitude', '')}
                onChange={(e) => handleChange('position.longitude', parseFloat(e.target.value) || null)}
                type="number"
                disabled={!isEditing}
              />
              
              <TextField
                fullWidth
                label="Altitude"
                value={get(location, 'position.altitude', '')}
                onChange={(e) => handleChange('position.altitude', parseFloat(e.target.value) || null)}
                type="number"
                disabled={!isEditing}
              />
            </Stack>
            
            {/* Add Geocode button when editing */}
            {isEditing && (
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
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
                    // Try geocoding with just city and state
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
                      const result = await Meteor.callAsync('geocodeAddress', simpleAddress);
                      
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
            
            {/* Google Maps Display */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Map</Typography>
              
              {(() => {
                const lat = get(location, 'position.latitude');
                const lng = get(location, 'position.longitude');
                const hasCoordinates = lat !== null && lat !== undefined && lat !== '' && 
                                      lng !== null && lng !== undefined && lng !== '';
                
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
                  // Fallback to static Mapbox image when no API key
                  return (
                    <Box 
                      sx={{ 
                        height: 300, 
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: 1
                      }}
                    >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `url("https://api.mapbox.com/styles/v1/mapbox/light-v10/static/${get(location, 'position.longitude')},${get(location, 'position.latitude')},14,0/400x240@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1
                      }}
                    >
                      <LocationOnIcon 
                        sx={{ 
                          fontSize: 40, 
                          color: 'error.main',
                          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                        }} 
                      />
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    >
                      <Typography variant="caption">
                        Map requires Google Maps API key
                      </Typography>
                    </Box>
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
            
            <Typography variant="h6" sx={{ mt: 2 }}>Organization</Typography>
            
            <TextField
              id="managingOrgInput"
              fullWidth
              label="Managing Organization"
              value={get(location, 'managingOrganization.display', '')}
              onChange={(e) => handleChange('managingOrganization.display', e.target.value)}
              helperText="Organization that manages this location"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              label="Part Of"
              value={get(location, 'partOf.display', '')}
              onChange={(e) => handleChange('partOf.display', e.target.value)}
              helperText="Another location this one is part of"
              disabled={!isEditing}
            />
            
            <Box sx={{ mt: 2 }}>
              <Link href="https://www.hl7.org/fhir/valueset-c80-facilitycodes.html" target="_blank" rel="noopener">
                Location Type Codes
              </Link>
              {' | '}
              <Link href="https://www.hl7.org/fhir/valueset-location-physical-type.html" target="_blank" rel="noopener">
                Physical Type Codes
              </Link>
            </Box>
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/locations')}
              >
                Back
              </Button>
              <Button 
                onClick={() => setIsEditing(true)}
                variant="contained"
                color="primary"
              >
                Edit
              </Button>
            </>
          ) : (
            // Edit mode buttons
            <>
              <Button 
                onClick={() => {
                  if (id && id !== 'new') {
                    // Cancel editing and reload original data
                    setIsEditing(false);
                    // Reload the location to discard changes
                    async function reloadLocation() {
                      try {
                        const result = await Meteor.callAsync('locations.get', id);
                        if (result) {
                          setLocation(result);
                        }
                      } catch (err) {
                        console.error('Error reloading location:', err);
                      }
                    }
                    reloadLocation();
                  } else {
                    // For new locations, go back
                    navigate('/locations');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              {id && id !== 'new' && (
                <Button 
                  onClick={handleDelete}
                  color="error"
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button 
                id="saveLocationButton"
                onClick={handleSave}
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default LocationDetail;