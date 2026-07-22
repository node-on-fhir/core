// imports/ui/extensible/ProminentHeader.jsx
//
// Patient-context banner rendered inside Header.jsx's <Collapse> when
// settings.public.defaults.prominentHeader is true and a patient is selected.
// Brand packages can replace this app-wide via
// components: { ProminentHeader: ... } on their workflow default export
// (see extensions/API.md).
//
// Props: { patient, lastUpdated } — when `patient` is absent the component
// self-tracks Session.get('selectedPatient'), so a full-Header override can
// compose <ProminentHeader /> bare.
//
// LAYOUT CONSTRAINT: the banner toolbar must stay 64px tall — App.jsx sizes
// --header-height to 128px (main toolbar + banner) when the prominent header
// is showing, so a taller override will clip.
//
// Extracted from imports/ui/Header.jsx (DemographicItem helper, demographic
// data prep, medicalPolicies subscription, and the inner AppBar).

import React from 'react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTheme as useMuiTheme } from '@mui/material/styles';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import { get } from 'lodash';
import moment from 'moment';

import { FhirUtilities } from '../../FhirUtilities';
import { pluckGender, pluckBirthSex, pluckSexForClinicalUse, pluckKaryotype } from '/imports/lib/PatientSexGender';
import { getDemographicPolicy } from '/imports/lib/MedicalPolicies';
import { ServerConfiguration } from '/imports/lib/schemas/SimpleSchemas/ServerConfiguration';

// ==============================================================================
// Helper: one demographic cell in the prominent-header patient banner.
// Renders nothing when there is no value (empty → not displayed). A value marked
// `confirmed === false` is EXTRAPOLATED (not recorded): shown greyed/italic with a
// warning icon + tooltip, and it is never written back to the record.

function textInfo(value){
  return value ? { label: value, confirmed: true } : null;
}

export function DemographicItem({ label, info }){
  if(!info || !info.label){
    return null;
  }

  const inferred = info.confirmed === false;
  let tooltipText = '';
  if(inferred){
    const source = (info.inferredFrom === 'gender') ? 'administrative gender' : (info.inferredFrom || 'other data');
    tooltipText = 'Inferred from ' + source + ' — not a recorded value and not saved to the record.';
  }

  return (
    <Box>
      <Typography variant="caption" sx={{ opacity: 0.7 }}>{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography
          variant="body2"
          sx={{ fontStyle: inferred ? 'italic' : 'normal', opacity: inferred ? 0.6 : 1 }}
        >
          {info.label}
        </Typography>
        {inferred && (
          <Tooltip title={tooltipText}>
            <WarningAmberIcon fontSize="small" sx={{ opacity: 0.8 }} />
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

// ==============================================================================
// Main Component

export function ProminentHeader({ patient, lastUpdated }){

  const muiTheme = useMuiTheme();

  // Self-track the selected patient when no prop is supplied, so the banner
  // stays composable from full-Header overrides.
  const sessionPatient = useTracker(function(){
    return Session.get('selectedPatient');
  }, [lastUpdated]);
  const selectedPatient = patient || sessionPatient;

  // Runtime demographic-display overrides (Medical Policies), published from
  // ServerConfiguration. Layered over the settings baseline by getDemographicPolicy.
  const demographicPolicyOverride = useTracker(function(){
    Meteor.subscribe('medicalPolicies');
    const policyDoc = ServerConfiguration.findOne({ configType: 'medicalPolicies' });
    return policyDoc ? policyDoc.data : null;
  }, []);

  // Prepare patient demographic data
  let patientName = '';
  let patientBirthDate = '';
  let patientIdentifier = '';
  let patientPhone = '';

  // Effective sex/gender display policy (settings baseline; runtime overrides from
  // the Medical Policies config layer in via getDemographicPolicy(override)).
  const demographicPolicy = getDemographicPolicy(demographicPolicyOverride);

  // Sex/gender/karyotype resolved through the single shared formatter. Each is
  // null when there is nothing to show (empty → not displayed). Birth Sex may be
  // inferred from administrative gender when policy allows; inferred values render
  // provisionally (warning icon) and are never persisted.
  let genderInfo = null;
  let birthSexInfo = null;
  let sexInfo = null;
  let karyotypeInfo = null;

  if(selectedPatient){
    patientName = FhirUtilities.pluckName(selectedPatient);
    patientBirthDate = get(selectedPatient, 'birthDate', '');

    // Get first identifier
    let identifiers = get(selectedPatient, 'identifier', []);
    if(identifiers.length > 0){
      patientIdentifier = get(identifiers[0], 'value', '');
    }

    // Get phone
    let telecoms = get(selectedPatient, 'telecom', []);
    telecoms.forEach(function(telecom){
      if(get(telecom, 'system') === 'phone'){
        patientPhone = get(telecom, 'value', '');
      }
    });

    genderInfo = pluckGender(selectedPatient);
    birthSexInfo = pluckBirthSex(selectedPatient, { inferFromGender: demographicPolicy.inferBirthSexFromGender });
    sexInfo = pluckSexForClinicalUse(selectedPatient);
    karyotypeInfo = pluckKaryotype(selectedPatient, { inferFromGender: demographicPolicy.inferKaryotypeFromGender });
  }

  return (
    <AppBar
      position="static"
      aria-label="Patient context"
      sx={{
        boxShadow: 1,
        backgroundColor: muiTheme.palette.appbar?.main || muiTheme.palette.primary.main,
        color: muiTheme.palette.appbar?.contrastText || muiTheme.palette.primary.contrastText
      }}
    >
      <Toolbar sx={{ paddingLeft: '75px !important', minHeight: '64px' }}>
        <Box display="flex" alignItems="center" gap={3}>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.5px'
              }}
            >
              {patientName}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <DemographicItem label="ID" info={textInfo(patientIdentifier || get(selectedPatient, 'id', ''))} />
          {demographicPolicy.showKaryotype && <DemographicItem label="Karyotype" info={karyotypeInfo} />}
          <DemographicItem label="Birth Date" info={textInfo(patientBirthDate ? moment(patientBirthDate).format('MMM DD, YYYY') : '')} />
          {demographicPolicy.showBirthSex && <DemographicItem label="Birth Sex" info={birthSexInfo} />}
          {demographicPolicy.showGender && <DemographicItem label="Gender" info={genderInfo} />}
          {demographicPolicy.showSex && <DemographicItem label="Sex" info={sexInfo} />}
          <DemographicItem label="Phone" info={textInfo(patientPhone)} />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default ProminentHeader;
