// imports/ui-fhir/endpoints/EndpointPreview.jsx

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
  'active': 'success',
  'suspended': 'warning',
  'error': 'error',
  'off': 'default',
  'entered-in-error': 'error'
};

const statusLabelMap = {
  'active': 'Active',
  'suspended': 'Suspended',
  'error': 'Error',
  'off': 'Off',
  'entered-in-error': 'Entered in Error'
};

const connectionTypeLabelMap = {
  'hl7-fhir-rest': 'HL7 FHIR REST',
  'hl7-fhir-msg': 'HL7 FHIR Messaging',
  'hl7v2-mllp': 'HL7v2 MLLP',
  'secure-email': 'Secure Email',
  'direct-project': 'Direct Project',
  'cds-hooks-service': 'CDS Hooks Service',
  'ihe-xcpd': 'IHE XCPD',
  'ihe-xca': 'IHE XCA',
  'ihe-xdr': 'IHE XDR',
  'ihe-xds': 'IHE XDS',
  'dicom-wado-rs': 'DICOM WADO-RS',
  'dicom-qido-rs': 'DICOM QIDO-RS',
  'dicom-stow-rs': 'DICOM STOW-RS'
};

//===========================================================================
// COMPONENT

function EndpointPreview({ resource, resourceId, embedded }) {
  var endpoint = resource || {};
  var isExistingRecord = !!resourceId;

  var endpointName = get(endpoint, 'name', 'Unnamed Endpoint');
  var address = get(endpoint, 'address', '');

  var statusValue = get(endpoint, 'status', 'active');
  var statusLabel = get(statusLabelMap, statusValue, statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');

  var connectionTypeCode = get(endpoint, 'connectionType[0].coding[0].code', '') || get(endpoint, 'connectionType.0.coding.0.code', '');
  var connectionTypeDisplay = get(connectionTypeLabelMap, connectionTypeCode, '') || get(endpoint, 'connectionType[0].coding[0].display', '') || get(endpoint, 'connectionType.0.coding.0.display', '');

  var orgDisplay = get(endpoint, 'managingOrganization.display', '');
  var orgReference = get(endpoint, 'managingOrganization.reference', '');

  var payloadType = get(endpoint, 'payloadType[0].text', '') || get(endpoint, 'payloadType.0.text', '');
  var payloadMimeType = get(endpoint, 'payloadMimeType[0]', '') || get(endpoint, 'payloadMimeType.0', '');

  var periodStart = get(endpoint, 'period.start', '');
  var periodEnd = get(endpoint, 'period.end', '');
  var formattedStart = periodStart ? moment(periodStart).format('MMMM D, YYYY') : '';
  var formattedEnd = periodEnd ? moment(periodEnd).format('MMMM D, YYYY') : '';

  var headers = get(endpoint, 'header', []);

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Endpoint name + status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {endpointName}
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {address && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {address}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Connection Type left, Organization right */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {connectionTypeDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Connection Type
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {connectionTypeDisplay}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {(orgDisplay || orgReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Managing Organization
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {orgDisplay || 'Unspecified'}
              </Typography>
              {orgReference && (
                <Typography variant="caption" color="text.secondary">
                  {orgReference}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Payload Configuration */}
      {(payloadType || payloadMimeType) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Payload Configuration
            </Typography>
            {payloadType && (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {payloadType}
              </Typography>
            )}
            {payloadMimeType && (
              <Typography variant="body2" color="text.secondary">
                MIME Type: {payloadMimeType}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Validity Period */}
      {(formattedStart || formattedEnd) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Validity Period
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formattedStart || 'Not specified'} - {formattedEnd || 'Not specified'}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Headers */}
      {headers.length > 0 && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Custom Headers
            </Typography>
            {headers.map(function(header, index) {
              return (
                <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {header}
                </Typography>
              );
            })}
          </Box>
          <Divider />
        </>
      )}

      {/* Notes placeholder */}
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
          No notes provided.
        </Typography>
      </Box>

      <Divider />

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Endpoint ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default EndpointPreview;
