import React from 'react';
import PropTypes from 'prop-types';


import { FhirDehydrator } from '../../lib/FhirDehydrator';

import { 
  Grid, 
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Tab, 
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';

import moment from 'moment'
import _ from 'lodash';
let get = _.get;
let set = _.set;







function CompositionsTable(props){
  // console.log('CompositionsTable.props', props);
  // console.log('CompositionsTable.compositions', compositions);

  let {
    barcodes,
    compositions,
    selectedCompositionId,
    query,
    paginationLimit,
    
    hideCheckboxes,
    hideActionIcons,
    hideIdentifier,
    hideStatus,
    hideTypeCode,
    hideTypeDisplay,
    hideCategory,
    hideSubject,
    hideSubjectReference,
    hideEncounter,
    hideEncounterReference,
    hideAuthor,
    hideAuthorReference,
    hideTitle,
    hideDate,
    hideRelatesToCode,
    hideRelatesToIdentifier,
    hideRelatesToDisplay,
    hideRelatesToReference,
    hideSectionCount,

    enteredInError,
    multiline,
    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    actionButtonLabel,
    formFactorLayout,

    disablePagination,

    page,
    onSetPage,

    rowsPerPage,
    count,

    tableRowSize
  } = props;

    //-------------------------------------------------------------
    // Pagination

    let rows = [];

    let paginationCount = 101;
    if(count){
      paginationCount = count;
    } else {
      paginationCount = rows.length;
    }
  
    function handleChangePage(event, newPage){
      if(typeof onSetPage === "function"){
        onSetPage(newPage);
      }
    }
  
    let paginationFooter;
    if(!disablePagination){
      paginationFooter = <TablePagination
        component="div"
        // rowsPerPageOptions={[5, 10, 25, 100]}
        rowsPerPageOptions={[5, 10, 25, 100]}
        colSpan={3}
        count={paginationCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        style={{float: 'right', border: 'none'}}
      />
    }




  

  function handleChange(row, key, value) {
    const source = this.state.source;
    source[row][key] = value;
    this.setState({source});
  }
  function displayOnMobile(width){
    let style = {};
    if(['iPhone'].includes(window.navigator.platform)){
      style.display = "none";
    }
    if(width){
      style.width = width;
    }
    return style;
  }
  function handleSelect(selected) {
    this.setState({selected});
  }
  function getDate(){
    return "YYYY/MM/DD";
  }
  function noChange(){
    return "";
  }
  function rowClick(id){
    Session.set("selectedCompositionId", id);
    Session.set('compositionPageTabIndex', 1);
    Session.set('compositionDetailState', false);
  }
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(composition ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(composition)} />
          <GoTrashcan style={iconStyle} onClick={ removeRecord.bind(composition._id)} />   */}
        </TableCell>
      );
    }
  } 

  function renderBarcode(id){
    if (!hideIdentifier) {
      return (
        <TableCell><span className="barcode helvetica">{id}</span></TableCell>
      );
    }
  }
  function renderBarcodeHeader(){
    if (!hideIdentifier) {
      return (
        <TableCell>System ID</TableCell>
      );
    }
  }
  function renderSubject(name){
    if (!hideSubject) {
      return (
        <TableCell className='subject'>{ name }</TableCell>
      );
    }
  }
  function renderSubjectHeader(){
    if (!hideSubject) {
      return (
        <TableCell className='subject'>Subject</TableCell>
      );
    }
  }
  function renderSubjectReference(id){
    if (!hideSubjectReference) {
      return (
        <TableCell className='reference'>{ id }</TableCell>
      );
    }
  }
  function renderSubjectReferenceHeader(){
    if (!hideSubjectReference) {
      return (
        <TableCell className='reference'>Subject Reference</TableCell>
      );
    }
  }

  function renderEncounter(name){
    if (!hideEncounter) {
      return (
        <TableCell className='encounter'>{ name }</TableCell>
      );
    }
  }
  function renderEncounterHeader(){
    if (!hideEncounter) {
      return (
        <TableCell className='encounter'>Encounter</TableCell>
      );
    }
  }
  function renderEncounterReference(id){
    if (!hideEncounterReference) {
      return (
        <TableCell className='encounterReference'>{ id }</TableCell>
      );
    }
  }
  function renderEncounterReferenceHeader(){
    if (!hideEncounterReference) {
      return (
        <TableCell className='encounterReference'>Encounter Reference</TableCell>
      );
    }
  }

  function renderAuthor(name){
    if (!hideAuthor) {
      return (
        <TableCell className='author'>{ name }</TableCell>
      );
    }
  }
  function renderAuthorHeader(){
    if (!hideAuthor) {
      return (
        <TableCell className='author'>Author</TableCell>
      );
    }
  }
  function renderAuthorReference(id){
    if (!hideAuthorReference) {
      return (
        <TableCell className='authorReference'>{ id }</TableCell>
      );
    }
  }
  function renderAuthorReferenceHeader(){
    if (!hideAuthorReference) {
      return (
        <TableCell className='authorReference'>Author Reference</TableCell>
      );
    }
  }

  function renderTitle(title){
    if (!hideTitle) {
      return (
        <TableCell className='name'>{ title }</TableCell>
      );
    }
  }
  function renderTitleHeader(){
    if (!hideTitle) {
      return (
        <TableCell className='name'>Title</TableCell>
      );
    }
  }
  function renderDate(date){
    if (!hideDate) {
      return (
        <TableCell className='date'>{ date }</TableCell>
      );
    }
  }
  function renderDateHeader(){
    if (!hideDate) {
      return (
        <TableCell className='date'>Date</TableCell>
      );
    }
  }
  function renderStatus(valueString){
    if (!hideStatus) {
      return (
        <TableCell className='value'>{ valueString }</TableCell>
      );
    }
  }
  function renderStatusHeader(){
    if (!hideStatus) {
      return (
        <TableCell className='value'>Status</TableCell>
      );
    }
  }

  function renderSectionCount(valueString){
    if (!hideSectionCount) {
      return (
        <TableCell className='sectionCount'>{ valueString }</TableCell>
      );
    }
  }
  function renderSectionCountHeader(){
    if (!hideSectionCount) {
      return (
        <TableCell className='sectionCount'># Sections</TableCell>
      );
    }
  }

  function renderTypeCodeHeader(){
    if (!hideTypeCode) {
      return (
        <TableCell className='typecode'>Type Code</TableCell>
      );
    }
  }
  function renderTypeCode(code){
    if (!hideTypeCode) {
      return (
        <TableCell className='typecode'>{ code }</TableCell>
      );  
    }
  }
  function renderTypeDisplayHeader(){
    if (!hideTypeDisplay) {
      return (
        <TableCell className='typeDisplay'>Type Display</TableCell>
      );
    }
  }
  function renderTypeDisplay(display){
    if (!hideTypeDisplay) {
      return (
        <TableCell className='typeDisplay'>{ display }</TableCell>
      );  
    }
  }
  function renderCategoryHeader(){
    if (!hideCategory) {
      return (
        <TableCell className='category'>Category</TableCell>
      );
    }
  }
  function renderCategory(category){
    if (!hideCategory) {
      return (
        <TableCell className='category'>{ category }</TableCell>
      );  
    }
  }
  function renderRelatesToCodeHeader(){
    if (!hideRelatesToCode) {
      return (
        <TableCell className='relatesTo'>Relates To</TableCell>
      );
    }
  }
  function renderRelatesToCode(code){
    if (!hideRelatesToCode) {
      return (
        <TableCell className='relatesTo'>{ code }</TableCell>
      );  
    }
  }
  function renderRelatesToIdentifierHeader(){
    if (!hideRelatesToIdentifier) {
      return (
        <TableCell className='relatesToIdentifier'>Relates to (ID)</TableCell>
      );
    }
  }
  function renderRelatesToIdentifier(code){
    if (!hideRelatesToIdentifier) {
      return (
        <TableCell className='relatesToIdentifier'>{ code }</TableCell>
      );  
    }
  }
  function renderRelatesToDisplayHeader(){
    if (!hideRelatesToDisplay) {
      return (
        <TableCell className='relatesToDisplay'>Relates to Display</TableCell>
      );
    }
  }
  function renderRelatesToDisplay(text){
    if (!hideRelatesToDisplay) {
      return (
        <TableCell className='relatesToDisplay'>{ text }</TableCell>
      );  
    }
  }
  function renderRelatesToReferenceHeader(){
    if (!hideRelatesToReference) {
      return (
        <TableCell className='relatesToReference'>Relates to Reference</TableCell>
      );
    }
  }
  function renderRelatesToReference(reference){
    if (!hideRelatesToReference) {
      return (
        <TableCell className='relatesToReference'>{ reference }</TableCell>
      );  
    }
  }
  function renderCategoryHeader(){
    if (multiline === false) {
      return (
        <TableCell className='category'>Category</TableCell>
      );
    }
  }
  function renderCategory(category){
    if (multiline === false) {
      return (
        <TableCell className='category'>{ category }</TableCell>
      );
    }
  }
  function renderToggleHeader(){
    if (!hideCheckboxes) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >Toggle</TableCell>
      );
    }
  }
  function renderToggle(){
    if (!hideCheckboxes) {
      return (
        <TableCell className="toggle" style={{width: '60px'}}>
            {/* <Checkbox
              defaultChecked={true}
            /> */}
        </TableCell>
      );
    }
  }
  function renderIdentifierHeader(){
    if (!hideIdentifier) {
      return (
        <TableCell className='identifier'>Identifier</TableCell>
      );
    }
  }
  function renderIdentifier(identifier ){
    if (!hideIdentifier) {
      return (
        <TableCell className='identifier'>{ identifier }</TableCell>
      );
    }
  } 

  function handleRowClick(event){
    //console.log('handleRowClick', event)
    if(typeof onRowClick === "function"){
      onRowClick(event);
    }
  }


  let tableRows = [];
  let compositionsToRender = [];
  if(compositions){
    if(compositions.length > 0){              
      compositions.forEach(function(composition){
        compositionsToRender.push(FhirDehydrator.dehydrateComposition(composition));
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }
  if(compositionsToRender.length === 0){
    logger.trace('CompositionsTable:  No compositions to render.');
    // footer = <TableNoData noDataPadding={ noDataMessagePadding } />
  } else {
    for (var i = 0; i < compositionsToRender.length; i++) {
      // console.log('compositionsToRender[i]', compositionsToRender[i])

      let selected = false;
      if(compositionsToRender[i].id === selectedCompositionId){
        selected = true;
      }
      if(get(compositionsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      if(multiline){
        tableRows.push(
          <TableRow className="compositionRow" key={i} style={rowStyle} onClick={ handleRowClick(compositionsToRender[i].id)} >
            { renderToggle() }
            { renderActionIcons(compositionsToRender[i]) }
            { renderIdentifier(compositionsToRender[i].identifier) }
            { renderStatus(compositionsToRender[i].status)}
            { renderTypeCode(compositionsToRender[i].typeCode) }
            { renderTypeDisplay(compositionsToRender[i].typeDisplay) }
            { renderCategory(compositionsToRender[i].categoryDisplay) }
            { renderSubject(compositionsToRender[i].subject)}
            { renderSubjectReference(compositionsToRender[i].subjectReference)}
            { renderEncounter(compositionsToRender[i].encounter)}
            { renderEncounterReference(compositionsToRender[i].encounterReference)}
            { renderTitle(compositionsToRender[i].title)}
            { renderDate(compositionsToRender[i].date)}
            { renderRelatesToCode(compositionsToRender[i].relatesToCode)}
            { renderRelatesToIdentifier(compositionsToRender[i].relatesToIdentifier)}
            { renderRelatesToDisplay(compositionsToRender[i].relatesToDisplay)}
            { renderRelatesToReference(compositionsToRender[i].relatesToReference)}
            { renderSectionCount(compositionsToRender[i].sectionsCount)}
            { renderBarcode(compositionsToRender[i]._id)}
          </TableRow>
        );    

      } else {
        tableRows.push(
          <TableRow className="compositionRow" key={i} style={rowStyle} onClick={ handleRowClick(compositionsToRender[i].id)} >            
            { renderToggle() }
            { renderActionIcons(compositionsToRender[i]) }
            { renderIdentifier(compositionsToRender[i].identifier) }
            { renderStatus(compositionsToRender[i].status)}
            { renderTypeCode(compositionsToRender[i].typeCode) }
            { renderTypeDisplay(compositionsToRender[i].typeDisplay) }
            { renderCategory(compositionsToRender[i].categoryDisplay) }
            { renderSubject(compositionsToRender[i].subject)}
            { renderSubjectReference(compositionsToRender[i].subjectReference)}
            { renderEncounter(compositionsToRender[i].encounter)}
            { renderEncounterReference(compositionsToRender[i].encounterReference)}
            { renderAuthor(compositionsToRender[i].author)}
            { renderAuthorReference(compositionsToRender[i].authorReference)}
            { renderTitle(compositionsToRender[i].title)}
            { renderDate(compositionsToRender[i].date)}
            { renderRelatesToCode(compositionsToRender[i].relatesToCode)}
            { renderRelatesToIdentifier(compositionsToRender[i].relatesToIdentifier)}
            { renderRelatesToDisplay(compositionsToRender[i].relatesToDisplay)}
            { renderRelatesToReference(compositionsToRender[i].relatesToReference)}            
            { renderSectionCount(compositionsToRender[i].sectionsCount)}
            { renderBarcode(compositionsToRender[i]._id)}
          </TableRow>
        );    
      }
    }
  }

  return(
    <Table size="small" aria-label="a dense table">
      <TableHead>
        <TableRow>
          { renderToggleHeader() }
          { renderActionIconsHeader() }
          { renderIdentifierHeader() }
          { renderStatusHeader() }
          { renderTypeCodeHeader() }
          { renderTypeDisplayHeader() }
          { renderCategoryHeader() }
          { renderSubjectHeader() }
          { renderSubjectReferenceHeader() }
          { renderEncounterHeader() }
          { renderEncounterReferenceHeader() }
          { renderAuthorHeader() }
          { renderAuthorReferenceHeader() }
          { renderTitleHeader() }
          { renderDateHeader() }
          { renderRelatesToCodeHeader() }
          { renderRelatesToIdentifierHeader() }
          { renderRelatesToDisplayHeader() }
          { renderRelatesToReferenceHeader() }
          { renderSectionCountHeader() }
          { renderBarcodeHeader() }
        </TableRow>
      </TableHead>
      <TableBody>
        { tableRows }
      </TableBody>
    </Table>
  );
}

CompositionsTable.propTypes = {
  barcodes: PropTypes.bool,
  compositions: PropTypes.array,
  selectedCompositionId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,

  hideCheckboxes: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideTypeCode: PropTypes.bool,
  hideTypeDisplay: PropTypes.bool,
  hideCategory: PropTypes.bool,
  hideSubject: PropTypes.bool,
  hideSubjectReference: PropTypes.bool,
  hideEncounter: PropTypes.bool,
  hideEncounterReference: PropTypes.bool,
  hideAuthor: PropTypes.bool,
  hideAuthorReference: PropTypes.bool,
  hideTitle: PropTypes.bool,
  hideDate: PropTypes.bool,
  hideRelatesToCode: PropTypes.bool,
  hideRelatesToIdentifier: PropTypes.bool,
  hideRelatesToDisplay: PropTypes.bool,
  hideRelatesToReference: PropTypes.bool,
  hideSectionCount: PropTypes.bool,

  enteredInError: PropTypes.bool,
  multiline: PropTypes.bool,
  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,
  
  page: PropTypes.number,
  actionButtonLabel: PropTypes.string,
  formFactorLayout: PropTypes.string,
  tableRowSize: PropTypes.string,

  count: PropTypes.number,
  rowsPerPage: PropTypes.number
};

CompositionsTable.defaultProps = {
  hideCheckboxes: true,
  hideActionIcons: true,
  hideCategory: true,
  hideAuthor: true,
  hideEncounter: true,
  hideAuthorReference: true,
  hideRelatesToIdentifier: true,
  hideRelatesToDisplay: true,
  tableRowSize: 'medium',
  count: 0,
  rowsPerPage: 5
}


export default CompositionsTable; 