
/*
 * Library: IMMZD2DTDTPOnTimeLogic (IMMZ.D2.DT.DTP.On-time start)
 * Rule: Determine if the client is due for a diphtheria–tetanus–pertussis (DTP) vaccination according to the national immunization schedule
 * Decision Table: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any
 */
library IMMZD2DTDTPOnTimeLogic

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

    // Handling overlaps for Pertussis and Td boosters.
    when "Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose" and "Client is not due for pertussis booster dose"
      then "Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose Guidance" + '\n' + "Client is not due for pertussis booster dose Guidance"
    when "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose" and "Primary DTP series is complete. Client is not due for pertussis booster dose" 
      then "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose Guidance" + '\n' + "Primary DTP series is complete. Client is not due for pertussis booster dose Guidance"
    when "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose" and "Primary DTP series is complete. Client is due for pertussis booster dose" 
      then "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose Guidance" + '\n' + "Primary DTP series is complete. Client is due for pertussis booster dose Guidance"
    when "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose" and "Pertussis immunization schedule is complete" 
      then "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose Guidance" + '\n' + "Pertussis immunization schedule is complete Guidance"
    when "Client is not due for tetanus and diphtheria booster dose" and "Primary DTP series is complete. Client is not due for pertussis booster dose" 
      then "Client is not due for tetanus and diphtheria booster dose Guidance" + '\n' + "Primary DTP series is complete. Client is not due for pertussis booster dose Guidance"
    when "Client is not due for tetanus and diphtheria booster dose" and "Primary DTP series is complete. Client is due for pertussis booster dose" 
      then "Client is not due for tetanus and diphtheria booster dose Guidance" + '\n' + "Primary DTP series is complete. Client is due for pertussis booster dose Guidance"
    when "Client is not due for tetanus and diphtheria booster dose" and "Pertussis immunization schedule is complete" 
      then "Client is not due for tetanus and diphtheria booster dose Guidance" + '\n' + "Pertussis immunization schedule is complete Guidance"
    when "Client is due for tetanus and diphtheria booster dose" and "Primary DTP series is complete. Client is not due for pertussis booster dose" 
      then "Client is due for tetanus and diphtheria booster dose Guidance" + '\n' + "Primary DTP series is complete. Client is not due for pertussis booster dose Guidance"
    when "Client is due for tetanus and diphtheria booster dose" and "Primary DTP series is complete. Client is due for pertussis booster dose" 
      then "Client is due for tetanus and diphtheria booster dose Guidance" + '\n' + "Primary DTP series is complete. Client is due for pertussis booster dose Guidance"
    when "Client is due for tetanus and diphtheria booster dose" and "Pertussis immunization schedule is complete" 
      then "Client is due for tetanus and diphtheria booster dose Guidance" + '\n' + "Pertussis immunization schedule is complete Guidance"
    when "Tetanus and diphtheria immunization schedule is complete" and "Pertussis immunization schedule is complete" 
      then "Tetanus and diphtheria immunization schedule is complete Guidance" + '\n' + "Pertussis immunization schedule is complete Guidance"

    when "Client is not due for DTP vaccination" then "Client is not due for DTP vaccination Guidance"
    when "Client is due for DTP vaccination" then "Client is due for DTP vaccination Guidance"
    when "Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose" then "Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose Guidance"
    when "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose" then "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose Guidance"
    when "Client is not due for tetanus and diphtheria booster dose" then "Client is not due for tetanus and diphtheria booster dose Guidance"
    when "Client is due for tetanus and diphtheria booster dose" then "Client is due for tetanus and diphtheria booster dose Guidance"
    when "Tetanus and diphtheria immunization schedule is complete" then "Tetanus and diphtheria immunization schedule is complete Guidance"
    when "Client is not due for pertussis booster dose" then "Client is not due for pertussis booster dose Guidance"
    when "Primary DTP series is complete. Client is not due for pertussis booster dose" then "Primary DTP series is complete. Client is not due for pertussis booster dose Guidance"
    when "Primary DTP series is complete. Client is due for pertussis booster dose" then "Primary DTP series is complete. Client is due for pertussis booster dose Guidance"
    when "Pertussis immunization schedule is complete" then "Pertussis immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for DTP vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due" (where "Vaccine type" = "DTP-containing vaccines")
