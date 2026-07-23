// /imports/ui-fhir/lists/ListDetail.jsx

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

import { Lists } from '/imports/lib/schemas/SimpleSchemas/Lists';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import ListFormView from './ListFormView';
import ListPreview from './ListPreview';

function ListDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewList = !id || id === 'new';
  const isExistingList = id && id !== 'new';

  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [list, setList] = useState({
    resourceType: "List",
    status: "current",
    mode: "working",
    title: "",
    code: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/list-example-use-codes",
        code: "",
        display: ""
      }],
      text: ""
    },
    subject: {
      reference: "",
      display: ""
    },
    encounter: {
      reference: "",
      display: ""
    },
    date: moment().format('YYYY-MM-DDTHH:mm:ss'),
    source: {
      reference: "",
      display: ""
    },
    orderedBy: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/list-order",
        code: "system",
        display: "Sorted by System"
      }]
    },
    note: [{
      text: ""
    }],
    entry: []
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setList(function(prev) {
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

  // Set patient name and source on component mount for new lists
  useEffect(function() {
    if (isNewList) {
      // Enable editing for new lists
      setIsEditing(true);

      // For new lists, set the patient name
      let patientName = '';
      let patientReference = '';

      if (selectedPatient) {
        // Prefer selected patient
        patientName = get(selectedPatient, 'name[0].text', '') ||
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        patientReference = `Patient/${get(selectedPatient, '_id', '')}`;
      } else if (currentUser) {
        // Fall back to current user
        patientName = get(currentUser, 'profile.name.text', '') ||
                     `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                     get(currentUser, 'username', '');
        // You might need to look up the Patient resource for the current user
        patientReference = `Patient/${get(currentUser, 'profile.patientId', '')}`;
      }

      // Set source to current user
      let sourceName = '';
      let sourceReference = '';

      if (currentUser) {
        sourceName = get(currentUser, 'profile.name.text', '') ||
                    `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                    get(currentUser, 'username', '');
        sourceReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }

      setList(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        source: {
          reference: sourceReference,
          display: sourceName
        }
      }));
    }
  }, [id, selectedPatient, currentUser]);

  // Load list if editing
  useEffect(function() {
    async function loadList() {
      if (isExistingList) {
        setLoading(true);
        try {
          // rpc-migration: ddp-straggler
          const result = await Meteor.callAsync('lists.get', id);
          if (result) {
            setList(result);
          }
        } catch (err) {
          console.error('Error loading list:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }

    loadList();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedList = { ...list };
    set(updatedList, path, value);
    setList(updatedList);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedList);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingList) {
        // Update existing list
        await Meteor.rpc('lists.update', { listId: id, listData: list });
        console.log('[ListDetail] List updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new list
        // rpc-migration: ddp-straggler
        const newId = await Meteor.callAsync('lists.create', list);
        console.log('[ListDetail] List created with ID:', newId);
        // Navigate back to lists list for new lists
        navigate('/lists');
      }
    } catch (err) {
      console.error('[ListDetail] Error saving list:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingList) return;

    if (window.confirm('Are you sure you want to delete this list?')) {
      setLoading(true);
      try {
        await Meteor.rpc('lists.remove', { listId: id });
        console.log('[ListDetail] List deleted successfully');
        navigate('/lists');
      } catch (err) {
        console.error('[ListDetail] Error deleting list:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingList) {
      setIsEditing(false);
      setError(null);
      // Reload the list to discard changes
      async function reloadList() {
        try {
          // rpc-migration: ddp-straggler
          const result = await Meteor.callAsync('lists.get', id);
          if (result) {
            setList(result);
          }
        } catch (err) {
          console.error('[ListDetail] Error reloading list:', err);
        }
      }
      reloadList();
    } else {
      navigate('/lists');
    }
  }

  // Build the header title
  let headerTitle = 'New List';
  if (isExistingList) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle - hidden for new lists */}
        {!isNewList && (
          <Tooltip title="Preview">
            <IconButton
              onClick={() => setSearchParams({ view: 'page' })}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Preview"
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle - hidden for new lists */}
        {!isNewList && (
          <Tooltip title="Form">
            <IconButton
              onClick={() => setSearchParams({ view: 'form' })}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Form"
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle */}
        {!isNewList && (
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
        {!isNewList && (
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
        <ListFormView
          resource={list}
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
              id="saveListButton"
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
      <ListPreview
        resource={list}
        resourceId={isExistingList ? id : null}
        embedded={isEmbedded}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
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

export default ListDetail;
