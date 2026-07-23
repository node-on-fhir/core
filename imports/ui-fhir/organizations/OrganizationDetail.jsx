// /imports/ui-fhir/organizations/OrganizationDetail.jsx

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

import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import OrganizationFormView from './OrganizationFormView';
import OrganizationPreview from './OrganizationPreview';

const orgTypeOptions = [
  { code: 'prov', display: 'Healthcare Provider' },
  { code: 'dept', display: 'Hospital Department' },
  { code: 'team', display: 'Organizational Team' },
  { code: 'govt', display: 'Government' },
  { code: 'ins', display: 'Insurance Company' },
  { code: 'pay', display: 'Payer' },
  { code: 'edu', display: 'Educational Institute' },
  { code: 'reli', display: 'Religious Institution' },
  { code: 'crs', display: 'Clinical Research Sponsor' },
  { code: 'cg', display: 'Community Group' },
  { code: 'bus', display: 'Non-Healthcare Business' },
  { code: 'other', display: 'Other' }
];

function OrganizationDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewOrganization = !id || id === 'new';
  const isExistingOrganization = id && id !== 'new';

  // Initialize state with proper FHIR R4 structure
  const [organization, setOrganization] = useState({
    resourceType: "Organization",
    name: "",
    active: true,
    type: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/organization-type",
        code: "",
        display: ""
      }]
    }],
    identifier: [{
      system: "",
      value: ""
    }],
    telecom: [
      {
        system: "phone",
        value: "",
        use: "work"
      },
      {
        system: "email",
        value: "",
        use: "work"
      }
    ],
    address: [{
      use: "work",
      type: "both",
      line: [""],
      city: "",
      state: "",
      postalCode: "",
      country: ""
    }],
    contact: [],
    partOf: {
      reference: "",
      display: ""
    },
    endpoint: []
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setOrganization(function(prev) {
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

  // Subscribe to organizations so data is available locally
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      return Meteor.subscribe('selectedPatient.Organizations', Session.get('selectedPatientId'), { limit: 1000 }).ready();
    } else {
      return Meteor.subscribe('organizations.all').ready();
    }
  }, []);

  // Set default editing state
  useEffect(function() {
    if (isNewOrganization) {
      setIsEditing(true);
    }
  }, [id]);

  // Load organization data when subscription is ready
  useEffect(function() {
    if (isExistingOrganization && isSubscriptionReady) {
      let existingOrganization = Organizations.findOne({ _id: id });

      if (existingOrganization) {
        setOrganization(existingOrganization);
        setIsEditing(false);
      } else {
        // Fallback: try loading via method for ObjectID records
        async function loadViaMethod() {
          try {
            const result = await Meteor.rpc('organizations.get', { organizationId: id });
            if (result) {
              setOrganization(result);
            }
          } catch (err) {
            console.error('[OrganizationDetail] Error loading organization via method:', err);
            setError(err.message);
          }
        }
        loadViaMethod();
        setIsEditing(false);
      }
    }
  }, [id, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedOrganization = { ...organization };
    set(updatedOrganization, path, value);
    setOrganization(updatedOrganization);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedOrganization);
    }
  }

  // Handle save
  async function handleSave() {
    console.log('[OrganizationDetail] handleSave called');
    setLoading(true);
    setError(null);

    try {
      if (isExistingOrganization) {
        await Meteor.rpc('organizations.update', { organizationId: id, organizationData: organization });
        console.log('[OrganizationDetail] Organization updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.rpc('organizations.create', organization);
        console.log('[OrganizationDetail] Organization created with ID:', newId);
        navigate('/organizations');
      }
    } catch (err) {
      console.error('[OrganizationDetail] Error saving organization:', err);
      setError(err.message || err.reason || 'Failed to save organization');
    } finally {
      setLoading(false);
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingOrganization) {
      setIsEditing(false);
      setError(null);
      // Reload the organization to discard changes
      const existingOrganization = Organizations.findOne({ _id: id });
      if (existingOrganization) {
        setOrganization(existingOrganization);
      } else {
        async function reloadOrganization() {
          try {
            const result = await Meteor.rpc('organizations.get', { organizationId: id });
            if (result) {
              setOrganization(result);
            }
          } catch (err) {
            console.error('[OrganizationDetail] Error reloading organization:', err);
          }
        }
        reloadOrganization();
      }
    } else {
      navigate('/organizations');
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingOrganization) return;

    if (window.confirm('Are you sure you want to delete this organization?')) {
      setLoading(true);
      try {
        await Meteor.rpc('organizations.remove', { organizationId: id });
        console.log('[OrganizationDetail] Organization deleted successfully');
        navigate('/organizations');
      } catch (err) {
        console.error('[OrganizationDetail] Error deleting organization:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Build the header title
  let headerTitle = 'New Organization';
  if (isExistingOrganization) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle — hidden for new organizations */}
        {!isNewOrganization && (
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

        {/* Form toggle — hidden for new organizations */}
        {!isNewOrganization && (
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
        {!isNewOrganization && (
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
        {!isNewOrganization && (
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
        <OrganizationFormView
          resource={organization}
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
              id="saveOrganizationButton"
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
      <OrganizationPreview
        resource={organization}
        resourceId={isExistingOrganization ? id : null}
        embedded={isEmbedded}
      />
    );
  }

  
  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="organizationDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default OrganizationDetail;
