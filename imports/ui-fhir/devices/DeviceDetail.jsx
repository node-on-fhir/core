// /imports/ui-fhir/devices/DeviceDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
  Typography,
  Box,
  Stack
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';

import { Devices } from '/imports/lib/schemas/SimpleSchemas/Devices';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'active': 'success',
  'inactive': 'default',
  'entered-in-error': 'error',
  'unknown': 'warning'
};

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

function DeviceDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const isNewDevice = !id || id === 'new';
  const isExistingDevice = id && id !== 'new';

  // Get current user and patient from session
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  // Subscribe to devices
  const isSubscriptionReady = useTracker(function(){
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    if(autoPublishEnabled){
      return Meteor.subscribe('autopublish.Devices', {}, { limit: 1000 }).ready();
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
    console.log('[DeviceDetail] Opening patient search dialog...');
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

        {/* Lock / Unlock toggle — only for existing devices */}
        {!isNewDevice && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete — only for existing devices, gated on edit mode */}
        {!isNewDevice && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDelete}
              disabled={!isEditing}
              sx={{ color: isEditing ? 'error.main' : 'text.disabled' }}
            >
              <DeleteIcon />
              <Typography sx={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                borderWidth: 0
              }}>Delete</Typography>
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView() {
    return (
      <>
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

          <Stack direction="row" spacing={2}>
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
          </Stack>

          <Stack direction="row" spacing={2}>
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
          </Stack>

          <TextField
            id="versionInput"
            fullWidth
            label="Version"
            value={get(device, 'version[0].value', '')}
            onChange={(e) => handleChange('version[0].value', e.target.value)}
            disabled={!isEditing}
          />

          <Typography variant="h6">Type & Status</Typography>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Device Type</InputLabel>
              <Select
                id="typeSelect"
                value={get(device, 'type.coding[0].code', '')}
                onChange={(e) => {
                  const option = typeOptions.find(function(o) { return o.code === e.target.value; });
                  if (option) {
                    const isSimpleCode = ['monitoring', 'diagnostic', 'therapeutic', 'surgical'].includes(option.code);
                    const system = isSimpleCode ?
                      'http://hl7.org/fhir/device-category' :
                      'http://snomed.info/sct';

                    handleChange('type', {
                      coding: [{ system: system, code: option.code, display: option.display }],
                      text: option.display
                    });
                  }
                }}
                label="Device Type"
              >
                <MenuItem value="">
                  <em>Not specified</em>
                </MenuItem>
                {typeOptions.map(function(option) {
                  return (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Status</InputLabel>
              <Select
                id="statusSelect"
                value={get(device, 'status', 'active')}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                {statusOptions.map(function(option) {
                  return (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Stack>

          <TextField
            id="typeDisplayInput"
            fullWidth
            label="Type Display"
            value={get(device, 'type.coding[0].display', '')}
            onChange={(e) => handleChange('type.coding[0].display', e.target.value)}
            disabled={!isEditing}
          />

          <Typography variant="h6">Dates</Typography>

          <Stack direction="row" spacing={2}>
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
          </Stack>

          <Typography variant="h6">Patient Association</Typography>

          <TextField
            id="patientDisplay"
            fullWidth
            label="Patient"
            value={get(device, 'patient.display', '')}
            onChange={(e) => handleChange('patient.display', e.target.value)}
            disabled={!isEditing}
            helperText={get(device, 'patient.reference', '') || 'Patient reference will be assigned'}
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

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && (
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
    const deviceName = get(device, 'deviceName[0].name', 'Unnamed Device');
    const statusValue = get(device, 'status', 'unknown');
    const statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
    const statusColor = get(statusColorMap, statusValue, 'default');
    const typeDisplay = get(device, 'type.text', '') || get(device, 'type.coding[0].display', '');
    const typeCode = get(device, 'type.coding[0].code', '');
    const manufacturer = get(device, 'manufacturer', '');
    const modelNumber = get(device, 'modelNumber', '');
    const serialNumber = get(device, 'serialNumber', '');
    const lotNumber = get(device, 'lotNumber', '');
    const version = get(device, 'version[0].value', '');
    const manufactureDate = get(device, 'manufactureDate', '');
    const expirationDate = get(device, 'expirationDate', '');
    const patientDisplay = get(device, 'patient.display', '');
    const patientReference = get(device, 'patient.reference', '');
    const noteText = get(device, 'note[0].text', '');

    const formattedManufactureDate = manufactureDate ? moment(manufactureDate).format('MMMM D, YYYY') : '';
    const formattedExpirationDate = expirationDate ? moment(expirationDate).format('MMMM D, YYYY') : '';

    return (
      <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
        {/* Device name as title */}
        <Typography variant="h5" sx={{ fontWeight: 500, mb: 1 }}>
          {deviceName}
        </Typography>

        {typeDisplay && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            {typeDisplay}{typeCode ? ' (' + typeCode + ')' : ''}
          </Typography>
        )}

        <Divider />

        {/* Two-column metadata */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
          <Box>
            {manufacturer && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Manufacturer
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {manufacturer}
                </Typography>
              </>
            )}
            {modelNumber && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Model
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {modelNumber}
                </Typography>
              </>
            )}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="overline" color="text.secondary">
              Status
            </Typography>
            <Box sx={{ mb: 1 }}>
              <Chip label={statusLabel} color={statusColor} size="small" />
            </Box>
            {formattedManufactureDate && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Manufactured
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formattedManufactureDate}
                </Typography>
              </>
            )}
            {formattedExpirationDate && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Expires
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formattedExpirationDate}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Identifiers section */}
        {(serialNumber || lotNumber || version) && (
          <>
            <Box sx={{ py: 2 }}>
              <Stack direction="row" spacing={4}>
                {serialNumber && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Serial Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {serialNumber}
                    </Typography>
                  </Box>
                )}
                {lotNumber && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Lot Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {lotNumber}
                    </Typography>
                  </Box>
                )}
                {version && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Version
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {version}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
            <Divider />
          </>
        )}

        {/* Patient association */}
        {(patientDisplay || patientReference) && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {patientDisplay || 'Unspecified'}
              </Typography>
              {patientReference && (
                <Typography variant="caption" color="text.secondary">
                  {patientReference}
                </Typography>
              )}
            </Box>
            <Divider />
          </>
        )}

        {/* Notes */}
        <Box sx={{ py: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Notes
          </Typography>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
              minHeight: '100px'
            }}
          >
            {noteText || 'No notes provided.'}
          </Typography>
        </Box>

        <Divider />

        {/* Footer with device ID */}
        {isExistingDevice && (
          <Box sx={{ pt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Device ID: {id}
            </Typography>
          </Box>
        )}
      </Box>
    );
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
