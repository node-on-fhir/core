// /imports/ui-fhir/medicationRequests/MedicationRequestDetail.jsx

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

import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';

import { MedicationRequests } from '/imports/lib/schemas/SimpleSchemas/MedicationRequests';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function MedicationRequestDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  
  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);
  
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [medicationRequest, setMedicationRequest] = useState({
    resourceType: "MedicationRequest",
    status: "active",
    intent: "order",
    subject: {
      reference: "",
      display: ""
    },
    authoredOn: moment().format('YYYY-MM-DD'),
    requester: {
      reference: "",
      display: ""
    },
    medicationCodeableConcept: {
      coding: [{
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        code: "",
        display: ""
      }],
      text: ""
    },
    priority: "routine",
    dosageInstruction: [{
      text: "",
      timing: {
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: "d"
        }
      },
      route: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }]
      },
      doseAndRate: [{
        doseQuantity: {
          value: null,
          unit: "",
          system: "http://unitsofmeasure.org",
          code: ""
        }
      }]
    }],
    dispenseRequest: {
      validityPeriod: {
        start: moment().format('YYYY-MM-DD'),
        end: moment().add(30, 'days').format('YYYY-MM-DD')
      },
      quantity: {
        value: null,
        unit: ""
      }
    }
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setMedicationRequest(function(prev) {
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

  // Set patient name and requester on component mount for new requests
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new requests
      setIsEditing(true);
      
      // For new requests, set the patient name
      let patientName = '';
      let patientReference = '';
      
      if (selectedPatient) {
        // Prefer selected patient
        patientName = get(selectedPatient, 'name[0].text', '') || 
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        patientReference = `Patient/${get(selectedPatient, '_id', '')}`;
      } else if (currentUser) {
        // Fall back to current user
        patientName = get(currentUser, 'profile.name.text', '') ||
                     `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                     get(currentUser, 'username', '');
        // You might need to look up the Patient resource for the current user
        patientReference = `Patient/${get(currentUser, 'profile.patientId', '')}`;
      }
      
      // Set requester to current user
      let requesterName = '';
      let requesterReference = '';
      
      if (currentUser) {
        requesterName = get(currentUser, 'profile.name.text', '') ||
                       `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                       get(currentUser, 'username', '');
        requesterReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }
      
      setMedicationRequest(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        requester: {
          reference: requesterReference,
          display: requesterName
        }
      }));
    } else {
      // Viewing existing request - start in read-only mode
      setIsEditing(false);
    }
  }, [id, selectedPatient, currentUser]);

  // Load medication request if editing
  useEffect(function() {
    async function loadMedicationRequest() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('medicationRequests.get', id);
          if (result) {
            setMedicationRequest(result);
          }
        } catch (err) {
          console.error('Error loading medication request:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadMedicationRequest();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedMedicationRequest = { ...medicationRequest };
    set(updatedMedicationRequest, path, value);
    setMedicationRequest(updatedMedicationRequest);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedMedicationRequest);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing medication request
        await Meteor.callAsync('medicationRequests.update', id, medicationRequest);
        console.log('Medication request updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new medication request
        const newId = await Meteor.callAsync('medicationRequests.create', medicationRequest);
        console.log('Medication request created with ID:', newId);
        // Navigate back to medication requests list for new requests
        navigate('/medication-requests');
      }
    } catch (err) {
      console.error('Error saving medication request:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this medication request?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('medicationRequests.remove', id);
        console.log('Medication request deleted successfully');
        navigate('/medication-requests');
      } catch (err) {
        console.error('Error deleting medication request:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/medication-requests');
  }

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' },
    { value: 'entered-in-error', label: 'Entered in Error' },
    { value: 'stopped', label: 'Stopped' },
    { value: 'draft', label: 'Draft' },
    { value: 'unknown', label: 'Unknown' }
  ];

  const intentOptions = [
    { value: 'proposal', label: 'Proposal' },
    { value: 'plan', label: 'Plan' },
    { value: 'order', label: 'Order' },
    { value: 'original-order', label: 'Original Order' },
    { value: 'reflex-order', label: 'Reflex Order' },
    { value: 'filler-order', label: 'Filler Order' },
    { value: 'instance-order', label: 'Instance Order' },
    { value: 'option', label: 'Option' }
  ];

  const priorityOptions = [
    { value: 'routine', label: 'Routine' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'asap', label: 'ASAP' },
    { value: 'stat', label: 'STAT' }
  ];

  const periodUnitOptions = [
    { value: 's', label: 'Second' },
    { value: 'min', label: 'Minute' },
    { value: 'h', label: 'Hour' },
    { value: 'd', label: 'Day' },
    { value: 'wk', label: 'Week' },
    { value: 'mo', label: 'Month' },
    { value: 'a', label: 'Year' }
  ];

  if (isEmbedded) {
    return (
      <Stack spacing={3}>
        <TextField
          id="subjectDisplay"
          fullWidth
          label="Patient"
          value={get(medicationRequest, 'subject.display', '')}
          helperText={get(medicationRequest, 'subject.reference', '') || 'Patient reference will be assigned'}
          disabled
        />

        <Stack direction="row" spacing={2}>
          <TextField
            id="medicationDisplay"
            fullWidth
            label="Medication Name"
            value={get(medicationRequest, 'medicationCodeableConcept.text', '') ||
                   get(medicationRequest, 'medicationCodeableConcept.coding[0].display', '')}
            onChange={(e) => handleChange('medicationCodeableConcept.text', e.target.value)}
            helperText="Name of the medication"
            disabled={!isEditing}
          />

          <TextField
            id="medicationCode"
            fullWidth
            label="Medication Code"
            value={get(medicationRequest, 'medicationCodeableConcept.coding[0].code', '')}
            onChange={(e) => handleChange('medicationCodeableConcept.coding[0].code', e.target.value)}
            helperText="RxNorm code"
            disabled={!isEditing}
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Status</InputLabel>
            <Select
              id="status"
              value={get(medicationRequest, 'status', 'active')}
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
            <InputLabel>Intent</InputLabel>
            <Select
              id="intent"
              value={get(medicationRequest, 'intent', 'order')}
              onChange={(e) => handleChange('intent', e.target.value)}
              label="Intent"
            >
              {intentOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Priority</InputLabel>
            <Select
              id="priority"
              value={get(medicationRequest, 'priority', 'routine')}
              onChange={(e) => handleChange('priority', e.target.value)}
              label="Priority"
            >
              {priorityOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            id="authoredOn"
            fullWidth
            type="date"
            label="Authored On"
            value={moment(get(medicationRequest, 'authoredOn', '')).format('YYYY-MM-DD')}
            onChange={(e) => handleChange('authoredOn', e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Stack>

        <TextField
          id="requesterDisplay"
          fullWidth
          label="Requester"
          value={get(medicationRequest, 'requester.display', '')}
          onChange={(e) => handleChange('requester.display', e.target.value)}
          helperText={get(medicationRequest, 'requester.reference', '') || 'Practitioner reference will be assigned'}
          disabled={!isEditing}
        />

        <Typography variant="h6" sx={{ mt: 2 }}>Dosage Instructions</Typography>

        <TextField
          id="dosageInstruction"
          fullWidth
          multiline
          rows={2}
          label="Dosage Instructions Text"
          value={get(medicationRequest, 'dosageInstruction[0].text', '')}
          onChange={(e) => handleChange('dosageInstruction[0].text', e.target.value)}
          helperText="e.g., Take 2 tablets by mouth every 6 hours"
          disabled={!isEditing}
        />

        <Stack direction="row" spacing={2}>
          <TextField
            fullWidth
            type="number"
            label="Dose Amount"
            value={get(medicationRequest, 'dosageInstruction[0].doseAndRate[0].doseQuantity.value', '')}
            onChange={(e) => handleChange('dosageInstruction[0].doseAndRate[0].doseQuantity.value', parseFloat(e.target.value) || null)}
            disabled={!isEditing}
          />

          <TextField
            fullWidth
            label="Dose Unit"
            value={get(medicationRequest, 'dosageInstruction[0].doseAndRate[0].doseQuantity.unit', '')}
            onChange={(e) => {
              handleChange('dosageInstruction[0].doseAndRate[0].doseQuantity.unit', e.target.value);
              handleChange('dosageInstruction[0].doseAndRate[0].doseQuantity.code', e.target.value);
            }}
            helperText="e.g., mg, mL, tablets"
            disabled={!isEditing}
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            fullWidth
            type="number"
            label="Frequency"
            value={get(medicationRequest, 'dosageInstruction[0].timing.repeat.frequency', '')}
            onChange={(e) => handleChange('dosageInstruction[0].timing.repeat.frequency', parseInt(e.target.value) || null)}
            helperText="Times per period"
            disabled={!isEditing}
          />

          <TextField
            fullWidth
            type="number"
            label="Period"
            value={get(medicationRequest, 'dosageInstruction[0].timing.repeat.period', '')}
            onChange={(e) => handleChange('dosageInstruction[0].timing.repeat.period', parseInt(e.target.value) || null)}
            disabled={!isEditing}
          />

          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Period Unit</InputLabel>
            <Select
              value={get(medicationRequest, 'dosageInstruction[0].timing.repeat.periodUnit', 'd')}
              onChange={(e) => handleChange('dosageInstruction[0].timing.repeat.periodUnit', e.target.value)}
              label="Period Unit"
            >
              {periodUnitOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            id="dosageTiming"
            fullWidth
            label="Timing"
            value={get(medicationRequest, 'dosageInstruction[0].timing.code.text', '')}
            onChange={(e) => handleChange('dosageInstruction[0].timing.code.text', e.target.value)}
            helperText="e.g., 1/d, BID, TID"
            disabled={!isEditing}
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            id="dosageRouteCode"
            fullWidth
            label="Route Code"
            value={get(medicationRequest, 'dosageInstruction[0].route.coding[0].code', '')}
            onChange={(e) => handleChange('dosageInstruction[0].route.coding[0].code', e.target.value)}
            helperText="SNOMED code"
            disabled={!isEditing}
          />

          <TextField
            id="dosageRouteDisplay"
            fullWidth
            label="Route Display"
            value={get(medicationRequest, 'dosageInstruction[0].route.coding[0].display', '')}
            onChange={(e) => handleChange('dosageInstruction[0].route.coding[0].display', e.target.value)}
            helperText="e.g., oral, IV, IM"
            disabled={!isEditing}
          />
        </Stack>

        <Typography variant="h6" sx={{ mt: 2 }}>Dispense Request</Typography>

        <Stack direction="row" spacing={2}>
          <TextField
            id="dispenseQuantity"
            fullWidth
            type="number"
            label="Dispense Quantity"
            value={get(medicationRequest, 'dispenseRequest.quantity.value', '')}
            onChange={(e) => handleChange('dispenseRequest.quantity.value', parseFloat(e.target.value) || null)}
            disabled={!isEditing}
          />

          <TextField
            id="dispenseUnit"
            fullWidth
            label="Dispense Unit"
            value={get(medicationRequest, 'dispenseRequest.quantity.unit', '')}
            onChange={(e) => handleChange('dispenseRequest.quantity.unit', e.target.value)}
            helperText="e.g., tablets, mL"
            disabled={!isEditing}
          />

          <TextField
            id="numberOfRepeats"
            fullWidth
            type="number"
            label="Number of Repeats"
            value={get(medicationRequest, 'dispenseRequest.numberOfRepeatsAllowed', '')}
            onChange={(e) => handleChange('dispenseRequest.numberOfRepeatsAllowed', parseInt(e.target.value) || null)}
            helperText="Number of refills allowed"
            disabled={!isEditing}
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            fullWidth
            type="date"
            label="Valid From"
            value={moment(get(medicationRequest, 'dispenseRequest.validityPeriod.start', '')).format('YYYY-MM-DD')}
            onChange={(e) => handleChange('dispenseRequest.validityPeriod.start', e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />

          <TextField
            fullWidth
            type="date"
            label="Valid Until"
            value={moment(get(medicationRequest, 'dispenseRequest.validityPeriod.end', '')).format('YYYY-MM-DD')}
            onChange={(e) => handleChange('dispenseRequest.validityPeriod.end', e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Stack>

        <Typography variant="h6" sx={{ mt: 2 }}>Clinical Information</Typography>

        <Stack direction="row" spacing={2}>
          <TextField
            id="reasonCode"
            fullWidth
            label="Reason Code"
            value={get(medicationRequest, 'reasonCode[0].coding[0].code', '')}
            onChange={(e) => handleChange('reasonCode[0].coding[0].code', e.target.value)}
            helperText="SNOMED code for condition"
            disabled={!isEditing}
          />

          <TextField
            id="reasonDisplay"
            fullWidth
            label="Reason Display"
            value={get(medicationRequest, 'reasonCode[0].text', '') || get(medicationRequest, 'reasonCode[0].coding[0].display', '')}
            onChange={(e) => handleChange('reasonCode[0].text', e.target.value)}
            helperText="e.g., Hypertension, Diabetes"
            disabled={!isEditing}
          />
        </Stack>

        <TextField
          id="notesTextarea"
          fullWidth
          multiline
          rows={3}
          label="Notes"
          value={get(medicationRequest, 'note[0].text', '')}
          onChange={(e) => handleChange('note[0].text', e.target.value)}
          helperText="Additional notes or instructions"
          disabled={!isEditing}
        />
      </Stack>
    );
  }

  return (
    <Container id="medicationRequestDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Edit Medication Request' : 'New Medication Request'}
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
              id="subjectDisplay"
              fullWidth
              label="Patient"
              value={get(medicationRequest, 'subject.display', '')}
              helperText={get(medicationRequest, 'subject.reference', '') || 'Patient reference will be assigned'}
              disabled // Always disabled to prevent editing
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="medicationDisplay"
                fullWidth
                label="Medication Name"
                value={get(medicationRequest, 'medicationCodeableConcept.text', '') || 
                       get(medicationRequest, 'medicationCodeableConcept.coding[0].display', '')}
                onChange={(e) => handleChange('medicationCodeableConcept.text', e.target.value)}
                helperText="Name of the medication"
                disabled={!isEditing}
              />
              
              <TextField
                id="medicationCode"
                fullWidth
                label="Medication Code"
                value={get(medicationRequest, 'medicationCodeableConcept.coding[0].code', '')}
                onChange={(e) => handleChange('medicationCodeableConcept.coding[0].code', e.target.value)}
                helperText="RxNorm code"
                disabled={!isEditing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Lookup RxNorm codes">
                        <IconButton
                          onClick={() => window.open('https://mor.nlm.nih.gov/RxNav/', '_blank')}
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
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Status</InputLabel>
                <Select
                  id="status"
                  value={get(medicationRequest, 'status', 'active')}
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
                <InputLabel>Intent</InputLabel>
                <Select
                  id="intent"
                  value={get(medicationRequest, 'intent', 'order')}
                  onChange={(e) => handleChange('intent', e.target.value)}
                  label="Intent"
                >
                  {intentOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Priority</InputLabel>
                <Select
                  id="priority"
                  value={get(medicationRequest, 'priority', 'routine')}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  label="Priority"
                >
                  {priorityOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                id="authoredOn"
                fullWidth
                type="date"
                label="Authored On"
                value={moment(get(medicationRequest, 'authoredOn', '')).format('YYYY-MM-DD')}
                onChange={(e) => handleChange('authoredOn', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Stack>
            
            <TextField
              id="requesterDisplay"
              fullWidth
              label="Requester"
              value={get(medicationRequest, 'requester.display', '')}
              onChange={(e) => handleChange('requester.display', e.target.value)}
              helperText={get(medicationRequest, 'requester.reference', '') || 'Practitioner reference will be assigned'}
              disabled={!isEditing}
            />
            
            <Typography variant="h6" sx={{ mt: 2 }}>Dosage Instructions</Typography>
            
            <TextField
              id="dosageInstruction"
              fullWidth
              multiline
              rows={2}
              label="Dosage Instructions Text"
              value={get(medicationRequest, 'dosageInstruction[0].text', '')}
              onChange={(e) => handleChange('dosageInstruction[0].text', e.target.value)}
              helperText="e.g., Take 2 tablets by mouth every 6 hours"
              disabled={!isEditing}
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                type="number"
                label="Dose Amount"
                value={get(medicationRequest, 'dosageInstruction[0].doseAndRate[0].doseQuantity.value', '')}
                onChange={(e) => handleChange('dosageInstruction[0].doseAndRate[0].doseQuantity.value', parseFloat(e.target.value) || null)}
                disabled={!isEditing}
              />
              
              <TextField
                fullWidth
                label="Dose Unit"
                value={get(medicationRequest, 'dosageInstruction[0].doseAndRate[0].doseQuantity.unit', '')}
                onChange={(e) => {
                  handleChange('dosageInstruction[0].doseAndRate[0].doseQuantity.unit', e.target.value);
                  handleChange('dosageInstruction[0].doseAndRate[0].doseQuantity.code', e.target.value);
                }}
                helperText="e.g., mg, mL, tablets"
                disabled={!isEditing}
              />
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                type="number"
                label="Frequency"
                value={get(medicationRequest, 'dosageInstruction[0].timing.repeat.frequency', '')}
                onChange={(e) => handleChange('dosageInstruction[0].timing.repeat.frequency', parseInt(e.target.value) || null)}
                helperText="Times per period"
                disabled={!isEditing}
              />
              
              <TextField
                fullWidth
                type="number"
                label="Period"
                value={get(medicationRequest, 'dosageInstruction[0].timing.repeat.period', '')}
                onChange={(e) => handleChange('dosageInstruction[0].timing.repeat.period', parseInt(e.target.value) || null)}
                disabled={!isEditing}
              />
              
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Period Unit</InputLabel>
                <Select
                  value={get(medicationRequest, 'dosageInstruction[0].timing.repeat.periodUnit', 'd')}
                  onChange={(e) => handleChange('dosageInstruction[0].timing.repeat.periodUnit', e.target.value)}
                  label="Period Unit"
                >
                  {periodUnitOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                id="dosageTiming"
                fullWidth
                label="Timing"
                value={get(medicationRequest, 'dosageInstruction[0].timing.code.text', '')}
                onChange={(e) => handleChange('dosageInstruction[0].timing.code.text', e.target.value)}
                helperText="e.g., 1/d, BID, TID"
                disabled={!isEditing}
              />
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="dosageRouteCode"
                fullWidth
                label="Route Code"
                value={get(medicationRequest, 'dosageInstruction[0].route.coding[0].code', '')}
                onChange={(e) => handleChange('dosageInstruction[0].route.coding[0].code', e.target.value)}
                helperText="SNOMED code"
                disabled={!isEditing}
              />
              
              <TextField
                id="dosageRouteDisplay"
                fullWidth
                label="Route Display"
                value={get(medicationRequest, 'dosageInstruction[0].route.coding[0].display', '')}
                onChange={(e) => handleChange('dosageInstruction[0].route.coding[0].display', e.target.value)}
                helperText="e.g., oral, IV, IM"
                disabled={!isEditing}
              />
            </Stack>
            
            <Typography variant="h6" sx={{ mt: 2 }}>Dispense Request</Typography>
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="dispenseQuantity"
                fullWidth
                type="number"
                label="Dispense Quantity"
                value={get(medicationRequest, 'dispenseRequest.quantity.value', '')}
                onChange={(e) => handleChange('dispenseRequest.quantity.value', parseFloat(e.target.value) || null)}
                disabled={!isEditing}
              />
              
              <TextField
                id="dispenseUnit"
                fullWidth
                label="Dispense Unit"
                value={get(medicationRequest, 'dispenseRequest.quantity.unit', '')}
                onChange={(e) => handleChange('dispenseRequest.quantity.unit', e.target.value)}
                helperText="e.g., tablets, mL"
                disabled={!isEditing}
              />
              
              <TextField
                id="numberOfRepeats"
                fullWidth
                type="number"
                label="Number of Repeats"
                value={get(medicationRequest, 'dispenseRequest.numberOfRepeatsAllowed', '')}
                onChange={(e) => handleChange('dispenseRequest.numberOfRepeatsAllowed', parseInt(e.target.value) || null)}
                helperText="Number of refills allowed"
                disabled={!isEditing}
              />
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                type="date"
                label="Valid From"
                value={moment(get(medicationRequest, 'dispenseRequest.validityPeriod.start', '')).format('YYYY-MM-DD')}
                onChange={(e) => handleChange('dispenseRequest.validityPeriod.start', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
              
              <TextField
                fullWidth
                type="date"
                label="Valid Until"
                value={moment(get(medicationRequest, 'dispenseRequest.validityPeriod.end', '')).format('YYYY-MM-DD')}
                onChange={(e) => handleChange('dispenseRequest.validityPeriod.end', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Stack>
            
            <Typography variant="h6" sx={{ mt: 2 }}>Clinical Information</Typography>
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="reasonCode"
                fullWidth
                label="Reason Code"
                value={get(medicationRequest, 'reasonCode[0].coding[0].code', '')}
                onChange={(e) => handleChange('reasonCode[0].coding[0].code', e.target.value)}
                helperText="SNOMED code for condition"
                disabled={!isEditing}
              />
              
              <TextField
                id="reasonDisplay"
                fullWidth
                label="Reason Display"
                value={get(medicationRequest, 'reasonCode[0].text', '') || get(medicationRequest, 'reasonCode[0].coding[0].display', '')}
                onChange={(e) => handleChange('reasonCode[0].text', e.target.value)}
                helperText="e.g., Hypertension, Diabetes"
                disabled={!isEditing}
              />
            </Stack>
            
            <TextField
              id="notesTextarea"
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={get(medicationRequest, 'note[0].text', '')}
              onChange={(e) => handleChange('note[0].text', e.target.value)}
              helperText="Additional notes or instructions"
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/medication-requests')}
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
                    // Reload the medication request to discard changes
                    async function reloadMedicationRequest() {
                      try {
                        const result = await Meteor.callAsync('medicationRequests.get', id);
                        if (result) {
                          setMedicationRequest(result);
                        }
                      } catch (err) {
                        console.error('Error reloading medication request:', err);
                      }
                    }
                    reloadMedicationRequest();
                  } else {
                    // For new medication requests, go back
                    navigate('/medication-requests');
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

export default MedicationRequestDetail;