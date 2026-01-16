
/*
 * Library: IMMZD2DTDengueNoScreenLogic (IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening)
 * Rule: Determine if the client is due for a dengue vaccination according to the national immunization schedule
 * Decision Table: CYD-TDV (Dengvaxia), 3-dose schedule without pre-vaccination screening [when pre-vaccination screening is not feasible and in areas with recent documentation of seroprevalence rates of at least 80% by age 9 years]
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any  
 */
library IMMZD2DTDengueNoScreenLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTDengueEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for dengue vaccination" then "Client is not due for dengue vaccination Guidance"
    when "Client is due for dengue vaccination" then "Client is due for dengue vaccination Guidance"
    when "Dengue immunization schedule is complete" then "Dengue immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for dengue vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for dengue vaccination Case 1":
  Encounter."Client's age is less than 9 years"

/*
@output: Client is not due for dengue vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for dengue vaccination Case 2":
  Encounter."Client's age is more than 45 years"

/*
@output: Client is not due for dengue vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for dengue vaccination Case 3":
  Encounter."One dengue primary series dose was administered"
    and Encounter."Client's age is between 9 years and 45 years"
    and Encounter."The latest dengue dose was administered less than 6 months ago"

/*
@output: Client is not due for dengue vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for dengue vaccination Case 4":
  Encounter."Two dengue primary series doses were administered"
    and Encounter."Client's age is between 9 years and 45 years"
    and Encounter."The latest dengue dose was administered less than 6 months ago"

/*
@output: Client is not due for dengue vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for dengue vaccination":
  "Client is not due for dengue vaccination Case 1"
    or "Client is not due for dengue vaccination Case 2"
    or "Client is not due for dengue vaccination Case 3"
    or "Client is not due for dengue vaccination Case 4"

/*
@output: Client is not due for dengue vaccination Guidance
@guidance: Should not vaccinate client with first dengue dose as client's age is less than 9 years. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.
@guidance: Should not vaccinate client with first dengue dose as client's age is more than 45 years. 
Check for any vaccines due.
@guidance: Should not vaccinate client with second dengue dose as latest dengue dose was administered less than 6 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.
@guidance: Should not vaccinate client with third dengue dose as latest dengue vaccine was administered less than 6 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the third dose.
*/
define "Client is not due for dengue vaccination Guidance":
  case
    when "Client is not due for dengue vaccination Case 1" then 'Should not vaccinate client with first dengue dose as client\'s age is less than 9 years. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.'
    when "Client is not due for dengue vaccination Case 2" then 'Should not vaccinate client with first dengue dose as client\'s age is more than 45 years. 
Check for any vaccines due.'
    when "Client is not due for dengue vaccination Case 3" then 'Should not vaccinate client with second dengue dose as latest dengue dose was administered less than 6 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    when "Client is not due for dengue vaccination Case 4" then 'Should not vaccinate client with third dengue dose as latest dengue vaccine was administered less than 6 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the third dose.'
    else ''
  end

/*
@output: Client is due for dengue vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for dengue vaccination Case 1":
  Encounter."No dengue primary series doses were administered"
    and Encounter."Client's age is between 9 years and 45 years"

/*
@output: Client is due for dengue vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for dengue vaccination Case 2":
  Encounter."One dengue primary series dose was administered"
    and Encounter."Client's age is between 9 years and 45 years"
    and Encounter."The latest dengue dose was administered more than 6 months ago"

/*
@output: Client is due for dengue vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for dengue vaccination Case 3":
  Encounter."Two dengue primary series doses were administered"
    and Encounter."Client's age is between 9 years and 45 years"
    and Encounter."The latest dengue dose was administered more than 6 months ago"

/*
@output: Client is due for dengue vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for dengue vaccination":
  "Client is due for dengue vaccination Case 1"
    or "Client is due for dengue vaccination Case 2"
    or "Client is due for dengue vaccination Case 3"

/*
@output: Client is due for dengue vaccination Guidance
@guidance: Should vaccinate client with first dengue dose as no dengue doses were administered and client is within appropriate age range. 
Check for contraindications.
@guidance: Should vaccinate client with second dengue dose as latest dengue dose was administered more than 6 months ago. 
Check for contraindications.
@guidance: Should vaccinate client with third dengue dose as latest dengue dose was administered more than 6 months ago. 
Check for contraindications.
*/
define "Client is due for dengue vaccination Guidance":
  case
    when "Client is due for dengue vaccination Case 1" then 'Should vaccinate client with first dengue dose as no dengue doses were administered and client is within appropriate age range. 
Check for contraindications.'
    when "Client is due for dengue vaccination Case 2" then 'Should vaccinate client with second dengue dose as latest dengue dose was administered more than 6 months ago. 
Check for contraindications.'
    when "Client is due for dengue vaccination Case 3" then 'Should vaccinate client with third dengue dose as latest dengue dose was administered more than 6 months ago. 
Check for contraindications.'
    else ''
  end

/*
@output: Dengue immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Dengue immunization schedule is complete":
  Encounter."Three dengue primary series doses were administered"
    and Encounter."Client's age is between 9 years and 45 years"

/*
@output: Dengue immunization schedule is complete Guidance
@guidance: Dengue immunization schedule is complete. Three dengue primary series doses were administered. 
Check for any other vaccines due.
*/
define "Dengue immunization schedule is complete Guidance":
  'Dengue immunization schedule is complete. Three dengue primary series doses were administered. 
Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '24.2' then "Client is not due for dengue vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first dengue dose as client\'s age is less than 9 years. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.'
    when Patient.id = '25.2' then "Client is not due for dengue vaccination Case 2" and "Guidance" = 'Should not vaccinate client with first dengue dose as client\'s age is more than 45 years. 
Check for any vaccines due.'
    when Patient.id = '26.12' then "Client is due for dengue vaccination Case 1" and "Guidance" = 'Should vaccinate client with first dengue dose as no dengue doses were administered and client is within appropriate age range. 
Check for contraindications.'
    when Patient.id = '27.123' then "Client is not due for dengue vaccination Case 3" and "Guidance" = 'Should not vaccinate client with second dengue dose as latest dengue dose was administered less than 6 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    when Patient.id = '28.123' then "Client is due for dengue vaccination Case 2" and "Guidance" = 'Should vaccinate client with second dengue dose as latest dengue dose was administered more than 6 months ago. 
Check for contraindications.'
    when Patient.id = '29.123' then "Client is not due for dengue vaccination Case 4" and "Guidance" = 'Should not vaccinate client with third dengue dose as latest dengue vaccine was administered less than 6 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the third dose.'
    when Patient.id = '30.123' then "Client is due for dengue vaccination Case 3" and "Guidance" = 'Should vaccinate client with third dengue dose as latest dengue dose was administered more than 6 months ago. 
Check for contraindications.'
    when Patient.id = '31.12' then "Dengue immunization schedule is complete" and "Guidance" = 'Dengue immunization schedule is complete. Three dengue primary series doses were administered. 
Check for any other vaccines due.'
    else 'No test case set'
  end
