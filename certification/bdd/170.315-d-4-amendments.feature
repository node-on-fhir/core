# certification/bdd/170.315-d-4-amendments.feature
# REGULATORY TEXT FROM 45 CFR § 170.315(d)(4)
#
# (4) Amendments.  Enable a user to select the record affected by a patient's request for amendment and perform the capabilities specified in paragraph (d)(4)(i) or (ii) of this section.
# (i) Accepted amendment.  For an accepted amendment, append the amendment to the affected record or include a link that indicates the amendment's location.
# (ii) Denied amendment.  For a denied amendment, at a minimum, append the request and denial of the request in at least one of the following ways:
# (A) To the affected record.
# (B) Include a link that indicates this information's location.

@170.315-d-4 @amendments @privacy-security
Feature: Amendments
  As a system administrator
  I want to manage patient amendment requests
  So that patient rights to amend their records are supported

  Background:
    Given I am authenticated as a system administrator
    And a patient has requested an amendment to their record

  Scenario: Select record affected by amendment request
    Given a patient amendment request has been submitted
    When I review the amendment request
    Then the system shall enable selection of the affected record

  Scenario: Process accepted amendment by appending
    Given a patient amendment request has been accepted
    When I process the accepted amendment
    Then the system shall append the amendment to the affected record

  Scenario: Process accepted amendment with link
    Given a patient amendment request has been accepted
    When I process the accepted amendment using a link
    Then the system shall include a link indicating the amendment's location

  Scenario: Process denied amendment by appending to record
    Given a patient amendment request has been denied
    When I process the denied amendment
    Then the system shall append the request to the affected record
    And the system shall append the denial to the affected record

  Scenario: Process denied amendment with link
    Given a patient amendment request has been denied
    When I process the denied amendment using a link
    Then the system shall include a link indicating the denial information's location
