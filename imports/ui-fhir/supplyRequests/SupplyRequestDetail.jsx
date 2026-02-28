// /imports/ui-fhir/supplyRequests/SupplyRequestDetail.jsx

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
  Tooltip
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

// Import collections directly
import { SupplyRequests } from '/imports/lib/schemas/SimpleSchemas/SupplyRequests';

import SupplyRequestFormView from './SupplyRequestFormView';
import SupplyRequestPreview from './SupplyRequestPreview';

function SupplyRequestDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  // Subscribe to supply requests data if needed
  const subscriptionReady = useTracker(() => {
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('selectedPatient.SupplyRequests', Session.get('selectedPatientId'), { limit: 1000 });
      return handle.ready();
    }
    return true;
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [supplyRequest, setSupplyRequest] = useState({
    resourceType: "SupplyRequest",
    identifier: [{
      value: ""
    }],
    status: "draft",
    priority: "routine",
    category: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/supply-kind",
        code: "",
        display: ""
      }],
      text: ""
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
    },
    quantity: {
      value: "",
      unit: "",
      system: "http://unitsofmeasure.org",
      code: ""
    },
    parameter: [],
    occurrenceDateTime: "",
    occurrencePeriod: {
      start: "",
      end: ""
    },
    authoredOn: moment().format('YYYY-MM-DDTHH:mm:ss'),
    requester: {
      reference: "",
      display: ""
    },
    supplier: [{
      reference: "",
      display: ""
    }],
    reasonCode: [],
    reasonReference: [],
    deliverFrom: {
      reference: "",
      display: ""
    },
    deliverTo: {
      reference: "",
      display: ""
    }
  });

  const [form, setForm] = useState({
    status: 'draft',
    priority: 'routine',
    category: '',
    itemDescription: '',
    itemCode: '',
    quantityValue: '',
    quantityUnit: '',
    authoredOn: moment().format('YYYY-MM-DDTHH:mm'),
    occurrenceDateTime: '',
    requesterDisplay: '',
    supplierDisplay: '',
    deliverFromDisplay: '',
    deliverToDisplay: '',
    reason: ''
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setSupplyRequest(function(prev) {
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
      props.onResourceChange(supplyRequest);
    }
  }, [supplyRequest]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded || !id || id === 'new');
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewRequest = !id || id === 'new';

  // Load existing supply request or set defaults for new
  useEffect(function() {
    console.log('SupplyRequestDetail useEffect - id:', id, 'isEditing:', isEditing, 'subscriptionReady:', subscriptionReady);
    if (!id || id === 'new') {
      // For new supply requests, set default requester from current user if available
      let requesterDisplay = '';
      if (currentUser) {
        requesterDisplay = get(currentUser, 'profile.name', currentUser.username || '');
        setSupplyRequest(prev => ({
          ...prev,
          requester: {
            reference: `Practitioner/${currentUser._id}`,
            display: requesterDisplay
          }
        }));
      }

      setForm({
        status: 'draft',
        priority: 'routine',
        category: '',
        itemDescription: '',
        itemCode: '',
        quantityValue: '',
        quantityUnit: '',
        authoredOn: moment().format('YYYY-MM-DDTHH:mm'),
        occurrenceDateTime: '',
        requesterDisplay: requesterDisplay,
        supplierDisplay: '',
        deliverFromDisplay: '',
        deliverToDisplay: '',
        reason: ''
      });
    } else if (subscriptionReady) {
      // Load existing supply request
      console.log('Loading supply request with id:', id);
      const existingRequest = SupplyRequests.findOne({_id: id});
      if (existingRequest) {
        console.log('Found existing supply request:', existingRequest);
        setSupplyRequest(existingRequest);
        setIsEditing(false);

        setForm({
          status: get(existingRequest, 'status', 'draft'),
          priority: get(existingRequest, 'priority', 'routine'),
          category: get(existingRequest, 'category.text', ''),
          itemDescription: get(existingRequest, 'itemCodeableConcept.text', ''),
          itemCode: get(existingRequest, 'itemCodeableConcept.coding[0].code', ''),
          quantityValue: get(existingRequest, 'quantity.value', ''),
          quantityUnit: get(existingRequest, 'quantity.unit', ''),
          authoredOn: get(existingRequest, 'authoredOn') ? moment(get(existingRequest, 'authoredOn')).format('YYYY-MM-DDTHH:mm') : '',
          occurrenceDateTime: get(existingRequest, 'occurrenceDateTime') ? moment(get(existingRequest, 'occurrenceDateTime')).format('YYYY-MM-DDTHH:mm') : '',
          requesterDisplay: get(existingRequest, 'requester.display', ''),
          supplierDisplay: get(existingRequest, 'supplier[0].display', ''),
          deliverFromDisplay: get(existingRequest, 'deliverFrom.display', ''),
          deliverToDisplay: get(existingRequest, 'deliverTo.display', ''),
          reason: get(existingRequest, 'reasonCode[0].text', '')
        });
      } else {
        console.error('Supply request not found with id:', id);
        setError('Supply request not found');
      }
    }
  }, [id, subscriptionReady, currentUser]);

  function handleChange(name, value){
    pendingUpdate.current = true;
    const newForm = Object.assign({}, form);
    newForm[name] = value;
    setForm(newForm);

    // Also update the underlying FHIR resource
    setSupplyRequest(function(prev){
      const updated = JSON.parse(JSON.stringify(prev));
      switch(name){
        case 'status':
          set(updated, 'status', value);
          break;
        case 'priority':
          set(updated, 'priority', value);
          break;
        case 'category':
          set(updated, 'category.text', value);
          break;
        case 'itemDescription':
          set(updated, 'itemCodeableConcept.text', value);
          break;
        case 'itemCode':
          set(updated, 'itemCodeableConcept.coding[0].code', value);
          break;
        case 'quantityValue':
          set(updated, 'quantity.value', value);
          break;
        case 'quantityUnit':
          set(updated, 'quantity.unit', value);
          break;
        case 'authoredOn':
          set(updated, 'authoredOn', value);
          break;
        case 'occurrenceDateTime':
          set(updated, 'occurrenceDateTime', value);
          break;
        case 'requesterDisplay':
          set(updated, 'requester.display', value);
          break;
        case 'supplierDisplay':
          set(updated, 'supplier[0].display', value);
          break;
        case 'deliverFromDisplay':
          set(updated, 'deliverFrom.display', value);
          break;
        case 'deliverToDisplay':
          set(updated, 'deliverTo.display', value);
          break;
        case 'reason':
          set(updated, 'reasonCode[0].text', value);
          break;
        default:
          break;
      }
      return updated;
    });
  }

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Clean up empty fields
      const dataToSave = JSON.parse(JSON.stringify(supplyRequest));

      if (!get(dataToSave, 'quantity.value')) {
        delete dataToSave.quantity;
      }
      if (!get(dataToSave, 'itemCodeableConcept.text') &&
          !get(dataToSave, 'itemCodeableConcept.coding[0].code')) {
        delete dataToSave.itemCodeableConcept;
      }
      if (!get(dataToSave, 'itemReference.reference')) {
        delete dataToSave.itemReference;
      }
      if (!get(dataToSave, 'occurrencePeriod.start') && !get(dataToSave, 'occurrencePeriod.end')) {
        delete dataToSave.occurrencePeriod;
      }
      if (!get(dataToSave, 'occurrenceDateTime')) {
        delete dataToSave.occurrenceDateTime;
      }

      if (id && id !== 'new') {
        console.log('Updating supply request:', dataToSave);
        await Meteor.callAsync('supplyRequests.update', id, dataToSave);
        console.log('Supply request updated successfully');
        setIsEditing(false);
      } else {
        console.log('Creating new supply request:', dataToSave);
        const newId = await Meteor.callAsync('supplyRequests.insert', dataToSave);
        console.log('Supply request created with ID:', newId);

        if (typeof window !== 'undefined') {
          window.saveResult = { result: newId };
        }

        navigate('/supply-requests');
      }
    } catch (error) {
      console.error('Error saving supply request:', error);
      setError(error.message || 'Failed to save supply request');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    console.log('[SupplyRequestDetail] handleDelete called, id:', id);

    if (!id || id === 'new') {
      console.log('[SupplyRequestDetail] Cannot delete - invalid id');
      return;
    }

    const confirmResult = window.confirm('Are you sure you want to delete this supply request?');
    console.log('[SupplyRequestDetail] Confirm result:', confirmResult);

    if (!confirmResult) {
      console.log('[SupplyRequestDetail] Delete cancelled by user');
      return;
    }

    console.log('[SupplyRequestDetail] Starting delete operation...');
    setLoading(true);
    setError(null);

    try {
      console.log('[SupplyRequestDetail] Calling supplyRequests.remove with id:', id);
      const result = await Meteor.callAsync('supplyRequests.remove', id);
      console.log('[SupplyRequestDetail] Delete result:', result);
      console.log('[SupplyRequestDetail] Navigating to /supply-requests');
      navigate('/supply-requests');
    } catch (error) {
      console.error('[SupplyRequestDetail] Error deleting supply request:', error);
      setError(error.message || 'Failed to delete supply request');
    } finally {
      setLoading(false);
    }
  };

  function handleCancelButton(){
    if (id && id !== 'new') {
      setIsEditing(false);
      setError(null);
      const existingRequest = SupplyRequests.findOne({_id: id});
      if (existingRequest) {
        setSupplyRequest(existingRequest);
        setForm({
          status: get(existingRequest, 'status', 'draft'),
          priority: get(existingRequest, 'priority', 'routine'),
          category: get(existingRequest, 'category.text', ''),
          itemDescription: get(existingRequest, 'itemCodeableConcept.text', ''),
          itemCode: get(existingRequest, 'itemCodeableConcept.coding[0].code', ''),
          quantityValue: get(existingRequest, 'quantity.value', ''),
          quantityUnit: get(existingRequest, 'quantity.unit', ''),
          authoredOn: get(existingRequest, 'authoredOn') ? moment(get(existingRequest, 'authoredOn')).format('YYYY-MM-DDTHH:mm') : '',
          occurrenceDateTime: get(existingRequest, 'occurrenceDateTime') ? moment(get(existingRequest, 'occurrenceDateTime')).format('YYYY-MM-DDTHH:mm') : '',
          requesterDisplay: get(existingRequest, 'requester.display', ''),
          supplierDisplay: get(existingRequest, 'supplier[0].display', ''),
          deliverFromDisplay: get(existingRequest, 'deliverFrom.display', ''),
          deliverToDisplay: get(existingRequest, 'deliverTo.display', ''),
          reason: get(existingRequest, 'reasonCode[0].text', '')
        });
      }
    } else {
      navigate('/supply-requests');
    }
  }

  // Debug logging and expose state for tests
  useEffect(() => {
    console.log('SupplyRequestDetail render - id:', id, 'isEditing:', isEditing);
    if (typeof window !== 'undefined') {
      window.__supplyRequestIsEditing = isEditing;
    }
  }, [id, isEditing]);

  // Build the header title
  let headerTitle = 'New Supply Request';
  if (id && id !== 'new') {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle - hidden for new requests */}
        {!isNewRequest && (
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

        {/* Form toggle - hidden for new requests */}
        {!isNewRequest && (
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

        {/* Lock / Unlock toggle - only for existing requests */}
        {!isNewRequest && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete - only for existing requests, gated on edit mode */}
        {!isNewRequest && (
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
        <SupplyRequestFormView
          resource={supplyRequest}
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
              id="saveSupplyRequestButton"
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
      <SupplyRequestPreview
        resource={supplyRequest}
        resourceId={id}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="supplyRequestDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default SupplyRequestDetail;
