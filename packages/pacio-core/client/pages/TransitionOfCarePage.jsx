import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useSubscribe } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import moment from 'moment';

import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Typography, 
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
  Paper,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Fab
} from '@mui/material';

import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';

import HomeIcon from '@mui/icons-material/Home';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HospitalIcon from '@mui/icons-material/LocalHospital';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

// Import tables from Meteor.Tables
import ConditionsTable from '/imports/ui-fhir/conditions/ConditionsTable';
import MedicationsTable from '/imports/ui-fhir/medications/MedicationsTable';
import AllergyIntolerancesTable from '/imports/ui-fhir/allergyIntolerances/AllergyIntolerancesTable';
import ImmunizationsTable from '/imports/ui-fhir/immunizations/ImmunizationsTable';
import ObservationsTable from '/imports/ui-fhir/observations/ObservationsTable';
import ProceduresTable from '/imports/ui-fhir/procedures/ProceduresTable';
import CarePlansTable from '/imports/ui-fhir/carePlans/CarePlansTable';
import CareTeamsTable from '/imports/ui-fhir/careTeams/CareTeamsTable';
import GoalsTable from '/imports/ui-fhir/goals/GoalsTable';
import ServiceRequestsTable from '/imports/ui-fhir/serviceRequests/ServiceRequestsTable';
import NutritionOrdersTable from '/imports/ui-fhir/nutritionOrders/NutritionOrdersTable';
import DevicesTable from '/imports/ui-fhir/devices/DevicesTable';
import DocumentReferencesTable from '/imports/ui-fhir/documentReferences/DocumentReferencesTable';

// FHIR Resources collections
const initCollections = () => {
  if(Meteor.isClient){
    return {
      Compositions: Meteor.Collections?.Compositions,
      Conditions: Meteor.Collections?.Conditions,
      Medications: Meteor.Collections?.Medications,
      MedicationRequests: Meteor.Collections?.MedicationRequests,
      MedicationStatements: Meteor.Collections?.MedicationStatements,
      AllergyIntolerances: Meteor.Collections?.AllergyIntolerances,
      Immunizations: Meteor.Collections?.Immunizations,
      Observations: Meteor.Collections?.Observations,
      Procedures: Meteor.Collections?.Procedures,
      CarePlans: Meteor.Collections?.CarePlans,
      CareTeams: Meteor.Collections?.CareTeams,
      Goals: Meteor.Collections?.Goals,
      ServiceRequests: Meteor.Collections?.ServiceRequests,
      NutritionOrders: Meteor.Collections?.NutritionOrders,
      Devices: Meteor.Collections?.Devices,
      DocumentReferences: Meteor.Collections?.DocumentReferences,
      Encounters: Meteor.Collections?.Encounters,
      Organizations: Meteor.Collections?.Organizations,
      Patients: Meteor.Collections?.Patients
    };
  }
  return {};
};

const transitionSections = [
  { id: 'patient-info', title: 'Patient Information', required: true, component: 'PatientInfo' },
  { id: 'diagnoses', title: 'Diagnoses & Problems', required: true, component: 'Conditions' },
  { id: 'medications', title: 'Medications', required: true, component: 'Medications' },
  { id: 'allergies', title: 'Allergies & Intolerances', required: true, component: 'AllergyIntolerances' },
  { id: 'functional-status', title: 'Functional Status', required: false, component: 'Observations' },
  { id: 'cognitive-status', title: 'Cognitive Status', required: false, component: 'Observations' },
  { id: 'care-preferences', title: 'Care Preferences', required: false, component: 'CarePlans' },
  { id: 'care-team', title: 'Care Team', required: true, component: 'CareTeams' },
  { id: 'discharge-instructions', title: 'Discharge Instructions', required: true, component: 'DocumentReferences' },
  { id: 'nutrition', title: 'Nutrition Orders', required: false, component: 'NutritionOrders' },
  { id: 'skin-conditions', title: 'Skin Conditions', required: false, component: 'Observations' },
  { id: 'immunizations', title: 'Immunizations', required: false, component: 'Immunizations' },
  { id: 'vital-signs', title: 'Vital Signs', required: false, component: 'Observations' },
  { id: 'social-history', title: 'Social History', required: false, component: 'Observations' },
  { id: 'equipment', title: 'Medical Equipment', required: false, component: 'Devices' },
  { id: 'follow-up', title: 'Follow-up Appointments', required: true, component: 'ServiceRequests' }
];

