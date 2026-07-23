// npmPackages/structured-data-capture/client/pages/SurveyPage.jsx
//
// Settings-driven survey route. Resolves a FHIR Questionnaire from the
// Questionnaires collection by the :id route param (falling back to
// Meteor.settings.public.survey.questionnaire), creates an in-progress
// QuestionnaireResponse draft for the selected patient, then renders the shared
// QuestionnaireForm bound to that draft (autosave -> update, submit -> completed).
//
//   /survey            -> settings.public.survey.questionnaire (e.g. "PROMIS-10")
//   /survey/:id        -> questionnaire resolved by id/url/title
//
// Resolution honors an optional alias map (settings.public.survey.aliases) so a
// friendly string like "PROMIS-10" maps to a concrete questionnaire id.

import React, { useState, useEffect, useRef } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import {
  Box,
  Container,
  Alert,
  AlertTitle,
  CircularProgress,
  Typography
} from '@mui/material';
import { QuestionnaireForm } from '../components/QuestionnaireForm';
import { ResponseUtils } from '../../lib/ResponseUtils';

// Router/theme hooks via the Honeycomb-provided globals (same pattern as the
// sibling pages — avoids direct react-router-dom import coupling).
let useNavigate;
let useParams;
let useAppTheme;
Meteor.startup(function() {
  useNavigate = Meteor.useNavigate;
  useAppTheme = Meteor.useTheme;
  useParams = Meteor.useParams;
});

// Resolve a questionnaire key against the loaded questionnaires. Prioritized
// exact matches first (avoids the _id/id OR-collision anti-pattern), then a
// friendly contains-match on title/name as a last resort.
function resolveQuestionnaire(questionnaires, rawKey) {
  if (!rawKey || !Array.isArray(questionnaires) || questionnaires.length === 0) {
    return null;
  }

  // Apply alias map (e.g. { "PROMIS-10": "PROMIS-10-GlobalHealth" }).
  const aliases = get(Meteor, 'settings.public.survey.aliases', {});
  const key = get(aliases, rawKey, rawKey);

  return (
    questionnaires.find(function(q) { return get(q, '_id') === key; }) ||
    questionnaires.find(function(q) { return get(q, 'id') === key; }) ||
    questionnaires.find(function(q) { return get(q, 'url') === key; }) ||
    questionnaires.find(function(q) { return get(q, 'title') === key; }) ||
    questionnaires.find(function(q) { return get(q, 'name') === key; }) ||
    questionnaires.find(function(q) {
      const k = String(key).toLowerCase();
      return (
        String(get(q, 'title', '')).toLowerCase().indexOf(k) !== -1 ||
        String(get(q, 'name', '')).toLowerCase().indexOf(k) !== -1
      );
    }) ||
    null
  );
}

