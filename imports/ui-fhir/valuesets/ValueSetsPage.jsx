import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  CardHeader,
  CardContent,
  Grid
} from '@mui/material';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import ValueSetDetail from './ValueSetDetail';
import ValueSetsTable from './ValueSetsTable';

import LayoutHelpers from '../../lib/LayoutHelpers';
import FhirUtilities from '../../lib/FhirUtilities';
import { flattenProcedure } from '../../lib/FhirDehydrator';

import { get } from 'lodash';

// import { ValueSets } from '../../lib/schemas/SimpleSchemas/ValueSets';


//=============================================================================================================================================
// GLOBAL THEMING


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


//=============================================================================

Session.setDefault('valueSetPageTabIndex', 0);
Session.setDefault('valueSetSearchFilter', '');
Session.setDefault('selectedValueSetId', '');
Session.setDefault('selectedValueSet', null);
Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('valueSetsArray', []);
Session.setDefault('ValueSetsPage.onePageLayout', true)
Session.setDefault('ValueSetsPage.defaultQuery', {})
Session.setDefault('ValueSetsTable.hideCheckbox', false)
Session.setDefault('ValueSetsTable.valueSetsIndex', 0)


//===========================================================================
// MAIN COMPONENT  

export function ValueSetsPage(props){
  
  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  

  let data = {
    selectedValueSetId: '',
    selectedValueSet: null,
    valueSets: [],
    onePageLayout: false,
    valueSetSearchFilter: '',
    appHeight: window.innerHeight,
    valueSetsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ValueSetsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ValueSetsTable.hideCheckbox');
  }, [])
  data.selectedValueSetId = useTracker(function(){
    return Session.get('selectedValueSetId');
  }, [])
  data.selectedValueSet = useTracker(function(){
    return ValueSets.findOne({id: Session.get('selectedValueSetId')});
  }, [])
  data.valueSets = useTracker(function(){
    return ValueSets.find().fetch();
  }, [])
  data.valueSetSearchFilter = useTracker(function(){
    return Session.get('valueSetSearchFilter')
  }, [])
  data.appHeight = useTracker(function(){
    return Session.get('appHeight')
  }, [props.lastUpdated])

  data.valueSetsIndex = useTracker(function(){
    return Session.get('ValueSetsTable.valueSetsIndex')
  }, [props.lastUpdated])

  function setValueSetsIndex(newIndex){
    Session.set('ValueSetsTable.valueSetsIndex', newIndex)
  }

  function handleRowClick(valueSetId){
    console.log('ValueSetsPage.handleRowClick', valueSetId)
    let valueSet = ValueSets.findOne({id: valueSetId});

    if(valueSet){
      Session.set('selectedValueSetId', get(valueSet, 'id'));
      Session.set('selectedValueSet', valueSet);
      Session.set('ValueSet.Current', valueSet);
      
      let showModals = true;
      if(showModals){
        Session.set('mainAppDialogOpen', true);
        Session.set('mainAppDialogComponent', "ValueSetDetail");
        Session.set('mainAppDialogTitle', "Edit Value Set");
        Session.set('mainAppDialogMaxWidth', "sm");
      }      
    }
  }


  let cardWidth = window.innerWidth - paddingWidth;


  let layoutContents;
  if(data.onePageLayout){
    layoutContents = <Card height="auto" scrollable={true} margin={20} width={cardWidth + 'px'}>
      <CardHeader title={data.valueSets.length + " ValueSets"} />
      <CardContent>

        <ValueSetsTable 
          formFactorLayout={formFactor}  
          valueSets={ data.valueSets }
          count={data.valueSets.length}       
          selectedValueSetId={ data.selectedValueSetId }         
          onRowClick={ handleRowClick.bind(this) }
          hideCheckbox={data.hideCheckbox}
          hideId={false}
          rowsPerPage={LayoutHelpers.calcTableRows()}  
          onSetPage={function(index){
            setValueSetsIndex(index)
          }}    
          page={data.valueSetsIndex}  
          size="small"
          />
        </CardContent>
      </Card>
  } else {
    layoutContents = <Grid container spacing={3}>
      <Grid item lg={6}>
      <Card height="auto" scrollable={true} margin={20} width={cardWidth + 'px'}>
          <CardHeader title={data.valueSets.length + " Value Sets"} />
          <CardContent>
            <ValueSetsTable 
              formFactorLayout={formFactor}  
              valueSets={ data.valueSets }
              count={data.valueSets.length}
              selectedValueSetId={ data.selectedValueSetId }      
              onRowClick={ handleRowClick.bind(this) }
              hideCheckbox={data.hideCheckbox}
              hideId={false}
              rowsPerPage={ LayoutHelpers.calcTableRows("medium",  data.appHeight) }
              onSetPage={function(index){
                setValueSetsIndex(index)
              }}  
              page={data.valueSetsIndex}      
              size="medium"
              />
          </CardContent>
        </Card>
      </Grid>
      <Grid item lg={5}>
      <Card height="auto" scrollable={true} margin={20} width={cardWidth + 'px'}>
          <h1 className="barcode" style={{fontWeight: 100}}>{data.selectedValueSetId }</h1>
          {/* <CardHeader title={data.selectedValueSetId } className="helveticas barcode" /> */}
          <CardContent>
            <CardContent>
              <ValueSetDetail 
                id='valueSetDetails' 
                displayDatePicker={true} 
                displayBarcodes={false}
                valueSet={ data.selectedValueSet }
                valueSetId={ data.selectedValueSetId } 
                showValueSetInputs={true}
                showHints={false}
              />
            </CardContent>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  }

  return (
    <div id="valueSetsPage" style={{padding: "20px"}} >
      { layoutContents }
    </div>
  );
}



export default ValueSetsPage;