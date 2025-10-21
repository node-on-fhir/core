# certification/bdd/170.315-b-1-transitions-of-care.feature
# § 170.315(b)(1) - Transitions of Care
# BDD Format using Cucumber/Gherkin Syntax

# REGULATORY TEXT FROM 45 CFR § 170.315(b)(1)
#
# (1) Transitions of care —
#
# (i) Send and receive via edge protocol.
#
# (A) Send transition of care/referral summaries through a method that conforms to the standard specified in § 170.202(d) and that leads to such summaries being processed by a service that has implemented the standard specified in § 170.202(a)(2); and
#
# (B) Receive transition of care/referral summaries through a method that conforms to the standard specified in § 170.202(d) from a service that has implemented the standard specified in § 170.202(a)(2).
#
# (C) XDM processing.  Receive and make available the contents of a XDM package formatted in accordance with the standard adopted in § 170.205(p)(1) when the technology is also being certified using an SMTP-based edge protocol.
#
# (ii) Validate and display —
#
# (A) Validate C-CDA conformance—system performance.  Demonstrate the ability to detect valid and invalid transition of care/referral summaries received and formatted in accordance with the standards specified in § 170.205(a)(3), (4), and (5) for the Continuity of Care Document, Referral Note, and (inpatient setting only) Discharge Summary document templates. This includes the ability to:
#
# (1) Parse each of the document types.
#
# (2) Detect errors in corresponding "document-templates," "section-templates," and "entry-templates," including invalid vocabulary standards and codes not specified in the standards adopted in § 170.205(a)(3), (4), and (5).
#
# (3) Identify valid document-templates and process the data elements required in the corresponding section-templates and entry-templates from the standards adopted in § 170.205(a)(3), (4), and (5).
#
# (4) Correctly interpret empty sections and null combinations.
#
# (5) Record errors encountered and allow a user through at least one of the following ways to:
#
# (i) Be notified of the errors produced.
#
# (ii) Review the errors produced.
#
# (B) Display.  Display in human readable format the data included in transition of care/referral summaries received and formatted according to the standards specified in § 170.205(a)(3), (4), and (5).
#
# (C) Display section views.  Allow for the individual display of each section (and the accompanying document header information) that is included in a transition of care/referral summary received and formatted in accordance with the standards adopted in § 170.205(a)(3), (4), and (5) in a manner that enables the user to:
#
# (1) Directly display only the data within a particular section;
#
# (2) Set a preference for the display order of specific sections; and
#
# (3) Set the initial quantity of sections to be displayed.
#
# (iii) Create.  Enable a user to create a transition of care/referral summary formatted in accordance with the standard specified in § 170.205(a)(3), (4), and (5) using the Continuity of Care Document, Referral Note, and (inpatient setting only) Discharge Summary document templates that includes, at a minimum:
#
# (A)
#
# (1) The data classes expressed in the standards in § 170.213 and in accordance with § 170.205(a)(4), (5), and paragraphs (b)(1)(iii)(A)(3)(i) through (iii) of this section for the time period up to and including December 31, 2025, or
#
# (2) The data classes expressed in the standards in § 170.213 and in accordance with § 170.205(a)(4), (6), and paragraphs (b)(1)(iii)(A)(3)(i) through (iii) of this section, and
#
# (3) The following data classes:
#
# (i) Assessment and plan of treatment.  In accordance with the "Assessment and Plan Section (V2)" of the standard specified in § 170.205(a)(4); or in accordance with the "Assessment Section (V2)" and "Plan of Treatment Section (V2)" of the standard specified in § 170.205(a)(4).
#
# (ii) Goals.  In accordance with the "Goals Section" of the standard specified in § 170.205(a)(4).
#
# (iii) Health concerns.  In accordance with the "Health Concerns Section" of the standard specified in § 170.205(a)(4).
#
# (iv) Unique device identifier(s) for a patient's implantable device(s).  In accordance with the "Product Instance" in the "Procedure Activity Procedure Section" of the standard specified in § 170.205(a)(4).
#
# (B) Encounter diagnoses.  Formatted according to at least one of the following standards:
#
# (1) The standard specified in § 170.207(i).
#
# (2) At a minimum, the version of the standard specified in § 170.207(a)(1).
#
# (C) Cognitive status.
#
# (D) Functional status.
#
# (E) Ambulatory setting only.  The reason for referral; and referring or transitioning provider's name and office contact information.
#
# (F) Inpatient setting only.  Discharge instructions.
#
# (G) Patient matching data.  First name, last name, previous name, middle name (including middle initial), suffix, date of birth, current address, phone number, and sex. The following constraints apply:
#
# (1) Date of birth constraint.
#
# (i) The year, month and day of birth must be present for a date of birth. The technology must include a null value when the date of birth is unknown.
#
# (ii) Optional.  When the hour, minute, and second are associated with a date of birth the technology must demonstrate that the correct time zone offset is included.
#
# (2) Phone number constraint.  Represent phone number (home, business, cell) in accordance with the standards adopted in § 170.207(q)(1). All phone numbers must be included when multiple phone numbers are present.
#
# (3) Sex Constraint:  Represent sex with the standard adopted in § 170.207(n)(1) up to and including December 31, 2025; or with the standard adopted in § 170.207(n)(2).

