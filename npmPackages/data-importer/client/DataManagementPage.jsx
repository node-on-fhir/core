// // https://www.npmjs.com/package/react-dropzone-component
// // http://www.dropzonejs.com/

// import { 
//   Grid, 
//   CardHeader, 
//   CardContent,
//   Card,
//   Tabs,
//   Tab,
//   Typography
// } from '@mui/material';


// import React, { useState } from 'react';
// import PropTypes from 'prop-types';

// import { Meteor } from 'meteor/meteor';
// import { Session } from 'meteor/session';

// import { useTracker } from 'meteor/react-meteor-data';

// import { get } from 'lodash';

// import { CollectionManagement } from './CollectionManagement';
// import { ImportComponent } from './ImportComponent';
// import { JsonEditorComponent } from './JsonEditorComponent';
// import { ExportComponent } from './ExportComponent';

// import { MuiThemeProvider, createTheme } from '@mui/material/styles';


// Session.setDefault('dataContent', '');
// Session.setDefault('syncSourceItem', 1);

//   // //============================================================================
//   // //Global Theming 

//   let theme = {
//     primaryColor: "rgb(108, 183, 110)",
//     primaryText: "rgba(255, 255, 255, 1) !important",

//     secondaryColor: "rgb(108, 183, 110)",
//     secondaryText: "rgba(255, 255, 255, 1) !important",

//     cardColor: "rgba(255, 255, 255, 1) !important",
//     cardTextColor: "rgba(0, 0, 0, 1) !important",

//     errorColor: "rgb(128,20,60) !important",
//     errorText: "#ffffff !important",

//     appBarColor: "#f5f5f5 !important",
//     appBarTextColor: "rgba(0, 0, 0, 1) !important",

//     paperColor: "#f5f5f5 !important",
//     paperTextColor: "rgba(0, 0, 0, 1) !important",

//     backgroundCanvas: "rgba(255, 255, 255, 1) !important",
//     background: "linear-gradient(45deg, rgb(108, 183, 110) 30%, rgb(150, 202, 144) 90%)",

//     nivoTheme: "greens"
//   }

//   // if we have a globally defined theme from a settings file
//   if(get(Meteor, 'settings.public.theme.palette')){
//     theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
//   }

//   const muiTheme = createTheme({
//     typography: {
//       useNextVariants: true,
//     },
//     palette: {
//       primary: {
//         main: theme.primaryColor,
//         contrastText: theme.primaryText
//       },
//       secondary: {
//         main: theme.secondaryColor,
//         contrastText: theme.errorText
//       },
//       appBar: {
//         main: theme.appBarColor,
//         contrastText: theme.appBarTextColor
//       },
//       cards: {
//         main: theme.cardColor,
//         contrastText: theme.cardTextColor
//       },
//       paper: {
//         main: theme.paperColor,
//         contrastText: theme.paperTextColor
//       },
//       error: {
//         main: theme.errorColor,
//         contrastText: theme.secondaryText
//       },
//       background: {
//         default: theme.backgroundCanvas
//       },
//       contrastThreshold: 3,
//       tonalOffset: 0.2
//     }
//   });


// // //============================================================================

// Session.setDefault('dataManagementTabIndex', 0)
// Session.setDefault('dataManagementModalityTabIndex', 0)


// export class DataImportPageOriginal extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       importValue: 'importTab',
//       exportValue: 'exportTab',
//       encryptExport: false
//     };
//   }

//   getMeteorData() {
//     let data = {
//       style: {
//         opacity: Session.get('globalOpacity'),
//         tab: {
//           borderBottom: '1px solid lightgray',
//           borderRight: 'none'
//         }
//       },
//       dialog: {
//         open: Session.get('open')
//       },      
//       user: {
//         isAdmin: false
//       },
//       title: "Client Collections",
//       upstreamSync: false,
//       encryptExport: this.state.encryptExport,
//       import: {
//         fileExtension: Session.get('fileExtension'),
//         // height: (Session.get('appHeight') - 540 ) + 'px',
//         height: (Session.get('appHeight') - 556 ) + 'px',  //565
//         data: ''
//       },
//       dataManagement: {
//         height: (Session.get('appHeight') - 300 ) + 'px'
//       },
//       export: {
//         height: (Session.get('appHeight') - 380 ) + 'px',
//         data: ''
//       },
//       syncSourceItem: Session.get('syncSourceItem'),
//       toggleStates: Session.get('toggleStates'),
//       tabIndex: Session.get('dataManagementTabIndex'),
//       modalityTabIndex: Session.get('dataManagementModalityTabIndex')
//     };

