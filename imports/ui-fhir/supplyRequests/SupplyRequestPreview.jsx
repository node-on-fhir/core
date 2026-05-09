// /imports/ui-fhir/supplyRequests/SupplyRequestPreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

const statusColorMap = {
  'draft': 'default',
  'active': 'info',
  'suspended': 'warning',
  'cancelled': 'error',
  'completed': 'success',
  'entered-in-error': 'error',
  'unknown': 'default'
};

const statusLabelMap = {
  'draft': 'Draft',
  'active': 'Active',
  'suspended': 'Suspended',
  'cancelled': 'Cancelled',
  'completed': 'Completed',
  'entered-in-error': 'Entered in Error',
  'unknown': 'Unknown'
};

const priorityColorMap = {
  'routine': 'default',
  'urgent': 'warning',
  'asap': 'warning',
  'stat': 'error'
};

const priorityLabelMap = {
  'routine': 'Routine',
  'urgent': 'Urgent',
  'asap': 'ASAP',
  'stat': 'Stat'
};

function SupplyRequestPreview({ resource, resourceId, embedded }){
  const status = get(resource, 'status', '');
  const statusLabel = get(statusLabelMap, status, status);
  const statusColor = get(statusColorMap, status, 'default');

  const priority = get(resource, 'priority', '');
  const priorityLabel = get(priorityLabelMap, priority, priority);
  const priorityColor = get(priorityColorMap, priority, 'default');

  const category = get(resource, 'category.text', '');
  const itemDescription = get(resource, 'itemCodeableConcept.text', '');
  const itemCode = get(resource, 'itemCodeableConcept.coding[0].code', '');
  const quantityValue = get(resource, 'quantity.value', '');
  const quantityUnit = get(resource, 'quantity.unit', '');

  const authoredOn = get(resource, 'authoredOn', '');
  const formattedAuthoredOn = authoredOn ? moment(authoredOn).format('MMMM D, YYYY [at] h:mm A') : '';

  const occurrenceDateTime = get(resource, 'occurrenceDateTime', '');
  const formattedOccurrence = occurrenceDateTime ? moment(occurrenceDateTime).format('MMMM D, YYYY [at] h:mm A') : '';

  const requesterDisplay = get(resource, 'requester.display', '');
  const supplierDisplay = get(resource, 'supplier[0].display', '');
  const deliverFromDisplay = get(resource, 'deliverFrom.display', '');
  const deliverToDisplay = get(resource, 'deliverTo.display', '');
  const reason = get(resource, 'reasonCode[0].text', '');

  // Build subtitle from category and item
  let subtitleParts = [];
  if (category) {
    subtitleParts.push(category);
  }
  if (itemDescription) {
    subtitleParts.push(itemDescription);
  } else if (itemCode) {
    subtitleParts.push('Code: ' + itemCode);
  }
  const subtitle = subtitleParts.join(' \u2014 ');

  const isExistingRequest = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Requester and Authored On */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Requester
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {requesterDisplay || 'Unspecified'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Authored On
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {formattedAuthoredOn || 'No date'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Status and Priority */}
      <Box sx={{ py: 2, display: 'flex', gap: 1 }}>
        <Chip label={statusLabel} color={statusColor} size="small" />
        {priority && (
          <Chip label={priorityLabel} color={priorityColor} size="small" variant="outlined" />
        )}
      </Box>

      <Divider />

      {/* Item Details */}
      {(itemDescription || quantityValue) && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Item Details
            </Typography>
            {itemDescription && (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {itemDescription}
              </Typography>
            )}
            {itemCode && (
              <Typography variant="body2" color="text.secondary">
                Code: {itemCode}
              </Typography>
            )}
            {quantityValue && (
              <Typography variant="body2" color="text.secondary">
                Quantity: {quantityValue} {quantityUnit}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Supplier and Delivery Locations */}
      {(supplierDisplay || deliverFromDisplay || deliverToDisplay) && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Supplier
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {supplierDisplay || 'Not specified'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="overline" color="text.secondary">
                Deliver To
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {deliverToDisplay || 'Not specified'}
              </Typography>
            </Box>
          </Box>
          {deliverFromDisplay && (
            <Box sx={{ pb: 2.5 }}>
              <Typography variant="overline" color="text.secondary">
                Deliver From
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {deliverFromDisplay}
              </Typography>
            </Box>
          )}
          <Divider />
        </>
      )}

      {/* Occurrence Date */}
      {formattedOccurrence && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary">
              When Needed
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formattedOccurrence}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Reason */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Reason
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '60px'
          }}
        >
          {reason || 'No reason provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Footer with resource ID */}
      {isExistingRequest && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Supply Request ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default SupplyRequestPreview;
