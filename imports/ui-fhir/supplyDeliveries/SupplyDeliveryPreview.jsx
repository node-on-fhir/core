// /imports/ui-fhir/supplyDeliveries/SupplyDeliveryPreview.jsx

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
  'in-progress': 'info',
  'completed': 'success',
  'abandoned': 'error',
  'entered-in-error': 'error'
};

const statusLabelMap = {
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'abandoned': 'Abandoned',
  'entered-in-error': 'Entered in Error'
};

function SupplyDeliveryPreview({ resource, resourceId, embedded }){
  const status = get(resource, 'status', '');
  const statusLabel = get(statusLabelMap, status, status);
  const statusColor = get(statusColorMap, status, 'default');

  const typeText = get(resource, 'type.text', '');
  const occurrenceDateTime = get(resource, 'occurrenceDateTime', '');
  const formattedDate = occurrenceDateTime ? moment(occurrenceDateTime).format('MMMM D, YYYY [at] h:mm A') : '';

  const patientDisplay = get(resource, 'patient.display', '');
  const patientReference = get(resource, 'patient.reference', '');

  const supplierDisplay = get(resource, 'supplier.display', '');
  const destinationDisplay = get(resource, 'destination.display', '');
  const receiverDisplay = get(resource, 'receiver[0].display', '');

  const quantityValue = get(resource, 'suppliedItem.quantity.value', '');
  const quantityUnit = get(resource, 'suppliedItem.quantity.unit', '');
  const itemDescription = get(resource, 'suppliedItem.itemCodeableConcept.text', '');

  const basedOnReference = get(resource, 'basedOn[0].reference', '');
  const partOfReference = get(resource, 'partOf[0].reference', '');
  const notes = get(resource, 'note[0].text', '');

  // Build subtitle from type
  let subtitleParts = [];
  if (typeText) {
    subtitleParts.push(typeText);
  }
  if (quantityValue && quantityUnit) {
    subtitleParts.push(quantityValue + ' ' + quantityUnit);
  } else if (quantityValue) {
    subtitleParts.push('Qty: ' + quantityValue);
  }
  const subtitle = subtitleParts.join(' \u2014 ');

  const isExistingDelivery = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Patient
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {patientDisplay || 'Unspecified'}
          </Typography>
          {patientReference && (
            <Typography variant="caption" color="text.secondary">
              {patientReference}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Occurrence Date
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {formattedDate || 'No date'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Status */}
      <Box sx={{ py: 2 }}>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      <Divider />

      {/* Supplier and Destination */}
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
            Destination
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {destinationDisplay || 'Not specified'}
          </Typography>
        </Box>
      </Box>

      {receiverDisplay && (
        <>
          <Divider />
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary">
              Receiver
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {receiverDisplay}
            </Typography>
          </Box>
        </>
      )}

      <Divider />

      {/* Supplied Item */}
      {(itemDescription || quantityValue) && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Supplied Item
            </Typography>
            {itemDescription && (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {itemDescription}
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

      {/* References */}
      {(basedOnReference || partOfReference) && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              References
            </Typography>
            {basedOnReference && (
              <Typography variant="body2" color="text.secondary">
                Based On: {basedOnReference}
              </Typography>
            )}
            {partOfReference && (
              <Typography variant="body2" color="text.secondary">
                Part Of: {partOfReference}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Notes */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Notes
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '100px'
          }}
        >
          {notes || 'No notes provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Footer with resource ID */}
      {isExistingDelivery && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Supply Delivery ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default SupplyDeliveryPreview;
