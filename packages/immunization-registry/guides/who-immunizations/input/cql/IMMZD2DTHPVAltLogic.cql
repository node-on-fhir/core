
/*
 * Library: IMMZD2DTHPVAltLogic (IMMZ.D2.DT.HPV.Single dose)
 * Rule: Determine if the client is due for a human papillomavirus (HPV) vaccination according to the national immunization schedule
 * Decision Table: Alternative single-dose schedule
 * Trigger: IMMZ.D2  Determine required vaccination(s) if any
 */
library IMMZD2DTHPVAltLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTHPVEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for HPV vaccination" then "Client is not due for HPV vaccination Guidance"
    when "Client is due for HPV vaccination" then "Client is due for HPV vaccination Guidance"
    when "Clinical judgement is required. Create a clinical note." then "Clinical judgement is required. Create a clinical note. Guidance"
    when "HPV immunization schedule is complete" then "HPV immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for HPV vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for HPV vaccination Case 1":
  Encounter."Client's age is less than 9 years"

/*
@output: Client is not due for HPV vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for HPV vaccination Case 2":
  Encounter."One HPV primary series dose was administered"
    and Encounter."The latest HPV dose was administered less than 6 months ago"
    and Encounter."Client's HIV status is positive"

/*
@output: Client is not due for HPV vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for HPV vaccination Case 3":
  Encounter."One HPV primary series dose was administered"
    and Encounter."The latest HPV dose was administered less than 6 months ago"
    and Encounter."Client is immunocompromised"

/*
@output: Client is not due for HPV vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for HPV vaccination Case 4":
  Encounter."Two HPV primary series doses were administered"
    and Encounter."The latest HPV dose was administered less than 6 months ago"
    and Encounter."Client's HIV status is positive"

/*
@output: Client is not due for HPV vaccination Case 5
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for HPV vaccination Case 5":
  Encounter."Two HPV primary series doses were administered"
    and Encounter."The latest HPV dose was administered less than 6 months ago"
    and Encounter."Client is immunocompromised"

/*
@output: Client is not due for HPV vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for HPV vaccination":
  "Client is not due for HPV vaccination Case 1"
    or "Client is not due for HPV vaccination Case 2"
    or "Client is not due for HPV vaccination Case 3"
    or "Client is not due for HPV vaccination Case 4"
    or "Client is not due for HPV vaccination Case 5"

/*
@output: Client is not due for HPV vaccination Guidance
@guidance: Should not vaccinate client with first HPV dose as client's age is less than 9 years. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with second HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with second HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with third HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with third HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.
*/
define "Client is not due for HPV vaccination Guidance":
  case
    when "Client is not due for HPV vaccination Case 1" then 'Should not vaccinate client with first HPV dose as client\'s age is less than 9 years. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for HPV vaccination Case 2" then 'Should not vaccinate client with second HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for HPV vaccination Case 3" then 'Should not vaccinate client with second HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for HPV vaccination Case 4" then 'Should not vaccinate client with third HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for HPV vaccination Case 5" then 'Should not vaccinate client with third HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    else ''
  end

/*
@output: Client is due for HPV vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for HPV vaccination Case 1":
  Encounter."No HPV primary series doses were administered"
    and Encounter."Client's age is between 9 and 20 years"

/*
@output: Client is due for HPV vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for HPV vaccination Case 2":
  Encounter."One HPV primary series dose was administered"
    and Encounter."The latest HPV dose was administered more than 6 months ago"
    and Encounter."Client's HIV status is positive"

/*
@output: Client is due for HPV vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for HPV vaccination Case 3":
  Encounter."One HPV primary series dose was administered"
    and Encounter."The latest HPV dose was administered more than 6 months ago"
    and Encounter."Client is immunocompromised"

/*
@output: Client is due for HPV vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for HPV vaccination Case 4":
  Encounter."Two HPV primary series doses were administered"
    and Encounter."The latest HPV dose was administered more than 6 months ago"
    and Encounter."Client's HIV status is positive"

/*
@output: Client is due for HPV vaccination Case 5
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for HPV vaccination Case 5":
  Encounter."Two HPV primary series doses were administered"
    and Encounter."The latest HPV dose was administered more than 6 months ago"
    and Encounter."Client is immunocompromised"

/*
@output: Client is due for HPV vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for HPV vaccination":
  "Client is due for HPV vaccination Case 1"
    or "Client is due for HPV vaccination Case 2"
    or "Client is due for HPV vaccination Case 3"
    or "Client is due for HPV vaccination Case 4"
    or "Client is due for HPV vaccination Case 5"

/*
@output: Client is due for HPV vaccination Guidance
@guidance: Should vaccinate client with first HPV dose as no HPV doses were administered and client is within appropriate age range. 
Check for contraindications.
@guidance: Should vaccinate client with second HPV dose as client is HIV positive and the latest HPV dose was administered more than 6 months ago. 
Check for contraindications
@guidance: Should vaccinate client with second HPV dose as client is immunocompromised and the latest HPV dose was administered more than 6 months ago. 
Check for contraindications
@guidance: Should vaccinate client with third HPV dose as client is HIV positive and the latest HPV dose was administered more than 6 months ago. 
Check for contraindications
@guidance: Should vaccinate client with third HPV dose as client is immunocompromised and the latest HPV dose was administered more than 6 months ago. 
Check for contraindications
*/
define "Client is due for HPV vaccination Guidance":
  case
    when "Client is due for HPV vaccination Case 1" then 'Should vaccinate client with first HPV dose as no HPV doses were administered and client is within appropriate age range. 
