// /imports/ui-fhir/encounters/EncountersPage.jsx

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
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import CategoryIcon from '@mui/icons-material/Category';
import BadgeIcon from '@mui/icons-material/Badge';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import EncountersTable from './EncountersTable';
import FhirNoData from '../components/FhirNoData.jsx';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';
import { FhirUtilities } from '../../lib/FhirUtilities';

// Import the Encounters collection directly
import { Encounters } from '/imports/lib/schemas/SimpleSchemas/Encounters';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedEncounterId', false);


Session.setDefault('encounterPageTabIndex', 1);
Session.setDefault('encounterSearchFilter', '');
Session.setDefault('selectedEncounterId', false);
Session.setDefault('selectedEncounter', false)
Session.setDefault('EncountersPage.onePageLayout', true)
Session.setDefault('EncountersPage.defaultQuery', {})
Session.setDefault('EncountersTable.hideCheckbox', true)
Session.setDefault('EncountersTable.encountersIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function EncountersPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showPatientName, setShowPatientName] = useState(true);
  const [showPractitionerName, setShowPractitionerName] = useState(true);
  const [showClass, setShowClass] = useState(true);
  const [showSystemId, setShowSystemId] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Subscribe to encounters with patient filtering
  const isLoading = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    let query = {};

    // Add patient filter if a patient is selected
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      if(fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }

    // Add search filter if present
    if(searchFilter && searchFilter.length > 0) {
      const searchQuery = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'participant.0.individual.display': {$regex: searchFilter, $options: 'i'}},
          {'participant.individual.display': {$regex: searchFilter, $options: 'i'}},
          {'type.0.text': {$regex: searchFilter, $options: 'i'}},
          {'reasonCode.0.text': {$regex: searchFilter, $options: 'i'}},
          {'subject.display': {$regex: searchFilter, $options: 'i'}}
        ]
      };

      // Merge with patient query if exists
      if(query.$or) {
        query = {
          $and: [
            query,
            searchQuery
          ]
        };
      } else {
        query = searchQuery;
      }
    }

    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.Encounters', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.Encounters', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  let data = {
    currentEncounterId: '',
    selectedEncounter: null,
    encounters: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    encountersIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('EncountersPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('EncountersTable.hideCheckbox');
  }, [])
  data.selectedEncounterId = useTracker(function(){
    return Session.get('selectedEncounterId');
  }, [])
  data.selectedEncounter = useTracker(function(){
    return Encounters ? Encounters.findOne({_id: Session.get('selectedEncounterId')}) : null;
  }, [])
  data.encounters = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');

    let query = {};

    // Add patient filter
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      const patientIdToUse = fhirId || selectedPatientId;
      if(patientIdToUse) {
        query = FhirUtilities.addPatientFilterToQuery(patientIdToUse);
      }
    }

    // Add search filter
    if(searchFilter && searchFilter.length > 0) {
      const searchQuery = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'participant.0.individual.display': {$regex: searchFilter, $options: 'i'}},
          {'participant.individual.display': {$regex: searchFilter, $options: 'i'}},
          {'type.0.text': {$regex: searchFilter, $options: 'i'}},
          {'reasonCode.0.text': {$regex: searchFilter, $options: 'i'}},
          {'subject.display': {$regex: searchFilter, $options: 'i'}}
        ]
      };

      // Merge queries
      if(query.$or) {
        query = {
          $and: [
            query,
            searchQuery
          ]
        };
      } else {
        query = searchQuery;
      }
    }

    return Encounters ? Encounters.find(query).fetch() : [];
  }, [searchFilter])
  data.encountersIndex = useTracker(function(){
    return Session.get('EncountersTable.encountersIndex')
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

  function handleAddEncounter(){
    console.log('Add Encounter button clicked');
    navigate('/encounters/new');
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
              Encounters
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.encounters.length} encounters found
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
                  ...(showPatientName ? ['patient'] : []),
                  ...(showPractitionerName ? ['practitioner'] : []),
                  ...(showClass ? ['class'] : []),
                  ...(showSystemId ? ['systemId'] : [])
                ]}
                onChange={(event, newFormats) => {
                  setShowPatientName(newFormats.includes('patient'));
                  setShowPractitionerName(newFormats.includes('practitioner'));
                  setShowClass(newFormats.includes('class'));
                  setShowSystemId(newFormats.includes('systemId'));
                }}
                aria-label="column visibility"
                size="small"
              >
                <ToggleButton value="patient" aria-label="show patient column">
                  <PersonIcon />
                </ToggleButton>
                <ToggleButton value="practitioner" aria-label="show practitioner column">
                  <LocalHospitalIcon />
                </ToggleButton>
                <ToggleButton value="class" aria-label="show class column">
                  <CategoryIcon />
                </ToggleButton>
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
              </ToggleButtonGroup>

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddEncounter}
              >
                Add Encounter
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="encounterSearchInput"
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search by practitioner, type, or patient..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </Box>
      </Box>
    );
  }

  let layoutContent;
  if(data.encounters.length > 0){
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
        <EncountersTable
          id='encountersTable'
          encounters={data.encounters}
          count={data.encounters.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Encounters.hideRemoveButtonOnTable', true)}
          hidePatientName={!showPatientName}
          hidePractitionerName={!showPractitionerName}
          hideClass={!showClass}
          hideBarcode={!showSystemId}
          order={sortOrder}
          onActionButtonClick={function(selectedId){
            Encounters.remove({_id: selectedId})
          }}
          onRowClick={function(encounterId){
            console.log('EncountersPage.onRowClick', encounterId);
            navigate('/encounters/' + encounterId);
          }}
          onSetPage={function(index){
            Session.set('EncountersTable.encountersIndex', index);
          }}
          page={data.encountersIndex}
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <FhirNoData
      resourceType="Encounter"
      searchFilter={searchFilter}
      onAdd={handleAddEncounter}
      onClearSearch={function() { setSearchFilter(''); }}
    />
  }

  return (
    <Box
      id="encountersPage"
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



export default EncountersPage;
