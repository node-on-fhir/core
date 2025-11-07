# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-b-11-decision-support-interventions.feature
# § 170.315(b)(11) - Decision Support Interventions

# REGULATORY TEXT FROM 45 CFR § 170.315(b)(11)
#
# (11) Use of date of birth as expressed in the standards in § 170.213;

@170.315-b-11 @dsi @predictive-ai @algorithm-transparency @care-coordination
Feature: Decision Support Interventions
  As a healthcare provider
  I want transparent and fair decision support interventions
  So that I can make evidence-based decisions while understanding AI/algorithm influences

  Background:
    Given I am authenticated as a provider
    And I have a patient record open
    And decision support interventions are configured

  # ------ Intervention Interaction ------

  Scenario: Interventions occur during user interaction
    Given I am actively interacting with health IT
    When decision support is triggered
    Then interventions shall be provided during my interaction with technology
    And interventions shall occur at clinically appropriate times

  # ------ Configuration ------

  Scenario: Configure DSI interventions based on user role
    Given I am authorized to configure decision support
    When configuring interventions
    Then the system shall enable configuration by limited set of identified users
    And configuration shall be based on user role
    And configuration capabilities shall be appropriately restricted

  Scenario: Enable interventions when data incorporated from transition of care
    Given medications, allergies, and problems are incorporated from transition summary
    When data is incorporated per § 170.315(b)(2)(iii)(D)
    Then interventions shall be enabled based on incorporated data
    And interventions shall trigger appropriately

  Scenario: Provide electronic feedback capability for interventions
    Given I am using evidence-based decision support interventions
    When I want to provide feedback on intervention
    Then the system shall enable me to provide electronic feedback data
    And feedback shall be collectible for selected interventions
    And limited set of users shall be able to export feedback in computable format

  Scenario: Export intervention feedback data
    Given electronic feedback has been collected
    When authorized users need to analyze feedback
    Then feedback data shall be exportable in computable format
    And export shall include intervention, action taken, user feedback, user, date, and location
    And feedback analysis shall support intervention improvement

  # ------ Evidence-Based Decision Support Intervention Selection ------

  Scenario: Select evidence-based interventions using USCDI data
    Given I am authorized to select decision support interventions
    When activating evidence-based interventions
    Then interventions may use problems per § 170.213
    And interventions may use medications per § 170.213
    And interventions may use allergies and intolerances per § 170.213
    And interventions may use demographics per § 170.213
    And interventions may use laboratory data per § 170.213
    And interventions may use vital signs per § 170.213
    And interventions may use unique device identifiers per § 170.213
    And interventions may use procedures per § 170.213

  # ------ Predictive Decision Support Intervention Selection ------

  Scenario: Select predictive interventions using any USCDI data
    Given I am authorized to select decision support interventions
    When activating predictive decision support interventions
    Then interventions may use any data expressed in § 170.213
    And predictive algorithms shall utilize appropriate data elements
    And data inputs shall be transparent

  # ------ Source Attributes for Evidence-Based Interventions ------

  Scenario: Display evidence-based intervention source attributes
    Given an evidence-based intervention is active
    When I review intervention source information
    Then the system shall support display of bibliographic citation
    And the system shall support display of intervention developer
    And the system shall support display of funding source for development
    And the system shall support display of release and revision dates

  Scenario: Display demographic data usage in evidence-based intervention
    Given an evidence-based intervention uses demographic data
    When I review intervention details
    Then the system shall indicate use of race per § 170.213
    And the system shall indicate use of ethnicity per § 170.213
    And the system shall indicate use of language per § 170.213
    And the system shall indicate use of sexual orientation per § 170.213
    And the system shall indicate use of gender identity per § 170.213
    And the system shall indicate use of sex per § 170.213
    And the system shall indicate use of date of birth per § 170.213

  Scenario: Display SDOH and health status data usage
    Given an evidence-based intervention uses SDOH data
    When I review intervention details
    Then the system shall indicate use of SDOH data per § 170.213
    And the system shall indicate use of health status assessments data per § 170.213

  # ------ Source Attributes for Predictive Interventions (EXTENSIVE) ------

  Scenario: Display predictive intervention details and output
    Given a predictive decision support intervention is active
    When I review intervention details
    Then the system shall display name and contact information for developer
    And the system shall display funding source of technical implementation
    And the system shall display description of value produced as output
    And the system shall display whether output is prediction, classification, recommendation, evaluation, analysis, or other type

  Scenario: Display predictive intervention purpose
    Given a predictive intervention is active
    When I review intervention purpose
    Then the system shall display intended use of intervention
    And the system shall display intended patient population(s)
    And the system shall display intended user(s)
    And the system shall display intended decision-making role (informs, augments, replaces clinical management)

  Scenario: Display cautioned out-of-scope use
    Given a predictive intervention has usage limitations
    When I review intervention limitations
    Then the system shall display description of cautioned tasks, situations, or populations
    And the system shall display known risks, inappropriate settings, inappropriate uses, or limitations

  Scenario: Display intervention development details and input features
    Given a predictive intervention is active
    When I review development details
    Then the system shall display exclusion and inclusion criteria for training data
    And the system shall display use of demographic variables as input features
    And the system shall display description of demographic representativeness in training data
    And the system shall display description of relevance of training data to deployed setting

  Scenario: Display fairness process for intervention development
    Given a predictive intervention is active
    When I review fairness information
    Then the system shall display description of approach to ensure intervention output is fair
    And the system shall display description of approaches to manage, reduce, or eliminate bias

  Scenario: Display external validation process
    Given a predictive intervention has been externally validated
    When I review validation information
    Then the system shall display description of data source, setting, or environment for validation
    And the system shall display party that conducted external testing
    And the system shall display demographic representativeness of external data
    And the system shall display description of external validation process

  Scenario: Display quantitative performance measures
    Given a predictive intervention is active
    When I review performance metrics
    Then the system shall display validity in test data from training source
    And the system shall display fairness in test data from training source
    And the system shall display validity in external data
    And the system shall display fairness in external data
    And the system shall display references to evaluation of outcomes impact

  Scenario: Display ongoing maintenance information
    Given a predictive intervention is deployed
    When I review maintenance information
    Then the system shall display process and frequency for monitoring validity over time
    And the system shall display validity in local data
    And the system shall display process and frequency for monitoring fairness over time
    And the system shall display fairness in local data

  Scenario: Display update and validation schedule
    Given a predictive intervention is in use
    When I review update information
    Then the system shall display process and frequency for intervention updates
    And the system shall display frequency for performance correction when risks identified

  Scenario: Indicate when optional information not available
    Given a predictive intervention source attributes
    When certain information is not available for review
    Then the system shall indicate when information not available for external validation
    And the system shall indicate when information not available for external validity metrics
    And the system shall indicate when information not available for external fairness metrics
    And the system shall indicate when information not available for outcome evaluations
    And the system shall indicate when information not available for local validity
    And the system shall indicate when information not available for local fairness
    And the system shall indicate when information not available for update schedule details

  # ------ Access and Modify Source Attributes ------

  Scenario: Access complete plain language descriptions for developer-supplied interventions
    Given interventions are supplied by health IT developer
    When authorized users need to review source attributes
    Then limited set of identified users shall be able to access complete descriptions
    And descriptions shall be in plain language
    And descriptions shall be up-to-date

  Scenario: Modify source attributes for interventions
    Given intervention source attributes need updating
    When authorized users modify attributes
    Then limited set of identified users shall record, change, and access source attributes
    And modifications shall be tracked with audit trail
    And all users shall see updated information

  Scenario: Record additional attributes for predictive interventions
    Given predictive interventions may have additional relevant attributes
    When documenting intervention characteristics
    Then limited set of users shall record, change, and access additional attributes
    And additional attributes supplement required attributes
    And comprehensive documentation shall be maintained

  # ------ Intervention Risk Management for Predictive DSI ------

  Scenario: Conduct risk analysis for predictive intervention
    Given a predictive decision support intervention is implemented
    When assessing intervention risks
    Then intervention shall be subject to analysis of potential risks and adverse impacts
    And analysis shall assess validity, reliability, robustness, fairness
    And analysis shall assess intelligibility, safety, security, and privacy

  Scenario: Implement risk mitigation for predictive intervention
    Given risks have been identified for predictive intervention
    When implementing risk controls
    Then intervention shall be subject to practices to mitigate identified risks
    And mitigation shall address all significant risk categories
    And mitigation effectiveness shall be monitored

  Scenario: Apply governance to predictive intervention
    Given a predictive intervention is in production use
    When managing intervention lifecycle
    Then intervention shall be subject to policies and implemented controls for governance
    And governance shall include how data are acquired, managed, and used
    And governance shall ensure ongoing oversight and accountability
