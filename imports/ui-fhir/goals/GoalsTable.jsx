// imports/ui-fhir/goals/GoalsTable.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import { get } from 'lodash';

import { FhirDehydrator } from '../../lib/FhirDehydrator';

const log = (Meteor.Logger ? Meteor.Logger.for('GoalsTable') : console);

function GoalsTable(props) {
  log.debug('Rendering the GoalsTable');

  const {
    id,
    goals,
    selectedGoalId,
    count,

    disablePagination,

    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideDescription,
    hideLifecycleStatus,
    hideAchievementStatus,
    hideCategory,
    hidePriority,
    hideStartDate,
    hideTargetDate,
    hideSubject,
    hideBarcode,
    showLifecycleStatus,
    showCategory,

    onRowClick,
    onRemoveRecord,

    page,
    onSetPage,
    rowsPerPage,
    dateFormat,
    showMinutes,
    tableRowSize,
    formFactorLayout
  } = props;

  // Column visibility — hide* wins when provided; show* opts legacy-hidden columns in.
  const columns = {
    identifier: hideIdentifier === undefined ? false : !hideIdentifier,
    description: !hideDescription,
    lifecycleStatus: hideLifecycleStatus === undefined ? (showLifecycleStatus !== false) : !hideLifecycleStatus,
    achievementStatus: !hideAchievementStatus,
    category: hideCategory === undefined ? !!showCategory : !hideCategory,
    priority: hidePriority === undefined ? false : !hidePriority,
    startDate: hideStartDate === undefined ? false : !hideStartDate,
    targetDate: !hideTargetDate,
    subject: hideSubject === undefined ? false : !hideSubject,
    barcode: hideBarcode === undefined ? false : !hideBarcode,
    actionIcons: hideActionIcons === undefined ? false : !hideActionIcons
  };

  // ------------------------------------------------------------------------
  // Pagination — controlled when the parent passes page/onSetPage, else local

  const [localPage, setLocalPage] = useState(0);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(rowsPerPage || 5);

  const currentPage = (typeof page === 'number') ? page : localPage;
  const currentRowsPerPage = rowsPerPage || localRowsPerPage;

  function handleChangePage(event, newPage) {
    if (typeof onSetPage === 'function') {
      onSetPage(newPage);
    } else {
      setLocalPage(newPage);
    }
  }

  // ------------------------------------------------------------------------
  // Rows

  let internalDateFormat = dateFormat || (showMinutes ? 'YYYY-MM-DD hh:mm' : 'YYYY-MM-DD');

  const goalsToRender = [];
  if (Array.isArray(goals)) {
    goals.forEach(function(goal) {
      goalsToRender.push(FhirDehydrator.dehydrateGoal(goal, internalDateFormat));
    });
  }

  function handleRowClick(goalId) {
    if (typeof onRowClick === 'function') {
      onRowClick(goalId);
    }
  }

  function handleRemoveRecord(event, goalId) {
    event.stopPropagation();
    if (typeof onRemoveRecord === 'function') {
      onRemoveRecord(goalId);
    }
  }

  const tableRows = [];
  if (goalsToRender.length === 0) {
    log.debug('No goals to render');
  } else {
    const startIndex = disablePagination ? 0 : currentPage * currentRowsPerPage;
    const endIndex = disablePagination ? goalsToRender.length : startIndex + currentRowsPerPage;

    for (let i = startIndex; i < Math.min(endIndex, goalsToRender.length); i++) {
      const goal = goalsToRender[i];
      const goalId = goal._id || goal.id;

      tableRows.push(
        <TableRow
          className="goalRow"
          key={goalId || i}
          onClick={function() { handleRowClick(goalId); }}
          hover={true}
          selected={Boolean(selectedGoalId) && (goalId === selectedGoalId)}
          sx={{ cursor: onRowClick ? 'pointer' : 'default', height: '52px' }}
        >
          { columns.actionIcons && <TableCell className="actionIcons" sx={{ width: '60px' }}>
            { typeof onRemoveRecord === 'function' &&
              <IconButton size="small" aria-label="remove goal" onClick={function(event) { handleRemoveRecord(event, goalId); }}>
                <DeleteIcon fontSize="small" />
              </IconButton> }
          </TableCell> }
          { columns.identifier && <TableCell className="identifier">{ goal.identifier }</TableCell> }
          { columns.description && <TableCell className="description">{ goal.description }</TableCell> }
          { columns.lifecycleStatus && <TableCell className="lifecycleStatus">{ goal.lifecycleStatus }</TableCell> }
          { columns.achievementStatus && <TableCell className="achievementStatus">{ goal.achievementStatus }</TableCell> }
          { columns.category && <TableCell className="category">{ goal.category }</TableCell> }
          { columns.priority && <TableCell className="priority">{ goal.priority }</TableCell> }
          { columns.startDate && <TableCell className="startDate">{ goal.startDate }</TableCell> }
          { columns.targetDate && <TableCell className="targetDate">{ goal.targetDate }</TableCell> }
          { columns.subject && <TableCell className="subject">{ goal.subject }</TableCell> }
          { columns.barcode && <TableCell className="barcode"><span className="barcode helveticas">{ goalId }</span></TableCell> }
        </TableRow>
      );
    }
  }

  let paginationFooter;
  if (!disablePagination) {
    paginationFooter = <TablePagination
      component="div"
      rowsPerPageOptions={[currentRowsPerPage]}
      count={typeof count === 'number' ? count : goalsToRender.length}
      rowsPerPage={currentRowsPerPage}
      page={currentPage}
      onPageChange={handleChangePage}
      sx={{ float: 'right', border: 'none' }}
    />;
  }

  return (
    <div id={id} className="tableWithPagination">
      <Table className="goalsTable" size={tableRowSize || 'small'} aria-label="goals table">
        <TableHead>
          <TableRow>
            { columns.actionIcons && <TableCell className="actionIcons" sx={{ width: '60px' }}>Actions</TableCell> }
            { columns.identifier && <TableCell className="identifier">Identifier</TableCell> }
            { columns.description && <TableCell className="description">Description</TableCell> }
            { columns.lifecycleStatus && <TableCell className="lifecycleStatus">Status</TableCell> }
            { columns.achievementStatus && <TableCell className="achievementStatus">Achievement</TableCell> }
            { columns.category && <TableCell className="category">Category</TableCell> }
            { columns.priority && <TableCell className="priority">Priority</TableCell> }
            { columns.startDate && <TableCell className="startDate">Start</TableCell> }
            { columns.targetDate && <TableCell className="targetDate">Target Date</TableCell> }
            { columns.subject && <TableCell className="subject">Patient</TableCell> }
            { columns.barcode && <TableCell className="barcode">System ID</TableCell> }
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

GoalsTable.propTypes = {
  id: PropTypes.string,
  goals: PropTypes.array,
  selectedGoalId: PropTypes.string,
  count: PropTypes.number,

  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideDescription: PropTypes.bool,
  hideLifecycleStatus: PropTypes.bool,
  hideAchievementStatus: PropTypes.bool,
  hideCategory: PropTypes.bool,
  hidePriority: PropTypes.bool,
  hideStartDate: PropTypes.bool,
  hideTargetDate: PropTypes.bool,
  hideSubject: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  showLifecycleStatus: PropTypes.bool,
  showCategory: PropTypes.bool,

  onRowClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,

  page: PropTypes.number,
  onSetPage: PropTypes.func,
  rowsPerPage: PropTypes.number,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string
};

export default GoalsTable;
