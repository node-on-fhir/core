// /packages/hipaa-compliance/client/AuditLogPage.jsx

import React, { useState, useEffect } from 'react';
import { 
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  InputAdornment
} from '@mui/material';
import { 
  FilterList,
  Download,
  Search,
  ChevronLeft,
  Assessment,
  Person,
  Event,
  Description,
  Warning,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
// Access AuditEvents from global collections
let AuditEvents = null;

// Try to get AuditEvents collection
if (Meteor.isClient) {
  Meteor.startup(function() {
    AuditEvents = get(window, 'Collections.AuditEvents') || 
                  get(global, 'Collections.AuditEvents') || 
                  get(Meteor, 'Collections.AuditEvents');
  });
}

const eventTypeColors = {
  'CREATE': 'success',
  'READ': 'info',
  'UPDATE': 'warning',
  'DELETE': 'error',
  'LOGIN': 'primary',
  'LOGOUT': 'secondary',
  'EXECUTE': 'default'
};

const eventTypeIcons = {
  'CREATE': <CheckCircle />,
  'READ': <Info />,
  'UPDATE': <Warning />,
  'DELETE': <Error />,
  'LOGIN': <Person />,
  'LOGOUT': <Person />,
  'EXECUTE': <Description />
};

export default function AuditLogPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(moment().subtract(30, 'days'));
  const [endDate, setEndDate] = useState(moment());
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState('');

  // Subscribe to audit events
  const { auditEvents, totalCount, isLoading } = useTracker(() => {
    // Check if AuditEvents collection is available
    if (!AuditEvents) {
      // Try to get it again
      AuditEvents = get(window, 'Collections.AuditEvents') || 
                    get(global, 'Collections.AuditEvents') || 
                    get(Meteor, 'Collections.AuditEvents');
      
      if (!AuditEvents) {
        return {
          auditEvents: [],
          totalCount: 0,
          isLoading: false
        };
      }
    }
    
    const subscription = Meteor.subscribe('auditEvents');
    
    const query = {};
    
    // Apply filters
    if (searchTerm) {
      query.$or = [
        { 'agent.name': { $regex: searchTerm, $options: 'i' } },
        { 'entity.reference': { $regex: searchTerm, $options: 'i' } },
        { 'entity.display': { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (startDate && endDate) {
      query.recorded = {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      };
    }
    
    if (selectedUser) {
      query['agent.reference'] = selectedUser;
    }
    
    if (selectedEventType) {
      query['action'] = selectedEventType;
    }
    
    if (selectedOutcome) {
      query['outcome'] = selectedOutcome;
    }
    
    const events = AuditEvents.find(query, {
      sort: { recorded: -1 },
      limit: rowsPerPage,
      skip: page * rowsPerPage
    }).fetch();
    
    const count = AuditEvents.find(query).count();
    
    return {
      auditEvents: events,
      totalCount: count,
      isLoading: !subscription.ready()
    };
  }, [page, rowsPerPage, searchTerm, startDate, endDate, selectedUser, selectedEventType, selectedOutcome]);

  // Get unique users for filter dropdown
  const uniqueUsers = useTracker(() => {
    if (!AuditEvents) {
      return [];
    }
    
    const users = AuditEvents.find({}, {
      fields: { 'agent.name': 1, 'agent.reference': 1 }
    }).fetch();
    
    const uniqueMap = new Map();
    users.forEach(event => {
      const name = get(event, 'agent.name', 'Unknown');
      const reference = get(event, 'agent.reference', '');
      if (reference) {
        uniqueMap.set(reference, name);
      }
    });
    
    return Array.from(uniqueMap, ([value, label]) => ({ value, label }));
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportCsv = () => {
    setLoading(true);
    Meteor.call('hipaa.auditEvents.exportCsv', {
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      userId: selectedUser,
      eventType: selectedEventType
    }, (error, result) => {
      setLoading(false);
      if (error) {
        console.error('Export failed:', error);
      } else {
        // Create download link
        const blob = new Blob([result], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${moment().format('YYYY-MM-DD')}.csv`;
        a.click();
      }
    });
  };

  const getEventIcon = (action) => {
    return eventTypeIcons[action] || <Event />;
  };

  const getEventChip = (action) => {
    const color = eventTypeColors[action] || 'default';
    return (
      <Chip
        icon={getEventIcon(action)}
        label={action}
        color={color}
        size="small"
      />
    );
  };

  const getOutcomeChip = (outcome) => {
    const outcomeValue = get(outcome, 'code', '0');
    const color = outcomeValue === '0' ? 'success' : 'error';
    const label = outcomeValue === '0' ? 'Success' : 'Failed';
    return <Chip label={label} color={color} size="small" variant="outlined" />;
  };

  // Show error message if AuditEvents collection is not available
  if (!AuditEvents && !isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          <Typography variant="h6">HIPAA Audit Log Not Available</Typography>
          <Typography variant="body2">
            The AuditEvents collection is not available. Please ensure the core Honeycomb system is properly initialized.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            HIPAA Audit Log
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setFilterDrawerOpen(true)}
            >
              Filters
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExportCsv}
              disabled={loading}
            >
              Export CSV
            </Button>
          </Stack>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Total Events
                </Typography>
                <Typography variant="h4" sx={{ mt: 'auto' }}>
                  {totalCount.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Date Range
                </Typography>
                <Typography variant="h6" sx={{ mt: 'auto' }}>
                  {startDate.format('MMM DD')} - {endDate.format('MMM DD, YYYY')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Active Filters
                </Typography>
                <Typography variant="h4" sx={{ mt: 'auto' }}>
                  {[selectedUser, selectedEventType, selectedOutcome, searchTerm].filter(Boolean).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Recent Activity
                </Typography>
                <Typography variant="h6" sx={{ mt: 'auto' }} color={auditEvents[0] ? "text.primary" : "text.secondary"}>
                  {auditEvents[0] ? moment(auditEvents[0].recorded).fromNow() : 'No events'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search Bar */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by user name, patient ID, or resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Data Table */}
        <Paper>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Event Type</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Patient/Resource</TableCell>
                      <TableCell>Action Details</TableCell>
                      <TableCell>Outcome</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditEvents.map((event) => (
                      <TableRow key={event._id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {moment(event.recorded).format('MMM DD, YYYY')}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {moment(event.recorded).format('h:mm:ss A')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getEventChip(event.action)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {get(event, 'agent[0].name', 'Unknown User')}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {get(event, 'agent[0].requestor.identifier.value', '')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {get(event, 'entity[0].what.display', get(event, 'entity[0].what.reference', 'N/A'))}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {get(event, 'entity[0].type.display', '')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 300 }} noWrap>
                            {get(event, 'outcomeDesc', get(event, 'type.display', '-'))}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getOutcomeChip(event.outcome)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </>
          )}
        </Paper>

        {/* Filter Drawer */}
        <Drawer
          anchor="right"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{ sx: { width: 320 } }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <IconButton onClick={() => setFilterDrawerOpen(false)} sx={{ mr: 1 }}>
                <ChevronLeft />
              </IconButton>
              <Typography variant="h6">Filters</Typography>
            </Box>
            
            <Stack spacing={3}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              
              <FormControl fullWidth>
                <InputLabel>User</InputLabel>
                <Select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  label="User"
                >
                  <MenuItem value="">All Users</MenuItem>
                  {uniqueUsers.map(user => (
                    <MenuItem key={user.value} value={user.value}>
                      {user.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  label="Event Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="CREATE">Create</MenuItem>
                  <MenuItem value="READ">Read</MenuItem>
                  <MenuItem value="UPDATE">Update</MenuItem>
                  <MenuItem value="DELETE">Delete</MenuItem>
                  <MenuItem value="LOGIN">Login</MenuItem>
                  <MenuItem value="LOGOUT">Logout</MenuItem>
                  <MenuItem value="EXECUTE">Execute</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Outcome</InputLabel>
                <Select
                  value={selectedOutcome}
                  onChange={(e) => setSelectedOutcome(e.target.value)}
                  label="Outcome"
                >
                  <MenuItem value="">All Outcomes</MenuItem>
                  <MenuItem value="0">Success</MenuItem>
                  <MenuItem value="4">Failed</MenuItem>
                </Select>
              </FormControl>
              
              <Divider />
              
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setSearchTerm('');
                  setSelectedUser('');
                  setSelectedEventType('');
                  setSelectedOutcome('');
                  setStartDate(moment().subtract(30, 'days'));
                  setEndDate(moment());
                }}
              >
                Clear Filters
              </Button>
            </Stack>
          </Box>
        </Drawer>
      </Box>
    </LocalizationProvider>
  );
}