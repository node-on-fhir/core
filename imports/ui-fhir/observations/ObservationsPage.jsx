// /imports/ui-fhir/observations/ObservationsPage.jsx

import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import {
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SubjectIcon from '@mui/icons-material/Subject';
import CategoryIcon from '@mui/icons-material/Category';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DevicesIcon from '@mui/icons-material/Devices';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SearchIcon from '@mui/icons-material/Search';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import ObservationsTable from './ObservationsTable';
import FhirNoData from '../components/FhirNoData.jsx';
import LayoutHelpers from '../../lib/LayoutHelpers';
import { FhirUtilities } from '../../lib/FhirUtilities';

import { get } from 'lodash';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('observationPageTabIndex', 1);
Session.setDefault('observationSearchFilter', '');
Session.setDefault('selectedObservationId', false);
Session.setDefault('selectedObservation', false)
Session.setDefault('ObservationsPage.onePageLayout', true)
Session.setDefault('ObservationsPage.defaultQuery', {})
Session.setDefault('ObservationsTable.hideCheckbox', true)
Session.setDefault('ObservationsTable.observationsIndex', 0)

//=============================================================================================================================================
// MAIN COMPONENT

export function ObservationsPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [searchFilter, setSearchFilter] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [showText, setShowText] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [showIssued, setShowIssued] = useState(false);
  const [showDevice, setShowDevice] = useState(false);
  const [showEffectiveDateTime, setShowEffectiveDateTime] = useState(false);

  let data = {
    selectedObservationId: '',
    selectedObservation: null,
    observations: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    observationsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ObservationsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ObservationsTable.hideCheckbox');
  }, [])
  data.selectedObservationId = useTracker(function(){
    return Session.get('selectedObservationId');
  }, [])
  data.selectedObservation = useTracker(function(){
    return Observations.findOne({_id: Session.get('selectedObservationId')});
  }, [])

  // Subscribe to observations data with patient filtering and search
  const isLoading = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    // Build patient filter query
    let query = {};
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');

      if(fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }

    // Add search filter to query
    if(searchFilter && searchFilter.length > 0) {
      const searchQuery = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'code.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'code.coding.0.code': {$regex: searchFilter, $options: 'i'}},
          {'code.text': {$regex: searchFilter, $options: 'i'}},
          {'subject.display': {$regex: searchFilter, $options: 'i'}},
          {'category.0.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'status': {$regex: searchFilter, $options: 'i'}}
        ]
      };

      // Merge with patient filter if exists
      if(Object.keys(query).length > 0) {
        query = { $and: [query, searchQuery] };
      } else {
        query = searchQuery;
      }
    }

    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.Observations', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.Observations', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  data.observations = useTracker(function(){
    const sortOptions = {};
    if (sortOrder === 'ascending') {
      sortOptions.sort = { 'effectiveDateTime': 1 };
    } else {
      sortOptions.sort = { 'effectiveDateTime': -1 };
    }
    return Observations.find({}, sortOptions).fetch();
  }, [sortOrder])

  data.observationsIndex = useTracker(function(){
    return Session.get('ObservationsTable.observationsIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])

  // Build distinct code options from the current observations
  let codeOptions = [];
  let codeSet = new Set();
  data.observations.forEach(function(obs){
    const code = get(obs, 'code.coding[0].code', '') || get(obs, 'code.coding.0.code', '');
    const display = get(obs, 'code.coding[0].display', '') || get(obs, 'code.coding.0.display', '') || get(obs, 'code.text', '');
    if(code && !codeSet.has(code)){
      codeSet.add(code);
      codeOptions.push({ code: code, display: display || code });
    }
  });
  codeOptions.sort(function(a, b){ return a.display.localeCompare(b.display); });

  // Apply client-side code filter
  let filteredObservations = data.observations;
  if(codeFilter && codeFilter.length > 0){
    filteredObservations = data.observations.filter(function(obs){
      const obsCode = get(obs, 'code.coding[0].code', '') || get(obs, 'code.coding.0.code', '');
      return obsCode === codeFilter;
    });
  }

  let formFactor = LayoutHelpers.determineFormFactor();

  function handleAddObservation(){
    console.log('Add Observation button clicked');
    navigate('/observations/new');
  }

  function onTableRowClick(observationId){
    console.log('ObservationsPage: Row clicked with ID:', observationId);
    navigate('/observations/' + observationId);
  }

  function handleSortOrderChange(event, newOrder){
    if(newOrder !== null){
      setSortOrder(newOrder);
    }
  }

  function handleToggleChange(event, newToggles) {
    setShowText(newToggles.includes('text'));
    setShowCategory(newToggles.includes('category'));
    setShowIssued(newToggles.includes('issued'));
    setShowEffectiveDateTime(newToggles.includes('effectiveDateTime'));
    setShowDevice(newToggles.includes('device'));
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Observations
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {filteredObservations.length} observations found
            </Typography>
          </Grid>
          <Grid item>
            <Box display="flex" gap={2} alignItems="center">
              <ToggleButtonGroup
                value={[
                  ...(showText ? ['text'] : []),
                  ...(showCategory ? ['category'] : []),
                  ...(showIssued ? ['issued'] : []),
                  ...(showEffectiveDateTime ? ['effectiveDateTime'] : []),
                  ...(showDevice ? ['device'] : [])
                ]}
                onChange={handleToggleChange}
                aria-label="column visibility"
                size="small"
              >
                <ToggleButton value="text" aria-label="show text">
                  <SubjectIcon />
                </ToggleButton>
                <ToggleButton value="category" aria-label="show category">
                  <CategoryIcon />
                </ToggleButton>
                <ToggleButton value="issued" aria-label="show issued">
                  <CalendarTodayIcon />
                </ToggleButton>
                <ToggleButton value="effectiveDateTime" aria-label="show performed">
                  <ScheduleIcon />
                </ToggleButton>
                <ToggleButton value="device" aria-label="show device">
                  <DevicesIcon />
                </ToggleButton>
              </ToggleButtonGroup>
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
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddObservation}
              >
                Add Observation
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2} display="flex" gap={2} alignItems="center">
          <TextField
            id="observationSearchInput"
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search observations by ID, code, patient, category, or status..."
            value={searchFilter}
            onChange={function(e) { setSearchFilter(e.target.value); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          {codeOptions.length > 0 && (
            <FormControl sx={{ minWidth: 220 }} size="small">
              <InputLabel id="codeFilterLabel">Code Filter</InputLabel>
              <Select
                labelId="codeFilterLabel"
                id="codeFilterSelect"
                value={codeFilter}
                onChange={function(e) { setCodeFilter(e.target.value); }}
                label="Code Filter"
              >
                <MenuItem value="">
                  <em>All Codes</em>
                </MenuItem>
                {codeOptions.map(function(option) {
                  return (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>
    );
  }

  let layoutContent;
  if(filteredObservations.length > 0){
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
        <ObservationsTable
          formFactorLayout={formFactor}
          observations={ filteredObservations }
          count={ filteredObservations.length }
          rowsPerPage={LayoutHelpers.calcTableRows()}
          actionButtonLabel="Send"
          hideTextIcon={!showText}
          hideCategory={!showCategory}
          hideIssued={!showIssued}
          hideEffectiveDateTime={!showEffectiveDateTime}
          hideDevices={!showDevice}
          onRowClick={ onTableRowClick }
          onSetPage={function(index){
            Session.set('ObservationsTable.observationsIndex', index)
          }}
          page={data.observationsIndex}
          tableRowSize="medium"
          size="medium"
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <FhirNoData
      resourceType="Observation"
      searchFilter={searchFilter}
      onAdd={handleAddObservation}
    />
  }


  return (
    <Box
      id="observationsPage"
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


export default ObservationsPage;
