import { 
  Grid, 
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Button,
  Dialog,
  TextField,
  Typography,
  Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add'; 



// import ServiceRequestDetail from './ServiceRequestDetail';
import ServiceRequestsTable from './ServiceRequestsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import React, { useEffect, useState }  from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';


import { get, set } from 'lodash';


let defaultServiceRequest = {
  index: 2,
  id: '',
  username: '',
  email: '',
  given: '',
  family: '',
  gender: ''
};


//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  ServiceRequests = Meteor.Collections.ServiceRequests;
})

//=============================================================================================================================================
// SESSION VARIABLES


Session.setDefault('serviceRequestFormData', defaultServiceRequest);
Session.setDefault('serviceRequestSearchFilter', '');
Session.setDefault('serviceRequestSearchQuery', {});
Session.setDefault('serviceRequestDialogOpen', false);
Session.setDefault('selectedServiceRequestId', false);
Session.setDefault('fhirVersion', 'v1.0.2');




//===============================================================================================================
// Global Theming 
// This is necessary for the Material UI component render layer



let theme = {
  primaryColor: "rgb(177, 128, 13)",
  primaryText: "rgba(255, 255, 255, 1) !important",

  secondaryColor: "rgb(177, 128, 13)",
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
  background: "linear-gradient(45deg, rgb(177, 128, 13) 30%, rgb(150, 202, 144) 90%)",

  nivoTheme: "greens"
}

// if we have a globally defined theme from a settings file
if(get(Meteor, 'settings.public.theme.palette')){
  theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
}





//=============================================================================================================================================
// MAIN COMPONENT

