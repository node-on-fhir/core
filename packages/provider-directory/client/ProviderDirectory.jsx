import React, { useEffect, useState } from 'react';

import { Meteor } from 'meteor/meteor';
import { fetch } from 'meteor/fetch';
import { Session } from 'meteor/session';


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
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { get, indexOf } from 'lodash';

import { DynamicSpacer, PageCanvas, StyledCard } from 'fhir-starter';

import SearchIcon from '@material-ui/icons/Search';
import PersonIcon from '@material-ui/icons/Person';
import GroupIcon from '@material-ui/icons/Group';
import AssignmentIndIcon from '@material-ui/icons/AssignmentInd';
import ClassIcon from '@material-ui/icons/Class';
import CollectionsBookmarkIcon from '@material-ui/icons/CollectionsBookmark';
import LocalPlayIcon from '@material-ui/icons/LocalPlay';
import LocationOnIcon from '@material-ui/icons/LocationOn';


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

import Carousel from 'react-multi-carousel';

import { useTracker } from 'meteor/react-meteor-data';

import { LayoutHelpers, EndpointsTable, OrganizationsTable, PractitionersTable, LocationsTable, HealthcareServicesTable, InsurancePlansTable, ValueSets } from 'meteor/clinical:hl7-fhir-data-infrastructure';

import base64url from 'base64-url';


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
  },
  inputRoot: {
    '&$disabled': {
      color:'#222222'
    },
  },
  disabled: {}
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

// function DynamicSpacer(props){
//   return(<div style={{height: props.height}}></div>)
// }

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

