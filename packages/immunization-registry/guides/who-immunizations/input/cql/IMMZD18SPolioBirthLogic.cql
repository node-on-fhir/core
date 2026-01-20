
/*
 * Library: IMMZD18SPolioBirthLogic (IMMZ.D18.S.Polio.Birth dose schedule)
 * Schedule Table: Birth dose schedule (in countries that are poliomyelitis (polio)-endemic countries or countries at high risk for importation and subsequent spread of polio that follow the combined bivalent oral polio vaccine [bOPV]–inactivated polio vaccine [IPV] schedule)
 */
library IMMZD18SPolioBirthLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTPolioEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: bOPV birth dose (a zero dose)
@description: Provision of bOPV birth dose (a zero dose)
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "bOPV birth dose (a zero dose)":
  not "Polio birth dose (a zero dose) was administered"
  and "bOPV birth dose (a zero dose) Expiration" after day of Today

/*
@output: bOPV birth dose (a zero dose) Create
@create: bOPV birth dose (a zero dose) should be provided within the first week of life and if the client is in a polio-endemic country or a country at high risk for importation and subsequent spread of polio
*/
define "bOPV birth dose (a zero dose) Create":
  if "bOPV birth dose (a zero dose)" 
  then 'bOPV birth dose (a zero dose) should be provided within the first week of life and if the client is in a polio-endemic country or a country at high risk for importation and subsequent spread of polio' + '
Due Date: ' + ToString("bOPV birth dose (a zero dose) Due Date") + '
Overdue: ' + ToString("bOPV birth dose (a zero dose) Overdue") + '
Expiration: ' + ToString("bOPV birth dose (a zero dose) Expiration")
  else ''

/*
@dynamicValue: bOPV birth dose (a zero dose) Due Date
@pseudocode: "Date of birth"
*/
define "bOPV birth dose (a zero dose) Due Date":
  if "bOPV birth dose (a zero dose)" then Patient.birthDate
  else null

/*
@dynamicValue: bOPV birth dose (a zero dose) Overdue
@pseudocode: "Date of birth" + 1 day
*/
define "bOPV birth dose (a zero dose) Overdue":
  if "bOPV birth dose (a zero dose)" then Patient.birthDate + 1 day
  else null

/*
@dynamicValue: bOPV birth dose (a zero dose) Expiration
@pseudocode: "Date of birth" + 1 week
*/
define "bOPV birth dose (a zero dose) Expiration":
  Patient.birthDate + 1 week

/*
@complete: Polio birth dose (a zero dose) was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of dose" = "Dose 0" AND "Birth dose" = TRUE) = 1
*/
define "Polio birth dose (a zero dose) was administered":
  Encounter."bOPV birth dose (a zero dose) was administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.Alt1w' then "bOPV birth dose (a zero dose)"
    when Patient.id = '09.Agt1w' then not "bOPV birth dose (a zero dose)"
    when Patient.id = '10.D1' then not "bOPV birth dose (a zero dose)"
    else 'No test case set'
  end