export default function SurveyPage() {
  const navigate = useNavigate ? useNavigate() : function() {};
  const params = useParams ? useParams() : {};

  // Theme (isDark pattern, consistent with sibling SDC pages)
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';
  const pageBgColor = isDark ? '#121212' : '#f5f5f5';
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const paperBgColor = isDark ? '#2a2a2a' : '#ffffff';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)';

  // The requested questionnaire key: :id route param, else the settings default.
  const requestedKey = get(params, 'id') || get(Meteor, 'settings.public.survey.questionnaire', '');

  // Patient context + loaded questionnaires (reactive)
  const { patient, patientId, questionnairesReady, questionnaire } = useTracker(function() {
    const handle = Meteor.subscribe('autopublish.Questionnaires', {}, { limit: 1000 });
    const Questionnaires = get(Meteor, 'Collections.Questionnaires');
    const allQuestionnaires = Questionnaires ? Questionnaires.find({}).fetch() : [];

    return {
      patient: Session.get('selectedPatient'),
      patientId: Session.get('selectedPatientId'),
      questionnairesReady: handle.ready(),
      questionnaire: resolveQuestionnaire(allQuestionnaires, requestedKey)
    };
  }, [requestedKey]);

  // Draft QuestionnaireResponse state
  const [draftResponse, setDraftResponse] = useState(null);
  const [draftId, setDraftId] = useState(null);
  const [draftError, setDraftError] = useState(null);
  const creatingForKeyRef = useRef(null);

  const canonicalId = get(questionnaire, '_id') || get(questionnaire, 'id');

  // Create the in-progress draft once we have a resolved questionnaire + patient.
  useEffect(function() {
    if (!questionnaire || !patientId) {
      return;
    }
    // Guard against duplicate creation (React double-invoke / re-renders) and
    // re-create when the resolved questionnaire changes.
    if (creatingForKeyRef.current === canonicalId) {
      return;
    }
    creatingForKeyRef.current = canonicalId;

    const draft = ResponseUtils.initializeResponse(questionnaire, {
      subject: {
        reference: 'Patient/' + patientId,
        display: get(patient, 'name[0].text', get(patient, 'name[0].family', ''))
      },
      author: Meteor.userId() ? { reference: 'Practitioner/' + Meteor.userId() } : undefined
    });
    draft._id = draft.id;

    setDraftResponse(draft);
    setDraftId(null);
    setDraftError(null);

    Meteor.rpc('questionnaireResponses.create', draft)
      .then(function(newId) {
        console.log('[SurveyPage] Created in-progress QuestionnaireResponse:', newId);
        setDraftId(newId || draft._id);
      })
      .catch(function(error) {
        console.error('[SurveyPage] Failed to create draft QuestionnaireResponse:', error);
        setDraftError(error.reason || error.message || 'Failed to create response');
        creatingForKeyRef.current = null; // allow retry
      });
  }, [canonicalId, patientId, questionnaire, patient]);

  // Persist edits (autosave) against the draft.
  const handleSave = async function(response) {
    if (!draftId) return;
    await Meteor.rpc('questionnaireResponses.update', {
      questionnaireResponseId: draftId,
      questionnaireResponseData: {
        ...response,
        status: 'in-progress'
      }
    });
  };

  // Finalize the response on submit.
  const handleSubmit = async function(response /* , trackingData */) {
    if (!draftId) {
      throw new Meteor.Error('no-draft', 'No draft response to submit');
    }
    await Meteor.rpc('questionnaireResponses.update', {
      questionnaireResponseId: draftId,
      questionnaireResponseData: {
        ...response,
        status: 'completed'
      }
    });
    console.log('[SurveyPage] Submitted QuestionnaireResponse:', draftId);
  };

  const handleCancel = function() {
    navigate('/structured-data-capture');
  };

  // ---- Render states -------------------------------------------------------

  function shell(children) {
    return (
      <Box sx={{ bgcolor: pageBgColor, minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          {children}
        </Container>
      </Box>
    );
  }

  // Patient required (PROMIS-10 and friends are patient-scoped)
  if (!patient || !patientId) {
    return shell(
      <Alert severity="warning">
        <AlertTitle>No patient selected</AlertTitle>
        Please select a patient from the sidebar before taking a survey.
      </Alert>
    );
  }

  // Wait for questionnaires to load before deciding it is missing
  if (!questionnairesReady && !questionnaire) {
    return shell(
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Resolved nothing
  if (!questionnaire) {
    return shell(
      <Alert severity="error">
        <AlertTitle>Questionnaire not found</AlertTitle>
        Could not resolve a questionnaire for "{String(requestedKey)}". Load the
        connectathon data (PACIO &rarr; Load Connectathon Data) or check
        Meteor.settings.public.survey.questionnaire.
      </Alert>
    );
  }

  // Draft creation error
  if (draftError) {
    return shell(
      <Alert severity="error">
        <AlertTitle>Could not start the survey</AlertTitle>
        {draftError}
      </Alert>
    );
  }

  // Creating the draft
  if (!draftId || !draftResponse) {
    return shell(
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2, color: cardTextColor }}>
          Preparing {get(questionnaire, 'title', 'survey')}&hellip;
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: pageBgColor, minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        <QuestionnaireForm
          questionnaire={questionnaire}
          questionnaireResponse={draftResponse}
          onSave={handleSave}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          showProgress={true}
          showSidebar={true}
          enableTracking={true}
          autoSave={true}
          isDark={isDark}
          cardBgColor={cardBgColor}
          cardTextColor={cardTextColor}
          paperBgColor={paperBgColor}
          borderColor={borderColor}
          thankYouPage={{
            show: true,
            message: `Thank you for completing the ${get(questionnaire, 'title', 'survey')}`,
            redirectUrl: '/structured-data-capture',
            redirectDelay: 3000
          }}
        />
      </Container>
    </Box>
  );
}
