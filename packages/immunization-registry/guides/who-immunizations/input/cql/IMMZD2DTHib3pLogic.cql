
/*
 * Library: IMMZD2DTHib3pLogic (IMMZ.D2.DT.Hib.3 doses)
 * Rule: Determine if the client is due for a Haemophilus influenzae type b (Hib) vaccination according to the national immunization schedule
 * Decision Table: 3 primary doses without a booster dose (3p)
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any
 */
library IMMZD2DTHib3pLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTHibEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for Hib vaccination" then "Client is not due for Hib vaccination Guidance"
    when "Client is due for Hib vaccination" then "Client is due for Hib vaccination Guidance"
    when "Hib immunization schedule is complete" then "Hib immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for Hib vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for Hib vaccination Case 1":
  Encounter."Client's age is less than 6 weeks"

/*
@output: Client is not due for Hib vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for Hib vaccination Case 2":
  Encounter."One Hib primary series dose was administered"
    and Encounter."Client's age is at least 6 weeks and not more than 5 years"
    and Encounter."Client's age was less than 1 year when first Hib dose was administered"
    and Encounter."The latest Hib dose was administered less than 4 weeks ago"

/*
@output: Client is not due for Hib vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for Hib vaccination Case 3":
  Encounter."Two Hib primary series doses were administered"
    and Encounter."Client's age is between 6 weeks and not more than 5 years"
    and Encounter."The latest Hib dose was administered less than 4 weeks ago"

/*
@output: Client is not due for Hib vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for Hib vaccination Case 4":
  Encounter."Client's age is more than 5 years"

/*
@output: Client is not due for Hib vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for Hib vaccination":
  "Client is not due for Hib vaccination Case 1"
    or "Client is not due for Hib vaccination Case 2"
    or "Client is not due for Hib vaccination Case 3"
    or "Client is not due for Hib vaccination Case 4"

/*
@output: Client is not due for Hib vaccination Guidance
@guidance: Should not vaccinate client with first Hib dose as client's age is less than 6 weeks. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.
@guidance: Should not vaccinate client with second Hib dose as latest Hib dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for second dose.
@guidance: Should not vaccinate client with third Hib dose as latest Hib dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for third dose.
@guidance: Should not vaccinate client with Hib dose as client is more than 5 years old and Hib vaccination is not required for healthy children aged over 5 years. 
Check for any other vaccines due.
*/
define "Client is not due for Hib vaccination Guidance":
  case
    when "Client is not due for Hib vaccination Case 1" then 'Should not vaccinate client with first Hib dose as client\'s age is less than 6 weeks. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.'
    when "Client is not due for Hib vaccination Case 2" then 'Should not vaccinate client with second Hib dose as latest Hib dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for second dose.'
    when "Client is not due for Hib vaccination Case 3" then 'Should not vaccinate client with third Hib dose as latest Hib dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for third dose.'
    when "Client is not due for Hib vaccination Case 4" then 'Should not vaccinate client with Hib dose as client is more than 5 years old and Hib vaccination is not required for healthy children aged over 5 years. 
Check for any other vaccines due.'
    else ''
  end

/*
@output: Client is due for Hib vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for Hib vaccination Case 1":
  Encounter."No Hib primary series doses were administered"
    and Encounter."Client's age is between 6 weeks and 5 years"

/*
@output: Client is due for Hib vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for Hib vaccination Case 2":
  Encounter."One Hib primary series dose was administered"
    and Encounter."Client's age is at least 6 weeks and not more than 5 years"
    and Encounter."Client's age was less than 1 year when first Hib dose was administered"
    and Encounter."The latest Hib dose was administered more than 4 weeks ago"

/*
@output: Client is due for Hib vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for Hib vaccination Case 3":
  Encounter."Two Hib primary series doses were administered"
    and Encounter."Client's age is between 6 weeks and not more than 5 years"
    and Encounter."Client's age was more than 1 year when first Hib dose was administered"
    and Encounter."The latest Hib dose was administered more than 4 weeks ago"

/*
@output: Client is due for Hib vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for Hib vaccination":
  "Client is due for Hib vaccination Case 1"
    or "Client is due for Hib vaccination Case 2"
    or "Client is due for Hib vaccination Case 3"

/*
@output: Client is due for Hib vaccination Guidance
@guidance: Should vaccinate client with first Hib dose as no Hib doses were administered and client is within appropriate age range. 
Check for contraindications.
@guidance: Should vaccinate client with second Hib dose as client's age was less than 1 year when first Hib dose was administered and the latest Hib dose was administered more than 4 weeks ago. 
Check for contraindications.
@guidance: Should vaccinate client with third Hib dose as client is within appropriate age range and latest Hib dose was administered more than 4 weeks ago. 
Check for contraindications.
*/
define "Client is due for Hib vaccination Guidance":
  case
    when "Client is due for Hib vaccination Case 1" then 'Should vaccinate client with first Hib dose as no Hib doses were administered and client is within appropriate age range. 
