// /packages/pacio-core/client/components/transitionOfCare/TransitionOfCareCard.jsx

import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActions,
  Typography, 
  Button,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  SwapHoriz as TransitionIcon,
  Description as SectionIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Visibility as ViewIcon,
  CalendarToday as DateIcon
} from '@mui/icons-material';
import { get } from 'lodash';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

export function TransitionOfCareCard(props) {
  const navigate = useNavigate();
  const {
    composition,
    onClick,
    onView,
    showActions = true,
    showSections = true,
    elevation = 1,
    maxSections = 3
  } = props;
  
  if (!composition) {
    return null;
  }
  
  function handleCardClick() {
    if (onClick) {
      onClick(composition);
    } else {
      navigate(`/transition-of-care/${get(composition, 'id')}`);
    }
  }
  
  function handleView(event) {
    event.stopPropagation();
    if (onView) {
      onView(composition);
    } else {
      navigate(`/transition-of-care/${get(composition, 'id')}`);
    }
  }
  
  function renderSectionList() {
    const sections = get(composition, 'section', []);
    const displaySections = sections.slice(0, maxSections);
    const remainingCount = sections.length - maxSections;
    
    if (sections.length === 0) {
      return (
        <Typography variant="body2" color="textSecondary">
          No sections in this document
        </Typography>
      );
    }
    
    return (
      <List dense>
        {displaySections.map(function(section, index) {
          return (
            <ListItem key={index} disableGutters>
              <ListItemIcon style={{ minWidth: 36 }}>
                <SectionIcon fontSize="small" color="action" />
              </ListItemIcon>
              <ListItemText
                primary={get(section, 'title', `Section ${index + 1}`)}
                secondary={`${get(section, 'entry', []).length} entries`}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          );
        })}
        {remainingCount > 0 && (
          <ListItem disableGutters>
            <ListItemText
              primary={
                <Typography variant="body2" color="primary">
                  +{remainingCount} more sections
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>
    );
  }
  
  const status = get(composition, 'status', 'unknown');
  const statusColor = status === 'final' ? 'success' : 
                     status === 'preliminary' ? 'warning' : 
                     'default';
  
  return (
    <Card 
      elevation={elevation}
      onClick={handleCardClick}
      style={{ 
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent style={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar style={{ backgroundColor: '#2196f3' }}>
              <TransitionIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" gutterBottom>
                {get(composition, 'title', 'Transition of Care')}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {get(composition, 'type.coding[0].display', 'Document')}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={status}
            color={statusColor}
            size="small"
          />
        </Box>
        
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <DateIcon fontSize="small" color="action" />
          <Typography variant="body2" color="textSecondary">
            {moment(get(composition, 'date')).format('MMM D, YYYY h:mm A')}
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <PersonIcon fontSize="small" color="action" />
          <Typography variant="body2" color="textSecondary">
            {get(composition, 'subject.display', 'Unknown Patient')}
          </Typography>
        </Box>
        
        {get(composition, 'author[0]') && (
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <PersonIcon fontSize="small" color="action" />
            <Typography variant="body2" color="textSecondary">
              By: {get(composition, 'author[0].display', 'Unknown Author')}
            </Typography>
          </Box>
        )}
        
        {get(composition, 'custodian') && (
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <BusinessIcon fontSize="small" color="action" />
            <Typography variant="body2" color="textSecondary">
              {get(composition, 'custodian.display', 'Unknown Organization')}
            </Typography>
          </Box>
        )}
        
        {showSections && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Document Sections ({get(composition, 'section', []).length})
            </Typography>
            {renderSectionList()}
          </Box>
        )}
      </CardContent>
      
      {showActions && (
        <CardActions>
          <Button 
            size="small" 
            startIcon={<ViewIcon />}
            onClick={handleView}
            fullWidth
            variant="contained"
          >
            View Document
          </Button>
        </CardActions>
      )}
    </Card>
  );
}