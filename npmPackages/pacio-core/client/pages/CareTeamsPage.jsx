// // /packages/pacio-core/client/pages/CareTeamsPage.jsx

// import React from 'react';
// import { 
//   Typography, 
//   Box,
//   Card,
//   CardContent,
//   Button,
//   Grid
// } from '@mui/material';
// import { Groups as GroupsIcon } from '@mui/icons-material';
// import AddIcon from '@mui/icons-material/Add';
// import { useTracker } from 'meteor/react-meteor-data';
// import { Meteor } from 'meteor/meteor';
// import { Session } from 'meteor/session';
// import { get } from 'lodash';

// export function CareTeamsPage() {
//   let data = {
//     careTeams: [],
//     selectedPatientId: '',
//     loading: false
//   };
  
//   // Get selected patient from session
//   data.selectedPatientId = useTracker(function() {
//     return Session.get('selectedPatientId') || '';
//   }, []);
  
//   const trackerData = useTracker(function() {
//     // Access CareTeams collection from Meteor.Collections
//     const CareTeams = get(Meteor, 'Collections.CareTeams');
//     if (!CareTeams) {
//       console.log('CareTeams collection not found');
//       return { careTeams: [], loading: false };
//     }
    
//     let subscription = null;
//     let isLoading = false;
    
//     try {
//       subscription = Meteor.subscribe('careTeams');
//       isLoading = !subscription.ready();
//     } catch (error) {
//       console.log('Error subscribing to careTeams:', error);
//       isLoading = false;
//     }
    
//     let query = {};
//     if (data.selectedPatientId) {
//       query['subject.reference'] = `Patient/${data.selectedPatientId}`;
//     }
    
//     let careTeamsList = [];
//     try {
//       careTeamsList = CareTeams.find(query, { sort: { _id: -1 } }).fetch();
//     } catch (error) {
//       console.log('Error fetching care teams:', error);
//       careTeamsList = [];
//     }
    
//     return {
//       careTeams: careTeamsList || [],
//       loading: isLoading
//     };
//   }, [data.selectedPatientId]);
  
//   data.careTeams = trackerData.careTeams;
//   data.loading = trackerData.loading;

//   function handleAddCareTeam() {
//     Session.set('mainAppDialogJson', {
//       title: 'Add Care Team',
//       message: 'Add care team functionality coming soon'
//     });
//   }

//   function renderHeader() {
//     return (
//       <Box mb={2}>
//         <Grid container spacing={2} alignItems="center" justifyContent="space-between">
//           <Grid item xs={12} sm={6}>
//             <Typography variant="h4">
//               Care Teams
//             </Typography>
//             <Typography variant="subtitle2" color="textSecondary">
//               {data.careTeams.length} care teams found
//               {data.selectedPatientId && ' for selected patient'}
//             </Typography>
//           </Grid>
//           <Grid item>
//             <Button
//               variant="contained"
//               color="primary"
//               startIcon={<GroupsIcon />}
//               onClick={handleAddCareTeam}
//             >
//               Add Care Team
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
//             <Typography>Loading care teams...</Typography>
//           </Box>
//         </Card>
//       </Box>
//     );
//   } else if (!data.careTeams || data.careTeams.length === 0) {
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
//               onClick={handleAddCareTeam}
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
//               Add Your First Care Team
//             </Button>
//           </CardContent>
//         </Card>
//       </Box>
//     );
//   } else {
//     // Get CareTeamsTable from Meteor.Tables
//     const CareTeamsTable = get(Meteor, 'Tables.CareTeamsTable');
//     if (!CareTeamsTable) {
//       layoutContent = (
//         <Card 
//           sx={{ 
//             width: '100%',
//             borderRadius: 3,
//             boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
//             border: '1px solid',
//             borderColor: 'divider'
//           }}
//         >
//           <Box p={3}>
//             <Typography>CareTeamsTable component not available</Typography>
//           </Box>
//         </Card>
//       );
//     } else {
//       layoutContent = (
//         <Card 
//           sx={{ 
//             width: '100%',
//             borderRadius: 3,
//             boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
//             border: '1px solid',
//             borderColor: 'divider',
//             overflow: 'hidden'
//           }}
//         >
//           <CardContent sx={{ p: 0 }}>
//             <CareTeamsTable
//               careTeams={data.careTeams}
//               onRowClick={(id) => console.log('Care team clicked:', id)}
//               showStatus={true}
//               showCategory={true}
//               tableRowSize="medium"
//             />
//           </CardContent>
//         </Card>
//       );
//     }
//   }

//   return (
//     <Box 
//       id="careTeamsPage" 
//       sx={{
//         minHeight: '100vh',
//         backgroundColor: 'background.default',
//         px: { xs: 2, sm: 3, md: 4 },
//         py: { xs: 3, sm: 4, md: 5 }
//       }}
//     >
//       <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
//         { (!data.loading && data.careTeams.length > 0) && renderHeader() }
//         { layoutContent }
//       </Box>
//     </Box>
//   );
// }