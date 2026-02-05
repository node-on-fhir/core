// /imports/ui-fhir/substances/SubstanceDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

import { Substances } from '/imports/lib/schemas/SimpleSchemas/Substances';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// Use Meteor.useNavigate pattern per project requirements
let useNavigate;
Meteor.startup(function() {
  useNavigate = Meteor.useNavigate;
});

function SubstanceDetail(props) {
  const navigate = useNavigate ? useNavigate() : function() {};
  const { id } = useParams();

  // Get current user from session/tracker
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to substance data using ID-based query (optimized)
  const isSubscriptionReady = useTracker(function(){
    if (id && id !== 'new') {
      const query = {
        $or: [
          {'_id': id},
          {'id': id}
        ]
      };
      console.log('[SubstanceDetail] Subscribing with ID query:', query);
      const handle = Meteor.subscribe('autopublish.Substances', query, {});
      return handle.ready();
    }
    return true;
  }, [id]);

  // Initialize state with proper FHIR R4 structure
  const [substance, setSubstance] = useState({
    resourceType: "Substance",
    status: "active",
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/substance-category",
        code: "",
        display: ""
      }],
      text: ""
    }],
    code: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    description: "",
    instance: [{
      identifier: {
        system: "",
        value: ""
      },
      expiry: moment().add(1, 'year').format('YYYY-MM-DD'),
      quantity: {
        value: "",
        unit: ""
      }
    }],
    ingredient: [{
      quantity: {
        numerator: {
          value: "",
          unit: ""
        },
        denominator: {
          value: "",
          unit: ""
        }
      },
      substanceCodeableConcept: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }],
        text: ""
      }
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set default values on component mount for new substances
  useEffect(function() {
    if (!id || id === 'new') {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [id]);

  // Load substance with polling retry when subscription data may be delayed
  useEffect(function() {
    let cancelled = false;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 500; // 500ms between retries

    function tryLoadSubstance() {
      if (cancelled) return;
      if (!id || id === 'new') return;

      console.log('[SubstanceDetail] Attempting to load substance:', id, 'attempt:', retryCount + 1);
      console.log('[SubstanceDetail] Subscription ready:', isSubscriptionReady);
      console.log('[SubstanceDetail] Total substances in collection:', Substances.find({}).count());

      // Try to find in client collection
      let existingSubstance = Substances.findOne({_id: id});

      // Fallback: try finding by id field (FHIR identifier)
      if (!existingSubstance) {
        console.log('[SubstanceDetail] Not found by _id, trying id field');
        existingSubstance = Substances.findOne({id: id});
      }

      if (existingSubstance) {
        console.log('[SubstanceDetail] Loaded substance from client collection:', {
          _id: existingSubstance._id,
          codeText: get(existingSubstance, 'code.text'),
          codeCode: get(existingSubstance, 'code.coding[0].code'),
          status: get(existingSubstance, 'status')
        });
        setSubstance(existingSubstance);
        setIsEditing(false);
        setError(null);
        return;
      }

      // If subscription is ready but data still not found, retry a few times
      if (isSubscriptionReady && retryCount < maxRetries) {
        retryCount++;
        console.log('[SubstanceDetail] Subscription ready but data not found, retrying in', retryDelay, 'ms...');
        setTimeout(tryLoadSubstance, retryDelay);
        return;
      }

      // After retries exhausted, fetch directly from server
      if (isSubscriptionReady) {
        console.log('[SubstanceDetail] Not found after', maxRetries, 'retries, fetching from server via method');
        Meteor.call('substances.get', id, function(methodError, serverSubstance) {
          if (cancelled) return;
          if (methodError) {
            console.error('[SubstanceDetail] Error fetching from server:', methodError);
            setError('Substance not found: ' + methodError.message);
          } else if (serverSubstance) {
            console.log('[SubstanceDetail] Loaded substance from server:', {
              _id: serverSubstance._id,
              codeText: get(serverSubstance, 'code.text'),
              status: get(serverSubstance, 'status')
            });
            setSubstance(serverSubstance);
            setIsEditing(false);
            setError(null);
          } else {
            console.warn('[SubstanceDetail] Substance not found on server:', id);
            setError('Substance not found');
          }
        });
      }
    }

    tryLoadSubstance();

    return function() {
      cancelled = true;
    };
  }, [id, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedSubstance = { ...substance };
    set(updatedSubstance, path, value);
    setSubstance(updatedSubstance);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    console.log('[SubstanceDetail] Saving substance:', {
      codeText: get(substance, 'code.text'),
      codeCode: get(substance, 'code.coding[0].code'),
      codeDisplay: get(substance, 'code.coding[0].display'),
      status: get(substance, 'status'),
      fullSubstance: substance
    });

    try {
      if (id && id !== 'new') {
        await Meteor.callAsync('substances.update', id, substance);
        console.log('Substance updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('substances.create', substance);
        console.log('Substance created with ID:', newId);
        navigate('/substances');
      }
    } catch (err) {
      console.error('Error saving substance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;

    if (window.confirm('Are you sure you want to delete this substance?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('substances.remove', id);
        console.log('Substance deleted successfully');
        navigate('/substances');
      } catch (err) {
        console.error('Error deleting substance:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/substances');
  }

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'entered-in-error', label: 'Entered in Error' }
  ];

  const categoryOptions = [
    { value: 'allergen', label: 'Allergen' },
    { value: 'biological', label: 'Biological Substance' },
    { value: 'body', label: 'Body Substance' },
    { value: 'chemical', label: 'Chemical' },
    { value: 'food', label: 'Dietary Substance' },
    { value: 'drug', label: 'Drug or Medicament' },
    { value: 'material', label: 'Material' }
  ];

  return (
    <Container id="substanceDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Edit Substance' : 'New Substance'}
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
                {get(substance, '_id') || id}
              </span>
            </Box>
          )}

          <Stack spacing={3}>
            <TextField
              id="codeText"
              fullWidth
              label="Substance Name"
              value={get(substance, 'code.text', '')}
              onChange={(e) => handleChange('code.text', e.target.value)}
              helperText="Common name for the substance"
              disabled={!isEditing}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                id="codeCode"
                fullWidth
                label="SNOMED Code"
                value={get(substance, 'code.coding[0].code', '')}
                onChange={(e) => handleChange('code.coding[0].code', e.target.value)}
                helperText="SNOMED CT code"
                disabled={!isEditing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Lookup SNOMED codes">
                        <IconButton
                          onClick={() => window.open('https://browser.ihtsdotools.org/', '_blank')}
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
                value={get(substance, 'code.coding[0].display', '')}
                onChange={(e) => handleChange('code.coding[0].display', e.target.value)}
                helperText="Formal substance name"
                disabled={!isEditing}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Status</InputLabel>
                <Select
                  id="status"
                  value={get(substance, 'status', 'active')}
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
                <InputLabel>Category</InputLabel>
                <Select
                  id="categorySelect"
                  value={get(substance, 'category[0].coding[0].code', '')}
                  onChange={(e) => {
                    const selectedOption = categoryOptions.find(opt => opt.value === e.target.value);
                    handleChange('category[0].coding[0].code', e.target.value);
                    handleChange('category[0].coding[0].display', selectedOption?.label || '');
                    handleChange('category[0].text', selectedOption?.label || '');
                  }}
                  label="Category"
                >
                  {categoryOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <TextField
              id="description"
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={get(substance, 'description', '')}
              onChange={(e) => handleChange('description', e.target.value)}
              helperText="Textual description of the substance"
              disabled={!isEditing}
            />

            <Typography variant="h6" sx={{ mt: 2 }}>Instance Information</Typography>

            <Stack direction="row" spacing={2}>
              <TextField
                id="instanceIdentifier"
                fullWidth
                label="Instance Identifier"
                value={get(substance, 'instance[0].identifier.value', '')}
                onChange={(e) => handleChange('instance[0].identifier.value', e.target.value)}
                helperText="Lot number or batch identifier"
                disabled={!isEditing}
              />

              <TextField
                id="instanceExpiry"
                fullWidth
                type="date"
                label="Expiry Date"
                value={moment(get(substance, 'instance[0].expiry', '')).format('YYYY-MM-DD')}
                onChange={(e) => handleChange('instance[0].expiry', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                id="instanceQuantityValue"
                fullWidth
                label="Quantity Value"
                type="number"
                value={get(substance, 'instance[0].quantity.value', '')}
                onChange={(e) => handleChange('instance[0].quantity.value', e.target.value)}
                helperText="Amount available"
                disabled={!isEditing}
              />

              <TextField
                id="instanceQuantityUnit"
                fullWidth
                label="Quantity Unit"
                value={get(substance, 'instance[0].quantity.unit', '')}
                onChange={(e) => handleChange('instance[0].quantity.unit', e.target.value)}
                helperText="e.g., mg, ml, g"
                disabled={!isEditing}
              />
            </Stack>

            <Typography variant="h6" sx={{ mt: 2 }}>Ingredient Information</Typography>

            <Stack direction="row" spacing={2}>
              <TextField
                id="ingredientCode"
                fullWidth
                label="Ingredient Code"
                value={get(substance, 'ingredient[0].substanceCodeableConcept.coding[0].code', '')}
                onChange={(e) => handleChange('ingredient[0].substanceCodeableConcept.coding[0].code', e.target.value)}
                helperText="SNOMED code for ingredient"
                disabled={!isEditing}
              />

              <TextField
                id="ingredientDisplay"
                fullWidth
                label="Ingredient Name"
                value={get(substance, 'ingredient[0].substanceCodeableConcept.coding[0].display', '')}
                onChange={(e) => handleChange('ingredient[0].substanceCodeableConcept.coding[0].display', e.target.value)}
                helperText="Name of ingredient substance"
                disabled={!isEditing}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                id="ingredientNumeratorValue"
                fullWidth
                label="Ratio Numerator"
                type="number"
                value={get(substance, 'ingredient[0].quantity.numerator.value', '')}
                onChange={(e) => handleChange('ingredient[0].quantity.numerator.value', e.target.value)}
                helperText="Amount of ingredient"
                disabled={!isEditing}
              />

              <TextField
                id="ingredientNumeratorUnit"
                fullWidth
                label="Numerator Unit"
                value={get(substance, 'ingredient[0].quantity.numerator.unit', '')}
                onChange={(e) => handleChange('ingredient[0].quantity.numerator.unit', e.target.value)}
                helperText="e.g., mg"
                disabled={!isEditing}
              />

              <TextField
                id="ingredientDenominatorValue"
                fullWidth
                label="Ratio Denominator"
                type="number"
                value={get(substance, 'ingredient[0].quantity.denominator.value', '')}
                onChange={(e) => handleChange('ingredient[0].quantity.denominator.value', e.target.value)}
                helperText="Per this amount"
                disabled={!isEditing}
              />

              <TextField
                id="ingredientDenominatorUnit"
                fullWidth
                label="Denominator Unit"
                value={get(substance, 'ingredient[0].quantity.denominator.unit', '')}
                onChange={(e) => handleChange('ingredient[0].quantity.denominator.unit', e.target.value)}
                helperText="e.g., ml, tablet"
                disabled={!isEditing}
              />
            </Stack>
          </Stack>
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button
                onClick={() => navigate('/substances')}
              >
                Back
              </Button>
              <Button
                onClick={handleDelete}
                color="error"
                disabled={loading}
              >
                Delete
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
                    setIsEditing(false);
                    const existingSubstance = Substances.findOne({_id: id});
                    if (existingSubstance) {
                      setSubstance(existingSubstance);
                    }
                  } else {
                    navigate('/substances');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                id="saveSubstanceButton"
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

export default SubstanceDetail;
