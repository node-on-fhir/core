import React, { useState, useEffect, Fragment } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Collapse,
  Box,
  Typography,
  Chip,
  Stack
} from '@mui/material';
import {
  FirstPage as FirstPageIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  LastPage as LastPageIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  LocalHospital as HospitalIcon,
  Assessment as AuditIcon,
  Person as PersonIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';


// import Icon from 'react-icons-kit'
// import { tag } from 'react-icons-kit/fa/tag'
// import {iosTrashOutline} from 'react-icons-kit/ionicons/iosTrashOutline'

import TableNoData from '../components/TableNoData';


import moment from 'moment';

import _ from 'lodash';
let get = _.get;
let set = _.set;

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { flattenPatient } from '../lib/FhirDehydrator';
import { DynamicSpacer } from '../ui/DynamicSpacer';

// //===========================================================================
// // THEMING

let styles = {
  hideOnPhone: {
    visibility: 'visible',
    display: 'table'
  },
  cellHideOnPhone: {
    visibility: 'visible',
    display: 'table',
    paddingTop: '16px',
    maxWidth: '120px'
  },
  cell: {
    paddingTop: '16px'
  },
  avatar: {
    backgroundColor: 'rgb(188, 188, 188)',
    userSelect: 'none',
    borderRadius: '2px',
    height: '40px',
    width: '40px'
  }
};

// import { makeStyles } from '@material-ui/styles';
// const useStyles = makeStyles(theme => ({
//   root: {
//     flexShrink: 0,
//     marginLeft: theme.spacing(2.5),
//   },
//   button: {
//     background: theme.background,
//     border: 0,
//     borderRadius: 3,
//     boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
//     color: theme.buttonText,
//     height: 48,
//     padding: '0 30px',
//   }
// }));


//----------------------------------------------------------------------
// Helper Components

let useTheme;
Meteor.startup(function(){
  useTheme = Meteor.useTheme;
})


//===========================================================================
// PAGINATION  

function TablePaginationActions(props) {
  
  const { theme, toggleTheme } = useTheme();
  const { count, page, rowsPerPage, onChangePage } = props;

  const handleFirstPageButtonClick = event => {
    onChangePage(event, 0);
  };

  const handleBackButtonClick = event => {
    onChangePage(event, page - 1);
  };

  const handleNextButtonClick = event => {
    onChangePage(event, page + 1);
  };

  const handleLastPageButtonClick = event => {
    onChangePage(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <div className={classes.root}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton onClick={handleBackButtonClick} disabled={page === 0} aria-label="previous page">
        {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </div>
  );
}

TablePaginationActions.propTypes = {
  count: PropTypes.number.isRequired,
  onChangePage: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
};



//===========================================================================
// MAIN COMPONENT  

export function PatientsTable(props = {}){
  // logger.log('PatientsTable', props)

  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState({});
  const [modalState, setModalState] = useState({});
  const [dynamicButtons, setDynamicButtons] = useState([]);
  const [selectedPatientForModal, setSelectedPatientForModal] = useState(null);

  // Collect dynamic buttons from packages on mount
  useEffect(() => {
    const collectButtons = async () => {
      let buttons = [];

      // Parse packages looking for PatientsDirectoryButtons
      const packageNames = Object.keys(Package);
      console.log('PatientsTable: Scanning packages for PatientsDirectoryButtons...');

      for (const packageName of packageNames) {
        if (Package[packageName].PatientsDirectoryButtons) {
          console.log('PatientsTable: Found PatientsDirectoryButtons in package:', packageName);
          console.log('PatientsTable: Buttons:', Package[packageName].PatientsDirectoryButtons);
          buttons = buttons.concat(Package[packageName].PatientsDirectoryButtons);
        }
      }

      console.log('PatientsTable: Total dynamic buttons collected:', buttons.length);
      setDynamicButtons(buttons);
    };

    collectButtons();
  }, []);

  let { 
    children, 

    id,
    fhirVersion,
    patients,
    selectedPatientId,

    hideCheckbox,
    hideActionIcons = false,
    hideIdentifier = false,
    hideActive = false,
    hideName = false,
    hideGender = false,
    hideBirthSex = false,
    hideBirthDate = false,
    hideMaritalStatus = false,
    hideLanguage = false,
    hideSpecies = true,
    hideAddress = false,
    hideCity = false,
    hideState = false,
    hidePostalCode = false,
    hideCountry = false,
    hideSystemBarcode = false,
    hideFhirBarcode = false,
    showActionButton,
    hideActionButton,
    
    noDataMessagePadding,
    rowsPerPage = 5,
    onCellClick,
    onRowClick,
    onMetaClick,
    onActionButtonClick,
    onFhirOperations,
    onLaunchClick,
    onSetPage,
    onChangeRowsPerPage,
    actionButtonLabel,

    defaultAvatar,
    disablePagination,
    paginationLimit,
    paginationCount = 100,
    dateFormat = "YYYY-MM-DD",
    hideCounts = true,
    cursors, 
    font3of9 = true,

    formFactorLayout,
    multiline = false,

    count,
    tableRowSize = 'medium',
    logger = null,

    rowClickMode = 'index',
    page: initialPage = 0,  // Rename to avoid conflict with state
    size,
    order = 'descending',

    ...otherProps
  } = props;


  if(logger){
    logger.trace('PatientsTable.patients', patients)
  }

  // Store original prop values to preserve user preferences
  // These will be restored after form factor logic
  const hideIdentifierFromProp = hideIdentifier;
  const hideGenderFromProp = hideGender;
  const hideBirthSexFromProp = hideBirthSex;
  const hideActiveFromProp = hideActive;
  const hideCityFromProp = hideCity;
  const hideStateFromProp = hideState;
  const hidePostalCodeFromProp = hidePostalCode;
  const hideCountryFromProp = hideCountry;
  const hideSystemBarcodeFromProp = hideSystemBarcode;
  const hideFhirBarcodeFromProp = hideFhirBarcode;
  const hideMaritalStatusFromProp = hideMaritalStatus;
  const hideLanguageFromProp = hideLanguage;

  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    if(logger){
      logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    }

    switch (formFactorLayout) {
      case "phone":
        hideActionIcons = true;
        hideName = false;
        hideGender = false;
        hideBirthDate = false;
        hideMaritalStatus = true;
        hideLanguage = true;
        hideSpecies = true;
        hideAddress = true;
        hideCity = true;
        hideState = true;
        hidePostalCode = true;
        hideCountry = true;
        hideCounts = true;
        hideSystemBarcode = true;
        hideFhirBarcode = true;
        hideIdentifier = true;
        hideActive = true;
        break;
      case "tablet":
        hideActionIcons = true;
        hideName = false;
        hideGender = false;
        hideBirthDate = false;
        hideMaritalStatus = true;
        hideLanguage = true;
        hideSpecies = true;
        hideAddress = true;
        hideCity = true;
        hideState = true;
        hidePostalCode = true;
        hideCountry = true;
        hideCounts = true;
        hideSystemBarcode = true;
        hideFhirBarcode = true;
        break;
      case "web":
        hideActionIcons = true;
        hideName = false;
        hideGender = false;
        hideBirthDate = false;
        hideMaritalStatus = false;
        hideLanguage = false;
        hideSpecies = true;
        hideAddress = true;
        hideCity = false;
        hideState = false;
        hidePostalCode = false;
        hideCountry = true;
        hideCounts = true;
        hideSystemBarcode = true;
        hideFhirBarcode = true;
        break;
      case "desktop":
        hideActionIcons = true;
        hideName = false;
        hideGender = false;
        hideBirthDate = false;
        hideMaritalStatus = false;
        hideLanguage = false;
        hideSpecies = true;
        hideAddress = true;
        hideCity = false;
        hideState = false;
        hidePostalCode = false;
        hideCountry = false;
        hideCounts = true;
        hideSystemBarcode = true;
        hideFhirBarcode = true;
        break;
      case "hdmi":
        hideActionIcons = true;
        hideName = false;
        hideGender = false;
        hideBirthDate = false;
        hideMaritalStatus = false;
        hideLanguage = false;
        hideSpecies = true;
        hideAddress = true;
        hideCity = false;
        hideState = false;
        hidePostalCode = false;
        hideCountry = false;
        hideCounts = true;
        hideSystemBarcode = true;
        hideFhirBarcode = false;
        break;
    }
  }

  // Restore user preferences for controlled columns
  // This ensures toggle buttons in PatientsDirectory work correctly
  hideIdentifier = hideIdentifierFromProp;
  hideGender = hideGenderFromProp;
  hideBirthSex = hideBirthSexFromProp;
  hideActive = hideActiveFromProp;
  hideCity = hideCityFromProp;
  hideState = hideStateFromProp;
  hidePostalCode = hidePostalCodeFromProp;
  hideCountry = hideCountryFromProp;
  hideSystemBarcode = hideSystemBarcodeFromProp;
  hideFhirBarcode = hideFhirBarcodeFromProp;
  hideMaritalStatus = hideMaritalStatusFromProp;
  hideLanguage = hideLanguageFromProp;


    //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let footer;

  const [page, setPage] = useState(initialPage);
  const [rowsPerPageToRender, setRowsPerPageToRender] = useState(rowsPerPage);
  const [rows, setRows] = useState([]);

  const emptyRows = rowsPerPageToRender - Math.min(rowsPerPageToRender, rows.length - page * rowsPerPageToRender);


  if(paginationCount){
    paginationCount = paginationCount;
  } else {
    paginationCount = rows.length;
  }


  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = event => {
    setRowsPerPageToRender(parseInt(event.target.value, 10));
    setPage(0);
  };


  //================================================================
  // Render Methods


  function renderRowAvatarHeader(){
    if (get(this, 'defaultAvatar') && (showAvatars === true)) {
      return (
        <TableCell className='avatar'>photo</TableCell>
      );
    }
  }
  function renderRowAvatar(patient, avatarStyle){
    //logger.log('renderRowAvatar', patient, avatarStyle)
    
    if (get(this, 'defaultAvatar') && (showAvatars === true)) {
      return (
        <TableCell className='avatar'>
          <img 
            src={patient.photo} 
            onError={(e)=>{e.target.onerror = null; e.target.src = get(this, 'defaultAvatar')}}
            style={avatarStyle}
          />
        </TableCell>
      );
    }
  }
  function renderIdentifier(identifier){
    if (!hideIdentifier) {
      return (
        <TableCell className="identifier hidden-on-phone">{ identifier }</TableCell>
      );
    }
  }
  function renderIdentifierHeader(){
    if (!hideIdentifier) {
      return (
        <TableCell className="identifier hidden-on-phone">Identifier</TableCell>
      );
    }
  }

  function renderSpeciesHeader(){
    if(!hideSpecies || (fhirVersion === "R4")){
      return (
        <TableCell className='species'>Species</TableCell>
      );
    }
  }
  function renderSpecies(patient){
    if(!hideSpecies || (fhirVersion === "R4")){
      return (
        <TableCell className='species' style={styles.cellHideOnPhone}>
          {patient.species}
        </TableCell>
      );
    }
  }
  function renderActionButtonHeader(){
    if (showActionButton === true) {
      return (
        <TableCell className='ActionButton' >Action</TableCell>
      );
    }
  }
  function renderActionButton(patient, avatarStyle){
    if (showActionButton === true) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind('this', patientsToRender[i]._id)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }
  function handleActionButtonClick(id){
    if(typeof onActionButtonClick === "function"){
      onActionButtonClick(id);
    }
  }
  function cellClick(id){
    if(typeof onCellClick === "function"){
      onCellClick(id);
    }
  }
  function selectPatientRow(patient, index){
    if(logger){
      logger.debug('Selecting a new Patient...');
    }

    let patientId;
    switch (rowClickMode) {
      case 'index':
        patientId = index;    
        break;
      case 'id':
        patientId = get(patient, 'id');
        break;
      case '_id':
        patientId = get(patient, '_id');
        break;
      default:
        patientId = get(patient, '_id');
        break;
    }

    // If we're in a selection mode (onRowClick is provided), select the patient
    // This is typically used in dialogs like PatientSearchDialog
    if (typeof onRowClick === 'function') {
      console.log('PatientsTable: Selecting patient via row click:', patientId);
      console.log('PatientsTable: Patient object:', patient);
      // Pass both the ID and the patient object
      // This matches what PatientSearchDialog expects in its onRowClick handler
      onRowClick(patientId, patient);
    } else {
      // Otherwise just toggle expansion for normal table view
      toggleRowExpansion(patientId, { stopPropagation: () => {} });
    }
  }

  function toggleRowExpansion(patientId, event){
    event.stopPropagation();
    setExpandedRows(prev => ({
      ...prev,
      [patientId]: !prev[patientId]
    }));
  }
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>Actions</TableCell>
      );
    }
  }
  function removeRecord(_id){
    if(logger){
      logger.debug('Remove patient ', _id)
    }
    if(onRemoveRecord){
      onRemoveRecord(_id);
    }
    // Patients._collection.remove({_id: _id})
  }
  function renderActionIcons(patient ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ handleMetaClick.bind(this, patient)} />
          <GoTrashcan style={iconStyle} onClick={ removeRecord.bind(this, patient._id)} />   */}
          {/* <Icon icon={iosTrashOutline} style={iconStyle} onClick={ removeRecord.bind(this, patient._id)} /> */}
        </TableCell>
      );
    }
  } 

  function renderAddressHeader(){
    if (!hideAddress) {
      return (
        <TableCell className="streetAddress">Address</TableCell>
      );
    }
  }
  function renderAddress(streetAddress){
    if (!hideAddress) {
      return (
        <TableCell className='streetAddress'>{streetAddress}</TableCell>
      );
    }
  }
  function renderCityHeader(){
    if (!hideCity) {
      return (
        <TableCell className="city">City</TableCell>
      );
    }
  }
  function renderCity(city){
    if (!hideCity) {
      return (
        <TableCell className='city'>{city}</TableCell>
      );
    }
  }
  function renderStateHeader(){
    if (!hideState) {
      return (
        <TableCell className="state">State</TableCell>
      );
    }
  }
  function renderState(state){
    if (!hideState) {
      return (
        <TableCell className='state'>{state}</TableCell>
      );
    }
  }
  function renderZipCodeHeader(){
    if (!hidePostalCode) {
      return (
        <TableCell className="zipCode">Zip Code</TableCell>
      );
    }
  }
  function renderZipCode(zipCode){
    if (!hidePostalCode) {
      return (
        <TableCell className='zipCode'>{zipCode}</TableCell>
      );
    }
  }
  function renderCountryHeader(){
    if (!hideCountry) {
      return (
        <TableCell className="country">Country</TableCell>
      );
    }
  }
  function renderCountry(country){
    if (!hideCountry) {
      return (
        <TableCell className='country'>{country}</TableCell>
      );
    }
  }


  function renderMaritalStatusHeader(){
    if (!hideMaritalStatus) {
      return (
        <TableCell className="maritalStatus">Marital Status</TableCell>
      );
    }
  }
  function renderMaritalStatus(maritalStatus){
    if (!hideMaritalStatus) {
      return (
        <TableCell className='maritalStatus'>{maritalStatus}</TableCell>
      );
    }
  }

  function renderLanguageHeader(){
    if (!hideLanguage) {
      return (
        <TableCell className="language">Language</TableCell>
      );
    }
  }
  function renderLanguage(language){
    if (!hideLanguage) {
      return (
        <TableCell className='language'>{language}</TableCell>
      );
    }
  }
  function renderIsActiveHeader(){
    if (!hideActive) {
      return (
        <TableCell className="isActive">Active</TableCell>
      );
    }
  }
  function renderIsActive(isActive){
    if (!hideActive) {
      return (
        <TableCell className='isActive'>{isActive}</TableCell>
      );
    }
  }


  function renderNameHeader(){
    if (!hideName) {
      return (
        <TableCell className="fullName">Full Name</TableCell>
      );
    }
  }
  function renderName(fullName, _id){
    if (!hideName) {
      return (
        <TableCell className='name' onClick={ cellClick.bind(this, _id)} >{fullName}</TableCell>
      );
    }
  }

  function renderGenderHeader(){
    if (!hideGender) {
      return (
        <TableCell className="gender">Gender</TableCell>
      );
    }
  }
  function renderGender(gender, _id){
    if (!hideGender) {
      return (
        <TableCell className='gender' onClick={ cellClick.bind(this, _id)} >{gender}</TableCell>
      );
    }
  }

  function renderBirthSexHeader(){
    if (!hideBirthSex) {
      return (
        <TableCell className="birthSex">Birth Sex</TableCell>
      );
    }
  }
  function renderBirthSex(birthSex, _id){
    if (!hideBirthSex) {
      return (
        <TableCell className='birthSex' onClick={ cellClick.bind(this, _id)} >{birthSex}</TableCell>
      );
    }
  }

  function renderBirthDateHeader(){
    if (!hideBirthDate) {
      
      return (
        <TableCell className="birthDate">Birth Date</TableCell>
      );
    }
  }
  function renderBirthDate(birthDate, _id){
    if (!hideBirthDate) {
      return (
        <TableCell className='birthDate' onClick={ cellClick.bind(this, _id)} style={{minWidth: '100px'}}>{birthDate}</TableCell> 
      );
    }
  }
  function renderBarcode(id){
    if (!hideFhirBarcode) {

      let barcodeClasses = "helvetica";

      if(font3of9){
        barcodeClasses = "barcode helvetica";
      }

      return (
        <TableCell><span className={barcodeClasses}>{id}</span></TableCell>
      );
    }
  }
  function renderBarcodeHeader(){
    if (!hideFhirBarcode) {
      return (
        <TableCell>FHIR ID</TableCell>
      );
    }
  }

  function renderSystemBarcode(id){
    if (!hideSystemBarcode) {

      let barcodeClasses = "helvetica";

      if(font3of9){
        barcodeClasses = "barcode helvetica";
      }

      // Convert ObjectID to string if needed
      const idString = typeof id === 'object' && id._str ? id._str : String(id || '');

      return (
        <TableCell><span className={barcodeClasses}>{idString}</span></TableCell>
      );
    }
  }
  function renderSystemBarcodeHeader(){
    if (!hideSystemBarcode) {
      return (
        <TableCell>System ID</TableCell>
      );
    }
  }

  function renderCountsHeader(){
    if (!hideCounts) {
      return (
        <TableCell className="counts">Counts</TableCell>
      );
    }
  }

  function handleMetaClick(patient){
    if(onMetaClick){
      onMetaClick(patient);
    }
  }

  // the idea behind this function is that we want a column in the table
  // that displays the counts of all the cursors that are associated with the Patient object
  // usually, this involves the $everything operation
  // where the entire patient chart is returned in a Bundle
  // the different resources in the Bundle are parsed, and stored in cursors
  // to get a summary of all that data into a column
  // we need to serialize it into a string
  // so we use a bitmask type operation to create the string
  // this is inspired by old school Morse code and TCP/IP network addresses
  // and pipe deliminated messaging

  

  function renderCounts(cursors, index){
    let serializedCounts = "";
    // logger.log('renderCounts', cursors)

    function serializeCounts(cursors){
      let counts = "";

      if(cursors){
        
        // Pa-AI-B-CP-Co-Cl-D-E-G-I-M-MS-MO-Ob-Or-Pe-Pra-RP-Pro

        if(typeof cursors.Patients !== "undefined"){
          counts = cursors.Patients;
        }
    
        if(typeof cursors.AllergyIntolerances !== "undefined"){
          counts = counts + " " + (cursors.AllergyIntolerances ? cursors.AllergyIntolerances : "-");
        }
        if(typeof cursors.Bundles !== "undefined"){
          counts = counts + " " + (cursors.Bundles ? cursors.Bundles : "-");
        }
        if(typeof cursors.CarePlans !== "undefined"){
          counts = counts + " " + (cursors.CarePlans ? cursors.CarePlans : "-");
        }
        if(typeof cursors.Conditions !== "undefined"){
          counts = counts + " " + (cursors.Conditions ? cursors.Conditions : "-");
        }
        if(typeof cursors.Claims !== "undefined"){
          counts = counts + " " + (cursors.Claims ? cursors.Claims : "-");
        }
        if(typeof cursors.Devices !== "undefined"){
          counts = counts + " " + (cursors.Devices ? cursors.Devices : "-");
        }
        if(typeof cursors.Encounters !== "undefined"){
          counts = counts + " " + (cursors.Encounters ? cursors.Encounters : "-");
        }
        if(typeof cursors.Goals !== "undefined"){
          counts = counts + " " + (cursors.Goals ? cursors.Goals : "-");
        }
        if(typeof cursors.Immunizations !== "undefined"){
          counts = counts + " " + (cursors.Immunizations ? cursors.Immunizations : "-");
        }
        if(typeof cursors.Medications !== "undefined"){
          counts = counts + " " + (cursors.Medications ? cursors.Medications : "-");
        }
        if(typeof cursors.MedicationStatements !== "undefined"){
          counts = counts + " " + (cursors.MedicationStatements ? cursors.MedicationStatements : "-");
        }
        if(typeof cursors.MedicationOrders !== "undefined"){
          counts = counts + " " + (cursors.MedicationOrders ? cursors.MedicationOrders : "-");
        }
        if(typeof cursors.Observations !== "undefined"){
          counts = counts + " " + (cursors.Observations ? cursors.Observations : "-");
        }
        if(typeof cursors.Organizations !== "undefined"){
          counts = counts + " " + (cursors.Organizations ? cursors.Organizations : "-");
        }
        if(typeof cursors.Persons !== "undefined"){
          counts = counts + " " + (cursors.Persons ? cursors.Persons : "-");
        }
        if(typeof cursors.Practitioners !== "undefined"){
          counts = counts + " " + (cursors.Practitioners ? cursors.Practitioners : "-");
        }
        if(typeof cursors.RelatedPersons !== "undefined"){
          counts = counts + " " + (cursors.RelatedPersons ? cursors.RelatedPersons : "-");
        }
        if(typeof cursors.Procedures !== "undefined"){
          counts = counts + " " + (cursors.Procedures ? cursors.Procedures : "-");
        }
      }

      return counts;
    }
    
    if(Array.isArray(cursors)){
      let paginatedIndex = (page * rowsPerPageToRender) + index + 1;

      serializedCounts = serializeCounts(cursors[paginatedIndex])
      // logger.log('PatientsTable.serializedCounts.array', serializedCounts, index, cursors[index])
    } else {
      serializedCounts = serializeCounts(cursors)
      // logger.log('PatientsTable.serializedCounts', serializedCounts)
    }

    if (!hideCounts) {
      return (
        <TableCell className='counts'>
          {serializedCounts}
        </TableCell>
      );
    }
  }

  //================================================================
  // Table

  let patientsToRender = [];
  if(patients){
    if(patients.length > 0){            
      let count = 0;  
      patients.forEach(function(patient){
        if((count >= (page * rowsPerPageToRender)) && (count < (page + 1) * rowsPerPageToRender)){
          patientsToRender.push(flattenPatient(patient, dateFormat));
        }
        count++;
      });

      // Apply sorting based on order prop
      if (order === 'ascending') {
        patientsToRender.sort(function(a, b) {
          const aId = a._id || '';
          const bId = b._id || '';
          return String(aId).localeCompare(String(bId));
        });
      } else {
        patientsToRender.sort(function(a, b) {
          const aId = a._id || '';
          const bId = b._id || '';
          return String(bId).localeCompare(String(aId));
        });
      }
    }
  }

  if(patientsToRender.length === 0){
    footer = <TableNoData noDataPadding={ noDataMessagePadding } />
  } else {
    for (var i = 0; i < patientsToRender.length; i++) {

      if(logger){
        logger.trace('PatientsTable.patientsToRender[' + i + ']', patientsToRender[i]);
      }

      let selected = false;
      if(patientsToRender[i].id === selectedPatientId){
        selected = true;
      }

      let rowStyle = {
        cursor: 'pointer', 
        height: '52px'
      }
      if(get(patientsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      // Use _id as primary key (NOT id) to avoid collisions
      // After flattenPatient(), records have both _id and id fields
      // Using || can cause one patient's id to match another's _id
      const patientId = get(patientsToRender[i], '_id');
      const currentPatient = patientsToRender[i];  // Capture for closure in onClick handlers
      const isExpanded = expandedRows[patientId] || false;
      
      // Main row
      tableRows.push(
        <TableRow key={i} className="patientRow" hover={true} style={rowStyle} selected={selected} onClick={ selectPatientRow.bind(this, patientsToRender[i] )} >
          <TableCell>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={(event) => toggleRowExpansion(patientId, event)}
            >
              {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </TableCell>
          { renderActionIcons(patientsToRender[i]) }
          { renderRowAvatar(patientsToRender[i], styles.avatar) }
          { renderIdentifier(patientsToRender[i].identifier)}

          { renderName(get(patientsToRender[i], "name"), get(patientsToRender[i], "_id"))}
          { renderGender(get(patientsToRender[i], "gender"), get(patientsToRender[i], "_id"))}
          { renderBirthSex(get(patientsToRender[i], "birthSex"), get(patientsToRender[i], "_id"))}
          { renderBirthDate(get(patientsToRender[i], "birthDate"), get(patientsToRender[i], "_id"))}

          { renderAddress(get(patientsToRender[i], 'addressLine') ) }
          { renderCity(get(patientsToRender[i], 'city')) }
          { renderState(get(patientsToRender[i], 'state')) }
          { renderZipCode(get(patientsToRender[i], 'postalCode')) }
          { renderCountry(get(patientsToRender[i], 'country')) }

          { renderMaritalStatus(get(patientsToRender[i], "maritalStatus")) }
          { renderLanguage(get(patientsToRender[i], "preferredLanguage")) }
          { renderIsActive(get(patientsToRender[i], "active")) }

          { renderCounts(cursors, i) }
          { renderActionButton(patientsToRender[i], styles.avatar) }

          { renderSystemBarcode(patientsToRender[i]._id)}
          { renderBarcode(patientsToRender[i].id)}
        </TableRow>
      );
      
      // Expanded row with action buttons
      const numberOfColumns = 20; // Adjust based on actual columns shown
      tableRows.push(
        <TableRow key={`${i}-expanded`}>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0, overflow: 'hidden' }} colSpan={numberOfColumns}>
            <Collapse in={isExpanded} timeout={300}>
              <Box sx={{ py: 2, px: 1 }}>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {/* Static Buttons */}
                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Selecting patient:', patientId);
                      // Use _id only for lookup to avoid collisions
                      const selectedPatient = patientsToRender.find(p => p._id === patientId);
                      console.log('Found patient:', selectedPatient);
                      
                      // Normalize the patient ID (handle ObjectID)
                      const normalizedId = typeof patientId === 'object' && patientId._str ? patientId._str : patientId;
                      Session.set('selectedPatientId', normalizedId);
                      Session.set('selectedPatient', selectedPatient);
                      
                      // Log AuditEvent for patient selection
                      Meteor.call('auditEvents.log', 'rest', Meteor.userId(), `Patient/${patientId}`, 
                        `User selected patient ${selectedPatient?.name || patientId}`, {
                          action: 'READ',
                          entity: [{
                            what: {
                              reference: `Patient/${patientId}`,
                              display: selectedPatient?.name || 'Unknown Patient'
                            },
                            type: {
                              system: 'http://hl7.org/fhir/resource-types',
                              code: 'Patient',
                              display: 'Patient'
                            }
                          }]
                        }, (error) => {
                          if (error) {
                            console.error('Error logging audit event:', error);
                          } else {
                            console.log('Audit event logged for patient selection');
                          }
                        }
                      );
                      
                      // Also call onRowClick if provided
                      if (typeof onRowClick === 'function') {
                        console.log('Calling onRowClick from Select Patient button');
                        onRowClick(patientId);
                      }
                    }}
                  >
                    Select Patient
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={(e) => {
                      e.stopPropagation();

                      // Get the patient's FHIR id (not MongoDB _id)
                      // Use _id only for lookup to avoid collisions
                      const selectedPatient = patientsToRender.find(p => p._id === patientId);
                      const fhirId = selectedPatient?.id;

                      if (fhirId) {
                        // Set only the FHIR id - let AutoDashboard query for the full patient
                        // This prevents structure mismatch between flattened and full FHIR objects
                        Session.set('selectedPatientId', fhirId);

                        // Log AuditEvent for viewing patient chart
                        Meteor.call('auditEvents.log', 'rest', Meteor.userId(), `Patient/${fhirId}`,
                          `User viewed patient chart for ${selectedPatient?.name || fhirId}`, {
                            action: 'READ',
                            entity: [{
                              what: {
                                reference: `Patient/${fhirId}`,
                                display: selectedPatient?.name || 'Unknown Patient'
                              },
                              type: {
                                system: 'http://hl7.org/fhir/resource-types',
                                code: 'Patient',
                                display: 'Patient'
                              }
                            }]
                          }, (error) => {
                            if (error) {
                              console.error('Error logging audit event:', error);
                            } else {
                              console.log('Audit event logged for patient chart view');
                            }
                          }
                        );

                        // Navigate to patient chart
                        navigate('/patient-chart');
                      }
                    }}
                  >
                    View Chart
                  </Button>
                  
                  <Button
                    className="viewPatientDemographicsButton"
                    variant="outlined"
                    size="small"
                    startIcon={<PersonIcon />}
                    onClick={(e) => {
                      e.stopPropagation();

                      // Get the patient's FHIR id (not MongoDB _id)
                      // Use _id only for lookup to avoid collisions
                      const selectedPatient = patientsToRender.find(p => p._id === patientId);
                      const fhirId = selectedPatient?.id;

                      console.log('View patient demographics:', patientId, 'FHIR ID:', fhirId);

                      // Navigate to patient detail page using FHIR id
                      if (fhirId) {
                        navigate(`/patients/${fhirId}`);
                      } else {
                        console.error('No FHIR ID found for patient');
                      }
                    }}
                  >
                    Demographics
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AuditIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Audit patient:', patientId);
                      // TODO: Implement audit functionality
                    }}
                  >
                    Audit
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<LaunchIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Launch clicked for patient:', patientId);

                      // Get the full patient object (unflatted version from original patients array)
                      const selectedPatient = patientsToRender.find(p => p._id === patientId);
                      console.log('Selected patient for launch:', selectedPatient);

                      if (typeof onLaunchClick === 'function') {
                        onLaunchClick(selectedPatient);
                      } else {
                        console.warn('onLaunchClick handler not provided');
                      }
                    }}
                  >
                    Launch
                  </Button>

                  {/* Dynamic Buttons from Packages */}
                  {dynamicButtons.map((buttonConfig) => {
                    const ButtonComponent = (
                      <Button
                        key={buttonConfig.id}
                        variant="outlined"
                        size="small"
                        color={buttonConfig.color || 'primary'}
                        startIcon={buttonConfig.icon}
                        onClick={(e) => {
                          e.stopPropagation();

                          if (buttonConfig.requiresModal) {
                            setSelectedPatientForModal(currentPatient);
                            setModalState({
                              ...modalState,
                              [buttonConfig.id]: true
                            });
                          } else if (buttonConfig.onClick) {
                            // Pass navigate function to allow React Router navigation
                            buttonConfig.onClick(patientId, currentPatient, navigate);
                          }
                        }}
                      >
                        {buttonConfig.label}
                      </Button>
                    );
                    
                    // If button has a modal, render both button and modal
                    if (buttonConfig.requiresModal && buttonConfig.modalComponent) {
                      const ModalComponent = buttonConfig.modalComponent;
                      return (
                        <Fragment key={buttonConfig.id}>
                          {ButtonComponent}
                          <ModalComponent
                            open={modalState[buttonConfig.id] || false}
                            onClose={() => setModalState({
                              ...modalState,
                              [buttonConfig.id]: false
                            })}
                            patient={selectedPatientForModal}
                          />
                        </Fragment>
                      );
                    }
                    
                    return ButtonComponent;
                  })}
                </Stack>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      );
    }
  }




  let paginationFooter;
  if(!disablePagination){
    paginationFooter = <TablePagination
      component="div"
      rowsPerPageOptions={[5, 10, 25, 100]}
      colSpan={3}
      count={paginationCount}
      rowsPerPage={rowsPerPageToRender}
      page={page}
      onPageChange={handleChangePage}
      onChangeRowsPerPage={handleChangeRowsPerPage}
      style={{float: 'right', border: 'none'}}
    />
  }

  return(
    <div>
      <Table id={id} size="small" aria-label="a dense table" { ...otherProps } >
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            { renderActionIconsHeader() }
            { renderRowAvatarHeader() }
            { renderIdentifierHeader() }

            { renderNameHeader() }
            { renderGenderHeader() }
            { renderBirthSexHeader() }
            { renderBirthDateHeader() }

            { renderAddressHeader() }
            { renderCityHeader() }
            { renderStateHeader() }
            { renderZipCodeHeader() }
            { renderCountryHeader() }

            { renderMaritalStatusHeader() }
            { renderLanguageHeader() }              
            { renderIsActiveHeader() }

            { renderCountsHeader() }
            { renderActionButtonHeader() }

            { renderSystemBarcodeHeader() }
            { renderBarcodeHeader() }
          </TableRow>
        </TableHead>
        <TableBody>
          { tableRows }
        </TableBody>
      </Table>
      { paginationFooter }
    </div>
  );
}


