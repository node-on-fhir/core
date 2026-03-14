// imports/ui-fhir/procedures/ProcedurePreview.jsx

import React from 'react';

import {
  Box,
  Typography,
  Chip,
  Divider
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// STATUS OPTIONS

const statusOptions = [
  { value: 'preparation', label: 'Preparation' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'aborted', label: 'Aborted' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'preparation': 'info',
  'in-progress': 'warning',
  'suspended': 'default',
  'aborted': 'error',
  'completed': 'success',
  'entered-in-error': 'error',
  'unknown': 'default'
};

//===========================================================================
// COMPONENT

function ProcedurePreview({ resource, resourceId, embedded }) {
  const procedure = resource || {};

  const procedureName = get(procedure, 'code.coding[0].display', '') || get(procedure, 'code.text', 'Unnamed Procedure');
  const procedureCode = get(procedure, 'code.coding[0].code', '');
  const statusValue = get(procedure, 'status', 'unknown');
  const statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
  const statusColor = get(statusColorMap, statusValue, 'default');

  const patientDisplay = get(procedure, 'subject.display', '');
  const patientReference = get(procedure, 'subject.reference', '');
  const performedDate = get(procedure, 'performedDateTime', '');
  const formattedDate = performedDate ? moment(performedDate).format('MMMM D, YYYY [at] h:mm A') : '';

  const performerDisplay = get(procedure, 'performer[0].actor.display', '');
  const performerReference = get(procedure, 'performer[0].actor.reference', '');

  const categoryDisplay = get(procedure, 'category.coding[0].display', '');
  const categoryCode = get(procedure, 'category.coding[0].code', '');

  const bodySiteDisplay = get(procedure, 'bodySite[0].coding[0].display', '');
  const bodySiteCode = get(procedure, 'bodySite[0].coding[0].code', '');

  const reasonDisplay = get(procedure, 'reasonCode[0].coding[0].display', '');
  const reasonCode = get(procedure, 'reasonCode[0].coding[0].code', '');

  const outcomeText = get(procedure, 'outcome.text', '');
  const locationDisplay = get(procedure, 'location.display', '');
  const noteText = get(procedure, 'note[0].text', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Procedure name + status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {procedureName}
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {procedureCode && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Code: {procedureCode}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient left, Date right */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {(patientDisplay || patientReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {patientDisplay || 'Unspecified'}
              </Typography>
              {patientReference && (
                <Typography variant="caption" color="text.secondary">
                  {patientReference}
                </Typography>
              )}
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {formattedDate && (
            <>
              <Typography variant="overline" color="text.secondary">
                Performed
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedDate}
              </Typography>
            </>
          )}
          {locationDisplay && (
            <>
              <Typography variant="overline" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Location
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {locationDisplay}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Performer */}
      {(performerDisplay || performerReference) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Performer
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {performerDisplay || 'Unspecified'}
            </Typography>
            {performerReference && (
              <Typography variant="caption" color="text.secondary">
                {performerReference}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Category */}
      {(categoryDisplay || categoryCode) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Category
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {categoryDisplay}{categoryCode ? ' (' + categoryCode + ')' : ''}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Body Site */}
      {(bodySiteDisplay || bodySiteCode) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Body Site
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {bodySiteDisplay}{bodySiteCode ? ' (' + bodySiteCode + ')' : ''}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Reason */}
      {(reasonDisplay || reasonCode) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Reason
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {reasonDisplay}{reasonCode ? ' (' + reasonCode + ')' : ''}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Outcome */}
      {outcomeText && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Outcome
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {outcomeText}
            </Typography>
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
          {noteText || 'No notes provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Footer with record ID */}
      {resourceId && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Procedure ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ProcedurePreview;
