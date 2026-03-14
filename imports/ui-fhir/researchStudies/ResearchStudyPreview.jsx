// /imports/ui-fhir/researchStudies/ResearchStudyPreview.jsx

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
  { value: 'active', label: 'Active' },
  { value: 'administratively-completed', label: 'Administratively Completed' },
  { value: 'approved', label: 'Approved' },
  { value: 'closed-to-accrual', label: 'Closed to Accrual' },
  { value: 'closed-to-accrual-and-intervention', label: 'Closed to Accrual and Intervention' },
  { value: 'completed', label: 'Completed' },
  { value: 'disapproved', label: 'Disapproved' },
  { value: 'in-review', label: 'In Review' },
  { value: 'temporarily-closed-to-accrual', label: 'Temporarily Closed to Accrual' },
  { value: 'temporarily-closed-to-accrual-and-intervention', label: 'Temporarily Closed to Accrual and Intervention' },
  { value: 'withdrawn', label: 'Withdrawn' }
];

const statusColorMap = {
  'active': 'success',
  'administratively-completed': 'default',
  'approved': 'info',
  'closed-to-accrual': 'warning',
  'closed-to-accrual-and-intervention': 'warning',
  'completed': 'success',
  'disapproved': 'error',
  'in-review': 'info',
  'temporarily-closed-to-accrual': 'warning',
  'temporarily-closed-to-accrual-and-intervention': 'warning',
  'withdrawn': 'error'
};

const phaseOptions = [
  { value: 'n-a', label: 'N/A' },
  { value: 'early-phase-1', label: 'Early Phase 1' },
  { value: 'phase-1', label: 'Phase 1' },
  { value: 'phase-1-phase-2', label: 'Phase 1/Phase 2' },
  { value: 'phase-2', label: 'Phase 2' },
  { value: 'phase-2-phase-3', label: 'Phase 2/Phase 3' },
  { value: 'phase-3', label: 'Phase 3' },
  { value: 'phase-4', label: 'Phase 4' }
];

const categoryOptions = [
  { value: 'interventional', label: 'Interventional' },
  { value: 'observational', label: 'Observational' },
  { value: 'expanded-access', label: 'Expanded Access' }
];

function ResearchStudyPreview({ resource, form, resourceId, embedded }){
  const statusLabel = get(statusOptions.find(function(opt){ return opt.value === form.status; }), 'label', form.status);
  const statusColor = get(statusColorMap, form.status, 'default');
  const phaseLabel = get(phaseOptions.find(function(opt){ return opt.value === form.phase; }), 'label', form.phase);
  const categoryLabel = get(categoryOptions.find(function(opt){ return opt.value === form.category; }), 'label', form.category);

  // Build subtitle from category and phase
  let subtitleParts = [];
  if (categoryLabel) {
    subtitleParts.push(categoryLabel);
  }
  if (phaseLabel) {
    subtitleParts.push(phaseLabel);
  }
  const subtitle = subtitleParts.join(' \u2014 ');

  // Format period dates
  const periodStart = form.periodStart ? moment(form.periodStart).format('MMMM D, YYYY') : '';
  const periodEnd = form.periodEnd ? moment(form.periodEnd).format('MMMM D, YYYY') : '';

  const isExistingStudy = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title */}
      {form.title && (
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
          {form.title}
        </Typography>
      )}

      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: PI and Status */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Principal Investigator
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {form.principalInvestigator || 'Unspecified'}
          </Typography>
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

      {/* Focus */}
      {(form.focusCode || form.focusDisplay) && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
              Focus
            </Typography>
            <Typography variant="body1">
              {form.focusDisplay || form.focusCode}
              {form.focusCode && form.focusDisplay && (
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  ({form.focusCode})
                </Typography>
              )}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Enrollment */}
      {(form.enrollmentTarget || form.enrollmentActual) && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Enrollment Actual
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {form.enrollmentActual || '0'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="overline" color="text.secondary">
                Enrollment Target
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {form.enrollmentTarget || '0'}
              </Typography>
            </Box>
          </Box>
          <Divider />
        </>
      )}

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
            minHeight: '100px'
          }}
        >
          {form.description || 'No description provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Notes */}
      {form.notes && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Notes
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {form.notes}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with study ID */}
      {isExistingStudy && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Research Study ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ResearchStudyPreview;
