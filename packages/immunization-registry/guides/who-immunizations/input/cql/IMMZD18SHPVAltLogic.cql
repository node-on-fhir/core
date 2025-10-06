
/*
 * Library: IMMZD18SHPVAltLogic (IMMZ.D18.S.Single-dose schedule)
 * Schedule Table: Alternative single-dose schedule
 */
library IMMZD18SHPVAltLogic

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
@output: Human papillomavirus (HPV) dose 1
@description: Provision of the HPV dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Human papillomavirus (HPV) dose 1":
  Encounter."No HPV primary series doses were administered"
  and not "First HPV dose from the primary series was administered"

/*
@output: Human papillomavirus (HPV) dose 1 Create
@create: HPV dose 1 should be provided if the client is older than 9 years of age.
*/
define "Human papillomavirus (HPV) dose 1 Create":
  if "Human papillomavirus (HPV) dose 1" 
  then 'HPV dose 1 should be provided if the client is older than 9 years of age.' + '
Due Date: ' + ToString("Human papillomavirus (HPV) dose 1 Due Date") + '
Overdue: ' + ToString("Human papillomavirus (HPV) dose 1 Overdue")
  else ''

/*
@dynamicValue: Human papillomavirus (HPV) dose 1 Due Date
@pseudocode: "Date of birth" + 9 years
*/
define "Human papillomavirus (HPV) dose 1 Due Date":
  if "Human papillomavirus (HPV) dose 1" then Patient.birthDate + 9 years
  else null

/*
@dynamicValue: Human papillomavirus (HPV) dose 1 Overdue
@pseudocode: "Date of birth" + 20 years
*/
define "Human papillomavirus (HPV) dose 1 Overdue":
  if "Human papillomavirus (HPV) dose 1" then Patient.birthDate + 20 years
  else null

/*
@dynamicValue: Human papillomavirus (HPV) dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date.
*/
define "Human papillomavirus (HPV) dose 1 Expiration":
  null
  
/*
@complete: First HPV dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "HPV vaccines") = 1
*/
define "First HPV dose from the primary series was administered":
  Encounter."One HPV primary series dose was administered"

/*
@output: HPV dose 2 (Immunocompromised or HIV-positive)
@description: Provision of the HPV dose 2 for individuals immunocompromised or infected with HIV
@trigger: First HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised
Count of vaccines administered (where "Vaccine type" = "HPV vaccines") = 1 AND ("HIV status" = "HIV-positive" OR "Immunocompromised" = TRUE)
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "HPV vaccines")
*/
define "HPV dose 2 (Immunocompromised or HIV-positive)":
  "First HPV dose from the primary series was administered"
  and (
    Encounter."Client's HIV status is positive"
    or Encounter."Client is immunocompromised"
  )
  and not "Second HPV dose from the primary series was administered"

/*
@output: HPV dose 2 (Immunocompromised or HIV-positive) Create
@create: Individuals known to be immunocompromised or infected with HIV should receive at least two HPV vaccine doses.
*/
define "HPV dose 2 (Immunocompromised or HIV-positive) Create":
  if "HPV dose 2 (Immunocompromised or HIV-positive)" 
  then 'Individuals known to be immunocompromised or infected with HIV should receive at least two HPV vaccine doses.' + '
Due Date: ' + ToString("HPV dose 2 (Immunocompromised or HIV-positive) Due Date")
  else ''

/*
@dynamicValue: HPV dose 2 (Immunocompromised or HIV-positive) Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "HPV vaccines") + 6 months
*/
define "HPV dose 2 (Immunocompromised or HIV-positive) Due Date":
  if "HPV dose 2 (Immunocompromised or HIV-positive)" then Encounter."Date of Latest HPV Dose" + 6 months
  else null

