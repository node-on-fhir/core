// imports/ui-fhir/measureReports/MeasureReportPreview.jsx

import React from 'react';
import {
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

const statusColorMap = {
  'complete': 'success',
  'pending': 'warning',
  'error': 'error'
};

const typeColorMap = {
  'individual': 'info',
  'subject-list': 'default',
  'summary': 'default',
  'data-exchange': 'default'
};

//===========================================================================
// COMPONENT

function MeasureReportPreview({ resource, resourceId, embedded }) {
  var measureReport = resource || {};
  var isExistingRecord = !!resourceId;

  // Core fields
  var identifier = get(measureReport, 'identifier[0].value', '');
  var statusValue = get(measureReport, 'status', 'pending');
  var statusColor = get(statusColorMap, statusValue, 'default');
  var typeValue = get(measureReport, 'type', '');
  var typeColor = get(typeColorMap, typeValue, 'default');

  // Subject
  var subjectDisplay = get(measureReport, 'subject.display', '');
  var subjectReference = get(measureReport, 'subject.reference', '');

  // Dates
  var reportDate = get(measureReport, 'date', '');
  var formattedDate = reportDate ? moment(reportDate).format('MMMM D, YYYY') : '';
  var periodStart = get(measureReport, 'period.start', '');
  var formattedPeriodStart = periodStart ? moment(periodStart).format('MMMM D, YYYY') : '';
  var periodEnd = get(measureReport, 'period.end', '');
  var formattedPeriodEnd = periodEnd ? moment(periodEnd).format('MMMM D, YYYY') : '';

  // Reporter
  var reporterDisplay = get(measureReport, 'reporter.display', '');
  var reporterReference = get(measureReport, 'reporter.reference', '');

  // Measure
  var measureUrl = get(measureReport, 'measure', '');

  // Improvement Notation
  var improvementNotation = get(measureReport, 'improvementNotation.text', '');

  // Group information
  var groupCode = get(measureReport, 'group[0].code.text', '');
  var populationCode = get(measureReport, 'group[0].population[0].code.text', '');
  var populationCount = get(measureReport, 'group[0].population[0].count', '');
  var measureScore = get(measureReport, 'group[0].measureScore.value', '');
  var stratifierCode = get(measureReport, 'group[0].stratifier[0].code[0].text', '');
  var stratifierValue = get(measureReport, 'group[0].stratifier[0].stratum[0].value.text', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + identifier subtitle */}
      <Typography variant="h5" sx={{ fontWeight: 500, mb: 0.5 }}>
        Measure Report
      </Typography>
      {identifier && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
          Identifier: {identifier}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Subject left, Date right */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {(subjectDisplay || subjectReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Subject
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {subjectDisplay || 'Unspecified'}
              </Typography>
              {subjectReference && (
                <Typography variant="caption" color="text.secondary">
                  {subjectReference}
                </Typography>
              )}
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {formattedDate && (
            <>
              <Typography variant="overline" color="text.secondary">
                Report Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedDate}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status and Type chips */}
      <Box sx={{ py: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip label={'Status: ' + statusValue} color={statusColor} size="small" />
        {typeValue && (
          <Chip label={'Type: ' + typeValue} color={typeColor} size="small" variant="outlined" />
        )}
        {improvementNotation && (
          <Chip label={'Improvement: ' + improvementNotation} size="small" variant="outlined" />
        )}
      </Box>

      <Divider />

      {/* Period */}
      {(formattedPeriodStart || formattedPeriodEnd) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Period
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formattedPeriodStart || 'N/A'} - {formattedPeriodEnd || 'N/A'}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Reporter */}
      {(reporterDisplay || reporterReference) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Reporter
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {reporterDisplay || 'Unspecified'}
            </Typography>
            {reporterReference && (
              <Typography variant="caption" color="text.secondary">
                {reporterReference}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Measure URL */}
      {measureUrl && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Measure
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>
              {measureUrl}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Group Information */}
      {(groupCode || populationCode || measureScore !== '') && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Group Information
            </Typography>
            {groupCode && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Group Code</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{groupCode}</Typography>
              </Box>
            )}
            {populationCode && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Population Code</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{populationCode}</Typography>
              </Box>
            )}
            {(populationCount !== '' && populationCount !== null && populationCount !== undefined) && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Population Count</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{populationCount}</Typography>
              </Box>
            )}
            {(measureScore !== '' && measureScore !== null && measureScore !== undefined) && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Measure Score</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{measureScore}</Typography>
              </Box>
            )}
            {stratifierCode && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Stratifier Code</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{stratifierCode}</Typography>
              </Box>
            )}
            {stratifierValue && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Stratifier Value</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{stratifierValue}</Typography>
              </Box>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            MeasureReport ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default MeasureReportPreview;
