// imports/ui-fhir/auditEvents/AuditEventsPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Container,
  Card,
  CardHeader,
  CardContent,
  Button,
  TextField,
  Typography,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

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
      const handle = Meteor.subscribe('selectedPatient.AuditEvents', Session.get('selectedPatientId'), { limit: 100, sort: { recorded: -1 } });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('auditEvents', query, { limit: 100, sort: { recorded: -1 } });
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
    return AuditEvents.find(query, { sort: { recorded: -1 } }).fetch();
  }, [searchFilter]);

  function handleRowClick(auditEventId) {
    navigate('/audit-events/' + auditEventId);
  }

  function handleAddAuditEvent() {
    navigate('/audit-events/new');
  }

  function handleSearchChange(event) {
    setSearchFilter(event.target.value);
  }

  function setAuditEventsPageIndex(index) {
    Session.set('AuditEventsTable.auditEventsIndex', index);
  }

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let layoutContainer;

  // Header section - always rendered
  const headerSection = (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h5">
        {data.auditEvents.length} Audit Events
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          id="auditEventSearchInput"
          size="small"
          placeholder="Search audit events..."
          value={searchFilter}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />
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
    </Box>
  );

  if (data.auditEvents.length > 0) {
    layoutContainer = (
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerSection}
          sx={{ pb: 0 }}
        />
        <CardContent>
          <AuditEventsTable
            id="auditEventsTable"
            auditEvents={data.auditEvents}
            count={data.auditEvents.length}
            formFactorLayout={formFactor}
            rowsPerPage={LayoutHelpers.calcTableRows()}
            hideCheckbox={true}
            hideActionButton={true}
            onRowClick={handleRowClick}
            onSetPage={setAuditEventsPageIndex}
            page={data.auditEventsIndex}
          />
        </CardContent>
      </Card>
    );
  } else {
    layoutContainer = (
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerSection}
          sx={{ pb: 0 }}
        />
        <CardContent>
          <Box
            id="noAuditEventsMessage"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Audit Events Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchFilter ? 'Try adjusting your search criteria.' : 'Audit events will appear here when system activity is logged.'}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddAuditEvent}
            >
              Add Your First Audit Event
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Container id="auditEventsPage" maxWidth="lg" sx={{ py: 4 }}>
      {layoutContainer}
    </Container>
  );
}

export default AuditEventsPage;
