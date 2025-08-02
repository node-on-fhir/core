
import { 
  Button, 
  Grid, 
  CardHeader, 
  CardContent, 
  Typography,
  FormControl,
  Input,
  InputLabel,
  Select,
  MenuItem
} from '@material-ui/core';
import { StyledCard, PageCanvas } from 'fhir-starter';

import React, { useState } from 'react';
import { ReactMeteorData, useTracker } from 'meteor/react-meteor-data';
import { browserHistory } from 'react-router';

import { get, concat } from 'lodash';
import moment from 'moment';

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { 
  DynamicSpacer, 
  LayoutHelpers,
  NoDataWrapper,
  NotSignedInWrapper
} from 'meteor/clinical:hl7-fhir-data-infrastructure';

import { Line } from '@nivo/line'

// import NoDataWrapper from './NoDataWrapper';

// import { InlineMath, BlockMath } from 'react-katex';
// import 'katex/dist/katex.min.css';

export function BiomarkerChartingPage(props){

  let [heightPage, setHeightPage] = useState(0);
  let [weightPage, setWeightPage] = useState(0);
  
  let noDataImagePath = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  let headerHeight = LayoutHelpers.calcHeaderHeight();

  let data = {
    chart: {
      width: Session.get('appWidth') * 0.45,  
      height: 200
    },
    organizations: {
      image: "/pages/provider-directory/organizations.jpg"
    },
    bmi: {
      height: 0,
      weight: 0
    },
    selectedPatient: null,
    heightObservations: [],
    weightObservations: [],
    observationsCount: 0,
    timescale: 0
  };

  data.chart.width = useTracker(function(){
    return Session.get('appWidth') * 0.45;
  }, [])

  data.bmi.weight = useTracker(function(){
      let recentWeight = Observations.find({'code.text': 'Weight'}, {sort: {effectiveDateTime: 1}}).fetch()[0];
      return get(recentWeight, 'valueQuantity.value', null);
  }, []);

  data.bmi.height = useTracker(function(){
    let recentHeight = Observations.find({'code.text': 'Height'}, {sort: {effectiveDateTime: 1}}).fetch()[0];
    return get(recentHeight, 'valueQuantity.value', null);
  }, []);

  data.selectedPatient = useTracker(function(){
    return Session.get('selectedPatient');
  }, []);


  data.heightObservations = useTracker(function(){
    return Observations.find({'code.text': 'Height'}, {sort: {effectiveDateTime: 1}}).fetch();
  }, []);

  data.weightObservations = useTracker(function(){
    return Observations.find({$or: [{'code.text': 'Weight'}, {'code.coding.code': '29463-7'}]}, {sort: {effectiveDateTime: 1}}).fetch();
  }, []);

  data.pulseObservations = useTracker(function(){
    return Observations.find({$or: [{'code.text': 'Pulse'}, {'code.text': 'Heart rate'}, {'code.text': '8867-4'}]}, {sort: {effectiveDateTime: 1}}).fetch();
  }, []);

  data.temperatureObservations = useTracker(function(){
    return Observations.find({$or: [{'code.text': 'Body temperature'}, {'code.coding.code': '8310-5'}]}, {sort: {effectiveDateTime: 1}}).fetch();
  }, []);

  data.pressureObservations = useTracker(function(){
    return Observations.find({$or: [{'component.code.text': 'Diastolic Blood Pressure'}, {'component.code.coding.code': '8462-5'}]}, {sort: {effectiveDateTime: 1}}).fetch();
  }, []);

  data.respirationObservations = useTracker(function(){
    return Observations.find({$or: [{'code.text': 'Respiratory rate'}, {'code.coding.code': '9279-1'}]}, {sort: {effectiveDateTime: 1}}).fetch();
  }, []);

  data.oxygenationObservations = useTracker(function(){
    return Observations.find({$or: [{'code.text': 'Oxygen saturation in Arterial blood'}, {'code.coding.code': '2708-6'}, {'code.coding.code': '59408-5'}]}, {sort: {effectiveDateTime: 1}}).fetch();
  }, []);

  
  data.observationsCount = useTracker(function(){
    return Observations.find().count();
  }, []);

  data.timescale = useTracker(function(){
    return Session.get('timescale');
  }, [])



  let observationQuery = {$or: [{'code.text': 'Height'}, {'code.text': 'Weight'}]}
  let bmi = (data.bmi.weight / data.bmi.height / data.bmi.height * 10000).toFixed(2);


  function openLink(url){
    console.log("openLink", url);
    browserHistory.push(url);
  }
  function handleInitializeData(){
    // alert('Initialize!')
    Meteor.call('initializeBodyMassIndexData')
  }

  function handleChangeTimescale(event){
    // console.log('handleChangeTimescale', event.target.value)
    Session.set('timescale', event.target.value)
  }

  // let headerHeight = 84;
  // if(get(Meteor, 'settings.public.defaults.prominentHeader')){
  //   headerHeight = 148;
  // }

  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  
  let dataManagementElements;


  //if(data.observationsCount > 0){

    let pulseElements = [];
    let respirationElements = [];
    let bloodPressureElements = [];
    let weightElements = [];
    let temperatureElements = [];
    let bloodOxygenationElements = [];


    let dataVisulationTimeFormat = 'MMM DD, YYYY';
    switch (data.timescale) {
      case 0:  // all
        dataVisulationTimeFormat = 'MMM DD, YYYY';
        break;
      case 1:  // year
        dataVisulationTimeFormat = 'YYYY';
        break;
      case 2:  // season
        dataVisulationTimeFormat = 'YYYY Q';
        break;
      case 3:  // month
        dataVisulationTimeFormat = 'YYYY-MM';
        break;
      case 4:  // week
        dataVisulationTimeFormat = 'YYYY ww ddd';
        break;
      case 5:  // day
        dataVisulationTimeFormat = 'YYYY-MM-DD';
        break;
      case 6:  // hour
        dataVisulationTimeFormat = 'kk';
        break;    
      case 7:  // minute
        dataVisulationTimeFormat = 'kk mm';
        break;    
      default:
        dataVisulationTimeFormat = 'MMM DD, YYYY';
        break;
    }

    // const valuesToShow = data.map((v,i)=>i % 10 === 0  ?  '' : v)

    if(data.pulseObservations.length > 0){
      pulseElements.push(<StyledCard margins={20} >
      <CardHeader 
        title="Pulse"
        style={{paddingBottom: '0px'}}
        />
      <CardContent style={{fontSize: '180%', paddingTop: '0px'}}>
        <Line
          width={ data.chart.width}
          height={ data.chart.height}
          curve='natural'
          data={[
            {
              "id": "weight",
              "color": "hsl(122, 70%, 50%)",
              "data": Observations.find({$or: [{'code.text': 'Pulse'}, {'code.text': 'Heart rate'}, {'code.text': '8867-4'}]}, {sort: {effectiveDateTime: 1}}).map(function(observation){
                return {
                  x: moment(get(observation, 'effectiveDateTime')).format(dataVisulationTimeFormat),
                  y: get(observation, 'valueQuantity.value')
                }
              })
            }
          ]}
          margin={{
              "top": 50,
              "right": 110,
              "bottom": 50,
              "left": 60
          }}
          minY="auto"
          stacked={true}
          axisBottom={{
              "orient": "bottom",
              "tickSize": 5,
              "tickPadding": 5,
              "tickRotation": 0,
              "legend": "observation date",
              "legendOffset": 36
              // "format":  function(v){
              //   return Observations.find({$or: [{'code.text': 'Pulse'}, {'code.text': 'Heart rate'}, {'code.text': '8867-4'}]}, {sort: {effectiveDateTime: 1}}).map(function(observation, index){
              //     return index % 10 === 0  ?  '' : moment(get(observation, 'effectiveDateTime')).format(dataVisulationTimeFormat);
              //   })
              // }
          }}
          axisLeft={{
              "tickSize": 5,
              "tickPadding": 5,
              "tickRotation": 0,
              "legend": "beats / minute",
              "legendOffset": -40
          }}
          dotSize={10}
          dotColor="inherit:darker(0.3)"
          dotBorderWidth={2}
          dotBorderColor="#ffffff"
          enableDotLabel={true}
          dotLabel="y"
          dotLabelYOffset={-12}
          animate={true}
          motionStiffness={90}
          motionDamping={15}
          // legends={[
          //     {
          //         "anchor": "bottom-right",
          //         "direction": "column",
          //         "translateX": 100,
          //         "itemWidth": 80,
          //         "itemHeight": 20,
          //         "symbolSize": 12,
          //         "symbolShape": "circle"
          //     }
          // ]}
        />
      </CardContent>
      </StyledCard>)
      pulseElements.push(<DynamicSpacer />)
    }
    if(data.respirationObservations.length > 0){
      respirationElements.push(<StyledCard margins={20} >
        <CardHeader 
          title="Respiration Rate"
          style={{paddingBottom: '0px'}}
          />
        <CardContent style={{fontSize: '180%', paddingTop: '0px'}}>
          <Line
            width={ data.chart.width}
            height={ data.chart.height}
            curve='natural'
            data={[
              {
                "id": "weight",
                "color": "hsl(122, 70%, 50%)",
                "data": Observations.find({$or: [{'code.text': 'Respiratory rate'}, {'code.coding.code': '9279-1'}]}, {sort: {effectiveDateTime: 1}}).map(function(observation){
                  return {
                    x: moment(get(observation, 'effectiveDateTime')).format(dataVisulationTimeFormat),
                    y: get(observation, 'valueQuantity.value')
                  }
                })
              }
            ]}
            margin={{
                "top": 50,
                "right": 110,
                "bottom": 50,
                "left": 60
            }}
            minY="auto"
            stacked={true}
            axisBottom={{
                "orient": "bottom",
                "tickSize": 5,
                "tickPadding": 5,
                "tickRotation": 0,
                "legend": "observation date",
                "legendOffset": 36
                // "format":  function(v){
                //   return Observations.find({$or: [{'code.text': 'Pulse'}, {'code.text': 'Heart rate'}, {'code.text': '8867-4'}]}, {sort: {effectiveDateTime: 1}}).map(function(observation, index){
                //     return index % 10 === 0  ?  '' : moment(get(observation, 'effectiveDateTime')).format(dataVisulationTimeFormat);
                //   })
                // }
            }}
            axisLeft={{
                "tickSize": 5,
                "tickPadding": 5,
                "tickRotation": 0,
                "legend": "breaths / minute",
                "legendOffset": -40
            }}
            dotSize={10}
            dotColor="inherit:darker(0.3)"
            dotBorderWidth={2}
            dotBorderColor="#ffffff"
            enableDotLabel={true}
            dotLabel="y"
            dotLabelYOffset={-12}
            animate={true}
            motionStiffness={90}
            motionDamping={15}
            // legends={[
            //     {
            //         "anchor": "bottom-right",
            //         "direction": "column",
            //         "translateX": 100,
            //         "itemWidth": 80,
            //         "itemHeight": 20,
            //         "symbolSize": 12,
            //         "symbolShape": "circle"
            //     }
            // ]}
          />
        </CardContent>
      </StyledCard>)
      respirationElements.push(<DynamicSpacer />)
    }
    if(data.pressureObservations.length > 0){
      bloodPressureElements.push(<StyledCard margins={20} >
        <CardHeader 
          title="Blood Pressure"
          style={{paddingBottom: '0px'}}
          />
        <CardContent style={{fontSize: '180%', paddingTop: '0px'}}>
          <Line
            width={ data.chart.width}
            height={ data.chart.height}
            curve='natural'
            data={[
              {
                "id": "Diastolic",
                "color": "",
                "data": Observations.find({$or: [{'component.code.text': 'Diastolic Blood Pressure'}, {'component.code.coding.code': '8462-5'}]}, {sort: {effectiveDateTime: 1}}).map(function(observation){
                  return {
                    x: moment(get(observation, 'effectiveDateTime')).format(dataVisulationTimeFormat),
                    y: get(observation, 'component[0].valueQuantity.value')
                  }
                })
              }, {
                "id": "Systolic",
                "color": "",
                "data": Observations.find({$or: [{'component.code.text': 'Systolic Blood Pressure'}, {'component.code.coding.code': '8480-6'}]}, {sort: {effectiveDateTime: 1}}).map(function(observation){
                  return {
                    x: moment(get(observation, 'effectiveDateTime')).format(dataVisulationTimeFormat),
                    y: get(observation, 'component[1].valueQuantity.value')
                  }
                })
              }
            ]}
            margin={{
                "top": 50,
                "right": 110,
                "bottom": 50,
                "left": 60
            }}
            minY="auto"
            stacked={true}
            axisBottom={{
                "orient": "bottom",
                "tickSize": 5,
                "tickPadding": 5,
                "tickRotation": 0,
                "legend": "observation date",
                "legendOffset": 36             
                // "format":  function(v){
                //   return Observations.find({$or: [{'code.text': 'Pulse'}, {'code.text': 'Heart rate'}, {'code.text': '8867-4'}]}, {sort: {effectiveDateTime: 1}}).map(function(observation, index){
                //     return index % 10 === 0  ?  '' : moment(get(observation, 'effectiveDateTime')).format(dataVisulationTimeFormat);
                //   })
                // }
            }}
            axisLeft={{
                "tickSize": 5,
                "tickPadding": 5,
                "tickRotation": 0,
                "legend": "mm Hg",
                "legendOffset": -40
            }}
            dotSize={10}
            dotColor="inherit:darker(0.3)"
            dotBorderWidth={2}
            dotBorderColor="#ffffff"
            enableDotLabel={true}
            dotLabel="y"
            dotLabelYOffset={-12}
            animate={true}
            motionStiffness={90}
            motionDamping={15}
            // legends={[
            //     {
            //         "anchor": "bottom-right",
            //         "direction": "column",
            //         "translateX": 100,
            //         "itemWidth": 80,
            //         "itemHeight": 20,
            //         "symbolSize": 12,
            //         "symbolShape": "circle"
            //     }
            // ]}
          />
        </CardContent>
      </StyledCard>)
      bloodPressureElements.push(<DynamicSpacer />)
    }
    if(data.weightObservations.length > 0){
      weightElements.push(<StyledCard margins={20} >
        <CardHeader 
          title="Weight"
          style={{paddingBottom: '0px'}}
          />
        <CardContent style={{fontSize: '180%', paddingTop: '0px'}}>
          <Line
            width={ data.chart.width}
            height={ data.chart.height}
            curve='natural'
            data={[
              {
                "id": "weight",
                "color": "hsl(122, 70%, 50%)",
                "data": Observations.find({$or: [{'code.text': 'Weight'}, {'code.coding.code': '29463-7'}]}, {sort: {effectiveDateTime: 1}}).map(function(observation){
                  return {
                    x: moment(get(observation, 'effectiveDateTime')).format(dataVisulationTimeFormat),
                    y: get(observation, 'valueQuantity.value')
                  }
                })
              }
            ]}
            margin={{
                "top": 50,
                "right": 110,
                "bottom": 50,
                "left": 60
            }}
            minY="auto"
            stacked={true}
            axisBottom={{
                "orient": "bottom",
                "tickSize": 5,
                "tickPadding": 5,
                "tickRotation": 0,
                "legend": "observation date",
                "legendOffset": 36
                // "format":  function(v){
                //   return Observations.find({$or: [{'code.text': 'Pulse'}, {'code.text': 'Heart rate'}, {'code.text': '8867-4'}]}, {sort: {effectiveDateTime: 1}}).map(function(observation, index){
                //     return index % 10 === 0  ?  '' : moment(get(observation, 'effectiveDateTime')).format(dataVisulationTimeFormat);
                //   })
                // }
            }}
            axisLeft={{
                "tickSize": 5,
                "tickPadding": 5,
                "tickRotation": 0,
                "legend": "Kilograms (kg)",
                "legendOffset": -40
            }}
            dotSize={10}
            dotColor="inherit:darker(0.3)"
            dotBorderWidth={2}
            dotBorderColor="#ffffff"
            enableDotLabel={true}
            dotLabel="y"
            dotLabelYOffset={-12}
            animate={true}
            motionStiffness={90}
            motionDamping={15}
            // legends={[
            //     {
            //         "anchor": "bottom-right",
            //         "direction": "column",
            //         "translateX": 100,
            //         "itemWidth": 80,
            //         "itemHeight": 20,
            //         "symbolSize": 12,
            //         "symbolShape": "circle"
            //     }
            // ]}
          />
        </CardContent>
      </StyledCard>)
      weightElements.push(<DynamicSpacer />)
    }
    if(data.temperatureObservations.length > 0){
      temperatureElements.push(<StyledCard margins={20} >
        <CardHeader 
          title="Temperature"
          style={{paddingBottom: '0px'}}
          />
        <CardContent style={{fontSize: '180%', paddingTop: '0px'}}>
          <Line
            width={ data.chart.width}
            height={ data.chart.height}
            curve='natural'
            data={[
              {
                "id": "weight",
                "color": "hsl(122, 70%, 50%)",
                "data": Observations.find({$or: [{'code.text': 'Body temperature'}, {'code.coding.code': '8310-5'}]}, {sort: {effectiveDateTime: 1}}).map(function(observation){
                  return {
                    x: moment(get(observation, 'effectiveDateTime')).format(dataVisulationTimeFormat),
                    y: get(observation, 'valueQuantity.value')
                  }
                })
              }
            ]}
            margin={{
                "top": 50,
                "right": 110,
                "bottom": 50,
                "left": 60
            }}
            minY="auto"
            stacked={true}
            axisBottom={{
                "orient": "bottom",
                "tickSize": 5,
                "tickPadding": 5,
                "tickRotation": 0,
                "legend": "observation date",
                "legendOffset": 36
                // "format":  function(v){
                //   return Observations.find({$or: [{'code.text': 'Pulse'}, {'code.text': 'Heart rate'}, {'code.text': '8867-4'}]}, {sort: {effectiveDateTime: 1}}).map(function(observation, index){
                //     return index % 10 === 0  ?  '' : moment(get(observation, 'effectiveDateTime')).format(dataVisulationTimeFormat);
                //   })
                // }
            }}
            axisLeft={{
                "tickSize": 5,
                "tickPadding": 5,
                "tickRotation": 0,
                "legend": "Celsius (Cel)",
                "legendOffset": -40
            }}
            dotSize={10}
            dotColor="inherit:darker(0.3)"
            dotBorderWidth={2}
            dotBorderColor="#ffffff"
            enableDotLabel={true}
            dotLabel="y"
            dotLabelYOffset={-12}
            animate={true}
            motionStiffness={90}
            motionDamping={15}
            // legends={[
            //     {
            //         "anchor": "bottom-right",
            //         "direction": "column",
            //         "translateX": 100,
            //         "itemWidth": 80,
            //         "itemHeight": 20,
            //         "symbolSize": 12,
            //         "symbolShape": "circle"
            //     }
            // ]}
          />
        </CardContent>
      </StyledCard>)
      temperatureElements.push(<DynamicSpacer />)
    }
    if(data.oxygenationObservations.length > 0){
      bloodOxygenationElements.push(<StyledCard margins={20} >
        <CardHeader 
          title="Blood Oxygenation"
          style={{paddingBottom: '0px'}}
          />
        <CardContent style={{fontSize: '180%', paddingTop: '0px'}}>
          <Line
            width={ data.chart.width}
            height={ data.chart.height}
            curve='natural'
            data={[
              {
                "id": "weight",
                "color": "hsl(122, 70%, 50%)",
                "data": Observations.find({$or: [{'code.text': 'Oxygen saturation in Arterial blood'}, {'code.coding.code': '59408-5'}]}, {sort: {effectiveDateTime: 1}}).map(function(observation){
                  return {
                    x: moment(get(observation, 'effectiveDateTime')).format(dataVisulationTimeFormat),
                    y: get(observation, 'valueQuantity.value')
                  }
                })
              }
            ]}
            margin={{
                "top": 50,
                "right": 110,
                "bottom": 50,
                "left": 60
            }}
            minY="auto"
            stacked={true}
            axisBottom={{
                "orient": "bottom",
                "tickSize": 5,
                "tickPadding": 5,
                "tickRotation": 0,
                "legend": "observation date",
                "legendOffset": 36
                // "format":  function(v){
                //   return Observations.find({$or: [{'code.text': 'Pulse'}, {'code.text': 'Heart rate'}, {'code.text': '8867-4'}]}, {sort: {effectiveDateTime: 1}}).map(function(observation, index){
                //     return index % 10 === 0  ?  '' : moment(get(observation, 'effectiveDateTime')).format(dataVisulationTimeFormat);
                //   })
                // }
            }}
            axisLeft={{
                "tickSize": 5,
                "tickPadding": 5,
                "tickRotation": 0,
                "legend": "%",
                "legendOffset": -40
            }}
            dotSize={10}
            dotColor="inherit:darker(0.3)"
            dotBorderWidth={2}
            dotBorderColor="#ffffff"
            enableDotLabel={true}
            dotLabel="y"
            dotLabelYOffset={-12}
            animate={true}
            motionStiffness={90}
            motionDamping={15}
            // legends={[
            //     {
            //         "anchor": "bottom-right",
            //         "direction": "column",
            //         "translateX": 100,
            //         "itemWidth": 80,
            //         "itemHeight": 20,
            //         "symbolSize": 12,
            //         "symbolShape": "circle"
            //     }
            // ]}
          />
        </CardContent>
      </StyledCard>)
      bloodOxygenationElements.push(<DynamicSpacer />)
    }

    if(data.selectedPatient){
      dataManagementElements = <NotSignedInWrapper notSignedInImagePath="">
        <Grid container spacing={3} style={{marginTop: '0px', marginBottom: '84px', paddingBottom: '84px'}}>            
            <Grid item md={2}>
              <FormControl style={{width: '100%', paddingBottom: '20px', marginTop: '10px'}}>
                <InputLabel id="timescale-label">Timescale</InputLabel>
                <Select
                  id="timescale-selector"
                  value={ data.timescale }
                  onChange={handleChangeTimescale.bind(this)}
                  fullWidth
                  >
                  <MenuItem value={0} id="timescale-menu-item-0" key="timescale-menu-item-0" >All</MenuItem>
                  <MenuItem value={1} id="timescale-menu-item-1" key="timescale-menu-item-1" >Year</MenuItem>
                  <MenuItem value={2} id="timescale-menu-item-2" key="timescale-menu-item-2" >Season</MenuItem>
                  <MenuItem value={3} id="timescale-menu-item-3" key="timescale-menu-item-3" >Month</MenuItem>
                  <MenuItem value={4} id="timescale-menu-item-4" key="timescale-menu-item-4" >Week</MenuItem>
                  <MenuItem value={5} id="timescale-menu-item-5" key="timescale-menu-item-5" >Day</MenuItem>
                  <MenuItem value={6} id="timescale-menu-item-6" key="timescale-menu-item-6" >Hour</MenuItem>
                  <MenuItem value={7} id="timescale-menu-item-7" key="timescale-menu-item-7" >Minute</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item md={2}>
              
            </Grid>
            <Grid item md={2}>

            </Grid>
            <Grid item md={6}>

            </Grid>
            <Grid item md={6}>
              
              { pulseElements }
              { bloodPressureElements }
              { temperatureElements }

            </Grid>
            <Grid item md={6}>
              
              { respirationElements }
              { weightElements }
              { bloodOxygenationElements }        

            </Grid>
          </Grid>
      </NotSignedInWrapper>
    } else {
      dataManagementElements = <NotSignedInWrapper notSignedInImagePath="">
        <NoDataWrapper 
          dataCount={data.observationsCount} 
          noDataImagePath=""
          history={props.history} 
          title="No Patient Selected"
          buttonLabel="Lookup Patient"
          redirectPath="/patient-lookup"
          >          
        </NoDataWrapper>
      </NotSignedInWrapper>
    }
    
    


  // } else {
  //   dataManagementElements = <Grid justify="center" container spacing={8} style={{marginTop: '0px', marginBottom: '80px'}}>            
  //     <Grid item md={6}>
  //       <CardHeader title="No Data" subheader='Click button to load sample patient into the database.' />
  //       <Button 
  //         fullWidth
  //         variant="contained"
  //         color="primary"
  //         onClick={handleInitializeData.bind(this)}
  //         >Initialize</Button>
  //     </Grid>
  //   </Grid>
  // }

  return (
      <PageCanvas id='bodyMassPage' headerHeight={headerHeight} paddingLeft={paddingWidth} paddingRight={paddingWidth}  >
        { dataManagementElements }
      </PageCanvas>
  );
}

export default BiomarkerChartingPage;