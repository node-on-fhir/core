import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useSubscribe } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import moment from 'moment';
import { useNavigate, useLocation } from 'react-router-dom';

import { resolveShareModalDialog } from '/imports/components/resolveShareModalDialog.js';
import { TocConstants } from '../../lib/constants/TocConstants.js';
import { isAdiDocument } from '../../lib/constants/AdiConstants.js';
import WorkflowNavigation from '/imports/lib/WorkflowNavigation.js';
const { paramPathFromSearch } = WorkflowNavigation;

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
  ListItemButton,
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
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress
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
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';

import PageInstructions from '../components/PageInstructions.jsx';
import ColumnAdornment from '../components/ColumnAdornment.jsx';
import { formatDate } from '../../lib/dateHelpers.js';

// Tables will be accessed from Meteor.Tables
// Packages cannot directly import from /imports/ with Meteor 3 + RSPack

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
      QuestionnaireResponses: Meteor.Collections?.QuestionnaireResponses,
      Organizations: Meteor.Collections?.Organizations,
      Patients: Meteor.Collections?.Patients
    };
  }
  return {};
};

const transitionSections = [
  { id: 'patient-info', title: 'Patient Information', required: true, component: 'PatientInfo' },
  { id: 'diagnoses', title: 'Diagnoses & Problems', loinc: '11450-4', required: true, component: 'Conditions' },
  { id: 'medications', title: 'Medications', loinc: '10160-0', required: true, component: 'Medications' },
  { id: 'allergies', title: 'Allergies & Intolerances', loinc: '48765-2', required: true, component: 'AllergyIntolerances' },
  { id: 'functional-status', title: 'Functional Status', loinc: '47420-5', required: true, component: 'Observations' },
  { id: 'cognitive-status', title: 'Cognitive Status', loinc: '10190-7', required: true, component: 'QuestionnaireResponses' },
  { id: 'care-preferences', title: 'Care Preferences', required: false, component: 'CarePlans' },
  { id: 'care-team', title: 'Care Team', required: true, component: 'CareTeams' },
  { id: 'discharge-instructions', title: 'Discharge Instructions', required: true, component: 'DocumentReferences' },
  { id: 'advance-directives', title: 'Advance Directives', loinc: '42348-3', required: true, component: 'DocumentReferences' },
  { id: 'nutrition', title: 'Nutrition Orders', required: false, component: 'NutritionOrders' },
  { id: 'skin-conditions', title: 'Skin Conditions', required: false, component: 'Observations' },
  { id: 'immunizations', title: 'Immunizations', loinc: '11369-6', required: false, component: 'Immunizations' },
  { id: 'vital-signs', title: 'Vital Signs', loinc: '8716-3', required: true, component: 'Observations' },
  { id: 'social-history', title: 'Social History', required: false, component: 'Observations' },
  { id: 'equipment', title: 'Medical Equipment', required: false, component: 'Devices' },
  { id: 'encounters', title: 'Encounters', loinc: '46240-8', required: true, component: 'Encounters' },
  { id: 'procedures', title: 'Procedures', loinc: '47519-4', required: true, component: 'Procedures' },
  { id: 'results', title: 'Results', loinc: '30954-2', required: true, component: 'Observations' },
  { id: 'follow-up', title: 'Follow-up Appointments', required: true, component: 'ServiceRequests' },
  { id: 'behavioral-health', title: 'Behavioral Health Summary', required: false, component: 'QuestionnaireResponses' }
];

