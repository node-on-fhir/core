// /packages/pacio-core/client/pages/MainPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
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
  Info as InfoIcon
} from '@mui/icons-material';
import LocationMap from '../components/LocationMap';

export function MainPage() {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedWing, setSelectedWing] = useState('all');

  // Mock data for single facility dashboard
  const facilityData = useTracker(() => {
    return {
      facility: {
        id: 'snf-001',
        name: 'Sunset Manor Care Center',
        type: 'SNF',
        address: '123 Elder Care Way, Springfield, IL 62701',
        lat: 39.7817,
        lng: -89.6501,
        floors: 3,
        wings: ['North', 'South', 'East', 'West'],
        totalBeds: 120,
        occupiedBeds: 112,
        staff: {
          nurses: 18,
          cnas: 24,
          therapists: 8,
          other: 12
        }
      },
      rooms: generateRoomData(),
      recentAlerts: [
        { id: 1, roomId: '201', type: 'fall', message: 'Fall risk alert - Room 201', time: moment().subtract(5, 'minutes'), priority: 'high' },
        { id: 2, roomId: '115', type: 'call', message: 'Call button activated - Room 115', time: moment().subtract(12, 'minutes'), priority: 'medium' },
        { id: 3, roomId: '308', type: 'medical', message: 'Medication due - Room 308', time: moment().subtract(20, 'minutes'), priority: 'low' },
        { id: 4, roomId: '222', type: 'wandering', message: 'Wandering risk alert - Room 222', time: moment().subtract(30, 'minutes'), priority: 'high' }
      ],
      upcomingActivities: [
        { time: '10:00 AM', activity: 'Group Physical Therapy', location: 'Therapy Room', participants: 12 },
        { time: '11:30 AM', activity: 'Medication Round', location: 'All Floors', participants: 85 },
        { time: '2:00 PM', activity: 'Recreation Activities', location: 'Common Area', participants: 45 },
        { time: '3:30 PM', activity: 'Family Visiting Hours', location: 'Various', participants: 30 }
      ]
    };
  }, []);

  // Generate mock room data
  function generateRoomData() {
    const rooms = [];
    const floors = 3;
    const roomsPerFloor = 40;
    const wings = ['North', 'South', 'East', 'West'];
    
    for (let floor = 1; floor <= floors; floor++) {
      for (let roomNum = 1; roomNum <= roomsPerFloor; roomNum++) {
        const roomId = `${floor}${roomNum.toString().padStart(2, '0')}`;
        const wing = wings[Math.floor((roomNum - 1) / 10)];
        
        rooms.push({
          id: roomId,
          floor: floor,
          wing: wing,
          status: getRandomRoomStatus(),
          resident: getRandomResident(roomId),
          lastChecked: moment().subtract(Math.random() * 240, 'minutes'),
          alerts: Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 1 : 0
        });
      }
    }
    
    return rooms;
  }

  function getRandomRoomStatus() {
    const statuses = ['occupied', 'vacant', 'cleaning', 'maintenance', 'reserved'];
    const weights = [0.85, 0.08, 0.03, 0.02, 0.02];
    const random = Math.random();
    let sum = 0;
    
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random < sum) return statuses[i];
    }
    
    return statuses[0];
  }

  function getRandomResident(roomId) {
    if (Math.random() > 0.85) return null; // 15% vacant
    
    const firstNames = ['John', 'Mary', 'Robert', 'Patricia', 'James', 'Barbara', 'William', 'Elizabeth'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    
    return {
      name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      age: Math.floor(Math.random() * 30) + 65,
      admitDate: moment().subtract(Math.floor(Math.random() * 365), 'days'),
      careLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      fallRisk: Math.random() > 0.7,
      wanderingRisk: Math.random() > 0.85
    };
  }

  // Filter rooms based on floor and wing selection
  const filteredRooms = facilityData.rooms.filter(room => {
    if (selectedFloor !== 'all' && room.floor !== parseInt(selectedFloor)) return false;
    if (selectedWing !== 'all' && room.wing !== selectedWing) return false;
    return true;
  });

  // Get room status color
  const getRoomStatusColor = (status) => {
    const statusColors = {
      occupied: '#4caf50',
      vacant: '#2196f3',
      cleaning: '#ff9800',
      maintenance: '#f44336',
      reserved: '#9c27b0'
    };
    return statusColors[status] || '#757575';
  };

  // Get alert icon
  const getAlertIcon = (type) => {
    switch(type) {
      case 'fall': return <WarningIcon color="error" />;
      case 'call': return <NotificationsIcon color="primary" />;
      case 'medical': return <LocalHospitalIcon color="warning" />;
      case 'wandering': return <PersonOffIcon color="error" />;
      default: return <InfoIcon />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
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
        <Box display="flex" gap={2} alignItems="center">
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="grid">
              <GridViewIcon />
            </ToggleButton>
            <ToggleButton value="list">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Floor</InputLabel>
            <Select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              label="Floor"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="1">Floor 1</MenuItem>
              <MenuItem value="2">Floor 2</MenuItem>
              <MenuItem value="3">Floor 3</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Wing</InputLabel>
            <Select
              value={selectedWing}
              onChange={(e) => setSelectedWing(e.target.value)}
              label="Wing"
            >
              <MenuItem value="all">All</MenuItem>
              {facilityData.facility.wings.map(wing => (
                <MenuItem key={wing} value={wing}>{wing}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Key Metrics */}
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

      <Grid container spacing={2}>
        {/* Room Grid/List View */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Room Status ({filteredRooms.length} rooms)
              </Typography>
              <Box display="flex" gap={1}>
                {['occupied', 'vacant', 'cleaning', 'maintenance', 'reserved'].map(status => (
                  <Chip
                    key={status}
                    label={status}
                    size="small"
                    icon={<CircleIcon sx={{ fontSize: 12 }} />}
                    sx={{
                      '& .MuiChip-icon': {
                        color: getRoomStatusColor(status)
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
            
            {viewMode === 'grid' ? (
              <Box
                display="grid"
                gridTemplateColumns="repeat(auto-fill, minmax(100px, 1fr))"
                gap={1}
              >
                {filteredRooms.map(room => (
                  <Tooltip
                    key={room.id}
                    title={
                      <Box>
                        <Typography variant="body2">Room {room.id}</Typography>
                        {room.resident && (
                          <>
                            <Typography variant="caption">
                              {room.resident.name}, Age {room.resident.age}
                            </Typography>
                            <br />
                            <Typography variant="caption">
                              Care Level: {room.resident.careLevel}
                            </Typography>
                          </>
                        )}
                        <Typography variant="caption" display="block">
                          Last checked: {room.lastChecked.fromNow()}
                        </Typography>
                      </Box>
                    }
                  >
                    <Card
                      sx={{
                        cursor: 'pointer',
                        bgcolor: getRoomStatusColor(room.status),
                        color: 'white',
                        position: 'relative',
                        '&:hover': {
                          opacity: 0.8
                        }
                      }}
                    >
                      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Typography variant="body2" fontWeight="bold" align="center">
                          {room.id}
                        </Typography>
                        {room.status === 'occupied' && room.resident && (
                          <Box display="flex" justifyContent="center" gap={0.5} mt={0.5}>
                            {room.resident.fallRisk && (
                              <WarningIcon sx={{ fontSize: 16 }} />
                            )}
                            {room.resident.wanderingRisk && (
                              <PersonOffIcon sx={{ fontSize: 16 }} />
                            )}
                          </Box>
                        )}
                        {room.alerts > 0 && (
                          <Badge
                            badgeContent={room.alerts}
                            color="error"
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              '& .MuiBadge-badge': {
                                fontSize: 10,
                                minWidth: 16,
                                height: 16
                              }
                            }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </Tooltip>
                ))}
              </Box>
            ) : (
              <List>
                {filteredRooms.map(room => (
                  <ListItem key={room.id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: getRoomStatusColor(room.status), width: 32, height: 32 }}>
                        <Typography variant="caption">{room.id}</Typography>
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={room.resident ? room.resident.name : `Room ${room.id} - ${room.status}`}
                      secondary={
                        room.resident ? 
                        `Age ${room.resident.age} • ${room.resident.careLevel} care • Wing ${room.wing}` :
                        `Wing ${room.wing} • Floor ${room.floor}`
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box display="flex" gap={1} alignItems="center">
                        {room.resident?.fallRisk && (
                          <Tooltip title="Fall Risk">
                            <WarningIcon color="error" fontSize="small" />
                          </Tooltip>
                        )}
                        {room.resident?.wanderingRisk && (
                          <Tooltip title="Wandering Risk">
                            <PersonOffIcon color="error" fontSize="small" />
                          </Tooltip>
                        )}
                        {room.alerts > 0 && (
                          <Badge badgeContent={room.alerts} color="error" />
                        )}
                        <IconButton edge="end" size="small">
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Right Side - Map and Alerts */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            {/* Map View */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, height: '290px' }}>
                <Typography variant="h6" gutterBottom>
                  Facility Location
                </Typography>
                <LocationMap
                  latitude={facilityData.facility.lat}
                  longitude={facilityData.facility.lng}
                  name={facilityData.facility.name}
                  height={240}
                  zoom={14}
                />
              </Paper>
            </Grid>

            {/* Recent Alerts */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, height: '290px', overflow: 'auto' }}>
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
          </Grid>
        </Grid>

        {/* Upcoming Activities */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Today's Schedule
            </Typography>
            <Grid container spacing={2}>
              {facilityData.upcomingActivities.map((activity, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <CalendarTodayIcon color="primary" fontSize="small" />
                        <Typography variant="h6" color="primary">
                          {activity.time}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="medium">
                        {activity.activity}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {activity.location} • {activity.participants} participants
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}