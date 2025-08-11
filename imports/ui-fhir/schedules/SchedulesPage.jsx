// /imports/ui-fhir/schedules/SchedulesPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { 
  Grid, 
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Button,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge'; 

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import SchedulesTable from './SchedulesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

 
//=============================================================================================================================================
// DATA CURSORS

import { Schedules } from '/imports/lib/schemas/SimpleSchemas/Schedules';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Get the Schedules collection - prefer global if available, otherwise use imported
function getSchedulesCollection() {
  // Check different possible locations for the collection
  if (typeof window !== 'undefined' && window.Schedules) {
    return window.Schedules;
  }
  if (Meteor.Collections?.Schedules) {
    return Meteor.Collections.Schedules;
  }
  return Schedules;
}

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedScheduleId', false);
Session.setDefault('schedulePageTabIndex', 1); 
Session.setDefault('scheduleSearchFilter', ''); 
Session.setDefault('selectedSchedule', false)
Session.setDefault('SchedulesPage.onePageLayout', true)
Session.setDefault('SchedulesPage.defaultQuery', {})
Session.setDefault('SchedulesTable.hideCheckbox', true)
Session.setDefault('SchedulesTable.schedulesIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function SchedulesPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Clean up debug flag on unmount
  useEffect(() => {
    return () => {
      Session.set('SchedulesPage.debugLogged', false);
      Session.set('SchedulesPage.debugLogged2', false);
      Session.set('SchedulesPage.debugLogged3', false);
    };
  }, []);

  // Subscribe to schedules data with search filter
  const isLoading = useTracker(() => {
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    
    // Build query for subscription
    let query = {};
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'identifier.0.value': {$regex: searchFilter, $options: 'i'}},
          {'actor.0.display': {$regex: searchFilter, $options: 'i'}},
          {'actor.0.reference': {$regex: searchFilter, $options: 'i'}},
          {'serviceCategory.0.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'serviceType.0.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'comment': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }
    
    if(autoPublishEnabled){
      const handle = Meteor.subscribe('autopublish.Schedules', query, { limit: 100 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('schedules', {});
      return !handle.ready();
    }
  }, [searchFilter]);

  // Data trackers
  const schedules = useTracker(() => {
    // Data is already filtered by the subscription
    return Schedules.find({}).fetch();
  }, []);
  
  const schedulesIndex = useTracker(() => {
    return Session.get('SchedulesTable.schedulesIndex', 0);
  }, []);
  
  const schedulesCount = schedules.length;

  // Navigate to new schedule form
  function onNewSchedule(){
    navigate('/schedules/new');
  }

  const tableColumns = [showPatientName, showPatientReference, showSystemId];

  // Navigate to new schedule form
  function handleRowClick(scheduleId){
    console.log('SchedulesPage.onRowClick', scheduleId);
    navigate('/schedules/' + scheduleId);
  }
  
  function handleSetPage(index){
    Session.set('SchedulesTable.schedulesIndex', index);
  }
  
  function handleChangeVisibility(event, newFormats) {
    setShowPatientName(newFormats.includes('patient-name'));
    setShowPatientReference(newFormats.includes('patient-reference'));
    setShowSystemId(newFormats.includes('system-id'));
    
    Session.set('SchedulesTable.showPatientName', newFormats.includes('patient-name'));
    Session.set('SchedulesTable.showPatientReference', newFormats.includes('patient-reference'));
    Session.set('SchedulesTable.showSystemId', newFormats.includes('system-id'));
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Schedules
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {schedules.length} schedules found
            </Typography>
          </Grid>
          <Grid item>
            <Box display="flex" gap={2} alignItems="center">
              <ToggleButtonGroup
                value={tableColumns.reduce((acc, show, idx) => {
                  if (show) {
                    if (idx === 0) acc.push('patient-name');
                    if (idx === 1) acc.push('patient-reference');
                    if (idx === 2) acc.push('system-id');
                  }
                  return acc;
                }, [])}
                onChange={handleChangeVisibility}
                aria-label="column visibility"
                size="small"
              >
                <ToggleButton value="patient-name" aria-label="show patient name">
                  <PersonIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="patient-reference" aria-label="show patient reference">
                  <BadgeIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="system-id" aria-label="show system id">
                  <CodeIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
              <ToggleButtonGroup
                value={sortOrder}
                exclusive
                onChange={(event, newOrder) => {
                  if(newOrder !== null){
                    setSortOrder(newOrder);
                  }
                }}
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
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={onNewSchedule}
              >
                Add Schedule
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="scheduleSearchInput"
            fullWidth
            placeholder="Search schedules by identifier, actor, service..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>
    );
  }

  let layoutContent;
  if(isLoading) {
    layoutContent = <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography>Loading schedules...</Typography>
    </Box>
  } else if(schedules.length > 0){
    layoutContent = <Card 
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
        <SchedulesTable 
          id='schedulesTable'
          schedules={schedules}
          count={schedules.length}
          hideCheckbox={true}
          hideStatus={false}
          hideName={false}
          hideStartDateTime={false}
          hideEndDateTime={false}
          hideActor={false}
          hideIdentifier={false}
          hideServiceCategory={false}
          hideServiceType={false}
          hideSpecialty={false}
          hideNotes={false}
          hideActionIcons={false}
          sortOrder={sortOrder}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          onRowClick={handleRowClick}
          onSetPage={handleSetPage}
          page={schedulesIndex}
        />
      </CardContent>
    </Card>
  } else {
    // Show empty table with message instead of hiding everything
    layoutContent = <Card 
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
        <SchedulesTable 
          id='schedulesTable'
          schedules={[]}
          count={0}
          hideCheckbox={true}
          hideStatus={false}
          hideName={false}
          hideStartDateTime={false}
          hideEndDateTime={false}
          hideActor={false}
          hideIdentifier={false}
          hideServiceCategory={false}
          hideServiceType={false}
          hideSpecialty={false}
          hideNotes={false}
          hideActionIcons={false}
          sortOrder={sortOrder}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          onRowClick={handleRowClick}
          onSetPage={handleSetPage}
          page={schedulesIndex}
        />
        {searchFilter && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No schedules found matching "{searchFilter}"
            </Typography>
            <Button
              variant="text"
              onClick={() => setSearchFilter('')}
              sx={{ mt: 1 }}
            >
              Clear search
            </Button>
          </Box>
        )}
        {!searchFilter && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No schedules found
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  }

  return (
    <Box 
      id="schedulesPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { renderHeader() }
      { layoutContent }
    </Box>
  );
}

export default SchedulesPage;