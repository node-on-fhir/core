// /imports/ui-fhir/medications/MedicationDetail.jsx

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

import { Medications } from '/imports/lib/schemas/SimpleSchemas/Medications';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function MedicationDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Get current user from session/tracker
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to medication data using ID-based query (optimized)
  const isSubscriptionReady = useTracker(function(){
    if (id && id !== 'new') {
      const handle = Meteor.subscribe('autopublish.Medications', {}, {});
      return handle.ready();
    }
    return true; // No subscription needed for new medications
  }, [id]);

  // Initialize state with proper FHIR R4 structure
  const [medication, setMedication] = useState({
    resourceType: "Medication",
    code: {
      coding: [{
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        code: "",
        display: ""
      }],
      text: ""
    },
    status: "active",
    manufacturer: {
      reference: "",
      display: ""
    },
    form: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    ingredient: [{
      itemCodeableConcept: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }]
      },
      strength: {
        numerator: {
          value: "",
          unit: ""
        }
      }
    }],
    batch: {
      lotNumber: "",
      expirationDate: moment().add(1, 'year').format('YYYY-MM-DD')
    },
    note: [{
      text: ""
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set default values on component mount for new medications
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new medications
      setIsEditing(true);
    } else {
      // Viewing existing medication - start in read-only mode
      setIsEditing(false);
    }
  }, [id]);

  // Load medication when subscription is ready
  useEffect(function() {
    if (id && id !== 'new') {
      console.log('[MedicationDetail] Loading medication from collection');
      // Load from client collection (populated by subscription)
      const existingMedication = Medications.findOne({_id: id}) || Medications.findOne({id: id});

      if (existingMedication) {
        console.log('[MedicationDetail] Loaded medication:', {
          _id: existingMedication._id,
          codeText: get(existingMedication, 'code.text'),
          codeCode: get(existingMedication, 'code.coding[0].code'),
          manufacturer: get(existingMedication, 'manufacturer.display')
        });
        setMedication(existingMedication);
        setIsEditing(false); // Start in view mode for existing medications
      } else {
        console.warn('[MedicationDetail] Medication not found in collection:', id);
        setError('Medication not found');
      }
    }
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedMedication = { ...medication };
    set(updatedMedication, path, value);
    setMedication(updatedMedication);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    // Diagnostic logging
    console.log('[MedicationDetail] Saving medication:', {
      codeText: get(medication, 'code.text'),
      codeCode: get(medication, 'code.coding[0].code'),
      codeDisplay: get(medication, 'code.coding[0].display'),
      manufacturer: get(medication, 'manufacturer.display'),
      fullMedication: medication
    });

    try {
      if (id && id !== 'new') {
        // Update existing medication
        await Meteor.callAsync('medications.update', id, medication);
        console.log('Medication updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new medication
        const newId = await Meteor.callAsync('medications.create', medication);
        console.log('Medication created with ID:', newId);
        // Navigate back to medications list for new medications
        navigate('/medications');
      }
    } catch (err) {
      console.error('Error saving medication:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this medication?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('medications.remove', id);
        console.log('Medication deleted successfully');
        navigate('/medications');
      } catch (err) {
        console.error('Error deleting medication:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/medications');
  }

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'entered-in-error', label: 'Entered in Error' }
  ];

  // Get ingredients display string
  function getIngredientsDisplay() {
    const ingredients = get(medication, 'ingredient', []);
    if (ingredients.length > 0) {
      return ingredients.map(ing => {
        return get(ing, 'itemCodeableConcept.coding[0].display', get(ing, 'itemCodeableConcept.text', ''));
      }).join(', ');
    }
    return '';
  }

  // Update ingredients from display string
  function updateIngredientsFromDisplay(displayString) {
    if (!displayString) {
      handleChange('ingredient', []);
      return;
    }
    
    const ingredientNames = displayString.split(',').map(s => s.trim()).filter(s => s);
    const ingredients = ingredientNames.map(name => ({
      itemCodeableConcept: {
        text: name,
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: name
        }]
      }
    }));
    
    handleChange('ingredient', ingredients);
  }

  return (
    <Container id="medicationDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Medication' : 'New Medication'}
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
                {get(medication, '_id') || id}
              </span>
            </Box>
          )}
          
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Medication Name"
              value={get(medication, 'code.text', '')}
              onChange={(e) => handleChange('code.text', e.target.value)}
              helperText="Common name for the medication"
              disabled={!isEditing}
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="codeCode"
                fullWidth
                label="RxNorm Code"
                value={get(medication, 'code.coding[0].code', '')}
                onChange={(e) => handleChange('code.coding[0].code', e.target.value)}
                helperText="RxNorm medication code"
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
              
              <TextField
                id="codeDisplay"
                fullWidth
                label="Display Name"
                value={get(medication, 'code.coding[0].display', '')}
                onChange={(e) => handleChange('code.coding[0].display', e.target.value)}
                helperText="Formal medication name"
                disabled={!isEditing}
              />
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Status</InputLabel>
                <Select
                  id="status"
                  value={get(medication, 'status', 'active')}
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
              
              <TextField
                id="formCode"
                fullWidth
                label="Form Code"
                value={get(medication, 'form.coding[0].code', '')}
                onChange={(e) => handleChange('form.coding[0].code', e.target.value)}
                helperText="SNOMED code"
                disabled={!isEditing}
              />
              
              <TextField
                id="formDisplay"
                fullWidth
                label="Form"
                value={get(medication, 'form.coding[0].display', '') || get(medication, 'form.text', '')}
                onChange={(e) => {
                  handleChange('form.coding[0].display', e.target.value);
                  handleChange('form.text', e.target.value);
                }}
                helperText="e.g., tablet, capsule, liquid"
                disabled={!isEditing}
              />
              
              <TextField
                id="manufacturerDisplay"
                fullWidth
                label="Manufacturer"
                value={get(medication, 'manufacturer.display', '')}
                onChange={(e) => handleChange('manufacturer.display', e.target.value)}
                helperText="Pharmaceutical company"
                disabled={!isEditing}
              />
            </Stack>
            
            <Typography variant="h6" sx={{ mt: 2 }}>Ingredients</Typography>
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="ingredientCode"
                fullWidth
                label="Ingredient Code"
                value={get(medication, 'ingredient[0].itemCodeableConcept.coding[0].code', '')}
                onChange={(e) => handleChange('ingredient[0].itemCodeableConcept.coding[0].code', e.target.value)}
                helperText="SNOMED code"
                disabled={!isEditing}
              />
              
              <TextField
                id="ingredientDisplay"
                fullWidth
                label="Ingredient Display"
                value={get(medication, 'ingredient[0].itemCodeableConcept.coding[0].display', '')}
                onChange={(e) => handleChange('ingredient[0].itemCodeableConcept.coding[0].display', e.target.value)}
                helperText="Active ingredient name"
                disabled={!isEditing}
              />
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="ingredientStrength"
                fullWidth
                label="Ingredient Strength"
                value={get(medication, 'ingredient[0].strength.numerator.value', '')}
                onChange={(e) => handleChange('ingredient[0].strength.numerator.value', e.target.value)}
                helperText="Numeric value"
                disabled={!isEditing}
              />
              
              <TextField
                id="ingredientStrengthUnit"
                fullWidth
                label="Strength Unit"
                value={get(medication, 'ingredient[0].strength.numerator.unit', '')}
                onChange={(e) => handleChange('ingredient[0].strength.numerator.unit', e.target.value)}
                helperText="e.g., mg, ml, units"
                disabled={!isEditing}
              />
            </Stack>
            
            <Typography variant="h6" sx={{ mt: 2 }}>Batch Information</Typography>
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="batchNumber"
                fullWidth
                label="Lot Number"
                value={get(medication, 'batch.lotNumber', '')}
                onChange={(e) => handleChange('batch.lotNumber', e.target.value)}
                disabled={!isEditing}
              />
              
              <TextField
                id="expirationDate"
                fullWidth
                type="date"
                label="Expiration Date"
                value={moment(get(medication, 'batch.expirationDate', '')).format('YYYY-MM-DD')}
                onChange={(e) => handleChange('batch.expirationDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Stack>
            
            <TextField
              id="notesTextarea"
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={get(medication, 'note[0].text', '')}
              onChange={(e) => handleChange('note[0].text', e.target.value)}
              helperText="Additional notes or comments"
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/medications')}
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
                    // Cancel editing and reload original data from collection
                    setIsEditing(false);
                    const existingMedication = Medications.findOne({_id: id});
                    if (existingMedication) {
                      setMedication(existingMedication);
                    }
                  } else {
                    // For new medications, go back
                    navigate('/medications');
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
                id="saveMedicationButton"
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

export default MedicationDetail;