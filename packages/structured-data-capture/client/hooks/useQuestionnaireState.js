// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/hooks/useQuestionnaireState.js

import { useState, useCallback, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { get } from 'lodash';
import { ResponseUtils } from '../../lib/ResponseUtils';
import { QuestionnaireUtils } from '../../lib/QuestionnaireUtils';

export function useQuestionnaireState(questionnaire, initialResponse, options = {}) {
  const {
    sessionKey = 'currentQuestionnaireResponse',
    autoSave = true,
    autoSaveDelay = 1000,
    onSave,
    onError
  } = options;

  // Initialize response state
  const [response, setResponse] = useState(function() {
    if (initialResponse) {
      return initialResponse;
    }
    
    // Check session for existing response
    const sessionResponse = Session.get(sessionKey);
    if (sessionResponse && get(sessionResponse, 'questionnaire') === get(questionnaire, 'url')) {
      return sessionResponse;
    }
    
    // Create new response
    return ResponseUtils.initializeResponse(questionnaire, options);
  });

  // Track save status
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Auto-save timer
  const [saveTimer, setSaveTimer] = useState(null);

  // Update response in session
  useEffect(function() {
    if (response) {
      Session.set(sessionKey, response);
    }
  }, [response, sessionKey]);

  // Auto-save effect
  useEffect(function() {
    if (autoSave && onSave && response) {
      // Clear existing timer
      if (saveTimer) {
        clearTimeout(saveTimer);
      }

      // Set new timer
      const timer = setTimeout(function() {
        handleSave();
      }, autoSaveDelay);

      setSaveTimer(timer);

      // Cleanup
      return function() {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }
  }, [response, autoSave, autoSaveDelay]);

  // Update answer
  const updateAnswer = useCallback(function(linkId, value, type) {
    setResponse(function(prevResponse) {
      return ResponseUtils.updateAnswer(prevResponse, linkId, value, type);
    });
    setSaveError(null);
  }, []);

  // Clear answer
  const clearAnswer = useCallback(function(linkId) {
    setResponse(function(prevResponse) {
      return ResponseUtils.clearAnswer(prevResponse, linkId);
    });
    setSaveError(null);
  }, []);

  // Clear all answers
  const clearAllAnswers = useCallback(function() {
    setResponse(function(prevResponse) {
      return ResponseUtils.clearAllAnswers(prevResponse);
    });
    setSaveError(null);
  }, []);

  // Save response
  const handleSave = useCallback(async function() {
    if (!onSave || isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await onSave(response);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving questionnaire response:', error);
      setSaveError(error.message || 'Failed to save response');
      if (onError) {
        onError(error);
      }
    } finally {
      setIsSaving(false);
    }
  }, [response, onSave, onError, isSaving]);

  // Calculate completion status
  const completionStatus = useTracker(function() {
    if (!questionnaire || !response) {
      return { total: 0, answered: 0, percentage: 0 };
    }
    return QuestionnaireUtils.calculateCompletionStatus(questionnaire, response);
  }, [questionnaire, response]);

  // Get answer value for a linkId
  const getAnswerValue = useCallback(function(linkId) {
    const item = QuestionnaireUtils.findResponseItemByLinkId(response, linkId);
    return QuestionnaireUtils.getAnswerValue(item);
  }, [response]);

  // Check if item is enabled
  const isItemEnabled = useCallback(function(item) {
    return QuestionnaireUtils.isItemEnabled(item, response);
  }, [response]);

  return {
    response,
    setResponse,
    updateAnswer,
    clearAnswer,
    clearAllAnswers,
    getAnswerValue,
    isItemEnabled,
    completionStatus,
    save: handleSave,
    isSaving,
    lastSaved,
    saveError
  };
}