*/
define "Client is not due for DTP vaccination Case 1":
  Encounter."Client's age is less than 6 weeks"

/*
@output: Client is not due for DTP vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due" (where "Vaccine type" = "DTP-containing vaccines")
*/
define "Client is not due for DTP vaccination Case 2":
  Encounter."One DTP primary series dose was administered"
    and Encounter."The latest DTP dose was administered less than 4 weeks ago"

/*
@output: Client is not due for DTP vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due" (where "Vaccine type" = "DTP-containing vaccines")
*/
define "Client is not due for DTP vaccination Case 3":
  Encounter."Two DTP primary series doses were administered"
    and Encounter."The latest DTP dose was administered less than 4 weeks ago"

/*
@output: Client is not due for DTP vaccination
@pseudocode: "Immunization recommendation status" = "Not due" (where "Vaccine type" = "DTP-containing vaccines")
*/
define "Client is not due for DTP vaccination":
  "Client is not due for DTP vaccination Case 1"
    or "Client is not due for DTP vaccination Case 2"
    or "Client is not due for DTP vaccination Case 3"

/*
@output: Client is not due for DTP vaccination Guidance
@guidance: Should not vaccinate client with first DTP dose as client is less than 6 weeks old. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.
@guidance: Should not vaccinate client with second DTP dose as latest DTP dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for second dose.
@guidance: Should not vaccinate client with third DTP dose as the latest DTP dose was administered  less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for next dose.
*/
define "Client is not due for DTP vaccination Guidance":
  case
    when "Client is not due for DTP vaccination Case 1" then 'Should not vaccinate client with first DTP dose as client is less than 6 weeks old. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.'
    when "Client is not due for DTP vaccination Case 2" then 'Should not vaccinate client with second DTP dose as latest DTP dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for second dose.'
    when "Client is not due for DTP vaccination Case 3" then 'Should not vaccinate client with third DTP dose as the latest DTP dose was administered  less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for next dose.'
    else ''
  end

/*
@output: Client is due for DTP vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due" (where "Vaccine type" = "DTP-containing vaccines")
*/
define "Client is due for DTP vaccination Case 1":
  Encounter."No DTP primary series doses were administered"
    and Encounter."Client's age is between 6 weeks and 1 year"

/*
@output: Client is due for DTP vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due" (where "Vaccine type" = "DTP-containing vaccines")
*/
define "Client is due for DTP vaccination Case 2":
  Encounter."One DTP primary series dose was administered"
    and Encounter."The latest DTP dose was administered more than 4 weeks ago"

/*
@output: Client is due for DTP vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due" (where "Vaccine type" = "DTP-containing vaccines")
*/
define "Client is due for DTP vaccination Case 3":
  Encounter."Two DTP primary series doses were administered"
    and Encounter."The latest DTP dose was administered more than 4 weeks ago"

/*
@output: Client is due for DTP vaccination
@pseudocode: "Immunization recommendation status" = "Due" (where "Vaccine type" = "DTP-containing vaccines")
*/
define "Client is due for DTP vaccination":
  "Client is due for DTP vaccination Case 1"
    or "Client is due for DTP vaccination Case 2"
    or "Client is due for DTP vaccination Case 3"

/*
@output: Client is due for DTP vaccination Guidance
@guidance: Should vaccinate client with first DTP dose as no DTP doses were administered and and client's age is within appropriate age range. 
Check for contraindications.
@guidance: Should vaccinate client with second DTP dose as the latest DTP dose was administered more than 4 weeks ago. 
Check for contraindications.
@guidance: Should vaccinate client with third DTP dose as the latest DTP dose was administered more than 4 weeks ago. 
Check for contraindications.
*/
define "Client is due for DTP vaccination Guidance":
  case
    when "Client is due for DTP vaccination Case 1" then 'Should vaccinate client with first DTP dose as no DTP doses were administered and and client\'s age is within appropriate age range. 
Check for contraindications.'
    when "Client is due for DTP vaccination Case 2" then 'Should vaccinate client with second DTP dose as the latest DTP dose was administered more than 4 weeks ago. 
Check for contraindications.'
    when "Client is due for DTP vaccination Case 3" then 'Should vaccinate client with third DTP dose as the latest DTP dose was administered more than 4 weeks ago. 
