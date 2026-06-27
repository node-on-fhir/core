// /packages/pacio-core/client/pages/ExamRoomPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { useSubscribe } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import moment from 'moment';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  AvatarGroup,
  Tooltip,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Menu
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalHospital as LocalHospitalIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocationOn as LocationOnIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  SwapHoriz as SwapHorizIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarTodayIcon,
  Hotel as HotelIcon,
  PersonOff as PersonOffIcon,
  Cleaning as CleaningIcon,
  Build as BuildIcon,
  Emergency as EmergencyIcon,
  Notifications as NotificationsIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  Circle as CircleIcon,
  Info as InfoIcon,
  LocalPharmacy as LocalPharmacyIcon,
  Flare as FlareIcon,
  RocketLaunch as RocketLaunchIcon,
  PhotoCamera as PhotoCameraIcon,
  Map as MapIcon
} from '@mui/icons-material';
import LocationMap from '../components/LocationMap';
import { Beds } from '../../lib/collections/BedsCollection';
import { SearchPatientsModalDialog } from '../components/SearchPatientsModalDialog';
import { resolveVehicleConfig } from '../../lib/utilities/VehicleConfigResolver';

// Access Communications from global namespace (initialized by main app)
// Packages cannot directly import from /imports/ with Meteor 3 + RSPack
let Communications;
if (Meteor.isClient) {
  Communications = window.Communications || get(Meteor, 'Collections.Communications');
}

// Inspirational quotes for healthcare
const inspirationalQuotes = [
  {
    text: "Wherever the art of medicine is loved, there is also a love of humanity.",
    author: "Hippocrates"
  },
  {
    text: "The best way to find yourself is to lose yourself in the service of others.",
    author: "Mahatma Gandhi"
  },
  {
    text: "To cure sometimes, to relieve often, to comfort always.",
    author: "Edward Trudeau"
  },
  {
    text: "The good physician treats the disease; the great physician treats the patient who has the disease.",
    author: "William Osler"
  },
  {
    text: "Medicine is not only a science; it is also an art. It does not consist of compounding pills and plasters; it deals with the very processes of life.",
    author: "Paracelsus"
  },
  {
    text: "The secret of patient care is caring for the patient.",
    author: "Francis Peabody"
  },
  {
    text: "It is more important to know what sort of person has a disease than to know what sort of disease a person has.",
    author: "Hippocrates"
  },
  {
    text: "In nothing do men more nearly approach the gods than in giving health to men.",
    author: "Cicero"
  }
];

