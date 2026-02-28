// /imports/ui-fhir/supplyDeliveries/SupplyDeliveryDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Dialog
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Import collections directly
import { SupplyDeliveries } from '/imports/lib/schemas/SimpleSchemas/SupplyDeliveries';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

import SupplyDeliveryFormView from './SupplyDeliveryFormView';
import SupplyDeliveryPreview from './SupplyDeliveryPreview';

function SupplyDeliveryDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  // Subscribe to supply deliveries data if needed
  const subscriptionReady = useTracker(() => {
    if (isEmbedded) return true; // Skip subscription in embedded mode
    return true;
  }, []);

  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const selectedPatientId = useTracker(function() {
    return Session.get('selectedPatientId');
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [supplyDelivery, setSupplyDelivery] = useState({
    resourceType: "SupplyDelivery",
    identifier: [{
      value: ""
    }],
    basedOn: [],
    partOf: [],
    status: "in-progress",
    patient: {
      reference: "",
      display: ""
    },
    type: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    suppliedItem: {
      quantity: {
        value: "",
        unit: "",
        system: "http://unitsofmeasure.org",
        code: ""
      },
      itemCodeableConcept: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }],
        text: ""
      },
      itemReference: {
        reference: "",
        display: ""
      }
    },
    occurrenceDateTime: moment().format('YYYY-MM-DDTHH:mm:ss'),
    occurrencePeriod: {
      start: "",
      end: ""
    },
    supplier: {
      reference: "",
      display: ""
    },
    destination: {
      reference: "",
      display: ""
    },
    receiver: [{
      reference: "",
      display: ""
    }]
  });

  const [form, setForm] = useState({
    status: 'in-progress',
    typeText: '',
    occurrenceDateTime: moment().format('YYYY-MM-DDTHH:mm'),
    supplierDisplay: '',
    destinationDisplay: '',
    receiverDisplay: '',
    quantityValue: '',
    quantityUnit: '',
    itemDescription: '',
    basedOnReference: '',
    partOfReference: '',
    patientDisplay: '',
    notes: ''
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setSupplyDelivery(function(prev) {
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
      props.onResourceChange(supplyDelivery);
    }
  }, [supplyDelivery]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded || !id || id === 'new');
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewDelivery = !id || id === 'new';

  // Set default values on component mount for new supply deliveries
  useEffect(function() {
    console.log('SupplyDeliveryDetail useEffect - id:', id, 'isEditing:', isEditing);
    if (!id || id === 'new') {
      // Set patient reference if we have a selected patient
      let patientDisplay = '';
      let patientReference = '';
      if (selectedPatient) {
        const patientFhirId = get(selectedPatient, 'id');
        patientDisplay = FhirUtilities.assembleName(selectedPatient.name);
        patientReference = `Patient/${patientFhirId}`;

        setSupplyDelivery(prev => ({
          ...prev,
          patient: {
            reference: patientReference,
            display: patientDisplay
          }
        }));
      }

      setForm({
        status: 'in-progress',
        typeText: '',
        occurrenceDateTime: moment().format('YYYY-MM-DDTHH:mm'),
        supplierDisplay: '',
        destinationDisplay: '',
        receiverDisplay: '',
        quantityValue: '',
        quantityUnit: '',
        itemDescription: '',
        basedOnReference: '',
        partOfReference: '',
        patientDisplay: patientDisplay,
        notes: ''
      });
    } else {
      // Load existing supply delivery
      console.log('Loading supply delivery with id:', id);
      const existingDelivery = SupplyDeliveries.findOne({_id: id});
      if (existingDelivery) {
        console.log('Found existing supply delivery:', existingDelivery);
        setSupplyDelivery(existingDelivery);
        setIsEditing(false);

        setForm({
          status: get(existingDelivery, 'status', 'in-progress'),
          typeText: get(existingDelivery, 'type.text', ''),
          occurrenceDateTime: get(existingDelivery, 'occurrenceDateTime') ? moment(get(existingDelivery, 'occurrenceDateTime')).format('YYYY-MM-DDTHH:mm') : '',
          supplierDisplay: get(existingDelivery, 'supplier.display', ''),
          destinationDisplay: get(existingDelivery, 'destination.display', ''),
          receiverDisplay: get(existingDelivery, 'receiver[0].display', ''),
          quantityValue: get(existingDelivery, 'suppliedItem.quantity.value', ''),
          quantityUnit: get(existingDelivery, 'suppliedItem.quantity.unit', ''),
          itemDescription: get(existingDelivery, 'suppliedItem.itemCodeableConcept.text', ''),
          basedOnReference: get(existingDelivery, 'basedOn[0].reference', ''),
          partOfReference: get(existingDelivery, 'partOf[0].reference', ''),
          patientDisplay: get(existingDelivery, 'patient.display', ''),
          notes: get(existingDelivery, 'note[0].text', '')
        });
      } else {
        console.error('Supply delivery not found with id:', id);
        setError('Supply delivery not found');
      }
    }
  }, [id, selectedPatient]);

  function handleChange(name, value){
    pendingUpdate.current = true;
    const newForm = Object.assign({}, form);
    newForm[name] = value;
    setForm(newForm);

    // Also update the underlying FHIR resource
    setSupplyDelivery(function(prev){
      const updated = JSON.parse(JSON.stringify(prev));
      switch(name){
        case 'status':
          set(updated, 'status', value);
          break;
        case 'typeText':
          set(updated, 'type.text', value);
          break;
        case 'occurrenceDateTime':
          set(updated, 'occurrenceDateTime', value);
          break;
        case 'supplierDisplay':
          set(updated, 'supplier.display', value);
          break;
        case 'destinationDisplay':
          set(updated, 'destination.display', value);
          break;
        case 'receiverDisplay':
          set(updated, 'receiver[0].display', value);
          break;
        case 'quantityValue':
          set(updated, 'suppliedItem.quantity.value', value);
          break;
        case 'quantityUnit':
          set(updated, 'suppliedItem.quantity.unit', value);
          break;
        case 'itemDescription':
          set(updated, 'suppliedItem.itemCodeableConcept.text', value);
          break;
        case 'basedOnReference':
          set(updated, 'basedOn[0].reference', value);
          break;
        case 'partOfReference':
          set(updated, 'partOf[0].reference', value);
          break;
        case 'notes':
          set(updated, 'note[0].text', value);
          break;
        default:
          break;
      }
      return updated;
    });
  }

  const handlePatientSelect = (patient) => {
    console.log('Selected patient:', patient);
    const patientFhirId = get(patient, 'id');
    const patientName = FhirUtilities.assembleName(patient.name);

    setSupplyDelivery(prev => ({
      ...prev,
      patient: {
        reference: `Patient/${patientFhirId}`,
        display: patientName
      }
    }));

    setForm(prev => ({
      ...prev,
      patientDisplay: patientName
    }));

    setPatientSearchOpen(false);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build the resource from form state
      let dataToSave = JSON.parse(JSON.stringify(supplyDelivery));

      // Ensure we have a patient reference if selected
      if (selectedPatient && !get(dataToSave, 'patient.reference')) {
        const patientFhirId = get(selectedPatient, 'id');
        const patientName = FhirUtilities.assembleName(selectedPatient.name);
        dataToSave.patient = {
          reference: `Patient/${patientFhirId}`,
          display: patientName
        };
      }

      // Clean up empty fields
      if (!get(dataToSave, 'suppliedItem.quantity.value')) {
        delete dataToSave.suppliedItem.quantity;
      }
      if (!get(dataToSave, 'suppliedItem.itemCodeableConcept.text') &&
          !get(dataToSave, 'suppliedItem.itemCodeableConcept.coding[0].code')) {
        delete dataToSave.suppliedItem.itemCodeableConcept;
      }
      if (!get(dataToSave, 'suppliedItem.itemReference.reference')) {
        delete dataToSave.suppliedItem.itemReference;
      }
      if (!get(dataToSave, 'occurrencePeriod.start') && !get(dataToSave, 'occurrencePeriod.end')) {
        delete dataToSave.occurrencePeriod;
      }

      if (id && id !== 'new') {
        console.log('Updating supply delivery:', dataToSave);
        await Meteor.callAsync('updateSupplyDelivery', id, dataToSave);
        console.log('Supply delivery updated successfully');
        setIsEditing(false);
      } else {
        console.log('Creating new supply delivery:', dataToSave);
        const newId = await Meteor.callAsync('createSupplyDelivery', dataToSave);
        console.log('Supply delivery created with ID:', newId);

        if (typeof window !== 'undefined') {
          window.saveResult = { result: newId };
        }

        navigate('/supply-deliveries');
      }
    } catch (error) {
      console.error('Error saving supply delivery:', error);
      setError(error.message || 'Failed to save supply delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    console.log('[SupplyDeliveryDetail] handleDelete called, id:', id);

    if (!id || id === 'new') {
      console.log('[SupplyDeliveryDetail] Cannot delete - invalid id');
      return;
    }

    const confirmResult = window.confirm('Are you sure you want to delete this supply delivery?');
    console.log('[SupplyDeliveryDetail] Confirm result:', confirmResult);

    if (!confirmResult) {
      console.log('[SupplyDeliveryDetail] Delete cancelled by user');
      return;
    }

    console.log('[SupplyDeliveryDetail] Starting delete operation...');
    setLoading(true);
    setError(null);

    try {
      console.log('[SupplyDeliveryDetail] Calling removeSupplyDelivery with id:', id);
      const result = await Meteor.callAsync('removeSupplyDelivery', id);
      console.log('[SupplyDeliveryDetail] Delete result:', result);
      console.log('[SupplyDeliveryDetail] Navigating to /supply-deliveries');
      navigate('/supply-deliveries');
    } catch (error) {
      console.error('[SupplyDeliveryDetail] Error deleting supply delivery:', error);
      setError(error.message || 'Failed to delete supply delivery');
    } finally {
      setLoading(false);
    }
  };

  function handleCancelButton(){
    if (id && id !== 'new') {
      setIsEditing(false);
      setError(null);
      const existingDelivery = SupplyDeliveries.findOne({_id: id});
      if (existingDelivery) {
        setSupplyDelivery(existingDelivery);
        setForm({
          status: get(existingDelivery, 'status', 'in-progress'),
          typeText: get(existingDelivery, 'type.text', ''),
          occurrenceDateTime: get(existingDelivery, 'occurrenceDateTime') ? moment(get(existingDelivery, 'occurrenceDateTime')).format('YYYY-MM-DDTHH:mm') : '',
          supplierDisplay: get(existingDelivery, 'supplier.display', ''),
          destinationDisplay: get(existingDelivery, 'destination.display', ''),
          receiverDisplay: get(existingDelivery, 'receiver[0].display', ''),
          quantityValue: get(existingDelivery, 'suppliedItem.quantity.value', ''),
          quantityUnit: get(existingDelivery, 'suppliedItem.quantity.unit', ''),
          itemDescription: get(existingDelivery, 'suppliedItem.itemCodeableConcept.text', ''),
          basedOnReference: get(existingDelivery, 'basedOn[0].reference', ''),
          partOfReference: get(existingDelivery, 'partOf[0].reference', ''),
          patientDisplay: get(existingDelivery, 'patient.display', ''),
          notes: get(existingDelivery, 'note[0].text', '')
        });
      }
    } else {
      navigate('/supply-deliveries');
    }
  }

  // Build the header title
  let headerTitle = 'New Supply Delivery';
  if (id && id !== 'new') {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle - hidden for new deliveries */}
        {!isNewDelivery && (
          <Tooltip title="Preview">
            <IconButton
              onClick={() => setSearchParams({ view: 'page' })}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle - hidden for new deliveries */}
        {!isNewDelivery && (
          <Tooltip title="Form">
            <IconButton
              onClick={() => setSearchParams({ view: 'form' })}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle - only for existing deliveries */}
        {!isNewDelivery && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete - only for existing deliveries, gated on edit mode */}
        {!isNewDelivery && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDelete}
              disabled={!isEditing}
              sx={{ color: isEditing ? 'error.main' : 'text.disabled' }}
            >
              <DeleteIcon />
              <Typography sx={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                borderWidth: 0
              }}>Delete</Typography>
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView(){
    return (
      <>
        <SupplyDeliveryFormView
          resource={supplyDelivery}
          form={form}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancelButton}>
              Cancel
            </Button>
            <Button
              id="saveSupplyDeliveryButton"
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
  function renderPreviewView(){
    return (
      <SupplyDeliveryPreview
        resource={supplyDelivery}
        resourceId={id}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="supplyDeliveryDetailsPage" maxWidth="md" sx={{ py: 4 }}>
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

      {/* Patient Search Dialog */}
      <Dialog
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <PatientSearchDialog
          onClose={() => setPatientSearchOpen(false)}
          onSelect={handlePatientSelect}
        />
      </Dialog>
    </Container>
  );
}

export default SupplyDeliveryDetail;
