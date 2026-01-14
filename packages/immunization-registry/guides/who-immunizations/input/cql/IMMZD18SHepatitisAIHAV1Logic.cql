
/*
 * Library: IMMZD18SHepatitisAIHAV1Logic (IMMZ.D18.S.Hepatitis A.Inactivated HAV 1-dose schedule)
 * Schedule Table: Inactivated hepatitis A virus (HAV), 1-dose schedule
 */
library IMMZD18SHepatitisAIHAV1Logic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTHepatitisAEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Hepatitis A dose 1
@description: Provision of the hepatitis A dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Hepatitis A dose 1":
  Encounter."No hepatitis A primary series dose was administered"
  and not "First hepatitis A dose from the primary series was administered. The primary series has been completed"

/*
@output: Hepatitis A dose 1 Create
@create: WHO recommends that vaccination against HAV be introduced into national immunization schedules for individuals aged ≥ 12 months.
*/
define "Hepatitis A dose 1 Create":
  if "Hepatitis A dose 1" 
  then 'WHO recommends that vaccination against HAV be introduced into national immunization schedules for individuals aged ≥ 12 months.' + '
Due Date: ' + ToString("Hepatitis A dose 1 Due Date")
  else ''

/*
@dynamicValue: Hepatitis A dose 1 Due Date
@pseudocode: "Date of birth" + 12 months
*/
define "Hepatitis A dose 1 Due Date":
  if "Hepatitis A dose 1" then Patient.birthDate + 12 months
  else null

/*
@dynamicValue: Hepatitis A dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Hepatitis A dose 1 Overdue":
  null

/*
@dynamicValue: Hepatitis A dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Hepatitis A dose 1 Expiration":
  null
  
/*
@complete: First hepatitis A dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Hepatitis A-containing vaccines")
*/
define "First hepatitis A dose from the primary series was administered. The primary series has been completed":
  Encounter."One hepatitis A primary series dose was administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '20.1' then "Hepatitis A dose 1"
    when Patient.id = '21.01' then "Hepatitis A dose 1"
    when Patient.id = '22.0' then "First hepatitis A dose from the primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
