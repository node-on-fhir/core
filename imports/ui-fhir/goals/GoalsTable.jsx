// import React, { useState } from 'react';
// import PropTypes from 'prop-types';

// import { 
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
//   TablePagination
// } from '@mui/material';


// import moment from 'moment'
// import _ from 'lodash';
// let get = _.get;
// let set = _.set;

// import FhirUtilities from '../../lib/FhirUtilities';
// import { FhirDehydrator } from '../../lib/FhirDehydrator';


// //===========================================================================
// // THEMING



// function GoalsTable(props){
//   logger.info('Rendering the GoalsTable');


//   let { 
//     children, 

//     lists,
//     selectedListId,

//     query,
//     paginationLimit,
//     disablePagination,

//     hideCheckbox,
//     hideActionIcons,
//     hideStatus,
//     hideTitle,
//     hideItemCount,
//     hideBarcode,

//     onCellClick,
//     onRowClick,
//     onMetaClick,
//     onRemoveRecord,
//     onActionButtonClick,
//     showActionButton,
//     actionButtonLabel,
  
//     rowsPerPage,
//     dateFormat,
//     showMinutes,
//     displayEnteredInError,

//     formFactorLayout,

//     ...otherProps 
//   } = props;


//   // ------------------------------------------------------------------------
//   // Helper Functions

//   function handleRowClick(id){
//     console.log('Clicking row ' + id)
//     if(props.onRowClick){
//       props.onRowClick(id);
//     }
//   }

//   function removeRecord(_id){
//     console.log('Remove list ', _id)
//     if(props.onRemoveRecord){
//       props.onRemoveRecord(_id);
//     }
//   }
//   function handleActionButtonClick(id){
//     if(typeof props.onActionButtonClick === "function"){
//       props.onActionButtonClick(id);
//     }
//   }


//   // ------------------------------------------------------------------------
//   // Column Rendering

//   function renderToggleHeader(){
//     if (!props.hideCheckbox) {
//       return (
//         <TableCell className="toggle" style={{width: '60px'}} >Toggle</TableCell>
//       );
//     }
//   }
//   function renderToggle(){
//     if (!props.hideCheckbox) {
//       return (
//         <TableCell className="toggle" style={{width: '60px'}}>
//             {/* <Checkbox
//               defaultChecked={true}
//             /> */}
//         </TableCell>
//       );
//     }
//   }
//   function renderActionIconsHeader(){
//     if (!props.hideActionIcons) {
//       return (
//         <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
//       );
//     }
//   }
//   function renderActionIcons(list ){
//     if (!props.hideActionIcons) {
//       let iconStyle = {
//         marginLeft: '4px', 
//         marginRight: '4px', 
//         marginTop: '4px', 
//         fontSize: '120%'
//       }

//       return (
//         <TableCell className='actionIcons' style={{minWidth: '120px'}}>
//           {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(list)} />
//           <GoTrashcan style={iconStyle} onClick={ removeRecord.bind(list._id)} />   */}
//         </TableCell>
//       );
//     }
//   } 

//   function renderVersion(version){
//     if (!props.hideVersion) {
//       return (
//         <TableCell className='version'>{ version }</TableCell>
//       );
//     }
//   }
//   function renderVersionHeader(){
//     if (!props.hideVersion) {
//       return (
//         <TableCell className='version'>Version</TableCell>
//       );
//     }
//   }
//   function renderStatus(status){
//     if (!props.hideStatus) {
//       return (
//         <TableCell className='status'>{ status }</TableCell>
//       );
//     }
//   }
//   function renderStatusHeader(){
//     if (!props.hideStatus) {
//       return (
//         <TableCell className='status'>Status</TableCell>
//       );
//     }
//   }
//   function renderTitle(title){
//     if (!props.hideTitle) {
//       return (
//         <TableCell className='title'>{ title }</TableCell>
//       );
//     }
//   }
//   function renderTitleHeader(){
//     if (!props.hideTitle) {
//       return (
//         <TableCell className='title'>Title</TableCell>
//       );
//     }
//   }
  
//   function renderItemCountHeader(){
//     if (!props.hideItemCount) {
//       return (
//         <TableCell className='itemCount'>Populations</TableCell>
//       );
//     }
//   }
//   function renderItemCount(itemCount){
//     if (!props.hideItemCount) {
//       return (
//         <TableCell className='itemCount'>{ itemCount }</TableCell>
//       );
//     }
//   }

