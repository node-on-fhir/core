// npmPackages/radiology-workflow/client/TechDashboard.jsx

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';
import { extractAllDicomMetadataFromArrayBuffer, flattenDicomMetadataForGridFS } from '/imports/ui/DICOM/utils/DcmjsMetadata';
import SimpleDicomViewport from '/imports/ui/DICOM/components/SimpleDicomViewport';
import WorkflowNavigation from '/imports/lib/WorkflowNavigation.js';
const { forwardHome } = WorkflowNavigation;
import {
  Container,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
  TextField,
  Chip,
  Divider,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  Paper,
  CardHeader,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import DensitySmallIcon from '@mui/icons-material/DensitySmall';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import UploadIcon from '@mui/icons-material/Upload';
import LaunchIcon from '@mui/icons-material/Launch';
import ImageIcon from '@mui/icons-material/Image';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import PersonIcon from '@mui/icons-material/Person';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import BadgeIcon from '@mui/icons-material/Badge';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoIcon from '@mui/icons-material/Info';

import WorklistTable from './components/WorklistTable.jsx';
import TatDisplay from './components/TatDisplay.jsx';
import StatCounters from './components/StatCounters.jsx';
import TabTiles from './components/TabTiles.jsx';
import WorkflowDrawer from './components/WorkflowDrawer.jsx';
import RowActionIcons from './components/RowActionIcons.jsx';
import { LaunchAppsModal } from '/imports/components/LaunchAppsModal.jsx';

const log = (Meteor.Logger ? Meteor.Logger.for('TechDashboard') : console);

// =============================================================================
// TECH DASHBOARD - SAFETY SCREENING & IMAGE ACQUISITION
// =============================================================================
//
// Phases 2-3 of radiology workflow:
// - View active imaging orders (worklist)
// - Complete safety screening (QuestionnaireResponse)
// - Start/complete imaging procedure
// - Create ImagingStudy
// =============================================================================

// Safety screening questions (simplified demo version)
const SAFETY_QUESTIONS = [
  { id: 'allergy', text: 'History of contrast allergy?', type: 'boolean',
    link: '/allergy-testing?back=radiology/tech', linkTooltip: 'View allergy testing' },
  { id: 'pregnancy', text: 'Pregnancy or possibility of pregnancy?', type: 'boolean' },
  { id: 'implant', text: 'Metallic implants (pacemaker, clips, etc.)?', type: 'boolean',
    link: '/implantable-devices?back=radiology/tech', linkTooltip: 'View implantable devices' },
  { id: 'kidney', text: 'History of kidney disease or dialysis?', type: 'boolean' },
  { id: 'claustrophobia', text: 'Claustrophobia (for MRI)?', type: 'boolean' },
  { id: 'diabetes', text: 'Diabetes with metformin use?', type: 'boolean',
    link: '/medication-management?back=radiology/tech', linkTooltip: 'View medication management' }
];

// Tab definitions (key is used for ?tab= URL param)
const TECH_TABS = [
  { key: 'active', label: 'Active Orders', filter: function(o) { return o.status === 'active'; } },
  { key: 'in-progress', label: 'In Progress', filter: function(o) { return o.status === 'screening-complete' || o.status === 'in-progress'; } },
  { key: 'on-hold', label: 'On Hold', filter: function(o) { return o.status === 'on-hold'; } },
  { key: 'all', label: 'All', filter: function() { return true; } }
];

// Workflow panel steps ↔ ?panel= URL param values (index = stepper step;
// 'image-acquisition' predates this list and stays for deep-link back-compat)
const PANEL_STEP_KEYS = ['safety-screening', 'image-acquisition', 'complete'];

// Build QuestionnaireResponse items from the screening checkbox state
function buildScreeningItems(answers) {
  return SAFETY_QUESTIONS.map(function(q) {
    return {
      linkId: q.id,
      text: q.text,
      answer: [{ valueBoolean: !!answers[q.id] }]
    };
  });
}

// Column visibility ↔ URL param mapping
var COLUMN_PARAM_MAP = {
  'patient-name': 'patientDisplay',
  'patient-reference': 'patientId',
  'imaging-study-id': 'imagingStudyId',
  'body-site': 'bodySite'
};

var COLUMN_KEY_TO_PARAM = {
  'patientDisplay': 'patient-name',
  'patientId': 'patient-reference',
  'imagingStudyId': 'imaging-study-id',
  'bodySite': 'body-site'
};

var COLUMN_DEFAULTS = {
  patientDisplay: true,
  patientId: false,
  imagingStudyId: false,
  bodySite: true
};

// Map display-text prefixes → DICOM modality codes
// Handles cases like MRA→MR and DEXA→DXA
var TEXT_PREFIX_TO_MODALITY = {
  'XR': 'XR', 'CT': 'CT', 'MR': 'MR', 'US': 'US',
  'NM': 'NM', 'MG': 'MG', 'RF': 'RF', 'XA': 'XA',
  'DXA': 'DXA', 'DEXA': 'DXA', 'MRA': 'MR'
};

// Extract DICOM modality code from ServiceRequest code.coding array
function getDicomModality(order, fallback) {
  // 1. Look for explicit DICOM coding entry (new orders)
  var codings = get(order, 'code.coding', []);
  var dicomCoding = codings.find(function(c) {
    return get(c, 'system') === 'http://dicom.nema.org/resources/ontology/DCM';
  });
  if (dicomCoding) {
    return get(dicomCoding, 'code', fallback || '');
  }

  // 2. Fallback: extract modality prefix from description text
  var text = get(order, 'code.text', '');
  var firstWord = text.split(' ')[0];
  if (firstWord && TEXT_PREFIX_TO_MODALITY[firstWord]) {
    return TEXT_PREFIX_TO_MODALITY[firstWord];
  }

  return fallback || '';
}

function getPriorityChipProps(priority) {
  const map = {
    'stat': { color: 'error', variant: 'filled' },
    'asap': { color: 'error', variant: 'outlined' },
    'urgent': { color: 'warning', variant: 'outlined' },
    'routine': { color: 'default', variant: 'outlined' }
  };
  return map[priority] || map['routine'];
}

function getStatusChipColor(status) {
  const map = {
    'active': 'info',
    'screening-complete': 'info',
    'in-progress': 'primary',
    'completed': 'success',
    'on-hold': 'warning',
    'revoked': 'default',
    'entered-in-error': 'default',
    'draft': 'default'
  };
  return map[status] || 'default';
}

function TechDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [workflowStep, setWorkflowStep] = useState(0);
  const [screeningAnswers, setScreeningAnswers] = useState({});
  const [contraindications, setContraindications] = useState([]);
  const [acquisitionNotes, setAcquisitionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentProcedure, setCurrentProcedure] = useState(null);
  // Draft-on-open screening QuestionnaireResponse (from radiology.beginSafetyScreening)
  const [screeningResponse, setScreeningResponse] = useState(null);
  // Latest selected order id, for stale-guarding async method callbacks
  const selectedOrderIdRef = useRef(null);
  const activeTab = useMemo(function() {
    var tabParam = searchParams.get('tab');
    if (tabParam) {
      var index = TECH_TABS.findIndex(function(t) { return t.key === tabParam; });
      if (index !== -1) return index;
    }
    return 0;
  }, [searchParams]);
  const [density, setDensity] = useState('standard');
  // Active stat-tile quick filter (null = none); set by clicking a stat tile.
  const [activeStatKey, setActiveStatKey] = useState(null);
  const columnVisibility = useMemo(function() {
    var vis = Object.assign({}, COLUMN_DEFAULTS);
    Object.keys(COLUMN_PARAM_MAP).forEach(function(param) {
      var val = searchParams.get(param);
      if (val !== null) {
        vis[COLUMN_PARAM_MAP[param]] = val === 'true';
      }
    });
    return vis;
  }, [searchParams]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [launchPatient, setLaunchPatient] = useState(null);
  const [completingOrderId, setCompletingOrderId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadState, setUploadState] = useState({
    uploading: false, progress: 0, total: 0, completed: 0, errors: []
  });
  // GridFS file ids uploaded during this acquisition session — drives the
  // in-drawer Cornerstone QC viewer so the tech can verify the right images
  // loaded before completing the procedure.
  const [acquiredFileIds, setAcquiredFileIds] = useState([]);
  // Memoized so the array identity is stable across renders — the viewport
  // effect re-loads whenever its dicomUrls prop identity changes.
  const acquiredDicomUrls = useMemo(function() {
    return acquiredFileIds.map(function(fileId) {
      return '/api/dicom/files/' + fileId;
    });
  }, [acquiredFileIds]);

  // ---------------------------------------------------------------------------
  // Data subscriptions
  // ---------------------------------------------------------------------------
  const {
    orders,
    procedures,
    imagingStudies,
    isLoading
  } = useTracker(function() {
    const ordersHandle = Meteor.subscribe('radiology.ServiceRequests', {
      'category.coding.code': '363679005'
    }, { limit: 200 });

    const proceduresHandle = Meteor.subscribe('autopublish.Procedures', {
      status: 'in-progress'
    }, { limit: 50 });

    Meteor.subscribe('radiology.ImagingStudies', {}, { limit: 200 });

    const ServiceRequests = Meteor.Collections?.ServiceRequests;
    const Procedures = Meteor.Collections?.Procedures;
    const ImagingStudies = Meteor.Collections?.ImagingStudies;

    let activeOrders = [];
    let activeProcedures = [];
    let activeImagingStudies = [];

    if (ServiceRequests) {
      activeOrders = ServiceRequests.find({
        'category.coding.code': '363679005'
      }).fetch();

      // Custom priority sort
      const priorityOrder = { 'stat': 0, 'asap': 1, 'urgent': 2, 'routine': 3 };
      activeOrders.sort(function(a, b) {
        const aPriority = priorityOrder[a.priority] ?? 3;
        const bPriority = priorityOrder[b.priority] ?? 3;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(a.authoredOn) - new Date(b.authoredOn);
      });
    }

    if (Procedures) {
      activeProcedures = Procedures.find({
        status: 'in-progress'
      }).fetch();
    }

    if (ImagingStudies) {
      activeImagingStudies = ImagingStudies.find({}).fetch();
    }

    return {
      orders: activeOrders,
      procedures: activeProcedures,
      imagingStudies: activeImagingStudies,
      isLoading: !ordersHandle.ready()
    };
  }, []);

  // Keep the stale-guard ref in sync with the current selection
  useEffect(function() {
    selectedOrderIdRef.current = selectedOrder ? selectedOrder._id : null;
  }, [selectedOrder]);

  // ---------------------------------------------------------------------------
  // Restore panel state from URL (?order=<_id>&panel=<step>) once the
  // ServiceRequests subscription is ready — makes the drawer deep-linkable
  // ---------------------------------------------------------------------------
  useEffect(function() {
    if (isLoading) return;

    var orderParam = searchParams.get('order');
    var panelParam = searchParams.get('panel');

    if (orderParam && (!selectedOrder || selectedOrder._id !== orderParam)) {
      // Strict _id lookup only (see .claude/rules/anti-patterns/id-lookup.md)
      var match = orders.find(function(o) { return o._id === orderParam; });
      if (match) {
        setSelectedOrder(match);
        setScreeningAnswers({});
        setContraindications([]);
        setCurrentProcedure(null);
        setScreeningResponse(null);
        var stepIndex = PANEL_STEP_KEYS.indexOf(panelParam);
        setWorkflowStep(stepIndex !== -1 ? stepIndex : 0);
      } else {
        console.warn('[TechDashboard] ?order param did not match a subscribed order:', orderParam);
      }
    } else if (!orderParam && selectedOrder && panelParam === 'image-acquisition') {
      // Legacy deep link: ?panel=image-acquisition with a locally selected order
      setWorkflowStep(1);
    }
  }, [isLoading, orders, searchParams, selectedOrder]);

  // ---------------------------------------------------------------------------
  // Draft-on-open: find-or-create the screening QuestionnaireResponse as soon
  // as an order's screening panel opens, and hydrate saved answers from it.
  // Failure is non-blocking — checkboxes keep working locally.
  // ---------------------------------------------------------------------------
  useEffect(function() {
    if (!selectedOrder || workflowStep !== 0 || screeningResponse) return;

    var orderId = selectedOrder._id;
    var patientId = get(selectedOrder, 'subject.reference', '').replace('Patient/', '');
    var encounterId = get(selectedOrder, 'encounter.reference', '').replace('Encounter/', '');

    Meteor.callAsync('radiology.beginSafetyScreening', {
      questionnaireId: 'pre-imaging-safety',
      serviceRequestId: orderId,
      patientId: patientId,
      encounterId: encounterId || undefined,
      items: buildScreeningItems({})
    }).then(function(questionnaireResponse) {
      if (!questionnaireResponse) return;
      if (selectedOrderIdRef.current !== orderId) return; // order changed mid-flight

      setScreeningResponse(questionnaireResponse);

      var savedAnswers = {};
      (questionnaireResponse.item || []).forEach(function(item) {
        savedAnswers[item.linkId] = !!get(item, 'answer.0.valueBoolean');
      });
      // Merge with any toggles made before the draft arrived — local wins
      setScreeningAnswers(function(prev) {
        return Object.assign({}, savedAnswers, prev);
      });
    }).catch(function(err) {
      console.warn('[TechDashboard] beginSafetyScreening failed (non-blocking):', err);
    });
  }, [selectedOrder, workflowStep, screeningResponse]);

  // ---------------------------------------------------------------------------
  // Flatten orders + annotate with procedure status
  // ---------------------------------------------------------------------------
  const flattenedOrders = useMemo(function() {
    var procedureByOrderId = new Map();
    procedures.forEach(function(proc) {
      var basedOn = get(proc, 'basedOn.0.reference', '');
      var orderId = basedOn.replace('ServiceRequest/', '');
      if (orderId) procedureByOrderId.set(orderId, proc._id);
    });

    var imagingStudyByOrderId = new Map();
    imagingStudies.forEach(function(study) {
      var basedOnRef = get(study, 'basedOn.0.reference', '');
      var orderId = basedOnRef.replace('ServiceRequest/', '');
      if (orderId) {
        var hasSeries = Array.isArray(study.series) && study.series.length > 0;
        var existing = imagingStudyByOrderId.get(orderId);
        if (!existing || hasSeries) {
          imagingStudyByOrderId.set(orderId, {
            id: study._id,
            hasSeries: hasSeries
          });
        }
      }
    });

    var Patients = Meteor.Collections?.Patients;

    return orders.map(function(order) {
      var orderPatientId = get(order, 'subject.reference', '').replace('Patient/', '');
      var patientName = get(order, 'subject.display', '');

      // Look up patient name from Patients collection if not in subject.display
      if (!patientName && orderPatientId && Patients) {
        var patientRecord = Patients.findOne({ _id: orderPatientId });
        if (!patientRecord) {
          patientRecord = Patients.findOne({ id: orderPatientId });
        }
        if (patientRecord) {
          patientName = get(patientRecord, 'name.0.text',
            (get(patientRecord, 'name.0.given.0', '') + ' ' + get(patientRecord, 'name.0.family', '')).trim()
          );
        }
      }

      return {
        _id: get(order, '_id', ''),
        id: get(order, 'id', ''),
        status: get(order, 'status', ''),
        priority: get(order, 'priority', 'routine'),
        description: get(order, 'code.text', get(order, 'code.coding.0.display', '')),
        modality: getDicomModality(order),
        bodySite: get(order, 'bodySite.0.text', get(order, 'bodySite.0.coding.0.display', '')),
        patientDisplay: patientName || orderPatientId,
        patientId: orderPatientId,
        imagingStudyId: get(imagingStudyByOrderId.get(order._id), 'id', ''),
        authoredOn: get(order, 'authoredOn', ''),
        barcode: get(order, '_id', ''),
        reasonCode: get(order, 'reasonCode.0.text', get(order, 'reasonCode.0.coding.0.display', '')),
        _hasInProgressProcedure: procedureByOrderId.has(order._id),
        _procedureId: procedureByOrderId.get(order._id) || null,
        _imagingStudyInfo: imagingStudyByOrderId.get(order._id) || null,
        _raw: order
      };
    });
  }, [orders, procedures, imagingStudies]);

  // ---------------------------------------------------------------------------
  // STAT counters — also serve as clickable quick filters (key + filter fn)
  // ---------------------------------------------------------------------------
  const statCounters = useMemo(function() {
    const now = Date.now();
    const isStat = function(o) { return o.priority === 'stat' || o.priority === 'asap'; };
    const isUrgent = function(o) { return o.priority === 'urgent'; };
    const isOver4h = function(o) {
      return o.authoredOn && (now - new Date(o.authoredOn).getTime()) > 4 * 3600000;
    };

    return [
      { key: 'stat', label: 'STAT', count: flattenedOrders.filter(isStat).length, color: 'error', filter: isStat },
      { key: 'urgent', label: 'Urgent', count: flattenedOrders.filter(isUrgent).length, color: 'warning', filter: isUrgent },
      { key: 'over4h', label: '>4h TAT', count: flattenedOrders.filter(isOver4h).length, color: 'error', filter: isOver4h },
      // 'Total' has no filter — clicking it clears the active stat filter.
      { key: 'total', label: 'Total', count: flattenedOrders.length, color: undefined }
    ];
  }, [flattenedOrders]);

  // ---------------------------------------------------------------------------
  // Tab-filtered data (tab filter AND active stat-tile filter; orthogonal)
  // ---------------------------------------------------------------------------
  const tabFilteredData = useMemo(function() {
    const tabDef = TECH_TABS[activeTab];
    let rows = tabDef ? flattenedOrders.filter(tabDef.filter) : flattenedOrders;
    if (activeStatKey) {
      const statDef = statCounters.find(function(s) { return s.key === activeStatKey; });
      if (statDef && typeof statDef.filter === 'function') {
        rows = rows.filter(statDef.filter);
      }
    }
    return rows;
  }, [flattenedOrders, activeTab, activeStatKey, statCounters]);

  // Tab tiles — each TECH_TAB becomes a clickable count tile (acts as the tab)
  const tabTiles = useMemo(function() {
    return TECH_TABS.map(function(tab) {
      return {
        key: tab.key,
        label: tab.label,
        count: flattenedOrders.filter(tab.filter).length
      };
    });
  }, [flattenedOrders]);

  // ---------------------------------------------------------------------------
  // Column definitions
  // ---------------------------------------------------------------------------
  const techColumns = [
    {
      key: 'actions',
      label: '',
      width: 130,
      render: function(val, row) {
        return (
          <RowActionIcons
            row={row}
            actions={[
              {
                icon: <VisibilityIcon fontSize="small" />,
                tooltip: 'Open Viewer',
                color: 'primary',
                onClick: function(r) {
                  var studyId = get(r, '_imagingStudyInfo.id', '');
                  if (studyId) {
                    navigate(forwardHome('/dicom/viewer/' + studyId));
                  }
                },
                disabled: function(r) {
                  return !r._imagingStudyInfo || !r._imagingStudyInfo.hasSeries;
                }
              },
              {
                icon: <PlayArrowIcon fontSize="small" />,
                tooltip: 'Start Workflow',
                color: 'primary',
                onClick: function(r) { handleSelectOrder(r._raw); }
              },
              {
                icon: <InfoIcon fontSize="small" />,
                tooltip: 'View Details',
                onClick: function(r) { handleSelectOrder(r._raw); }
              },
              {
                icon: <DeleteIcon fontSize="small" />,
                tooltip: 'Delete Order',
                color: 'error',
                onClick: function(r) {
                  setDeleteTarget(r);
                  setShowDeleteDialog(true);
                }
              }
            ]}
          />
        );
      }
    },
    {
      key: 'tat',
      label: 'TAT',
      width: 120,
      render: function(val, row) {
        return <TatDisplay startTime={row.authoredOn} size="small" disabled={row.status === 'revoked' || row.status === 'entered-in-error' || row.status === 'completed'} />;
      }
    },
    {
      key: 'priority',
      label: 'Priority',
      width: 100,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'stat', label: 'STAT' },
        { value: 'asap', label: 'ASAP' },
        { value: 'urgent', label: 'URGENT' },
        { value: 'routine', label: 'ROUTINE' }
      ],
      render: function(val) {
        return (
          <Chip
            label={(val || 'routine').toUpperCase()}
            size="small"
            {...getPriorityChipProps(val)}
          />
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      width: 100,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'active', label: 'Active' },
        { value: 'screening-complete', label: 'Screening Complete' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'on-hold', label: 'On Hold' },
        { value: 'completed', label: 'Completed' }
      ],
      render: function(val) {
        return (
          <Chip
            label={val || 'unknown'}
            size="small"
            color={getStatusChipColor(val)}
            variant="outlined"
          />
        );
      }
    },
    {
      key: '_imagingStudyInfo',
      label: 'Img',
      width: 60,
      render: function(val) {
        if (!val) {
          return (
            <Tooltip title="No imaging study">
              <ImageIcon sx={{ fontSize: '1.2rem', color: 'text.disabled' }} />
            </Tooltip>
          );
        }
        if (!val.hasSeries) {
          return (
            <Tooltip title="Study created, no images attached">
              <ImageIcon sx={{ fontSize: '1.2rem', color: 'warning.main' }} />
            </Tooltip>
          );
        }
        return (
          <Tooltip title="Images attached">
            <AttachFileIcon sx={{ fontSize: '1.2rem', color: 'success.main' }} />
          </Tooltip>
        );
      }
    },
    {
      key: 'description',
      label: 'Description',
      filterable: true,
      filterType: 'text'
    },
    {
      key: 'modality',
      label: 'Mod',
      width: 70,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'CR', label: 'CR' },
        { value: 'CT', label: 'CT' },
        { value: 'MR', label: 'MR' },
        { value: 'US', label: 'US' },
        { value: 'XA', label: 'XA' },
        { value: 'NM', label: 'NM' },
        { value: 'PT', label: 'PET' },
        { value: 'MG', label: 'MG' }
      ]
    },
    {
      key: 'bodySite',
      label: 'Body Part',
      filterable: true,
      filterType: 'text'
    },
    {
      key: 'patientDisplay',
      label: 'Patient',
      filterable: true,
      filterType: 'text',
      render: function(val, row) {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Select patient">
              <IconButton
                size="small"
                onClick={function(e) { handleSelectPatient(e, row); }}
                sx={{ p: 0.25 }}
              >
                <PersonIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              </IconButton>
            </Tooltip>
            <span>{val || '-'}</span>
          </Box>
        );
      }
    },
    {
      key: 'patientId',
      label: 'Patient ID',
      width: 120,
      filterable: true,
      filterType: 'text',
      render: function(val) {
        return (
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
            {val ? val.substring(0, 12) : '-'}
          </Typography>
        );
      }
    },
    {
      key: 'imagingStudyId',
      label: 'Study ID',
      width: 120,
      filterable: true,
      filterType: 'text',
      render: function(val) {
        return (
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
            {val ? val.substring(0, 12) : '-'}
          </Typography>
        );
      }
    },
    {
      key: 'authoredOn',
      label: 'Order Date',
      width: 140,
      sortable: true,
      render: function(val) {
        if (!val) return '-';
        return new Date(val).toLocaleString(undefined, {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
      }
    },
    {
      key: 'barcode',
      label: 'Accession#',
      width: 100,
      render: function(val) {
        return (
          <Typography
            variant="caption"
            sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
          >
            {val ? val.substring(0, 12) : '-'}
          </Typography>
        );
      }
    }
  ];

  // ---------------------------------------------------------------------------
  // Column visibility filtering
  // ---------------------------------------------------------------------------
  const visibleColumns = useMemo(function() {
    return techColumns.filter(function(col) {
      if (col.key in columnVisibility) {
        return columnVisibility[col.key];
      }
      return true;
    });
  }, [columnVisibility]);

  function toggleColumn(key) {
    var paramName = COLUMN_KEY_TO_PARAM[key];
    if (paramName) {
      var newParams = new URLSearchParams(searchParams);
      newParams.set(paramName, String(!columnVisibility[key]));
      setSearchParams(newParams, { replace: true });
    }
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------
  function handleSelectPatient(event, row) {
    event.stopPropagation();

    const rawOrder = row._raw;
    const patientReference = get(rawOrder, 'subject.reference', '');
    const patientDisplay = get(rawOrder, 'subject.display', '');
    const patientId = patientReference.replace('Patient/', '');

    if (patientId) {
      Meteor.call('patients.findOne', patientId, function(err, patient) {
        if (patient) {
          Session.set('selectedPatient', patient);
          Session.set('selectedPatientId', get(patient, 'id', patientId));
        } else {
          Session.set('selectedPatientId', patientId);
          Session.set('selectedPatient', {
            id: patientId,
            reference: patientReference,
            display: patientDisplay
          });
        }
      });
    }
  }

  // Write (or clear) the ?order= and ?panel= params — same {replace:true}
  // convention as the tab/column params
  function writePanelParams(orderId, step) {
    var newParams = new URLSearchParams(searchParams);
    if (orderId) {
      newParams.set('order', orderId);
      newParams.set('panel', PANEL_STEP_KEYS[step] || PANEL_STEP_KEYS[0]);
    } else {
      newParams.delete('order');
      newParams.delete('panel');
    }
    setSearchParams(newParams, { replace: true });
  }

  function goToStep(step) {
    setWorkflowStep(step);
    if (selectedOrder) {
      writePanelParams(selectedOrder._id, step);
    }
  }

  function handleSelectOrder(order) {
    setSelectedOrder(order);
    setWorkflowStep(0);
    setScreeningAnswers({});
    setContraindications([]);
    setCurrentProcedure(null);
    setScreeningResponse(null);
    setAcquiredFileIds([]);
    setError(null);
    writePanelParams(order._id, 0);
  }

  function handleDeselectOrder() {
    setSelectedOrder(null);
    setScreeningResponse(null);
    setAcquiredFileIds([]);
    writePanelParams(null);
  }

  function evaluateScreening() {
    const issues = [];

    if (screeningAnswers.allergy) {
      issues.push('Contrast allergy - requires pre-medication protocol');
    }
    if (screeningAnswers.pregnancy) {
      issues.push('Pregnancy - requires radiologist review');
    }
    if (screeningAnswers.implant) {
      const modality = getDicomModality(selectedOrder);
      if (modality === 'MR') {
        issues.push('Metallic implant - MRI contraindicated');
      } else {
        issues.push('Metallic implant - verify MRI safety');
      }
    }
    if (screeningAnswers.kidney) {
      issues.push('Renal disease - contrast nephropathy risk');
    }
    if (screeningAnswers.claustrophobia) {
      issues.push('Claustrophobia - may require sedation');
    }
    if (screeningAnswers.diabetes) {
      issues.push('Metformin - hold 48h post-contrast');
    }

    setContraindications(issues);
    return issues;
  }

  async function handleCompleteScreening() {
    if (!selectedOrder) return;

    setSubmitting(true);
    setError(null);

    const issues = evaluateScreening();

    try {
      const patientId = get(selectedOrder, 'subject.reference', '').replace('Patient/', '');

      await Meteor.callAsync('radiology.submitSafetyScreening', {
        questionnaireResponseId: get(screeningResponse, '_id'),
        questionnaireId: 'pre-imaging-safety',
        serviceRequestId: selectedOrder._id,
        patientId: patientId,
        items: buildScreeningItems(screeningAnswers)
      });

      setScreeningResponse(function(prev) {
        return prev ? Object.assign({}, prev, { status: 'completed' }) : prev;
      });

      if (issues.length > 0) {
        setError('Contraindications detected: ' + issues.join(', ') + '. Review before proceeding.');
      }
    } catch (err) {
      // Never block the workflow on a save failure — warn and continue
      console.error('[TechDashboard] Error submitting screening:', err);
      setError('Screening could not be saved (' + (err.reason || err.message) + ') — continuing to acquisition.');
    } finally {
      goToStep(1);
      setSubmitting(false);
    }
  }

  async function handleStartProcedure() {
    if (!selectedOrder) return;

    setSubmitting(true);
    setError(null);

    try {
      const patientId = get(selectedOrder, 'subject.reference', '').replace('Patient/', '');
      const encounterId = get(selectedOrder, 'encounter.reference', '').replace('Encounter/', '');
      const modality = getDicomModality(selectedOrder, 'Unknown');
      const modalityDisplay = get(selectedOrder, 'code.text', modality);

      // Screening was skipped (never-block flow): auto-complete the draft with
      // the current answers before the procedure starts. Failure is non-fatal.
      if (get(screeningResponse, 'status') === 'in-progress') {
        try {
          await Meteor.callAsync('radiology.submitSafetyScreening', {
            questionnaireResponseId: screeningResponse._id,
            questionnaireId: 'pre-imaging-safety',
            serviceRequestId: selectedOrder._id,
            patientId: patientId,
            items: buildScreeningItems(screeningAnswers)
          });
          setScreeningResponse(function(prev) {
            return prev ? Object.assign({}, prev, { status: 'completed' }) : prev;
          });
        } catch (screeningErr) {
          console.warn('[TechDashboard] Auto-completing screening failed (non-blocking):', screeningErr);
        }
      }

      const procedureId = await Meteor.callAsync('radiology.startProcedure', {
        serviceRequestId: selectedOrder._id,
        patientId: patientId,
        encounterId: encounterId || undefined,
        modality: modality,
        modalityDisplay: modalityDisplay
      });

      console.log('[TechDashboard] Started procedure:', procedureId);
      setCurrentProcedure({ _id: procedureId });
    } catch (err) {
      console.error('[TechDashboard] Error starting procedure:', err);
      setError(err.reason || err.message || 'Failed to start procedure');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCompleteProcedure() {
    if (!selectedOrder || !currentProcedure) return;

    setSubmitting(true);
    setError(null);

    try {
      const patientId = get(selectedOrder, 'subject.reference', '').replace('Patient/', '');
      const encounterId = get(selectedOrder, 'encounter.reference', '').replace('Encounter/', '');
      const modality = getDicomModality(selectedOrder, 'Unknown');

      const result = await Meteor.callAsync('radiology.completeProcedure', {
        procedureId: currentProcedure._id,
        serviceRequestId: selectedOrder._id,
        patientId: patientId,
        encounterId: encounterId || undefined,
        modality: modality,
        description: acquisitionNotes || (modality + ' imaging study'),
        numberOfSeries: 1,
        numberOfInstances: 1
      });

      console.log('[TechDashboard] Completed procedure:', result);
      goToStep(2);
    } catch (err) {
      console.error('[TechDashboard] Error completing procedure:', err);
      setError(err.reason || err.message || 'Failed to complete procedure');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelServiceRequest() {
    if (!selectedOrder) return;
    setSubmitting(true);
    setError(null);
    try {
      await Meteor.callAsync('radiology.cancelServiceRequest', {
        serviceRequestId: selectedOrder._id
      });
      console.log('[TechDashboard] Cancelled service request:', selectedOrder._id);
      setShowCancelDialog(false);
      handleDeselectOrder();
    } catch (err) {
      console.error('[TechDashboard] Error cancelling service request:', err);
      setError(err.reason || err.message || 'Failed to cancel service request');
    } finally {
      setSubmitting(false);
    }
  }

  function handleRefresh() {
    // Re-apply current tab param to force a reactive change, preserving other params
    var newParams = new URLSearchParams(searchParams);
    var tabKey = TECH_TABS[activeTab] ? TECH_TABS[activeTab].key : 'active';
    newParams.set('tab', tabKey);
    setSearchParams(newParams, { replace: true });
  }

  // ---------------------------------------------------------------------------
  // Drop-zone handlers (DICOM file upload)
  // ---------------------------------------------------------------------------
  var handleDragOver = useCallback(function(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  var handleDragLeave = useCallback(function(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  var handleDrop = useCallback(function(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    var droppedFiles = Array.from(e.dataTransfer.files).filter(function(f) {
      return f.name.toLowerCase().endsWith('.dcm');
    });

    if (droppedFiles.length > 0) {
      uploadDicomFiles(droppedFiles);
    } else {
      console.warn('[TechDashboard] No .dcm files found in drop');
    }
  }, [selectedOrder]);

  function uploadFileToGridFS(file, dicomMetadata) {
    return new Promise(function(resolve, reject) {
      var formData = new FormData();
      formData.append('dicomFile', file);

      if (dicomMetadata) {
        formData.append('dicomMetadata', JSON.stringify(dicomMetadata));
      }

      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/dicom/upload');

      var loginToken = localStorage.getItem('Meteor.loginToken');
      if (loginToken) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + loginToken);
      }

      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (parseErr) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error('Upload failed with status ' + xhr.status));
        }
      };

      xhr.onerror = function() {
        reject(new Error('Network error during upload'));
      };

      xhr.send(formData);
    });
  }

  async function uploadDicomFiles(files) {
    setUploadState({ uploading: true, progress: 0, total: files.length, completed: 0, errors: [] });

    var successfulFileIds = [];

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      try {
        var arrayBuffer = await file.arrayBuffer();
        // Flat shape is what POST /api/dicom/upload persists into dicom.files
        // (the nested shape previously sent here never populated metadata.*)
        var dicomMetadata = flattenDicomMetadataForGridFS(
          extractAllDicomMetadataFromArrayBuffer(arrayBuffer)
        );
        if (!dicomMetadata) {
          console.warn('[TechDashboard] Could not parse DICOM:', file.name);
        }

        var uploadResult = await uploadFileToGridFS(file, dicomMetadata);
        console.log('[TechDashboard] Uploaded:', file.name);

        if (uploadResult && uploadResult.fileId) {
          successfulFileIds.push(uploadResult.fileId);
        }

        setUploadState(function(prev) {
          return {
            uploading: prev.uploading,
            progress: ((prev.completed + 1) / prev.total) * 100,
            total: prev.total,
            completed: prev.completed + 1,
            errors: prev.errors
          };
        });
      } catch (err) {
        console.error('[TechDashboard] Upload error:', file.name, err);
        setUploadState(function(prev) {
          return {
            uploading: prev.uploading,
            progress: ((prev.completed + 1) / prev.total) * 100,
            total: prev.total,
            completed: prev.completed + 1,
            errors: prev.errors.concat(file.name + ': ' + err.message)
          };
        });
      }
    }

    setUploadState(function(prev) {
      return {
        uploading: false,
        progress: 100,
        total: prev.total,
        completed: prev.completed,
        errors: prev.errors
      };
    });

    if (successfulFileIds.length > 0) {
      // Feed the in-drawer QC viewer with everything uploaded this session
      setAcquiredFileIds(function(prev) {
        return prev.concat(successfulFileIds);
      });
    }

    // Create/update ImagingStudy linked to the ServiceRequest
    console.log('[TechDashboard] Upload complete, creating ImagingStudy with', successfulFileIds.length, 'files');

    if (successfulFileIds.length > 0) {
      var studyOptions = {};
      if (selectedOrder) {
        var patientId = get(selectedOrder, 'subject.reference', '').replace('Patient/', '');
        var serviceRequestId = get(selectedOrder, '_id', '');
        if (patientId) {
          studyOptions.patientId = patientId;
        }
        if (serviceRequestId) {
          studyOptions.serviceRequestId = serviceRequestId;
        }
      }

      Meteor.call('dicom.createOrUpdateImagingStudy', successfulFileIds, studyOptions, function(error, result) {
        if (error) {
          console.error('[TechDashboard] Post-upload study creation error:', error);
        } else {
          console.log('[TechDashboard] Post-upload study creation:', result);
        }
      });
    } else {
      console.warn('[TechDashboard] No successful file uploads, skipping ImagingStudy creation');
    }
  }

  async function handleQuickComplete(row) {
    if (!row._procedureId) return;

    setCompletingOrderId(row._id);
    setError(null);

    try {
      var rawOrder = row._raw;
      var patientId = get(rawOrder, 'subject.reference', '').replace('Patient/', '');
      var encounterId = get(rawOrder, 'encounter.reference', '').replace('Encounter/', '');
      var modality = getDicomModality(rawOrder, 'Unknown');

      await Meteor.callAsync('radiology.completeProcedure', {
        procedureId: row._procedureId,
        serviceRequestId: row._id,
        patientId: patientId,
        encounterId: encounterId || undefined,
        modality: modality,
        description: modality + ' imaging study',
        numberOfSeries: 1,
        numberOfInstances: 1
      });

      console.log('[TechDashboard] Quick-completed procedure:', row._procedureId);
    } catch (err) {
      console.error('[TechDashboard] Error quick-completing procedure:', err);
      setError(err.reason || err.message || 'Failed to complete procedure');
    } finally {
      setCompletingOrderId(null);
    }
  }

  async function handleQuickCompleteAlways(row) {
    var rawOrder = row._raw;
    var patientId = get(rawOrder, 'subject.reference', '').replace('Patient/', '');
    var encounterId = get(rawOrder, 'encounter.reference', '').replace('Encounter/', '');
    var modality = getDicomModality(rawOrder, 'Unknown');

    setCompletingOrderId(row._id);
    setError(null);

    try {
      if (row._hasInProgressProcedure && row._procedureId) {
        await Meteor.callAsync('radiology.completeProcedure', {
          procedureId: row._procedureId,
          serviceRequestId: row._id,
          patientId: patientId,
          encounterId: encounterId || undefined,
          modality: modality,
          description: modality + ' imaging study',
          numberOfSeries: 1,
          numberOfInstances: 1
        });
      } else {
        var procedureResult = await Meteor.callAsync('radiology.startProcedure', {
          serviceRequestId: row._id,
          patientId: patientId,
          encounterId: encounterId || undefined,
          modality: modality
        });
        await Meteor.callAsync('radiology.completeProcedure', {
          procedureId: procedureResult,
          serviceRequestId: row._id,
          patientId: patientId,
          encounterId: encounterId || undefined,
          modality: modality,
          description: modality + ' imaging study',
          numberOfSeries: 1,
          numberOfInstances: 1
        });
      }
      console.log('[TechDashboard] Quick-completed (always):', row._id);
    } catch (err) {
      console.error('[TechDashboard] Error quick-completing:', err);
      setError(err.reason || err.message || 'Failed to complete');
    } finally {
      setCompletingOrderId(null);
    }
  }

  async function handleDeleteOrder(mode) {
    if (!deleteTarget) return;
    setDeletingOrderId(deleteTarget._id);
    setError(null);

    try {
      if (mode === 'revoke') {
        await Meteor.callAsync('radiology.cancelServiceRequest', {
          serviceRequestId: deleteTarget._id
        });
        console.log('[TechDashboard] Revoked order:', deleteTarget._id);
      } else {
        await Meteor.callAsync('radiology.hardDeleteServiceRequest', {
          serviceRequestId: deleteTarget._id
        });
        console.log('[TechDashboard] Hard-deleted order:', deleteTarget._id);
      }
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error('[TechDashboard] Error deleting order:', err);
      setError(err.reason || err.message || 'Failed to delete');
    } finally {
      setDeletingOrderId(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Expanded row content (accordion buttons)
  // ---------------------------------------------------------------------------
  function renderExpandedContent(row) {
    var rawOrder = row._raw;
    var patientRef = get(rawOrder, 'subject.reference', '');
    var patientId = patientRef.replace('Patient/', '');

    return (
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Button variant="outlined" size="small" startIcon={<MonitorHeartIcon />}
          onClick={function(e) {
            e.stopPropagation();
            if (patientId) {
              Meteor.call('patients.findOne', patientId, function(err, patient) {
                if (patient) {
                  Session.set('selectedPatient', patient);
                  Session.set('selectedPatientId', get(patient, 'id', patientId));
                }
                navigate('/patient-chart');
              });
            }
          }}
        >
          Chart
        </Button>

        <Button variant="outlined" size="small" startIcon={<ImageIcon />}
          onClick={function(e) {
            e.stopPropagation();
            navigate('/dicom/upload?patient=' + encodeURIComponent(patientId)
              + '&servicerequest=' + encodeURIComponent(get(row, '_id', '')));
          }}
        >
          Images
        </Button>

        <Button variant="outlined" size="small" startIcon={<LaunchIcon />}
          onClick={function(e) {
            e.stopPropagation();
            if (patientId) {
              Meteor.call('patients.findOne', patientId, function(err, patient) {
                if (patient) {
                  setLaunchPatient(patient);
                } else {
                  // patients.findOne looks up by _id; the reference may contain
                  // a FHIR id instead. Fall back to a minimal patient object so
                  // the modal can still open.
                  log.warn('patients.findOne returned null for patientId - using fallback', { patientId });
                  setLaunchPatient({
                    _id: patientId,
                    id: patientId,
                    name: get(rawOrder, 'subject.display', '')
                  });
                }
                setLaunchModalOpen(true);
              });
            }
          }}
        >
          Launch
        </Button>

        <Button variant="contained" size="small" color="primary" startIcon={<PlayArrowIcon />}
          onClick={function(e) {
            e.stopPropagation();
            handleSelectOrder(rawOrder);
          }}
        >
          Start Workflow
        </Button>

        <Button variant="contained" size="small" color="success"
          startIcon={completingOrderId === row._id ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          disabled={completingOrderId === row._id}
          onClick={function(e) { e.stopPropagation(); handleQuickCompleteAlways(row); }}
        >
          Complete
        </Button>

        <Button variant="contained" size="small" color="error"
          startIcon={<DeleteIcon />}
          onClick={function(e) {
            e.stopPropagation();
            setDeleteTarget(row);
            setShowDeleteDialog(true);
          }}
        >
          Delete
        </Button>
      </Stack>
    );
  }

  // ---------------------------------------------------------------------------
  // Compute ImagingStudy ID for selected order (used in drawer subtitle)
  // ---------------------------------------------------------------------------
  var selectedStudyId = useMemo(function() {
    if (!selectedOrder) return null;
    var study = imagingStudies.find(function(s) {
      return get(s, 'basedOn.0.reference', '').includes(get(selectedOrder, '_id', ''));
    });
    return study ? study._id : null;
  }, [selectedOrder, imagingStudies]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Box
      id="techDashboardPage"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: selectedPatient ? 'calc(100vh - 192px)' : 'calc(100vh - 128px)',
        transition: 'height 0.3s ease-in-out',
        overflow: 'hidden'
      }}
    >
      {/* Header bar */}
      <CardHeader
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
          py: 1,
          px: 2
        }}
        avatar={<MedicalServicesIcon color="secondary" />}
        title="Tech Worklist"
        titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600 } }}
        subheader="Service Requests"
        subheaderTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={density === 'compact' ? 'Standard density' : 'Compact density'}>
              <IconButton
                size="small"
                onClick={function() { setDensity(density === 'compact' ? 'standard' : 'compact'); }}
              >
                {density === 'compact' ? <DensityMediumIcon fontSize="small" /> : <DensitySmallIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        }
      />

      {error && (
        <Alert severity="warning" sx={{ mx: 2, mt: 1, flexShrink: 0 }} onClose={function() { setError(null); }}>
          {error}
        </Alert>
      )}

      {/* Tabs + Stat-filter tiles + Column Toggles (one combined row) */}
      <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', px: 2, flexShrink: 0, gap: 1 }}>
        <TabTiles
          tabs={tabTiles}
          activeIndex={activeTab}
          onChange={function(v) {
            var tabKey = TECH_TABS[v] ? TECH_TABS[v].key : 'active';
            var newParams = new URLSearchParams(searchParams);
            newParams.set('tab', tabKey);
            setSearchParams(newParams, { replace: true });
          }}
        />
        <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
        <StatCounters
          counters={statCounters}
          activeKey={activeStatKey}
          onTileClick={function(key) {
            // Toggle: clicking the active tile (or 'total') clears the filter.
            setActiveStatKey(function(prev) {
              return (prev === key || key === 'total') ? null : key;
            });
          }}
        />
        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
          <Tooltip title="Patient Name">
            <IconButton size="small" onClick={function() { toggleColumn('patientDisplay'); }}
              color={columnVisibility.patientDisplay ? 'primary' : 'default'}>
              <PersonIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Patient ID">
            <IconButton size="small" onClick={function() { toggleColumn('patientId'); }}
              color={columnVisibility.patientId ? 'primary' : 'default'}>
              <BadgeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="ImagingStudy ID">
            <IconButton size="small" onClick={function() { toggleColumn('imagingStudyId'); }}
              color={columnVisibility.imagingStudyId ? 'primary' : 'default'}>
              <ImageIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Body Part">
            <IconButton size="small" onClick={function() { toggleColumn('bodySite'); }}
              color={columnVisibility.bodySite ? 'primary' : 'default'}>
              <AccessibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Worklist table */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          p: density === 'standard' ? 1.5 : 0,
          mr: selectedOrder ? { xs: 0, sm: '480px' } : 0,
          transition: 'margin-right 225ms cubic-bezier(0, 0, 0.2, 1)'
        }}
      >
        <WorklistTable
          columns={visibleColumns}
          data={tabFilteredData}
          isLoading={isLoading}
          emptyMessage="No imaging orders found"
          selectedRowId={selectedOrder?._id}
          onRowClick={function(row) { handleSelectOrder(row._raw); }}
          onRefresh={handleRefresh}
          highlightRow={function(row) {
            return row.priority === 'stat' || row.priority === 'asap';
          }}
          density={density}
          renderExpandedContent={renderExpandedContent}
        />
      </Box>

      {/* Workflow Drawer */}
      <WorkflowDrawer
        open={!!selectedOrder}
        onClose={handleDeselectOrder}
        title={get(selectedOrder, 'code.text', 'Imaging Order')}
        subtitle={selectedStudyId ? 'Study: ' + selectedStudyId : 'Patient: ' + get(selectedOrder, 'subject.display', 'Unknown')}
      >
        {selectedOrder && (
          <Box>
            {/* Workflow Stepper */}
            <Stepper activeStep={workflowStep} sx={{ mb: 3 }}>
              <Step>
                <StepLabel>Safety Screening</StepLabel>
              </Step>
              <Step>
                <StepLabel>Image Acquisition</StepLabel>
              </Step>
              <Step>
                <StepLabel>Complete</StepLabel>
              </Step>
            </Stepper>

            {/* Step 0: Safety Screening */}
            {workflowStep === 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Pre-Imaging Safety Screening
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  {SAFETY_QUESTIONS.map(function(question) {
                    return (
                      <Box key={question.id} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <FormControlLabel
                          sx={{ flex: 1, mr: 0 }}
                          control={
                            <Checkbox
                              size="small"
                              checked={!!screeningAnswers[question.id]}
                              onChange={function(e) {
                                var nextAnswers = {
                                  ...screeningAnswers,
                                  [question.id]: e.target.checked
                                };
                                setScreeningAnswers(nextAnswers);
                                // Patch the draft per toggle; failure is non-blocking
                                if (get(screeningResponse, 'status') === 'in-progress') {
                                  Meteor.callAsync('radiology.patchSafetyScreening', {
                                    questionnaireResponseId: screeningResponse._id,
                                    items: buildScreeningItems(nextAnswers)
                                  }).catch(function(err) {
                                    console.warn('[TechDashboard] patchSafetyScreening failed (non-blocking):', err);
                                  });
                                }
                              }}
                            />
                          }
                          label={
                            <Typography variant="body2">{question.text}</Typography>
                          }
                        />
                        {question.link && (
                          <Tooltip title={question.linkTooltip || 'More info'}>
                            <IconButton
                              size="small"
                              aria-label={question.linkTooltip || 'More info'}
                              onClick={function() { navigate(question.link); }}
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    );
                  })}
                </Paper>

                {contraindications.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningIcon />}>
                    <Typography variant="subtitle2">Contraindications Detected:</Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {contraindications.map(function(c, i) {
                        return <li key={i}><Typography variant="body2">{c}</Typography></li>;
                      })}
                    </ul>
                  </Alert>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleCompleteScreening}
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={18} /> : <CheckCircleIcon />}
                >
                  Complete Screening
                </Button>
              </Box>
            )}

            {/* Step 1: Image Acquisition */}
            {workflowStep === 1 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Image Acquisition
                </Typography>

                {!currentProcedure ? (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                      Click "Start Procedure" when ready to begin imaging.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={handleStartProcedure}
                      disabled={submitting}
                      startIcon={submitting ? <CircularProgress size={18} /> : <PlayArrowIcon />}
                    >
                      Start Procedure
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    {/* Hidden picker — uploads in-context (no navigation away) */}
                    <input
                      id="tech-acquisition-file-input"
                      type="file"
                      multiple
                      accept=".dcm,.dicom"
                      style={{ display: 'none' }}
                      onChange={function(e) {
                        var selected = Array.from(e.target.files).filter(function(f) {
                          return f.name.toLowerCase().endsWith('.dcm') || f.name.toLowerCase().endsWith('.dicom');
                        });
                        if (selected.length > 0) {
                          uploadDicomFiles(selected);
                        }
                        e.target.value = '';
                      }}
                    />

                    {acquiredFileIds.length === 0 ? (
                      /* Big upload drop-zone tile (drag/drop + click to browse) */
                      <Box
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={function() {
                          var input = document.getElementById('tech-acquisition-file-input');
                          if (input) input.click();
                        }}
                        sx={{
                          height: 360,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          gap: 0.5,
                          borderRadius: 2,
                          cursor: 'pointer',
                          mb: 2,
                          border: '2px dashed',
                          borderColor: isDragOver ? 'primary.main' : 'divider',
                          bgcolor: isDragOver ? 'action.hover' : 'transparent',
                          boxShadow: isDragOver ? '0 0 15px 3px rgba(144,202,249,0.5)' : 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
                          '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
                        }}
                      >
                        <UploadIcon sx={{ fontSize: 56, color: 'text.secondary' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Upload Images
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Drop .dcm files here to upload
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          or click to browse
                        </Typography>
                      </Box>
                    ) : (
                      /* QC viewer: uploaded images render in Cornerstone3D so
                         the tech can verify the correct files were acquired.
                         Still accepts drag/drop to add more images. */
                      <Box
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        sx={{ mb: 2 }}
                      >
                        <Box sx={{
                          height: 460,
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: '2px solid',
                          borderColor: isDragOver ? 'primary.main' : 'divider',
                          transition: 'border-color 0.2s'
                        }}>
                          <SimpleDicomViewport dicomUrls={acquiredDicomUrls} />
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                          {acquiredFileIds.length} image{acquiredFileIds.length === 1 ? '' : 's'} acquired — scroll to review
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          fullWidth
                          startIcon={<UploadIcon />}
                          sx={{ mt: 1 }}
                          onClick={function() {
                            var input = document.getElementById('tech-acquisition-file-input');
                            if (input) input.click();
                          }}
                        >
                          Upload More Images
                        </Button>
                      </Box>
                    )}

                    {/* Upload progress */}
                    {uploadState.uploading && (
                      <Alert severity="info" sx={{ mb: 2 }} icon={<UploadIcon />}>
                        Uploading {uploadState.completed} of {uploadState.total} files...
                        <LinearProgress variant="determinate" value={uploadState.progress} sx={{ mt: 1 }} />
                      </Alert>
                    )}

                    {/* Upload complete */}
                    {!uploadState.uploading && uploadState.total > 0 && uploadState.completed === uploadState.total && (
                      <Alert
                        severity={uploadState.errors.length > 0 ? 'warning' : 'success'}
                        sx={{ mb: 2 }}
                        onClose={function() { setUploadState({ uploading: false, progress: 0, total: 0, completed: 0, errors: [] }); }}
                      >
                        Uploaded {uploadState.completed - uploadState.errors.length} of {uploadState.total} files.
                        {uploadState.errors.length > 0 && ' Errors: ' + uploadState.errors.join('; ')}
                      </Alert>
                    )}

                    <Alert severity="info" sx={{ mb: 2 }}>
                      Procedure in progress. Acquire images and then complete.
                    </Alert>

                    <TextField
                      label="Acquisition Notes"
                      placeholder="Any notes about the acquisition..."
                      value={acquisitionNotes}
                      onChange={function(e) { setAcquisitionNotes(e.target.value); }}
                      multiline
                      rows={4}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                    />

                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      onClick={handleCompleteProcedure}
                      disabled={submitting}
                      startIcon={submitting ? <CircularProgress size={18} /> : <CheckCircleIcon />}
                    >
                      Complete Procedure
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {/* Step 2: Complete */}
            {workflowStep === 2 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Procedure Complete
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  Images are now available for radiologist review.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {/* View the ImagingStudy created/linked for this order (reactive) */}
                  {selectedStudyId && (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={function() { navigate(forwardHome('/dicom/viewer/' + selectedStudyId)); }}
                    >
                      View Images
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={function() { navigate('/dicom/studies'); }}
                  >
                    Browse Studies
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleDeselectOrder}
                  >
                    Return to Technologist Worklist
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={function() { navigate(forwardHome('/radiology/reading')); }}
                  >
                    View Radiologist Worklist
                  </Button>
                </Box>
              </Box>
            )}

            {/* Cancel — sticky at bottom of scroll area */}
            <Box sx={{
              position: 'sticky',
              bottom: -16,
              mx: -2,
              px: 2,
              py: 2,
              mt: 2,
              backgroundColor: 'background.paper',
              borderTop: 1,
              borderColor: 'divider'
            }}>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={function() { setShowCancelDialog(true); }}
                startIcon={<CancelIcon />}
              >
                Cancel Service Request
              </Button>
            </Box>
          </Box>
        )}
      </WorkflowDrawer>

      <Dialog
        open={showCancelDialog}
        onClose={function() { setShowCancelDialog(false); }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cancel Service Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to cancel this imaging order? This will set
            the status to "revoked" and cannot be easily undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={function() { setShowCancelDialog(false); }}>
            No, Keep Order
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelServiceRequest}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} /> : <CancelIcon />}
          >
            Yes, Cancel Order
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showDeleteDialog}
        onClose={function() { setShowDeleteDialog(false); setDeleteTarget(null); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Service Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Choose how to remove this imaging order:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Card
              onClick={function() { handleDeleteOrder('revoke'); }}
              sx={{
                flex: 1, cursor: 'pointer',
                border: '1px solid', borderColor: 'divider',
                transition: 'all 0.15s ease-in-out',
                '&:hover': { borderColor: '#ed6c02', backgroundColor: 'rgba(237,108,2,0.04)' }
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{ mb: 1, color: 'rgba(255,255,255,0.5)' }}>
                  <BlockIcon sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Revoke
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Sets status to "revoked". Record stays in the database for audit trail.
                </Typography>
              </CardContent>
            </Card>
            <Card
              onClick={function() { handleDeleteOrder('hard'); }}
              sx={{
                flex: 1, cursor: 'pointer',
                border: '1px solid', borderColor: 'divider',
                transition: 'all 0.15s ease-in-out',
                '&:hover': { borderColor: '#d32f2f', backgroundColor: 'rgba(211,47,47,0.04)' }
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{ mb: 1, color: 'rgba(255,255,255,0.5)' }}>
                  <DeleteForeverIcon sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Hard Delete
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Permanently removes the record from the database. Cannot be undone.
                </Typography>
              </CardContent>
            </Card>
          </Box>
          {deletingOrderId && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={function() { setShowDeleteDialog(false); setDeleteTarget(null); }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <LaunchAppsModal
        open={launchModalOpen}
        onClose={function() { setLaunchModalOpen(false); }}
        patient={launchPatient}
      />
    </Box>
  );
}

export default TechDashboard;
