
/*
 * Library: IMMZD18SHPV2DoseLogic (IMMZ.D18.S.HPV.2-dose schedule)
 * Schedule Table: 2-dose schedule
 */
library IMMZD18SHPV2DoseLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTHPVEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: HPV dose 1
@description: Provision of the HPV dose 1
@trigger: Child's birth when client's biological sex is female
Child's birth AND "Sex" = "Female"
@triggerDate: "Date of birth"
*/
define "HPV dose 1":
  Encounter."No HPV primary series doses were administered"
  and not "First HPV dose from the primary series was administered"

/*
@output: HPV dose 1 Create
@create: HPV dose 1 should be provided if the client is female and older than 9 years of age.
*/
define "HPV dose 1 Create":
  if "HPV dose 1" 
  then 'HPV dose 1 should be provided if the client is female and older than 9 years of age.' + '
Due Date: ' + ToString("HPV dose 1 Due Date") + '
Overdue: ' + ToString("HPV dose 1 Overdue")
  else ''

/*
@dynamicValue: HPV dose 1 Due Date
@pseudocode: "Date of birth" + 9 years
*/
define "HPV dose 1 Due Date":
  if "HPV dose 1" then Patient.birthDate + 9 years
  else null

/*
@dynamicValue: HPV dose 1 Overdue
@pseudocode: "Date of birth" + 14 years
*/
define "HPV dose 1 Overdue":
  if "HPV dose 1" then Patient.birthDate + 14 years
  else null

/*
@dynamicValue: HPV dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date.
*/
define "HPV dose 1 Expiration":
  null
  
/*
@complete: First HPV dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "HPV vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First HPV dose from the primary series was administered":
  Encounter."One HPV primary series dose was administered"

/*
@output: HPV dose 2
@description: Provision of the HPV dose 2
@trigger: First HPV dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "HPV vaccines" and "Type of dose" = "Primary series") = 1
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "HPV vaccines")
*/
define "HPV dose 2":
  "First HPV dose from the primary series was administered"
  and not "Second HPV dose from the primary series was administered"

/*
@output: HPV dose 2 Create
@create: HPV dose 2 should be provided if dose 1 was given 6 months ago.
*/
define "HPV dose 2 Create":
  if "HPV dose 2" 
  then 'HPV dose 2 should be provided if dose 1 was given 6 months ago.' + '
Due Date: ' + ToString("HPV dose 2 Due Date") + '
Overdue: ' + ToString("HPV dose 2 Overdue")
  else ''

/*
@dynamicValue: HPV dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "HPV vaccines") + 6 months
*/
define "HPV dose 2 Due Date":
  if "HPV dose 2" then Encounter."Date of Latest HPV Dose" + 6 months
  else null

/*
@dynamicValue: HPV dose 2 Overdue
@pseudocode: "Date of birth" + 14 years
*/
define "HPV dose 2 Overdue":
  if "HPV dose 2" then Patient.birthDate + 14 years
  else null

/*
@dynamicValue: HPV dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date.
*/
define "HPV dose 2 Expiration":
  null
  
/*
@complete: Second HPV dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "HPV vaccines" and "Type of dose" = "Primary series") = 2
*/
define "Second HPV dose from the primary series was administered":
  Encounter."Two HPV primary series doses were administered"

/*
@output: HPV dose 3 (immunocompromised or HIV-positive)
@description: Provision of the HPV dose 3 for individuals immunocompromised or infected with HIV
@trigger: Second HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised
Count of vaccines administered (where "Vaccine type" = "HPV vaccines" and "Type of dose" = "Primary series") = 2 AND ("HIV status" = "HIV-positive" OR "Immunocompromised" = TRUE)
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "HPV vaccines")
*/
define "HPV dose 3 (immunocompromised or HIV-positive)":
  "Second HPV dose from the primary series was administered"
  and (
    Encounter."Client's HIV status is positive"
    or Encounter."Client is immunocompromised"
  )
  and not "Third HPV dose from the primary series was administered"

/*
@output: HPV dose 3 (immunocompromised or HIV-positive) Create
@create: Where possible, three HPV doses should be provided to individuals known to be immunocompromised or infected with HIV.
*/
define "HPV dose 3 (immunocompromised or HIV-positive) Create":
  if "HPV dose 3 (immunocompromised or HIV-positive)" 
  then 'Where possible, three HPV doses should be provided to individuals known to be immunocompromised or infected with HIV.' + '
Due Date: ' + ToString("HPV dose 3 (immunocompromised or HIV-positive) Due Date")
  else ''

/*
@dynamicValue: HPV dose 3 (immunocompromised or HIV-positive) Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "HPV vaccines") + 6 months
*/
define "HPV dose 3 (immunocompromised or HIV-positive) Due Date":
  if "HPV dose 3 (immunocompromised or HIV-positive)" then Encounter."Date of Latest HPV Dose" + 6 months
  else null

/*
@dynamicValue: HPV dose 3 (immunocompromised or HIV-positive) Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "HPV dose 3 (immunocompromised or HIV-positive) Overdue":
  null

/*
@dynamicValue: HPV dose 3 (immunocompromised or HIV-positive) Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date.
*/
define "HPV dose 3 (immunocompromised or HIV-positive) Expiration":
  null
  
/*
@complete: Third HPV dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "HPV vaccines" and "Type of dose" = "Primary series") = 3
*/
define "Third HPV dose from the primary series was administered":
  Encounter."Three HPV primary series doses were administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.1' then "HPV dose 1"
    when Patient.id = '09.012' then "HPV dose 1"
    when Patient.id = '10.012' then "HPV dose 1"
    when Patient.id = '11.02' then "HPV dose 1"
    when Patient.id = '12.03' then "HPV dose 2"
    when Patient.id = '13.03' then "HPV dose 2"
    when Patient.id = '14.035' then "HPV dose 3 (immunocompromised or HIV-positive)"
    when Patient.id = '15.035' then "HPV dose 3 (immunocompromised or HIV-positive)"
    when Patient.id = '16.034' then "HPV dose 3 (immunocompromised or HIV-positive)"
    when Patient.id = '17.034' then "HPV dose 3 (immunocompromised or HIV-positive)"
    when Patient.id = '18.045' then "Second HPV dose from the primary series was administered" and not "HPV dose 3 (immunocompromised or HIV-positive)"
    when Patient.id = '19.0' then "Third HPV dose from the primary series was administered"
    else 'No test case set'
  end
