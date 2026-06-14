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
  Tooltip
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
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';

export function MainPage() {
  const [selectedFacility, setSelectedFacility] = useState('all');
  const [timeRange, setTimeRange] = useState('today');

  // Mock data for demonstration - replace with actual Meteor collections
  const facilityData = useTracker(() => {
    // This would normally come from a Facilities collection
    return {
      facilities: [
        {
          id: 'snf-001',
          name: 'Sunset Manor Care Center',
          type: 'SNF',
          address: '123 Elder Care Way, Springfield, IL 62701',
          beds: 120,
          occupied: 112,
          staff: 45,
          lat: 39.7817,
          lng: -89.6501
        },
        {
          id: 'hha-001',
          name: 'ComfortCare Home Health',
          type: 'HHA',
          address: '456 Wellness Ave, Springfield, IL 62702',
          activePatients: 234,
          staff: 28,
          lat: 39.7990,
          lng: -89.6439
        },
        {
          id: 'ltch-001',
          name: 'Springfield Long-Term Care',
          type: 'LTCH',
          address: '789 Recovery Blvd, Springfield, IL 62703',
          beds: 60,
          occupied: 54,
          staff: 32,
          lat: 39.8017,
          lng: -89.6731
        }
      ],
      transitions: {
        pending: 12,
        inProgress: 8,
        completed: 45
      },
      assessments: {
        due: 15,
        overdue: 3,
        completed: 127
      },
      alerts: [
        { id: 1, type: 'warning', message: 'MDS assessment overdue for 3 residents', facility: 'snf-001' },
        { id: 2, type: 'info', message: '5 new referrals pending review', facility: 'all' },
        { id: 3, type: 'success', message: 'Quality measures submitted successfully', facility: 'ltch-001' }
      ]
    };
  }, []);

  // Calculate aggregate metrics
  const calculateMetrics = () => {
    const { facilities } = facilityData;
    let totalBeds = 0;
    let totalOccupied = 0;
    let totalStaff = 0;
    let totalPatients = 0;

    facilities.forEach(facility => {
      if (selectedFacility === 'all' || facility.id === selectedFacility) {
        if (facility.beds) {
          totalBeds += facility.beds;
          totalOccupied += facility.occupied || 0;
        }
        if (facility.activePatients) {
          totalPatients += facility.activePatients;
        }
        totalStaff += facility.staff || 0;
      }
    });

    const occupancyRate = totalBeds > 0 ? (totalOccupied / totalBeds) * 100 : 0;

    return {
      totalBeds,
      totalOccupied,
      totalStaff,
      totalPatients,
      occupancyRate
    };
  };

  const metrics = calculateMetrics();

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Facility Operations Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Facility</InputLabel>
            <Select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              label="Facility"
            >
              <MenuItem value="all">All Facilities</MenuItem>
              {facilityData.facilities.map(facility => (
                <MenuItem key={facility.id} value={facility.id}>
                  {facility.name} ({facility.type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<MapIcon />}
            onClick={() => console.log('Show map view')}
          >
            Map View
          </Button>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Census
                  </Typography>
                  <Typography variant="h4">
                    {metrics.totalOccupied + metrics.totalPatients}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +5% from last week
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Bed Occupancy
                  </Typography>
                  <Typography variant="h4">
                    {metrics.occupancyRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {metrics.totalOccupied} of {metrics.totalBeds} beds
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <BedIcon />
                </Avatar>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics.occupancyRate} 
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Transitions
                  </Typography>
                  <Typography variant="h4">
                    {facilityData.transitions.pending + facilityData.transitions.inProgress}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip 
                      label={`${facilityData.transitions.pending} pending`} 
                      size="small" 
                      color="warning"
                    />
                    <Chip 
                      label={`${facilityData.transitions.inProgress} in progress`} 
                      size="small" 
                      color="info"
                    />
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <SwapHorizIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Assessments Due
                  </Typography>
                  <Typography variant="h4">
                    {facilityData.assessments.due}
                  </Typography>
                  {facilityData.assessments.overdue > 0 && (
                    <Box display="flex" alignItems="center" mt={1}>
                      <WarningIcon color="error" fontSize="small" />
                      <Typography variant="body2" color="error" sx={{ ml: 0.5 }}>
                        {facilityData.assessments.overdue} overdue
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <AssessmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Facility Overview */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Facility Overview
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Facility</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="center">Census</TableCell>
                    <TableCell align="center">Occupancy</TableCell>
                    <TableCell align="center">Staff</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {facilityData.facilities.map((facility) => (
                    <TableRow key={facility.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationOnIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {facility.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {facility.address}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={facility.type} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        {facility.occupied || facility.activePatients || 0}
                      </TableCell>
                      <TableCell align="center">
                        {facility.beds ? (
                          <Box>
                            <Typography variant="body2">
                              {((facility.occupied / facility.beds) * 100).toFixed(0)}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={(facility.occupied / facility.beds) * 100}
                              sx={{ width: 60, mx: 'auto' }}
                            />
                          </Box>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <AvatarGroup max={3} sx={{ justifyContent: 'center' }}>
                          {[...Array(Math.min(facility.staff, 3))].map((_, i) => (
                            <Avatar key={i} sx={{ width: 24, height: 24 }}>
                              {facility.staff - i}
                            </Avatar>
                          ))}
                        </AvatarGroup>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small">
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Alerts & Notifications */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Alerts & Notifications
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {facilityData.alerts.map((alert) => (
                <Box
                  key={alert.id}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: alert.type === 'warning' ? 'warning.light' : 
                            alert.type === 'success' ? 'success.light' : 'info.light',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  {alert.type === 'warning' ? (
                    <WarningIcon color="warning" />
                  ) : alert.type === 'success' ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <LocalHospitalIcon color="info" />
                  )}
                  <Box flex={1}>
                    <Typography variant="body2">
                      {alert.message}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {moment().subtract(Math.random() * 24, 'hours').fromNow()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item>
                <Button
                  variant="contained"
                  startIcon={<PeopleIcon />}
                  onClick={() => console.log('New admission')}
                >
                  New Admission
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<SwapHorizIcon />}
                  onClick={() => console.log('Start transition')}
                >
                  Start Transition
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  onClick={() => console.log('Complete assessment')}
                >
                  Complete Assessment
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<CalendarTodayIcon />}
                  onClick={() => console.log('Schedule review')}
                >
                  Schedule Review
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}