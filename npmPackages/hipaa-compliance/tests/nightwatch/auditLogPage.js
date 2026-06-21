// packages/hipaa-compliance/tests/nightwatch/auditLogPage.js

module.exports = {
  url: function() {
    return this.api.globals.devServerURL + '/hipaa/audit-log';
  },
  commands: [{
    verifyElements: function() {
      return this
        .waitForElementPresent('#auditLogPage', 10000)
        .verify.elementPresent('#hipaaAuditLog')
        .verify.elementPresent('h4')
        .verify.containsText('h4', 'HIPAA Audit Log');
    },
    verifyAuditEntry: function(index, eventData) {
      const rowSelector = `#hipaaAuditLog tbody tr:nth-child(${index})`;
      
      return this
        .waitForElementPresent(rowSelector, 5000)
        .verify.elementPresent(`${rowSelector} td:nth-child(2)`) // Event type
        .verify.containsText(`${rowSelector} td:nth-child(2)`, eventData.eventType)
        .verify.elementPresent(`${rowSelector} td:nth-child(3)`) // User
        .verify.containsText(`${rowSelector} td:nth-child(3)`, eventData.userName || eventData.userId);
    },
    filterByEventType: function(eventType) {
      return this
        .click('[data-testid="filters-tab"]')
        .waitForElementPresent('[data-testid="event-type-filter"]')
        .click('[data-testid="event-type-filter"]')
        .click(`[data-value="${eventType}"]`)
        .click('[data-testid="apply-filters"]');
    },
    exportAuditLog: function() {
      return this
        .waitForElementPresent('[data-testid="export-button"]')
        .click('[data-testid="export-button"]');
    }
  }],
  elements: {
    auditLogPage: {
      selector: '#auditLogPage'
    },
    auditLogTable: {
      selector: '#hipaaAuditLog'
    },
    exportButton: {
      selector: '[data-testid="export-button"]'
    },
    refreshButton: {
      selector: '[data-testid="refresh-button"]'
    },
    reportButton: {
      selector: '[data-testid="report-button"]'
    },
    filtersTab: {
      selector: '[data-testid="filters-tab"]'
    },
    statisticsTab: {
      selector: '[data-testid="statistics-tab"]'
    }
  }
};