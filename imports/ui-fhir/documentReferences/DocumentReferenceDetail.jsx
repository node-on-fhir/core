// /imports/ui-fhir/documentReferences/DocumentReferenceDetail.jsx

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

import { DocumentReferences } from '/imports/lib/schemas/SimpleSchemas/DocumentReferences';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import DocumentReferenceFormView from './DocumentReferenceFormView';
import DocumentReferencePreview from './DocumentReferencePreview';

function DocumentReferenceDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewDocument = !id || id === 'new';
  const isExistingDocument = id && id !== 'new';

  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to document references
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    const handle = Meteor.subscribe('selectedPatient.DocumentReferences');
    return handle.ready();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [documentReference, setDocumentReference] = useState({
    resourceType: "DocumentReference",
    status: "current",
    docStatus: "final",
    type: {
      coding: [{
        system: "http://loinc.org",
        code: "",
        display: ""
      }],
      text: ""
    },
    category: [{
      coding: [{
        system: "http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category",
        code: "clinical-note",
        display: "Clinical Note"
      }]
    }],
    subject: {
      reference: "",
      display: ""
    },
    date: moment().format('YYYY-MM-DDTHH:mm:ss'),
    author: [{
      reference: "",
      display: ""
    }],
    authenticator: {
      reference: "",
      display: ""
    },
    custodian: {
      reference: "",
      display: ""
    },
    relatesTo: [],
    description: "",
    securityLabel: [],
    content: [{
      attachment: {
        contentType: "text/plain",
        url: "",
        title: ""
      }
    }],
    context: {
      encounter: [{
        reference: "",
        display: ""
      }],
      event: [],
      period: {
        start: moment().format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD')
      },
      facilityType: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
          code: "",
          display: ""
        }]
      },
      practiceSetting: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }]
      }
    }
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setDocumentReference(function(prev) {
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

  // Set patient name and author on component mount for new document references
  useEffect(function() {
    if (isNewDocument) {
      setIsEditing(true);

      let patientName = '';
      let patientReference = '';

      if (selectedPatient) {
        patientName = get(selectedPatient, 'name[0].text', '') ||
                     (get(selectedPatient, 'name[0].given[0]', '') + ' ' + get(selectedPatient, 'name[0].family', '')).trim();
        const patientId = get(selectedPatient, 'id', '');
        patientReference = 'Patient/' + patientId;
      } else if (currentUser) {
        patientName = get(currentUser, 'profile.name.text', '') ||
                     (get(currentUser, 'profile.name.given[0]', '') + ' ' + get(currentUser, 'profile.name.family', '')).trim() ||
                     get(currentUser, 'username', '');
        patientReference = 'Patient/' + get(currentUser, 'profile.patientId', '');
      }

      let authorName = '';
      let authorReference = '';

      if (currentUser) {
        authorName = get(currentUser, 'profile.name.text', '') ||
                    (get(currentUser, 'profile.name.given[0]', '') + ' ' + get(currentUser, 'profile.name.family', '')).trim() ||
                    get(currentUser, 'username', '');
        authorReference = 'Practitioner/' + get(currentUser, '_id', '');
      }

      setDocumentReference(function(prev) {
        return {
          ...prev,
          subject: {
            reference: patientReference,
            display: patientName
          },
          author: [{
            reference: authorReference,
            display: authorName
          }]
        };
      });
    } else {
      setIsEditing(false);
    }
  }, [id, selectedPatient, currentUser]);

  // Load document reference if editing existing
  useEffect(function() {
    if (isExistingDocument) {
      setLoading(true);
      try {
        let result = DocumentReferences.findOne({_id: id});

        if (!result) {
          result = DocumentReferences.findOne({id: id});
        }

        if (result) {
          const documentToSet = {
            ...result,
            type: result.type || {
              coding: [{ system: "http://loinc.org", code: "", display: "" }],
              text: ""
            },
            content: result.content || [{
              attachment: { contentType: "text/plain", url: "", title: "" }
            }]
          };
          setDocumentReference(documentToSet);
        } else {
          console.log('[DocumentReferenceDetail] No document found with id:', id);
        }
      } catch (err) {
        console.error('[DocumentReferenceDetail] Error loading:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedDocumentReference = { ...documentReference };
    set(updatedDocumentReference, path, value);
    setDocumentReference(updatedDocumentReference);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedDocumentReference);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingDocument) {
        await Meteor.callAsync('documentReferences.update', id, documentReference);
        console.log('[DocumentReferenceDetail] Document reference updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('documentReferences.insert', documentReference);
        console.log('[DocumentReferenceDetail] Document reference created with ID:', newId);
        navigate('/document-references');
      }
    } catch (err) {
      console.error('[DocumentReferenceDetail] Error saving:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingDocument) {
      setIsEditing(false);
      setError(null);
      const existingDoc = DocumentReferences.findOne({ _id: id });
      if (existingDoc) {
        setDocumentReference({
          ...existingDoc,
          type: existingDoc.type || {
            coding: [{ system: "http://loinc.org", code: "", display: "" }],
            text: ""
          },
          content: existingDoc.content || [{
            attachment: { contentType: "text/plain", url: "", title: "" }
          }]
        });
      }
    } else {
      navigate('/document-references');
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingDocument) return;

    if (window.confirm('Are you sure you want to delete this document reference?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('documentReferences.remove', id);
        console.log('[DocumentReferenceDetail] Document reference deleted successfully');
        navigate('/document-references');
      } catch (err) {
        console.error('[DocumentReferenceDetail] Error deleting:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Build the header title
  let headerTitle = 'New Document Reference';
  if (isExistingDocument) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {!isNewDocument && (
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

        {!isNewDocument && (
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

        {!isNewDocument && (
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

        {!isNewDocument && (
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
        <DocumentReferenceFormView
          resource={documentReference}
          form={documentReference}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveDocumentReferenceButton"
              onClick={handleSave}
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
      <DocumentReferencePreview
        resource={documentReference}
        resourceId={id}
        embedded={isEmbedded}
      />
    );
  }

  
  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="documentReferenceDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default DocumentReferenceDetail;
