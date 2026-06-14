// packages/smart-web-messaging/client/components/MessagingDebugPanel.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  TextField,
  Button,
  Collapse,
  Alert,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Send as SendIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { get } from 'lodash';
import { useSmartMessaging } from './SmartMessagingProvider.jsx';

/**
 * MessagingDebugPanel component
 * Developer tool for debugging SMART Web Messaging
 */
export const MessagingDebugPanel = function({ defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState(0);
  const [messages, setMessages] = useState([]);
  const [scratchpadItems, setScratchpadItems] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [testMessage, setTestMessage] = useState('');
  
  const messagesEndRef = useRef(null);
  const { ready, capabilities, scratchpad } = useSmartMessaging();
  
  // Intercept messages for debugging
  useEffect(() => {
    const originalHandler = MessageHandler.handleMessage;
    
    // Wrap the handler to capture messages
    MessageHandler.handleMessage = function(event) {
      const message = event.data;
      const timestamp = new Date();
      
      // Add to debug log
      setMessages(prev => [...prev, {
        id: Random.id(),
        direction: 'incoming',
        message: message,
        origin: event.origin,
        timestamp: timestamp
      }]);
      
      // Call original handler
      originalHandler.call(MessageHandler, event);
    };
    
    // Also intercept outgoing messages
    const originalSend = MessageHandler.sendMessage;
    MessageHandler.sendMessage = function(message, target, targetOrigin) {
      const timestamp = new Date();
      
      // Add to debug log
      setMessages(prev => [...prev, {
        id: Random.id(),
        direction: 'outgoing',
        message: message,
        targetOrigin: targetOrigin,
        timestamp: timestamp
      }]);
      
      // Call original
      return originalSend.call(MessageHandler, message, target, targetOrigin);
    };
    
    // Cleanup
    return () => {
      MessageHandler.handleMessage = originalHandler;
      MessageHandler.sendMessage = originalSend;
    };
  }, []);
  
  // Update scratchpad items
  useEffect(() => {
    if (scratchpad && scratchpad.items) {
      setScratchpadItems(scratchpad.items);
    }
  }, [scratchpad]);
  
  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Clear messages
  const clearMessages = () => {
    setMessages([]);
    setSelectedMessage(null);
  };
  
  // Copy message to clipboard
  const copyMessage = (message) => {
    navigator.clipboard.writeText(JSON.stringify(message, null, 2));
  };
  
  // Send test message
  const sendTestMessage = () => {
    try {
      const parsed = JSON.parse(testMessage);
      const message = SmartWebMessaging.createMessage(
        parsed.messageType || 'test.message',
        parsed.payload || {},
        MessageHandler.messagingHandle
      );
      
      MessageHandler.sendMessage(message);
      setTestMessage('');
    } catch (err) {
      console.error('Failed to send test message:', err);
    }
  };
  
  // Format timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3 
    });
  };
  
  // Get message type color
  const getMessageTypeColor = (messageType) => {
    const category = MessageTypes.getCategory(messageType);
    const colors = {
      'status': 'primary',
      'ui': 'secondary',
      'scratchpad': 'success',
      'fhir': 'warning',
      'event': 'info'
    };
    return colors[category] || 'default';
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        right: 16, 
        width: 400,
        maxHeight: '80vh',
        zIndex: 1300 
      }}
    >
      <Box
        sx={{
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={() => setOpen(!open)}
      >
        <Typography variant="subtitle2">
          SMART Messaging Debug
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Badge badgeContent={messages.length} color="error" max={99}>
            <Chip 
              label={ready ? 'Ready' : 'Not Ready'} 
              size="small"
              color={ready ? 'success' : 'default'}
              sx={{ height: 20 }}
            />
          </Badge>
          <IconButton size="small" sx={{ color: 'inherit' }}>
            {open ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>
      </Box>
      
      <Collapse in={open}>
        <Box sx={{ maxHeight: '60vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="fullWidth">
            <Tab label="Messages" />
            <Tab label="Scratchpad" />
            <Tab label="Info" />
          </Tabs>
          
          {/* Messages Tab */}
          {tab === 0 && (
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton size="small" onClick={clearMessages}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List dense sx={{ p: 0 }}>
                  {messages.map((item) => (
                    <ListItem
                      key={item.id}
                      button
                      selected={selectedMessage?.id === item.id}
                      onClick={() => setSelectedMessage(item)}
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        backgroundColor: item.direction === 'incoming' ? 'action.hover' : 'background.paper'
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={item.direction}
                              size="small"
                              variant="outlined"
                              sx={{ height: 16, fontSize: '0.7rem' }}
                            />
                            <Chip
                              label={get(item, 'message.messageType', 'unknown')}
                              size="small"
                              color={getMessageTypeColor(get(item, 'message.messageType', ''))}
                              sx={{ height: 16, fontSize: '0.7rem' }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              {formatTime(item.timestamp)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" noWrap>
                            {item.direction === 'incoming' ? `From: ${item.origin}` : `To: ${item.targetOrigin}`}
                          </Typography>
                        }
                      />
                      <Tooltip title="Copy message">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            copyMessage(item.message);
                          }}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItem>
                  ))}
                  <div ref={messagesEndRef} />
                </List>
              </Box>
              
              {selectedMessage && (
                <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', maxHeight: 200, overflow: 'auto' }}>
                  <Typography variant="caption" component="pre" sx={{ margin: 0 }}>
                    {JSON.stringify(selectedMessage.message, null, 2)}
                  </Typography>
                </Box>
              )}
              
              {/* Test message sender */}
              <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  placeholder='{"messageType": "test", "payload": {}}'
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton size="small" onClick={sendTestMessage} disabled={!testMessage}>
                        <SendIcon fontSize="small" />
                      </IconButton>
                    )
                  }}
                />
              </Box>
            </Box>
          )}
          
          {/* Scratchpad Tab */}
          {tab === 1 && (
            <Box sx={{ p: 2, overflow: 'auto' }}>
              {scratchpadItems.length === 0 ? (
                <Alert severity="info">No scratchpad items</Alert>
              ) : (
                <List dense>
                  {scratchpadItems.map((item) => (
                    <ListItem key={item.id}>
                      <ListItemText
                        primary={`${item.resourceType} - ${item.id}`}
                        secondary={`Created: ${new Date(item.createdAt).toLocaleString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
          
          {/* Info Tab */}
          {tab === 2 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Status</Typography>
              <Alert severity={ready ? 'success' : 'warning'} sx={{ mb: 2 }}>
                {ready ? 'Connected and ready' : 'Not connected'}
              </Alert>
              
              <Typography variant="subtitle2" gutterBottom>Configuration</Typography>
              <Typography variant="caption" component="pre">
                {JSON.stringify({
                  messagingHandle: MessageHandler.messagingHandle,
                  authorizedOrigin: MessageHandler.authorizedOrigin,
                  config: SmartWebMessaging.config
                }, null, 2)}
              </Typography>
              
              {capabilities && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Parent Capabilities</Typography>
                  <Typography variant="caption" component="pre">
                    {JSON.stringify(capabilities, null, 2)}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};