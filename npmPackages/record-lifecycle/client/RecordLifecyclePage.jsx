// npmPackages/record-lifecycle/client/RecordLifecyclePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import {
  Container,
  Box,
  Typography,
  Alert,
  AlertTitle,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Card,
  CardHeader,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';

import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

// =============================================================================
// Record Lifecycle Debug Page
// =============================================================================
//
// Settings-gated debug UI showing a live event stream from the EventBus.
// Uses the tri-state loading pattern (null = loading, true = enabled, false = disabled).
// Auto-refreshes every 3 seconds when enabled.
// =============================================================================

// Lifecycle event → color mapping for chips
const EVENT_COLORS = {
  originate: 'success',
  amend: 'info',
  attest: 'primary',
  deprecate: 'warning',
  reactivate: 'secondary',
  destroy: 'error',
  access: 'default'
};

function RecordLifecyclePage() {
  // Tri-state: null = loading, true = enabled, false = disabled
  const [featureEnabled, setFeatureEnabled] = useState(null);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterEvent, setFilterEvent] = useState('');
  const [filterCollection, setFilterCollection] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if feature is enabled on mount
  useEffect(function() {
    Meteor.call('recordLifecycle.checkSettings', function(error, result) {
      if (error) {
        console.warn('[RecordLifecyclePage] Error checking settings:', error.reason);
        setFeatureEnabled(false);
      } else {
        setFeatureEnabled(get(result, 'enabled', false));
      }
    });
  }, []);

  // Fetch events and status
  const fetchEvents = useCallback(function() {
    if (!featureEnabled) return;

    setLoading(true);

    Meteor.call('recordLifecycle.getRecentEvents', 100, function(error, result) {
      setLoading(false);
      if (error) {
        console.error('[RecordLifecyclePage] Error fetching events:', error.reason);
      } else {
        setEvents(result || []);
      }
    });

    Meteor.call('recordLifecycle.getStatus', function(error, result) {
      if (!error && result) {
        setStatus(result);
      }
    });
  }, [featureEnabled]);

  // Initial fetch
  useEffect(function() {
    if (featureEnabled) {
      fetchEvents();
    }
  }, [featureEnabled, fetchEvents]);

  // Auto-refresh interval
  useEffect(function() {
    if (!featureEnabled || !autoRefresh) return;

    const interval = setInterval(fetchEvents, 3000);
    return function() {
      clearInterval(interval);
    };
  }, [featureEnabled, autoRefresh, fetchEvents]);

  // Filter events
  const filteredEvents = events.filter(function(event) {
    if (filterEvent && event.lifecycleEvent !== filterEvent) return false;
    if (filterCollection && event.collectionName !== filterCollection) return false;
    return true;
  });

  // Collect unique values for filter dropdowns
  const uniqueEvents = [...new Set(events.map(function(e) { return e.lifecycleEvent; }))].sort();
  const uniqueCollections = [...new Set(events.map(function(e) { return e.collectionName; }))].sort();

  // --- Render ---

  // Loading state
  if (featureEnabled === null) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Disabled state
  if (featureEnabled === false) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Record Lifecycle Events
        </Typography>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Record Lifecycle Disabled</AlertTitle>
          The Record Lifecycle event bus is not enabled. Contact your administrator to enable
          it in the server settings (Meteor.settings.private.recordLifecycle.enabled).
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Record Lifecycle Events
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={autoRefresh ? <PauseIcon /> : <PlayArrowIcon />}
            onClick={function() { setAutoRefresh(!autoRefresh); }}
          >
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchEvents}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Status Card */}
      {status && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Events</Typography>
                <Typography variant="h6">{status.totalEmitted || 0}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Buffer Size</Typography>
                <Typography variant="h6">{status.bufferSize || 0} / {status.bufferCapacity || 500}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Subscribers</Typography>
                <Typography variant="h6">{status.subscriberCount || 0}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Auto-Refresh</Typography>
                <Typography variant="h6">{autoRefresh ? 'On (3s)' : 'Paused'}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="filter-event-label">Lifecycle Event</InputLabel>
          <Select
            labelId="filter-event-label"
            value={filterEvent}
            onChange={function(e) { setFilterEvent(e.target.value); }}
            label="Lifecycle Event"
          >
            <MenuItem value="">All Events</MenuItem>
            {uniqueEvents.map(function(evt) {
              return <MenuItem key={evt} value={evt}>{evt}</MenuItem>;
            })}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="filter-collection-label">Collection</InputLabel>
          <Select
            labelId="filter-collection-label"
            value={filterCollection}
            onChange={function(e) { setFilterCollection(e.target.value); }}
            label="Collection"
          >
            <MenuItem value="">All Collections</MenuItem>
            {uniqueCollections.map(function(col) {
              return <MenuItem key={col} value={col}>{col}</MenuItem>;
            })}
          </Select>
        </FormControl>

        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
          Showing {filteredEvents.length} of {events.length} events
        </Typography>
      </Box>

      {/* Events Table */}
      <TableContainer>
        <Table size="small" id="recordLifecycleTable">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Event</TableCell>
              <TableCell>CRUD</TableCell>
              <TableCell>Collection</TableCell>
              <TableCell>Resource ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Fields</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    {events.length === 0
                      ? 'No events recorded yet. Create, update, or delete a resource to see events here.'
                      : 'No events match the current filters.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map(function(event) {
                const time = new Date(event.timestamp);
                const timeStr = time.toLocaleTimeString();

                return (
                  <TableRow
                    key={event.id}
                    sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                  >
                    <TableCell>
                      <Typography variant="caption">{timeStr}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={event.lifecycleEvent}
                        size="small"
                        color={EVENT_COLORS[event.lifecycleEvent] || 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{event.crudOperation}</Typography>
                    </TableCell>
                    <TableCell>{event.collectionName}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {event.resourceId ? event.resourceId.substring(0, 12) + '...' : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{event.currentStatus || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{event.userId ? event.userId.substring(0, 8) + '...' : '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {event.fieldNames && event.fieldNames.length > 0
                          ? event.fieldNames.join(', ')
                          : '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default RecordLifecyclePage;
