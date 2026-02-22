// /imports/ui-fhir/activityDefinitions/ActivityDefinitionsPage.jsx

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
  CardActions,
  Button,
  TextField,
  Box,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import ActivityDefinitionsTable from './ActivityDefinitionsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

// Import collection directly for reliable access
import { ActivityDefinitions } from '/imports/lib/schemas/SimpleSchemas/ActivityDefinitions';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedActivityDefinitionId', false);
Session.setDefault('selectedActivityDefinition', false);
Session.setDefault('ActivityDefinitionsPage.onePageLayout', true);
Session.setDefault('ActivityDefinitionsPage.defaultQuery', {});
Session.setDefault('ActivityDefinitionsTable.hideCheckbox', true);
Session.setDefault('ActivityDefinitionsTable.activityDefinitionIndex', 0);

//=============================================================================================================================================
// MAIN COMPONENT

export function ActivityDefinitionsPage(props) {
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');

  // Subscribe to ActivityDefinitions data
  const isLoading = useTracker(function() {
    const autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    let query = {};
    if (searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          { 'name': { $regex: searchFilter, $options: 'i' } },
          { 'title': { $regex: searchFilter, $options: 'i' } },
          { 'description': { $regex: searchFilter, $options: 'i' } },
          { '_id': searchFilter },
          { 'id': searchFilter }
        ]
      };
    }

    let handle;
    if (autoSubscribeEnabled) {
      handle = Meteor.subscribe('selectedPatient.ActivityDefinitions', Session.get('selectedPatientId'), { limit: 100 });
    }

    return handle ? !handle.ready() : false;
  }, [searchFilter]);

  // Get activity definitions from collection
  const activityDefinitions = useTracker(function() {
    let query = {};
    if (searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          { 'name': { $regex: searchFilter, $options: 'i' } },
          { 'title': { $regex: searchFilter, $options: 'i' } },
          { 'description': { $regex: searchFilter, $options: 'i' } },
          { '_id': searchFilter },
          { 'id': searchFilter }
        ]
      };
    }
    return ActivityDefinitions.find(query, { sort: { _id: -1 } }).fetch();
  }, [searchFilter]);

  const showSystemIds = useTracker(function() {
    return Session.get('showSystemIds');
  }, []);

  const showFhirIds = useTracker(function() {
    return Session.get('showFhirIds');
  }, []);

  function handleRowClick(activityDefinitionId) {
    navigate('/activity-definitions/' + activityDefinitionId);
  }

  function handleAddNew() {
    navigate('/activity-definitions/new');
  }


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  // Header with search - always rendered
  let headerContent = (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2} alignItems="center" justifyContent="space-between">
        <Grid item xs={12} sm={6}>
          <Typography variant="h4">
            Activity Definitions
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {activityDefinitions.length} activity definitions found
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box display="flex" justifyContent="flex-end">
            <Button
              id="newActivityDefinitionButton"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
            >
              New Activity Definition
            </Button>
          </Box>
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <TextField
            id="activityDefinitionSearchInput"
            fullWidth
            placeholder="Search by name, title, description..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            size="small"
          />
        </Grid>
      </Grid>
    </Box>
  );

  // Content - conditional based on data
  let layoutContainer;
  if (activityDefinitions.length > 0) {
    layoutContainer = (
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <ActivityDefinitionsTable
            id="activityDefinitionsTable"
            activityDefinitions={activityDefinitions}
            count={activityDefinitions.length}
            formFactorLayout={formFactor}
            rowsPerPage={LayoutHelpers.calcTableRows()}
            onRowClick={handleRowClick}
            hideActionButton={true}
          />
        </CardContent>
      </Card>
    );
  } else {
    layoutContainer = (
      <Box
        id="noActivityDefinitionsMessage"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '30vh',
          textAlign: 'center'
        }}
      >
        <Card sx={{ maxWidth: '600px', width: '100%', boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              No Activity Definitions
            </Typography>
            <Typography variant="body1" color="textSecondary">
              No activity definitions found. Create one to get started.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <div id="activityDefinitionsPage" style={{ padding: "20px" }}>
      {headerContent}
      {layoutContainer}
    </div>
  );
}



export default ActivityDefinitionsPage;
