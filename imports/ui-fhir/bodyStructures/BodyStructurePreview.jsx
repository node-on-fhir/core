// imports/ui-fhir/bodyStructures/BodyStructurePreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box,
  Stack
} from '@mui/material';

import { get } from 'lodash';

function BodyStructurePreview({ resource, form, resourceId, embedded }) {
  var bodyStructure = resource || form || {};

  var description = get(bodyStructure, 'description', '');
  var isActive = get(bodyStructure, 'active', true);
  var morphologyText = get(bodyStructure, 'morphology.text', '') || get(bodyStructure, 'morphology.coding.0.display', '');
  var morphologyCode = get(bodyStructure, 'morphology.coding.0.code', '');
  var structureText = get(bodyStructure, 'includedStructure.0.structure.text', '') ||
    get(bodyStructure, 'includedStructure.0.structure.coding.0.display', '');
  var structureCode = get(bodyStructure, 'includedStructure.0.structure.coding.0.code', '');
  var patientDisplay = get(bodyStructure, 'patient.display', '');
  var patientReference = get(bodyStructure, 'patient.reference', '');

  var isExistingRecord = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + active chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {description || 'Body Structure'}
        </Typography>
        <Chip
          label={isActive ? 'Active' : 'Inactive'}
          color={isActive ? 'success' : 'default'}
          size="small"
        />
      </Box>

      {structureText && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {structureText}{structureCode ? ' (' + structureCode + ')' : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {morphologyText && (
            <>
              <Typography variant="overline" color="text.secondary">
                Morphology
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {morphologyText}
              </Typography>
            </>
          )}
          {morphologyCode && (
            <>
              <Typography variant="overline" color="text.secondary">
                Morphology Code
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {morphologyCode}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {structureText && (
            <>
              <Typography variant="overline" color="text.secondary">
                Body Location
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {structureText}
              </Typography>
            </>
          )}
          {structureCode && (
            <>
              <Typography variant="overline" color="text.secondary">
                Structure Code
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {structureCode}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status */}
      <Box sx={{ py: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Status
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          <Chip
            label={isActive ? 'Active' : 'Inactive'}
            color={isActive ? 'success' : 'default'}
            size="small"
          />
        </Box>
      </Box>

      <Divider />

      {/* Patient association */}
      {(patientDisplay || patientReference) && (
        <>
          <Box sx={{ py: 2 }}>
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
            minHeight: '60px'
          }}
        >
          {description || 'No description provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Footer with ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            BodyStructure ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default BodyStructurePreview;
