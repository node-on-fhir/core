// /imports/ui-fhir/nutritionProducts/NutritionProductDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  IconButton,
  Tooltip,
  Typography,
  Box
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';

import { NutritionProducts } from '/imports/lib/schemas/SimpleSchemas/NutritionProducts';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import NutritionProductFormView from './NutritionProductFormView';
import NutritionProductPreview from './NutritionProductPreview';

function NutritionProductDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

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

  const isNewNutritionProduct = !id || id === 'new';
  const isExistingNutritionProduct = id && id !== 'new';

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

      if (isExistingNutritionProduct) {
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
    if (!isExistingNutritionProduct) return;

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
    if (isExistingNutritionProduct) {
      setIsEditing(false);
      setError(null);
      // Reload the nutrition product to discard changes
      const existingNutritionProduct = NutritionProducts.findOne({_id: id});
      if (existingNutritionProduct) {
        setNutritionProduct(existingNutritionProduct);
      }
    } else {
      navigate('/nutrition-products');
    }
  }

  // Build the header title
  var headerTitle = 'New Nutrition Product';
  if (isExistingNutritionProduct) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle - hidden for new products */}
        {!isNewNutritionProduct && (
          <Tooltip title="Preview">
            <IconButton
              onClick={function() { setSearchParams({ view: 'page' }); }}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Preview"
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle - hidden for new products (always form) */}
        {!isNewNutritionProduct && (
          <Tooltip title="Form">
            <IconButton
              onClick={function() { setSearchParams({ view: 'form' }); }}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Form"
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Edit toggle — only for existing records */}
        {!isNewNutritionProduct && (
          <Button
              id="editButton"
              onClick={function() { setIsEditing(!isEditing); }}
              variant="outlined"
              size="small"
              startIcon={isEditing ? <LockOpenIcon /> : <LockIcon />}
            >
              {isEditing ? 'Editing' : 'Edit'}
            </Button>
        )}

        {/* Delete — only for existing records */}
        {!isNewNutritionProduct && (
          <Button
              id="deleteButton"
              onClick={handleDelete}
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView() {
    return (
      <>
        <NutritionProductFormView
          resource={nutritionProduct}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
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
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView() {
    return <NutritionProductPreview resource={nutritionProduct} resourceId={id} />;
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="nutritionProductDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default NutritionProductDetail;
