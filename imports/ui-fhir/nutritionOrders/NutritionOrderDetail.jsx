// /imports/ui-fhir/nutritionOrders/NutritionOrderDetail.jsx

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
import moment from 'moment';

import { NutritionOrders } from '/imports/lib/schemas/SimpleSchemas/NutritionOrders';
import { FhirUtilities } from '../../lib/FhirUtilities';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import NutritionOrderFormView from './NutritionOrderFormView';
import NutritionOrderPreview from './NutritionOrderPreview';

function NutritionOrderDetail(props) {
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

  // Subscribe to nutrition orders
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    let query = {};
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      if(fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }

    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('autopublish.NutritionOrders', query, {});
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

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setNutritionOrder(function(prev) {
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
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewRecord = !id || id === 'new';

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

      setNutritionOrder(function(prev) {
        return {
          ...prev,
          patient: {
            reference: patientReference,
            display: patientName
          },
          orderer: {
            reference: ordererReference,
            display: ordererName
          }
        };
      });
    } else {
      // Viewing existing nutrition order - start in read-only mode
      setIsEditing(false);
    }
  }, [id]);

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
          } else {
            // Fall back to method call
            const result = await Meteor.callAsync('nutritionOrders.get', id);
            if (result) {
              setNutritionOrder(result);
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

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedNutritionOrder);
    }
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
    if (id && id !== 'new') {
      // Cancel editing and reload original data
      setIsEditing(false);
      setError(null);
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
      navigate('/nutrition-orders');
    }
  }

  // Build the header title
  var headerTitle = 'New Nutrition Order';
  if (!isNewRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle -- hidden for new records */}
        {!isNewRecord && (
          <Tooltip title="Preview">
            <IconButton
              onClick={function() { setSearchParams({ view: 'page' }); }}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle -- hidden for new records (always form) */}
        {!isNewRecord && (
          <Tooltip title="Form">
            <IconButton
              onClick={function() { setSearchParams({ view: 'form' }); }}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle -- only for existing records */}
        {!isNewRecord && (
          <Button
              id="editNutritionOrderButton"
              onClick={function() { setIsEditing(!isEditing); }}
              variant="outlined"
              size="small"
              startIcon={isEditing ? <LockOpenIcon /> : <LockIcon />}
            >
              {isEditing ? 'Editing' : 'Edit'}
            </Button>
        )}

        {/* Delete -- only for existing records, gated on edit mode */}
        {!isNewRecord && (
          <Button
              id="deleteNutritionOrderButton"
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
        <NutritionOrderFormView
          resource={nutritionOrder}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              id="saveNutritionOrderButton"
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
    return (
      <NutritionOrderPreview
        resource={nutritionOrder}
        resourceId={id}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="nutritionOrderDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default NutritionOrderDetail;
