import React, { useState } from 'react';

import { 
  Button,
  Grid,  
  Container,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell
} from '@mui/material';


import { get } from 'lodash';
import { Hello } from './Hello.jsx';
import { Info } from './Index.jsx';

import { Meteor } from 'meteor/meteor';
import { useEffect } from 'react';

import { FhirResource, fhirVersions } from 'fhir-react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import ErrorBoundary from './ErrorBoundary.jsx';
import { DynamicSpacer } from './DynamicSpacer';

//----------------------------------------------------------------------
// Helper Components

let useTheme;
Meteor.startup(function(){
  useTheme = Meteor.useTheme;
})


//----------------------------------------------------------------------
// Theming

const theme = createTheme({
  components: {
    MuiGrid: {
      styleOverrides: {
        root: {
          position: 'sticky !important',
          top: '100px !important'
        },
      },
    },
  },
});



function StaticPatientFileLoaderPage(props){
  
  let [syntheaPatient, setSyntheaPatient] = useState();
  let [counter, setCounter] = useState(0);
  let [resourceIndex, setResourceIndex] = useState(0);

  useEffect(function(){
    async function fetchData(){ 
      
    }
  }, [])




  //----------------------------------------------------------------------
  // Page Styling 

  let headerHeight = 64;
  if(get(Meteor, 'settings.public.defaults.prominentHeader')){
    headerHeight = 128;
  }

  let pageStyle = {
    paddingLeft: '100px', 
    paddingRight: '100px',
    position: 'absolute',
    top: '0px'
  }

  //----------------------------------------------------------------------
  // Main Render Method  


  if(Meteor.isCordova){
    pageStyle.width = '100%';
    pageStyle.padding = 20;
    pageStyle.marginLeft = '0px';
    pageStyle.marginRight = '0px';
  }


  let hasTitle = get(Meteor, 'settings.public.title', false);
  let hasTheme = get(Meteor, 'settings.public.theme', false);

  let missingTitleElements;
  let missingThemeElements;

  if(!hasTitle){
    missingTitleElements = <Grid item xs={12}>
      <Button color="primary" fullWidth variant="contained">
          Todo:  Add a settings file.  
      </Button>
    </Grid>
    
  }
  if(!hasTheme){
    missingThemeElements = <Grid item xs={12}>
      <Button color="primary" fullWidth variant="contained">
          Todo:  Add a theme and color palette.
      </Button>
    </Grid>
    
  }

    

  const increment = () => {
    console.log('click!')
    setCounter(counter + 1);

    Meteor.call('getAsset', 'Brain142_Friesen796_6bda128a-4ddd-19e5-dd0b-8c80b93dad6e.json', function(error, result){
      if(error){
        console.error('error', error);
      }
      if(result){
        console.log('result', result);
        setSyntheaPatient(result);
      }
    });
  };

  function contentsOfBundleAsText(bundle){
    if(typeof bundle === "string"){
      bundle = JSON.parse(bundle);
    }
    console.log('contentsOfBundleAsText.bundle', bundle);

    let text = '';
    let tableRowsArray = [];
    if(bundle){
      if(bundle.entry){
        bundle.entry.forEach(function(entry, index){
          if(entry.resource){
            text += entry.resource.id + ' - ' + entry.resource.resourceType + "\n";
            tableRowsArray.push(<TableRow hover onClick={clickRow.bind(this, index)} style={{cursor: 'pointer'}}>
              <TableCell>{get(entry, "resource.id")}</TableCell>
              <TableCell>{get(entry, "resource.resourceType")}</TableCell>
            </TableRow>);
          }
        });
      }
    }
    console.log('contentsOfBundleAsText.text', text)
    return (<Table size="small">
      {tableRowsArray}
    </Table>);
  }

  function clickRow(index){
    console.log('clickRow', index);
    setResourceIndex(index);
  }
  

  
  let pageContent;
  if(syntheaPatient){
    pageContent = <Grid container style={{width: '100%'}}>
      <Grid item xs={6} fullWidth justify="left">
        <CardContent>
          <pre>
            {contentsOfBundleAsText(syntheaPatient)}
          </pre>
        </CardContent>
      </Grid>            
      <Grid fullWidth item xs={6} sx={{position: 'sticky', top: '100px'}}>
        <CardContent>
          <ThemeProvider theme={theme}>
            <ResourceDetailsCard patient={syntheaPatient} index={resourceIndex} />
          </ThemeProvider>
        </CardContent>
      </Grid>
    </Grid>
  } else {
    pageContent = <CardContent>
      <Button fullWidth color="primary" variant="contained" onClick={increment} style={{cursor: 'pointer', display: 'inline-block', padding: '8px', borderRadius: '4px'}}>
        Load Sample Patient
      </Button>
    </CardContent>
  }
  

  return (
    <div id='StaticFileLoader' style={{'height': window.innerHeight, 'overflow': "auto"}}>
      {pageContent}  
    </div>      
  );
}


function ResourceDetailsCard({
  patient,
  index = 0
}){

  const { theme, toggleTheme } = useTheme();
  // let [resourceIndex, setResourceIndex] = useState(0);


  // useEffect(function(){
  //   setResourceIndex(index);
  // }, [index]);

  function getResourceForDynamicComponent(bundle, filterId){
    if(typeof bundle === "string"){
      bundle = JSON.parse(bundle);
    }
    console.log('getResourceForDynamicComponent.bundle', bundle);
  
    let returnResource;
    let text = '';
    if(bundle){
      if(bundle.entry){
        bundle.entry.forEach(function(entry, entryIndex){
          if(entryIndex === filterId){
            returnResource = entry.resource;
          }
        });
      }
    }
    console.log('contentsOfBundleAsText.returnResource', returnResource)
    return returnResource;
  }

  let fhirResource;
  if(patient){
    fhirResource = <FhirResource
      fhirResource={getResourceForDynamicComponent(patient, index)}
      fhirVersion={fhirVersions.R4}
      fhirIcons="https://www.gravatar.com/avatar/?s=50&r=any&default=identicon&forcedefault=1"
      withCarinBBProfile
    />
  }

  
  return (
    <Card>
      <ErrorBoundary>
        {fhirResource}
      </ErrorBoundary>
    </Card>
  )
}


export default StaticPatientFileLoaderPage;

