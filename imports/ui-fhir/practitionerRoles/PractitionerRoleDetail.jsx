// /imports/ui-fhir/practitionerRoles/PractitionerRoleDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Container,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { PractitionerRoles } from '/imports/lib/schemas/SimpleSchemas/PractitionerRoles';
import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';
import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';

import { get, set } from 'lodash';


//=============================================================================================================================================
// MAIN COMPONENT

function PractitionerRoleDetail(props) {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [practitionerRole, setPractitionerRole] = useState({
    resourceType: 'PractitionerRole',
    active: true,
    practitioner: { reference: '', display: '' },
    organization: { reference: '', display: '' },
    code: [],
    specialty: [],
    location: [],
    healthcareService: [],
    telecom: [],
    period: { start: '', end: '' },
    availabilityExceptions: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simple form fields for easier input
  const [roleCode, setRoleCode] = useState('');
  const [roleDisplay, setRoleDisplay] = useState('');
  const [specialtyCode, setSpecialtyCode] = useState('');
  const [specialtyDisplay, setSpecialtyDisplay] = useState('');
  const [practitionerDisplay, setPractitionerDisplay] = useState('');
  const [practitionerReference, setPractitionerReference] = useState('');
  const [organizationDisplay, setOrganizationDisplay] = useState('');
  const [organizationReference, setOrganizationReference] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [active, setActive] = useState(true);
  const [availabilityExceptions, setAvailabilityExceptions] = useState('');

  // Subscribe to necessary collections
  const isSubscriptionReady = useTracker(function(){
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('autopublish.PractitionerRoles', {}, {});
    } else {
      handle = Meteor.subscribe('practitionerRoles.all');
    }
    return handle.ready();
  }, []);

  // Load existing practitioner role if editing
  useEffect(() => {
    if (id && id !== 'new') {
      const existingRole = PractitionerRoles.findOne({ _id: id }) || PractitionerRoles.findOne({ id: id });
      if (existingRole) {
        setPractitionerRole(existingRole);

        // Populate simple form fields
        setActive(get(existingRole, 'active', true));
        setPractitionerDisplay(get(existingRole, 'practitioner.display', ''));
        setPractitionerReference(get(existingRole, 'practitioner.reference', ''));
        setOrganizationDisplay(get(existingRole, 'organization.display', ''));
        setOrganizationReference(get(existingRole, 'organization.reference', ''));
        setRoleCode(get(existingRole, 'code[0].coding[0].code', ''));
        setRoleDisplay(get(existingRole, 'code[0].text', get(existingRole, 'code[0].coding[0].display', '')));
        setSpecialtyCode(get(existingRole, 'specialty[0].coding[0].code', ''));
        setSpecialtyDisplay(get(existingRole, 'specialty[0].text', get(existingRole, 'specialty[0].coding[0].display', '')));
        setPhone(get(existingRole, 'telecom', []).find(t => t.system === 'phone')?.value || '');
        setEmail(get(existingRole, 'telecom', []).find(t => t.system === 'email')?.value || '');
        setPeriodStart(get(existingRole, 'period.start', ''));
        setPeriodEnd(get(existingRole, 'period.end', ''));
        setAvailabilityExceptions(get(existingRole, 'availabilityExceptions', ''));

        setIsEditing(false);
      }
    } else if (id === 'new') {
      setIsEditing(true);
    }
  }, [id]);

  function handleSave() {
    setIsLoading(true);
    setError(null);

    // Build telecom array
    const telecom = [];
    if (phone) {
      telecom.push({ system: 'phone', value: phone, use: 'work' });
    }
    if (email) {
      telecom.push({ system: 'email', value: email, use: 'work' });
    }

    const dataToSave = {
      active: active,
      practitioner: {
        reference: practitionerReference,
        display: practitionerDisplay
      },
      organization: {
        reference: organizationReference,
        display: organizationDisplay
      },
      roleCode: roleCode,
      roleDisplay: roleDisplay,
      specialtyCode: specialtyCode,
      specialtyDisplay: specialtyDisplay,
      telecom: telecom,
      period: {
        start: periodStart,
        end: periodEnd
      },
      availabilityExceptions: availabilityExceptions
    };

    if (id && id !== 'new') {
      // Update existing
      Meteor.call('practitionerRoles.update', id, dataToSave, (error, result) => {
        setIsLoading(false);
        if (error) {
          console.error('Error updating practitioner role:', error);
          setError(error.message);
        } else {
          console.log('PractitionerRole updated successfully');
          setIsEditing(false);
          // Reload the updated record
          const updatedRole = PractitionerRoles.findOne({ _id: id });
          if (updatedRole) {
            setPractitionerRole(updatedRole);
          }
        }
      });
    } else {
      // Create new
      Meteor.call('practitionerRoles.create', dataToSave, (error, result) => {
        setIsLoading(false);
        if (error) {
          console.error('Error creating practitioner role:', error);
          setError(error.message);
        } else {
          console.log('PractitionerRole created successfully:', result);
          navigate('/practitioner-roles');
        }
      });
    }
  }

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this practitioner role?')) {
      setIsLoading(true);
      Meteor.call('practitionerRoles.remove', id, (error, result) => {
        setIsLoading(false);
        if (error) {
          console.error('Error deleting practitioner role:', error);
          setError(error.message);
        } else {
          console.log('PractitionerRole deleted successfully');
          navigate('/practitioner-roles');
        }
      });
    }
  }

  function handleCancel() {
    if (id === 'new') {
      navigate('/practitioner-roles');
    } else {
      // Reload original data
      const existingRole = PractitionerRoles.findOne({ _id: id });
      if (existingRole) {
        setActive(get(existingRole, 'active', true));
        setPractitionerDisplay(get(existingRole, 'practitioner.display', ''));
        setPractitionerReference(get(existingRole, 'practitioner.reference', ''));
        setOrganizationDisplay(get(existingRole, 'organization.display', ''));
        setOrganizationReference(get(existingRole, 'organization.reference', ''));
        setRoleCode(get(existingRole, 'code[0].coding[0].code', ''));
        setRoleDisplay(get(existingRole, 'code[0].text', get(existingRole, 'code[0].coding[0].display', '')));
        setSpecialtyCode(get(existingRole, 'specialty[0].coding[0].code', ''));
        setSpecialtyDisplay(get(existingRole, 'specialty[0].text', get(existingRole, 'specialty[0].coding[0].display', '')));
        setPhone(get(existingRole, 'telecom', []).find(t => t.system === 'phone')?.value || '');
        setEmail(get(existingRole, 'telecom', []).find(t => t.system === 'email')?.value || '');
        setPeriodStart(get(existingRole, 'period.start', ''));
        setPeriodEnd(get(existingRole, 'period.end', ''));
        setAvailabilityExceptions(get(existingRole, 'availabilityExceptions', ''));
      }
      setIsEditing(false);
      setError(null);
    }
  }

  function handleBack() {
    navigate('/practitioner-roles');
  }

  return (
    <Container id="practitionerRoleDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Practitioner Role Details' : 'New Practitioner Role'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {/* Show record ID as barcode when viewing existing */}
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Active Status */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    id="activeSwitch"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Active"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider>
                <Typography variant="subtitle2" color="textSecondary">
                  Practitioner & Organization
                </Typography>
              </Divider>
            </Grid>

            {/* Practitioner */}
            <Grid item xs={12} md={6}>
              <TextField
                id="practitionerDisplayInput"
                fullWidth
                label="Practitioner"
                value={practitionerDisplay}
                onChange={(e) => setPractitionerDisplay(e.target.value)}
                disabled={!isEditing}
                helperText="Display name of the practitioner"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="practitionerReferenceInput"
                fullWidth
                label="Practitioner Reference"
                value={practitionerReference}
                onChange={(e) => setPractitionerReference(e.target.value)}
                disabled={!isEditing}
                helperText="e.g., Practitioner/123"
              />
            </Grid>

            {/* Organization */}
            <Grid item xs={12} md={6}>
              <TextField
                id="organizationDisplayInput"
                fullWidth
                label="Organization"
                value={organizationDisplay}
                onChange={(e) => setOrganizationDisplay(e.target.value)}
                disabled={!isEditing}
                helperText="Display name of the organization"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="organizationReferenceInput"
                fullWidth
                label="Organization Reference"
                value={organizationReference}
                onChange={(e) => setOrganizationReference(e.target.value)}
                disabled={!isEditing}
                helperText="e.g., Organization/456"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider>
                <Typography variant="subtitle2" color="textSecondary">
                  Role & Specialty
                </Typography>
              </Divider>
            </Grid>

            {/* Role/Code */}
            <Grid item xs={12} md={6}>
              <TextField
                id="roleCodeInput"
                fullWidth
                label="Role Code"
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value)}
                disabled={!isEditing}
                helperText="e.g., doctor, nurse, pharmacist"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="roleDisplayInput"
                fullWidth
                label="Role Display"
                value={roleDisplay}
                onChange={(e) => setRoleDisplay(e.target.value)}
                disabled={!isEditing}
                helperText="Human-readable role name"
              />
            </Grid>

            {/* Specialty */}
            <Grid item xs={12} md={6}>
              <TextField
                id="specialtyCodeInput"
                fullWidth
                label="Specialty Code"
                value={specialtyCode}
                onChange={(e) => setSpecialtyCode(e.target.value)}
                disabled={!isEditing}
                helperText="e.g., 394814009 (General Practice)"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="specialtyDisplayInput"
                fullWidth
                label="Specialty Display"
                value={specialtyDisplay}
                onChange={(e) => setSpecialtyDisplay(e.target.value)}
                disabled={!isEditing}
                helperText="Human-readable specialty name"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider>
                <Typography variant="subtitle2" color="textSecondary">
                  Contact Information
                </Typography>
              </Divider>
            </Grid>

            {/* Phone */}
            <Grid item xs={12} md={6}>
              <TextField
                id="phoneInput"
                fullWidth
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} md={6}>
              <TextField
                id="emailInput"
                fullWidth
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider>
                <Typography variant="subtitle2" color="textSecondary">
                  Period
                </Typography>
              </Divider>
            </Grid>

            {/* Period Start */}
            <Grid item xs={12} md={6}>
              <TextField
                id="periodStartInput"
                fullWidth
                label="Period Start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Period End */}
            <Grid item xs={12} md={6}>
              <TextField
                id="periodEndInput"
                fullWidth
                label="Period End"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Availability Exceptions */}
            <Grid item xs={12}>
              <TextField
                id="availabilityExceptionsInput"
                fullWidth
                multiline
                rows={3}
                label="Availability Exceptions"
                value={availabilityExceptions}
                onChange={(e) => setAvailabilityExceptions(e.target.value)}
                disabled={!isEditing}
                helperText="Description of availability exceptions"
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Box>
            <Button
              id="backButton"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
            >
              Back
            </Button>
            {id && id !== 'new' && !isEditing && (
              <Button
                id="deleteButton"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                sx={{ ml: 1 }}
              >
                Delete
              </Button>
            )}
          </Box>
          <Box>
            {isEditing ? (
              <>
                <Button
                  id="cancelButton"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  id="savePractitionerRoleButton"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {id && id !== 'new' ? 'Update' : 'Save'}
                </Button>
              </>
            ) : (
              <Button
                id="editButton"
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </Box>
        </CardActions>
      </Card>
    </Container>
  );
}

export default PractitionerRoleDetail;
