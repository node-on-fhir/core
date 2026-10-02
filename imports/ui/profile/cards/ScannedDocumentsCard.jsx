// imports/ui/profile/cards/ScannedDocumentsCard.jsx
//
// Scanned-document census for the linked patient: DocumentReferences (and the
// Compositions the pdf-parser scan step derives from them). Collapses to the
// "Scanned documents" add-row when the patient has no DocumentReferences
// (this card owns the scanned-documents on-ramp — graduated from
// DataOnrampsCard, same promotion pattern as MedicalImagingCard /
// SocialMediaCard). Filled state shows per-type rows with Review buttons into
// the DocumentReferences / Compositions list pages plus an import row back
// into the document library; individual documents are not rendered here.
//
// Self-sufficient on the passed patientId (users.patientId) — no Session
// dependence; resolves Mongo _id vs FHIR id the same way SocialMediaCard does.

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import ArticleIcon from '@mui/icons-material/Article';
import AddIcon from '@mui/icons-material/Add';

import { get } from 'lodash';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { DocumentReferences } from '/imports/lib/schemas/SimpleSchemas/DocumentReferences';
import { Compositions } from '/imports/lib/schemas/SimpleSchemas/Compositions';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { ProfileCardHeader, AddRow, NeutralChip } from '../ProfilePrimitives.jsx';
import { ensureProfilePatientSelected } from '../selectProfilePatient.js';

function DocumentRow({ icon, title, subtitle, chipLabel, reviewId, onReview }) {
  return (
    <Box
      className="pf-row"
      sx={{
        display: 'grid',
        gridTemplateColumns: '22px minmax(0, 1fr) 110px 90px',
        alignItems: 'center',
        gap: 1,
        p: '9px 14px'
      }}
    >
      {React.cloneElement(icon, { sx: { fontSize: 16, color: 'var(--pf-accent)' } })}
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {subtitle}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <NeutralChip label={chipLabel} />
      </Box>
      <Button
        size="small"
        variant="outlined"
        id={reviewId}
        onClick={onReview}
        sx={{ fontSize: 11, p: '3px 8px', borderRadius: '8px', color: 'var(--pf-ink-mid)', borderColor: 'var(--pf-line)' }}
      >
        Review
      </Button>
    </Box>
  );
}

export default function ScannedDocumentsCard({ patientId, onDocumentsChange }) {
  const navigate = useNavigate();

  const { documentReferences, compositions } = useTracker(function() {
    if (!patientId) { return { documentReferences: [], compositions: [] }; }
    Meteor.subscribe('patients.byId', patientId);

    // users.patientId may hold the Mongo _id or the FHIR id; resources
    // reference the FHIR id, so resolve the record (sequential lookup, never
    // $or — see anti-patterns/id-lookup.md) and subscribe with THAT.
    let patient = Patients.findOne({ _id: patientId });
    if (!patient) {
      patient = Patients.findOne({ id: patientId });
    }
    const fhirId = get(patient, 'id') || patientId;
    Meteor.subscribe('selectedPatient.DocumentReferences', fhirId, { limit: 1000 });
    Meteor.subscribe('selectedPatient.Compositions', fhirId, { limit: 1000 });

    const referenceIds = [patientId];
    if (fhirId && referenceIds.indexOf(fhirId) === -1) {
      referenceIds.push(fhirId);
    }
    const subjectQuery = {
      $or: referenceIds.map(function(refId) {
        return { 'subject.reference': { $regex: refId } };
      })
    };

    return {
      documentReferences: DocumentReferences.find(subjectQuery, { sort: { date: -1 } }).fetch(),
      compositions: Compositions.find(subjectQuery, { sort: { date: -1 } }).fetch()
    };
  }, [patientId]);

  React.useEffect(function() {
    if (onDocumentsChange) { onDocumentsChange(documentReferences); }
  }, [documentReferences.length]);

  const goToLibrary = function() {
    ensureProfilePatientSelected(patientId);
    navigate(patientId ? '/pdf-document-library?patient=' + patientId : '/pdf-document-library');
  };

  if (!documentReferences.length) {
    return (
      <AddRow
        id="scannedDocumentsAddRow"
        icon={<DocumentScannerIcon />}
        label="Scanned documents — none yet"
        onClick={goToLibrary}
      />
    );
  }

  const newest = get(documentReferences[0], 'date');
  const oldest = get(documentReferences[documentReferences.length - 1], 'date');
  const span = (newest && oldest)
    ? moment(oldest).format('MMM YYYY') + ' – ' + moment(newest).format('MMM YYYY')
    : '';

  return (
    <Box className="pf-card" id="scannedDocumentsCard">
      <ProfileCardHeader
        icon={<DocumentScannerIcon />}
        title="Scanned documents"
        kicker={`${documentReferences.length} document${documentReferences.length !== 1 ? 's' : ''}`}
        action={
          <Button
            size="small"
            id="importMoreDocumentsButton"
            onClick={goToLibrary}
            startIcon={<AddIcon sx={{ fontSize: 13 }} />}
            sx={{ fontSize: 11, p: '2px 8px', minWidth: 0, borderRadius: '8px', color: 'var(--pf-ink-mid)', '& .MuiButton-startIcon': { mr: 0.5 } }}
          >
            Add
          </Button>
        }
      />
      <Box sx={{ pt: 0.5, pb: 1 }}>
        <DocumentRow
          icon={<DocumentScannerIcon />}
          title="Document references"
          subtitle={span}
          chipLabel={`${documentReferences.length} DocRef${documentReferences.length !== 1 ? 's' : ''}`}
          reviewId="documentReferencesReviewButton"
          onReview={function() {
            ensureProfilePatientSelected(patientId);
            navigate('/document-references');
          }}
        />
        {compositions.length ? (
          <DocumentRow
            icon={<ArticleIcon />}
            title="Compositions"
            subtitle="Structured narratives extracted from scans"
            chipLabel={`${compositions.length} Composition${compositions.length !== 1 ? 's' : ''}`}
            reviewId="compositionsReviewButton"
            onReview={function() {
              ensureProfilePatientSelected(patientId);
              navigate('/compositions');
            }}
          />
        ) : null}
      </Box>
    </Box>
  );
}
