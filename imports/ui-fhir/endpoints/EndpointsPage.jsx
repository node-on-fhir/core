// /imports/ui-fhir/endpoints/EndpointsPage.jsx

import React, { useState } from 'react';
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
  TextField,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// Direct import - no Meteor.startup needed
import { Endpoints } from '/imports/lib/schemas/SimpleSchemas/Endpoints';

import EndpointsTable from '/imports/ui-tables/EndpointsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';


//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedEndpointId', false);
Session.setDefault('endpointPageTabIndex', 1);
Session.setDefault('endpointSearchFilter', '');
Session.setDefault('selectedEndpoint', false);
Session.setDefault('EndpointsPage.onePageLayout', true);
Session.setDefault('EndpointsPage.defaultQuery', {});
Session.setDefault('EndpointsTable.hideCheckbox', true);
Session.setDefault('EndpointsTable.endpointsIndex', 0);

//=============================================================================================================================================
// MAIN COMPONENT

export function EndpointsPage(props){
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('descending');

  // Subscribe to endpoints data
  const isLoading = useTracker(() => {
    const subscriptionLimit = get(Meteor, 'settings.public.defaults.subscriptionLimit', 1000);

    // Build query based on search filter
    let query = {};

    if(searchFilter && searchFilter.length > 0) {
      const looksLikeId = /^[a-f0-9]{24}$/i.test(searchFilter);

      if (looksLikeId) {
        query = {
          $or: [
            {'_id': searchFilter},
            {'id': searchFilter}
          ]
        };
        console.log('Endpoints subscription - ID query (optimized):', query);
      } else {
        query = {
          $or: [
            {'_id': searchFilter},
            {'id': searchFilter},
            {'name': {$regex: searchFilter, $options: 'i'}},
            {'address': {$regex: searchFilter, $options: 'i'}},
            {'status': {$regex: searchFilter, $options: 'i'}},
            {'managingOrganization.display': {$regex: searchFilter, $options: 'i'}},
            {'connectionType.coding.0.code': {$regex: searchFilter, $options: 'i'}}
          ]
        };
        console.log('Endpoints subscription - general query:', query);
      }
    }

    const handle = Meteor.subscribe('autopublish.Endpoints', query, {
      limit: subscriptionLimit,
      sort: { '_id': -1 }
    });
    return !handle.ready();
  }, [searchFilter]);

  let data = {
    currentEndpointId: '',
    selectedEndpoint: null,
    endpoints: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    endpointsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('EndpointsPage.onePageLayout');
  }, []);
  data.hideCheckbox = useTracker(function(){
    return Session.get('EndpointsTable.hideCheckbox');
  }, []);
  data.selectedEndpointId = useTracker(function(){
    return Session.get('selectedEndpointId');
  }, []);
  data.selectedEndpoint = useTracker(function(){
    return Endpoints.findOne({_id: Session.get('selectedEndpointId')});
  }, []);
  data.endpoints = useTracker(function(){
    let query = {};

    if(searchFilter && searchFilter.length > 0) {
      const looksLikeId = /^[a-f0-9]{24}$/i.test(searchFilter);

      if (looksLikeId) {
        query = {
          $or: [
            {'_id': searchFilter},
            {'id': searchFilter}
          ]
        };
      } else {
        query = {
          $or: [
            {'_id': searchFilter},
            {'id': searchFilter},
            {'name': {$regex: searchFilter, $options: 'i'}},
            {'address': {$regex: searchFilter, $options: 'i'}},
            {'status': {$regex: searchFilter, $options: 'i'}},
            {'managingOrganization.display': {$regex: searchFilter, $options: 'i'}},
            {'connectionType.coding.0.code': {$regex: searchFilter, $options: 'i'}}
          ]
        };
      }
    }

    const endpoints = Endpoints.find(query, {
      sort: {
        '_id': -1
      }
    }).fetch();

    console.log('[EndpointsPage] Fetched', endpoints.length, 'endpoints from client collection');
    if (endpoints.length > 0) {
      console.log('[EndpointsPage] First 3 endpoints:', endpoints.slice(0, 3).map(ep => ({
        _id: ep._id,
        name: get(ep, 'name'),
        address: get(ep, 'address'),
        status: get(ep, 'status')
      })));
    }

    return endpoints;
  }, [searchFilter]);
  data.endpointsIndex = useTracker(function(){
    return Session.get('EndpointsTable.endpointsIndex');
  }, []);
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, []);
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, []);


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");
  let noDataCardStyle = {};

  function handleAddEndpoint(){
    console.log('Add Endpoint button clicked');
    navigate('/endpoints/new');
  }

  function handleSortOrderChange(event, newOrder){
    if(newOrder !== null){
      setSortOrder(newOrder);
    }
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Endpoints
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.endpoints.length} endpoints found
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

              <Button
                id="addEndpointButton"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddEndpoint}
              >
                Add Endpoint
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              id="endpointSearchInput"
              fullWidth
              placeholder="Search endpoints by ID, name, address, status, organization..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.endpoints.length > 0){
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
        <EndpointsTable
          id='endpointsTable'
          endpoints={data.endpoints}
          count={data.endpoints.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          hideCheckbox={true}
          hideActionIcons={true}
          hideFhirId={true}
          hideBarcode={true}
          onRowClick={function(endpointId){
            console.log('Endpoint row clicked:', endpointId);
            Session.set('selectedEndpointId', endpointId);
            navigate('/endpoints/' + endpointId);
          }}
          onSetPage={function(index){
            Session.set('EndpointsTable.endpointsIndex', index);
          }}
          page={data.endpointsIndex}
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <Box
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
              {get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No endpoints were found. Endpoints define connection details for healthcare services.")}
            </Typography>
          </Box>
          <Button
            id="addEndpointButton"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddEndpoint}
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
            Add Your First Endpoint
          </Button>
        </CardContent>
      </Card>
    </Box>
  }

  return (
    <Box
      id="endpointsPage"
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

export default EndpointsPage;