Check for contraindications.'
    else ''
  end

/*
@output: Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose
@pseudocode: "Immunization recommendation status" = "Not due" (where "Vaccine type" ="Tetanus and diphtheria-containing vaccines")
*/
define "Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."No tetanus and diphtheria booster doses were administered"
    and Encounter."Client's age is less than 12 months"

/*
@output: Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose Guidance
@guidance: Should not vaccinate client with first tetanus and diphtheria booster dose as client's age is less than 12 months. 
Check for any other vaccines due and inform the caregiver of when to come back for first tetanus and diphtheria booster dose.
*/
define "Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose Guidance":
  'Should not vaccinate client with first tetanus and diphtheria booster dose as client\'s age is less than 12 months. 
Check for any other vaccines due and inform the caregiver of when to come back for first tetanus and diphtheria booster dose.'

/*
@output: Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose
@pseudocode: "Immunization recommendation status" = "Due" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."No tetanus and diphtheria booster doses were administered"
    and Encounter."Client's age is more than or equal to 12 months"

/*
@output: Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose Guidance
@guidance: Should vaccinate client with first tetanus and diphtheria booster dose as client is at least 12 months old. Check for contraindications.
*/
define "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose Guidance":
  'Should vaccinate client with first tetanus and diphtheria booster dose as client is at least 12 months old. Check for contraindications.'

/*
@output: Client is not due for tetanus and diphtheria booster dose Case 1
@pseudocode: "Immunization recommendation status" = "Not due" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Client is not due for tetanus and diphtheria booster dose Case 1":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."One tetanus and diphtheria booster dose was administered"
    and Encounter."Client's age is less than 4 years"

/*
@output: Client is not due for tetanus and diphtheria booster dose Case 2
@pseudocode: "Immunization recommendation status" = "Not due" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Client is not due for tetanus and diphtheria booster dose Case 2":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."Two tetanus and diphtheria booster doses were administered"
    and Encounter."Client's age is less than 9 years"

/*
@output: Client is not due for tetanus and diphtheria booster dose
@pseudocode: "Immunization recommendation status" = "Not due" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Client is not due for tetanus and diphtheria booster dose":
  "Client is not due for tetanus and diphtheria booster dose Case 1"
    or "Client is not due for tetanus and diphtheria booster dose Case 2"

/*
@output: Client is not due for tetanus and diphtheria booster dose Guidance
@guidance: Should not vaccinate client with second tetanus and diphtheria booster dose as client's age is less than 4 years. 
Check for any other vaccines due and inform the caregiver of when to come back for second tetanus and diphtheria booster dose.
@guidance: Should not vaccinate client with third tetanus and diphtheria booster dose as client's age is less than 9 years. 
Check for any vaccines due, and inform the caregiver of when to come back for third tetanus and diphtheria booster dose.
*/
define "Client is not due for tetanus and diphtheria booster dose Guidance":
  case
    when "Client is not due for tetanus and diphtheria booster dose Case 1" then 'Should not vaccinate client with second tetanus and diphtheria booster dose as client\'s age is less than 4 years. 
Check for any other vaccines due and inform the caregiver of when to come back for second tetanus and diphtheria booster dose.'
    when "Client is not due for tetanus and diphtheria booster dose Case 2" then 'Should not vaccinate client with third tetanus and diphtheria booster dose as client\'s age is less than 9 years. 
Check for any vaccines due, and inform the caregiver of when to come back for third tetanus and diphtheria booster dose.'
    else ''
  end

