// /packages/pacio-core/client/pages/MainPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useSubscribe } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';
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
  ListItemSecondaryAction
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalHospital as LocalHospitalIcon,
  Bed as BedIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocationOn as LocationOnIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  SwapHoriz as SwapHorizIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  Map as MapIcon,
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
  LocalPharmacy as LocalPharmacyIcon
} from '@mui/icons-material';
import { Beds } from '../../lib/collections/BedsCollection';
import { SearchPatientsModalDialog } from '../components/SearchPatientsModalDialog';
import LocationMap from '../components/LocationMap';

export function MainPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [bedStatusHeight, setBedStatusHeight] = useState(600);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [selectedBedId, setSelectedBedId] = useState(null);
  const [hasMapApiKey, setHasMapApiKey] = useState(false);
  
  // Track authentication status
  const userId = useTracker(() => Meteor.userId());

  // Check if Google Maps API key is available
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        console.log('Checking for Google Maps API key...');
        const apiKey = await Meteor.callAsync('pacio.getGoogleMapsApiKey');
        console.log('API key response:', apiKey ? 'Key found' : 'No key');
        if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
          console.log('Setting hasMapApiKey to true');
          setHasMapApiKey(true);
        } else {
          console.log('API key is placeholder or empty');
          setHasMapApiKey(false);
        }
      } catch (error) {
        console.log('Google Maps API key not configured:', error.message);
        setHasMapApiKey(false);
      }
    };
    
    checkApiKey();
  }, []);

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

  // Check if user is logged in
  const user = useTracker(() => Meteor.user());
  
  // Fetch data from collections - trust the cursor
  const facilityData = useTracker(() => {
    // Simply get beds from the collection - all data is already there
    const beds = Beds.find({}).fetch();
    
    // Calculate occupied beds
    const occupiedBeds = beds.filter(bed => bed.status === 'occupied').length;
    const totalBeds = beds.length || 16;
    
    return {
      facility: {
        id: 'mh-001',
        name: "Rainbow's End Medical Home",
        type: 'Medical Home',
        address: '789 Healing Way, Springfield, IL 62704',
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
      beds: beds,
      recentAlerts: [
        { id: 1, bedId: 'B03', type: 'medical', message: 'Abnormal vitals detected - Bed 3', time: moment().subtract(8, 'minutes'), priority: 'high' },
        { id: 2, bedId: 'B07', type: 'call', message: 'Call button activated - Bed 7', time: moment().subtract(15, 'minutes'), priority: 'medium' },
        { id: 3, bedId: 'B12', type: 'medical', message: 'Medication due - Bed 12', time: moment().subtract(25, 'minutes'), priority: 'low' },
        { id: 4, bedId: 'B01', type: 'fall', message: 'Fall prevention protocol - Bed 1', time: moment().subtract(45, 'minutes'), priority: 'high' }
      ]
    };
  }, [bedsLoading, patientsLoading]);



  // Filter beds based on selection
  const filteredBeds = facilityData.beds.filter(bed => {
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

  // Show loading state while data is being fetched
  if (bedsLoading() || patientsLoading()) {
    return (
      <Box sx={{ p: 2, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box textAlign="center">
          <LinearProgress sx={{ width: 200, mb: 2 }} />
          <Typography color="textSecondary">Loading bed status...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" component="h1">
            {facilityData.facility.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <LocationOnIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {facilityData.facility.address}
          </Typography>
        </Box>
        {userId && (
          <Box display="flex" gap={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                label="Filter"
              >
                <MenuItem value="all">All Beds</MenuItem>
                <MenuItem value="occupied">Occupied</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="cleaning">Cleaning</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="critical">Critical Patients</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<PeopleIcon />}
              size="small"
            >
              New Admission
            </Button>
          </Box>
        )}
      </Box>

      {/* Key Metrics - Only show if authenticated */}
      {userId && (
        <Grid container spacing={2} mb={2}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {facilityData.facility.occupiedBeds}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Occupied Beds
                  </Typography>
                </Box>
                <BedIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {((facilityData.facility.occupiedBeds / facilityData.facility.totalBeds) * 100).toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Occupancy Rate
                  </Typography>
                </Box>
                <TrendingUpIcon color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {facilityData.recentAlerts.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
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
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {facilityData.facility.staff.nurses + facilityData.facility.staff.cnas}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Staff on Duty
                  </Typography>
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
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: `${bedStatusHeight}px`, overflow: 'auto' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Bed Status ({filteredBeds.length} beds)
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {/* Remove dynamic timestamp to prevent re-renders */}
              </Typography>
            </Box>
            
            {!user ? (
              <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center" 
                height="300px"
                gap={2}
              >
                <LocalHospitalIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                <Typography variant="h6" color="text.secondary">
                  Please log in to view bed status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Patient information is protected and requires authentication
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => window.location.href = '/signin'}
                  sx={{ mt: 2 }}
                >
                  Sign In
                </Button>
              </Box>
            ) : (
            <Grid container spacing={2}>
              {filteredBeds.map(bed => (
                <Grid item xs={12} key={bed._id || bed.bedId}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      borderLeft: bed.status === 'occupied' ? `4px solid ${getAcuityColor(bed.acuityLevel || 'Stable')}` : '4px solid #e0e0e0',
                      '&:hover': { boxShadow: 2 }
                    }}
                  >
                    <CardContent>
                      {bed.status === 'occupied' ? (
                        <Box>
                          {/* Header Row */}
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Box>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="h6" component="span">
                                  Bed {bed.bedId || bed.roomNumber}
                                </Typography>
                                <Chip 
                                  label={bed.acuityLevel || 'Stable'} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: getAcuityColor(bed.acuityLevel || 'Stable'),
                                    color: 'white'
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
                              <Typography variant="body1" fontWeight="medium">
                                {bed.patientName}, {bed.patientAge}y
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {bed.patientMRN} • Admitted {bed.admissionDate ? moment(bed.admissionDate).fromNow() : 'N/A'}
                              </Typography>
                            </Box>
                            <IconButton size="small">
                              <MoreVertIcon />
                            </IconButton>
                          </Box>

                          {/* Main Content Grid */}
                          <Grid container spacing={2}>
                            {/* Patient Info Column */}
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                PRIMARY CONDITION
                              </Typography>
                              <Typography variant="body2" gutterBottom>
                                {bed.primaryCondition || 'General Care'}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                                ATTENDING
                              </Typography>
                              <Typography variant="body2">
                                {bed.attendingPhysician || 'Unassigned'}
                              </Typography>
                              {bed.dietRestrictions && (
                                <>
                                  <Typography variant="caption" color="textSecondary" display="block" mt={1}>
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
                              <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                VITALS {bed.vitals && bed.vitals.lastChecked ? `(${moment(bed.vitals.lastChecked).fromNow()})` : ''}
                              </Typography>
                              <Box display="flex" flexWrap="wrap" gap={1}>
                                <Chip 
                                  label={`BP: ${bed.vitals?.bp || 'N/A'}`} 
                                  size="small" 
                                  variant="outlined"
                                />
                                <Chip 
                                  label={`HR: ${bed.vitals?.hr || 'N/A'}`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ borderColor: getVitalColor('hr', bed.vitals?.hr) }}
                                />
                                <Chip 
                                  label={`Temp: ${bed.vitals?.temp || 'N/A'}°F`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ borderColor: getVitalColor('temp', bed.vitals?.temp) }}
                                />
                                <Chip 
                                  label={`O2: ${bed.vitals?.o2 || 'N/A'}%`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ borderColor: getVitalColor('o2', bed.vitals?.o2) }}
                                />
                                <Chip 
                                  label={`RR: ${bed.vitals?.rr || 'N/A'}`} 
                                  size="small" 
                                  variant="outlined"
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
                              <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                WORKFLOW
                              </Typography>
                              <Box display="flex" flexDirection="column" gap={0.5}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <LocalPharmacyIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    Next med: {bed.medications?.nextDue ? moment(bed.medications.nextDue).format('h:mm A') : 'N/A'}
                                  </Typography>
                                </Box>
                                {bed.labs?.pending > 0 && (
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <AssessmentIcon fontSize="small" color="action" />
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
                                    <AssignmentIcon fontSize="small" color={bed.tasks?.overdue > 0 ? 'error' : 'action'} />
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
                      ) : (
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ 
                              bgcolor: (bed.status === 'available' || bed.status === 'vacant') ? 'grey.300' : 
                                      bed.status === 'cleaning' ? 'warning.light' : 
                                      bed.status === 'maintenance' ? 'error.light' : 'grey.300' 
                            }}>
                              {bed.status === 'cleaning' ? <CleaningIcon /> : 
                               bed.status === 'maintenance' ? <BuildIcon /> : <BedIcon />}
                            </Avatar>
                            <Box>
                              <Typography variant="h6">
                                Bed {bed.bedId || bed.roomNumber}
                              </Typography>
                              <Typography variant="body2" color="textSecondary" sx={{ textTransform: 'capitalize' }}>
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
              ))}
            </Grid>
            )}
          </Paper>
        </Grid>

        {/* Right Side - Map and Alerts */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            {/* Map View - Only show if API key is available */}
            {hasMapApiKey && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, height: `${(bedStatusHeight - 10) / 2}px` }}>
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

            {/* Recent Alerts - Only show if authenticated */}
            {userId && (
              <Grid item xs={12}>
              <Paper sx={{ p: 2, height: hasMapApiKey ? `${(bedStatusHeight - 10) / 2}px` : `${bedStatusHeight}px`, overflow: 'auto' }}>
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
          </Grid>
        </Grid>

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
    </Box>
  );
}

export { MainPage };