//     if(get(Meteor, 'settings.public.meshNetwork.upstreamSync')){
//       // console.log('Meteor.settings.public.meshNetwork.upstreamSync');
//       data.upstreamSync = get(Meteor, 'settings.public.meshNetwork.upstreamSync');
//     }

//     if(['xml', 'json', 'ccd', 'bundle'].includes(Session.get('fileExtension'))){
//       data.import.data = JSON.stringify(Session.get('dataContent'), null, 2);
//     }
//     if(['fhir'].includes(Session.get('fileExtension'))){
//       data.import.data = Session.get('dataContent');
//     }

//     let user = Meteor.user();
//     if(user){
//       if (user.roles) {
//         user.roles.forEach(function(role){
//           if (role === "sysadmin") {
//             data.user.isAdmin = true;
//           } else if (role === "practitioner") {
//             data.user.isPractitioner = true;
//           } else if (role === "patient") {
//             data.user.isPatient = true;
//           }
//         });
//       }
//     }

//     if(Session.get('continuityOfCareDoc')){
//       data.export.data = JSON.stringify(Session.get('continuityOfCareDoc'), null, 2);
//     }

//     // console.log('Navigated to DataImportPage', data);
//     return data;
//   }
   
//   changeInput(variable, event, value){
//     Session.set(variable, value);
//   }  

//   clearLocalCache(){
//     if(confirm("Are you absolutely sure?")){

//       var resourceTypes = [
//         'AllergyIntolerances',
//         'CarePlans',
//         'Conditions',
//         'Consents',
//         'Contracts',
//         'Communications',
//         'ClinicalImpressions',
//         'Devices',
//         'DiagnosticReports',
//         'Goals',
//         'Immunizations',
//         'ImagingStudies',
//         'Locations',
//         'Medications',
//         'MedicationOrders',
//         'MedicationStatements',
//         'Organizations',
//         'Observations',
//         'Patients',
//         'Practitioners',
//         'Persons',
//         'Procedures',
//         'Questionnaires',
//         'QuestionnaireResponses',
//         'RiskAssessments',
//         'RelatedPersons',
//         'Sequences',
//         'ServiceRequests'
//       ];

//       resourceTypes.forEach(function(resourceType){
//         if(Mongo.Collection.get(resourceType)){
//           Mongo.Collection.get(resourceType).find().forEach(function(record){
//             Mongo.Collection.get(resourceType).remove({_id: record._id})
//             Mongo.Collection.get(resourceType)._collection.remove({_id: record._id})
//           })
//         }
//       })

//       Meteor.call('getServerStats', function(error, result){
//         if(result){
//           Session.set('datalakeStats', result);
//         }
//       });
//     }
//   }
//   clearExportBuffer(){
//     Session.set('continuityOfCareDoc', null);
//   }
//   downloadContinuityOfCareDoc(){
//     console.log('downloadContinuityOfCareDoc')
//     var continuityOfCareDoc = Session.get('continuityOfCareDoc');
//     var jsonFile;

//     if(this.state.encryptExport){
//       // https://atmospherejs.com/jparker/crypto-aes
//       // jsonFile = CryptoJS.AES.encrypt(JSON.stringify(continuityOfCareDoc), Meteor.userId());
//     } else {
//       jsonFile = JSON.stringify(continuityOfCareDoc, null, 2);
//     }

//     if(['iPhone'].includes(window.navigator.platform)){
//       // copy to clipboard
//       console.log('running on iphone...')
//       var exportBuffer = document.getElementById("exportBuffer");
//       console.log('exportBuffer', exportBuffer)

//       exportBuffer.focus();
//       exportBuffer.select();
      
//       document.execCommand('Copy');

//     } else {

//       var blob = new Blob([jsonFile], { type: 'application/json;charset=utf-8;' })

//       var url = URL.createObjectURL(blob);

//       var filename = 'continuity-of-care.ccd.json';
//       if(this.state.encryptExport){
//         filename = 'continuity-of-care.ccd.fhir';
//       } 
      
//       // desktop 
//       //var dataString = 'data:text/csv;charset=utf-8,' + encodeURIComponent(JSON.stringify(continuityOfCareDoc, null, 2));  

