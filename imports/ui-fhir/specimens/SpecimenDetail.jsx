// /imports/ui-fhir/specimens/SpecimenDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Typography,
  Box,
  Alert,
  Dialog,
  TextField,
  MenuItem
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { get, set } from 'lodash';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

const log = (Meteor.Logger ? Meteor.Logger.for('SpecimenDetail') : console);

// Get the Specimens collection
let Specimens;
Meteor.startup(function () {
  Specimens = Meteor.Collections?.Specimens;
});

function SpecimenDetail(props) {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id || null;

  const isNewSpecimen = !id || id === 'new';
  const isExistingSpecimen = id && id !== 'new';

  // Get selected patient from session
  const selectedPatient = useTracker(function () {
    return Session.get('selectedPatient');
  }, []);

  const selectedPatientId = useTracker(function () {
    return Session.get('selectedPatientId');
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [specimen, setSpecimen] = useState({
    resourceType: "Specimen",
    status: "available",
    type: {
      text: ""
    },
    subject: {
      reference: "",
      display: ""
    },
    accessionIdentifier: {
      value: ""
    },
    receivedTime: "",
    collection: {
      collector: {
        reference: "",
        display: ""
      },
      collectedDateTime: "",
      method: {
        text: ""
      },
      bodySite: {
        text: ""
      },
      quantity: {
        value: "",
        unit: ""
      }
    },
    condition: [],
    note: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  // Set initial state on component mount
  useEffect(function () {
    if (isNewSpecimen) {
      setIsEditing(true);

      let patientName = '';
      let patientReference = '';

      if (selectedPatient || selectedPatientId) {
        if (selectedPatient) {
          if (typeof selectedPatient.name === 'string') {
            patientName = selectedPatient.name;
          } else if (selectedPatient.name && Array.isArray(selectedPatient.name)) {
            patientName = FhirUtilities.pluckName(selectedPatient);
          }
        }

        let fhirId = get(selectedPatient, 'id');
        if (!fhirId && selectedPatientId) {
          fhirId = selectedPatientId;
        }
        if (!fhirId && selectedPatient && selectedPatient._id) {
          fhirId = typeof selectedPatient._id === 'object' && selectedPatient._id._str
            ? selectedPatient._id._str
            : String(selectedPatient._id);
        }

        if (fhirId) {
          patientReference = `Patient/${fhirId}`;
        }
      }

      setSpecimen(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        }
      }));
    } else {
      setIsEditing(false);
    }
  }, [id, selectedPatient, selectedPatientId]);

  // Load specimen if editing existing
  useEffect(function () {
    async function loadSpecimen() {
      if (isExistingSpecimen) {
        setLoading(true);
        try {
          const result = await Meteor.rpc('specimens.get', { specimenId: id });
          if (result) {
            setSpecimen(result);
            setError(null);
          }
        } catch (err) {
          console.error('SpecimenDetail: Error loading specimen:', err);
          setError(err.error || err.message);
        } finally {
          setLoading(false);
        }
      }
    }

    loadSpecimen();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    setSpecimen(prevSpecimen => {
      const updated = JSON.parse(JSON.stringify(prevSpecimen));
      set(updated, path, value);
      return updated;
    });
  }

  // Handle patient search
  function handleSearchUser() {
    setPatientSearchOpen(true);
  }

  // Handle patient selection from search dialog
  function handlePatientSelect(patientId, patient) {
    try {
      if (patient) {
        let patientName = '';
        if (typeof patient.name === 'string') {
          patientName = patient.name;
        } else if (patient.name && Array.isArray(patient.name)) {
          patientName = FhirUtilities.pluckName(patient);
        } else {
          patientName = patient.id || patientId;
        }

        let fhirId = patient.id;
        if (!fhirId && patientId) {
          fhirId = patientId;
        }
        if (!fhirId && patient._id) {
          fhirId = typeof patient._id === 'object' && patient._id._str
            ? patient._id._str
            : String(patient._id);
        }

        setSpecimen(prev => {
          const updated = JSON.parse(JSON.stringify(prev));
          set(updated, 'subject.reference', `Patient/${fhirId}`);
          set(updated, 'subject.display', patientName);
          return updated;
        });

        setTimeout(() => {
          setPatientSearchOpen(false);
        }, 100);
        return;
      }
    } catch (error) {
      log.error('Error handling patient selection', { error });
      setError('Failed to select patient');
    }

    setPatientSearchOpen(false);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingSpecimen) {
        await Meteor.rpc('specimens.update', { specimenId: id, specimenData: specimen });
        console.log('Specimen updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.rpc('specimens.create', specimen);
        console.log('Specimen created with ID:', newId);
        navigate('/specimens');
      }
    } catch (err) {
      console.error('Error saving specimen:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (isNewSpecimen) return;

    if (window.confirm('Are you sure you want to delete this specimen?')) {
      setLoading(true);
      try {
        await Meteor.rpc('specimens.remove', { specimenId: id });
        console.log('Specimen deleted successfully');
        navigate('/specimens');
      } catch (err) {
        console.error('Error deleting specimen:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingSpecimen) {
      setIsEditing(false);
      setError(null);
      async function reloadSpecimen() {
        try {
          const result = await Meteor.rpc('specimens.get', { specimenId: id });
          if (result) {
            setSpecimen(result);
          }
        } catch (err) {
          console.error('Error reloading specimen:', err);
        }
      }
      reloadSpecimen();
    } else {
      navigate('/specimens');
    }
  }

  // Build header title
  let headerTitle = 'New Specimen';
  if (isExistingSpecimen) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {!isNewSpecimen && (
          <Button
            id="editButton"
            onClick={function () { setIsEditing(!isEditing); }}
            variant="outlined"
            size="small"
            startIcon={isEditing ? <LockOpenIcon /> : <LockIcon />}
          >
            {isEditing ? 'Editing' : 'Edit'}
          </Button>
        )}

        {!isNewSpecimen && (
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

  return (
    <Container id="specimenDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              id="status"
              select
              fullWidth
              label="Status"
              value={get(specimen, 'status', '')}
              onChange={(e) => handleChange('status', e.target.value)}
              disabled={!isEditing}
            >
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="unavailable">Unavailable</MenuItem>
              <MenuItem value="unsatisfactory">Unsatisfactory</MenuItem>
              <MenuItem value="entered-in-error">Entered in Error</MenuItem>
            </TextField>

            <TextField
              id="typeText"
              fullWidth
              label="Type"
              value={get(specimen, 'type.text', '')}
              onChange={(e) => handleChange('type.text', e.target.value)}
              disabled={!isEditing}
              helperText="e.g. Blood, Urine, Tissue, Saliva"
            />

            <TextField
              id="accessionIdentifier"
              fullWidth
              label="Accession Identifier"
              value={get(specimen, 'accessionIdentifier.value', '')}
              onChange={(e) => handleChange('accessionIdentifier.value', e.target.value)}
              disabled={!isEditing}
            />

            <TextField
              id="receivedTime"
              fullWidth
              type="datetime-local"
              label="Received Time"
              value={get(specimen, 'receivedTime', '')}
              onChange={(e) => handleChange('receivedTime', e.target.value)}
              disabled={!isEditing}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              id="patientDisplay"
              fullWidth
              label="Patient"
              value={get(specimen, 'subject.display', '')}
              onChange={(e) => handleChange('subject.display', e.target.value)}
              disabled={!isEditing}
              helperText={get(specimen, 'subject.reference', '')}
              onClick={isEditing ? handleSearchUser : undefined}
            />

            <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 500 }}>
              Collection Details
            </Typography>

            <TextField
              id="collectorDisplay"
              fullWidth
              label="Collector"
              value={get(specimen, 'collection.collector.display', '')}
              onChange={(e) => handleChange('collection.collector.display', e.target.value)}
              disabled={!isEditing}
            />

            <TextField
              id="collectedDateTime"
              fullWidth
              type="datetime-local"
              label="Collected Date/Time"
              value={get(specimen, 'collection.collectedDateTime', '')}
              onChange={(e) => handleChange('collection.collectedDateTime', e.target.value)}
              disabled={!isEditing}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              id="methodText"
              fullWidth
              label="Collection Method"
              value={get(specimen, 'collection.method.text', '')}
              onChange={(e) => handleChange('collection.method.text', e.target.value)}
              disabled={!isEditing}
              helperText="e.g. Venipuncture, Biopsy, Swab"
            />

            <TextField
              id="bodySiteText"
              fullWidth
              label="Body Site"
              value={get(specimen, 'collection.bodySite.text', '')}
              onChange={(e) => handleChange('collection.bodySite.text', e.target.value)}
              disabled={!isEditing}
              helperText="e.g. Left arm, Right ear"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                id="quantityValue"
                fullWidth
                type="number"
                label="Quantity"
                value={get(specimen, 'collection.quantity.value', '')}
                onChange={(e) => handleChange('collection.quantity.value', parseFloat(e.target.value) || '')}
                disabled={!isEditing}
              />
              <TextField
                id="quantityUnit"
                fullWidth
                label="Unit"
                value={get(specimen, 'collection.quantity.unit', '')}
                onChange={(e) => handleChange('collection.quantity.unit', e.target.value)}
                disabled={!isEditing}
                helperText="e.g. mL, g"
              />
            </Box>

            <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 500 }}>
              Additional Information
            </Typography>

            <TextField
              id="conditionText"
              fullWidth
              label="Condition"
              value={get(specimen, 'condition.0.text', '')}
              onChange={(e) => {
                setSpecimen(prev => {
                  const updated = JSON.parse(JSON.stringify(prev));
                  if (!updated.condition || !Array.isArray(updated.condition)) {
                    updated.condition = [{}];
                  }
                  if (!updated.condition[0]) {
                    updated.condition[0] = {};
                  }
                  updated.condition[0].text = e.target.value;
                  return updated;
                });
              }}
              disabled={!isEditing}
              helperText="e.g. Hemolyzed, Lipemic, Frozen"
            />

            <TextField
              id="noteText"
              fullWidth
              multiline
              rows={3}
              label="Note"
              value={get(specimen, 'note.0.text', '')}
              onChange={(e) => {
                setSpecimen(prev => {
                  const updated = JSON.parse(JSON.stringify(prev));
                  if (!updated.note || !Array.isArray(updated.note)) {
                    updated.note = [{}];
                  }
                  if (!updated.note[0]) {
                    updated.note[0] = {};
                  }
                  updated.note[0].text = e.target.value;
                  return updated;
                });
              }}
              disabled={!isEditing}
            />
          </Box>

          {isEditing && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button id="cancelButton" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                id="saveSpecimenButton"
                onClick={handleSave}
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Patient Search Dialog */}
      <Dialog
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <PatientSearchDialog
          onSelect={handlePatientSelect}
          defaultSearchTerm={get(specimen, 'subject.display', '')}
        />
      </Dialog>
    </Container>
  );
}

export default SpecimenDetail;
