// packages/request-for-corrections/client/components/CorrectionRequestsList.jsx

import React from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { get } from 'lodash';
import moment from 'moment';
import { CorrectionTasks } from '../../lib/collections/CorrectionTasks';

export default function CorrectionRequestsList({ 
  tasks = [], 
  onViewRequest,
  showPatientColumn = false 
}) {
  
  const getStatusColor = (task) => {
    const businessStatus = CorrectionTasks.getBusinessStatusCode(task);
    const statusColorMap = {
      'queued': 'default',
      'in-review': 'primary',
      'waiting-for-information': 'warning',
      'accepted': 'success',
      'partial-accept': 'warning',
      'amendment-completed': 'success',
      'denied': 'error',
      'disagreement-logged': 'warning',
      'completed': 'success',
      'requester-cancelled': 'default'
    };
    return statusColorMap[businessStatus] || 'default';
  };
  
  if (tasks.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary" align="center" sx={{ p: 3 }}>
        No correction requests found
      </Typography>
    );
  }
  
  return (
    <Table>
      <TableHead>
        <TableRow>
          {showPatientColumn && <TableCell>Patient</TableCell>}
          <TableCell>Date</TableCell>
          <TableCell>Type</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Priority</TableCell>
          <TableCell>Last Updated</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task._id} hover>
            {showPatientColumn && (
              <TableCell>
                {get(task, 'for.display', get(task, 'for.reference', 'Unknown'))}
              </TableCell>
            )}
            <TableCell>
              {moment(task.authoredOn).format('MMM DD, YYYY')}
            </TableCell>
            <TableCell>
              {CorrectionTasks.isCorrectionRequest(task) ? 'Correction' : 'Disagreement'}
            </TableCell>
            <TableCell>
              <Chip 
                label={CorrectionTasks.getStateDisplay(task)}
                color={getStatusColor(task)}
                size="small"
              />
            </TableCell>
            <TableCell>
              <Typography variant="body2" color={task.priority === 'urgent' ? 'error' : 'textSecondary'}>
                {task.priority || 'routine'}
              </Typography>
            </TableCell>
            <TableCell>
              {moment(get(task, 'meta.lastUpdated')).fromNow()}
            </TableCell>
            <TableCell align="right">
              <IconButton
                size="small"
                onClick={() => onViewRequest(task._id)}
              >
                <ViewIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}