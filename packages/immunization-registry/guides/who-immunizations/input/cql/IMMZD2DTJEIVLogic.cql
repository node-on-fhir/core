
/*
 * Library: IMMZD2DTJEIVLogic (IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine)
 * Rule: Determine if the client is due for a Japanese encephalitis (JE) vaccination according to the national immunization schedule
 * Decision Table: Inactivated Vero cell-derived vaccination schedule (2-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
 * Trigger: IMMZ.D2  Determine required vaccination(s) if any
 */
library IMMZD2DTJEIVLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTJEEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for JE vaccination" then "Client is not due for JE vaccination Guidance"
    when "Client is due for JE vaccination" then "Client is due for JE vaccination Guidance"
    when "JE immunization schedule is complete" then "JE immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for JE vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for JE vaccination Case 1":
  Encounter."Client's age is less than 6 months"

/*
@output: Client is not due for JE vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for JE vaccination Case 2":
  Encounter."One JE primary series dose was administered"
    and Encounter."The latest JE dose was administered less than 4 weeks ago"

/*
@output: Client is not due for JE vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for JE vaccination":
  "Client is not due for JE vaccination Case 1"
    or "Client is not due for JE vaccination Case 2"

/*
@output: Client is not due for JE vaccination Guidance
@guidance: Should not vaccinate client with first JE dose as client's age is under 6 months. 
Check for any vaccines due and inform the caregiver of when to come back for the first JE dose.
@guidance: Should not vaccinate client with second JE dose as the latest JE dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver when to come back for the second JE dose.
*/
define "Client is not due for JE vaccination Guidance":
  case
    when "Client is not due for JE vaccination Case 1" then 'Should not vaccinate client with first JE dose as client\'s age is under 6 months. 
Check for any vaccines due and inform the caregiver of when to come back for the first JE dose.'
    when "Client is not due for JE vaccination Case 2" then 'Should not vaccinate client with second JE dose as the latest JE dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver when to come back for the second JE dose.'
    else ''
  end

/*
@output: Client is due for JE vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for JE vaccination Case 1":
  Encounter."No JE primary series doses were administered"
    and Encounter."Client's age is more than or equal to 6 months"

/*
@output: Client is due for JE vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for JE vaccination Case 2":
  Encounter."One JE primary series dose was administered"
    and Encounter."The latest JE dose was administered more than 4 weeks ago"

/*
@output: Client is due for JE vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for JE vaccination":
  "Client is due for JE vaccination Case 1"
    or "Client is due for JE vaccination Case 2"

/*
@output: Client is due for JE vaccination Guidance
@guidance: Should vaccinate client with first JE dose as no JE doses were administered and client is within the appropriate age range. 
Check for contraindications.
@guidance: Should vaccinate client with second JE dose as the latest JE dose was administered more than 4 weeks ago.
Check for contraindications.
*/
define "Client is due for JE vaccination Guidance":
  case
    when "Client is due for JE vaccination Case 1" then 'Should vaccinate client with first JE dose as no JE doses were administered and client is within the appropriate age range. 
Check for contraindications.'
    when "Client is due for JE vaccination Case 2" then 'Should vaccinate client with second JE dose as the latest JE dose was administered more than 4 weeks ago.
Check for contraindications.'
    else ''
  end

/*
@output: JE immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "JE immunization schedule is complete":
  Encounter."Two JE primary series doses were administered"

/*
@output: JE immunization schedule is complete Guidance
@guidance: JE immunization schedule is complete. Two JE primary series doses were administered. 
Check for any other vaccines due.
*/
define "JE immunization schedule is complete Guidance":
  'JE immunization schedule is complete. Two JE primary series doses were administered. 
Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.1' then "Client is not due for JE vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first JE dose as client\'s age is under 6 months. 
Check for any vaccines due and inform the caregiver of when to come back for the first JE dose.'
    when Patient.id = '09.01' then "Client is due for JE vaccination Case 1" and "Guidance" = 'Should vaccinate client with first JE dose as no JE doses were administered and client is within the appropriate age range. 
Check for contraindications.'
    when Patient.id = '10.02' then "Client is not due for JE vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second JE dose as the latest JE dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver when to come back for the second JE dose.'
    when Patient.id = '11.02' then "Client is due for JE vaccination Case 2" and "Guidance" = 'Should vaccinate client with second JE dose as the latest JE dose was administered more than 4 weeks ago.
Check for contraindications.'
    when Patient.id = '12.0' then "JE immunization schedule is complete" and "Guidance" = 'JE immunization schedule is complete. Two JE primary series doses were administered. 
Check for any other vaccines due.'
    else 'No test case set'
  end
