// /packages/pacio-core/client/components/advanceDirectives/AdvanceDirectiveCard.jsx

import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActions,
  Typography, 
  Chip,
  Button,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Description as DocumentIcon,
  Error as ErrorIcon,
  CheckCircle as ActiveIcon,
  Warning as SupersededIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import { get } from 'lodash';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

export function AdvanceDirectiveCard(props) {
  const navigate = useNavigate();
  const {
    advanceDirective,
    onClick,
    onView,
    onDownload,
    showActions = true,
    elevation = 1
  } = props;
  
  if (!advanceDirective) {
    return null;
  }
  
  const status = get(advanceDirective, 'status', 'unknown');
  const isRevoked = status === 'entered-in-error';
  const isCurrent = status === 'active' || status === 'completed';
  const isSuperseded = status === 'superseded';
  
  function handleCardClick() {
    if (onClick) {
      onClick(advanceDirective);
    } else {
      navigate(`/advance-directive/${get(advanceDirective, 'id')}`);
    }
  }
  
  function handleView(event) {
    event.stopPropagation();
    if (onView) {
      onView(advanceDirective);
    } else {
      navigate(`/advance-directive/${get(advanceDirective, 'id')}`);
    }
  }
  
  function handleDownload(event) {
    event.stopPropagation();
    if (onDownload) {
      onDownload(advanceDirective);
    }
  }
  
  function renderStatusIcon() {
    if (isRevoked) {
      return <ErrorIcon color="error" />;
    } else if (isCurrent) {
      return <ActiveIcon color="success" />;
    } else if (isSuperseded) {
      return <SupersededIcon color="warning" />;
    }
    return <DocumentIcon color="action" />;
  }
  
  function renderStatusChip() {
    let color = 'default';
    let label = status;
    
    if (isRevoked) {
      color = 'error';
      label = 'Revoked';
    } else if (isCurrent) {
      color = 'success';
      label = 'Current';
    } else if (isSuperseded) {
      color = 'warning';
      label = 'Superseded';
    }
    
    return (
      <Chip 
        label={label}
        color={color}
        size="small"
      />
    );
  }
  
  return (
    <Card 
      elevation={elevation}
      onClick={handleCardClick}
      style={{ 
        cursor: 'pointer',
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {isRevoked && (
        <Box
          position="absolute"
          top={-10}
          right={-10}
          zIndex={1}
        >
          <Chip
            label="REVOKED"
            color="error"
            size="small"
          />
        </Box>
      )}
      
      <CardContent>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            {renderStatusIcon()}
            <Typography variant="h6" component="div">
              {get(advanceDirective, 'type.coding[0].display', 'Advance Directive')}
            </Typography>
          </Box>
          {renderStatusChip()}
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>Date:</strong> {moment(get(advanceDirective, 'date')).format('MMMM D, YYYY')}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>Author:</strong> {get(advanceDirective, 'author[0].display', 'Unknown')}
        </Typography>
        
        {get(advanceDirective, 'versionNumber') && (
          <Typography variant="body2" color="text.secondary">
            <strong>Version:</strong> {get(advanceDirective, 'versionNumber')}
          </Typography>
        )}
        
        {get(advanceDirective, 'description') && (
          <Box mt={2}>
            <Typography variant="body2" noWrap>
              {get(advanceDirective, 'description')}
            </Typography>
          </Box>
        )}
      </CardContent>
      
      {showActions && (
        <CardActions>
          <Button 
            size="small" 
            startIcon={<ViewIcon />}
            onClick={handleView}
          >
            View
          </Button>
          {get(advanceDirective, 'content[0].attachment.url') && (
            <Button 
              size="small" 
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
            >
              Download
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
}