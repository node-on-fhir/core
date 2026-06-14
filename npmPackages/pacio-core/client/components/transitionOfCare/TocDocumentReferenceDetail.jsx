// packages/pacio-core/client/components/transitionOfCare/TocDocumentReferenceDetail.jsx
//
// Detail/create view for TOCDocumentReference resources.

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useNavigate, useParams } from 'react-router-dom';
import { get } from 'lodash';

import {
  Container,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

function TocDocumentReferenceDetail() {
  const navigate = useNavigate();
  const params = useParams();
  const isNew = params.id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [status, setStatus] = useState('current');
  const [description, setDescription] = useState('');
  const [compositionId, setCompositionId] = useState('');

  const patient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const patientId = useTracker(function() {
    return Session.get('selectedPatientId');
  }, []);

  // Load existing document reference
  useEffect(function() {
    if (isNew || !params.id) {
      setLoading(false);
      return;
    }

    // Fetch the DocumentReference from collection
    const DocumentReferences = Meteor.Collections && Meteor.Collections.DocumentReferences;
    if (DocumentReferences) {
      const docRef = DocumentReferences.findOne({ _id: params.id });
      if (docRef) {
        setStatus(get(docRef, 'status', 'current'));
        setDescription(get(docRef, 'description', ''));
        setCompositionId(get(docRef, 'context.related[0].reference', '').replace('Composition/', ''));
        setLoading(false);
      } else {
        setError('DocumentReference not found: ' + params.id);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [params.id, isNew]);

  if (!patient) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="warning">
          No patient selected. Please select a patient from the sidebar.
        </Alert>
      </Container>
    );
  }

  function handleSave() {
    setSaving(true);
    setError(null);

    if (isNew) {
      const data = {
        status: status,
        description: description,
        subject: {
          reference: 'Patient/' + patientId
        },
        compositionId: compositionId || undefined
      };

      Meteor.call('pacio.tocDocumentReference.create', data, function(err, result) {
        setSaving(false);
        if (err) {
          setError('Create failed: ' + (err.reason || err.message));
        } else {
          setSuccess(true);
          console.log('[TocDocumentReferenceDetail] Created:', result);
          navigate('/toc-document-reference/' + result);
        }
      });
    } else {
      const updates = {
        status: status,
        description: description
      };

      Meteor.call('pacio.tocDocumentReference.update', params.id, updates, function(err, result) {
        setSaving(false);
        if (err) {
          setError('Update failed: ' + (err.reason || err.message));
        } else {
          setSuccess(true);
          console.log('[TocDocumentReferenceDetail] Updated:', params.id);
        }
      });
    }
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={function() { navigate('/transition-of-care'); }}
        sx={{ mb: 2 }}
      >
        Back to Transition of Care
      </Button>

      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardHeader
          title={isNew ? 'Create TOC DocumentReference' : 'TOC DocumentReference'}
          subheader={'Profile: TOC-DocumentReference'}
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {isNew ? 'DocumentReference created successfully.' : 'DocumentReference updated successfully.'}
            </Alert>
          )}

          <TextField
            select
            fullWidth
            label="Status"
            value={status}
            onChange={function(e) { setStatus(e.target.value); }}
            sx={{ mb: 2 }}
          >
            <MenuItem value="current">Current</MenuItem>
            <MenuItem value="superseded">Superseded</MenuItem>
            <MenuItem value="entered-in-error">Entered in Error</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={function(e) { setDescription(e.target.value); }}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          {isNew && (
            <TextField
              fullWidth
              label="Linked Composition ID (optional)"
              value={compositionId}
              onChange={function(e) { setCompositionId(e.target.value); }}
              helperText="Enter the ID of the Composition this DocumentReference refers to"
              sx={{ mb: 2 }}
            />
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Type: Transfer Summary Note (LOINC 18761-7)
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Patient: {get(patient, 'name[0].text', get(patient, 'name[0].family', patientId))}
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
          >
            {isNew ? 'Create' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}

export default TocDocumentReferenceDetail;
