// packages/healthcare-surveys/client/components/reports/DiagnosticReportViewer.jsx

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link
} from '@mui/material';
import { get } from 'lodash';
import moment from 'moment';

export default function DiagnosticReportViewer(props) {
  const { report, showResults = true, showAttachments = true } = props;
  
  if (!report) {
    return (
      <Typography variant="body1" color="textSecondary">
        No diagnostic report data available
      </Typography>
    );
  }
  
  const getStatusColor = function() {
    const status = get(report, 'status', '');
    const statusColors = {
      'final': 'success',
      'preliminary': 'warning',
      'partial': 'warning',
      'amended': 'info',
      'corrected': 'info',
      'appended': 'info',
      'cancelled': 'error',
      'entered-in-error': 'error',
      'unknown': 'default'
    };
    return statusColors[status] || 'default';
  };
  
  const formatCategory = function(category) {
    const code = get(category, 'coding[0].code', '');
    const display = get(category, 'coding[0].display', category.text || code);
    return display;
  };
  
  return (
    <Box>
      <Card>
        <CardHeader
          title={get(report, 'code.coding[0].display', 'Diagnostic Report')}
          subheader={`Code: ${get(report, 'code.coding[0].code', 'Unknown')}`}
          action={
            <Chip 
              label={get(report, 'status', 'unknown')} 
              color={getStatusColor()} 
            />
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Subject</Typography>
              <Typography variant="body1">
                {get(report, 'subject.display', get(report, 'subject.reference', 'Unknown'))}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Encounter</Typography>
              <Typography variant="body1">
                {get(report, 'encounter.display', get(report, 'encounter.reference', 'Not specified'))}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Effective Date</Typography>
              <Typography variant="body1">
                {get(report, 'effectiveDateTime') ? 
                  moment(report.effectiveDateTime).format('MMM D, YYYY HH:mm') :
                  get(report, 'effectivePeriod.start') ?
                    `${moment(report.effectivePeriod.start).format('MMM D, YYYY')} - 
                     ${moment(get(report, 'effectivePeriod.end', report.effectivePeriod.start)).format('MMM D, YYYY')}` :
                    'Not specified'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Issued</Typography>
              <Typography variant="body1">
                {get(report, 'issued') ? 
                  moment(report.issued).format('MMM D, YYYY HH:mm') : 
                  'Not specified'}
              </Typography>
            </Grid>
            
            {get(report, 'category', []).length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Categories</Typography>
                <Box sx={{ mt: 1 }}>
                  {report.category.map((cat, index) => (
                    <Chip
                      key={index}
                      label={formatCategory(cat)}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              </Grid>
            )}
            
            {get(report, 'performer', []).length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Performers</Typography>
                <List dense>
                  {report.performer.map((performer, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={get(performer, 'display', get(performer, 'reference', 'Unknown'))}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
      
      {showResults && get(report, 'result', []).length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardHeader title={`Results (${report.result.length})`} />
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Result</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Reference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.result.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {get(result, 'display', 'Result ' + (index + 1))}
                      </TableCell>
                      <TableCell>
                        {result.reference?.includes('Observation') ? 'Observation' : 'Other'}
                      </TableCell>
                      <TableCell>
                        {get(result, 'reference', '-')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
      
      {showAttachments && get(report, 'presentedForm', []).length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardHeader title={`Attachments (${report.presentedForm.length})`} />
          <CardContent>
            <List>
              {report.presentedForm.map((attachment, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={get(attachment, 'title', `Attachment ${index + 1}`)}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Type: {get(attachment, 'contentType', 'Unknown')}
                          </Typography>
                          {get(attachment, 'size') && (
                            <Typography variant="caption" display="block">
                              Size: {(attachment.size / 1024).toFixed(2)} KB
                            </Typography>
                          )}
                          {get(attachment, 'url') && (
                            <Link href={attachment.url} target="_blank" rel="noopener">
                              View attachment
                            </Link>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < report.presentedForm.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
      
      {get(report, 'conclusion') && (
        <Card sx={{ mt: 3 }}>
          <CardHeader title="Conclusion" />
          <CardContent>
            <Typography variant="body1">
              {report.conclusion}
            </Typography>
            {get(report, 'conclusionCode', []).length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Conclusion Codes
                </Typography>
                {report.conclusionCode.map((code, index) => (
                  <Chip
                    key={index}
                    label={get(code, 'coding[0].display', get(code, 'text', 'Code'))}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}