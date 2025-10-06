
/*
 * Library: IMMZD2DTDTPPregnantLogic (IMMZ.D2.DT.DTP.Pregnancy)
 * Rule: Determine if the client is due for a diphtheria–tetanus–pertussis (DTP) vaccination according to the national immunization schedule
 * Decision Table: Determine whether DTP-containing vaccines are needed for pregnant women
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any
 */
library IMMZD2DTDTPPregnantLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC
include IMMZCommon called IC
include WHOConcepts called Concepts
include WHOElements called WE
include IMMZD2DTDTPEncounterElements called Encounter
include IMMZEncounterElements called IE

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client should follow 'delayed or interrupted series' decision logic" then "Client should follow 'delayed or interrupted series' decision logic Guidance"
    when "Client should follow 'pregnancy starting with 3 doses' decision logic" then "Client should follow 'pregnancy starting with 3 doses' decision logic Guidance"
    when "Client should follow 'pregnancy starting with 4 doses' decision logic" then "Client should follow 'pregnancy starting with 4 doses' decision logic Guidance"
    when "Tetanus and diphtheria immunization schedule is complete" then "Tetanus and diphtheria immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client should follow 'delayed or interrupted series' decision logic
@pseudocode: 
*/
define "Client should follow 'delayed or interrupted series' decision logic":
  Encounter."No DTP primary series doses were administered"
    and Encounter."Client is currently pregnant"

/*
@output: Client should follow 'delayed or interrupted series' decision logic Guidance
@guidance: The client has a delayed start. Please follow the 'delayed or interrupted' schedule.
*/
define "Client should follow 'delayed or interrupted series' decision logic Guidance":
  'The client has a delayed start. Please follow the \'delayed or interrupted\' schedule.'

/*
@output: Client should follow 'pregnancy starting with 3 doses' decision logic
@pseudocode: 
*/
define "Client should follow 'pregnancy starting with 3 doses' decision logic":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."No tetanus and diphtheria booster dose was administered"
    and Encounter."Client is currently pregnant"

/*
@output: Client should follow 'pregnancy starting with 3 doses' decision logic Guidance
@guidance: The client has received 3 tetanus-containing vaccine doses during childhood. Please follow the 'pregnancy starting with 3 doses' schedule.
*/
define "Client should follow 'pregnancy starting with 3 doses' decision logic Guidance":
  'The client has received 3 tetanus-containing vaccine doses during childhood. Please follow the \'pregnancy starting with 3 doses\' schedule.'

/*
@output: Client should follow 'pregnancy starting with 4 doses' decision logic
@pseudocode: 
*/
define "Client should follow 'pregnancy starting with 4 doses' decision logic":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."One tetanus and diphtheria booster dose was administered"
    and Encounter."Client is currently pregnant"

/*
@output: Client should follow 'pregnancy starting with 4 doses' decision logic Guidance
@guidance: The client has received 4 tetanus-containing vaccines doses during childhood or pre-adulthood. Please follow the 'pregnancy starting with 4 doses' schedule.
*/
define "Client should follow 'pregnancy starting with 4 doses' decision logic Guidance":
  'The client has received 4 tetanus-containing vaccines doses during childhood or pre-adulthood. Please follow the \'pregnancy starting with 4 doses\' schedule.'

/*
@output: Tetanus and diphtheria immunization schedule is complete Case 1
@pseudocode: "Immunization recommendation status" = "Complete" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Tetanus and diphtheria immunization schedule is complete Case 1":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."Two tetanus and diphtheria booster doses were administered"

/*
@output: Tetanus and diphtheria immunization schedule is complete Case 2
@pseudocode: "Immunization recommendation status" = "Complete" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Tetanus and diphtheria immunization schedule is complete Case 2":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."Three tetanus and diphtheria booster doses were administered"

/*
@output: Tetanus and diphtheria immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Tetanus and diphtheria immunization schedule is complete":
  "Tetanus and diphtheria immunization schedule is complete Case 1"
    or "Tetanus and diphtheria immunization schedule is complete Case 2"

/*
@output: Tetanus and diphtheria immunization schedule is complete Guidance
@guidance: Tetanus and diphtheria immunization schedule is complete.Three DTP primary series doses and two tetanus and diphtheria booster doses were administered. There is no need for any additional tetanus and diphtheria doses.
Check for any other vaccines due.
@guidance: Tetanus and diphtheria immunization schedule is complete.Three DTP primary series doses and three tetanus and diphtheria booster doses were administered. There is no need for any additional tetanus and diphtheria doses.
Check for any other vaccines due.
*/
define "Tetanus and diphtheria immunization schedule is complete Guidance":
  case
    when "Tetanus and diphtheria immunization schedule is complete Case 1" then 'Tetanus and diphtheria immunization schedule is complete.Three DTP primary series doses and two tetanus and diphtheria booster doses were administered. There is no need for any additional tetanus and diphtheria doses.
Check for any other vaccines due.'
    when "Tetanus and diphtheria immunization schedule is complete Case 2" then 'Tetanus and diphtheria immunization schedule is complete.Three DTP primary series doses and three tetanus and diphtheria booster doses were administered. There is no need for any additional tetanus and diphtheria doses.
Check for any other vaccines due.'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '54.DTP0PT' then "Client should follow 'delayed or interrupted series' decision logic" and "Guidance" = 'The client has a delayed start. Please follow the \'delayed or interrupted\' schedule.'
    when Patient.id = '55.DTP3Td0PT' then "Client should follow 'pregnancy starting with 3 doses' decision logic" and "Guidance" = 'The client has received 3 tetanus-containing vaccine doses during childhood. Please follow the \'pregnancy starting with 3 doses\' schedule.'
    when Patient.id = '56.DTP3Td1PT' then "Client should follow 'pregnancy starting with 4 doses' decision logic" and "Guidance" = 'The client has received 4 tetanus-containing vaccines doses during childhood or pre-adulthood. Please follow the \'pregnancy starting with 4 doses\' schedule.'
    when Patient.id = '57.DTP3Td2' then "Tetanus and diphtheria immunization schedule is complete Case 1" and "Guidance" = 'Tetanus and diphtheria immunization schedule is complete.Three DTP primary series doses and two tetanus and diphtheria booster doses were administered. There is no need for any additional tetanus and diphtheria doses.
Check for any other vaccines due.'
    when Patient.id = '58.DTP3Td3' then "Tetanus and diphtheria immunization schedule is complete Case 2" and "Guidance" = 'Tetanus and diphtheria immunization schedule is complete.Three DTP primary series doses and three tetanus and diphtheria booster doses were administered. There is no need for any additional tetanus and diphtheria doses.
Check for any other vaccines due.'
    else 'No test case set'
  end
