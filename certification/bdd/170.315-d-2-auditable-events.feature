# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-d-2-auditable-events.feature
# § 170.315(d)(2) - Auditable Events and Tamper-Resistance

# REGULATORY TEXT FROM 45 CFR § 170.315(d)(2)
#
# (2) Auditable events and tamper-resistance —
# (i) Record actions.  Technology must be able to:
# (A) Record actions related to electronic health information in accordance with the standard specified in § 170.210(e)(1);
# (B) Record the audit log status (enabled or disabled) in accordance with the standard specified in § 170.210(e)(2) unless it cannot be disabled by any user; and
# (C) Record the encryption status (enabled or disabled) of electronic health information locally stored on end-user devices by technology in accordance with the standard specified in § 170.210(e)(3) unless the technology prevents electronic health information from being locally stored on end-user devices (see paragraph (d)(7) of this section).
# (ii) Default setting.  Technology must be set by default to perform the capabilities specified in paragraph (d)(2)(i)(A) of this section and, where applicable, paragraphs (d)(2)(i)(B) and (d)(2)(i)(C) of this section.
# (iii) When disabling the audit log is permitted.  For each capability specified in paragraphs (d)(2)(i)(A) through (C) of this section that technology permits to be disabled, the ability to do so must be restricted to a limited set of users.
# (iv) Audit log protection.  Actions and statuses recorded in accordance with paragraph (d)(2)(i) of this section must not be capable of being changed, overwritten, or deleted by the technology.
# (v) Detection.  Technology must be able to detect whether the audit log has been altered.

@170.315-d-2 @audit-log @tamper-resistance @privacy-security
Feature: Auditable Events and Tamper-Resistance
  As a compliance officer
  I want comprehensive audit logging
  So that I can track all actions related to electronic health information

  Background:
    Given the Health IT system is operational
    And audit logging is configured

  Scenario: Record actions related to EHI
    Given a user performs actions with EHI
    When the action occurs
    Then the system shall record per § 170.210(e)(1) standard
    And recorded information shall include user identification
    And recorded information shall include date and time
    And recorded information shall include action type
    And recorded information shall include patient identification

  Scenario: Record audit log status
    Given the audit log has a status
    When monitoring audit capabilities
    Then the system shall record audit log status
    And status shall indicate enabled or disabled
    And status changes shall be recorded
    And status shall be recorded per § 170.210(e)(2) unless cannot be disabled

  Scenario: Record encryption status of end-user devices
    Given EHI may be stored on end-user devices
    When tracking encryption status
    Then the system shall record encryption status
    And status shall indicate enabled or disabled
    And recording shall be per § 170.210(e)(3)
    And recording not required if system prevents local storage on end-user devices

  Scenario: Detect tampering attempts
    Given audit logs are being maintained
    When someone attempts to tamper with logs
    Then the system shall detect tampering attempts
    And tampering shall be prevented or detected
    And security of audit logs shall be maintained

  Scenario: Generate audit reports
    Given audit logs have been recorded
    When I need to review audit trail
    Then the system shall enable generation of audit reports
    And reports shall be comprehensive and accurate
    And reports shall support compliance activities
