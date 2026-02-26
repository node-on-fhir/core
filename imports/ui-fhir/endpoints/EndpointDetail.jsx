// /imports/ui-fhir/endpoints/EndpointDetail.jsx

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
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';

import { Endpoints } from '/imports/lib/schemas/SimpleSchemas/Endpoints';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function EndpointDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  // Get current user from session/tracker
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to endpoint data using ID-based query (optimized)
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    if (id && id !== 'new') {
      const query = {
        $or: [
          {'_id': id},
          {'id': id}
        ]
      };
      console.log('[EndpointDetail] Subscribing with ID query:', query);
      const handle = Meteor.subscribe('autopublish.Endpoints', {}, {});
      return handle.ready();
    }
    return true;
  }, [id]);

  // Initialize state with proper FHIR R4 structure
  const [endpoint, setEndpoint] = useState({
    resourceType: "Endpoint",
    status: "active",
    name: "",
    address: "",
    connectionType: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/endpoint-connection-type",
        code: "",
        display: ""
      }]
    }],
    payloadType: [{
      coding: [{
        system: "http://hl7.org/fhir/ValueSet/endpoint-payload-type",
        code: "",
        display: ""
      }],
      text: ""
    }],
    payloadMimeType: ["application/fhir+json"],
    managingOrganization: {
      reference: "",
      display: ""
    },
    period: {
      start: "",
      end: ""
    },
    header: []
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setEndpoint(function(prev) {
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

  // Set default values on component mount for new endpoints
  useEffect(function() {
    if (!id || id === 'new') {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [id]);

  // Load endpoint from collection
  useEffect(function() {
    if (id && id !== 'new') {
      console.log('[EndpointDetail] Loading endpoint from collection');
      const existingEndpoint = Endpoints.findOne({_id: id}) || Endpoints.findOne({id: id});

      if (existingEndpoint) {
        console.log('[EndpointDetail] Loaded endpoint:', {
          _id: existingEndpoint._id,
          name: get(existingEndpoint, 'name'),
          address: get(existingEndpoint, 'address'),
          status: get(existingEndpoint, 'status')
        });
        setEndpoint(existingEndpoint);
        setIsEditing(false);
      } else {
        console.warn('[EndpointDetail] Endpoint not found in collection:', id);
        setError('Endpoint not found');
      }
    }
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedEndpoint = { ...endpoint };
    set(updatedEndpoint, path, value);
    setEndpoint(updatedEndpoint);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedEndpoint);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    console.log('[EndpointDetail] Saving endpoint:', {
      name: get(endpoint, 'name'),
      address: get(endpoint, 'address'),
      status: get(endpoint, 'status'),
      fullEndpoint: endpoint
    });

    try {
      if (id && id !== 'new') {
        await Meteor.callAsync('endpoints.update', id, endpoint);
        console.log('Endpoint updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('endpoints.create', endpoint);
        console.log('Endpoint created with ID:', newId);
        navigate('/endpoints');
      }
    } catch (err) {
      console.error('Error saving endpoint:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;

    if (window.confirm('Are you sure you want to delete this endpoint?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('endpoints.remove', id);
        console.log('Endpoint deleted successfully');
        navigate('/endpoints');
      } catch (err) {
        console.error('Error deleting endpoint:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/endpoints');
  }

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'error', label: 'Error' },
    { value: 'off', label: 'Off' },
    { value: 'entered-in-error', label: 'Entered in Error' }
  ];

  const connectionTypeOptions = [
    { value: 'hl7-fhir-rest', label: 'HL7 FHIR REST' },
    { value: 'hl7-fhir-msg', label: 'HL7 FHIR Messaging' },
    { value: 'hl7v2-mllp', label: 'HL7v2 MLLP' },
    { value: 'secure-email', label: 'Secure Email' },
    { value: 'direct-project', label: 'Direct Project' },
    { value: 'cds-hooks-service', label: 'CDS Hooks Service' },
    { value: 'ihe-xcpd', label: 'IHE XCPD' },
    { value: 'ihe-xca', label: 'IHE XCA' },
    { value: 'ihe-xdr', label: 'IHE XDR' },
    { value: 'ihe-xds', label: 'IHE XDS' },
    { value: 'dicom-wado-rs', label: 'DICOM WADO-RS' },
    { value: 'dicom-qido-rs', label: 'DICOM QIDO-RS' },
    { value: 'dicom-stow-rs', label: 'DICOM STOW-RS' }
  ];

  if (isEmbedded) {
    return (
      <Stack spacing={3}>
        <TextField
          id="nameInput"
          fullWidth
          label="Endpoint Name"
          value={get(endpoint, 'name', '')}
          onChange={(e) => handleChange('name', e.target.value)}
          helperText="A friendly name for this endpoint"
          disabled={!isEditing}
        />

        <TextField
          id="addressInput"
          fullWidth
          label="Address (URL)"
          value={get(endpoint, 'address', '')}
          onChange={(e) => handleChange('address', e.target.value)}
          helperText="The URL for connecting to this endpoint"
          disabled={!isEditing}
        />

        <Stack direction="row" spacing={2}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Status</InputLabel>
            <Select
              id="statusSelect"
              value={get(endpoint, 'status', 'active')}
              onChange={(e) => handleChange('status', e.target.value)}
              label="Status"
            >
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Connection Type</InputLabel>
            <Select
              id="connectionTypeSelect"
              value={get(endpoint, 'connectionType[0].coding[0].code', '')}
              onChange={(e) => {
                const selectedOption = connectionTypeOptions.find(opt => opt.value === e.target.value);
                handleChange('connectionType[0].coding[0].code', e.target.value);
                handleChange('connectionType[0].coding[0].display', selectedOption?.label || e.target.value);
              }}
              label="Connection Type"
            >
              {connectionTypeOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Typography variant="h6" sx={{ mt: 2 }}>Managing Organization</Typography>

        <Stack direction="row" spacing={2}>
          <TextField
            id="managingOrganizationDisplay"
            fullWidth
            label="Organization Name"
            value={get(endpoint, 'managingOrganization.display', '')}
            onChange={(e) => handleChange('managingOrganization.display', e.target.value)}
            helperText="Name of the organization managing this endpoint"
            disabled={!isEditing}
          />

          <TextField
            id="managingOrganizationReference"
            fullWidth
            label="Organization Reference"
            value={get(endpoint, 'managingOrganization.reference', '')}
            onChange={(e) => handleChange('managingOrganization.reference', e.target.value)}
            helperText="e.g., Organization/123"
            disabled={!isEditing}
          />
        </Stack>

        <Typography variant="h6" sx={{ mt: 2 }}>Payload Configuration</Typography>

        <Stack direction="row" spacing={2}>
          <TextField
            id="payloadTypeText"
            fullWidth
            label="Payload Type"
            value={get(endpoint, 'payloadType[0].text', '')}
            onChange={(e) => handleChange('payloadType[0].text', e.target.value)}
            helperText="Type of content this endpoint accepts"
            disabled={!isEditing}
          />

          <TextField
            id="payloadMimeType"
            fullWidth
            label="MIME Type"
            value={get(endpoint, 'payloadMimeType[0]', 'application/fhir+json')}
            onChange={(e) => handleChange('payloadMimeType[0]', e.target.value)}
            helperText="e.g., application/fhir+json"
            disabled={!isEditing}
          />
        </Stack>

        <Typography variant="h6" sx={{ mt: 2 }}>Validity Period</Typography>

        <Stack direction="row" spacing={2}>
          <TextField
            id="periodStart"
            fullWidth
            type="date"
            label="Start Date"
            value={get(endpoint, 'period.start', '') ? moment(get(endpoint, 'period.start')).format('YYYY-MM-DD') : ''}
            onChange={(e) => handleChange('period.start', e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />

          <TextField
            id="periodEnd"
            fullWidth
            type="date"
            label="End Date"
            value={get(endpoint, 'period.end', '') ? moment(get(endpoint, 'period.end')).format('YYYY-MM-DD') : ''}
            onChange={(e) => handleChange('period.end', e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Stack>

        <Typography variant="h6" sx={{ mt: 2 }}>Headers</Typography>

        <TextField
          id="headersInput"
          fullWidth
          multiline
          rows={3}
          label="Custom Headers"
          value={get(endpoint, 'header', []).join('\n')}
          onChange={(e) => handleChange('header', e.target.value.split('\n').filter(h => h.trim()))}
          helperText="One header per line (e.g., Authorization: Bearer token)"
          disabled={!isEditing}
        />
      </Stack>
    );
  }

  return (
    <Container id="endpointDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Edit Endpoint' : 'New Endpoint'}
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
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>
                {get(endpoint, '_id') || id}
              </span>
            </Box>
          )}

          <Stack spacing={3}>
            <TextField
              id="nameInput"
              fullWidth
              label="Endpoint Name"
              value={get(endpoint, 'name', '')}
              onChange={(e) => handleChange('name', e.target.value)}
              helperText="A friendly name for this endpoint"
              disabled={!isEditing}
            />

            <TextField
              id="addressInput"
              fullWidth
              label="Address (URL)"
              value={get(endpoint, 'address', '')}
              onChange={(e) => handleChange('address', e.target.value)}
              helperText="The URL for connecting to this endpoint"
              disabled={!isEditing}
            />

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Status</InputLabel>
                <Select
                  id="statusSelect"
                  value={get(endpoint, 'status', 'active')}
                  onChange={(e) => handleChange('status', e.target.value)}
                  label="Status"
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Connection Type</InputLabel>
                <Select
                  id="connectionTypeSelect"
                  value={get(endpoint, 'connectionType[0].coding[0].code', '')}
                  onChange={(e) => {
                    const selectedOption = connectionTypeOptions.find(opt => opt.value === e.target.value);
                    handleChange('connectionType[0].coding[0].code', e.target.value);
                    handleChange('connectionType[0].coding[0].display', selectedOption?.label || e.target.value);
                  }}
                  label="Connection Type"
                >
                  {connectionTypeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Typography variant="h6" sx={{ mt: 2 }}>Managing Organization</Typography>

            <Stack direction="row" spacing={2}>
              <TextField
                id="managingOrganizationDisplay"
                fullWidth
                label="Organization Name"
                value={get(endpoint, 'managingOrganization.display', '')}
                onChange={(e) => handleChange('managingOrganization.display', e.target.value)}
                helperText="Name of the organization managing this endpoint"
                disabled={!isEditing}
              />

              <TextField
                id="managingOrganizationReference"
                fullWidth
                label="Organization Reference"
                value={get(endpoint, 'managingOrganization.reference', '')}
                onChange={(e) => handleChange('managingOrganization.reference', e.target.value)}
                helperText="e.g., Organization/123"
                disabled={!isEditing}
              />
            </Stack>

            <Typography variant="h6" sx={{ mt: 2 }}>Payload Configuration</Typography>

            <Stack direction="row" spacing={2}>
              <TextField
                id="payloadTypeText"
                fullWidth
                label="Payload Type"
                value={get(endpoint, 'payloadType[0].text', '')}
                onChange={(e) => handleChange('payloadType[0].text', e.target.value)}
                helperText="Type of content this endpoint accepts"
                disabled={!isEditing}
              />

              <TextField
                id="payloadMimeType"
                fullWidth
                label="MIME Type"
                value={get(endpoint, 'payloadMimeType[0]', 'application/fhir+json')}
                onChange={(e) => handleChange('payloadMimeType[0]', e.target.value)}
                helperText="e.g., application/fhir+json"
                disabled={!isEditing}
              />
            </Stack>

            <Typography variant="h6" sx={{ mt: 2 }}>Validity Period</Typography>

            <Stack direction="row" spacing={2}>
              <TextField
                id="periodStart"
                fullWidth
                type="date"
                label="Start Date"
                value={get(endpoint, 'period.start', '') ? moment(get(endpoint, 'period.start')).format('YYYY-MM-DD') : ''}
                onChange={(e) => handleChange('period.start', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />

              <TextField
                id="periodEnd"
                fullWidth
                type="date"
                label="End Date"
                value={get(endpoint, 'period.end', '') ? moment(get(endpoint, 'period.end')).format('YYYY-MM-DD') : ''}
                onChange={(e) => handleChange('period.end', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Stack>

            <Typography variant="h6" sx={{ mt: 2 }}>Headers</Typography>

            <TextField
              id="headersInput"
              fullWidth
              multiline
              rows={3}
              label="Custom Headers"
              value={get(endpoint, 'header', []).join('\n')}
              onChange={(e) => handleChange('header', e.target.value.split('\n').filter(h => h.trim()))}
              helperText="One header per line (e.g., Authorization: Bearer token)"
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            <>
              <Button
                onClick={() => navigate('/endpoints')}
              >
                Back
              </Button>
              <Button
                id="deleteEndpointButton"
                onClick={handleDelete}
                color="error"
                disabled={loading}
              >
                Delete
              </Button>
              <Button
                id="editEndpointButton"
                onClick={() => setIsEditing(true)}
                variant="contained"
                color="primary"
              >
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  if (id && id !== 'new') {
                    setIsEditing(false);
                    const existingEndpoint = Endpoints.findOne({_id: id});
                    if (existingEndpoint) {
                      setEndpoint(existingEndpoint);
                    }
                  } else {
                    navigate('/endpoints');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                id="saveEndpointButton"
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

export default EndpointDetail;
