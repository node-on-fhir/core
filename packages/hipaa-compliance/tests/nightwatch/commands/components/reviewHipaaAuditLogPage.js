// packages/hipaa-compliance/tests/nightwatch/commands/components/reviewHipaaAuditLogPage.js

exports.command = function() {
  this
    .verify.elementPresent("#auditLogPage")
    .verify.elementPresent("#hipaaAuditLog")

  return this; 
};