// imports/ui-fhir/groups/MemberSearchDialog.jsx

import React from 'react';

import {
  Dialog,
  DialogTitle,
  IconButton,
  Typography,
  Box,
  Alert
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';

import { get } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';
import PractitionerSearchDialog from '/imports/components/PractitionerSearchDialog';
import OrganizationSearchDialog from '/imports/components/OrganizationSearchDialog';

const log = (Meteor.Logger ? Meteor.Logger.for('MemberSearchDialog') : console);

function MemberSearchDialog(props) {
  var {
    open,
    onClose,
    groupType,
    onSelect
  } = props;

  function handlePatientSelect(patientId, patient) {
    log.debug('Patient selected:', { patientId });
    var displayName = get(patient, 'name.0.text', '');
    if (!displayName) {
      var given = get(patient, 'name.0.given.0', '');
      var family = get(patient, 'name.0.family', '');
      displayName = (given + ' ' + family).trim();
    }
    // Handle flattened patient objects where name is a plain string
    if (!displayName && typeof get(patient, 'name') === 'string') {
      displayName = get(patient, 'name', '');
    }

    var fhirId = get(patient, 'id', patientId);

    var member = {
      entity: {
        reference: 'Patient/' + fhirId,
        display: displayName || 'Patient ' + fhirId
      },
      period: {
        start: moment().format('YYYY-MM-DD')
      },
      inactive: false
    };

    if (typeof onSelect === 'function') {
      onSelect(member);
    }
  }

  function handlePractitionerSelect(practitionerId, practitioner) {
    console.log('[MemberSearchDialog] Practitioner selected:', practitionerId);
    var displayName = get(practitioner, 'name.0.text', '');
    if (!displayName) {
      var given = get(practitioner, 'name.0.given.0', '');
      var family = get(practitioner, 'name.0.family', '');
      displayName = (given + ' ' + family).trim();
    }
    // Handle flattened practitioner objects where name is a plain string
    if (!displayName && typeof get(practitioner, 'name') === 'string') {
      displayName = get(practitioner, 'name', '');
    }

    var fhirId = get(practitioner, 'id', practitionerId);

    var member = {
      entity: {
        reference: 'Practitioner/' + fhirId,
        display: displayName || 'Practitioner ' + fhirId
      },
      period: {
        start: moment().format('YYYY-MM-DD')
      },
      inactive: false
    };

    if (typeof onSelect === 'function') {
      onSelect(member);
    }
  }

  function handleOrganizationSelect(orgId, organization) {
    console.log('[MemberSearchDialog] Organization selected:', orgId);
    var displayName = get(organization, 'name', '');
    var fhirId = get(organization, 'id', orgId);

    var member = {
      entity: {
        reference: 'Organization/' + fhirId,
        display: displayName || 'Organization ' + fhirId
      },
      period: {
        start: moment().format('YYYY-MM-DD')
      },
      inactive: false
    };

    if (typeof onSelect === 'function') {
      onSelect(member);
    }
  }

  function renderSearchContent() {
    switch (groupType) {
      case 'person':
      case 'animal':
        return (
          <PatientSearchDialog
            onSelect={handlePatientSelect}
            defaultSearchTerm=""
            hideFhirBarcode={true}
          />
        );
      case 'practitioner':
        return (
          <PractitionerSearchDialog
            onSelect={handlePractitionerSelect}
            defaultSearchTerm=""
            hideFhirBarcode={true}
          />
        );
      case 'organization':
        return (
          <OrganizationSearchDialog
            onSelect={handleOrganizationSelect}
            defaultSearchTerm=""
            hideFhirBarcode={true}
          />
        );
      default:
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="info">
              Member search for type "{groupType}" is not yet supported. Supported types: person, animal, practitioner, organization.
            </Alert>
          </Box>
        );
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="span">
          Add Member
        </Typography>
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      {renderSearchContent()}
    </Dialog>
  );
}

export default MemberSearchDialog;
