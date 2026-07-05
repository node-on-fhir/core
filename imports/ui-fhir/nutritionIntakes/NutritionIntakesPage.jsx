// /imports/ui-fhir/nutritionIntakes/NutritionIntakesPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import {
  Grid,
  Card,
  CardHeader,
  CardContent,
  Button,
  Tab,
  Tabs,
  Typography,
  Box,
  IconButton,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';

import NutritionIntakesTable from './NutritionIntakesTable';

import LayoutHelpers from '../../lib/LayoutHelpers';
import FhirUtilities from '../../lib/FhirUtilities';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import FhirDehydrator from '../../lib/FhirDehydrator';

import { get, set } from 'lodash';

// Direct imports - avoid timing issues
import { NutritionIntakes } from '/imports/lib/schemas/SimpleSchemas/NutritionIntakes';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

const log = (Meteor.Logger ? Meteor.Logger.for('NutritionIntakesPage') : console);

//=============================================================================================================================================
// GLOBAL THEMING

// This is necessary for the Material UI component render layer
let theme = {
  primaryColor: "rgb(108, 183, 110)",
  primaryText: "rgba(255, 255, 255, 1) !important",

  secondaryColor: "rgb(108, 183, 110)",
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
  background: "linear-gradient(45deg, rgb(108, 183, 110) 30%, rgb(150, 202, 144) 90%)",

  nivoTheme: "greens"
}

// if we have a globally defined theme from a settings file
if(get(Meteor, 'settings.public.theme.palette')){
  theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
}

//=============================================================================================================================================
// Session Variables

Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('selectedNutritionIntakeId', false);
Session.setDefault('selectedNutritionIntake', false);
Session.setDefault('nutritionIntakePageTabIndex', 1);
Session.setDefault('nutritionIntakeSearchFilter', '');
Session.setDefault('NutritionIntakesPage.onePageLayout', true)
Session.setDefault('NutritionIntakesPage.defaultQuery', {})
Session.setDefault('NutritionIntakesTable.hideCheckbox', true)
Session.setDefault('NutritionIntakesTable.sortAscending', true)
Session.setDefault('NutritionIntakesPage.debugLogged', false)

//=============================================================================================================================================
// MAIN COMPONENT

export function NutritionIntakesPage(props){
  const navigate = useNavigate();

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");

  let [nutritionIntakesPageIndex, setNutritionIntakesPageIndex] = useState(0);
  let [searchFilter, setSearchFilter] = useState('');
  let [showPatientName, setShowPatientName] = useState(false);
  let [showPatientReference, setShowPatientReference] = useState(false);
  let [showSystemId, setShowSystemId] = useState(false);
  let [page, setPage] = useState(0);
  let [rowsPerPage, setRowsPerPage] = useState(10);

  let data = {
    nutritionIntakes: [],
    selectedNutritionIntakeId: '',
    selectedNutritionIntake: null
  };

  // Subscribe to nutrition intakes with patient filtering
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    let query = {};

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
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'consumedItem.0.nutritionProduct.concept.text': {$regex: searchFilter, $options: 'i'}},
          {'subject.display': {$regex: searchFilter, $options: 'i'}}
        ]
      };

      // Combine with patient filter if it exists
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
      const handle = Meteor.subscribe('autopublish.NutritionIntakes', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.NutritionIntakes', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  // Data tracker for nutrition intakes
  data.nutritionIntakes = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');

    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;

    const query = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};

    // Add search filter if present
    if(searchFilter && searchFilter.length > 0) {
      const searchQuery = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'consumedItem.0.nutritionProduct.concept.text': {$regex: searchFilter, $options: 'i'}},
          {'subject.display': {$regex: searchFilter, $options: 'i'}}
        ]
      };

      // Combine with patient filter if it exists
      if(query.$or) {
        return NutritionIntakes.find({
          $and: [
            query,
            searchQuery
          ]
        }).fetch();
      } else {
        return NutritionIntakes.find(searchQuery).fetch();
      }
    }

    return NutritionIntakes.find(query).fetch();
  }, [searchFilter]);

  data.selectedNutritionIntakeId = useTracker(function(){
    return Session.get('selectedNutritionIntakeId');
  }, []);

  data.selectedNutritionIntake = useTracker(function(){
    return NutritionIntakes.findOne({_id: Session.get('selectedNutritionIntakeId')});
  }, []);

  // Debug logging
  useEffect(() => {
    return () => {
      Session.set('NutritionIntakesPage.debugLogged', false);
    };
  }, []);

  if(!Session.get('NutritionIntakesPage.debugLogged')) {
    Session.set('NutritionIntakesPage.debugLogged', true);

    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    const fhirId = get(selectedPatient, 'id');

    log.debug('NutritionIntakes data - MongoDB _id:', { selectedPatientId });
    console.log('NutritionIntakes data - FHIR id:', fhirId);
    console.log('NutritionIntakes data - count:', data.nutritionIntakes.length);
  }

  function handleAddNutritionIntake(){
    console.log('Add Nutrition Intake button clicked');
    navigate('/nutrition-intakes/new');
  }

  function handleToggleColumn(event, newFormats) {
    console.log('Toggle columns', newFormats);
    setShowPatientName(newFormats.includes('patientName'));
    setShowPatientReference(newFormats.includes('patientReference'));
    setShowSystemId(newFormats.includes('systemId'));
  }

  function handleSortChange() {
    const currentSort = Session.get('NutritionIntakesTable.sortAscending');
    Session.set('NutritionIntakesTable.sortAscending', !currentSort);
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Nutrition Intakes
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.nutritionIntakes.length} nutrition intakes found
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={1} alignItems="center" justifyContent="flex-end" flexWrap="wrap">
              <TextField
                id="nutritionIntakeSearchInput"
                size="small"
                placeholder="Search nutrition intakes..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
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
                  showPatientName && 'patientName',
                  showPatientReference && 'patientReference',
                  showSystemId && 'systemId'
                ].filter(Boolean)}
                onChange={handleToggleColumn}
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
              <IconButton onClick={handleSortChange} size="small" aria-label="Sort">
                <SortIcon />
              </IconButton>
              <Button
                id="addNutritionIntakeButton"
                data-testid="add-nutrition-intake-button"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddNutritionIntake}
              >
                Add Nutrition Intake
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.nutritionIntakes.length > 0){
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
        <NutritionIntakesTable
          id="nutritionIntakesTable"
          nutritionIntakes={data.nutritionIntakes}
          hideCheckbox={true}
          hideActionIcons={true}
          hideIdentifier={true}
          hideStatus={false}
          hideSubjectDisplay={!showPatientName}
          hideSubjectReference={!showPatientReference}
          hideRecordedDate={false}
          hideConsumedItem={false}
          hideCode={true}
          hideBarcode={!showSystemId}
          dateFormat="YYYY-MM-DD HH:mm"
          count={data.nutritionIntakes.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onSetPage={setPage}
          onSetRowsPerPage={setRowsPerPage}
          onRowClick={function(nutritionIntakeId){
            console.log('NutritionIntakesPage.onRowClick', nutritionIntakeId);
            navigate('/nutrition-intakes/' + nutritionIntakeId);
          }}
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <Box
      data-testid="no-nutrition-intakes"
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
            id="addNutritionIntakeButton"
            data-testid="add-nutrition-intake-button"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddNutritionIntake}
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
            Add Your First Nutrition Intake
          </Button>
        </CardContent>
      </Card>
    </Box>
  }

  return (
    <Box
      id="nutritionIntakesPage"
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.nutritionIntakes.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}

export default NutritionIntakesPage;
