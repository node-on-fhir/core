// imports/ui/profile/cards/GenomicsCard.jsx
//
// Genomics census for the linked patient. Subscribes to
// selectedPatient.MolecularSequences; collapses to the "Add genomics"
// add-row when the patient has no MolecularSequence (this card owns the
// genomics on-ramp — graduated from the retired DataOnrampsCard, same
// promotion pattern as MedicalImagingCard / SocialMediaCard /
// EnvironmentalDataCard). Filled state shows each sequence baseline with a
// Review button into Genome Central, and — when @orbital/genome-central is
// installed — mounts its GenomicsProfilePanel (full karyotype ideogram from
// the summary tracks + CLEAR/LOAD controls for the MyGenotype cache). All
// genomics logic stays in the extension; this card only hosts the panel.

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import BiotechIcon from '@mui/icons-material/Biotech';

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { MolecularSequences } from '/imports/lib/schemas/SimpleSchemas/MolecularSequences';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { ProfileCardHeader, AddRow, NeutralChip } from '../ProfilePrimitives.jsx';
import { ensureProfilePatientSelected } from '../selectProfilePatient.js';

const MAX_SEQUENCE_ROWS = 5;

// Genome Central owns the genomics pipeline (23andMe SNPs → ideogram
// tracks, FASTQ referencing) when its workflow is active; checked lazily at
// call time (never module scope — the loader populates Package before
// render, but sibling-workflow load order isn't guaranteed at import time).
// Without it, the data importer still recognizes genomics files and
// explains how to enable it.
function resolveGenomicsRoute() {
  var registry = (typeof Package !== 'undefined' && Package)
    || (typeof globalThis !== 'undefined' && globalThis.Package) || null;
  if (registry && registry['@orbital/genome-central']) {
    return '/genome-central?next=my-profile';
  }
  return '/import-data?next=my-profile';
}

// The extension's embeddable ideogram + cache-control panel, when installed.
// Same lazy render-time resolution as resolveGenomicsRoute above.
function resolveGenomicsProfilePanel() {
  var registry = (typeof Package !== 'undefined' && Package)
    || (typeof globalThis !== 'undefined' && globalThis.Package) || null;
  var genomeCentral = registry && registry['@orbital/genome-central'];
  return (genomeCentral && genomeCentral.GenomicsProfilePanel) || null;
}

export default function GenomicsCard({ patientId, onSequencesChange }) {
  const navigate = useNavigate();
  const appTheme = Meteor.useTheme ? Meteor.useTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Self-sufficient on Meteor.user().patientId — no Session dependence.
  // users.patientId may hold the Mongo _id or the FHIR id, while
  // MolecularSequence.patient references the FHIR id, so: load the patient
  // record, resolve its FHIR id (sequential lookup, never $or — see
  // anti-patterns/id-lookup.md), and subscribe with THAT. The tracker
  // re-runs when the patient record arrives, upgrading the subscription
  // from the raw id.
  const { sequences, patient, fhirId } = useTracker(function() {
    if (!patientId) { return { sequences: [], patient: null, fhirId: null }; }
    Meteor.subscribe('patients.byId', patientId);

    let patientRecord = Patients.findOne({ _id: patientId });
    if (!patientRecord) {
      patientRecord = Patients.findOne({ id: patientId });
    }
    const resolvedFhirId = get(patientRecord, 'id') || patientId;
    Meteor.subscribe('selectedPatient.MolecularSequences', resolvedFhirId, { limit: 100 });

    // Match references against every known alias of this one patient
    const referenceIds = [patientId];
    if (resolvedFhirId && referenceIds.indexOf(resolvedFhirId) === -1) {
      referenceIds.push(resolvedFhirId);
    }

    return {
      sequences: MolecularSequences.find({
        $or: referenceIds.map(function(refId) {
          return { 'patient.reference': { $regex: refId } };
        })
      }).fetch(),
      patient: patientRecord || null,
      fhirId: resolvedFhirId
    };
  }, [patientId]);

  React.useEffect(function() {
    if (onSequencesChange) { onSequencesChange(sequences); }
  }, [sequences.length]);

  const goToGenomeCentral = function() {
    ensureProfilePatientSelected(patientId);
    navigate(resolveGenomicsRoute());
  };

  if (!sequences.length) {
    return (
      <AddRow
        id="genomicsAddRow"
        icon={<BiotechIcon />}
        label="Add genomics"
        onClick={goToGenomeCentral}
      />
    );
  }

  const visibleSequences = sequences.slice(0, MAX_SEQUENCE_ROWS);
  const hiddenCount = sequences.length - visibleSequences.length;
  const GenomicsProfilePanel = resolveGenomicsProfilePanel();

  return (
    <Box className="pf-card" id="genomicsCard">
      <ProfileCardHeader
        icon={<BiotechIcon />}
        title="Genomics"
        kicker={`${sequences.length} sequence${sequences.length !== 1 ? 's' : ''}`}
      />
      <Box sx={{ pt: 0.5, pb: 1 }}>
        {visibleSequences.map(function(sequence) {
          const type = (get(sequence, 'type', 'unknown') || 'unknown').toUpperCase();
          const referenceLabel = get(sequence, 'referenceSeq.referenceSeqId.text',
            get(sequence, 'referenceSeq.referenceSeqId.coding.0.display', 'No reference sequence'));

          return (
            <Box
              key={sequence._id}
              className="pf-row"
              sx={{
                display: 'grid',
                gridTemplateColumns: '22px minmax(0, 1fr) 110px 90px',
                alignItems: 'center',
                gap: 1,
                p: '9px 14px'
              }}
            >
              <BiotechIcon sx={{ fontSize: 16, color: 'var(--pf-accent)' }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {type} sequence baseline
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {referenceLabel}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <NeutralChip label={type} />
              </Box>
              <Button
                size="small"
                variant="outlined"
                id="genomicsReviewButton"
                onClick={goToGenomeCentral}
                sx={{ fontSize: 11, p: '3px 8px', borderRadius: '8px', color: 'var(--pf-ink-mid)', borderColor: 'var(--pf-line)' }}
              >
                Review
              </Button>
            </Box>
          );
        })}
        {hiddenCount > 0 && (
          <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)', p: '4px 14px' }}>
            + {hiddenCount} more sequence{hiddenCount !== 1 ? 's' : ''} — Review to see all
          </Typography>
        )}
      </Box>
      {GenomicsProfilePanel && (
        <GenomicsProfilePanel
          patientIds={[patientId, fhirId]}
          patient={patient}
          isDark={isDark}
        />
      )}
    </Box>
  );
}