// Maps each Transition of Care section to the purpose-built tool/route where that
// data is captured. The ToC page is a §170.315(b)(1) orchestrator: incomplete sections
// link to the right workflow rather than expecting data entry inline.
// FHIR narrative divs are XHTML — interpolated text must be entity-escaped.
function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const getSectionDestination = (sectionId, patientId) => {
  const destinations = {
    'patient-info': patientId ? `/patients/${patientId}` : '/patients',
    'diagnoses': '/conditions/new',
    'medications': '/medication-management',
    'allergies': '/allergy-testing',
    'functional-status': '/pfe-assessment/new',
    'cognitive-status': '/pfe-assessment/new',
    'care-team': '/care-team-management',
    'discharge-instructions': '/document-references/new',
    'advance-directives': '/advance-directives',
    'vital-signs': '/vital-signs',
    'encounters': '/pacio-exam-room',
    'procedures': '/order-catalog',
    'results': '/order-catalog',
    'follow-up': '/service-requests/new',
    // Optional sections — keep the "All" view actionable too
    'care-preferences': '/careplans/new',
    'nutrition': '/nutrition-orders/new',
    'skin-conditions': '/observations/new',
    'immunizations': '/immunizations/new',
    'social-history': '/observations/new',
    'equipment': '/devices/new',
    'behavioral-health': '/structured-data-capture-forms?form=phq9'
  };
  return destinations[sectionId] || null;
};

