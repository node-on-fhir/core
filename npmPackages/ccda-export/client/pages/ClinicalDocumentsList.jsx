// packages/clinical-documents/client/pages/ClinicalDocumentsList.jsx

import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { 
  Card,
  CardContent,
  CardHeader,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  Fab
} from '@mui/material';

import { 
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon
} from '@mui/icons-material';

import { get } from 'lodash';
import moment from 'moment';
import { ClinicalDocuments } from '../../lib/collections/ClinicalDocuments';

export default function ClinicalDocumentsList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Subscribe to clinical documents
  const { documents, isLoading } = useTracker(() => {
    const handle = Meteor.subscribe('clinical-documents.all');
    
    let query = {};
    if (searchTerm) {
      query.$or = [
        { 'entry.0.resource.title': { $regex: searchTerm, $options: 'i' } },
        { 'identifier.value': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    return {
      documents: ClinicalDocuments.find(query, {
        sort: { 'meta.createdAt': -1 }
      }).fetch(),
      isLoading: !handle.ready()
    };
  }, [searchTerm]);

  const handleView = (documentId) => {
    navigate(`/clinical-documents/${documentId}`);
  };

  const handleNew = () => {
    navigate('/clinical-documents/new');
  };

  const formatDate = (date) => {
    return date ? moment(date).format('YYYY-MM-DD HH:mm') : '-';
  };

  return (
    <div id="clinicalDocumentsPage" style={{ padding: 20 }}>
      <Card>
        <CardHeader 
          title="Clinical Documents"
          subheader="FHIR Clinical Document Management"
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleNew}
            >
              New Document
            </Button>
          }
        />
        <CardContent>
          <TextField
            fullWidth
            label="Search documents..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: 20 }}
          />

          {isLoading ? (
            <Typography>Loading documents...</Typography>
          ) : documents.length === 0 ? (
            <Typography>No clinical documents found.</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Document ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((doc) => {
                  const composition = ClinicalDocuments.getComposition(doc);
                  const identifier = ClinicalDocuments.getIdentifier(doc);
                  
                  return (
                    <TableRow key={doc._id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {ClinicalDocuments.getTitle(doc)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {get(identifier, 'value', doc._id)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {ClinicalDocuments.getStatus(doc)}
                      </TableCell>
                      <TableCell>
                        {formatDate(ClinicalDocuments.getDocumentDate(doc))}
                      </TableCell>
                      <TableCell>
                        {ClinicalDocuments.getPatientId(doc) || '-'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleView(doc._id)}
                          title="View Document"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/clinical-documents/${doc._id}/edit`)}
                          title="Edit Document"
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Fab
        color="primary"
        aria-label="add"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24
        }}
        onClick={handleNew}
      >
        <AddIcon />
      </Fab>
    </div>
  );
}