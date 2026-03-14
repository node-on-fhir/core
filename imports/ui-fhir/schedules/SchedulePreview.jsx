// imports/ui-fhir/schedules/SchedulePreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

function SchedulePreview({ resource, form, resourceId, embedded }){
  const formattedStart = form.planningHorizonStart ? moment(form.planningHorizonStart).format('MMMM D, YYYY') : '';
  const formattedEnd = form.planningHorizonEnd ? moment(form.planningHorizonEnd).format('MMMM D, YYYY') : '';

  // Build subtitle from service category and service type
  let subtitleParts = [];
  if (form.serviceCategoryDisplay) {
    subtitleParts.push(form.serviceCategoryDisplay);
  }
  if (form.serviceTypeDisplay) {
    subtitleParts.push(form.serviceTypeDisplay);
  }
  const subtitle = subtitleParts.join(' \u2014 ');

  const isExistingSchedule = resourceId && resourceId !== 'new';

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
            Actor
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {form.actorDisplay || 'Unspecified'}
          </Typography>
          {form.actorReference && (
            <Typography variant="caption" color="text.secondary">
              {form.actorReference}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Specialty
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {form.specialtyDisplay || 'None'}
          </Typography>
          {form.specialtyCode && (
            <Typography variant="caption" color="text.secondary">
              {form.specialtyCode}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status */}
      <Box sx={{ py: 2 }}>
        <Chip
          label={form.active ? 'Active' : 'Inactive'}
          color={form.active ? 'success' : 'default'}
          size="small"
        />
        {form.identifierValue && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            Identifier: {form.identifierValue}
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Planning Horizon */}
      <Box sx={{ py: 2.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Planning Horizon
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Start
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formattedStart || 'Not set'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              End
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formattedEnd || 'Not set'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Comment */}
      {form.comment && (
        <>
          <Box sx={{ py: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Comment
            </Typography>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8
              }}
            >
              {form.comment}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Notes */}
      {form.notes && (
        <>
          <Box sx={{ py: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Notes
            </Typography>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8
              }}
            >
              {form.notes}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with resource ID */}
      {isExistingSchedule && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Schedule ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default SchedulePreview;
