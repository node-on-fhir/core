// /imports/ui-fhir/practitioners/PractitionerDetail.jsx

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

import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import PractitionerFormView from './PractitionerFormView';
import PractitionerPreview from './PractitionerPreview';

function PractitionerDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const practitionerId = id;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewPractitioner = !practitionerId || practitionerId === 'new';
  const isExistingPractitioner = practitionerId && practitionerId !== 'new';

  // Parse URL parameters for save/cancel destinations
  const saveDestination = searchParams.get('save');
  const cancelDestination = searchParams.get('cancel');

  // Subscribe to practitioners
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.Practitioners', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('practitioners.all');
    }
    return handle.ready();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [practitioner, setPractitioner] = useState({
    resourceType: "Practitioner",
    active: true,
    name: [{
      use: "official",
      family: "",
      given: [""],
      prefix: [""],
      suffix: [""]
    }],
    telecom: [{
      system: "phone",
      value: "",
      use: "work"
    }, {
      system: "email",
      value: "",
      use: "work"
    }],
    address: [{
      use: "work",
      type: "both",
      line: [""],
      city: "",
      state: "",
      postalCode: "",
      country: "USA"
    }],
    gender: "",
    birthDate: "",
    photo: [],
    identifier: [{
      system: "http://hl7.org/fhir/sid/us-npi",
      value: ""
    }],
    qualification: [{
      identifier: [{
        system: "",
        value: ""
      }],
      code: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v2-0360",
          code: "",
          display: ""
        }],
        text: ""
      },
      period: {
        start: "",
        end: ""
      },
      issuer: {
        reference: "",
        display: ""
      }
    }],
    communication: [{
      coding: [{
        system: "urn:ietf:bcp:47",
        code: "en",
        display: "English"
      }]
    }],
    practitionerRole: [{
      specialty: [{
        coding: [{
          system: "http://nucc.org/provider-taxonomy",
          code: "",
          display: ""
        }],
        text: ""
      }]
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setPractitioner(function(prev) {
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

  // Set editing mode for new practitioners
  useEffect(function() {
    if (isNewPractitioner) {
      setIsEditing(true);
    }
  }, [practitionerId]);

  // Load practitioner from local collection when subscription is ready
  useEffect(function() {
    if (isExistingPractitioner) {
      // Try loading from local collection
      const existingPractitioner = Practitioners.findOne({ _id: practitionerId });

      if (existingPractitioner) {
        setPractitioner(existingPractitioner);
        setIsEditing(false);
      } else {
        // Fallback: try finding by FHIR id field
        const practitionerById = Practitioners.findOne({ id: practitionerId });
        if (practitionerById) {
          setPractitioner(practitionerById);
          setIsEditing(false);
        }
      }
    }
  }, [practitionerId, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedPractitioner = { ...practitioner };
    set(updatedPractitioner, path, value);
    setPractitioner(updatedPractitioner);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedPractitioner);
    }
  }

  // Handle save
  async function handleSaveButton() {
    setLoading(true);
    setError(null);

    try {
      let resultId;

      if (isExistingPractitioner) {
        // Update existing practitioner
        await Meteor.callAsync('practitioners.update', practitionerId, practitioner);
        console.log('[PractitionerDetail] Practitioner updated successfully');
        resultId = practitionerId;
        // Stay on page but exit edit mode
        setIsEditing(false);
      } else {
        // Create new practitioner
        resultId = await Meteor.callAsync('practitioners.create', practitioner);
        console.log('[PractitionerDetail] Practitioner created with ID:', resultId);
      }

      // If coming from my-profile, link the practitioner to the user
      if (saveDestination === 'my-profile' && resultId) {
        try {
          await Meteor.callAsync('users.linkPractitionerId', resultId);
          console.log('[PractitionerDetail] Practitioner linked to user profile');
          navigate('/my-profile');
          return;
        } catch (linkError) {
          console.error('[PractitionerDetail] Error linking practitioner to user:', linkError);
          setError('Practitioner saved but could not link to your profile: ' + linkError.message);
        }
      }

      // Navigate based on save destination or default
      if (saveDestination) {
        navigate('/' + saveDestination);
      } else if (isNewPractitioner) {
        navigate('/practitioners');
      }
    } catch (err) {
      console.error('[PractitionerDetail] Error saving practitioner:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingPractitioner) return;

    if (window.confirm('Are you sure you want to delete this practitioner?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('practitioners.remove', practitionerId);
        console.log('[PractitionerDetail] Practitioner deleted successfully');
        navigate('/practitioners');
      } catch (err) {
        console.error('[PractitionerDetail] Error deleting practitioner:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (cancelDestination) {
      navigate('/' + cancelDestination);
    } else if (isExistingPractitioner) {
      setIsEditing(false);
      setError(null);
      // Reload practitioner from collection to discard changes
      const existingPractitioner = Practitioners.findOne({ _id: practitionerId });
      if (existingPractitioner) {
        setPractitioner(existingPractitioner);
      } else {
        const practitionerById = Practitioners.findOne({ id: practitionerId });
        if (practitionerById) {
          setPractitioner(practitionerById);
        }
      }
    } else {
      navigate('/practitioners');
    }
  }

  // Build the header title
  let headerTitle = 'New Practitioner';
  if (isExistingPractitioner) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{practitionerId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle — hidden for new practitioners */}
        {!isNewPractitioner && (
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

        {/* Form toggle — hidden for new practitioners (always form) */}
        {!isNewPractitioner && (
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
        {!isNewPractitioner && (
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
        {!isNewPractitioner && (
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
        <PractitionerFormView
          resource={practitioner}
          form={practitioner}
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
              id="savePractitionerButton"
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
      <PractitionerPreview
        resource={practitioner}
        resourceId={isExistingPractitioner ? practitionerId : null}
        embedded={isEmbedded}
      />
    );
  }

  
  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="practitionerDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default PractitionerDetail;
