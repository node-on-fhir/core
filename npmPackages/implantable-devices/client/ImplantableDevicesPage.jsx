// packages/implantable-devices/client/ImplantableDevicesPage.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Button,
  TextField,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Paper,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  LinearProgress,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  AvatarGroup,
  Collapse,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';
import {
  Memory as ChipIcon,
  Favorite as HeartIcon,
  Visibility as EyeIcon,
  Hearing as EarIcon,
  DirectionsWalk as LimbIcon,
  Psychology as BrainIcon,
  BloodType as VascularIcon,
  Speed as PerformanceIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  QrCode2 as UDIIcon,
  Battery80 as BatteryIcon,
  SignalCellular4Bar as SignalIcon,
  Security as SecurityIcon,
  Biotech as BioIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Timeline as TimelineIcon,
  LocalHospital as MedicalIcon,
  Engineering as CyberIcon,
  Accessible as OrthoIcon,
  Healing as ReconIcon,
  Nfc as NfcIcon,
  PregnantWoman as ReproIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// Catalog data + image base path are shared (isomorphic) with the server, which
// seeds the catalog as FHIR Device records. Category icons are JSX and stay here
// (rendered via getCategoryIcon); the shared module is plain data only.
import { DEVICE_CATALOG_DATA } from '../lib/deviceCatalog.js';

// Anatomical body images for the augmentations view, keyed off Patient.gender
// (female → gynoid, otherwise android) and theme mode (.dark / .light). Served
// from public/workflows/personal-characteristics/.
const BODY_IMAGE_BASE = '/workflows/personal-characteristics/';

// Optional 3D viewer bridge. The private @orbital/sketchfab workflow, when
// installed, registers itself into the global Package registry and hangs
// SketchfabModelViewer + resolveDefaultModel off its default export (see
// .claude/rules/fhir/package-registry.md and the patient-matching → data-importer
// Deduplicator precedent). We read it at runtime so this package carries NO
// build-time dependency on the gitignored extension — when sketchfab is absent
// the augmentations center column falls back to the anatomical image.
// Returns { SketchfabModelViewer, resolveDefaultModel } or null.
function getSketchfabViewer() {
  const registry = (typeof Package !== 'undefined' && Package) ||
    (typeof globalThis !== 'undefined' && globalThis.Package) || null;
  const mod = registry ? registry['@orbital/sketchfab'] : null;
  const Viewer = get(mod, 'SketchfabModelViewer', null) || get(mod, 'default.SketchfabModelViewer', null);
  const resolve = get(mod, 'resolveDefaultModel', null) || get(mod, 'default.resolveDefaultModel', null);
  if (Viewer && resolve) {
    return { SketchfabModelViewer: Viewer, resolveDefaultModel: resolve };
  }
  return null;
}

// Display catalog is the shared plain-data catalog. Category icons are attached
// at render time via getCategoryIcon(categoryKey) — they are not stored here.
const DEVICE_CATALOG = DEVICE_CATALOG_DATA;

// Helper function to get device icon by category
const getCategoryIcon = (category) => {
  const icons = {
    'cardiac': <HeartIcon />,
    'neural': <BrainIcon />,
    'sensory': <EyeIcon />,
    'orthopedic': <OrthoIcon />,
    'prosthetics': <LimbIcon />,
    'reconstructive': <ReconIcon />,
    'identification': <NfcIcon />,
    'monitoring': <TimelineIcon />,
    'reproductive': <ReproIcon />
  };
  return icons[category] || <ChipIcon />;
};

// Flatten a raw FHIR Device resource (as returned by
// implantableDevices.getPatientDevices) into the shape the card / detail
// markup expects. Defensive reads throughout — real patient data is sparse.
const flattenFhirDevice = (device) => {
  const implantStart = get(device, 'useStatement.timingPeriod.start', '');
  return {
    id: get(device, '_id', get(device, 'id', '')),
    name: get(device, 'deviceName.0.name', get(device, 'type.text', 'Unknown Device')),
    manufacturer: get(device, 'manufacturer', 'Unknown manufacturer'),
    model: get(device, 'modelNumber', '—'),
    type: get(device, 'type.text', '—'),
    udi: get(device, 'udiCarrier.0.carrierHRF', get(device, 'udiCarrier.0.deviceIdentifier', '—')),
    class: get(device, 'class', '—'),
    status: get(device, 'status', 'unknown'),
    implantDate: implantStart ? String(implantStart).slice(0, 10) : '—',
    connectivity: get(device, 'connectivity', '—'),
    battery: 'N/A',
    features: get(device, 'features', []),
    image: get(device, 'image'),
    cybernetic: false
  };
};

const ALLOWED_VIEWS = ['catalog', 'augmentations', 'timeline'];

export default function ImplantableDevicesPage(props) {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDevices, setExpandedDevices] = useState({});
  const [filterClass, setFilterClass] = useState('all');
  const [showRecalls, setShowRecalls] = useState(false);

  // ---- View state is driven by the ?view= query param (linkable / demoable) ----
  const [searchParams, setSearchParams] = useSearchParams();
  const rawView = searchParams.get('view');
  const viewMode = ALLOWED_VIEWS.includes(rawView) ? rawView : 'catalog';

  const setViewMode = (value) => {
    setSearchParams(function(prev) {
      const next = new URLSearchParams(prev);  // preserve other params (e.g. back)
      next.set('view', value);
      return next;
    });
  };

  // ---- Patient context (for the augmentations view) ----
  const selectedPatient = useTracker(function() { return Session.get('selectedPatient'); }, []);
  const selectedPatientId = useTracker(function() { return Session.get('selectedPatientId'); }, []);
  const [patientDevices, setPatientDevices] = useState([]);

  // ---- Selected device is driven by the ?device=<id> query param (bookmarkable) ----
  const selectedDeviceId = searchParams.get('device');
  const selectedDevice = useMemo(function() {
    if (!selectedDeviceId) return null;
    // Resolve from the static catalog first...
    for (const categoryKey of Object.keys(DEVICE_CATALOG)) {
      const found = DEVICE_CATALOG[categoryKey].devices.find(function(d) { return d.id === selectedDeviceId; });
      if (found) return { ...found, category: DEVICE_CATALOG[categoryKey].name };
    }
    // ...then from the patient's assigned devices (augmentations view).
    return patientDevices.find(function(d) { return d.id === selectedDeviceId; }) || null;
  }, [selectedDeviceId, patientDevices]);

  // Select / clear the device via the URL (preserves other params like ?view=).
  const selectDevice = (device) => {
    setSearchParams(function(prev) {
      const next = new URLSearchParams(prev);
      next.set('device', device.id);
      return next;
    });
  };
  const clearSelectedDevice = () => {
    setSearchParams(function(prev) {
      const next = new URLSearchParams(prev);
      next.delete('device');
      return next;
    });
  };

  // ---- Assign-to-patient feedback ----
  const [assigning, setAssigning] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });
  const closeSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  // Load the selected patient's real FHIR Devices. Reused on mount (effect) and
  // after assigning a device so the augmentations list refreshes immediately.
  const loadPatientDevices = async (patientId) => {
    if (!patientId) return;
    try {
      const result = await Meteor.rpc('implantableDevices.getPatientDevices', { patientId: patientId });
      setPatientDevices((result || []).map(flattenFhirDevice));
    } catch (error) {
      console.error('[ImplantableDevices] getPatientDevices error:', error); // phi-audit: ok
      setPatientDevices([]);
    }
  };

  // Load whenever the augmentations view is active and a patient is selected.
  useEffect(function() {
    if (viewMode === 'augmentations' && selectedPatientId) {
      loadPatientDevices(selectedPatientId);
    }
  }, [viewMode, selectedPatientId]);

  // ---- Auto-detect the available height for the augmentations layout so the
  // center anatomical column extends to within 20px of the app footer. Measured
  // live (grid top → footer top) so it auto-accounts for the 64/128px header,
  // the page title, and the control bar. ----
  const augContainerRef = useRef(null);
  const [augHeight, setAugHeight] = useState(null);

  useEffect(function() {
    if (viewMode !== 'augmentations' || !selectedPatient) return undefined;
    function measure() {
      const el = augContainerRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const footer = (typeof document !== 'undefined') ? document.getElementById('footer') : null;
      const bottom = footer
        ? footer.getBoundingClientRect().top
        : (typeof window !== 'undefined' ? window.innerHeight : 800);
      setAugHeight(Math.max(360, Math.round(bottom - top - 20)));
    }
    measure();
    const settle = setTimeout(measure, 350); // prominent-header has a 0.3s transition
    window.addEventListener('resize', measure);
    return function() {
      clearTimeout(settle);
      window.removeEventListener('resize', measure);
    };
  }, [viewMode, selectedPatient, selectedPatientId]);

  // Clone the selected catalog device and attach the currently-selected patient.
  const handleAssignToPatient = async () => {
    if (!selectedDevice || !selectedPatientId) return;
    setAssigning(true);
    try {
      await Meteor.rpc('implantableDevices.assignToPatient', { catalogDeviceId: selectedDevice.id, patientId: selectedPatientId });
      setAssigning(false);
      setSnackbar({ open: true, severity: 'success', message: 'Device assigned to patient' });
      // Refresh the augmentations list so the new device shows up.
      loadPatientDevices(selectedPatientId);
    } catch (error) {
      setAssigning(false);
      console.error('[ImplantableDevices] assignToPatient error:', error.error, error.reason, error); // phi-audit: ok
      setSnackbar({ open: true, severity: 'error', message: error.reason || error.message || 'Failed to assign device' });
    }
  };

  // ---- Remove an assigned device (with confirmation) ----
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    const id = get(deviceToDelete, 'id');
    if (!id) { setDeviceToDelete(null); return; }
    setDeleting(true);
    try {
      await Meteor.rpc('implantableDevices.removeDevice', { deviceId: id });
      setDeleting(false);
      setDeviceToDelete(null);
      setSnackbar({ open: true, severity: 'success', message: 'Device removed' });
      loadPatientDevices(selectedPatientId);
    } catch (error) {
      setDeleting(false);
      setDeviceToDelete(null);
      console.error('[ImplantableDevices] removeDevice error:', error.error, error.reason, error);
      setSnackbar({ open: true, severity: 'error', message: error.reason || error.message || 'Failed to remove device' });
    }
  };

  // ---- Image viewer (lightbox) ----
  const [imageViewer, setImageViewer] = useState({ open: false, src: '', alt: '' });
  const openImage = (src, alt) => {
    if (src) {
      setImageViewer({ open: true, src: src, alt: alt || '' });
    }
  };
  const closeImage = () => {
    setImageViewer({ open: false, src: '', alt: '' });
  };

  const handleDeviceSelect = (device) => {
    selectDevice(device);
  };

  const toggleDeviceExpand = (deviceId) => {
    setExpandedDevices(prev => ({
      ...prev,
      [deviceId]: !prev[deviceId]
    }));
  };

  const getFilteredDevices = () => {
    let devices = [];
    
    // Collect devices from selected category or all categories
    if (selectedCategory === 'all') {
      Object.values(DEVICE_CATALOG).forEach(category => {
        devices = [...devices, ...category.devices.map(d => ({...d, category: category.name}))];
      });
    } else if (DEVICE_CATALOG[selectedCategory]) {
      devices = DEVICE_CATALOG[selectedCategory].devices.map(d => ({
        ...d, 
        category: DEVICE_CATALOG[selectedCategory].name
      }));
    }

    // Apply search filter
    if (searchTerm) {
      devices = devices.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply class filter
    if (filterClass !== 'all') {
      devices = devices.filter(d => d.class === filterClass);
    }

    return devices;
  };

  const getDeviceStatusColor = (status) => {
    switch(status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'recalled': return 'error';
      case 'maintenance': return 'warning';
      default: return 'default';
    }
  };

  const getBatteryColor = (level) => {
    if (level > 80) return '#4caf50';
    if (level > 50) return '#ff9800';
    if (level > 20) return '#f44336';
    return '#d32f2f';
  };

  // ---------------------------------------------------------------------------
  // Render helpers — shared between the catalog and augmentations layouts.
  // ---------------------------------------------------------------------------

  // A single device card. Used as the left column of the augmentations view.
  const renderDeviceCard = (device) => (
    <Card
      key={device.id}
      sx={{
        border: device.cybernetic ? '1px solid' : 'none',
        borderColor: theme => theme.palette.primary.main,
        background: device.cybernetic
          ? theme => `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`
          : 'default',
        // Generous breathing room beside each card on very wide viewports only.
        '@media (min-width:1600px)': { mx: '100px' }
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: DEVICE_CATALOG[Object.keys(DEVICE_CATALOG).find(k =>
            DEVICE_CATALOG[k].devices.some(d => d.id === device.id)
          )]?.color }}>
            {getCategoryIcon(Object.keys(DEVICE_CATALOG).find(k =>
              DEVICE_CATALOG[k].devices.some(d => d.id === device.id)
            ))}
          </Avatar>
        }
        title={
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {device.name}
          </Typography>
        }
        subheader={device.manufacturer}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            {device.cybernetic && (
              <Chip label="CYBER" size="small" color="primary" variant="outlined" />
            )}
            {device.experimental && (
              <Chip label="EXP" size="small" color="warning" variant="outlined" />
            )}
            {device.military_grade && (
              <Chip label="MIL" size="small" color="error" variant="outlined" />
            )}
            <Tooltip title="Remove device">
              <IconButton
                size="small"
                color="error"
                aria-label="Remove device"
                onClick={() => setDeviceToDelete(device)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      />
      <CardContent>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              Model: {device.model}
            </Typography>
            <Chip
              label={`Class ${device.class}`}
              size="small"
              color={device.class === 'III' ? 'error' : device.class === 'II' ? 'warning' : 'default'}
              variant="outlined"
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">Type:</Typography>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {device.type}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption">Status:</Typography>
            <Chip
              label={device.status}
              size="small"
              color={getDeviceStatusColor(device.status)}
            />
          </Box>

          {device.battery && device.battery !== 'N/A' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption">Battery:</Typography>
                <Typography variant="caption" sx={{ color: getBatteryColor(device.battery) }}>
                  {typeof device.battery === 'number' ? `${device.battery}%` : device.battery}
                </Typography>
              </Box>
              {typeof device.battery === 'number' && (
                <LinearProgress
                  variant="determinate"
                  value={device.battery}
                  sx={{
                    height: 4,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getBatteryColor(device.battery)
                    }
                  }}
                />
              )}
            </Box>
          )}

          {device.performance && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption">Performance:</Typography>
              <Rating
                value={device.performance}
                precision={0.1}
                size="small"
                readOnly
              />
            </Box>
          )}

          <Divider />

          <Box>
            <Typography variant="caption" color="text.secondary">
              Features:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {(device.features || []).slice(0, expandedDevices[device.id] ? undefined : 2).map((feature, idx) => (
                <Chip
                  key={idx}
                  label={feature}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
              {(device.features || []).length > 2 && (
                <IconButton
                  size="small"
                  onClick={() => toggleDeviceExpand(device.id)}
                >
                  {expandedDevices[device.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Implanted: {device.implantDate}
            </Typography>
          </Box>

          {/* Device photo — placed below the Features section and allowed to
              expand to its full natural height (no cover-crop / clipping). */}
          {device.image && (
            <Box
              component="img"
              src={device.image}
              alt={device.name}
              onClick={() => openImage(device.image, device.name)}
              sx={{
                display: 'block',
                width: '100%',
                height: 'auto',
                mt: 1,
                borderRadius: 1,
                cursor: 'pointer'
              }}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  // Catalog table (the browse-all view).
  const renderCatalogTable = (devices) => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Device</TableCell>
            <TableCell>Cyber</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Manufacturer</TableCell>
            <TableCell>Class</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Battery</TableCell>
            <TableCell>Implant Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.id} hover>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  {getCategoryIcon(Object.keys(DEVICE_CATALOG).find(k =>
                    DEVICE_CATALOG[k].devices.some(d => d.id === device.id)
                  ))}
                  <Box>
                    <Typography variant="body2">{device.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {device.model}
                    </Typography>
                  </Box>
                </Stack>
              </TableCell>
              <TableCell align="center">
                {device.cybernetic && (
                  <Chip
                    label="CYBER"
                    size="small"
                    color="default"
                  />
                )}
              </TableCell>
              <TableCell>{device.type}</TableCell>
              <TableCell>{device.manufacturer}</TableCell>
              <TableCell>
                <Chip
                  label={`Class ${device.class}`}
                  size="small"
                  color={device.class === 'III' ? 'error' : device.class === 'II' ? 'warning' : 'default'}
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={device.status}
                  size="small"
                  color={getDeviceStatusColor(device.status)}
                />
              </TableCell>
              <TableCell>
                {typeof device.battery === 'number' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={device.battery}
                      sx={{ width: 50, height: 6 }}
                    />
                    <Typography variant="caption">{device.battery}%</Typography>
                  </Box>
                ) : (
                  device.battery || 'N/A'
                )}
              </TableCell>
              <TableCell>{device.implantDate}</TableCell>
              <TableCell>
                <Button
                  size="small"
                  onClick={() => handleDeviceSelect(device)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Timeline view.
  const renderTimelineView = (devices) => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Device Timeline</Typography>
      <List>
        {devices
          .slice()
          .sort((a, b) => new Date(b.implantDate) - new Date(a.implantDate))
          .map((device, index) => (
            <React.Fragment key={device.id}>
              <ListItem>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: theme => theme.palette.primary.main }}>
                    {getCategoryIcon(Object.keys(DEVICE_CATALOG).find(k =>
                      DEVICE_CATALOG[k].devices.some(d => d.id === device.id)
                    ))}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={device.name}
                  secondary={
                    <Stack spacing={0.5}>
                      <Typography variant="caption">
                        {device.type} - {device.manufacturer}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Implanted: {device.implantDate}
                      </Typography>
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <Button size="small" onClick={() => handleDeviceSelect(device)}>
                    Details
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              {index < devices.length - 1 && <Divider />}
            </React.Fragment>
          ))}
      </List>
    </Paper>
  );

  // Center column for the augmentations view. When the optional @orbital/sketchfab
  // workflow is installed, it replaces the static anatomical image with the live
  // SketchfabModelViewer showing the same model as the /chronicle Avatar panel
  // (both call the package's shared resolveDefaultModel()). Otherwise it falls back
  // to an anatomical body image keyed off the selected patient's gender.
  const renderBodyColumn = () => {
    const isDark = theme.palette.mode === 'dark';
    const gender = get(selectedPatient, 'gender', 'unknown');
    const base = gender === 'female' ? 'gynoid' : 'android';
    const bodyImage = BODY_IMAGE_BASE + base + (isDark ? '.dark' : '.light') + '.jpg';
    const patientName = get(selectedPatient, 'name.0.text',
      (get(selectedPatient, 'name.0.given.0', '') + ' ' + get(selectedPatient, 'name.0.family', '')).trim()
    ) || 'Selected patient';

    const sketchfab = getSketchfabViewer();

    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          title={sketchfab ? '3D Model' : 'Anatomical View'}
          subheader={patientName}
          titleTypographyProps={{ variant: 'subtitle1' }}
        />
        <CardContent sx={{ flex: 1, minHeight: 0, p: 0, '&:last-child': { pb: 0 } }}>
          {sketchfab ? (
            (function() {
              const SketchfabModelViewer = sketchfab.SketchfabModelViewer;
              const model = sketchfab.resolveDefaultModel();
              return (
                <SketchfabModelViewer
                  src={model.src}
                  sketchfabUid={model.sketchfabUid}
                  embedBaseUrl={model.embedBaseUrl}
                  width="100%"
                  height="100%"
                />
              );
            })()
          ) : (
            <Box
              component="img"
              src={bodyImage}
              alt={'Anatomical view (' + gender + ', ' + base + ')'}
              sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  // Right column: selected-device detail card + anatomical body image card.
  const renderDetailPanel = () => (
    <Stack spacing={2}>
      {/* Device Detail Card */}
      {selectedDevice ? (
        <Card>
          <CardHeader
            title={selectedDevice.name}
            subheader={selectedDevice.manufacturer}
            action={
              <IconButton onClick={clearSelectedDevice}>
                <ExpandLessIcon />
              </IconButton>
            }
          />
          <CardContent>
            <Stack spacing={2}>
              {/* UDI Information */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Unique Device Identifier (UDI)
                </Typography>
                <Paper variant="outlined" sx={{ p: 1 }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {selectedDevice.udi}
                  </Typography>
                </Paper>
              </Box>

              {/* Device Specifications */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Specifications
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Model</TableCell>
                      <TableCell>{selectedDevice.model}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>{selectedDevice.type}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Class</TableCell>
                      <TableCell>
                        <Chip
                          label={`FDA Class ${selectedDevice.class}`}
                          size="small"
                          color={selectedDevice.class === 'III' ? 'error' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Connectivity</TableCell>
                      <TableCell>{selectedDevice.connectivity}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Power</TableCell>
                      <TableCell>
                        {typeof selectedDevice.battery === 'number'
                          ? `Battery: ${selectedDevice.battery}%`
                          : selectedDevice.battery}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>

              {/* Features */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Features & Capabilities
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {(selectedDevice.features || []).map((feature, idx) => (
                    <Chip
                      key={idx}
                      label={feature}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>

              {/* Actions */}
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small" fullWidth>
                  View Manual
                </Button>
                <Button variant="outlined" size="small" fullWidth>
                  Check Recalls
                </Button>
                <Button variant="outlined" size="small" fullWidth>
                  Contact Support
                </Button>
              </Stack>

              {/* Assign the selected catalog device to the current patient */}
              <Button
                variant="contained"
                fullWidth
                startIcon={<MedicalIcon />}
                disabled={!selectedPatientId || assigning}
                onClick={handleAssignToPatient}
              >
                {assigning ? 'Assigning…' : 'Assign to Patient'}
              </Button>
              {!selectedPatientId && (
                <Typography variant="caption" color="text.secondary" align="center">
                  Select a patient to enable assignment.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" align="center">
              Select a device to view details
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Device image card (moved out of the detail card; click to enlarge) */}
      {selectedDevice && selectedDevice.image && (
        <Card>
          <CardHeader
            title="Device Image"
            titleTypographyProps={{ variant: 'subtitle1' }}
          />
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <Box
              component="img"
              src={selectedDevice.image}
              alt={selectedDevice.name}
              onClick={() => openImage(selectedDevice.image, selectedDevice.name)}
              sx={{ display: 'block', width: '100%', height: 320, objectFit: 'cover', cursor: 'pointer' }}
            />
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  const showAugmentations = viewMode === 'augmentations' && selectedPatient;

  return (
    <Box sx={{
      minHeight: '100%',
      bgcolor: theme => theme.palette.mode === 'light'
        ? theme.palette.grey[50] 
        : theme.palette.background.default,
      p: 3
    }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CyberIcon sx={{ fontSize: 40 }} />
        Implantable Device Registry - ONC §170.315(g)(7)
      </Typography>

      {/* Control Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="cardiac">Cardiac</MenuItem>
                <MenuItem value="neural">Neural</MenuItem>
                <MenuItem value="sensory">Sensory</MenuItem>
                <MenuItem value="orthopedic">Orthopedic</MenuItem>
                <MenuItem value="prosthetics">Prosthetics</MenuItem>
                <MenuItem value="reconstructive">Reconstructive</MenuItem>
                <MenuItem value="identification">Identification</MenuItem>
                <MenuItem value="monitoring">Monitoring</MenuItem>
                <MenuItem value="reproductive">Reproductive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Class</InputLabel>
              <Select
                value={filterClass}
                label="Class"
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <MenuItem value="all">All Classes</MenuItem>
                <MenuItem value="I">Class I</MenuItem>
                <MenuItem value="II">Class II</MenuItem>
                <MenuItem value="III">Class III</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, value) => value && setViewMode(value)}
              size="small"
              fullWidth
            >
              <ToggleButton value="catalog">Catalog</ToggleButton>
              <ToggleButton value="augmentations">Augmentations</ToggleButton>
              <ToggleButton value="timeline">Timeline</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              fullWidth 
              variant="contained" 
              startIcon={<UDIIcon />}
              size="small"
            >
              Scan UDI
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content Area */}
      {showAugmentations ? (
        /* Augmentations view: patient's real implanted devices flanking an
           anatomical body image — cards alternate between the left (even index)
           and right (odd index) columns around the centered body. */
        <Grid container spacing={3} ref={augContainerRef}>
          <Grid item xs={12} md={4} sx={{ alignSelf: 'flex-start' }}>
            <Typography variant="subtitle1" gutterBottom>
              Implanted Devices
            </Typography>
            {patientDevices.length === 0 ? (
              <Alert severity="info">
                No implantable devices are on record for this patient.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {patientDevices
                  .filter((device, index) => index % 2 === 0)
                  .map((device) => renderDeviceCard(device))}
              </Stack>
            )}
          </Grid>
          <Grid item xs={12} md={4} sx={{ height: augHeight ? augHeight + 'px' : undefined }}>
            {renderBodyColumn()}
          </Grid>
          <Grid item xs={12} md={4} sx={{ alignSelf: 'flex-start' }}>
            {/* Hidden heading keeps the first right-column card aligned with the
                first left-column card (which sits under the "Implanted Devices" label). */}
            <Typography variant="subtitle1" gutterBottom sx={{ visibility: 'hidden' }}>
              Implanted Devices
            </Typography>
            <Stack spacing={2}>
              {patientDevices
                .filter((device, index) => index % 2 === 1)
                .map((device) => renderDeviceCard(device))}
            </Stack>
          </Grid>
        </Grid>
      ) : (
        /* Catalog / Timeline view: the table is full-width until a device is
           selected (via VIEW / ?device=), then it shifts to an 8/4 layout with
           the detail panel. When augmentations is active with no patient
           selected, this catalog rendering is shown as the fallback. */
        <Grid container spacing={3}>
          <Grid item xs={12} md={selectedDevice ? 8 : 12}>
            {viewMode === 'timeline'
              ? renderTimelineView(getFilteredDevices())
              : renderCatalogTable(getFilteredDevices())}
          </Grid>
          {selectedDevice && (
            <Grid item xs={12} md={4}>
              {renderDetailPanel()}
            </Grid>
          )}
        </Grid>
      )}

      {/* Image viewer (lightbox) */}
      <Dialog open={imageViewer.open} onClose={closeImage} maxWidth="md" fullWidth>
        <DialogTitle>{imageViewer.alt || 'Device image'}</DialogTitle>
        <DialogContent>
          <Box
            component="img"
            src={imageViewer.src}
            alt={imageViewer.alt}
            sx={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImage}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Remove-device confirmation */}
      <Dialog open={!!deviceToDelete} onClose={() => !deleting && setDeviceToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove device?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Remove "{get(deviceToDelete, 'name', 'this device')}" from this patient's record?
            This deletes the assigned device.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeviceToDelete(null)} disabled={deleting}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign-to-patient feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}