// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/lib/ResponseUtils.js

import { get, set, cloneDeep, isArray } from 'lodash';
import { Random } from 'meteor/random';

export const ResponseUtils = {
  /**
   * Initialize a new QuestionnaireResponse from a Questionnaire
   * @param {Object} questionnaire - FHIR Questionnaire resource
   * @param {Object} options - Additional options (subject, author, etc)
   * @returns {Object} New QuestionnaireResponse resource
   */
  initializeResponse: function(questionnaire, options = {}) {
    const response = {
      resourceType: 'QuestionnaireResponse',
      id: options.id || Random.id(),
      status: 'in-progress',
      authored: new Date().toISOString(),
      questionnaire: get(questionnaire, 'url') || get(questionnaire, 'id'),
      item: []
    };
    
    if (options.subject) {
      response.subject = options.subject;
    }
    
    if (options.author) {
      response.author = options.author;
    }
    
    if (options.encounter) {
      response.encounter = options.encounter;
    }
    
    // Initialize response structure based on questionnaire
    response.item = ResponseUtils.initializeResponseItems(get(questionnaire, 'item', []));
    
    return response;
  },

  /**
   * Initialize response items based on questionnaire items
   */
  initializeResponseItems: function(questionnaireItems) {
    if (!isArray(questionnaireItems)) return [];
    
    return questionnaireItems.map(function(qItem) {
      const responseItem = {
        linkId: get(qItem, 'linkId'),
        text: get(qItem, 'text')
      };
      
      // Initialize answer array for answerable types
      const type = get(qItem, 'type');
      if (type !== 'group' && type !== 'display') {
        responseItem.answer = [];
      }
      
      // Recursively initialize nested items
      if (get(qItem, 'item')) {
        responseItem.item = ResponseUtils.initializeResponseItems(qItem.item);
      }
      
      return responseItem;
    });
  },

  /**
   * Update answer in QuestionnaireResponse
   * @param {Object} response - QuestionnaireResponse to update
   * @param {String} linkId - LinkId of item to update
   * @param {*} value - New value
   * @param {String} type - Question type
   * @returns {Object} Updated response (cloned)
   */
  updateAnswer: function(response, linkId, value, type) {
    const newResponse = cloneDeep(response);
    
    function updateItem(items, parentPath = '') {
      if (!isArray(items)) return false;
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const currentPath = parentPath ? `${parentPath}.item[${i}]` : `item[${i}]`;
        
        if (get(item, 'linkId') === linkId) {
          // Create answer from value
          const answer = ResponseUtils.createAnswerFromValue(value, type);
          set(newResponse, `${currentPath}.answer`, answer);
          return true;
        }
        
        // Recursively search nested items
        if (get(item, 'item')) {
          if (updateItem(item.item, currentPath)) {
            return true;
          }
        }
      }
      
      return false;
    }
    
    const updated = updateItem(get(newResponse, 'item', []));
    
    if (!updated) {
      console.warn('Could not find item with linkId:', linkId);
    }
    
    return newResponse;
  },

  /**
   * Create answer array from value based on type
   */
  createAnswerFromValue: function(value, type) {
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
        if (typeof value === 'object' && value.code) {
          answer.valueCoding = value;
        } else {
          answer.valueCoding = { code: value };
        }
        break;
      case 'open-choice':
        if (typeof value === 'string') {
          answer.valueString = value;
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
   * Clear answer for a specific linkId
   */
  clearAnswer: function(response, linkId) {
    return ResponseUtils.updateAnswer(response, linkId, null, null);
  },

  /**
   * Clear all answers in response
   */
  clearAllAnswers: function(response) {
    const newResponse = cloneDeep(response);
    
    function clearItems(items) {
      if (!isArray(items)) return;
      
      items.forEach(function(item) {
        if (get(item, 'answer')) {
          item.answer = [];
        }
        
        if (get(item, 'item')) {
          clearItems(item.item);
        }
      });
    }
    
    clearItems(get(newResponse, 'item', []));
    return newResponse;
  },

  /**
   * Validate response against questionnaire
   */
  validateResponse: function(questionnaire, response) {
    const errors = [];
    const warnings = [];
    
    function validateItems(qItems, rItems, path = '') {
      if (!isArray(qItems)) return;
      
      qItems.forEach(function(qItem) {
        const linkId = get(qItem, 'linkId');
        const type = get(qItem, 'type');
        const required = get(qItem, 'required', false);
        const repeats = get(qItem, 'repeats', false);
        const maxLength = get(qItem, 'maxLength');
        
        // Find corresponding response item
        const rItem = rItems ? rItems.find(r => get(r, 'linkId') === linkId) : null;
        const answers = get(rItem, 'answer', []);
        
        // Check required
        if (required && type !== 'group' && type !== 'display') {
          if (answers.length === 0) {
            errors.push({
              linkId,
              path: path ? `${path}.${linkId}` : linkId,
              message: `"${get(qItem, 'text')}" is required`
            });
          }
        }
        
        // Check repeats
        if (!repeats && answers.length > 1) {
          errors.push({
            linkId,
            path: path ? `${path}.${linkId}` : linkId,
            message: `"${get(qItem, 'text')}" does not allow multiple answers`
          });
        }
        
        // Check maxLength for string types
        if (maxLength && (type === 'string' || type === 'text')) {
          answers.forEach(function(answer) {
            const value = get(answer, 'valueString', '');
            if (value.length > maxLength) {
              errors.push({
                linkId,
                path: path ? `${path}.${linkId}` : linkId,
                message: `"${get(qItem, 'text')}" exceeds maximum length of ${maxLength}`
              });
            }
          });
        }
        
        // Validate nested items
        if (get(qItem, 'item') && get(rItem, 'item')) {
          validateItems(qItem.item, rItem.item, path ? `${path}.${linkId}` : linkId);
        }
      });
    }
    
    validateItems(get(questionnaire, 'item', []), get(response, 'item', []));
    
    return { errors, warnings, isValid: errors.length === 0 };
  },

  /**
   * Extract all answers as key-value pairs
   */
  extractAnswers: function(response) {
    const answers = {};
    
    function extractFromItems(items) {
      if (!isArray(items)) return;
      
      items.forEach(function(item) {
        const linkId = get(item, 'linkId');
        const answer = get(item, 'answer[0]');
        
        if (answer) {
          answers[linkId] = ResponseUtils.extractAnswerValue(answer);
        }
        
        if (get(item, 'item')) {
          extractFromItems(item.item);
        }
      });
    }
    
    extractFromItems(get(response, 'item', []));
    return answers;
  },

  /**
   * Extract value from answer object
   */
  extractAnswerValue: function(answer) {
    return get(answer, 'valueString') || 
           get(answer, 'valueBoolean') || 
           get(answer, 'valueInteger') || 
           get(answer, 'valueDecimal') || 
           get(answer, 'valueDate') || 
           get(answer, 'valueDateTime') || 
           get(answer, 'valueCoding') || 
           get(answer, 'valueQuantity') || 
           get(answer, 'valueReference') || 
           get(answer, 'valueAttachment') || 
           null;
  }
};

// Make available in both client and server
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponseUtils;
}