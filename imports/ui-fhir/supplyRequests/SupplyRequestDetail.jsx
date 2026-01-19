// imports/ui-fhir/supplyRequests/SupplyRequestDetail.jsx

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
  Paper,
  Alert,
  Grid
} from '@mui/material';

import InventoryIcon from '@mui/icons-material/Inventory';

import { get, set } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// Import collections directly
import { SupplyRequests } from '/imports/lib/schemas/SimpleSchemas/SupplyRequests';

function SupplyRequestDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();

  // Subscribe to supply requests data if needed
  const subscriptionReady = useTracker(() => {
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    if(autoPublishEnabled){
      const handle = Meteor.subscribe('autopublish.SupplyRequests', {}, { limit: 1000 });
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Initialize isEditing based on whether we're creating new or viewing existing
  const [isEditing, setIsEditing] = useState(!id || id === 'new');

  // Load existing supply request or set defaults for new
  useEffect(function() {
    console.log('SupplyRequestDetail useEffect - id:', id, 'isEditing:', isEditing, 'subscriptionReady:', subscriptionReady);
    if (!id || id === 'new') {
      // For new supply requests, set default requester from current user if available
      if (currentUser) {
        setSupplyRequest(prev => ({
          ...prev,
          requester: {
            reference: `Practitioner/${currentUser._id}`,
            display: get(currentUser, 'profile.name', currentUser.username || '')
          }
        }));
      }
    } else if (subscriptionReady) {
      // Load existing supply request
      console.log('Loading supply request with id:', id);
      const existingRequest = SupplyRequests.findOne({_id: id});
      if (existingRequest) {
        console.log('Found existing supply request:', existingRequest);
        setSupplyRequest(existingRequest);
        // Start in view mode for existing requests
        setIsEditing(false);
      } else {
        console.error('Supply request not found with id:', id);
        setError('Supply request not found');
      }
    }
  }, [id, subscriptionReady, currentUser]);

  const handleInputChange = (path, value) => {
    console.log('handleInputChange:', path, value);
    setSupplyRequest(prevRequest => {
      const newRequest = JSON.parse(JSON.stringify(prevRequest)); // Deep clone
      set(newRequest, path, value);
      return newRequest;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Clean up empty fields
      const dataToSave = JSON.parse(JSON.stringify(supplyRequest));

      // Remove empty quantity
      if (!get(dataToSave, 'quantity.value')) {
        delete dataToSave.quantity;
      }

      // Remove empty itemCodeableConcept
      if (!get(dataToSave, 'itemCodeableConcept.text') &&
          !get(dataToSave, 'itemCodeableConcept.coding[0].code')) {
        delete dataToSave.itemCodeableConcept;
      }

      // Remove empty itemReference
      if (!get(dataToSave, 'itemReference.reference')) {
        delete dataToSave.itemReference;
      }

      // Remove empty occurrencePeriod
      if (!get(dataToSave, 'occurrencePeriod.start') && !get(dataToSave, 'occurrencePeriod.end')) {
        delete dataToSave.occurrencePeriod;
      }

      // Remove empty occurrenceDateTime
      if (!get(dataToSave, 'occurrenceDateTime')) {
        delete dataToSave.occurrenceDateTime;
      }

      if (id && id !== 'new') {
        // Update existing supply request
        console.log('Updating supply request:', dataToSave);
        await Meteor.callAsync('supplyRequests.update', id, dataToSave);
        console.log('Supply request updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new supply request
        console.log('Creating new supply request:', dataToSave);
        const newId = await Meteor.callAsync('supplyRequests.insert', dataToSave);
        console.log('Supply request created with ID:', newId);

        // Store result for tests to capture
        if (typeof window !== 'undefined') {
          window.saveResult = { result: newId };
        }

        // Navigate back to supply requests list for new supply requests
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

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Debug logging and expose state for tests
  useEffect(() => {
    console.log('SupplyRequestDetail render - id:', id, 'isEditing:', isEditing);
    if (typeof window !== 'undefined') {
      window.__supplyRequestIsEditing = isEditing;
    }
  }, [id, isEditing]);

  return (
    <Container id="supplyRequestDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Edit Supply Request' : 'New Supply Request'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* System ID Barcode */}
            {(id && id !== 'new') && (
              <Box sx={{ mb: 3, textAlign: 'right' }}>
                <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
              </Box>
            )}

            <Stack spacing={3}>
              {/* Status */}
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="statusInput"
                  name="status"
                  value={get(supplyRequest, 'status', 'draft')}
                  label="Status"
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  disabled={!isEditing}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                  <MenuItem value="unknown">Unknown</MenuItem>
                </Select>
              </FormControl>

              {/* Priority */}
              <FormControl fullWidth>
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priorityInput"
                  name="priority"
                  value={get(supplyRequest, 'priority', 'routine')}
                  label="Priority"
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  disabled={!isEditing}
                >
                  <MenuItem value="routine">Routine</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="asap">ASAP</MenuItem>
                  <MenuItem value="stat">Stat</MenuItem>
                </Select>
              </FormControl>

              {/* Category */}
              <TextField
                fullWidth
                id="categoryInput"
                name="category"
                label="Category"
                value={get(supplyRequest, 'category.text', '')}
                onChange={(e) => handleInputChange('category.text', e.target.value)}
                disabled={!isEditing}
                helperText="Category of supply (e.g., central, non-stock)"
              />

              {/* Item Section */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  <InventoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Item Details
                </Typography>

                <Stack spacing={2}>
                  {/* Item Description */}
                  <TextField
                    fullWidth
                    id="itemCodeableConceptInput"
                    name="itemCodeableConcept"
                    label="Item Description"
                    value={get(supplyRequest, 'itemCodeableConcept.text', '')}
                    onChange={(e) => handleInputChange('itemCodeableConcept.text', e.target.value)}
                    disabled={!isEditing}
                    helperText="Description of the item being requested"
                  />

                  {/* Item Code */}
                  <TextField
                    fullWidth
                    id="itemCodeInput"
                    name="itemCode"
                    label="Item Code"
                    value={get(supplyRequest, 'itemCodeableConcept.coding[0].code', '')}
                    onChange={(e) => handleInputChange('itemCodeableConcept.coding[0].code', e.target.value)}
                    disabled={!isEditing}
                    helperText="Code identifying the item"
                  />

                  {/* Quantity */}
                  <Grid container spacing={2} sx={{ ml: 0, width: 'calc(100% + 16px)' }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        id="quantityValueInput"
                        name="quantityValue"
                        label="Quantity"
                        type="number"
                        value={get(supplyRequest, 'quantity.value', '')}
                        onChange={(e) => handleInputChange('quantity.value', e.target.value)}
                        disabled={!isEditing}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        id="quantityUnitInput"
                        name="quantityUnit"
                        label="Unit"
                        value={get(supplyRequest, 'quantity.unit', '')}
                        onChange={(e) => handleInputChange('quantity.unit', e.target.value)}
                        disabled={!isEditing}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </Paper>

              {/* Dates */}
              <TextField
                fullWidth
                id="authoredOnInput"
                name="authoredOn"
                label="Authored On"
                type="datetime-local"
                value={get(supplyRequest, 'authoredOn') ? moment(get(supplyRequest, 'authoredOn')).format('YYYY-MM-DDTHH:mm') : ''}
                onChange={(e) => handleInputChange('authoredOn', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <TextField
                fullWidth
                id="occurrenceDateTimeInput"
                name="occurrenceDateTime"
                label="Occurrence Date/Time (When Needed)"
                type="datetime-local"
                value={get(supplyRequest, 'occurrenceDateTime') ? moment(get(supplyRequest, 'occurrenceDateTime')).format('YYYY-MM-DDTHH:mm') : ''}
                onChange={(e) => handleInputChange('occurrenceDateTime', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="When the request should be fulfilled"
              />

              {/* Requester and Supplier */}
              <TextField
                fullWidth
                id="requesterInput"
                name="requester"
                label="Requester"
                value={get(supplyRequest, 'requester.display', '')}
                onChange={(e) => handleInputChange('requester.display', e.target.value)}
                disabled={!isEditing}
                helperText="Who initiated the request"
              />

              <TextField
                fullWidth
                id="supplierInput"
                name="supplier"
                label="Supplier"
                value={get(supplyRequest, 'supplier[0].display', '')}
                onChange={(e) => handleInputChange('supplier[0].display', e.target.value)}
                disabled={!isEditing}
                helperText="Who is intended to fulfill the request"
              />

              {/* Delivery Locations */}
              <TextField
                fullWidth
                id="deliverFromInput"
                name="deliverFrom"
                label="Deliver From"
                value={get(supplyRequest, 'deliverFrom.display', '')}
                onChange={(e) => handleInputChange('deliverFrom.display', e.target.value)}
                disabled={!isEditing}
                helperText="Where the supply is expected to come from"
              />

              <TextField
                fullWidth
                id="deliverToInput"
                name="deliverTo"
                label="Deliver To"
                value={get(supplyRequest, 'deliverTo.display', '')}
                onChange={(e) => handleInputChange('deliverTo.display', e.target.value)}
                disabled={!isEditing}
                helperText="Where the supply is destined to go"
              />

              {/* Reason */}
              <TextField
                fullWidth
                id="reasonInput"
                name="reason"
                label="Reason"
                multiline={true}
                rows={2}
                value={get(supplyRequest, 'reasonCode[0].text', '')}
                onChange={(e) => handleInputChange('reasonCode[0].text', e.target.value)}
                disabled={!isEditing}
                helperText="Why the supply item was requested"
              />
            </Stack>
          </CardContent>

          <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
            {!isEditing && id && id !== 'new' ? (
              // Read-only mode buttons
              <>
                <Button
                  onClick={() => navigate('/supply-requests')}
                >
                  Back
                </Button>
                <Button
                  id="deleteSupplyRequestButton"
                  onClick={handleDelete}
                  color="error"
                  variant="text"
                  disabled={loading}
                >
                  Delete
                </Button>
                <Button
                  id="editSupplyRequestButton"
                  onClick={toggleEdit}
                  variant="contained"
                  disabled={loading}
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
                      // Cancel edit mode and reload original data
                      const existingRequest = SupplyRequests.findOne({_id: id});
                      if (existingRequest) {
                        setSupplyRequest(existingRequest);
                      }
                      setIsEditing(false);
                    } else {
                      // Cancel new supply request creation
                      navigate('/supply-requests');
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  id="saveSupplyRequestButton"
                  onClick={handleSave}
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : id && id !== 'new' ? 'Update' : 'Save'}
                </Button>
              </>
            )}
          </CardActions>
        </Card>
      </Container>
  );
}

export default SupplyRequestDetail;
