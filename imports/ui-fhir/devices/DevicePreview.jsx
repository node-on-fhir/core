// imports/ui-fhir/devices/DevicePreview.jsx

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
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'active': 'success',
  'inactive': 'default',
  'entered-in-error': 'error',
  'unknown': 'warning'
};

function DevicePreview({ resource, form, resourceId, embedded }) {
  var device = resource || form || {};

  var deviceName = get(device, 'deviceName[0].name', 'Unnamed Device');
  var statusValue = get(device, 'status', 'unknown');
  var statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');
  var typeDisplay = get(device, 'type.text', '') || get(device, 'type.coding[0].display', '');
  var typeCode = get(device, 'type.coding[0].code', '');
  var manufacturer = get(device, 'manufacturer', '');
  var modelNumber = get(device, 'modelNumber', '');
  var serialNumber = get(device, 'serialNumber', '');
  var lotNumber = get(device, 'lotNumber', '');
  var version = get(device, 'version[0].value', '');
  var manufactureDate = get(device, 'manufactureDate', '');
  var expirationDate = get(device, 'expirationDate', '');
  var patientDisplay = get(device, 'patient.display', '');
  var patientReference = get(device, 'patient.reference', '');
  var noteText = get(device, 'note[0].text', '');

  var formattedManufactureDate = manufactureDate ? moment(manufactureDate).format('MMMM D, YYYY') : '';
  var formattedExpirationDate = expirationDate ? moment(expirationDate).format('MMMM D, YYYY') : '';

  var isExistingDevice = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Device name + status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {deviceName}
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {typeDisplay && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {typeDisplay}{typeCode ? ' (' + typeCode + ')' : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {manufacturer && (
            <>
              <Typography variant="overline" color="text.secondary">
                Manufacturer
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {manufacturer}
              </Typography>
            </>
          )}
          {modelNumber && (
            <>
              <Typography variant="overline" color="text.secondary">
                Model
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {modelNumber}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {formattedManufactureDate && (
            <>
              <Typography variant="overline" color="text.secondary">
                Manufactured
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedManufactureDate}
              </Typography>
            </>
          )}
          {formattedExpirationDate && (
            <>
              <Typography variant="overline" color="text.secondary">
                Expires
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedExpirationDate}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Identifiers section */}
      {(serialNumber || lotNumber || version) && (
        <>
          <Box sx={{ py: 2 }}>
            <Stack direction="row" spacing={4}>
              {serialNumber && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Serial Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {serialNumber}
                  </Typography>
                </Box>
              )}
              {lotNumber && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Lot Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {lotNumber}
                  </Typography>
                </Box>
              )}
              {version && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Version
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {version}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
          <Divider />
        </>
      )}

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

      {/* Footer with device ID */}
      {isExistingDevice && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Device ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default DevicePreview;
