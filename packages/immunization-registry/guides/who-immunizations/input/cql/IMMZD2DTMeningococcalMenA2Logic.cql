
/*
 * Library: IMMZD2DTMeningococcalMenA2Logic (IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses)
 * Rule: Determine if the client is due for a meningococcal vaccination according to the national immunization schedule
 * Decision Table: MenA conjugate vaccine, 2-dose schedule (specific context where there is a compelling reason to vaccinate infants aged under 9 months)
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any  
 */
library IMMZD2DTMeningococcalMenA2Logic

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
  Encounter."Client's age is less than 3 months"

/*
@output: Client is not due for meningococcal vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for meningococcal vaccination Case 2":
  Encounter."One meningococcal primary series dose was administered"
    and Encounter."The latest meningococcal dose was administered less than 8 weeks ago"

/*
@output: Client is not due for meningococcal vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for meningococcal vaccination":
  "Client is not due for meningococcal vaccination Case 1"
    or "Client is not due for meningococcal vaccination Case 2"

/*
@output: Client is not due for meningococcal vaccination Guidance
@guidance: Should not vaccinate client with first meningococcal dose as client's age is under 3 months.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.
@guidance: Should not vaccinate client with second meningococcal dose as the latest meningococcal dose was administered less than 8 weeks ago.
Check for any vaccines due and inform the caregiver of when to come back for the second dose.
*/
define "Client is not due for meningococcal vaccination Guidance":
  case
    when "Client is not due for meningococcal vaccination Case 1" then 'Should not vaccinate client with first meningococcal dose as client\'s age is under 3 months.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when "Client is not due for meningococcal vaccination Case 2" then 'Should not vaccinate client with second meningococcal dose as the latest meningococcal dose was administered less than 8 weeks ago.
Check for any vaccines due and inform the caregiver of when to come back for the second dose.'
    else ''
  end

/*
@output: Client is due for meningococcal vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for meningococcal vaccination Case 1":
  Encounter."No meningococcal primary series dose was administered"
    and Encounter."Client's age is more than or equal to 3 months"

/*
@output: Client is due for meningococcal vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for meningococcal vaccination Case 2":
  Encounter."One meningococcal primary series dose was administered"
    and Encounter."The latest meningococcal dose was administered more than 8 weeks ago"

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
@guidance: Should vaccinate client with second meningococcal dose as the latest meningococcal dose was administered more than 8 weeks ago.
Check for contraindications.
*/
define "Client is due for meningococcal vaccination Guidance":
  case
    when "Client is due for meningococcal vaccination Case 1" then 'Should vaccinate client with first meningococcal dose as no meningococcal doses were administered and client is within appropriate age range.
Check for contraindications.'
    when "Client is due for meningococcal vaccination Case 2" then 'Should vaccinate client with second meningococcal dose as the latest meningococcal dose was administered more than 8 weeks ago.
Check for contraindications.'
    else ''
  end

/*
@output: Meningococcal immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Meningococcal immunization schedule is complete":
  Encounter."Two meningococcal primary series doses were administered"

/*
@output: Meningococcal immunization schedule is complete Guidance
@guidance: Meningococcal immunization schedule is complete. Two meningococcal primary series doses were administered.
Check for any other vaccines due.
*/
define "Meningococcal immunization schedule is complete Guidance":
  'Meningococcal immunization schedule is complete. Two meningococcal primary series doses were administered.
Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '18.1' then "Client is not due for meningococcal vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first meningococcal dose as client\'s age is under 3 months.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '19.01' then "Client is due for meningococcal vaccination Case 1" and "Guidance" = 'Should vaccinate client with first meningococcal dose as no meningococcal doses were administered and client is within appropriate age range.
Check for contraindications.'
    when Patient.id = '20.02' then "Client is not due for meningococcal vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second meningococcal dose as the latest meningococcal dose was administered less than 8 weeks ago.
Check for any vaccines due and inform the caregiver of when to come back for the second dose.'
    when Patient.id = '21.02' then "Client is due for meningococcal vaccination Case 2" and "Guidance" = 'Should vaccinate client with second meningococcal dose as the latest meningococcal dose was administered more than 8 weeks ago.
Check for contraindications.'
    when Patient.id = '22.0' then "Meningococcal immunization schedule is complete" and "Guidance" = 'Meningococcal immunization schedule is complete. Two meningococcal primary series doses were administered.
Check for any other vaccines due.'
    else 'No test case set'
  end
