// /imports/ui-fhir/questionnaireResponses/QuestionnaireResponseDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  IconButton,
  Tooltip,
  Typography,
  Box
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set, cloneDeep } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

import QuestionnaireResponseFormView from './QuestionnaireResponseFormView';
import QuestionnaireResponsePreview from './QuestionnaireResponsePreview';

// Collections are initialized globally
let QuestionnaireResponses;
let Questionnaires;

Meteor.startup(function(){
  QuestionnaireResponses = Meteor.Collections.QuestionnaireResponses;
  Questionnaires = Meteor.Collections.Questionnaires;
});

function QuestionnaireResponseDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  // Check if we're creating a new response
  const isNew = !id || window.location.pathname.endsWith('/new');

  // State
  const [questionnaireResponse, setQuestionnaireResponse] = useState({
    resourceType: 'QuestionnaireResponse',
    questionnaire: '',
    status: 'in-progress',
    authored: moment().format('YYYY-MM-DDTHH:mm:ss')
  });

  const [questionnaireResponseId, setQuestionnaireResponseId] = useState(false);

  const [form, setForm] = useState({
    identifier: '',
    status: 'in-progress',
    subject: '',
    author: '',
    questionnaire: '',
    questionnaireDisplay: '',
    authored: moment().format('YYYY-MM-DDTHH:mm'),
    source: '',
    basedOn: '',
    partOf: '',
    reasonCode: '',
    reasonDisplay: '',
    notes: ''
  });

  const [isEditing, setIsEditing] = useState(isEmbedded || isNew);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isNewResponse = !id || id === 'new' || isNew;
  const isExistingResponse = questionnaireResponseId && questionnaireResponseId !== 'new';

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setQuestionnaireResponse(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  // Subscribe to data
  useTracker(function(){
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      return Meteor.subscribe('selectedPatient.QuestionnaireResponses', Session.get('selectedPatientId'), {});
    } else {
      return Meteor.subscribe('questionnaireresponses.all');
    }
  }, []);

  // Get selected patient from session
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  // Load questionnaire response if editing
  useEffect(function() {
    if (id && !isNew) {
      setQuestionnaireResponseId(id);
      setIsEditing(false);

      async function loadQuestionnaireResponse() {
        try {
          setLoading(true);

          let localResponse = null;
          if (QuestionnaireResponses) {
            localResponse = QuestionnaireResponses.findOne({_id: id}) ||
                            QuestionnaireResponses.findOne({id: id});
          }

          if (!localResponse) {
            const response = await Meteor.callAsync('questionnaireResponses.get', id);
            localResponse = response;
          }

          if (localResponse) {
            // Extract questionnaireDisplay from extension if present
            if (localResponse.extension && Array.isArray(localResponse.extension)) {
              const displayExtension = localResponse.extension.find(function(ext){
                return ext.url === 'http://example.org/fhir/StructureDefinition/questionnaire-display';
              });
              if (displayExtension && displayExtension.valueString) {
                localResponse.questionnaireDisplay = displayExtension.valueString;
              }
            }

            setQuestionnaireResponse(localResponse);

            setForm({
              identifier: get(localResponse, 'identifier[0].value', ''),
              status: get(localResponse, 'status', 'in-progress'),
              subject: get(localResponse, 'subject.display', ''),
              author: get(localResponse, 'author.display', ''),
              questionnaire: get(localResponse, 'questionnaire', ''),
              questionnaireDisplay: get(localResponse, 'questionnaireDisplay', ''),
              authored: moment(get(localResponse, 'authored', '')).format('YYYY-MM-DDTHH:mm'),
              source: get(localResponse, 'source.display', ''),
              basedOn: get(localResponse, 'basedOn[0].reference', ''),
              partOf: get(localResponse, 'partOf[0].reference', ''),
              reasonCode: get(localResponse, 'reasonCode[0].coding[0].code', ''),
              reasonDisplay: get(localResponse, 'reasonCode[0].coding[0].display', ''),
              notes: get(localResponse, 'note[0].text', '')
            });
          } else {
            setError('Questionnaire response not found');
          }
        } catch (err) {
          console.error('Error loading questionnaire response:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
      loadQuestionnaireResponse();
    } else if (isNew) {
      setIsEditing(true);

      // Set patient info from session
      const patient = Session.get('selectedPatient');
      let patientDisplay = '';
      let patientReference = '';
      if (patient) {
        patientReference = 'Patient/' + get(patient, '_id', '');
        patientDisplay = FhirUtilities.pluckName(patient);
      }

      // Set author info
      let authorDisplay = '';
      let authorReference = '';
      if (Meteor.user()) {
        const user = Meteor.user();
        authorDisplay = get(user, 'profile.name.text', user.username || 'Unknown User');
        authorReference = 'Practitioner/' + user._id;
      }

      let newResponse = {
        resourceType: 'QuestionnaireResponse',
        questionnaire: '',
        status: 'in-progress',
        authored: moment().format('YYYY-MM-DDTHH:mm:ss'),
        subject: {
          reference: patientReference,
          display: patientDisplay
        },
        author: {
          reference: authorReference,
          display: authorDisplay
        }
      };

      setQuestionnaireResponse(newResponse);
      setForm({
        identifier: '',
        status: 'in-progress',
        subject: patientDisplay,
        author: authorDisplay,
        questionnaire: '',
        questionnaireDisplay: '',
        authored: moment().format('YYYY-MM-DDTHH:mm'),
        source: '',
        basedOn: '',
        partOf: '',
        reasonCode: '',
        reasonDisplay: '',
        notes: ''
      });
    }
  }, [id]);

  function handleChange(name, value) {
    const newForm = Object.assign({}, form);
    newForm[name] = value;
    setForm(newForm);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(newForm);
    }
  }

  function handleSearchPatient() {
    setShowPatientSearch(true);
  }

  function handleSelectPatient(patient) {
    if (patient) {
      const updatedResponse = cloneDeep(questionnaireResponse);
      set(updatedResponse, 'subject.reference', 'Patient/' + patient._id);
      set(updatedResponse, 'subject.display', FhirUtilities.pluckName(patient));
      setQuestionnaireResponse(updatedResponse);

      handleChange('subject', FhirUtilities.pluckName(patient));
    }
    setShowPatientSearch(false);
  }

  async function handleSaveButton() {
    try {
      setLoading(true);
      setError('');

      const responseToSave = {
        resourceType: 'QuestionnaireResponse',
        status: form.status,
        authored: form.authored ? moment(form.authored).toISOString() : moment().toISOString()
      };

      // Add questionnaire if present
      if (form.questionnaire && form.questionnaire.trim()) {
        responseToSave.questionnaire = form.questionnaire.trim();
      }

      // Add questionnaire display as extension
      if (form.questionnaireDisplay && form.questionnaireDisplay.trim()) {
        responseToSave.extension = responseToSave.extension || [];
        responseToSave.extension.push({
          url: 'http://example.org/fhir/StructureDefinition/questionnaire-display',
          valueString: form.questionnaireDisplay.trim()
        });
      }

      // Include subject from resource (has reference)
      if (get(questionnaireResponse, 'subject.reference') || form.subject) {
        responseToSave.subject = {
          reference: get(questionnaireResponse, 'subject.reference', ''),
          display: form.subject
        };
      }

      // Include author
      if (get(questionnaireResponse, 'author.reference') || form.author) {
        responseToSave.author = {
          reference: get(questionnaireResponse, 'author.reference', ''),
          display: form.author
        };
      }

      // Include source
      if (form.source) {
        responseToSave.source = {
          reference: get(questionnaireResponse, 'source.reference', ''),
          display: form.source
        };
      }

      // Handle identifier
      if (form.identifier) {
        responseToSave.identifier = [{
          system: 'http://example.org/identifier',
          value: form.identifier
        }];
      }

      // Handle basedOn
      if (form.basedOn) {
        responseToSave.basedOn = [{ reference: form.basedOn }];
      }

      // Handle partOf
      if (form.partOf) {
        responseToSave.partOf = [{ reference: form.partOf }];
      }

      // Handle reasonCode
      if (form.reasonCode || form.reasonDisplay) {
        responseToSave.reasonCode = [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: form.reasonCode,
            display: form.reasonDisplay
          }]
        }];
      }

      // Handle note
      if (form.notes) {
        responseToSave.note = [{
          text: form.notes,
          time: new Date().toISOString()
        }];
      }

      if (isNewResponse) {
        console.log('Creating questionnaire response:', responseToSave);
        const newId = await Meteor.callAsync('questionnaireResponses.create', responseToSave);
        console.log('Created questionnaire response with ID:', newId);
        navigate('/questionnaire-responses');
      } else {
        await Meteor.callAsync('questionnaireResponses.update', questionnaireResponseId, responseToSave);
        console.log('Updated questionnaire response:', questionnaireResponseId);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error saving questionnaire response:', err);
      setError(err.message || err.reason || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function handleCancelButton() {
    if (isNewResponse) {
      navigate('/questionnaire-responses');
    } else {
      setIsEditing(false);
      setError('');
      // Reload original data
      if (QuestionnaireResponses) {
        let original = QuestionnaireResponses.findOne({_id: questionnaireResponseId});
        if (original) {
          setForm({
            identifier: get(original, 'identifier[0].value', ''),
            status: get(original, 'status', 'in-progress'),
            subject: get(original, 'subject.display', ''),
            author: get(original, 'author.display', ''),
            questionnaire: get(original, 'questionnaire', ''),
            questionnaireDisplay: get(original, 'questionnaireDisplay', ''),
            authored: moment(get(original, 'authored', '')).format('YYYY-MM-DDTHH:mm'),
            source: get(original, 'source.display', ''),
            basedOn: get(original, 'basedOn[0].reference', ''),
            partOf: get(original, 'partOf[0].reference', ''),
            reasonCode: get(original, 'reasonCode[0].coding[0].code', ''),
            reasonDisplay: get(original, 'reasonCode[0].coding[0].display', ''),
            notes: get(original, 'note[0].text', '')
          });
        }
      }
    }
  }

  async function handleDeleteButton() {
    if (!questionnaireResponseId || questionnaireResponseId === 'new') return;

    if (window.confirm('Are you sure you want to delete this questionnaire response?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('questionnaireResponses.remove', questionnaireResponseId);
        console.log('QuestionnaireResponse deleted successfully');
        navigate('/questionnaire-responses');
      } catch (err) {
        console.error('Error deleting questionnaire response:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Build the header title
  let headerTitle = 'New Questionnaire Response';
  if (isExistingResponse) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{questionnaireResponseId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle -- hidden for new responses */}
        {!isNewResponse && (
          <Tooltip title="Preview">
            <IconButton
              onClick={() => setSearchParams({ view: 'page' })}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle -- hidden for new responses (always form) */}
        {!isNewResponse && (
          <Tooltip title="Form">
            <IconButton
              onClick={() => setSearchParams({ view: 'form' })}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle -- only for existing responses */}
        {!isNewResponse && (
          <Button
              id="editButton"
              onClick={function() { setIsEditing(!isEditing); }}
              variant="outlined"
              size="small"
              startIcon={isEditing ? <LockOpenIcon /> : <LockIcon />}
            >
              {isEditing ? 'Editing' : 'Edit'}
            </Button>
        )}

        {/* Delete -- only for existing responses, gated on edit mode */}
        {!isNewResponse && (
          <Button
              id="deleteButton"
              onClick={handleDeleteButton}
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView(){
    return (
      <>
        <QuestionnaireResponseFormView
          resource={questionnaireResponse}
          form={form}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
          onSearchPatient={handleSearchPatient}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancelButton}>
              Cancel
            </Button>
            <Button
              id="saveQuestionnaireResponseButton"
              onClick={handleSaveButton}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView(){
    return (
      <QuestionnaireResponsePreview
        resource={questionnaireResponse}
        form={form}
        resourceId={questionnaireResponseId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="questionnaireResponseDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          {viewMode === 'form' && renderFormView()}
          {viewMode === 'page' && renderPreviewView()}
        </CardContent>
      </Card>

      {/* Patient Search Dialog */}
      <PatientSearchDialog
        open={showPatientSearch}
        onClose={() => setShowPatientSearch(false)}
        onSelect={handleSelectPatient}
      />
    </Container>
  );
}

export default QuestionnaireResponseDetail;
