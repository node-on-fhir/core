
/*
 * Library: IMMZD2DTMeningococcalQuad2Logic (IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses)
 * Rule: Determine if the client is due for a meningococcal vaccination according to the national immunization schedule
 * Decision Table: Quadrivalent conjugate vaccines (A,C,W135,Y-D), 2-dose schedule
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any  
 */
library IMMZD2DTMeningococcalQuad2Logic

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
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for meningococcal vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for meningococcal vaccination Case 1":
  Encounter."Client's age is less than 9 months"

/*
@output: Client is not due for meningococcal vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for meningococcal vaccination Case 2":
  Encounter."One meningococcal primary series dose was administered"
    and Encounter."Client's age was less than or equal to 23 months when the primary series was started"
    and Encounter."The latest meningococcal dose was administered less than 3 months ago"

/*
@output: Client is not due for meningococcal vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for meningococcal vaccination":
  "Client is not due for meningococcal vaccination Case 1"
    or "Client is not due for meningococcal vaccination Case 2"

/*
@output: Client is not due for meningococcal vaccination Guidance
@guidance: Should not vaccinate client with first meningococcal dose as client's age is less than 9 months. 
Check for any vaccines due and inform the caregiver of when to come back for the first dose.
@guidance: Should not vaccinate client with second meningococcal dose as the latest meningococcal dose was administered less than 3 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.
*/
define "Client is not due for meningococcal vaccination Guidance":
  case
    when "Client is not due for meningococcal vaccination Case 1" then 'Should not vaccinate client with first meningococcal dose as client\'s age is less than 9 months. 
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when "Client is not due for meningococcal vaccination Case 2" then 'Should not vaccinate client with second meningococcal dose as the latest meningococcal dose was administered less than 3 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    else ''
  end

/*
@output: Client is due for meningococcal vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for meningococcal vaccination Case 1":
  Encounter."No meningococcal primary series dose was administered"
    and Encounter."Client's age is more than or equal to 9 months"

/*
@output: Client is due for meningococcal vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for meningococcal vaccination Case 2":
  Encounter."One meningococcal primary series dose was administered"
    and Encounter."Client's age was less than or equal to 23 months when the primary series was started"
    and Encounter."The latest meningococcal dose was administered more than 3 months ago"

/*
@output: Client is due for meningococcal vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for meningococcal vaccination":
  "Client is due for meningococcal vaccination Case 1"
    or "Client is due for meningococcal vaccination Case 2"

/*
@output: Client is due for meningococcal vaccination Guidance
@guidance: Should vaccinate client with first meningococcal dose as no meningococcal doses were administered and client is within appropriate age range.
Check for contraindications.
@guidance: Should vaccinate client with second meningococcal dose as client's age was less than 23 months when the primary series was started and the latest meningococcal dose was administered more than 3 months ago. 
Check for contraindications.
*/
define "Client is due for meningococcal vaccination Guidance":
  case
    when "Client is due for meningococcal vaccination Case 1" then 'Should vaccinate client with first meningococcal dose as no meningococcal doses were administered and client is within appropriate age range.
Check for contraindications.'
    when "Client is due for meningococcal vaccination Case 2" then 'Should vaccinate client with second meningococcal dose as client\'s age was less than 23 months when the primary series was started and the latest meningococcal dose was administered more than 3 months ago. 
Check for contraindications.'
    else ''
  end

/*
@output: Meningococcal immunization schedule is complete Case 1
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Meningococcal immunization schedule is complete Case 1":
  Encounter."One meningococcal primary series dose was administered"
    and Encounter."Client's age was more than 23 months when the primary series was started"

/*
@output: Meningococcal immunization schedule is complete Case 2
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Meningococcal immunization schedule is complete Case 2":
  Encounter."Two meningococcal primary series doses were administered"

/*
@output: Meningococcal immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Meningococcal immunization schedule is complete":
  "Meningococcal immunization schedule is complete Case 1"
    or "Meningococcal immunization schedule is complete Case 2"

/*
@output: Meningococcal immunization schedule is complete Guidance
@guidance: Meningococcal immunization schedule is complete as client's age was more than 23 months when primary series was started. One primary series dose was administered. 
Check for any other vaccines due.
@guidance: Meningococcal immunization schedule is complete. Two primary series doses were administered. 
Check for any other vaccines due.
*/
define "Meningococcal immunization schedule is complete Guidance":
  case
    when "Meningococcal immunization schedule is complete Case 1" then 'Meningococcal immunization schedule is complete as client\'s age was more than 23 months when primary series was started. One primary series dose was administered. 
Check for any other vaccines due.'
    when "Meningococcal immunization schedule is complete Case 2" then 'Meningococcal immunization schedule is complete. Two primary series doses were administered. 
Check for any other vaccines due.'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '55.1' then "Client is not due for meningococcal vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first meningococcal dose as client\'s age is less than 9 months. 
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '56.01' then "Client is due for meningococcal vaccination Case 1" and "Guidance" = 'Should vaccinate client with first meningococcal dose as no meningococcal doses were administered and client is within appropriate age range.
Check for contraindications.'
    when Patient.id = '57.023' then "Client is not due for meningococcal vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second meningococcal dose as the latest meningococcal dose was administered less than 3 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    when Patient.id = '58.023' then "Client is due for meningococcal vaccination Case 2" and "Guidance" = 'Should vaccinate client with second meningococcal dose as client\'s age was less than 23 months when the primary series was started and the latest meningococcal dose was administered more than 3 months ago. 
Check for contraindications.'
    when Patient.id = '59.02' then "Meningococcal immunization schedule is complete Case 1" and "Guidance" = 'Meningococcal immunization schedule is complete as client\'s age was more than 23 months when primary series was started. One primary series dose was administered. 
Check for any other vaccines due.'
    when Patient.id = '60.0' then "Meningococcal immunization schedule is complete Case 2" and "Guidance" = 'Meningococcal immunization schedule is complete. Two primary series doses were administered. 
Check for any other vaccines due.'
    else 'No test case set'
  end
