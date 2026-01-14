// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/familyMemberHistories/FamilyMemberHistoryDetail.jsx

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
  Grid,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  Switch,
  FormControlLabel,
  Autocomplete
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EditIcon from '@mui/icons-material/Edit';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Direct imports
import { FamilyMemberHistories } from '/imports/lib/schemas/SimpleSchemas/FamilyMemberHistories';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

//=============================================================================================================================================
// COMPONENT

function FamilyMemberHistoryDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Subscribe to data
  const subscriptionReady = useTracker(() => {
    const familyMemberHistoriesHandle = Meteor.subscribe('familyMemberHistories.all');
    const patientsHandle = Meteor.subscribe('patients.search', {});
    return familyMemberHistoriesHandle.ready() && patientsHandle.ready();
  }, []);

  // Get selected patient from session
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);
  
  const selectedPatientId = useTracker(function() {
    return Session.get('selectedPatientId');
  }, []);
  
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // State
  const [familyMemberHistory, setFamilyMemberHistory] = useState({
    resourceType: "FamilyMemberHistory",
    status: "partial",
    patient: {
      reference: "",
      display: ""
    },
    relationship: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
        code: "",
        display: ""
      }],
      text: ""
    },
    name: "",
    bornDate: "",
    ageAge: {
      value: null,
      unit: "years"
    },
    deceasedBoolean: false,
    deceasedAge: {
      value: null,
      unit: "years"
    },
    condition: []
  });

  const [isEditing, setIsEditing] = useState(id === 'new');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchUserDialogOpen, setSearchUserDialogOpen] = useState(false);
  const [currentCondition, setCurrentCondition] = useState({
    code: { coding: [{ system: "", code: "", display: "" }], text: "" },
    onsetAge: { value: null, unit: "years" },
    note: [{ text: "" }]
  });

  // Family relationship options based on HL7 v3 RoleCode
  const relationshipOptions = [
    { code: "FTH", display: "Father" },
    { code: "MTH", display: "Mother" },
    { code: "BRO", display: "Brother" },
    { code: "SIS", display: "Sister" },
    { code: "SON", display: "Son" },
    { code: "DAU", display: "Daughter" },
    { code: "GRNFTH", display: "Grandfather" },
    { code: "GRNMTH", display: "Grandmother" },
    { code: "GRNDSON", display: "Grandson" },
    { code: "GRNDDAU", display: "Granddaughter" },
    { code: "UNCLE", display: "Uncle" },
    { code: "AUNT", display: "Aunt" },
    { code: "NEPHEW", display: "Nephew" },
    { code: "NIECE", display: "Niece" },
    { code: "COUSN", display: "Cousin" },
    { code: "HBRO", display: "Half Brother" },
    { code: "HSIS", display: "Half Sister" }
  ];

  // Common conditions based on genetic/familial patterns
  const commonConditions = [
    "Diabetes mellitus",
    "Hypertension",
    "Heart disease",
    "Stroke",
    "Cancer",
    "Breast cancer",
    "Colorectal cancer",
    "Lung cancer",
    "Alzheimer's disease",
    "Depression",
    "Anxiety disorder",
    "Asthma",
    "Arthritis",
    "Kidney disease",
    "Liver disease",
    "Obesity",
    "High cholesterol",
    "Osteoporosis",
    "Glaucoma",
    "Migraine"
  ];

  // Load existing record on mount
  useEffect(() => {
    if (id && id !== 'new' && subscriptionReady) {
      const existingFamilyMemberHistory = FamilyMemberHistories.findOne({_id: id});
      if (existingFamilyMemberHistory) {
        setFamilyMemberHistory(existingFamilyMemberHistory);
        setIsEditing(false);
      }
    }
  }, [id, subscriptionReady]);

  // Set patient reference from session
  useEffect(() => {
    if (selectedPatient && id === 'new') {
      setFamilyMemberHistory(prev => ({
        ...prev,
        patient: {
          reference: `Patient/${get(selectedPatient, 'id', '')}`,
          display: get(selectedPatient, 'name.0.text', '') || 
                   `${get(selectedPatient, 'name.0.given.0', '')} ${get(selectedPatient, 'name.0.family', '')}`
        }
      }));
    }
  }, [selectedPatient, id]);

  // Handlers
  function handleChange(path, value) {
    setFamilyMemberHistory(prev => {
      const updated = { ...prev };
      set(updated, path, value);
      return updated;
    });
  }

  function handleRelationshipChange(event) {
    const selectedRelationship = relationshipOptions.find(r => r.code === event.target.value);
    if (selectedRelationship) {
      handleChange('relationship', {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
          code: selectedRelationship.code,
          display: selectedRelationship.display
        }],
        text: selectedRelationship.display
      });
    }
  }

  function handleAddCondition() {
    if (currentCondition.code.text) {
      const newCondition = {
        code: {
          coding: [{
            system: "http://snomed.info/sct",
            code: currentCondition.code.text.replace(/\s+/g, '-').toLowerCase(),
            display: currentCondition.code.text
          }],
          text: currentCondition.code.text
        },
        onsetAge: currentCondition.onsetAge.value ? currentCondition.onsetAge : undefined,
        note: currentCondition.note[0].text ? currentCondition.note : []
      };

      const updatedConditions = [...get(familyMemberHistory, 'condition', []), newCondition];
      handleChange('condition', updatedConditions);
      
      // Reset form
      setCurrentCondition({
        code: { coding: [{ system: "", code: "", display: "" }], text: "" },
        onsetAge: { value: null, unit: "years" },
        note: [{ text: "" }]
      });
    }
  }

  function handleRemoveCondition(index) {
    const updatedConditions = get(familyMemberHistory, 'condition', []).filter((_, i) => i !== index);
    handleChange('condition', updatedConditions);
  }

  function handleSearchUser() {
    setSearchUserDialogOpen(true);
  }

  function handlePatientSelect(patient) {
    setFamilyMemberHistory(prev => ({
      ...prev,
      patient: {
        reference: `Patient/${get(patient, 'id', '')}`,
        display: get(patient, 'name.0.text', '') || 
                 `${get(patient, 'name.0.given.0', '')} ${get(patient, 'name.0.family', '')}`
      }
    }));
    setSearchUserDialogOpen(false);
  }

  async function handleSaveButton() {
    setIsLoading(true);
    setError(null);
    
    try {
      let dataToSave = { ...familyMemberHistory };
      
      // Ensure required fields
      if (!dataToSave.status) dataToSave.status = "partial";
      if (!dataToSave.patient.reference && selectedPatient) {
        dataToSave.patient = {
          reference: `Patient/${get(selectedPatient, 'id', '')}`,
          display: get(selectedPatient, 'name.0.text', '') || 
                   `${get(selectedPatient, 'name.0.given.0', '')} ${get(selectedPatient, 'name.0.family', '')}`
        };
      }

      if (id && id !== 'new') {
        await Meteor.callAsync('updateFamilyMemberHistory', id, dataToSave);
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('createFamilyMemberHistory', dataToSave);
        navigate('/family-member-histories');
      }
    } catch (error) {
      console.error('Error saving family member history:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteButton() {
    if (window.confirm('Are you sure you want to delete this family member history?')) {
      try {
        await Meteor.callAsync('removeFamilyMemberHistory', id);
        navigate('/family-member-histories');
      } catch (error) {
        console.error('Error deleting family member history:', error);
        setError(error.message);
      }
    }
  }

  function handleCancelButton() {
    if (id === 'new') {
      navigate('/family-member-histories');
    } else {
      // Reload original data
      const originalFamilyMemberHistory = FamilyMemberHistories.findOne({_id: id});
      if (originalFamilyMemberHistory) {
        setFamilyMemberHistory(originalFamilyMemberHistory);
      }
      setIsEditing(false);
    }
  }

  return (
    <Container id="familyMemberHistoryDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FamilyRestroomIcon />
              {id && id !== 'new' ? 'Edit Family Member History' : 'New Family Member History'}
            </Box>
          }
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Barcode display for existing records */}
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Patient Reference */}
            <Grid item xs={12}>
              <TextField
                id="patientDisplay"
                fullWidth
                label="Patient"
                value={get(familyMemberHistory, 'patient.display', '')}
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
            </Grid>

            {/* Status */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={get(familyMemberHistory, 'status', '')}
                  onChange={(e) => handleChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="partial">Partial</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                  <MenuItem value="health-unknown">Health Unknown</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Relationship */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Relationship</InputLabel>
                <Select
                  value={get(familyMemberHistory, 'relationship.coding.0.code', '')}
                  onChange={handleRelationshipChange}
                  label="Relationship"
                >
                  {relationshipOptions.map(relationship => (
                    <MenuItem key={relationship.code} value={relationship.code}>
                      {relationship.display}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Family Member Name (Optional)"
                value={get(familyMemberHistory, 'name', '')}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={!isEditing}
                helperText="Leave blank to use relationship type"
              />
            </Grid>

            {/* Born Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Birth Date"
                value={get(familyMemberHistory, 'bornDate', '')}
                onChange={(e) => handleChange('bornDate', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Age */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Current Age (years)"
                value={get(familyMemberHistory, 'ageAge.value', '')}
                onChange={(e) => handleChange('ageAge.value', parseInt(e.target.value) || null)}
                disabled={!isEditing || get(familyMemberHistory, 'deceasedBoolean', false)}
                helperText={get(familyMemberHistory, 'deceasedBoolean', false) ? "Disabled for deceased" : ""}
              />
            </Grid>

            {/* Deceased Toggle */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={get(familyMemberHistory, 'deceasedBoolean', false)}
                    onChange={(e) => handleChange('deceasedBoolean', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Deceased"
              />
              {get(familyMemberHistory, 'deceasedBoolean', false) && (
                <TextField
                  fullWidth
                  type="number"
                  label="Age at Death (years)"
                  value={get(familyMemberHistory, 'deceasedAge.value', '')}
                  onChange={(e) => handleChange('deceasedAge.value', parseInt(e.target.value) || null)}
                  disabled={!isEditing}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            {/* Conditions */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Health Conditions
              </Typography>
              
              {/* Existing conditions */}
              <Box sx={{ mb: 2 }}>
                {get(familyMemberHistory, 'condition', []).map((condition, index) => (
                  <Chip
                    key={index}
                    label={get(condition, 'code.text', '')}
                    onDelete={isEditing ? () => handleRemoveCondition(index) : undefined}
                    color="primary"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>

              {/* Add new condition */}
              {isEditing && (
                <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        freeSolo
                        options={commonConditions}
                        value={currentCondition.code.text}
                        onChange={(event, newValue) => {
                          setCurrentCondition(prev => ({
                            ...prev,
                            code: { ...prev.code, text: newValue || '' }
                          }));
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Condition"
                            placeholder="Type or select condition"
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        type="number"
                        label="Age at Onset"
                        value={currentCondition.onsetAge.value || ''}
                        onChange={(e) => setCurrentCondition(prev => ({
                          ...prev,
                          onsetAge: { ...prev.onsetAge, value: parseInt(e.target.value) || null }
                        }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddCondition}
                        disabled={!currentCondition.code.text}
                        fullWidth
                      >
                        Add
                      </Button>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Additional Notes"
                        value={currentCondition.note[0]?.text || ''}
                        onChange={(e) => setCurrentCondition(prev => ({
                          ...prev,
                          note: [{ text: e.target.value }]
                        }))}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing ? (
            <>
              <Button onClick={() => navigate('/family-member-histories')}>
                Back
              </Button>
              {(id && id !== 'new') && (
                <Button 
                  color="error" 
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteButton}
                >
                  Delete
                </Button>
              )}
              <Button 
                variant="contained" 
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCancelButton}>
                Cancel
              </Button>
              <Button 
                id="saveFamilyMemberHistoryButton"
                variant="contained" 
                onClick={handleSaveButton}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : (id ? 'Update' : 'Save')} Family History
              </Button>
            </>
          )}
        </CardActions>
      </Card>

      {/* Patient Search Dialog */}
      <PatientSearchDialog
        open={searchUserDialogOpen}
        onClose={() => setSearchUserDialogOpen(false)}
        onPatientSelect={handlePatientSelect}
      />
    </Container>
  );
}

export default FamilyMemberHistoryDetail;