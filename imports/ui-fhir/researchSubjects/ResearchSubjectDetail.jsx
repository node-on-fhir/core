// /imports/ui-fhir/researchSubjects/ResearchSubjectDetail.jsx

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

import PatientSearchDialog from '/imports/components/PatientSearchDialog';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Import the collection directly
import { ResearchSubjects } from '/imports/lib/schemas/SimpleSchemas/ResearchSubjects';

import ResearchSubjectFormView from './ResearchSubjectFormView';
import ResearchSubjectPreview from './ResearchSubjectPreview';

// Get the Patients collection
let Patients;
Meteor.startup(function(){
  if (Meteor.Collections?.Patients) {
    Patients = Meteor.Collections.Patients;
  }
});

function ResearchSubjectDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  // Subscribe to research subjects and patients data
  const subscriptionReady = useTracker(function() {
    if (isEmbedded) return true;
    const researchSubjectsHandle = Meteor.subscribe('selectedPatient.ResearchSubjects');
    const patientsHandle = Meteor.subscribe('patients.search', {});
    return researchSubjectsHandle.ready() && patientsHandle.ready();
  }, []);

  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const selectedPatientId = useTracker(function() {
    return Session.get('selectedPatientId');
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [researchSubject, setResearchSubject] = useState({
    resourceType: "ResearchSubject",
    identifier: [],
    status: "on-study",
    period: {
      start: moment().format('YYYY-MM-DD'),
      end: moment().add(1, 'year').format('YYYY-MM-DD')
    },
    study: {
      reference: "",
      display: ""
    },
    subject: {
      reference: "",
      display: ""
    },
    assignedArm: "",
    actualArm: "",
    consent: {
      reference: "",
      display: ""
    }
  });

  const [researchSubjectId, setResearchSubjectId] = useState(false);

  const [form, setForm] = useState({
    subject: '',
    study: '',
    status: 'on-study',
    periodStart: moment().format('YYYY-MM-DD'),
    periodEnd: moment().add(1, 'year').format('YYYY-MM-DD'),
    assignedArm: '',
    actualArm: '',
    consent: ''
  });

  const [isEditing, setIsEditing] = useState(isEmbedded || !id || id === 'new');
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isNewSubject = !id || id === 'new';
  const isExistingSubject = researchSubjectId && researchSubjectId !== 'new';

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setResearchSubject(function(prev) {
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
      props.onResourceChange(researchSubject);
    }
  }, [researchSubject]);

  // Load existing research subject if editing
  useEffect(function() {
    if (isDeleting) return;
    if (id && id !== 'new' && ResearchSubjects) {
      setResearchSubjectId(id);
      setIsEditing(false);
      setLoading(true);

      const existingSubject = ResearchSubjects.findOne(id);
      if (existingSubject) {
        console.log('Loading existing research subject:', existingSubject);
        setResearchSubject(existingSubject);

        setForm({
          subject: get(existingSubject, 'subject.display', ''),
          study: get(existingSubject, 'study.display', ''),
          status: get(existingSubject, 'status', 'on-study'),
          periodStart: get(existingSubject, 'period.start', ''),
          periodEnd: get(existingSubject, 'period.end', ''),
          assignedArm: get(existingSubject, 'assignedArm', ''),
          actualArm: get(existingSubject, 'actualArm', ''),
          consent: get(existingSubject, 'consent.display', '')
        });
      } else {
        console.log('Research subject not found:', id);
        setError('Research subject not found');
      }
      setLoading(false);
    } else if (id === 'new') {
      setIsEditing(true);

      // Set the selected patient if available
      let subjectDisplay = '';
      let subjectReference = '';
      if (selectedPatient && selectedPatientId) {
        subjectReference = 'Patient/' + selectedPatientId;
        subjectDisplay = get(selectedPatient, 'name[0].text', '');
      }

      let newSubject = {
        resourceType: "ResearchSubject",
        identifier: [],
        status: "on-study",
        period: {
          start: moment().format('YYYY-MM-DD'),
          end: moment().add(1, 'year').format('YYYY-MM-DD')
        },
        study: { reference: "", display: "" },
        subject: { reference: subjectReference, display: subjectDisplay },
        assignedArm: "",
        actualArm: "",
        consent: { reference: "", display: "" }
      };

      setResearchSubject(newSubject);
      setForm({
        subject: subjectDisplay,
        study: '',
        status: 'on-study',
        periodStart: moment().format('YYYY-MM-DD'),
        periodEnd: moment().add(1, 'year').format('YYYY-MM-DD'),
        assignedArm: '',
        actualArm: '',
        consent: ''
      });
    }
  }, [id, selectedPatient, selectedPatientId, subscriptionReady, isDeleting]);

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

  function handleSearchPatient() {
    setPatientSearchOpen(true);
  }

  function handlePatientSelect(patient) {
    console.log('Selected patient:', patient);
    const updatedSubject = Object.assign({}, researchSubject);
    set(updatedSubject, 'subject', {
      reference: 'Patient/' + patient._id,
      display: get(patient, 'name[0].text', '')
    });
    setResearchSubject(updatedSubject);

    handleChange('subject', get(patient, 'name[0].text', ''));
    setPatientSearchOpen(false);
  }

  // Handle save
  async function handleSaveButton() {
    setError(null);

    // Client-side validation
    if (!form.study || !form.study.trim()) {
      setError('Please enter a Research Study reference');
      return;
    }

    if (!form.subject || !form.subject.trim()) {
      setError('Please select a Patient/Subject');
      return;
    }

    if (!form.status) {
      setError('Please select a Status');
      return;
    }

    setLoading(true);

    try {
      let dataToSave = Object.assign({}, researchSubject);
      delete dataToSave._id;

      // Map form fields back to FHIR resource
      dataToSave.status = form.status;
      dataToSave.assignedArm = form.assignedArm;
      dataToSave.actualArm = form.actualArm;
      dataToSave.period = {
        start: form.periodStart,
        end: form.periodEnd
      };

      // Update subject display from form
      dataToSave.subject = {
        reference: get(researchSubject, 'subject.reference', ''),
        display: form.subject
      };

      // Update study display from form
      dataToSave.study = {
        reference: get(researchSubject, 'study.reference', ''),
        display: form.study
      };

      // Update consent display from form
      dataToSave.consent = {
        reference: get(researchSubject, 'consent.reference', ''),
        display: form.consent
      };

      // Ensure subject reference is set
      if (!dataToSave.subject.reference) {
        if (selectedPatientId) {
          dataToSave.subject.reference = 'Patient/' + selectedPatientId;
        } else if (dataToSave.subject.display) {
          const patientId = dataToSave.subject.display.replace(/[^a-zA-Z0-9]/g, '-');
          dataToSave.subject.reference = 'Patient/' + patientId;
        }
      }

      // Ensure study reference is set
      if (!dataToSave.study.reference && dataToSave.study.display) {
        const studyId = dataToSave.study.display.replace(/[^a-zA-Z0-9]/g, '-');
        dataToSave.study.reference = 'ResearchStudy/' + studyId;
      }

      console.log('Saving research subject:', dataToSave);

      if (isNewSubject) {
        const result = await Meteor.callAsync('researchSubjects.create', {
          researchSubject: dataToSave
        });
        console.log('Created research subject:', result);
        setLoading(false);
        setTimeout(function() {
          navigate('/research-subjects');
        }, 500);
      } else {
        const result = await Meteor.callAsync('researchSubjects.update', {
          _id: researchSubjectId,
          researchSubject: dataToSave
        });
        console.log('Updated research subject');
        setLoading(false);
        setIsEditing(false);
      }
    } catch (err) {
      setLoading(false);
      setError(err.reason || err.message || 'Failed to save research subject');
      console.error('Save error:', err);
    }
  }

  function handleCancelButton() {
    if (isNewSubject) {
      navigate('/research-subjects');
    } else {
      setIsEditing(false);
      setError(null);
      // Reload original data from collection
      if (ResearchSubjects) {
        const original = ResearchSubjects.findOne(researchSubjectId);
        if (original) {
          setResearchSubject(original);
          setForm({
            subject: get(original, 'subject.display', ''),
            study: get(original, 'study.display', ''),
            status: get(original, 'status', 'on-study'),
            periodStart: get(original, 'period.start', ''),
            periodEnd: get(original, 'period.end', ''),
            assignedArm: get(original, 'assignedArm', ''),
            actualArm: get(original, 'actualArm', ''),
            consent: get(original, 'consent.display', '')
          });
        }
      }
    }
  }

  // Handle delete
  async function handleDeleteButton() {
    if (!researchSubjectId || researchSubjectId === 'new') return;

    if (window.confirm('Are you sure you want to delete this research subject?')) {
      setIsDeleting(true);
      try {
        await Meteor.callAsync('researchSubjects.remove', { _id: researchSubjectId });
        console.log('Deleted research subject:', researchSubjectId);
      } catch (err) {
        console.error('Delete error:', err);
      }
      navigate('/research-subjects');
    }
  }

  // Build the header title
  let headerTitle = 'New Research Subject';
  if (isExistingSubject) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{researchSubjectId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle -- hidden for new subjects */}
        {!isNewSubject && (
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

        {/* Form toggle -- hidden for new subjects (always form) */}
        {!isNewSubject && (
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

        {/* Lock / Unlock toggle -- only for existing subjects */}
        {!isNewSubject && (
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

        {/* Delete -- only for existing subjects, gated on edit mode */}
        {!isNewSubject && (
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
        <ResearchSubjectFormView
          resource={researchSubject}
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
              id="saveResearchSubjectButton"
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
      <ResearchSubjectPreview
        resource={researchSubject}
        form={form}
        resourceId={researchSubjectId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="researchSubjectDetailPage" maxWidth="md" sx={{ py: 4 }}>
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
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        onSelect={handlePatientSelect}
      />
    </Container>
  );
}

export default ResearchSubjectDetail;
