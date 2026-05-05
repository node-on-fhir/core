// imports/ui-fhir/groups/GroupsPage.jsx

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
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import BadgeIcon from '@mui/icons-material/Badge';
import CodeIcon from '@mui/icons-material/Code';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import GroupsTable from './GroupsTable';
import FhirNoData from '../components/FhirNoData.jsx';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  Groups = Meteor.Collections.Groups;
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedGroupId', false);
Session.setDefault('selectedGroup', false);
Session.setDefault('groupSearchFilter', '');
Session.setDefault('GroupsPage.onePageLayout', true);
Session.setDefault('GroupsPage.defaultQuery', {});
Session.setDefault('GroupsTable.hideCheckbox', true);
Session.setDefault('GroupsTable.groupsIndex', 0);


//=============================================================================================================================================
// MAIN COMPONENT

export function GroupsPage(props){
  const navigate = useNavigate();

  let [searchFilter, setSearchFilter] = useState('');
  let [showSystemId, setShowSystemId] = useState(false);
  let [showFhirId, setShowFhirId] = useState(false);

  let data = {
    currentGroupId: '',
    selectedGroup: null,
    groups: [],
    onePageLayout: true,
    groupsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('GroupsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('GroupsTable.hideCheckbox');
  }, [])
  data.selectedGroupId = useTracker(function(){
    return Session.get('selectedGroupId');
  }, [])
  data.selectedGroup = useTracker(function(){
    return Groups.findOne({_id: Session.get('selectedGroupId')});
  }, [])

  // Subscribe to groups data
  const isLoading = useTracker(function() {
    const selectedPatientId = Session.get('selectedPatientId');
    const handle = Meteor.subscribe('selectedPatient.Groups', selectedPatientId, { limit: 1000 });
    return !handle.ready();
  }, []);

  data.groups = useTracker(function(){
    let query = {};
    if(searchFilter && searchFilter.length > 0){
      query = {
        $or: [
          {'name': {$regex: searchFilter, $options: 'i'}},
          {'description': {$regex: searchFilter, $options: 'i'}},
          {'type': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }
    return Groups.find(query).fetch();
  }, [searchFilter])

  data.groupsIndex = useTracker(function(){
    return Session.get('GroupsTable.groupsIndex')
  }, [])

  let formFactor = LayoutHelpers.determineFormFactor();

  function handleAddGroup(){
    console.log('Add Group button clicked');
    navigate('/groups/new');
  }

  function handleRowClick(groupId){
    console.log('GroupsPage.handleRowClick', groupId);
    navigate('/groups/' + groupId);
  }

  function handleToggleColumn(event, newFormats){
    setShowSystemId(newFormats.includes('systemId'));
    setShowFhirId(newFormats.includes('fhirId'));
  }

  function renderHeader(){
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Groups
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.groups.length} {data.groups.length === 1 ? 'group' : 'groups'} found
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={1} alignItems="center" justifyContent="flex-end" flexWrap="wrap">
              <TextField
                id="groupSearchInput"
                size="small"
                placeholder="Search groups..."
                value={searchFilter}
                onChange={function(e){ setSearchFilter(e.target.value); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 200 }}
              />
              <ToggleButtonGroup
                value={[
                  showSystemId && 'systemId',
                  showFhirId && 'fhirId'
                ].filter(Boolean)}
                onChange={handleToggleColumn}
                aria-label="column visibility"
                size="small"
              >
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
                <ToggleButton value="fhirId" aria-label="show fhir id">
                  <CodeIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <Button
                id="addGroupButton"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddGroup}
              >
                Add Group
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContents;
  if(data.groups.length > 0){
    layoutContents = <Card
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
        <GroupsTable
          id="groupsTable"
          groups={data.groups}
          hideCheckbox={data.hideCheckbox}
          hideBarcode={!showSystemId}
          hideFhirId={!showFhirId}
          onRowClick={handleRowClick}
          count={data.groups.length}
          formFactor={formFactor}
        />
      </CardContent>
    </Card>
  } else {
    layoutContents = <FhirNoData
      resourceName="Group"
      addButtonLabel="Add Your First Group"
      onAdd={handleAddGroup}
    />
  }

  return (
    <Box id="groupsPage" sx={{
      minHeight: '100vh',
      backgroundColor: 'background.default',
      px: { xs: 2, sm: 3, md: 4 },
      py: { xs: 3, sm: 4, md: 5 }
    }}>
      {data.groups.length > 0 && renderHeader()}
      {layoutContents}
    </Box>
  );
}

export default GroupsPage;
