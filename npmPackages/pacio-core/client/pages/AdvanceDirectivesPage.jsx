// /packages/pacio-core/client/pages/AdvanceDirectivesPage.jsx
import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Roles } from 'meteor/alanning:roles';
import { useNavigate } from 'react-router-dom';

import { isAdiDocument } from '../../lib/constants/AdiConstants';

import WorkflowNavigation from '/imports/lib/WorkflowNavigation.js';
const { paramPathFromSearch } = WorkflowNavigation;

import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
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
  Tab,
  Snackbar
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
import DeleteIcon from '@mui/icons-material/Delete';

const log = (Meteor.Logger ? Meteor.Logger.for('AdvanceDirectivesPage') : console);

// Collections and utilities will be accessed through Meteor global
// Packages cannot directly import from /imports/ with Meteor 3 + RSPack

// Removed unused page imports - now using only DocumentReferences


// Round-trip snapshot of the care-preferences form, stored on the directive Consent
const ADI_PREFERENCES_EXTENSION_URL = 'http://honeycomb.fhir/advance-directive-preferences';

// Human-readable labels for the care-preferences summary
const codeStatusLabels = {
  full: 'Full Code',
  dnr: 'Do Not Resuscitate (DNR)',
  limited: 'Limited Interventions'
};

const treatmentPreferenceFields = [
  { key: 'comfortCare', label: 'Comfort Care Only' },
  { key: 'artificialNutrition', label: 'Artificial Nutrition' },
  { key: 'artificialHydration', label: 'Artificial Hydration' },
  { key: 'antibiotics', label: 'Antibiotics' },
  { key: 'dialysis', label: 'Dialysis' }
];

// LOINC document-type codes verified against loinc.org (2026-07-13).
// Displays are the LOINC long common names. Keep in sync with
// AdvanceDirectiveUtils.DirectiveTypes (the ADI matcher's source of truth).
const directiveTypes = [
  { code: '42348-3', display: 'Advance Healthcare Directives', icon: <DescriptionIcon /> },
  { code: '75320-2', display: 'Advance Directive', icon: <DescriptionIcon /> },
  { code: '81334-5', display: 'Personal Advance Care Plan', icon: <DescriptionIcon /> },
  { code: '64298-3', display: 'Power of Attorney', icon: <PersonIcon /> },
  { code: '92664-2', display: 'Power of Attorney and Living Will', icon: <PersonIcon /> },
  { code: '93037-0', display: 'Portable Medical Order (POLST/MOLST)', icon: <LocalHospitalIcon /> },
  { code: '81351-9', display: 'DNR Order (Reported)', icon: <LocalHospitalIcon /> }
];

