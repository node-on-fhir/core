// /**
//  * Copyright © 2015-2016 Symptomatic, LLC. All rights reserved.
//  *
//  * This source code is licensed under the MIT license found in the
//  * LICENSE.txt file in the root directory of this source tree.
//  */

// import React from 'react';
// import PropTypes from 'prop-types';

// import { 
//   Card,
//   CardHeader,
//   CardContent,
//   CardMedia,
//   Typography
// } from '@mui/material';

// import _ from 'lodash';
// let get = _.get;
// let set = _.set;

// import moment from 'moment';

// import { makeStyles, useTheme } from '@material-ui/styles';

// const useStyles = makeStyles(theme => ({
//   card: {
//     display: 'flex',
//   },
//   details: {
//     display: 'flex',
//     flexDirection: 'column',
//   },
//   content: {
//     flex: '1 0 auto',
//   },
//   cover: {
//     width: 151,
//   },
//   controls: {
//     display: 'flex',
//     alignItems: 'center',
//     paddingLeft: theme.spacing(1),
//     paddingBottom: theme.spacing(1),
//   },
//   playIcon: {
//     height: 38,
//     width: 38,
//   },
// }));


// function PatientCard(props){

//   console.log('PatientCard v0.7.22')

//   let { 
//     identifier, 
//     active, 
//     familyName, 
//     givenName, 
//     fullName, 
//     email, 
//     birthDate, 
//     gender, 
//     avatar, 
//     patient, 
//     zDepth, 
//     overflowY, 
//     ...otherProps 
//   } = props;

//   // fullName = get(props, 'patient.name[0].text', '');
//   // familyName = get(props, 'patient.name[0].family[0]', '');        
//   // givenName = get(props, 'patient.name[0].given[0]', '');
//   // email = get(props, 'patient.contact[0].value', '');
//   // birthdate = get(props, 'patient.birthDate', '');
//   // gender = get(props, 'patient.gender', '');
//   // avatar = get(props, 'patient.photo[0].url', '');
//   // identifier = get(props, 'patient.identifier[0].value', '');

//   if(patient){
//     fullName = get(patient, 'name[0].text', '');

//     if(Array.isArray(get(patient, 'name[0].family'))){
//       familyName = get(patient, 'name[0].family[0]', '');        
//     } else {
//       familyName = get(patient, 'name[0].family', '');        
//     }

//     givenName = get(patient, 'name[0].given[0]', '');

//     email = get(patient, 'contact[0].value', '');
//     birthDate = get(patient, 'birthDate', '');
//     gender = get(patient, 'gender', '');
//     avatar = get(patient, 'photo[0].url', '');
//     identifier = get(patient, 'identifier[0].value', '');
//   } 

//   const classes = useStyles();
//   const theme = useTheme();

//   let cardMedia;
//   if(avatar){
//     cardMedia = <CardMedia
//       className={classes.cover}
//       image={avatar}
//     />
//   }

//   return(
//   <div className='patientCard'>
//     <Card {...otherProps} >
//       <CardHeader title={fullName} />
//       <div className={classes.details}>
//         <CardContent className={classes.content}>
//           <Typography color="textSecondary">
//             MRN: { identifier } DOB:  { moment(birthDate).format("MMM DD, YYYY") } Gender: { gender } 
//           </Typography>
//         </CardContent>
//       </div>
//       { cardMedia }
//     </Card>
//   </div>
//   );
// }


// PatientCard.propTypes = {
//   patient: PropTypes.object,
//   multiline: PropTypes.bool,

//   fullName: PropTypes.string,
//   familyName: PropTypes.string,
//   givenName: PropTypes.string,
//   email: PropTypes.string,
//   birthDate: PropTypes.string,
//   gender: PropTypes.string,
//   avatar: PropTypes.string,
//   overflowY: PropTypes.string,
//   defaultAvatar: PropTypes.string,

//   hideDetails: PropTypes.bool,
//   style: PropTypes.object
// };


// PatientCard.defaultProps = {
//   patient: {},
//   multiline: false,
//   fullName: '',
//   familyName: '',
//   givenName: '',
//   email: '',
//   birthDate: '',
//   gender: '',
//   avatar: '',
//   overflowY: '',
//   defaultAvatar: '',
//   hideDetails: true
// };

// export default PatientCard;
