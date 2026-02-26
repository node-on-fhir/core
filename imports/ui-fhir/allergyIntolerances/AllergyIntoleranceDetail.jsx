// /imports/ui-fhir/allergyIntolerances/AllergyIntoleranceDetail.jsx

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

import { AllergyIntolerances } from '/imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function AllergyIntoleranceDetail(props) {
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

  // Subscribe to allergy intolerances and track subscription status
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.AllergyIntolerances', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('allergyintolerances.all');
    }
    return handle.ready();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [allergyIntolerance, setAllergyIntolerance] = useState({
    resourceType: "AllergyIntolerance",
    clinicalStatus: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
        code: "active",
        display: "Active"
      }]
    },
    verificationStatus: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
        code: "unconfirmed",
        display: "Unconfirmed"
      }]
    },
    type: "allergy",
    category: ["food"],
    criticality: "low",
    code: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    patient: {
      reference: "",
      display: ""
    },
    onsetDateTime: moment().format('YYYY-MM-DD'),
    recorder: {
      reference: "",
      display: ""
    },
    asserter: {
      reference: "",
      display: ""
    },
    reaction: [{
      manifestation: [{
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }],
        text: ""
      }],
      severity: "mild"
    }],
    note: [{
      text: ""
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setAllergyIntolerance(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  // onResourceChange: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(allergyIntolerance);
    }
  }, [allergyIntolerance]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded);

  // Set patient name and recorder on component mount for new allergy intolerances ONLY
  useEffect(function() {
    // IMPORTANT: Only run this for NEW records, not existing ones
    if (!id || id === 'new') {
      // Enable editing for new allergy intolerances
      setIsEditing(true);
      
      // For new allergy intolerances, set the patient name
      let patientName = '';
      let patientReference = '';
      
      if (selectedPatient) {
        // Prefer selected patient
        patientName = get(selectedPatient, 'name[0].text', '') || 
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        // Use FHIR id for reference, NOT MongoDB _id
        const fhirId = get(selectedPatient, 'id');
        if (fhirId) {
          patientReference = `Patient/${fhirId}`;
        } else {
          // Fallback to _id if no FHIR id
          patientReference = `Patient/${get(selectedPatient, '_id', '')}`;
        }
      } else if (currentUser) {
        // Only use current user as fallback if they have a patient record
        const userPatientId = get(currentUser, 'profile.patientId');
        if (userPatientId) {
          const userPatient = Patients.findOne({_id: userPatientId});
          if (userPatient) {
            patientName = get(userPatient, 'name[0].text', '') ||
                         `${get(userPatient, 'name[0].given[0]', '')} ${get(userPatient, 'name[0].family', '')}`.trim();
            patientReference = `Patient/${get(userPatient, 'id', userPatientId)}`;
          }
        }
      }
      
      // Set recorder to current user
      let recorderName = '';
      let recorderReference = '';
      
      if (currentUser) {
        recorderName = get(currentUser, 'profile.name.text', '') ||
                       `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                       get(currentUser, 'username', '');
        recorderReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }
      
      setAllergyIntolerance(prev => ({
        ...prev,
        patient: {
          reference: patientReference,
          display: patientName
        },
        recorder: {
          reference: recorderReference,
          display: recorderName
        }
      }));
    }
    // Note: Don't set isEditing(false) here for existing records
    // Let the second useEffect handle loading existing records
  }, [id, selectedPatient, currentUser]);

  // Load allergy intolerance if viewing existing record
  useEffect(() => {
    if (id && id !== 'new') {
      // Try to load even if subscription says not ready - data might be there from page subscription
      const existingAllergy = AllergyIntolerances.findOne({_id: id});

      if (existingAllergy) {
        setAllergyIntolerance(existingAllergy);
        setIsEditing(false);
      } else {
        // Try finding by id field instead
        const allergyById = AllergyIntolerances.findOne({id: id});
        if (allergyById) {
          setAllergyIntolerance(allergyById);
          setIsEditing(false);
        } else {
          // Set to read-only mode anyway
          setIsEditing(false);
        }
      }
    }
  }, [id]);

  // Handle input changes
  const handleChange = (path, value) => {
    pendingUpdate.current = true;
    setAllergyIntolerance(prev => {
      const updated = {...prev};
      set(updated, path, value);
      return updated;
    });
  };

  // Handle save
  async function handleSaveButton() {
    setLoading(true);
    try {
      // Ensure patient reference is set from session if not already set
      let patientRef = get(allergyIntolerance, 'patient');
      if (!patientRef || !patientRef.reference) {
        const sessionPatient = Session.get('selectedPatient');
        if (sessionPatient) {
          // Use FHIR id for reference, NOT MongoDB _id
          const fhirId = get(sessionPatient, 'id');
          const patientIdToUse = fhirId || get(sessionPatient, '_id', '');
          
          patientRef = {
            reference: `Patient/${patientIdToUse}`,
            display: get(sessionPatient, 'name[0].text', '') || 
                    `${get(sessionPatient, 'name[0].given[0]', '')} ${get(sessionPatient, 'name[0].family', '')}`.trim()
          };
        }
      }
      
      // Debug patient reference
      console.log('Patient reference being saved:', patientRef);
      console.log('Session patient:', Session.get('selectedPatient'));
      console.log('Session patient ID:', Session.get('selectedPatientId'));
      
      let dataToSave = {
        resourceType: "AllergyIntolerance",
        clinicalStatus: get(allergyIntolerance, 'clinicalStatus'),
        verificationStatus: get(allergyIntolerance, 'verificationStatus'),
        type: get(allergyIntolerance, 'type'),
        category: get(allergyIntolerance, 'category'),
        criticality: get(allergyIntolerance, 'criticality'),
        code: get(allergyIntolerance, 'code'),
        patient: patientRef,
        onsetDateTime: get(allergyIntolerance, 'onsetDateTime'),
        recorder: get(allergyIntolerance, 'recorder'),
        asserter: get(allergyIntolerance, 'asserter'),
        reaction: get(allergyIntolerance, 'reaction'),
        note: get(allergyIntolerance, 'note')
      };
      
      console.log('Saving allergy intolerance with data:', JSON.stringify(dataToSave, null, 2));

      if(id && id !== 'new'){
        await Meteor.callAsync('updateAllergyIntolerance', id, dataToSave);
        setIsEditing(false); // Stay on page, switch to read mode
      } else {
        const newId = await Meteor.callAsync('createAllergyIntolerance', dataToSave);
        navigate('/allergy-intolerances'); // Navigate to list after create
      }
    } catch(error) {
      console.error('Error saving allergy intolerance:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDeleteButton() {
    if (window.confirm('Are you sure you want to delete this allergy intolerance?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeAllergyIntolerance', id);
        navigate('/allergy-intolerances');
      } catch(error) {
        console.error('Error deleting allergy intolerance:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel/back
  function handleCancelButton() {
    if (isEditing && id && id !== 'new') {
      // Cancel editing, revert to read-only mode
      const existingAllergy = AllergyIntolerances.findOne({_id: id});
      if (existingAllergy) {
        setAllergyIntolerance(existingAllergy);
      }
      setIsEditing(false);
    } else {
      // Go back to list
      navigate('/allergy-intolerances');
    }
  }

  // Handle patient search
  function handleSearchUser() {
    console.log('Patient search not yet implemented');
    // TODO: Implement patient search dialog
  }

  if (isEmbedded) {
    return (
      <Stack spacing={3}>
        {/* Patient field with search */}
        <TextField
          id="patientDisplay"
          fullWidth
          label="Patient"
          value={get(allergyIntolerance, 'patient.display', '')}
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

        {/* Code fields */}
        <TextField
          id="codeInput"
          fullWidth
          label="Code"
          placeholder="e.g., 91935009"
          value={get(allergyIntolerance, 'code.coding[0].code', '')}
          onChange={(e) => handleChange('code.coding[0].code', e.target.value)}
          disabled={!isEditing}
          helperText="SNOMED CT code for the allergen"
        />

        <TextField
          id="codeDisplayInput"
          fullWidth
          label="Code Display"
          placeholder="e.g., Allergy to peanuts"
          value={get(allergyIntolerance, 'code.coding[0].display', '')}
          onChange={(e) => handleChange('code.coding[0].display', e.target.value)}
          disabled={!isEditing}
          helperText="Human readable name for the allergen"
        />

        {/* Status fields */}
        <FormControl fullWidth>
          <InputLabel>Clinical Status</InputLabel>
          <Select
            id="clinicalStatusSelect"
            label="Clinical Status"
            value={get(allergyIntolerance, 'clinicalStatus.coding[0].code', 'active')}
            onChange={(e) => {
              const code = e.target.value;
              const display = code.charAt(0).toUpperCase() + code.slice(1);
              handleChange('clinicalStatus', {
                coding: [{
                  system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
                  code: code,
                  display: display
                }]
              });
            }}
            disabled={!isEditing}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Verification Status</InputLabel>
          <Select
            id="verificationStatusSelect"
            label="Verification Status"
            value={get(allergyIntolerance, 'verificationStatus.coding[0].code', 'unconfirmed')}
            onChange={(e) => {
              const code = e.target.value;
              const displayMap = {
                'unconfirmed': 'Unconfirmed',
                'confirmed': 'Confirmed',
                'refuted': 'Refuted',
                'entered-in-error': 'Entered in Error'
              };
              handleChange('verificationStatus', {
                coding: [{
                  system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
                  code: code,
                  display: displayMap[code]
                }]
              });
            }}
            disabled={!isEditing}
          >
            <MenuItem value="unconfirmed">Unconfirmed</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="refuted">Refuted</MenuItem>
            <MenuItem value="entered-in-error">Entered in Error</MenuItem>
          </Select>
        </FormControl>

        {/* Type and Category */}
        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select
            id="typeSelect"
            label="Type"
            value={get(allergyIntolerance, 'type', 'allergy')}
            onChange={(e) => handleChange('type', e.target.value)}
            disabled={!isEditing}
          >
            <MenuItem value="allergy">Allergy</MenuItem>
            <MenuItem value="intolerance">Intolerance</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Category</InputLabel>
          <Select
            id="categorySelect"
            label="Category"
            value={get(allergyIntolerance, 'category[0]', 'food')}
            onChange={(e) => handleChange('category', [e.target.value])}
            disabled={!isEditing}
          >
            <MenuItem value="food">Food</MenuItem>
            <MenuItem value="medication">Medication</MenuItem>
            <MenuItem value="environment">Environment</MenuItem>
            <MenuItem value="biologic">Biologic</MenuItem>
          </Select>
        </FormControl>

        {/* Criticality */}
        <FormControl fullWidth>
          <InputLabel>Criticality</InputLabel>
          <Select
            id="criticalitySelect"
            label="Criticality"
            value={get(allergyIntolerance, 'criticality', 'low')}
            onChange={(e) => handleChange('criticality', e.target.value)}
            disabled={!isEditing}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="unable-to-assess">Unable to Assess</MenuItem>
          </Select>
        </FormControl>

        {/* Reaction */}
        <TextField
          id="reactionInput"
          fullWidth
          label="Reaction"
          placeholder="e.g., Hives, Anaphylaxis, Rash"
          value={get(allergyIntolerance, 'reaction[0].manifestation[0].text', '')}
          onChange={(e) => {
            const updated = {...allergyIntolerance};
            set(updated, 'reaction[0].manifestation[0].text', e.target.value);
            setAllergyIntolerance(updated);
          }}
          disabled={!isEditing}
          multiline
          rows={2}
        />

        {/* Severity */}
        <FormControl fullWidth>
          <InputLabel>Reaction Severity</InputLabel>
          <Select
            id="reactionSeveritySelect"
            label="Reaction Severity"
            value={get(allergyIntolerance, 'reaction[0].severity', 'mild')}
            onChange={(e) => {
              const updated = {...allergyIntolerance};
              set(updated, 'reaction[0].severity', e.target.value);
              setAllergyIntolerance(updated);
            }}
            disabled={!isEditing}
          >
            <MenuItem value="mild">Mild</MenuItem>
            <MenuItem value="moderate">Moderate</MenuItem>
            <MenuItem value="severe">Severe</MenuItem>
          </Select>
        </FormControl>

        {/* Onset Date */}
        <TextField
          id="onsetDateTimeInput"
          fullWidth
          label="Onset Date"
          type="date"
          value={moment(get(allergyIntolerance, 'onsetDateTime', '')).format('YYYY-MM-DD')}
          onChange={(e) => handleChange('onsetDateTime', e.target.value)}
          disabled={!isEditing}
          InputLabelProps={{
            shrink: true,
          }}
        />

        {/* Recorder */}
        <TextField
          id="recorderInput"
          fullWidth
          label="Recorded By"
          value={get(allergyIntolerance, 'recorder.display', '')}
          onChange={(e) => handleChange('recorder.display', e.target.value)}
          disabled={!isEditing}
          helperText="The person who recorded this allergy"
        />

        {/* Asserter */}
        <TextField
          id="asserterInput"
          fullWidth
          label="Asserted By"
          value={get(allergyIntolerance, 'asserter.display', '')}
          onChange={(e) => handleChange('asserter.display', e.target.value)}
          disabled={!isEditing}
          helperText="The person who asserted this allergy"
        />

        {/* Notes */}
        <TextField
          id="notesTextarea"
          fullWidth
          label="Notes"
          multiline
          rows={3}
          value={get(allergyIntolerance, 'note[0].text', '')}
          onChange={(e) => {
            const updated = {...allergyIntolerance};
            set(updated, 'note[0].text', e.target.value);
            setAllergyIntolerance(updated);
          }}
          disabled={!isEditing}
          helperText="Additional notes about this allergy"
        />
      </Stack>
    );
  }

  return (
    <Container id="allergyIntoleranceDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Edit Allergy/Intolerance' : 'New Allergy/Intolerance'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent sx={{ p: 4 }}>
          {/* System ID Barcode */}
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}
          
          <Stack spacing={3}>
            {/* Patient field with search */}
            <TextField
              id="patientDisplay"
              fullWidth
              label="Patient"
              value={get(allergyIntolerance, 'patient.display', '')}
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

            {/* Code fields */}
            <TextField
              id="codeInput"
              fullWidth
              label="Code"
              placeholder="e.g., 91935009"
              value={get(allergyIntolerance, 'code.coding[0].code', '')}
              onChange={(e) => handleChange('code.coding[0].code', e.target.value)}
              disabled={!isEditing}
              helperText="SNOMED CT code for the allergen"
            />
            
            <TextField
              id="codeDisplayInput"
              fullWidth
              label="Code Display"
              placeholder="e.g., Allergy to peanuts"
              value={get(allergyIntolerance, 'code.coding[0].display', '')}
              onChange={(e) => handleChange('code.coding[0].display', e.target.value)}
              disabled={!isEditing}
              helperText="Human readable name for the allergen"
            />

            {/* Status fields */}
            <FormControl fullWidth>
              <InputLabel>Clinical Status</InputLabel>
              <Select
                id="clinicalStatusSelect"
                label="Clinical Status"
                value={get(allergyIntolerance, 'clinicalStatus.coding[0].code', 'active')}
                onChange={(e) => {
                  const code = e.target.value;
                  const display = code.charAt(0).toUpperCase() + code.slice(1);
                  handleChange('clinicalStatus', {
                    coding: [{
                      system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
                      code: code,
                      display: display
                    }]
                  });
                }}
                disabled={!isEditing}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Verification Status</InputLabel>
              <Select
                id="verificationStatusSelect"
                label="Verification Status"
                value={get(allergyIntolerance, 'verificationStatus.coding[0].code', 'unconfirmed')}
                onChange={(e) => {
                  const code = e.target.value;
                  const displayMap = {
                    'unconfirmed': 'Unconfirmed',
                    'confirmed': 'Confirmed',
                    'refuted': 'Refuted',
                    'entered-in-error': 'Entered in Error'
                  };
                  handleChange('verificationStatus', {
                    coding: [{
                      system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
                      code: code,
                      display: displayMap[code]
                    }]
                  });
                }}
                disabled={!isEditing}
              >
                <MenuItem value="unconfirmed">Unconfirmed</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="refuted">Refuted</MenuItem>
                <MenuItem value="entered-in-error">Entered in Error</MenuItem>
              </Select>
            </FormControl>

            {/* Type and Category */}
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                id="typeSelect"
                label="Type"
                value={get(allergyIntolerance, 'type', 'allergy')}
                onChange={(e) => handleChange('type', e.target.value)}
                disabled={!isEditing}
              >
                <MenuItem value="allergy">Allergy</MenuItem>
                <MenuItem value="intolerance">Intolerance</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                id="categorySelect"
                label="Category"
                value={get(allergyIntolerance, 'category[0]', 'food')}
                onChange={(e) => handleChange('category', [e.target.value])}
                disabled={!isEditing}
              >
                <MenuItem value="food">Food</MenuItem>
                <MenuItem value="medication">Medication</MenuItem>
                <MenuItem value="environment">Environment</MenuItem>
                <MenuItem value="biologic">Biologic</MenuItem>
              </Select>
            </FormControl>

            {/* Criticality */}
            <FormControl fullWidth>
              <InputLabel>Criticality</InputLabel>
              <Select
                id="criticalitySelect"
                label="Criticality"
                value={get(allergyIntolerance, 'criticality', 'low')}
                onChange={(e) => handleChange('criticality', e.target.value)}
                disabled={!isEditing}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="unable-to-assess">Unable to Assess</MenuItem>
              </Select>
            </FormControl>

            {/* Reaction */}
            <TextField
              id="reactionInput"
              fullWidth
              label="Reaction"
              placeholder="e.g., Hives, Anaphylaxis, Rash"
              value={get(allergyIntolerance, 'reaction[0].manifestation[0].text', '')}
              onChange={(e) => {
                const updated = {...allergyIntolerance};
                set(updated, 'reaction[0].manifestation[0].text', e.target.value);
                setAllergyIntolerance(updated);
              }}
              disabled={!isEditing}
              multiline
              rows={2}
            />

            {/* Severity */}
            <FormControl fullWidth>
              <InputLabel>Reaction Severity</InputLabel>
              <Select
                id="reactionSeveritySelect"
                label="Reaction Severity"
                value={get(allergyIntolerance, 'reaction[0].severity', 'mild')}
                onChange={(e) => {
                  const updated = {...allergyIntolerance};
                  set(updated, 'reaction[0].severity', e.target.value);
                  setAllergyIntolerance(updated);
                }}
                disabled={!isEditing}
              >
                <MenuItem value="mild">Mild</MenuItem>
                <MenuItem value="moderate">Moderate</MenuItem>
                <MenuItem value="severe">Severe</MenuItem>
              </Select>
            </FormControl>

            {/* Onset Date */}
            <TextField
              id="onsetDateTimeInput"
              fullWidth
              label="Onset Date"
              type="date"
              value={moment(get(allergyIntolerance, 'onsetDateTime', '')).format('YYYY-MM-DD')}
              onChange={(e) => handleChange('onsetDateTime', e.target.value)}
              disabled={!isEditing}
              InputLabelProps={{
                shrink: true,
              }}
            />

            {/* Recorder */}
            <TextField
              id="recorderInput"
              fullWidth
              label="Recorded By"
              value={get(allergyIntolerance, 'recorder.display', '')}
              onChange={(e) => handleChange('recorder.display', e.target.value)}
              disabled={!isEditing}
              helperText="The person who recorded this allergy"
            />
            
            {/* Asserter */}
            <TextField
              id="asserterInput"
              fullWidth
              label="Asserted By"
              value={get(allergyIntolerance, 'asserter.display', '')}
              onChange={(e) => handleChange('asserter.display', e.target.value)}
              disabled={!isEditing}
              helperText="The person who asserted this allergy"
            />
            
            {/* Notes */}
            <TextField
              id="notesTextarea"
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={get(allergyIntolerance, 'note[0].text', '')}
              onChange={(e) => {
                const updated = {...allergyIntolerance};
                set(updated, 'note[0].text', e.target.value);
                setAllergyIntolerance(updated);
              }}
              disabled={!isEditing}
              helperText="Additional notes about this allergy"
            />
          </Stack>

          {error && (
            <Box sx={{ mt: 2 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {isEditing ? (
            <>
              <Button onClick={handleCancelButton}>
                Cancel
              </Button>
              <Button 
                id="saveAllergyIntoleranceButton"
                onClick={handleSaveButton}
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {id && id !== 'new' ? 'Update' : 'Save'}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate('/allergy-intolerances')}>
                Back
              </Button>
              {id && id !== 'new' && (
                <Button 
                  onClick={handleDeleteButton}
                  color="error"
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button 
                onClick={() => setIsEditing(true)}
                variant="contained"
                color="primary"
              >
                Edit
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default AllergyIntoleranceDetail;