//       var patientName = Meteor.user().displayName();
//       console.log('Generating CCD for ', patientName)

//       var downloadAnchorElement = document.getElementById('downloadAnchorElement');
//       if(downloadAnchorElement){

//         downloadAnchorElement.setAttribute("href", url);
//         downloadAnchorElement.setAttribute("download", filename);
//         downloadAnchorElement.style.visibility = 'hidden';
//         document.body.appendChild(downloadAnchorElement);
//         downloadAnchorElement.click();
//         document.body.removeChild(downloadAnchorElement);

//         // downloadAnchorElement.setAttribute("href", dataString );
  
    
//         // downloadAnchorElement.setAttribute("download", "continuity-of-care.fhir.ccd");
//         // downloadAnchorElement.click();
//         // // window.open('data:text/csv;charset=utf-8,' + escape(continuityOfCareDoc), '_self');    
//       } else {
//         console.log('Couldnt find anchor element.')
//       }  
//     }

//   }
//   exportContinuityOfCareDoc(){
//     console.log('Exporting a Continuity Of Care Document');

//     let toggleStates = Session.get('toggleStates');

//     let fhirEntries = [];
//     let continuityOfCareDoc = {
//       resourceType: "Bundle",
//       entry: []
//     }

//     let newComposition = {
//       fullUrl: "/Composition/" + Random.id(),
//       resource: {
//         "resourceType": "Composition",
//         "identifier" : {}, 
//         "status" : "preliminary", 
//         "type" : {}, 
//         "class" : {}, 
//         "subject" : { 
//           "display": Meteor.user().fullName(),
//           "reference": Meteor.userId()  
//         }, 
//         "encounter" : { 
//           "display": '',
//           "reference": ''
//          }, 
//         "date" : "<dateTime>", 
//         "author" : [{ 
//           "display": Meteor.user().fullName(),
//           "reference": Meteor.userId()  
//         }], 
//         "title" : "Continuity of Care Document", 
//         "confidentiality" : "0", 
//         "attester" : [],
//         "custodian" : { 
//           "display": '',
//           "reference": ''
//         }, 
//         "relatesTo" : [],
//         "event" : [],
//         "section" : []
//       }
//     };


