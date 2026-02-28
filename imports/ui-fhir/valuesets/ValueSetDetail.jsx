// imports/ui-fhir/valuesets/ValueSetDetail.jsx

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

import { ValueSets } from '/imports/lib/schemas/SimpleSchemas/ValueSets';

import ValueSetFormView from './ValueSetFormView';
import ValueSetPreview from './ValueSetPreview';

//====================================================================================
// SESSION VARIABLES

let defaultValueSet = {
  resourceType: 'ValueSet',
  status: 'draft',
  title: '',
  name: '',
  version: '',
  publisher: '',
  description: '',
  url: '',
  copyright: ''
};

Session.setDefault('ValueSet.Current', defaultValueSet);

//====================================================================================
// MAIN COMPONENT

export function ValueSetDetail(props){
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;

  const [valueSetId, setValueSetId] = useState(false);

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setValueSet(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  const [valueSet, setValueSet] = useState(defaultValueSet);
  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isNewRecord = !id || id === 'new';
  const isExistingRecord = valueSetId && valueSetId !== 'new';

  // Subscribe to value sets
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true;
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('autopublish.ValueSets', {}, { limit: 1000 });
    } else {
      handle = Meteor.subscribe('autopublish.ValueSets', {}, { limit: 1000 });
    }
    return handle.ready();
  }, []);

  useEffect(function(){
    if(id && id !== 'new'){
      setValueSetId(id);
      setIsEditing(false);

      let selectedValueSet = ValueSets.findOne({_id: id}) || ValueSets.findOne({id: id});
      if(selectedValueSet){
        setValueSet(selectedValueSet);
        Session.set('ValueSet.Current', selectedValueSet);
      }
    } else if (!id || id === 'new') {
      setIsEditing(true);
      setValueSet(defaultValueSet);
    }
  }, [id]);

  function handleChange(path, value){
    var newValueSet = Object.assign({}, valueSet);
    set(newValueSet, path, value);
    setValueSet(newValueSet);
    Session.set('ValueSet.Current', newValueSet);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(newValueSet);
    }
  }

  async function handleSaveButton(){
    setLoading(true);
    try {
      let dataToSave = {
        resourceType: 'ValueSet',
        title: get(valueSet, 'title', ''),
        name: get(valueSet, 'name', ''),
        version: get(valueSet, 'version', ''),
        status: get(valueSet, 'status', 'draft'),
        publisher: get(valueSet, 'publisher', ''),
        description: get(valueSet, 'description', ''),
        url: get(valueSet, 'url', ''),
        copyright: get(valueSet, 'copyright', ''),
        date: get(valueSet, 'date', ''),
        compose: get(valueSet, 'compose', {})
      };

      console.log('[ValueSetDetail] Saving value set:', dataToSave);

      if(valueSetId && valueSetId !== 'new'){
        await Meteor.callAsync('valueSets.update', { _id: valueSetId, ...dataToSave });
        console.log('[ValueSetDetail] ValueSet updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('valueSets.insert', dataToSave);
        console.log('[ValueSetDetail] ValueSet created successfully:', newId);
        navigate('/value-sets');
      }
    } catch(err) {
      console.error('[ValueSetDetail] Error saving value set:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCancelButton(){
    if (valueSetId && valueSetId !== 'new') {
      setIsEditing(false);
      setError(null);
      let selectedValueSet = ValueSets.findOne({_id: valueSetId});
      if(selectedValueSet){
        setValueSet(selectedValueSet);
        Session.set('ValueSet.Current', selectedValueSet);
      }
    } else {
      navigate('/value-sets');
    }
  }

  async function handleDeleteButton(){
    if(!valueSetId || valueSetId === 'new') return;

    if (window.confirm('Are you sure you want to delete this value set?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('valueSets.remove', { _id: valueSetId });
        console.log('[ValueSetDetail] ValueSet deleted successfully');
        navigate('/value-sets');
      } catch(err) {
        console.error('[ValueSetDetail] Error deleting value set:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Build the header title
  let headerTitle = 'New Value Set';
  if (isExistingRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{valueSetId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle */}
        {!isNewRecord && (
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
        {!isNewRecord && (
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
        {!isNewRecord && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={function() { setIsEditing(!isEditing); }}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete */}
        {!isNewRecord && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDeleteButton}
              disabled={!isEditing}
              sx={{ color: isEditing ? 'error.main' : 'text.disabled' }}
            >
              <DeleteIcon />
              <Typography sx={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                borderWidth: 0
              }}>Delete</Typography>
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView(){
    return (
      <>
        <ValueSetFormView
          resource={valueSet}
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
              id="saveValueSetButton"
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
      <ValueSetPreview
        resource={valueSet}
        resourceId={valueSetId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id='valueSetDetailPage' maxWidth="md" sx={{ py: 4 }}>
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

ValueSetDetail.propTypes = {};

export default ValueSetDetail;
