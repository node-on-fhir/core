// packages/hipaa-compliance/client/AuditLogTable.jsx

import React from 'react';
import { get } from 'lodash';
import moment from 'moment';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography
} from '@mui/material';

import {
  Visibility as ViewIcon,
  Create as CreateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Block as BlockIcon,
  Error as ErrorIcon,
  GetApp as DownloadIcon,
  Info as InfoIcon
} from '@mui/icons-material';

export default function AuditLogTable(props) {
  const { auditEvents = [], onRowClick } = props;

  // Get icon for event type
  const getEventIcon = (eventType) => {
    const iconMap = {
      'view': <ViewIcon fontSize="small" />,
      'read': <ViewIcon fontSize="small" />,
      'access': <ViewIcon fontSize="small" />,
      'create': <CreateIcon fontSize="small" />,
      'update': <EditIcon fontSize="small" />,
      'modify': <EditIcon fontSize="small" />,
      'delete': <DeleteIcon fontSize="small" />,
      'login': <LoginIcon fontSize="small" />,
      'logout': <LogoutIcon fontSize="small" />,
      'denied': <BlockIcon fontSize="small" />,
      'error': <ErrorIcon fontSize="small" />,
      'export': <DownloadIcon fontSize="small" />,
      'download': <DownloadIcon fontSize="small" />
    };
    return iconMap[eventType] || <InfoIcon fontSize="small" />;
  };

  // Get color for event type
  const getEventColor = (eventType) => {
    const colorMap = {
      'view': 'info',
      'read': 'info',
      'access': 'info',
      'create': 'success',
      'update': 'warning',
      'modify': 'warning',
      'delete': 'error',
      'denied': 'error',
      'error': 'error',
      'login': 'primary',
      'logout': 'default'
    };
    return colorMap[eventType] || 'default';
  };

  // Format date
  const formatDate = (date) => {
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
  };

  // Truncate long text
  const truncate = (text, length = 30) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label="HIPAA Audit Log">
        <TableHead>
          <TableRow>
            <TableCell>Date/Time</TableCell>
            <TableCell>Event Type</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Patient</TableCell>
            <TableCell>Resource</TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {auditEvents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body2" color="textSecondary">
                  No audit events found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            auditEvents.map((event) => (
              <TableRow 
                key={event._id}
                hover
                onClick={() => onRowClick && onRowClick(event)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  {formatDate(event.eventDate)}
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getEventIcon(event.eventType)}
                    label={event.eventType}
                    size="small"
                    color={getEventColor(event.eventType)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={event.userEmail || event.userId || 'System'}>
                    <span>{truncate(event.userName || event.userId || 'System', 20)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {event.patientId ? (
                    <Box>
                      <Typography variant="caption" display="block">
                        {truncate(event.patientName || '', 20)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {event.patientId}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      N/A
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {event.collectionName ? (
                    <Box>
                      <Typography variant="caption" display="block">
                        {event.collectionName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {truncate(event.resourceId || '', 15)}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      N/A
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip title={event.message || ''}>
                    <span>{truncate(event.message || '', 40)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('View details for:', event);
                      }}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}