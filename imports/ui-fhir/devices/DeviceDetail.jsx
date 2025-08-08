// /imports/ui-fhir/devices/DeviceDetail.jsx

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
  FormControlLabel,
  Switch,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';

import { Devices } from '/imports/lib/schemas/SimpleSchemas/Devices';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function DeviceDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Get current user and patient from session
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [device, setDevice] = useState({
    resourceType: "Device",
    status: "active",
    deviceName: [{
      name: "",
      type: "udi-label-name"
    }],
    manufacturer: "",
    modelNumber: "",
    serialNumber: "",
    type: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    lotNumber: "",
    manufactureDate: "",
    expirationDate: "",
    version: [{
      value: ""
    }],
    patient: {
      reference: "",
      display: ""
    },
    note: [{
      text: ""
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set default values on component mount for new devices
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new devices
      setIsEditing(true);
      
      // Set patient reference if we have a selected patient
      if (selectedPatient) {
        setDevice(prev => ({
          ...prev,
          patient: {
            reference: `Patient/${get(selectedPatient, 'id', '')}`,
            display: `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`
          }
        }));
      }
    } else {
      // Viewing existing device - start in read-only mode
      setIsEditing(false);
    }
  }, [id, selectedPatient]);

  // Load device if editing
  useEffect(function() {
    async function loadDevice() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('devices.findOne', id);
          if (result) {
            setDevice(result);
          }
        } catch (err) {
          console.error('Error loading device:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadDevice();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    console.log('handleChange called with path:', path, 'value:', value);
    const updatedDevice = { ...device };
    set(updatedDevice, path, value);
    setDevice(updatedDevice);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing device
        await Meteor.callAsync('devices.update', id, device);
        console.log('Device updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new device
        console.log('Creating device with data:', JSON.stringify(device, null, 2));
        const newId = await Meteor.callAsync('devices.create', device);
        console.log('Device created with ID:', newId);
        // Navigate back to devices list for new devices
        navigate('/devices');
      }
    } catch (err) {
      console.error('Error saving device:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this device?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('devices.remove', id);
        console.log('Device deleted successfully');
        navigate('/devices');
      } catch (err) {
        console.error('Error deleting device:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/devices');
  }

  // Handle patient search
  function handleSearchUser() {
    console.log('Opening patient search dialog...');
    // TODO: Implement patient search dialog
  }

  const statusOptions = [
    { value: 'active', display: 'Active' },
    { value: 'inactive', display: 'Inactive' },
    { value: 'entered-in-error', display: 'Entered in Error' },
    { value: 'unknown', display: 'Unknown' }
  ];

  const typeOptions = [
    { code: 'monitoring', display: 'Monitoring Equipment' },
    { code: 'diagnostic', display: 'Diagnostic Equipment' },
    { code: 'therapeutic', display: 'Therapeutic Equipment' },
    { code: 'surgical', display: 'Surgical Equipment' },
    { code: '86184003', display: 'Electrocardiograph' },
    { code: '38017009', display: 'Blood pressure monitor' },
    { code: '448703006', display: 'Pulse oximeter' },
    { code: '33894003', display: 'Glucose meter' },
    { code: '19892000', display: 'Scale' },
    { code: '32033000', display: 'Thermometer' },
    { code: '336602003', display: 'Oxygen concentrator' },
    { code: '706767009', display: 'Patient data recorder' },
    { code: '303473007', display: 'Wheelchair' },
    { code: '360055006', display: 'Walker' }
  ];

  return (
    <Container id="deviceDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Device' : 'New Device'}
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
              <span id="deviceBarcode" className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}
          
          <Stack spacing={3}>
            <Typography variant="h6">Device Information</Typography>
            
            <TextField
              id="deviceNameInput"
              fullWidth
              label="Device Name"
              value={get(device, 'deviceName[0].name', '')}
              onChange={(e) => handleChange('deviceName[0].name', e.target.value)}
              required
              disabled={!isEditing}
            />
            
            <TextField
              id="manufacturerInput"
              fullWidth
              label="Manufacturer"
              value={get(device, 'manufacturer', '')}
              onChange={(e) => handleChange('manufacturer', e.target.value)}
              disabled={!isEditing}
            />
            
            <TextField
              id="modelNumberInput"
              fullWidth
              label="Model Number"
              value={get(device, 'modelNumber', '')}
              onChange={(e) => handleChange('modelNumber', e.target.value)}
              disabled={!isEditing}
            />
            
            <TextField
              id="serialNumberInput"
              fullWidth
              label="Serial Number"
              value={get(device, 'serialNumber', '')}
              onChange={(e) => handleChange('serialNumber', e.target.value)}
              disabled={!isEditing}
            />
            
            <TextField
              id="lotNumberInput"
              fullWidth
              label="Lot Number"
              value={get(device, 'lotNumber', '')}
              onChange={(e) => handleChange('lotNumber', e.target.value)}
              disabled={!isEditing}
            />
            
            <TextField
              id="versionInput"
              fullWidth
              label="Version"
              value={get(device, 'version[0].value', '')}
              onChange={(e) => handleChange('version[0].value', e.target.value)}
              disabled={!isEditing}
            />
            
            <Typography variant="h6">Type & Status</Typography>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Device Type</InputLabel>
              <Select
                id="typeSelect"
                value={get(device, 'type.coding[0].code', '')}
                onChange={(e) => {
                  const option = typeOptions.find(o => o.code === e.target.value);
                  if (option) {
                    // Use different system URLs for simple vs SNOMED codes
                    const isSimpleCode = ['monitoring', 'diagnostic', 'therapeutic', 'surgical'].includes(option.code);
                    const system = isSimpleCode ? 
                      'http://hl7.org/fhir/device-category' : 
                      'http://snomed.info/sct';
                    
                    // Update the entire type object at once
                    handleChange('type', {
                      coding: [{
                        system: system,
                        code: option.code,
                        display: option.display
                      }],
                      text: option.display
                    });
                  }
                }}
                label="Device Type"
              >
                <MenuItem value="">
                  <em>Not specified</em>
                </MenuItem>
                {typeOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              id="typeDisplayInput"
              fullWidth
              label="Type Display"
              value={get(device, 'type.coding[0].display', '')}
              onChange={(e) => handleChange('type.coding[0].display', e.target.value)}
              disabled={!isEditing}
            />
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Status</InputLabel>
              <Select
                id="statusSelect"
                value={get(device, 'status', 'active')}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Typography variant="h6">Dates</Typography>
            
            <TextField
              id="manufactureDateInput"
              fullWidth
              type="date"
              label="Manufacture Date"
              value={get(device, 'manufactureDate', '')}
              onChange={(e) => handleChange('manufactureDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <TextField
              id="expirationDateInput"
              fullWidth
              type="date"
              label="Expiration Date"
              value={get(device, 'expirationDate', '')}
              onChange={(e) => handleChange('expirationDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <Typography variant="h6">Patient Association</Typography>
            
            <TextField
              id="patientDisplay"
              fullWidth
              label="Patient"
              value={get(device, 'patient.display', '')}
              onChange={(e) => handleChange('patient.display', e.target.value)}
              disabled={!isEditing}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Search for patient">
                      <IconButton
                        onClick={handleSearchUser}
                        edge="end"
                        disabled={!isEditing}
                      >
                        <SearchIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
            
            <Typography variant="h6">Notes</Typography>
            
            <TextField
              id="notesTextarea"
              fullWidth
              multiline
              rows={4}
              label="Notes"
              value={get(device, 'note[0].text', '')}
              onChange={(e) => handleChange('note[0].text', e.target.value)}
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/devices')}
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
                    // Reload the device to discard changes
                    async function reloadDevice() {
                      try {
                        const result = await Meteor.callAsync('devices.findOne', id);
                        if (result) {
                          setDevice(result);
                        }
                      } catch (err) {
                        console.error('Error reloading device:', err);
                      }
                    }
                    reloadDevice();
                  } else {
                    // For new devices, go back
                    navigate('/devices');
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
                id="saveDeviceButton"
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

export default DeviceDetail;