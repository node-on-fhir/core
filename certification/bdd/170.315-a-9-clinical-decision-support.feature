# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-a-9-clinical-decision-support.feature
# § 170.315(a)(9) - Clinical Decision Support (CDS)
# NOTE: This criterion expires January 1, 2025

# REGULATORY TEXT FROM 45 CFR § 170.315(a)(9)
#
# (9) Clinical decision support (CDS) —
#
# (i) CDS intervention interaction.  Interventions provided to a user must occur when a user is interacting with technology.
#
# (ii) CDS configuration.
#
# (A) Enable interventions and reference resources specified in paragraphs (a)(9)(iii) and (iv) of this section to be configured by a limited set of identified users (e.g., system administrator) based on a user's role.
#
# (B) Enable interventions:
#
# (1) Based on the following data:
#
# (i) Problem list;
#
# (ii) Medication list;
#
# (iii) Allergy and intolerance list;
#
# (iv) At least one demographic specified in paragraph (a)(5)(i) of this section;
#
# (v) Laboratory tests; and
#
# (vi) Vital signs.
#
# (2) When a patient's medications, allergies and intolerance, and problems are incorporated from a transition of care/referral summary received and pursuant to paragraph (b)(2)(iii)(D) of this section.
#
# (iii) Evidence-based decision support interventions.  Enable a limited set of identified users to select (i.e., activate) electronic CDS interventions (in addition to drug-drug and drug-allergy contraindication checking) based on each one and at least one combination of the data referenced in paragraphs (a)(9)(ii)(B)(1)(i) through (vi) of this section.
#
# (iv) Linked referential CDS.
#
# (A) Identify for a user diagnostic and therapeutic reference information in accordance at least one of the following standards and implementation specifications:
#
# (1) The standard and implementation specifications specified in § 170.204(b)(3).
#
# (2) The standard and implementation specifications specified in § 170.204(b)(4).
#
# (B) For paragraph (a)(9)(iv)(A) of this section, technology must be able to identify for a user diagnostic or therapeutic reference information based on each one and at least one combination of the data referenced in paragraphs (a)(9)(ii)(B)(1)(i), (ii), and (iv) of this section.
#
# (v) Source attributes.  Enable a user to review the attributes as indicated for all CDS resources:
#
# (A) For evidence-based decision support interventions under paragraph (a)(9)(iii) of this section:
#
# (1) Bibliographic citation of the intervention (clinical research/guideline);
#
# (2) Developer of the intervention (translation from clinical research/guideline);
#
# (3) Funding source of the intervention development technical implementation; and
#
# (4) Release and, if applicable, revision date(s) of the intervention or reference source.
#
# (B) For linked referential CDS in paragraph (a)(9)(iv) of this section and drug-drug, drug-allergy interaction checks in paragraph (a)(4) of this section, the developer of the intervention, and where clinically indicated, the bibliographic citation of the intervention (clinical research/guideline).
#
# (vi) Expiration of criterion.  The adoption of this criterion for purposes of the ONC Health IT Certification Program expires on January 1, 2025.

