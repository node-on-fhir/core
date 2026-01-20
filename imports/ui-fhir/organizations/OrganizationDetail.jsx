// /imports/ui-fhir/organizations/OrganizationDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Stack,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  Link,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch
} from '@mui/material';

import { get, set } from 'lodash';
import moment from 'moment';

import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';


function OrganizationDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();

  // Get current user from session/tracker
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

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

  // Set default values on component mount for new organizations
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new organizations
      setIsEditing(true);
    } else {
      // Viewing existing organization - start in read-only mode
      setIsEditing(false);
    }
  }, [id]);

  // Load organization if editing
  useEffect(function() {
    async function loadOrganization() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('organizations.get', id);
          if (result) {
            setOrganization(result);
          }
        } catch (err) {
          console.error('Error loading organization:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }

    loadOrganization();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedOrganization = { ...organization };
    set(updatedOrganization, path, value);
    setOrganization(updatedOrganization);
  }

  // Handle save
  async function handleSave() {
    console.log('=== handleSave called ===');
    console.log('Organization data to save:', JSON.stringify(organization, null, 2));
    console.log('Current user:', Meteor.userId());

    setLoading(true);
    setError(null);

    try {
      if (id && id !== 'new') {
        // Update existing organization
        console.log('Updating existing organization with id:', id);
        await Meteor.callAsync('organizations.update', id, organization);
        console.log('Organization updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new organization
        console.log('Creating new organization...');
        const newId = await Meteor.callAsync('organizations.create', organization);
        console.log('Organization created with ID:', newId);

        // Navigate back to organizations list for new organizations
        navigate('/organizations');
      }
    } catch (err) {
      console.error('Error saving organization:', err);
      console.error('Error details:', err.error, err.reason, err.details);
      setError(err.message || err.reason || 'Failed to save organization');
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;

    if (window.confirm('Are you sure you want to delete this organization?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('organizations.remove', id);
        console.log('Organization deleted successfully');
        navigate('/organizations');
      } catch (err) {
        console.error('Error deleting organization:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/organizations');
  }

  return (
    <Container id="organizationDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Edit Organization' : 'New Organization'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          {/* System ID Barcode */}
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}

          <Stack spacing={3}>
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

            <Typography variant="h6" sx={{ mt: 2 }}>Contact Information</Typography>

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

            <Typography variant="h6" sx={{ mt: 2 }}>Address</Typography>

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

            <Typography variant="h6" sx={{ mt: 2 }}>Parent Organization</Typography>

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
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button
                onClick={() => navigate('/organizations')}
              >
                Back
              </Button>
              <Button
                onClick={handleDelete}
                color="error"
              >
                Delete
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                variant="contained"
                color="primary"
              >
                Edit
              </Button>
            </>
          ) : (
            // Edit mode buttons
            <>
              <Button
                onClick={() => {
                  if (id && id !== 'new') {
                    // Cancel editing and reload original data
                    setIsEditing(false);
                    // Reload the organization to discard changes
                    async function reloadOrganization() {
                      try {
                        const result = await Meteor.callAsync('organizations.get', id);
                        if (result) {
                          setOrganization(result);
                        }
                      } catch (err) {
                        console.error('Error reloading organization:', err);
                      }
                    }
                    reloadOrganization();
                  } else {
                    // For new organizations, go back
                    navigate('/organizations');
                  }
                }}
                disabled={loading}
              >
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
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default OrganizationDetail;
