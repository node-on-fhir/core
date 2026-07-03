// /imports/ui-fhir/carePlans/CarePlansPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge'; 

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// import CarePlanDetail from './CarePlanDetail';
import CarePlansTable from './CarePlansTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

// Import the collection directly to avoid timing issues
import { CarePlans } from '/imports/lib/schemas/SimpleSchemas/CarePlans';
import { FhirUtilities } from '/imports/lib/FhirUtilities';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

const log = (Meteor.Logger ? Meteor.Logger.for('CarePlansPage') : console);


//=============================================================================================================================================
// DATA CURSORS


//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('carePlanPageTabIndex', 1); 
Session.setDefault('carePlanSearchFilter', ''); 
Session.setDefault('selectedCarePlanId', false);
Session.setDefault('selectedCarePlan', false)
Session.setDefault('CarePlansPage.onePageLayout', true)
Session.setDefault('CarePlansPage.defaultQuery', {})
Session.setDefault('CarePlansTable.hideCheckbox', true)
Session.setDefault('CarePlansTable.carePlansIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function CarePlansPage(props){
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  
  // Clean up debug flag on unmount
  useEffect(() => {
    return () => {
      Session.set('CarePlansPage.debugLogged', false);
    };
  }, []);

  let data = {
    currentCarePlanId: '',
    selectedCarePlan: null,
    carePlans: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    carePlansIndex: 0
  };

  // Subscribe to CarePlans data
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    
    // Use FhirUtilities to build the query - it handles all reference formats
    let query = {};
    
    // If we have a patient selected, filter by that patient
    // FHIR resources reference patients by their FHIR id, not MongoDB _id
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      
      if(fhirId) {
        // Use the FHIR id as primary search
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        // Fallback to MongoDB _id if no FHIR id available
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }
    
    log.debug('CarePlans subscription - selectedPatientId:', { selectedPatientId });
    log.debug('CarePlans subscription - FHIR id:', { fhirId: get(selectedPatient, 'id') });
    console.log('CarePlans subscription query:', query);
    
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.CarePlans', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.CarePlans', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId')]);

  data.onePageLayout = useTracker(function(){
    return Session.get('CarePlansPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('CarePlansTable.hideCheckbox');
  }, [])
  data.selectedCarePlanId = useTracker(function(){
    return Session.get('selectedCarePlanId');
  }, [])
  data.selectedCarePlan = useTracker(function(){
    if (!CarePlans) return null;
    return CarePlans.findOne({_id: Session.get('selectedCarePlanId')});
  }, [])
  data.carePlans = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    // Use FHIR id for filtering, as that's what FHIR resources reference
    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;
    
    const query = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};
    
    // Only do debug logging once when component mounts
    if(!Session.get('CarePlansPage.debugLogged')) {
      Session.set('CarePlansPage.debugLogged', true);
      
      log.debug('CarePlans data - MongoDB _id:', { selectedPatientId });
      console.log('CarePlans data - FHIR id:', fhirId);
      log.debug('CarePlans data - Using ID for query:', { patientIdToUse });
      console.log('CarePlans data - query:', query);
      
      // First check all care plans
      const allCarePlans = CarePlans.find().fetch();
      console.log('Total CarePlans in client collection:', allCarePlans.length);
      
      // Log first few care plans to see their structure
      if(allCarePlans.length > 0) {
        console.log('Sample CarePlan structure:', allCarePlans[0]);
        console.log('First 3 patient references:'); // phi-audit: ok
        allCarePlans.slice(0, 3).forEach(cp => {
          log.phi('- _id/patient/subject debug:', { id: cp._id, patient: get(cp, 'patient'), subject: get(cp, 'subject') }, { action: 'read' });
        });
      }
    }
    
    const results = CarePlans.find(query, { sort: { 'meta.lastUpdated': -1 } }).fetch();
    return results;
  }, [])
  data.carePlansIndex = useTracker(function(){
    return Session.get('CarePlansTable.carePlansIndex')
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

  function handleAddCarePlan(){
    console.log('Add Care Plan button clicked');
    navigate('/careplans/new');
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
              Care Plans
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.carePlans.length} care plans found
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
                  showTitle && 'title',
                  showPatientName && 'patientName',
                  showPatientReference && 'patientReference',
                  showSystemId && 'systemId'
                ].filter(Boolean)}
                onChange={(event, newFormats) => {
                  setShowTitle(newFormats.includes('title'));
                  setShowPatientName(newFormats.includes('patientName'));
                  setShowPatientReference(newFormats.includes('patientReference'));
                  setShowSystemId(newFormats.includes('systemId'));
                }}
                aria-label="display options"
                size="small"
              >
                <ToggleButton value="title" aria-label="show title">
                  <Typography variant="button">T</Typography>
                </ToggleButton>
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
                onClick={handleAddCarePlan}
              >
                Add Care Plan
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.carePlans.length > 0){
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
        <CarePlansTable 
          id='carePlansTable'
          carePlans={data.carePlans}
          count={data.carePlans.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideTitle={!showTitle}
          hidePatientDisplay={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideBarcode={!showSystemId}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.CarePlans.hideRemoveButtonOnTable', true)}
          order={sortOrder}
          onActionButtonClick={function(selectedId){
            CarePlans._collection.remove({_id: selectedId})
          }}
          onRowClick={function(carePlanId){
            navigate('/careplans/' + carePlanId);
          }}
          onSetPage={function(index){
            Session.set('CarePlansTable.carePlansIndex', index)
          }}        
          page={data.carePlansIndex}
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
            onClick={handleAddCarePlan}
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
            Add Your First Care Plan
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="carePlansPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.carePlans.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default CarePlansPage;