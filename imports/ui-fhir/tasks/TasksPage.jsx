// /imports/ui-fhir/tasks/TasksPage.jsx

import React, { useState, useEffect } from 'react';
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
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// Direct imports - avoid timing issues
import { Tasks } from '/imports/lib/schemas/SimpleSchemas/Tasks';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

import TasksTable from './TasksTable';
import LayoutHelpers from '../../lib/LayoutHelpers';
import FhirUtilities from '../../lib/FhirUtilities';

import { get, has } from 'lodash';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('tasksPageTabIndex', 1); 
Session.setDefault('tasksSearchFilter', ''); 
Session.setDefault('selectedTaskId', false);
Session.setDefault('selectedTask', false)
Session.setDefault('TasksPage.onePageLayout', true)
Session.setDefault('TasksPage.defaultQuery', {})
Session.setDefault('TasksTable.hideCheckbox', true)
Session.setDefault('TasksTable.tasksIndex', 0)
Session.setDefault('TasksTable.hidePatientDisplay', false);
Session.setDefault('TasksTable.hidePatientReference', true);
Session.setDefault('TasksTable.hideIdentifier', true);

//=============================================================================================================================================
// MAIN COMPONENT

export function TasksPage(props){
  const navigate = useNavigate();

  const [searchFilter, setSearchFilter] = useState('');
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);

  // Subscribe to Tasks with patient filtering
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    
    let query = {};
    
    // Patient filtering using FHIR id
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      
      if(fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }
    
    // Add search filter
    if(searchFilter && searchFilter.length > 0) {
      const searchQuery = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'code.text': {$regex: searchFilter, $options: 'i'}},
          {'code.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'description': {$regex: searchFilter, $options: 'i'}},
          {'for.display': {$regex: searchFilter, $options: 'i'}},
          {'owner.display': {$regex: searchFilter, $options: 'i'}},
          {'requester.display': {$regex: searchFilter, $options: 'i'}},
          {'businessStatus.text': {$regex: searchFilter, $options: 'i'}}
        ]
      };
      
      if(query.$or) {
        query = { $and: [query, searchQuery] };
      } else {
        query = searchQuery;
      }
    }
    
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.Tasks', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.Tasks', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  // Data tracking
  const data = {
    tasks: [],
    selectedTaskId: Session.get('selectedTaskId'),
    tasksIndex: Session.get('TasksTable.tasksIndex')
  };

  // Debug logging for patient context
  useEffect(() => {
    return () => {
      Session.set('TasksPage.debugLogged', false);
    };
  }, []);

  data.tasks = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;
    
    let query = {};
    
    if(patientIdToUse) {
      query = FhirUtilities.addPatientFilterToQuery(patientIdToUse);
    }
    
    if(searchFilter && searchFilter.length > 0) {
      const searchQuery = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'code.text': {$regex: searchFilter, $options: 'i'}},
          {'code.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'description': {$regex: searchFilter, $options: 'i'}},
          {'for.display': {$regex: searchFilter, $options: 'i'}},
          {'owner.display': {$regex: searchFilter, $options: 'i'}},
          {'requester.display': {$regex: searchFilter, $options: 'i'}},
          {'businessStatus.text': {$regex: searchFilter, $options: 'i'}}
        ]
      };
      
      if(query.$or) {
        query = { $and: [query, searchQuery] };
      } else {
        query = searchQuery;
      }
    }
    
    // Debug logging
    if(!Session.get('TasksPage.debugLogged')) {
      Session.set('TasksPage.debugLogged', true);
      
      console.log('Tasks data - MongoDB _id:', selectedPatientId);
      console.log('Tasks data - FHIR id:', fhirId);
      console.log('Tasks data - query:', query);
      console.log('Tasks data - total count:', Tasks.find({}).count());
      console.log('Tasks data - filtered count:', Tasks.find(query).count());
      
      if(Tasks.find({}).count() > 0 && Tasks.find(query).count() === 0) {
        console.log('Tasks exist but are filtered out. Sample task:', Tasks.findOne());
      }
    }
    
    // Sort by _id descending to get newest first
    return Tasks.find(query, { sort: { _id: -1 } }).fetch();
  }, [searchFilter]);

  function handleAddTask(){
    console.log('Add Task button clicked');
    navigate('/tasks/new');
  }

  function handleRowClick(taskId){
    console.log('TasksPage.handleRowClick', taskId);
    navigate('/tasks/' + taskId);
  }

  function renderHeader() {
    return (
      <Box mb={3}>
        <Grid container spacing={2} alignItems="flex-start" justifyContent="space-between">
          <Grid item xs={12} sm={8}>
            <Typography variant="h4">
              Tasks
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.tasks.length} tasks found
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <ToggleButtonGroup
                value={[
                  showPatientName && 'patientName',
                  showPatientReference && 'patientReference',
                  showSystemId && 'systemId'
                ].filter(Boolean)}
                onChange={(event, newValues) => {
                  setShowPatientName(newValues.includes('patientName'));
                  setShowPatientReference(newValues.includes('patientReference'));
                  setShowSystemId(newValues.includes('systemId'));
                }}
                aria-label="column visibility"
                size="small"
              >
                <ToggleButton value="patientName" aria-label="show patient name">
                  <PersonIcon />
                </ToggleButton>
                <ToggleButton value="patientReference" aria-label="show patient reference">
                  <CodeIcon />
                </ToggleButton>
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddTask}
                id="addTaskButton"
              >
                Add Task
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="taskSearchInput"
              fullWidth
              placeholder="Search tasks by ID, patient, code, description, owner, requester..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              sx={{ mt: 1 }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
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
          formFactorLayout={LayoutHelpers.determineFormFactor()}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hidePatientDisplay={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideBarcode={!showSystemId}
          hideActionButton={true}
          onRowClick={handleRowClick}
          onSetPage={function(index){
            Session.set('TasksTable.tasksIndex', index);
          }}        
          page={data.tasksIndex}
        />
      </CardContent>
    </Card>
  } else if (isLoading) {
    layoutContent = <Box 
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh'
      }}
    >
      <Typography variant="h6">Loading tasks...</Typography>
    </Box>
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
              {get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found. You can create a new task by clicking the button below.")}
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
      { renderHeader() }
      { layoutContent }
    </Box>
  );
}

export default TasksPage;