// imports/ui-fhir/groups/GroupsPage.jsx

import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Button,
  Box,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

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

  let data = {
    currentGroupId: '',
    selectedGroup: null,
    groups: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
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
  const isLoading = useTracker(() => {
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.Groups', {}, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('autopublish.Groups', {}, { limit: 1000 });
      return !handle.ready();
    }
  }, []);

  data.groups = useTracker(function(){
    return Groups.find().fetch();
  }, [])
  data.groupsIndex = useTracker(function(){
    return Session.get('GroupsTable.groupsIndex')
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

  function handleAddGroup(){
    console.log('Add Group button clicked');
    navigate('/groups/new');
  }

  function handleRowClick(groupId){
    console.log('GroupsPage.handleRowClick', groupId);
    navigate('/groups/' + groupId);
  }

  let layoutContents;
  if(data.groups.length > 0){
    layoutContents = <Box>
      <GroupsTable
        id="groupsTable"
        groups={data.groups}
        hideCheckbox={data.hideCheckbox}
        hideBarcode={!data.showSystemIds}
        hideFhirId={!data.showFhirIds}
        onRowClick={handleRowClick}
        count={data.groups.length}
        formFactor={formFactor}
      />
    </Box>
  } else {
    layoutContents = <FhirNoData
      resourceName="Group"
      addButtonLabel="Add Your First Group"
      onAdd={handleAddGroup}
    />
  }

  return (
    <Box id="groupsPage" sx={{ paddingLeft: paddingWidth + 'px', paddingRight: paddingWidth + 'px' }}>
      {data.groups.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pt: 2 }}>
          <Typography variant="h5">
            Groups
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddGroup}
          >
            Add Group
          </Button>
        </Box>
      )}
      {layoutContents}
    </Box>
  );
}

export default GroupsPage;
