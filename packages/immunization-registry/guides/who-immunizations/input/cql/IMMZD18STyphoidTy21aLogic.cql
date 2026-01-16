
/*
 * Library: IMMZD18STyphoidTy21aLogic (IMMZ.D18.S.Typhoid.Ty21a schedule)
 * Schedule Table: Live attenuated Ty21a vaccine, 3-dose schedule
 */
library IMMZD18STyphoidTy21aLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTTyphoidEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Typhoid Ty21a primary series
@description: Provision of the typhoid Ty21a, 3-dose oral primary series immunization
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Typhoid Ty21a primary series":
  Encounter."No typhoid primary series doses were administered"
  and not "The primary series has been completed"

/*
@output: Typhoid Ty21a primary series Create
@create: Ty21a – 3-doses to be administered orally every second day from 6 years of age.
*/
define "Typhoid Ty21a primary series Create":
  if "Typhoid Ty21a primary series" 
  then 'Ty21a – 3-doses to be administered orally every second day from 6 years of age.' + '
Due Date: ' + ToString("Typhoid Ty21a primary series Due Date")
  else ''

/*
@dynamicValue: Typhoid Ty21a primary series Due Date
@pseudocode: "Date of birth" + 6 years
*/
define "Typhoid Ty21a primary series Due Date":
  if "Typhoid Ty21a primary series" then Patient.birthDate + 6 years
  else null

/*
@dynamicValue: Typhoid Ty21a primary series Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Typhoid Ty21a primary series Overdue":
  null

/*
@dynamicValue: Typhoid Ty21a primary series Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Typhoid Ty21a primary series Expiration":
  null
  
/*
@complete: The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Typhoid vaccines")
*/
define "The primary series has been completed":
  Encounter."Primary series is complete"

/*
@output: Typhoid booster dose(s): repeat 3-doses series
@description: Provision of the typhoid booster dose(s): revaccination
@trigger: The primary series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Typhoid vaccines")
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Typhoid vaccines")
*/
define "Typhoid booster dose(s) repeat 3-doses series":
  "The primary series has been completed"

/*
@output: Typhoid booster dose(s): repeat 3-doses series Create
@create: Revaccination (3-doses) is recommended every 3–7 years for Ty21a.
*/
define "Typhoid booster dose(s) repeat 3-doses series Create":
  if "Typhoid booster dose(s) repeat 3-doses series" 
  then 'Revaccination (3-doses) is recommended every 3–7 years for Ty21a.' + '
Due Date: ' + ToString("Typhoid booster dose(s) repeat 3-doses series Due Date") + '
Overdue: ' + ToString("Typhoid booster dose(s) repeat 3-doses series Overdue")
  else ''

/*
@dynamicValue: Typhoid booster dose(s): repeat 3-doses series Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Typhoid vaccines") + 3 years
*/
define "Typhoid booster dose(s) repeat 3-doses series Due Date":
  if "Typhoid booster dose(s) repeat 3-doses series" then Encounter."Date of Latest Typhoid Dose" + 3 years
  else null

/*
@dynamicValue: Typhoid booster dose(s): repeat 3-doses series Overdue
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Typhoid vaccines") + 7 years
*/
define "Typhoid booster dose(s) repeat 3-doses series Overdue":
  if "Typhoid booster dose(s) repeat 3-doses series" then Encounter."Date of Latest Typhoid Dose" + 7 years
  else null

/*
@dynamicValue: Typhoid booster dose(s): repeat 3-doses series Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Typhoid booster dose(s) repeat 3-doses series Expiration":
  null
  
/*
@complete: The booster series has been completed
@pseudocode: "Completed the booster series" = TRUE (where "Vaccine type" = "Typhoid vaccines")
*/
define "The booster series has been completed":
  Encounter."Date of Latest Typhoid Dose" is not null
  and duration in years between Encounter."Date of Latest Typhoid Dose" and Today < 3

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '30.1' then "Typhoid Ty21a primary series"
    when Patient.id = '31.124' then "Typhoid Ty21a primary series"
    when Patient.id = '32.124' then "Typhoid Ty21a primary series"
    when Patient.id = '33.123' then "Typhoid booster dose(s) repeat 3-doses series"
    when Patient.id = '34.1234' then "Typhoid booster dose(s) repeat 3-doses series"
    when Patient.id = '35.1234' then "Typhoid booster dose(s) repeat 3-doses series"
    else 'No test case set'
  end
