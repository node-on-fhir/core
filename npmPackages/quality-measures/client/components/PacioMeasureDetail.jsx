// packages/quality-measures/client/components/PacioMeasureDetail.jsx
//
// Shows PACIO Connectathon measure logic in human-readable form.
// I-CARE: renders the 15-section ToC completeness checklist from the
// evaluator's sectionResults (single source of truth: lib/toc-sections.js).
// CMS1317v1: renders the three OR'd numerator paths.

import React from 'react';
import { get } from 'lodash';

import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert
} from '@mui/material';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ScienceIcon from '@mui/icons-material/Science';
import DescriptionIcon from '@mui/icons-material/Description';

import { REQUIRED_TOC_SECTIONS } from '../../lib/toc-sections';

// ADI document type LOINC codes (numerator path 1).
// Displays are the LOINC long common names (verified against loinc.org).
// Legacy non-LOINC codes (89666-0, 89897-1) still count in the evaluator but
// are not shown here as qualifying types for new documents.
const ADI_LOINC_CODES = [
  { code: '42348-3', display: 'Advance Healthcare Directives' },
  { code: '75320-2', display: 'Advance Directive' },
  { code: '81334-5', display: 'Personal Advance Care Plan' },
  { code: '64298-3', display: 'Power of Attorney' },
  { code: '92664-2', display: 'Power of Attorney and Living Will' },
  { code: '93037-0', display: 'Portable Medical Order (POLST/MOLST)' },
  { code: '81351-9', display: 'DNR Order (Reported)' }
];

function triStateIcon(state) {
  if (state === true) return <CheckCircleIcon color="success" fontSize="small" />;
  if (state === false) return <CancelIcon color="error" fontSize="small" />;
  return <DescriptionIcon color="disabled" fontSize="small" />;
}

function PacioMeasureDetail(props) {
  const { measureId, evaluationResult } = props;

  const isICARE = measureId === 'PACIO-ICARE-v1';
  const isCMS1317 = measureId === 'CMS1317v1';

  if (!isICARE && !isCMS1317) {
    return null;
  }

  return (
    <Card sx={{ bgcolor: 'background.paper', mt: 2 }}>
      <CardHeader
        title={isICARE ? 'I-CARE Measure Detail' : 'CMS1317v1 Measure Detail'}
        subheader={isICARE
          ? 'Completeness of Transitions of Care Documentation'
          : 'Advance Care Planning (draft eCQM modeled on Quality ID #047)'}
        action={
          <Chip
            icon={<ScienceIcon />}
            label="Exploratory / Draft"
            color="warning"
            size="small"
            variant="outlined"
          />
        }
      />
      <CardContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          {isICARE
            ? 'Exploratory PACIO measure concept tested at the July 2026 CMS Connectathon. Not a finalized candidate measure.'
            : 'Exploratory PACIO-FHIR mapping of the draft eCQM CMS1317v1 for the July 2026 CMS Connectathon. The eCQM is QDM-specified; this mapping is what the track is testing.'}
        </Alert>

        {isICARE && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Measure Logic
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Initial Population:</strong> Patients discharged from hospital to post-acute care during the measurement period.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Denominator:</strong> Same as initial population.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Denominator Exclusion:</strong> Patients who died during the encounter or were discharged against medical advice.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Numerator:</strong> Patients whose TOC Composition has all 15 required sections populated with at least one entry.
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Required Sections ({REQUIRED_TOC_SECTIONS.length})
            </Typography>
            <List dense>
              {REQUIRED_TOC_SECTIONS.map(function(section) {
                // Prefer the evaluator's per-section breakdown; fall back to
                // tri-state "unknown" before a calculation has run
                const sectionResults = get(evaluationResult, 'details.sectionResults', []);
                const sectionMatch = sectionResults.find(function(s) {
                  return s.code === section.code;
                });
                const hasEntries = sectionMatch ? sectionMatch.hasEntries : null;

                return (
                  <ListItem key={section.code}>
                    <ListItemIcon>
                      {triStateIcon(hasEntries)}
                    </ListItemIcon>
                    <ListItemText
                      primary={section.display}
                      secondary={section.code === 'behavioral_health_summary'
                        ? 'ToC temp code ' + section.code
                        : 'LOINC ' + section.code}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}

        {isCMS1317 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Measure Logic
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Initial Population:</strong> Patients 18 or older at the start of the measurement period with an inpatient discharge from an acute or critical access hospital during the period.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Denominator:</strong> Same as initial population. No exclusions.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Numerator:</strong> Patients meeting ANY of the three paths below.
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Numerator Paths (any one suffices)
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  {triStateIcon(get(evaluationResult, 'details.numeratorPaths.acpDocument.met', null))}
                </ListItemIcon>
                <ListItemText
                  primary="1. ACP Document"
                  secondary="Advance directive / healthcare agent designation / portable medical order before encounter end (PACIO: ADI DocumentReference; faithful: Procedure/Observation from VSAC document value sets)"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {triStateIcon(get(evaluationResult, 'details.numeratorPaths.acpDiscussion.met', null))}
                </ListItemIcon>
                <ListItemText
                  primary="2. ACP Discussion with Documented Decision"
                  secondary="Intervention from ACP Documentation VS (1170.45) or Assessment LOINC 75773-2 during the encounter"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {triStateIcon(get(evaluationResult, 'details.numeratorPaths.dnrZ66.met', null))}
                </ListItemIcon>
                <ListItemText
                  primary="3. Do Not Resuscitate Order (ICD-10-CM Z66)"
                  secondary="ServiceRequest Z66 authored during the encounter (faithful); Z66 Condition during hospitalization (PACIO extension)"
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Qualifying ADI Document Types (Path 1)
            </Typography>
            <List dense>
              {ADI_LOINC_CODES.map(function(code) {
                const matchingDocs = get(evaluationResult, 'details.matchingDirectives', []);
                const found = matchingDocs.some(function(doc) {
                  return get(doc, 'type.coding[0].code') === code.code;
                });

                return (
                  <ListItem key={code.code}>
                    <ListItemIcon>
                      {evaluationResult ? triStateIcon(found) : triStateIcon(null)}
                    </ListItemIcon>
                    <ListItemText
                      primary={code.display}
                      secondary={'LOINC ' + code.code}
                    />
                  </ListItem>
                );
              })}
            </List>

            {evaluationResult && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Patient Age: {get(evaluationResult, 'details.patientAge', 'N/A')}
                  {' | '}
                  Qualifying Encounters: {get(evaluationResult, 'details.qualifyingEncounters', []).length}
                  {' | '}
                  Active Directives: {get(evaluationResult, 'details.matchingDirectives', []).length}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default PacioMeasureDetail;
