// imports/ui-fhir/bodyStructures/BodyStructureDetail.jsx

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
  Grid,
  FormControlLabel,
  Checkbox,
  Typography,
  IconButton,
  InputAdornment,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set } from 'lodash';

import { BodyStructures } from '/imports/lib/schemas/SimpleSchemas/BodyStructures';

export function BodyStructureDetail(props) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bodyStructure, setBodyStructure] = useState({
    resourceType: 'BodyStructure',
    active: true,
    description: '',
    morphology: {},
    includedStructure: [],
    patient: {}
  });
  const [isEditing, setIsEditing] = useState(id === 'new' || !id);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe and load data
  const isSubscriptionReady = useTracker(function() {
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if (autoSubscribeEnabled) {
      handle = Meteor.subscribe('selectedPatient.BodyStructures', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('bodystructures.all');
    }
    return handle.ready();
  }, []);

  // Load body structure data
  useEffect(() => {
    if (id && id !== 'new') {
      // Try to load from collection first
      const existingBodyStructure = BodyStructures.findOne({_id: id});

      if (existingBodyStructure) {
        setBodyStructure(existingBodyStructure);
        setIsEditing(false);
      } else {
        // Fallback: try by id field
        const byId = BodyStructures.findOne({id: id});
        if (byId) {
          setBodyStructure(byId);
          setIsEditing(false);
        }
      }
    } else {
      // New body structure - set patient from Session
      const selectedPatient = Session.get('selectedPatient');
      if (selectedPatient) {
        setBodyStructure(prev => ({
          ...prev,
          patient: {
            reference: 'Patient/' + get(selectedPatient, 'id', selectedPatient._id),
            display: get(selectedPatient, 'name.0.text',
              get(selectedPatient, 'name.0.given.0', '') + ' ' + get(selectedPatient, 'name.0.family', ''))
          }
        }));
      }
      setIsEditing(true);
    }
  }, [id, isSubscriptionReady]);

  function handleChange(path, value) {
    setBodyStructure(prev => {
      const updated = { ...prev };
      set(updated, path, value);
      return updated;
    });
  }

  function handleSearchPatient() {
    console.log('Patient search clicked');
    // Could open a patient search dialog here
  }

  async function handleSave() {
    setIsLoading(true);

    try {
      const dataToSave = {
        active: get(bodyStructure, 'active', true),
        description: get(bodyStructure, 'description', ''),
        morphology: get(bodyStructure, 'morphology.text', ''),
        morphologyCode: get(bodyStructure, 'morphology.coding.0.code', ''),
        structure: get(bodyStructure, 'includedStructure.0.structure.text', ''),
        structureCode: get(bodyStructure, 'includedStructure.0.structure.coding.0.code', ''),
        patient: get(bodyStructure, 'patient', {}),
        patientDisplay: get(bodyStructure, 'patient.display', ''),
        image: get(bodyStructure, 'image', null)
      };

      if (id && id !== 'new') {
        await Meteor.callAsync('bodyStructures.update', id, dataToSave);
        console.log('Body structure updated:', id);
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('bodyStructures.insert', dataToSave);
        console.log('Body structure created:', newId);
        navigate('/body-structures');
      }
    } catch (error) {
      console.error('Error saving body structure:', error);
      alert('Error saving body structure: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this body structure?')) {
      Meteor.call('bodyStructures.remove', id, function(error) {
        if (error) {
          console.error('Error deleting body structure:', error);
          alert('Error deleting body structure: ' + error.message);
        } else {
          console.log('Body structure deleted:', id);
          navigate('/body-structures');
        }
      });
    }
  }

  function handleCancel() {
    if (id && id !== 'new') {
      // Reload from collection
      const existingBodyStructure = BodyStructures.findOne({_id: id});
      if (existingBodyStructure) {
        setBodyStructure(existingBodyStructure);
      }
      setIsEditing(false);
    } else {
      navigate('/body-structures');
    }
  }

  function handleBack() {
    navigate('/body-structures');
  }

  return (
    <Container id="bodyStructureDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Edit Body Structure' : 'New Body Structure'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {/* Barcode display for existing records */}
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Active Checkbox */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="activeCheckbox"
                    checked={get(bodyStructure, 'active', true)}
                    onChange={(e) => handleChange('active', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Active"
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                id="descriptionInput"
                fullWidth
                label="Description"
                value={get(bodyStructure, 'description', '')}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={!isEditing}
                multiline
                rows={2}
              />
            </Grid>

            {/* Morphology */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="morphologyInput"
                fullWidth
                label="Morphology"
                value={get(bodyStructure, 'morphology.text', get(bodyStructure, 'morphology.coding.0.display', ''))}
                onChange={(e) => handleChange('morphology', {
                  coding: [{
                    system: 'http://snomed.info/sct',
                    display: e.target.value
                  }],
                  text: e.target.value
                })}
                disabled={!isEditing}
                helperText="What type of structure (e.g., Normal anatomical structure)"
              />
            </Grid>

            {/* Structure */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="structureInput"
                fullWidth
                label="Body Structure Location"
                value={get(bodyStructure, 'includedStructure.0.structure.text',
                  get(bodyStructure, 'includedStructure.0.structure.coding.0.display', ''))}
                onChange={(e) => handleChange('includedStructure', [{
                  structure: {
                    coding: [{
                      system: 'http://snomed.info/sct',
                      display: e.target.value
                    }],
                    text: e.target.value
                  }
                }])}
                disabled={!isEditing}
                helperText="Where on the body (e.g., Left upper arm)"
              />
            </Grid>

            {/* Patient */}
            <Grid item xs={12}>
              <TextField
                id="patientDisplay"
                fullWidth
                label="Patient"
                value={get(bodyStructure, 'patient.display', '')}
                onChange={(e) => handleChange('patient.display', e.target.value)}
                disabled={!isEditing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Search for patient">
                        <IconButton
                          onClick={handleSearchPatient}
                          edge="end"
                          disabled={!isEditing}
                        >
                          <SearchIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Patient Reference (hidden but set) */}
            <Grid item xs={12}>
              <TextField
                id="patientReference"
                fullWidth
                label="Patient Reference"
                value={get(bodyStructure, 'patient.reference', '')}
                disabled
                size="small"
                sx={{ display: 'none' }}
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing ? (
            <>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button color="error" onClick={handleDelete}>
                Delete
              </Button>
              <Button variant="contained" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                id="saveBodyStructureButton"
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : (id && id !== 'new' ? 'Update' : 'Save')}
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default BodyStructureDetail;
