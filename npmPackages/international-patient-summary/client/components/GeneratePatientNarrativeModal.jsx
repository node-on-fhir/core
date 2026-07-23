// npmPackages/international-patient-summary/client/components/GeneratePatientNarrativeModal.jsx
//
// Self-contained "Generate IPS Narrative" modal. Owns the generation flow (via the
// sibling narrativeEngine lib), writes the result to Session.ipsComposition, and
// optionally hands it back through onGenerated(narrative). Rendered by both the IPS
// page and the Chronicle workstation footer. Props: { open, onClose, onGenerated }.

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert,
  AlertTitle,
  Chip,
  Divider,
  Paper,
  TextField,
  Link,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material';

import {
  Security as SecurityIcon,
  Cloud as CloudIcon,
  Computer as ComputerIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Help as HelpIcon,
  VpnKey as VpnKeyIcon,
  Language as LanguageIcon
} from '@mui/icons-material';

import { get } from 'lodash';

// Generation engine (provider dispatch + prompt building). Lives in a sibling lib
// so this modal is self-contained — callers just render it; it generates, writes
// Session.ipsComposition, and (optionally) hands the narrative back via onGenerated.
import { generateNarrative } from '../lib/narrativeEngine.js';

function GeneratePatientNarrativeModal({ open, onClose, onGenerated }) {
  const [selectedProvider, setSelectedProvider] = useState('webllm');
  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerConfig, setProviderConfig] = useState({});
  const [cachedModels, setCachedModels] = useState([]);
  const [generationStatus, setGenerationStatus] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Get Honeycomb theme for dark mode support
  const useAppTheme = Meteor.useTheme;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const textSecondary = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  // Jewel-tone alert styles for dark mode
  function alertSx(severity) {
    if (!isDark) return {};
    const styles = {
      info:    { bgcolor: '#0d47a1', color: '#e3f2fd', '& .MuiAlert-icon': { color: '#90caf9' }, '& .MuiAlertTitle-root': { color: '#e3f2fd' } },
      warning: { bgcolor: '#e65100', color: '#fff3e0', '& .MuiAlert-icon': { color: '#ffcc80' }, '& .MuiAlertTitle-root': { color: '#fff3e0' } },
      success: { bgcolor: '#1b5e20', color: '#e8f5e9', '& .MuiAlert-icon': { color: '#81c784' }, '& .MuiAlertTitle-root': { color: '#e8f5e9' } }
    };
    return styles[severity] || {};
  }

  // Load configuration from settings
  useEffect(function() {
    // Check for BYOLLMK configuration
    const openAiKey = get(Meteor, 'settings.public.openai.apiKey', '');
    const anthropicKey = get(Meteor, 'settings.public.anthropic.apiKey', '');
    
    if(openAiKey || anthropicKey) {
      setApiKey(openAiKey || anthropicKey);
    }

    // Check for custom endpoints
    const customEndpoint = get(Meteor, 'settings.public.llm.endpoint', '');
    if(customEndpoint) {
      setApiEndpoint(customEndpoint);
    }

    // Get available models
    (async function() {
      try {
        const result = await Meteor.rpc('mcp.getAvailableModels');
        if(result) {
          setProviderConfig(result);
        }
      } catch (error) { /* leave providerConfig default on failure */ }
    })();

    // Check WebLLM cached models
    checkCachedModels();
  }, []);

  async function checkCachedModels() {
    try {
      const cacheNames = await caches.keys();
      console.log('All cache names:', cacheNames);
      
      const cached = [];
      
      // WebLLM uses specific cache naming patterns
      // Look for caches that contain model artifacts
      for(const cacheName of cacheNames) {
        // WebLLM caches typically include "webllm" or "mlc-engine"
        if(cacheName.includes('webllm') || cacheName.includes('mlc')) {
          // Try to open the cache and check its contents
          try {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            
            // Check if this cache contains model files
            for(const request of keys) {
              const url = request.url;
              
              // Check for each model
              if(url.includes('Mistral-7B-Instruct-v0.3')) {
                if(!cached.includes('Mistral-7B-Instruct-v0.3-q4f32_1-MLC')) {
                  cached.push('Mistral-7B-Instruct-v0.3-q4f32_1-MLC');
                }
              }
              if(url.includes('Llama-3.2-1B-Instruct') || url.includes('Llama-3_2-1B')) {
                if(!cached.includes('Llama-3.2-1B-Instruct-q4f32_1-MLC')) {
                  cached.push('Llama-3.2-1B-Instruct-q4f32_1-MLC');
                }
              }
              if(url.includes('Llama-3.2-3B-Instruct') || url.includes('Llama-3_2-3B')) {
                if(!cached.includes('Llama-3.2-3B-Instruct-q4f32_1-MLC')) {
                  cached.push('Llama-3.2-3B-Instruct-q4f32_1-MLC');
                }
              }
              if(url.includes('Phi-3.5-mini') || url.includes('Phi-3_5-mini')) {
                if(!cached.includes('Phi-3.5-mini-instruct-q4f32_1-MLC')) {
                  cached.push('Phi-3.5-mini-instruct-q4f32_1-MLC');
                }
              }
              if(url.includes('gemma-2-2b')) {
                if(!cached.includes('gemma-2-2b-it-q4f32_1-MLC')) {
                  cached.push('gemma-2-2b-it-q4f32_1-MLC');
                }
              }
            }
          } catch(e) {
            console.log('Could not check cache contents for:', cacheName);
          }
        }
      }
      
      setCachedModels(cached);
      console.log('Models found in cache:', cached);
      
      // Return the cached models for immediate use
      return cached;
    } catch(err) {
      console.error('Error checking cached models:', err);
      return [];
    }
  }

  const providers = [
    {
      id: 'webllm',
      name: 'WebLLM (Local)',
      icon: <ComputerIcon />,
      description: 'Run models directly in your browser',
      privacy: 'high',
      hipaa: 'compliant',
      models: [
        { id: 'Mistral-7B-Instruct-v0.3-q4f32_1-MLC', display: 'Mistral 7B Instruct', size: '4.1GB', recommended: true },
        { id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC', display: 'Llama 3.2 1B', size: '650MB', note: 'May be too small for complex summaries' },
        { id: 'Llama-3.2-3B-Instruct-q4f32_1-MLC', display: 'Llama 3.2 3B', size: '1.8GB' },
        { id: 'Phi-3.5-mini-instruct-q4f32_1-MLC', display: 'Phi 3.5 Mini', size: '2.2GB' },
        { id: 'gemma-2-2b-it-q4f32_1-MLC', display: 'Gemma 2 2B', size: '1.3GB' }
      ],
      requirements: [
        'Requires WebGPU support',
        'Initial model download (~1-2GB)',
        'No data leaves your device'
      ]
    },
    {
      id: 'byollmk',
      name: 'BYOLLMK (Bring Your Own LLM Key)',
      icon: <VpnKeyIcon />,
      description: 'Use your own API keys for OpenAI, Anthropic, etc.',
      privacy: 'medium',
      hipaa: 'dependent',
      models: [
        { id: 'gpt-4o', display: 'GPT-4o' },
        { id: 'gpt-4o-mini', display: 'GPT-4o mini' },
        { id: 'gpt-4.1', display: 'GPT-4.1' },
        { id: 'claude-fable-5', display: 'Claude Fable 5' },
        { id: 'claude-opus-4-8', display: 'Claude Opus 4.8' },
        { id: 'claude-opus-4-7', display: 'Claude Opus 4.7' },
        { id: 'claude-sonnet-4-6', display: 'Claude Sonnet 4.6' },
        { id: 'claude-haiku-4-5', display: 'Claude Haiku 4.5' }
      ],
      requirements: [
        'Requires valid API key',
        'Data sent to third-party service',
        'Check provider\'s BAA for HIPAA compliance'
      ]
    },
    {
      id: 'local-ollama',
      name: 'Ollama (Local Server)',
      icon: <ComputerIcon />,
      description: 'Connect to local Ollama server',
      privacy: 'high',
      hipaa: 'compliant',
      endpoint: 'http://localhost:11434',
      models: [
        { id: 'llama3.2', display: 'Llama 3.2' },
        { id: 'mistral', display: 'Mistral 7B' },
        { id: 'phi3', display: 'Phi 3' },
        { id: 'medllama2', display: 'MedLlama 2' }
      ],
      requirements: [
        'Ollama must be running locally',
        'No data leaves your network',
        'Full control over model selection'
      ]
    }
    // Azure OpenAI - disabled for now
    // {
    //   id: 'azure-openai',
    //   name: 'Azure OpenAI Service',
    //   icon: <CloudIcon />,
    //   description: 'Enterprise Azure OpenAI deployment',
    //   privacy: 'high',
    //   hipaa: 'compliant',
    //   models: [
    //     'gpt-4',
    //     'gpt-35-turbo'
    //   ],
    //   requirements: [
    //     'Azure subscription required',
    //     'HIPAA BAA available',
    //     'Data stays in your Azure region'
    //   ]
    // }
  ];

  const currentProvider = providers.find(p => p.id === selectedProvider);

  function handleProviderChange(event) {
    setSelectedProvider(event.target.value);
    // Reset model selection when provider changes
    setSelectedModel('');
  }

  function getPrivacyChip(level) {
    const configs = {
      high: { label: 'High Privacy', color: 'success', icon: <CheckCircleIcon /> },
      medium: { label: 'Medium Privacy', color: 'warning', icon: <WarningIcon /> },
      low: { label: 'Low Privacy', color: 'error', icon: <CancelIcon /> }
    };
    const config = configs[level] || configs.medium;
    
    return (
      <Chip 
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
      />
    );
  }

  function getHipaaChip(status) {
    const configs = {
      compliant: { label: 'HIPAA Compliant', color: 'success' },
      dependent: { label: 'Provider Dependent', color: 'warning' },
      'non-compliant': { label: 'Not HIPAA Compliant', color: 'error' }
    };
    const config = configs[status] || configs.dependent;
    
    return (
      <Chip 
        label={config.label}
        color={config.color}
        size="small"
        icon={<SecurityIcon />}
      />
    );
  }

  async function handleGenerate() {
    setLoading(true);
    setGenerationStatus('Preparing to generate narrative...');
    setDownloadProgress(0);
    
    try {
      // Get the default model if none selected
      const defaultModel = currentProvider.models[0];
      const modelId = selectedModel || (typeof defaultModel === 'object' ? defaultModel.id : defaultModel);
      
      // Check if model is cached for WebLLM
      const isCached = cachedModels.some(cached => 
        modelId.includes(cached) || cached.includes(modelId.split('-')[0])
      );
      
      if (selectedProvider === 'webllm' && !isCached) {
        setGenerationStatus('Model not cached. Downloading model (this may take 1-2 minutes)...');
      } else {
        setGenerationStatus('Initializing model...');
      }
      
      const config = {
        provider: selectedProvider,
        model: modelId,
        apiKey: apiKey,
        endpoint: apiEndpoint || currentProvider.endpoint,
        onProgress: (status, progress) => {
          setGenerationStatus(status);
          if (progress !== undefined) {
            setDownloadProgress(progress);
          }
        }
      };

      // Run the generation engine, then write the result straight to the shared
      // Session key (the IPS Narrative Editor and the Chronicle Patient Summary
      // panel both read it) and hand it back to the caller for any local editor
      // state. No separate Save step — the editor and Session update together.
      const narrative = await generateNarrative(config);
      Session.set('ipsComposition', narrative);
      if (typeof onGenerated === 'function') {
        onGenerated(narrative);
      }

      setGenerationStatus('Narrative generated successfully!');
      setTimeout(() => {
        setLoading(false);
        onClose();
        setGenerationStatus('');
        setDownloadProgress(0);
      }, 1500);
    } catch(error) {
      console.error('Error generating narrative:', error);
      setGenerationStatus(`Error: ${error.message}`);
      setTimeout(() => {
        setLoading(false);
        setGenerationStatus('');
        setDownloadProgress(0);
      }, 3000);
    } finally {
      // Ensure loading is always reset even if there's an unexpected error
      setTimeout(() => {
        setLoading(false);
      }, 5000);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: cardBgColor,
          color: cardTextColor
        }
      }}
    >
      <DialogTitle sx={{ bgcolor: cardBgColor, color: cardTextColor }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Generate IPS Narrative</Typography>
          <Tooltip title="Learn more about LLM options">
            <IconButton size="small">
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{
        bgcolor: cardBgColor,
        color: cardTextColor,
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
        '& .MuiRadio-root': { color: cardTextColor },
        '& .MuiFormControlLabel-label': { color: 'inherit' },
        '& .MuiDivider-root': { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' },
        '& .MuiListItemIcon-root .MuiSvgIcon-root': { color: cardTextColor },
        '& .MuiListItemText-primary': { color: cardTextColor },
        '& .MuiChip-outlined.MuiChip-colorDefault': {
          color: cardTextColor,
          borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)'
        },
        '& .MuiTextField-root': {
          '& .MuiInputBase-root': { color: cardTextColor },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)' },
          '& .MuiInputLabel-root': { color: textSecondary },
          '& .MuiFormHelperText-root': { color: textSecondary }
        }
      }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Select LLM Provider
          </Typography>
          
          <RadioGroup value={selectedProvider} onChange={handleProviderChange}>
            {providers.map(provider => (
              <Paper 
                key={provider.id} 
                variant="outlined" 
                sx={{
                  p: 2,
                  mb: 2,
                  cursor: 'pointer',
                  bgcolor: cardBgColor,
                  color: cardTextColor,
                  border: selectedProvider === provider.id ? 2 : 1,
                  borderColor: selectedProvider === provider.id ? 'primary.main' : 'divider'
                }}
                onClick={() => setSelectedProvider(provider.id)}
              >
                <FormControlLabel
                  value={provider.id}
                  control={<Radio />}
                  label={
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {provider.icon}
                        <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 500 }}>
                          {provider.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: textSecondary, mb: 1 }}>
                        {provider.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        {getPrivacyChip(provider.privacy)}
                        {getHipaaChip(provider.hipaa)}
                      </Box>
                    </Box>
                  }
                />
                
                {selectedProvider === provider.id && (
                  <Box sx={{ mt: 2, ml: 4 }}>
                    <Divider sx={{ mb: 2 }} />
                    
                    {/* Cache Status for WebLLM */}
                    {provider.id === 'webllm' && (
                      <Alert
                        severity={cachedModels.length > 0 ? "success" : "info"}
                        sx={{ mb: 2, ...alertSx(cachedModels.length > 0 ? 'success' : 'info') }}
                        icon={cachedModels.length > 0 ? <CheckCircleIcon /> : <InfoIcon />}
                      >
                        {cachedModels.length > 0 ? (
                          <>
                            <Typography variant="body2">
                              {cachedModels.length} model{cachedModels.length > 1 ? 's' : ''} cached and ready to use
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }} color="inherit">
                              Cached models load instantly without downloading
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Typography variant="body2">
                              No models cached yet
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }} color="inherit">
                              First use will download the model (1-2 minutes)
                            </Typography>
                          </>
                        )}
                      </Alert>
                    )}
                    
                    {/* Requirements */}
                    <Typography variant="subtitle2" gutterBottom>
                      Requirements:
                    </Typography>
                    <List dense>
                      {provider.requirements.map((req, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <InfoIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={req}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    {/* Model Selection */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Available Models:
                      </Typography>
                      {provider.id === 'webllm' && (
                        <Button 
                          size="small" 
                          onClick={checkCachedModels}
                          startIcon={<InfoIcon />}
                        >
                          Refresh Cache Status
                        </Button>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {provider.models.map(model => {
                        const modelObj = typeof model === 'object' ? model : { id: model, display: model };
                        const isCached = cachedModels.some(cached => 
                          modelObj.id.includes(cached) || cached.includes(modelObj.id.split('-')[0])
                        );
                        
                        return (
                          <Tooltip 
                            key={modelObj.id}
                            title={
                              <Box>
                                {modelObj.size && <Typography variant="caption">Size: {modelObj.size}</Typography>}
                                {modelObj.recommended && (
                                  <>
                                    <br />
                                    <Typography variant="caption" color="primary.light">⭐ Recommended for IPS summaries</Typography>
                                  </>
                                )}
                                {modelObj.note && (
                                  <>
                                    <br />
                                    <Typography variant="caption" color="warning.light">⚠️ {modelObj.note}</Typography>
                                  </>
                                )}
                                <br />
                                {isCached && <Typography variant="caption" color="success.light">✓ Cached locally</Typography>}
                                {!isCached && provider.id === 'webllm' && <Typography variant="caption">Will download on first use</Typography>}
                              </Box>
                            }
                          >
                            <Chip
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {isCached && <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />}
                                  {modelObj.recommended && !isCached && '⭐ '}
                                  {modelObj.display || modelObj.id}
                                </Box>
                              }
                              onClick={() => setSelectedModel(modelObj.id)}
                              color={selectedModel === modelObj.id ? 'primary' : 'default'}
                              variant={selectedModel === modelObj.id ? 'filled' : 'outlined'}
                              sx={{ 
                                borderColor: isCached ? 'success.main' : undefined,
                                borderWidth: isCached ? 2 : 1
                              }}
                            />
                          </Tooltip>
                        );
                      })}
                    </Box>

                    {/* API Configuration for BYOLLMK */}
                    {provider.id === 'byollmk' && (
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          fullWidth
                          label="API Key"
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk-..."
                          size="small"
                          sx={{ mb: 2 }}
                          helperText="Your API key is never stored and only used for this session"
                        />
                        <TextField
                          fullWidth
                          label="Custom Endpoint (Optional)"
                          value={apiEndpoint}
                          onChange={(e) => setApiEndpoint(e.target.value)}
                          placeholder="https://api.openai.com/v1"
                          size="small"
                        />
                      </Box>
                    )}

                    {/* Endpoint Display */}
                    {provider.endpoint && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Endpoint:
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 1, bgcolor: 'action.hover' }}>
                          <Typography variant="body2" fontFamily="monospace">
                            {provider.endpoint}
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            ))}
          </RadioGroup>
        </Box>

        {/* Privacy Notice */}
        <Alert severity="info" icon={<SecurityIcon />} sx={alertSx('info')}>
          <AlertTitle>Privacy & Security Notice</AlertTitle>
          <Typography variant="body2">
            • <strong>WebLLM & Ollama:</strong> All processing happens locally. No patient data leaves your device/network.
            <br />
            • <strong>BYOLLMK:</strong> Data is sent to third-party APIs. Ensure you have appropriate BAAs in place.
            <br />
            • <strong>Azure OpenAI:</strong> Can be configured for HIPAA compliance with proper Azure setup and BAAs.
          </Typography>
        </Alert>

        {/* HIPAA Compliance Warning */}
        {currentProvider && currentProvider.hipaa !== 'compliant' && (
          <Alert severity="warning" sx={{ mt: 2, ...alertSx('warning') }}>
            <AlertTitle>HIPAA Compliance Warning</AlertTitle>
            <Typography variant="body2">
              This provider may not be HIPAA compliant by default. Ensure you have:
              <br />
              • Signed Business Associate Agreements (BAAs)
              <br />
              • Implemented appropriate security measures
              <br />
              • De-identified PHI when necessary
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ bgcolor: cardBgColor, color: cardTextColor }}>
        <Box sx={{ flex: 1, mr: 2 }}>
          {loading && (
            <Box>
              {downloadProgress > 0 && downloadProgress < 100 && (
                <LinearProgress 
                  variant="determinate" 
                  value={downloadProgress} 
                  sx={{ mb: 1 }}
                />
              )}
              <Typography variant="body2" color="text.secondary">
                {generationStatus}
              </Typography>
            </Box>
          )}
        </Box>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleGenerate}
          variant="contained"
          disabled={loading || (selectedProvider === 'byollmk' && !apiKey)}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Generating...' : 'Generate Narrative'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export { GeneratePatientNarrativeModal };
export default GeneratePatientNarrativeModal;