import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

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
import BadgeIcon from '@mui/icons-material/Badge';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';

// import DeviceDetail from './DeviceDetail';
import DevicesTable from './DevicesTable';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import LayoutHelpers from '../../lib/LayoutHelpers';
import { Devices } from '/imports/lib/schemas/SimpleSchemas/Devices';



//=============================================================================================================================================
// DATA CURSORS

//=============================================================================================================================================
// Session Variables

Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('selectedDeviceId', false);


Session.setDefault('devicePageTabIndex', 1); 
Session.setDefault('deviceSearchFilter', ''); 
Session.setDefault('selectedDeviceId', false);
Session.setDefault('selectedDevice', false)
Session.setDefault('DevicesPage.onePageLayout', true)
Session.setDefault('DevicesPage.defaultQuery', {})
Session.setDefault('DevicesTable.hideCheckbox', true)
Session.setDefault('DevicesTable.devicesIndex', 0)



//=============================================================================================================================================
// GLOBAL THEMING

// This is necessary for the Material UI component render layer
let theme = {
  primaryColor: "rgb(177, 128, 13)",
  primaryText: "rgba(255, 255, 255, 1) !important",

  secondaryColor: "rgb(177, 128, 13)",
  secondaryText: "rgba(255, 255, 255, 1) !important",

  cardColor: "rgba(255, 255, 255, 1) !important",
  cardTextColor: "rgba(0, 0, 0, 1) !important",

  errorColor: "rgb(128,20,60) !important",
  errorText: "#ffffff !important",

  appBarColor: "#f5f5f5 !important",
  appBarTextColor: "rgba(0, 0, 0, 1) !important",

  paperColor: "#f5f5f5 !important",
  paperTextColor: "rgba(0, 0, 0, 1) !important",

  backgroundCanvas: "rgba(255, 255, 255, 1) !important",
  background: "linear-gradient(45deg, rgb(177, 128, 13) 30%, rgb(150, 202, 144) 90%)",

  nivoTheme: "greens"
}

// if we have a globally defined theme from a settings file
if(get(Meteor, 'settings.public.theme.palette')){
  theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
}




//=============================================================================================================================================
// COMPONENTS

export function DevicesPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showSystemId, setShowSystemId] = useState(false);
  const [showType, setShowType] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  let data = {
    selectedDeviceId: '',
    selectedDevice: false,
    devices: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    devicesIndex: 0
  };
  
  // Subscribe to devices data with search filter
  const isLoading = useTracker(() => {
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);

    console.log('[DevicesPage] Autopublish enabled:', autoPublishEnabled);
    console.log('[DevicesPage] Search filter:', searchFilter);

    // Build query for subscription
    let query = {};
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'deviceName.0.name': {$regex: searchFilter, $options: 'i'}},
          {'manufacturer': {$regex: searchFilter, $options: 'i'}},
          {'modelNumber': {$regex: searchFilter, $options: 'i'}},
          {'serialNumber': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }

    console.log('[DevicesPage] Subscription query:', JSON.stringify(query));

    if(autoPublishEnabled){
      const handle = Meteor.subscribe('autopublish.Devices', query, { limit: 100 });
      console.log('[DevicesPage] Subscription handle:', handle);
      console.log('[DevicesPage] Subscription ready:', handle.ready());
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('devices.all');
      console.log('[DevicesPage] Using devices.all subscription, ready:', handle.ready());
      return !handle.ready();
    }
  }, [searchFilter]);


  data.selectedDeviceId = useTracker(function(){
    return Session.get('selectedDeviceId');
  }, [])
  data.selectedDevice = useTracker(function(){
    return Devices.findOne(Session.get('selectedDeviceId'));
  }, [])
  data.devices = useTracker(function(){
    // Data is already sorted by the server-side publication
    // No client-side sorting to avoid conflicts
    return Devices.find({}).fetch()
  }, [])
  data.devicesIndex = useTracker(function(){
    return Session.get('DevicesTable.devicesIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])

  

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  let noDataCardStyle = {};

  function handleAddDevice(){
    console.log('Add Device button clicked');
    navigate('/devices/new');
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
              Devices
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.devices.length} devices found
            </Typography>
          </Grid>
          <Grid item>
            <Box display="flex" gap={2} alignItems="center">
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
                value={[
                  ...(showSystemId ? ['systemId'] : []),
                  ...(showType ? ['type'] : [])
                ]}
                onChange={(event, newFormats) => {
                  setShowSystemId(newFormats.includes('systemId'));
                  setShowType(newFormats.includes('type'));
                }}
                aria-label="display options"
                size="small"
              >
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
                <ToggleButton value="type" aria-label="show device type">
                  <DevicesOtherIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddDevice}
              >
                Add Device
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="deviceSearchInput"
            fullWidth
            placeholder="Search devices by ID, name, manufacturer, model, or serial number..."
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
      <Typography>Loading devices...</Typography>
    </Box>
  } else if(data.devices.length > 0){
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
        <DevicesTable
          id='devicesTable'
          devices={data.devices}
          count={data.devices.length}
          formFactorLayout={formFactor}
          rowsPerPage={10}
          hideBarcode={!showSystemId}
          hideTypeCodingDisplay={!showType}
          order={sortOrder}
          onRowClick={function(deviceId){
            console.log('DevicesPage.onRowClick', deviceId);
            navigate('/devices/' + deviceId);
          }}
          onSetPage={function(index){
            Session.set('DevicesTable.devicesIndex', index);
          }}
          page={data.devicesIndex}
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
        <DevicesTable
          id='devicesTable'
          devices={[]}
          count={0}
          formFactorLayout={formFactor}
          rowsPerPage={10}
          hideBarcode={!showSystemId}
          hideTypeCodingDisplay={!showType}
          order={sortOrder}
          onRowClick={function(deviceId){
            console.log('DevicesPage.onRowClick', deviceId);
            navigate('/devices/' + deviceId);
          }}
          onSetPage={function(index){
            Session.set('DevicesTable.devicesIndex', index);
          }}
          page={data.devicesIndex}
        />
        {searchFilter && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No devices found matching "{searchFilter}"
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
              No devices found
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  }

  return (
    <Box 
      id="devicesPage" 
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


export default DevicesPage;