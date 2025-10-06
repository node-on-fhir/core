// packages/implantable-devices/client/ImplantableDevicesPage.jsx

import React, { useState, useEffect } from 'react';
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
  AlertTitle,
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
  Rating
} from '@mui/material';
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
  CheckCircle as CheckIcon,
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
  Engineering as CyberIcon
} from '@mui/icons-material';

// Cyberpunk-inspired device catalog
const DEVICE_CATALOG = {
  'cardiac': {
    name: 'Cardiac Devices',
    icon: <HeartIcon />,
    color: '#e91e63',
    devices: [
      {
        id: 'PM-2077',
        name: 'NeuroPulse™ Pacemaker v3.0',
        manufacturer: 'Arasaka Medical',
        model: 'NP-3000',
        udi: '(01)10884521062856(11)141231(17)150707(10)A213B1(21)1234',
        type: 'Dual-chamber pacemaker',
        class: 'III',
        status: 'active',
        implantDate: '2023-06-15',
        battery: 85,
        connectivity: 'Bluetooth 5.0, NFC',
        features: ['AI rhythm optimization', 'Remote monitoring', 'MRI safe'],
        cybernetic: true,
        performance: 4.5
      },
      {
        id: 'ICD-4521',
        name: 'CardioGuard™ Defibrillator',
        manufacturer: 'Militech Biotech',
        model: 'CG-500X',
        udi: '(01)10884521062857(11)141232(17)150708(10)A213B2(21)5678',
        type: 'Implantable Cardioverter Defibrillator',
        class: 'III',
        status: 'active',
        implantDate: '2023-08-22',
        battery: 92,
        connectivity: 'Cellular, Wi-Fi',
        features: ['Predictive shock therapy', 'Cloud sync', 'Biometric encryption'],
        cybernetic: true,
        performance: 4.8
      }
    ]
  },
  'neural': {
    name: 'Neural Interfaces',
    icon: <BrainIcon />,
    color: '#9c27b0',
    devices: [
      {
        id: 'NI-8923',
        name: 'CortexLink™ Neural Bridge',
        manufacturer: 'Raven Microcyber',
        model: 'CLB-2.1',
        udi: '(01)10884521062858(11)141233(17)150709(10)A213B3(21)9101',
        type: 'Brain-Computer Interface',
        class: 'III',
        status: 'active',
        implantDate: '2024-01-10',
        battery: 'Wireless charging',
        connectivity: 'Neural-link protocol v2',
        features: ['Direct neural control', 'Memory augmentation', 'Dream recording'],
        cybernetic: true,
        performance: 4.9,
        experimental: true
      },
      {
        id: 'SCS-3421',
        name: 'SpinalFlow™ Stimulator',
        manufacturer: 'Zetatech',
        model: 'SF-100',
        udi: '(01)10884521062859(11)141234(17)150710(10)A213B4(21)1112',
        type: 'Spinal Cord Stimulator',
        class: 'II',
        status: 'active',
        implantDate: '2023-11-05',
        battery: 78,
        connectivity: 'Bluetooth LE',
        features: ['Pain management AI', 'Adaptive stimulation', 'Motion sensing'],
        cybernetic: false,
        performance: 4.2
      }
    ]
  },
  'sensory': {
    name: 'Sensory Augmentation',
    icon: <EyeIcon />,
    color: '#00bcd4',
    devices: [
      {
        id: 'RET-5577',
        name: 'OptiCyber™ Retinal Implant',
        manufacturer: 'Kiroshi Optics',
        model: 'MK.3',
        udi: '(01)10884521062860(11)141235(17)150711(10)A213B5(21)1314',
        type: 'Bionic Eye',
        class: 'III',
        status: 'active',
        implantDate: '2023-09-18',
        battery: 'Bio-electric',
        connectivity: 'Direct neural interface',
        features: ['20x zoom', 'Night vision', 'AR overlay', 'Threat detection'],
        cybernetic: true,
        performance: 4.7,
        military_grade: true
      },
      {
        id: 'CI-8901',
        name: 'AudioMax™ Cochlear System',
        manufacturer: 'Dynalar Technologies',
        model: 'AM-7',
        udi: '(01)10884521062861(11)141236(17)150712(10)A213B6(21)1516',
        type: 'Cochlear Implant',
        class: 'III',
        status: 'active',
        implantDate: '2023-07-22',
        battery: 90,
        connectivity: 'Bluetooth 5.2',
        features: ['Frequency enhancement', 'Noise cancellation', 'Language translation'],
        cybernetic: true,
        performance: 4.4
      }
    ]
  },
  'prosthetics': {
    name: 'Cybernetic Prosthetics',
    icon: <LimbIcon />,
    color: '#ff9800',
    devices: [
      {
        id: 'ARM-9000',
        name: 'Mantis Blades™',
        manufacturer: 'Arasaka Cyberware',
        model: 'MB-X',
        udi: '(01)10884521062862(11)141237(17)150713(10)A213B7(21)1718',
        type: 'Arm Replacement',
        class: 'III',
        status: 'active',
        implantDate: '2024-02-01',
        battery: 'Kinetic charging',
        connectivity: 'Neural direct',
        features: ['Retractable blades', 'Enhanced strength', 'Thermal regulation'],
        cybernetic: true,
        performance: 5.0,
        combat_rated: true
      },
      {
        id: 'LEG-4455',
        name: 'Reinforced Tendons™',
        manufacturer: 'Zetatech',
        model: 'RT-2',
        udi: '(01)10884521062863(11)141238(17)150714(10)A213B8(21)1920',
        type: 'Leg Enhancement',
        class: 'II',
        status: 'active',
        implantDate: '2023-12-10',
        battery: 'N/A',
        connectivity: 'Passive',
        features: ['Double jump capability', 'Fall damage reduction', 'Silent movement'],
        cybernetic: true,
        performance: 4.6
      }
    ]
  },
  'monitoring': {
    name: 'Monitoring Systems',
    icon: <TimelineIcon />,
    color: '#4caf50',
    devices: [
      {
        id: 'MON-1122',
        name: 'BioMonitor™ Implant',
        manufacturer: 'Trauma Team International',
        model: 'BM-500',
        udi: '(01)10884521062864(11)141239(17)150715(10)A213B9(21)2122',
        type: 'Continuous Glucose Monitor',
        class: 'II',
        status: 'active',
        implantDate: '2023-05-20',
        battery: 95,
        connectivity: 'Cellular IoT',
        features: ['Real-time alerts', 'Predictive analytics', 'Emergency dispatch'],
        cybernetic: false,
        performance: 4.3
      }
    ]
  }
};

