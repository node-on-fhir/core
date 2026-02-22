// /imports/ui-fhir/organizations/OrganizationDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  IconButton,
  TextField,
  Typography,
  Box,
  Stack,
  Tooltip,
  Link,
  FormControlLabel,
  Switch
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';
import moment from 'moment';

import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

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
  const navigate = useNavigate();
  const { id } = useParams();
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Subscribe to organizations so data is available locally
  const isSubscriptionReady = useTracker(function(){
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
            const result = await Meteor.callAsync('organizations.get', id);
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
  }

  // Handle save
  async function handleSave() {
    console.log('[OrganizationDetail] handleSave called');
    setLoading(true);
    setError(null);

    try {
      if (isExistingOrganization) {
        await Meteor.callAsync('organizations.update', id, organization);
        console.log('[OrganizationDetail] Organization updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('organizations.create', organization);
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
            const result = await Meteor.callAsync('organizations.get', id);
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
        await Meteor.callAsync('organizations.remove', id);
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
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle */}
        {!isNewOrganization && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete — always available for existing organizations */}
        {!isNewOrganization && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDelete}
              sx={{ color: 'error.main' }}
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
  function renderFormView() {
    return (
      <>
        <Stack spacing={3}>
          <Typography variant="h6">Organization Information</Typography>

          <TextField
            id="nameInput"
            fullWidth
            label="Name"
            value={get(organization, 'name', '')}
            onChange={(e) => handleChange('name', e.target.value)}
            helperText="Name of the organization"
            disabled={!isEditing}
          />

          <TextField
            id="identifierInput"
            fullWidth
            label="Identifier"
            value={get(organization, 'identifier[0].value', '')}
            onChange={(e) => handleChange('identifier[0].value', e.target.value)}
            helperText="Unique identifier for the organization"
            disabled={!isEditing}
          />

          <FormControlLabel
            control={
              <Switch
                id="activeSwitch"
                checked={get(organization, 'active', true)}
                onChange={(e) => handleChange('active', e.target.checked)}
                disabled={!isEditing}
              />
            }
            label="Active"
          />

          <Typography variant="h6">Type</Typography>

          <TextField
            id="typeCodeInput"
            fullWidth
            label="Type Code"
            value={get(organization, 'type[0].coding[0].code', '')}
            onChange={(e) => handleChange('type[0].coding[0].code', e.target.value)}
            helperText="Organization type code (e.g., prov, dept, team)"
            disabled={!isEditing}
          />

          <TextField
            id="typeDisplayInput"
            fullWidth
            label="Type Display"
            value={get(organization, 'type[0].coding[0].display', '')}
            onChange={(e) => handleChange('type[0].coding[0].display', e.target.value)}
            helperText="Human-readable organization type"
            disabled={!isEditing}
          />

          <Typography variant="h6">Contact Information</Typography>

          <TextField
            id="phoneInput"
            fullWidth
            label="Phone"
            value={get(organization, 'telecom[0].value', '')}
            onChange={(e) => handleChange('telecom[0].value', e.target.value)}
            helperText="Contact phone number"
            disabled={!isEditing}
          />

          <TextField
            id="emailInput"
            fullWidth
            label="Email"
            value={get(organization, 'telecom[1].value', '')}
            onChange={(e) => handleChange('telecom[1].value', e.target.value)}
            helperText="Contact email address"
            disabled={!isEditing}
          />

          <Typography variant="h6">Address</Typography>

          <TextField
            id="addressLineInput"
            fullWidth
            label="Address Line"
            value={get(organization, 'address[0].line[0]', '')}
            onChange={(e) => handleChange('address[0].line[0]', e.target.value)}
            helperText="Street address"
            disabled={!isEditing}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              id="cityInput"
              fullWidth
              label="City"
              value={get(organization, 'address[0].city', '')}
              onChange={(e) => handleChange('address[0].city', e.target.value)}
              disabled={!isEditing}
            />

            <TextField
              id="stateInput"
              fullWidth
              label="State"
              value={get(organization, 'address[0].state', '')}
              onChange={(e) => handleChange('address[0].state', e.target.value)}
              disabled={!isEditing}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              id="postalCodeInput"
              fullWidth
              label="Postal Code"
              value={get(organization, 'address[0].postalCode', '')}
              onChange={(e) => handleChange('address[0].postalCode', e.target.value)}
              disabled={!isEditing}
            />

            <TextField
              id="countryInput"
              fullWidth
              label="Country"
              value={get(organization, 'address[0].country', '')}
              onChange={(e) => handleChange('address[0].country', e.target.value)}
              disabled={!isEditing}
            />
          </Stack>

          <Typography variant="h6">Parent Organization</Typography>

          <TextField
            id="partOfInput"
            fullWidth
            label="Part Of"
            value={get(organization, 'partOf.display', '')}
            onChange={(e) => handleChange('partOf.display', e.target.value)}
            helperText="Parent organization this one is part of"
            disabled={!isEditing}
          />

          <Box sx={{ mt: 2 }}>
            <Link href="https://www.hl7.org/fhir/valueset-organization-type.html" target="_blank" rel="noopener">
              Organization Type Codes
            </Link>
          </Box>
        </Stack>

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && (
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
    const orgName = get(organization, 'name', 'Unnamed Organization');
    const isActive = get(organization, 'active', true);
    const typeCode = get(organization, 'type[0].coding[0].code', '');
    const typeDisplay = get(organization, 'type[0].coding[0].display', '');
    const identifier = get(organization, 'identifier[0].value', '');
    const phone = get(organization, 'telecom[0].value', '');
    const email = get(organization, 'telecom[1].value', '');
    const addressLine = get(organization, 'address[0].line[0]', '');
    const city = get(organization, 'address[0].city', '');
    const state = get(organization, 'address[0].state', '');
    const postalCode = get(organization, 'address[0].postalCode', '');
    const country = get(organization, 'address[0].country', '');
    const partOfDisplay = get(organization, 'partOf.display', '');

    // Build formatted address
    const addressParts = [addressLine, city, state, postalCode, country].filter(Boolean);
    const formattedAddress = addressParts.join(', ');

    return (
      <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
        {/* Organization name + active chip */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            {orgName}
          </Typography>
          <Chip
            label={isActive ? 'Active' : 'Inactive'}
            color={isActive ? 'success' : 'default'}
            size="small"
          />
        </Box>

        {typeDisplay && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            {typeDisplay}{typeCode ? ' (' + typeCode + ')' : ''}
          </Typography>
        )}

        <Divider />

        {/* Two-column metadata */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
          <Box>
            {identifier && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Identifier
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {identifier}
                </Typography>
              </>
            )}
            {partOfDisplay && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Part Of
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {partOfDisplay}
                </Typography>
              </>
            )}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {phone && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {phone}
                </Typography>
              </>
            )}
            {email && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {email}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Address section */}
        {formattedAddress && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Address
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {addressLine && <>{addressLine}<br /></>}
                {[city, state, postalCode].filter(Boolean).join(', ')}
                {country && <><br />{country}</>}
              </Typography>
            </Box>
            <Divider />
          </>
        )}

        {/* Footer with organization ID */}
        {isExistingOrganization && (
          <Box sx={{ pt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Organization ID: {id}
            </Typography>
          </Box>
        )}
      </Box>
    );
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
