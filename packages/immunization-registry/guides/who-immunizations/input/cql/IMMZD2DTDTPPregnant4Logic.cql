
/*
 * Library: IMMZD2DTDTPPregnant4Logic (IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses)
 * Rule: Determine if the client is due for a diphtheria–tetanus–pertussis (DTP) vaccination according to the national immunization schedule
 * Decision Table: Diphtheria and tetanus vaccination schedule in pregnant women who received 4 childhood DTP doses
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any
 */
library IMMZD2DTDTPPregnant4Logic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTDTPEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is due for tetanus and diphtheria booster dose" then "Client is due for tetanus and diphtheria booster dose Guidance"
    when "Client is not due for tetanus and diphtheria booster dose" then "Client is not due for tetanus and diphtheria booster dose Guidance"
    when "Tetanus and diphtheria immunization schedule is complete" then "Tetanus and diphtheria immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is due for tetanus and diphtheria booster dose Case 1
@pseudocode: "Immunization recommendation status" = "Due" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Client is due for tetanus and diphtheria booster dose Case 1":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."One tetanus and diphtheria booster dose was administered"
    and Encounter."Client is currently pregnant"

/*
@output: Client is due for tetanus and diphtheria booster dose Case 2
@pseudocode: "Immunization recommendation status" = "Due" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Client is due for tetanus and diphtheria booster dose Case 2":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."Two tetanus and diphtheria booster doses were administered"
    and Encounter."The latest tetanus and diphtheria dose was administered more than 1 year ago"

/*
@output: Client is due for tetanus and diphtheria booster dose
@pseudocode: "Immunization recommendation status" = "Due" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Client is due for tetanus and diphtheria booster dose":
  "Client is due for tetanus and diphtheria booster dose Case 1"
    or "Client is due for tetanus and diphtheria booster dose Case 2"

/*
@output: Client is due for tetanus and diphtheria booster dose Guidance
@guidance: Should vaccinate client with second tetanus and diphtheria booster dose as three DTP primary series doses and one tetanus and diphtheria booster dose were administered and client is currently pregnant. 
Check for contraindications.
@guidance: Should vaccinate client with third tetanus and diphtheria booster dose as the latest tetanus and diphtheria dose was administered more than 1 year ago. This dose should be administered at least 1 year after second booster dose or during next pregnancy. 
Check for contraindications.
*/
define "Client is due for tetanus and diphtheria booster dose Guidance":
  case
    when "Client is due for tetanus and diphtheria booster dose Case 1" then 'Should vaccinate client with second tetanus and diphtheria booster dose as three DTP primary series doses and one tetanus and diphtheria booster dose were administered and client is currently pregnant. 
Check for contraindications.'
    when "Client is due for tetanus and diphtheria booster dose Case 2" then 'Should vaccinate client with third tetanus and diphtheria booster dose as the latest tetanus and diphtheria dose was administered more than 1 year ago. This dose should be administered at least 1 year after second booster dose or during next pregnancy. 
Check for contraindications.'
    else ''
  end

/*
@output: Client is not due for tetanus and diphtheria booster dose
@pseudocode: "Immunization recommendation status" = "Not due" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Client is not due for tetanus and diphtheria booster dose":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."Two tetanus and diphtheria booster doses were administered"
    and Encounter."The latest tetanus and diphtheria dose was administered less than 1 year ago"

/*
@output: Client is not due for tetanus and diphtheria booster dose Guidance
@guidance: Should not vaccinate client with third tetanus and diphtheria booster dose as the latest tetanus and booster dose was administered less than 1 year ago. This dose should be administered at least 1 year after second booster dose or during next pregnancy. 
Check for any other vaccines due and inform the caregiver of when to come back for third tetanus and diphtheria booster dose.
*/
define "Client is not due for tetanus and diphtheria booster dose Guidance":
  'Should not vaccinate client with third tetanus and diphtheria booster dose as the latest tetanus and booster dose was administered less than 1 year ago. This dose should be administered at least 1 year after second booster dose or during next pregnancy. 
Check for any other vaccines due and inform the caregiver of when to come back for third tetanus and diphtheria booster dose.'

/*
@output: Tetanus and diphtheria immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Tetanus and diphtheria immunization schedule is complete":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."Three tetanus and diphtheria booster doses were administered"

/*
@output: Tetanus and diphtheria immunization schedule is complete Guidance
@guidance: Tetanus and diphtheria immunization schedule is complete. Three DTP primary series doses and three tetanus and diphtheria booster doses were administered.
Check for any other vaccines due.
*/
define "Tetanus and diphtheria immunization schedule is complete Guidance":
  'Tetanus and diphtheria immunization schedule is complete. Three DTP primary series doses and three tetanus and diphtheria booster doses were administered.
Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '79.DTP3Td1PT' then "Client is due for tetanus and diphtheria booster dose Case 1" and "Guidance" = 'Should vaccinate client with second tetanus and diphtheria booster dose as three DTP primary series doses and one tetanus and diphtheria booster dose were administered and client is currently pregnant. 
Check for contraindications.'
    when Patient.id = '80.DTP3Td2Tdlt1y' then "Client is not due for tetanus and diphtheria booster dose" and "Guidance" = 'Should not vaccinate client with third tetanus and diphtheria booster dose as the latest tetanus and booster dose was administered less than 1 year ago. This dose should be administered at least 1 year after second booster dose or during next pregnancy. 
Check for any other vaccines due and inform the caregiver of when to come back for third tetanus and diphtheria booster dose.'
    when Patient.id = '81.DTP3Td2Tdgt1y' then "Client is due for tetanus and diphtheria booster dose Case 2" and "Guidance" = 'Should vaccinate client with third tetanus and diphtheria booster dose as the latest tetanus and diphtheria dose was administered more than 1 year ago. This dose should be administered at least 1 year after second booster dose or during next pregnancy. 
Check for contraindications.'
    when Patient.id = '82.DTP3Td3' then "Tetanus and diphtheria immunization schedule is complete" and "Guidance" = 'Tetanus and diphtheria immunization schedule is complete. Three DTP primary series doses and three tetanus and diphtheria booster doses were administered.
Check for any other vaccines due.'
    else 'No test case set'
  end
