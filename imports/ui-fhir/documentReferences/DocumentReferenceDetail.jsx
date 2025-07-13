// /imports/ui-fhir/documentReferences/DocumentReferenceDetail.jsx

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
  Chip
} from '@mui/material';

import { get, set } from 'lodash';
import moment from 'moment';

import { DocumentReferences } from '/imports/lib/schemas/SimpleSchemas/DocumentReferences';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function DocumentReferenceDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);
  
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [documentReference, setDocumentReference] = useState({
    resourceType: "DocumentReference",
    status: "current",
    docStatus: "final",
    type: {
      coding: [{
        system: "http://loinc.org",
        code: "",
        display: ""
      }],
      text: ""
    },
    category: [{
      coding: [{
        system: "http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category",
        code: "clinical-note",
        display: "Clinical Note"
      }]
    }],
    subject: {
      reference: "",
      display: ""
    },
    date: moment().format('YYYY-MM-DDTHH:mm:ss'),
    author: [{
      reference: "",
      display: ""
    }],
    authenticator: {
      reference: "",
      display: ""
    },
    custodian: {
      reference: "",
      display: ""
    },
    relatesTo: [],
    description: "",
    securityLabel: [],
    content: [{
      attachment: {
        contentType: "text/plain",
        url: "",
        title: ""
      }
    }],
    context: {
      encounter: [{
        reference: "",
        display: ""
      }],
      event: [],
      period: {
        start: moment().format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD')
      },
      facilityType: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
          code: "",
          display: ""
        }]
      },
      practiceSetting: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }]
      }
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set patient name and author on component mount for new document references
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new document references
      setIsEditing(true);
      
      // For new document references, set the patient name
      let patientName = '';
      let patientReference = '';
      
      if (selectedPatient) {
        // Prefer selected patient
        patientName = get(selectedPatient, 'name[0].text', '') || 
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        patientReference = `Patient/${get(selectedPatient, '_id', '')}`;
      } else if (currentUser) {
        // Fall back to current user
        patientName = get(currentUser, 'profile.name.text', '') ||
                     `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                     get(currentUser, 'username', '');
        // You might need to look up the Patient resource for the current user
        patientReference = `Patient/${get(currentUser, 'profile.patientId', '')}`;
      }
      
      // Set author to current user
      let authorName = '';
      let authorReference = '';
      
      if (currentUser) {
        authorName = get(currentUser, 'profile.name.text', '') ||
                    `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                    get(currentUser, 'username', '');
        authorReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }
      
      setDocumentReference(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        author: [{
          reference: authorReference,
          display: authorName
        }]
      }));
    } else {
      // Viewing existing document reference - start in read-only mode
      setIsEditing(false);
    }
  }, [id, selectedPatient, currentUser]);

  // Load document reference if editing
  useEffect(function() {
    async function loadDocumentReference() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('documentReferences.get', id);
          if (result) {
            setDocumentReference(result);
          }
        } catch (err) {
          console.error('Error loading document reference:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadDocumentReference();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedDocumentReference = { ...documentReference };
    set(updatedDocumentReference, path, value);
    setDocumentReference(updatedDocumentReference);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing document reference
        await Meteor.callAsync('documentReferences.update', id, documentReference);
        console.log('Document reference updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new document reference
        const newId = await Meteor.callAsync('documentReferences.create', documentReference);
        console.log('Document reference created with ID:', newId);
        // Navigate back to document references list for new document references
        navigate('/documentReferences');
      }
    } catch (err) {
      console.error('Error saving document reference:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this document reference?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('documentReferences.remove', id);
        console.log('Document reference deleted successfully');
        navigate('/documentReferences');
      } catch (err) {
        console.error('Error deleting document reference:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/documentReferences');
  }

  const statusOptions = [
    { code: 'current', display: 'Current' },
    { code: 'superseded', display: 'Superseded' },
    { code: 'entered-in-error', display: 'Entered in Error' }
  ];

  const docStatusOptions = [
    { code: 'preliminary', display: 'Preliminary' },
    { code: 'final', display: 'Final' },
    { code: 'amended', display: 'Amended' },
    { code: 'entered-in-error', display: 'Entered in Error' }
  ];

  const categoryOptions = [
    { code: 'clinical-note', display: 'Clinical Note' },
    { code: 'consent', display: 'Consent' },
    { code: 'advance-directive', display: 'Advance Directive' },
    { code: 'imaging', display: 'Imaging' },
    { code: 'laboratory', display: 'Laboratory' },
    { code: 'procedure', display: 'Procedure' },
    { code: 'questionnaire', display: 'Questionnaire' },
    { code: 'therapy', display: 'Therapy' }
  ];

  const contentTypeOptions = [
    { code: 'text/plain', display: 'Plain Text' },
    { code: 'text/html', display: 'HTML' },
    { code: 'application/pdf', display: 'PDF' },
    { code: 'image/jpeg', display: 'JPEG Image' },
    { code: 'image/png', display: 'PNG Image' },
    { code: 'application/json', display: 'JSON' },
    { code: 'application/xml', display: 'XML' }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Document Reference' : 'New Document Reference'}
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
              fullWidth
              label="Patient Name"
              value={get(documentReference, 'subject.display', '')}
              helperText={get(documentReference, 'subject.reference', '') || 'Patient reference will be assigned'}
              disabled // Always disabled to prevent editing
            />
            
            <TextField
              fullWidth
              label="Author Name"
              value={get(documentReference, 'author[0].display', '')}
              onChange={(e) => handleChange('author[0].display', e.target.value)}
              helperText={get(documentReference, 'author[0].reference', '') || 'Author reference will be assigned'}
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              label="Document Title"
              value={get(documentReference, 'content[0].attachment.title', '')}
              onChange={(e) => handleChange('content[0].attachment.title', e.target.value)}
              helperText="Title of the document"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              label="Document Description"
              value={get(documentReference, 'description', '')}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={2}
              helperText="Brief description of the document"
              disabled={!isEditing}
            />
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Status</InputLabel>
              <Select
                value={get(documentReference, 'status', 'current')}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Document Status</InputLabel>
              <Select
                value={get(documentReference, 'docStatus', 'final')}
                onChange={(e) => handleChange('docStatus', e.target.value)}
                label="Document Status"
              >
                {docStatusOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Category</InputLabel>
              <Select
                value={get(documentReference, 'category[0].coding[0].code', 'clinical-note')}
                onChange={(e) => {
                  const option = categoryOptions.find(o => o.code === e.target.value);
                  handleChange('category[0].coding[0].code', option.code);
                  handleChange('category[0].coding[0].display', option.display);
                }}
                label="Category"
              >
                {categoryOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="LOINC Code"
              value={get(documentReference, 'type.coding[0].code', '')}
              onChange={(e) => handleChange('type.coding[0].code', e.target.value)}
              helperText="LOINC code for document type"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              label="Document Type"
              value={get(documentReference, 'type.coding[0].display', '')}
              onChange={(e) => handleChange('type.coding[0].display', e.target.value)}
              helperText="Human-readable document type"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              type="datetime-local"
              label="Document Date"
              value={moment(get(documentReference, 'date', '')).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => handleChange('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Content Type</InputLabel>
              <Select
                value={get(documentReference, 'content[0].attachment.contentType', 'text/plain')}
                onChange={(e) => handleChange('content[0].attachment.contentType', e.target.value)}
                label="Content Type"
              >
                {contentTypeOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Document URL"
              value={get(documentReference, 'content[0].attachment.url', '')}
              onChange={(e) => handleChange('content[0].attachment.url', e.target.value)}
              helperText="URL where the document can be accessed"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              label="Custodian Organization"
              value={get(documentReference, 'custodian.display', '')}
              onChange={(e) => handleChange('custodian.display', e.target.value)}
              helperText="Organization maintaining the document"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              type="date"
              label="Period Start"
              value={moment(get(documentReference, 'context.period.start', '')).format('YYYY-MM-DD')}
              onChange={(e) => handleChange('context.period.start', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              type="date"
              label="Period End"
              value={moment(get(documentReference, 'context.period.end', '')).format('YYYY-MM-DD')}
              onChange={(e) => handleChange('context.period.end', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/documentReferences')}
              >
                Back
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
                    // Reload the document reference to discard changes
                    async function reloadDocumentReference() {
                      try {
                        const result = await Meteor.callAsync('documentReferences.get', id);
                        if (result) {
                          setDocumentReference(result);
                        }
                      } catch (err) {
                        console.error('Error reloading document reference:', err);
                      }
                    }
                    reloadDocumentReference();
                  } else {
                    // For new document references, go back
                    navigate('/documentReferences');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              {id && id !== 'new' && (
                <Button 
                  onClick={handleDelete}
                  color="error"
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button 
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

export default DocumentReferenceDetail;