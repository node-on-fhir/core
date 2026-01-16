import React, { useEffect, useState } from 'react';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { fetch, Headers } from 'meteor/fetch';

import { 
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardHeader,
  CardContent,
  CardMedia,
  Container,
  Grid,  
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Image,
  Typography,
  FormControl,
  InputLabel,
  Input,
  InputAdornment,
  IconButton
} from '@mui/material';
import { makeStyles } from '@mui/styles';

import { get } from 'lodash';

import { Icon } from 'react-icons-kit';
import { github } from 'react-icons-kit/fa/github';
import {lightbulbO} from 'react-icons-kit/fa/lightbulbO'
import {puzzlePiece} from 'react-icons-kit/fa/puzzlePiece'
import {map} from 'react-icons-kit/fa/map'
import {amazon} from 'react-icons-kit/fa/amazon'
import {lowVision} from 'react-icons-kit/fa/lowVision'
import {addressCard} from 'react-icons-kit/fa/addressCard'
import {pieChart} from 'react-icons-kit/fa/pieChart'
import {wechat} from 'react-icons-kit/fa/wechat'
import {filePdfO} from 'react-icons-kit/fa/filePdfO'
import {database} from 'react-icons-kit/fa/database'
import {institution} from 'react-icons-kit/fa/institution'
import {speech_bubbles} from 'react-icons-kit/ikons/speech_bubbles'
import {ic_ac_unit} from 'react-icons-kit/md/ic_ac_unit'
import {font} from 'react-icons-kit/fa/font'
import {barcode} from 'react-icons-kit/fa/barcode'
import {cogs} from 'react-icons-kit/fa/cogs'
import {server} from 'react-icons-kit/fa/server'
import {snowflakeO} from 'react-icons-kit/fa/snowflakeO'
import {location} from 'react-icons-kit/icomoon/location'
import {aidKit} from 'react-icons-kit/icomoon/aidKit'
import {chain} from 'react-icons-kit/fa/chain'
import {dashboard} from 'react-icons-kit/fa/dashboard'
import {hospitalO} from 'react-icons-kit/fa/hospitalO'
import {medkit} from 'react-icons-kit/fa/medkit'
import {codeFork} from 'react-icons-kit/fa/codeFork'
import {cubes} from 'react-icons-kit/fa/cubes'
import {usb} from 'react-icons-kit/fa/usb'
import {universalAccess} from 'react-icons-kit/fa/universalAccess'
import {mobileCombo} from 'react-icons-kit/entypo/mobileCombo'
import {fire} from 'react-icons-kit/icomoon/fire'
import {warning} from 'react-icons-kit/fa/warning'

import { useNavigate } from "react-router-dom";

import { useTracker } from 'meteor/react-meteor-data';

import { LayoutHelpers } from '../lib/LayoutHelpers';

const useStyles = makeStyles(theme => ({
  root: {
    maxWidth: 345,
  },
  media: {
    minHeight: 400,
  },
  open_stack: {
    minHeight: 1200,
    backgroundSize: 'contain'
  },
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {},
  button: {},
  fallout_button: {
    width: '100%', 
    marginTop: '20px', 
    marginBottom: '20px',
    textAlign: 'left',
    background: "repeating-linear-gradient( 45deg, rgba(253,184,19, 0.9), rgba(253,184,19, 0.9) 10px, rgba(253,184,19, 0.75) 10px, rgba(253,184,19, 0.75) 20px ), url(http://s3-us-west-2.amazonaws.com/s.cdpn.io/3/old_map_@2X.png)"
  },
  hero_button: {
    width: '100%', 
    marginTop: '20px', 
    marginBottom: '20px',
    textAlign: 'left'
  },
  tip_of_the_day: {
    width: '100%', 
    marginTop: '20px', 
    marginBottom: '20px',
    textAlign: 'left'
  }
}));



let buttonStyles = {
  west_button: {
    cursor: 'pointer',
    justifyContent: 'left',
    color: '#ffffff',
    marginLeft: '20px',
    marginTop: '5px',
    float: 'left',
    position: 'relative'
  },
  east_button: {
    cursor: 'pointer',
    justifyContent: 'right',
    color: '#ffffff',
    right: '20px',
    marginTop: '5px',
    float: 'right',
    position: 'relative'
  }
}