//     if((typeof AllergyIntolerances === "object") && toggleStates.allergies){
//       console.log('AllergyIntolerances is an object; and toggles set')
//       AllergyIntolerances.find().forEach(function(allergy){
//         delete allergy._document;
//         fhirEntries.push({
//           fullUrl: "/AllergyIntolerance/" + allergy._id,
//           resource: allergy
//         })
//         newComposition.resource.section.push({
//           entry: [{
//             reference: "/AllergyIntolerance/" + allergy._id
//           }]
//         })
//       })
//     }
//     if((typeof CarePlans === "object") && toggleStates.careplans){
//       CarePlans.find().forEach(function(careplan){
//         delete careplan._document;
//         fhirEntries.push({
//           fullUrl: "/CarePlan/" + careplan._id,
//           resource: careplan
//         })
//         newComposition.resource.section.push({
//           reference: "/CarePlan/" + careplan._id
//         })
//       })
//     }
//     if((typeof Conditions === "object") && toggleStates.conditions){
//       Conditions.find().forEach(function(condition){
//         delete condition._document;
//         fhirEntries.push({
//           fullUrl: "/Condition/" + condition._id,
//           resource: condition
//         })
//         newComposition.resource.section.push({
//           reference: "/Condition/" + condition._id
//         })
//       })
//     }
//     if((typeof Consents === "object") && toggleStates.consents){
//       Consents.find().forEach(function(consent){
//         delete consent._document;
//         fhirEntries.push({
//           fullUrl: "/Consent/" + consent._id,
//           resource: consent
//         })
//         newComposition.resource.section.push({
//           reference: "/Consent/" + consent._id
//         })
//       })
//     }    
//     if((typeof Contracts === "object") && toggleStates.contracts){
//       Contracts.find().forEach(function(contract){
//         delete contract._document;
//         fhirEntries.push({
//           fullUrl: "/Contract/" + contract._id,
//           resource: contract
//         })
//         newComposition.resource.section.push({
//           reference: "/Contract/" + contract._id
//         })
//       })
//     }
//     if((typeof Communications === "object") && toggleStates.communications){
//       Communications.find().forEach(function(communication){
//         delete communication._document;
//         fhirEntries.push({
//           fullUrl: "/Communication/" + communication._id,
//           resource: communication
//         })
//         newComposition.resource.section.push({
//           reference: "/Communication/" + communication._id
//         })
//       })
//     }
//     if((typeof Devices === "object") && toggleStates.devices){
//       Devices.find().forEach(function(device){
//         delete device._document;
//         fhirEntries.push({
//           fullUrl: "/Device/" + device._id,
//           resource: device
//         })
//         newComposition.resource.section.push({
//           reference: "/Device/" + device._id
//         })
//       })
//     }
//     if((typeof Goals === "object") && toggleStates.goals){
//       Goals.find().forEach(function(goal){
//         delete goal._document;
//         fhirEntries.push({
//           fullUrl: "/Goal/" + goal._id,
//           resource: goal
//         })
//         newComposition.resource.section.push({
//           reference: "/Goal/" + goal._id
//         })
//       })
//     }
//     if((typeof Immunizations === "object") && toggleStates.immunizations){
//       Immunizations.find().forEach(function(immunization){
//         delete immunization._document;
//         fhirEntries.push({
//           fullUrl: "/Immunization/" + immunization._id,
//           resource: immunization
//         })
//         newComposition.resource.section.push({
//           reference: "/Immunization/" + immunization._id
//         })
//       })
//     }
//     if((typeof ImagingStudies === "object") && toggleStates.imagingStudies){
//       ImagingStudies.find().forEach(function(imagingStudy){
//         delete imagingStudy._document;
//         fhirEntries.push({
//           fullUrl: "/ImagingStudies/" + imagingStudy._id,
//           resource: imagingStudy
//         })
//         newComposition.resource.section.push({
//           reference: "/ImagingStudies/" + imagingStudy._id
//         })
//       })
//     }
//     if((typeof Locations === "object") && toggleStates.locations){
//       Locations.find().forEach(function(location){
//         delete location._document;
//         fhirEntries.push({
//           fullUrl: "/Location/" + location._id,
//           resource: location
//         })
//         newComposition.resource.section.push({
//           reference: "/Location/" + location._id
//         })
//       })
//     }
//     if((typeof Medications === "object") && toggleStates.medications){
//       Medications.find().forEach(function(medication){
//         delete medication._document;
//         fhirEntries.push({
//           fullUrl: "/Medication/" + medication._id,
//           resource: medication
//         })
//         newComposition.resource.section.push({
//           reference: "/Medication/" + medication._id
//         })
//       })
//     }
//     if((typeof MedicationOrders === "object") && toggleStates.medicationOrders){
//       MedicationOrders.find().forEach(function(medicationOrder){
//         delete medicationOrder._document;
//         fhirEntries.push({
//           fullUrl: "/MedicationOrder/" + medicationOrder._id,
//           resource: medicationOrder
//         })
//         newComposition.resource.section.push({
//           reference: "/MedicationOrder/" + medicationOrder._id
//         })
//       })
//     }
//     if((typeof MedicationStatements === "object") && toggleStates.medicationStatements){
//       MedicationStatements.find().forEach(function(medicationStatement){
//         delete medicationStatement._document;
//         fhirEntries.push({
//           fullUrl: "/MedicationStatement/" + medicationStatement._id,
//           resource: medicationStatement
//         })
//         newComposition.resource.section.push({
//           reference: "/MedicationStatement/" + medicationStatement._id
//         })
//       })
//     }
//     if((typeof Observations === "object") && toggleStates.observations){
//       Observations.find().forEach(function(observation){
//         delete observation._document;
//         fhirEntries.push({
//           fullUrl: "/Observation/" + observation._id,
//           resource: observation
//         })
//         newComposition.resource.section.push({
//           reference: "/Observation/" + observation._id
//         })
//       })
//     }
//     if((typeof Organizations === "object") && toggleStates.organizations){
//       Organizations.find().forEach(function(organization){
//         delete organization._document;
//         fhirEntries.push({
//           fullUrl: "/Organization/" + organization._id,
//           resource: organization
//         })
//         newComposition.resource.section.push({
//           reference: "/Organization/" + organization._id
//         })
//       })
//     }
//     if((typeof Patients === "object") && toggleStates.patients){
//       Patients.find().forEach(function(patient){
//         delete patient._document;
//         fhirEntries.push({
//           fullUrl: "/Patient/" + patient._id,
//           resource: patient
//         })
//         newComposition.resource.section.push({
//           reference: "/Patient/" + patient._id
//         })
//       })
//     }
//     if((typeof Persons === "object") && toggleStates.persons){
//       Persons.find().forEach(function(person){
//         delete person._document;
//         fhirEntries.push({
//           fullUrl: "/Person/" + person._id,
//           resource: person
//         })
//         newComposition.resource.section.push({
//           reference: "/Person/" + person._id
//         })
//       })
//     }
//     if((typeof Practitioners === "object") && toggleStates.practitioners){
//       Practitioners.find().forEach(function(practitioner){
//         delete practitioner._document;
//         fhirEntries.push({
//           fullUrl: "/Practitioner/" + practitioner._id,
//           resource: practitioner
//         })
//         newComposition.resource.section.push({
//           reference: "/Practitioner/" + practitioner._id
//         })
//       })
//     }
//     if((typeof Procedures === "object") && toggleStates.procedures){
//       Procedures.find().forEach(function(procedure){
//         delete procedure._document;
//         fhirEntries.push({
//           fullUrl: "/Procedure/" + procedure._id,
//           resource: procedure
//         })
//         newComposition.resource.section.push({
//           reference: "/Procedure/" + procedure._id
//         })
//       })
//     }
//     if((typeof RiskAssessments === "object") && toggleStates.riskAssessments){
//       RiskAssessments.find().forEach(function(riskAssessment){
//         delete riskAssessment._document;
//         fhirEntries.push({
//           fullUrl: "/RiskAssessment/" + riskAssessment._id,
//           resource: riskAssessment
//         })
//         newComposition.resource.section.push({
//           reference: "/RiskAssessment/" + riskAssessment._id
//         })
//       })
//     }
//     if((typeof Sequences === "object") && toggleStates.sequences){
//       Sequences.find().forEach(function(sequence){
//         delete sequence._document;
//         fhirEntries.push({
//           fullUrl: "/Sequence/" + sequence._id,
//           resource: sequence
//         })
//         newComposition.resource.section.push({
//           reference: "/Sequence/" + sequence._id
//         })
//       })
//     }
//     if((typeof ServiceRequests === "object") && toggleStates.serviceRequests){
//       ServiceRequests.find().forEach(function(serviceRequest){
//         delete serviceRequest._document;
//         fhirEntries.push({
//           fullUrl: "/ServiceRequest/" + serviceRequest._id,
//           resource: serviceRequest
//         })
//         newComposition.resource.section.push({
//           reference: "/ServiceRequest/" + serviceRequest._id
//         })
//       })
//     }


