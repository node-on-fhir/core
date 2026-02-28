// imports/ui-fhir/consents/ConsentFormView.jsx

import React from 'react';
import {
  TextField,
  Grid,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// COMPONENT

function ConsentFormView({ resource, isEditing, onChange, isEmbedded, onSearchPatient }) {
  var consent = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Grid container spacing={3}>
      {/* Status */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="statusSelect"
          fullWidth
          select
          SelectProps={{ native: true }}
          label="Status"
          value={get(consent, 'status', '')}
          onChange={function(e) { handleChange('status', e.target.value); }}
          disabled={!isEditing}
        >
          <option value="draft">Draft</option>
          <option value="proposed">Proposed</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
          <option value="inactive">Inactive</option>
          <option value="entered-in-error">Entered in Error</option>
        </TextField>
      </Grid>

      {/* Date/Time */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="dateTimeInput"
          fullWidth
          type="date"
          label="Date"
          value={moment(get(consent, 'dateTime')).format('YYYY-MM-DD')}
          onChange={function(e) { handleChange('dateTime', e.target.value); }}
          disabled={!isEditing}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {/* Category */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="categoryInput"
          fullWidth
          select
          SelectProps={{ native: true }}
          label="Category"
          value={get(consent, 'category.0.coding.0.code', '')}
          onChange={function(e) {
            var categoryMap = {
              'IDSCL': 'Information disclosure',
              'RESEARCH': 'Research information access',
              'RSDID': 'Research subject directory',
              'RSREID': 'Research re-identification'
            };

            var newCategory = {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                code: e.target.value,
                display: categoryMap[e.target.value] || e.target.value
              }],
              text: categoryMap[e.target.value] || e.target.value
            };

            handleChange('category.0', newCategory);
          }}
          disabled={!isEditing}
        >
          <option value="">Select a category</option>
          <option value="IDSCL">Information disclosure</option>
          <option value="RESEARCH">Research information access</option>
          <option value="RSDID">Research subject directory</option>
          <option value="RSREID">Research re-identification</option>
        </TextField>
      </Grid>

      {/* Patient */}
      <Grid item xs={12}>
        <TextField
          id="patientDisplay"
          fullWidth
          label="Patient"
          value={get(consent, 'patient.display', '')}
          onChange={function(e) { handleChange('patient.display', e.target.value); }}
          disabled={!isEditing}
          helperText={get(consent, 'patient.reference', '') || 'No patient reference set'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Search for patient">
                  <IconButton
                    onClick={function() {
                      if (typeof onSearchPatient === 'function') {
                        onSearchPatient();
                      }
                    }}
                    edge="end"
                    disabled={!isEditing}
                  >
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      {/* Scope */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="scopeInput"
          fullWidth
          select
          SelectProps={{ native: true }}
          label="Scope"
          value={get(consent, 'scope.coding.0.code', '')}
          onChange={function(e) {
            var scopeMap = {
              'patient-privacy': 'Privacy Consent',
              'treatment': 'Treatment',
              'research': 'Research',
              'adr': 'Advanced Care Directive'
            };
            handleChange('scope', {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/consentscope',
                code: e.target.value,
                display: scopeMap[e.target.value] || e.target.value
              }]
            });
          }}
          disabled={!isEditing}
        >
          <option value="">Select a scope</option>
          <option value="patient-privacy">Privacy Consent</option>
          <option value="treatment">Treatment</option>
          <option value="research">Research</option>
          <option value="adr">Advanced Care Directive</option>
        </TextField>
      </Grid>

      {/* Policy Rule */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="policyRuleInput"
          fullWidth
          label="Policy Rule"
          value={get(consent, 'policyRule.text', '')}
          onChange={function(e) {
            handleChange('policyRule', {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                code: 'OPTIN'
              }],
              text: e.target.value
            });
          }}
          disabled={!isEditing}
          helperText="Policy rule for consent"
        />
      </Grid>

      {/* Security Label */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="securityLabelSelect"
          fullWidth
          select
          SelectProps={{ native: true }}
          label="Security Label"
          value={get(consent, 'provision.securityLabel.0.code', '') || get(consent, 'provision.provision.0.securityLabel.0.code', '')}
          onChange={function(e) {
            var securityLabelMap = {
              'N': 'normal',
              'R': 'restricted',
              'V': 'very restricted'
            };
            if (get(consent, 'provision.provision.0')) {
              handleChange('provision.provision.0.securityLabel.0', {
                system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
                code: e.target.value,
                display: securityLabelMap[e.target.value] || e.target.value
              });
            } else {
              handleChange('provision.securityLabel.0', {
                system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
                code: e.target.value,
                display: securityLabelMap[e.target.value] || e.target.value
              });
            }
          }}
          disabled={!isEditing}
        >
          <option value="">Select security label</option>
          <option value="N">Normal</option>
          <option value="R">Restricted</option>
          <option value="V">Very Restricted</option>
        </TextField>
      </Grid>

      {/* Class */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="classInput"
          fullWidth
          label="Resource Classes"
          value={(function() {
            var classes = get(consent, 'provision.class') ||
                          get(consent, 'provision.provision.0.class') || [];
            return classes.map(function(c) { return c.code || c.display || c; }).join(', ');
          })()}
          onChange={function(e) {
            var classValues = e.target.value.split(',').map(function(v) { return v.trim(); }).filter(function(v) { return v; });
            var classes = classValues.map(function(code) {
              return { code: code, display: code };
            });
            if (get(consent, 'provision.provision.0')) {
              handleChange('provision.provision.0.class', classes);
            } else {
              handleChange('provision.class', classes);
            }
          }}
          disabled={!isEditing}
          helperText="Comma-separated resource types (e.g., Patient, Observation, Procedure)"
        />
      </Grid>

      {/* Actor Role */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="actorRoleSelect"
          fullWidth
          select
          SelectProps={{ native: true }}
          label="Actor Role"
          value={get(consent, 'provision.actor.0.role.coding.0.code', '') ||
                 get(consent, 'provision.provision.0.actor.0.role.coding.0.code', '')}
          onChange={function(e) {
            var roleMap = {
              'PAT': 'patient',
              'PROV': 'provider',
              'DELEGATEE': 'delegatee',
              'GUAR': 'guarantor',
              'CONSENTER': 'consenter',
              'CONSENTEE': 'consentee',
              'SUBJECT': 'subject of consent',
              'DELEGATOR': 'delegator',
              'SYSTEM': 'system'
            };
            var path = get(consent, 'provision.provision.0') ? 'provision.provision.0' : 'provision';
            handleChange(path + '.actor.0.role', {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/v3-RoleClass',
                code: e.target.value,
                display: roleMap[e.target.value] || e.target.value
              }]
            });
          }}
          disabled={!isEditing}
        >
          <option value="">Select actor role</option>
          <option value="PAT">Patient</option>
          <option value="PROV">Provider</option>
          <option value="DELEGATEE">Delegatee</option>
          <option value="GUAR">Guarantor</option>
          <option value="CONSENTER">Consenter</option>
          <option value="CONSENTEE">Consentee</option>
          <option value="SUBJECT">Subject of Consent</option>
          <option value="DELEGATOR">Delegator</option>
          <option value="SYSTEM">System</option>
        </TextField>
      </Grid>

      {/* Actor Reference */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="actorReferenceInput"
          fullWidth
          label="Actor Reference"
          value={get(consent, 'provision.actor.0.reference.reference', '') ||
                 get(consent, 'provision.provision.0.actor.0.reference.reference', '')}
          onChange={function(e) {
            var path = get(consent, 'provision.provision.0') ? 'provision.provision.0' : 'provision';
            handleChange(path + '.actor.0.reference.reference', e.target.value);
          }}
          disabled={!isEditing}
          helperText="Reference to the actor (e.g., Patient/123, Practitioner/456)"
        />
      </Grid>

      {/* Actor Display */}
      <Grid item xs={12}>
        <TextField
          id="actorDisplayInput"
          fullWidth
          label="Actor Display Name"
          value={get(consent, 'provision.actor.0.reference.display', '') ||
                 get(consent, 'provision.provision.0.actor.0.reference.display', '')}
          onChange={function(e) {
            var path = get(consent, 'provision.provision.0') ? 'provision.provision.0' : 'provision';
            handleChange(path + '.actor.0.reference.display', e.target.value);
          }}
          disabled={!isEditing}
          helperText="Display name for the actor"
        />
      </Grid>

      {/* Organization */}
      <Grid item xs={12}>
        <TextField
          id="organizationInput"
          fullWidth
          label="Organization"
          value={get(consent, 'organization.0.display', '')}
          onChange={function(e) { handleChange('organization.0.display', e.target.value); }}
          disabled={!isEditing}
          helperText="Organization that manages the consent"
        />
      </Grid>

      {/* Source Reference */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="sourceReferenceInput"
          fullWidth
          label="Source Reference"
          value={get(consent, 'sourceReference.reference', '')}
          onChange={function(e) { handleChange('sourceReference.reference', e.target.value); }}
          disabled={!isEditing}
          helperText="Reference to source consent document"
        />
      </Grid>

      {/* Source Display */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="sourceDisplayInput"
          fullWidth
          label="Source Display"
          value={get(consent, 'sourceReference.display', '')}
          onChange={function(e) { handleChange('sourceReference.display', e.target.value); }}
          disabled={!isEditing}
          helperText="Display text for source document"
        />
      </Grid>

      {/* Notes */}
      <Grid item xs={12}>
        <TextField
          id="notesTextarea"
          fullWidth
          multiline
          rows={4}
          label="Notes"
          value={get(consent, 'note.0.text', '')}
          onChange={function(e) { handleChange('note.0.text', e.target.value); }}
          disabled={!isEditing}
        />
      </Grid>
    </Grid>
  );
}

export default ConsentFormView;