export function ExamRoomPage() {
  // Access useNavigate from Meteor object (packages can't directly import from react-router-dom)
  const useNavigate = Meteor.useNavigate;
  const navigate = useNavigate ? useNavigate() : () => console.warn('useNavigate not available');

  // Get Honeycomb theme for dark mode support
  const useAppTheme = Meteor.useTheme;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors for cards and papers
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const paperBgColor = isDark ? '#2a2a2a' : '#f5f5f5';

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [columnCount, setColumnCount] = useState(2);
  const [displayMode, setDisplayMode] = useState('regular');
  const [bedStatusHeight, setBedStatusHeight] = useState(600);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [selectedBedId, setSelectedBedId] = useState(null);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuBedId, setMenuBedId] = useState(null);
  const [vehicleImageError, setVehicleImageError] = useState(false);

  const [showPhoto, setShowPhoto] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [hasMapApiKey, setHasMapApiKey] = useState(false);

  // Track authentication status
  const userId = useTracker(() => Meteor.userId());
  const user = useTracker(() => Meteor.user());

  // Check if Google Maps API key is configured
  useEffect(function() {
    async function checkMapApiKey() {
      try {
        const key = await Meteor.callAsync('pacio.getGoogleMapsApiKey');
        if (key) {
          setHasMapApiKey(true);
        }
      } catch (err) {
        console.log('[ExamRoomPage] No Google Maps API key configured');
        setHasMapApiKey(false);
      }
    }
    checkMapApiKey();
  }, []);

  // Rotate through quotes
  useEffect(() => {
    // Only rotate quotes when user is not logged in
    if (!userId) {
      const interval = setInterval(() => {
        setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % inspirationalQuotes.length);
      }, 15000); // Change quote every 15 seconds

      return () => clearInterval(interval);
    }
  }, [userId]);

  // Initialize column count and display mode from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const columnsParam = params.get('columns');
    if (columnsParam === '1' || columnsParam === '2') {
      setColumnCount(parseInt(columnsParam, 10));
    }
    const displayParam = params.get('display');
    if (displayParam === 'compact' || displayParam === 'regular') {
      setDisplayMode(displayParam);
    }
  }, []);

  // Handle column toggle and update URL
  const handleColumnToggle = (event, newColumnCount) => {
    if (newColumnCount !== null) {
      setColumnCount(newColumnCount);
      // Update URL without page reload
      const url = new URL(window.location);
      url.searchParams.set('columns', newColumnCount);
      window.history.pushState({}, '', url);
    }
  };

  // Handle display mode toggle and update URL
  const handleDisplayToggle = (event, newDisplayMode) => {
    if (newDisplayMode !== null) {
      setDisplayMode(newDisplayMode);
      const url = new URL(window.location);
      url.searchParams.set('display', newDisplayMode);
      window.history.pushState({}, '', url);
    }
  };

  const handleCardVisibilityToggle = (event, newVisible) => {
    setShowPhoto(newVisible.includes('photo'));
    setShowMap(newVisible.includes('map'));
    setShowAlerts(newVisible.includes('alerts'));
  };

  // Calculate dynamic height for bed status area
  useEffect(() => {
    const calculateHeight = () => {
      // Header ~80px, Top metrics ~120px, padding ~32px, margin ~32px
      const reservedHeight = 80 + 120 + 32 + 32;
      const availableHeight = window.innerHeight - reservedHeight;
      setBedStatusHeight(Math.max(400, availableHeight)); // Minimum 400px
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);

    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  // Subscribe to beds and patients data
  const bedsLoading = useSubscribe('pacio.beds');
  const patientsLoading = useSubscribe('pacio.patients');

  // Get practitioner ID through secure method
  const [practitionerId, setPractitionerId] = useState(null);

  useEffect(() => {
    if (userId) {
      Meteor.call('users.getCurrentPractitionerId', (error, result) => {
        if (error) {
          console.error('Error getting practitioner ID:', error);
        } else {
          console.log('Fetched practitioner ID:', result);
          setPractitionerId(result);
        }
      });
    }
  }, [userId]);

  // Subscribe to communications for the current practitioner
  // Server will look up practitionerId if not provided
  const communicationsLoading = useSubscribe('communications.byRecipient');

  // Also subscribe to all communications for debugging
  const allCommunicationsLoading = useSubscribe('communications', 100);

  // Subscribe to SWPC space weather alerts
  const swpcAlertsLoading = useSubscribe('orbital.spaceWeatherAlerts', {}, {});

  // Fetch Chief Medical Officer data
  const chiefMedicalOfficer = useTracker(() => {
    const Practitioners = get(Meteor, 'Collections.Practitioners');
    if (!Practitioners) {
      console.warn('Practitioners collection not available');
      return null;
    }

    // Find practitioner with Chief Medical Officer role
    // You may need to adjust this query based on your actual data structure
    const cmo = Practitioners.findOne({
      $or: [
        { 'qualification.code.text': 'Chief Medical Officer' },
        { 'qualification.code.coding.display': 'Chief Medical Officer' },
        { 'name.text': { $regex: /chief.*medical.*officer/i } }
      ]
    });

    if (!cmo) {
      // Fallback: try to find any practitioner with MD qualification
      return Practitioners.findOne({
        'qualification.code.text': { $regex: /MD|M\.D\.|Doctor/i }
      });
    }

    return cmo;
  }, []);

  // Track selected crewed vehicle from Session (set by CrewedVehiclesPage or boot hydration)
  const selectedCrewedVehicle = useTracker(() => Session.get('selectedCrewedVehicle'), []);
  const vehicleConfig = resolveVehicleConfig(selectedCrewedVehicle);

  // Reset vehicle image error when vehicle changes
  useEffect(() => {
    setVehicleImageError(false);
  }, [vehicleConfig.vehicleFhirId]);

  // Fetch data from collections - trust the cursor
  const facilityData = useTracker(() => {
    // Simply get beds from the collection - all data is already there
    const beds = Beds.find({}).fetch();

    // Ensure beds is always an array
    const validBeds = Array.isArray(beds) ? beds : [];

    // Get maxBeds from vehicleConfig (resolved from vehicle or settings)
    const maxBeds = vehicleConfig.maxBeds;

    // Limit beds to maxBeds setting
    const limitedBeds = validBeds.slice(0, maxBeds);

    // Debug log to check beds data
    if (limitedBeds.length > 0) {
      console.log('Sample bed data:', limitedBeds[0]);
    } else {
      console.log('No beds found in collection');
    }

    // Calculate occupied beds (from limited set)
    const occupiedBeds = limitedBeds.filter(bed => bed && bed.status === 'occupied').length;
    const totalBeds = limitedBeds.length || maxBeds;

    return {
      facility: {
        id: 'mh-001',
        name: vehicleConfig.facilityName,
        type: 'Medical Home',
        address: vehicleConfig.facilityAddress,
        lat: 39.7895,
        lng: -89.6387,
        totalBeds: totalBeds,
        occupiedBeds: occupiedBeds,
        staff: {
          nurses: 3,
          cnas: 4,
          therapists: 2,
          other: 2
        }
      },
      beds: limitedBeds,
      recentAlerts: (() => {
        console.log('PractitionerId:', practitionerId);
        console.log('User isPractitioner:', user?.profile?.isPractitioner);
        console.log('Communications collection available:', !!Communications);

        // If Communications not available, return empty array
        if (!Communications) {
          console.log('Communications collection not available');
          return [];
        }

        // The server publication already filters based on practitioner status
        // We just need to filter for active alerts
        console.log('Looking for alert communications');

        // Simple query - server already filtered by recipient
        const query = {
          $and: [
            { status: { $in: ['in-progress', 'preparation'] } },
            { 'category.0.coding.0.code': { $in: ['intervention-approval', 'alert', 'notification'] } }
          ]
        };

        console.log('Communications query:', query);

        // Debug: Check what's in the Communications collection
        const allComms = Communications.find({}).fetch();
        console.log('Total communications in collection:', allComms.length);
        console.log('All communications subscription loading:', allCommunicationsLoading.loading);
        console.log('Practitioner communications subscription loading:', communicationsLoading.loading);
        if (allComms.length > 0) {
          console.log('Sample communication:', allComms[0]);
          console.log('Communication recipients:', allComms.map(c => c.recipient));
        }

        const communications = Communications.find(query, {
          sort: { sent: -1 },
          limit: 10
        }).fetch();

        console.log('Found communications matching query:', communications);

        // Transform clinical communications into alert format
        const clinicalAlerts = communications.map((comm, index) => {
          // Extract patient info from subject
          const patientName = get(comm, 'subject.display', 'Unknown Patient');
          const bedId = get(comm, 'extension', []).find(ext =>
            ext.url === 'http://honeycomb.ai/fhir/StructureDefinition/bed-id'
          )?.valueString || 'N/A';

          // Determine alert type and priority based on category
          const category = get(comm, 'category.0.coding.0.code', 'notification');
          let type = 'medical';
          let priority = 'medium';

          if (category === 'intervention-approval') {
            type = 'medical';
            priority = 'high';
          } else if (category === 'alert') {
            type = 'call';
            priority = get(comm, 'priority', 'medium') === 'urgent' ? 'high' : 'medium';
          }

          // Get message from payload
          const message = get(comm, 'payload.0.contentString', 'New notification');

          return {
            id: comm._id,
            bedId: bedId,
            type: type,
            message: message,
            time: moment(comm.sent),
            priority: priority
          };
        });

        // Query SWPC space weather alerts
        const swpcComms = Communications.find(
          { 'category.0.coding.0.code': 'space-weather-alert' },
          { sort: { sent: -1 }, limit: 5 }
        ).fetch();

        const swpcAlerts = swpcComms.map(function(comm) {
          const contentString = get(comm, 'payload.0.contentString', '');
          const firstLine = contentString.split('\n')[0] || 'Space Weather Alert';
          const truncatedMessage = firstLine.length > 120 ? firstLine.substring(0, 120) + '...' : firstLine;

          return {
            id: comm._id,
            type: 'space-weather',
            message: truncatedMessage,
            time: moment(comm.sent),
            priority: 'medium'
          };
        });

        // Merge both arrays, sort by time descending, limit to 10
        return clinicalAlerts
          .concat(swpcAlerts)
          .sort(function(a, b) { return b.time.valueOf() - a.time.valueOf(); })
          .slice(0, 10);
      })()
    };
  });



  // Filter beds based on selection
  const filteredBeds = (facilityData.beds || []).filter(bed => {
    // Ensure bed object exists and has required properties
    if (!bed || typeof bed !== 'object') return false;

    if (selectedFilter === 'occupied' && bed.status !== 'occupied') return false;
    if (selectedFilter === 'vacant' && bed.status === 'occupied') return false;
    if (selectedFilter === 'critical' && bed.patient?.acuityLevel !== 'Critical') return false;
    if (selectedFilter === 'available' && bed.status !== 'available') return false;
    if (selectedFilter === 'cleaning' && bed.status !== 'cleaning') return false;
    if (selectedFilter === 'maintenance' && bed.status !== 'maintenance') return false;
    return true;
  });

  // Get acuity level color
  const getAcuityColor = (level) => {
    const colors = {
      'Stable': '#4caf50',
      'Monitoring': '#ff9800',
      'Critical': '#f44336'
    };
    return colors[level] || '#757575';
  };

  // Get vital status color
  const getVitalColor = (vital, value) => {
    switch(vital) {
      case 'o2':
        return value < 95 ? '#f44336' : '#4caf50';
      case 'hr':
        return (value < 60 || value > 100) ? '#ff9800' : '#4caf50';
      case 'temp':
        return (parseFloat(value) < 97.0 || parseFloat(value) > 99.5) ? '#ff9800' : '#4caf50';
      default:
        return '#4caf50';
    }
  };

  // Get alert icon
  const getAlertIcon = (type) => {
    switch(type) {
      case 'fall': return <WarningIcon color="error" />;
      case 'call': return <NotificationsIcon color="primary" />;
      case 'medical': return <LocalHospitalIcon color="warning" />;
      case 'space-weather': return <FlareIcon color="warning" />;
      default: return <InfoIcon />;
    }
  };

  // Handle assigning a patient to a bed
  const handleAssignPatient = (bedId) => {
    setSelectedBedId(bedId);
    setPatientModalOpen(true);
  };

  // Handle patient selection from modal
  const handlePatientSelected = (patient) => {
    // Refresh the bed data will happen automatically via reactivity
    console.log('Patient assigned:', patient);
  };

  // Handle marking a bed as clean
  const handleMarkClean = async (bedId) => {
    try {
      await Meteor.callAsync('pacio.updateBedStatus', bedId, 'available');
      console.log('Bed marked as clean');
    } catch (error) {
      console.error('Error marking bed as clean:', error);
    }
  };

  // Handle marking a bed as fixed
  const handleMarkFixed = async (bedId) => {
    try {
      await Meteor.callAsync('pacio.updateBedStatus', bedId, 'available');
      console.log('Bed marked as fixed');
    } catch (error) {
      console.error('Error marking bed as fixed:', error);
    }
  };

  // Handle menu open
  const handleMenuOpen = (event, bedId) => {
    setAnchorEl(event.currentTarget);
    setMenuBedId(bedId);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuBedId(null);
  };

  // Handle discharge patient
  const handleDischargePatient = async () => {
    if (!menuBedId) return;

    try {
      await Meteor.callAsync('pacio.releaseBed', menuBedId);
      console.log('Patient discharged from bed');
      handleMenuClose();
    } catch (error) {
      console.error('Error discharging patient:', error);
    }
  };

  // Handle select patient
  const handleSelectPatient = async () => {
    const bed = facilityData.beds.find(b => b._id === menuBedId);
    if (bed && bed.patientId) {
      console.log('Looking up patient with ID:', bed.patientId);

      // Get Patients collection
      const Patients = get(Meteor, 'Collections.Patients') || global.Collections?.Patients;

      if (Patients) {
        // Look up the full patient resource using the MongoDB _id
        const patient = Patients.findOne({ _id: bed.patientId });

        if (patient) {
          // Extract both FHIR id and MongoDB _id (matching PatientDirectory pattern)
          const fhirId = patient.id;  // FHIR identifier
          const mongoId = patient._id && patient._id._str ? patient._id._str : patient._id;

          console.log('Setting selected patient:', patient);
          console.log('FHIR id:', fhirId);
          console.log('MongoDB _id:', mongoId);

          // Set Session variables in same order as PatientDirectory
          // This triggers the global patient subscription tracker
          Session.set('selectedPatientId', fhirId);  // ← TRIGGERS SUBSCRIPTIONS
          Session.set('selectedPatientMongoId', mongoId);  // MongoDB _id for compatibility
          Session.set('selectedPatient', patient);  // Full patient object

          console.log('✓ Patient subscriptions will activate for:', fhirId);
        } else {
          console.warn('Patient not found with _id:', bed.patientId);
        }
      } else {
        console.warn('Patients collection not available');
      }
    }
    handleMenuClose();
  };

  // Handle view patient chart — set patient context, then route to /patient-chart
  const handleEditPatient = () => {
    const bed = facilityData.beds.find(b => b._id === menuBedId);
    if (bed && bed.patientId) {
      const Patients = get(Meteor, 'Collections.Patients') || global.Collections?.Patients;

      if (Patients) {
        const patient = Patients.findOne({ _id: bed.patientId });

        if (patient) {
          const fhirId = patient.id;  // FHIR identifier
          const mongoId = patient._id && patient._id._str ? patient._id._str : patient._id;

          // Set Session patient context so the patient chart is scoped
          Session.set('selectedPatientId', fhirId);
          Session.set('selectedPatientMongoId', mongoId);
          Session.set('selectedPatient', patient);

          console.log('Opening patient chart for:', fhirId);
        } else {
          console.warn('View Patient Chart: patient not found with _id:', bed.patientId);
        }
      } else {
        console.warn('View Patient Chart: Patients collection not available');
      }
    }
    handleMenuClose();
    navigate('/patient-chart');
  };

  // Handle transfer patient — set patient context, then route to Transitions of Care
  const handleTransferPatient = () => {
    const bed = facilityData.beds.find(b => b._id === menuBedId);
    if (bed && bed.patientId) {
      const Patients = get(Meteor, 'Collections.Patients') || global.Collections?.Patients;

      if (Patients) {
        const patient = Patients.findOne({ _id: bed.patientId });

        if (patient) {
          const fhirId = patient.id;  // FHIR identifier
          const mongoId = patient._id && patient._id._str ? patient._id._str : patient._id;

          // Set Session patient context so the Transitions of Care page is scoped
          Session.set('selectedPatientId', fhirId);
          Session.set('selectedPatientMongoId', mongoId);
          Session.set('selectedPatient', patient);

          console.log('Transferring patient to Transitions of Care:', fhirId);
        } else {
          console.warn('Transfer: patient not found with _id:', bed.patientId);
        }
      } else {
        console.warn('Transfer: Patients collection not available');
      }
    }
    handleMenuClose();
    navigate('/transitions-of-care');
  };

  // Show loading state while data is being fetched
  const isLoadingBeds = bedsLoading && bedsLoading();
  const isLoadingPatients = patientsLoading && patientsLoading();

  if (isLoadingBeds || isLoadingPatients) {
    return (
      <Box sx={{ p: 2, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? '#121212' : '#f5f5f5' }}>
        <Box textAlign="center">
          <LinearProgress sx={{ width: 200, mb: 2 }} />
          <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>Loading bed status...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, minHeight: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ color: cardTextColor }}>
            {facilityData.facility.name}
          </Typography>
          <Typography variant="body2" sx={{
            color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
          }}>
            <LocationOnIcon fontSize="small" sx={{
              verticalAlign: 'middle',
              mr: 0.5,
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
            }} />
            {facilityData.facility.address}
          </Typography>
        </Box>
        {userId && (
          <Box display="flex" gap={2} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<PeopleIcon />}
              size="small"
              sx={{ height: 32 }}
            >
              New Admission
            </Button>
            <ToggleButtonGroup
              value={columnCount}
              exclusive
              onChange={handleColumnToggle}
              size="small"
              sx={{
                height: 32,
                '& .MuiToggleButton-root': {
                  color: cardTextColor,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                  '&.Mui-selected': {
                    bgcolor: isDark ? 'rgba(33, 150, 243, 0.16)' : 'rgba(33, 150, 243, 0.08)',
                    color: cardTextColor,
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(33, 150, 243, 0.24)' : 'rgba(33, 150, 243, 0.12)'
                    }
                  }
                }
              }}
            >
              <ToggleButton value={1}>1</ToggleButton>
              <ToggleButton value={2}>2</ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
              value={displayMode}
              exclusive
              onChange={handleDisplayToggle}
              size="small"
              sx={{
                height: 32,
                '& .MuiToggleButton-root': {
                  color: cardTextColor,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                  '&.Mui-selected': {
                    bgcolor: isDark ? 'rgba(33, 150, 243, 0.16)' : 'rgba(33, 150, 243, 0.08)',
                    color: cardTextColor,
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(33, 150, 243, 0.24)' : 'rgba(33, 150, 243, 0.12)'
                    }
                  }
                }
              }}
            >
              <ToggleButton value="regular">
                <Tooltip title="Regular view"><GridViewIcon fontSize="small" /></Tooltip>
              </ToggleButton>
              <ToggleButton value="compact">
                <Tooltip title="Compact view"><ViewListIcon fontSize="small" /></Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
              value={[showPhoto && 'photo', showMap && 'map', showAlerts && 'alerts'].filter(Boolean)}
              onChange={handleCardVisibilityToggle}
              size="small"
              sx={{
                height: 32,
                '& .MuiToggleButton-root': {
                  color: cardTextColor,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                  '&.Mui-selected': {
                    bgcolor: isDark ? 'rgba(33, 150, 243, 0.16)' : 'rgba(33, 150, 243, 0.08)',
                    color: cardTextColor,
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(33, 150, 243, 0.24)' : 'rgba(33, 150, 243, 0.12)'
                    }
                  }
                }
              }}
            >
              <ToggleButton value="photo">
                <Tooltip title="Vehicle photo"><PhotoCameraIcon fontSize="small" /></Tooltip>
              </ToggleButton>
              {hasMapApiKey && (
                <ToggleButton value="map">
                  <Tooltip title="Location Map"><MapIcon fontSize="small" /></Tooltip>
                </ToggleButton>
              )}
              <ToggleButton value="alerts">
                <Tooltip title="Alerts"><NotificationsIcon fontSize="small" /></Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
      </Box>

      {/* Key Metrics - Only show if authenticated */}
      {userId && (
        <Grid container spacing={2} mb={2}>
        <Grid item xs={6} sm={3}>
          <Card sx={{
            bgcolor: cardBgColor,
            color: cardTextColor,
            '& .MuiTypography-root': { color: cardTextColor },
            '& .MuiTypography-body2': {
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
            }
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {facilityData.facility.occupiedBeds}
                  </Typography>
                  <Typography variant="body2">
                    Occupied Beds
                  </Typography>
                </Box>
                <HotelIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{
            bgcolor: cardBgColor,
            color: cardTextColor,
            '& .MuiTypography-root': { color: cardTextColor },
            '& .MuiTypography-body2': {
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
            }
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {((facilityData.facility.occupiedBeds / facilityData.facility.totalBeds) * 100).toFixed(0)}%
                  </Typography>
                  <Typography variant="body2">
                    Occupancy Rate
                  </Typography>
                </Box>
                <TrendingUpIcon color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{
            bgcolor: cardBgColor,
            color: cardTextColor,
            '& .MuiTypography-root': { color: cardTextColor },
            '& .MuiTypography-body2': {
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
            }
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {facilityData.recentAlerts.length}
                  </Typography>
                  <Typography variant="body2">
                    Active Alerts
                  </Typography>
                </Box>
                <Badge badgeContent={facilityData.recentAlerts.filter(a => a.priority === 'high').length} color="error">
                  <NotificationsIcon color="warning" />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{
            bgcolor: cardBgColor,
            color: cardTextColor,
            '& .MuiTypography-root': { color: cardTextColor },
            '& .MuiTypography-body2': {
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
            }
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  {chiefMedicalOfficer ? (
                    <>
                      <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem', lineHeight: 1.2 }}>
                        {get(chiefMedicalOfficer, 'name[0].given[0]', '')} {get(chiefMedicalOfficer, 'name[0].family', 'CMO')}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        Chief Medical Officer
                      </Typography>
                      <Typography variant="caption" color="primary" sx={{ fontSize: '0.7rem' }}>
                        Practitioner/{get(chiefMedicalOfficer, 'id', get(chiefMedicalOfficer, '_id', 'N/A'))}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="h5" fontWeight="bold">
                        CMO
                      </Typography>
                      <Typography variant="body2">
                        Not Assigned
                      </Typography>
                    </>
                  )}
                </Box>
                <GroupIcon color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}

      <Grid container spacing={2}>
        {/* Bed Status Cards */}
        <Grid item xs={12} md={columnCount === 1 ? 12 : 8}>
          <Paper sx={{
            p: 2,
            height: `${bedStatusHeight}px`,
            overflow: 'auto',
            bgcolor: paperBgColor,
            color: cardTextColor,
            '& .MuiTypography-root': { color: cardTextColor },
            '& .MuiTypography-body2': {
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
            }
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Bed Status {userId && filteredBeds ? `(${filteredBeds.length} beds)` : ''}
              </Typography>
              {userId && (
                <FormControl
                  size="small"
                  sx={{
                    minWidth: 120,
                    '& .MuiInputLabel-root': { color: cardTextColor },
                    '& .MuiSelect-select': { color: cardTextColor },
                    '& .MuiSelect-icon': { color: cardTextColor },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'
                    }
                  }}
                >
                  <InputLabel>Filter</InputLabel>
                  <Select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    label="Filter"
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: isDark ? '#2a2a2a' : '#ffffff',
                          '& .MuiMenuItem-root': {
                            color: cardTextColor,
                            '&:hover': {
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                            },
                            '&.Mui-selected': {
                              bgcolor: isDark ? 'rgba(33, 150, 243, 0.16)' : 'rgba(33, 150, 243, 0.08)',
                              '&:hover': {
                                bgcolor: isDark ? 'rgba(33, 150, 243, 0.24)' : 'rgba(33, 150, 243, 0.12)'
                              }
                            }
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="all">All Beds</MenuItem>
                    <MenuItem value="occupied">Occupied</MenuItem>
                    <MenuItem value="available">Available</MenuItem>
                    <MenuItem value="cleaning">Cleaning</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                    <MenuItem value="critical">Critical Patients</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>

            {!userId ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="300px"
                gap={2}
              >
                <LocalHospitalIcon sx={{ fontSize: 60, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                <Typography variant="h6" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                  Please log in to view bed status
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                  Patient information is protected and requires authentication
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/signin')}
                  sx={{ mt: 2 }}
                >
                  Sign In
                </Button>
              </Box>
            ) : filteredBeds && filteredBeds.length > 0 ? (
            <Grid container spacing={2}>
              {filteredBeds.map(bed => {
                // Skip invalid bed objects
                if (!bed || !bed._id) return null;

                return (
                <Grid item xs={12} key={bed._id || bed.bedId}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderLeft: bed.status === 'occupied' ? `4px solid ${getAcuityColor(bed.acuityLevel || 'Stable')}` : theme => `4px solid ${theme.palette.divider}`,
                      '&:hover': { boxShadow: 2 },
                      bgcolor: cardBgColor,
                      color: cardTextColor,
                      '& .MuiTypography-root': { color: cardTextColor },
                      '& .MuiTypography-body2': {
                        color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                      }
                    }}
                  >
                    <CardContent>
                      {bed.status === 'occupied' ? (
                        displayMode === 'compact' ? (
                          // COMPACT VIEW - Single row with essential info and aligned columns
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center" gap={2}>
                              <Box sx={{ width: '25%', minWidth: 180 }}>
                                <Typography variant="body1" fontWeight="medium" noWrap>
                                  {bed.patientName}, {bed.patientAge}y
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                                <Chip
                                  label={bed.acuityLevel || 'Stable'}
                                  size="small"
                                  sx={{
                                    bgcolor: getAcuityColor(bed.acuityLevel || 'Stable'),
                                    color: theme => theme.palette.getContrastText(getAcuityColor(bed.acuityLevel || 'Stable'))
                                  }}
                                />
                                {bed.isolation && (
                                  <Chip label="Isolation" size="small" color="error" />
                                )}
                              </Box>
                              <Typography variant="caption" sx={{ flex: 1 }}>
                                Bed {bed.bedId || bed.roomNumber} • {bed.primaryCondition || 'General Care'}
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip
                                label={`HR: ${bed.vitals?.hr || 'N/A'}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  color: cardTextColor,
                                  borderColor: getVitalColor('hr', bed.vitals?.hr)
                                }}
                              />
                              <Chip
                                label={`O2: ${bed.vitals?.o2 || 'N/A'}%`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  color: cardTextColor,
                                  borderColor: getVitalColor('o2', bed.vitals?.o2)
                                }}
                              />
                              {bed.fallRisk && (
                                <Chip label="Fall Risk" size="small" color="warning" />
                              )}
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, bed._id)}
                                sx={{ color: cardTextColor }}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        ) : (
                          // REGULAR VIEW - Full layout
                          <Box>
                            {/* Header Row */}
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                              <Box>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="h6" component="span">
                                    {bed.patientName}, {bed.patientAge}y
                                  </Typography>
                                  <Chip
                                    label={bed.acuityLevel || 'Stable'}
                                    size="small"
                                    sx={{
                                      bgcolor: getAcuityColor(bed.acuityLevel || 'Stable'),
                                      color: theme => theme.palette.getContrastText(getAcuityColor(bed.acuityLevel || 'Stable'))
                                    }}
                                  />
                                  {bed.isolation && (
                                    <Chip
                                      label="Isolation"
                                      size="small"
                                      color="error"
                                      icon={<WarningIcon />}
                                    />
                                  )}
                                </Box>
                                <Typography variant="caption">
                                  Bed {bed.bedId || bed.roomNumber} • {bed.patientMRN} • Admitted {bed.admissionDate ? moment(bed.admissionDate).fromNow() : 'N/A'}
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, bed._id)}
                                sx={{
                                  color: cardTextColor
                                }}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </Box>

                            {/* Main Content Grid */}
                            <Grid container spacing={2}>
                              {/* Patient Info Column */}
                              <Grid item xs={12} sm={4}>
                                <Typography variant="caption" display="block" gutterBottom>
                                  PRIMARY CONDITION
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                  {bed.primaryCondition || 'General Care'}
                                </Typography>
                                <Typography variant="caption" display="block" mt={1}>
                                  ATTENDING
                                </Typography>
                                <Typography variant="body2">
                                  {bed.attendingPhysician || 'Unassigned'}
                                </Typography>
                                {bed.dietRestrictions && (
                                  <>
                                    <Typography variant="caption" display="block" mt={1}>
                                      DIET
                                    </Typography>
                                    <Typography variant="body2">
                                      {bed.dietRestrictions}
                                    </Typography>
                                  </>
                                )}
                              </Grid>

                              {/* Vitals Column */}
                              <Grid item xs={12} sm={4}>
                                <Typography variant="caption" display="block" gutterBottom>
                                  VITALS {bed.vitals && bed.vitals.lastChecked ? `(${moment(bed.vitals.lastChecked).fromNow()})` : ''}
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={1}>
                                  <Chip
                                    label={`BP: ${bed.vitals?.bp || 'N/A'}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      color: cardTextColor,
                                      borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)'
                                    }}
                                  />
                                  <Chip
                                    label={`HR: ${bed.vitals?.hr || 'N/A'}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      color: cardTextColor,
                                      borderColor: getVitalColor('hr', bed.vitals?.hr)
                                    }}
                                  />
                                  <Chip
                                    label={`Temp: ${bed.vitals?.temp || 'N/A'}°F`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      color: cardTextColor,
                                      borderColor: getVitalColor('temp', bed.vitals?.temp)
                                    }}
                                  />
                                  <Chip
                                    label={`O2: ${bed.vitals?.o2 || 'N/A'}%`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      color: cardTextColor,
                                      borderColor: getVitalColor('o2', bed.vitals?.o2)
                                    }}
                                  />
                                  <Chip
                                    label={`RR: ${bed.vitals?.rr || 'N/A'}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      color: cardTextColor,
                                      borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)'
                                    }}
                                  />
                                </Box>
                                <Box display="flex" gap={1} mt={1}>
                                  {bed.fallRisk && (
                                    <Chip
                                      label="Fall Risk"
                                      size="small"
                                      color="warning"
                                      icon={<WarningIcon />}
                                    />
                                  )}
                                </Box>
                              </Grid>

                              {/* Workflow Column */}
                              <Grid item xs={12} sm={4}>
                                <Typography variant="caption" display="block" gutterBottom>
                                  WORKFLOW
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={0.5}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <LocalPharmacyIcon fontSize="small" sx={{ color: cardTextColor }} />
                                    <Typography variant="body2">
                                      Next med: {bed.medications?.nextDue ? moment(bed.medications.nextDue).format('h:mm A') : 'N/A'}
                                    </Typography>
                                  </Box>
                                  {bed.labs?.pending > 0 && (
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <AssessmentIcon fontSize="small" sx={{ color: cardTextColor }} />
                                      <Typography variant="body2">
                                        {bed.labs.pending} lab{bed.labs.pending > 1 ? 's' : ''} pending
                                        {bed.labs?.critical > 0 && (
                                          <Chip
                                            label="Critical"
                                            size="small"
                                            color="error"
                                            sx={{ ml: 1, height: 20 }}
                                          />
                                        )}
                                      </Typography>
                                    </Box>
                                  )}
                                  {bed.tasks?.pending > 0 && (
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <AssignmentIcon fontSize="small" color={bed.tasks?.overdue > 0 ? 'error' : undefined} sx={{ color: bed.tasks?.overdue > 0 ? undefined : cardTextColor }} />
                                      <Typography variant="body2" color={bed.tasks?.overdue > 0 ? 'error' : 'textPrimary'}>
                                        {bed.tasks.pending} task{bed.tasks.pending > 1 ? 's' : ''}
                                        {bed.tasks?.overdue > 0 && ` (${bed.tasks.overdue} overdue)`}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>
                        )
                      ) : (
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{
                              bgcolor: (bed.status === 'available' || bed.status === 'vacant') ? 'grey.300' :
                                      bed.status === 'cleaning' ? 'warning.light' :
                                      bed.status === 'maintenance' ? 'error.light' : 'grey.300'
                            }}>
                              {bed.status === 'cleaning' && CleaningIcon ? <CleaningIcon /> :
                               bed.status === 'maintenance' && BuildIcon ? <BuildIcon /> :
                               HotelIcon ? <HotelIcon /> : null}
                            </Avatar>
                            <Box>
                              <Typography variant="h6">
                                Bed {bed.bedId || bed.roomNumber}
                              </Typography>
                              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                {bed.status || 'Available'}
                              </Typography>
                            </Box>
                          </Box>
                          {(bed.status === 'available' || bed.status === 'vacant') && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<PeopleIcon />}
                              onClick={() => handleAssignPatient(bed._id)}
                            >
                              Assign Patient
                            </Button>
                          )}
                          {bed.status === 'cleaning' && (
                            <Button
                              variant="outlined"
                              size="small"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleMarkClean(bed._id)}
                            >
                              Mark Clean
                            </Button>
                          )}
                          {bed.status === 'maintenance' && (
                            <Chip label="Under Maintenance" color="error" size="small" />
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                );
              })}
            </Grid>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                  No beds available
                </Typography>
              </Box>
            )}

            {/* IPS Content for selected patient */}
            {userId && Session.get('selectedPatientId') && Meteor.IpsContent && (
              <Box sx={{ mt: 2 }}>
                <Meteor.IpsContent />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Side - Vehicle Image and Alerts */}
        {columnCount === 2 && (() => {
          // Calculate how many right-side panels are visible
          const hasVehicleImage = !!vehicleConfig.vehicleFhirId || !!vehicleConfig.dashboardPhoto;
          const rightPanelCount =
            (hasVehicleImage && showPhoto ? 1 : 0) +
            (showMap && hasMapApiKey ? 1 : 0) +
            (showAlerts && userId ? 1 : 0) +
            (!userId ? 1 : 0);
          const rightPanelHeight = rightPanelCount > 0
            ? Math.floor((bedStatusHeight - (rightPanelCount - 1) * 10) / rightPanelCount)
            : bedStatusHeight;

          return (
          <Grid item xs={12} md={4}>
            <Grid container spacing={2}>
              {/* Vehicle Image Card - Only show when a vehicle is selected and photo toggle is on */}
              {showPhoto && hasVehicleImage && (
                <Grid item xs={12}>
                  <Paper sx={{
                    height: `${rightPanelHeight}px`,
                    bgcolor: paperBgColor,
                    color: cardTextColor,
                    overflow: 'hidden',
                    position: 'relative',
                    '& .MuiTypography-root': { color: cardTextColor }
                  }}>
                    {!vehicleImageError ? (() => {
                      const vehicleImageSrc = get(vehicleConfig, 'dashboardPhoto', '');
                      return (
                        <Box
                          component="img"
                          src={vehicleImageSrc}
                          alt={vehicleConfig.facilityName}
                          onError={() => {
                            setVehicleImageError(true);
                          }}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      );
                    })() : (
                      <Box sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isDark ? '#2a2a2a' : '#f0f0f0'
                      }}>
                        <RocketLaunchIcon sx={{ fontSize: 80, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }} />
                      </Box>
                    )}
                    {/* Vehicle name caption overlay */}
                    <Box sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                      p: 1.5,
                      pt: 3
                    }}>
                      <Typography variant="subtitle2" sx={{ color: '#ffffff !important', fontWeight: 600 }}>
                        {vehicleConfig.facilityName}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              )}

              {/* Location Map - Only show if API key available and map toggle on */}
              {showMap && hasMapApiKey && (
                <Grid item xs={12}>
                  <Paper sx={{
                    p: 2,
                    height: `${rightPanelHeight}px`,
                    bgcolor: paperBgColor,
                    color: cardTextColor,
                    '& .MuiTypography-root': { color: cardTextColor }
                  }}>
                    <Typography variant="h6" gutterBottom>
                      Facility Location
                    </Typography>
                    <LocationMap
                      latitude={facilityData.facility.lat}
                      longitude={facilityData.facility.lng}
                      name={facilityData.facility.name}
                      height="calc(100% - 40px)"
                      zoom={14}
                    />
                  </Paper>
                </Grid>
              )}

              {/* Recent Alerts - Only show if authenticated and alerts toggle is on */}
              {showAlerts && userId && (
                <Grid item xs={12}>
                <Paper sx={{
                  p: 2,
                  height: `${rightPanelHeight}px`,
                  overflow: 'auto',
                  bgcolor: paperBgColor,
                  color: cardTextColor,
                  '& .MuiTypography-root': { color: cardTextColor },
                  '& .MuiListItemText-root': {
                    '& .MuiTypography-root': { color: cardTextColor }
                  }
                }}>
                  <Typography variant="h6" gutterBottom>
                    Recent Alerts
                  </Typography>
                  <List dense>
                    {facilityData.recentAlerts.map((alert) => (
                      <ListItem key={alert.id}>
                        <ListItemIcon>
                          {getAlertIcon(alert.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={alert.message}
                          secondary={alert.time.fromNow()}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: alert.priority === 'high' ? 'error' : 'textPrimary'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
              )}

              {/* Placeholder when not logged in */}
              {!userId && (
                <Grid item xs={12}>
                  <Box sx={{
                    p: 4,
                    height: `${rightPanelHeight}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontStyle: 'italic',
                        color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                        textAlign: 'center',
                        maxWidth: 500,
                        mb: 2,
                        fontWeight: 300,
                        lineHeight: 1.6,
                        transition: 'opacity 0.5s ease-in-out',
                        opacity: 1
                      }}
                    >
                      "{inspirationalQuotes[currentQuoteIndex].text}"
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                        textAlign: 'center',
                        transition: 'opacity 0.5s ease-in-out',
                        opacity: 1
                      }}
                    >
                      — {inspirationalQuotes[currentQuoteIndex].author}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Grid>
          );
        })()}

      </Grid>

      {/* Patient Assignment Modal */}
      <SearchPatientsModalDialog
        open={patientModalOpen}
        onClose={() => {
          setPatientModalOpen(false);
          setSelectedBedId(null);
        }}
        onSelectPatient={handlePatientSelected}
        bedId={selectedBedId}
      />

      {/* Bed Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: isDark ? '#2a2a2a' : '#ffffff',
            '& .MuiMenuItem-root': {
              color: cardTextColor,
              '&:hover': {
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
              }
            },
            '& .MuiListItemIcon-root': {
              color: cardTextColor
            },
            '& .MuiListItemText-root': {
              color: cardTextColor
            },
            '& .MuiDivider-root': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
            }
          }
        }}
      >
        <MenuItem onClick={handleSelectPatient}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Select Patient</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleEditPatient}>
          <ListItemIcon>
            <PeopleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Patient Chart</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleTransferPatient}>
          <ListItemIcon>
            <SwapHorizIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Transfer Patient</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDischargePatient}>
          <ListItemIcon>
            <PersonOffIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Discharge Patient</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}

// Component is exported as part of the function declaration above