export function ServiceRequestsPage(props){
  const navigate = useNavigate();


  //---------------------------------------------------------------------------------------------------------
  // State

  let data = {
    tabIndex: Session.get('serviceRequestPageTabIndex'),
    serviceRequest: defaultServiceRequest,
    serviceRequestSearchFilter: '',
    currentServiceRequest: null,
    serviceRequestSearchQuery: {},
    dialogOpen: Session.get('serviceRequestDialogOpen'), 
    selectedServiceRequestId: Session.get('selectedServiceRequestId'),
    selectedServiceRequest: false,
    serviceRequests: [],
    serviceRequestsIndex: 0
  };


  //---------------------------------------------------------------------------------------------------------
  // Trackers

  data.serviceRequest = useTracker(function(){
    return Session.get('serviceRequestFormData');
  })
  data.serviceRequestSearchFilter = useTracker(function(){
    return Session.get('serviceRequestSearchFilter');
  })
  data.serviceRequestSearchFilter = useTracker(function(){
    return Session.get('serviceRequestSearchFilter');
  })
  data.serviceRequestSearchQuery = useTracker(function(){
    return Session.get('serviceRequestSearchQuery');
  })
  data.selectedServiceRequest = useTracker(function(){
    return Session.get('selectedServiceRequest');
  })
  data.selectedServiceRequestId = useTracker(function(){
    return Session.get('selectedServiceRequestId');
  })

  data.serviceRequests = useTracker(function(){
    return ServiceRequests.find().fetch()
  })


  // ???????
  if(get(this, 'props.params.serviceRequestId')){
    data.selectedServiceRequest = ServiceRequests.findOne({id: get(this, 'props.params.serviceRequestId')});
    Session.set('serviceRequestPageTabIndex', 2);
  } else if (Session.get('selectedServiceRequestId')){
    data.selectedServiceRequest = ServiceRequests.findOne({_id: Session.get('selectedServiceRequestId')});
  } else {
    data.selectedServiceRequest = false;
  }




  //---------------------------------------------------------------------------------------------------------
  // Lifecycle

  // useEffect(function(){
  // //   if(get(this, 'props.params.serviceRequestId')){
  // //     Session.set('selectedServiceRequestId', get(this, 'props.params.serviceRequestId'))
  // //     Session.set('serviceRequestPageTabIndex', 2);
  // //   }
  // }, [])

  function handleTabChange(index){
    Session.set('serviceRequestPageTabIndex', index);
  }

  function onNewTab(){
    Session.set('selectedServiceRequest', false);
    Session.set('serviceRequestUpsert', false);
  }
  function handleClose(){
    Session.set('serviceRequestDialogOpen', false);
  }
  function handleSearch(){
    console.log('handleSearch', get(this, 'state.searchForm'));

    Session.set('serviceRequestSearchQuery', {
      "$and": [
        {"serviceRequestingParty.display": {"$regex": get(this, 'state.searchForm.familyName')}}, 
        {"serviceRequestingParty.display": {"$regex": get(this, 'state.searchForm.givenName')}}
      ]
    });
    handleClose();
  }

  function changeSelectedCategory(event, value){
    console.log('changeSelectedCategory', event, value)

    let searchForm = state.searchForm;
    searchForm.category = value;

    // setState({searchForm: searchForm})
  }
  function updateFormData(formData, field, textValue){
    if(process.env.NODE_ENV === "test") console.log("ServiceRequestDetail.updateFormData", formData, field, textValue);

    switch (field) {
      case "givenName":
        set(formData, 'givenName', textValue)
        break;
      case "familyName":
        set(formData, 'familyName', textValue)
        break;        
      case "category":
        set(formData, 'category', textValue)
        break;
    }

    if(process.env.NODE_ENV === "test") console.log("formData", formData);
    return formData;
  }
  function updateSearch(serviceRequestData, field, textValue){
    if(process.env.NODE_ENV === "test") console.log("ServiceRequestDetail.updateServiceRequest", serviceRequestData, field, textValue);

    // switch (field) {
    //   case "givenName":
    //     set(serviceRequestData, 'givenName', textValue)
    //     break;
    //   case "familyName":
    //     set(serviceRequestData, 'familyName', textValue)
    //     break;        
    //   case "category":
    //     set(serviceRequestData, 'category.text', textValue)
    //     break;  
    // }
    return serviceRequestData;
  }
  function changeState(field, event, textValue){
    if(process.env.NODE_ENV === "test") console.log("   ");
    if(process.env.NODE_ENV === "test") console.log("ServiceRequestDetail.changeState", field, textValue);
    if(process.env.NODE_ENV === "test") console.log("state", state);

    let searchForm = Object.assign({}, state.searchForm);
    let searchQuery = Object.assign({}, state.searchQuery);

    searchForm = updateFormData(searchForm, field, textValue);
    searchQuery = updateSearch(searchQuery, field, textValue);

    if(process.env.NODE_ENV === "test") console.log("searchQuery", searchQuery);
    if(process.env.NODE_ENV === "test") console.log("searchForm", searchForm);

    // setState({searchQuery: searchQuery})
    // setState({searchForm: searchForm})
  }


  //=============================================================================================================================================
  // Renders
  console.log('React.version: ' + React.version);
  console.log('ServiceRequestsPage.props', props);

  const actions = [
    <Button
      label="Cancel"
      color="primary"
      onClick={handleClose}
    />,
    <Button
      label="Search"
      color="primary"
      keyboardFocused={true}
      onClick={handleSearch.bind(this) }
    />
  ];

  // let [serviceRequestsIndex, setServiceRequestsIndex] = setState(0);

  let layoutContent;
  if(data.serviceRequests.length > 0){
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
        <ServiceRequestsTable 
          showBarcodes={true} 
          hideIdentifier={true}
          serviceRequests={data.serviceRequests}
          hideRequestorReference={true}
          noDataMessage={false}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          onSetPage={function(index){
            Session.set('ServiceRequestsTable.serviceRequestsIndex', index)
          }}  
          page={data.serviceRequestsIndex}
          sort="occurrenceDateTime"
          onRowClick={function(serviceRequestId){
            console.log('ServiceRequestsPage.onRowClick', serviceRequestId);
            navigate('/serviceRequests/' + serviceRequestId);
          }}
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
            onClick={handleAddServiceRequest}
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
            Add Your First Service Request
          </Button>
        </CardContent>
      </Card>
    </Box>
  }

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  

  let cardWidth = window.innerWidth - paddingWidth;

  function handleAddServiceRequest(){
    console.log('Add Service Request button clicked');
    navigate('/serviceRequests/new');
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Service Requests
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.serviceRequests.length} service requests found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddServiceRequest}
            >
              Add Service Request
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box 
      id="serviceRequestsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.serviceRequests.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );

}



export default ServiceRequestsPage;