Session.setDefault('MainSearch.defaultDirectoryQuery', get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.paths[0]', ""));

function MainPage(props){
  const classes = useStyles();

  let { 
    children, 
    jsonContent,
    ...otherProps 
  } = props;

  let [ showSearchResults, setShowSearchResults ] = useState(false);
  let [ showNoResults, setShowNoResults ] = useState(false);
  
  let [ searchTerm, setSearchTerm ] = useState('');
  let [ searchCount, setSearchCount ] = useState(1000);

  let [ defaultDirectoryQuery, setDefaultDirectoryQuery ] = useState(get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.paths[0]', ""));
  
  let [ searchLimit, setSearchLimit ] = useState(1000);
  let [ matchedEndpoints, setMatchedEndpoints ] = useState([]);
  let [ matchedOrganizations, setMatchedOrganizations ] = useState([]);
  let [ matchedPractitioners, setMatchedPractitioners ] = useState([]);
  let [ matchedLocations, setMatchedLocations ] = useState([]);
  let [ matchedHealthcareServices, setMatchedHealthcareServices ] = useState([]);
  let [ matchedInsurancePlans, setMatchedInsurancePlans ] = useState([]);

  let [ endpointPageIndex, setEndpointPageIndex ] = useState(0);
  let [ organizationPageIndex, setOrganizationPageIndex ] = useState(0);
  let [ practitionerPageIndex, setPractitionerPageIndex ] = useState(0);
  let [ locationPageIndex, setLocationPageIndex ] = useState(0);
  let [ insurancePlanPageIndex, setInsurancePlanPageIndex ] = useState(0);
  let [ healthcareServicePageIndex, setHealthcareServicePageIndex ] = useState(0);

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
    async function fetchStats() {
      try {
        const response = await fetch('/stats', {
          headers: httpHeaders
        });
        const parsedContent = await response.json();
        // console.log(parsedContent);

        setServerStats({
          Organizations: get(parsedContent, 'collections.organizations'),
          Practitioners: get(parsedContent, 'collections.practitioners'),
          HealthcareServices: get(parsedContent, 'collections.healthcareServices'),
          InsurancePlans: get(parsedContent, 'collections.insurancePlans'),
          Endpoints: get(parsedContent, 'collections.endpoints'),
          Networks: get(parsedContent, 'collections.networks'),
          Locations: get(parsedContent, 'collections.locations')
        })
      } catch(error) {
        console.error('Error fetching stats:', error);
      }
    }
    fetchStats();
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
  let hasRestrictions = useTracker(function(){
    if(Session.get('currentUser')){
      return false;
    } else {
      return true;
    }
  }, [])


  let specialtyValueSet = useTracker(function(){
    return ValueSets.findOne({id: '2.16.840.1.114222.4.11.1066'});
  }, [])
  
  
  //----------------------------------------------------------------------
  // Custom Styling  

  let customInputProps = {
    classes:{
      root: classes.inputRoot,
      disabled: classes.disabled
    }
  };
  let customInputLabelProps = {
    shrink: true
  }

  //----------------------------------------------------------------------
  // Urls  
  
  let baseUrl = addFhirBase(trimTrailingSlash(Meteor.absoluteUrl()));
  let organizationUrl = baseUrl + "/Organization?_count=" + searchCount;
  let practitionerUrl = baseUrl + "/Practitioner?_count=" + searchCount;
  let endpointUrl = baseUrl + "/Endpoint?_count=" + searchCount;
  let healthcareServiceUrl = baseUrl + "/HealthcareService?_count=" + searchCount;
  let locationUrl = baseUrl + "/Location?_count=" + searchCount;
  // let insurancePlanUrl = baseUrl + "/InsurancePlan?_count=" + searchCount;



  let organizationUrlWithParams = useTracker(function(){
    let returnUrl = organizationUrl;
    if(Session.get('MainSearch.city')){
      returnUrl = returnUrl + '&address-city=' + Session.get('MainSearch.city');
    }
    if(get(Session.get('MainSearch.state'), 'code')){
      returnUrl = returnUrl + '&address-state=' + get(Session.get('MainSearch.state'), 'code');
    }
    if(Session.get('MainSearch.postalCode')){
      returnUrl = returnUrl + '&address-postalcode=' + Session.get('MainSearch.postalCode');
    }
    if(get(Session.get('MainSearch.country'), 'code')){
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
    if(get(Session.get('MainSearch.state'), 'code')){
      returnUrl = returnUrl + '&address-state=' + get(Session.get('MainSearch.state'), 'code');
    }
    if(Session.get('MainSearch.postalCode')){
      returnUrl = returnUrl + '&address-postalcode=' + Session.get('MainSearch.postalCode');
    }
    if(get(Session.get('MainSearch.country'), 'code')){
      returnUrl = returnUrl + '&address-country=' + get(Session.get('MainSearch.country'), 'code');
    }

    if(get(Session.get('MainSearch.practitionerSpecialty'), 'code')){
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
    if(get(Session.get('MainSearch.endpointType'), 'code')){
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
    if(get(Session.get('MainSearch.state'), 'code')){
      returnUrl = returnUrl + '&address-state=' + get(Session.get('MainSearch.state'), 'code');
    }
    if(Session.get('MainSearch.postalCode')){
      returnUrl = returnUrl + '&address-postalcode=' + Session.get('MainSearch.postalCode');
    }
    if(get(Session.get('MainSearch.country'), 'code')){
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

  function pluckCode(sessionObject){
    let code = get(sessionObject, 'code');
    if(code){
      if(code.length > 0){      
        return true;
      } else {
        return false;
      }  
    } else {
      return false;
    }
  }

  let healthcareServiceUrlWithParams = useTracker(function(){
    let returnUrl = healthcareServiceUrl;
    if(get(Session.get('MainSearch.healthcareService'), 'code')){
      returnUrl = returnUrl + '&specialty=' + get(Session.get('MainSearch.healthcareService'), 'code');
    }
    if(onlyShowMatched){
      returnUrl = returnUrl + '&name'
    } else {
      if(Session.get('MainSearch.name')){
        returnUrl = returnUrl + '&name=' + Session.get('MainSearch.name');
      }  
    }
    if(pluckCode(Session.get('MainSearch.city'))){
      returnUrl = returnUrl + '&location.address-city=' + Session.get('MainSearch.city');
      // returnUrl = returnUrl + '&providedBy.address-city=' + Session.get('MainSearch.city');
    }
    if(pluckCode(Session.get('MainSearch.state'))){
      returnUrl = returnUrl + '&location.address-state=' + get(Session.get('MainSearch.state'), 'code');
      // returnUrl = returnUrl + '&providedBy.address-state=' + get(Session.get('MainSearch.state'), 'code');
    }
    if(pluckCode(Session.get('MainSearch.postalCode'))){
      returnUrl = returnUrl + '&location.address-postalcode=' + Session.get('MainSearch.postalCode');
      // returnUrl = returnUrl + '&providedBy.address-postalcode=' + Session.get('MainSearch.postalCode');
    }
    // if(Session.get('MainSearch.country')){
    //   returnUrl = returnUrl + '&location.address-country=' + get(Session.get('MainSearch.country'), 'code');
    // }

    return returnUrl;
  }, [])

  // let insurancePlanUrlWithParams = useTracker(function(){
  //   let returnUrl = insurancePlanUrl;
  //   if(Session.get('MainSearch.insurancePlan')){
  //     returnUrl = returnUrl + '&specialty=' + get(Session.get('MainSearch.insurancePlan'), 'code');
  //   }
  //   if(onlyShowMatched){
  //     returnUrl = returnUrl + '&name'
  //   } else {
  //     if(Session.get('MainSearch.name')){
  //       returnUrl = returnUrl + '&name=' + Session.get('MainSearch.name');
  //     }  
  //   }
  //   return returnUrl;
  // }, [])



  //----------------------------------------------------------------------
  // Functions  

  function openExternalPage(url){
    logger.debug('client.app.layout.MainPage.openExternalPage', url);
    window.open(url);
  }
  function openPage(url){
    props.history.replace(url)
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


  let httpHeaders = { "headers": {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }};

  if(get(Meteor, 'settings.public.basicAuthToken')){
      httpHeaders["Authorization"] = "Basic " + base64url.encode(get(Meteor, 'settings.public.basicAuthToken')) + "==";
  } else {

      // TODO:  add OAuthClients SMART on FHIR connectivity

      // TODO:  add JWT access

      // TODO:  add UDAP connection
  }


  
  function handleExactMatchSearch(){
    console.log('Conducting exact match search...');
    if(searchTerm.length > 0){
      setShowSearchResults(true);
      // setShowNoResults(false);
    } else {
      setShowSearchResults(false);
    }
    setMatchedEndpoints(Endpoints.find({'name': searchTerm}).fetch());
    setMatchedOrganizations(Organizations.find({'name': searchTerm}).fetch());
    setMatchedPractitioners(Practitioners.find({'name.text': searchTerm}).fetch());
    setMatchedEndpoints(Organizations.find({'name': searchTerm}).fetch());
    setMatchedHealthcareServices(Organizations.find({'name': searchTerm}).fetch());
    setMatchedInsurancePlans(Organizations.find({'name': searchTerm}).fetch());

    setEndpointPageIndex(0);
    setOrganizationPageIndex(0);
    setPractitionerPageIndex(0);
  }
  function handleFuzzySearch(){
    console.log('Conducting fuzzy search...');

    if(searchTerm.length > 0){
      setShowSearchResults(true);
      // setShowNoResults(false);
    } else {
      setShowSearchResults(false);
      // setShowNoResults(true);
    }

    console.log('organizationUrlWithParams', organizationUrlWithParams);
    HTTP.get(organizationUrlWithParams, {
      headers: httpHeaders
    }, function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', JSON.parse(get(result, 'content')));

        let parsedContent = JSON.parse(get(result, 'content'));
        if(get(parsedContent, 'total') === 0){
          // setShowNoResults(true);
        } else {
          let entryArray = get(parsedContent, 'entry');
          if(Array.isArray(entryArray)){
            let orgArray = entryArray.map(function(entry){
              return entry.resource;
            })        
            setMatchedOrganizations(orgArray)
            console.log('orgArray', orgArray)  
            setShowSearchResults(true);
            // setShowNoResults(false);
          }  
        }
      }
    })


    console.log('practitionerUrlWithParams', practitionerUrlWithParams);
    HTTP.get(practitionerUrlWithParams, {
      headers: httpHeaders
    }, function(error, result){
      if(error){
        console.error('error', error) 
      }
      if(result){
        console.log('result', JSON.parse(get(result, 'content')));

        let parsedContent = JSON.parse(get(result, 'content'));
        if(get(parsedContent, 'total') === 0){
          // setShowNoResults(true);
        } else {
          let entryArray = get(parsedContent, 'entry');
          if(Array.isArray(entryArray)){
            let practitionerArray = entryArray.map(function(entry){
              return entry.resource;
            })        
            setMatchedPractitioners(practitionerArray)
            console.log('practitionerArray', practitionerArray)  
            setShowSearchResults(true);
            // setShowNoResults(false);
          }  
        }
      }
    })

    // console.log('endpointUrlWithParams', endpointUrlWithParams);
    // HTTP.get(endpointUrlWithParams, {
    //    headers: httpHeaders
    //  }, function(error, result){
    //   if(error){
    //     console.error('error', error)
    //   }
    //   if(result){
    //     console.log('result', JSON.parse(get(result, 'content')));

    //     let parsedContent = JSON.parse(get(result, 'content'));
    //     if(get(parsedContent, 'total') === 0){
    //       // setShowNoResults(true);
    //     } else {
    //       let entryArray = get(parsedContent, 'entry');
    //       if(Array.isArray(entryArray)){
    //         let endpointArray = entryArray.map(function(entry){
    //           return entry.resource;
    //         })        
    //         setMatchedEndpoints(endpointArray)
    //         console.log('endpointArray', endpointArray)  
    //         setShowSearchResults(true);
    //         // setShowNoResults(false);
    //       }  
    //     }
    //   }
    // })

    console.log('locationUrlWithParams', locationUrlWithParams);
    HTTP.get(locationUrlWithParams, {
      headers: httpHeaders
    }, function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', JSON.parse(get(result, 'content')));

        let parsedContent = JSON.parse(get(result, 'content'));
        if(get(parsedContent, 'total') === 0){
          // setShowNoResults(true);
        } else {
          let entryArray = get(parsedContent, 'entry');
          if(Array.isArray(entryArray)){
            let locationArray = entryArray.map(function(entry){
              return entry.resource;
            })        
            setMatchedLocations(locationArray)
            console.log('locationArray', locationArray)  
            setShowSearchResults(true);
            // setShowNoResults(false);
          }  
        }
      }
    })

    // console.log('insurancePlanUrlWithParams', insurancePlanUrlWithParams);
    // HTTP.get(insurancePlanUrlWithParams, {
    //   headers: httpHeaders
    // }, function(error, result){
    //   if(error){
    //     console.error('error', error)
    //   }
    //   if(result){
    //     console.log('result', JSON.parse(get(result, 'content')));

    //     let parsedContent = JSON.parse(get(result, 'content'));
    //     if(get(parsedContent, 'total') === 0){
    //       // setShowNoResults(true);
    //     } else {
    //       let entryArray = get(parsedContent, 'entry');
    //       if(Array.isArray(entryArray)){
    //         let insurancePlanArray = entryArray.map(function(entry){
    //           return entry.resource;
    //         })        
    //         setMatchedInsurancePlans(insurancePlanArray)
    //         console.log('insurancePlanArray', insurancePlanArray)  
    //         setShowSearchResults(true);
    //         // setShowNoResults(false);
    //       }  
    //     }
    //   }
    // })

    console.log('healthcareServiceUrlWithParams', healthcareServiceUrlWithParams);
    HTTP.get(healthcareServiceUrlWithParams, {
      headers: httpHeaders
    }, function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', JSON.parse(get(result, 'content')));

        let parsedContent = JSON.parse(get(result, 'content'));
        if(get(parsedContent, 'total') === 0){
          // setShowNoResults(true);
        } else {
          let entryArray = get(parsedContent, 'entry');
          if(Array.isArray(entryArray)){
            let healthcareServiceArray = entryArray.map(function(entry){
              return entry.resource;
            })        
            setMatchedHealthcareServices(healthcareServiceArray)
            console.log('healthcareServiceArray', healthcareServiceArray)  
            setShowSearchResults(true);
            // setShowNoResults(false);
          }  
        }
      }
    })

    // setMatchedEndpoints(Endpoints.find({name: {$regex: searchTerm, $options:"i"}}).fetch());
    // setMatchedOrganizations(Organizations.find({name: {$regex: searchTerm, $options:"i"}}).fetch());
    // setMatchedPractitioners(Practitioners.find({'name.text': {$regex: searchTerm, $options:"i"}}).fetch());

    
    setEndpointPageIndex(0);
    setOrganizationPageIndex(0);
    setPractitionerPageIndex(0);
    setLocationPageIndex(0);
    setHealthcareServicePageIndex(0);
    setInsurancePlanPageIndex(0);
  }
  function handleClearSearch(){
    setMatchedEndpoints([]);
    setMatchedOrganizations([]);
    setMatchedPractitioners([]);
    setMatchedLocations([]);
    setMatchedHealthcareServices([]);
    setMatchedInsurancePlans([]);

    // setShowNoResults(false);
    setShowSearchResults(true);

    Session.set('MainSearch.city', '');

    Session.set('MainSearch.state', {display: '', code: ''});
    Session.set('MainSearch.postalCode', '');
    Session.set('MainSearch.country', {display: '', code: ''});
    Session.set('MainSearch.practitionerSpecialty', {display: '', code: ''});
    Session.set('MainSearch.practitionerQualification', {display: '', code: ''});
    Session.set('MainSearch.healthcareService', {display: '', code: ''});
    Session.set('MainSearch.insurancePlan', {display: '', code: ''});
    Session.set('MainSearch.securityDialog', {display: '', code: ''});
    Session.set('MainSearch.endpointType', {display: '', code: ''});

    // Session.set('MainSearch.state', null);
    // Session.set('MainSearch.postalCode', null);
    // Session.set('MainSearch.country', null);
    // Session.set('MainSearch.practitionerSpecialty', null);
    // Session.set('MainSearch.practitionerQualification', null);
    // Session.set('MainSearch.healthcareService', null);
    // Session.set('MainSearch.insurancePlan', null);
    // Session.set('MainSearch.securityDialog', null);
    // Session.set('MainSearch.endpointType', null);
  }
  function handleFuzzySubscribe(){
    console.log('Conducting fuzzy subscribe...');

    if(searchTerm.length > 0){
      setShowSearchResults(true);
      // setShowNoResults(false)
    } else {
      setShowSearchResults(false);
      // setShowNoResults(true)
    }
    setMatchedEndpoints(Endpoints.find({name: {$regex: searchTerm, $options:"i"}}).fetch());
    setMatchedOrganizations(Organizations.find({name: {$regex: searchTerm, $options:"i"}}).fetch());
    setMatchedPractitioners(Practitioners.find({'name.text': {$regex: searchTerm, $options:"i"}}).fetch());

    setEndpointPageIndex(0);
    setOrganizationPageIndex(0);
    setPractitionerPageIndex(0);
  }
  function handleChangeSearchTerm(event){
    setSearchTerm(event.currentTarget.value); 
    Session.set('MainSearch.name', event.currentTarget.value);   
  }
  function handleChangeSearchQuery(event){
    setDefaultDirectoryQuery(event.currentTarget.value); 
    Session.set('MainSearch.defaultDirectoryQuery', event.currentTarget.value);   
  }
  function handleChangeCount(event){
    setSearchCount(event.currentTarget.value);    
  }
  function toggleDetailedSearch(){
    setShowDetailedSearch(!showDetailedSearch);
  }
  function handleOpenTypes(){
    Session.set('mainAppDialogTitle', "Search States & Territories");
    Session.set('mainAppDialogComponent', "SearchStatesDialog");
    Session.set('lastUpdated', new Date());
    Session.set('mainAppDialogMaxWidth', "md");
    Meteor.setTimeout(function(){
      Session.set('mainAppDialogOpen', true);
    }, 200)
  }  
  function handleOpenStateDialog(){
    Session.set('selectedValueSet', 'us-core-usps-state');
    Session.set('mainAppDialogTitle', "Search States & Territories");
    Session.set('mainAppDialogComponent', "SearchValueSetsDialog");
    Session.set('lastUpdated', new Date());
    Session.set('mainAppDialogMaxWidth', "md");
    Session.set('dialogReturnValue', 'MainSearch.state');
    Meteor.setTimeout(function(){
      Session.set('mainAppDialogOpen', true);
    }, 200)
  }  
  function handleOpenCountryDialog(){
    Session.set('selectedValueSet', 'country');
    Session.set('mainAppDialogTitle', "Search Nations");
    Session.set('mainAppDialogComponent', "SearchValueSetsDialog");
    Session.set('lastUpdated', new Date());
    Session.set('mainAppDialogMaxWidth', "md");
    Session.set('dialogReturnValue', 'MainSearch.country');
    Meteor.setTimeout(function(){
      Session.set('mainAppDialogOpen', true);
    }, 200)
  }  

  function handlePractitionerSpecialtyDialog(){
    Session.set('selectedValueSet', 'IndividualAndGroupSpecialtiesVS');
    Session.set('mainAppDialogTitle', "Search for Clinician Specialty");
    Session.set('mainAppDialogComponent', "SearchValueSetsDialog");
    // Session.set('mainAppDialogComponent', "SearchLibraryOfMedicineDialog");
    Session.set('lastUpdated', new Date());
    Session.set('mainAppDialogMaxWidth', "md");
    Session.set('dialogReturnValue', 'MainSearch.practitionerSpecialty');
    Meteor.setTimeout(function(){
      Session.set('mainAppDialogOpen', true);
    }, 200)
  }  
  function handleHealthcareServiceDialog(){
    Session.set('selectedValueSet', '2.16.840.1.114222.4.11.1066');
    Session.set('mainAppDialogTitle', "Search Healthcare Service");
    Session.set('mainAppDialogComponent', "SearchValueSetsDialog");
    Session.set('lastUpdated', new Date());
    Session.set('mainAppDialogMaxWidth', "md");
    Session.set('dialogReturnValue', 'MainSearch.healthcareService');
    Meteor.setTimeout(function(){
      Session.set('mainAppDialogOpen', true);
    }, 200)
  }  
  function handleInsurancePlanDialog(){
    Session.set('selectedCodeSystem', 'insurance-plan-type');
    Session.set('mainAppDialogTitle', "Search Insurance Plan Type");
    Session.set('mainAppDialogComponent', "SearchCodeSystemDialog");
    Session.set('lastUpdated', new Date());
    Session.set('mainAppDialogMaxWidth', "md");
    Session.set('dialogReturnValue', 'MainSearch.insurancePlan');
    Meteor.setTimeout(function(){
      Session.set('mainAppDialogOpen', true);
    }, 200)
  }  
  function handleEndpointDialog(){
    Session.set('selectedCodeSystem', 'endpoint-connection-type');
    Session.set('mainAppDialogTitle', "Search Endpoint Types");
    Session.set('mainAppDialogComponent', "SearchCodeSystemDialog");
    Session.set('lastUpdated', new Date());
    Session.set('mainAppDialogMaxWidth', "md");
    Session.set('dialogReturnValue', 'MainSearch.endpointType');
    Meteor.setTimeout(function(){
      Session.set('mainAppDialogOpen', true);
    }, 200)
  }  
  function handleSecurityDialog(){
    Session.set('selectedValueSet', '');
    Session.set('mainAppDialogTitle', "Search Security Dialog");
    Session.set('mainAppDialogComponent', "SearchValueSetsDialog");
    Session.set('lastUpdated', new Date());
    Session.set('mainAppDialogMaxWidth', "md");
    Session.set('dialogReturnValue', 'MainSearch.securityDialog');
    Meteor.setTimeout(function(){
      Session.set('mainAppDialogOpen', true);
    }, 200)
  }  

  function enableRestrictionGui(hasRestrictions){
    let result = false;
    if(get(Meteor, 'settings.public.defaults.enableAccessRestrictions')){
      result = hasRestrictions;
    }
    return result;
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

  let mainContent;
  if(showSearchResults){

    let endpointResultsCard;
    let organizationResultsCard;
    let practitionerResultsCard;

    let locationResultsCard;
    let healthcareServiceResultsCard;
    let insurancePlanResultsCard;

    

    if(matchedEndpoints.length > 0){
      let hideEndpointPagination = true;
      if(matchedEndpoints.length > 5){
        hideEndpointPagination = false;
      }
      endpointResultsCard = <StyledCard margin={20} style={{marginTop: '0px', paddingTop: '0px', marginBottom: '20px', width: '100%'}}>    
        <CardHeader title={matchedEndpoints.length + " Endpoints"} subheader={endpointUrlWithParams} style={{marginBottom: '0px', paddingBottom: '0px'}} />
        <CardContent style={{marginTop: '0px', marginLeft: '20px', marginRight: '20px'}}>
          <EndpointsTable 
            endpoints={matchedEndpoints}
            disablePagination={hideEndpointPagination}
            rowsPerPage={5}
            count={matchedEndpoints.length}
            page={endpointPageIndex}
            onSetPage={function(index){
              setEndpointPageIndex(index)
            }}
          />
        </CardContent>
      </StyledCard>
    }

    console.log('matchedOrganizations', matchedOrganizations)
    if(matchedOrganizations.length > 0){
      let hideOrgPagination = true;
      if(matchedOrganizations.length > 5){
        hideOrgPagination = false;
      }
      organizationResultsCard = <StyledCard margin={20} style={{marginTop: '0px', paddingTop: '0px', marginBottom: '20px', width: '100%'}}>    
        <CardHeader title={matchedOrganizations.length + " Organizations"} subheader={organizationUrlWithParams} style={{marginBottom: '0px', paddingBottom: '0px'}} />
        <CardContent style={{marginTop: '0px', marginLeft: '20px', marginRight: '20px'}}>
          <OrganizationsTable 
            organizations={matchedOrganizations}
            disablePagination={hideOrgPagination}
            rowsPerPage={5}
            hideActionIcons={true}
            hideIdentifier={true}
            hideEmail={true}
            hasRestrictions={enableRestrictionGui(hasRestrictions)}
            count={matchedOrganizations.length}
            page={organizationPageIndex}
            onSetPage={function(index){
              setOrganizationPageIndex(index)
            }}
          />
        </CardContent>
      </StyledCard>
    }

    if(matchedPractitioners.length > 0){
      let hidePractitionerPagination = true;
      if(matchedPractitioners.length > 5){
        hidePractitionerPagination = false;
      }
      practitionerResultsCard = <StyledCard margin={20} style={{marginTop: '0px', paddingTop: '0px', marginBottom: '20px', width: '100%'}}>    
        <CardHeader title={matchedPractitioners.length + " Practitioners"} subheader={practitionerUrlWithParams} style={{marginBottom: '0px', paddingBottom: '0px'}} />
        <CardContent style={{marginTop: '0px', marginLeft: '20px', marginRight: '20px'}}>
          <PractitionersTable 
            practitioners={matchedPractitioners}
            disablePagination={hidePractitionerPagination}
            rowsPerPage={5}
            hideActionIcons={true}
            hideAddressLine={true}
            hideEmail={true}
            hideQualification={true}
            hideQualificationCode={true}
            hideIssuer={true}
            hideSpecialty={false}
            hasRestrictions={enableRestrictionGui(hasRestrictions)}
            count={matchedPractitioners.length}
            page={practitionerPageIndex}
            onSetPage={function(index){
              setPractitionerPageIndex(index)
            }}
            specialtyValueSet={specialtyValueSet}
          />
        </CardContent>
      </StyledCard>
    }


    if(matchedLocations.length > 0){
      let hideLocationPagination = true;
      if(matchedLocations.length > 5){
        hideLocationPagination = false;
      }
      locationResultsCard = <StyledCard margin={20} style={{marginTop: '0px', paddingTop: '0px', marginBottom: '20px', width: '100%'}}>    
        <CardHeader title={matchedLocations.length + " Locations"} subheader={locationUrlWithParams} style={{marginBottom: '0px', paddingBottom: '0px'}} />
        <CardContent style={{marginTop: '0px', marginLeft: '20px', marginRight: '20px'}}>
          <LocationsTable 
            locations={matchedLocations}
            disablePagination={hideLocationPagination}
            rowsPerPage={5}
            hideActionIcons={true}
            hideLatitude={true}
            hideLongitude={true}
            hideCountry={true}
            hideType={true}
            count={matchedLocations.length}
            page={locationPageIndex}
            onSetPage={function(index){
              setLocationPageIndex(index)
            }}
          />
        </CardContent>
      </StyledCard>
    }


    if(matchedHealthcareServices.length > 0){
      let hideHealthcareServicePagination = true;
      if(matchedHealthcareServices.length > 5){
        hideHealthcareServicePagination = false;
      }
      healthcareServiceResultsCard = <StyledCard margin={20} style={{marginTop: '0px', paddingTop: '0px', marginBottom: '20px', width: '100%'}}>    
        <CardHeader title={matchedHealthcareServices.length + " Healthcare Services"} subheader={healthcareServiceUrlWithParams} style={{marginBottom: '0px', paddingBottom: '0px'}} />
        <CardContent style={{marginTop: '0px', marginLeft: '20px', marginRight: '20px'}}>
          <HealthcareServicesTable 
            healthcareServices={matchedHealthcareServices}
            disablePagination={hideHealthcareServicePagination}
            hideBarcode={true}
            rowsPerPage={5}
            hideActionIcons={true}
            hideCategory={true}
            hideType={true}
            hideLocation={true}
            count={matchedHealthcareServices.length}
            page={healthcareServicePageIndex}
            onSetPage={function(index){
              setHealthcareServicePageIndex(index)
            }}
          />
        </CardContent>
      </StyledCard>
    }
    

    if(matchedInsurancePlans.length > 0){
      let hideInsurancePlanPagination = true;
      if(matchedInsurancePlans.length > 5){
        hideInsurancePlanPagination = false;
      }
      insurancePlanResultsCard = <StyledCard margin={20} style={{marginTop: '0px', paddingTop: '0px', marginBottom: '20px', width: '100%'}}>    
        <CardHeader title={matchedInsurancePlans.length + " InsurancePlans"} subheader={insurancePlanUrlWithParams} style={{marginBottom: '0px', paddingBottom: '0px'}} />
        <CardContent style={{marginTop: '0px', marginLeft: '20px', marginRight: '20px'}}>
          <InsurancePlansTable 
            insurancePlans={matchedInsurancePlans}
            disablePagination={hideInsurancePlanPagination}
            rowsPerPage={5}
            hideBarcode={true}
            hideAlias={true}
            hideActionIcons={true}
            hideCoverageArea={true}
            hideCoverageType={true}
            hideCoverageBenefitType={true}
            count={matchedInsurancePlans.length}
            page={insurancePlanPageIndex}
            onSetPage={function(index){
              setInsurancePlanPageIndex(index)
            }}
          />
        </CardContent>
      </StyledCard>
    }

    mainContent = <Grid container spacing={1} justify="center" style={{marginBottom: '20px'}}>
      <Grid item xs={12} sm={12} style={{marginTop: '20px', marginBottom: '80px'}} >
        
        { practitionerResultsCard }
        { organizationResultsCard }
        { locationResultsCard }
        { healthcareServiceResultsCard }
        { insurancePlanResultsCard }
        { endpointResultsCard }

      </Grid>
    </Grid>
  } else {
    mainContent = <div style={{textAlign: 'center', width: '100%'}}><CardHeader title="No Search Results" /></div>
  }

  let noResults;
  if(showNoResults){
    noResults = <div style={{width: '100%', textAlign: 'center', userSelect: 'none', position: 'relative'}}>
      <Typography variant="h4">No Results</Typography>
    </div>
  }

  let addressSearchElements = <Grid container spacing={1}>
    <Grid disabled  item xs={12} container spacing={3} style={{padding: '0px', margin: '0px'}}>
      <Grid item xs={3}>
        <FormControl style={{width: '100%', marginTop: '0px'}}>
          <InputLabel className={classes.label} shrink={true}>City</InputLabel>
          <Input
            id="city"
            name="city"
            className={classes.input}   
            value={searchCity}
            onChange={updateCity.bind(this)}
            fullWidth    
            type="text"
            // placeholder="Chicago"          
          />
        </FormControl>
      </Grid>
      <Grid item xs={3}>
        <FormControl style={{width: '100%', marginTop: '0px'}}>
          <InputLabel className={classes.label} shrink={true}>State</InputLabel>
          <Input
            id="stateOrJurisdiction"
            name="stateOrJurisdiction"
            className={classes.input}   
            value={get(searchState, 'display')}
            fullWidth    
            type="text"
            // placeholder="Illinois"
            disabled={true}
            onKeyDown= {(e) => {
              if (e.key === 'Backspace') {
                Session.set('MainSearch.state', null);
                // Session.set('MainSearch.state', {code: '', display: ''});
              }
            }}
            classes={{
              root: classes.inputRoot,
              disabled: classes.disabled
            }}
            endAdornment={
              <InputAdornment position="end" disabled={false}>
                <IconButton
                  aria-label="toggle type select"
                  onClick={ handleOpenStateDialog.bind(this) }
                >
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            }           
          />
        </FormControl>              
      </Grid>
      <Grid item xs={3}>
        <FormControl style={{width: '100%', marginTop: '0px'}}>
          <InputLabel className={classes.label} shrink={true}>Postal Code</InputLabel>
          <Input
            id="postalCode"
            name="postalCode"
            className={classes.input}   
            value={searchPostalCode}
            onChange={updatePostalCode.bind(this)}
            fullWidth    
            type="text"
            // placeholder="60618"          
          />
        </FormControl>
      </Grid>
      <Grid item xs={3}>
        <FormControl style={{width: '100%', marginTop: '0px'}}>
          <InputLabel className={classes.label} shrink={true}>Country</InputLabel>
          <Input
            id="country"
            name="country"
            className={classes.input}   
            value={get(searchCountry, 'display')}
              
            type="text"
            // placeholder="USA"
            disabled={true}
            onKeyDown= {(e) => {
              if (e.key === 'Backspace') {
                Session.set('MainSearch.country', null);
                // Session.set('MainSearch.country', {code: '', display: ''});
              }
            }}
            classes={{
              root: classes.inputRoot,
              disabled: classes.disabled
            }}
            endAdornment={
              <InputAdornment position="end" disabled={false}>
                <IconButton
                  aria-label="toggle type select"
                  onClick={ handleOpenCountryDialog.bind(this) }
                >
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            }           
          />          
        </FormControl>
      </Grid>
    </Grid>
    <Grid disabled  item xs={12} container spacing={3} style={{padding: '0px', margin: '0px'}}>
      <Grid item xs={6}>
        <FormControl style={{width: '100%', marginTop: '0px'}}>
          <InputLabel className={classes.label} shrink={true}>Practitioner Specialty</InputLabel>
          <Input
            id="practitionerSpecialty"
            name="practitionerSpecialty"
            className={classes.input}   
            value={get(searchPractitionerSpecialty, 'display')}
            fullWidth    
            type="text"
            // placeholder="Cardiologist"
            disabled={true}
            onKeyDown= {(e) => {
              if (e.key === 'Backspace') {
                Session.set('MainSearch.practitionerSpecialty', null);
              }
            }}
            classes={{
              root: classes.inputRoot,
              disabled: classes.disabled
            }}
            endAdornment={
              <InputAdornment position="end" disabled={false}>
                <IconButton
                  aria-label="toggle type select"
                  onClick={ handlePractitionerSpecialtyDialog.bind(this) }
                >
                  <AssignmentIndIcon />
                </IconButton>
              </InputAdornment>
            }           
          />
        </FormControl>              
      </Grid>
      {/* <Grid item xs={6}>
        <FormControl style={{width: '100%', marginTop: '0px'}}>
          <InputLabel className={classes.label}>Practitioner Qualification</InputLabel>
          <Input
            id="practitionerQualifications"
            name="practitionerQualifications"
            className={classes.input}   
            // value={FhirUtilities.pluckCodeableConcept(get(activeHealthcareService, 'type[0]'))}
            // onChange={updateField.bind(this, 'type[0].text')}
            fullWidth    
            type="text"
            placeholder="Medical Doctor"
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle type select"
                  onClick={ handlePractitionerQualificationDialog.bind(this) }
                >
                  <PersonIcon />
                </IconButton>
              </InputAdornment>
            }           
          />
        </FormControl>
      </Grid> */}
      <Grid item xs={6}>
        <FormControl style={{width: '100%', marginTop: '0px'}}>
          <InputLabel className={classes.label} shrink={true}>Endpoint Type</InputLabel>
          <Input
            id="endpointType"
            name="endpointType"
            className={classes.input}   
            value={get(searchEndpointType, 'display')}    
            type="text"
            // placeholder="HL7 FHIR"
            disabled={true}
            onKeyDown= {(e) => {
              if (e.key === 'Backspace') {
                Session.set('MainSearch.endpointType', null);
              }
            }}
            classes={{
              root: classes.inputRoot,
              disabled: classes.disabled
            }}
            endAdornment={
              <InputAdornment position="end" disabled={false}>
                <IconButton
                  aria-label="toggle type select"
                  onClick={ handleEndpointDialog.bind(this) }
                >
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            }           
          />
        </FormControl>
      </Grid>
    </Grid>
    <Grid disabled  item xs={12} container spacing={3} style={{padding: '0px', margin: '0px'}}>
      <Grid item xs={6}>
        <FormControl style={{width: '100%', marginTop: '0px'}}>
          <InputLabel className={classes.label} shrink={true}>Healthcare Service</InputLabel>
          <Input
            id="healthcareService"
            name="healthcareService"
            className={classes.input}   
            value={get(searchHealthcareService, 'display')}
            fullWidth    
            type="text"
            // placeholder="Physical Therapy"
            disabled={true}
            onKeyDown= {(e) => {
              if (e.key === 'Backspace') {
                Session.set('MainSearch.healthcareService', null);
              }
            }}
            classes={{
              root: classes.inputRoot,
              disabled: classes.disabled
            }}
            endAdornment={
              <InputAdornment position="end" disabled={false}>
                <IconButton
                  aria-label="toggle type select"
                  onClick={ handleHealthcareServiceDialog.bind(this) }
                >
                  <LocalPlayIcon />
                </IconButton>
              </InputAdornment>
            }           
          />
        </FormControl>              
      </Grid>
      <Grid item xs={6}>
        <FormControl style={{width: '100%', marginTop: '0px'}}>
          <InputLabel className={classes.label} shrink={true}>Insurance Plan</InputLabel>
          <Input
            id="insurancePlan"
            name="insurancePlan"
            className={classes.input}   
            value={get(searchInsurancePlan, 'display')}
            fullWidth    
            type="text"
            // placeholder="BCBS PPO Silver"
            disabled={true}
            onKeyDown= {(e) => {
              if (e.key === 'Backspace') {
                Session.set('MainSearch.insurancePlan', null);
              }
            }}
            classes={{
              root: classes.inputRoot,
              disabled: classes.disabled
            }}
            endAdornment={
              <InputAdornment position="end" disabled={false}>
                <IconButton
                  aria-label="toggle type select"
                  onClick={ handleInsurancePlanDialog.bind(this) }
                >
                  <ClassIcon />
                </IconButton>
              </InputAdornment>
            }           
          />
        </FormControl>              
      </Grid>
    </Grid>
    <Grid disabled  item xs={12} container spacing={3} style={{padding: '0px', margin: '0px'}}>
      
      {/* <Grid item xs={6}>
        <FormControl style={{width: '100%', marginTop: '0px'}}>
          <InputLabel className={classes.label}>Security</InputLabel>
          <Input
            id="endpointSignature"
            name="endpointSignature"
            className={classes.input}   
            // value={FhirUtilities.pluckCodeableConcept(get(activeHealthcareService, 'type[0]'))}
            // onChange={updateField.bind(this, 'type[0].text')}
            fullWidth    
            type="text"
            placeholder="RS256"
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle type select"
                  onClick={ handleSecurityDialog.bind(this) }
                >
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            }           
          />
        </FormControl>
      </Grid> */}
    </Grid>
  </Grid>  

  let detailedSearch;
  if(showDetailedSearch){
    detailedSearch = <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} >
        <CardContent>
          <Grid container justify="center" style={{marginBottom: '0px'}}>
            { addressSearchElements}          
          </Grid>
        </CardContent>
    </StyledCard>

  }

  let experimentalSearch;
  if(showExperimental){
    experimentalSearch = <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} >
      <CardContent>
        <Grid container justify="center" style={{marginBottom: '0px'}}>
          <Grid disabled item xs={12} container spacing={3} style={{padding: '0px', margin: '0px'}}>
            <Grid item xs={4}>
              <FormControl style={{width: '100%', marginTop: '0px'}}>
                <InputLabel className={classes.label}>Longitude</InputLabel>
                <Input
                  id="longitude"
                  name="longitude"
                  className={classes.input}   
                  // value={FhirUtilities.pluckCodeableConcept(get(activeHealthcareService, 'type[0]'))}
                  // onChange={updateField.bind(this, 'type[0].text')}
                  fullWidth    
                  type="text"
                  placeholder="-130.12322"
                  disabled={true}
                  // disabled={isDisabled}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle type select"
                        onClick={ handleOpenTypes.bind(this) }
                      >
                        <LocationOnIcon />
                      </IconButton>
                    </InputAdornment>
                  }           
                />
              </FormControl>              
            </Grid>
            <Grid item xs={4}>
              <FormControl style={{width: '100%', marginTop: '0px'}}>
                <InputLabel className={classes.label}>Latitude</InputLabel>
                <Input
                  id="latitude"
                  name="latitude"
                  className={classes.input}   
                  // value={FhirUtilities.pluckCodeableConcept(get(activeHealthcareService, 'type[0]'))}
                  // onChange={updateField.bind(this, 'type[0].text')}
                  fullWidth    
                  type="text"
                  placeholder="83.12356"
                  disabled={true}
                  // disabled={isDisabled}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle type select"
                        onClick={ handleOpenTypes.bind(this) }
                      >
                        <LocationOnIcon />
                      </IconButton>
                    </InputAdornment>
                  }           
                />
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <FormControl style={{width: '100%', marginTop: '0px'}}>
                <InputLabel className={classes.label}>Distance</InputLabel>
                <Input
                  id="distance"
                  name="distance"
                  className={classes.input}   
                  // value={FhirUtilities.pluckCodeableConcept(get(activeHealthcareService, 'type[0]'))}
                  // onChange={updateField.bind(this, 'type[0].text')}
                  fullWidth    
                  type="text"
                  placeholder="50"
                  disabled={true}
                  // disabled={isDisabled}
                />
              </FormControl>      
            </Grid>
            <Grid item xs={2}>
              <FormControl style={{width: '100%', marginTop: '0px'}}>
                <InputLabel className={classes.label}>Units</InputLabel>
                <Input
                  id="distanceUnits"
                  name="distanceUnits"
                  className={classes.input}   
                  // value={FhirUtilities.pluckCodeableConcept(get(activeHealthcareService, 'type[0]'))}
                  // onChange={updateField.bind(this, 'type[0].text')}
                  fullWidth    
                  type="text"
                  placeholder="miles"
                  disabled={true}
                  // disabled={isDisabled}
                />
              </FormControl>               
            </Grid>
          </Grid>
          
          <Grid disabled  item xs={12} container spacing={3} style={{padding: '0px', margin: '0px'}}>
            <Grid item xs={6}>
              <FormControl style={{width: '100%', marginTop: '0px'}}>
                <InputLabel className={classes.label}>Payor Network</InputLabel>
                <Input
                  id="payorNetwork"
                  name="payorNetwork"
                  className={classes.input}   
                  // value={FhirUtilities.pluckCodeableConcept(get(activeHealthcareService, 'type[0]'))}
                  // onChange={updateField.bind(this, 'type[0].text')}
                  fullWidth    
                  type="text"
                  // placeholder="Blue Cross Blue Shield"
                  disabled={true}
                  // disabled={isDisabled}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle type select"
                        onClick={ handleOpenTypes.bind(this) }
                      >
                        <CollectionsBookmarkIcon />
                      </IconButton>
                    </InputAdornment>
                  }           
                />
              </FormControl>              
            </Grid>
            <Grid item xs={6}>
              <FormControl style={{width: '100%', marginTop: '0px'}}>
                <InputLabel className={classes.label}>CareTeam Specialty</InputLabel>
                <Input
                  id="careteamSpecialty"
                  name="careteamSpecialty"
                  className={classes.input}   
                  // value={FhirUtilities.pluckCodeableConcept(get(activeHealthcareService, 'type[0]'))}
                  // onChange={updateField.bind(this, 'type[0].text')}
                  fullWidth    
                  type="text"
                  // placeholder="Sports Injury Specialists"
                  disabled={true}
                  // disabled={isDisabled}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle type select"
                        onClick={ handleOpenTypes.bind(this) }
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  }           
                />
              </FormControl>
            </Grid>
          </Grid>


        </Grid>
      </CardContent>
    </StyledCard>
  }


  let orgUrlPreview = "http://localhost:3000/baseR4/Organization";
  let practitionerUrlPreview = "http://localhost:3000/baseR4/Practitioner";
  
  // let endpointUrlWithParams = "http://localhost:3000/baseR4/Endpoint";
  // let locationUrlWithParams = "http://localhost:3000/baseR4/Location";
  // let healthcareServiceUrlWithParams = "http://localhost:3000/baseR4/HealthcareService";
  let insurancePlanUrlWithParams = "http://localhost:3000/baseR4/InsurancePlan";
  

  let urlPreview;
  if(showUrlPreview){
    urlPreview = <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} >
      <CardHeader title="URLS Being Used" style={{paddingBottom: '0px', marginBottom: '0px', marginTop: '0px', userSelect: 'none'}}  />
      <CardContent>
        <Grid container spacing={1} justify="center">
          <Grid item xs={12}>
            <FormControl style={{width: '100%', marginTop: '0px', marginBottom: '20px'}}>
              <InputLabel className={classes.label} shrink={true} >Search Query</InputLabel>
              <Input
                id="searchQuery"
                name="searchQuery"
                className={classes.input}   
                value={defaultDirectoryQuery}
                onChange={handleChangeSearchQuery.bind(this)}
                fullWidth    
                type="text"
                placeholder="/Practitioners?address-state=MA"          
                />
            </FormControl>                    
          </Grid>
        </Grid>
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
      
    </StyledCard>
  }

  let serverStatsCard = <div>
    <CardHeader title="Server Stats" style={{paddingBottom: '0px', marginBottom: '0px', marginTop: '20px', cursor: 'pointer', userSelect: 'none'}} onClick={handleToggleStats} />
    <Grid container spacing={1} justify="center" >
      <Grid item xs={12} sm={2}>
        <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/practitioners')} >
          <CardHeader title={get(serverStats, "Practitioners", "0")} subheader="Practitioners"  />
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={2}>
        <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/organizations')} >
          <CardHeader title={get(serverStats, "Organizations", "0") } subheader="Organizations"  />
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={2}>
        <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/locations')} >
          <CardHeader title={get(serverStats, "Locations", "0")} subheader="Locations"  />
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={2}>
        <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/endpoints')} >
          <CardHeader title={get(serverStats, "Endpoints", "0")} subheader="Endpoints"  />
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={2}>
        <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/healthcare-services')} >
          <CardHeader title={get(serverStats, "HealthcareServices", "0")} subheader="Healthcare Services"  />
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={2}>
        <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/insurance-plans')} >
          <CardHeader title={get(serverStats, "InsurancePlans", "0")} subheader="Insurance Plans"  />
        </StyledCard>
      </Grid>
    </Grid>
  </div> 

  let localStatsCard = <div>
    <CardHeader title="Local Subscription Cache" style={{paddingBottom: '0px', marginBottom: '0px', marginTop: '20px', cursor: 'pointer', userSelect: 'none'}} onClick={handleToggleStats} />
    <Grid container spacing={1} justify="center" >
      <Grid item xs={12} sm={2}>
        <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/practitioners')} >
          <CardHeader title={ Practitioners.find().count() } subheader="Practitioners"  />
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={2}>
        <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/organizations')} >
          <CardHeader title={ Organizations.find().count() } subheader="Organizations"  />
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={2}>
        <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/locations')} >
          <CardHeader title={ Locations.find().count() } subheader="Locations"  />
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={2}>
        <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/endpoints')} >
          <CardHeader title={ Endpoints.find().count() } subheader="Endpoints"  />
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={2}>
        <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/healthcare-services')} >
          <CardHeader title={ HealthcareServices.find().count() } subheader="Healthcare Services"  />
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={2}>
        <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} onClick={openPage.bind(this, '/insurance-plans')} >
          <CardHeader title={ InsurancePlans.find().count() } subheader="Insurance Plans"  />
        </StyledCard>
      </Grid>
    </Grid>
  </div> 

  let statsToRender;
  if(showServerStats){
    if(statsToShow === "local"){
      statsToRender = localStatsCard;
    } else if (statsToShow === "server"){
      statsToRender = serverStatsCard;
    }  
  }



  return (
    <PageCanvas id='MainPage' headerHeight={headerHeight} paddingLeft={10} paddingRight={10}>
      <Container maxWidth="lg" style={{paddingBottom: '84px'}} >
        
        { statsToRender }
        { urlPreview }

        <Grid container justify="center" style={{marginBottom: '0px'}}>
          <Grid item xs={12}>
            <StyledCard margin={20} style={{width: '100%', cursor: 'pointer'}} >
              <CardHeader title="Search Directory" />
              <CardContent>
                <Grid container spacing={1} justify="center">
                  <Grid item xs={10}>
                    <TextField 
                      label="Name"
                      // placeholder="St. James Hospital"
                      onChange={handleChangeSearchTerm.bind(this)}
                      value={searchTerm}
                      InputLabelProps={{
                        shrink: true
                      }}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField 
                      label="Number of Records"
                      placeholder="1000"
                      onChange={handleChangeCount.bind(this)}
                      value={searchCount}
                      InputLabelProps={{
                        shrink: true
                      }}
                      fullWidth
                    />
                  </Grid>
                </Grid>

                { addressSearchElements }

              </CardContent>
              <CardActions style={{width: '100%', display: 'flow-root'}}>
                <Button
                  variant="contained"
                  onClick={ handleFuzzySearch.bind(this) }
                >Search</Button>
                <Button
                  variant="contained"
                  onClick={ handleClearSearch.bind(this) }
                >Clear</Button>
                {/* <Button
                  variant="contained"
                  onClick={ handleExactMatchSearch.bind(this) }
                  style={{float: 'right'}}
                >Exact Match</Button> */}
                <Button
                  variant="contained"
                  onClick={ handleFuzzySubscribe.bind(this) }
                  style={{float: 'right'}}
                >Subscribe</Button>
                {/* <Button
                  variant="contained"
                  onClick={ toggleDetailedSearch.bind(this) }
                  style={{float: 'right'}}
                >Search Options</Button> */}

              </CardActions>
            </StyledCard>
          </Grid>
          <Grid item xs={12}>
            {detailedSearch}
            <DynamicSpacer />
            {experimentalSearch}
          </Grid>

        </Grid>

        { mainContent }
        { noResults }
      </Container>
    </PageCanvas>
  );
}

export default MainPage;