/*
@output: Client is due for tetanus and diphtheria booster dose Case 1
@pseudocode: "Immunization recommendation status" = "Due" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Client is due for tetanus and diphtheria booster dose Case 1":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."One tetanus and diphtheria booster dose was administered"
    and Encounter."Client's age is more than or equal to 4 years"

/*
@output: Client is due for tetanus and diphtheria booster dose Case 2
@pseudocode: "Immunization recommendation status" = "Due" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Client is due for tetanus and diphtheria booster dose Case 2":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."Two tetanus and diphtheria booster doses were administered"
    and Encounter."Client's age is more than or equal to 9 years"

/*
@output: Client is due for tetanus and diphtheria booster dose
@pseudocode: "Immunization recommendation status" = "Due" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Client is due for tetanus and diphtheria booster dose":
  "Client is due for tetanus and diphtheria booster dose Case 1"
    or "Client is due for tetanus and diphtheria booster dose Case 2"

/*
@output: Client is due for tetanus and diphtheria booster dose Guidance
@guidance: Should vaccinate client with second tetanus and diphtheria booster dose as client is within appropriate age range and the latest tetanus and diphtheria booster dose was administered more than 4 years ago. 
Check for contraindications.
@guidance: Should vaccinate client with third tetanus and diphtheria booster dose as client is within appropriate age range and the latest tetanus and diphtheria dose was administered more than 4 years ago. 
Check for contraindications.
*/
define "Client is due for tetanus and diphtheria booster dose Guidance":
  case
    when "Client is due for tetanus and diphtheria booster dose Case 1" then 'Should vaccinate client with second tetanus and diphtheria booster dose as client is within appropriate age range and the latest tetanus and diphtheria booster dose was administered more than 4 years ago. 
Check for contraindications.'
    when "Client is due for tetanus and diphtheria booster dose Case 2" then 'Should vaccinate client with third tetanus and diphtheria booster dose as client is within appropriate age range and the latest tetanus and diphtheria dose was administered more than 4 years ago. 
Check for contraindications.'
    else ''
  end

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
@output: Client is not due for pertussis booster dose
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pertussis booster dose":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."No pertussis booster doses were administered"
    and Encounter."Client's age is less than 1 year"

/*
@output: Client is not due for pertussis booster dose Guidance
@guidance: Should not vaccinate client with pertussis booster dose as client's age is less than 1 year. 
Check for any other vaccines due and inform the caregiver of when to come back for pertussis booster dose.
*/
define "Client is not due for pertussis booster dose Guidance":
  'Should not vaccinate client with pertussis booster dose as client\'s age is less than 1 year. 
Check for any other vaccines due and inform the caregiver of when to come back for pertussis booster dose.'

/*
@output: Primary DTP series is complete. Client is not due for pertussis booster dose
@pseudocode: "Immunization recommendation status" = "Not due" (where "Vaccine type" = "Pertussis-containing vaccines")
*/
define "Primary DTP series is complete. Client is not due for pertussis booster dose":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."No pertussis booster doses were administered"
    and Encounter."Client's age is between 1 year and 6 years"
    and Encounter."The latest DTP dose was administered less than 6 months ago"

/*
@output: Primary DTP series is complete. Client is not due for pertussis booster dose Guidance
@guidance: Should not vaccinate client with  pertussis booster dose as the latest DTP dose was administered less than 6 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for pertussis booster dose.
*/
define "Primary DTP series is complete. Client is not due for pertussis booster dose Guidance":
  'Should not vaccinate client with  pertussis booster dose as the latest DTP dose was administered less than 6 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for pertussis booster dose.'

/*
@output: Primary DTP series is complete. Client is due for pertussis booster dose
@pseudocode: "Immunization recommendation status" = "Due" (where "Vaccine type" = "Pertussis-containing vaccines")
*/
define "Primary DTP series is complete. Client is due for pertussis booster dose":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."No pertussis booster doses were administered"
    and Encounter."Client's age is between 1 year and 6 years"
    and Encounter."The latest DTP dose was administered more than 6 months ago"

/*
@output: Primary DTP series is complete. Client is due for pertussis booster dose Guidance
@guidance: Should vaccinate client with pertussis booster dose as no pertussis booster dose was administered, client is within the appropriate age range and the latest DTP dose was administered more than 6 months ago. 
Check for contraindications.
*/
define "Primary DTP series is complete. Client is due for pertussis booster dose Guidance":
  'Should vaccinate client with pertussis booster dose as no pertussis booster dose was administered, client is within the appropriate age range and the latest DTP dose was administered more than 6 months ago. 
Check for contraindications.'

/*
@output: Pertussis immunization schedule is complete Case 1
@pseudocode: "Immunization recommendation status" = "Complete" (where "Vaccine type" = "Pertussis-containing vaccines")
*/
define "Pertussis immunization schedule is complete Case 1":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."No pertussis booster doses were administered"
    and Encounter."Client's age is more than 6 years"

