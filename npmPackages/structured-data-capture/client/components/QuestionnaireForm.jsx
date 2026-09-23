// npmPackages/structured-data-capture/client/components/QuestionnaireForm.jsx
//
// Shared FHIR Questionnaire renderer — SDC CONSOLE skin. This component is the
// single theming seam (advanced-theming pattern, see ../consoleTheme.js): it
// reads the live MUI theme, injects the `.sdc-console` var block, and delivers
// var() values to subcomponents THROUGH the legacy color props (isDark /
// cardBgColor / cardTextColor / paperBgColor / borderColor), which remain
// accepted from callers for compatibility but no longer drive the skin.

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import {
  Box,
  Container,
  Typography,
  Alert,
  LinearProgress,
  Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { get } from 'lodash';
import moment from 'moment';
import { useQuestionnaireState } from '../hooks/useQuestionnaireState';
import { useResponseTracking } from '../hooks/useResponseTracking';
import { QuestionItem } from './QuestionItem';
import { ProgressIndicator } from './ProgressIndicator';
import { NavigationSidebar } from './NavigationSidebar';
import { ActionButtons } from './ActionButtons';
import { ThankYouPage } from './ThankYouPage';
import { ValidationUtils } from '../../lib/ValidationUtils';
import { QuestionnaireUtils } from '../../lib/QuestionnaireUtils';
import { injectSdcConsoleStyles, Brackets } from '../consoleTheme';

// Console var() values delivered through the legacy color-prop plumbing so
// every subcomponent stays theme-agnostic.
const CONSOLE_COLORS = {
  cardBgColor: 'var(--panel-hard)',
  cardTextColor: 'var(--ink)',
  paperBgColor: 'var(--panel)',
  borderColor: 'var(--hairline)'
};

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
    autoSaveDelay = 1000,
    aiFilledLinkIds = []
  } = props;

  // Live MUI theme -> console vars. The mode still rides Meteor.useTheme for
  // subcomponent isDark conditionals (legacy props stay accepted from callers
  // but the console skin supersedes their color values).
  const muiTheme = useTheme();
  const appTheme = (Meteor.useTheme ? Meteor.useTheme() : { theme: 'light' });
  const themeIsDark = appTheme.theme === 'dark';
  const isDark = props.isDark !== undefined ? props.isDark : themeIsDark;

  useEffect(function() {
    injectSdcConsoleStyles(muiTheme);
  }, [muiTheme]);

  // State
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showThankYou, setShowThankYou] = useState(false);
  // linkIds the user has edited since prefill — their AI chip is retired
  const [touchedLinkIds, setTouchedLinkIds] = useState([]);

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
    setTouchedLinkIds(function(prev) {
      return prev.includes(linkId) ? prev : [...prev, linkId];
    });

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
          aiFilled={aiFilledLinkIds.includes(linkId) && !touchedLinkIds.includes(linkId)}
          isDark={isDark}
          {...CONSOLE_COLORS}
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
    aiFilledLinkIds,
    touchedLinkIds,
    isDark
  ]);

  // Show thank you page if submitted
  if (showThankYou && thankYouPage) {
    return (
      <Box className="sdc-console">
        <ThankYouPage
          message={thankYouPage.message}
          redirectUrl={thankYouPage.redirectUrl}
          redirectDelay={thankYouPage.redirectDelay}
          onClose={() => setShowThankYou(false)}
          isDark={isDark}
          {...CONSOLE_COLORS}
        />
      </Box>
    );
  }

  // Get flattened items for navigation
  const flattenedItems = useMemo(function() {
    return QuestionnaireUtils.getFlattenedItems(questionnaire);
  }, [questionnaire]);

  // Masthead metadata readout: status · patient · save state
  const patientDisplay = get(response, 'subject.display');
  const mastheadSegments = [
    readOnly ? 'READ-ONLY' : String(get(response, 'status', 'in-progress')).toUpperCase(),
    patientDisplay ? String(patientDisplay).toUpperCase() : null,
    isSaving
      ? 'SAVING'
      : (lastSaved ? 'SAVED ' + moment(lastSaved).format('HH:mm:ss') : null)
  ].filter(Boolean);

  return (
    <Box className="sdc-console">
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
                {...CONSOLE_COLORS}
              />
            </Grid>
          )}

          <Grid item xs={12} md={showSidebar ? 9 : 12}>
            <Box
              className="sdc-boot"
              {...paperProps}
              sx={{
                position: 'relative',
                bgcolor: 'var(--panel)',
                border: '1px solid var(--hairline)',
                color: 'var(--ink)',
                ...(paperProps.sx || {})
              }}
            >
              <Brackets />
              <Box p={3}>
                {/* Masthead */}
                <Typography
                  component="div"
                  sx={{
                    fontFamily: 'var(--mono)',
                    fontSize: '10px',
                    letterSpacing: '0.28em',
                    color: 'var(--stone)',
                    mb: 1
                  }}
                >
                  STRUCTURED DATA CAPTURE
                </Typography>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontFamily: 'var(--display)',
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    color: 'var(--ink)',
                    lineHeight: 1.15
                  }}
                >
                  {get(questionnaire, 'title', 'Questionnaire')}
                </Typography>
                <Box
                  className="sdc-rule"
                  sx={{ height: '1px', bgcolor: 'var(--accent)', mt: 1.5, mb: 1 }}
                />
                <Typography
                  component="div"
                  sx={{
                    fontFamily: 'var(--mono)',
                    fontSize: '10px',
                    letterSpacing: '0.18em',
                    color: 'var(--stone)',
                    mb: 2
                  }}
                >
                  {mastheadSegments.join(' · ')}
                  {isSaving && <Box component="span" className="sdc-caret" sx={{ color: 'var(--accent)' }}>_</Box>}
                </Typography>

                {get(questionnaire, 'description') && (
                  <Typography variant="body1" sx={{ color: 'var(--stone)' }} paragraph>
                    {get(questionnaire, 'description')}
                  </Typography>
                )}

                {/* Progress */}
                {showProgress && (
                  <Box sx={{ my: 2 }}>
                    <ProgressIndicator
                      total={completionStatus.total}
                      answered={completionStatus.answered}
                      percentage={completionStatus.percentage}
                      isDark={isDark}
                      cardTextColor={CONSOLE_COLORS.cardTextColor}
                      paperBgColor={CONSOLE_COLORS.paperBgColor}
                    />
                  </Box>
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
                    <Box sx={{ height: '1px', bgcolor: 'var(--hairline)', my: 2 }} />
                    <ActionButtons
                      onSubmit={onSubmit ? handleSubmit : null}
                      onSave={onSave ? save : null}
                      onCancel={onCancel}
                      onClearAll={handleClearAll}
                      isSubmitting={isSubmitted}
                      isSaving={isSaving}
                      lastSaved={lastSaved}
                      showLastSaved={false}
                      canSubmit={completionStatus.percentage === 100 || !showValidation}
                      isDark={isDark}
                      cardTextColor={CONSOLE_COLORS.cardTextColor}
                      borderColor={CONSOLE_COLORS.borderColor}
                    />
                  </>
                )}

                {/* Loading indicator */}
                {(isSaving || isSubmitted) && (
                  <LinearProgress
                    sx={{
                      mt: 2,
                      height: 2,
                      bgcolor: 'transparent',
                      '& .MuiLinearProgress-bar': { bgcolor: 'var(--accent)' }
                    }}
                  />
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