/*
@dynamicValue: HPV dose 2 (Immunocompromised or HIV-positive) Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "HPV dose 2 (Immunocompromised or HIV-positive) Overdue":
  null

/*
@dynamicValue: HPV dose 2 (Immunocompromised or HIV-positive) Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date.
*/
define "HPV dose 2 (Immunocompromised or HIV-positive) Expiration":
  null
  
/*
@complete: Second HPV dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "HPV vaccines") = 2
*/
define "Second HPV dose from the primary series was administered":
  Encounter."Two HPV primary series doses were administered"

/*
@output: HPV dose 3 (Immunocompromised or HIV-positive)
@description: Provision of the HPV dose 3 for individuals immunocompromised or infected with HIV
@trigger: Second HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised
Count of vaccines administered (where "Vaccine type" = "HPV vaccines") = 2 AND ("HIV status" = "HIV-positive" OR "Immunocompromised" = TRUE)
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "HPV vaccines")
*/
define "HPV dose 3 (Immunocompromised or HIV-positive)":
  "Second HPV dose from the primary series was administered"
  and (
    Encounter."Client's HIV status is positive"
    or Encounter."Client is immunocompromised"
  )
  and not "Third HPV dose from the primary series was administered"

/*
@output: HPV dose 3 (Immunocompromised or HIV-positive) Create
@create: Where possible, three HPV doses should be provided to individuals known to be immunocompromised or infected with HIV.
*/
define "HPV dose 3 (Immunocompromised or HIV-positive) Create":
  if "HPV dose 3 (Immunocompromised or HIV-positive)" 
  then 'Where possible, three HPV doses should be provided to individuals known to be immunocompromised or infected with HIV.' + '
Due Date: ' + ToString("HPV dose 3 (Immunocompromised or HIV-positive) Due Date")
  else ''

/*
@dynamicValue: HPV dose 3 (Immunocompromised or HIV-positive) Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "HPV vaccines") + 6 months
*/
define "HPV dose 3 (Immunocompromised or HIV-positive) Due Date":
  if "HPV dose 3 (Immunocompromised or HIV-positive)" then Encounter."Date of Latest HPV Dose" + 6 months
  else null

/*
@dynamicValue: HPV dose 3 (Immunocompromised or HIV-positive) Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "HPV dose 3 (Immunocompromised or HIV-positive) Overdue":
  null

/*
@dynamicValue: HPV dose 3 (Immunocompromised or HIV-positive) Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date.
*/
define "HPV dose 3 (Immunocompromised or HIV-positive) Expiration":
  null
  
/*
@complete: Third HPV dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "HPV vaccines") = 3
*/
define "Third HPV dose from the primary series was administered":
  Encounter."Three HPV primary series doses were administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '27.1' then "Human papillomavirus (HPV) dose 1"
    when Patient.id = '28.01' then "Human papillomavirus (HPV) dose 1"
    when Patient.id = '29.01' then "Human papillomavirus (HPV) dose 1"
    when Patient.id = '30.024' then "HPV dose 2 (Immunocompromised or HIV-positive)"
    when Patient.id = '31.024' then "HPV dose 2 (Immunocompromised or HIV-positive)"
    when Patient.id = '32.023' then "HPV dose 2 (Immunocompromised or HIV-positive)"
    when Patient.id = '33.023' then "HPV dose 2 (Immunocompromised or HIV-positive)"
    when Patient.id = '34.034' then "First HPV dose from the primary series was administered" and not "HPV dose 2 (Immunocompromised or HIV-positive)"
    when Patient.id = '35.024' then "HPV dose 3 (Immunocompromised or HIV-positive)"
    when Patient.id = '36.024' then "HPV dose 3 (Immunocompromised or HIV-positive)"
    when Patient.id = '37.023' then "HPV dose 3 (Immunocompromised or HIV-positive)"
    when Patient.id = '38.023' then "HPV dose 3 (Immunocompromised or HIV-positive)"
    when Patient.id = '39.0' then "Third HPV dose from the primary series was administered"
    else 'No test case set'
  end