/*
@output: Pertussis immunization schedule is complete Case 2
@pseudocode: "Immunization recommendation status" = "Complete" (where "Vaccine type" = "Pertussis-containing vaccines")
*/
define "Pertussis immunization schedule is complete Case 2":
  Encounter."Three DTP primary series doses were administered"
    and Encounter."One pertussis booster dose was administered"

/*
@output: Pertussis immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete" (where "Vaccine type" = "Pertussis-containing vaccines")
*/
define "Pertussis immunization schedule is complete":
  "Pertussis immunization schedule is complete Case 1"
    or "Pertussis immunization schedule is complete Case 2"

/*
@output: Pertussis immunization schedule is complete Guidance
@guidance: Pertussis immunization schedule is complete. Three DTP primary series doses were administered.
Check for any other vaccines due.
@guidance: Pertussis immunization schedule is complete. Three DTP primary series doses and one pertussis booster dose were administered. 
Check for any other vaccines due.
*/
define "Pertussis immunization schedule is complete Guidance":
  case
    when "Pertussis immunization schedule is complete Case 1" then 'Pertussis immunization schedule is complete. Three DTP primary series doses were administered.
Check for any other vaccines due.'
    when "Pertussis immunization schedule is complete Case 2" then 'Pertussis immunization schedule is complete. Three DTP primary series doses and one pertussis booster dose were administered. 
Check for any other vaccines due.'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.Alt6w' then "Client is not due for DTP vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first DTP dose as client is less than 6 weeks old. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.'
    when Patient.id = '09.Abt6w1y' then "Client is due for DTP vaccination Case 1" and "Guidance" = 'Should vaccinate client with first DTP dose as no DTP doses were administered and and client\'s age is within appropriate age range. 
Check for contraindications.'
    when Patient.id = '10.DTP1Dlt4w' then "Client is not due for DTP vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second DTP dose as latest DTP dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for second dose.'
    when Patient.id = '11.DTP1Dgt4w' then "Client is due for DTP vaccination Case 2" and "Guidance" = 'Should vaccinate client with second DTP dose as the latest DTP dose was administered more than 4 weeks ago. 
Check for contraindications.'
    when Patient.id = '12.DTP2Dlt4w' then "Client is not due for DTP vaccination Case 3" and "Guidance" = 'Should not vaccinate client with third DTP dose as the latest DTP dose was administered  less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for next dose.'
    when Patient.id = '13.DTP2Dgt4w' then "Client is due for DTP vaccination Case 3" and "Guidance" = 'Should vaccinate client with third DTP dose as the latest DTP dose was administered more than 4 weeks ago. 
Check for contraindications.'
    when Patient.id = '14.DTP3Td0Alt12m' then "Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose" and "Client is not due for pertussis booster dose" and "Guidance" = 'Should not vaccinate client with first tetanus and diphtheria booster dose as client\'s age is less than 12 months. 
Check for any other vaccines due and inform the caregiver of when to come back for first tetanus and diphtheria booster dose.
Should not vaccinate client with pertussis booster dose as client\'s age is less than 1 year. 
Check for any other vaccines due and inform the caregiver of when to come back for pertussis booster dose.'
    when Patient.id = '15.DTP3Td0Agt12m' then "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose" and "Primary DTP series is complete. Client is due for pertussis booster dose" and "Guidance" = 'Should vaccinate client with first tetanus and diphtheria booster dose as client is at least 12 months old. Check for contraindications.
Should vaccinate client with pertussis booster dose as no pertussis booster dose was administered, client is within the appropriate age range and the latest DTP dose was administered more than 6 months ago. 
Check for contraindications.'
    when Patient.id = '16.DTP3Td1Alt4y' then "Client is not due for tetanus and diphtheria booster dose Case 1" and "Primary DTP series is complete. Client is due for pertussis booster dose" and "Guidance" = 'Should not vaccinate client with second tetanus and diphtheria booster dose as client\'s age is less than 4 years. 
