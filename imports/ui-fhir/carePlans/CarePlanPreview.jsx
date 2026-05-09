// imports/ui-fhir/carePlans/CarePlanPreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box,
  Stack,
  Paper
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

var statusColorMap = {
  'draft': 'default',
  'active': 'success',
  'on-hold': 'warning',
  'revoked': 'error',
  'completed': 'info',
  'entered-in-error': 'error',
  'unknown': 'default'
};

var activityStatusColorMap = {
  'not-started': 'default',
  'scheduled': 'info',
  'in-progress': 'warning',
  'on-hold': 'warning',
  'completed': 'success',
  'cancelled': 'error',
  'stopped': 'error',
  'unknown': 'default',
  'entered-in-error': 'error'
};

function CarePlanPreview({ resource, form, resourceId, embedded }) {
  var carePlan = resource || form || {};

  var title = get(carePlan, 'title', '');
  var statusValue = get(carePlan, 'status', 'unknown');
  var statusColor = get(statusColorMap, statusValue, 'default');
  var intentValue = get(carePlan, 'intent', '');
  var description = get(carePlan, 'description', '');
  var categoryDisplay = get(carePlan, 'category[0].coding[0].display', '') || get(carePlan, 'category[0].text', '');
  var categoryCode = get(carePlan, 'category[0].coding[0].code', '');
  var subjectDisplay = get(carePlan, 'subject.display', '');
  var subjectReference = get(carePlan, 'subject.reference', '');
  var authorDisplay = get(carePlan, 'author[0].display', '');
  var authorReference = get(carePlan, 'author[0].reference', '');
  var periodStart = get(carePlan, 'period.start', '');
  var periodEnd = get(carePlan, 'period.end', '');
  var noteText = get(carePlan, 'note[0].text', '');
  var activities = get(carePlan, 'activity', []);
  var lastUpdated = get(carePlan, 'meta.lastUpdated', '');

  var formattedStart = periodStart ? moment(periodStart).format('MMMM D, YYYY') : '';
  var formattedEnd = periodEnd ? moment(periodEnd).format('MMMM D, YYYY') : '';
  var formattedLastUpdated = lastUpdated ? moment(lastUpdated).format('MMMM D, YYYY HH:mm') : '';

  var isExistingRecord = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {title || 'Care Plan'}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip label={statusValue} color={statusColor} size="small" />
          {intentValue && (
            <Chip label={intentValue} variant="outlined" size="small" />
          )}
        </Stack>
      </Box>

      {categoryDisplay && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {categoryDisplay}{categoryCode ? ' (' + categoryCode + ')' : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: patient/author + dates */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {subjectDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {subjectDisplay}
              </Typography>
              {subjectReference && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {subjectReference}
                </Typography>
              )}
            </>
          )}
          {authorDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Author
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {authorDisplay}
              </Typography>
              {authorReference && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {authorReference}
                </Typography>
              )}
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {formattedStart && (
            <>
              <Typography variant="overline" color="text.secondary">
                Start Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {formattedStart}
              </Typography>
            </>
          )}
          {formattedEnd && (
            <>
              <Typography variant="overline" color="text.secondary">
                End Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedEnd}
              </Typography>
            </>
          )}
          {formattedLastUpdated && (
            <>
              <Typography variant="overline" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedLastUpdated}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status section */}
      <Box sx={{ py: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Status
        </Typography>
        <Box sx={{ mt: 0.5, display: 'flex', gap: 1 }}>
          <Chip label={statusValue} color={statusColor} size="small" />
          {intentValue && (
            <Chip label={'Intent: ' + intentValue} variant="outlined" size="small" />
          )}
        </Box>
      </Box>

      <Divider />

      {/* Description */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Description
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '60px'
          }}
        >
          {description || 'No description provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Notes */}
      {noteText && (
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
              {noteText}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Activities */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Activities ({activities.length})
        </Typography>
        {activities.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No activities defined.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {activities.map(function(activity, index) {
              var activityDescription = get(activity, 'detail.description', '');
              var activityStatus = get(activity, 'detail.status', 'not-started');
              var activityKind = get(activity, 'detail.kind', '');
              var activityCodeDisplay = get(activity, 'detail.code.coding[0].display', '') || get(activity, 'detail.code.text', '');
              var activityCodeValue = get(activity, 'detail.code.coding[0].code', '');
              var reasonDisplay = get(activity, 'detail.reasonReference[0].display', '');
              var locationDisplay = get(activity, 'detail.location.display', '');

              return (
                <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle2" color="primary">
                      Activity {index + 1}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={activityStatus}
                        color={get(activityStatusColorMap, activityStatus, 'default')}
                        size="small"
                      />
                      {activityKind && (
                        <Chip label={activityKind} variant="outlined" size="small" />
                      )}
                    </Stack>
                  </Box>

                  {activityDescription && (
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {activityDescription}
                    </Typography>
                  )}

                  {activityCodeDisplay && (
                    <Typography variant="body2" color="text.secondary">
                      Code: {activityCodeDisplay}{activityCodeValue ? ' (' + activityCodeValue + ')' : ''}
                    </Typography>
                  )}

                  {reasonDisplay && (
                    <Typography variant="body2" color="text.secondary">
                      Reason: {reasonDisplay}
                    </Typography>
                  )}

                  {locationDisplay && (
                    <Typography variant="body2" color="text.secondary">
                      Location: {locationDisplay}
                    </Typography>
                  )}
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>

      <Divider />

      {/* Footer with ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            CarePlan ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default CarePlanPreview;
