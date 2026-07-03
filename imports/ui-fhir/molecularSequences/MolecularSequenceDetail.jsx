// /imports/ui-fhir/molecularSequences/MolecularSequenceDetail.jsx

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

const log = (Meteor.Logger ? Meteor.Logger.for('MolecularSequenceDetail') : console);

// Get the MolecularSequences collection
let MolecularSequences;
Meteor.startup(function () {
  MolecularSequences = Meteor.Collections?.MolecularSequences;
});

function MolecularSequenceDetail(props) {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id || null;

  const isNewMolecularSequence = !id || id === 'new';
  const isExistingMolecularSequence = id && id !== 'new';

  // Get selected patient from session
  const selectedPatient = useTracker(function () {
    return Session.get('selectedPatient');
  }, []);

  const selectedPatientId = useTracker(function () {
    return Session.get('selectedPatientId');
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [molecularSequence, setMolecularSequence] = useState({
    resourceType: "MolecularSequence",
    type: "",
    coordinateSystem: 0,
    observedSeq: "",
    readCoverage: 0,
    patient: {
      reference: "",
      display: ""
    },
    specimen: {
      reference: "",
      display: ""
    },
    device: {
      reference: "",
      display: ""
    },
    performer: {
      reference: "",
      display: ""
    },
    referenceSeq: {},
    variant: [],
    quality: [],
    repository: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  // Set initial state on component mount
  useEffect(function () {
    if (isNewMolecularSequence) {
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

      setMolecularSequence(prev => ({
        ...prev,
        patient: {
          reference: patientReference,
          display: patientName
        }
      }));
    } else {
      setIsEditing(false);
    }
  }, [id, selectedPatient, selectedPatientId]);

  // Load molecular sequence if editing existing
  useEffect(function () {
    async function loadMolecularSequence() {
      if (isExistingMolecularSequence) {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('molecularSequences.get', id);
          if (result) {
            setMolecularSequence(result);
            setError(null);
          }
        } catch (err) {
          console.error('MolecularSequenceDetail: Error loading molecular sequence:', err);
          setError(err.error || err.message);
        } finally {
          setLoading(false);
        }
      }
    }

    loadMolecularSequence();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    setMolecularSequence(prevMolecularSequence => {
      const updated = JSON.parse(JSON.stringify(prevMolecularSequence));
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

        setMolecularSequence(prev => {
          const updated = JSON.parse(JSON.stringify(prev));
          set(updated, 'patient.reference', `Patient/${fhirId}`);
          set(updated, 'patient.display', patientName);
          return updated;
        });

        setTimeout(() => {
          setPatientSearchOpen(false);
        }, 100);
        return;
      }
    } catch (error) {
      log.error('Error handling patient selection', { error: error.message });
      setError('Failed to select patient');
    }

    setPatientSearchOpen(false);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingMolecularSequence) {
        await Meteor.callAsync('molecularSequences.update', id, molecularSequence);
        console.log('MolecularSequence updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('molecularSequences.create', molecularSequence);
        console.log('MolecularSequence created with ID:', newId);
        navigate('/molecular-sequences');
      }
    } catch (err) {
      console.error('Error saving molecular sequence:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (isNewMolecularSequence) return;

    if (window.confirm('Are you sure you want to delete this molecular sequence?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('molecularSequences.remove', id);
        console.log('MolecularSequence deleted successfully');
        navigate('/molecular-sequences');
      } catch (err) {
        console.error('Error deleting molecular sequence:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingMolecularSequence) {
      setIsEditing(false);
      setError(null);
      async function reloadMolecularSequence() {
        try {
          const result = await Meteor.callAsync('molecularSequences.get', id);
          if (result) {
            setMolecularSequence(result);
          }
        } catch (err) {
          console.error('Error reloading molecular sequence:', err);
        }
      }
      reloadMolecularSequence();
    } else {
      navigate('/molecular-sequences');
    }
  }

  // Build header title
  let headerTitle = 'New Molecular Sequence';
  if (isExistingMolecularSequence) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {!isNewMolecularSequence && (
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

        {!isNewMolecularSequence && (
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
    <Container id="molecularSequenceDetailPage" maxWidth="md" sx={{ py: 4 }}>
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
              id="type"
              select
              fullWidth
              label="Type"
              value={get(molecularSequence, 'type', '')}
              onChange={(e) => handleChange('type', e.target.value)}
              disabled={!isEditing}
            >
              <MenuItem value="aa">Amino Acid (aa)</MenuItem>
              <MenuItem value="dna">DNA (dna)</MenuItem>
              <MenuItem value="rna">RNA (rna)</MenuItem>
            </TextField>

            <TextField
              id="coordinateSystem"
              select
              fullWidth
              label="Coordinate System"
              value={get(molecularSequence, 'coordinateSystem', 0)}
              onChange={(e) => handleChange('coordinateSystem', parseInt(e.target.value))}
              disabled={!isEditing}
            >
              <MenuItem value={0}>0-based</MenuItem>
              <MenuItem value={1}>1-based</MenuItem>
            </TextField>

            <TextField
              id="observedSeq"
              fullWidth
              multiline
              rows={3}
              label="Observed Sequence"
              value={get(molecularSequence, 'observedSeq', '')}
              onChange={(e) => handleChange('observedSeq', e.target.value)}
              disabled={!isEditing}
            />

            <TextField
              id="readCoverage"
              fullWidth
              type="number"
              label="Read Coverage"
              value={get(molecularSequence, 'readCoverage', '')}
              onChange={(e) => handleChange('readCoverage', parseInt(e.target.value) || 0)}
              disabled={!isEditing}
            />

            <TextField
              id="patientDisplay"
              fullWidth
              label="Patient"
              value={get(molecularSequence, 'patient.display', '')}
              onChange={(e) => handleChange('patient.display', e.target.value)}
              disabled={!isEditing}
              helperText={get(molecularSequence, 'patient.reference', '')}
              onClick={isEditing ? handleSearchUser : undefined}
            />

            <TextField
              id="specimenDisplay"
              fullWidth
              label="Specimen"
              value={get(molecularSequence, 'specimen.display', '') || get(molecularSequence, 'specimen.reference', '')}
              onChange={(e) => handleChange('specimen.reference', e.target.value)}
              disabled={!isEditing}
            />

            <TextField
              id="deviceDisplay"
              fullWidth
              label="Device"
              value={get(molecularSequence, 'device.display', '') || get(molecularSequence, 'device.reference', '')}
              onChange={(e) => handleChange('device.reference', e.target.value)}
              disabled={!isEditing}
            />

            <TextField
              id="performerDisplay"
              fullWidth
              label="Performer"
              value={get(molecularSequence, 'performer.display', '') || get(molecularSequence, 'performer.reference', '')}
              onChange={(e) => handleChange('performer.reference', e.target.value)}
              disabled={!isEditing}
            />
          </Box>

          {isEditing && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button id="cancelButton" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                id="saveMolecularSequenceButton"
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
          defaultSearchTerm={get(molecularSequence, 'patient.display', '')}
        />
      </Dialog>
    </Container>
  );
}

export default MolecularSequenceDetail;
