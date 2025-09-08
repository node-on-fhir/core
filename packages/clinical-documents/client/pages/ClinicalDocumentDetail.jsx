// packages/clinical-documents/client/pages/ClinicalDocumentDetail.jsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  Divider,
  Grid,
  Box,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';

import { 
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  History as HistoryIcon
} from '@mui/icons-material';

import { get } from 'lodash';
import moment from 'moment';
import { ClinicalDocuments } from '../../lib/collections/ClinicalDocuments';
import { DocumentRevisions } from '../../lib/collections/DocumentRevisions';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 20 }}>
      {value === index && children}
    </div>
  );
}

export default function ClinicalDocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Subscribe to document and its revisions
  const { document, revisions, isLoading } = useTracker(() => {
    const docHandle = Meteor.subscribe('clinical-documents.single', id);
    const doc = ClinicalDocuments.findOne(id);
    
    let revisionData = [];
    if (doc) {
      const identifier = ClinicalDocuments.getIdentifier(doc);
      if (identifier) {
        const revHandle = Meteor.subscribe('document-revisions.byIdentifier', identifier);
        revisionData = DocumentRevisions.getAllRevisions(identifier);
      }
    }

    return {
      document: doc,
      revisions: revisionData,
      isLoading: !docHandle.ready()
    };
  }, [id]);

  if (isLoading) {
    return <Typography style={{ padding: 20 }}>Loading document...</Typography>;
  }

  if (!document) {
    return (
      <Card style={{ margin: 20 }}>
        <CardContent>
          <Typography>Document not found</Typography>
          <Button onClick={() => navigate('/clinical-documents')}>
            Back to Documents
          </Button>
        </CardContent>
      </Card>
    );
  }

  const composition = ClinicalDocuments.getComposition(document);
  const sections = ClinicalDocuments.getSections(document);
  const authors = ClinicalDocuments.getAuthors(document);
  const identifier = ClinicalDocuments.getIdentifier(document);

  const renderMetadata = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" color="textSecondary">Document ID</Typography>
        <Typography variant="body1">{get(identifier, 'value', document._id)}</Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" color="textSecondary">Status</Typography>
        <Chip 
          label={ClinicalDocuments.getStatus(document)} 
          color={get(composition, 'status') === 'final' ? 'success' : 'default'}
          size="small"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" color="textSecondary">Document Date</Typography>
        <Typography variant="body1">
          {moment(ClinicalDocuments.getDocumentDate(document)).format('MMMM DD, YYYY HH:mm')}
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" color="textSecondary">Patient</Typography>
        <Typography variant="body1">
          {ClinicalDocuments.getPatientId(document) || 'Not specified'}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="textSecondary">Authors</Typography>
        {authors.length > 0 ? (
          authors.map((author, index) => (
            <Chip 
              key={index} 
              label={get(author, 'display', get(author, 'reference', 'Unknown'))}
              size="small"
              style={{ marginRight: 8, marginTop: 4 }}
            />
          ))
        ) : (
          <Typography variant="body1">No authors specified</Typography>
        )}
      </Grid>
    </Grid>
  );

  const renderSections = () => (
    <Box>
      {sections.length > 0 ? (
        sections.map((section, index) => (
          <Paper key={index} style={{ padding: 16, marginBottom: 16 }}>
            <Typography variant="h6" gutterBottom>
              {get(section, 'title', `Section ${index + 1}`)}
            </Typography>
            <Divider style={{ marginBottom: 12 }} />
            
            {get(section, 'text.div') ? (
              <div dangerouslySetInnerHTML={{ __html: get(section, 'text.div') }} />
            ) : (
              <Typography color="textSecondary">
                No narrative content available
              </Typography>
            )}

            {get(section, 'entry', []).length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  References: {get(section, 'entry', []).length} entries
                </Typography>
              </Box>
            )}
          </Paper>
        ))
      ) : (
        <Typography color="textSecondary">No sections in this document</Typography>
      )}
    </Box>
  );

  const renderRevisions = () => (
    <List>
      {revisions.length > 0 ? (
        revisions.map((revision) => (
          <ListItem key={revision._id} divider>
            <ListItemText
              primary={`Revision ${revision.revision} - ${revision.action}`}
              secondary={
                <>
                  <Typography component="span" variant="body2">
                    {moment(get(revision, 'meta.createdAt')).format('MMMM DD, YYYY HH:mm')}
                  </Typography>
                  {get(revision, 'meta.reason') && (
                    <Typography component="span" variant="body2">
                      {` - ${get(revision, 'meta.reason')}`}
                    </Typography>
                  )}
                </>
              }
            />
          </ListItem>
        ))
      ) : (
        <Typography color="textSecondary" style={{ padding: 16 }}>
          No revision history available
        </Typography>
      )}
    </List>
  );

  return (
    <div id="clinicalDocumentDetailPage" style={{ padding: 20 }}>
      <Card>
        <CardHeader
          avatar={
            <IconButton onClick={() => navigate('/clinical-documents')}>
              <BackIcon />
            </IconButton>
          }
          title={ClinicalDocuments.getTitle(document)}
          subheader={`Document Type: ${get(composition, 'type.coding[0].display', 'Clinical Document')}`}
          action={
            <>
              <IconButton onClick={() => window.print()}>
                <PrintIcon />
              </IconButton>
              <IconButton onClick={() => navigate(`/clinical-documents/${id}/edit`)}>
                <EditIcon />
              </IconButton>
            </>
          }
        />
        
        <CardContent>
          <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
            <Tab label="Document" />
            <Tab label="Metadata" />
            <Tab label="Revisions" icon={<HistoryIcon />} />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            {renderSections()}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {renderMetadata()}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {renderRevisions()}
          </TabPanel>
        </CardContent>
      </Card>
    </div>
  );
}