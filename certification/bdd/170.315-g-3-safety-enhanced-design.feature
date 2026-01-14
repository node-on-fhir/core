# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-g-3-safety-enhanced-design.feature
# § 170.315(g)(3) - Safety-Enhanced Design

# REGULATORY TEXT FROM 45 CFR § 170.315(g)(3)
#
# (3) All applicable technical requirements and attributes necessary for an application to be registered with a Health IT Module's authorization server.
# (B) The documentation used to meet paragraph (g)(10)(viii)(A) of this section must be available via a publicly accessible hyperlink without any preconditions or additional steps.

@170.315-g-3 @safety @ux @design-performance
Feature: Safety-Enhanced Design
  As a health IT developer
  I want to apply safety-enhanced design principles
  So that the system minimizes use errors and patient safety risks

  Background:
    Given I am developing health IT
    And patient safety is a priority

  Scenario: Apply safety-enhanced design process on inputs
    Given I am designing system functionality
    When developing user interfaces
    Then I shall apply safety-enhanced design principles
    And design shall type check inputs
    And design shall flag ambiguous acronyms
    And design shall lookup and verify SNOMED codes
    And design shall lookup and verify RxNorm codes

Scenario: Apply safety-enhanced design process on outputs
    Given I am designing system functionality
    When developing user interfaces
    Then I shall apply safety-enhanced design principles
    And design shall validate resources against FHIR schemas on export
    
  Scenario: Conduct usability testing
    Given system interfaces have been designed
    When validating design
    Then I shall conduct usability testing
    And testing shall identify and record usability issues via GitHub issues
    And new features will cite GitHub issues with the tag 'usability'

  Scenario: Apply user-centered design principles
    Given I am designing clinical workflows
    When implementing functionality
    Then I shall 'close the loop' by initiating design changes with the current screenshot of the functionality
    And specify the differential between existing functionality and new functionality
    And conduct an editorial review process
    And obtain safety signoff
    