PatientsTable.propTypes = {
  fhirVersion: PropTypes.string,

  id: PropTypes.string,
  patients: PropTypes.array,
  selectedPatientId: PropTypes.string,

  showActionButton: PropTypes.bool,
  onRowClick: PropTypes.func,
  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideActive: PropTypes.bool,

  hideName: PropTypes.bool,
  hideGender: PropTypes.bool,
  hideBirthSex: PropTypes.bool,
  hideBirthDate: PropTypes.bool,
  
  hideMaritalStatus: PropTypes.bool,
  hideLanguage: PropTypes.bool,
  hideSpecies: PropTypes.bool,
  hideAddress: PropTypes.bool,
  hideCity: PropTypes.bool,
  hideState: PropTypes.bool,
  hidePostalCode: PropTypes.bool,
  hideCountry: PropTypes.bool,
  hideFhirBarcode: PropTypes.bool,
  hideSystemBarcode: PropTypes.bool,
  hideCounts: PropTypes.bool,
  
  noDataMessagePadding: PropTypes.number,
  rowsPerPage: PropTypes.number,
  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onLaunchClick: PropTypes.func,
  actionButtonLabel: PropTypes.string,
  defaultAvatar: PropTypes.string,
  disablePagination: PropTypes.bool,
  paginationLimit: PropTypes.number,
  paginationCount: PropTypes.number,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  
  cursors: PropTypes.array,
  font3of9: PropTypes.bool,

  count: PropTypes.number,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string,

  logger: PropTypes.object,
  rowClickMode: PropTypes.string,
  order: PropTypes.oneOf(['ascending', 'descending'])
};

export default PatientsTable;