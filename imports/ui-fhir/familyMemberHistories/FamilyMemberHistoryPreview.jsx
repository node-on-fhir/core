// imports/ui-fhir/familyMemberHistories/FamilyMemberHistoryPreview.jsx

import React from 'react';
import {
  Typography,
  Box,
  Chip,
  Divider,
  Tooltip
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

const statusColorMap = {
  'partial': 'warning',
  'completed': 'success',
  'entered-in-error': 'error',
  'health-unknown': 'default'
};

//===========================================================================
// COMPONENT

function FamilyMemberHistoryPreview({ resource, resourceId, embedded }) {
  var familyMemberHistory = resource || {};
  var isExistingRecord = !!resourceId;

  var relationshipDisplay = get(familyMemberHistory, 'relationship.text', '') ||
    get(familyMemberHistory, 'relationship.coding.0.display', 'Unknown Relationship');
  var memberName = get(familyMemberHistory, 'name', '');
  var titleText = memberName ? memberName + ' (' + relationshipDisplay + ')' : relationshipDisplay;

  var statusValue = get(familyMemberHistory, 'status', 'partial');
  var statusLabel = statusValue.charAt(0).toUpperCase() + statusValue.slice(1).replace(/-/g, ' ');
  var statusColor = get(statusColorMap, statusValue, 'default');

  var patientDisplay = get(familyMemberHistory, 'patient.display', '');
  var patientReference = get(familyMemberHistory, 'patient.reference', '');

  var bornDate = get(familyMemberHistory, 'bornDate', '');
  var formattedBornDate = bornDate ? moment(bornDate).format('MMMM D, YYYY') : '';

  var ageValue = get(familyMemberHistory, 'ageAge.value', null);
  var isDeceased = get(familyMemberHistory, 'deceasedBoolean', false);
  var deceasedAgeValue = get(familyMemberHistory, 'deceasedAge.value', null);

  var conditions = get(familyMemberHistory, 'condition', []);

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {titleText}
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {relationshipDisplay && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Relationship: {relationshipDisplay}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient left, Birth Date right */}
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
          {formattedBornDate && (
            <>
              <Typography variant="overline" color="text.secondary">
                Birth Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedBornDate}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Age and Deceased Info */}
      <Box sx={{ py: 2, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {ageValue !== null && (
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
              Current Age
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {ageValue} years
            </Typography>
          </Box>
        )}
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
            Deceased
          </Typography>
          <Chip
            label={isDeceased ? 'Yes' : 'No'}
            color={isDeceased ? 'error' : 'default'}
            size="small"
          />
        </Box>
        {isDeceased && deceasedAgeValue !== null && (
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
              Age at Death
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {deceasedAgeValue} years
            </Typography>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Health Conditions */}
      <Box sx={{ py: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Health Conditions
        </Typography>
        {conditions.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {conditions.map(function(condition, index) {
              var conditionText = get(condition, 'code.text', '');
              var onsetAge = get(condition, 'onsetAge.value', null);
              var noteText = get(condition, 'note[0].text', '');
              var label = conditionText;
              if (onsetAge !== null) {
                label = label + ' (onset: ' + onsetAge + ' yrs)';
              }
              return (
                <Tooltip key={index} title={noteText || ''}>
                  <Chip label={label} color="primary" variant="outlined" />
                </Tooltip>
              );
            })}
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No conditions recorded.
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            FamilyMemberHistory ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default FamilyMemberHistoryPreview;
