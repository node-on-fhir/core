
/*
 * Library: IMMZD2DTMalaria4DoseLogic (IMMZ.D2.DT.Malaria)
 * Rule: Determine if the client is due for a malaria vaccination according to the national immunization schedule
 * Decision Table: 4-dose schedule (The RTS,S/AS01 malaria vaccine should be used for the prevention of Plasmodium falciparum malaria in children living in regions with moderate to high malaria transmission, as defined by WHO)									
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any  
 */
library IMMZD2DTMalaria4DoseLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTMalariaEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for malaria vaccination" then "Client is not due for malaria vaccination Guidance"
    when "Client is due for malaria vaccination" then "Client is due for malaria vaccination Guidance"
    when "Malaria immunization schedule is complete" then "Malaria immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for malaria vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for malaria vaccination Case 1":
  Encounter."Client's age is less than 5 months"

/*
@output: Client is not due for malaria vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for malaria vaccination Case 2":
  Encounter."One malaria primary series dose was administered"
    and Encounter."The latest malaria dose was administered less than 4 weeks ago"

/*
@output: Client is not due for malaria vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for malaria vaccination Case 3":
  Encounter."Two malaria primary series doses were administered"
    and Encounter."The latest malaria dose was administered less than 4 weeks ago"

/*
@output: Client is not due for malaria vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for malaria vaccination Case 4":
  Encounter."Three malaria primary series doses were administered"
    and Encounter."The latest malaria dose was administered less than 4 weeks ago"

/*
@output: Client is not due for malaria vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for malaria vaccination":
  "Client is not due for malaria vaccination Case 1"
    or "Client is not due for malaria vaccination Case 2"
    or "Client is not due for malaria vaccination Case 3"
    or "Client is not due for malaria vaccination Case 4"

/*
@output: Client is not due for malaria vaccination Guidance
@guidance: Should not vaccinate client with first malaria dose as client's age is less than 5 months. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.
@guidance: Should not vaccinate client with second malaria dose as the latest malaria dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.
@guidance: Should not vaccinate client with third malaria dose as the latest malaria dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the third dose.
@guidance: Should not vaccinate client with fourth malaria dose as the latest malaria dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the fourth dose.
*/
define "Client is not due for malaria vaccination Guidance":
  case
    when "Client is not due for malaria vaccination Case 1" then 'Should not vaccinate client with first malaria dose as client\'s age is less than 5 months. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.'
    when "Client is not due for malaria vaccination Case 2" then 'Should not vaccinate client with second malaria dose as the latest malaria dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    when "Client is not due for malaria vaccination Case 3" then 'Should not vaccinate client with third malaria dose as the latest malaria dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the third dose.'
    when "Client is not due for malaria vaccination Case 4" then 'Should not vaccinate client with fourth malaria dose as the latest malaria dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the fourth dose.'
    else ''
  end

/*
@output: Client is due for malaria vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for malaria vaccination Case 1":
  Encounter."No malaria primary series doses were administered"
    and Encounter."Client's age is more than or equal to 5 months"

/*
@output: Client is due for malaria vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for malaria vaccination Case 2":
  Encounter."One malaria primary series dose was administered"
    and Encounter."The latest malaria dose was administered more than 4 weeks ago"

/*
@output: Client is due for malaria vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for malaria vaccination Case 3":
  Encounter."Two malaria primary series doses were administered"
    and Encounter."The latest malaria dose was administered more than 4 weeks ago"

/*
@output: Client is due for malaria vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for malaria vaccination Case 4":
  Encounter."Three malaria primary series doses were administered"
    and Encounter."The latest malaria dose was administered more than 4 weeks ago"

/*
@output: Client is due for malaria vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for malaria vaccination":
  "Client is due for malaria vaccination Case 1"
    or "Client is due for malaria vaccination Case 2"
    or "Client is due for malaria vaccination Case 3"
    or "Client is due for malaria vaccination Case 4"

/*
@output: Client is due for malaria vaccination Guidance
@guidance: Should vaccinate client with first malaria dose as no malaria doses were administered and client is within appropriate age range. 
Check for contraindications.
@guidance: Should vaccinate client with second malaria dose as the latest malaria dose was administered more than 4 weeks ago. 
Check for contraindications. 
@guidance: Should vaccinate client with third malaria dose as the latest malaria dose was administered more than 4 weeks ago. 
Check for contraindications. 
@guidance: Should vaccinate client with fourth malaria dose as the latest malaria dose was administered more than 4 weeks ago. 
Check for contraindications. 
*/
define "Client is due for malaria vaccination Guidance":
  case
    when "Client is due for malaria vaccination Case 1" then 'Should vaccinate client with first malaria dose as no malaria doses were administered and client is within appropriate age range. 
Check for contraindications.'
    when "Client is due for malaria vaccination Case 2" then 'Should vaccinate client with second malaria dose as the latest malaria dose was administered more than 4 weeks ago. 
Check for contraindications. '
    when "Client is due for malaria vaccination Case 3" then 'Should vaccinate client with third malaria dose as the latest malaria dose was administered more than 4 weeks ago. 
Check for contraindications. '
    when "Client is due for malaria vaccination Case 4" then 'Should vaccinate client with fourth malaria dose as the latest malaria dose was administered more than 4 weeks ago. 
Check for contraindications. '
    else ''
  end

/*
@output: Malaria immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Malaria immunization schedule is complete":
  Encounter."Four malaria primary series doses were administered"

/*
@output: Malaria immunization schedule is complete Guidance
@guidance: Malaria immunization schedule is complete. Four malaria primary series doses were administered. 
Check for any other vaccines due.
*/
define "Malaria immunization schedule is complete Guidance":
  'Malaria immunization schedule is complete. Four malaria primary series doses were administered. 
Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.1' then "Client is not due for malaria vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first malaria dose as client\'s age is less than 5 months. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.'
    when Patient.id = '09.01' then "Client is due for malaria vaccination Case 1" and "Guidance" = 'Should vaccinate client with first malaria dose as no malaria doses were administered and client is within appropriate age range. 
Check for contraindications.'
    when Patient.id = '10.02' then "Client is not due for malaria vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second malaria dose as the latest malaria dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    when Patient.id = '11.02' then "Client is due for malaria vaccination Case 2" and "Guidance" = 'Should vaccinate client with second malaria dose as the latest malaria dose was administered more than 4 weeks ago. 
Check for contraindications. '
    when Patient.id = '12.02' then "Client is not due for malaria vaccination Case 3" and "Guidance" = 'Should not vaccinate client with third malaria dose as the latest malaria dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the third dose.'
    when Patient.id = '13.02' then "Client is due for malaria vaccination Case 3" and "Guidance" = 'Should vaccinate client with third malaria dose as the latest malaria dose was administered more than 4 weeks ago. 
Check for contraindications. '
    when Patient.id = '14.02' then "Client is not due for malaria vaccination Case 4" and "Guidance" = 'Should not vaccinate client with fourth malaria dose as the latest malaria dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the fourth dose.'
    when Patient.id = '15.02' then "Client is due for malaria vaccination Case 4" and "Guidance" = 'Should vaccinate client with fourth malaria dose as the latest malaria dose was administered more than 4 weeks ago. 
Check for contraindications. '
    when Patient.id = '16.0' then "Malaria immunization schedule is complete" and "Guidance" = 'Malaria immunization schedule is complete. Four malaria primary series doses were administered. 
Check for any other vaccines due.'
    else 'No test case set'
  end
