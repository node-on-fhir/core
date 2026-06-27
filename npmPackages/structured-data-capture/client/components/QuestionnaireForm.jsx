// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/components/QuestionnaireForm.jsx

import React, { useState, useCallback, useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
import {
  Box, 
  Container, 
  Paper, 
  Typography, 
  Divider,
  Alert,
  LinearProgress,
  Grid
} from '@mui/material';
import { get } from 'lodash';
import { useQuestionnaireState } from '../hooks/useQuestionnaireState';
import { useResponseTracking } from '../hooks/useResponseTracking';
import { QuestionItem } from './QuestionItem';
import { ProgressIndicator } from './ProgressIndicator';
import { NavigationSidebar } from './NavigationSidebar';
import { ActionButtons } from './ActionButtons';
import { ThankYouPage } from './ThankYouPage';
import { ValidationUtils } from '../../lib/ValidationUtils';
import { QuestionnaireUtils } from '../../lib/QuestionnaireUtils';

export function QuestionnaireForm(props) {
  const {
    questionnaire,
    questionnaireResponse: initialResponse,
    onSubmit,
    onSave,
    onCancel,
    showProgress = true,
    showSidebar = false,
    showLinkIds = false,
    showValidation = true,
    enableTracking = true,
    thankYouPage,
    customRenderers = {},
    containerProps = {},
    paperProps = {},
    readOnly = false,
    autoSave = true,
    autoSaveDelay = 1000
  } = props;

  // Dark mode theming. Self-theming: an explicitly-passed prop wins (so callers
  // that already thread colors — SurveyPage, StructuredDataCapturePage — are
  // unaffected), otherwise derive from the LIVE app theme (Meteor.useTheme),
  // not a hardcoded light default. This keeps the form correct for callers that
  // pass partial/no theme props (e.g. the PFE assessment + builder preview).
  const appTheme = (Meteor.useTheme ? Meteor.useTheme() : { theme: 'light' });
  const themeIsDark = appTheme.theme === 'dark';
  const isDark = props.isDark !== undefined ? props.isDark : themeIsDark;
  const cardBgColor = props.cardBgColor !== undefined ? props.cardBgColor : (isDark ? '#1e1e1e' : '#ffffff');
  const cardTextColor = props.cardTextColor !== undefined ? props.cardTextColor : (isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)');
  const paperBgColor = props.paperBgColor !== undefined ? props.paperBgColor : (isDark ? '#2a2a2a' : '#ffffff');
  const borderColor = props.borderColor !== undefined ? props.borderColor : (isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)');

  // State
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showThankYou, setShowThankYou] = useState(false);

  // Use questionnaire state hook
  const {
    response,
    updateAnswer,
    clearAnswer,
    clearAllAnswers,
    getAnswerValue,
    isItemEnabled,
    completionStatus,
    save,
    isSaving,
    lastSaved,
    saveError
  } = useQuestionnaireState(questionnaire, initialResponse, {
    onSave,
    autoSave,
    autoSaveDelay
  });

  // Use response tracking hook
  const tracking = useResponseTracking(response, {
    trackTiming: enableTracking,
    trackChanges: enableTracking,
    trackFocus: enableTracking
  });

  // Handle answer change
  const handleAnswerChange = useCallback(function(linkId, value, type) {
    if (readOnly) return;

    const oldValue = getAnswerValue(linkId);
    updateAnswer(linkId, value, type);
    
    if (enableTracking) {
      tracking.trackAnswerChange(linkId, oldValue, value);
    }
  }, [updateAnswer, getAnswerValue, tracking, enableTracking, readOnly]);

  // Handle item focus
  const handleItemFocus = useCallback(function(linkId) {
    if (enableTracking) {
      tracking.trackItemFocus(linkId);
    }
  }, [tracking, enableTracking]);

  // Handle submit
  const handleSubmit = useCallback(async function() {
    if (!onSubmit) return;

    // Validate response
    if (showValidation) {
      const validation = ValidationUtils.validateQuestionnaireResponse(questionnaire, response);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        return;
      }
    }

    setIsSubmitted(true);
    
    try {
      await onSubmit(response, tracking.exportTrackingData());
      
      if (thankYouPage?.show) {
        setShowThankYou(true);
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      setIsSubmitted(false);
    }
  }, [onSubmit, questionnaire, response, tracking, showValidation, thankYouPage]);

  // Handle clear all
  const handleClearAll = useCallback(function() {
    if (readOnly) return;
    
    if (window.confirm('Are you sure you want to clear all answers?')) {
      clearAllAnswers();
      setValidationErrors([]);
    }
  }, [clearAllAnswers, readOnly]);

  // Render questionnaire items
  const renderItems = useCallback(function(items, depth = 0) {
    if (!items || items.length === 0) return null;

    return items.map(function(item, index) {
      const linkId = get(item, 'linkId');
      const type = get(item, 'type');
      const enabled = isItemEnabled(item);

      if (!enabled) return null;

      // Use custom renderer if provided
      const CustomRenderer = customRenderers[type] || customRenderers[linkId];
      if (CustomRenderer) {
        return (
          <CustomRenderer
            key={linkId}
            item={item}
            value={getAnswerValue(linkId)}
            onChange={(value) => handleAnswerChange(linkId, value, type)}
            onFocus={() => handleItemFocus(linkId)}
            readOnly={readOnly}
            showLinkId={showLinkIds}
          />
        );
      }

      return (
        <QuestionItem
          key={linkId}
          item={item}
          depth={depth}
          value={getAnswerValue(linkId)}
          onChange={(value) => handleAnswerChange(linkId, value, type)}
          onClear={() => clearAnswer(linkId)}
          onFocus={() => handleItemFocus(linkId)}
          readOnly={readOnly}
          showLinkId={showLinkIds}
          renderItems={renderItems}
          validationError={validationErrors.find(e => e.linkId === linkId)}
          isDark={isDark}
          cardBgColor={cardBgColor}
          cardTextColor={cardTextColor}
          paperBgColor={paperBgColor}
          borderColor={borderColor}
        />
      );
    });
  }, [
    isItemEnabled,
    getAnswerValue,
    handleAnswerChange,
    handleItemFocus,
    clearAnswer,
    readOnly,
    showLinkIds,
    customRenderers,
    validationErrors,
    isDark,
    cardBgColor,
    cardTextColor,
    paperBgColor,
    borderColor
  ]);

  // Show thank you page if submitted
  if (showThankYou && thankYouPage) {
    return (
      <ThankYouPage
        message={thankYouPage.message}
        redirectUrl={thankYouPage.redirectUrl}
        redirectDelay={thankYouPage.redirectDelay}
        onClose={() => setShowThankYou(false)}
        isDark={isDark}
        cardBgColor={cardBgColor}
        cardTextColor={cardTextColor}
        paperBgColor={paperBgColor}
      />
    );
  }

  // Get flattened items for navigation
  const flattenedItems = useMemo(function() {
    return QuestionnaireUtils.getFlattenedItems(questionnaire);
  }, [questionnaire]);

  return (
    <Container maxWidth="lg" {...containerProps}>
      <Grid container spacing={3}>
        {showSidebar && (
          <Grid item xs={12} md={3}>
            <NavigationSidebar
              items={flattenedItems}
              response={response}
              onNavigate={(linkId) => {
                const element = document.getElementById(`question-${linkId}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              isDark={isDark}
              cardBgColor={cardBgColor}
              cardTextColor={cardTextColor}
              paperBgColor={paperBgColor}
              borderColor={borderColor}
            />
          </Grid>
        )}
        
        <Grid item xs={12} md={showSidebar ? 9 : 12}>
          <Paper elevation={3} {...paperProps} sx={{ bgcolor: paperBgColor, color: cardTextColor, ...paperProps.sx }}>
            <Box p={3}>
              {/* Header */}
              <Typography variant="h4" gutterBottom sx={{ color: cardTextColor }}>
                {get(questionnaire, 'title', 'Questionnaire')}
              </Typography>

              {get(questionnaire, 'description') && (
                <Typography variant="body1" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }} paragraph>
                  {get(questionnaire, 'description')}
                </Typography>
              )}

              <Divider sx={{ my: 2, borderColor: borderColor }} />
              
              {/* Progress */}
              {showProgress && (
                <>
                  <ProgressIndicator
                    total={completionStatus.total}
                    answered={completionStatus.answered}
                    percentage={completionStatus.percentage}
                    isDark={isDark}
                    cardTextColor={cardTextColor}
                    paperBgColor={paperBgColor}
                  />
                  <Divider sx={{ my: 2, borderColor: borderColor }} />
                </>
              )}
              
              {/* Validation errors */}
              {validationErrors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Please correct the following errors:
                  <ul>
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error.message}</li>
                    ))}
                  </ul>
                </Alert>
              )}
              
              {/* Save error */}
              {saveError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {saveError}
                </Alert>
              )}
              
              {/* Questionnaire items */}
              <Box sx={{ my: 3 }}>
                {renderItems(get(questionnaire, 'item', []))}
              </Box>
              
              {/* Action buttons */}
              {!readOnly && (
                <>
                  <Divider sx={{ my: 2, borderColor: borderColor }} />
                  <ActionButtons
                    onSubmit={onSubmit ? handleSubmit : null}
                    onSave={onSave ? save : null}
                    onCancel={onCancel}
                    onClearAll={handleClearAll}
                    isSubmitting={isSubmitted}
                    isSaving={isSaving}
                    lastSaved={lastSaved}
                    canSubmit={completionStatus.percentage === 100 || !showValidation}
                    isDark={isDark}
                    cardTextColor={cardTextColor}
                    borderColor={borderColor}
                  />
                </>
              )}
              
              {/* Loading indicator */}
              {(isSaving || isSubmitted) && (
                <LinearProgress sx={{ mt: 2 }} />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}