//   function renderBarcode(id){
//     if (!props.hideBarcode) {
//       return (
//         <TableCell><span className="barcode helveticas">{id}</span></TableCell>
//       );
//     }
//   }
//   function renderBarcodeHeader(){
//     if (!props.hideBarcode) {
//       return (
//         <TableCell>System ID</TableCell>
//       );
//     }
//   }

//   //---------------------------------------------------------------------
//   // Pagination

//   let rows = [];
//   const [page, setPage] = useState(0);
//   const [rowsPerPageToRender, setRowsPerPage] = useState(rowsPerPage);


//   let paginationCount = 101;
//   if(props.count){
//     paginationCount = props.count;
//   } else {
//     paginationCount = rows.length;
//   }

//   const handleChangePage = (event, newPage) => {
//     setPage(newPage);
//   };

//   let paginationFooter;
//   if(!props.disablePagination){
//     paginationFooter = <TablePagination
//       component="div"
//       // rowsPerPageOptions={[5, 10, 25, 100]}
//       rowsPerPageOptions={[5, 10, 25, 100]}
//       colSpan={3}
//       count={paginationCount}
//       rowsPerPage={rowsPerPageToRender}
//       page={page}
//       onPageChange={handleChangePage}
//       style={{float: 'right', border: 'none'}}
//     />
//   }
  
  
//   //---------------------------------------------------------------------
//   // Table Rows



//   let tableRows = [];
//   let listsToRender = [];
//   let internalDateFormat = "YYYY-MM-DD";

//   if(props.showMinutes){
//     internalDateFormat = "YYYY-MM-DD hh:mm";
//   }
//   if(props.internalDateFormat){
//     internalDateFormat = props.dateFormat;
//   }


//   if(props.lists){
//     if(props.lists.length > 0){              
//       props.lists.forEach(function(list){
//         listsToRender.push(FhirDehydrator.dehydrateList(list, internalDateFormat));
//       });  
//     }
//   }

//   if(listsToRender.length === 0){
//     console.log('No lists to render');
//     // footer = <TableNoData noDataPadding={ props.noDataMessagePadding } />
//   } else {
//     for (var i = 0; i < listsToRender.length; i++) {

//       let selected = false;
//       if(listsToRender[i].id === selectedListId){
//         selected = true;
//       }
//       tableRows.push(
//         <TableRow 
//           className="listRow" 
//           key={i} 
//           onClick={ handleRowClick.bind(this, listsToRender[i]._id)} 
//           hover={true} 
//           style={{cursor: 'pointer', height: '52px'}} 
//           selected={selected}
//         >
//           { renderToggle() }
//           { renderActionIcons(listsToRender[i]) }
//           { renderTitle(listsToRender[i].title) }          
//           { renderStatus(listsToRender[i].status) }
//           { renderItemCount(listsToRender[i].itemCount) }
//           { renderBarcode(listsToRender[i].id)}
//         </TableRow>
//       );       
//     }
//   }

//   return(
//     <div>
//       <Table size="small" aria-label="a dense table">
//         <TableHead>
//           <TableRow>
//             { renderToggleHeader() }
//             { renderActionIconsHeader() }
//             { renderTitleHeader() }
//             { renderStatusHeader() }
//             { renderItemCountHeader() }
//             { renderBarcodeHeader() }
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           { tableRows }
//         </TableBody>
//       </Table>
//       { paginationFooter }
//     </div>
//   );
// }

// GoalsTable.propTypes = {
//   barcodes: PropTypes.bool,
//   lists: PropTypes.array,
//   selectedListId: PropTypes.string,

//   query: PropTypes.object,
//   paginationLimit: PropTypes.number,
//   showMinutes: PropTypes.bool,

//   hideCheckbox: PropTypes.bool,
//   hideActionIcons: PropTypes.bool,
//   hideApprovalDate: PropTypes.bool,
//   hideVersion: PropTypes.bool,
//   hideStatus: PropTypes.bool,
//   hideTitle: PropTypes.bool,
//   hideItemCount: PropTypes.bool,
//   hideBarcode: PropTypes.bool,

//   onCellClick: PropTypes.func,
//   onRowClick: PropTypes.func,
//   onMetaClick: PropTypes.func,
//   onRemoveRecord: PropTypes.func,
//   onActionButtonClick: PropTypes.func,
//   actionButtonLabel: PropTypes.string,

//   formFactorLayout: PropTypes.string
// };
// GoalsTable.defaultProps = {
//   hideCheckbox: true,
//   hideActionIcons: true,
//   hideStatus: false,
//   hideTitle: false,
//   hideItemCount: false,
//   hideBarcode: true,
//   selectedListId: '',
//   rowsPerPage: 5
// }

// export default GoalsTable; 