//     continuityOfCareDoc.entry.push(newComposition);

//     fhirEntries.forEach(function(fhirResource){
//       continuityOfCareDoc.entry.push(fhirResource);
//     })

//     Session.set('continuityOfCareDoc', continuityOfCareDoc)
//   }
//   handleChangeSyncSource(event, index, value){
//     console.log('handleChangeSyncSource', event, index, value)
//     Session.set('syncSourceItem', value)
//   }

//   handleChange = (value) => {
//     this.setState({
//       value: value,
//     });
//   }
//   handleImportChange = (value) => {
//     this.setState({
//       importValue: value
//     });
//   }
//   handleExportChange = (value) => {
//     this.setState({
//       exportValue: value
//     });
//   }
//   handleTextareaUpdate(){

//   }
//   toggleEncryptExport(){
//     this.setState({encryptExport: !this.state.encryptExport})
//   }
//   render(){
//     var downloadLabel = 'Download!';

//     const {children, ...otherProps } = this.props;

//     if(['iPhone'].includes(window.navigator.platform)){
//       downloadLabel = 'Copy to Clipboard'
//     }

//     var inputCardLayout = 3;
//     var processingCardLayout = 6;
//     var outputCardLayout = 3;

//     if(window.innerHeight > window.innerWidth){
//       inputCardLayout = 12;
//       processingCardLayout = 12;
//       outputCardLayout = 12;
//     }

//     var autoheight = 'auto';

//     // if(['iPad'].includes(window.navigator.platform)){
//     //   autoheight = 'auto'
//     // }

//     let headerHeight = 84;
//     if(get(Meteor, 'settings.public.defaults.prominantHeader', false)){
//       headerHeight = 128;
//     }
    
