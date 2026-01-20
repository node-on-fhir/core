
/*
 * Library: IMMZD2DTDengueSeroposLogic (IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening)
 * Rule: Determine if the client is due for a dengue vaccination according to the national immunization schedule
 * Decision Table: CYD-TDV (Dengvaxia), 3-dose schedule with pre-vaccination screening, the recommended strategy where feasible (pre-vaccination screening whereby only those tested seropositive would be vaccinated)
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any  
 */
library IMMZD2DTDengueSeroposLogic

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
  Encounter."Client's dengue serostatus is negative"

/*
@output: Client is not due for dengue vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for dengue vaccination Case 4":
  Encounter."One dengue primary series dose was administered"
    and Encounter."Client's age is between 9 years and 45 years"
    and Encounter."Client's dengue serostatus is positive"
    and Encounter."The latest dengue dose was administered less than 6 months ago"

/*
@output: Client is not due for dengue vaccination Case 5
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for dengue vaccination Case 5":
  Encounter."Two dengue primary series doses were administered"
    and Encounter."Client's age is between 9 years and 45 years"
    and Encounter."Client's dengue serostatus is positive"
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
    or "Client is not due for dengue vaccination Case 5"

/*
@output: Client is not due for dengue vaccination Guidance
@guidance: Should not vaccinate client with first dengue dose as client's age is less than 9 years. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.
@guidance: Should not vaccinate client with first dengue dose as client's age is more than 45 years. 
Check for any vaccines due.
@guidance: Should not vaccinate client with first dengue dose as client does not have evidence of past dengue infection. 
Check for any other vaccines due.
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
    when "Client is not due for dengue vaccination Case 3" then 'Should not vaccinate client with first dengue dose as client does not have evidence of past dengue infection. 
Check for any other vaccines due.'
    when "Client is not due for dengue vaccination Case 4" then 'Should not vaccinate client with second dengue dose as latest dengue dose was administered less than 6 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    when "Client is not due for dengue vaccination Case 5" then 'Should not vaccinate client with third dengue dose as latest dengue vaccine was administered less than 6 months ago. 
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
    and Encounter."Client's dengue serostatus is positive"

/*
@output: Client is due for dengue vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for dengue vaccination Case 2":
  Encounter."One dengue primary series dose was administered"
    and Encounter."Client's age is between 9 years and 45 years"
    and Encounter."Client's dengue serostatus is positive"
    and Encounter."The latest dengue dose was administered more than 6 months ago"

/*
@output: Client is due for dengue vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for dengue vaccination Case 3":
  Encounter."Two dengue primary series doses were administered"
    and Encounter."Client's age is between 9 years and 45 years"
    and Encounter."Client's dengue serostatus is positive"
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
@guidance: Should vaccinate client with first dengue dose as no dengue doses were administered, client is within appropriate age range and has evidence of past dengue infection. 
Check for contraindications.
@guidance: Should vaccinate client with second dengue dose as the latest dengue dose was administered more than 6 months ago and client has evidence of past dengue infection. 
Check for contraindications.
@guidance: Should vaccinate client with third dengue dose as latest dengue dose was administered more than 6 months ago and client has evidence of past dengue infection. 
Check for contraindications.
*/
define "Client is due for dengue vaccination Guidance":
  case
    when "Client is due for dengue vaccination Case 1" then 'Should vaccinate client with first dengue dose as no dengue doses were administered, client is within appropriate age range and has evidence of past dengue infection. 
Check for contraindications.'
    when "Client is due for dengue vaccination Case 2" then 'Should vaccinate client with second dengue dose as the latest dengue dose was administered more than 6 months ago and client has evidence of past dengue infection. 
Check for contraindications.'
    when "Client is due for dengue vaccination Case 3" then 'Should vaccinate client with third dengue dose as latest dengue dose was administered more than 6 months ago and client has evidence of past dengue infection. 
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
    when Patient.id = '08.2' then "Client is not due for dengue vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first dengue dose as client\'s age is less than 9 years. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.'
    when Patient.id = '09.2' then "Client is not due for dengue vaccination Case 2" and "Guidance" = 'Should not vaccinate client with first dengue dose as client\'s age is more than 45 years. 
Check for any vaccines due.'
    when Patient.id = '10.3' then "Client is not due for dengue vaccination Case 3" and "Guidance" = 'Should not vaccinate client with first dengue dose as client does not have evidence of past dengue infection. 
Check for any other vaccines due.'
    when Patient.id = '11.123' then "Client is due for dengue vaccination Case 1" and "Guidance" = 'Should vaccinate client with first dengue dose as no dengue doses were administered, client is within appropriate age range and has evidence of past dengue infection. 
Check for contraindications.'
    when Patient.id = '12.1234' then "Client is not due for dengue vaccination Case 4" and "Guidance" = 'Should not vaccinate client with second dengue dose as latest dengue dose was administered less than 6 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    when Patient.id = '13.1234' then "Client is due for dengue vaccination Case 2" and "Guidance" = 'Should vaccinate client with second dengue dose as the latest dengue dose was administered more than 6 months ago and client has evidence of past dengue infection. 
Check for contraindications.'
    when Patient.id = '14.1234' then "Client is not due for dengue vaccination Case 5" and "Guidance" = 'Should not vaccinate client with third dengue dose as latest dengue vaccine was administered less than 6 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the third dose.'
    when Patient.id = '15.1234' then "Client is due for dengue vaccination Case 3" and "Guidance" = 'Should vaccinate client with third dengue dose as latest dengue dose was administered more than 6 months ago and client has evidence of past dengue infection. 
Check for contraindications.'
    when Patient.id = '16.12' then "Dengue immunization schedule is complete" and "Guidance" = 'Dengue immunization schedule is complete. Three dengue primary series doses were administered. 
Check for any other vaccines due.'
    else 'No test case set'
  end