@170.315-b-1 @transitions-of-care @toc @care-coordination
Feature: Transitions of Care
  As a healthcare provider
  I want to send and receive comprehensive transition of care summaries
  So that I can ensure care continuity when patients move between care settings

  Background:
    Given I am authenticated as a healthcare provider
    And I have appropriate privileges for care transitions

  # ------ Send Transition of Care Summary via Edge Protocol ------

  Scenario: Send transition of care summary via Direct
    Given a patient is being transitioned to another provider
    When I create and send a transition of care summary
    Then the system shall send through method conforming to § 170.202(d)
    And the summary shall be processed by service implementing § 170.202(a)(2)
    And the transmission shall use secure messaging

  Scenario: Receive transition of care summary via Direct
    Given another provider is sending a transition of care summary for my patient
    When the summary is transmitted
    Then the system shall receive through method conforming to § 170.202(d)
    And the system shall receive from service implementing § 170.202(a)(2)
    And the received summary shall be available for processing

  Scenario: Process XDM package when using SMTP-based edge protocol
    Given the technology uses SMTP-based edge protocol for Direct messaging
    When receiving an XDM package
    Then the system shall receive XDM package formatted per § 170.205(p)(1)
    And the system shall make available the contents of the XDM package
    And contents shall be accessible for clinical review

  # ------ Validate C-CDA Conformance ------

  Scenario: Detect valid transition of care summary
    Given a transition of care summary is received
    When the system validates the document
    Then the system shall detect valid summaries formatted per § 170.205(a)(3), (4), (5)
    And valid documents shall be processed for display and reconciliation

  Scenario: Detect invalid transition of care summary
    Given a malformed transition of care summary is received
    When the system validates the document
    Then the system shall detect invalid summaries
    And errors shall be identified and reported

  Scenario: Parse CCD document template
    Given a Continuity of Care Document is received
    When the system processes the document
    Then the system shall parse the CCD template
    And all sections shall be accessible

  Scenario: Parse Referral Note document template
    Given a Referral Note is received
    When the system processes the document
    Then the system shall parse the Referral Note template
    And all sections shall be accessible

  @inpatient-only
  Scenario: Parse Discharge Summary document template
    Given I am in an inpatient setting
    And a Discharge Summary is received
    When the system processes the document
    Then the system shall parse the Discharge Summary template
    And all sections shall be accessible

  Scenario: Detect errors in document-templates
    Given a transition of care summary with template errors is received
    When the system validates document structure
    Then the system shall detect errors in document-templates
    And specific template errors shall be identified

  Scenario: Detect errors in section-templates
    Given a transition of care summary with section errors is received
    When the system validates document structure
    Then the system shall detect errors in section-templates
    And specific section errors shall be identified

  Scenario: Detect errors in entry-templates
    Given a transition of care summary with entry errors is received
    When the system validates document structure
    Then the system shall detect errors in entry-templates
    And specific entry errors shall be identified

  Scenario: Detect invalid vocabulary standards
    Given a transition of care summary with invalid codes is received
    When the system validates vocabulary
    Then the system shall detect invalid vocabulary standards
    And invalid codes shall be identified

  Scenario: Detect codes not specified in standards
    Given a transition of care summary with non-standard codes is received
    When the system validates vocabulary
    Then the system shall detect codes not specified in § 170.205(a)(3), (4), (5)
    And non-standard codes shall be reported

  Scenario: Identify valid document-templates
    Given a properly formatted transition of care summary is received
    When the system validates the document
    Then the system shall identify valid document-templates
    And valid templates shall be processed successfully

  Scenario: Process required data elements
    Given a valid transition of care summary is received
    When the system extracts data elements
    Then the system shall process data elements required in corresponding section-templates
    And the system shall process data elements required in corresponding entry-templates
    And all required data per § 170.205(a)(3), (4), (5) shall be extracted

  Scenario: Correctly interpret empty sections
    Given a transition of care summary with empty sections is received
    When the system processes the document
    Then the system shall correctly interpret empty sections
    And empty sections shall not cause processing errors

  Scenario: Correctly interpret null combinations
    Given a transition of care summary with null values is received
    When the system processes the document
    Then the system shall correctly interpret null combinations
    And null values shall be handled appropriately

  Scenario: Record errors encountered during validation
    Given a transition of care summary with multiple errors is received
    When the system validates the document
    Then the system shall record errors encountered
    And errors shall be stored for review

  Scenario: Notify user of validation errors
    Given validation errors have been recorded
    When errors are detected
    Then the system shall enable user notification of errors produced
    And notifications shall be timely and clear

  Scenario: Enable user to review validation errors
    Given validation errors have been recorded
    When a user needs to review errors
    Then the system shall enable user to review errors produced
    And error details shall be accessible
    And errors shall be presented in actionable format

  # ------ Display Received Transition of Care Summary ------

  Scenario: Display transition of care summary in human readable format
    Given a valid transition of care summary is received
    When I view the summary
    Then the system shall display data in human readable format
    And the display shall be formatted per § 170.205(a)(3), (4), (5)
    And all included data shall be viewable

  Scenario: Display CCD in human readable format
    Given a Continuity of Care Document is received
    When I view the document
    Then all data shall be displayed in human readable format
    And the display shall be clinically useful

  Scenario: Display Referral Note in human readable format
    Given a Referral Note is received
    When I view the document
    Then all data shall be displayed in human readable format
    And referral information shall be prominent

  @inpatient-only
  Scenario: Display Discharge Summary in human readable format
    Given I am in an inpatient setting
    And a Discharge Summary is received
    When I view the document
    Then all data shall be displayed in human readable format
    And discharge information shall be prominent

  # ------ Display Individual Sections ------

  Scenario: Display individual section from transition summary
    Given a transition of care summary is received
    When I want to view a specific section
    Then the system shall allow individual display of each section
    And accompanying document header information shall be displayed

  Scenario: Directly display only data within particular section
    Given a transition of care summary with multiple sections is received
    When I select a specific section to view
    Then the system shall enable direct display of only that section's data
    And other sections shall be hidden from view

  Scenario: Set preference for display order of sections
    Given I have specific workflow preferences
    When I configure section display settings
    Then the system shall enable setting preference for display order of sections
    And my preferences shall be saved and applied

  Scenario: Set initial quantity of sections displayed
    Given I want to control information density
    When I configure section display settings
    Then the system shall enable setting initial quantity of sections displayed
    And I shall be able to expand to view additional sections

  # ------ Create Transition of Care Summary ------

  Scenario: Create CCD document template
    Given I need to send a transition of care summary
    When I create a Continuity of Care Document
    Then the system shall format per § 170.205(a)(3), (4), (5)
    And the CCD shall include all required USCDI data classes per § 170.213

  Scenario: Create Referral Note document template
    Given I need to send a referral
    When I create a Referral Note
    Then the system shall format per § 170.205(a)(3), (4), (5)
    And the Referral Note shall include all required USCDI data classes per § 170.213

  @inpatient-only
  Scenario: Create Discharge Summary document template
    Given I am in an inpatient setting
    And a patient is being discharged
    When I create a Discharge Summary
    Then the system shall format per § 170.205(a)(3), (4), (5)
    And the Discharge Summary shall include all required USCDI data classes per § 170.213

  Scenario: Include all USCDI data classes in transition summary
    Given I am creating a transition of care summary
    When I generate the summary
    Then the system shall include all data classes per § 170.213
    And data shall be formatted per § 170.205(a)(4), (5) or (6) based on date
    And all mandatory data elements shall be included

  Scenario: Include assessment and plan of treatment
    Given I am creating a transition of care summary
    When I generate the summary
    Then the system shall include assessment and plan per "Assessment and Plan Section (V2)"
    Or the system shall include separate "Assessment Section (V2)" and "Plan of Treatment Section (V2)"
    And content shall conform to § 170.205(a)(4)

  Scenario: Include goals in transition summary
    Given I am creating a transition of care summary
    When I generate the summary
    Then the system shall include goals per "Goals Section"
    And goals shall conform to § 170.205(a)(4)

  Scenario: Include health concerns in transition summary
    Given I am creating a transition of care summary
    When I generate the summary
    Then the system shall include health concerns per "Health Concerns Section"
    And health concerns shall conform to § 170.205(a)(4)

  Scenario: Include unique device identifiers in transition summary
    Given the patient has implantable devices
    When I create a transition of care summary
    Then the system shall include UDIs per "Product Instance" in "Procedure Activity Procedure Section"
    And UDIs shall conform to § 170.205(a)(4)

  Scenario: Include encounter diagnoses in transition summary
    Given I am creating a transition of care summary
    When I generate the summary
    Then the system shall include encounter diagnoses
    And diagnoses shall be formatted per § 170.207(i) or § 170.207(a)(1)

  Scenario: Include cognitive status in transition summary
    Given I am creating a transition of care summary
    When I generate the summary
    Then the system shall include cognitive status
    And cognitive status shall be appropriately coded

  Scenario: Include functional status in transition summary
    Given I am creating a transition of care summary
    When I generate the summary
    Then the system shall include functional status
    And functional status shall be appropriately coded

  # ------ Patient Matching Data ------

  Scenario: Include patient matching data in transition summary
    Given I am creating a transition of care summary
    When I generate the summary
    Then the system shall include first name, last name, previous name, middle name, suffix
    And the system shall include date of birth
    And the system shall include current address
    And the system shall include phone number
    And the system shall include sex

  Scenario: Include complete date of birth with null for unknown
    Given I am creating a transition of care summary
    When including date of birth
    Then year, month, and day must be present for date of birth
    And the system shall include null value when date of birth is unknown

  Scenario: Optionally include time zone with date of birth
    Given I am creating a transition of care summary
    When date of birth includes time components
    Then the system may include hour, minute, and second
    And if time is included, correct time zone offset must be included

  Scenario: Represent phone numbers per standard
    Given I am creating a transition of care summary
    When including phone numbers
    Then phone numbers shall be represented per § 170.207(q)(1)
    And all phone numbers (home, business, cell) must be included when multiple are present

  Scenario: Represent sex per standard until December 31, 2025
    Given the current date is before December 31, 2025
    When including sex in transition summary
    Then sex shall be represented per § 170.207(n)(1)

  Scenario: Represent sex per updated standard after December 31, 2025
    Given the current date is after December 31, 2025
    When including sex in transition summary
    Then sex shall be represented per § 170.207(n)(2)

  # ------ Ambulatory Setting Specific ------

  @ambulatory-only
  Scenario: Include reason for referral in ambulatory setting
    Given I am in an ambulatory setting
    When I create a transition of care summary
    Then the system shall include reason for referral
    And the reason shall be clinically meaningful

  @ambulatory-only
  Scenario: Include referring provider information in ambulatory setting
    Given I am in an ambulatory setting
    When I create a transition of care summary
    Then the system shall include referring provider's name
    And the system shall include referring provider's office contact information

  # ------ Inpatient Setting Specific ------

  @inpatient-only
  Scenario: Include discharge instructions in inpatient setting
    Given I am in an inpatient setting
    When I create a transition of care summary
    Then the system shall include discharge instructions
    And discharge instructions shall be comprehensive