function TransitionsOfCarePage(props) {
  // Access tables from Meteor.Tables (registered by main app)
  const ConditionsTable = Meteor.Tables?.ConditionsTable;
  const MedicationsTable = Meteor.Tables?.MedicationsTable;
  const AllergyIntolerancesTable = Meteor.Tables?.AllergyIntolerancesTable;
  const ImmunizationsTable = Meteor.Tables?.ImmunizationsTable;
  const ObservationsTable = Meteor.Tables?.ObservationsTable;
  const ProceduresTable = Meteor.Tables?.ProceduresTable;
  const CarePlansTable = Meteor.Tables?.CarePlansTable;
  const CareTeamsTable = Meteor.Tables?.CareTeamsTable;
  const GoalsTable = Meteor.Tables?.GoalsTable;
  const ServiceRequestsTable = Meteor.Tables?.ServiceRequestsTable;
  const NutritionOrdersTable = Meteor.Tables?.NutritionOrdersTable;
  const DevicesTable = Meteor.Tables?.DevicesTable;
  const DocumentReferencesTable = Meteor.Tables?.DocumentReferencesTable;
  const EncountersTable = Meteor.Tables?.EncountersTable;
  const QuestionnaireResponsesTable = Meteor.Tables?.QuestionnaireResponsesTable;

  // Get Honeycomb theme for dark mode support
  const useAppTheme = Meteor.useTheme;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors for cards
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';

  const [selectedTransition, setSelectedTransition] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [completedSections, setCompletedSections] = useState({});
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [newComposition, setNewComposition] = useState({
    title: '',
    type: 'transition-of-care',
    status: 'preliminary'
  });
  const [editMode, setEditMode] = useState(false);
  const [selectedComposition, setSelectedComposition] = useState(null);
  const [sectionFilter, setSectionFilter] = useState('required');
  // Cross-cutting column toggles (CRUD-table pattern): show* → hide={!show}
  const [showSubject, setShowSubject] = useState(false);
  const [showSubjectReference, setShowSubjectReference] = useState(false);

  const navigate = useNavigate();
  const routerLocation = useLocation();

  // Home breadcrumb: client-side navigation (preserves Session patient context)
  // to the threaded ?home= workflow callback, else the deployment default route.
  function handleBreadcrumbHome(event) {
    event.preventDefault();
    const settingsRoute = get(Meteor, 'settings.public.defaults.route');
    const homePath = paramPathFromSearch(routerLocation.search, 'home')
      || ((typeof settingsRoute === 'string' && settingsRoute.length && settingsRoute !== '/') ? settingsRoute : '/');
    navigate(homePath);
  }

  // ?share-document-dialog=true opens the Share dialog straight from the URL
  // (the Lantern round-trip lands back here with this flag). Closing the
  // dialog strips the param so refresh/back doesn't reopen it.
  useEffect(function() {
    const params = new URLSearchParams(routerLocation.search);
    if (params.get('share-document-dialog') === 'true') {
      setOpenShareDialog(true);
    }
  }, [routerLocation.search]);

  function handleShareDialogClose() {
    setOpenShareDialog(false);
    const params = new URLSearchParams(routerLocation.search);
    if (params.get('share-document-dialog')) {
      params.delete('share-document-dialog');
      const remaining = params.toString();
      navigate(routerLocation.pathname + (remaining ? '?' + remaining : ''), { replace: true });
    }
  }

  const collections = initCollections();
  
  // Subscribe to PACIO data
  const patientId = Session.get('selectedPatientId');
  const isLoadingCompositions = useSubscribe('pacio.compositions', patientId);
  const isLoadingTransitions = useSubscribe('pacio.transitionOfCare', patientId);
  const isLoadingPatientResources = useSubscribe('pacio.patientResources', patientId);
  const isLoadingTocDocRefs = useSubscribe('pacio.tocDocumentReferences', patientId);
  
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const expandAll = () => {
    const all = {};
    transitionSections.forEach((section) => { all[section.id] = true; });
    setExpandedSections(all);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  const data = useTracker(() => {
    const patientId = Session.get('selectedPatientId');
    
    // Match on BOTH reference fields: most clinical resources use subject.reference,
    // but AllergyIntolerance, Immunization, NutritionOrder, and Device are
    // patient.reference per FHIR R4 — a subject-only query silently drops them.
    let query = {};
    if(patientId){
      const patientRefs = [`Patient/${patientId}`, `urn:uuid:${patientId}`];
      query = {
        $or: [
          { 'subject.reference': { $in: patientRefs } },
          { 'patient.reference': { $in: patientRefs } }
        ]
      };
    }

    // Sort most-recent-first so the timeline's first item is the newest document.
    // Missing/invalid dates sort to the bottom (treated as epoch 0).
    const compositionDateValue = (c) => {
      const d = get(c, 'date');
      const m = d ? moment(d) : null;
      return (m && m.isValid()) ? m.valueOf() : 0;
    };

    const compositions = (collections.Compositions?.find({
      ...query,
      'type.coding.code': { $in: [
        'transition-of-care', 'continuity-of-care-document',
        '18842-5', '34133-9',
        // ToC v2 LOINC codes
        '18761-7',
        // Physician Discharge summary — seen in imported PACIO ToC bundles
        '11490-0'
      ] }
    }).fetch() || []).sort((a, b) => compositionDateValue(b) - compositionDateValue(a));

    const encounters = collections.Encounters?.find(query).fetch() || [];
    const documentReferences = collections.DocumentReferences?.find(query).fetch() || [];

    // --- Care Journey Timeline entries -----------------------------------
    // Imported ToC documents arrive as DocumentReference manifests pointing at
    // remote document Bundles; locally-authored documents are Compositions. The
    // timeline shows both, deduping a manifest against its locally-imported
    // Composition (matched by title === description for the same patient).
    const isTocDocRef = (docRef) => {
      const profiles = get(docRef, 'meta.profile', []) || [];
      if (profiles.includes(TocConstants.profiles.TOC_DOCUMENT_REFERENCE)) {
        return true;
      }
      return (get(docRef, 'type.coding', []) || []).some(
        (coding) => coding.code === TocConstants.documentReferenceType.code
      );
    };

    const makeTimelineEntry = (composition, docRef) => ({
      key: composition ? `composition-${composition._id}` : `docref-${docRef._id}`,
      composition: composition || null,
      docRef: docRef || null,
      title: composition ?
        get(composition, 'title', 'Transfer Document') :
        get(docRef, 'description', 'Transfer Document'),
      typeDisplay: get(composition || docRef, 'type.coding[0].display', 'Transition of Care'),
      date: get(composition || docRef, 'date'),
      status: composition ?
        get(composition, 'status', 'unknown') :
        get(docRef, 'docStatus', get(docRef, 'status', 'unknown'))
    });

    const usedCompositionIds = new Set();
    const docRefEntries = documentReferences.filter(isTocDocRef).map((docRef) => {
      const description = (get(docRef, 'description', '') || '').trim();
      const matched = description ? compositions.find((composition) =>
        !usedCompositionIds.has(composition._id) &&
        (get(composition, 'title', '') || '').trim() === description
      ) : null;
      if (matched) {
        usedCompositionIds.add(matched._id);
      }
      return makeTimelineEntry(matched, docRef);
    });
    const compositionEntries = compositions
      .filter((composition) => !usedCompositionIds.has(composition._id))
      .map((composition) => makeTimelineEntry(composition, null));
    const timelineEntries = [...docRefEntries, ...compositionEntries]
      .sort((a, b) => compositionDateValue(b) - compositionDateValue(a));
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
    const questionnaireResponses = collections.QuestionnaireResponses?.find(query).fetch() || [];

    return {
      compositions,
      timelineEntries,
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
        documentReferences,
        encounters,
        questionnaireResponses
      }
    };
  }, []);
  
  // Auto-select the most recent transition document on load. timelineEntries are
  // sorted most-recent-first in the tracker above. Prefer the newest entry that
  // has a local Composition (an editable document) over a bare imported manifest.
  // Only selects when nothing is selected yet, so it never overrides a user's pick.
  useEffect(() => {
    // Drop a stale selection (e.g. the patient context changed and the selected
    // entry no longer belongs to the current timeline).
    if (selectedTransition && !data.timelineEntries.some((entry) => entry.key === selectedTransition.key)) {
      setSelectedTransition(null);
      return;
    }
    if (!selectedTransition && data.timelineEntries.length > 0) {
      const firstWithComposition = data.timelineEntries.find((entry) => entry.composition);
      setSelectedTransition(firstWithComposition || data.timelineEntries[0]);
    }
  }, [data.timelineEntries, selectedTransition]);

  // The selected timeline entry wraps either a local Composition (editable
  // document) or a bare imported DocumentReference manifest (no local bundle).
  const activeComposition = get(selectedTransition, 'composition');
  const activeDocRef = get(selectedTransition, 'docRef');

  // --- Section → records matching --------------------------------------------
  // Match FHIR records to a ToC section with .some() across the WHOLE
  // category/coding arrays — codes can appear at any index (US Core stores
  // functional-status as a SECONDARY category), so a fixed [0] silently misses them.
  const resourceHasCategory = (res, code) =>
    (get(res, 'category', []) || []).some((cat) =>
      (get(cat, 'coding', []) || []).some((c) => c.code === code));

  const qrMatches = (qr, regex) => regex.test(get(qr, 'questionnaire', '') || '');

  // Single source of truth: the records belonging to a given ToC section. Used by
  // BOTH completion detection and renderSectionContent so a green "Completed" chip
  // always lines up with a populated accordion body.
  const getSectionRecords = (section, sourceData) => {
    const s = (sourceData && sourceData.sectionData) || {};
    const obs = s.observations || [];
    const qrs = s.questionnaireResponses || [];

    switch (section.id) {
      case 'patient-info':
        return (sourceData && sourceData.patient && Object.keys(sourceData.patient).length > 0)
          ? [sourceData.patient] : [];
      case 'diagnoses': return s.conditions || [];
      case 'medications':
        return [
          ...(s.medications || []),
          ...(s.medicationRequests || []),
          ...(s.medicationStatements || [])
        ];
      case 'allergies': return s.allergyIntolerances || [];
      case 'functional-status':
        return [
          ...obs.filter((o) => resourceHasCategory(o, 'functional-status')),
          ...qrs.filter((qr) => qrMatches(qr, /promis-?10|global[-\s]?health|pfe|function|mobility|adl/i))
        ];
      case 'cognitive-status':
        return qrs.filter((qr) => qrMatches(qr, /bims|brief[-\s]?interview|mental[-\s]?status|cognit|moca|mmse/i));
      case 'care-preferences': return s.carePlans || [];
      case 'care-team': return s.careTeams || [];
      // Advance directives share the DocumentReferences pool with discharge/transfer
      // summaries; isAdiDocument (AdiConstants — stamped ADI profile OR any directive
      // type LOINC) is the single matcher, so a doc lands in exactly one section.
      case 'discharge-instructions':
        return (s.documentReferences || []).filter((d) => !isAdiDocument(d));
      case 'advance-directives':
        return (s.documentReferences || []).filter((d) => isAdiDocument(d));
      case 'nutrition': return s.nutritionOrders || [];
      case 'skin-conditions':
        return obs.filter((o) =>
          resourceHasCategory(o, 'exam') || get(o, 'code.text', '').toLowerCase().includes('skin'));
      case 'immunizations': return s.immunizations || [];
      case 'vital-signs': return obs.filter((o) => resourceHasCategory(o, 'vital-signs'));
      case 'social-history': return obs.filter((o) => resourceHasCategory(o, 'social-history'));
      case 'equipment': return s.devices || [];
      case 'encounters': return s.encounters || [];
      case 'procedures': return s.procedures || [];
      case 'results': return obs.filter((o) => resourceHasCategory(o, 'laboratory'));
      case 'follow-up': return s.serviceRequests || [];
      case 'behavioral-health':
        return qrs.filter((qr) => qrMatches(qr, /gad-?7|phq|depress|anx|behav|pain[-\s]?interference/i));
      default: return [];
    }
  };

  // Auto-check sections that have data — derived from the same matcher the
  // accordion bodies use (getSectionRecords), so the chip state and the rendered
  // content can never disagree.
  useEffect(() => {
    if (!data.sectionData) return;

    const sectionsWithData = {};
    transitionSections.forEach((section) => {
      if (getSectionRecords(section, data).length > 0) {
        sectionsWithData[section.id] = true;
      }
    });

    setCompletedSections(prev => ({
      ...prev,
      ...sectionsWithData
    }));
  }, [data.sectionData, data.patient]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCCDA = () => {
    console.log('C-CDA export hook - implement connection to external module');
  };

  const handleShare = () => {
    // Open the (overridable) Share dialog — a workflow package may supply its own
    // ShareModalDialog via the Package registry; otherwise the shared default
    // (Meteor.ShareModalDialog) is rendered. See resolveShareModalDialog().
    setOpenShareDialog(true);
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
  
  const handleSaveComposition = async () => {
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
          // Narrative div is XHTML — titles like "Diagnoses & Problems" must be
          // entity-escaped or external servers reject the whole document (HAPI-1755).
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${escapeXml(section.title)} content</div>`
        },
        entry: [] // Will be populated with references to relevant resources
      }))
    };
    
    try {
      let result;
      if (editMode) {
        result = await Meteor.rpc('compositions.update', {
          selector: { _id: selectedComposition._id },
          modifier: { $set: compositionResource }
        });
      } else {
        result = await Meteor.rpc('compositions.insert', compositionResource);
      }
      console.log('Composition saved:', result);
      setOpenCreateDialog(false);
      if(!editMode && result){
        // Clear the selection so the auto-select effect picks up the newly
        // created document (newest entry with a Composition) once it syncs.
        setSelectedTransition(null);
      }
    } catch (error) {
      console.error('Error saving composition:', error);
      alert('Error saving composition: ' + error.message);
    }
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

  // Navigate to the purpose-built tool for an incomplete section. Client-side
  // navigation preserves Session.selectedPatientId so the destination keeps context.
  const handleAddSectionData = (section, event) => {
    if (event) event.stopPropagation();
    const destination = getSectionDestination(section.id, data.patientId);
    if (destination) {
      const separator = destination.includes('?') ? '&' : '?';
      navigate(`${destination}${separator}next=transitions-of-care&back=transitions-of-care`);
    } else {
      console.warn('[TransitionOfCarePage] No destination route for section:', section.id);
    }
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
            hidePatientName={false}
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
            hideStatus={false}
            hideForm={false}
            hideIngredients={false}
            hideManufacturer={false}
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
        
      case 'Observations': {
        // Use the shared matcher so the table matches the chip exactly. A section
        // like functional-status can carry both Observations (MDS/Braden) and
        // QuestionnaireResponses (PROMIS-10) — split by type and render each.
        const records = getSectionRecords(section, data);
        const obsRecords = records.filter(r => get(r, 'resourceType') !== 'QuestionnaireResponse');
        const qrRecords = records.filter(r => get(r, 'resourceType') === 'QuestionnaireResponse');
        return (
          <>
            <ObservationsTable
              observations={obsRecords}
              count={obsRecords.length}
              hideIdentifier={true}
              hideCheckbox={true}
              hideActionIcons={true}
              hideBarcode={true}
              hideSubject={!showSubject}
              hideSubjectReference={!showSubjectReference}
              paginationLimit={5}
              page={0}
              rowsPerPage={5}
            />
            {qrRecords.length > 0 && QuestionnaireResponsesTable && (
              <Box sx={{ mt: 2 }}>
                <QuestionnaireResponsesTable
                  questionnaireResponses={qrRecords}
                  count={qrRecords.length}
                  hideSubjectDisplay={!showSubject}
                  hideSubjectReference={!showSubjectReference}
                  hideIdentifier={true}
                  hideCheckbox={true}
                  hideActionIcons={true}
                  hideBarcode={true}
                  paginationLimit={5}
                  page={0}
                  rowsPerPage={5}
                />
              </Box>
            )}
          </>
        );
      }

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
        
      case 'DocumentReferences': {
        // Shared matcher (isAdiDocument) splits advance directives from the
        // discharge/transfer summaries that share the DocumentReferences pool.
        const docs = getSectionRecords(section, data);
        // Imported transfer notes carry their info in type + description and have
        // no author/attachment title; locally-authored advance directives are the
        // opposite. Pick columns per section so nothing renders blank.
        const isDischargeSection = section.id === 'discharge-instructions';
        return (
          <DocumentReferencesTable
            documentReferences={docs}
            count={docs.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            hideTypeDisplay={!isDischargeSection}
            hideDescription={!isDischargeSection}
            hideAuthor={isDischargeSection}
            hideContentTitle={isDischargeSection}
            hideSubjectDisplay={!showSubject}
            hideSubjectReference={!showSubjectReference}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        );
      }

      case 'Encounters': {
        const encounters = getSectionRecords(section, data);
        return EncountersTable ? (
          <EncountersTable
            encounters={encounters}
            count={encounters.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            hidePatientName={true}
            hidePatientReference={true}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        ) : (
          <Typography color="text.secondary">Encounters table not available</Typography>
        );
      }

      case 'Procedures': {
        const procedures = getSectionRecords(section, data);
        return ProceduresTable ? (
          <ProceduresTable
            procedures={procedures}
            count={procedures.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            hideSubject={!showSubject}
            hideSubjectReference={!showSubjectReference}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        ) : (
          <Typography color="text.secondary">Procedures table not available</Typography>
        );
      }

      case 'QuestionnaireResponses': {
        const qrs = getSectionRecords(section, data);
        return QuestionnaireResponsesTable ? (
          <QuestionnaireResponsesTable
            questionnaireResponses={qrs}
            count={qrs.length}
            hideIdentifier={true}
            hideCheckbox={true}
            hideActionIcons={true}
            hideBarcode={true}
            hideSubjectDisplay={!showSubject}
            hideSubjectReference={!showSubjectReference}
            paginationLimit={5}
            page={0}
            rowsPerPage={5}
          />
        ) : (
          <Typography color="text.secondary">Assessment table not available</Typography>
        );
      }

      default:
        return (
          <Typography color="text.secondary">
            No data available for {section.title}
          </Typography>
        );
    }
  };

  // Patient context is required — without it the composition queries would span all patients
  if (!data.patientId) {
    const NoPatientSelectedCard = Meteor.NoPatientSelectedCard;
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <Container maxWidth="xl" sx={{ pt: 3, pb: 3 }}>
          {NoPatientSelectedCard ? (
            <NoPatientSelectedCard />
          ) : (
            <Alert severity="warning">
              No patient selected. Please select a patient to view transitions of care.
            </Alert>
          )}
        </Container>
      </Box>
    );
  }

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
            <TransferWithinAStationIcon sx={{ mr: 0.5, color: cardTextColor }} fontSize="inherit" />
            Transitions of Care
          </Typography>
        </Breadcrumbs>
      </Box>

      <PageInstructions page="transitionsOfCare">
        Pick a transfer document from the timeline, then complete the required
        sections. The completeness score tracks the PACIO required-section list.
      </PageInstructions>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{
            bgcolor: cardBgColor,
            color: cardTextColor,
            '& .MuiTypography-root': { color: cardTextColor }
          }}>
            <CardHeader
              title="Care Journey Timeline"
            />
            <CardContent>
              <Button
                id="pacio-core-new-transfer-document-btn"
                variant="contained"
                fullWidth
                startIcon={<AddIcon />}
                onClick={handleCreateComposition}
                sx={{ mb: 2 }}
              >
                {data.timelineEntries.length === 0 ? 'Create First Transfer Document' : 'New Transfer Document'}
              </Button>
              {data.timelineEntries.length > 0 ? (
                <List disablePadding>
                  {data.timelineEntries.map((entry) => (
                    <ListItemButton
                      key={entry.key}
                      divider
                      selected={selectedTransition?.key === entry.key}
                      onClick={() => setSelectedTransition(entry)}
                      sx={{ py: 1.5, alignItems: 'flex-start', gap: 1.5 }}
                    >
                      <TimelineDot
                        color={selectedTransition?.key === entry.key ? 'primary' : 'grey'}
                        sx={{ mt: 0.25, p: 0.5 }}
                      >
                        <TransferWithinAStationIcon fontSize="small" />
                      </TimelineDot>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" component="h6" noWrap sx={{ fontWeight: 600 }}>
                              {entry.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {entry.typeDisplay}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                            {formatDate(entry.date)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                          <Chip
                            label={entry.status}
                            size="small"
                            color={entry.status === 'final' ? 'success' : 'default'}
                            sx={{ height: 20 }}
                          />
                          {!entry.composition && (
                            <Chip
                              label="Imported"
                              size="small"
                              variant="outlined"
                              sx={{ height: 20 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </ListItemButton>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No transfer documents found
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <ColumnAdornment
            icon={TransferWithinAStationIcon}
            caption="Select a document from the timeline to review section completeness."
          />
        </Grid>

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
              title="Continuity of Care Document"
              subheader={selectedTransition ?
                `${get(selectedTransition, 'title')} - ${formatDate(get(selectedTransition, 'date'), 'MMMM DD, YYYY')}` :
                'Select or create a transition document'
              }
              action={
                <Box>
                  {activeComposition && (
                    <IconButton onClick={() => handleEditComposition(activeComposition)} title="Edit Document">
                      <EditIcon />
                    </IconButton>
                  )}
                  {activeComposition && (
                    <IconButton onClick={handleExportCCDA} title="Export C-CDA">
                      <DownloadIcon />
                    </IconButton>
                  )}
                  {activeComposition && (
                    <IconButton onClick={handlePrint} title="Print">
                      <PrintIcon />
                    </IconButton>
                  )}
                  {activeComposition && (
                    <IconButton id="pacio-core-share-toc-btn" onClick={handleShare} title="Share">
                      <ShareIcon />
                    </IconButton>
                  )}
                </Box>
              }
            />
            <CardContent>
              {activeComposition ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                    <Alert severity="info" sx={{ flexGrow: 1, py: 0, '& .MuiAlert-message': { width: '100%' } }}>
                      Document Completeness: {getSectionCompleteness()}%
                      <LinearProgress
                        variant="determinate"
                        value={getSectionCompleteness()}
                        color={getSectionCompleteness() >= 80 ? 'success' : 'info'}
                        sx={{ mt: 0.5, mb: 0.5, height: 6, borderRadius: 3 }}
                      />
                    </Alert>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={sectionFilter}
                        onChange={(e, value) => { if (value) setSectionFilter(value); }}
                        aria-label="section filter"
                      >
                        <ToggleButton value="required" aria-label="required sections">
                          Required
                        </ToggleButton>
                        <ToggleButton value="incomplete" aria-label="incomplete sections">
                          Incomplete
                        </ToggleButton>
                        <ToggleButton value="all" aria-label="all sections">
                          All
                        </ToggleButton>
                      </ToggleButtonGroup>

                      <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={null}
                        onChange={(e, value) => {
                          if (value === 'expand') expandAll();
                          if (value === 'collapse') collapseAll();
                        }}
                        aria-label="expand or collapse all sections"
                      >
                        <ToggleButton value="expand" aria-label="expand all sections" title="Expand all">
                          <UnfoldMoreIcon fontSize="small" />
                        </ToggleButton>
                        <ToggleButton value="collapse" aria-label="collapse all sections" title="Collapse all">
                          <UnfoldLessIcon fontSize="small" />
                        </ToggleButton>
                      </ToggleButtonGroup>

                      <ToggleButtonGroup
                        size="small"
                        value={[
                          ...(showSubject ? ['subject'] : []),
                          ...(showSubjectReference ? ['subjectReference'] : [])
                        ]}
                        onChange={(e, newCols) => {
                          setShowSubject(newCols.includes('subject'));
                          setShowSubjectReference(newCols.includes('subjectReference'));
                        }}
                        aria-label="column visibility"
                      >
                        <ToggleButton value="subject" aria-label="show subject column" title="Subject column">
                          <PersonIcon fontSize="small" />
                        </ToggleButton>
                        <ToggleButton value="subjectReference" aria-label="show subject reference column" title="Subject reference column">
                          <CodeIcon fontSize="small" />
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  </Box>

                  {transitionSections
                    .filter((section) => {
                      if (sectionFilter === 'all') return true;
                      if (sectionFilter === 'incomplete') return section.required && !completedSections[section.id];
                      return section.required; // 'required'
                    })
                    .map((section) => {
                    const isCompleted = completedSections[section.id] || false;
                    const destination = getSectionDestination(section.id, data.patientId);
                    return (
                    <Accordion
                      key={section.id}
                      expanded={expandedSections[section.id] || false}
                      onChange={() => toggleSection(section.id)}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Checkbox
                            checked={isCompleted}
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
                            isCompleted ? (
                              <Chip label="Completed" size="small" color="success" />
                            ) : destination ? (
                              <Chip
                                label="Required"
                                size="small"
                                color="warning"
                                clickable
                                onClick={(e) => handleAddSectionData(section, e)}
                              />
                            ) : (
                              <Chip label="Required" size="small" color="warning" variant="outlined" />
                            )
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {renderSectionContent(section)}
                      </AccordionDetails>
                    </Accordion>
                    );
                  })}
                </>
              ) : activeDocRef ? (
                <Box sx={{ py: 2 }}>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    This is an imported transfer document manifest. Its document Bundle
                    was empty or has not been imported, so there are no sections to display.
                  </Alert>
                  <Typography variant="h6" gutterBottom>
                    {get(activeDocRef, 'description', 'Transfer Document')}
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 3, rowGap: 1.5, mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">Type</Typography>
                    <Typography variant="body2">
                      {get(activeDocRef, 'type.coding[0].display', 'Unknown')} ({get(activeDocRef, 'type.coding[0].code', '')})
                    </Typography>

                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label={get(activeDocRef, 'status', 'unknown')} size="small" />
                      {get(activeDocRef, 'docStatus') && (
                        <Chip
                          label={get(activeDocRef, 'docStatus')}
                          size="small"
                          color={get(activeDocRef, 'docStatus') === 'final' ? 'success' : 'default'}
                        />
                      )}
                    </Box>

                    <Typography variant="body2" color="text.secondary">Date</Typography>
                    <Typography variant="body2">
                      {moment(get(activeDocRef, 'date')).format('MMMM DD, YYYY h:mm A')}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">Content Type</Typography>
                    <Typography variant="body2">
                      {get(activeDocRef, 'content[0].attachment.contentType', 'Unknown')}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">Attachment</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {get(activeDocRef, 'content[0].attachment.url') ? (
                        <Link
                          href={get(activeDocRef, 'content[0].attachment.url')}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {get(activeDocRef, 'content[0].attachment.url')}
                        </Link>
                      ) : 'None'}
                    </Typography>
                  </Box>
                </Box>
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

          <ColumnAdornment
            icon={HomeWorkIcon}
            caption="Conforms to the PACIO Transitions of Care FHIR Implementation Guide."
            linkLabel="View the ToC IG"
            href="https://hl7.org/fhir/us/pacio-toc/"
          />
        </Grid>
      </Grid>
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

      {(function() {
        const ResolvedShareDialog = resolveShareModalDialog();
        if (!ResolvedShareDialog) return null;
        return (
          <ResolvedShareDialog
            open={openShareDialog}
            onClose={handleShareDialogClose}
            resource={activeComposition}
            resourceType="Composition"
          />
        );
      })()}
      </Container>
    </Box>
  );
}

export default TransitionsOfCarePage;