# certification/bdd/170.315-b-2-clinical-information-reconciliation.feature
# § 170.315(b)(2) - Clinical Information Reconciliation and Incorporation
# BDD Format using Cucumber/Gherkin Syntax

# REGULATORY TEXT FROM 45 CFR § 170.315(b)(2)
#
# (2) Clinical information reconciliation and incorporation —
#
# (i) General requirements.  Paragraphs (b)(2)(ii) and (iii) of this section must be completed based on the receipt of a transition of care/referral summary formatted in accordance with the standards adopted in § 170.205(a)(3) through (5) using the Continuity of Care Document, Referral Note, and (inpatient setting only) Discharge Summary document templates, for time period up to and including December 31, 2025; or in accordance with the standards adopted in § 170.205(a)(3), (4), (6).
#
# (ii) Correct patient.  Upon receipt of a transition of care/referral summary formatted according to the standards adopted § 170.205(a)(3) through (5) for the period up to and including December 31, 2025; or according to the standards adopted § 170.205(a)(3), (4), and (6), technology must be able to demonstrate that the transition of care/referral summary received can be properly matched to the correct patient.
#
# (iii) Reconciliation.  Enable a user to reconcile the data that represent a patient's active medication list, allergies and intolerance list, and problem list as follows. For each list type:
#
# (A) Simultaneously display (i.e., in a single view) the data from at least two sources in a manner that allows a user to view the data and their attributes, which must include, at a minimum, the source and last modification date.
#
# (B) Enable a user to create a single reconciled list of each of the following: Medications; Allergies and Intolerances; and problems.
#
# (C) Enable a user to review and validate the accuracy of a final set of data.
#
# (D) Upon a user's confirmation, automatically update the list, and incorporate the following data expressed according to the specified standards:
#
# (1) Medications.  At a minimum, the version of the standard specified in § 170.213;
#
# (2) Allergies and intolerance.  At a minimum, the version of the standard specified in § 170.213; and
#
# (3) Problems.  At a minimum, the version of the standard specified in § 170.213.
#
# (iv) System verification.  Based on the data reconciled and incorporated, the technology must be able to create a file formatted according to the standard specified in § 170.205(a)(4) using the Continuity of Care Document template and the standard specified in § 170.205(a)(5) on and after December 31, 2022.
#
# (iv) System verification.  Based on the data reconciled and incorporated, the technology must be able to create a file formatted according to the standard specified in § 170.205(a)(4) using the Continuity of Care Document template and the standard specified in paragraph (a)(5) of this section for the time period up to and including December 31, 2025; or according to the standard specified in § 170.205(a)(4) using the Continuity of Care Document template and the standard specified in paragraph (a)(6) of this section.

