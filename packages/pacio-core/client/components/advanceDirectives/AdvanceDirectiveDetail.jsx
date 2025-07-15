// /packages/pacio-core/client/components/advanceDirectives/AdvanceDirectiveDetail.jsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Button,
  Chip,
  Box,
  Grid,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  Error as ErrorIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { get } from 'lodash';
import moment from 'moment';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { PdfViewer } from '/imports/ui-fhir/DocumentReferences/PdfViewer';
import { AdvanceDirectiveRevoke } from './AdvanceDirectiveRevoke';
import { AdvanceDirectives } from '/imports/lib/schemas/SimpleSchemas/AdvanceDirectives';

export default function AdvanceDirectiveDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showRevoke, setShowRevoke] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  
  const { directive, loading } = useTracker(function() {
    const sub = Meteor.subscribe('pacio.advanceDirectives', null, id);
    return {
      directive: AdvanceDirectives.findOne(id),
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
  
  if (!directive) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Advance Directive not found</Typography>
        </CardContent>
        <CardActions>
          <Button onClick={function() { navigate(-1); }}>
            Back
          </Button>
        </CardActions>
      </Card>
    );
  }
  
  const status = get(directive, 'status', 'unknown');
  const isRevoked = status === 'entered-in-error';
  const pdfUrl = get(directive, 'content[0].attachment.url');
  const hasPdf = !!pdfUrl;
  
  function handleRevoke() {
    setShowRevoke(true);
  }
  
  function handleRevokeSuccess() {
    // Refresh the directive data
    Session.set('mainAppDialogJson', {
      title: 'Success',
      message: 'Advance Directive has been revoked.'
    });
    setShowRevoke(false);
  }
  
  function handleViewPdf() {
    setShowPdf(true);
  }
  
  function handleDownloadPdf() {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = get(directive, 'content[0].attachment.title', 'advance-directive.pdf');
    link.click();
  }
  
  function renderStatus() {
    let chipColor = 'default';
    let icon = null;
    
    switch (status) {
      case 'active':
      case 'completed':
        chipColor = 'success';
        break;
      case 'superseded':
        chipColor = 'warning';
        break;
      case 'entered-in-error':
        chipColor = 'error';
        icon = <ErrorIcon />;
        break;
    }
    
    return (
      <Chip 
        label={status} 
        color={chipColor}
        icon={icon}
        style={{ marginBottom: '1rem' }}
      />
    );
  }
  
  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h5" gutterBottom>
              Advance Directive Details
            </Typography>
            {renderStatus()}
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Type
              </Typography>
              <Typography variant="body1" gutterBottom>
                {get(directive, 'type.coding[0].display', 'Unknown')}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Date
              </Typography>
              <Typography variant="body1" gutterBottom>
                {moment(get(directive, 'date')).format('MMMM D, YYYY')}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Version
              </Typography>
              <Typography variant="body1" gutterBottom>
                {get(directive, 'versionNumber', '1.0')}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Patient
              </Typography>
              <Typography variant="body1" gutterBottom>
                {get(directive, 'subject.display', 'Unknown Patient')}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">
                Authors
              </Typography>
              {get(directive, 'author', []).map(function(author, index) {
                return (
                  <Typography key={index} variant="body1">
                    {get(author, 'display', 'Unknown Author')}
                  </Typography>
                );
              })}
            </Grid>
            
            {get(directive, 'description') && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {get(directive, 'description')}
                </Typography>
              </Grid>
            )}
            
            {get(directive, 'note') && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Notes
                </Typography>
                {get(directive, 'note', []).map(function(note, index) {
                  return (
                    <Typography key={index} variant="body2" paragraph>
                      {get(note, 'text')}
                    </Typography>
                  );
                })}
              </Grid>
            )}
          </Grid>
          
          {hasPdf && showPdf && (
            <>
              <Divider style={{ margin: '20px 0' }} />
              <PdfViewer 
                url={pdfUrl}
                watermark={isRevoked ? 'REVOKED' : null}
                documentTitle={get(directive, 'content[0].attachment.title', 'Advance Directive')}
                height="500px"
              />
            </>
          )}
        </CardContent>
        
        <CardActions>
          <Button 
            startIcon={<BackIcon />}
            onClick={function() { navigate(-1); }}
          >
            Back
          </Button>
          
          {hasPdf && (
            <>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<ViewIcon />}
                onClick={handleViewPdf}
              >
                {showPdf ? 'Hide PDF' : 'View PDF'}
              </Button>
              
              <Button 
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadPdf}
              >
                Download PDF
              </Button>
            </>
          )}
          
          {!isRevoked && (
            <Button 
              variant="contained" 
              color="error"
              onClick={handleRevoke}
            >
              Revoke Directive
            </Button>
          )}
        </CardActions>
      </Card>
      
      <AdvanceDirectiveRevoke
        open={showRevoke}
        onClose={function() { setShowRevoke(false); }}
        advanceDirective={directive}
        onSuccess={handleRevokeSuccess}
      />
    </>
  );
}