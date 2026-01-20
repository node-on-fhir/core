// import { 
//   Card,
//   CardHeader,
//   CardContent,
//   Tab, 
//   Tabs,
//   Typography,
//   Box
// } from '@mui/material';

// import { Meteor } from 'meteor/meteor';
// import { Session } from 'meteor/session';

// import { get } from 'lodash';

// import React  from 'react';
// import { useTracker } from 'meteor/react-meteor-data';

// import { ConditionsTable } from 'meteor/clinical:hl7-fhir-data-infrastructure';
// import { GoalsTable } from 'meteor/clinical:hl7-fhir-data-infrastructure';
// import { MedicationsTable } from 'meteor/clinical:hl7-fhir-data-infrastructure';

// export class CarePlanDetailPage extends React.Component {
//   getMeteorData() {
//     let data = {
//       style: {
//         opacity: Session.get('globalOpacity'),
//         tab: {
//           borderBottom: '1px solid lightgray',
//           borderRight: 'none'
//         }
//       },
//       tabIndex: Session.get('carePlanPageTabIndex'),
//       carePlanSearchFilter: Session.get('carePlanSearchFilter'),
//       currentCarePlan: Session.get('selectedCarePlan')
//     };

//     if(this.props.params.id){
//       data.currentCarePlan = CarePlans.findOne({_id: this.props.params.id});
//     }

//     // data.style = Glass.blur(data.style);
//     // data.style.appbar = Glass.darkroom(data.style.appbar);
//     // data.style.tab = Glass.darkroom(data.style.tab);

//     console.log('CarePlanDetailPage.data', data)
//     // console.log('CarePlanDetailPage.props', this.props)

//     return data;
//   }

//   render() {
//     if(process.env.NODE_ENV === "test") console.log('In CarePlanDetailPage render');
//     return (
//       <div id='carePlanDetailPage'>
//         <div>

//           <Card >
//             <CardHeader title='Conditions Addressed' />
//             <CardContent>
//               <ConditionsTable
//                 hideCheckboxes={true}
//                 hideIdentifier={true}
//                 hidePatientName={true}
//                 hideAsserterName={true}
//               />
//               {/* <ConditionsTable conditions={get(this, 'data.currentCarePlan.addresses')} /> */}
//             </CardContent>
//           </Card>
//           <br />

//           <Card >
//             <CardHeader title='Goals' />
//             <CardContent>
//               <GoalsTable 
//                 hideIdentifier={true}
//                 hideCheckboxes={true}
//               />
//             </CardContent>
//           </Card>
//           <br />

//           <Card >
//             <CardHeader title='Medications' />
//             <CardContent>
//               <MedicationsTable />
//             </CardContent>
//           </Card>
//           <br />
//         </div>
//       </div>
//     );
//   }
// }


// export default CarePlanDetailPage;