// /imports/ui-fhir/supplyRequests/SupplyRequestFormView.jsx

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
  Grid
} from '@mui/material';

import InventoryIcon from '@mui/icons-material/Inventory';

import { get } from 'lodash';

function SupplyRequestFormView({ resource, form, isEditing, onChange, isEmbedded }){
  return (
    <Stack spacing={3}>
      {/* Status */}
      <FormControl fullWidth>
        <InputLabel id="status-label">Status</InputLabel>
        <Select
          labelId="status-label"
          id="statusInput"
          name="status"
          value={get(form, 'status', 'draft')}
          label="Status"
          onChange={(e) => onChange('status', e.target.value)}
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
          value={get(form, 'priority', 'routine')}
          label="Priority"
          onChange={(e) => onChange('priority', e.target.value)}
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
        value={get(form, 'category', '')}
        onChange={(e) => onChange('category', e.target.value)}
        disabled={!isEditing}
        helperText="Category of supply (e.g., central, non-stock)"
      />

      {/* Item Section */}
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
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
            value={get(form, 'itemDescription', '')}
            onChange={(e) => onChange('itemDescription', e.target.value)}
            disabled={!isEditing}
            helperText="Description of the item being requested"
          />

          {/* Item Code */}
          <TextField
            fullWidth
            id="itemCodeInput"
            name="itemCode"
            label="Item Code"
            value={get(form, 'itemCode', '')}
            onChange={(e) => onChange('itemCode', e.target.value)}
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
                value={get(form, 'quantityValue', '')}
                onChange={(e) => onChange('quantityValue', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                id="quantityUnitInput"
                name="quantityUnit"
                label="Unit"
                value={get(form, 'quantityUnit', '')}
                onChange={(e) => onChange('quantityUnit', e.target.value)}
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
        value={get(form, 'authoredOn', '')}
        onChange={(e) => onChange('authoredOn', e.target.value)}
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
        value={get(form, 'occurrenceDateTime', '')}
        onChange={(e) => onChange('occurrenceDateTime', e.target.value)}
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
        value={get(form, 'requesterDisplay', '')}
        onChange={(e) => onChange('requesterDisplay', e.target.value)}
        disabled={!isEditing}
        helperText="Who initiated the request"
      />

      <TextField
        fullWidth
        id="supplierInput"
        name="supplier"
        label="Supplier"
        value={get(form, 'supplierDisplay', '')}
        onChange={(e) => onChange('supplierDisplay', e.target.value)}
        disabled={!isEditing}
        helperText="Who is intended to fulfill the request"
      />

      {/* Delivery Locations */}
      <TextField
        fullWidth
        id="deliverFromInput"
        name="deliverFrom"
        label="Deliver From"
        value={get(form, 'deliverFromDisplay', '')}
        onChange={(e) => onChange('deliverFromDisplay', e.target.value)}
        disabled={!isEditing}
        helperText="Where the supply is expected to come from"
      />

      <TextField
        fullWidth
        id="deliverToInput"
        name="deliverTo"
        label="Deliver To"
        value={get(form, 'deliverToDisplay', '')}
        onChange={(e) => onChange('deliverToDisplay', e.target.value)}
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
        value={get(form, 'reason', '')}
        onChange={(e) => onChange('reason', e.target.value)}
        disabled={!isEditing}
        helperText="Why the supply item was requested"
      />
    </Stack>
  );
}

export default SupplyRequestFormView;
