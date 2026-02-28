// imports/ui-fhir/codeSystems/CodeSystemDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

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

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import { CodeSystems } from '/imports/lib/schemas/SimpleSchemas/CodeSystems';

import CodeSystemFormView from './CodeSystemFormView';
import CodeSystemPreview from './CodeSystemPreview';

//====================================================================================
// SESSION VARIABLES

let defaultCodeSystem = {
  resourceType: 'CodeSystem',
  status: 'draft',
  title: '',
  name: '',
  version: '',
  publisher: '',
  description: '',
  url: '',
  content: 'complete'
};

Session.setDefault('CodeSystem.Current', defaultCodeSystem);

//====================================================================================
// MAIN COMPONENT

export function CodeSystemDetail(props){
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;

  const [codeSystemId, setCodeSystemId] = useState(false);

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setCodeSystem(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  const [codeSystem, setCodeSystem] = useState(defaultCodeSystem);
  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isNewCodeSystem = !id || id === 'new';
  const isExistingCodeSystem = codeSystemId && codeSystemId !== 'new';

  // Subscribe to code systems
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true;
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('autopublish.CodeSystems', {}, { limit: 1000 });
    } else {
      handle = Meteor.subscribe('autopublish.CodeSystems', {}, { limit: 1000 });
    }
    return handle.ready();
  }, []);

  useEffect(function(){
    if(id && id !== 'new'){
      setCodeSystemId(id);
      setIsEditing(false);

      let selectedCodeSystem = CodeSystems.findOne({_id: id}) || CodeSystems.findOne({id: id});
      if(selectedCodeSystem){
        setCodeSystem(selectedCodeSystem);
        Session.set('CodeSystem.Current', selectedCodeSystem);
      }
    } else if (!id || id === 'new') {
      setIsEditing(true);
      setCodeSystem(defaultCodeSystem);
    }
  }, [id]);

  function handleChange(path, value){
    var newCodeSystem = Object.assign({}, codeSystem);
    set(newCodeSystem, path, value);
    setCodeSystem(newCodeSystem);
    Session.set('CodeSystem.Current', newCodeSystem);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(newCodeSystem);
    }
  }

  async function handleSaveButton(){
    setLoading(true);
    try {
      let dataToSave = {
        resourceType: 'CodeSystem',
        title: get(codeSystem, 'title', ''),
        name: get(codeSystem, 'name', ''),
        version: get(codeSystem, 'version', ''),
        status: get(codeSystem, 'status', 'draft'),
        publisher: get(codeSystem, 'publisher', ''),
        description: get(codeSystem, 'description', ''),
        url: get(codeSystem, 'url', ''),
        content: get(codeSystem, 'content', 'complete')
      };

      console.log('[CodeSystemDetail] Saving code system:', dataToSave);

      if(codeSystemId && codeSystemId !== 'new'){
        await Meteor.callAsync('codeSystems.update', { _id: codeSystemId, ...dataToSave });
        console.log('[CodeSystemDetail] CodeSystem updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('codeSystems.insert', dataToSave);
        console.log('[CodeSystemDetail] CodeSystem created successfully:', newId);
        navigate('/code-systems');
      }
    } catch(err) {
      console.error('[CodeSystemDetail] Error saving code system:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCancelButton(){
    if (codeSystemId && codeSystemId !== 'new') {
      setIsEditing(false);
      setError(null);
      let selectedCodeSystem = CodeSystems.findOne({_id: codeSystemId});
      if(selectedCodeSystem){
        setCodeSystem(selectedCodeSystem);
        Session.set('CodeSystem.Current', selectedCodeSystem);
      }
    } else {
      navigate('/code-systems');
    }
  }

  async function handleDeleteButton(){
    if(!codeSystemId || codeSystemId === 'new') return;

    if (window.confirm('Are you sure you want to delete this code system?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('codeSystems.remove', { _id: codeSystemId });
        console.log('[CodeSystemDetail] CodeSystem deleted successfully');
        navigate('/code-systems');
      } catch(err) {
        console.error('[CodeSystemDetail] Error deleting code system:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Build the header title
  let headerTitle = 'New Code System';
  if (isExistingCodeSystem) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{codeSystemId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle */}
        {!isNewCodeSystem && (
          <Tooltip title="Preview">
            <IconButton
              onClick={function() { setSearchParams({ view: 'page' }); }}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle */}
        {!isNewCodeSystem && (
          <Tooltip title="Form">
            <IconButton
              onClick={function() { setSearchParams({ view: 'form' }); }}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle */}
        {!isNewCodeSystem && (
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

        {/* Delete */}
        {!isNewCodeSystem && (
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
        <CodeSystemFormView
          resource={codeSystem}
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
              id="saveCodeSystemButton"
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
      <CodeSystemPreview
        resource={codeSystem}
        resourceId={codeSystemId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id='codeSystemDetailPage' maxWidth="md" sx={{ py: 4 }}>
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

CodeSystemDetail.propTypes = {};

export default CodeSystemDetail;
