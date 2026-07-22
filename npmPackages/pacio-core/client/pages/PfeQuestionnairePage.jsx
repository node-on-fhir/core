// packages/pacio-core/client/pages/PfeQuestionnairePage.jsx
//
// PFE assessment capture page using QuestionnaireForm from structured-data-capture.
// Loads the PROMIS-10 Questionnaire and submits responses via server method.

import React, { useState, useEffect, useRef } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { get } from 'lodash';

import {
  Container,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// PROMIS-10 questionnaire JSON ships with this package — bundle it statically.
import PROMIS10Questionnaire from '../../data/questionnaires/PROMIS-10-Questionnaire.json';

const log = (Meteor.Logger ? Meteor.Logger.for('PfeQuestionnairePage') : console);

function PfeQuestionnairePage() {
  const navigate = useNavigate();

  // Optional return-path handoff from a launching workflow (e.g. Transitions of
  // Care). Values arrive without a leading slash (e.g. "transitions-of-care").
  const [searchParams] = useSearchParams();
  const toPath = (p) => (p ? (p.startsWith('/') ? p : '/' + p) : null);
  const backDestination = toPath(searchParams.get('back')) || '/pfe-assessments';
  const nextDestination = toPath(searchParams.get('next')) || '/pfe-assessments';

  // QuestionnaireForm is provided by the @node-on-fhir/structured-data-capture
  // workflow package via the global Package registry (populated by the client
  // loader before any component renders). Null when that package isn't loaded.
  const QuestionnaireForm = get(globalThis, ['Package', '@node-on-fhir/structured-data-capture', 'QuestionnaireForm'], null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [error, setError] = useState(null);

  // Watchdog so a server restart mid-call can't strand the spinner forever.
  const watchdogRef = useRef(null);
  useEffect(function() {
    return function() {
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
      }
    };
  }, []);

  const patient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const patientId = useTracker(function() {
    return Session.get('selectedPatientId');
  }, []);

  if (!patient) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="warning">
          No patient selected. Please select a patient from the sidebar.
        </Alert>
      </Container>
    );
  }

  if (!QuestionnaireForm) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">
          The structured-data-capture package is not available. QuestionnaireForm component cannot be loaded.
        </Alert>
      </Container>
    );
  }

  if (!PROMIS10Questionnaire) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">
          PROMIS-10 Questionnaire resource not found. Ensure the questionnaire JSON is in the data directory.
        </Alert>
      </Container>
    );
  }

  async function handleSubmit(questionnaireResponse) {
    setSubmitting(true);
    setError(null);

    // Attach patient context
    const qr = Object.assign({}, questionnaireResponse, {
      subject: {
        reference: 'Patient/' + patientId,
        display: get(patient, 'name[0].text', get(patient, 'name[0].family', ''))
      }
    });

    log.debug('Submitting assessment for patient', { patientId });

    watchdogRef.current = setTimeout(function() {
      watchdogRef.current = null;
      log.warn('Submit timed out waiting for server response');
      setSubmitting(false);
      setError('The server did not respond. Your answers are preserved — please try submitting again.');
    }, 30000);

    try {
      const result = await Meteor.rpc('pacio.pfeAssessment.submitResponse', { questionnaireResponse: qr });
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
      setSubmitting(false);
      console.log('[PfeQuestionnairePage] Submitted successfully:', result);
      if (searchParams.get('next')) {
        navigate(nextDestination);
      } else {
        setSubmitResult(result);
        setSubmitted(true);
      }
    } catch (err) {
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
      setSubmitting(false);
      console.error('[PfeQuestionnairePage] Submit error:', err);
      setError(err.reason || err.message);
    }
  }

  function handleCancel() {
    navigate(backDestination);
  }

  if (submitted && submitResult) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Assessment Submitted Successfully
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                QuestionnaireResponse ID: {submitResult.questionnaireResponseId}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {submitResult.observationCount} derived observations created
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={function() { navigate(backDestination); }}
                >
                  Back to Assessments
                </Button>
                <Button
                  variant="contained"
                  onClick={function() {
                    setSubmitted(false);
                    setSubmitResult(null);
                  }}
                >
                  Start Another Assessment
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={function() { navigate(backDestination); }}
          sx={{ mb: 1 }}
        >
          Back to Assessments
        </Button>
        <Typography variant="h5" gutterBottom>
          PROMIS-10 Global Health Assessment
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Patient: {get(patient, 'name[0].text', get(patient, 'name[0].family', 'Unknown'))}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={function() { setError(null); }}>
          {error}
        </Alert>
      )}

      {/* Keep the form mounted while submitting so answers survive an error;
          overlay a spinner and block interaction instead of unmounting. */}
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ opacity: submitting ? 0.4 : 1, pointerEvents: submitting ? 'none' : 'auto' }}>
          <QuestionnaireForm
            questionnaire={PROMIS10Questionnaire}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            showProgress={true}
          />
        </Box>
        {submitting && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            pt: 8
          }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default PfeQuestionnairePage;
