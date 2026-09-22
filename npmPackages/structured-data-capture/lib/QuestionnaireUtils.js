// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/lib/QuestionnaireUtils.js

import { get, set, cloneDeep, isArray } from 'lodash';

export const QuestionnaireUtils = {
  /**
   * Walk through questionnaire tree structure recursively
   * @param {Array} items - Array of questionnaire items
   * @param {Function} callback - Function to call for each item
   * @param {Number} depth - Current depth in tree
   */
  walkQuestionnaireTree: function(items, callback, depth = 0) {
    if (!isArray(items)) return;
    
    items.forEach(function(item, index) {
      callback(item, index, depth);
      
      if (get(item, 'item')) {
        QuestionnaireUtils.walkQuestionnaireTree(item.item, callback, depth + 1);
      }
    });
  },

  /**
   * Find item by linkId in questionnaire structure
   * @param {Object} questionnaire - FHIR Questionnaire resource
   * @param {String} linkId - LinkId to search for
   * @returns {Object|null} Found item or null
   */
  findItemByLinkId: function(questionnaire, linkId) {
    let foundItem = null;
    
    QuestionnaireUtils.walkQuestionnaireTree(get(questionnaire, 'item', []), function(item) {
      if (get(item, 'linkId') === linkId) {
        foundItem = item;
      }
    });
    
    return foundItem;
  },

  /**
   * Get all items as flat array with depth information
   * @param {Object} questionnaire - FHIR Questionnaire resource
   * @returns {Array} Flat array of items with depth
   */
  getFlattenedItems: function(questionnaire) {
    const items = [];
    
    QuestionnaireUtils.walkQuestionnaireTree(get(questionnaire, 'item', []), function(item, index, depth) {
      items.push({
        ...item,
        _depth: depth,
        _index: index
      });
    });
    
    return items;
  },

  /**
   * Check if item should be enabled based on enableWhen conditions
   * @param {Object} item - Questionnaire item
   * @param {Object} questionnaireResponse - Current response
   * @returns {Boolean} Whether item should be enabled
   */
  isItemEnabled: function(item, questionnaireResponse) {
    const enableWhen = get(item, 'enableWhen', []);
    if (enableWhen.length === 0) return true;
    
    const enableBehavior = get(item, 'enableBehavior', 'all');
    
    const results = enableWhen.map(function(condition) {
      const targetItem = QuestionnaireUtils.findResponseItemByLinkId(
        questionnaireResponse, 
        get(condition, 'question')
      );
      
      if (!targetItem) return false;
      
      const operator = get(condition, 'operator');
      const expectedAnswer = get(condition, 'answer');
      const actualAnswer = get(targetItem, 'answer[0]');
      
      switch (operator) {
        case 'exists':
          return get(expectedAnswer, 'valueBoolean') ? 
            (actualAnswer !== undefined) : 
            (actualAnswer === undefined);
        case '=':
          return QuestionnaireUtils.answersEqual(actualAnswer, expectedAnswer);
        case '!=':
          return !QuestionnaireUtils.answersEqual(actualAnswer, expectedAnswer);
        case '>':
        case '<':
        case '>=':
        case '<=':
          return QuestionnaireUtils.compareNumericAnswers(actualAnswer, expectedAnswer, operator);
        default:
          console.warn('Unknown enableWhen operator:', operator);
          return false;
      }
    });
    
    return enableBehavior === 'all' ? 
      results.every(r => r) : 
      results.some(r => r);
  },

  /**
   * Compare two answers for equality
   */
  answersEqual: function(actual, expected) {
    if (!actual || !expected) return false;
    
    const actualValue = get(actual, 'valueString') || 
                       get(actual, 'valueBoolean') || 
                       get(actual, 'valueInteger') || 
                       get(actual, 'valueDecimal') || 
                       get(actual, 'valueDate') || 
                       get(actual, 'valueDateTime') || 
                       get(actual, 'valueCoding.code');
                       
    const expectedValue = get(expected, 'valueString') || 
                         get(expected, 'valueBoolean') || 
                         get(expected, 'valueInteger') || 
                         get(expected, 'valueDecimal') || 
                         get(expected, 'valueDate') || 
                         get(expected, 'valueDateTime') || 
                         get(expected, 'valueCoding.code');
    
    return actualValue === expectedValue;
  },

  /**
   * Compare numeric answers
   */
  compareNumericAnswers: function(actual, expected, operator) {
    const actualValue = get(actual, 'valueInteger') || get(actual, 'valueDecimal') || 0;
    const expectedValue = get(expected, 'valueInteger') || get(expected, 'valueDecimal') || 0;
    
    switch (operator) {
      case '>': return actualValue > expectedValue;
      case '<': return actualValue < expectedValue;
      case '>=': return actualValue >= expectedValue;
      case '<=': return actualValue <= expectedValue;
      default: return false;
    }
  },

  /**
   * Find response item by linkId
   */
  findResponseItemByLinkId: function(response, linkId) {
    let foundItem = null;
    
    function searchItems(items) {
      if (!isArray(items)) return;
      
      items.forEach(function(item) {
        if (get(item, 'linkId') === linkId) {
          foundItem = item;
        } else if (get(item, 'item')) {
          searchItems(item.item);
        }
      });
    }
    
    searchItems(get(response, 'item', []));
    return foundItem;
  },

  /**
   * Get answer value from response item.
   * Falsy-safe: iterates known value keys and returns the first whose value
   * is !== undefined, so false (boolean) and 0 (integer) survive.
   * Multi-answer: when item.answer has more than one entry, returns an array
   * of per-entry extracted values (supports repeats/choice multi-select).
   * Zero entries → null (preserves the empty-answer contract).
   */
  getAnswerValue: function(item) {
    const answers = get(item, 'answer', []);
    if (!answers || answers.length === 0) return null;

    var VALUE_KEYS = [
      'valueString', 'valueBoolean', 'valueInteger', 'valueDecimal',
      'valueDate', 'valueDateTime', 'valueTime', 'valueUri',
      'valueCoding', 'valueQuantity', 'valueReference', 'valueAttachment'
    ];

    function extractOne(answer) {
      for (var i = 0; i < VALUE_KEYS.length; i++) {
        var v = get(answer, VALUE_KEYS[i]);
        if (v !== undefined) { return v; }
      }
      return undefined;
    }

    if (answers.length === 1) {
      var single = extractOne(answers[0]);
      return single !== undefined ? single : null;
    }

    // Multiple answer entries (repeats) — return array of values
    return answers.map(function(a) { return extractOne(a); });
  },

  /**
   * Create answer object based on type
   */
  createAnswer: function(type, value) {
    if (value === null || value === undefined || value === '') {
      return [];
    }
    
    const answer = {};
    
    switch (type) {
      case 'boolean':
        answer.valueBoolean = Boolean(value);
        break;
      case 'decimal':
        answer.valueDecimal = parseFloat(value);
        break;
      case 'integer':
        answer.valueInteger = parseInt(value, 10);
        break;
      case 'date':
        answer.valueDate = value;
        break;
      case 'dateTime':
        answer.valueDateTime = value;
        break;
      case 'time':
        answer.valueTime = value;
        break;
      case 'string':
      case 'text':
        answer.valueString = value;
        break;
      case 'url':
        answer.valueUri = value;
        break;
      case 'choice':
        if (typeof value === 'string') {
          answer.valueCoding = { code: value };
        } else {
          answer.valueCoding = value;
        }
        break;
      case 'attachment':
        answer.valueAttachment = value;
        break;
      case 'reference':
        answer.valueReference = value;
        break;
      case 'quantity':
        answer.valueQuantity = value;
        break;
      default:
        console.warn('Unknown question type:', type);
        answer.valueString = String(value);
    }
    
    return [answer];
  },

  /**
   * Calculate completion status
   */
  calculateCompletionStatus: function(questionnaire, questionnaireResponse) {
    let totalQuestions = 0;
    let answeredQuestions = 0;
    
    QuestionnaireUtils.walkQuestionnaireTree(get(questionnaire, 'item', []), function(item) {
      const type = get(item, 'type');
      
      if (type !== 'group' && type !== 'display') {
        const required = get(item, 'required', false);
        const linkId = get(item, 'linkId');
        
        if (QuestionnaireUtils.isItemEnabled(item, questionnaireResponse)) {
          totalQuestions++;
          
          const responseItem = QuestionnaireUtils.findResponseItemByLinkId(questionnaireResponse, linkId);
          if (responseItem && get(responseItem, 'answer.length') > 0) {
            answeredQuestions++;
          }
        }
      }
    });
    
    return {
      total: totalQuestions,
      answered: answeredQuestions,
      percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
    };
  }
};

// Make available in both client and server
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuestionnaireUtils;
}