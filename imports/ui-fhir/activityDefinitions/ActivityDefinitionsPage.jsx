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
    const autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);

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
    if (autoPublishEnabled) {
      handle = Meteor.subscribe('autopublish.ActivityDefinitions', query, { limit: 100 });
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

  let layoutContainer;
  if (activityDefinitions.length > 0) {
    layoutContainer = (
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={activityDefinitions.length + " Activity Definitions"}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              id="activityDefinitionSearchInput"
              fullWidth
              placeholder="Search by name, title, description..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              size="small"
            />
          </Box>
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
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          <Button
            id="newActivityDefinitionButton"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
          >
            New Activity Definition
          </Button>
        </CardActions>
      </Card>
    );
  } else {
    layoutContainer = (
      <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
        <Card sx={{ boxShadow: 3 }}>
          <CardHeader
            title="No Activity Definitions"
            subheader="No activity definitions found. Create one to get started."
          />
          <CardActions sx={{ justifyContent: 'center', p: 2 }}>
            <Button
              id="newActivityDefinitionButton"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
            >
              New Activity Definition
            </Button>
          </CardActions>
        </Card>
      </Container>
    );
  }

  return (
    <div id="activityDefinitionsPage" style={{ padding: "20px" }}>
      {layoutContainer}
    </div>
  );
}



export default ActivityDefinitionsPage;
