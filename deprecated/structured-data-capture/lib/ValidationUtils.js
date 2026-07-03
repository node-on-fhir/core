// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/lib/ValidationUtils.js

import { get, isArray, isNumber } from 'lodash';
import moment from 'moment';

export const ValidationUtils = {
  /**
   * Validate a single answer against questionnaire item constraints
   */
  validateAnswer: function(item, answer) {
    const type = get(item, 'type');
    const value = ValidationUtils.extractAnswerValue(answer);
    
    if (value === null || value === undefined) {
      return { valid: true };
    }
    
    switch (type) {
      case 'boolean':
        return ValidationUtils.validateBoolean(value);
      case 'integer':
        return ValidationUtils.validateInteger(value, item);
      case 'decimal':
        return ValidationUtils.validateDecimal(value, item);
      case 'string':
      case 'text':
        return ValidationUtils.validateString(value, item);
      case 'date':
        return ValidationUtils.validateDate(value);
      case 'dateTime':
        return ValidationUtils.validateDateTime(value);
      case 'time':
        return ValidationUtils.validateTime(value);
      case 'url':
        return ValidationUtils.validateUrl(value);
      case 'choice':
        return ValidationUtils.validateChoice(value, item);
      case 'open-choice':
        return ValidationUtils.validateOpenChoice(value, item);
      case 'attachment':
        return ValidationUtils.validateAttachment(value, item);
      case 'reference':
        return ValidationUtils.validateReference(value);
      case 'quantity':
        return ValidationUtils.validateQuantity(value, item);
      default:
        return { valid: true };
    }
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
           get(answer, 'valueTime') || 
           get(answer, 'valueUri') ||
           get(answer, 'valueCoding') || 
           get(answer, 'valueQuantity') || 
           get(answer, 'valueReference') || 
           get(answer, 'valueAttachment');
  },

  /**
   * Validate boolean value
   */
  validateBoolean: function(value) {
    if (typeof value !== 'boolean') {
      return { valid: false, error: 'Value must be true or false' };
    }
    return { valid: true };
  },

  /**
   * Validate integer value
   */
  validateInteger: function(value, item) {
    if (!Number.isInteger(value)) {
      return { valid: false, error: 'Value must be a whole number' };
    }
    
    const minValue = get(item, 'extension', []).find(e => e.url === 'http://hl7.org/fhir/StructureDefinition/minValue');
    const maxValue = get(item, 'extension', []).find(e => e.url === 'http://hl7.org/fhir/StructureDefinition/maxValue');
    
    if (minValue && value < get(minValue, 'valueInteger')) {
      return { valid: false, error: `Value must be at least ${get(minValue, 'valueInteger')}` };
    }
    
    if (maxValue && value > get(maxValue, 'valueInteger')) {
      return { valid: false, error: `Value must be at most ${get(maxValue, 'valueInteger')}` };
    }
    
    return { valid: true };
  },

  /**
   * Validate decimal value
   */
  validateDecimal: function(value, item) {
    if (!isNumber(value)) {
      return { valid: false, error: 'Value must be a number' };
    }
    
    const minValue = get(item, 'extension', []).find(e => e.url === 'http://hl7.org/fhir/StructureDefinition/minValue');
    const maxValue = get(item, 'extension', []).find(e => e.url === 'http://hl7.org/fhir/StructureDefinition/maxValue');
    
    if (minValue && value < get(minValue, 'valueDecimal')) {
      return { valid: false, error: `Value must be at least ${get(minValue, 'valueDecimal')}` };
    }
    
    if (maxValue && value > get(maxValue, 'valueDecimal')) {
      return { valid: false, error: `Value must be at most ${get(maxValue, 'valueDecimal')}` };
    }
    
    return { valid: true };
  },

  /**
   * Validate string value
   */
  validateString: function(value, item) {
    if (typeof value !== 'string') {
      return { valid: false, error: 'Value must be text' };
    }
    
    const maxLength = get(item, 'maxLength');
    if (maxLength && value.length > maxLength) {
      return { valid: false, error: `Text must be no more than ${maxLength} characters` };
    }
    
    // Check regex pattern if specified
    const regex = get(item, 'extension', []).find(e => e.url === 'http://hl7.org/fhir/StructureDefinition/regex');
    if (regex) {
      const pattern = get(regex, 'valueString');
      if (pattern && !new RegExp(pattern).test(value)) {
        return { valid: false, error: 'Value does not match required format' };
      }
    }
    
    return { valid: true };
  },

  /**
   * Validate date value
   */
  validateDate: function(value) {
    if (!moment(value, 'YYYY-MM-DD', true).isValid()) {
      return { valid: false, error: 'Invalid date format (YYYY-MM-DD)' };
    }
    return { valid: true };
  },

  /**
   * Validate dateTime value
   */
  validateDateTime: function(value) {
    if (!moment(value).isValid()) {
      return { valid: false, error: 'Invalid date/time format' };
    }
    return { valid: true };
  },

  /**
   * Validate time value
   */
  validateTime: function(value) {
    if (!moment(value, 'HH:mm:ss', true).isValid() && !moment(value, 'HH:mm', true).isValid()) {
      return { valid: false, error: 'Invalid time format (HH:mm or HH:mm:ss)' };
    }
    return { valid: true };
  },

  /**
   * Validate URL value
   */
  validateUrl: function(value) {
    try {
      new URL(value);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid URL format' };
    }
  },

  /**
   * Validate choice value
   */
  validateChoice: function(value, item) {
    const answerOption = get(item, 'answerOption', []);
    const answerValueSet = get(item, 'answerValueSet');
    
    if (answerOption.length > 0) {
      const validCodes = answerOption.map(opt => get(opt, 'valueCoding.code'));
      const selectedCode = typeof value === 'string' ? value : get(value, 'code');
      
      if (!validCodes.includes(selectedCode)) {
        return { valid: false, error: 'Invalid choice selection' };
      }
    }
    
    // Note: answerValueSet validation would require external ValueSet lookup
    if (answerValueSet) {
      console.warn('ValueSet validation not implemented:', answerValueSet);
    }
    
    return { valid: true };
  },

  /**
   * Validate open-choice value
   */
  validateOpenChoice: function(value, item) {
    // If it's a string, it's a free-text answer which is always valid
    if (typeof value === 'string') {
      return ValidationUtils.validateString(value, item);
    }
    
    // Otherwise validate as a regular choice
    return ValidationUtils.validateChoice(value, item);
  },

  /**
   * Validate attachment value
   */
  validateAttachment: function(value, item) {
    if (!value || typeof value !== 'object') {
      return { valid: false, error: 'Invalid attachment' };
    }
    
    // Check required fields
    if (!get(value, 'data') && !get(value, 'url')) {
      return { valid: false, error: 'Attachment must have data or URL' };
    }
    
    // Check size constraints
    const maxSize = get(item, 'extension', []).find(e => e.url === 'http://hl7.org/fhir/StructureDefinition/maxSize');
    if (maxSize && get(value, 'size') > get(maxSize, 'valueDecimal')) {
      return { valid: false, error: `File size exceeds maximum of ${get(maxSize, 'valueDecimal')} bytes` };
    }
    
    return { valid: true };
  },

  /**
   * Validate reference value
   */
  validateReference: function(value) {
    if (!value || typeof value !== 'object') {
      return { valid: false, error: 'Invalid reference' };
    }
    
    if (!get(value, 'reference') && !get(value, 'identifier')) {
      return { valid: false, error: 'Reference must have reference or identifier' };
    }
    
    return { valid: true };
  },

  /**
   * Validate quantity value
   */
  validateQuantity: function(value, item) {
    if (!value || typeof value !== 'object') {
      return { valid: false, error: 'Invalid quantity' };
    }
    
    const quantityValue = get(value, 'value');
    if (!isNumber(quantityValue)) {
      return { valid: false, error: 'Quantity must have a numeric value' };
    }
    
    // Validate against min/max if specified
    const minValue = get(item, 'extension', []).find(e => e.url === 'http://hl7.org/fhir/StructureDefinition/minValue');
    const maxValue = get(item, 'extension', []).find(e => e.url === 'http://hl7.org/fhir/StructureDefinition/maxValue');
    
    if (minValue && quantityValue < get(minValue, 'valueQuantity.value')) {
      return { valid: false, error: `Value must be at least ${get(minValue, 'valueQuantity.value')}` };
    }
    
    if (maxValue && quantityValue > get(maxValue, 'valueQuantity.value')) {
      return { valid: false, error: `Value must be at most ${get(maxValue, 'valueQuantity.value')}` };
    }
    
    return { valid: true };
  },

  /**
   * Validate entire questionnaire response
   */
  validateQuestionnaireResponse: function(questionnaire, response) {
    const results = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    function validateItems(qItems, rItems, path = '') {
      if (!isArray(qItems)) return;
      
      qItems.forEach(function(qItem) {
        const linkId = get(qItem, 'linkId');
        const type = get(qItem, 'type');
        const required = get(qItem, 'required', false);
        const repeats = get(qItem, 'repeats', false);
        
        // Find corresponding response item
        const rItem = rItems ? rItems.find(r => get(r, 'linkId') === linkId) : null;
        const answers = get(rItem, 'answer', []);
        
        // Check if item should be enabled
        const isEnabled = ValidationUtils.isItemEnabled(qItem, response);
        
        if (isEnabled) {
          // Check required
          if (required && type !== 'group' && type !== 'display' && answers.length === 0) {
            results.errors.push({
              linkId,
              path: path ? `${path}.${linkId}` : linkId,
              message: `"${get(qItem, 'text')}" is required`
            });
            results.valid = false;
          }
          
          // Check repeats
          if (!repeats && answers.length > 1) {
            results.errors.push({
              linkId,
              path: path ? `${path}.${linkId}` : linkId,
              message: `"${get(qItem, 'text')}" does not allow multiple answers`
            });
            results.valid = false;
          }
          
          // Validate each answer
          answers.forEach(function(answer, index) {
            const validation = ValidationUtils.validateAnswer(qItem, answer);
            if (!validation.valid) {
              results.errors.push({
                linkId,
                path: path ? `${path}.${linkId}[${index}]` : `${linkId}[${index}]`,
                message: validation.error
              });
              results.valid = false;
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
    
    return results;
  },

  /**
   * Check if item should be enabled based on enableWhen
   */
  isItemEnabled: function(item, response) {
    // This is a simplified version - full implementation would use QuestionnaireUtils
    return true;
  }
};

// Make available in both client and server
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValidationUtils;
}