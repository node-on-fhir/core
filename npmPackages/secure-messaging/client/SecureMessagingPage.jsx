// packages/secure-messaging/client/SecureMessagingPage.jsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent,
  Grid,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Badge,
  Divider,
  Paper,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
  Alert,
  AlertTitle,
  Stack,
  FormControlLabel,
  Checkbox,
  Select,
  FormControl,
  InputLabel,
  Autocomplete
} from '@mui/material';
import { useTracker } from 'meteor/react-meteor-data';
import { useSearchParams } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';
import {
  Mail as MailIcon,
  Send as SendIcon,
  AttachFile as AttachIcon,
  Lock as LockIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Security as SecurityIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon
} from '@mui/icons-material';

// Sample message data for demonstration
const SAMPLE_MESSAGES = {
  direct: [
    {
      id: 'DM001',
      from: 'dr.smith@hospital-a.direct.org',
      to: 'dr.jones@clinic-b.direct.org',
      subject: 'Patient Referral - John Doe #12345',
      timestamp: new Date('2024-01-15T10:30:00'),
      status: 'delivered',
      mdn: true,
      encrypted: true,
      attachments: ['CCD_JohnDoe.xml'],
      body: 'Please find attached the continuity of care document for patient John Doe...'
    },
    {
      id: 'DM002',
      from: 'lab@diagnostics.direct.org',
      to: 'dr.jones@clinic-b.direct.org',
      subject: 'Lab Results Ready - Patient #67890',
      timestamp: new Date('2024-01-14T14:15:00'),
      status: 'read',
      mdn: true,
      encrypted: true,
      attachments: ['LabReport_67890.pdf'],
      body: 'Laboratory results are now available for your patient...'
    }
  ],
  patient: [
    {
      id: 'PM001',
      from: 'Jane Smith (Patient)',
      to: 'Dr. Jones',
      subject: 'Question about medication',
      timestamp: new Date('2024-01-15T09:00:00'),
      status: 'unread',
      thread: 3,
      body: 'I have a question about the new medication you prescribed...'
    },
    {
      id: 'PM002',
      from: 'Dr. Jones',
      to: 'Jane Smith (Patient)',
      subject: 'RE: Follow-up appointment',
      timestamp: new Date('2024-01-14T16:30:00'),
      status: 'read',
      thread: 2,
      body: 'Your test results look good. Let\'s schedule a follow-up...'
    }
  ]
};

// Direct address validation pattern
const DIRECT_ADDRESS_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.direct\.[a-zA-Z]{2,}$/;

// Honeycomb theme hook
let useAppTheme;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
});

