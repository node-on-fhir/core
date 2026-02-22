// /imports/ui-fhir/nutritionIntakes/NutritionIntakeDetail.jsx

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
  Switch
} from '@mui/material';

import { get, set } from 'lodash';
import moment from 'moment';

import { NutritionIntakes } from '/imports/lib/schemas/SimpleSchemas/NutritionIntakes';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function NutritionIntakeDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();

  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to nutrition intakes
  const isSubscriptionReady = useTracker(function(){
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.NutritionIntakes', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('nutritionIntakes.all');
    }
    return handle.ready();
  }, []);

  // Initialize state with proper FHIR R5 structure for NutritionIntake
  const [nutritionIntake, setNutritionIntake] = useState({
    resourceType: "NutritionIntake",
    status: "completed",
    subject: {
      reference: "",
      display: ""
    },
    encounter: {
      reference: "",
      display: ""
    },
    occurrenceDateTime: moment().format('YYYY-MM-DDTHH:mm:ss'),
    recorded: moment().format('YYYY-MM-DDTHH:mm:ss'),
    reportedBoolean: true,
    code: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    consumedItem: [{
      type: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/diet",
          code: "food",
          display: "Food"
        }],
        text: "Food"
      },
      nutritionProduct: {
        concept: {
          coding: [{
            system: "http://snomed.info/sct",
            code: "",
            display: ""
          }],
          text: ""
        }
      },
      amount: {
        value: null,
        unit: "serving",
        system: "http://unitsofmeasure.org",
        code: "{serving}"
      },
      notConsumed: false,
      notConsumedReason: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }],
        text: ""
      }
    }],
    ingredientLabel: [{
      nutrient: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }],
        text: ""
      },
      amount: {
        value: null,
        unit: "g",
        system: "http://unitsofmeasure.org",
        code: "g"
      }
    }],
    performer: [{
      actor: {
        reference: "",
        display: ""
      }
    }],
    location: {
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

  // Set patient name on component mount for new nutrition intakes
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new nutrition intakes
      setIsEditing(true);

      // For new nutrition intakes, set the patient name
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
        patientReference = `Patient/${get(currentUser, 'profile.patientId', '')}`;
      }

      // Set performer to current user
      let performerName = '';
      let performerReference = '';

      if (currentUser) {
        performerName = get(currentUser, 'profile.name.text', '') ||
                     `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                     get(currentUser, 'username', '');
        performerReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }

      setNutritionIntake(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        performer: [{
          actor: {
            reference: performerReference,
            display: performerName
          }
        }]
      }));
    } else {
      // Viewing existing nutrition intake - start in read-only mode
      setIsEditing(false);
    }
  }, [id, selectedPatient, currentUser]);

  // Load nutrition intake if editing
  useEffect(function() {
    async function loadNutritionIntake() {
      if (id && id !== 'new' && isSubscriptionReady) {
        setLoading(true);
        try {
          // First try to find in local collection
          const existingIntake = NutritionIntakes.findOne({_id: id});
          if (existingIntake) {
            setNutritionIntake(existingIntake);
            setIsEditing(false);
          } else {
            // Fall back to method call
            const result = await Meteor.callAsync('nutritionIntakes.get', id);
            if (result) {
              setNutritionIntake(result);
              setIsEditing(false);
            }
          }
        } catch (err) {
          console.error('Error loading nutrition intake:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }

    loadNutritionIntake();
  }, [id, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedNutritionIntake = { ...nutritionIntake };
    set(updatedNutritionIntake, path, value);
    setNutritionIntake(updatedNutritionIntake);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (id && id !== 'new') {
        // Update existing nutrition intake
        await Meteor.callAsync('nutritionIntakes.update', id, nutritionIntake);
        console.log('Nutrition intake updated successfully');

        // Reload the updated data from server
        const updatedIntake = await Meteor.callAsync('nutritionIntakes.get', id);
        if (updatedIntake) {
          setNutritionIntake(updatedIntake);
        }

        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new nutrition intake
        const newId = await Meteor.callAsync('nutritionIntakes.create', nutritionIntake);
        console.log('Nutrition intake created with ID:', newId);
        // Navigate back to nutrition intakes list for new nutrition intakes
        navigate('/nutrition-intakes');
      }
    } catch (err) {
      console.error('Error saving nutrition intake:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;

    if (window.confirm('Are you sure you want to delete this nutrition intake?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('nutritionIntakes.remove', id);
        console.log('Nutrition intake deleted successfully');
        navigate('/nutrition-intakes');
      } catch (err) {
        console.error('Error deleting nutrition intake:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/nutrition-intakes');
  }

  const statusOptions = [
    { code: 'preparation', display: 'Preparation' },
    { code: 'in-progress', display: 'In Progress' },
    { code: 'not-done', display: 'Not Done' },
    { code: 'on-hold', display: 'On Hold' },
    { code: 'stopped', display: 'Stopped' },
    { code: 'completed', display: 'Completed' },
    { code: 'entered-in-error', display: 'Entered in Error' },
    { code: 'unknown', display: 'Unknown' }
  ];

  const consumedItemTypeOptions = [
    { code: 'food', display: 'Food' },
    { code: 'fluid', display: 'Fluid' },
    { code: 'supplement', display: 'Supplement' },
    { code: 'enteral', display: 'Enteral' }
  ];

  return (
    <Container id="nutritionIntakeDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Edit Nutrition Intake' : 'New Nutrition Intake'}
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
              label="Subject (Patient) Name"
              value={get(nutritionIntake, 'subject.display', '')}
              helperText={get(nutritionIntake, 'subject.reference', '') || 'Subject reference will be assigned'}
              disabled // Always disabled to prevent editing
            />

            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel id="statusSelectLabel">Status</InputLabel>
              <Select
                id="statusSelect"
                labelId="statusSelectLabel"
                value={get(nutritionIntake, 'status', 'completed')}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              id="occurrenceDateTimeInput"
              fullWidth
              type="datetime-local"
              label="Occurrence Date/Time"
              value={moment(get(nutritionIntake, 'occurrenceDateTime', '')).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => handleChange('occurrenceDateTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />

            <TextField
              id="recordedDateTimeInput"
              fullWidth
              type="datetime-local"
              label="Recorded Date/Time"
              value={moment(get(nutritionIntake, 'recorded', '')).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => handleChange('recorded', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />

            <Typography variant="h6" sx={{ mt: 2 }}>
              Overall Code
            </Typography>

            <TextField
              id="codeDisplayInput"
              fullWidth
              label="Code Display"
              value={get(nutritionIntake, 'code.text', '')}
              onChange={(e) => {
                handleChange('code.text', e.target.value);
                handleChange('code.coding[0].display', e.target.value);
              }}
              helperText="Overall type of nutrition intake"
              disabled={!isEditing}
            />

            <Typography variant="h6" sx={{ mt: 2 }}>
              Consumed Item
            </Typography>

            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel id="consumedItemTypeSelectLabel">Consumed Item Type</InputLabel>
              <Select
                id="consumedItemTypeSelect"
                labelId="consumedItemTypeSelectLabel"
                value={get(nutritionIntake, 'consumedItem[0].type.coding[0].code', 'food')}
                onChange={(e) => {
                  const option = consumedItemTypeOptions.find(o => o.code === e.target.value);
                  if (option) {
                    handleChange('consumedItem[0].type.coding[0].code', option.code);
                    handleChange('consumedItem[0].type.coding[0].display', option.display);
                    handleChange('consumedItem[0].type.text', option.display);
                  }
                }}
                label="Consumed Item Type"
              >
                {consumedItemTypeOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              id="nutritionProductInput"
              fullWidth
              label="Nutrition Product"
              value={get(nutritionIntake, 'consumedItem[0].nutritionProduct.concept.text', '')}
              onChange={(e) => {
                handleChange('consumedItem[0].nutritionProduct.concept.text', e.target.value);
                handleChange('consumedItem[0].nutritionProduct.concept.coding[0].display', e.target.value);
              }}
              helperText="Name or description of the food/fluid consumed"
              disabled={!isEditing}
            />

            <TextField
              id="amountValueInput"
              fullWidth
              type="number"
              label="Amount"
              value={get(nutritionIntake, 'consumedItem[0].amount.value', '') || ''}
              onChange={(e) => handleChange('consumedItem[0].amount.value', e.target.value ? parseFloat(e.target.value) : null)}
              disabled={!isEditing}
            />

            <TextField
              id="amountUnitInput"
              fullWidth
              label="Amount Unit"
              value={get(nutritionIntake, 'consumedItem[0].amount.unit', 'serving')}
              onChange={(e) => handleChange('consumedItem[0].amount.unit', e.target.value)}
              helperText="e.g., serving, cup, mL, oz"
              disabled={!isEditing}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={get(nutritionIntake, 'consumedItem[0].notConsumed', false)}
                  onChange={(e) => handleChange('consumedItem[0].notConsumed', e.target.checked)}
                  disabled={!isEditing}
                />
              }
              label="Not Consumed"
            />

            {get(nutritionIntake, 'consumedItem[0].notConsumed', false) && (
              <TextField
                id="notConsumedReasonInput"
                fullWidth
                label="Not Consumed Reason"
                value={get(nutritionIntake, 'consumedItem[0].notConsumedReason.text', '')}
                onChange={(e) => {
                  handleChange('consumedItem[0].notConsumedReason.text', e.target.value);
                  handleChange('consumedItem[0].notConsumedReason.coding[0].display', e.target.value);
                }}
                disabled={!isEditing}
              />
            )}

            <Typography variant="h6" sx={{ mt: 2 }}>
              Ingredient Label (Optional)
            </Typography>

            <TextField
              id="nutrientInput"
              fullWidth
              label="Nutrient"
              value={get(nutritionIntake, 'ingredientLabel[0].nutrient.text', '')}
              onChange={(e) => {
                handleChange('ingredientLabel[0].nutrient.text', e.target.value);
                handleChange('ingredientLabel[0].nutrient.coding[0].display', e.target.value);
              }}
              helperText="e.g., Calories, Protein, Carbohydrates"
              disabled={!isEditing}
            />

            <TextField
              id="nutrientAmountInput"
              fullWidth
              type="number"
              label="Nutrient Amount"
              value={get(nutritionIntake, 'ingredientLabel[0].amount.value', '') || ''}
              onChange={(e) => handleChange('ingredientLabel[0].amount.value', e.target.value ? parseFloat(e.target.value) : null)}
              disabled={!isEditing}
            />

            <TextField
              id="nutrientUnitInput"
              fullWidth
              label="Nutrient Unit"
              value={get(nutritionIntake, 'ingredientLabel[0].amount.unit', 'g')}
              onChange={(e) => handleChange('ingredientLabel[0].amount.unit', e.target.value)}
              helperText="e.g., g, mg, kcal"
              disabled={!isEditing}
            />

            <Typography variant="h6" sx={{ mt: 2 }}>
              Additional Information
            </Typography>

            <TextField
              id="performerDisplay"
              fullWidth
              label="Performer Name"
              value={get(nutritionIntake, 'performer[0].actor.display', '')}
              onChange={(e) => handleChange('performer[0].actor.display', e.target.value)}
              helperText={get(nutritionIntake, 'performer[0].actor.reference', '') || 'Who performed the intake'}
              disabled={!isEditing}
            />

            <TextField
              id="locationDisplay"
              fullWidth
              label="Location"
              value={get(nutritionIntake, 'location.display', '')}
              onChange={(e) => handleChange('location.display', e.target.value)}
              helperText="Where the intake occurred"
              disabled={!isEditing}
            />

            <TextField
              id="notesInput"
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={get(nutritionIntake, 'note[0].text', '')}
              onChange={(e) => handleChange('note[0].text', e.target.value)}
              helperText="Additional notes about the nutrition intake"
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button
                onClick={() => navigate('/nutrition-intakes')}
              >
                Back
              </Button>
              <Button
                id="deleteNutritionIntakeButton"
                onClick={handleDelete}
                color="error"
              >
                Delete
              </Button>
              <Button
                id="editNutritionIntakeButton"
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
                    // Reload the nutrition intake to discard changes
                    async function reloadNutritionIntake() {
                      try {
                        const result = await Meteor.callAsync('nutritionIntakes.get', id);
                        if (result) {
                          setNutritionIntake(result);
                        }
                      } catch (err) {
                        console.error('Error reloading nutrition intake:', err);
                      }
                    }
                    reloadNutritionIntake();
                  } else {
                    // For new nutrition intakes, go back
                    navigate('/nutrition-intakes');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              {id && id !== 'new' && (
                <Button
                  id="deleteNutritionIntakeButton"
                  onClick={handleDelete}
                  color="error"
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button
                id="saveNutritionIntakeButton"
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

export default NutritionIntakeDetail;