function trimTrailingSlash(url){
  let resultingUrl;

  if(url[url.length - 1] === "/"){
    resultingUrl = url.substring(0, url.length - 1);
  } else {
    resultingUrl = url;
  }
  return resultingUrl;
}
function addFhirBase(url){
    return url + '/baseR4';
}
Session.setDefault('showExperimental', false);
Session.setDefault('onlyShowMatched', false);
Session.setDefault('showUrlPreview', false);
Session.setDefault('showServerStats', true);
Session.setDefault('dialogReturnValue', 'MainSearch.state');



function FhirBasePage(props){
  const classes = useStyles();
  const navigate = useNavigate();
  
  let { 
    children, 
    jsonContent,
    ...otherProps 
  } = props;

  let [ showSearchResults, setShowSearchResults ] = useState(false);
  let [ showNoResults, setShowNoResults ] = useState(false);
  
  let [ searchCount, setSearchCount ] = useState(1000);

  let [ showDetailedSearch, setShowDetailedSearch ] = useState(false);
  let [ statsToShow, setStatsToShow ] = useState("server");

  let [ serverStats, setServerStats ] = useState({
    Organizations: 0,
    Practitioners: 0,
    HealthcareServices: 0,
    InsurancePlans: 0,
    Endpoints: 0,
    Networks: 0,
    Locations: 0  
  }) 

  function handleToggleStats(){
    if(statsToShow === "server"){
      setStatsToShow("local")
    } else if(statsToShow === "local"){
      setStatsToShow("server")
    }
  }

  //----------------------------------------------------------------------
  // Startup / End
  
  useEffect(function(){
    // HTTP.get('/stats', function(error, result){
    //   if(result){
    //     let parsedContent = JSON.parse(result.content);
    //     console.log(parsedContent);

    //     setServerStats({
    //       Organizations: get(parsedContent, 'collections.organizations'),
    //       Practitioners: get(parsedContent, 'collections.practitioners'),
    //       HealthcareServices: get(parsedContent, 'collections.healthcareServices'),
    //       InsurancePlans: get(parsedContent, 'collections.insurancePlans'),
    //       Endpoints: get(parsedContent, 'collections.endpoints'),
    //       Networks: get(parsedContent, 'collections.networks'),
    //       Locations: get(parsedContent, 'collections.locations')
    //     })
    //   }
    // })

    await fetch('/stats', {
      method: 'GET',
      // body: JSON.stringify(currentCodeSystem),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
    .then(data => {
      setServerStats({
        Organizations: get(data, 'collections.organizations'),
        Practitioners: get(data, 'collections.practitioners'),
        HealthcareServices: get(data, 'collections.healthcareServices'),
        InsurancePlans: get(data, 'collections.insurancePlans'),
        Endpoints: get(data, 'collections.endpoints'),
        Networks: get(data, 'collections.networks'),
        Locations: get(data, 'collections.locations')
      })
    }).catch((error) => {
      alert(JSON.stringify(error.message));
    });

  }, []);

  //----------------------------------------------------------------------
  // Trackers
  
  useTracker(function(){
    setServerStats(ServerStats.findOne())
    return;
  }, [])

  let showExperimental = useTracker(function(){
    return Session.get('showExperimental');
  }, [])
  let onlyShowMatched = useTracker(function(){
    return Session.get('onlyShowMatched');
  }, [])
  let showUrlPreview = useTracker(function(){
    return Session.get('showUrlPreview');
  }, [])
  let showServerStats = useTracker(function(){
    return Session.get('showServerStats');
  }, [])


  let searchName = useTracker(function(){
    return Session.get('MainSearch.name');
  }, [])
  let searchCity = useTracker(function(){
    return Session.get('MainSearch.city');
  }, [])
  let searchState = useTracker(function(){
    return Session.get('MainSearch.state');
  }, [])
  let searchPostalCode = useTracker(function(){
    return Session.get('MainSearch.postalCode');
  }, [])
  let searchCountry = useTracker(function(){
    return Session.get('MainSearch.country');
  }, [])

  let searchPractitionerSpecialty = useTracker(function(){
    return Session.get('MainSearch.practitionerSpecialty');
  }, [])
  let searchEndpointType = useTracker(function(){
    return Session.get('MainSearch.endpointType');
  }, [])
  let searchHealthcareService = useTracker(function(){
    return Session.get('MainSearch.healthcareService');
  }, [])
  let searchInsurancePlan = useTracker(function(){
    return Session.get('MainSearch.insurancePlan');
  }, [])

  
  //----------------------------------------------------------------------
  // Urls  
  
  let baseUrl = addFhirBase(trimTrailingSlash(Meteor.absoluteUrl()));
  let organizationUrl = baseUrl + "/Organization?_count=" + searchCount;
  let practitionerUrl = baseUrl + "/Practitioner?_count=" + searchCount;
  let endpointUrl = baseUrl + "/Endpoint?_count=" + searchCount;
  let healthcareServiceUrl = baseUrl + "/HealthcareService?_count=" + searchCount;
  let locationUrl = baseUrl + "/Location?_count=" + searchCount;
  let insurancePlanUrl = baseUrl + "/InsurancePlan?_count=" + searchCount;

  let organizationUrlWithParams = useTracker(function(){
    let returnUrl = organizationUrl;
    if(Session.get('MainSearch.city')){
      returnUrl = returnUrl + '&address-city=' + Session.get('MainSearch.city');
    }
    if(Session.get('MainSearch.state')){
      returnUrl = returnUrl + '&address-state=' + get(Session.get('MainSearch.state'), 'code');
    }
    if(Session.get('MainSearch.postalCode')){
      returnUrl = returnUrl + '&address-postalcode=' + Session.get('MainSearch.postalCode');
    }
    if(Session.get('MainSearch.country')){
      returnUrl = returnUrl + '&address-country=' + get(Session.get('MainSearch.country'), 'code');
    }
    if(onlyShowMatched){
      returnUrl = returnUrl + '&name'
    } else {
      if(Session.get('MainSearch.name')){
        returnUrl = returnUrl + '&name=' + Session.get('MainSearch.name');
      }  
    }
    return returnUrl;
  }, [])

  let practitionerUrlWithParams = useTracker(function(){
    let returnUrl = practitionerUrl;
    if(Session.get('MainSearch.city')){
      returnUrl = returnUrl + '&address-city=' + Session.get('MainSearch.city');
    }
    if(Session.get('MainSearch.state')){
      returnUrl = returnUrl + '&address-state=' + get(Session.get('MainSearch.state'), 'code');
    }
    if(Session.get('MainSearch.postalCode')){
      returnUrl = returnUrl + '&address-postalcode=' + Session.get('MainSearch.postalCode');
    }
    if(Session.get('MainSearch.country')){
      returnUrl = returnUrl + '&address-country=' + get(Session.get('MainSearch.country'), 'code');
    }

    if(Session.get('MainSearch.practitionerSpecialty')){
      returnUrl = returnUrl + '&identifier=' + get(Session.get('MainSearch.practitionerSpecialty'), 'code');
    }
    if(onlyShowMatched){
      returnUrl = returnUrl + '&name'
    } else {
      if(Session.get('MainSearch.name')){
        returnUrl = returnUrl + '&name-text=' + Session.get('MainSearch.name');
      }  
    }
    return returnUrl;
  }, [])

  let endpointUrlWithParams = useTracker(function(){
    let returnUrl = endpointUrl;
    if(Session.get('MainSearch.endpointType')){
      returnUrl = returnUrl + '&connection-type=' + get(Session.get('MainSearch.endpointType'), 'code');

      if(onlyShowMatched){
        returnUrl = returnUrl + '&name'
      } else {
        if(Session.get('MainSearch.name')){
          returnUrl = returnUrl + '&name=' + Session.get('MainSearch.name');
        }  
      }
    }
    return returnUrl;  
  }, [])

  let locationUrlWithParams = useTracker(function(){
    let returnUrl = locationUrl;
    // if(Session.get('MainSearch.endpointType')){
    //   locationUrl = locationUrl + '&connection-type=' + get(Session.get('MainSearch.endpointType'), 'code');
    // }
    if(Session.get('MainSearch.city')){
      returnUrl = returnUrl + '&address-city=' + Session.get('MainSearch.city');
    }
    if(Session.get('MainSearch.state')){
      returnUrl = returnUrl + '&address-state=' + get(Session.get('MainSearch.state'), 'code');
    }
    if(Session.get('MainSearch.postalCode')){
      returnUrl = returnUrl + '&address-postalcode=' + Session.get('MainSearch.postalCode');
    }
    if(Session.get('MainSearch.country')){
      returnUrl = returnUrl + '&address-country=' + get(Session.get('MainSearch.country'), 'code');
    }
    if(onlyShowMatched){
      returnUrl = returnUrl + '&name'
    } else {
      if(Session.get('MainSearch.name')){
        returnUrl = returnUrl + '&name=' + Session.get('MainSearch.name');
      }  
    }
    return returnUrl;
  }, [])

  let healthcareServiceUrlWithParams = useTracker(function(){
    let returnUrl = healthcareServiceUrl;
    if(Session.get('MainSearch.healthcareService')){
      returnUrl = returnUrl + '&specialty=' + get(Session.get('MainSearch.healthcareService'), 'code');
    }
    if(onlyShowMatched){
      returnUrl = returnUrl + '&name'
    } else {
      if(Session.get('MainSearch.name')){
        returnUrl = returnUrl + '&name=' + Session.get('MainSearch.name');
      }  
    }
    return returnUrl;
  }, [])

  let insurancePlanUrlWithParams = useTracker(function(){
    let returnUrl = insurancePlanUrl;
    if(Session.get('MainSearch.insurancePlan')){
      returnUrl = returnUrl + '&specialty=' + get(Session.get('MainSearch.insurancePlan'), 'code');
    }
    if(onlyShowMatched){
      returnUrl = returnUrl + '&name'
    } else {
      if(Session.get('MainSearch.name')){
        returnUrl = returnUrl + '&name=' + Session.get('MainSearch.name');
      }  
    }
    return returnUrl;
  }, [])

  //----------------------------------------------------------------------
  // Functions  

  function openExternalPage(url){
    logger.debug('client.app.layout.FhirBasePage.openExternalPage', url);
    window.open(url);
  }
  function openPage(url){
    navigate(url, { replace: true });
  }

  //----------------------------------------------------------------------
  // Page Styling 

  let pageStyle = {
    paddingLeft: '0px', 
    paddingRight: '0px',
    position: 'absolute',
    top: '0px'
  }

  //----------------------------------------------------------------------
  // Main Render Method  


  let tagLineStyle = {
    fontWeight: 'normal',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '0px',
    marginBottom: '40px'
  }

  let featureRowStyle = {
    height: '52px'
  }

  if(Meteor.isCordova){
    pageStyle.width = '100%';
    pageStyle.padding = 20;
    pageStyle.marginLeft = '0px';
    pageStyle.marginRight = '0px';
  }

  


  function updatePostalCode(event){
    // console.log('updatePostalCode', event.currentTarget.value);    
    Session.set('MainSearch.postalCode', event.currentTarget.value);
  }
  function updateCity(event){
    // console.log('updateCity', event.currentTarget.value);    
    Session.set('MainSearch.city', event.currentTarget.value);
  }


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();


  let noResults;
  if(showNoResults){
    noResults = <div style={{width: '100%', textAlign: 'center', userSelect: 'none', position: 'relative'}}>
      <Typography variant="h4">No Results</Typography>
    </div>
  }


  let urlPreview;
  if(showUrlPreview){
    urlPreview = <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
      <CardHeader title="Urls Being Used" style={{paddingBottom: '0px', marginBottom: '0px', marginTop: '0px', userSelect: 'none'}}  />
      <CardContent>
        <Grid container justify="center" style={{marginBottom: '0px'}}>
          <Grid disabled item xs={12} container spacing={3} style={{padding: '0px', margin: '0px', fontSize: '120%'}}>
            <div style={{width: '100%'}} onClick={openExternalPage.bind(this, practitionerUrlWithParams)}>GET {practitionerUrlWithParams}</div><br />
            <div style={{width: '100%'}} onClick={openExternalPage.bind(this, organizationUrlWithParams)}>GET {organizationUrlWithParams}</div><br />
            <div style={{width: '100%'}} onClick={openExternalPage.bind(this, locationUrlWithParams)}>GET {locationUrlWithParams}</div><br />
            <div style={{width: '100%'}} onClick={openExternalPage.bind(this, healthcareServiceUrlWithParams)}>GET {healthcareServiceUrlWithParams}</div><br />
            <div style={{width: '100%'}} onClick={openExternalPage.bind(this, insurancePlanUrlWithParams)}>GET {insurancePlanUrlWithParams}</div><br />
            <div style={{width: '100%'}} onClick={openExternalPage.bind(this, endpointUrlWithParams)}>GET {endpointUrlWithParams}</div><br />
            
          </Grid>
        </Grid>
      </CardContent>
      <CardActions>
        <Button onClick={openExternalPage.bind(this, "https://www.postman.com/")}>Download Postman</Button>
      </CardActions>
      
    </Card>
  }

  let serverStatsCard = <div>
    <CardHeader title="Server Stats" style={{paddingBottom: '0px', marginBottom: '0px', marginTop: '20px', cursor: 'pointer', userSelect: 'none'}} onClick={handleToggleStats} />
    <Grid container spacing={1} justify="center" >
      <Grid item xs={12} sm={2}>

        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/practitioners')} >
          <CardHeader title={get(serverStats, "Practitioners", "0")} subheader="Practitioners"  />
        </Card>

        <Grid container spacing={1} justify="center">
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="HTTP"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="DDP"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
        </Grid>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/practitioners')} >
          <CardHeader subheader="OAuth"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
        </Card>
        <Grid container spacing={1} justify="center">
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="Chanel 1"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="Channel 2"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
        </Grid>
          
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/practitioners')} >
          <CardHeader title={ Practitioners.find().count() } subheader="Practitioners"  />
        </Card>

      </Grid>
      <Grid item xs={12} sm={2}>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/organizations')} >
          <CardHeader title={get(serverStats, "Organizations", "0") } subheader="Organizations"  />
        </Card>
        <Grid container spacing={1} justify="center">
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="HTTP"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="DDP"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
        </Grid>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/practitioners')} >
          <CardHeader subheader="OAuth"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
        </Card>
        <Grid container spacing={1} justify="center">
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="Chanel 1"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="Channel 2"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
        </Grid>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/organizations')} >
          <CardHeader title={ Organizations.find().count() } subheader="Organizations"  />
        </Card>

      </Grid>
      <Grid item xs={12} sm={2}>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/locations')} >
          <CardHeader title={get(serverStats, "Locations", "0")} subheader="Locations"  />
        </Card>
        <Grid container spacing={1} justify="center">
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="HTTP"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="DDP"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
        </Grid>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/practitioners')} >
          <CardHeader subheader="OAuth"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
        </Card>
        <Grid container spacing={1} justify="center">
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="Chanel 1"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="Channel 2"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
        </Grid>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/locations')} >
          <CardHeader title={ Locations.find().count() } subheader="Locations"  />
        </Card>

      </Grid>
      <Grid item xs={12} sm={2}>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/endpoints')} >
          <CardHeader title={get(serverStats, "Endpoints", "0")} subheader="Endpoints"  />
        </Card>
        <Grid container spacing={1} justify="center">
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="HTTP"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="DDP"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
        </Grid>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/practitioners')} >
          <CardHeader subheader="OAuth"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
        </Card>
        <Grid container spacing={1} justify="center">
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="Chanel 1"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="Channel 2"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
        </Grid>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/endpoints')} >
          <CardHeader title={ Endpoints.find().count() } subheader="Endpoints"  />
        </Card>

      </Grid>
      <Grid item xs={12} sm={2}>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/healthcare-services')} >
          <CardHeader title={get(serverStats, "HealthcareServices", "0")} subheader="Healthcare Services"  />
        </Card>
        <Grid container spacing={1} justify="center">
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="HTTP"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="DDP"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
        </Grid>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/practitioners')} >
          <CardHeader subheader="OAuth"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
        </Card>
        <Grid container spacing={1} justify="center">
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="Chanel 1"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="Channel 2"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
        </Grid>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/healthcare-services')} >
          <CardHeader title={ HealthcareServices.find().count() } subheader="Healthcare Services"  />
        </Card>
      </Grid>
      <Grid item xs={12} sm={2}>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/insurance-plans')} >
          <CardHeader title={get(serverStats, "InsurancePlans", "0")} subheader="Insurance Plans"  />
        </Card>
        <Grid container spacing={1} justify="center">
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="HTTP"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="DDP"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
        </Grid>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/practitioners')} >
          <CardHeader subheader="OAuth"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
        </Card>
        <Grid container spacing={1} justify="center">
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="Chanel 1"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader subheader="Channel 2"  style={{ paddingTop: '5px', paddingBottom: '5px'}} />
            </Card>
          </Grid>
        </Grid>
        <Card margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/insurance-plans')} >
          <CardHeader title={ InsurancePlans.find().count() } subheader="Insurance Plans"  />
        </Card>

      </Grid>
    </Grid>
    <CardHeader title="Local Subscription Cache" style={{align: 'left', paddingBottom: '0px', marginBottom: '0px', marginTop: '20px', cursor: 'pointer', userSelect: 'none'}} onClick={handleToggleStats} />
  </div> 



  return (
    <div id='FhirBasePage' headerHeight={headerHeight} paddingLeft={10} paddingRight={10}>
      <Container maxWidth="lg" style={{paddingBottom: '84px'}} >
        { serverStatsCard }
        { urlPreview }
        { noResults }
      </Container>
    </div>
  );
}

export default FhirBasePage;