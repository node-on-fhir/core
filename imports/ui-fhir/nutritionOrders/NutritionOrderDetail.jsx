// /imports/ui-fhir/nutritionOrders/NutritionOrderDetail.jsx

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

import { NutritionOrders } from '/imports/lib/schemas/SimpleSchemas/NutritionOrders';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function NutritionOrderDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);
  
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  // Subscribe to nutrition orders
  const isSubscriptionReady = useTracker(function(){
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('autopublish.NutritionOrders', {}, {});
    } else {
      handle = Meteor.subscribe('nutritionOrders.all');
    }
    return handle.ready();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [nutritionOrder, setNutritionOrder] = useState({
    resourceType: "NutritionOrder",
    status: "active",
    intent: "order",
    patient: {
      reference: "",
      display: ""
    },
    encounter: {
      reference: "",
      display: ""
    },
    dateTime: moment().format('YYYY-MM-DDTHH:mm:ss'),
    orderer: {
      reference: "",
      display: ""
    },
    allergyIntolerance: [],
    foodPreferenceModifier: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/diet",
        code: "",
        display: ""
      }],
      text: ""
    }],
    excludeFoodModifier: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/diet",
        code: "",
        display: ""
      }],
      text: ""
    }],
    oralDiet: {
      type: [{
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }],
        text: ""
      }],
      schedule: [{
        repeat: {
          boundsPeriod: {
            start: moment().format('YYYY-MM-DD'),
            end: moment().add(7, 'days').format('YYYY-MM-DD')
          },
          frequency: 3,
          period: 1,
          periodUnit: "d"
        }
      }],
      texture: [{
        modifier: {
          coding: [{
            system: "http://snomed.info/sct",
            code: "",
            display: ""
          }]
        }
      }],
      fluidConsistencyType: [{
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }]
      }],
      instruction: ""
    },
    supplement: [{
      type: [{
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }],
        text: ""
      }],
      productName: "",
      schedule: [{
        repeat: {
          frequency: 2,
          period: 1,
          periodUnit: "d"
        }
      }],
      quantity: {
        value: 1,
        unit: "bottle"
      },
      instruction: ""
    }],
    enteralFormula: {
      baseFormulaType: [{
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }],
        text: ""
      }],
      baseFormulaProductName: "",
      additiveType: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "",
          display: ""
        }]
      }],
      caloricDensity: {
        value: null,
        unit: "kcal/mL",
        system: "http://unitsofmeasure.org",
        code: "kcal/mL"
      },
      routeOfAdministration: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-RouteOfAdministration",
          code: "",
          display: ""
        }]
      },
      administration: [{
        schedule: {
          repeat: {
            frequency: 1,
            period: 1,
            periodUnit: "d"
          }
        },
        quantity: {
          value: null,
          unit: "mL/hr"
        },
        rate: {
          quantity: {
            value: null,
            unit: "mL/hr"
          }
        }
      }],
      maxVolumeToDeliver: {
        value: null,
        unit: "mL",
        system: "http://unitsofmeasure.org",
        code: "mL"
      },
      administrationInstruction: ""
    },
    note: [{
      text: ""
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set patient name and orderer on component mount for new nutrition orders
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new nutrition orders
      setIsEditing(true);
      
      // For new nutrition orders, set the patient name
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
      
      // Set orderer to current user
      let ordererName = '';
      let ordererReference = '';
      
      if (currentUser) {
        ordererName = get(currentUser, 'profile.name.text', '') ||
                     `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                     get(currentUser, 'username', '');
        ordererReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }
      
      setNutritionOrder(prev => ({
        ...prev,
        patient: {
          reference: patientReference,
          display: patientName
        },
        orderer: {
          reference: ordererReference,
          display: ordererName
        }
      }));
    } else {
      // Viewing existing nutrition order - start in read-only mode
      setIsEditing(false);
    }
  }, [id, selectedPatient, currentUser]);

  // Load nutrition order if editing
  useEffect(function() {
    async function loadNutritionOrder() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          // First try to find in local collection
          const existingOrder = NutritionOrders.findOne({_id: id}) || NutritionOrders.findOne({id: id});
          if (existingOrder) {
            setNutritionOrder(existingOrder);
            setIsEditing(false);
          } else {
            // Fall back to method call
            const result = await Meteor.callAsync('nutritionOrders.get', id);
            if (result) {
              setNutritionOrder(result);
              setIsEditing(false);
            }
          }
        } catch (err) {
          console.error('Error loading nutrition order:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadNutritionOrder();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedNutritionOrder = { ...nutritionOrder };
    set(updatedNutritionOrder, path, value);
    setNutritionOrder(updatedNutritionOrder);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing nutrition order
        await Meteor.callAsync('nutritionOrders.update', id, nutritionOrder);
        console.log('Nutrition order updated successfully');
        
        // Reload the updated data from server
        const updatedOrder = await Meteor.callAsync('nutritionOrders.get', id);
        if (updatedOrder) {
          setNutritionOrder(updatedOrder);
        }
        
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new nutrition order
        const newId = await Meteor.callAsync('nutritionOrders.create', nutritionOrder);
        console.log('Nutrition order created with ID:', newId);
        // Navigate back to nutrition orders list for new nutrition orders
        navigate('/nutrition-orders');
      }
    } catch (err) {
      console.error('Error saving nutrition order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this nutrition order?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('nutritionOrders.remove', id);
        console.log('Nutrition order deleted successfully');
        navigate('/nutrition-orders');
      } catch (err) {
        console.error('Error deleting nutrition order:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/nutrition-orders');
  }

  const statusOptions = [
    { code: 'draft', display: 'Draft' },
    { code: 'active', display: 'Active' },
    { code: 'on-hold', display: 'On Hold' },
    { code: 'revoked', display: 'Revoked' },
    { code: 'completed', display: 'Completed' },
    { code: 'entered-in-error', display: 'Entered in Error' },
    { code: 'unknown', display: 'Unknown' }
  ];

  const intentOptions = [
    { code: 'proposal', display: 'Proposal' },
    { code: 'plan', display: 'Plan' },
    { code: 'directive', display: 'Directive' },
    { code: 'order', display: 'Order' },
    { code: 'original-order', display: 'Original Order' },
    { code: 'reflex-order', display: 'Reflex Order' },
    { code: 'filler-order', display: 'Filler Order' },
    { code: 'instance-order', display: 'Instance Order' },
    { code: 'option', display: 'Option' }
  ];

  const dietTypeOptions = [
    { code: '422972009', display: 'Advance diet as tolerated' },
    { code: '33489005', display: 'Clear liquid diet' },
    { code: '422853006', display: 'Diabetic diet' },
    { code: '435801000124105', display: 'Full liquid diet' },
    { code: '160675004', display: 'General diet' },
    { code: '38226001', display: 'Low fat diet' },
    { code: '182955004', display: 'Low protein diet' },
    { code: '386619000', display: 'Low sodium diet' },
    { code: '182954000', display: 'Mechanical soft diet' },
    { code: '229912004', display: 'NPO (Nothing by mouth)' },
    { code: '229913009', display: 'Pureed diet' },
    { code: '223456000', display: 'Soft diet' }
  ];

  const textureOptions = [
    { code: '228055009', display: 'Liquidized food' },
    { code: '439091000124107', display: 'Easy to chew food' },
    { code: '228059003', display: 'Soft food' },
    { code: '441761000124103', display: 'Minced food' },
    { code: '441751000124100', display: 'Chopped food' }
  ];

  const fluidConsistencyOptions = [
    { code: '439081000124108', display: 'Thin liquid' },
    { code: '439111000124108', display: 'Nectar thick liquid' },
    { code: '439101000124109', display: 'Honey thick liquid' },
    { code: '439091000124107', display: 'Pudding thick liquid' }
  ];

  return (
    <Container id="nutritionOrderDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Nutrition Order' : 'New Nutrition Order'}
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
              id="patientDisplay"
              fullWidth
              label="Patient Name"
              value={get(nutritionOrder, 'patient.display', '')}
              helperText={get(nutritionOrder, 'patient.reference', '') || 'Patient reference will be assigned'}
              disabled // Always disabled to prevent editing
            />
            
            <TextField
              id="ordererDisplay"
              fullWidth
              label="Orderer Name"
              value={get(nutritionOrder, 'orderer.display', '')}
              onChange={(e) => handleChange('orderer.display', e.target.value)}
              helperText={get(nutritionOrder, 'orderer.reference', '') || 'Orderer reference will be assigned'}
              disabled={!isEditing}
            />
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel id="statusSelectLabel">Status</InputLabel>
              <Select
                id="statusSelect"
                labelId="statusSelectLabel"
                value={get(nutritionOrder, 'status', 'active')}
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
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel id="intentSelectLabel">Intent</InputLabel>
              <Select
                id="intentSelect"
                labelId="intentSelectLabel"
                value={get(nutritionOrder, 'intent', 'order')}
                onChange={(e) => handleChange('intent', e.target.value)}
                label="Intent"
              >
                {intentOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              id="dateTimeInput"
              fullWidth
              type="datetime-local"
              label="Order Date/Time"
              value={moment(get(nutritionOrder, 'dateTime', '')).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => handleChange('dateTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <Typography variant="h6" sx={{ mt: 2 }}>
              Oral Diet
            </Typography>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel id="dietTypeSelectLabel">Diet Type</InputLabel>
              <Select
                id="dietTypeSelect"
                labelId="dietTypeSelectLabel"
                value={get(nutritionOrder, 'oralDiet.type[0].coding[0].code', '')}
                onChange={(e) => {
                  const option = dietTypeOptions.find(o => o.code === e.target.value);
                  if (option) {
                    handleChange('oralDiet.type[0].coding[0].code', option.code);
                    handleChange('oralDiet.type[0].coding[0].display', option.display);
                    handleChange('oralDiet.type[0].text', option.display);
                  }
                }}
                label="Diet Type"
              >
                {dietTypeOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Texture Modifier</InputLabel>
              <Select
                value={get(nutritionOrder, 'oralDiet.texture[0].modifier.coding[0].code', '')}
                onChange={(e) => {
                  const option = textureOptions.find(o => o.code === e.target.value);
                  if (option) {
                    handleChange('oralDiet.texture[0].modifier.coding[0].code', option.code);
                    handleChange('oralDiet.texture[0].modifier.coding[0].display', option.display);
                  }
                }}
                label="Texture Modifier"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {textureOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Fluid Consistency</InputLabel>
              <Select
                value={get(nutritionOrder, 'oralDiet.fluidConsistencyType[0].coding[0].code', '')}
                onChange={(e) => {
                  const option = fluidConsistencyOptions.find(o => o.code === e.target.value);
                  if (option) {
                    handleChange('oralDiet.fluidConsistencyType[0].coding[0].code', option.code);
                    handleChange('oralDiet.fluidConsistencyType[0].coding[0].display', option.display);
                  }
                }}
                label="Fluid Consistency"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {fluidConsistencyOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              type="number"
              label="Frequency (times per day)"
              value={get(nutritionOrder, 'oralDiet.schedule[0].repeat.frequency', 3)}
              onChange={(e) => handleChange('oralDiet.schedule[0].repeat.frequency', parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 1, max: 10 } }}
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={moment(get(nutritionOrder, 'oralDiet.schedule[0].repeat.boundsPeriod.start', '')).format('YYYY-MM-DD')}
              onChange={(e) => handleChange('oralDiet.schedule[0].repeat.boundsPeriod.start', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={moment(get(nutritionOrder, 'oralDiet.schedule[0].repeat.boundsPeriod.end', '')).format('YYYY-MM-DD')}
              onChange={(e) => handleChange('oralDiet.schedule[0].repeat.boundsPeriod.end', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <TextField
              id="instructionsInput"
              fullWidth
              multiline
              rows={3}
              label="Instructions"
              value={get(nutritionOrder, 'oralDiet.instruction', '')}
              onChange={(e) => handleChange('oralDiet.instruction', e.target.value)}
              helperText="Special instructions for the diet"
              disabled={!isEditing}
            />
            
            <Typography variant="h6" sx={{ mt: 2 }}>
              Supplement
            </Typography>
            
            <TextField
              id="supplementTypeInput"
              fullWidth
              label="Supplement Type"
              value={get(nutritionOrder, 'supplement[0].type[0].text', '')}
              onChange={(e) => {
                handleChange('supplement[0].type[0].text', e.target.value);
                handleChange('supplement[0].type[0].coding[0].display', e.target.value);
              }}
              disabled={!isEditing}
            />
            
            <TextField
              id="supplementProductNameInput"
              fullWidth
              label="Product Name"
              value={get(nutritionOrder, 'supplement[0].productName', '')}
              onChange={(e) => handleChange('supplement[0].productName', e.target.value)}
              disabled={!isEditing}
            />
            
            <TextField
              id="supplementInstructionInput"
              fullWidth
              multiline
              rows={2}
              label="Supplement Instructions"
              value={get(nutritionOrder, 'supplement[0].instruction', '')}
              onChange={(e) => handleChange('supplement[0].instruction', e.target.value)}
              disabled={!isEditing}
            />
            
            <Typography variant="h6" sx={{ mt: 2 }}>
              Enteral Formula
            </Typography>
            
            <TextField
              id="enteralFormulaTypeInput"
              fullWidth
              label="Formula Type"
              value={get(nutritionOrder, 'enteralFormula.baseFormulaType[0].text', '')}
              onChange={(e) => {
                handleChange('enteralFormula.baseFormulaType[0].text', e.target.value);
                handleChange('enteralFormula.baseFormulaType[0].coding[0].display', e.target.value);
              }}
              disabled={!isEditing}
            />
            
            <TextField
              id="enteralFormulaProductNameInput"
              fullWidth
              label="Formula Product Name"
              value={get(nutritionOrder, 'enteralFormula.baseFormulaProductName', '')}
              onChange={(e) => handleChange('enteralFormula.baseFormulaProductName', e.target.value)}
              disabled={!isEditing}
            />
            
            <Typography variant="h6" sx={{ mt: 2 }}>
              Additional Information
            </Typography>
            
            <TextField
              id="allergyIntoleranceInput"
              fullWidth
              label="Allergy/Intolerance"
              value={get(nutritionOrder, 'allergyIntolerance[0]', '')}
              onChange={(e) => handleChange('allergyIntolerance[0]', e.target.value)}
              helperText="Known allergies or intolerances"
              disabled={!isEditing}
            />
            
            <TextField
              id="foodPreferenceModifierInput"
              fullWidth
              label="Food Preference Modifier"
              value={get(nutritionOrder, 'foodPreferenceModifier[0].text', '')}
              onChange={(e) => {
                handleChange('foodPreferenceModifier[0].text', e.target.value);
                handleChange('foodPreferenceModifier[0].coding[0].display', e.target.value);
              }}
              helperText="e.g., Vegetarian, Kosher, Halal"
              disabled={!isEditing}
            />
            
            <TextField
              id="excludeFoodModifierInput"
              fullWidth
              label="Exclude Food Modifier"
              value={get(nutritionOrder, 'excludeFoodModifier[0].text', '')}
              onChange={(e) => {
                handleChange('excludeFoodModifier[0].text', e.target.value);
                handleChange('excludeFoodModifier[0].coding[0].display', e.target.value);
              }}
              helperText="Foods to exclude from the diet"
              disabled={!isEditing}
            />
            
            <TextField
              id="notesInput"
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={get(nutritionOrder, 'note[0].text', '')}
              onChange={(e) => handleChange('note[0].text', e.target.value)}
              helperText="Additional notes about the nutrition order"
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/nutrition-orders')}
              >
                Back
              </Button>
              <Button 
                id="deleteNutritionOrderButton"
                onClick={handleDelete}
                color="error"
              >
                Delete
              </Button>
              <Button 
                id="editNutritionOrderButton"
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
                    // Reload the nutrition order to discard changes
                    async function reloadNutritionOrder() {
                      try {
                        const result = await Meteor.callAsync('nutritionOrders.get', id);
                        if (result) {
                          setNutritionOrder(result);
                        }
                      } catch (err) {
                        console.error('Error reloading nutrition order:', err);
                      }
                    }
                    reloadNutritionOrder();
                  } else {
                    // For new nutrition orders, go back
                    navigate('/nutrition-orders');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              {id && id !== 'new' && (
                <Button 
                  id="deleteNutritionOrderButton"
                  onClick={handleDelete}
                  color="error"
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button 
                id="saveNutritionOrderButton"
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

export default NutritionOrderDetail;