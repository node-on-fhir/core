// /imports/ui-fhir/researchSubjects/ResearchSubjectPreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

const statusOptions = [
  { value: 'candidate', label: 'Candidate' },
  { value: 'eligible', label: 'Eligible' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'ineligible', label: 'Ineligible' },
  { value: 'not-registered', label: 'Not Registered' },
  { value: 'off-study', label: 'Off Study' },
  { value: 'on-study', label: 'On Study' },
  { value: 'on-study-intervention', label: 'On Study Intervention' },
  { value: 'on-study-observation', label: 'On Study Observation' },
  { value: 'pending-on-study', label: 'Pending On Study' },
  { value: 'potential-candidate', label: 'Potential Candidate' },
  { value: 'screening', label: 'Screening' },
  { value: 'withdrawn', label: 'Withdrawn' }
];

const statusColorMap = {
  'candidate': 'info',
  'eligible': 'info',
  'follow-up': 'warning',
  'ineligible': 'error',
  'not-registered': 'default',
  'off-study': 'default',
  'on-study': 'success',
  'on-study-intervention': 'success',
  'on-study-observation': 'success',
  'pending-on-study': 'warning',
  'potential-candidate': 'info',
  'screening': 'warning',
  'withdrawn': 'error'
};

function ResearchSubjectPreview({ resource, form, resourceId, embedded }){
  const statusLabel = get(statusOptions.find(function(opt){ return opt.value === form.status; }), 'label', form.status);
  const statusColor = get(statusColorMap, form.status, 'default');
  const subjectReference = get(resource, 'subject.reference', '');
  const studyReference = get(resource, 'study.reference', '');
  const consentReference = get(resource, 'consent.reference', '');

  // Format period dates
  const periodStart = form.periodStart ? moment(form.periodStart).format('MMMM D, YYYY') : '';
  const periodEnd = form.periodEnd ? moment(form.periodEnd).format('MMMM D, YYYY') : '';

  // Build subtitle from study name
  const subtitle = form.study || '';

  const isExistingSubject = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Study: {subtitle}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Subject and Status */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Subject / Patient
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {form.subject || 'Unspecified'}
          </Typography>
          {subjectReference && (
            <Typography variant="caption" color="text.secondary">
              {subjectReference}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Status
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip label={statusLabel} color={statusColor} size="small" />
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Study Reference */}
      <Box sx={{ py: 2.5 }}>
        <Typography variant="overline" color="text.secondary">
          Research Study
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {form.study || 'Unspecified'}
        </Typography>
        {studyReference && (
          <Typography variant="caption" color="text.secondary">
            {studyReference}
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Period */}
      {(periodStart || periodEnd) && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Period Start
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {periodStart || 'Not set'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="overline" color="text.secondary">
                Period End
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {periodEnd || 'Not set'}
              </Typography>
            </Box>
          </Box>
          <Divider />
        </>
      )}

      {/* Arms */}
      {(form.assignedArm || form.actualArm) && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Assigned Arm
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {form.assignedArm || 'Not assigned'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="overline" color="text.secondary">
                Actual Arm
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {form.actualArm || 'Not assigned'}
              </Typography>
            </Box>
          </Box>
          <Divider />
        </>
      )}

      {/* Consent */}
      {form.consent && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
              Consent
            </Typography>
            <Typography variant="body1">
              {form.consent}
            </Typography>
            {consentReference && (
              <Typography variant="caption" color="text.secondary">
                {consentReference}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with resource ID */}
      {isExistingSubject && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Research Subject ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ResearchSubjectPreview;
