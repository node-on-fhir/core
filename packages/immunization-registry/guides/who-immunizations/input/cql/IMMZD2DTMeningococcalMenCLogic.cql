
/*
 * Library: IMMZD2DTMeningococcalMenCLogic (IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine)
 * Rule: Determine if the client is due for a meningococcal vaccination according to the national immunization schedule
 * Decision Table: Monovalent MenC conjugate vaccine schedule
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any  
 */
library IMMZD2DTMeningococcalMenCLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTMeningococcalEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for meningococcal vaccination" then "Client is not due for meningococcal vaccination Guidance"
    when "Client is due for meningococcal vaccination" then "Client is due for meningococcal vaccination Guidance"
    when "Meningococcal immunization schedule is complete" then "Meningococcal immunization schedule is complete Guidance"
    when "The primary series is complete. Client is due for meningococcal booster dose" then "The primary series is complete. Client is due for meningococcal booster dose Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for meningococcal vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for meningococcal vaccination Case 1":
  Encounter."Client's age is less than 2 months"

/*
@output: Client is not due for meningococcal vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for meningococcal vaccination Case 2":
  Encounter."One meningococcal primary series dose was administered"
    and Encounter."Client's age was less than or equal to 11 months when the primary series was started"
    and Encounter."The latest meningococcal dose was administered less than 2 months ago"

/*
@output: Client is not due for meningococcal vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for meningococcal vaccination Case 3":
  Encounter."Two meningococcal primary series doses were administered"
    and Encounter."The latest meningococcal dose was administered less than 1 year ago"
    and Encounter."No meningococcal booster dose was administered"

/*
@output: Client is not due for meningococcal vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for meningococcal vaccination":
  "Client is not due for meningococcal vaccination Case 1"
    or "Client is not due for meningococcal vaccination Case 2"
    or "Client is not due for meningococcal vaccination Case 3"

/*
@output: Client is not due for meningococcal vaccination Guidance
@guidance: Should not vaccinate client with first meningococcal dose as client's age is under 2 months. Check for any vaccines due and inform the caregiver of when to come back for the first dose.
@guidance: Should not vaccinate client with second meningococcal dose as the latest meningococcal dose was administered less than 2 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the second dose.
@guidance: Should not vaccinate client with meningococcal booster dose as the latest meningococcal dose was administered less than 1 year ago. 
Check for any vaccines due and inform the caregiver of when to come back for the booster dose.
*/
define "Client is not due for meningococcal vaccination Guidance":
  case
    when "Client is not due for meningococcal vaccination Case 1" then 'Should not vaccinate client with first meningococcal dose as client\'s age is under 2 months. Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when "Client is not due for meningococcal vaccination Case 2" then 'Should not vaccinate client with second meningococcal dose as the latest meningococcal dose was administered less than 2 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the second dose.'
    when "Client is not due for meningococcal vaccination Case 3" then 'Should not vaccinate client with meningococcal booster dose as the latest meningococcal dose was administered less than 1 year ago. 
Check for any vaccines due and inform the caregiver of when to come back for the booster dose.'
    else ''
  end

/*
@output: Client is due for meningococcal vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for meningococcal vaccination Case 1":
  Encounter."No meningococcal primary series dose was administered"
    and Encounter."Client's age is more than or equal to 2 months"

/*
@output: Client is due for meningococcal vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for meningococcal vaccination Case 2":
  Encounter."One meningococcal primary series dose was administered"
    and Encounter."Client's age was less than or equal to 11 months when the primary series was started"
    and Encounter."The latest meningococcal dose was administered more than 2 months ago"

/*
@output: Client is due for meningococcal vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for meningococcal vaccination":
  "Client is due for meningococcal vaccination Case 1"
    or "Client is due for meningococcal vaccination Case 2"

/*
@output: Client is due for meningococcal vaccination Guidance
@guidance: Should vaccinate client with first meningococcal dose as no meningococcal dose was administered and client is within appropriate age range.
Check for contraindications.
@guidance: Should vaccinate client with second meningococcal dose as client was less than 11 months when primary series was started and latest meningococcal dose was administered more than 2 months ago. 
Check for contraindications.
*/
define "Client is due for meningococcal vaccination Guidance":
  case
    when "Client is due for meningococcal vaccination Case 1" then 'Should vaccinate client with first meningococcal dose as no meningococcal dose was administered and client is within appropriate age range.
