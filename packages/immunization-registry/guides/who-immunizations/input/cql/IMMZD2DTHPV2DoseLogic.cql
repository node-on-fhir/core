
/*
 * Library: IMMZD2DTHPV2DoseLogic (IMMZ.D2.DT.HPV.2 doses)
 * Rule: Determine if the client is due for a human papillomavirus (HPV) vaccination according to the national immunization schedule
 * Decision Table: 2-dose schedule
 * Trigger: IMMZ.D2  Determine required vaccination(s) if any
 */
library IMMZD2DTHPV2DoseLogic

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

/*
@output: Client is not due for HPV vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for HPV vaccination Case 3":
  Encounter."Two HPV primary series doses were administered"
    and Encounter."The latest HPV dose was administered less than 6 months ago"
    and Encounter."Client's HIV status is positive"

/*
@output: Client is not due for HPV vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for HPV vaccination Case 4":
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

/*
@output: Client is not due for HPV vaccination Guidance
@guidance: Should not vaccinate client with first HPV dose as client's age is less than 9 years. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with second HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the second dose.
@guidance: Should not vaccinate for third HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate for third HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.
*/
define "Client is not due for HPV vaccination Guidance":
  case
    when "Client is not due for HPV vaccination Case 1" then 'Should not vaccinate client with first HPV dose as client\'s age is less than 9 years. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for HPV vaccination Case 2" then 'Should not vaccinate client with second HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the second dose.'
    when "Client is not due for HPV vaccination Case 3" then 'Should not vaccinate for third HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for HPV vaccination Case 4" then 'Should not vaccinate for third HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    else ''
  end

/*
@output: Client is due for HPV vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for HPV vaccination Case 1":
  Encounter."No HPV primary series doses were administered"
    and Encounter."Client's age is between 9 and 14 years"
    and Encounter."Client's biological sex is female"

/*
@output: Client is due for HPV vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for HPV vaccination Case 2":
  Encounter."One HPV primary series dose was administered"
    and Encounter."The latest HPV dose was administered more than 6 months ago"

/*
@output: Client is due for HPV vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for HPV vaccination Case 3":
  Encounter."Two HPV primary series doses were administered"
    and Encounter."The latest HPV dose was administered more than 6 months ago"
    and Encounter."Client's HIV status is positive"

/*
@output: Client is due for HPV vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for HPV vaccination Case 4":
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

/*
@output: Client is due for HPV vaccination Guidance
@guidance: Should vaccinate client with first HPV dose as no HPV doses were administered, client is female and within appropriate age range. 
Check for contraindications.
@guidance: Should vaccinate client with second HPV dose as the latest HPV dose was administered more than 6 months ago. 
Check for contraindications.
@guidance: Should vaccinate for third HPV dose as client is HIV positive and the latest HPV dose was administered more than 6 months ago. 
Check for contraindications.
@guidance: Should vaccinate for third HPV dose as client is immunocompromised and the latest HPV dose was administered more than 6 months ago.
Check for contraindications.
*/
define "Client is due for HPV vaccination Guidance":
  case
    when "Client is due for HPV vaccination Case 1" then 'Should vaccinate client with first HPV dose as no HPV doses were administered, client is female and within appropriate age range. 
Check for contraindications.'
    when "Client is due for HPV vaccination Case 2" then 'Should vaccinate client with second HPV dose as the latest HPV dose was administered more than 6 months ago. 
Check for contraindications.'
    when "Client is due for HPV vaccination Case 3" then 'Should vaccinate for third HPV dose as client is HIV positive and the latest HPV dose was administered more than 6 months ago. 
Check for contraindications.'
    when "Client is due for HPV vaccination Case 4" then 'Should vaccinate for third HPV dose as client is immunocompromised and the latest HPV dose was administered more than 6 months ago.
Check for contraindications.'
    else ''
  end

