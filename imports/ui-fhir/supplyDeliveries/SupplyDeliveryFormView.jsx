// /imports/ui-fhir/supplyDeliveries/SupplyDeliveryFormView.jsx

import React from 'react';

import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Typography,
  Paper,
  Grid,
  InputAdornment
} from '@mui/material';

import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';

import { get } from 'lodash';
import moment from 'moment';

function SupplyDeliveryFormView({ resource, form, isEditing, onChange, isEmbedded }){
  return (
    <Stack spacing={3}>
      {/* Status */}
      <FormControl fullWidth>
        <InputLabel id="status-label">Status</InputLabel>
        <Select
          labelId="status-label"
          id="statusInput"
          name="status"
          value={get(form, 'status', 'in-progress')}
          label="Status"
          onChange={(e) => onChange('status', e.target.value)}
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
        value={get(form, 'typeText', '')}
        onChange={(e) => onChange('typeText', e.target.value)}
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
        value={get(form, 'occurrenceDateTime', '')}
        onChange={(e) => onChange('occurrenceDateTime', e.target.value)}
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
        value={get(form, 'supplierDisplay', '')}
        onChange={(e) => onChange('supplierDisplay', e.target.value)}
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
        value={get(form, 'destinationDisplay', '')}
        onChange={(e) => onChange('destinationDisplay', e.target.value)}
        disabled={!isEditing}
      />

      {/* Receiver */}
      <TextField
        fullWidth
        id="receiverInput"
        name="receiver"
        label="Receiver"
        value={get(form, 'receiverDisplay', '')}
        onChange={(e) => onChange('receiverDisplay', e.target.value)}
        disabled={!isEditing}
      />

      {/* Supplied Item Section */}
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
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
                value={get(form, 'quantityValue', '')}
                onChange={(e) => onChange('quantityValue', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                id="suppliedItemQuantityUnitInput"
                name="quantityUnit"
                label="Unit"
                value={get(form, 'quantityUnit', '')}
                onChange={(e) => onChange('quantityUnit', e.target.value)}
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
            value={get(form, 'itemDescription', '')}
            onChange={(e) => onChange('itemDescription', e.target.value)}
            disabled={!isEditing}
          />
        </Stack>
      </Paper>

      {/* References Section */}
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
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
            value={get(form, 'basedOnReference', '')}
            onChange={(e) => onChange('basedOnReference', e.target.value)}
            disabled={!isEditing}
            helperText="Reference to the supply request this delivery fulfills"
          />

          {/* Part Of */}
          <TextField
            fullWidth
            id="partOfInput"
            name="partOf"
            label="Part Of (Parent Supply Delivery)"
            value={get(form, 'partOfReference', '')}
            onChange={(e) => onChange('partOfReference', e.target.value)}
            disabled={!isEditing}
            helperText="Reference to a parent supply delivery"
          />
        </Stack>
      </Paper>

      {/* Patient */}
      <TextField
        fullWidth
        id="patientInput"
        label="Patient"
        value={get(form, 'patientDisplay', '')}
        disabled
        helperText={get(resource, 'patient.reference', '') || 'Patient reference will be assigned'}
      />

      {/* Notes */}
      <TextField
        fullWidth
        id="notesInput"
        name="notes"
        label="Notes"
        multiline={true}
        rows={4}
        value={get(form, 'notes', '')}
        onChange={(e) => onChange('notes', e.target.value)}
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default SupplyDeliveryFormView;
