// /packages/pacio-core/client/pages/AdvanceDirectivesPage.jsx
import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useNavigate } from 'react-router-dom';

import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Typography, 
  Box,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Chip,
  Alert,
  AlertTitle,
  Avatar,
  Stack,
  Tabs,
  Tab
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PhoneIcon from '@mui/icons-material/Phone';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningIcon from '@mui/icons-material/Warning';

// Collections will be accessed through Meteor.Collections
import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Removed unused page imports - now using only DocumentReferences


const directiveTypes = [
  { code: '42348-3', display: 'Advance Directives', icon: <DescriptionIcon /> },
  { code: '64298-3', display: 'Power of Attorney', icon: <PersonIcon /> },
  { code: '92664-2', display: 'Healthcare Proxy', icon: <PersonIcon /> },
  { code: '71388-3', display: 'Living Will', icon: <DescriptionIcon /> },
  { code: '89051-3', display: 'DNR Order', icon: <LocalHospitalIcon /> },
  { code: '75790-5', display: 'Organ Donor Card', icon: <DescriptionIcon /> }
];

function AdvancedDirectivesPage(props) {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [openPdfViewer, setOpenPdfViewer] = useState(false);
  const [openPreferencesForm, setOpenPreferencesForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState('42348-3');
  const [uploading, setUploading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [preferences, setPreferences] = useState({
    codeStatus: 'full',
    comfortCare: false,
    artificialNutrition: true,
    artificialHydration: true,
    antibiotics: true,
    dialysis: true
  });
  
  const [quickReference, setQuickReference] = useState({
    primaryCarePhysician: {
      name: '',
      phone: ''
    },
    healthcareProxy: {
      name: '',
      relationship: ''
    },
    organDonor: {
      status: '',
      registeredWith: ''
    }
  });

  const checkAccess = (resource, action) => {
    console.log('Access control check:', { resource, action });
    return true;
  };

  const data = useTracker(() => {
    const patientId = Session.get('selectedPatientId');
    
    // Get collections from Meteor.Collections
    const DocumentReferences = get(Meteor, 'Collections.DocumentReferences');
    const Consents = get(Meteor, 'Collections.Consents');
    const RelatedPersons = get(Meteor, 'Collections.RelatedPersons');
    const Patients = get(Meteor, 'Collections.Patients');
    
    // Subscribe to DocumentReferences for the patient
    const subscription = patientId ? 
      Meteor.subscribe('pacio.documentReferences', patientId) : null;
    const subscriptionsReady = subscription ? subscription.ready() : true;
    
    let query = {};
    if(patientId){
      query = { 
        'subject.reference': { 
          $in: [`Patient/${patientId}`, `urn:uuid:${patientId}`] 
        } 
      };
    }

    // Initialize default return values
    let documentReferences = [];
    let allDocumentReferences = [];
    let consents = [];
    let relatedPersons = [];
    let patient = null;

    // Only query if collections are available
    if (DocumentReferences) {
      // First, let's get all document references for the patient
      allDocumentReferences = DocumentReferences.find(query).fetch();
      
      // Log what we found for debugging
      console.log('All DocumentReferences for patient:', allDocumentReferences);
      console.log('Document types found:', allDocumentReferences.map(d => get(d, 'type')));
      
      // Filter for advance directive types only
      const advanceDirectives = allDocumentReferences.filter(doc => {
        const typeCode = get(doc, 'type.coding[0].code');
        return directiveTypes.map(d => d.code).includes(typeCode);
      });
      
      // Keep all documents for the "All Documents" tab
      documentReferences = advanceDirectives;
      
      console.log(`Found ${allDocumentReferences.length} total documents, ${advanceDirectives.length} are advance directives`);
    }

    if (Consents) {
      consents = Consents.find(query).fetch();
    }
    
    if (RelatedPersons) {
      relatedPersons = RelatedPersons.find({ patient: query['subject.reference'] }).fetch();
    }
    
    if (Patients && patientId) {
      patient = Patients.findOne(patientId);
    }

    return {
      documentReferences,
      allDocumentReferences,
      consents,
      relatedPersons,
      patient,
      patientId,
      loading: !subscriptionsReady
    };
  }, []);

  const handleUpload = () => {
    if(checkAccess('DocumentReference', 'create')){
      setOpenDialog(true);
    }
  };

  const handleViewDocument = (doc) => {
    if(checkAccess('DocumentReference', 'read')){
      setSelectedDocument(doc);
      setOpenPdfViewer(true);
    }
  };

  const handleShare = (doc) => {
    if(checkAccess('DocumentReference', 'share')){
      console.log('Sharing document:', doc);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      console.log('File selected:', file.name, file.type, file.size);
    }
  };

  const handleDocumentTypeChange = (event) => {
    setSelectedDocumentType(event.target.value);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    if (!checkAccess('DocumentReference', 'create')) {
      alert('You do not have permission to upload documents');
      return;
    }

    setUploading(true);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        
        // Find the document type details
        const docType = directiveTypes.find(t => t.code === selectedDocumentType);
        
        // Create DocumentReference resource
        const documentReference = {
          resourceType: 'DocumentReference',
          status: 'current',
          type: {
            coding: [{
              system: 'http://loinc.org',
              code: selectedDocumentType,
              display: docType?.display || 'Advanced Directive'
            }],
            text: docType?.display || 'Advanced Directive'
          },
          subject: {
            reference: data.patientId ? `Patient/${data.patientId}` : undefined
          },
          date: new Date().toISOString(),
          content: [{
            attachment: {
              contentType: selectedFile.type,
              data: base64data,
              title: selectedFile.name,
              creation: new Date().toISOString()
            }
          }]
        };

        // Call Meteor method to save the document
        Meteor.call('documentReferences.insert', documentReference, (error, result) => {
          setUploading(false);
          if (error) {
            console.error('Error uploading document:', error);
            alert('Error uploading document: ' + error.message);
          } else {
            console.log('Document uploaded successfully:', result);
            setOpenDialog(false);
            setSelectedFile(null);
            setSelectedDocumentType('42348-3');
          }
        });
      };
      
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      setUploading(false);
      console.error('Error processing file:', error);
      alert('Error processing file: ' + error.message);
    }
  };

  const handleCancelUpload = () => {
    setOpenDialog(false);
    setSelectedFile(null);
    setSelectedDocumentType('42348-3');
  };

  const getDocumentIcon = (docType) => {
    const type = directiveTypes.find(t => t.code === get(docType, 'coding[0].code'));
    return type ? type.icon : <DescriptionIcon />;
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const EmergencyContacts = () => (
    <Card variant="outlined">
      <CardHeader 
        avatar={<PhoneIcon color="primary" />}
        title="Emergency Contacts"
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent>
        <List dense>
          {data.relatedPersons.map((person) => (
            <ListItem key={person._id}>
              <ListItemIcon>
                <Avatar>{get(person, 'name[0].given[0]', '?')[0]}</Avatar>
              </ListItemIcon>
              <ListItemText
                primary={`${get(person, 'name[0].given[0]', '')} ${get(person, 'name[0].family', '')}`}
                secondary={
                  <>
                    {get(person, 'relationship[0].text', 'Contact')}
                    {get(person, 'telecom[0].value') && ` • ${get(person, 'telecom[0].value')}`}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
        <Button 
          startIcon={<AddIcon />} 
          size="small"
          color="primary" 
          sx={{ mt: 1 }}
        >
          Add Emergency Contact
        </Button>
      </CardContent>
    </Card>
  );

  const PreferencesForm = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>Care Preferences</Typography>
      
      <FormControl component="fieldset" sx={{ mt: 2 }}>
        <FormLabel component="legend">Code Status</FormLabel>
        <RadioGroup
          value={preferences.codeStatus}
          onChange={(e) => setPreferences({...preferences, codeStatus: e.target.value})}
        >
          <FormControlLabel value="full" control={<Radio />} label="Full Code" />
          <FormControlLabel value="dnr" control={<Radio />} label="Do Not Resuscitate (DNR)" />
          <FormControlLabel value="limited" control={<Radio />} label="Limited Interventions" />
        </RadioGroup>
      </FormControl>

      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Treatment Preferences</Typography>
      <Box component="fieldset" sx={{ border: 'none', p: 0, m: 0 }}>
        <FormControlLabel
          control={
            <Checkbox 
              checked={preferences.comfortCare}
              onChange={(e) => setPreferences({...preferences, comfortCare: e.target.checked})}
            />
          }
          label="Comfort Care Only"
        />
        <FormControlLabel
          control={
            <Checkbox 
              checked={preferences.artificialNutrition}
              onChange={(e) => setPreferences({...preferences, artificialNutrition: e.target.checked})}
            />
          }
          label="Artificial Nutrition"
        />
        <FormControlLabel
          control={
            <Checkbox 
              checked={preferences.artificialHydration}
              onChange={(e) => setPreferences({...preferences, artificialHydration: e.target.checked})}
            />
          }
          label="Artificial Hydration"
        />
        <FormControlLabel
          control={
            <Checkbox 
              checked={preferences.antibiotics}
              onChange={(e) => setPreferences({...preferences, antibiotics: e.target.checked})}
            />
          }
          label="Antibiotics"
        />
        <FormControlLabel
          control={
            <Checkbox 
              checked={preferences.dialysis}
              onChange={(e) => setPreferences({...preferences, dialysis: e.target.checked})}
            />
          }
          label="Dialysis"
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" sx={{ mr: 1 }}>
          Save Preferences
        </Button>
        <Button variant="outlined" onClick={() => setOpenPreferencesForm(false)}>
          Cancel
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      bgcolor: theme => theme.palette.mode === 'light' 
        ? theme.palette.grey[50] 
        : theme.palette.background.default,
      minHeight: '100vh'
    }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 3 }}>
        <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link 
            color="inherit" 
            href="/" 
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <DescriptionIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Advance Healthcare Directives
          </Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="document tabs">
          <Tab label="Advance Directives" />
          <Tab label="All Documents" />
        </Tabs>
      </Box>

      {/* Tab Panel 0: Documents & Preferences */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader
                title={data.patient ? `Advance Directives - ${FhirUtilities.pluckName(data.patient)}` : "Advance Directives"}
                subheader="Legal documents that specify your healthcare wishes"
              action={
                <Box>
                  <Button
                    variant="contained"
                    startIcon={<UploadFileIcon />}
                    onClick={handleUpload}
                    sx={{ mr: 1 }}
                  >
                    Upload Document
                  </Button>
                  <IconButton onClick={() => window.print()}>
                    <PrintIcon />
                  </IconButton>
                </Box>
              }
            />
            <CardContent>
              {data.loading ? (
                <Typography>Loading documents...</Typography>
              ) : data.documentReferences.length === 0 ? (
                <Alert severity="info">
                  <AlertTitle>No Advance Directives Found</AlertTitle>
                  {data.allDocumentReferences.length > 0 ? (
                    <>
                      Found {data.allDocumentReferences.length} document(s) but none are advance directive types.
                      <br />
                      Check the "All Documents" tab to view other clinical documents.
                    </>
                  ) : (
                    'Consider uploading your advance healthcare directives, living will, or healthcare proxy documents.'
                  )}
                </Alert>
              ) : (
                <List>
                  {data.documentReferences.map((doc) => (
                    <React.Fragment key={doc._id}>
                      <ListItem>
                        <ListItemIcon>
                          {getDocumentIcon(get(doc, 'type'))}
                        </ListItemIcon>
                        <ListItemText
                          primary={get(doc, 'type.text', get(doc, 'type.coding[0].display', 'Document'))}
                          secondary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" color="text.secondary">
                                {moment(get(doc, 'date')).format('MMMM DD, YYYY')}
                              </Typography>
                              {get(doc, 'status') === 'current' ? (
                                <Chip icon={<VerifiedIcon />} label="Current" size="small" color="success" />
                              ) : (
                                <Chip icon={<WarningIcon />} label="Review Needed" size="small" color="warning" />
                              )}
                            </Stack>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton onClick={() => handleViewDocument(doc)}>
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton onClick={() => handleShare(doc)}>
                            <ShareIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}

              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Care Preferences Summary
                </Typography>
                {!openPreferencesForm ? (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" paragraph>
                      Document your specific care preferences including code status, 
                      comfort care, and treatment options.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => setOpenPreferencesForm(true)}
                    >
                      Edit Care Preferences
                    </Button>
                  </Paper>
                ) : (
                  <PreferencesForm />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <EmergencyContacts />
            
            <Card variant="outlined">
              <CardHeader 
                title="Quick Reference"
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Primary Care Physician"
                      secondary={
                        quickReference.primaryCarePhysician.name ? 
                          `${quickReference.primaryCarePhysician.name}${quickReference.primaryCarePhysician.phone ? ` • ${quickReference.primaryCarePhysician.phone}` : ''}` :
                          'Not specified'
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Healthcare Proxy"
                      secondary={
                        quickReference.healthcareProxy.name || 
                        (data.relatedPersons.length > 0 ? 
                          `${get(data.relatedPersons[0], 'name[0].given[0]', '')} ${get(data.relatedPersons[0], 'name[0].family', '')}` :
                          'Not designated')
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Organ Donor"
                      secondary={
                        quickReference.organDonor.status ? 
                          `${quickReference.organDonor.status}${quickReference.organDonor.registeredWith ? ` - ${quickReference.organDonor.registeredWith}` : ''}` :
                          'Not specified'
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardHeader 
                title="Resources"
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Stack spacing={1}>
                  <Link href="#" underline="hover">
                    Understanding Advance Healthcare Directives
                  </Link>
                  <Link href="#" underline="hover">
                    State-Specific Forms
                  </Link>
                  <Link href="#" underline="hover">
                    POLST Information
                  </Link>
                  <Link href="#" underline="hover">
                    Five Wishes Document
                  </Link>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
      )}

      {/* Tab Panel 1: All Documents */}
      {tabValue === 1 && (
        <Box sx={{ mt: 2 }}>
          <Card>
            <CardHeader
              title="All Clinical Documents"
              subheader="All medical documents including clinical notes, discharge summaries, and advance directives"
            />
            <CardContent>
              {data.loading ? (
                <Typography>Loading documents...</Typography>
              ) : data.allDocumentReferences.length === 0 ? (
                <Alert severity="info">
                  <AlertTitle>No Documents Found</AlertTitle>
                  No clinical documents are available for this patient.
                </Alert>
              ) : (
                <List>
                  {data.allDocumentReferences.map((doc) => (
                    <React.Fragment key={doc._id}>
                      <ListItem>
                        <ListItemIcon>
                          <DescriptionIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={get(doc, 'type.text', get(doc, 'type.coding[0].display', 'Clinical Document'))}
                          secondary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" color="text.secondary">
                                {moment(get(doc, 'date')).format('MMMM DD, YYYY')}
                              </Typography>
                              {get(doc, 'description') && (
                                <Typography variant="body2" color="text.secondary">
                                  • {get(doc, 'description')}
                                </Typography>
                              )}
                              {get(doc, 'status') === 'current' ? (
                                <Chip icon={<VerifiedIcon />} label="Current" size="small" color="success" />
                              ) : (
                                <Chip label={get(doc, 'status', 'Unknown')} size="small" />
                              )}
                            </Stack>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton onClick={() => handleViewDocument(doc)} title="View Document">
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton onClick={() => handleShare(doc)} title="Share Document">
                            <ShareIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      <Dialog 
        open={openPdfViewer} 
        onClose={() => setOpenPdfViewer(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedDocument && get(selectedDocument, 'type.text', 'Document Viewer')}
          <IconButton
            onClick={() => setOpenPdfViewer(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            ×
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: '70vh', overflow: 'auto', backgroundColor: '#f5f5f5', p: 2 }}>
            {selectedDocument && (() => {
              const attachmentData = get(selectedDocument, 'content[0].attachment.data');
              const contentType = get(selectedDocument, 'content[0].attachment.contentType', '');
              const title = get(selectedDocument, 'content[0].attachment.title', 'Document');
              
              if (!attachmentData) {
                return (
                  <Alert severity="error">
                    No document data available to display
                  </Alert>
                );
              }
              
              // Decode base64 data
              const dataUrl = `data:${contentType};base64,${attachmentData}`;
              
              // Check if it's an image
              if (contentType.startsWith('image/')) {
                return (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <img 
                      src={dataUrl} 
                      alt={title}
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%', 
                        objectFit: 'contain' 
                      }}
                    />
                  </Box>
                );
              }
              
              // Check if it's a PDF
              if (contentType === 'application/pdf') {
                return (
                  <Box sx={{ width: '100%', height: '100%' }}>
                    <iframe
                      src={dataUrl}
                      title={title}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none'
                      }}
                    />
                  </Box>
                );
              }
              
              // Unsupported file type
              return (
                <Alert severity="warning">
                  <AlertTitle>Unsupported File Type</AlertTitle>
                  This document type ({contentType}) cannot be displayed in the viewer.
                  <br />
                  <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ mt: 2 }}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = dataUrl;
                      link.download = title;
                      link.click();
                    }}
                  >
                    Download Document
                  </Button>
                </Alert>
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            variant="outlined"
            onClick={() => {
              if (selectedDocument) {
                const attachmentData = get(selectedDocument, 'content[0].attachment.data');
                const contentType = get(selectedDocument, 'content[0].attachment.contentType', '');
                const title = get(selectedDocument, 'content[0].attachment.title', 'Document');
                
                if (attachmentData) {
                  const dataUrl = `data:${contentType};base64,${attachmentData}`;
                  const link = document.createElement('a');
                  link.href = dataUrl;
                  link.download = title;
                  link.click();
                }
              }
            }}
          >
            Download
          </Button>
          <Button onClick={() => setOpenPdfViewer(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDialog} onClose={handleCancelUpload}>
        <DialogTitle>Upload Advanced Directive Document</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                select
                label="Document Type"
                value={selectedDocumentType}
                onChange={handleDocumentTypeChange}
                SelectProps={{ native: true }}
              >
                {directiveTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.display}
                  </option>
                ))}
              </TextField>
            </FormControl>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ 
                height: 100, 
                borderStyle: 'dashed',
                backgroundColor: selectedFile ? '#e8f5e9' : 'transparent'
              }}
            >
              {selectedFile ? selectedFile.name : 'Click to upload PDF or image'}
              <input 
                type="file" 
                hidden 
                accept=".pdf,.png,.jpg,.jpeg" 
                onChange={handleFileSelect}
              />
            </Button>
            {selectedFile && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelUpload} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUploadSubmit} 
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
}

export default AdvancedDirectivesPage;