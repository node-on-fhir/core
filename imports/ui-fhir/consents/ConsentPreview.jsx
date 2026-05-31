// imports/ui-fhir/consents/ConsentPreview.jsx

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
  'draft': 'default',
  'proposed': 'info',
  'active': 'success',
  'rejected': 'error',
  'inactive': 'default',
  'entered-in-error': 'error'
};

const statusLabelMap = {
  'draft': 'Draft',
  'proposed': 'Proposed',
  'active': 'Active',
  'rejected': 'Rejected',
  'inactive': 'Inactive',
  'entered-in-error': 'Entered in Error'
};

const scopeLabelMap = {
  'patient-privacy': 'Privacy Consent',
  'treatment': 'Treatment',
  'research': 'Research',
  'adr': 'Advanced Care Directive'
};

const categoryLabelMap = {
  'IDSCL': 'Information disclosure',
  'RESEARCH': 'Research information access',
  'RSDID': 'Research subject directory',
  'RSREID': 'Research re-identification'
};

const securityLabelMap = {
  'N': 'Normal',
  'R': 'Restricted',
  'V': 'Very Restricted'
};

//===========================================================================
// COMPONENT

function ConsentPreview({ resource, resourceId, embedded }) {
  var consent = resource || {};
  var isExistingRecord = !!resourceId;

  var statusValue = get(consent, 'status', 'draft');
  var statusLabel = get(statusLabelMap, statusValue, statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');

  var scopeCode = get(consent, 'scope.coding.0.code', '') || get(consent, 'scope.coding[0].code', '');
  var scopeDisplay = get(scopeLabelMap, scopeCode, '') || get(consent, 'scope.coding.0.display', '') || get(consent, 'scope.coding[0].display', '');

  var categoryCode = get(consent, 'category.0.coding.0.code', '') || get(consent, 'category[0].coding[0].code', '');
  var categoryDisplay = get(categoryLabelMap, categoryCode, '') || get(consent, 'category.0.coding.0.display', '') || get(consent, 'category[0].coding[0].display', '');

  var patientDisplay = get(consent, 'patient.display', '');
  var patientReference = get(consent, 'patient.reference', '');

  var dateTime = get(consent, 'dateTime', '');
  var formattedDate = dateTime ? moment(dateTime).format('MMMM D, YYYY') : '';

  var policyRuleText = get(consent, 'policyRule.text', '');
  var policyRuleCode = get(consent, 'policyRule.coding[0].code', '') || get(consent, 'policyRule.coding.0.code', '');

  var securityLabelCode = get(consent, 'provision.securityLabel.0.code', '') || get(consent, 'provision.provision.0.securityLabel.0.code', '');
  var securityLabelDisplay = get(securityLabelMap, securityLabelCode, securityLabelCode);

  var classes = get(consent, 'provision.class') || get(consent, 'provision.provision.0.class') || [];
  var classDisplay = classes.map(function(c) { return c.code || c.display || c; }).join(', ');

  var actorRoleCode = get(consent, 'provision.actor.0.role.coding.0.code', '') || get(consent, 'provision.provision.0.actor.0.role.coding.0.code', '');
  var actorRoleDisplay = get(consent, 'provision.actor.0.role.coding.0.display', '') || get(consent, 'provision.provision.0.actor.0.role.coding.0.display', '');
  var actorReferenceValue = get(consent, 'provision.actor.0.reference.reference', '') || get(consent, 'provision.provision.0.actor.0.reference.reference', '');
  var actorDisplayValue = get(consent, 'provision.actor.0.reference.display', '') || get(consent, 'provision.provision.0.actor.0.reference.display', '');

  var organizationDisplay = get(consent, 'organization.0.display', '');
  var sourceReferenceValue = get(consent, 'sourceReference.reference', '');
  var sourceDisplayValue = get(consent, 'sourceReference.display', '');

  var noteText = get(consent, 'note.0.text', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Scope title + status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {scopeDisplay || 'Consent'}
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {categoryDisplay && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Category: {categoryDisplay}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient left, Date right */}
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
          {formattedDate && (
            <>
              <Typography variant="overline" color="text.secondary">
                Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedDate}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Policy Rule */}
      {(policyRuleText || policyRuleCode) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Policy Rule
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {policyRuleText || policyRuleCode}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Security Label */}
      {securityLabelCode && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Security Label
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip label={securityLabelDisplay} variant="outlined" size="small" />
            </Box>
          </Box>
          <Divider />
        </>
      )}

      {/* Resource Classes */}
      {classDisplay && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Resource Classes
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {classDisplay}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Actor */}
      {(actorRoleDisplay || actorRoleCode || actorDisplayValue || actorReferenceValue) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Actor
            </Typography>
            {(actorRoleDisplay || actorRoleCode) && (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Role: {actorRoleDisplay || actorRoleCode}
              </Typography>
            )}
            {actorDisplayValue && (
              <Typography variant="body2">
                {actorDisplayValue}
              </Typography>
            )}
            {actorReferenceValue && (
              <Typography variant="caption" color="text.secondary">
                {actorReferenceValue}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Organization */}
      {organizationDisplay && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Organization
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {organizationDisplay}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Source */}
      {(sourceDisplayValue || sourceReferenceValue) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Source
            </Typography>
            {sourceDisplayValue && (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {sourceDisplayValue}
              </Typography>
            )}
            {sourceReferenceValue && (
              <Typography variant="caption" color="text.secondary">
                {sourceReferenceValue}
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

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Consent ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ConsentPreview;
