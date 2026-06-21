// /packages/pacio-core/client/components/transitionOfCare/TransitionOfCareDetail.jsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardActions,
  Typography, 
  Button,
  Box,
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  SwapHoriz as TransitionIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  ArrowBack as BackIcon,
  Print as PrintIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import { get } from 'lodash';
import moment from 'moment';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

import { Compositions } from '/imports/lib/schemas/SimpleSchemas/Compositions';

export default function TransitionOfCareDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState([]);
  
  const { composition, loading } = useTracker(function() {
    const sub = Meteor.subscribe('pacio.transitionOfCare', null, id);
    return {
      composition: Compositions.findOne(id),
      loading: !sub.ready()
    };
  }, [id]);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (!composition) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Transition of Care document not found</Typography>
        </CardContent>
        <CardActions>
          <Button onClick={function() { navigate(-1); }}>
            Back
          </Button>
        </CardActions>
      </Card>
    );
  }
  
  function handleSectionChange(sectionIndex) {
    return function(event, isExpanded) {
      setExpandedSections(function(prev) {
        if (isExpanded) {
          return [...prev, sectionIndex];
        } else {
          return prev.filter(function(idx) { return idx !== sectionIndex; });
        }
      });
    };
  }
  
  function handleExpandAll() {
    const sections = get(composition, 'section', []);
    const allIndexes = sections.map(function(section, index) { return index; });
    setExpandedSections(allIndexes);
  }
  
  function handleCollapseAll() {
    setExpandedSections([]);
  }
  
  function handlePrint() {
    window.print();
  }
  
  function handleDownload() {
    // TODO: Implement PDF generation and download
    console.log('Download TOC document');
  }
  
  function renderSection(section, index) {
    const isExpanded = expandedSections.includes(index);
    const hasContent = get(section, 'text.div') || get(section, 'entry', []).length > 0;
    
    return (
      <Accordion 
        key={index}
        expanded={isExpanded}
        onChange={handleSectionChange(index)}
        style={{ marginBottom: 8 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
            <Typography variant="h6">
              {get(section, 'title', `Section ${index + 1}`)}
            </Typography>
            <Box display="flex" gap={1}>
              {get(section, 'code.coding[0].display') && (
                <Chip 
                  label={get(section, 'code.coding[0].display')}
                  size="small"
                  variant="outlined"
                />
              )}
              {get(section, 'entry', []).length > 0 && (
                <Chip 
                  label={`${get(section, 'entry', []).length} entries`}
                  size="small"
                  color="primary"
                />
              )}
            </Box>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Box>
            {get(section, 'text.div') && (
              <Box mb={2}>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: get(section, 'text.div') 
                  }}
                />
              </Box>
            )}
            
            {get(section, 'entry', []).length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Referenced Resources:
                </Typography>
                <List dense>
                  {get(section, 'entry', []).map(function(entry, entryIndex) {
                    return (
                      <ListItem key={entryIndex}>
                        <ListItemText
                          primary={get(entry, 'display', get(entry, 'reference'))}
                          secondary={get(entry, 'reference')}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}
            
            {!hasContent && (
              <Typography variant="body2" color="textSecondary">
                No content available for this section
              </Typography>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  }
  
  const sections = get(composition, 'section', []);
  
  return (
    <Card>
      <CardHeader
        avatar={<TransitionIcon />}
        title="Transition of Care Document"
        subheader={get(composition, 'title', 'Document')}
        action={
          <Box>
            <Button size="small" onClick={handleExpandAll}>
              Expand All
            </Button>
            <Button size="small" onClick={handleCollapseAll}>
              Collapse All
            </Button>
          </Box>
        }
      />
      
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="subtitle2" color="textSecondary">
                Date
              </Typography>
            </Box>
            <Typography variant="body1">
              {moment(get(composition, 'date')).format('MMMM D, YYYY h:mm A')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Status
            </Typography>
            <Chip 
              label={get(composition, 'status', 'unknown')}
              color={get(composition, 'status') === 'final' ? 'success' : 'default'}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" color="textSecondary">
                Patient
              </Typography>
            </Box>
            <Typography variant="body1">
              {get(composition, 'subject.display', 'Unknown Patient')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" color="textSecondary">
                Author
              </Typography>
            </Box>
            {get(composition, 'author', []).map(function(author, index) {
              return (
                <Typography key={index} variant="body1">
                  {get(author, 'display', 'Unknown Author')}
                </Typography>
              );
            })}
          </Grid>
          
          {get(composition, 'custodian') && (
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <BusinessIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" color="textSecondary">
                  Custodian Organization
                </Typography>
              </Box>
              <Typography variant="body1">
                {get(composition, 'custodian.display', 'Unknown Organization')}
              </Typography>
            </Grid>
          )}
          
          {get(composition, 'encounter') && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Related Encounter
              </Typography>
              <Typography variant="body1">
                {get(composition, 'encounter.display', 'Unknown Encounter')}
              </Typography>
            </Grid>
          )}
        </Grid>
        
        <Divider style={{ margin: '24px 0' }} />
        
        <Box>
          <Typography variant="h6" gutterBottom>
            Document Sections ({sections.length})
          </Typography>
          
          {sections.length === 0 ? (
            <Paper variant="outlined" style={{ padding: 16 }}>
              <Typography variant="body1" color="textSecondary" align="center">
                No sections available in this document
              </Typography>
            </Paper>
          ) : (
            sections.map(function(section, index) {
              return renderSection(section, index);
            })
          )}
        </Box>
      </CardContent>
      
      <CardActions>
        <Button 
          startIcon={<BackIcon />}
          onClick={function() { navigate(-1); }}
        >
          Back
        </Button>
        
        <Button 
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print
        </Button>
        
        <Button 
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Download PDF
        </Button>
      </CardActions>
    </Card>
  );
}