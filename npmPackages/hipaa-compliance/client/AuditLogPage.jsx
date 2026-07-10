// npmPackages/hipaa-compliance/client/AuditLogPage.jsx

import React, { useState } from 'react';
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
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  FilterList,
  Download,
  Search,
  ChevronLeft,
  Person,
  Event,
  Warning,
  CheckCircle,
  Error,
  Info,
  Description
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { flattenAuditEvent } from '../lib/AuditEventMapping';
import { EventTypes } from '../lib/Constants';

// Client-side mirror of the AuditEvents collection — the hipaa.auditEvents
// publication streams (decrypted) documents into it. Reuse the core
// registration when present so we don't double-instantiate.
function getAuditEventsCollection() {
  return get(Meteor, 'Collections.AuditEvents')
    || get(window, 'Collections.AuditEvents')
    || null;
}

// Colors keyed by FHIR AuditEvent.action code
const actionColors = {
  'C': 'success',
  'R': 'info',
  'U': 'warning',
  'D': 'error',
  'E': 'default'
};

const eventTypeIcons = {
  create: <CheckCircle />,
  view: <Info />,
  read: <Info />,
  access: <Info />,
  update: <Warning />,
  modify: <Warning />,
  delete: <Error />,
  login: <Person />,
  logout: <Person />,
  denied: <Warning />,
  export: <Description />
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

  // Subscribe to the role-gated audit publication and mirror its filters
  // against minimongo (FHIR paths).
  const { auditEvents, totalCount, isLoading } = useTracker(() => {
    const AuditEvents = getAuditEventsCollection();
    if (!AuditEvents) {
      return { auditEvents: [], totalCount: 0, isLoading: false };
    }

    const filters = {
      limit: rowsPerPage * (page + 1)
    };
    if (startDate && endDate) {
      filters.startDate = startDate.toDate();
      filters.endDate = endDate.toDate();
    }
    if (selectedUser) {
      filters.userId = selectedUser;
    }
    if (selectedEventType) {
      filters.eventType = selectedEventType;
    }
    if (searchTerm) {
      filters.searchText = searchTerm;
    }

    const subscription = Meteor.subscribe('hipaa.auditEvents', filters);

    const query = {};
    if (searchTerm) {
      query.$or = [
        { outcomeDesc: { $regex: searchTerm, $options: 'i' } },
        { 'agent.who.display': { $regex: searchTerm, $options: 'i' } },
        { 'patient.display': { $regex: searchTerm, $options: 'i' } }
      ];
    }
    if (startDate && endDate) {
      query.recorded = {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      };
    }
    if (selectedUser) {
      query['agent.who.reference'] = selectedUser;
    }
    if (selectedEventType) {
      query['type.code'] = selectedEventType;
    }
    if (selectedOutcome) {
      query.outcome = selectedOutcome;
    }

    const events = AuditEvents.find(query, {
      sort: { recorded: -1 },
      limit: rowsPerPage,
      skip: page * rowsPerPage
    }).fetch().map(flattenAuditEvent);

    const count = AuditEvents.find(query).count();

    return {
      auditEvents: events,
      totalCount: count,
      isLoading: !subscription.ready()
    };
  }, [page, rowsPerPage, searchTerm, startDate, endDate, selectedUser, selectedEventType, selectedOutcome]);

  // Get unique users for filter dropdown
  const uniqueUsers = useTracker(() => {
    const AuditEvents = getAuditEventsCollection();
    if (!AuditEvents) {
      return [];
    }

    const users = AuditEvents.find({}, {
      fields: { agent: 1 }
    }).fetch();

    const uniqueMap = new Map();
    users.forEach(event => {
      const name = get(event, 'agent[0].who.display', 'Unknown');
      const reference = get(event, 'agent[0].who.reference', '');
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
    const exportFilters = {
      startDate: startDate.toDate(),
      endDate: endDate.toDate()
    };
    if (selectedUser) {
      exportFilters.userId = selectedUser;
    }
    if (selectedEventType) {
      exportFilters.eventType = selectedEventType;
    }
    Meteor.call('hipaa.auditEvents.exportCsv', exportFilters, (error, result) => {
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

  const getEventChip = (flatEvent) => {
    const color = actionColors[flatEvent.action] || 'default';
    const icon = eventTypeIcons[flatEvent.eventType] || <Event />;
    return (
      <Chip
        icon={icon}
        label={flatEvent.eventType || flatEvent.action}
        color={color}
        size="small"
      />
    );
  };

  const getOutcomeChip = (outcome) => {
    const color = outcome === '0' ? 'success' : 'error';
    const label = outcome === '0' ? 'Success' : 'Failed';
    return <Chip label={label} color={color} size="small" variant="outlined" />;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box id="auditLogPage" sx={{ p: 3 }}>
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
            placeholder="Search by user name, patient name, or event details..."
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
                          {getEventChip(event)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {event.userName || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {event.userId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {event.patientName || event.resourceReference || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {event.patientId ? 'Patient/' + event.patientId : event.resourceType}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 300 }} noWrap>
                            {event.message || '-'}
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
                  <MenuItem value={EventTypes.CREATE}>Create</MenuItem>
                  <MenuItem value={EventTypes.VIEW}>View</MenuItem>
                  <MenuItem value={EventTypes.READ}>Read</MenuItem>
                  <MenuItem value={EventTypes.UPDATE}>Update</MenuItem>
                  <MenuItem value={EventTypes.DELETE}>Delete</MenuItem>
                  <MenuItem value={EventTypes.LOGIN}>Login</MenuItem>
                  <MenuItem value={EventTypes.LOGOUT}>Logout</MenuItem>
                  <MenuItem value={EventTypes.DENIED}>Denied</MenuItem>
                  <MenuItem value={EventTypes.EXPORT}>Export</MenuItem>
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
