import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Grid, 
  Container,
  Divider,
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

import TaskDetail from './TaskDetail';
import TasksTable from './TasksTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

 
//=============================================================================================================================================
// DATA CURSORS

let Tasks;
Meteor.startup(async function(){
  if(Meteor.isClient){
    Tasks = await global.Collections.Tasks;
  }
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedTaskId', false);


Session.setDefault('taskPageTabIndex', 1); 
Session.setDefault('taskSearchFilter', ''); 
Session.setDefault('selectedTaskId', false);
Session.setDefault('selectedTask', false)
Session.setDefault('TasksPage.onePageLayout', true)
Session.setDefault('TasksPage.defaultQuery', {})
Session.setDefault('TasksTable.hideCheckbox', true)
Session.setDefault('TasksTable.tasksIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function TasksPage(props){

  let data = {
    currentTaskId: '',
    selectedTask: null,
    tasks: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    tasksIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('TasksPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('TasksTable.hideCheckbox');
  }, [])
  data.selectedTaskId = useTracker(function(){
    return Session.get('selectedTaskId');
  }, [])
  data.selectedTask = useTracker(function(){
    if(Tasks){
      return Tasks.findOne({_id: Session.get('selectedTaskId')});
    }
    return null;
  }, [])
  data.tasks = useTracker(function(){
    if(Tasks){
      return Tasks.find().fetch();
    }
    return [];
  }, [])
  data.tasksIndex = useTracker(function(){
    return Session.get('TasksTable.tasksIndex')
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

  function handleAddTask(){
    console.log('Add Task button clicked');
    Session.set('selectedTaskId', false);
    Session.set('selectedTask', false);
    Session.set('TasksPage.onePageLayout', false);
  }

  function handleRowClick(taskId){
    console.log('TasksPage.handleRowClick', taskId);
    Session.set('selectedTaskId', taskId);
    Session.set('selectedTask', Tasks.findOne({_id: taskId}));
    Session.set('TasksPage.onePageLayout', false);
  }

  function handleTaskInsert(taskId){
    console.log('TasksPage.handleTaskInsert', taskId);
    Session.set('selectedTaskId', false);
    Session.set('selectedTask', false);
    Session.set('TasksPage.onePageLayout', true);
  }

  function handleTaskUpdate(taskId){
    console.log('TasksPage.handleTaskUpdate', taskId);
    Session.set('selectedTaskId', false);
    Session.set('selectedTask', false);
    Session.set('TasksPage.onePageLayout', true);
  }

  function handleTaskRemove(taskId){
    console.log('TasksPage.handleTaskRemove', taskId);
    Session.set('selectedTaskId', false);
    Session.set('selectedTask', false);
    Session.set('TasksPage.onePageLayout', true);
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Tasks
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.tasks.length} tasks found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddTask}
            >
              Add Task
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.onePageLayout){
    if(data.tasks.length > 0){
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
          <TasksTable 
            id='tasksTable'
            tasks={data.tasks}
            count={data.tasks.length}  
            formFactorLayout={formFactor}
            rowsPerPage={LayoutHelpers.calcTableRows()} 
            actionButtonLabel="Remove"
            hideStatus={true}
            hideOwner={true}
            hideActionButton={get(Meteor, 'settings.public.modules.fhir.Tasks.hideRemoveButtonOnTable', true)}
            onRowClick={handleRowClick}
            onActionButtonClick={function(selectedId){
              Tasks._collection.remove({_id: selectedId})
            }}
            onSetPage={function(index){
              Session.set('TasksTable.tasksIndex', index);
            }}        
            page={data.tasksIndex}
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
                {get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found in the client data cursor. To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries. If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.")}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddTask}
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
              Add Your First Task
            </Button>
          </CardContent>
        </Card>
      </Box>
    }
  } else {
    // Two column layout
    layoutContent = <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
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
            <TasksTable 
              id='tasksTable'
              tasks={data.tasks}
              count={data.tasks.length}  
              formFactorLayout={formFactor}
              rowsPerPage={LayoutHelpers.calcTableRows()} 
              actionButtonLabel="Remove"
              hideStatus={true}
              hideOwner={true}
              hideActionButton={get(Meteor, 'settings.public.modules.fhir.Tasks.hideRemoveButtonOnTable', true)}
              selectedTaskId={data.selectedTaskId}
              onRowClick={handleRowClick}
              onActionButtonClick={function(selectedId){
                Tasks._collection.remove({_id: selectedId})
              }}
              onSetPage={function(index){
                Session.set('TasksTable.tasksIndex', index);
              }}        
              page={data.tasksIndex}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card 
          sx={{ 
            width: '100%',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <CardHeader 
            title={data.selectedTaskId ? "Edit Task" : "New Task"}
            sx={{ 
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          />
          <TaskDetail 
            id='taskDetail'
            taskId={data.selectedTaskId}
            task={data.selectedTask}
            onInsert={handleTaskInsert}
            onUpdate={handleTaskUpdate}
            onRemove={handleTaskRemove}
            onCancel={() => Session.set('TasksPage.onePageLayout', true)}
          />
        </Card>
      </Grid>
    </Grid>
  }
  
  return (
    <Box 
      id="tasksPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { (data.tasks.length > 0 || !data.onePageLayout) && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default TasksPage;