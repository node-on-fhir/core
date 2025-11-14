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
import { useSubscribe } from 'meteor/react-meteor-data';

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
  
  // Subscribe to document references
  const isSubscriptionReady = useTracker(function(){
    const handle = Meteor.subscribe('autopublish.DocumentReferences');
    return handle.ready();
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
        const patientId = get(selectedPatient, 'id', '') || get(selectedPatient, '_id', '');
        patientReference = `Patient/${patientId}`;
        console.log('DocumentReferenceDetail - Setting patient reference:', {
          patientName: patientName,
          patientId: patientId,
          patientReference: patientReference,
          selectedPatient: selectedPatient
        });
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
      console.log('DocumentReferenceDetail - loadDocumentReference called with:', {
        id: id,
        isNew: id === 'new',
        isSubscriptionReady: isSubscriptionReady
      });

      if (id && id !== 'new') {
        setLoading(true);
        try {
          console.log('DocumentReferenceDetail - Attempting to load document with _id:', id);

          // Load immediately if data exists - don't wait for subscription
          let result = DocumentReferences.findOne({_id: id});

          // Fallback: try finding by id field
          if (!result) {
            result = DocumentReferences.findOne({id: id});
          }

          if (result) {
            console.log('DocumentReferenceDetail - Loaded document:', result);
            console.log('DocumentReferenceDetail - Type structure:', {
              type: result.type,
              'type.coding': get(result, 'type.coding'),
              'type.coding[0]': get(result, 'type.coding[0]'),
              'type.coding[0].code': get(result, 'type.coding[0].code'),
              'type.coding[0].display': get(result, 'type.coding[0].display'),
              'type.text': get(result, 'type.text')
            });
            console.log('DocumentReferenceDetail - Content structure:', {
              content: result.content,
              'content[0]': get(result, 'content[0]'),
              'content[0].attachment': get(result, 'content[0].attachment'),
              'content[0].attachment.title': get(result, 'content[0].attachment.title')
            });
            
            // Ensure the data has the expected structure
            const documentToSet = {
              ...result,
              // Ensure type has the expected nested structure
              type: result.type || {
                coding: [{
                  system: "http://loinc.org",
                  code: "",
                  display: ""
                }],
                text: ""
              },
              // Ensure content has the expected nested structure
              content: result.content || [{
                attachment: {
                  contentType: "text/plain",
                  url: "",
                  title: ""
                }
              }]
            };
            
            setDocumentReference(documentToSet);
          } else {
            console.log('DocumentReferenceDetail - No document found with id:', id);
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
  }, [id]); // Only depend on id, not subscription status

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
        console.log('DocumentReferenceDetail - Updating document with ID:', id);
        await Meteor.callAsync('documentReferences.update', id, documentReference);
        console.log('Document reference updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new document reference
        console.log('DocumentReferenceDetail - Saving new document with data:', {
          subject: documentReference.subject,
          type: documentReference.type,
          description: documentReference.description,
          fullDocument: documentReference
        });
        const newId = await Meteor.callAsync('documentReferences.insert', documentReference);
        console.log('Document reference created with ID:', newId);
        // Navigate back to document references list for new document references
        navigate('/document-references');
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
        navigate('/document-references');
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
    navigate('/document-references');
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
    <Container id="documentReferenceDetailPage" maxWidth="md" sx={{ py: 4 }}>
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
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>
                {typeof id === 'object' && id._str ? id._str : String(id)}
              </span>
            </Box>
          )}
          
          <Stack spacing={3}>
            <TextField
              id="subjectDisplay"
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
              id="contentTitleInput"
              fullWidth
              label="Document Title"
              value={get(documentReference, 'content[0].attachment.title', '')}
              onChange={(e) => handleChange('content[0].attachment.title', e.target.value)}
              helperText="Title of the document"
              disabled={!isEditing}
            />
            
            <TextField
              id="descriptionInput"
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
                id="statusSelect"
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
              id="typeInput"
              fullWidth
              label="LOINC Code"
              value={get(documentReference, 'type.coding[0].code', '')}
              onChange={(e) => handleChange('type.coding[0].code', e.target.value)}
              helperText="LOINC code for document type"
              disabled={!isEditing}
            />
            
            <TextField
              id="typeDisplayInput"
              fullWidth
              label="Document Type"
              value={get(documentReference, 'type.coding[0].display', '')}
              onChange={(e) => {
                handleChange('type.coding[0].display', e.target.value);
                handleChange('type.text', e.target.value);
              }}
              helperText="Human-readable document type"
              disabled={!isEditing}
            />
            
            <TextField
              id="createdInput"
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
                id="contentTypeInput"
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
              id="contentUrlInput"
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
            
            <TextField
              id="contentSizeInput"
              fullWidth
              type="number"
              label="Document Size (bytes)"
              value={get(documentReference, 'content[0].attachment.size', '')}
              onChange={(e) => handleChange('content[0].attachment.size', parseInt(e.target.value))}
              helperText="Size of the document in bytes"
              disabled={!isEditing}
            />
            
            <TextField
              id="notesTextarea"
              fullWidth
              label="Notes"
              value={get(documentReference, 'content[0].attachment.data', '')}
              onChange={(e) => handleChange('content[0].attachment.data', e.target.value)}
              multiline
              rows={4}
              helperText="Additional notes or base64 encoded document content"
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/document-references')}
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
                        const result = await DocumentReferences.findOneAsync({_id: id});
                        if (result) {
                          // Ensure the data has the expected structure
                          const documentToSet = {
                            ...result,
                            type: result.type || {
                              coding: [{
                                system: "http://loinc.org",
                                code: "",
                                display: ""
                              }],
                              text: ""
                            },
                            content: result.content || [{
                              attachment: {
                                contentType: "text/plain",
                                url: "",
                                title: ""
                              }
                            }]
                          };
                          setDocumentReference(documentToSet);
                        }
                      } catch (err) {
                        console.error('Error reloading document reference:', err);
                      }
                    }
                    reloadDocumentReference();
                  } else {
                    // For new document references, go back
                    navigate('/document-references');
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