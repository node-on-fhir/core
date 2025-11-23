// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/supplyDeliveries/SupplyDeliveryDetail.jsx

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
  Tooltip,
  Paper,
  Alert,
  Grid,
  Dialog
} from '@mui/material';

import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';

import { get, set } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Import collections directly
import { SupplyDeliveries } from '/imports/lib/schemas/SimpleSchemas/SupplyDeliveries';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

function SupplyDeliveryDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Subscribe to supply deliveries data if needed
  const subscriptionReady = useTracker(() => {
    // For now, just return true since we're not using subscriptions in this component
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Initialize isEditing based on whether we're creating new or viewing existing
  const [isEditing, setIsEditing] = useState(!id || id === 'new');
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render counter
  
  // Set default values on component mount for new supply deliveries
  useEffect(function() {
    console.log('SupplyDeliveryDetail useEffect - id:', id, 'isEditing:', isEditing);
    if (!id || id === 'new') {
      // Set patient reference if we have a selected patient
      if (selectedPatient) {
        const patientFhirId = get(selectedPatient, 'id');
        const patientName = FhirUtilities.assembleName(selectedPatient.name);
        
        setSupplyDelivery(prev => ({
          ...prev,
          patient: {
            reference: `Patient/${patientFhirId}`,
            display: patientName
          }
        }));
      }
    } else {
      // Load existing supply delivery
      console.log('Loading supply delivery with id:', id);
      const existingDelivery = SupplyDeliveries.findOne({_id: id});
      if (existingDelivery) {
        console.log('Found existing supply delivery:', existingDelivery);
        setSupplyDelivery(existingDelivery);
        // Start in view mode for existing deliveries
        setIsEditing(false);
      } else {
        console.error('Supply delivery not found with id:', id);
        setError('Supply delivery not found');
      }
    }
  }, [id, selectedPatient]);

  const handleInputChange = (path, value) => {
    console.log('handleInputChange:', path, value);
    setSupplyDelivery(prevDelivery => {
      const newDelivery = JSON.parse(JSON.stringify(prevDelivery)); // Deep clone
      set(newDelivery, path, value);
      return newDelivery;
    });
  };

  const handlePatientSelect = (patient) => {
    console.log('Selected patient:', patient);
    const patientFhirId = get(patient, 'id');
    const patientName = FhirUtilities.assembleName(patient.name);
    
    handleInputChange('patient', {
      reference: `Patient/${patientFhirId}`,
      display: patientName
    });
    setPatientSearchOpen(false);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Ensure we have a patient reference if selected
      if (selectedPatient && !get(supplyDelivery, 'patient.reference')) {
        const patientFhirId = get(selectedPatient, 'id');
        const patientName = FhirUtilities.assembleName(selectedPatient.name);
        supplyDelivery.patient = {
          reference: `Patient/${patientFhirId}`,
          display: patientName
        };
      }

      // Clean up empty fields
      if (!get(supplyDelivery, 'suppliedItem.quantity.value')) {
        delete supplyDelivery.suppliedItem.quantity;
      }
      if (!get(supplyDelivery, 'suppliedItem.itemCodeableConcept.text') && 
          !get(supplyDelivery, 'suppliedItem.itemCodeableConcept.coding[0].code')) {
        delete supplyDelivery.suppliedItem.itemCodeableConcept;
      }
      if (!get(supplyDelivery, 'suppliedItem.itemReference.reference')) {
        delete supplyDelivery.suppliedItem.itemReference;
      }
      if (!get(supplyDelivery, 'occurrencePeriod.start') && !get(supplyDelivery, 'occurrencePeriod.end')) {
        delete supplyDelivery.occurrencePeriod;
      }

      if (id && id !== 'new') {
        // Update existing supply delivery
        console.log('Updating supply delivery:', supplyDelivery);
        await Meteor.callAsync('updateSupplyDelivery', id, supplyDelivery);
        console.log('Supply delivery updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new supply delivery
        console.log('Creating new supply delivery:', supplyDelivery);
        const newId = await Meteor.callAsync('createSupplyDelivery', supplyDelivery);
        console.log('Supply delivery created with ID:', newId);

        // Store result for tests to capture
        if (typeof window !== 'undefined') {
          window.saveResult = { result: newId };
        }

        // Navigate back to supply deliveries list for new supply deliveries
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

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };
  
  // Debug logging and expose state for tests
  useEffect(() => {
    console.log('SupplyDeliveryDetail render - id:', id, 'isEditing:', isEditing);
    if (typeof window !== 'undefined') {
      window.__supplyDeliveryIsEditing = isEditing;
    }
  }, [id, isEditing]);

  return (
    <Container id="supplyDeliveryDetailsPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Supply Delivery' : 'New Supply Delivery'}
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
              {/* Debug info - remove after testing */}
              <Typography variant="caption" color="text.secondary">
                Debug: id={id}, isEditing={String(isEditing)}
              </Typography>
              
              {/* Status */}
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="statusInput"
                  name="status"
                  value={get(supplyDelivery, 'status', 'in-progress')}
                  label="Status"
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  disabled={!isEditing}
                >
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="abandoned">Abandoned</MenuItem>
                  <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                </Select>
              </FormControl>

              {/* Type */}
              <TextField
                fullWidth
                id="typeInput"
                name="type"
                label="Type"
                value={get(supplyDelivery, 'type.text', '')}
                onChange={(e) => handleInputChange('type.text', e.target.value)}
                disabled={!isEditing}
                helperText="Type of supply delivery (e.g., device, medication)"
              />

              {/* Occurrence Date/Time */}
              <TextField
                fullWidth
                id="occurrenceDateTimeInput"
                name="occurrenceDateTime"
                label="Occurrence Date/Time"
                type="datetime-local"
                value={moment(get(supplyDelivery, 'occurrenceDateTime', '')).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => handleInputChange('occurrenceDateTime', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{
                  shrink: true,
                }}
              />

              {/* Supplier */}
              <TextField
                fullWidth
                id="supplierInput"
                name="supplier"
                label="Supplier"
                value={get(supplyDelivery, 'supplier.display', '')}
                onChange={(e) => handleInputChange('supplier.display', e.target.value)}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalShippingIcon />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Destination */}
              <TextField
                fullWidth
                id="destinationInput"
                name="destination"
                label="Destination"
                value={get(supplyDelivery, 'destination.display', '')}
                onChange={(e) => handleInputChange('destination.display', e.target.value)}
                disabled={!isEditing}
              />

              {/* Receiver */}
              <TextField
                fullWidth
                id="receiverInput"
                name="receiver"
                label="Receiver"
                value={get(supplyDelivery, 'receiver[0].display', '')}
                onChange={(e) => handleInputChange('receiver[0].display', e.target.value)}
                disabled={!isEditing}
              />

              {/* Supplied Item Section */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  <InventoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Supplied Item
                </Typography>
                
                <Stack spacing={2}>
                  {/* Quantity */}
                  <Grid container spacing={2} sx={{ ml: 0, width: 'calc(100% + 16px)' }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        id="suppliedItemQuantityInput"
                        name="quantity"
                        label="Quantity"
                        type="number"
                        value={get(supplyDelivery, 'suppliedItem.quantity.value', '')}
                        onChange={(e) => handleInputChange('suppliedItem.quantity.value', e.target.value)}
                        disabled={!isEditing}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        id="suppliedItemQuantityUnitInput"
                        name="quantityUnit"
                        label="Unit"
                        value={get(supplyDelivery, 'suppliedItem.quantity.unit', '')}
                        onChange={(e) => handleInputChange('suppliedItem.quantity.unit', e.target.value)}
                        disabled={!isEditing}
                      />
                    </Grid>
                  </Grid>

                  {/* Item Codeable Concept */}
                  <TextField
                    fullWidth
                    id="suppliedItemCodeableConceptInput"
                    name="itemCodeableConcept"
                    label="Item Description"
                    value={get(supplyDelivery, 'suppliedItem.itemCodeableConcept.text', '')}
                    onChange={(e) => handleInputChange('suppliedItem.itemCodeableConcept.text', e.target.value)}
                    disabled={!isEditing}
                  />
                </Stack>
              </Paper>

              {/* References Section */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  References
                </Typography>
                
                <Stack spacing={2}>
                  {/* Based On */}
                  <TextField
                    fullWidth
                    id="basedOnInput"
                    name="basedOn"
                    label="Based On (Supply Request Reference)"
                    value={get(supplyDelivery, 'basedOn[0].reference', '')}
                    onChange={(e) => handleInputChange('basedOn[0].reference', e.target.value)}
                    disabled={!isEditing}
                    helperText="Reference to the supply request this delivery fulfills"
                  />

                  {/* Part Of */}
                  <TextField
                    fullWidth
                    id="partOfInput"
                    name="partOf"
                    label="Part Of (Parent Supply Delivery)"
                    value={get(supplyDelivery, 'partOf[0].reference', '')}
                    onChange={(e) => handleInputChange('partOf[0].reference', e.target.value)}
                    disabled={!isEditing}
                    helperText="Reference to a parent supply delivery"
                  />
                </Stack>
              </Paper>

              {/* Patient */}
              <TextField
                fullWidth
                label="Patient"
                value={get(supplyDelivery, 'patient.display', '')}
                disabled={!isEditing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={() => setPatientSearchOpen(true)}
                        disabled={!isEditing}
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Notes */}
              <TextField
                fullWidth
                id="notesInput"
                name="notes"
                label="Notes"
                multiline={true}
                rows={4}
                value={get(supplyDelivery, 'note[0].text', '')}
                onChange={(e) => handleInputChange('note[0].text', e.target.value)}
                disabled={!isEditing}
              />
            </Stack>
          </CardContent>
          
          <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
            {!isEditing && id && id !== 'new' ? (
              // Read-only mode buttons
              <>
                <Button 
                  onClick={() => navigate('/supply-deliveries')}
                >
                  Back
                </Button>
                <Button 
                  id="deleteSupplyDeliveryButton"
                  onClick={handleDelete}
                  color="error"
                  variant="text"
                  disabled={loading}
                >
                  Delete
                </Button>
                <Button 
                  id="editSupplyDeliveryButton"
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
                      const existingDelivery = SupplyDeliveries.findOne({_id: id});
                      if (existingDelivery) {
                        setSupplyDelivery(existingDelivery);
                      }
                      setIsEditing(false);
                    } else {
                      // Cancel new supply delivery creation
                      navigate('/supply-deliveries');
                    }
                  }}
                >
                  Cancel
                </Button>
                {id && id !== 'new' && (
                  <Button 
                    id="deleteSupplyDeliveryButton"
                    onClick={handleDelete}
                    color="error"
                    variant="text"
                    disabled={loading}
                  >
                    Delete
                  </Button>
                )}
                <Button 
                  id="saveSupplyDeliveryButton"
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