@170.315-a-9 @cds @clinical-decision-support @expires-2025 @clinical
Feature: Clinical Decision Support (CDS)
  As a healthcare provider
  I want evidence-based clinical decision support
  So that I can make informed treatment decisions

  Background:
    Given I am authenticated as a provider
    And a patient record is selected

  # ------ CDS Intervention Interaction ------

  Scenario: CDS interventions occur during user interaction
    Given I am actively interacting with the health IT system
    When clinical decision support is triggered
    Then interventions shall be provided during my interaction with technology
    And interventions shall not be delayed until after interaction ends

  # ------ CDS Configuration ------

  Scenario: Configure CDS interventions based on user role
    Given I am a system administrator or authorized configurator
    When I configure clinical decision support interventions
    Then the system shall enable configuration by limited set of identified users
    And configuration shall be based on user role
    And configuration capabilities shall be restricted appropriately

  Scenario: Configure CDS reference resources based on user role
    Given I am a system administrator or authorized configurator
    When I configure reference resources for CDS
    Then the system shall enable configuration by limited set of identified users
    And configuration shall be based on user role

  # ------ CDS Based on Patient Data ------

  Scenario: Enable interventions based on problem list
    Given the patient has documented problems
    When CDS evaluates patient data
    Then the system shall enable interventions based on problem list data

  Scenario: Enable interventions based on medication list
    Given the patient has active medications
    When CDS evaluates patient data
    Then the system shall enable interventions based on medication list data

  Scenario: Enable interventions based on allergy and intolerance list
    Given the patient has documented allergies and intolerances
    When CDS evaluates patient data
    Then the system shall enable interventions based on allergy and intolerance list

  Scenario: Enable interventions based on demographics
    Given the patient has demographic data recorded
    When CDS evaluates patient data
    Then the system shall enable interventions based on at least one demographic
    And demographic data may include age, sex, race, ethnicity, etc.

  Scenario: Enable interventions based on laboratory tests
    Given the patient has laboratory test results
    When CDS evaluates patient data
    Then the system shall enable interventions based on laboratory test data

  Scenario: Enable interventions based on vital signs
    Given the patient has vital signs recorded
    When CDS evaluates patient data
    Then the system shall enable interventions based on vital signs data

  Scenario: Enable interventions from incorporated transition of care data
    Given medications, allergies, and problems are incorporated from transition of care summary
    When the data is incorporated per § 170.315(b)(2)(iii)(D)
    Then the system shall enable interventions based on incorporated data
    And interventions shall trigger automatically upon incorporation

  # ------ Evidence-Based Decision Support Interventions ------

  Scenario: Select evidence-based CDS interventions
    Given I am an authorized user selecting CDS interventions
    When I activate electronic CDS interventions
    Then the system shall enable selection based on each individual data element
    And the system shall enable selection based on combinations of data elements
    And data elements include problem list, medication list, allergies, demographics, lab tests, and vital signs

  Scenario: Activate CDS intervention based on problem list
    Given I am selecting CDS interventions
    When I activate an intervention based on problem list
    Then the intervention shall utilize problem list data
    And the intervention shall provide evidence-based guidance

  Scenario: Activate CDS intervention based on multiple data elements
    Given I am selecting CDS interventions
    When I activate an intervention based on combination of data elements
    Then the intervention shall utilize all specified data elements
    And the intervention shall provide integrated clinical guidance

  # ------ Linked Referential CDS ------

  Scenario: Identify diagnostic reference information via Infobutton
    Given I need diagnostic reference information
    When I access linked referential CDS
    Then the system shall identify information per § 170.204(b)(3) standard
    And information shall be context-specific to clinical scenario

  Scenario: Identify therapeutic reference information via Infobutton
    Given I need therapeutic reference information
    When I access linked referential CDS
    Then the system shall identify information per § 170.204(b)(4) standard
    And information shall be context-specific to clinical scenario

  Scenario: Identify reference information based on problem list
    Given the patient has documented problems
    When I access linked referential CDS
    Then the system shall identify information based on problem list data

  Scenario: Identify reference information based on medication list
    Given the patient has active medications
    When I access linked referential CDS
    Then the system shall identify information based on medication list data

  Scenario: Identify reference information based on demographics
    Given the patient has demographic data
    When I access linked referential CDS
    Then the system shall identify information based on demographic data

  Scenario: Identify reference information based on combination of data
    Given multiple types of patient data are available
    When I access linked referential CDS
    Then the system shall identify information based on combinations of data
    And combinations may include problem list, medications, and demographics

  # ------ Source Attributes for CDS ------

  Scenario: Display source attributes for evidence-based interventions
    Given an evidence-based CDS intervention is active
    When I review the intervention source information
    Then the system shall enable review of bibliographic citation
    And the system shall display developer of the intervention
    And the system shall display funding source of intervention development
    And the system shall display release and revision dates

  Scenario: Display source attributes for drug interaction checks
    Given drug-drug or drug-allergy interaction check is displayed
    When I review the intervention source information
    Then the system shall display developer of the intervention
    And where clinically indicated, the system shall display bibliographic citation

  Scenario: Display source attributes for linked referential CDS
    Given linked referential CDS is being utilized
    When I review the reference source information
    Then the system shall display developer of the intervention
    And where clinically indicated, the system shall display bibliographic citation

  Scenario: Access complete source attribute information
    Given CDS interventions are configured in the system
    When I need to review source attributes
    Then all source attributes shall be accessible
    And source attributes shall be displayed in user-friendly format
    And source attributes shall support evidence-based decision making
