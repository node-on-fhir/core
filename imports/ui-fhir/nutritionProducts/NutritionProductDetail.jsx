// /imports/ui-fhir/nutritionProducts/NutritionProductDetail.jsx

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

import { NutritionProducts } from '/imports/lib/schemas/SimpleSchemas/NutritionProducts';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function NutritionProductDetail(props) {
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

  // Subscribe to nutrition product data using ID-based query (optimized)
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    if (id && id !== 'new') {
      // Use ID-based query to take advantage of optimization in autopublish.js
      const query = {
        $or: [
          {'_id': id},
          {'id': id}
        ]
      };
      console.log('[NutritionProductDetail] Subscribing with ID query:', query);
      const handle = Meteor.subscribe('autopublish.NutritionProducts', {}, {});
      return handle.ready();
    }
    return true; // No subscription needed for new nutrition products
  }, [id]);

  // Initialize state with proper FHIR R4 structure
  const [nutritionProduct, setNutritionProduct] = useState({
    resourceType: "NutritionProduct",
    code: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    status: "active",
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/nutrition-product-category",
        code: "",
        display: ""
      }],
      text: ""
    }],
    manufacturer: [{
      display: ""
    }],
    productCharacteristic: [{
      type: {
        coding: [{
          system: "http://hl7.org/fhir/nutrition-product-characteristic-type",
          code: "description",
          display: "Description"
        }],
        text: "Description"
      },
      valueString: ""
    }],
    note: [{
      text: ""
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setNutritionProduct(function(prev) {
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

  // Set default values on component mount for new nutrition products
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new nutrition products
      setIsEditing(true);
    } else {
      // Viewing existing nutrition product - start in read-only mode
      setIsEditing(false);
    }
  }, [id]);

  // Load nutrition product from collection
  useEffect(function() {
    if (id && id !== 'new') {
      console.log('[NutritionProductDetail] Loading nutrition product from collection');
      // Load from client collection (populated by subscription)
      const existingNutritionProduct = NutritionProducts.findOne({_id: id}) || NutritionProducts.findOne({id: id});

      if (existingNutritionProduct) {
        console.log('[NutritionProductDetail] Loaded nutrition product:', {
          _id: existingNutritionProduct._id,
          codeText: get(existingNutritionProduct, 'code.text'),
          codeCode: get(existingNutritionProduct, 'code.coding[0].code'),
          manufacturer: get(existingNutritionProduct, 'manufacturer[0].display')
        });
        setNutritionProduct(existingNutritionProduct);
        setIsEditing(false); // Start in view mode for existing nutrition products
      } else {
        console.warn('[NutritionProductDetail] Nutrition product not found in collection:', id);
        setError('Nutrition product not found');
      }
    }
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedNutritionProduct = { ...nutritionProduct };
    set(updatedNutritionProduct, path, value);
    setNutritionProduct(updatedNutritionProduct);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedNutritionProduct);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    // Diagnostic logging
    console.log('[NutritionProductDetail] Saving nutrition product:', {
      codeText: get(nutritionProduct, 'code.text'),
      codeCode: get(nutritionProduct, 'code.coding[0].code'),
      codeDisplay: get(nutritionProduct, 'code.coding[0].display'),
      manufacturer: get(nutritionProduct, 'manufacturer[0].display'),
      fullNutritionProduct: nutritionProduct
    });

    try {
      // Prepare data for save - use flat structure for methods
      const dataToSave = {
        status: get(nutritionProduct, 'status', 'active'),
        codeCode: get(nutritionProduct, 'code.coding[0].code', ''),
        codeDisplay: get(nutritionProduct, 'code.text', '') || get(nutritionProduct, 'code.coding[0].display', ''),
        categoryCode: get(nutritionProduct, 'category[0].coding[0].code', ''),
        categoryDisplay: get(nutritionProduct, 'category[0].text', '') || get(nutritionProduct, 'category[0].coding[0].display', ''),
        manufacturerDisplay: get(nutritionProduct, 'manufacturer[0].display', ''),
        description: get(nutritionProduct, 'productCharacteristic[0].valueString', ''),
        notes: get(nutritionProduct, 'note[0].text', '')
      };

      if (id && id !== 'new') {
        // Update existing nutrition product
        await Meteor.callAsync('nutritionProducts.update', id, dataToSave);
        console.log('Nutrition product updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new nutrition product
        const newId = await Meteor.callAsync('nutritionProducts.create', dataToSave);
        console.log('Nutrition product created with ID:', newId);
        // Navigate back to nutrition products list for new nutrition products
        navigate('/nutrition-products');
      }
    } catch (err) {
      console.error('Error saving nutrition product:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;

    if (window.confirm('Are you sure you want to delete this nutrition product?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('nutritionProducts.remove', id);
        console.log('Nutrition product deleted successfully');
        navigate('/nutrition-products');
      } catch (err) {
        console.error('Error deleting nutrition product:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/nutrition-products');
  }

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'entered-in-error', label: 'Entered in Error' }
  ];

  const categoryOptions = [
    { value: 'enteral-formula', label: 'Enteral Formula' },
    { value: 'infant-formula', label: 'Infant Formula' },
    { value: 'oral-supplement', label: 'Oral Supplement' },
    { value: 'parenteral-nutrition', label: 'Parenteral Nutrition' },
    { value: 'food', label: 'Food' }
  ];

  if (isEmbedded) {
    return (
      <Stack spacing={3}>
        <TextField
          id="codeText"
          fullWidth
          label="Product Name"
          value={get(nutritionProduct, 'code.text', '')}
          onChange={(e) => handleChange('code.text', e.target.value)}
          helperText="Common name for the nutrition product"
          disabled={!isEditing}
        />

        <Stack direction="row" spacing={2}>
          <TextField
            id="codeCode"
            fullWidth
            label="SNOMED CT Code"
            value={get(nutritionProduct, 'code.coding[0].code', '')}
            onChange={(e) => handleChange('code.coding[0].code', e.target.value)}
            helperText="SNOMED CT nutrition product code"
            disabled={!isEditing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Lookup SNOMED CT codes">
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
            value={get(nutritionProduct, 'code.coding[0].display', '')}
            onChange={(e) => handleChange('code.coding[0].display', e.target.value)}
            helperText="Formal product name"
            disabled={!isEditing}
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Status</InputLabel>
            <Select
              id="status"
              value={get(nutritionProduct, 'status', 'active')}
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
              id="category"
              value={get(nutritionProduct, 'category[0].coding[0].code', '')}
              onChange={(e) => {
                handleChange('category[0].coding[0].code', e.target.value);
                const selectedCategory = categoryOptions.find(opt => opt.value === e.target.value);
                if (selectedCategory) {
                  handleChange('category[0].coding[0].display', selectedCategory.label);
                  handleChange('category[0].text', selectedCategory.label);
                }
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
          id="manufacturerDisplay"
          fullWidth
          label="Manufacturer"
          value={get(nutritionProduct, 'manufacturer[0].display', '')}
          onChange={(e) => handleChange('manufacturer[0].display', e.target.value)}
          helperText="Company that produces this product"
          disabled={!isEditing}
        />

        <TextField
          id="description"
          fullWidth
          multiline
          rows={3}
          label="Description"
          value={get(nutritionProduct, 'productCharacteristic[0].valueString', '')}
          onChange={(e) => handleChange('productCharacteristic[0].valueString', e.target.value)}
          helperText="Detailed description of the product"
          disabled={!isEditing}
        />

        <TextField
          id="notesTextarea"
          fullWidth
          multiline
          rows={2}
          label="Notes"
          value={get(nutritionProduct, 'note[0].text', '')}
          onChange={(e) => handleChange('note[0].text', e.target.value)}
          helperText="Additional notes or comments"
          disabled={!isEditing}
        />
      </Stack>
    );
  }

  return (
    <Container id="nutritionProductDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Edit Nutrition Product' : 'New Nutrition Product'}
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
                {get(nutritionProduct, '_id') || id}
              </span>
            </Box>
          )}

          <Stack spacing={3}>
            <TextField
              id="codeText"
              fullWidth
              label="Product Name"
              value={get(nutritionProduct, 'code.text', '')}
              onChange={(e) => handleChange('code.text', e.target.value)}
              helperText="Common name for the nutrition product"
              disabled={!isEditing}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                id="codeCode"
                fullWidth
                label="SNOMED CT Code"
                value={get(nutritionProduct, 'code.coding[0].code', '')}
                onChange={(e) => handleChange('code.coding[0].code', e.target.value)}
                helperText="SNOMED CT nutrition product code"
                disabled={!isEditing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Lookup SNOMED CT codes">
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
                value={get(nutritionProduct, 'code.coding[0].display', '')}
                onChange={(e) => handleChange('code.coding[0].display', e.target.value)}
                helperText="Formal product name"
                disabled={!isEditing}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Status</InputLabel>
                <Select
                  id="status"
                  value={get(nutritionProduct, 'status', 'active')}
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
                  id="category"
                  value={get(nutritionProduct, 'category[0].coding[0].code', '')}
                  onChange={(e) => {
                    handleChange('category[0].coding[0].code', e.target.value);
                    // Find the display for this code
                    const selectedCategory = categoryOptions.find(opt => opt.value === e.target.value);
                    if (selectedCategory) {
                      handleChange('category[0].coding[0].display', selectedCategory.label);
                      handleChange('category[0].text', selectedCategory.label);
                    }
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
              id="manufacturerDisplay"
              fullWidth
              label="Manufacturer"
              value={get(nutritionProduct, 'manufacturer[0].display', '')}
              onChange={(e) => handleChange('manufacturer[0].display', e.target.value)}
              helperText="Company that produces this product"
              disabled={!isEditing}
            />

            <TextField
              id="description"
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={get(nutritionProduct, 'productCharacteristic[0].valueString', '')}
              onChange={(e) => handleChange('productCharacteristic[0].valueString', e.target.value)}
              helperText="Detailed description of the product"
              disabled={!isEditing}
            />

            <TextField
              id="notesTextarea"
              fullWidth
              multiline
              rows={2}
              label="Notes"
              value={get(nutritionProduct, 'note[0].text', '')}
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
                onClick={() => navigate('/nutrition-products')}
              >
                Back
              </Button>
              <Button
                id="deleteButton"
                onClick={handleDelete}
                color="error"
                disabled={loading}
              >
                Delete
              </Button>
              <Button
                id="editButton"
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
                    const existingNutritionProduct = NutritionProducts.findOne({_id: id});
                    if (existingNutritionProduct) {
                      setNutritionProduct(existingNutritionProduct);
                    }
                  } else {
                    // For new nutrition products, go back
                    navigate('/nutrition-products');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                id="saveNutritionProductButton"
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

export default NutritionProductDetail;
