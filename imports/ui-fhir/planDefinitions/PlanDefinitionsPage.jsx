// packages/hermes-tooling/client/pages/PlanDefinitionsPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  Grid,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';

import {
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Badge as BadgeIcon,
  LibraryBooks as LibraryIcon
} from '@mui/icons-material';

import { get } from 'lodash';
import PlanDefinitionsTable from '../components/PlanDefinitionsTable';

// Session Variables
Session.setDefault('selectedPlanDefinitionId', false);
Session.setDefault('PlanDefinitionsPage.onePageLayout', true);
Session.setDefault('PlanDefinitionsPage.defaultQuery', {});
Session.setDefault('PlanDefinitionsTable.hideCheckbox', true);
Session.setDefault('PlanDefinitionsTable.planDefinitionsIndex', 0);

//=============================================================================================================================================
// GLOBAL THEMING

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
};

// if we have a globally defined theme from a settings file
if(get(Meteor, 'settings.public.theme.palette')){
  theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
}

//=============================================================================================================================================
// COMPONENTS

export function PlanDefinitionsPage(props) {
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showSystemId, setShowSystemId] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  
  let data = {
    selectedPlanDefinitionId: '',
    selectedPlanDefinition: false,
    planDefinitions: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    planDefinitionsIndex: 0
  };
  
  // Combined subscription and data tracking
  const { isLoading, planDefinitions, collectionReady } = useTracker(() => {
    // Subscribe to the publication
    const handle = Meteor.subscribe('planDefinitions');
    const isReady = handle.ready();
    
    let definitions = [];
    let ready = false;
    
    // Access PlanDefinitions through Meteor.Collections
    if (Meteor.Collections && Meteor.Collections.PlanDefinitions) {
      ready = true;
      
      // Apply search filter
      let query = {};
      if(searchFilter && searchFilter.length > 0) {
        query = {
          $or: [
            {'_id': searchFilter},
            {'id': searchFilter},
            {'name': {$regex: searchFilter, $options: 'i'}},
            {'title': {$regex: searchFilter, $options: 'i'}},
            {'description': {$regex: searchFilter, $options: 'i'}}
          ]
        };
      }
      
      // Apply sort
      let sortOptions = {};
      if(sortOrder === 'ascending'){
        sortOptions = {sort: {id: 1}};
      } else {
        sortOptions = {sort: {id: -1}};
      }
      
      // Use Meteor.Collections.PlanDefinitions
      definitions = Meteor.Collections.PlanDefinitions.find(query, sortOptions).fetch();
      
      // Debug logging
      console.log('PlanDefinitionsPage - Collection ready:', ready);
      console.log('PlanDefinitionsPage - Subscription ready:', isReady);
      console.log('PlanDefinitionsPage - Records found:', definitions.length);
    } else {
      console.log('PlanDefinitionsPage - Meteor.Collections.PlanDefinitions not available yet');
    }
    
    return {
      isLoading: !isReady || !ready,
      planDefinitions: definitions,
      collectionReady: ready
    };
  }, [searchFilter, sortOrder]);
  
  // Update data object
  data.planDefinitions = planDefinitions;
  
  data.selectedPlanDefinitionId = useTracker(function(){
    return Session.get('selectedPlanDefinitionId');
  }, []);
  
  data.planDefinitionsIndex = useTracker(function(){
    return Session.get('PlanDefinitionsTable.planDefinitionsIndex');
  }, []);
  
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, []);
  
  // Helper functions
  function handleAddPlanDefinition(){
    console.log('Add PlanDefinition button clicked');
    navigate('/plan-definition/new');
  }

  function handleSortOrderChange(event, newOrder){
    if(newOrder !== null){
      setSortOrder(newOrder);
    }
  }

  function handleViewPlan(planId) {
    navigate(`/plan-definition/${planId}`);
  }

  // Render header
  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={1}>
              <LibraryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4">
                  Plan Definitions Library
                </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                  {data.planDefinitions.length} protocols available
                </Typography>
              </Box>
            </Box>
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
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddPlanDefinition}
              >
                Create Protocol
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="planDefinitionSearchInput"
            fullWidth
            placeholder="Search protocols by ID, name, title, or description..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>
    );
  }
  
  // Determine layout content
  let layoutContent;
  if(isLoading) {
    layoutContent = (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading plan definitions...</Typography>
      </Box>
    );
  } else if(data.planDefinitions.length > 0){
    layoutContent = (
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
          <PlanDefinitionsTable 
            id='planDefinitionsTable'
            planDefinitions={data.planDefinitions}
            count={data.planDefinitions.length}
            formFactorLayout="web"
            rowsPerPage={10}
            hideBarcode={!showSystemId}
            hideCheckbox={true}
            hideActionButton={true}
            order={sortOrder}
            onRowClick={function(planDefinitionId){
              console.log('PlanDefinitionsPage.onRowClick', planDefinitionId);
              handleViewPlan(planDefinitionId);
            }}
            onSetPage={function(index){
              Session.set('PlanDefinitionsTable.planDefinitionsIndex', index);
            }}                
            page={data.planDefinitionsIndex}
          />
        </CardContent>
      </Card>
    );
  } else {
    // No data state
    layoutContent = (
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
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <LibraryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Plan Definitions Available
            </Typography>
            {searchFilter ? (
              <>
                <Typography variant="body2" color="text.secondary" paragraph>
                  No protocols found matching "{searchFilter}"
                </Typography>
                <Button
                  variant="text"
                  onClick={() => setSearchFilter('')}
                  sx={{ mt: 1 }}
                >
                  Clear search
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Get started by creating your first clinical protocol
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddPlanDefinition}
                  sx={{ mt: 2 }}
                >
                  Create Your First Protocol
                </Button>
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box 
      id="planDefinitionsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: theme => theme.palette.mode === 'light' 
          ? theme.palette.grey[50]
          : theme.palette.background.default,
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3, md: 4 }
      }}
    >
      <Container maxWidth="xl">
        {renderHeader()}
        {layoutContent}
      </Container>
    </Box>
  );
}


export default PlanDefinitionsPage;