export default function SecureMessagingPage(props) {
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const hoverBgColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';

  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(props.defaultTab === 'direct' ? 1 : props.defaultTab === 'patient' ? 2 : 0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Tri-state SMTP relay configuration: null = checking, true/false = result
  const [smtpConfigured, setSmtpConfigured] = useState(null);

  // Compose form state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeEncrypted, setComposeEncrypted] = useState(true);
  const [composeMDN, setComposeMDN] = useState(true);
  const [attachments, setAttachments] = useState([]);

  // Flat lookup of every sample message by id (across direct + patient).
  const messagesById = {};
  [...SAMPLE_MESSAGES.direct, ...SAMPLE_MESSAGES.patient].forEach(function(m) {
    messagesById[m.id] = m;
  });

  // Check whether the SMTP relay is configured (server-side, settings-gated).
  useEffect(function() {
    (async function() {
      try {
        const result = await Meteor.rpc('secureMessaging.checkSmtpRelay');
        setSmtpConfigured(get(result, 'configured', false));
      } catch (error) {
        console.warn('[SecureMessagingPage] Error checking SMTP relay:', error.reason);
        setSmtpConfigured(false);
      }
    })();
  }, []);

  // Deep-link: keep selectedMessage in sync with the ?message=ID query param.
  useEffect(function() {
    const messageId = searchParams.get('message');
    if (messageId && messagesById[messageId]) {
      setSelectedMessage(messagesById[messageId]);
      setComposeOpen(false);
    } else if (!messageId) {
      setSelectedMessage(null);
    }
  }, [searchParams]);

  const handleSelectMessage = (message) => {
    setComposeOpen(false);
    setSearchParams({ message: message.id });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSelectedMessage(null);
    setSearchParams({});
  };

  const handleCompose = () => {
    setComposeOpen(true);
    setSelectedMessage(null);
    setSearchParams({});
  };

  const handleSend = async () => {
    const messageData = {
      to: composeTo,
      subject: composeSubject,
      body: composeBody,
      encrypted: composeEncrypted,
      requestMDN: composeMDN,
      attachments: attachments,
      type: activeTab === 1 ? 'direct' : 'patient'
    };

    try {
      const result = await Meteor.rpc('secureMessaging.send', { messageData: messageData });
      console.log('Message sent:', result);
      setComposeOpen(false);
      // Reset form
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setAttachments([]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Trigger a client-side file download from in-memory content.
  const downloadBlob = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Build a quoted-original block for reply/forward bodies.
  const quoteOriginal = (message) => {
    return '\n\n----- Original Message -----\n' +
      'On ' + message.timestamp.toLocaleString() + ', ' + message.from + ' wrote:\n' +
      message.body;
  };

  const handleReply = (message) => {
    setComposeTo(message.from);
    setComposeSubject(message.subject.startsWith('RE: ') ? message.subject : 'RE: ' + message.subject);
    setComposeBody(quoteOriginal(message));
    setAttachments([]);
    setSelectedMessage(null);
    setComposeOpen(true);
    setSearchParams({});
  };

  const handleForward = (message) => {
    setComposeTo('');
    setComposeSubject(message.subject.startsWith('FW: ') ? message.subject : 'FW: ' + message.subject);
    setComposeBody(quoteOriginal(message));
    setAttachments(message.attachments || []);
    setSelectedMessage(null);
    setComposeOpen(true);
    setSearchParams({});
  };

  // Download the whole message as an .eml-style text file.
  const handleDownloadMessage = (message) => {
    const lines = [
      'From: ' + message.from,
      'To: ' + message.to,
      'Subject: ' + message.subject,
      'Date: ' + message.timestamp.toUTCString(),
      'X-Encrypted: ' + (message.encrypted ? 'S/MIME' : 'none'),
      message.attachments && message.attachments.length ? 'X-Attachments: ' + message.attachments.join(', ') : null,
      '',
      message.body,
      ''
    ].filter(function(line) { return line !== null; });
    downloadBlob(lines.join('\r\n'), message.id + '.eml', 'message/rfc822');
  };

  // Download a (representative) attachment. Sample messages carry only filenames,
  // so we synthesize content matching the file extension for the demo.
  const handleDownloadAttachment = (filename, message) => {
    const lower = (filename || '').toLowerCase();
    if (lower.endsWith('.xml')) {
      const subject = message ? message.subject : '';
      const generated = new Date().toISOString();
      const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<ClinicalDocument xmlns="urn:hl7-org:v3">\n' +
        '  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>\n' +
        '  <title>' + subject + '</title>\n' +
        '  <effectiveTime value="' + generated + '"/>\n' +
        '  <component>\n' +
        '    <!-- Representative continuity-of-care content for: ' + filename + ' -->\n' +
        '  </component>\n' +
        '</ClinicalDocument>\n';
      downloadBlob(xml, filename, 'application/xml');
    } else {
      const stub = 'Attachment: ' + filename + '\n' +
        (message ? 'Message: ' + message.subject + '\n' : '') +
        '\n(Representative content generated for connectathon demonstration.)\n';
      downloadBlob(stub, filename + '.txt', 'text/plain');
    }
  };

  const getMessages = () => {
    const messageType = activeTab === 1 ? 'direct' : activeTab === 2 ? 'patient' : 'all';
    let messages = messageType === 'all' 
      ? [...SAMPLE_MESSAGES.direct, ...SAMPLE_MESSAGES.patient]
      : SAMPLE_MESSAGES[messageType];

    // Apply filters
    if (searchTerm) {
      messages = messages.filter(m => 
        m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.from.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== 'all') {
      messages = messages.filter(m => m.status === filterStatus);
    }

    return messages.sort((a, b) => b.timestamp - a.timestamp);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered':
      case 'read':
        return <CheckIcon fontSize="small" color="success" />;
      case 'pending':
        return <PendingIcon fontSize="small" color="warning" />;
      case 'failed':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return <MailIcon fontSize="small" />;
    }
  };

  const formatTimestamp = (date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Box sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with Tabs */}
      <Paper sx={{
        borderRadius: 0,
        bgcolor: cardBgColor,
        color: cardTextColor,
        '& .MuiTab-root': { color: secondaryTextColor },
        '& .MuiTab-root.Mui-selected': { color: isDark ? '#90caf9' : 'primary.main' },
        '& .MuiTabs-indicator': { backgroundColor: isDark ? '#90caf9' : 'primary.main' }
      }}>
        <Box sx={{ px: 3, pt: 2 }}>
          <Typography variant="h5" gutterBottom>
            Secure Messaging - ONC §170.315(e)(2) & §170.315(h)(1)
          </Typography>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="All Messages" icon={<Badge badgeContent={5} color="primary"><MailIcon /></Badge>} />
            <Tab label="Direct Project" icon={<SecurityIcon />} />
            <Tab label="Patient Portal" icon={<PersonIcon />} />
          </Tabs>
        </Box>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* Message List (Left Panel) */}
          <Grid item xs={12} md={4} sx={{
            borderRight: 1,
            borderColor: borderColor,
            bgcolor: cardBgColor,
            color: cardTextColor,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            '& .MuiInputLabel-root': { color: secondaryTextColor },
            '& .MuiInputBase-root': { color: cardTextColor },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
            '& .MuiSelect-icon': { color: secondaryTextColor },
            '& .MuiInputAdornment-root .MuiSvgIcon-root': { color: secondaryTextColor }
          }}>
            {/* Search and Filter Bar */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: borderColor }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                }}
                sx={{ mb: 1 }}
              />
              <Stack direction="row" spacing={1}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="unread">Unread</MenuItem>
                    <MenuItem value="read">Read</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleCompose}
                  size="small"
                  disabled={smtpConfigured === false}
                >
                  Compose
                </Button>
              </Stack>
            </Box>

            {/* Message List */}
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {getMessages().map((message) => (
                <ListItem
                  key={message.id}
                  button
                  selected={selectedMessage?.id === message.id}
                  onClick={() => handleSelectMessage(message)}
                  sx={{
                    borderBottom: 1,
                    borderColor: borderColor,
                    bgcolor: message.status === 'unread' ? hoverBgColor : 'transparent',
                    '&.Mui-selected': { bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' },
                    '&:hover': { bgcolor: hoverBgColor }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      {message.encrypted ? <LockIcon /> : <MailIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: message.status === 'unread' ? 600 : 400, color: cardTextColor }}>
                          {message.subject}
                        </Typography>
                        {message.mdn && (
                          <Tooltip title="Delivery Receipt Requested">
                            <CheckIcon fontSize="small" color="primary" />
                          </Tooltip>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                          {message.from}
                        </Typography>
                        <Typography variant="caption" display="block" noWrap sx={{ color: secondaryTextColor }}>
                          {message.body}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Stack alignItems="flex-end" spacing={0.5}>
                      <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                        {formatTimestamp(message.timestamp)}
                      </Typography>
                      {getStatusIcon(message.status)}
                      {message.attachments && (
                        <Badge badgeContent={message.attachments.length} color="secondary">
                          <AttachIcon fontSize="small" />
                        </Badge>
                      )}
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Grid>

          {/* Message Detail / Compose (Right Panel) */}
          <Grid item xs={12} md={8} sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: cardBgColor,
            color: cardTextColor,
            '& .MuiTextField-root': {
              '& .MuiInputLabel-root': { color: secondaryTextColor },
              '& .MuiInputBase-root': { color: cardTextColor },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
              '& .MuiFormHelperText-root': { color: secondaryTextColor }
            },
            '& .MuiCheckbox-root': { color: secondaryTextColor },
            '& .MuiFormControlLabel-label': { color: cardTextColor },
            '& .MuiChip-root': {
              color: cardTextColor,
              borderColor: borderColor
            },
            '& .MuiIconButton-root': { color: secondaryTextColor }
          }}>
            {composeOpen ? (
              /* Compose View */
              <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  Compose {activeTab === 1 ? 'Direct Message' : 'Secure Message'}
                </Typography>
                
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="To"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    helperText={activeTab === 1 ? "Enter Direct address (e.g., doctor@hospital.direct.org)" : "Select recipient"}
                    error={activeTab === 1 && composeTo && !DIRECT_ADDRESS_PATTERN.test(composeTo)}
                  />
                  
                  <TextField
                    fullWidth
                    label="Subject"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                  />
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={10}
                    label="Message"
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                  />

                  {activeTab === 1 && (
                    <Box>
                      <FormControlLabel
                        control={<Checkbox checked={composeEncrypted} onChange={(e) => setComposeEncrypted(e.target.checked)} />}
                        label="Encrypt message (S/MIME)"
                      />
                      <FormControlLabel
                        control={<Checkbox checked={composeMDN} onChange={(e) => setComposeMDN(e.target.checked)} />}
                        label="Request delivery receipt (MDN)"
                      />
                    </Box>
                  )}

                  <Box>
                    <Button variant="outlined" startIcon={<AttachIcon />}>
                      Attach Files
                    </Button>
                    <Typography variant="caption" sx={{ ml: 2, color: secondaryTextColor }}>
                      Max 25MB per attachment
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={handleSend}
                      disabled={!composeTo || !composeSubject || smtpConfigured === false}
                    >
                      Send
                    </Button>
                    <Button 
                      variant="outlined"
                      onClick={() => setComposeOpen(false)}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Stack>
              </Box>
            ) : selectedMessage ? (
              /* Message Detail View */
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Message Header */}
                <Box sx={{ p: 3, borderBottom: 1, borderColor: borderColor }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="start">
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {selectedMessage.subject}
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                          icon={<PersonIcon />}
                          label={`From: ${selectedMessage.from}`}
                          size="small"
                          variant="outlined"
                        />
                        {selectedMessage.encrypted && (
                          <Chip
                            icon={<LockIcon />}
                            label="Encrypted"
                            size="small"
                            color="success"
                          />
                        )}
                        {selectedMessage.mdn && (
                          <Chip
                            icon={<CheckIcon />}
                            label="Receipt Confirmed"
                            size="small"
                            color="primary"
                          />
                        )}
                      </Stack>
                      <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                        {selectedMessage.timestamp.toLocaleString()}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Reply">
                        <span>
                          <IconButton size="small" onClick={() => handleReply(selectedMessage)} disabled={smtpConfigured === false}>
                            <ReplyIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Forward">
                        <span>
                          <IconButton size="small" onClick={() => handleForward(selectedMessage)} disabled={smtpConfigured === false}>
                            <ForwardIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Download message">
                        <IconButton size="small" onClick={() => handleDownloadMessage(selectedMessage)}>
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>

                {/* Message Body */}
                <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
                  <Typography variant="body1" paragraph>
                    {selectedMessage.body}
                  </Typography>
                  
                  {selectedMessage.attachments && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Attachments ({selectedMessage.attachments.length})
                      </Typography>
                      <Stack spacing={1}>
                        {selectedMessage.attachments.map((attachment, index) => (
                          <Paper key={index} sx={{ p: 1.5, bgcolor: isDark ? '#2a2a2a' : '#f5f5f5', color: cardTextColor }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Stack direction="row" spacing={1} alignItems="center">
                                <AttachIcon fontSize="small" />
                                <Typography variant="body2">{attachment}</Typography>
                              </Stack>
                              <Tooltip title={'Download ' + attachment}>
                                <IconButton size="small" onClick={() => handleDownloadAttachment(attachment, selectedMessage)}>
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Audit Trail for Direct Messages */}
                  {selectedMessage.mdn && activeTab === 1 && (
                    <Box sx={{ mt: 4, p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'grey.100', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ color: cardTextColor }}>
                        Message Disposition
                      </Typography>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                          • Sent: {selectedMessage.timestamp.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                          • Delivered: {new Date(selectedMessage.timestamp.getTime() + 60000).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                          • Read: {selectedMessage.status === 'read' ? new Date(selectedMessage.timestamp.getTime() + 120000).toLocaleString() : 'Not yet'}
                        </Typography>
                      </Stack>
                    </Box>
                  )}
                </Box>
              </Box>
            ) : (
              /* Empty State */
              <Box sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: secondaryTextColor,
                p: 3
              }}>
                <Stack alignItems="center" spacing={2} sx={{ maxWidth: 560 }}>
                  <MailIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                  <Typography variant="h6">Select a message or compose a new one</Typography>
                  {smtpConfigured === false && (
                    <Alert severity="warning" sx={{ width: '100%', textAlign: 'left' }}>
                      <AlertTitle>SMTP Relay Not Configured</AlertTitle>
                      Outbound secure messages require an SMTP relay. Composing and sending
                      are disabled until one is configured. Set the relay server-side via
                      <code> Meteor.settings.private.email.smtp </code>
                      (<code>host</code>, <code>username</code>, <code>password</code>, and
                      optionally <code>port</code> / <code>secure</code>) — or provide a
                      <code> MAIL_URL </code> environment variable — then restart the server.
                    </Alert>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={<SendIcon />}
                    onClick={handleCompose}
                    disabled={smtpConfigured === false}
                  >
                    Compose Message
                  </Button>
                </Stack>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* ONC Compliance Footer */}
      <Paper sx={{ p: 2, borderRadius: 0, bgcolor: cardBgColor, borderTop: 1, borderColor: borderColor }}>
        <Stack direction="row" spacing={4} justifyContent="center">
          <Typography variant="caption" sx={{ color: secondaryTextColor }}>
            <SecurityIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            Direct Project (§170.315(h)(1)): S/MIME encryption, X.509 certificates, MDN support
          </Typography>
          <Typography variant="caption" sx={{ color: secondaryTextColor }}>
            <PersonIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            Secure Messaging (§170.315(e)(2)): Patient-provider messaging, threading, read receipts
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}