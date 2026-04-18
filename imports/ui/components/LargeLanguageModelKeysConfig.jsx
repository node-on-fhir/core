// imports/ui/components/LargeLanguageModelKeysConfig.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert
} from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

function LargeLanguageModelKeysConfig(props) {
  const { onSaveSuccess, showTitle } = props;
  const shouldShowTitle = showTitle !== false;

  // API key fields
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openAIKey, setOpenAIKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');
  const [grokKey, setGrokKey] = useState('');
  const [localEndpoint, setLocalEndpoint] = useState('');
  const [webLlmModel, setWebLlmModel] = useState('');

  // Visibility toggles
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showGoogle, setShowGoogle] = useState(false);
  const [showGrok, setShowGrok] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Load existing config on mount
  useEffect(function() {
    Meteor.call('llm.getConfig', function(err, result) {
      if (err) {
        console.warn('[LargeLanguageModelKeysConfig] Error loading config:', err.reason);
        return;
      }
      if (result) {
        setAnthropicKey(get(result, 'claudeApiKey', ''));
        setOpenAIKey(get(result, 'openaiApiKey', ''));
        setGoogleKey(get(result, 'googleApiKey', ''));
        setGrokKey(get(result, 'grokApiKey', ''));
        setLocalEndpoint(get(result, 'localEndpoint', ''));
        setWebLlmModel(get(result, 'webLlmModel', ''));
      }
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      var config = {
        llmMode: 'cloud',
        cloudProvider: anthropicKey && !anthropicKey.startsWith('***') ? 'claude' : 'openai',
        claudeApiKey: anthropicKey || '',
        openaiApiKey: openAIKey || '',
        googleApiKey: googleKey || '',
        grokApiKey: grokKey || '',
        localEndpoint: localEndpoint || '',
        webLlmModel: webLlmModel || '',
        selectedLocalModel: '',
        systemPrompt: 'You are a helpful medical assistant with expertise in clinical decision support.',
        temperature: 0.7,
        topP: 0.95,
        maxTokens: 2048,
        showSystemPrompt: true
      };
      await Meteor.callAsync('llm.saveConfig', config);
      setSaved(true);
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err) {
      console.error('[LargeLanguageModelKeysConfig] Error saving keys:', err);
      setError(err.reason || err.message || 'Failed to save API keys');
    } finally {
      setSaving(false);
    }
  }

  function renderKeyField(label, value, setValue, showKey, setShowKey, placeholder) {
    return (
      <TextField
        fullWidth
        type={showKey ? 'text' : 'password'}
        label={label}
        value={value}
        onChange={function(e) { setValue(e.target.value); }}
        placeholder={placeholder}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={function() { setShowKey(!showKey); }}
                edge="end"
                size="small"
              >
                {showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {shouldShowTitle ? (
        <>
          <Typography variant="h6" gutterBottom>
            LLM API Keys
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Optionally configure API keys for AI-powered features. You can always update these later in your profile.
          </Typography>
        </>
      ) : null}

      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : null}

      {renderKeyField('Anthropic (Claude)', anthropicKey, setAnthropicKey, showAnthropic, setShowAnthropic, 'sk-ant-...')}
      {renderKeyField('OpenAI (ChatGPT)', openAIKey, setOpenAIKey, showOpenAI, setShowOpenAI, 'sk-...')}
      {renderKeyField('Google (Gemini)', googleKey, setGoogleKey, showGoogle, setShowGoogle, 'AIza...')}
      {renderKeyField('xAI (Grok)', grokKey, setGrokKey, showGrok, setShowGrok, 'xai-...')}

      <TextField
        fullWidth
        label="Local Endpoint URL"
        value={localEndpoint}
        onChange={function(e) { setLocalEndpoint(e.target.value); }}
        placeholder="http://localhost:11434"
      />
      <TextField
        fullWidth
        label="WebLLM Model Name"
        value={webLlmModel}
        onChange={function(e) { setWebLlmModel(e.target.value); }}
        placeholder="Llama-3-8B-Instruct"
      />

      <Button
        variant="contained"
        onClick={handleSave}
        disabled={saving}
        sx={{ alignSelf: 'flex-start', mt: 1 }}
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save API Keys'}
      </Button>
    </Box>
  );
}

export default LargeLanguageModelKeysConfig;
