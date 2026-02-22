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
  Typography,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import BadgeIcon from '@mui/icons-material/Badge';

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
  const [sortOrder, setSortOrder] = useState('descending');
  const [showSystemId, setShowSystemId] = useState(false);

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

    if (autoSubscribeEnabled) {
      const handle = Meteor.subscribe('autopublish.ActivityDefinitions', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.ActivityDefinitions', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
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
    return ActivityDefinitions.find(query, { sort: { _id: sortOrder === 'ascending' ? 1 : -1 } }).fetch();
  }, [searchFilter, sortOrder]);

  const showSystemIds = useTracker(function() {
    return Session.get('showSystemIds');
  }, []);

  const showFhirIds = useTracker(function() {
    return Session.get('showFhirIds');
  }, []);

  function handleSortOrderChange(event, newOrder){
    if(newOrder !== null){
      setSortOrder(newOrder);
    }
  }

  function handleRowClick(activityDefinitionId) {
    navigate('/activity-definitions/' + activityDefinitionId);
  }

  function handleAddNew() {
    navigate('/activity-definitions/new');
  }


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  function renderHeader() {
    return (
      <Box mb={2}>
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
                id="newActivityDefinitionButton"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddNew}
              >
                New Activity Definition
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="activityDefinitionSearchInput"
              fullWidth
              placeholder="Search by name, title, description..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                backgroundColor: 'background.paper',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContainer;
  if (activityDefinitions.length > 0) {
    layoutContainer = (
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
          <ActivityDefinitionsTable
            id="activityDefinitionsTable"
            activityDefinitions={activityDefinitions}
            count={activityDefinitions.length}
            formFactorLayout={formFactor}
            rowsPerPage={LayoutHelpers.calcTableRows()}
            onRowClick={handleRowClick}
            hideActionButton={true}
            hideBarcode={!showSystemId}
            order={sortOrder}
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
          minHeight: '50vh',
          textAlign: 'center'
        }}
      >
        <Card
          className="no-data-card"
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
                No Activity Definitions found. Create one to get started.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
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
              Add Your First Activity Definition
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      id="activityDefinitionsPage"
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { renderHeader() }
      { layoutContainer }
    </Box>
  );
}



export default ActivityDefinitionsPage;