Check for contraindications.'
    when "Client is due for Hib vaccination Case 2" then 'Should vaccinate client with second Hib dose as client\'s age was less than 1 year when first Hib dose was administered and the latest Hib dose was administered more than 4 weeks ago. 
Check for contraindications.'
    when "Client is due for Hib vaccination Case 3" then 'Should vaccinate client with third Hib dose as client is within appropriate age range and latest Hib dose was administered more than 4 weeks ago. 
Check for contraindications.'
    else ''
  end

/*
@output: Hib immunization schedule is complete Case 1
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Hib immunization schedule is complete Case 1":
  Encounter."One Hib primary series dose was administered"
    and Encounter."Client's age is at least 6 weeks and not more than 5 years"
    and Encounter."Client's age was more than 1 year when first Hib dose was administered"

/*
@output: Hib immunization schedule is complete Case 2
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Hib immunization schedule is complete Case 2":
  Encounter."Three Hib primary series doses were administered"

/*
@output: Hib immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Hib immunization schedule is complete":
  "Hib immunization schedule is complete Case 1"
    or "Hib immunization schedule is complete Case 2"

/*
@output: Hib immunization schedule is complete Guidance
@guidance: Hib immunization schedule is complete as client's age was more than 1 year when first Hib dose was administered. One Hib primary series dose was administered.
Check for any other vaccines due.
@guidance: Hib immunization schedule is complete. Three Hib primary series doses were administered. 
Check for any vaccines due.
*/
define "Hib immunization schedule is complete Guidance":
  case
    when "Hib immunization schedule is complete Case 1" then 'Hib immunization schedule is complete as client\'s age was more than 1 year when first Hib dose was administered. One Hib primary series dose was administered.
Check for any other vaccines due.'
    when "Hib immunization schedule is complete Case 2" then 'Hib immunization schedule is complete. Three Hib primary series doses were administered. 
Check for any vaccines due.'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.Alt6w' then "Client is not due for Hib vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first Hib dose as client\'s age is less than 6 weeks. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.'
    when Patient.id = '09.Abt6w5y' then "Client is due for Hib vaccination Case 1" and "Guidance" = 'Should vaccinate client with first Hib dose as no Hib doses were administered and client is within appropriate age range. 
Check for contraindications.'
    when Patient.id = '10.D1Abt6w5yFlt1yDlt4w' then "Client is not due for Hib vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second Hib dose as latest Hib dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for second dose.'
    when Patient.id = '11.D1Abt6w5yFlt1yDgt4w' then "Client is due for Hib vaccination Case 2" and "Guidance" = 'Should vaccinate client with second Hib dose as client\'s age was less than 1 year when first Hib dose was administered and the latest Hib dose was administered more than 4 weeks ago. 
Check for contraindications.'
    when Patient.id = '12.D1Abt6w5yFgt1y' then "Hib immunization schedule is complete Case 1" and "Guidance" = 'Hib immunization schedule is complete as client\'s age was more than 1 year when first Hib dose was administered. One Hib primary series dose was administered.
Check for any other vaccines due.'
    when Patient.id = '13.D2Abt6w5yDlt4w' then "Client is not due for Hib vaccination Case 3" and "Guidance" = 'Should not vaccinate client with third Hib dose as latest Hib dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for third dose.'
    when Patient.id = '14.D2Abt6w5yDgt4w' then "Client is due for Hib vaccination Case 3" and "Guidance" = 'Should vaccinate client with third Hib dose as client is within appropriate age range and latest Hib dose was administered more than 4 weeks ago. 
Check for contraindications.'
    when Patient.id = '15.D3' then "Hib immunization schedule is complete Case 2" and "Guidance" = 'Hib immunization schedule is complete. Three Hib primary series doses were administered. 
Check for any vaccines due.'
    when Patient.id = '16.Agt5y' then "Client is not due for Hib vaccination Case 4" and "Guidance" = 'Should not vaccinate client with Hib dose as client is more than 5 years old and Hib vaccination is not required for healthy children aged over 5 years. 
Check for any other vaccines due.'
    else 'No test case set'
  end