function AdvancedDirectivesPage(props) {
  // Access FhirUtilities from Meteor global object
  const FhirUtilities = Meteor.FhirUtilities || {};

  const navigate = useNavigate();

  // Home breadcrumb: client-side navigation (preserves Session patient context)
  // to the threaded ?home= workflow callback, else the deployment default route.
  function handleBreadcrumbHome(event) {
    event.preventDefault();
    const settingsRoute = get(Meteor, 'settings.public.defaults.route');
    const homePath = paramPathFromSearch(window.location.search, 'home')
      || ((typeof settingsRoute === 'string' && settingsRoute.length && settingsRoute !== '/') ? settingsRoute : '/');
    navigate(homePath);
  }

  // Get Honeycomb theme for dark mode support
  const useAppTheme = Meteor.useTheme;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors for cards and papers
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';

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

  // Emergency contact dialog
  const [openContactForm, setOpenContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    given: '',
    family: '',
    relationship: '',
    phone: ''
  });
  const [savingContact, setSavingContact] = useState(false);

  // Save Preferences (Advance Directive Consent)
  const [savingPreferences, setSavingPreferences] = useState(false);

  // DNR quick-order (clinician workflow only). A patient in the PHR workflow
  // records a *preference*; a clinician can follow up with the actual
  // code-status order (ServiceRequest, ICD-10-CM Z66) — CMS1317 numerator Path 3.
  const [openDnrOrderPrompt, setOpenDnrOrderPrompt] = useState(false);
  const [creatingDnrOrder, setCreatingDnrOrder] = useState(false);

  const dnrOrderRoles = get(Meteor, 'settings.public.pacio.dnrOrderRoles', ['practitioner', 'admin']);
  const isClinicianUser = useTracker(function() {
    const userId = Meteor.userId();
    if (!userId || !Roles || typeof Roles.userIsInRole !== 'function') {
      return false;
    }
    return Roles.userIsInRole(userId, dnrOrderRoles);
  }, []);

  // Shared user feedback
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  
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
    
    // Subscribe to DocumentReferences, RelatedPersons and Consents for the patient
    const docSub = patientId ?
      Meteor.subscribe('pacio.documentReferences', patientId) : null;
    const contactsSub = patientId ?
      Meteor.subscribe('pacio.relatedPersons', patientId) : null;
    const consentsSub = patientId ?
      Meteor.subscribe('pacio.consents', patientId) : null;
    const subscriptionsReady = (docSub ? docSub.ready() : true) &&
      (contactsSub ? contactsSub.ready() : true) &&
      (consentsSub ? consentsSub.ready() : true);

    let query = {};
    if(patientId){
      query = {
        'subject.reference': {
          $in: [`Patient/${patientId}`, `urn:uuid:${patientId}`]
        }
      };
    }

    // RelatedPerson / Consent reference the patient via patient.reference (not subject.reference)
    const patientRefQuery = patientId ? {
      'patient.reference': { $in: [`Patient/${patientId}`, `urn:uuid:${patientId}`] }
    } : {};

    // Initialize default return values
    let documentReferences = [];
    let allDocumentReferences = [];
    let directiveDocRef = null;
    let consents = [];
    let directiveConsent = null;
    let relatedPersons = [];
    let patient = null;

    // Only query if collections are available
    if (DocumentReferences) {
      // First, let's get all document references for the patient
      allDocumentReferences = DocumentReferences.find(query).fetch();
      
      // Log what we found for debugging
      log.phi('All DocumentReferences for patient', { allDocumentReferences }, { action: 'read' });
      console.log('Document types found:', allDocumentReferences.map(d => get(d, 'type')));
      
      // Filter for advance directive documents using the shared ADI matcher
      // (stamped profile or directive type code, including legacy codes)
      const advanceDirectives = allDocumentReferences.filter(isAdiDocument);
      
      // Keep all documents for the "All Documents" tab
      documentReferences = advanceDirectives;

      // The DocumentReference generated by Save Preferences (marked via identifier)
      directiveDocRef = allDocumentReferences.find(function(d) {
        return get(d, 'identifier', []).some(function(ident) {
          return get(ident, 'system') === ADI_PREFERENCES_EXTENSION_URL;
        });
      }) || null;

      console.log(`Found ${allDocumentReferences.length} total documents, ${advanceDirectives.length} are advance directives`);
    }

    if (Consents) {
      consents = Consents.find(patientRefQuery).fetch();
      // The advance-directive Consent carries the care preferences + agent refs
      directiveConsent = consents.find(function(c) {
        return get(c, 'category', []).some(function(cat) {
          return get(cat, 'coding', []).some(function(coding) {
            return get(coding, 'code') === 'acd';
          });
        });
      }) || null;
    }

    if (RelatedPersons) {
      relatedPersons = RelatedPersons.find(patientRefQuery).fetch();
    }

    if (Patients && patientId) {
      patient = Patients.findOne(patientId);
    }

    return {
      documentReferences,
      allDocumentReferences,
      directiveDocRef,
      consents,
      directiveConsent,
      relatedPersons,
      patient,
      patientId,
      loading: !subscriptionsReady
    };
  }, []);

  // Hydrate the preferences form from the saved advance-directive Consent
  useEffect(function() {
    const snapshot = get(data, 'directiveConsent.extension', []).find(function(ext) {
      return get(ext, 'url') === ADI_PREFERENCES_EXTENSION_URL;
    });
    if (snapshot && get(snapshot, 'valueString')) {
      try {
        setPreferences(function(prev) {
          return { ...prev, ...JSON.parse(snapshot.valueString) };
        });
      } catch (e) {
        console.warn('[AdvanceDirectives] Could not parse saved preferences snapshot:', e);
      }
    }
  }, [get(data, 'directiveConsent._id')]);

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

  // Attribution line for a document — prefer author, then custodian, then subject
  const documentAttribution = (doc) => {
    const author = get(doc, 'author[0].display') || get(doc, 'author[0].reference');
    if (author) return `Author: ${author}`;
    const custodian = get(doc, 'custodian.display') || get(doc, 'custodian.reference');
    if (custodian) return `Custodian: ${custodian}`;
    const subject = get(doc, 'subject.display') || get(doc, 'subject.reference');
    if (subject) return `Subject: ${subject}`;
    return '';
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const patientReference = () => (
    data.patientId ? { reference: `Patient/${data.patientId}`, display: data.patient ? FhirUtilities.pluckName(data.patient) : undefined } : undefined
  );

  // ---- Add Emergency Contact (RelatedPerson) ----
  const handleOpenContactForm = () => {
    setContactForm({ given: '', family: '', relationship: '', phone: '' });
    setOpenContactForm(true);
  };

  const handleAddContact = async () => {
    if (!data.patientId) {
      setSnackbar({ open: true, message: 'Select a patient before adding a contact' });
      return;
    }
    if (!contactForm.given && !contactForm.family) {
      setSnackbar({ open: true, message: 'Please enter a name for the contact' });
      return;
    }

    const fullName = `${contactForm.given} ${contactForm.family}`.trim();
    const relatedPerson = {
      resourceType: 'RelatedPerson',
      patient: { reference: `Patient/${data.patientId}`, display: data.patient ? FhirUtilities.pluckName(data.patient) : undefined },
      name: [{ use: 'official', given: contactForm.given ? [contactForm.given] : [], family: contactForm.family, text: fullName }],
      relationship: contactForm.relationship ? [{ text: contactForm.relationship }] : [],
      telecom: contactForm.phone ? [{ system: 'phone', value: contactForm.phone, use: 'mobile' }] : []
    };

    setSavingContact(true);
    try {
      await Meteor.callAsync('relatedPersons.insert', relatedPerson);
      setOpenContactForm(false);
      setSnackbar({ open: true, message: 'Emergency contact added' });
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      setSnackbar({ open: true, message: 'Error adding contact: ' + (error.reason || error.message) });
    } finally {
      setSavingContact(false);
    }
  };

  const handleRemoveContact = async (relatedPersonId) => {
    try {
      await Meteor.callAsync('relatedPersons.remove', relatedPersonId);
      setSnackbar({ open: true, message: 'Emergency contact removed' });
    } catch (error) {
      console.error('Error removing emergency contact:', error);
      setSnackbar({ open: true, message: 'Error removing contact: ' + (error.reason || error.message) });
    }
  };

  // ---- Save Preferences (Advance Directive Consent) ----
  const buildDirectiveConsent = () => {
    // Encode treatment preferences as provision codes (interoperable) and keep a
    // JSON snapshot in an extension so the form round-trips cleanly on reload.
    const prefCodes = [
      { text: `Resuscitation Go-Ahead: ${preferences.codeStatus}` },
      { text: `Comfort Care Only: ${preferences.comfortCare ? 'yes' : 'no'}` },
      { text: `Artificial Nutrition: ${preferences.artificialNutrition ? 'yes' : 'no'}` },
      { text: `Artificial Hydration: ${preferences.artificialHydration ? 'yes' : 'no'}` },
      { text: `Antibiotics: ${preferences.antibiotics ? 'yes' : 'no'}` },
      { text: `Dialysis: ${preferences.dialysis ? 'yes' : 'no'}` }
    ];

    // Reference each emergency contact as a healthcare agent
    const actors = (data.relatedPersons || []).map(function(person) {
      return {
        role: {
          text: 'Healthcare Agent',
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-RoleClass', code: 'AGNT', display: 'agent' }]
        },
        reference: {
          reference: `RelatedPerson/${person._id}`,
          display: get(person, 'name[0].text', `${get(person, 'name[0].given[0]', '')} ${get(person, 'name[0].family', '')}`.trim())
        }
      };
    });

    return {
      resourceType: 'Consent',
      status: 'active',
      scope: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'adr', display: 'Advanced Care Directive' }]
      },
      category: [{
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentcategorycodes', code: 'acd', display: 'Advance Directive' }]
      }],
      patient: patientReference(),
      dateTime: new Date().toISOString(),
      provision: {
        type: 'permit',
        actor: actors,
        code: prefCodes
      },
      extension: [{
        url: ADI_PREFERENCES_EXTENSION_URL,
        valueString: JSON.stringify(preferences)
      }]
    };
  };

  // Build a human-readable Advance Directives DocumentReference from the preferences,
  // so the saved directive is visible in the document lists (and viewable).
  const buildDirectiveDocumentReference = () => {
    const agentLines = (data.relatedPersons || []).map(function(person) {
      const name = get(person, 'name[0].text', `${get(person, 'name[0].given[0]', '')} ${get(person, 'name[0].family', '')}`.trim());
      const rel = get(person, 'relationship[0].text', 'Contact');
      const phone = get(person, 'telecom[0].value', '');
      return `  • ${name} — ${rel}${phone ? ` (${phone})` : ''}`;
    });

    const treatmentLines = treatmentPreferenceFields.map(function(field) {
      return `  • ${field.label}: ${preferences[field.key] ? 'Yes' : 'No'}`;
    });

    const patientName = data.patient ? FhirUtilities.pluckName(data.patient) : 'Patient';
    const text = [
      'ADVANCE DIRECTIVE — CARE PREFERENCES',
      '',
      `Patient: ${patientName}`,
      `Resuscitation Go-Ahead: ${codeStatusLabels[preferences.codeStatus] || preferences.codeStatus}`,
      '',
      'Treatment Preferences:',
      ...treatmentLines,
      '',
      'Healthcare Agents:',
      ...(agentLines.length ? agentLines : ['  • None designated']),
      '',
      `Saved ${moment().format('MMMM DD, YYYY h:mm A')}`
    ].join('\n');

    const base64 = btoa(unescape(encodeURIComponent(text)));

    return {
      resourceType: 'DocumentReference',
      status: 'current',
      // 81334-5 is the LOINC document type for a patient-authored statement of
      // care preferences — exactly what this form produces. Signed instruments
      // (POLST, POA, DNR order) arrive via Upload Document with their own codes.
      type: {
        coding: [{ system: 'http://loinc.org', code: '81334-5', display: 'Patient Personal advance care plan' }],
        text: 'Patient Personal advance care plan'
      },
      subject: { reference: `Patient/${data.patientId}`, display: data.patient ? FhirUtilities.pluckName(data.patient) : undefined },
      date: new Date().toISOString(),
      description: 'Care preferences directive',
      identifier: [{ system: ADI_PREFERENCES_EXTENSION_URL, value: data.patientId }],
      content: [{
        attachment: {
          contentType: 'text/plain',
          data: base64,
          title: 'Advance Directive – Care Preferences',
          creation: new Date().toISOString()
        }
      }]
    };
  };

  const handleSavePreferences = async () => {
    if (!data.patientId) {
      setSnackbar({ open: true, message: 'Select a patient before saving preferences' });
      return;
    }

    setSavingPreferences(true);
    try {
      // 1. Structured directive (Consent) — preferences + healthcare agent refs
      const consent = buildDirectiveConsent();
      if (data.directiveConsent && data.directiveConsent._id) {
        await Meteor.callAsync('updateConsent', data.directiveConsent._id, consent);
      } else {
        await Meteor.callAsync('createConsent', consent);
      }

      // 2. Human-readable directive (DocumentReference) — shows up in the document lists
      const docRef = buildDirectiveDocumentReference();
      if (data.directiveDocRef && data.directiveDocRef._id) {
        await Meteor.callAsync('documentReferences.update', data.directiveDocRef._id, docRef);
      } else {
        await Meteor.callAsync('documentReferences.insert', docRef);
      }

      setOpenPreferencesForm(false);
      setSnackbar({ open: true, message: 'Advance directive saved' });

      // Clinician workflow: DNR selected → offer the code-status order.
      // PHR users just record the preference; no order prompt.
      if (preferences.codeStatus === 'dnr' && isClinicianUser) {
        setOpenDnrOrderPrompt(true);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSnackbar({ open: true, message: 'Error saving preferences: ' + (error.reason || error.message) });
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleCreateDnrOrder = async () => {
    setCreatingDnrOrder(true);
    try {
      const result = await Meteor.callAsync('pacio.createDnrOrder', data.patientId);
      setSnackbar({
        open: true,
        message: get(result, 'alreadyExisted')
          ? 'An active DNR order already exists for this patient'
          : 'DNR code-status order created'
      });
      setOpenDnrOrderPrompt(false);
    } catch (error) {
      console.error('Error creating DNR order:', error);
      setSnackbar({ open: true, message: 'Error creating DNR order: ' + (error.reason || error.message) });
    } finally {
      setCreatingDnrOrder(false);
    }
  };

  const EmergencyContacts = () => (
    <Card variant="outlined" sx={{
      bgcolor: cardBgColor,
      color: cardTextColor,
      '& .MuiTypography-root': { color: cardTextColor },
      '& .MuiListItemText-secondary': {
        color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
      }
    }}>
      <CardHeader
        avatar={<PhoneIcon color="primary" />}
        title="Emergency Contacts"
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent>
        <List dense>
          {data.relatedPersons.map((person) => (
            <ListItem
              key={person._id}
              secondaryAction={
                <IconButton
                  edge="end"
                  size="small"
                  title="Remove contact"
                  onClick={() => handleRemoveContact(person._id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
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
          onClick={handleOpenContactForm}
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
        <FormLabel component="legend">Resuscitation Go-Ahead</FormLabel>
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
        <Button
          variant="contained"
          sx={{ mr: 1 }}
          onClick={handleSavePreferences}
          disabled={savingPreferences}
        >
          {savingPreferences ? 'Saving...' : 'Save Preferences'}
        </Button>
        <Button variant="outlined" onClick={() => setOpenPreferencesForm(false)}>
          Cancel
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 3 }}>
        <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{
          '& .MuiTypography-root': { color: cardTextColor },
          '& .MuiLink-root': { color: cardTextColor }
        }}>
          <Link
            color="inherit"
            href="/"
            onClick={handleBreadcrumbHome}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5, color: cardTextColor }} fontSize="inherit" />
            Home
          </Link>
          <Typography sx={{ display: 'flex', alignItems: 'center', color: cardTextColor }}>
            <DescriptionIcon sx={{ mr: 0.5, color: cardTextColor }} fontSize="inherit" />
            Advance Healthcare Directives
          </Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="document tabs" sx={{
          '& .MuiTab-root': {
            color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
          },
          '& .Mui-selected': {
            color: isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)'
          }
        }}>
          <Tab label="Advance Directives" />
          <Tab label="All Documents" />
        </Tabs>
      </Box>

      {/* Tab Panel 0: Documents & Preferences */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{
              bgcolor: cardBgColor,
              color: cardTextColor,
              '& .MuiTypography-root': { color: cardTextColor },
              '& .MuiCardHeader-subheader': {
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
              }
            }}>
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
                <Alert severity="info" sx={{
                  bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
                  color: cardTextColor,
                  '& .MuiAlert-icon': { color: isDark ? '#90caf9' : '#1976d2' },
                  '& .MuiAlertTitle-root': { color: cardTextColor }
                }}>
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
                      <ListItem dense disableGutters sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {getDocumentIcon(get(doc, 'type'))}
                        </ListItemIcon>
                        <Typography variant="body2" noWrap sx={{ flexGrow: 1, mr: 2 }}>
                          {get(doc, 'type.text', get(doc, 'type.coding[0].display', 'Document'))}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                            {moment(get(doc, 'date')).format('MMM DD, YYYY')}
                          </Typography>
                          {get(doc, 'status') === 'current' ? (
                            <Chip icon={<VerifiedIcon />} label="Current" size="small" color="success" />
                          ) : (
                            <Chip icon={<WarningIcon />} label="Review Needed" size="small" color="warning" />
                          )}
                          <IconButton size="small" onClick={() => handleViewDocument(doc)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleShare(doc)}>
                            <ShareIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}

              <Box sx={{ mt: 4 }}>
                {!openPreferencesForm ? (
                  <Paper variant="outlined" sx={{
                    p: 0,
                    bgcolor: isDark ? '#2a2a2a' : '#f5f5f5',
                    '& .MuiTypography-root': { color: cardTextColor }
                  }}>
                    {data.directiveConsent ? (
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.25 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Resuscitation Go-Ahead
                          </Typography>
                          <Chip
                            label={codeStatusLabels[preferences.codeStatus] || preferences.codeStatus}
                            size="small"
                            color="primary"
                          />
                        </Box>
                        {treatmentPreferenceFields.map((field) => (
                          <React.Fragment key={field.key}>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                {field.label}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {preferences[field.key] ? 'Yes' : 'No'}
                              </Typography>
                            </Box>
                          </React.Fragment>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ p: 2 }}>
                        Document your specific care preferences including resuscitation
                        go-ahead, comfort care, and treatment options.
                      </Typography>
                    )}
                  </Paper>
                ) : (
                  <PreferencesForm />
                )}
              </Box>
            </CardContent>
            {!openPreferencesForm && (
              <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setOpenPreferencesForm(true)}
                >
                  Edit Care Preferences
                </Button>
              </CardActions>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <EmergencyContacts />
            
            <Card variant="outlined" sx={{
              bgcolor: cardBgColor,
              color: cardTextColor,
              '& .MuiTypography-root': { color: cardTextColor },
              '& .MuiListItemText-secondary': {
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
              }
            }}>
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

            <Card variant="outlined" sx={{
              bgcolor: cardBgColor,
              color: cardTextColor,
              '& .MuiTypography-root': { color: cardTextColor },
              '& .MuiLink-root': {
                color: isDark ? 'rgba(100, 181, 246, 1)' : 'rgb(25, 118, 210)'
              }
            }}>
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
          <Card sx={{
            bgcolor: cardBgColor,
            color: cardTextColor,
            '& .MuiTypography-root': { color: cardTextColor },
            '& .MuiCardHeader-title': { color: cardTextColor },
            '& .MuiCardHeader-subheader': {
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
            },
            '& .MuiListItemText-secondary': {
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
            }
          }}>
            <CardHeader
              title="All Clinical Documents"
              subheader="All medical documents including clinical notes, discharge summaries, and advance directives"
            />
            <CardContent>
              {data.loading ? (
                <Typography>Loading documents...</Typography>
              ) : data.allDocumentReferences.length === 0 ? (
                <Alert severity="info" sx={{
                  bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
                  color: cardTextColor,
                  '& .MuiAlert-icon': { color: isDark ? '#90caf9' : '#1976d2' },
                  '& .MuiAlertTitle-root': { color: cardTextColor }
                }}>
                  <AlertTitle>No Documents Found</AlertTitle>
                  No clinical documents are available for this patient.
                </Alert>
              ) : (
                <List>
                  {data.allDocumentReferences.map((doc) => (
                    <React.Fragment key={doc._id}>
                      <ListItem dense disableGutters sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <DescriptionIcon />
                        </ListItemIcon>
                        <Box sx={{ flexGrow: 1, mr: 2, minWidth: 0 }}>
                          <Typography variant="body2" noWrap>
                            {get(doc, 'type.text', get(doc, 'type.coding[0].display', 'Clinical Document'))}
                          </Typography>
                          {documentAttribution(doc) && (
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                              {documentAttribution(doc)}
                            </Typography>
                          )}
                          {get(doc, 'description') && (
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                              {get(doc, 'description')}
                            </Typography>
                          )}
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                            {moment(get(doc, 'date')).format('MMM DD, YYYY')}
                          </Typography>
                          {get(doc, 'status') === 'current' ? (
                            <Chip icon={<VerifiedIcon />} label="Current" size="small" color="success" />
                          ) : (
                            <Chip label={get(doc, 'status', 'Unknown')} size="small" />
                          )}
                          <IconButton size="small" onClick={() => handleViewDocument(doc)} title="View Document">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleShare(doc)} title="Share Document">
                            <ShareIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </ListItem>
                      <Divider component="li" />
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
                  <Alert severity="error" sx={{
                    bgcolor: isDark ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.1)',
                    color: cardTextColor,
                    '& .MuiAlert-icon': { color: isDark ? '#f44336' : '#d32f2f' }
                  }}>
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

              // Plain text (e.g. the generated care-preferences directive) — rendered
              // as text only (no HTML) so user-supplied names can't inject markup
              if (contentType.startsWith('text/')) {
                const decoded = decodeURIComponent(escape(atob(attachmentData)));
                return (
                  <Box sx={{ bgcolor: '#ffffff', color: '#000000', p: 3, borderRadius: 1, minHeight: '100%' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '1rem', margin: 0 }}>
                      {decoded}
                    </pre>
                  </Box>
                );
              }

              // Unsupported file type
              return (
                <Alert severity="warning" sx={{
                  bgcolor: isDark ? 'rgba(237, 108, 2, 0.15)' : 'rgba(237, 108, 2, 0.1)',
                  color: cardTextColor,
                  '& .MuiAlert-icon': { color: isDark ? '#ff9800' : '#ed6c02' },
                  '& .MuiAlertTitle-root': { color: cardTextColor }
                }}>
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

      <Dialog open={openContactForm} onClose={() => setOpenContactForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Emergency Contact</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                fullWidth
                value={contactForm.given}
                onChange={(e) => setContactForm({ ...contactForm, given: e.target.value })}
              />
              <TextField
                label="Last Name"
                fullWidth
                value={contactForm.family}
                onChange={(e) => setContactForm({ ...contactForm, family: e.target.value })}
              />
            </Box>
            <TextField
              label="Relationship"
              fullWidth
              placeholder="e.g. Daughter, Spouse, Healthcare Agent"
              value={contactForm.relationship}
              onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
            />
            <TextField
              label="Phone"
              fullWidth
              value={contactForm.phone}
              onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenContactForm(false)} disabled={savingContact}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAddContact} disabled={savingContact}>
            {savingContact ? 'Saving...' : 'Add Contact'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DNR quick-order prompt — clinician workflow only */}
      <Dialog
        id="dnrOrderPromptDialog"
        open={openDnrOrderPrompt}
        onClose={() => setOpenDnrOrderPrompt(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create DNR Code-Status Order?</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Preference recorded — order not yet placed</AlertTitle>
            The patient&apos;s Do Not Resuscitate preference has been saved as an
            advance directive. A separate code-status order (ICD-10-CM Z66) tells
            the care team the DNR is in effect for the current admission.
          </Alert>
          <Typography variant="body2">
            Create the DNR order now? It will be recorded as an order placed by you
            and linked to the patient&apos;s active encounter when one exists.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button id="dnrOrderNotNowButton" onClick={() => setOpenDnrOrderPrompt(false)}>
            Not Now
          </Button>
          <Button
            id="dnrOrderCreateButton"
            variant="contained"
            color="error"
            onClick={handleCreateDnrOrder}
            disabled={creatingDnrOrder}
          >
            {creatingDnrOrder ? 'Creating...' : 'Create DNR Order'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      </Container>
    </Box>
  );
}

export default AdvancedDirectivesPage;