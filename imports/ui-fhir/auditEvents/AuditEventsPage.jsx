// imports/ui-fhir/auditEvents/AuditEventsPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import {
  Grid,
  Box,
  Container,
  Card,
  CardHeader,
  CardContent,
  Button,
  TextField,
  Typography,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import BadgeIcon from '@mui/icons-material/Badge';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import AuditEventsTable from './AuditEventsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { AuditEvents } from '../../lib/schemas/SimpleSchemas/AuditEvents';

// Session defaults
Session.setDefault('auditEventSearchFilter', '');
Session.setDefault('AuditEventsPage.onePageLayout', true);
Session.setDefault('AuditEventsTable.hideCheckbox', true);
Session.setDefault('AuditEventsTable.auditEventsIndex', 0);

export function AuditEventsPage(props) {
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('descending');
  const [showSystemId, setShowSystemId] = useState(false);

  let data = {
    auditEvents: [],
    auditEventsIndex: 0,
    onePageLayout: true
  };

  data.onePageLayout = useTracker(function() {
    return Session.get('AuditEventsPage.onePageLayout');
  }, []);

  data.auditEventsIndex = useTracker(function() {
    return Session.get('AuditEventsTable.auditEventsIndex');
  }, []);

  // Subscribe and fetch data
  const isLoading = useTracker(() => {
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    let query = {};
    if (searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          { '_id': searchFilter },
          { 'id': searchFilter },
          { 'action': { $regex: searchFilter, $options: 'i' } },
          { 'outcome': { $regex: searchFilter, $options: 'i' } },
          { 'outcomeDesc': { $regex: searchFilter, $options: 'i' } },
          { 'type.display': { $regex: searchFilter, $options: 'i' } },
          { 'type.code': { $regex: searchFilter, $options: 'i' } },
          { 'agent.0.who.display': { $regex: searchFilter, $options: 'i' } },
          { 'source.observer.display': { $regex: searchFilter, $options: 'i' } }
        ]
      };
    }

    if (autoSubscribeEnabled) {
      const handle = Meteor.subscribe('autopublish.AuditEvents', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.AuditEvents', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [searchFilter]);

  data.auditEvents = useTracker(function() {
    let query = {};
    if (searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          { '_id': searchFilter },
          { 'id': searchFilter },
          { 'action': { $regex: searchFilter, $options: 'i' } },
          { 'outcome': { $regex: searchFilter, $options: 'i' } },
          { 'outcomeDesc': { $regex: searchFilter, $options: 'i' } },
          { 'type.display': { $regex: searchFilter, $options: 'i' } },
          { 'type.code': { $regex: searchFilter, $options: 'i' } },
          { 'agent.0.who.display': { $regex: searchFilter, $options: 'i' } },
          { 'source.observer.display': { $regex: searchFilter, $options: 'i' } }
        ]
      };
    }
    return AuditEvents.find(query, { sort: { recorded: sortOrder === 'ascending' ? 1 : -1 } }).fetch();
  }, [searchFilter, sortOrder]);

  function handleRowClick(auditEventId) {
    navigate('/audit-events/' + auditEventId);
  }

  function handleAddAuditEvent() {
    navigate('/audit-events/new');
  }

  function handleSearchChange(event) {
    setSearchFilter(event.target.value);
  }

  function handleSortOrderChange(event, newOrder){
    if(newOrder !== null){
      setSortOrder(newOrder);
    }
  }

  function setAuditEventsPageIndex(index) {
    Session.set('AuditEventsTable.auditEventsIndex', index);
  }

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let layoutContainer;

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Audit Events
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.auditEvents.length} audit events found
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={2} alignItems="center" justifyContent="flex-end">
              <ToggleButtonGroup
                value={sortOrder}
                exclusive
                onChange={handleSortOrderChange}
                aria-label="sort order"
                size="small"
              >
                <ToggleButton value="ascending" aria-label="ascending order">
                  <ArrowUpwardIcon />
                </ToggleButton>
                <ToggleButton value="descending" aria-label="descending order">
                  <ArrowDownwardIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <ToggleButtonGroup
                value={showSystemId ? ['systemId'] : []}
                onChange={(event, newFormats) => {
                  setShowSystemId(newFormats.includes('systemId'));
                }}
                aria-label="display options"
                size="small"
              >
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <Button
                id="newAuditEventButton"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddAuditEvent}
              >
                Add Audit Event
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="auditEventSearchInput"
              fullWidth
              placeholder="Search audit events by ID, action, outcome, type, agent..."
              value={searchFilter}
              onChange={handleSearchChange}
              variant="outlined"
              size="small"
              sx={{
                backgroundColor: 'background.paper',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (data.auditEvents.length > 0) {
    layoutContainer = (
      <Card
        sx={{
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <AuditEventsTable
            id="auditEventsTable"
            auditEvents={data.auditEvents}
            count={data.auditEvents.length}
            formFactorLayout={formFactor}
            rowsPerPage={LayoutHelpers.calcTableRows()}
            hideCheckbox={true}
            hideActionButton={true}
            hideBarcode={!showSystemId}
            order={sortOrder}
            onRowClick={handleRowClick}
            onSetPage={setAuditEventsPageIndex}
            page={data.auditEventsIndex}
          />
        </CardContent>
      </Card>
    );
  } else {
    layoutContainer = (
      <Box
        id="noAuditEventsMessage"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          textAlign: 'center'
        }}
      >
        <Card
          className="no-data-card"
          sx={{
            maxWidth: '600px',
            width: '100%',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper'
          }}
        >
          <CardContent sx={{ p: 6 }}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 500,
                  color: 'text.primary',
                  mb: 2
                }}
              >
                {get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.7,
                  maxWidth: '480px',
                  mx: 'auto'
                }}
              >
                {searchFilter ? 'Try adjusting your search criteria.' : 'Audit events will appear here when system activity is logged.'}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddAuditEvent}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                py: 1,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2
                }
              }}
            >
              Add Your First Audit Event
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      id="auditEventsPage"
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { renderHeader() }
      { layoutContainer }
    </Box>
  );
}

export default AuditEventsPage;
