// // /packages/pacio-core/client/pages/MedicationsPage.jsx

// import React from 'react';
// import { 
//   Typography, 
//   Box,
//   Card,
//   CardContent,
//   Button,
//   Grid
// } from '@mui/material';
// import AddIcon from '@mui/icons-material/Add';
// import { useTracker } from 'meteor/react-meteor-data';
// import { Meteor } from 'meteor/meteor';
// import { Session } from 'meteor/session';
// import { get } from 'lodash';

// export function MedicationsPage() {
//   let data = {
//     medications: [],
//     selectedPatientId: '',
//     loading: false
//   };
  
//   // Get selected patient from session
//   data.selectedPatientId = useTracker(function() {
//     return Session.get('selectedPatientId') || '';
//   }, []);
  
//   const trackerData = useTracker(function() {
//     // Access Medications collection from Meteor.Collections
//     const Medications = get(Meteor, 'Collections.Medications');
//     if (!Medications) {
//       console.log('Medications collection not found');
//       return { medications: [], loading: false };
//     }
    
//     let subscription = null;
//     let isLoading = false;
    
//     try {
//       subscription = Meteor.subscribe('medications');
//       isLoading = !subscription.ready();
//     } catch (error) {
//       console.log('Error subscribing to medications:', error);
//       isLoading = false;
//     }
    
//     let query = {};
//     if (data.selectedPatientId) {
//       query['subject.reference'] = `Patient/${data.selectedPatientId}`;
//     }
    
//     let medicationsList = [];
//     try {
//       medicationsList = Medications.find(query, { sort: { _id: -1 } }).fetch();
//     } catch (error) {
//       console.log('Error fetching medications:', error);
//       medicationsList = [];
//     }
    
//     return {
//       medications: medicationsList || [],
//       loading: isLoading
//     };
//   }, [data.selectedPatientId]);
  
//   data.medications = trackerData.medications;
//   data.loading = trackerData.loading;

//   function handleAddMedication() {
//     Session.set('mainAppDialogJson', {
//       title: 'Add Medication',
//       message: 'Add medication functionality coming soon'
//     });
//   }

//   function renderHeader() {
//     return (
//       <Box mb={2}>
//         <Grid container spacing={2} alignItems="center" justifyContent="space-between">
//           <Grid item xs={12} sm={6}>
//             <Typography variant="h4">
//               Medications
//             </Typography>
//             <Typography variant="subtitle2" color="textSecondary">
//               {data.medications.length} medications found
//               {data.selectedPatientId && ' for selected patient'}
//             </Typography>
//           </Grid>
//           <Grid item>
//             <Button
//               variant="contained"
//               color="primary"
//               startIcon={<AddIcon />}
//               onClick={handleAddMedication}
//             >
//               Add Medication
//             </Button>
//           </Grid>
//         </Grid>
//       </Box>
//     );
//   }

//   let layoutContent;
//   if (data.loading) {
//     layoutContent = (
//       <Box 
//         sx={{
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',
//           justifyContent: 'center',
//           minHeight: '50vh',
//           textAlign: 'center'
//         }}
//       >
//         <Card 
//           sx={{ 
//             maxWidth: '600px',
//             width: '100%',
//             borderRadius: 3,
//             boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
//             border: '1px solid',
//             borderColor: 'divider',
//             backgroundColor: 'background.paper'
//           }}
//         >
//           <Box p={3} textAlign="center">
//             <Typography>Loading medications...</Typography>
//           </Box>
//         </Card>
//       </Box>
//     );
//   } else if (!data.medications || data.medications.length === 0) {
//     layoutContent = (
//       <Box 
//         sx={{
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',
//           justifyContent: 'center',
//           minHeight: '50vh',
//           textAlign: 'center'
//         }}
//       >
//         <Card 
//           sx={{ 
//             maxWidth: '600px',
//             width: '100%',
//             borderRadius: 3,
//             boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
//             border: '1px solid',
//             borderColor: 'divider',
//             backgroundColor: 'background.paper'
//           }}
//         >
//           <CardContent sx={{ p: 6 }}>
//             <Box sx={{ mb: 3 }}>
//               <Typography 
//                 variant="h5" 
//                 sx={{ 
//                   fontWeight: 500,
//                   color: 'text.primary',
//                   mb: 2
//                 }}
//               >
//                 {get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")}
//               </Typography>
//               <Typography 
//                 variant="body1" 
//                 sx={{ 
//                   color: 'text.secondary',
//                   lineHeight: 1.7,
//                   maxWidth: '480px',
//                   mx: 'auto'
//                 }}
//               >
//                 {get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found in the client data cursor. To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries. If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.")}
//               </Typography>
//             </Box>
//             <Button
//               variant="outlined"
//               startIcon={<AddIcon />}
//               onClick={handleAddMedication}
//               sx={{
//                 borderRadius: 2,
//                 textTransform: 'none',
//                 px: 3,
//                 py: 1,
//                 borderWidth: 2,
//                 '&:hover': {
//                   borderWidth: 2
//                 }
//               }}
//             >
//               Add Your First Medication
//             </Button>
//           </CardContent>
//         </Card>
//       </Box>
//     );
//   } else {
//     // Since MedicationsTable doesn't exist, show a simple list
//     layoutContent = (
//       <Card 
//         sx={{ 
//           width: '100%',
//           borderRadius: 3,
//           boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
//           border: '1px solid',
//           borderColor: 'divider'
//         }}
//       >
//         <CardContent>
//           <Typography variant="h6" gutterBottom>
//             Medications List
//           </Typography>
//           <Typography variant="body2" color="textSecondary">
//             The medications table component is not yet implemented. 
//             {data.medications.length > 0 && ` Found ${data.medications.length} medications.`}
//           </Typography>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Box 
//       id="medicationsPage" 
//       sx={{
//         minHeight: '100vh',
//         backgroundColor: 'background.default',
//         px: { xs: 2, sm: 3, md: 4 },
//         py: { xs: 3, sm: 4, md: 5 }
//       }}
//     >
//       <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
//         { (!data.loading && data.medications.length > 0) && renderHeader() }
//         { layoutContent }
//       </Box>
//     </Box>
//   );
// }