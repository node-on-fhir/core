// /imports/ui-fhir/researchStudies/ResearchStudyDetail.jsx

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

import { get, set } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Import the collection directly - avoids timing issues
import { ResearchStudies } from '/imports/lib/schemas/SimpleSchemas/ResearchStudies';

import ResearchStudyFormView from './ResearchStudyFormView';
import ResearchStudyPreview from './ResearchStudyPreview';

function ResearchStudyDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  // Subscribe to research studies data
  const subscriptionReady = useTracker(function() {
    if (isEmbedded) return true;
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('selectedPatient.ResearchStudies', Session.get('selectedPatientId'), {});
      return handle.ready();
    } else {
      const handle = Meteor.subscribe('researchStudies.all');
      return handle.ready();
    }
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [researchStudy, setResearchStudy] = useState({
    resourceType: "ResearchStudy",
    title: "",
    status: "active",
    phase: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/research-study-phase",
        code: "phase-3",
        display: "Phase 3"
      }]
    },
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/research-study-prim-purp-type",
        code: "interventional",
        display: "Interventional"
      }]
    }],
    focus: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }]
    }],
    description: "",
    period: {
      start: moment().format('YYYY-MM-DD'),
      end: moment().add(1, 'year').format('YYYY-MM-DD')
    },
    principalInvestigator: {
      reference: "",
      display: ""
    },
    enrollment: [{
      reference: "",
      display: ""
    }],
    note: [{
      text: ""
    }]
  });

  const [researchStudyId, setResearchStudyId] = useState(false);

  const [form, setForm] = useState({
    title: '',
    principalInvestigator: '',
    status: 'active',
    phase: 'phase-3',
    category: 'interventional',
    focusType: 'http://snomed.info/sct',
    focusCode: '',
    focusDisplay: '',
    description: '',
    periodStart: moment().format('YYYY-MM-DD'),
    periodEnd: moment().add(1, 'year').format('YYYY-MM-DD'),
    enrollmentTarget: '',
    enrollmentActual: '',
    notes: ''
  });

  const [isEditing, setIsEditing] = useState(isEmbedded || !id || id === 'new');
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isNewStudy = !id || id === 'new';
  const isExistingStudy = researchStudyId && researchStudyId !== 'new';

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setResearchStudy(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  // onResourceChange: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(researchStudy);
    }
  }, [researchStudy]);

  // Load existing research study if editing
  useEffect(function() {
    if (id && id !== 'new' && ResearchStudies) {
      setResearchStudyId(id);
      setIsEditing(false);
      setLoading(true);

      Meteor.call('researchStudies.get', id, function(err, result) {
        setLoading(false);
        if (err) {
          setError(err.reason);
          console.error('Error loading research study:', err);
        } else if (result) {
          console.log('Loaded research study:', result);
          setResearchStudy(result);

          // Extract enrollment parts
          const enrollmentDisplay = get(result, 'enrollment[0].display', '');
          const enrollmentParts = enrollmentDisplay.split('/');

          setForm({
            title: get(result, 'title', ''),
            principalInvestigator: get(result, 'principalInvestigator.display', ''),
            status: get(result, 'status', 'active'),
            phase: get(result, 'phase.coding[0].code', 'phase-3'),
            category: get(result, 'category[0].coding[0].code', 'interventional'),
            focusType: get(result, 'focus[0].coding[0].system', 'http://snomed.info/sct'),
            focusCode: get(result, 'focus[0].coding[0].code', ''),
            focusDisplay: get(result, 'focus[0].coding[0].display', ''),
            description: get(result, 'description', ''),
            periodStart: get(result, 'period.start', ''),
            periodEnd: get(result, 'period.end', ''),
            enrollmentTarget: enrollmentParts[1] || '',
            enrollmentActual: enrollmentParts[0] || '',
            notes: get(result, 'note[0].text', '')
          });
        }
      });
    } else if (!id || id === 'new') {
      setIsEditing(true);
    }
  }, [id]);

  function handleChange(name, value) {
    pendingUpdate.current = true;
    const newForm = Object.assign({}, form);
    newForm[name] = value;
    setForm(newForm);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(newForm);
    }
  }

  // Handle save
  function handleSaveButton() {
    setError(null);
    setLoading(true);

    const userId = Meteor.userId();
    if (!userId) {
      setError('You must be logged in to save research studies');
      setLoading(false);
      return;
    }

    // Map phase code to display
    const phaseMap = {
      'n-a': 'N/A',
      'early-phase-1': 'Early Phase 1',
      'phase-1': 'Phase 1',
      'phase-1-phase-2': 'Phase 1/Phase 2',
      'phase-2': 'Phase 2',
      'phase-2-phase-3': 'Phase 2/Phase 3',
      'phase-3': 'Phase 3',
      'phase-4': 'Phase 4'
    };

    const categoryMap = {
      'interventional': 'Interventional',
      'observational': 'Observational',
      'expanded-access': 'Expanded Access'
    };

    // Build the FHIR resource from form state
    const dataToSave = Object.assign({}, researchStudy);
    dataToSave.title = form.title;
    dataToSave.status = form.status;
    dataToSave.description = form.description;

    // Principal investigator
    dataToSave.principalInvestigator = {
      reference: get(researchStudy, 'principalInvestigator.reference', ''),
      display: form.principalInvestigator
    };

    // Phase
    dataToSave.phase = {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/research-study-phase',
        code: form.phase,
        display: phaseMap[form.phase] || form.phase
      }]
    };

    // Category
    dataToSave.category = [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/research-study-prim-purp-type',
        code: form.category,
        display: categoryMap[form.category] || form.category
      }]
    }];

    // Focus
    dataToSave.focus = [{
      coding: [{
        system: form.focusType,
        code: form.focusCode,
        display: form.focusDisplay
      }]
    }];

    // Period
    dataToSave.period = {
      start: form.periodStart,
      end: form.periodEnd
    };

    // Enrollment
    const enrollmentDisplay = (form.enrollmentActual || '0') + '/' + (form.enrollmentTarget || '0');
    dataToSave.enrollment = [{
      reference: get(researchStudy, 'enrollment[0].reference', ''),
      display: enrollmentDisplay
    }];

    // Notes
    dataToSave.note = [{
      text: form.notes
    }];

    if (isNewStudy) {
      console.log('Creating new research study:', dataToSave);
      Meteor.call('researchStudies.create', dataToSave, function(err, newId) {
        setLoading(false);
        if (err) {
          setError(err.reason);
          console.error('Create error:', err);
        } else {
          console.log('Research study created with ID:', newId);
          navigate('/research-studies');
        }
      });
    } else {
      console.log('Updating research study:', researchStudyId, dataToSave);
      Meteor.call('researchStudies.update', researchStudyId, dataToSave, function(err) {
        setLoading(false);
        if (err) {
          setError(err.reason);
          console.error('Update error:', err);
        } else {
          console.log('Research study updated successfully');
          setIsEditing(false);
        }
      });
    }
  }

  function handleCancelButton() {
    if (isNewStudy) {
      navigate('/research-studies');
    } else {
      setIsEditing(false);
      setError(null);
      // Reload original data
      setLoading(true);
      Meteor.call('researchStudies.get', researchStudyId, function(err, result) {
        setLoading(false);
        if (err) {
          setError(err.reason);
        } else if (result) {
          setResearchStudy(result);
          const enrollmentDisplay = get(result, 'enrollment[0].display', '');
          const enrollmentParts = enrollmentDisplay.split('/');

          setForm({
            title: get(result, 'title', ''),
            principalInvestigator: get(result, 'principalInvestigator.display', ''),
            status: get(result, 'status', 'active'),
            phase: get(result, 'phase.coding[0].code', 'phase-3'),
            category: get(result, 'category[0].coding[0].code', 'interventional'),
            focusType: get(result, 'focus[0].coding[0].system', 'http://snomed.info/sct'),
            focusCode: get(result, 'focus[0].coding[0].code', ''),
            focusDisplay: get(result, 'focus[0].coding[0].display', ''),
            description: get(result, 'description', ''),
            periodStart: get(result, 'period.start', ''),
            periodEnd: get(result, 'period.end', ''),
            enrollmentTarget: enrollmentParts[1] || '',
            enrollmentActual: enrollmentParts[0] || '',
            notes: get(result, 'note[0].text', '')
          });
        }
      });
    }
  }

  function handleDeleteButton() {
    if (!researchStudyId || researchStudyId === 'new') return;

    if (window.confirm('Are you sure you want to delete this research study?')) {
      setLoading(true);
      Meteor.call('researchStudies.remove', researchStudyId, function(err) {
        setLoading(false);
        if (err) {
          setError(err.reason);
          console.error('Delete error:', err);
        } else {
          navigate('/research-studies');
        }
      });
    }
  }

  // Build the header title
  let headerTitle = 'New Research Study';
  if (isExistingStudy) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{researchStudyId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle -- hidden for new studies */}
        {!isNewStudy && (
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

        {/* Form toggle -- hidden for new studies (always form) */}
        {!isNewStudy && (
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

        {/* Lock / Unlock toggle -- only for existing studies */}
        {!isNewStudy && (
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

        {/* Delete -- only for existing studies, gated on edit mode */}
        {!isNewStudy && (
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
        <ResearchStudyFormView
          resource={researchStudy}
          form={form}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancelButton}>
              Cancel
            </Button>
            <Button
              id="saveResearchStudyButton"
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
      <ResearchStudyPreview
        resource={researchStudy}
        form={form}
        resourceId={researchStudyId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="researchStudyDetailPage" maxWidth="md" sx={{ py: 4 }}>
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
    </Container>
  );
}

export default ResearchStudyDetail;
