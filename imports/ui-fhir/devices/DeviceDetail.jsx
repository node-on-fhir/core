// /imports/ui-fhir/devices/DeviceDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  IconButton,
  Tooltip,
  Typography,
  Box
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';

import { Devices } from '/imports/lib/schemas/SimpleSchemas/Devices';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import DeviceFormView from './DeviceFormView';
import DevicePreview from './DevicePreview';

function DeviceDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const [device, setDevice] = useState({
    resourceType: "Device",
    status: "active",
    deviceName: [{ name: "", type: "udi-label-name" }],
    manufacturer: "",
    modelNumber: "",
    serialNumber: "",
    type: {
      coding: [{ system: "http://snomed.info/sct", code: "", display: "" }],
      text: ""
    },
    lotNumber: "",
    manufactureDate: "",
    expirationDate: "",
    version: [{ value: "" }],
    patient: { reference: "", display: "" },
    note: [{ text: "" }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setDevice(function(prev) {
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

  const isNewDevice = !id || id === 'new';
  const isExistingDevice = id && id !== 'new';

  // Get current user and patient from session
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  // Subscribe to devices
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      return Meteor.subscribe('selectedPatient.Devices', Session.get('selectedPatientId'), { limit: 1000 }).ready();
    } else {
      return Meteor.subscribe('devices.all').ready();
    }
  }, []);

  // Load device data when subscription is ready
  useEffect(function() {
    if (id && id !== 'new' && isSubscriptionReady) {
      let existingDevice = Devices.findOne({ _id: id });

      // If not found by string _id, try ObjectID match via method
      if (!existingDevice) {
        async function loadViaMethod() {
          try {
            const result = await Meteor.callAsync('devices.findOne', id);
            if (result) {
              setDevice(result);
            }
          } catch (err) {
            console.error('[DeviceDetail] Error loading device via method:', err);
            setError(err.message);
          }
        }
        loadViaMethod();
      } else {
        setDevice(existingDevice);
      }

      setIsEditing(false);
    } else if (!id || id === 'new') {
      setIsEditing(true);

      // Set patient reference if we have a selected patient
      if (selectedPatient) {
        setDevice(function(prev) {
          return {
            ...prev,
            patient: {
              reference: 'Patient/' + get(selectedPatient, 'id', ''),
              display: (get(selectedPatient, 'name[0].given[0]', '') + ' ' + get(selectedPatient, 'name[0].family', '')).trim()
            }
          };
        });
      }
    }
  }, [id, isSubscriptionReady, selectedPatient]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedDevice = { ...device };
    set(updatedDevice, path, value);
    setDevice(updatedDevice);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedDevice);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingDevice) {
        await Meteor.callAsync('devices.update', id, device);
        console.log('[DeviceDetail] Device updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('devices.create', device);
        console.log('[DeviceDetail] Device created with ID:', newId);
        navigate('/devices');
      }
    } catch (err) {
      console.error('[DeviceDetail] Error saving device:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingDevice) {
      setIsEditing(false);
      setError(null);
      // Reload the device to discard changes
      const existingDevice = Devices.findOne({ _id: id });
      if (existingDevice) {
        setDevice(existingDevice);
      } else {
        // Fallback: reload via method for ObjectID records
        async function reloadDevice() {
          try {
            const result = await Meteor.callAsync('devices.findOne', id);
            if (result) {
              setDevice(result);
            }
          } catch (err) {
            console.error('[DeviceDetail] Error reloading device:', err);
          }
        }
        reloadDevice();
      }
    } else {
      navigate('/devices');
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingDevice) return;

    if (window.confirm('Are you sure you want to delete this device?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('devices.remove', id);
        console.log('[DeviceDetail] Device deleted successfully');
        navigate('/devices');
      } catch (err) {
        console.error('[DeviceDetail] Error deleting device:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle patient search
  function handleSearchUser() {
    console.log('[DeviceDetail] Opening patient search dialog...'); // phi-audit: ok
    // TODO: Implement patient search dialog
  }

  // Build the header title
  let headerTitle = 'New Device';
  if (isExistingDevice) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle — hidden for new devices */}
        {!isNewDevice && (
          <Tooltip title="Preview">
            <IconButton
              onClick={() => setSearchParams({ view: 'page' })}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle — hidden for new devices (always form) */}
        {!isNewDevice && (
          <Tooltip title="Form">
            <IconButton
              onClick={() => setSearchParams({ view: 'form' })}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Edit toggle — only for existing records */}
        {!isNewDevice && (
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
        {!isNewDevice && (
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
        <DeviceFormView
          resource={device}
          form={device}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
          onSearchPatient={handleSearchUser}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveDeviceButton"
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
    return <DevicePreview resource={device} form={device} resourceId={id} />;
  }

  
  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="deviceDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default DeviceDetail;
