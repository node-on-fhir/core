// imports/ui-fhir/compositions/CompositionDetail.jsx

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

import { useTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { get, set } from 'lodash';
import moment from 'moment';

import { Compositions } from '/imports/lib/schemas/SimpleSchemas/Compositions';

import CompositionFormView from './CompositionFormView';
import CompositionPreview from './CompositionPreview';

//===========================================================================
// MAIN COMPONENT

export function CompositionDetail(props){
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;

  const [compositionId, setCompositionId] = useState(false);

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setComposition(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  const [composition, setComposition] = useState({
    resourceType: 'Composition',
    status: 'preliminary',
    title: '',
    subject: {
      reference: '',
      display: ''
    },
    encounter: {
      reference: '',
      display: ''
    },
    date: moment().format('YYYY-MM-DD'),
    type: {
      coding: [{
        code: '',
        display: ''
      }],
      text: ''
    },
    category: [],
    author: []
  });
  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isNewComposition = !id || id === 'new';
  const isExistingComposition = compositionId && compositionId !== 'new';

  // Subscribe to compositions
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true;
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('autopublish.Compositions', {}, { limit: 1000 });
    } else {
      handle = Meteor.subscribe('autopublish.Compositions', {}, { limit: 1000 });
    }
    return handle.ready();
  }, []);

  useEffect(function(){
    if(id && id !== 'new'){
      setCompositionId(id);
      setIsEditing(false);

      let selectedComposition = Compositions.findOne({_id: id}) || Compositions.findOne({id: id});
      if(selectedComposition){
        setComposition(selectedComposition);
      }
    } else if (!id || id === 'new') {
      setIsEditing(true);

      // Set patient if selected
      const selectedPatient = Session.get('selectedPatient');
      const selectedPatientId = Session.get('selectedPatientId');

      if (selectedPatient) {
        let patientReference = 'Patient/' + get(selectedPatient, 'id', selectedPatientId);
        let patientDisplay = '';

        if (get(selectedPatient, 'name[0].text')) {
          patientDisplay = get(selectedPatient, 'name[0].text');
        } else if (get(selectedPatient, 'name[0]')) {
          const given = get(selectedPatient, 'name[0].given', []).join(' ');
          const family = get(selectedPatient, 'name[0].family', '');
          patientDisplay = (given + ' ' + family).trim();
        }

        setComposition(function(prev) {
          return Object.assign({}, prev, {
            subject: {
              reference: patientReference,
              display: patientDisplay
            }
          });
        });
      }
    }
  }, [id]);

  function handleChange(path, value){
    var newComposition = Object.assign({}, composition);
    set(newComposition, path, value);
    setComposition(newComposition);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(newComposition);
    }
  }

  async function handleSaveButton(){
    setLoading(true);
    try {
      let dataToSave = {
        resourceType: 'Composition',
        title: get(composition, 'title', ''),
        status: get(composition, 'status', 'preliminary'),
        subject: get(composition, 'subject', {}),
        encounter: get(composition, 'encounter', {}),
        date: get(composition, 'date', ''),
        type: get(composition, 'type', {}),
        category: get(composition, 'category', []),
        author: get(composition, 'author', [])
      };

      console.log('[CompositionDetail] Saving composition:', dataToSave);

      if(compositionId && compositionId !== 'new'){
        await Meteor.callAsync('compositions.update', { _id: compositionId, ...dataToSave });
        console.log('[CompositionDetail] Composition updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('compositions.insert', dataToSave);
        console.log('[CompositionDetail] Composition created successfully:', newId);
        navigate('/compositions');
      }
    } catch(err) {
      console.error('[CompositionDetail] Error saving composition:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCancelButton(){
    if (compositionId && compositionId !== 'new') {
      setIsEditing(false);
      setError(null);
      let selectedComposition = Compositions.findOne({_id: compositionId});
      if(selectedComposition){
        setComposition(selectedComposition);
      }
    } else {
      navigate('/compositions');
    }
  }

  async function handleDeleteButton(){
    if(!compositionId || compositionId === 'new') return;

    if (window.confirm('Are you sure you want to delete this composition?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('compositions.remove', { _id: compositionId });
        console.log('[CompositionDetail] Composition deleted successfully');
        navigate('/compositions');
      } catch(err) {
        console.error('[CompositionDetail] Error deleting composition:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Build the header title
  let headerTitle = 'New Composition';
  if (isExistingComposition) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{compositionId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle */}
        {!isNewComposition && (
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
        {!isNewComposition && (
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
        {!isNewComposition && (
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
        {!isNewComposition && (
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
        <CompositionFormView
          resource={composition}
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
              id="saveCompositionButton"
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
      <CompositionPreview
        resource={composition}
        resourceId={compositionId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id='compositionDetailPage' maxWidth="md" sx={{ py: 4 }}>
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

CompositionDetail.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,
  compositionId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  composition: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showPatientInputs: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpsert: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};

export default CompositionDetail;