Check for contraindications.'
    when "Client is due for HPV vaccination Case 2" then 'Should vaccinate client with second HPV dose as client is HIV positive and the latest HPV dose was administered more than 6 months ago. 
Check for contraindications'
    when "Client is due for HPV vaccination Case 3" then 'Should vaccinate client with second HPV dose as client is immunocompromised and the latest HPV dose was administered more than 6 months ago. 
Check for contraindications'
    when "Client is due for HPV vaccination Case 4" then 'Should vaccinate client with third HPV dose as client is HIV positive and the latest HPV dose was administered more than 6 months ago. 
Check for contraindications'
    when "Client is due for HPV vaccination Case 5" then 'Should vaccinate client with third HPV dose as client is immunocompromised and the latest HPV dose was administered more than 6 months ago. 
Check for contraindications'
    else ''
  end

/*
@output: Clinical judgement is required. Create a clinical note.
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note.":
  Encounter."No HPV primary series doses were administered"
    and Encounter."Client's age is more than 20 years"

/*
@output: Clinical judgement is required. Create a clinical note. Guidance
@guidance: Member States should update this action according to the national immunization programme.
*/
define "Clinical judgement is required. Create a clinical note. Guidance":
  'Member States should update this action according to the national immunization programme.'

/*
@output: HPV immunization schedule is complete Case 1
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "HPV immunization schedule is complete Case 1":
  Encounter."One HPV primary series dose was administered"
    and Encounter."Client is not immunocompromised"
    and Encounter."Client's HIV status is negative or unknown"

/*
@output: HPV immunization schedule is complete Case 2
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "HPV immunization schedule is complete Case 2":
  Encounter."Three HPV primary series doses were administered"

/*
@output: HPV immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "HPV immunization schedule is complete":
  "HPV immunization schedule is complete Case 1"
    or "HPV immunization schedule is complete Case 2"

/*
@output: HPV immunization schedule is complete Guidance
@guidance: HPV immunization schedule is complete. One HPV primary series dose was administered. 
Check for any other vaccines due.
@guidance: HPV immunization schedule is complete. Three HPV primary series doses were administered. 
Check for any other vaccines due.
*/
define "HPV immunization schedule is complete Guidance":
  case
    when "HPV immunization schedule is complete Case 1" then 'HPV immunization schedule is complete. One HPV primary series dose was administered. 
Check for any other vaccines due.'
    when "HPV immunization schedule is complete Case 2" then 'HPV immunization schedule is complete. Three HPV primary series doses were administered. 
Check for any other vaccines due.'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '27.1' then "Client is not due for HPV vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first HPV dose as client\'s age is less than 9 years. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '28.01' then "Client is due for HPV vaccination Case 1" and "Guidance" = 'Should vaccinate client with first HPV dose as no HPV doses were administered and client is within appropriate age range. 
Check for contraindications.'
    when Patient.id = '29.01' then "Clinical judgement is required. Create a clinical note." and "Guidance" = 'Member States should update this action according to the national immunization programme.'
    when Patient.id = '30.024' then "Client is not due for HPV vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '31.024' then "Client is due for HPV vaccination Case 2" and "Guidance" = 'Should vaccinate client with second HPV dose as client is HIV positive and the latest HPV dose was administered more than 6 months ago. 
Check for contraindications'
    when Patient.id = '32.023' then "Client is not due for HPV vaccination Case 3" and "Guidance" = 'Should not vaccinate client with second HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '33.023' then "Client is due for HPV vaccination Case 3" and "Guidance" = 'Should vaccinate client with second HPV dose as client is immunocompromised and the latest HPV dose was administered more than 6 months ago. 
Check for contraindications'
    when Patient.id = '34.034' then "HPV immunization schedule is complete Case 1" and "Guidance" = 'HPV immunization schedule is complete. One HPV primary series dose was administered. 
Check for any other vaccines due.'
    when Patient.id = '35.024' then "Client is not due for HPV vaccination Case 4" and "Guidance" = 'Should not vaccinate client with third HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '36.024' then "Client is due for HPV vaccination Case 4" and "Guidance" = 'Should vaccinate client with third HPV dose as client is HIV positive and the latest HPV dose was administered more than 6 months ago. 
Check for contraindications'
    when Patient.id = '37.023' then "Client is not due for HPV vaccination Case 5" and "Guidance" = 'Should not vaccinate client with third HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '38.023' then "Client is due for HPV vaccination Case 5" and "Guidance" = 'Should vaccinate client with third HPV dose as client is immunocompromised and the latest HPV dose was administered more than 6 months ago. 
Check for contraindications'
    when Patient.id = '39.0' then "HPV immunization schedule is complete Case 2" and "Guidance" = 'HPV immunization schedule is complete. Three HPV primary series doses were administered. 
Check for any other vaccines due.'
    else 'No test case set'
  end
