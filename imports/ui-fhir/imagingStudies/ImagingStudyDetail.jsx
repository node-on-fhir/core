// /imports/ui-fhir/imagingStudies/ImagingStudyDetail.jsx

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
  Typography,
  Box,
  Tooltip
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';
import moment from 'moment';

import { ImagingStudies } from '/imports/lib/schemas/SimpleSchemas/ImagingStudies';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';

import ImagingStudyFormView from './ImagingStudyFormView';
import ImagingStudyPreview from './ImagingStudyPreview';

function ImagingStudyDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const imagingStudyId = id;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewStudy = !imagingStudyId || imagingStudyId === 'new';
  const isExistingStudy = imagingStudyId && imagingStudyId !== 'new';

  // Read file query param for linking a GridFS file to a new study
  const fileIdFromQuery = searchParams.get('file');

  // Get selected patient from session
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to imaging studies.  Direct-URL loads need the record by id
  // regardless of patient context, so subscribe to the autopublish
  // publication with an _id query ('selectedPatient.ImagingStudies' /
  // 'imagingStudies.all' were never published server-side).
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let query = {};
    if (id && id !== 'new') {
      query = { _id: id };
    } else if (Session.get('selectedPatientId')) {
      query = { 'subject.reference': 'Patient/' + Session.get('selectedPatientId') };
    }
    let handle = Meteor.subscribe('autopublish.ImagingStudies', query, { limit: 10 });
    return handle.ready();
  }, [id]);

  // Initialize state with proper FHIR R4 structure
  const [imagingStudy, setImagingStudy] = useState({
    resourceType: "ImagingStudy",
    status: "available",
    subject: {
      reference: "",
      display: ""
    },
    started: moment().format('YYYY-MM-DDTHH:mm'),
    modality: [{
      system: "http://dicom.nema.org/resources/ontology/DCM",
      code: "",
      display: ""
    }],
    description: "",
    numberOfSeries: 1,
    numberOfInstances: 1,
    procedureCode: [{
      coding: [{
        system: "http://loinc.org",
        code: "",
        display: ""
      }],
      text: ""
    }],
    referrer: {
      reference: "",
      display: ""
    },
    location: {
      reference: "",
      display: ""
    },
    encounter: {
      reference: "",
      display: ""
    }
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setImagingStudy(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded);

  // Set patient on component mount for new imaging studies
  useEffect(function() {
    if (isNewStudy) {
      // Enable editing for new imaging studies
      setIsEditing(true);

      // For new imaging studies, set the patient
      let patientName = '';
      let patientReference = '';

      if (selectedPatient) {
        patientName = get(selectedPatient, 'name[0].text', '') ||
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        // Use FHIR id, not MongoDB _id
        patientReference = `Patient/${get(selectedPatient, 'id', '')}`;
      }

      setImagingStudy(function(prev) {
        return {
          ...prev,
          subject: {
            reference: patientReference,
            display: patientName
          }
        };
      });
    }
  }, [imagingStudyId, selectedPatient]);

  // Load imaging study if editing existing one (re-runs when the
  // subscription delivers, so direct-URL loads populate the form)
  useEffect(function() {
    if (isExistingStudy) {
      const existingStudy = ImagingStudies.findOne({_id: imagingStudyId});

      if (existingStudy) {
        setImagingStudy(existingStudy);
        setIsEditing(false);
      } else {
        // Fallback: try finding by id field
        const studyById = ImagingStudies.findOne({id: imagingStudyId});
        if (studyById) {
          setImagingStudy(studyById);
          setIsEditing(false);
        }
      }
    }
  }, [imagingStudyId, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedImagingStudy = { ...imagingStudy };
    set(updatedImagingStudy, path, value);
    setImagingStudy(updatedImagingStudy);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedImagingStudy);
    }
  }

  // Handle save
  async function handleSaveButton() {
    setLoading(true);
    setError(null);

    try {
      // Prepare data for save
      let dataToSave = {
        status: get(imagingStudy, 'status', 'available'),
        description: get(imagingStudy, 'description', ''),
        started: get(imagingStudy, 'started', ''),
        subject: get(imagingStudy, 'subject', {}),
        modality: get(imagingStudy, 'modality[0].code', ''),
        modalityDisplay: get(imagingStudy, 'modality[0].display', ''),
        numberOfSeries: parseInt(get(imagingStudy, 'numberOfSeries', 1)) || 1,
        numberOfInstances: parseInt(get(imagingStudy, 'numberOfInstances', 1)) || 1
      };

      // Add procedure code if present
      if(get(imagingStudy, 'procedureCode[0].coding[0].code')){
        dataToSave.procedureCode = get(imagingStudy, 'procedureCode[0].coding[0].code');
        dataToSave.procedureCodeDisplay = get(imagingStudy, 'procedureCode[0].coding[0].display') ||
                                          get(imagingStudy, 'procedureCode[0].text', '');
      }

      // Add referrer if present
      if(get(imagingStudy, 'referrer.display')){
        dataToSave.referrer = imagingStudy.referrer;
      }

      // Add interpreter if present
      if(get(imagingStudy, 'interpreter[0].display')){
        dataToSave.interpreter = get(imagingStudy, 'interpreter[0].display');
        dataToSave.interpreterReference = get(imagingStudy, 'interpreter[0].reference', '');
      }

      // Add encounter if present
      if(get(imagingStudy, 'encounter.reference')){
        dataToSave.encounter = imagingStudy.encounter;
      }

      // Add location if present
      if(get(imagingStudy, 'location.display')){
        dataToSave.location = imagingStudy.location;
      }

      // Add reason code if present
      if(get(imagingStudy, 'reasonCode[0].coding[0].code')){
        dataToSave.reasonCode = get(imagingStudy, 'reasonCode[0].coding[0].code');
        dataToSave.reasonCodeDisplay = get(imagingStudy, 'reasonCode[0].coding[0].display') ||
                                       get(imagingStudy, 'reasonCode[0].text', '');
      }

      // Add endpoint if present
      if(get(imagingStudy, 'endpoint[0].display')){
        dataToSave.endpoint = get(imagingStudy, 'endpoint[0].display');
      }

      // Add notes if present
      if(get(imagingStudy, 'note[0].text')){
        dataToSave.notes = get(imagingStudy, 'note[0].text');
      }

      // If creating from DICOM viewer with a file query param, link the GridFS file
      if (fileIdFromQuery && isNewStudy) {
        dataToSave.series = [{
          uid: Random.id(),
          modality: {
            system: 'http://dicom.nema.org/resources/ontology/DCM',
            code: get(imagingStudy, 'modality[0].code', 'OT'),
            display: get(imagingStudy, 'modality[0].display', 'Other')
          },
          numberOfInstances: 1,
          instance: [{
            uid: Random.id(),
            sopClass: { system: 'urn:ietf:rfc:3986', code: 'urn:oid:1.2.840.10008.5.1.4.1.1.2' },
            extension: [{ url: 'gridfsFileId', valueString: fileIdFromQuery }]
          }]
        }];
        dataToSave.numberOfSeries = 1;
        dataToSave.numberOfInstances = 1;
        console.log('[ImagingStudyDetail] Linking GridFS file:', fileIdFromQuery);
      }

      console.log('[ImagingStudyDetail] Saving imaging study with data:', JSON.stringify(dataToSave, null, 2));

      if (isExistingStudy) {
        // Update existing
        await Meteor.callAsync('updateImagingStudy', imagingStudyId, dataToSave);
        console.log('[ImagingStudyDetail] Imaging study updated successfully');
        // Stay on page but exit edit mode
        setIsEditing(false);
      } else {
        // Create new
        const newId = await Meteor.callAsync('createImagingStudy', dataToSave);
        console.log('[ImagingStudyDetail] Imaging study created with ID:', newId);
        // Navigate back to list after creating
        navigate('/imaging-studies');
      }
    } catch (err) {
      console.error('[ImagingStudyDetail] Error saving imaging study:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingStudy) return;

    if (window.confirm('Are you sure you want to delete this imaging study?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeImagingStudy', imagingStudyId);
        console.log('[ImagingStudyDetail] Imaging study deleted successfully');
        navigate('/imaging-studies');
      } catch (err) {
        console.error('[ImagingStudyDetail] Error deleting imaging study:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingStudy) {
      setIsEditing(false);
      setError(null);
      // Reload the study to discard changes
      const existingStudy = ImagingStudies.findOne({_id: imagingStudyId});
      if (existingStudy) {
        setImagingStudy(existingStudy);
      } else {
        const studyById = ImagingStudies.findOne({id: imagingStudyId});
        if (studyById) {
          setImagingStudy(studyById);
        }
      }
    } else {
      navigate('/imaging-studies');
    }
  }

  // Build the header title
  let headerTitle = 'New Imaging Study';
  if (isExistingStudy) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{imagingStudyId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle — hidden for new studies */}
        {!isNewStudy && (
          <Tooltip title="Preview">
            <IconButton
              onClick={function() { setSearchParams({ view: 'page' }); }}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Preview"
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle — hidden for new studies (always form) */}
        {!isNewStudy && (
          <Tooltip title="Form">
            <IconButton
              onClick={function() { setSearchParams({ view: 'form' }); }}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Form"
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Edit toggle — only for existing records */}
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

        {/* Delete — only for existing records */}
        {!isNewStudy && (
          <Button
              id="deleteButton"
              onClick={handleDelete}
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
  function renderFormView() {
    return (
      <>
        <ImagingStudyFormView
          resource={imagingStudy}
          form={imagingStudy}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* Cornerstone3D viewer whenever the study's instances carry GridFS
            files (settings-gated inside ImagingStudyPreview; renders null
            when disabled or no files are linked) */}
        <ImagingStudyPreview
          resource={imagingStudy}
          resourceId={isExistingStudy ? imagingStudyId : null}
          embedded={true}
          viewerOnly={true}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveImagingStudyButton"
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
  function renderPreviewView() {
    return (
      <ImagingStudyPreview
        resource={imagingStudy}
        resourceId={isExistingStudy ? imagingStudyId : null}
        embedded={isEmbedded}
      />
    );
  }

  
  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="imagingStudyDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default ImagingStudyDetail;
