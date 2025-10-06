
/*
 * Library: IMMZD2DTHepatitisAIHAV2Logic (IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses)
 * Rule: Determine if the client is due for a hepatitis A vaccination according to the national immunization schedule
 * Decision Table: Inactivated hepatitis A virus (HAV), 2-dose schedule
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any  
 */
library IMMZD2DTHepatitisAIHAV2Logic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTHepatitisAEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for Hepatitis A vaccination" then "Client is not due for Hepatitis A vaccination Guidance"
    when "Client is due for Hepatitis A vaccination" then "Client is due for Hepatitis A vaccination Guidance"
    when "Hepatitis A immunization schedule is complete" then "Hepatitis A immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for Hepatitis A vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for Hepatitis A vaccination Case 1":
  Encounter."Client's age is less than 12 months"

/*
@output: Client is not due for Hepatitis A vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for Hepatitis A vaccination Case 2":
  Encounter."One hepatitis A primary series dose was administered"
    and Encounter."The latest Hepatitis A dose was administered less than 6 months ago"

/*
@output: Client is not due for Hepatitis A vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for Hepatitis A vaccination":
  "Client is not due for Hepatitis A vaccination Case 1"
    or "Client is not due for Hepatitis A vaccination Case 2"

/*
@output: Client is not due for Hepatitis A vaccination Guidance
@guidance: Should not vaccinate client with first hepatitis A dose as client's age is less than 12 months. 
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.
@guidance: Should not vaccinate client with second hepatitis A dose as the latest hepatitis A dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the second dose.
*/
define "Client is not due for Hepatitis A vaccination Guidance":
  case
    when "Client is not due for Hepatitis A vaccination Case 1" then 'Should not vaccinate client with first hepatitis A dose as client\'s age is less than 12 months. 
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'
    when "Client is not due for Hepatitis A vaccination Case 2" then 'Should not vaccinate client with second hepatitis A dose as the latest hepatitis A dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the second dose.'
    else ''
  end

/*
@output: Client is due for Hepatitis A vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for Hepatitis A vaccination Case 1":
  Encounter."No hepatitis A primary series doses were administered"
    and Encounter."Client's age is more than or equal to 12 months"

/*
@output: Client is due for Hepatitis A vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for Hepatitis A vaccination Case 2":
  Encounter."One hepatitis A primary series dose was administered"
    and Encounter."The latest Hepatitis A dose was administered more than 6 months ago"

/*
@output: Client is due for Hepatitis A vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for Hepatitis A vaccination":
  "Client is due for Hepatitis A vaccination Case 1"
    or "Client is due for Hepatitis A vaccination Case 2"

/*
@output: Client is due for Hepatitis A vaccination Guidance
@guidance: Should vaccinate client with first hepatitis A dose as no Hepatitis A doses were administered and client is within the appropriate age range. 
Check for contraindications. 
@guidance: Should vaccinate client with second hepatitis A dose as the latest hepatitis A dose was administered more than 6 months ago. 
Check for contraindications. 
*/
define "Client is due for Hepatitis A vaccination Guidance":
  case
    when "Client is due for Hepatitis A vaccination Case 1" then 'Should vaccinate client with first hepatitis A dose as no Hepatitis A doses were administered and client is within the appropriate age range. 
Check for contraindications. '
    when "Client is due for Hepatitis A vaccination Case 2" then 'Should vaccinate client with second hepatitis A dose as the latest hepatitis A dose was administered more than 6 months ago. 
Check for contraindications. '
    else ''
  end

/*
@output: Hepatitis A immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Hepatitis A immunization schedule is complete":
  Encounter."Two hepatitis A primary series doses were administered"

/*
@output: Hepatitis A immunization schedule is complete Guidance
@guidance: Hepatitis A immunization schedule is complete. Two hepatitis A primary series doses were administered. 
Check for any other vaccines due.
*/
define "Hepatitis A immunization schedule is complete Guidance":
  'Hepatitis A immunization schedule is complete. Two hepatitis A primary series doses were administered. 
Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.1' then "Client is not due for Hepatitis A vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first hepatitis A dose as client\'s age is less than 12 months. 
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '09.01' then "Client is due for Hepatitis A vaccination Case 1" and "Guidance" = 'Should vaccinate client with first hepatitis A dose as no Hepatitis A doses were administered and client is within the appropriate age range. 
Check for contraindications. '
    when Patient.id = '10.02' then "Client is not due for Hepatitis A vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second hepatitis A dose as the latest hepatitis A dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the second dose.'
    when Patient.id = '11.02' then "Client is due for Hepatitis A vaccination Case 2" and "Guidance" = 'Should vaccinate client with second hepatitis A dose as the latest hepatitis A dose was administered more than 6 months ago. 
Check for contraindications. '
    when Patient.id = '12.0' then "Hepatitis A immunization schedule is complete" and "Guidance" = 'Hepatitis A immunization schedule is complete. Two hepatitis A primary series doses were administered. 
Check for any other vaccines due.'
    else 'No test case set'
  end
