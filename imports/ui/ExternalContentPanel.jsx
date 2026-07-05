// imports/ui/ExternalContentPanel.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import {
  Box,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  InputAdornment,
  Toolbar,
  Typography,
  Tooltip
} from '@mui/material';

import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';


//==========================================================================================
// Helpers

function normalizeUrl(input){
  let url = input.trim();
  if(!url){
    return '';
  }
  // Auto-prepend https:// if no protocol
  if(!url.startsWith('http://') && !url.startsWith('https://')){
    url = 'https://' + url;
  }
  return url;
}

function isValidUrl(url){
  if(!url){
    return false;
  }
  // Must contain at least one dot (catches accidental text input)
  if(!url.includes('.')){
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch(e){
    return false;
  }
}

function isMixedContent(url){
  if(typeof window === 'undefined'){
    return false;
  }
  return window.location.protocol === 'https:' && url.startsWith('http://');
}

// Restrict which external URLs may be loaded into the iframe.
// Currently allows only HTTPS URLs. Extend with hostname checks if needed.
function isAllowedExternalUrl(url){
  try {
    const parsed = new URL(url);
    if(parsed.protocol !== 'https:'){
      return false;
    }
    return true;
  } catch(e){
    return false;
  }
}


//==========================================================================================
// Main Component

export function ExternalContentPanel(props){
  const {
    url: propUrl,
    showAddressBar: propShowAddressBar,
    onClose,
    height,
    style
  } = props;

  // Settings defaults
  const settingsShowAddressBar = get(Meteor, 'settings.public.iframe.showAddressBar', true);
  const showAddressBar = (propShowAddressBar !== undefined) ? propShowAddressBar : settingsShowAddressBar;

  // Reactive URL from Session
  const sessionUrl = useTracker(function(){
    return Session.get('externalContentUrl');
  }, []);

  const defaultUrl = get(Meteor, 'settings.public.iframe.defaultUrl', '');

  // Resolve URL: prop > session > settings default
  const resolvedUrl = propUrl || sessionUrl || defaultUrl;

  // Internal state
  const [currentUrl, setCurrentUrl] = useState(resolvedUrl);
  const [addressBarValue, setAddressBarValue] = useState(resolvedUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [mixedContentError, setMixedContentError] = useState(false);

  const iframeRef = useRef(null);
  const timeoutRef = useRef(null);

  // Update when resolved URL changes (from sidebar click, etc.)
  useEffect(function(){
    if(resolvedUrl && resolvedUrl !== currentUrl){
      setCurrentUrl(resolvedUrl);
      setAddressBarValue(resolvedUrl);
    }
  }, [resolvedUrl]);

  // Start load timer when currentUrl changes
  useEffect(function(){
    if(!currentUrl){
      setIsLoading(false);
      setLoadTimedOut(false);
      setMixedContentError(false);
      return;
    }

    // Check mixed content
    if(isMixedContent(currentUrl)){
      setMixedContentError(true);
      setIsLoading(false);
      setLoadTimedOut(false);
      return;
    }

    setMixedContentError(false);
    setIsLoading(true);
    setLoadTimedOut(false);

    // Clear any existing timeout
    if(timeoutRef.current){
      clearTimeout(timeoutRef.current);
    }

    // Start 5-second timeout for frame-blocking detection
    timeoutRef.current = setTimeout(function(){
      setLoadTimedOut(true);
    }, 5000);

    return function(){
      if(timeoutRef.current){
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentUrl]);

  // Handlers
  const handleIframeLoad = useCallback(function(){
    console.log('[ExternalContentPanel] iframe onLoad fired for:', currentUrl);
    setIsLoading(false);
    if(timeoutRef.current){
      clearTimeout(timeoutRef.current);
    }
  }, [currentUrl]);

  const handleIframeError = useCallback(function(){
    console.warn('[ExternalContentPanel] iframe onError fired for:', currentUrl);
    setIsLoading(false);
    setLoadTimedOut(true);
    if(timeoutRef.current){
      clearTimeout(timeoutRef.current);
    }
  }, [currentUrl]);

  function handleAddressBarSubmit(event){
    if(event){
      event.preventDefault();
    }
    let normalized = normalizeUrl(addressBarValue);
    if(!normalized){
      return;
    }
    if(!isValidUrl(normalized)){
      console.warn('[ExternalContentPanel] Invalid URL:', normalized);
      return;
    }
    if(!isAllowedExternalUrl(normalized)){
      console.warn('[ExternalContentPanel] Disallowed URL:', normalized);
      return;
    }
    setAddressBarValue(normalized);
    setCurrentUrl(normalized);
    Session.set('externalContentUrl', normalized);
  }

  function handleRefresh(){
    if(!currentUrl){
      return;
    }
    // Toggle src to force reload
    let tempUrl = currentUrl;
    setCurrentUrl('');
    setTimeout(function(){
      setCurrentUrl(tempUrl);
    }, 100);
  }

  function handleOpenInNewTab(){
    if(currentUrl){
      window.open(currentUrl, '_blank');
    }
  }

  function handleClose(){
    if(typeof onClose === 'function'){
      onClose();
    }
  }

  function handleAddressBarKeyDown(event){
    if(event.key === 'Enter'){
      handleAddressBarSubmit();
    }
  }

  // Suggest HTTPS version for mixed content
  function getSuggestedHttpsUrl(){
    if(currentUrl && currentUrl.startsWith('http://')){
      return currentUrl.replace('http://', 'https://');
    }
    return '';
  }

  function handleUseSuggestedHttps(){
    let httpsUrl = getSuggestedHttpsUrl();
    if(httpsUrl){
      setAddressBarValue(httpsUrl);
      setCurrentUrl(httpsUrl);
      Session.set('externalContentUrl', httpsUrl);
    }
  }

  //==========================================================================================
  // Render

  let hasUrl = !!currentUrl;

  // Defense-in-depth: validate URL scheme at render time
  let safeSrc = (currentUrl && isAllowedExternalUrl(currentUrl)) ? currentUrl : '';

  return (
    <Box
      id="externalContentPanel"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: height || '100%',
        backgroundColor: 'background.paper',
        ...style
      }}
    >
      {/* Address Bar */}
      {showAddressBar ? (
        <Toolbar
          variant="dense"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: 'background.default',
            gap: 0.5,
            minHeight: '48px',
            px: 1
          }}
        >
          <Tooltip title="Refresh">
            <span>
              <IconButton
                size="small"
                onClick={handleRefresh}
                disabled={!hasUrl}
                sx={{ color: 'text.secondary' }}
                aria-label="Refresh"
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Shows the initial URL. In-page navigation is not tracked.">
            <TextField
              id="externalContentAddressBar"
              size="small"
              fullWidth
              placeholder="Enter URL..."
              value={addressBarValue}
              onChange={function(e){ setAddressBarValue(e.target.value); }}
              onKeyDown={handleAddressBarKeyDown}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper'
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleAddressBarSubmit}
                      disabled={!addressBarValue}
                      aria-label="Send"
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Tooltip>

          <Tooltip title="Open in new tab">
            <span>
              <IconButton
                size="small"
                onClick={handleOpenInNewTab}
                disabled={!hasUrl}
                sx={{ color: 'text.secondary' }}
                aria-label="Open in new"
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          {onClose ? (
            <Tooltip title="Close panel">
              <IconButton
                size="small"
                onClick={handleClose}
                sx={{ color: 'text.secondary' }}
                aria-label="Close panel"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Toolbar>
      ) : null}

      {/* Close button (no address bar mode, 2up only) */}
      {!showAddressBar && onClose ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5, borderBottom: 1, borderColor: 'divider' }}>
          <Tooltip title="Close panel">
            <IconButton size="small" onClick={handleClose} sx={{ color: 'text.secondary' }} aria-label="Close panel">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ) : null}

      {/* Mixed Content Error */}
      {mixedContentError ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">
            <AlertTitle>Mixed Content Blocked</AlertTitle>
            Cannot load HTTP content from a secure (HTTPS) page.
            {getSuggestedHttpsUrl() ? (
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleUseSuggestedHttps}
                >
                  Try HTTPS version
                </Button>
              </Box>
            ) : null}
          </Alert>
        </Box>
      ) : null}

      {/* Load Timeout Warning */}
      {loadTimedOut && !mixedContentError ? (
        <Alert
          severity="warning"
          sx={{ mx: 1, mt: 1, flexShrink: 0 }}
          action={
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button size="small" onClick={handleRefresh}>
                Try Again
              </Button>
              <Button size="small" onClick={handleOpenInNewTab}>
                Open in New Tab
              </Button>
            </Box>
          }
        >
          This site may not support embedded display.
        </Alert>
      ) : null}

      {/* Empty State */}
      {!hasUrl && !mixedContentError ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography color="text.secondary">
            {showAddressBar
              ? 'Enter a URL in the address bar above'
              : 'No URL configured. Add iframe URLs to your settings file.'
            }
          </Typography>
        </Box>
      ) : null}

      {/* Iframe Container */}
      {hasUrl && !mixedContentError ? (
        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Loading Overlay */}
          {isLoading ? (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'background.paper',
                zIndex: 1
              }}
            >
              <CircularProgress />
            </Box>
          ) : null}

          <iframe
            ref={iframeRef}
            id="externalContentFrame"
            src={safeSrc}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="External Content"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block'
            }}
          />
        </Box>
      ) : null}
    </Box>
  );
}

export default ExternalContentPanel;
