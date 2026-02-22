// /imports/ui-fhir/procedures/ProceduresPage.jsx

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
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import ProceduresTable from './ProceduresTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

//=============================================================================================================================================
// DATA CURSORS

// Import the collection directly to avoid timing issues
import { Procedures } from '/imports/lib/schemas/SimpleSchemas/Procedures';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { FhirUtilities } from '/imports/lib/FhirUtilities';



//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedProcedureId', false);


Session.setDefault('procedurePageTabIndex', 1);
Session.setDefault('procedureSearchFilter', '');
Session.setDefault('selectedProcedureId', false);
Session.setDefault('selectedProcedure', false)
Session.setDefault('ProceduresPage.onePageLayout', true)
Session.setDefault('ProceduresPage.defaultQuery', {})
Session.setDefault('ProceduresTable.hideCheckbox', true)
Session.setDefault('ProceduresTable.proceduresIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function ProceduresPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [searchFilter, setSearchFilter] = useState('');
  const [showSubject, setShowSubject] = useState(false);
  const [showSubjectReference, setShowSubjectReference] = useState(false);
  const [showPerformer, setShowPerformer] = useState(false);

  let data = {
    currentProcedureId: '',
    selectedProcedure: null,
    procedures: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    proceduresIndex: 0
  };

  // Subscribe to Procedures with query filtering
  const isLoading = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    let query = {};

    // Build patient filter query
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');

      if(fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        // Fallback to MongoDB _id if no FHIR id available
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }

    // Add search filter if present
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $and: [
          query,
          {
            $or: [
              {'_id': searchFilter},
              {'id': searchFilter},
              {'code.coding.0.display': {$regex: searchFilter, $options: 'i'}},
              {'code.coding.0.code': {$regex: searchFilter, $options: 'i'}},
              {'performer.0.actor.display': {$regex: searchFilter, $options: 'i'}},
              {'subject.display': {$regex: searchFilter, $options: 'i'}},
              {'note.0.text': {$regex: searchFilter, $options: 'i'}}
            ]
          }
        ]
      };
    }

    console.log('Procedures subscription - selectedPatientId:', selectedPatientId);
    console.log('Procedures subscription - FHIR id:', get(selectedPatient, 'id'));
    console.log('Procedures subscription - searchFilter:', searchFilter);
    console.log('Procedures subscription query:', query);

    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('selectedPatient.Procedures', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('procedures.all');
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  data.onePageLayout = useTracker(function(){
    return Session.get('ProceduresPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ProceduresTable.hideCheckbox');
  }, [])
  data.selectedProcedureId = useTracker(function(){
    return Session.get('selectedProcedureId');
  }, [])
  data.selectedProcedure = useTracker(function(){
    if (!Procedures) return null;
    return Procedures.findOne({_id: Session.get('selectedProcedureId')});
  }, [])
  data.procedures = useTracker(function(){
    if (!Procedures) {
      console.log('ProceduresPage - Procedures collection not ready');
      return [];
    }
    const sortOptions = {};
    if (sortOrder === 'ascending') {
      sortOptions.sort = { 'performedDateTime': 1 };
    } else if (sortOrder === 'descending') {
      sortOptions.sort = { 'performedDateTime': -1 };
    } else if (sortOrder === 'newest') {
      sortOptions.sort = { '_id': -1 };
    } else if (sortOrder === 'oldest') {
      sortOptions.sort = { '_id': 1 };
    }
    const procs = Procedures.find({}, sortOptions).fetch();
    console.log('ProceduresPage - found procedures:', procs.length);
    return procs;
  }, [sortOrder])
  data.proceduresIndex = useTracker(function(){
    return Session.get('ProceduresTable.proceduresIndex')
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

  function handleAddProcedure(){
    console.log('Add Procedure button clicked');
    navigate('/procedures/new');
  }

  function handleRowClick(procedureId){
    console.log('Procedure row clicked:', procedureId);
    navigate('/procedures/' + procedureId);
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
              Procedures
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.procedures.length} procedures found
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
                  ...(showSubject ? ['subject'] : []),
                  ...(showSubjectReference ? ['subjectReference'] : []),
                  ...(showPerformer ? ['performer'] : [])
                ]}
                onChange={(event, newFormats) => {
                  setShowSubject(newFormats.includes('subject'));
                  setShowSubjectReference(newFormats.includes('subjectReference'));
                  setShowPerformer(newFormats.includes('performer'));
                }}
                aria-label="column visibility"
                size="small"
              >
                <ToggleButton value="subject" aria-label="show subject">
                  <PersonIcon />
                </ToggleButton>
                <ToggleButton value="subjectReference" aria-label="show subject reference">
                  <CodeIcon />
                </ToggleButton>
                <ToggleButton value="performer" aria-label="show performer">
                  <LocalHospitalIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddProcedure}
              >
                Add Procedure
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="procedureSearchInput"
            fullWidth
            placeholder="Search procedures by ID, code, performer, patient, or notes..."
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
  if(data.procedures.length > 0){
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
        <ProceduresTable
          id='proceduresTable'
          procedures={data.procedures}
          count={data.procedures.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Procedures.hideRemoveButtonOnTable', true)}
          hideSubject={!showSubject}
          hideSubjectReference={!showSubjectReference}
          hidePerformer={!showPerformer}
          onActionButtonClick={function(selectedId){
            if (Procedures && Procedures._collection) {
              Procedures._collection.remove({_id: selectedId})
            } else {
              console.error('Cannot remove procedure - collection not ready');
            }
          }}
          onSetPage={function(index){
            Session.set('ProceduresTable.proceduresIndex', index)
          }}
          page={data.proceduresIndex}
          onRowClick={handleRowClick}
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
            onClick={handleAddProcedure}
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
            Add Your First Procedure
          </Button>
        </CardContent>
      </Card>
    </Box>
  }

  return (
    <Box
      id="proceduresPage"
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


export default ProceduresPage;
