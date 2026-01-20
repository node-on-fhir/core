// packages/healthcare-surveys/client/components/surveys/SurveyCompositionViewer.jsx

import React from 'react';
import { 
  Card,
  CardContent,
  CardHeader,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Box,
  Chip
} from '@mui/material';
import { get } from 'lodash';
import moment from 'moment';

export default function SurveyCompositionViewer(props) {
  const { composition, onSectionClick } = props;
  
  if (!composition) {
    return (
      <Typography variant="body1" color="textSecondary">
        No composition data available
      </Typography>
    );
  }
  
  const renderSection = function(section) {
    const code = get(section, 'code.coding[0].code', '');
    const display = get(section, 'code.coding[0].display', get(section, 'title', 'Unnamed Section'));
    const text = get(section, 'text.div', '');
    const entries = get(section, 'entry', []);
    
    return (
      <Card key={code} sx={{ mb: 2 }}>
        <CardHeader
          title={display}
          subheader={`LOINC: ${code}`}
          action={
            entries.length > 0 && (
              <Chip label={`${entries.length} entries`} size="small" />
            )
          }
          onClick={() => onSectionClick && onSectionClick(section)}
          sx={{ cursor: onSectionClick ? 'pointer' : 'default' }}
        />
        <Divider />
        <CardContent>
          {text && (
            <Box dangerouslySetInnerHTML={{ __html: text }} sx={{ mb: 2 }} />
          )}
          {entries.length > 0 && (
            <List dense>
              {entries.map((entry, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={get(entry, 'display', get(entry, 'reference', 'Reference'))}
                    secondary={get(entry, 'reference', '')}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={get(composition, 'title', 'Healthcare Survey Report')}
          subheader={`Status: ${get(composition, 'status', 'unknown')}`}
        />
        <CardContent>
          <Typography variant="body2" gutterBottom>
            <strong>Date:</strong> {moment(get(composition, 'date')).format('YYYY-MM-DD HH:mm')}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Type:</strong> {get(composition, 'type.coding[0].display', 'Unknown')}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Subject:</strong> {get(composition, 'subject.display', get(composition, 'subject.reference', 'Unknown'))}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Encounter:</strong> {get(composition, 'encounter.display', get(composition, 'encounter.reference', 'Unknown'))}
          </Typography>
        </CardContent>
      </Card>
      
      <Typography variant="h6" gutterBottom>
        Sections
      </Typography>
      
      {get(composition, 'section', []).map(section => renderSection(section))}
    </Box>
  );
}