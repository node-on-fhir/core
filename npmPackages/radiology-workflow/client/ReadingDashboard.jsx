// npmPackages/radiology-workflow/client/ReadingDashboard.jsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';
import WorkflowNavigation from '/imports/lib/WorkflowNavigation.js';
const { forwardHome } = WorkflowNavigation;
import {
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
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CardHeader,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ImageIcon from '@mui/icons-material/Image';
import NotesIcon from '@mui/icons-material/Notes';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SendIcon from '@mui/icons-material/Send';
import DensitySmallIcon from '@mui/icons-material/DensitySmall';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import PersonIcon from '@mui/icons-material/Person';
import ArticleIcon from '@mui/icons-material/Article';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import LaunchIcon from '@mui/icons-material/Launch';
import DeleteIcon from '@mui/icons-material/Delete';

import WorklistTable from './components/WorklistTable.jsx';
import TatDisplay from './components/TatDisplay.jsx';
import RowActionIcons from './components/RowActionIcons.jsx';
import StatCounters from './components/StatCounters.jsx';
import TabTiles from './components/TabTiles.jsx';
import WorkflowDrawer from './components/WorkflowDrawer.jsx';
import { LaunchAppsModal } from '/imports/components/LaunchAppsModal.jsx';

const log = (Meteor.Logger ? Meteor.Logger.for('ReadingDashboard') : console);

// =============================================================================
// READING DASHBOARD - RADIOLOGIST INTERPRETATION & REPORTING
// =============================================================================
//
// Phases 4-7 of radiology workflow:
// - View available ImagingStudies (worklist)
// - Open studies in DICOM viewer
// - Create Observations (findings)
// - Create RiskAssessment (if applicable)
// - Sign DiagnosticReport
// =============================================================================

// Common radiology finding codes (simplified for demo)
const FINDING_OPTIONS = [
  { code: 'normal', display: 'No significant abnormality' },
  { code: 'mass', display: 'Mass/nodule identified' },
  { code: 'fracture', display: 'Fracture identified' },
  { code: 'consolidation', display: 'Pulmonary consolidation' },
  { code: 'effusion', display: 'Pleural effusion' },
  { code: 'calcification', display: 'Calcification' },
  { code: 'artifact', display: 'Motion artifact' },
  { code: 'other', display: 'Other finding' }
];

// Default structured radiology report template
const DEFAULT_REPORT_TEMPLATE = `EXAMINATION:

CLINICAL INDICATION:

COMPARISON:
None available.

TECHNIQUE:

FINDINGS:

IMPRESSION:
`;

// Tab definitions
const READING_TABS = [
  { label: 'All', filter: function() { return true; } },
  { label: 'Unread', filter: function(s) { return s._readingStatus === 'unread'; } },
  { label: 'In Progress', filter: function(s) { return s._readingStatus === 'in-progress'; } },
  { label: 'Reported', filter: function(s) { return s._readingStatus === 'reported'; } }
];

function getReadingStatusChipColor(status) {
  const map = {
    'unread': 'info',
    'in-progress': 'warning',
    'reported': 'success'
  };
  return map[status] || 'default';
}

function hasLinkedGridfsFiles(study) {
  if (!study || !study.series || !Array.isArray(study.series)) {
    return false;
  }

  for (let i = 0; i < study.series.length; i++) {
    const series = study.series[i];
    if (series.instance && Array.isArray(series.instance)) {
      for (let j = 0; j < series.instance.length; j++) {
        const instance = series.instance[j];
        const extensions = instance.extension || [];
        for (let k = 0; k < extensions.length; k++) {
          if (extensions[k].url === 'gridfsFileId' && extensions[k].valueString) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

function ReadingDashboard() {
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [findings, setFindings] = useState([]);
  const [newFinding, setNewFinding] = useState({ code: '', valueString: '' });
  const [conclusion, setConclusion] = useState('');
  const [showFindingDialog, setShowFindingDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  // Active stat-tile quick filter (null = none); set by clicking a stat tile.
  const [activeStatKey, setActiveStatKey] = useState(null);
  const [density, setDensity] = useState('standard');
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [launchPatient, setLaunchPatient] = useState(null);
  const [launchImagingStudyId, setLaunchImagingStudyId] = useState(null);
  const [launchGridfsFileId, setLaunchGridfsFileId] = useState(null);

  // ---------------------------------------------------------------------------
  // Data subscriptions
  // ---------------------------------------------------------------------------
  const {
    studies,
    serviceRequestMap,
    reportedStudyIds,
    inProgressStudyIds,
    reportMap,
    isLoading
  } = useTracker(function() {
    const selectedPatientId = Session.get('selectedPatientId');

    let studiesQuery = {};
    if (selectedPatientId) {
      studiesQuery['subject.reference'] = 'Patient/' + selectedPatientId;
    }
    const studiesHandle = Meteor.subscribe('radiology.ImagingStudies', studiesQuery, { limit: 200 });
    Meteor.subscribe('radiology.ServiceRequests', {
      'category.coding.code': '363679005'
    }, { limit: 200 });
    Meteor.subscribe('radiology.DiagnosticReports', {
      'category.coding.code': 'RAD'
    }, { limit: 200 });

    const ImagingStudies = Meteor.Collections?.ImagingStudies;
    const DiagnosticReports = Meteor.Collections?.DiagnosticReports;
    const ServiceRequests = Meteor.Collections?.ServiceRequests;

    let allStudies = [];
    let srMap = {};
    let reportedIds = new Set();
    let inProgressIds = new Set();
    let repMap = {};

    if (ImagingStudies) {
      let localQuery = {};
      if (selectedPatientId) {
        localQuery['subject.reference'] = 'Patient/' + selectedPatientId;
      }
      allStudies = ImagingStudies.find(localQuery, { sort: { started: -1 } }).fetch();
    }

    if (DiagnosticReports) {
      DiagnosticReports.find({ 'category.coding.code': 'RAD' }).forEach(function(report) {
        const studyRef = get(report, 'imagingStudy.0.reference', '');
        const studyId = studyRef.replace('ImagingStudy/', '');
        if (studyId) {
          repMap[studyId] = report;
          if (report.status === 'final') {
            reportedIds.add(studyId);
          } else if (report.status === 'preliminary') {
            inProgressIds.add(studyId);
          }
        }
      });
    }

    if (ServiceRequests) {
      ServiceRequests.find({ 'category.coding.code': '363679005' }).forEach(function(sr) {
        srMap[sr._id] = sr;
      });
    }

    return {
      studies: allStudies,
      serviceRequestMap: srMap,
      reportedStudyIds: reportedIds,
      inProgressStudyIds: inProgressIds,
      reportMap: repMap,
      isLoading: !studiesHandle.ready()
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Flatten studies with reading status + order context
  // ---------------------------------------------------------------------------
  const flattenedStudies = useMemo(function() {
    return studies.map(function(study) {
      // Determine reading status
      let readingStatus = 'unread';
      if (reportedStudyIds.has(study._id)) {
        readingStatus = 'reported';
      } else if (inProgressStudyIds.has(study._id)) {
        readingStatus = 'in-progress';
      }

      // Cross-reference ServiceRequest for priority and indication
      const basedOnRef = get(study, 'basedOn.0.reference', '');
      const serviceRequestId = basedOnRef.replace('ServiceRequest/', '');
      const serviceRequest = serviceRequestMap[serviceRequestId];

      return {
        _id: get(study, '_id', ''),
        id: get(study, 'id', ''),
        status: get(study, 'status', ''),
        patientDisplay: get(study, 'subject.display', get(study, 'subject.reference', '').replace('Patient/', '')),
        started: get(study, 'started', ''),
        modality: get(study, 'modality.0.code', ''),
        description: get(study, 'description', ''),
        numberOfSeries: get(study, 'numberOfSeries', 0),
        numberOfInstances: get(study, 'numberOfInstances', 0),
        barcode: get(study, '_id', ''),
        priority: get(serviceRequest, 'priority', ''),
        reasonCode: get(serviceRequest, 'reasonCode.0.text', get(serviceRequest, 'reasonCode.0.coding.0.display', '')),
        _readingStatus: readingStatus,
        _reportId: get(reportMap[study._id], '_id', null),
        _report: reportMap[study._id] || null,
        _raw: study,
        _serviceRequest: serviceRequest
      };
    });
  }, [studies, reportedStudyIds, inProgressStudyIds, serviceRequestMap, reportMap]);

  // ---------------------------------------------------------------------------
  // STAT counters — also serve as clickable quick filters (key + filter fn)
  // ---------------------------------------------------------------------------
  const statCounters = useMemo(function() {
    const now = Date.now();
    const isUnread = function(s) { return s._readingStatus === 'unread'; };
    const isStat = function(s) { return s.priority === 'stat' || s.priority === 'asap'; };
    const isOver4h = function(s) {
      return s.started && s._readingStatus === 'unread'
        && (now - new Date(s.started).getTime()) > 4 * 3600000;
    };

    return [
      { key: 'unread', label: 'Unread', count: flattenedStudies.filter(isUnread).length, color: 'info', filter: isUnread },
      { key: 'stat', label: 'STAT', count: flattenedStudies.filter(isStat).length, color: 'error', filter: isStat },
      { key: 'over4h', label: '>4h TAT', count: flattenedStudies.filter(isOver4h).length, color: 'error', filter: isOver4h },
      // 'Total' has no filter — clicking it clears the active stat filter.
      { key: 'total', label: 'Total', count: flattenedStudies.length, color: undefined }
    ];
  }, [flattenedStudies]);

  // ---------------------------------------------------------------------------
  // Tab-filtered data (tab filter AND active stat-tile filter; orthogonal)
  // ---------------------------------------------------------------------------
  const tabFilteredData = useMemo(function() {
    const tabDef = READING_TABS[activeTab];
    let rows = tabDef ? flattenedStudies.filter(tabDef.filter) : flattenedStudies;
    if (activeStatKey) {
      const statDef = statCounters.find(function(s) { return s.key === activeStatKey; });
      if (statDef && typeof statDef.filter === 'function') {
        rows = rows.filter(statDef.filter);
      }
    }
    return rows;
  }, [flattenedStudies, activeTab, activeStatKey, statCounters]);

  // Tab tiles — each READING_TAB becomes a clickable count tile (acts as the tab)
  const tabTiles = useMemo(function() {
    return READING_TABS.map(function(tab) {
      return {
        key: tab.label,
        label: tab.label,
        count: flattenedStudies.filter(tab.filter).length
      };
    });
  }, [flattenedStudies]);

  // ---------------------------------------------------------------------------
  // Column definitions
  // ---------------------------------------------------------------------------
  const readingColumns = [
    {
      key: 'actions',
      label: '',
      width: 100,
      render: function(val, row) {
        return (
          <RowActionIcons
            row={row}
            actions={[
              {
                icon: <VisibilityIcon fontSize="small" />,
                tooltip: 'Open Viewer',
                color: 'primary',
                onClick: function(r) { navigate(forwardHome('/dicom/viewer/' + r._id + '?previous=/radiology/reading')); },
                disabled: function(r) { return !hasLinkedGridfsFiles(r._raw); }
              },
              {
                icon: <InfoIcon fontSize="small" />,
                tooltip: 'View Details',
                onClick: function(r) { handleSelectStudy(r._raw); }
              },
              {
                icon: <CompareArrowsIcon fontSize="small" />,
                tooltip: 'Compare Priors',
                onClick: function(r) { navigate('/dicom/studies?patient=' + get(r, 'patientDisplay', '')); }
              },
              {
                icon: <DeleteIcon fontSize="small" />,
                tooltip: 'Delete Study',
                color: 'error',
                onClick: function(r) { handleDeleteStudy(r._id); }
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
        return <TatDisplay startTime={row.started} size="small" />;
      }
    },
    {
      key: '_readingStatus',
      label: 'Status',
      width: 100,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'unread', label: 'Unread' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'reported', label: 'Reported' }
      ],
      render: function(val) {
        return (
          <Chip
            label={(val || 'unread').replace('-', ' ')}
            size="small"
            color={getReadingStatusChipColor(val)}
            variant="outlined"
            sx={{ textTransform: 'capitalize' }}
          />
        );
      }
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
                onClick={function(e) {
                  e.stopPropagation();
                  handleSelectPatient(row);
                }}
                sx={{ p: 0.25 }}
              >
                <PersonIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
            <Typography variant="body2" noWrap>
              {val || '-'}
            </Typography>
          </Box>
        );
      }
    },
    {
      key: 'started',
      label: 'Study Date',
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
      key: 'description',
      label: 'Study Description',
      filterable: true,
      filterType: 'text'
    },
    {
      key: 'numberOfSeries',
      label: 'Series',
      width: 60,
      sortable: true
    },
    {
      key: 'numberOfInstances',
      label: 'Images',
      width: 60,
      sortable: true
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
    },
    {
      key: '_reportId',
      label: 'Report',
      width: 70,
      render: function(val) {
        if (!val) return <Typography variant="caption">-</Typography>;
        return (
          <Tooltip title="View Diagnostic Report">
            <IconButton
              size="small"
              onClick={function(e) {
                e.stopPropagation();
                navigate('/diagnostic-reports/' + val + '?view=page');
              }}
            >
              <ArticleIcon fontSize="small" color="success" />
            </IconButton>
          </Tooltip>
        );
      }
    }
  ];

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------
  async function handleDeleteStudy(studyId) {
    if (!window.confirm('Are you sure you want to delete this imaging study?')) return;
    try {
      await Meteor.callAsync('removeImagingStudy', studyId);
      console.log('[ReadingDashboard] Deleted imaging study:', studyId);
    } catch (err) {
      console.error('[ReadingDashboard] Error deleting imaging study:', err);
    }
  }

  function handleSelectStudy(study) {
    setSelectedStudy(study);
    setError(null);
    setSuccess(null);

    // Check if this study already has a signed report
    const existingReport = reportMap[study._id];
    if (existingReport && existingReport.conclusion) {
      setConclusion(existingReport.conclusion);
      const existingFindings = (existingReport.result || []).map(function(ref) {
        const obsId = get(ref, 'reference', '').replace('Observation/', '');
        return { _id: obsId, code: '', display: get(ref, 'display', 'Finding'), note: '' };
      });
      setFindings(existingFindings);
    } else {
      setConclusion(DEFAULT_REPORT_TEMPLATE);
      setFindings([]);
    }
  }

  async function handleAddFinding() {
    if (!newFinding.code || !selectedStudy) return;

    setSubmitting(true);
    setError(null);

    try {
      const patientId = get(selectedStudy, 'subject.reference', '').replace('Patient/', '');
      const findingOption = FINDING_OPTIONS.find(function(f) { return f.code === newFinding.code; });

      const observationId = await Meteor.callAsync('radiology.addFinding', {
        imagingStudyId: selectedStudy._id,
        patientId: patientId,
        code: newFinding.code,
        codeDisplay: findingOption?.display || newFinding.code,
        valueString: newFinding.valueString,
        note: newFinding.valueString
      });

      console.log('[ReadingDashboard] Added finding:', observationId);

      setFindings([...findings, {
        _id: observationId,
        code: newFinding.code,
        display: findingOption?.display || newFinding.code,
        note: newFinding.valueString
      }]);

      setNewFinding({ code: '', valueString: '' });
      setShowFindingDialog(false);
    } catch (err) {
      console.error('[ReadingDashboard] Error adding finding:', err);
      setError(err.reason || err.message || 'Failed to add finding');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignReport() {
    if (!selectedStudy || !conclusion.trim()) {
      setError('Please enter a conclusion before signing');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const patientId = get(selectedStudy, 'subject.reference', '').replace('Patient/', '');
      const basedOnRef = get(selectedStudy, 'basedOn.0.reference', '');
      const serviceRequestId = basedOnRef.replace('ServiceRequest/', '');
      const procedureRef = get(selectedStudy, 'procedureReference.reference', '');
      const procedureId = procedureRef.replace('Procedure/', '');

      const reportId = await Meteor.callAsync('radiology.signReport', {
        imagingStudyId: selectedStudy._id,
        serviceRequestId: serviceRequestId || selectedStudy._id,
        procedureId: procedureId || selectedStudy._id,
        patientId: patientId,
        observationIds: findings.map(function(f) { return f._id; }),
        conclusion: conclusion,
        conclusionCodes: findings.filter(function(f) { return f.code !== 'normal'; }).map(function(f) {
          return { code: f.code, display: f.display };
        })
      });

      console.log('[ReadingDashboard] Report signed:', reportId);

      setSuccess('Report signed successfully. ID: ' + reportId);
      setSelectedStudy(null);
      setFindings([]);
      setConclusion('');
    } catch (err) {
      console.error('[ReadingDashboard] Error signing report:', err);
      setError(err.reason || err.message || 'Failed to sign report');
    } finally {
      setSubmitting(false);
    }
  }

  function handleRefresh() {
    setActiveTab(function(prev) { return prev; });
  }

  function handleSelectPatient(row) {
    const patientRef = get(row, '_raw.subject.reference', '');
    const patientId = patientRef.replace('Patient/', '');

    if (!patientId) {
      console.warn('[ReadingDashboard] No patient ID found'); // phi-audit: ok
      return;
    }

    Meteor.call('patients.findOne', patientId, function(error, patient) {
      if (error) {
        console.error('[ReadingDashboard] Error fetching patient:', error); // phi-audit: ok
        return;
      }
      if (patient) {
        Session.set('selectedPatient', patient);
        Session.set('selectedPatientId', patient.id);
        log.debug('Selected patient:', { patientId: patient.id });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Get study details for drawer
  // ---------------------------------------------------------------------------
  const selectedStudyDetails = useMemo(function() {
    if (!selectedStudy) return {};

    const basedOnRef = get(selectedStudy, 'basedOn.0.reference', '');
    const serviceRequestId = basedOnRef.replace('ServiceRequest/', '');

    return {
      serviceRequest: serviceRequestMap[serviceRequestId] || null
    };
  }, [selectedStudy, serviceRequestMap]);

  // ---------------------------------------------------------------------------
  // Expanded row content (accordion)
  // ---------------------------------------------------------------------------
  function renderExpandedContent(row) {
    var rawStudy = row._raw;
    var patientRef = get(rawStudy, 'subject.reference', '');
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
            // Extract first gridfsFileId from study
            var firstFileId = null;
            if (rawStudy && rawStudy.series) {
              for (var si = 0; si < rawStudy.series.length && !firstFileId; si++) {
                var instances = get(rawStudy, 'series.' + si + '.instance', []);
                for (var ii = 0; ii < instances.length && !firstFileId; ii++) {
                  var exts = instances[ii].extension || [];
                  for (var ei = 0; ei < exts.length; ei++) {
                    if (exts[ei].url === 'gridfsFileId' && exts[ei].valueString) {
                      firstFileId = exts[ei].valueString;
                      break;
                    }
                  }
                }
              }
            }
            setLaunchImagingStudyId(get(rawStudy, '_id', null));
            setLaunchGridfsFileId(firstFileId);

            if (patientId) {
              Meteor.call('patients.findOne', patientId, function(err, patient) {
                if (patient) {
                  setLaunchPatient(patient);
                } else {
                  log.warn('patients.findOne returned null for patientId - using fallback', { patientId });
                  setLaunchPatient({
                    _id: patientId,
                    id: patientId,
                    name: get(rawStudy, 'subject.display', '')
                  });
                }
                setLaunchModalOpen(true);
              });
            }
          }}
        >
          Launch
        </Button>

        <Button variant="contained" size="small" color="primary" startIcon={<VisibilityIcon />}
          onClick={function(e) {
            e.stopPropagation();
            handleSelectStudy(rawStudy);
          }}
        >
          Read Study
        </Button>
      </Stack>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Box
      id="readingDashboardPage"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 128px)',
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
        avatar={<ImageIcon color="error" />}
        title="Reading Worklist"
        titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600 } }}
        subheader="Imaging Studies"
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
        <Alert severity="error" sx={{ mx: 2, mt: 1, flexShrink: 0 }} onClose={function() { setError(null); }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mx: 2, mt: 1, flexShrink: 0 }} onClose={function() { setSuccess(null); }}>
          {success}
        </Alert>
      )}

      {/* Tabs + Stat-filter tiles (one combined row) */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TabTiles
          tabs={tabTiles}
          activeIndex={activeTab}
          onChange={function(v) { setActiveTab(v); }}
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
      </Box>

      {/* Worklist table */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          p: density === 'standard' ? 1.5 : 0,
          mr: selectedStudy ? { xs: 0, sm: '480px' } : 0,
          transition: 'margin-right 225ms cubic-bezier(0, 0, 0.2, 1)'
        }}
      >
        <WorklistTable
          columns={readingColumns}
          data={tabFilteredData}
          isLoading={isLoading}
          emptyMessage="No studies found"
          selectedRowId={selectedStudy?._id}
          onRowClick={function(row) { handleSelectStudy(row._raw); }}
          onRefresh={handleRefresh}
          highlightRow={function(row) {
            return row.priority === 'stat' || row.priority === 'asap';
          }}
          density={density}
          renderExpandedContent={renderExpandedContent}
        />
      </Box>

      {/* Reading Panel Drawer */}
      <WorkflowDrawer
        open={!!selectedStudy}
        onClose={function() { setSelectedStudy(null); }}
        title={get(selectedStudy, 'modality.0.code', 'Unknown') + ' Study'}
        subtitle={'Patient: ' + get(selectedStudy, 'subject.display', 'Unknown')}
      >
        {selectedStudy && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Open Viewer button */}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={function() { navigate(forwardHome('/dicom/viewer/' + selectedStudy._id + '?previous=/radiology/reading')); }}
              disabled={!hasLinkedGridfsFiles(selectedStudy)}
              startIcon={<VisibilityIcon />}
              sx={{ mb: 2 }}
            >
              Open Viewer
            </Button>

            {/* Study Info */}
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Study Info</Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Modality</Typography>
                  <Typography variant="body2">{get(selectedStudy, 'modality.0.code', '-')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Started</Typography>
                  <Typography variant="body2">
                    {selectedStudy.started ? new Date(selectedStudy.started).toLocaleString() : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Series</Typography>
                  <Typography variant="body2">{selectedStudy.numberOfSeries || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Images</Typography>
                  <Typography variant="body2">{selectedStudy.numberOfInstances || 0}</Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Order Context */}
            {selectedStudyDetails.serviceRequest && (
              <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Order Context</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Priority</Typography>
                    <Typography variant="body2">
                      {get(selectedStudyDetails.serviceRequest, 'priority', 'routine').toUpperCase()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Clinical Indication</Typography>
                    <Typography variant="body2">
                      {get(selectedStudyDetails.serviceRequest, 'reasonCode.0.text',
                        get(selectedStudyDetails.serviceRequest, 'reasonCode.0.coding.0.display', '-'))}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Findings */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">
                  Findings ({findings.length})
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={function() { setShowFindingDialog(true); }}
                >
                  Add
                </Button>
              </Box>

              {findings.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 1 }}>
                  No findings added yet
                </Typography>
              ) : (
                <List dense disablePadding>
                  {findings.map(function(finding, index) {
                    return (
                      <ListItem
                        key={index}
                        sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 0.5, py: 0.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {finding.code === 'normal' ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <WarningAmberIcon color="warning" fontSize="small" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography variant="body2">{finding.display}</Typography>}
                          secondary={finding.note}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Conclusion / Impression */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                <NotesIcon fontSize="small" /> Impression
              </Typography>
              <TextField
                id="conclusionInput"
                placeholder="Enter your diagnostic impression..."
                value={conclusion}
                onChange={function(e) { setConclusion(e.target.value); }}
                multiline
                minRows={6}
                fullWidth
                size="small"
                sx={{
                  flex: 1,
                  '& .MuiInputBase-root': {
                    height: '100%',
                    alignItems: 'flex-start'
                  },
                  '& textarea': {
                    height: '100% !important',
                    overflow: 'auto !important'
                  }
                }}
              />

              <Button
                variant="contained"
                color="success"
                fullWidth
                onClick={handleSignReport}
                disabled={submitting || !conclusion.trim()}
                startIcon={submitting ? <CircularProgress size={18} /> : <SendIcon />}
                sx={{ flexShrink: 0, mt: 2 }}
              >
                Sign Report
              </Button>
            </Box>
          </Box>
        )}
      </WorkflowDrawer>

      {/* Add Finding Dialog */}
      <Dialog
        open={showFindingDialog}
        onClose={function() { setShowFindingDialog(false); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Finding</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Finding Type</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {FINDING_OPTIONS.map(function(option) {
                  return (
                    <Chip
                      key={option.code}
                      label={option.display}
                      onClick={function() { setNewFinding({ ...newFinding, code: option.code }); }}
                      color={newFinding.code === option.code ? 'primary' : 'default'}
                      variant={newFinding.code === option.code ? 'filled' : 'outlined'}
                    />
                  );
                })}
              </Box>
            </Box>

            <TextField
              label="Details / Notes"
              placeholder="Additional details about this finding..."
              value={newFinding.valueString}
              onChange={function(e) { setNewFinding({ ...newFinding, valueString: e.target.value }); }}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={function() { setShowFindingDialog(false); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddFinding}
            disabled={submitting || !newFinding.code}
          >
            {submitting ? <CircularProgress size={24} /> : 'Add Finding'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Launch Apps Modal */}
      <LaunchAppsModal
        open={launchModalOpen}
        onClose={function() { setLaunchModalOpen(false); }}
        patient={launchPatient}
        imagingStudyId={launchImagingStudyId}
        gridfsFileId={launchGridfsFileId}
      />
    </Box>
  );
}

export default ReadingDashboard;
