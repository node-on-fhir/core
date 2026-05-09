// /imports/ui-fhir/allergyIntolerances/AllergyIntolerancePreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

const clinicalStatusColorMap = {
  'active': 'error',
  'inactive': 'default',
  'resolved': 'success'
};

const criticalityColorMap = {
  'low': 'success',
  'high': 'error',
  'unable-to-assess': 'warning'
};

const severityColorMap = {
  'mild': 'success',
  'moderate': 'warning',
  'severe': 'error'
};

function AllergyIntolerancePreview({ resource, resourceId, embedded }){
  const clinicalStatus = get(resource, 'clinicalStatus.coding[0].code', '');
  const clinicalStatusDisplay = get(resource, 'clinicalStatus.coding[0].display', clinicalStatus);
  const clinicalStatusColor = get(clinicalStatusColorMap, clinicalStatus, 'default');

  const verificationStatus = get(resource, 'verificationStatus.coding[0].code', '');
  const verificationStatusDisplay = get(resource, 'verificationStatus.coding[0].display', verificationStatus);

  const allergyType = get(resource, 'type', '');
  const category = get(resource, 'category[0]', '');
  const criticality = get(resource, 'criticality', '');
  const criticalityColor = get(criticalityColorMap, criticality, 'default');

  const reactionText = get(resource, 'reaction[0].manifestation[0].text', '');
  const severity = get(resource, 'reaction[0].severity', '');
  const severityColor = get(severityColorMap, severity, 'default');

  // Build subtitle from type and category
  let subtitleParts = [];
  if (allergyType) {
    subtitleParts.push(allergyType.charAt(0).toUpperCase() + allergyType.slice(1));
  }
  if (category) {
    subtitleParts.push(category.charAt(0).toUpperCase() + category.slice(1));
  }
  const subtitle = subtitleParts.join(' \u2014 ');

  const codeDisplay = get(resource, 'code.coding[0].display', '') || get(resource, 'code.text', '');
  const codeValue = get(resource, 'code.coding[0].code', '');

  const isExisting = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Subtitle */}
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient and Onset Date */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Patient
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {get(resource, 'patient.display', '') || 'Unspecified'}
          </Typography>
          {get(resource, 'patient.reference') && (
            <Typography variant="caption" color="text.secondary">
              {get(resource, 'patient.reference')}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Onset Date
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {get(resource, 'onsetDateTime') ? moment(get(resource, 'onsetDateTime')).format('MMMM D, YYYY') : 'Not recorded'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Status chips */}
      <Box sx={{ py: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {clinicalStatusDisplay && (
          <Chip label={'Clinical: ' + clinicalStatusDisplay} color={clinicalStatusColor} size="small" />
        )}
        {verificationStatusDisplay && (
          <Chip label={'Verification: ' + verificationStatusDisplay} color="default" size="small" variant="outlined" />
        )}
        {criticality && (
          <Chip label={'Criticality: ' + criticality} color={criticalityColor} size="small" />
        )}
      </Box>

      <Divider />

      {/* Allergen Code */}
      <Box sx={{ py: 2.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Allergen
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {codeDisplay || 'No allergen specified'}
        </Typography>
        {codeValue && (
          <Typography variant="caption" color="text.secondary">
            SNOMED CT: {codeValue}
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Reaction and Severity */}
      {(reactionText || severity) && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Reaction
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {reactionText || 'No reaction details'}
            </Typography>
            {severity && (
              <Box sx={{ mt: 1 }}>
                <Chip label={'Severity: ' + severity} color={severityColor} size="small" />
              </Box>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Recorder and Asserter */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Recorded By
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {get(resource, 'recorder.display', '') || 'Unknown'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Asserted By
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {get(resource, 'asserter.display', '') || 'Unknown'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Notes */}
      {get(resource, 'note[0].text') && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Notes
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {get(resource, 'note[0].text')}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with ID */}
      {isExisting && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Allergy/Intolerance ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default AllergyIntolerancePreview;
