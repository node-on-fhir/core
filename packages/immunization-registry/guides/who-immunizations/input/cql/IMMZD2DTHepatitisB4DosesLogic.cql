/*
 * Library: IMMZD2DTHepatitisB4DosesLogic (IMMZ.D2.DT.Hepatitis B.4 doses)
 * Rule: Determine if the client is due for a hepatitis B vaccination according to the national immunization schedule
 * Decision Table: 4-dose schedule (birth dose + 3 primary series doses), on-time start
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any
 */
library IMMZD2DTHepatitisB4DosesLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTHepatitisBEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case 
    when "Client is not due for a hepatitis B vaccination" then "Client is not due for a hepatitis B vaccination Guidance"
    when "Client is due for a hepatitis B vaccination" then "Client is due for a hepatitis B vaccination Guidance"
    when "Hepatitis B immunization schedule is complete" then "Hepatitis B immunization schedule is complete Guidance" 
    else ''
  end
  
define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for a hepatitis B vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for a hepatitis B vaccination Case 1":
  Encounter."No hepatitis B primary series doses were administered"
    and Encounter."Client's age is less than {Member States defined lower limit}"

/*
@output: Client is not due for a hepatitis B vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for a hepatitis B vaccination Case 2":
  Encounter."One hepatitis B primary series doses were administered"
    and Encounter."The latest hepatitis B dose was administered less than 4 weeks ago"

/*
@output: Client is not due for a hepatitis B vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for a hepatitis B vaccination Case 3":
  Encounter."Two hepatitis B primary series doses were administered"
    and Encounter."The latest hepatitis B dose was administered less than 4 weeks ago"

/*
@output: Client is not due for a hepatitis B vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for a hepatitis B vaccination":
  "Client is not due for a hepatitis B vaccination Case 1"
    or "Client is not due for a hepatitis B vaccination Case 2"
    or "Client is not due for a hepatitis B vaccination Case 3"

/*
@output: Client is not due for a hepatitis B vaccination Guidance
@guidance = Should not vaccinate client with first hepatitis B dose as client's age is not within appropriate age range.
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.
@guidance = Should not vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered less than 4 weeks ago.
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.
@guidance = Should not vaccinate client with third hepatitis B dose as the latest Hepatitis B dose was administered less than 4 weeks ago.
Check for any other vaccines due, and inform the caregiver of when to come back for the third dose.
*/
define "Client is not due for a hepatitis B vaccination Guidance":
  case
    when "Client is not due for a hepatitis B vaccination Case 1" then 'Should not vaccinate client with first hepatitis B dose as client\'s age is not within appropriate age range.
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'
    when "Client is not due for a hepatitis B vaccination Case 2" then 'Should not vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered less than 4 weeks ago.
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    when "Client is not due for a hepatitis B vaccination Case 3" then 'Should not vaccinate client with third hepatitis B dose as the latest Hepatitis B dose was administered less than 4 weeks ago.
Check for any other vaccines due, and inform the caregiver of when to come back for the third dose.'
    else ''
  end

/*
@output: Client is due for a hepatitis B vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for a hepatitis B vaccination Case 1":
  Encounter."No hepatitis B primary series doses were administered"
    and Encounter."Client's age is more than or equal to {Member States defined lower limit}"

/*
@output: Client is due for a hepatitis B vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for a hepatitis B vaccination Case 2":
  Encounter."One hepatitis B primary series doses were administered"
    and Encounter."The latest hepatitis B dose was administered more than 4 weeks ago"

/*
@output: Client is due for a hepatitis B vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for a hepatitis B vaccination Case 3":
  Encounter."Two hepatitis B primary series doses were administered"
    and Encounter."The latest hepatitis B dose was administered more than 4 weeks ago"

/*
@output: Client is due for a hepatitis B vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for a hepatitis B vaccination":
  "Client is due for a hepatitis B vaccination Case 1"
    or "Client is due for a hepatitis B vaccination Case 2"
    or "Client is due for a hepatitis B vaccination Case 3"

/*
@output: Client is due for a hepatitis B vaccination Guidance
@guidance = Should vaccinate client with first hepatitis B dose as client's age is within appropriate age range.
Check for contraindications.
@guidance = Should vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered more than 4 weeks ago.
Check for contraindications.
@guidance = Should vaccinate client with third hepatitis B dose as the latest Hepatitis B dose was administered more than 4 weeks ago.
Check for contraindications.
*/
define "Client is due for a hepatitis B vaccination Guidance":
  case
    when "Client is due for a hepatitis B vaccination Case 1" then 'Should vaccinate client with first hepatitis B dose as client\'s age is within appropriate age range.
Check for contraindications.'
    when "Client is due for a hepatitis B vaccination Case 2" then 'Should vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered more than 4 weeks ago.
Check for contraindications.'
    when "Client is due for a hepatitis B vaccination Case 3" then 'Should vaccinate client with third hepatitis B dose as the latest Hepatitis B dose was administered more than 4 weeks ago.
Check for contraindications.'
    else ''
  end

/*
@output: Hepatitis B immunization schedule is complete
@pseudocode: '"Immunization recommendation status" = "Complete"
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Hepatitis B-containing vaccines")
*/
define "Hepatitis B immunization schedule is complete":
  Encounter."Three hepatitis B primary series doses were administered"

/*
@output: Hepatitis B immunization schedule is complete Guidance
@guidance: The hepatitis B immunization schedule is complete. Three hepatitis B primary series doses were administered.
Check for any other vaccines due.
*/
define "Hepatitis B immunization schedule is complete Guidance":
  'The hepatitis B immunization schedule is complete. Three hepatitis B primary series doses were administered.
Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = 'HepatitisB36.2' then "Client is not due for a hepatitis B vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first hepatitis B dose as client\'s age is not within appropriate age range.
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = 'HepatitisB37.2' then "Client is due for a hepatitis B vaccination Case 1" and "Guidance" = 'Should vaccinate client with first hepatitis B dose as client\'s age is within appropriate age range.
Check for contraindications.'
    when Patient.id = 'HepatitisB38.2' then "Client is not due for a hepatitis B vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered less than 4 weeks ago.
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    when Patient.id = 'HepatitisB39.2' then "Client is due for a hepatitis B vaccination Case 2" and "Guidance" = 'Should vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered more than 4 weeks ago.
Check for contraindications.'
    when Patient.id = 'HepatitisB40.2' then "Client is not due for a hepatitis B vaccination Case 3" and "Guidance" = 'Should not vaccinate client with third hepatitis B dose as the latest Hepatitis B dose was administered less than 4 weeks ago.
Check for any other vaccines due, and inform the caregiver of when to come back for the third dose.'
    when Patient.id = 'HepatitisB41.2' then "Client is due for a hepatitis B vaccination Case 3" and "Guidance" = 'Should vaccinate client with third hepatitis B dose as the latest Hepatitis B dose was administered more than 4 weeks ago.
Check for contraindications.'
    when Patient.id = 'HepatitisB42.1' then "Hepatitis B immunization schedule is complete" and "Guidance" = 'The hepatitis B immunization schedule is complete. Three hepatitis B primary series doses were administered.
Check for any other vaccines due.'
    else 'No test case set'
  end
