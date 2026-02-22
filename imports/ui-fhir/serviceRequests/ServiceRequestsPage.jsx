// /imports/ui-fhir/serviceRequests/ServiceRequestsPage.jsx

import React, { useState, useEffect } from 'react';
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
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PersonIcon from '@mui/icons-material/Person';
import EngineeringIcon from '@mui/icons-material/Engineering';
import SendIcon from '@mui/icons-material/Send';
import BadgeIcon from '@mui/icons-material/Badge';
import SearchIcon from '@mui/icons-material/Search';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import ServiceRequestsTable from './ServiceRequestsTable';
import FhirNoData from '../components/FhirNoData.jsx';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';
import { FhirUtilities } from '../../lib/FhirUtilities';

// Direct imports to avoid timing issues
import { ServiceRequests } from '/imports/lib/schemas/SimpleSchemas/ServiceRequests';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedServiceRequestId', false);
Session.setDefault('ServiceRequestsPage.sortOrder', 'descending');
Session.setDefault('ServiceRequestsPage.searchFilter', '');
Session.setDefault('ServiceRequestsTable.serviceRequestsIndex', 0);
Session.setDefault('ServiceRequestsPage.debugLogged', false);

//=============================================================================================================================================
// MAIN COMPONENT

export function ServiceRequestsPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [searchFilter, setSearchFilter] = useState('');
  const [showSubject, setShowSubject] = useState(false);
  const [showPerformer, setShowPerformer] = useState(false);
  const [showRequestor, setShowRequestor] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);

  let data = {
    selectedServiceRequestId: '',
    selectedServiceRequest: null,
    serviceRequests: [],
    serviceRequestsIndex: 0
  };

  // Reset debug logging when component unmounts
  useEffect(function() {
    return function() {
      Session.set('ServiceRequestsPage.debugLogged', false);
    };
  }, []);

  data.selectedServiceRequestId = useTracker(function(){
    return Session.get('selectedServiceRequestId');
  }, []);
  data.selectedServiceRequest = useTracker(function(){
    return ServiceRequests.findOne({_id: Session.get('selectedServiceRequestId')});
  }, []);
  data.serviceRequestsIndex = useTracker(function(){
    return Session.get('ServiceRequestsTable.serviceRequestsIndex');
  }, []);

  // Subscribe to ServiceRequests with patient filtering and search
  const isLoading = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    let query = {};

    // Build patient filter query
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
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'intent': {$regex: searchFilter, $options: 'i'}},
          {'code.text': {$regex: searchFilter, $options: 'i'}},
          {'code.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'subject.display': {$regex: searchFilter, $options: 'i'}},
          {'requester.display': {$regex: searchFilter, $options: 'i'}},
          {'performer.0.display': {$regex: searchFilter, $options: 'i'}}
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
      const handle = Meteor.subscribe('autopublish.ServiceRequests', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.ServiceRequests', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  // Get the filtered data
  data.serviceRequests = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');

    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;

    const query = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};

    // Debug logging (only once)
    if(!Session.get('ServiceRequestsPage.debugLogged')) {
      Session.set('ServiceRequestsPage.debugLogged', true);

      console.log('ServiceRequests data - MongoDB _id:', selectedPatientId);
      console.log('ServiceRequests data - FHIR id:', fhirId);
      console.log('ServiceRequests data - query:', query);
      console.log('ServiceRequests data - Total records:', ServiceRequests.find({}).count());
      console.log('ServiceRequests data - Filtered records:', ServiceRequests.find(query).count());
    }

    return ServiceRequests.find(query).fetch();
  }, []);

  let formFactor = LayoutHelpers.determineFormFactor();

  function handleAddServiceRequest(){
    console.log('Add Service Request button clicked');
    navigate('/service-requests/new');
  }

  function handleSortOrderChange(event, newOrder){
    if(newOrder !== null){
      setSortOrder(newOrder);
      Session.set('ServiceRequestsPage.sortOrder', newOrder);
    }
  }

  function handleToggleChange(event, newToggles) {
    setShowSubject(newToggles.includes('subject'));
    setShowPerformer(newToggles.includes('performer'));
    setShowRequestor(newToggles.includes('requestor'));
    setShowSystemId(newToggles.includes('systemId'));
  }

  function renderHeader() {
    const selectedPatient = Session.get('selectedPatient');
    const patientName = get(selectedPatient, 'name[0].text', '');

    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Service Requests
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.serviceRequests.length} service requests found
              {patientName && ` for ${patientName}`}
            </Typography>
          </Grid>
          <Grid item>
            <Box display="flex" gap={2} alignItems="center">
              <ToggleButtonGroup
                value={[
                  ...(showSubject ? ['subject'] : []),
                  ...(showPerformer ? ['performer'] : []),
                  ...(showRequestor ? ['requestor'] : []),
                  ...(showSystemId ? ['systemId'] : [])
                ]}
                onChange={handleToggleChange}
                aria-label="column visibility"
                size="small"
              >
                <ToggleButton value="subject" aria-label="show subject">
                  <PersonIcon />
                </ToggleButton>
                <ToggleButton value="performer" aria-label="show performer">
                  <EngineeringIcon />
                </ToggleButton>
                <ToggleButton value="requestor" aria-label="show requestor">
                  <SendIcon />
                </ToggleButton>
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
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
                onClick={handleAddServiceRequest}
              >
                Add Service Request
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="serviceRequestSearchInput"
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search service requests by ID, status, intent, code, subject, requester, or performer..."
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
        </Box>
      </Box>
    );
  }

  // Sort service requests by authoredOn
  let sortedServiceRequests = [...data.serviceRequests];
  sortedServiceRequests.sort(function(a, b) {
    let dateA = get(a, 'authoredOn', '');
    let dateB = get(b, 'authoredOn', '');

    if (sortOrder === 'ascending') {
      return dateA > dateB ? 1 : -1;
    } else {
      return dateA < dateB ? 1 : -1;
    }
  });

  let layoutContent;
  if(isLoading){
    layoutContent = null;
  } else if(data.serviceRequests.length > 0){
    layoutContent = <Card
      id="serviceRequestsCard"
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
        <ServiceRequestsTable
          id='serviceRequestsTable'
          serviceRequests={sortedServiceRequests}
          count={sortedServiceRequests.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          hideCheckbox={true}
          hideSubjectName={!showSubject}
          hideSubjectReference={!showSubject}
          hidePerformerName={!showPerformer}
          hidePerformerReference={!showPerformer}
          hideRequestorName={!showRequestor}
          hideRequestorReference={!showRequestor}
          hideBarcode={!showSystemId}
          hideIdentifier={true}
          hideText={true}
          hideOrderDetail={true}
          hideDoNotPerform={true}
          noDataMessage={false}
          onSetPage={function(index){
            Session.set('ServiceRequestsTable.serviceRequestsIndex', index);
          }}
          page={data.serviceRequestsIndex}
          onRowClick={function(serviceRequestId){
            console.log('ServiceRequestsPage.onRowClick', serviceRequestId);
            navigate('/service-requests/' + serviceRequestId);
          }}
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <FhirNoData
      resourceType="ServiceRequest"
      searchFilter={searchFilter}
      onAdd={handleAddServiceRequest}
    />
  }

  return (
    <Box
      id="serviceRequestsPage"
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

export default ServiceRequestsPage;
