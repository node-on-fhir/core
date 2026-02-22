// /imports/ui-fhir/documentReferences/DocumentReferenceDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
  Typography,
  Box,
  Stack
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';

import { DocumentReferences } from '/imports/lib/schemas/SimpleSchemas/DocumentReferences';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

const statusOptions = [
  { code: 'current', display: 'Current' },
  { code: 'superseded', display: 'Superseded' },
  { code: 'entered-in-error', display: 'Entered in Error' }
];

const statusColorMap = {
  'current': 'success',
  'superseded': 'default',
  'entered-in-error': 'error'
};

const docStatusOptions = [
  { code: 'preliminary', display: 'Preliminary' },
  { code: 'final', display: 'Final' },
  { code: 'amended', display: 'Amended' },
  { code: 'entered-in-error', display: 'Entered in Error' }
];

const categoryOptions = [
  { code: 'clinical-note', display: 'Clinical Note' },
  { code: 'consent', display: 'Consent' },
  { code: 'advance-directive', display: 'Advance Directive' },
  { code: 'imaging', display: 'Imaging' },
  { code: 'laboratory', display: 'Laboratory' },
  { code: 'procedure', display: 'Procedure' },
  { code: 'questionnaire', display: 'Questionnaire' },
  { code: 'therapy', display: 'Therapy' }
];

const contentTypeOptions = [
  { code: 'text/plain', display: 'Plain Text' },
  { code: 'text/html', display: 'HTML' },
  { code: 'application/pdf', display: 'PDF' },
  { code: 'image/jpeg', display: 'JPEG Image' },
  { code: 'image/png', display: 'PNG Image' },
  { code: 'application/json', display: 'JSON' },
  { code: 'application/xml', display: 'XML' }
];

function DocumentReferenceDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewDocument = !id || id === 'new';
  const isExistingDocument = id && id !== 'new';

  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to document references
  const isSubscriptionReady = useTracker(function(){
    const handle = Meteor.subscribe('selectedPatient.DocumentReferences');
    return handle.ready();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [documentReference, setDocumentReference] = useState({
    resourceType: "DocumentReference",
    status: "current",
    docStatus: "final",
    type: {
      coding: [{
        system: "http://loinc.org",
        code: "",
        display: ""
      }],
      text: ""
    },
    category: [{
      coding: [{
        system: "http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category",
        code: "clinical-note",
        display: "Clinical Note"
      }]
    }],
    subject: {
      reference: "",
      display: ""
    },
    date: moment().format('YYYY-MM-DDTHH:mm:ss'),
    author: [{
      reference: "",
      display: ""
    }],
    authenticator: {
      reference: "",
      display: ""
    },
    custodian: {
      reference: "",
      display: ""
    },
    relatesTo: [],
    description: "",
    securityLabel: [],
    content: [{
      attachment: {
        contentType: "text/plain",
        url: "",
        title: ""
      }
    }],
    context: {
      encounter: [{
        reference: "",
        display: ""
      }],
      event: [],
      period: {
        start: moment().format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD')
      },
      facilityType: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
          code: "",
          display: ""
        }]
      },
      practiceSetting: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }]
      }
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set patient name and author on component mount for new document references
  useEffect(function() {
    if (isNewDocument) {
      setIsEditing(true);

      let patientName = '';
      let patientReference = '';

      if (selectedPatient) {
        patientName = get(selectedPatient, 'name[0].text', '') ||
                     (get(selectedPatient, 'name[0].given[0]', '') + ' ' + get(selectedPatient, 'name[0].family', '')).trim();
        const patientId = get(selectedPatient, 'id', '');
        patientReference = 'Patient/' + patientId;
      } else if (currentUser) {
        patientName = get(currentUser, 'profile.name.text', '') ||
                     (get(currentUser, 'profile.name.given[0]', '') + ' ' + get(currentUser, 'profile.name.family', '')).trim() ||
                     get(currentUser, 'username', '');
        patientReference = 'Patient/' + get(currentUser, 'profile.patientId', '');
      }

      let authorName = '';
      let authorReference = '';

      if (currentUser) {
        authorName = get(currentUser, 'profile.name.text', '') ||
                    (get(currentUser, 'profile.name.given[0]', '') + ' ' + get(currentUser, 'profile.name.family', '')).trim() ||
                    get(currentUser, 'username', '');
        authorReference = 'Practitioner/' + get(currentUser, '_id', '');
      }

      setDocumentReference(function(prev) {
        return {
          ...prev,
          subject: {
            reference: patientReference,
            display: patientName
          },
          author: [{
            reference: authorReference,
            display: authorName
          }]
        };
      });
    } else {
      setIsEditing(false);
    }
  }, [id, selectedPatient, currentUser]);

  // Load document reference if editing existing
  useEffect(function() {
    if (isExistingDocument) {
      setLoading(true);
      try {
        let result = DocumentReferences.findOne({_id: id});

        if (!result) {
          result = DocumentReferences.findOne({id: id});
        }

        if (result) {
          const documentToSet = {
            ...result,
            type: result.type || {
              coding: [{ system: "http://loinc.org", code: "", display: "" }],
              text: ""
            },
            content: result.content || [{
              attachment: { contentType: "text/plain", url: "", title: "" }
            }]
          };
          setDocumentReference(documentToSet);
        } else {
          console.log('[DocumentReferenceDetail] No document found with id:', id);
        }
      } catch (err) {
        console.error('[DocumentReferenceDetail] Error loading:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedDocumentReference = { ...documentReference };
    set(updatedDocumentReference, path, value);
    setDocumentReference(updatedDocumentReference);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingDocument) {
        await Meteor.callAsync('documentReferences.update', id, documentReference);
        console.log('[DocumentReferenceDetail] Document reference updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('documentReferences.insert', documentReference);
        console.log('[DocumentReferenceDetail] Document reference created with ID:', newId);
        navigate('/document-references');
      }
    } catch (err) {
      console.error('[DocumentReferenceDetail] Error saving:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingDocument) {
      setIsEditing(false);
      setError(null);
      const existingDoc = DocumentReferences.findOne({ _id: id });
      if (existingDoc) {
        setDocumentReference({
          ...existingDoc,
          type: existingDoc.type || {
            coding: [{ system: "http://loinc.org", code: "", display: "" }],
            text: ""
          },
          content: existingDoc.content || [{
            attachment: { contentType: "text/plain", url: "", title: "" }
          }]
        });
      }
    } else {
      navigate('/document-references');
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingDocument) return;

    if (window.confirm('Are you sure you want to delete this document reference?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('documentReferences.remove', id);
        console.log('[DocumentReferenceDetail] Document reference deleted successfully');
        navigate('/document-references');
      } catch (err) {
        console.error('[DocumentReferenceDetail] Error deleting:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle patient search
  function handleSearchUser() {
    console.log('[DocumentReferenceDetail] Opening patient search dialog...');
  }

  // Build the header title
  let headerTitle = 'New Document Reference';
  if (isExistingDocument) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {!isNewDocument && (
          <Tooltip title="Preview">
            <IconButton
              onClick={() => setSearchParams({ view: 'page' })}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {!isNewDocument && (
          <Tooltip title="Form">
            <IconButton
              onClick={() => setSearchParams({ view: 'form' })}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {!isNewDocument && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {!isNewDocument && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDelete}
              disabled={!isEditing}
              sx={{ color: isEditing ? 'error.main' : 'text.disabled' }}
            >
              <DeleteIcon />
              <Typography sx={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                borderWidth: 0
              }}>Delete</Typography>
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView() {
    return (
      <>
        <Stack spacing={3}>
          <Typography variant="h6">Document Information</Typography>

          <TextField
            id="subjectDisplay"
            fullWidth
            label="Patient Name"
            value={get(documentReference, 'subject.display', '')}
            helperText={get(documentReference, 'subject.reference', '') || 'Patient reference will be assigned'}
            disabled
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Search for patient">
                    <IconButton
                      onClick={handleSearchUser}
                      edge="end"
                      disabled={!isEditing}
                    >
                      <SearchIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Author Name"
            value={get(documentReference, 'author[0].display', '')}
            onChange={(e) => handleChange('author[0].display', e.target.value)}
            helperText={get(documentReference, 'author[0].reference', '') || 'Author reference will be assigned'}
            disabled={!isEditing}
          />

          <TextField
            id="contentTitleInput"
            fullWidth
            label="Document Title"
            value={get(documentReference, 'content[0].attachment.title', '')}
            onChange={(e) => handleChange('content[0].attachment.title', e.target.value)}
            helperText="Title of the document"
            disabled={!isEditing}
          />

          <TextField
            id="descriptionInput"
            fullWidth
            label="Document Description"
            value={get(documentReference, 'description', '')}
            onChange={(e) => handleChange('description', e.target.value)}
            multiline
            rows={2}
            helperText="Brief description of the document"
            disabled={!isEditing}
          />

          <Divider />
          <Typography variant="h6">Classification</Typography>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Status</InputLabel>
              <Select
                id="statusSelect"
                value={get(documentReference, 'status', 'current')}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                {statusOptions.map(function(option) {
                  return (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Document Status</InputLabel>
              <Select
                value={get(documentReference, 'docStatus', 'final')}
                onChange={(e) => handleChange('docStatus', e.target.value)}
                label="Document Status"
              >
                {docStatusOptions.map(function(option) {
                  return (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Stack>

          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Category</InputLabel>
            <Select
              value={get(documentReference, 'category[0].coding[0].code', 'clinical-note')}
              onChange={(e) => {
                const option = categoryOptions.find(function(o) { return o.code === e.target.value; });
                if (option) {
                  handleChange('category[0].coding[0].code', option.code);
                  handleChange('category[0].coding[0].display', option.display);
                }
              }}
              label="Category"
            >
              {categoryOptions.map(function(option) {
                return (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={2}>
            <TextField
              id="typeInput"
              fullWidth
              label="LOINC Code"
              value={get(documentReference, 'type.coding[0].code', '')}
              onChange={(e) => handleChange('type.coding[0].code', e.target.value)}
              helperText="LOINC code for document type"
              disabled={!isEditing}
            />

            <TextField
              id="typeDisplayInput"
              fullWidth
              label="Document Type"
              value={get(documentReference, 'type.coding[0].display', '')}
              onChange={(e) => {
                handleChange('type.coding[0].display', e.target.value);
                handleChange('type.text', e.target.value);
              }}
              helperText="Human-readable document type"
              disabled={!isEditing}
            />
          </Stack>

          <Divider />
          <Typography variant="h6">Content</Typography>

          <TextField
            id="createdInput"
            fullWidth
            type="datetime-local"
            label="Document Date"
            value={moment(get(documentReference, 'date', '')).format('YYYY-MM-DDTHH:mm')}
            onChange={(e) => handleChange('date', e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Content Type</InputLabel>
              <Select
                id="contentTypeInput"
                value={get(documentReference, 'content[0].attachment.contentType', 'text/plain')}
                onChange={(e) => handleChange('content[0].attachment.contentType', e.target.value)}
                label="Content Type"
              >
                {contentTypeOptions.map(function(option) {
                  return (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <TextField
              id="contentSizeInput"
              fullWidth
              type="number"
              label="Document Size (bytes)"
              value={get(documentReference, 'content[0].attachment.size', '')}
              onChange={(e) => handleChange('content[0].attachment.size', parseInt(e.target.value))}
              helperText="Size of the document in bytes"
              disabled={!isEditing}
            />
          </Stack>

          <TextField
            id="contentUrlInput"
            fullWidth
            label="Document URL"
            value={get(documentReference, 'content[0].attachment.url', '')}
            onChange={(e) => handleChange('content[0].attachment.url', e.target.value)}
            helperText="URL where the document can be accessed"
            disabled={!isEditing}
          />

          <TextField
            id="notesTextarea"
            fullWidth
            multiline
            rows={4}
            label="Notes"
            value={get(documentReference, 'content[0].attachment.data', '')}
            onChange={(e) => handleChange('content[0].attachment.data', e.target.value)}
            helperText="Additional notes or base64 encoded document content"
            disabled={!isEditing}
          />

          <Divider />
          <Typography variant="h6">Context</Typography>

          <TextField
            fullWidth
            label="Custodian Organization"
            value={get(documentReference, 'custodian.display', '')}
            onChange={(e) => handleChange('custodian.display', e.target.value)}
            helperText="Organization maintaining the document"
            disabled={!isEditing}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              type="date"
              label="Period Start"
              value={moment(get(documentReference, 'context.period.start', '')).format('YYYY-MM-DD')}
              onChange={(e) => handleChange('context.period.start', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />

            <TextField
              fullWidth
              type="date"
              label="Period End"
              value={moment(get(documentReference, 'context.period.end', '')).format('YYYY-MM-DD')}
              onChange={(e) => handleChange('context.period.end', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
          </Stack>
        </Stack>

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveDocumentReferenceButton"
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function tryDecodeBase64(value) {
    if (!value) return '';
    try {
      return atob(value);
    } catch (e) {
      console.warn('[DocumentReferenceDetail] Could not base64 decode attachment.data:', e.message);
      return value;
    }
  }

  function renderPreviewView() {
    const documentTitle = get(documentReference, 'content[0].attachment.title', '') || 'Untitled Document';
    const statusValue = get(documentReference, 'status', 'current');
    const statusLabel = get(statusOptions.find(function(opt) { return opt.code === statusValue; }), 'display', statusValue);
    const statusColor = get(statusColorMap, statusValue, 'default');
    const docStatusValue = get(documentReference, 'docStatus', '');
    const typeDisplay = get(documentReference, 'type.text', '') || get(documentReference, 'type.coding[0].display', '');
    const typeCode = get(documentReference, 'type.coding[0].code', '');
    const categoryDisplay = get(documentReference, 'category[0].coding[0].display', '');
    const description = get(documentReference, 'description', '');
    const documentDate = get(documentReference, 'date', '');
    const subjectDisplay = get(documentReference, 'subject.display', '');
    const subjectReference = get(documentReference, 'subject.reference', '');
    const authorDisplay = get(documentReference, 'author[0].display', '');
    const authorReference = get(documentReference, 'author[0].reference', '');
    const contentType = get(documentReference, 'content[0].attachment.contentType', '');
    const contentUrl = get(documentReference, 'content[0].attachment.url', '');
    const contentSize = get(documentReference, 'content[0].attachment.size', '');
    const custodianDisplay = get(documentReference, 'custodian.display', '');
    const noteTextRaw = get(documentReference, 'content[0].attachment.data', '');
    const noteText = tryDecodeBase64(noteTextRaw);

    const formattedDate = documentDate ? moment(documentDate).format('MMMM D, YYYY [at] h:mm A') : '';

    return (
      <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
        {/* Document title + status chip */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            {documentTitle}
          </Typography>
          <Chip label={statusLabel} color={statusColor} size="small" />
        </Box>

        {typeDisplay && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            {typeDisplay}{typeCode ? ' (' + typeCode + ')' : ''}
          </Typography>
        )}

        <Divider />

        {/* Two-column metadata */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
          <Box>
            {categoryDisplay && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {categoryDisplay}
                </Typography>
              </>
            )}
            {docStatusValue && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Document Status
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {docStatusValue}
                </Typography>
              </>
            )}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {formattedDate && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formattedDate}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Subject + Author section */}
        {(subjectDisplay || authorDisplay) && (
          <>
            <Box sx={{ py: 2 }}>
              <Stack direction="row" spacing={4}>
                {subjectDisplay && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Patient
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {subjectDisplay}
                    </Typography>
                    {subjectReference && (
                      <Typography variant="caption" color="text.secondary">
                        {subjectReference}
                      </Typography>
                    )}
                  </Box>
                )}
                {authorDisplay && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Author
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {authorDisplay}
                    </Typography>
                    {authorReference && (
                      <Typography variant="caption" color="text.secondary">
                        {authorReference}
                      </Typography>
                    )}
                  </Box>
                )}
              </Stack>
            </Box>
            <Divider />
          </>
        )}

        {/* Content details */}
        {(contentUrl || contentType || contentSize) && (
          <>
            <Box sx={{ py: 2 }}>
              <Stack direction="row" spacing={4}>
                {contentType && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Content Type
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {contentType}
                    </Typography>
                  </Box>
                )}
                {contentSize && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Size
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {contentSize} bytes
                    </Typography>
                  </Box>
                )}
              </Stack>
              {contentUrl && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="overline" color="text.secondary">
                    URL
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>
                    {contentUrl}
                  </Typography>
                </Box>
              )}
            </Box>
            <Divider />
          </>
        )}

        {/* Custodian */}
        {custodianDisplay && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Custodian
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {custodianDisplay}
              </Typography>
            </Box>
            <Divider />
          </>
        )}

        {/* Description / Notes */}
        <Box sx={{ py: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Description
          </Typography>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
              minHeight: '60px'
            }}
          >
            {description || 'No description provided.'}
          </Typography>
        </Box>

        {noteText && (
          <>
            <Divider />
            <Box sx={{ py: 3 }}>
              <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Notes
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.8,
                  minHeight: '60px'
                }}
              >
                {noteText}
              </Typography>
            </Box>
          </>
        )}

        <Divider />

        {/* Footer with document ID */}
        {isExistingDocument && (
          <Box sx={{ pt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Document Reference ID: {id}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Container id="documentReferenceDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          {viewMode === 'form' && renderFormView()}
          {viewMode === 'page' && renderPreviewView()}
        </CardContent>
      </Card>
    </Container>
  );
}

export default DocumentReferenceDetail;