@170.315-b-2 @reconciliation @care-coordination
Feature: Clinical Information Reconciliation and Incorporation
  As a healthcare provider
  I want to reconcile and incorporate patient data from external sources
  So that I can maintain accurate and complete patient records

  Background:
    Given I am authenticated as a healthcare provider
    And a transition of care summary has been received
    And the summary is formatted per § 170.205(a)(3) through (5)

  # ------ Patient Matching ------

  Scenario: Match transition summary to correct patient
    Given a transition of care summary is received
    When the system processes the summary
    Then the system shall demonstrate ability to properly match to correct patient
    And matching shall use patient demographic data
    And high-confidence matches shall be identified

  Scenario: Alert on uncertain patient match
    Given a transition of care summary is received
    And patient matching confidence is low
    When the system attempts to match the patient
    Then the system should alert user to uncertain match
    And user should be able to confirm or select correct patient

  # ------ Medication Reconciliation ------

  Scenario: Display medications from multiple sources simultaneously
    Given medication data from at least two sources is available
    When I begin medication reconciliation
    Then the system shall simultaneously display data from at least two sources
    And display shall be in single view
    And medications from each source shall be distinguishable

  Scenario: Display medication source and modification date
    Given medications from multiple sources are displayed
    When I review the medications
    Then the system shall display source for each medication
    And the system shall display last modification date for each medication

  Scenario: Create single reconciled medication list
    Given medications from multiple sources are displayed
    When I reconcile the medications
    Then the system shall enable user to create single reconciled medication list
    And I shall be able to select medications to include
    And I shall be able to mark medications as active, inactive, or discontinued

  Scenario: Review and validate accuracy of reconciled medications
    Given a reconciled medication list has been created
    When I finalize the reconciliation
    Then the system shall enable user to review reconciled list
    And the system shall enable user to validate accuracy of final data set
    And I shall be able to make final adjustments

  Scenario: Automatically update medication list upon confirmation
    Given a reconciled medication list has been reviewed and validated
    When I confirm the reconciliation
    Then the system shall automatically update the patient's medication list
    And updated list shall replace previous active medication list
    And reconciliation shall be timestamped and attributed to user

  Scenario: Incorporate medications per USCDI standard
    Given medications are being incorporated from transition summary
    When the system updates the medication list
    Then medications shall be incorporated per § 170.213 standard
    And all required medication data elements shall be preserved
    And medication codes shall conform to RxNorm

  # ------ Allergy and Intolerance Reconciliation ------

  Scenario: Display allergies from multiple sources simultaneously
    Given allergy data from at least two sources is available
    When I begin allergy reconciliation
    Then the system shall simultaneously display data from at least two sources
    And display shall be in single view
    And allergies from each source shall be distinguishable

  Scenario: Display allergy source and modification date
    Given allergies from multiple sources are displayed
    When I review the allergies
    Then the system shall display source for each allergy
    And the system shall display last modification date for each allergy

  Scenario: Create single reconciled allergy list
    Given allergies from multiple sources are displayed
    When I reconcile the allergies
    Then the system shall enable user to create single reconciled allergy list
    And I shall be able to select allergies to include
    And I shall be able to verify reaction severity and type

  Scenario: Review and validate accuracy of reconciled allergies
    Given a reconciled allergy list has been created
    When I finalize the reconciliation
    Then the system shall enable user to review reconciled list
    And the system shall enable user to validate accuracy of final data set

  Scenario: Automatically update allergy list upon confirmation
    Given a reconciled allergy list has been reviewed and validated
    When I confirm the reconciliation
    Then the system shall automatically update the patient's allergy list
    And updated list shall replace previous allergy list

  Scenario: Incorporate allergies per USCDI standard
    Given allergies are being incorporated from transition summary
    When the system updates the allergy list
    Then allergies shall be incorporated per § 170.213 standard
    And allergy codes shall conform to appropriate vocabulary

  # ------ Problem List Reconciliation ------

  Scenario: Display problems from multiple sources simultaneously
    Given problem data from at least two sources is available
    When I begin problem list reconciliation
    Then the system shall simultaneously display data from at least two sources
    And display shall be in single view
    And problems from each source shall be distinguishable

  Scenario: Display problem source and modification date
    Given problems from multiple sources are displayed
    When I review the problems
    Then the system shall display source for each problem
    And the system shall display last modification date for each problem

  Scenario: Create single reconciled problem list
    Given problems from multiple sources are displayed
    When I reconcile the problems
    Then the system shall enable user to create single reconciled problem list
    And I shall be able to select problems to include
    And I shall be able to update problem status

  Scenario: Review and validate accuracy of reconciled problems
    Given a reconciled problem list has been created
    When I finalize the reconciliation
    Then the system shall enable user to review reconciled list
    And the system shall enable user to validate accuracy of final data set

  Scenario: Automatically update problem list upon confirmation
    Given a reconciled problem list has been reviewed and validated
    When I confirm the reconciliation
    Then the system shall automatically update the patient's problem list
    And updated list shall replace previous problem list

  Scenario: Incorporate problems per USCDI standard
    Given problems are being incorporated from transition summary
    When the system updates the problem list
    Then problems shall be incorporated per § 170.213 standard
    And problem codes shall conform to SNOMED CT

  # ------ System Verification ------

  Scenario: Create verification file after reconciliation (until December 31, 2025)
    Given data has been reconciled and incorporated
    And the current date is before December 31, 2025
    When verifying system reconciliation capability
    Then the system shall create file formatted per § 170.205(a)(4)
    And file shall use Continuity of Care Document template
    And file shall comply with § 170.205(a)(5)

  Scenario: Create verification file after reconciliation (after December 31, 2025)
    Given data has been reconciled and incorporated
    And the current date is after December 31, 2025
    When verifying system reconciliation capability
    Then the system shall create file formatted per § 170.205(a)(4)
    And file shall use Continuity of Care Document template
    And file shall comply with § 170.205(a)(6)
