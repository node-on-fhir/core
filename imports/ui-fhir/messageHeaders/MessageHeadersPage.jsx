// /imports/ui-fhir/messageHeaders/MessageHeadersPage.jsx

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
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';

import MessageHeadersTable from './MessageHeadersTable';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import LayoutHelpers from '../../lib/LayoutHelpers';
import FhirUtilities from '../../lib/FhirUtilities';
import { MessageHeaders } from '/imports/lib/schemas/SimpleSchemas/MessageHeaders';


//=============================================================================================================================================
// DATA CURSORS


//=============================================================================================================================================
// Session Variables

Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('selectedMessageHeaderId', false);


Session.setDefault('messageHeaderPageTabIndex', 1); 
Session.setDefault('messageHeaderSearchFilter', ''); 
Session.setDefault('selectedMessageHeaderId', false);
Session.setDefault('selectedMessageHeader', false)
Session.setDefault('MessageHeadersPage.onePageLayout', true)
Session.setDefault('MessageHeadersPage.defaultQuery', {})
Session.setDefault('MessageHeadersTable.hideCheckbox', true)
Session.setDefault('MessageHeadersTable.messageHeadersIndex', 0)



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

export function MessageHeadersPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showSystemId, setShowSystemId] = useState(false);
  const [showFocusDisplay, setShowFocusDisplay] = useState(false);
  const [showFocusReference, setShowFocusReference] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  let data = {
    selectedMessageHeaderId: '',
    selectedMessageHeader: false,
    messageHeaders: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    messageHeadersIndex: 0
  };
  
  // Subscribe to message headers data with search filter
  const isLoading = useTracker(() => {
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    
    // Build query for subscription
    let query = {};
    
    // Add search filter
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'destination.0.name': {$regex: searchFilter, $options: 'i'}},
          {'destination.0.endpoint': {$regex: searchFilter, $options: 'i'}},
          {'sender.display': {$regex: searchFilter, $options: 'i'}},
          {'source.name': {$regex: searchFilter, $options: 'i'}},
          {'eventCoding.display': {$regex: searchFilter, $options: 'i'}},
          {'response.identifier': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }
    
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.MessageHeaders', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.MessageHeaders', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [searchFilter]);


  data.selectedMessageHeaderId = useTracker(function(){
    return Session.get('selectedMessageHeaderId');
  }, [])
  data.selectedMessageHeader = useTracker(function(){
    return MessageHeaders.findOne(Session.get('selectedMessageHeaderId'));
  }, [])
  data.messageHeaders = useTracker(function(){
    // No patient filtering for MessageHeaders - it's an infrastructure resource
    return MessageHeaders.find({}).fetch();
  }, [])
  data.messageHeadersIndex = useTracker(function(){
    return Session.get('MessageHeadersTable.messageHeadersIndex')
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

  function handleAddMessageHeader(){
    console.log('Add Message Header button clicked');
    navigate('/message-headers/new');
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
              Message Headers
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.messageHeaders.length} message headers found
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
                  ...(showFocusDisplay ? ['focusDisplay'] : []),
                  ...(showFocusReference ? ['focusReference'] : [])
                ]}
                onChange={(event, newFormats) => {
                  setShowSystemId(newFormats.includes('systemId'));
                  setShowFocusDisplay(newFormats.includes('focusDisplay'));
                  setShowFocusReference(newFormats.includes('focusReference'));
                }}
                aria-label="display options"
                size="small"
              >
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
                <ToggleButton value="focusDisplay" aria-label="show focus display">
                  <PersonIcon />
                </ToggleButton>
                <ToggleButton value="focusReference" aria-label="show focus reference">
                  <CodeIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddMessageHeader}
              >
                Add Message Header
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="messageHeaderSearchInput"
            fullWidth
            placeholder="Search message headers by ID, destination, sender, event, or response..."
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
  if(data.messageHeaders.length > 0){
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
        <MessageHeadersTable 
          id='messageHeadersTable'
          messageHeaders={data.messageHeaders}
          count={data.messageHeaders.length}
          formFactorLayout={formFactor}
          rowsPerPage={10}
          hideBarcode={!showSystemId}
          hideFocusDisplay={!showFocusDisplay}
          hideFocusReference={!showFocusReference}
          order={sortOrder}
          onRowClick={function(messageHeaderId){
            console.log('MessageHeadersPage.onRowClick', messageHeaderId);
            navigate('/message-headers/' + messageHeaderId);
          }}
          onSetPage={function(index){
            Session.set('MessageHeadersTable.messageHeadersIndex', index);
          }}                
          page={data.messageHeadersIndex}
        />
      </CardContent>
    </Card>
  } else {
    // Show empty state with "Add Your First Message Header" button
    layoutContent = <Card 
      sx={{ 
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        minHeight: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Data Available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {searchFilter ? `No message headers found matching "${searchFilter}"` : 'No message headers found'}
        </Typography>
        {searchFilter ? (
          <Button
            variant="outlined"
            onClick={() => setSearchFilter('')}
          >
            Clear Search
          </Button>
        ) : (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddMessageHeader}
          >
            Add Your First Message Header
          </Button>
        )}
      </CardContent>
    </Card>
  }

  return (
    <Box 
      id="messageHeadersPage" 
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


export default MessageHeadersPage;