Check for any other vaccines due and inform the caregiver of when to come back for second tetanus and diphtheria booster dose.
Should vaccinate client with pertussis booster dose as no pertussis booster dose was administered, client is within the appropriate age range and the latest DTP dose was administered more than 6 months ago. 
Check for contraindications.'
    when Patient.id = '17.DTP3Td1Agt4y' then "Client is due for tetanus and diphtheria booster dose Case 1" and "Primary DTP series is complete. Client is due for pertussis booster dose" and "Guidance" = 'Should vaccinate client with second tetanus and diphtheria booster dose as client is within appropriate age range and the latest tetanus and diphtheria booster dose was administered more than 4 years ago. 
Check for contraindications.
Should vaccinate client with pertussis booster dose as no pertussis booster dose was administered, client is within the appropriate age range and the latest DTP dose was administered more than 6 months ago. 
Check for contraindications.'
    when Patient.id = '18.DTP3Td2Alt9y' then "Client is not due for tetanus and diphtheria booster dose Case 2" and "Pertussis immunization schedule is complete Case 1" and "Guidance" = 'Should not vaccinate client with third tetanus and diphtheria booster dose as client\'s age is less than 9 years. 
Check for any vaccines due, and inform the caregiver of when to come back for third tetanus and diphtheria booster dose.
Pertussis immunization schedule is complete. Three DTP primary series doses were administered.
Check for any other vaccines due.'
    when Patient.id = '19.DTP3Td2Agt9y' then "Client is due for tetanus and diphtheria booster dose Case 2" and "Pertussis immunization schedule is complete Case 1" and "Guidance" = 'Should vaccinate client with third tetanus and diphtheria booster dose as client is within appropriate age range and the latest tetanus and diphtheria dose was administered more than 4 years ago. 
Check for contraindications.
Pertussis immunization schedule is complete. Three DTP primary series doses were administered.
Check for any other vaccines due.'
    when Patient.id = '20.DTP3Td3' then "Tetanus and diphtheria immunization schedule is complete" and "Pertussis immunization schedule is complete Case 1" and "Guidance" = 'Tetanus and diphtheria immunization schedule is complete. Three DTP primary series doses and three tetanus and diphtheria booster doses were administered.
Check for any other vaccines due.
Pertussis immunization schedule is complete. Three DTP primary series doses were administered.
Check for any other vaccines due.'
    when Patient.id = '21.DTP3P0Alt1y' then "Client is not due for pertussis booster dose" and "Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose" and "Guidance" = 'Should not vaccinate client with first tetanus and diphtheria booster dose as client\'s age is less than 12 months. 
Check for any other vaccines due and inform the caregiver of when to come back for first tetanus and diphtheria booster dose.
Should not vaccinate client with pertussis booster dose as client\'s age is less than 1 year. 
Check for any other vaccines due and inform the caregiver of when to come back for pertussis booster dose.'
    when Patient.id = '22.DTP3P0Abt1y6yDTPlt6m' then "Primary DTP series is complete. Client is not due for pertussis booster dose" and "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose" and "Guidance" = 'Should vaccinate client with first tetanus and diphtheria booster dose as client is at least 12 months old. Check for contraindications.
Should not vaccinate client with  pertussis booster dose as the latest DTP dose was administered less than 6 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for pertussis booster dose.'
    when Patient.id = '23.DTP3P0Abt1y6yDTPgt6m' then "Primary DTP series is complete. Client is due for pertussis booster dose" and "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose" and "Guidance" = 'Should vaccinate client with first tetanus and diphtheria booster dose as client is at least 12 months old. Check for contraindications.
Should vaccinate client with pertussis booster dose as no pertussis booster dose was administered, client is within the appropriate age range and the latest DTP dose was administered more than 6 months ago. 
Check for contraindications.'
    when Patient.id = '24.DTP3P0Agt6y' then "Pertussis immunization schedule is complete Case 1" and "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose" and "Guidance" = 'Should vaccinate client with first tetanus and diphtheria booster dose as client is at least 12 months old. Check for contraindications.
Pertussis immunization schedule is complete. Three DTP primary series doses were administered.
Check for any other vaccines due.'
    when Patient.id = '25.DTP3P1' then "Pertussis immunization schedule is complete Case 2" and "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose" and "Guidance" = 'Should vaccinate client with first tetanus and diphtheria booster dose as client is at least 12 months old. Check for contraindications.
Pertussis immunization schedule is complete. Three DTP primary series doses and one pertussis booster dose were administered. 
Check for any other vaccines due.'
    else 'No test case set'
  end