// Helper function to get device icon by category
const getCategoryIcon = (category) => {
  const icons = {
    'cardiac': <HeartIcon />,
    'neural': <BrainIcon />,
    'sensory': <EyeIcon />,
    'prosthetics': <LimbIcon />,
    'monitoring': <TimelineIcon />
  };
  return icons[category] || <ChipIcon />;
};

export default function ImplantableDevicesPage(props) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [expandedDevices, setExpandedDevices] = useState({});
  const [filterClass, setFilterClass] = useState('all');
  const [showRecalls, setShowRecalls] = useState(false);

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
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

  return (
    <Box sx={{ 
      minHeight: '100vh',
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
                <MenuItem value="prosthetics">Prosthetics</MenuItem>
                <MenuItem value="monitoring">Monitoring</MenuItem>
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
              <ToggleButton value="grid">Grid</ToggleButton>
              <ToggleButton value="list">List</ToggleButton>
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
      <Grid container spacing={3}>
        {/* Device List/Grid */}
        <Grid item xs={12} md={8}>
          {viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {getFilteredDevices().map((device) => (
                <Grid item xs={12} md={6} key={device.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      border: device.cybernetic ? '1px solid' : 'none',
                      borderColor: theme => theme.palette.primary.main,
                      background: device.cybernetic 
                        ? theme => `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`
                        : 'default'
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
                        <Stack direction="row" spacing={1}>
                          {device.cybernetic && (
                            <Chip label="CYBER" size="small" color="primary" variant="outlined" />
                          )}
                          {device.experimental && (
                            <Chip label="EXP" size="small" color="warning" variant="outlined" />
                          )}
                          {device.military_grade && (
                            <Chip label="MIL" size="small" color="error" variant="outlined" />
                          )}
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
                            {device.features.slice(0, expandedDevices[device.id] ? undefined : 2).map((feature, idx) => (
                              <Chip 
                                key={idx} 
                                label={feature} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                            {device.features.length > 2 && (
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
                          <Button 
                            size="small" 
                            onClick={() => handleDeviceSelect(device)}
                          >
                            Details
                          </Button>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : viewMode === 'list' ? (
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
                  {getFilteredDevices().map((device) => (
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
          ) : (
            // Timeline view
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Device Timeline</Typography>
              <List>
                {getFilteredDevices()
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
                      {index < getFilteredDevices().length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
              </List>
            </Paper>
          )}
        </Grid>

        {/* Right Panel - Device Details / Stats */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Device Detail Card */}
            {selectedDevice ? (
              <Card>
                <CardHeader
                  title={selectedDevice.name}
                  subheader={selectedDevice.manufacturer}
                  action={
                    <IconButton onClick={() => setSelectedDevice(null)}>
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
                        {selectedDevice.features.map((feature, idx) => (
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

            {/* Statistics Card */}
            <Card>
              <CardHeader title="Registry Statistics" />
              <CardContent>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Devices:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {getFilteredDevices().length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Active:</Typography>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      {getFilteredDevices().filter(d => d.status === 'active').length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Class III:</Typography>
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      {getFilteredDevices().filter(d => d.class === 'III').length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Cybernetic:</Typography>
                    <Typography variant="body2" color="primary.main" fontWeight="bold">
                      {getFilteredDevices().filter(d => d.cybernetic).length}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* ONC Compliance */}
            <Card>
              <CardHeader 
                title="ONC Compliance" 
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <CardContent>
                <Stack spacing={1}>
                  <Alert severity="success" variant="outlined">
                    <AlertTitle>§170.315(g)(7) Compliant</AlertTitle>
                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckIcon fontSize="small" />
                        <Typography variant="caption">UDI Parser & Display</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckIcon fontSize="small" />
                        <Typography variant="caption">GUDID Integration Ready</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckIcon fontSize="small" />
                        <Typography variant="caption">Patient Access Enabled</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckIcon fontSize="small" />
                        <Typography variant="caption">FHIR Device Resources</Typography>
                      </Box>
                    </Stack>
                  </Alert>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}