/*
@output: Clinical judgement is required. Create a clinical note. Case 1
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note. Case 1":
  Encounter."No HPV primary series doses were administered"
    and Encounter."Client's age more than or equal to 15 years"
    and Encounter."Client's biological sex is female"

/*
@output: Clinical judgement is required. Create a clinical note. Case 2
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note. Case 2":
  Encounter."No HPV primary series doses were administered"
    and Encounter."Client's biological sex is not female"

/*
@output: Clinical judgement is required. Create a clinical note.
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note.":
  "Clinical judgement is required. Create a clinical note. Case 1"
    or "Clinical judgement is required. Create a clinical note. Case 2"

/*
@output: Clinical judgement is required. Create a clinical note. Guidance
@guidance: Member States should update this guidance according to the national immunization programme.
@guidance: Member States should update this guidance according to the national immunization programme.
*/
define "Clinical judgement is required. Create a clinical note. Guidance":
  case
    when "Clinical judgement is required. Create a clinical note. Case 1" then 'Member States should update this guidance according to the national immunization programme.'
    when "Clinical judgement is required. Create a clinical note. Case 2" then 'Member States should update this guidance according to the national immunization programme.'
    else ''
  end

/*
@output: HPV immunization schedule is complete Case 1
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "HPV immunization schedule is complete Case 1":
  Encounter."Two HPV primary series doses were administered"
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
@guidance: HPV immunization schedule is complete. Two HPV primary series doses were administered. 
Check for any other vaccines due.
@guidance: HPV immunization schedule is complete. Three HPV primary series doses were administered. 
Check for any other vaccines due.
*/
define "HPV immunization schedule is complete Guidance":
  case
    when "HPV immunization schedule is complete Case 1" then 'HPV immunization schedule is complete. Two HPV primary series doses were administered. 
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
    when Patient.id = '08.1' then "Client is not due for HPV vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first HPV dose as client\'s age is less than 9 years. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '09.012' then "Client is due for HPV vaccination Case 1" and "Guidance" = 'Should vaccinate client with first HPV dose as no HPV doses were administered, client is female and within appropriate age range. 
Check for contraindications.'
    when Patient.id = '10.012' then "Clinical judgement is required. Create a clinical note. Case 1" and "Guidance" = 'Member States should update this guidance according to the national immunization programme.'
    when Patient.id = '11.02' then "Clinical judgement is required. Create a clinical note. Case 2" and "Guidance" = 'Member States should update this guidance according to the national immunization programme.'
    when Patient.id = '12.03' then "Client is not due for HPV vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the second dose.'
    when Patient.id = '13.03' then "Client is due for HPV vaccination Case 2" and "Guidance" = 'Should vaccinate client with second HPV dose as the latest HPV dose was administered more than 6 months ago. 
Check for contraindications.'
    when Patient.id = '14.035' then "Client is not due for HPV vaccination Case 3" and "Guidance" = 'Should not vaccinate for third HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '15.035' then "Client is due for HPV vaccination Case 3" and "Guidance" = 'Should vaccinate for third HPV dose as client is HIV positive and the latest HPV dose was administered more than 6 months ago. 
Check for contraindications.'
    when Patient.id = '16.034' then "Client is not due for HPV vaccination Case 4" and "Guidance" = 'Should not vaccinate for third HPV dose as the latest HPV dose was administered less than 6 months ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '17.034' then "Client is due for HPV vaccination Case 4" and "Guidance" = 'Should vaccinate for third HPV dose as client is immunocompromised and the latest HPV dose was administered more than 6 months ago.
Check for contraindications.'
    when Patient.id = '18.045' then "HPV immunization schedule is complete Case 1" and "Guidance" = 'HPV immunization schedule is complete. Two HPV primary series doses were administered. 
Check for any other vaccines due.'
    when Patient.id = '19.0' then "HPV immunization schedule is complete Case 2" and "Guidance" = 'HPV immunization schedule is complete. Three HPV primary series doses were administered. 
Check for any other vaccines due.'
    else 'No test case set'
  end
