// imports/ui-fhir/imagingStudies/ImagingStudyPreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box,
  Stack
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

const statusOptions = [
  { value: 'registered', label: 'Registered' },
  { value: 'available', label: 'Available' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'registered': 'info',
  'available': 'success',
  'cancelled': 'default',
  'entered-in-error': 'error',
  'unknown': 'warning'
};

function ImagingStudyPreview({ resource, resourceId, embedded }) {
  var imagingStudy = resource || {};

  var description = get(imagingStudy, 'description', 'Untitled Imaging Study');
  var statusValue = get(imagingStudy, 'status', 'unknown');
  var statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');
  var modalityDisplay = get(imagingStudy, 'modality[0].display', '');
  var modalityCode = get(imagingStudy, 'modality[0].code', '');
  var startedDate = get(imagingStudy, 'started', '');
  var formattedStarted = startedDate ? moment(startedDate).format('MMMM D, YYYY [at] h:mm A') : '';
  var patientDisplay = get(imagingStudy, 'subject.display', '');
  var patientReference = get(imagingStudy, 'subject.reference', '');
  var referrerDisplay = get(imagingStudy, 'referrer.display', '');
  var locationDisplay = get(imagingStudy, 'location.display', '');
  var numberOfSeries = get(imagingStudy, 'numberOfSeries', '');
  var numberOfInstances = get(imagingStudy, 'numberOfInstances', '');
  var procedureCode = get(imagingStudy, 'procedureCode[0].coding[0].code', '');
  var procedureDisplay = get(imagingStudy, 'procedureCode[0].coding[0].display', '') ||
                           get(imagingStudy, 'procedureCode[0].text', '');
  var interpreterDisplay = get(imagingStudy, 'interpreter[0].display', '');
  var endpointDisplay = get(imagingStudy, 'endpoint[0].display', '');
  var reasonCode = get(imagingStudy, 'reasonCode[0].coding[0].code', '');
  var reasonDisplay = get(imagingStudy, 'reasonCode[0].coding[0].display', '') ||
                        get(imagingStudy, 'reasonCode[0].text', '');
  var noteText = get(imagingStudy, 'note[0].text', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title (description) + Status Chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {description}
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {/* Subtitle: modality display + code */}
      {modalityDisplay && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {modalityDisplay}{modalityCode ? ' (' + modalityCode + ')' : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient/Referrer (left), Started/Location (right) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {patientDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {patientDisplay}
              </Typography>
            </>
          )}
          {patientReference && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {patientReference}
            </Typography>
          )}
          {referrerDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Referrer
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {referrerDisplay}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {formattedStarted && (
            <>
              <Typography variant="overline" color="text.secondary">
                Started
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {formattedStarted}
              </Typography>
            </>
          )}
          {locationDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
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

      {/* Series / Instances / Procedure section */}
      {(numberOfSeries || numberOfInstances || procedureDisplay) && (
        <>
          <Box sx={{ py: 2 }}>
            <Stack direction="row" spacing={4}>
              {numberOfSeries && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Series
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {numberOfSeries}
                  </Typography>
                </Box>
              )}
              {numberOfInstances && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Instances
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {numberOfInstances}
                  </Typography>
                </Box>
              )}
              {procedureDisplay && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Procedure
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {procedureDisplay}{procedureCode ? ' (' + procedureCode + ')' : ''}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
          <Divider />
        </>
      )}

      {/* Interpreter / Endpoint section */}
      {(interpreterDisplay || endpointDisplay) && (
        <>
          <Box sx={{ py: 2 }}>
            <Stack direction="row" spacing={4}>
              {interpreterDisplay && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Interpreter
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {interpreterDisplay}
                  </Typography>
                </Box>
              )}
              {endpointDisplay && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Endpoint
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {endpointDisplay}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
          <Divider />
        </>
      )}

      {/* Reason section */}
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

      {/* Notes section */}
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

      {/* Footer with study ID */}
      {resourceId && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Imaging Study ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ImagingStudyPreview;