//     return(
//       <MuiThemeProvider theme={muiTheme} >
//         <div id="DataImportPage" style={{paddingLeft: '100px', paddingRight: '100px'}} headerHeight={headerHeight} >
//             <Grid id='dataImportGrid' container spacing={8}>
//               <Grid item md={4}>
//                 <ImportComponent theme={muiTheme} {...otherProps} />
//               </Grid>
//               <Grid item md={4}>
//                 Bar
//                 {/* <Card style={{height: window.innerHeight - 250, marginBottom: '20px'}}>
//                   <CardHeader
//                     title="Data Management"
//                   />                  
//                   <CardContent>
//                     <Grid item xs={12}>
//                       <CollectionManagement 
//                         toggleStates={ this.data.toggleStates }
//                         style={{
//                           height: this.data.dataManagement.height,
//                           overflow: 'scroll',
//                           width: '100%'
//                       }} />

//                     </Grid>
//                   </CardContent>
//                 </Card> */}
//               </Grid>
//               <Grid item md={4}>
//                 Baz
//                 {/* <ExportComponent /> */}
//               </Grid>            
//             </Grid>           
//         </div>
//       </MuiThemeProvider>        
//     );
//   }

//   callMethod(signature){
//     console.log("callMethod", signature);

//     Meteor.call(signature);
//   }
// }


// // ============================================================================================================
// // REACT TAB CONTAINER

// function TabContainer(props) {
//   return (
//     <Typography component="div">
//       {props.children}
//     </Typography>
//   );
// }

// TabContainer.propTypes = {
//   children: PropTypes.node.isRequired
// };


// // ============================================================================================================
// // REACT FUNCTIONAL COMPONENT

// export function DataManagementPage(props){
//   logger.info('Rendering the DataManagementPage');
//   logger.verbose('symptomatic:continuity-of-care.client.DataManagementPage');
//   logger.data('DataManagementPage.props', {data: props}, {source: "DataManagementPage.jsx"});


//   const { children, ...otherProps } = props;

//   let [tabIndex, setTabIndex] = useState(0);
//   let [modalityTabIndex, setModalityTabIndex] = useState(0);

//   function handleTabChange(event, newTabIndex){
//     // console.log('handleTabChange', newTabIndex)
//     setTabIndex(newTabIndex);
//   }

//   let headerHeight = 64;
//   if(get(Meteor, 'settings.public.defaults.prominantHeader', false)){
//     headerHeight = 128;
//   }
  
//   return(
//       <div id="DataManagementPage" paddingLeft={20} paddingRight={20} headerHeight={headerHeight} >
//         <MuiThemeProvider theme={muiTheme} >
//           <Grid id='dataImportGrid' container spacing={8}>
//             <Grid item md={12}>
//                 <Card margin={20} theme={props.theme} >
//                   <Tabs
//                     value={tabIndex}
//                     onChange={handleTabChange}
//                   >
//                     <Tab label="Import" value={0} />
//                     <Tab label="Export" value={1} />            
//                     {/* <Tab label="Editor" value={2} />             */}
//                     {/* <Tab label="Export" value={4} />             */}
//                   </Tabs>     
//                   {tabIndex === 0 && <TabContainer>
//                     <CardContent>
//                       <ImportComponent />
//                     </CardContent>
//                   </TabContainer>}  
//                   {tabIndex === 2 && <TabContainer>
//                     <CardContent>
//                       <ExportComponent />
//                     </CardContent>
//                   </TabContainer>}  
//                   {tabIndex === 3 && <TabContainer>
//                     <CardContent>
//                       {/* <BundleParser /> */}
//                     </CardContent>
//                   </TabContainer>}   
//                   {tabIndex === 4 && <TabContainer>
//                     <CardContent>
//                       <Grid item xs={12}>
//                         <CollectionManagement />
//                       </Grid>
//                     </CardContent>
//                   </TabContainer>}  
//                   {tabIndex === 5 && <TabContainer>
//                     <CardContent>
//                       <JsonEditorComponent />
//                     </CardContent>
//                   </TabContainer>}  
//                   {tabIndex === 6 && <TabContainer>
//                     <CardContent>
//                       <ExportComponent />
//                     </CardContent>
//                   </TabContainer>}                              
//                 </Card>
//             </Grid>
//           </Grid>           
//         </MuiThemeProvider>        
//       </div>
//   );
// }

// export default DataManagementPage;  