Check for contraindications.'
    when "Client is due for meningococcal vaccination Case 2" then 'Should vaccinate client with second meningococcal dose as client was less than 11 months when primary series was started and latest meningococcal dose was administered more than 2 months ago. 
Check for contraindications.'
    else ''
  end

/*
@output: Meningococcal immunization schedule is complete Case 1
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Meningococcal immunization schedule is complete Case 1":
  Encounter."One meningococcal primary series dose was administered"
    and Encounter."Client's age was more than 11 months when the primary series was started"

/*
@output: Meningococcal immunization schedule is complete Case 2
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Meningococcal immunization schedule is complete Case 2":
  Encounter."Two meningococcal primary series doses were administered"
    and Encounter."Meningococcal booster dose was administered"

/*
@output: Meningococcal immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Meningococcal immunization schedule is complete":
  "Meningococcal immunization schedule is complete Case 1"
    or "Meningococcal immunization schedule is complete Case 2"

/*
@output: Meningococcal immunization schedule is complete Guidance
@guidance: Meningococcal immunization schedule is complete as client's age was more than 11 months when primary series was started. One primary series dose was administered. Check for any other vaccines due.
@guidance: Meningococcal immunization schedule is complete. Two primary series doses and one booster dose were administered. 
Check for any vaccines due.
*/
define "Meningococcal immunization schedule is complete Guidance":
  case
    when "Meningococcal immunization schedule is complete Case 1" then 'Meningococcal immunization schedule is complete as client\'s age was more than 11 months when primary series was started. One primary series dose was administered. Check for any other vaccines due.'
    when "Meningococcal immunization schedule is complete Case 2" then 'Meningococcal immunization schedule is complete. Two primary series doses and one booster dose were administered. 
Check for any vaccines due.'
    else ''
  end

/*
@output: The primary series is complete. Client is due for meningococcal booster dose
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "The primary series is complete. Client is due for meningococcal booster dose":
  Encounter."Two meningococcal primary series doses were administered"
    and Encounter."The latest meningococcal dose was administered more than 1 year ago"
    and Encounter."No meningococcal booster dose was administered"

/*
@output: The primary series is complete. Client is due for meningococcal booster dose Guidance
@guidance: Should vaccinate client with Meningococcal booster dose as no meningococcal booster dose was administered and the latest meningococcal dose was administered more than 1 year ago. 
Check for contraindications.
*/
define "The primary series is complete. Client is due for meningococcal booster dose Guidance":
  'Should vaccinate client with Meningococcal booster dose as no meningococcal booster dose was administered and the latest meningococcal dose was administered more than 1 year ago. 
Check for contraindications.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '30.1' then "Client is not due for meningococcal vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first meningococcal dose as client\'s age is under 2 months. Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '31.01' then "Client is due for meningococcal vaccination Case 1" and "Guidance" = 'Should vaccinate client with first meningococcal dose as no meningococcal dose was administered and client is within appropriate age range.
Check for contraindications.'
    when Patient.id = '32.023' then "Client is not due for meningococcal vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second meningococcal dose as the latest meningococcal dose was administered less than 2 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the second dose.'
    when Patient.id = '33.023' then "Client is due for meningococcal vaccination Case 2" and "Guidance" = 'Should vaccinate client with second meningococcal dose as client was less than 11 months when primary series was started and latest meningococcal dose was administered more than 2 months ago. 
Check for contraindications.'
    when Patient.id = '34.02' then "Meningococcal immunization schedule is complete Case 1" and "Guidance" = 'Meningococcal immunization schedule is complete as client\'s age was more than 11 months when primary series was started. One primary series dose was administered. Check for any other vaccines due.'
    when Patient.id = '35.034' then "Client is not due for meningococcal vaccination Case 3" and "Guidance" = 'Should not vaccinate client with meningococcal booster dose as the latest meningococcal dose was administered less than 1 year ago. 
Check for any vaccines due and inform the caregiver of when to come back for the booster dose.'
    when Patient.id = '36.034' then "The primary series is complete. Client is due for meningococcal booster dose" and "Guidance" = 'Should vaccinate client with Meningococcal booster dose as no meningococcal booster dose was administered and the latest meningococcal dose was administered more than 1 year ago. 
Check for contraindications.'
    when Patient.id = '37.04' then "Meningococcal immunization schedule is complete Case 2" and "Guidance" = 'Meningococcal immunization schedule is complete. Two primary series doses and one booster dose were administered. 
Check for any vaccines due.'
    else 'No test case set'
  end
