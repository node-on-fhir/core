// /packages/pacio-core/lib/utilities/AdvanceDirectiveUtils.js

import { get } from 'lodash';
import moment from 'moment';

export const AdvanceDirectiveUtils = {
  // Status helpers
  getStatus: function(directive) {
    return get(directive, 'status', 'unknown');
  },
  
  isCurrent: function(directive) {
    const status = this.getStatus(directive);
    return status === 'completed' || status === 'active';
  },
  
  isSuperseded: function(directive) {
    return this.getStatus(directive) === 'superseded';
  },
  
  isRevoked: function(directive) {
    return this.getStatus(directive) === 'entered-in-error';
  },
  
  isDraft: function(directive) {
    return this.getStatus(directive) === 'draft';
  },
  
  // Filter directives by status
  filterByStatus: function(directives, statusFilter) {
    if (!Array.isArray(directives)) return [];
    if (statusFilter === 'all') return directives;
    
    return directives.filter(function(directive) {
      switch (statusFilter) {
        case 'current':
          return AdvanceDirectiveUtils.isCurrent(directive);
        case 'superseded':
          return AdvanceDirectiveUtils.isSuperseded(directive);
        case 'entered-in-error':
        case 'revoked':
          return AdvanceDirectiveUtils.isRevoked(directive);
        case 'draft':
          return AdvanceDirectiveUtils.isDraft(directive);
        default:
          return directive.status === statusFilter;
      }
    });
  },
  
  // Get directive type
  getType: function(directive) {
    return get(directive, 'type.coding[0].display', 
           get(directive, 'type.coding[0].code', 'Unknown'));
  },
  
  getTypeCode: function(directive) {
    return get(directive, 'type.coding[0].code');
  },
  
  // Common directive types — the full set feeds AdiConstants.typeCodes, which is
  // the single matcher (isAdiDocument / adiSelectorQuery) used by the ToC page,
  // publications, and the revoke guard. Every code creatable from the Advance
  // Directives page upload dialog must appear here or its documents vanish from
  // those consumers.
  //
  // Codes verified against loinc.org (2026-07-13); displays are the LOINC
  // long common names. The old list carried codes that don't exist in LOINC
  // (89666-0, 89897-1, 89051-3, 75790-5) or resolve to unrelated concepts
  // (71388-3 is "CMS - physical exam panel") — those live on only in
  // LegacyDirectiveTypeCodes below so previously created documents still match.
  DirectiveTypes: {
    ADVANCE_HEALTHCARE_DIRECTIVES: '42348-3',  // Advance healthcare directives
    ADVANCE_DIRECTIVE: '75320-2',              // Advance directive
    PERSONAL_ADVANCE_CARE_PLAN: '81334-5',     // Patient Personal advance care plan
    POWER_OF_ATTORNEY: '64298-3',              // Power of attorney
    POA_AND_LIVING_WILL: '92664-2',            // Power of attorney and Living will
    PORTABLE_MEDICAL_ORDER: '93037-0',         // Portable medical order form (POLST/MOLST/POST)
    DNR_ORDER_REPORTED: '81351-9'              // DNR/DNAR/AND order is in place - Reported
  },

  // Non-LOINC codes written by earlier builds of this page. Kept ONLY so
  // existing DocumentReferences keep matching isAdiDocument/adiSelectorQuery;
  // never offer these for new documents.
  LegacyDirectiveTypeCodes: ['89666-0', '89897-1', '71388-3', '89051-3', '75790-5'],

  // Check specific directive types
  isPersonalAdvanceCarePlan: function(directive) {
    return this.getTypeCode(directive) === this.DirectiveTypes.PERSONAL_ADVANCE_CARE_PLAN;
  },

  isPowerOfAttorney: function(directive) {
    const code = this.getTypeCode(directive);
    return code === this.DirectiveTypes.POWER_OF_ATTORNEY ||
           code === this.DirectiveTypes.POA_AND_LIVING_WILL;
  },

  isDNR: function(directive) {
    return this.getTypeCode(directive) === this.DirectiveTypes.DNR_ORDER_REPORTED;
  },

  isPOLST: function(directive) {
    return this.getTypeCode(directive) === this.DirectiveTypes.PORTABLE_MEDICAL_ORDER;
  },
  
  // Get authors
  getAuthors: function(directive) {
    return get(directive, 'author', []);
  },
  
  getPrimaryAuthor: function(directive) {
    const authors = this.getAuthors(directive);
    return authors.length > 0 ? authors[0] : null;
  },
  
  getAuthorDisplay: function(directive) {
    const author = this.getPrimaryAuthor(directive);
    return get(author, 'display', 'Unknown Author');
  },
  
  // Get content/attachments
  getContent: function(directive) {
    return get(directive, 'content', []);
  },
  
  getPrimaryAttachment: function(directive) {
    const content = this.getContent(directive);
    return content.length > 0 ? get(content[0], 'attachment') : null;
  },
  
  hasPdfAttachment: function(directive) {
    const attachment = this.getPrimaryAttachment(directive);
    return attachment && get(attachment, 'contentType') === 'application/pdf';
  },
  
  getPdfUrl: function(directive) {
    if (this.hasPdfAttachment(directive)) {
      return get(this.getPrimaryAttachment(directive), 'url');
    }
    return null;
  },
  
  // Date helpers
  getDate: function(directive) {
    return get(directive, 'date');
  },
  
  getFormattedDate: function(directive, format = 'MMMM D, YYYY') {
    const date = this.getDate(directive);
    return date ? moment(date).format(format) : 'Unknown Date';
  },
  
  getAge: function(directive) {
    const date = this.getDate(directive);
    if (!date) return null;
    
    const now = moment();
    const directiveDate = moment(date);
    const years = now.diff(directiveDate, 'years');
    const months = now.diff(directiveDate, 'months') % 12;
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} old`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''} old`;
    } else {
      const days = now.diff(directiveDate, 'days');
      return `${days} day${days > 1 ? 's' : ''} old`;
    }
  },
  
  isExpired: function(directive, expirationYears = 5) {
    const date = this.getDate(directive);
    if (!date) return false;
    
    const expirationDate = moment(date).add(expirationYears, 'years');
    return moment().isAfter(expirationDate);
  },
  
  // Version helpers
  getVersion: function(directive) {
    return get(directive, 'versionNumber', '1.0');
  },
  
  isNewerVersion: function(directive1, directive2) {
    const version1 = parseFloat(this.getVersion(directive1));
    const version2 = parseFloat(this.getVersion(directive2));
    return version1 > version2;
  },
  
  // Find the most recent directive
  getMostRecent: function(directives) {
    if (!Array.isArray(directives) || directives.length === 0) return null;
    
    return directives.reduce(function(mostRecent, current) {
      const mostRecentDate = moment(AdvanceDirectiveUtils.getDate(mostRecent));
      const currentDate = moment(AdvanceDirectiveUtils.getDate(current));
      
      return currentDate.isAfter(mostRecentDate) ? current : mostRecent;
    });
  },
  
  // Group directives by type
  groupByType: function(directives) {
    const groups = {};
    
    directives.forEach(function(directive) {
      const type = AdvanceDirectiveUtils.getType(directive);
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(directive);
    });
    
    return groups;
  },
  
  // Validation helpers
  isValid: function(directive) {
    return directive && 
           this.getStatus(directive) && 
           this.getType(directive) &&
           this.getDate(directive);
  },
  
  getValidationErrors: function(directive) {
    const errors = [];
    
    if (!directive) {
      errors.push('Directive is null or undefined');
      return errors;
    }
    
    if (!this.getStatus(directive)) {
      errors.push('Status is required');
    }
    
    if (!this.getType(directive)) {
      errors.push('Type is required');
    }
    
    if (!this.getDate(directive)) {
      errors.push('Date is required');
    }
    
    if (this.getAuthors(directive).length === 0) {
      errors.push('At least one author is required');
    }
    
    if (!get(directive, 'subject')) {
      errors.push('Subject (patient) is required');
    }
    
    return errors;
  },
  
  // Create a summary object
  createSummary: function(directive) {
    return {
      id: get(directive, 'id'),
      type: this.getType(directive),
      typeCode: this.getTypeCode(directive),
      status: this.getStatus(directive),
      date: this.getDate(directive),
      formattedDate: this.getFormattedDate(directive),
      age: this.getAge(directive),
      author: this.getAuthorDisplay(directive),
      version: this.getVersion(directive),
      hasPdf: this.hasPdfAttachment(directive),
      pdfUrl: this.getPdfUrl(directive),
      isCurrent: this.isCurrent(directive),
      isRevoked: this.isRevoked(directive),
      isExpired: this.isExpired(directive)
    };
  }
};