function TransitionsOfCarePage(props) {
  const [selectedTransition, setSelectedTransition] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [completedSections, setCompletedSections] = useState({});
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newComposition, setNewComposition] = useState({
    title: '',
    type: 'transition-of-care',
    status: 'preliminary'
  });
  const [editMode, setEditMode] = useState(false);
  const [selectedComposition, setSelectedComposition] = useState(null);
  
  const collections = initCollections();
  
  // Subscribe to PACIO data
  const patientId = Session.get('selectedPatientId');
  const isLoadingCompositions = useSubscribe('pacio.compositions', patientId);
  const isLoadingTransitions = useSubscribe('pacio.transitionOfCare', patientId);
  const isLoadingPatientResources = useSubscribe('pacio.patientResources', patientId);
  
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const data = useTracker(() => {
    const patientId = Session.get('selectedPatientId');
    
    let query = {};
    if(patientId){
      query = { 
        'subject.reference': { 
          $in: [`Patient/${patientId}`, `urn:uuid:${patientId}`] 
        } 
      };
    }

    const compositions = collections.Compositions?.find({
      ...query,
      'type.coding.code': { $in: ['transition-of-care', 'continuity-of-care-document', '18842-5', '34133-9'] }
    }).fetch() || [];

    const encounters = collections.Encounters?.find(query).fetch() || [];
    const documentReferences = collections.DocumentReferences?.find(query).fetch() || [];
    // Try multiple ways to find the patient
    let patient = {};
    if (patientId && collections.Patients) {
      // Try direct ID first
      patient = collections.Patients.findOne(patientId);
      
      // If not found, try with _id
      if (!patient || Object.keys(patient).length === 0) {
        patient = collections.Patients.findOne({_id: patientId});
      }
      
      // If still not found, try with id
      if (!patient || Object.keys(patient).length === 0) {
        patient = collections.Patients.findOne({id: patientId});
      }
    }
    
    patient = patient || {};
    
    // Fetch data for each section
    const conditions = collections.Conditions?.find(query).fetch() || [];
    const medications = collections.Medications?.find().fetch() || [];
    const medicationRequests = collections.MedicationRequests?.find(query).fetch() || [];
    const medicationStatements = collections.MedicationStatements?.find(query).fetch() || [];
    const allergyIntolerances = collections.AllergyIntolerances?.find(query).fetch() || [];
    const immunizations = collections.Immunizations?.find(query).fetch() || [];
    const observations = collections.Observations?.find(query).fetch() || [];
    const procedures = collections.Procedures?.find(query).fetch() || [];
    const carePlans = collections.CarePlans?.find(query).fetch() || [];
    const careTeams = collections.CareTeams?.find(query).fetch() || [];
    const goals = collections.Goals?.find(query).fetch() || [];
    const serviceRequests = collections.ServiceRequests?.find(query).fetch() || [];
    const nutritionOrders = collections.NutritionOrders?.find(query).fetch() || [];
    const devices = collections.Devices?.find(query).fetch() || [];

    return {
      compositions,
      encounters,
      documentReferences,
      patient,
      patientId,
      sectionData: {
        conditions,
        medications,
        medicationRequests,
        medicationStatements,
        allergyIntolerances,
        immunizations,
        observations,
        procedures,
        carePlans,
        careTeams,
        goals,
        serviceRequests,
        nutritionOrders,
        devices,
        documentReferences
      }
    };
  }, []);
  
  // Auto-check sections that have data
  useEffect(() => {
    if (data.sectionData) {
      const sectionsWithData = {};
      
      // Map section IDs to their data
      const sectionDataMapping = {
        'patient-info': data.patient && Object.keys(data.patient).length > 0,
        'diagnoses': data.sectionData.conditions && data.sectionData.conditions.length > 0,
        'medications': (data.sectionData.medications && data.sectionData.medications.length > 0) || 
                      (data.sectionData.medicationRequests && data.sectionData.medicationRequests.length > 0) ||
                      (data.sectionData.medicationStatements && data.sectionData.medicationStatements.length > 0),
        'allergies': data.sectionData.allergyIntolerances && data.sectionData.allergyIntolerances.length > 0,
        'functional-status': data.sectionData.observations && data.sectionData.observations.filter(obs => 
          get(obs, 'category[0].coding[0].code') === 'functional-status').length > 0,
        'cognitive-status': data.sectionData.observations && data.sectionData.observations.filter(obs => 
          get(obs, 'category[0].coding[0].code') === 'cognitive-status').length > 0,
        'care-preferences': data.sectionData.carePlans && data.sectionData.carePlans.length > 0,
        'care-team': data.sectionData.careTeams && data.sectionData.careTeams.length > 0,
        'discharge-instructions': data.sectionData.documentReferences && data.sectionData.documentReferences.length > 0,
        'nutrition': data.sectionData.nutritionOrders && data.sectionData.nutritionOrders.length > 0,
        'skin-conditions': data.sectionData.observations && data.sectionData.observations.filter(obs => 
          get(obs, 'category[0].coding[0].code') === 'exam' && 
          get(obs, 'code.text', '').toLowerCase().includes('skin')).length > 0,
        'immunizations': data.sectionData.immunizations && data.sectionData.immunizations.length > 0,
        'vital-signs': data.sectionData.observations && data.sectionData.observations.filter(obs => 
          get(obs, 'category[0].coding[0].code') === 'vital-signs').length > 0,
        'social-history': data.sectionData.observations && data.sectionData.observations.filter(obs => 
          get(obs, 'category[0].coding[0].code') === 'social-history').length > 0,
        'equipment': data.sectionData.devices && data.sectionData.devices.length > 0,
        'follow-up': data.sectionData.serviceRequests && data.sectionData.serviceRequests.length > 0
      };
      
      // Set checkboxes for sections with data
      Object.keys(sectionDataMapping).forEach(sectionId => {
        if (sectionDataMapping[sectionId]) {
          sectionsWithData[sectionId] = true;
        }
      });
      
      setCompletedSections(prev => ({
        ...prev,
        ...sectionsWithData
      }));
    }
  }, [data.sectionData, data.patient]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCCDA = () => {
    console.log('C-CDA export hook - implement connection to external module');
  };

  const handleImportCCDA = () => {
    console.log('C-CDA import hook - implement connection to external module');
  };
  
  const handleCreateComposition = () => {
    setOpenCreateDialog(true);
    setEditMode(false);
    setNewComposition({
      title: '',
      type: 'transition-of-care',
      status: 'preliminary'
    });
  };
  
  const handleEditComposition = (composition) => {
    setSelectedComposition(composition);
    setEditMode(true);
    setNewComposition({
      title: get(composition, 'title', ''),
      type: get(composition, 'type.coding[0].code', 'transition-of-care'),
      status: get(composition, 'status', 'preliminary')
    });
    setOpenCreateDialog(true);
  };
  
  const handleSaveComposition = () => {
    const patientId = Session.get('selectedPatientId');
    
    if(!patientId){
      alert('Please select a patient first');
      return;
    }
    
    const compositionResource = {
      resourceType: 'Composition',
      id: editMode ? get(selectedComposition, 'id') : Random.id(),
      status: newComposition.status,
      type: {
        coding: [{
          system: 'http://loinc.org',
          code: newComposition.type === 'transition-of-care' ? '18842-5' : '34133-9',
          display: newComposition.type === 'transition-of-care' ? 'Transition of Care' : 'Continuity of Care Document'
        }]
      },
      subject: {
        reference: `Patient/${patientId}`,
        display: get(data.patient, 'name[0].text', get(data.patient, 'name[0].given[0]', '') + ' ' + get(data.patient, 'name[0].family', ''))
      },
      date: moment().format('YYYY-MM-DD'),
      title: newComposition.title,
      author: [{
        reference: `Practitioner/${Meteor.userId()}`,
        display: Meteor.user()?.username || 'Current User'
      }],
      section: transitionSections.map(section => ({
        title: section.title,
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: section.id
          }]
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${section.title} content</div>`
        },
        entry: [] // Will be populated with references to relevant resources
      }))
    };
    
    const method = editMode ? 'Compositions.update' : 'Compositions.insert';
    const params = editMode ? 
      [{ _id: selectedComposition._id }, { $set: compositionResource }] : 
      [compositionResource];
    
    Meteor.call(method, ...params, (error, result) => {
      if(error){
        console.error('Error saving composition:', error);
        alert('Error saving composition: ' + error.message);
      } else {
        console.log('Composition saved:', result);
        setOpenCreateDialog(false);
        if(!editMode && result){
          setSelectedTransition({ compositionId: result });
        }
      }
    });
  };

  const getEncounterIcon = (encounter) => {
    const type = get(encounter, 'class.code', '');
    if(type.includes('hosp')) return <HospitalIcon />;
    if(type.includes('home')) return <HomeWorkIcon />;
    return <TransferWithinAStationIcon />;
  };

  const getEncounterLocation = (encounter) => {
    const location = get(encounter, 'location[0].location.display', '');
    const org = get(encounter, 'serviceProvider.display', '');
    return location || org || 'Unknown Location';
  };

  const getSectionCompleteness = () => {
    const total = transitionSections.length;
    const completed = Object.values(completedSections).filter(v => v).length;
    return Math.round((completed / total) * 100);
  };
  
  const renderSectionContent = (section) => {
    const { sectionData } = data;
    
    switch(section.component) {
      case 'PatientInfo':
        const patientName = get(data.patient, 'name[0].text') || 
          (get(data.patient, 'name[0].given[0]', '') + ' ' + get(data.patient, 'name[0].family', '')).trim() || 
          'Unknown';
        return (
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', minWidth: '100px' }}>
                    Name:
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    {patientName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', minWidth: '100px' }}>
                    DOB:
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    {get(data.patient, 'birthDate', 'Unknown')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', minWidth: '100px' }}>
                    Gender:
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    {get(data.patient, 'gender', 'Unknown')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', minWidth: '100px' }}>
                    MRN:
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    {get(data.patient, 'identifier[0].value', 'Unknown')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 'Conditions':
        return (
          <ConditionsTable 
            conditions={sectionData.conditions}
            count={sectionData.conditions.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        );
        
      case 'Medications':
        const allMedications = [
          ...sectionData.medications,
          ...sectionData.medicationRequests.map(mr => ({
            ...mr,
            code: get(mr, 'medicationCodeableConcept', get(mr, 'medicationReference'))
          })),
          ...sectionData.medicationStatements.map(ms => ({
            ...ms,
            code: get(ms, 'medicationCodeableConcept', get(ms, 'medicationReference'))
          }))
        ];
        return (
          <MedicationsTable 
            medications={allMedications}
            count={allMedications.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        );
        
      case 'AllergyIntolerances':
        return (
          <AllergyIntolerancesTable 
            allergyIntolerances={sectionData.allergyIntolerances}
            count={sectionData.allergyIntolerances.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        );
        
      case 'Immunizations':
        return (
          <ImmunizationsTable 
            immunizations={sectionData.immunizations}
            count={sectionData.immunizations.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        );
        
      case 'Observations':
        const filteredObs = sectionData.observations.filter(obs => {
          const category = get(obs, 'category[0].coding[0].code', '');
          if(section.id === 'vital-signs') return category === 'vital-signs';
          if(section.id === 'functional-status') return category === 'functional-status';
          if(section.id === 'cognitive-status') return category === 'cognitive-status';
          if(section.id === 'social-history') return category === 'social-history';
          if(section.id === 'skin-conditions') return category === 'exam';
          return false;
        });
        return (
          <ObservationsTable 
            observations={filteredObs}
            count={filteredObs.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        );
        
      case 'CarePlans':
        return (
          <CarePlansTable 
            carePlans={sectionData.carePlans}
            count={sectionData.carePlans.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        );
        
      case 'CareTeams':
        return (
          <CareTeamsTable 
            careTeams={sectionData.careTeams}
            count={sectionData.careTeams.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        );
        
      case 'Goals':
        return (
          <GoalsTable 
            goals={sectionData.goals}
            count={sectionData.goals.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        );
        
      case 'ServiceRequests':
        return (
          <ServiceRequestsTable 
            serviceRequests={sectionData.serviceRequests}
            count={sectionData.serviceRequests.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        );
        
      case 'NutritionOrders':
        return (
          <NutritionOrdersTable 
            nutritionOrders={sectionData.nutritionOrders}
            count={sectionData.nutritionOrders.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        );
        
      case 'Devices':
        return (
          <DevicesTable 
            devices={sectionData.devices}
            count={sectionData.devices.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        );
        
      case 'DocumentReferences':
        return (
          <DocumentReferencesTable 
            documentReferences={sectionData.documentReferences}
            count={sectionData.documentReferences.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        );
        
      default:
        return (
          <Typography color="text.secondary">
            No data available for {section.title}
          </Typography>
        );
    }
  };

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
            <TransferWithinAStationIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Transitions of Care
          </Typography>
        </Breadcrumbs>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
              title="Care Journey Timeline"
            />
            <CardContent>
              {data.compositions.length > 0 ? (
                <Box>
                  {data.compositions.map((composition, index) => (
                    <Paper 
                      key={composition._id}
                      elevation={2} 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        cursor: 'pointer',
                        '&:hover': {
                          elevation: 4,
                          backgroundColor: 'action.hover'
                        }
                      }}
                      onClick={() => setSelectedTransition(composition)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <TimelineDot 
                          color={selectedTransition?._id === composition._id ? 'primary' : 'grey'}
                          sx={{ mt: 0.5 }}
                        >
                          <TransferWithinAStationIcon />
                        </TimelineDot>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="subtitle1" component="h6" sx={{ fontWeight: 500 }}>
                                {get(composition, 'title', 'Transfer Document')}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {get(composition, 'type.coding[0].display', 'Transition of Care')}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {moment(get(composition, 'date')).format('MMM DD, YYYY')}
                            </Typography>
                          </Box>
                          <Chip 
                            label={get(composition, 'status', 'unknown')} 
                            size="small" 
                            color={get(composition, 'status') === 'final' ? 'success' : 'default'}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No transfer documents found
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleCreateComposition}
                    sx={{ mt: 2 }}
                  >
                    Create First Document
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Continuity of Care Document"
              subheader={selectedTransition ? 
                `${get(selectedTransition, 'title')} - ${moment(get(selectedTransition, 'date')).format('MMMM DD, YYYY')}` : 
                'Select or create a transition document'
              }
              action={
                <Box>
                  {selectedTransition && (
                    <IconButton onClick={() => handleEditComposition(selectedTransition)} title="Edit Document">
                      <EditIcon />
                    </IconButton>
                  )}
                  <IconButton onClick={handleImportCCDA} title="Import C-CDA">
                    <UploadIcon />
                  </IconButton>
                  <IconButton onClick={handleExportCCDA} title="Export C-CDA">
                    <DownloadIcon />
                  </IconButton>
                  <IconButton onClick={handlePrint}>
                    <PrintIcon />
                  </IconButton>
                </Box>
              }
            />
            <CardContent>
              {selectedTransition ? (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Document Completeness: {getSectionCompleteness()}%
                  </Alert>
                  
                  {transitionSections.map((section) => (
                    <Accordion 
                      key={section.id}
                      expanded={expandedSections[section.id] || false}
                      onChange={() => toggleSection(section.id)}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Checkbox
                            checked={completedSections[section.id] || false}
                            onChange={(e) => {
                              e.stopPropagation();
                              setCompletedSections(prev => ({
                                ...prev,
                                [section.id]: !prev[section.id]
                              }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Typography sx={{ flexGrow: 1 }}>
                            {section.title}
                          </Typography>
                          {section.required && (
                            <Chip 
                              label="Required" 
                              size="small" 
                              color="primary" 
                              sx={{ mr: 1 }}
                            />
                          )}
                          {completedSections[section.id] ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <PendingIcon color="action" />
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {renderSectionContent(section)}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <TransferWithinAStationIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a care transition from the timeline or create a new document
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Floating Action Button for quick create */}
      <Fab 
        color="primary" 
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleCreateComposition}
      >
        <AddIcon />
      </Fab>
      
      {/* Create/Edit Composition Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Transfer Document' : 'Create New Transfer Document'}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Document Title"
            fullWidth
            variant="outlined"
            value={newComposition.title}
            onChange={(e) => setNewComposition({ ...newComposition, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Document Type"
            select
            fullWidth
            variant="outlined"
            value={newComposition.type}
            onChange={(e) => setNewComposition({ ...newComposition, type: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="transition-of-care">Transition of Care</MenuItem>
            <MenuItem value="continuity-of-care-document">Continuity of Care Document</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            label="Status"
            select
            fullWidth
            variant="outlined"
            value={newComposition.status}
            onChange={(e) => setNewComposition({ ...newComposition, status: e.target.value })}
          >
            <MenuItem value="preliminary">Preliminary</MenuItem>
            <MenuItem value="final">Final</MenuItem>
            <MenuItem value="amended">Amended</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveComposition} variant="contained" color="primary">
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
}

export default TransitionsOfCarePage;