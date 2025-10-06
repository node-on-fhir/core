
/*
 * Library: IMMZD18SMeaslesSupplementaryLogic (IMMZ.D18.S.Measles.Supplementary dose schedule)
 * Schedule Table: Measles supplementary dose schedule
 */
library IMMZD18SMeaslesSupplementaryLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTMeaslesEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Measles-containing vaccine (MCV) supplementary dose
@description: Provision of a MCV supplementary dose
@trigger: Routine measles immunization schedule is complete
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Measles-containing vaccines") AND Member States defined logic for supplementary dose applied
@triggerDate: "Date when the primary vaccination series was  completed"
*/
define "Measles-containing vaccine (MCV) supplementary dose":
  not "MCV supplementary dose was administered" and Encounter."Measles routine immunization schedule is complete"

/*
@output: Measles-containing vaccine (MCV) supplementary dose Create
@create: Child is due for a MCV supplementary dose if child is HIV-positive, on antiretroviral therapy (ART) and immune reconstitution has been achieved.
*/
define "Measles-containing vaccine (MCV) supplementary dose Create":
  if "Measles-containing vaccine (MCV) supplementary dose" 
  then 'Child is due for a MCV supplementary dose if child is HIV-positive, on antiretroviral therapy (ART) and immune reconstitution has been achieved.' + '
Due Date: ' + ToString("Measles-containing vaccine (MCV) supplementary dose Due Date")
  else ''

/*
@dynamicValue: Measles-containing vaccine (MCV) supplementary dose Due Date
@pseudocode: "Date when the primary vaccination series completed" + 4 weeks
*/
define "Measles-containing vaccine (MCV) supplementary dose Due Date":
  if "Measles-containing vaccine (MCV) supplementary dose" then Encounter."Date when the primary vaccination series completed" + 4 weeks
  else null

/*
@dynamicValue: Measles-containing vaccine (MCV) supplementary dose Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Measles-containing vaccine (MCV) supplementary dose Overdue":
  null

/*
@dynamicValue: Measles-containing vaccine (MCV) supplementary dose Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Measles-containing vaccine (MCV) supplementary dose Expiration":
  null

/*
@complete: MCV supplementary dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Measles-containing vaccines" and "Type of dose" = "Supplementary dose") = 1
*/
define "MCV supplementary dose was administered":
  Encounter."Measles supplementary dose was administered"


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '47.PS2' then "Measles-containing vaccine (MCV) supplementary dose"
    when Patient.id = '47.D1' then not "Measles-containing vaccine (MCV) supplementary dose"
    else 'No test case set'
  end
