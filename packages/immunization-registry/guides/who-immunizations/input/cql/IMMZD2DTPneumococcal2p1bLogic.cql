
/*
 * Library: IMMZD2DTPneumococcal2p1bLogic (IMMZ.D2.DT.Pneumococcal.2 doses with booster dose)
 * Rule: Determine if the client is due for a pneumococcal vaccination according to the national immunization schedule
 * Decision Table: 2 primary doses with a booster dose (2p+1)
 * Trigger: IMMZ.D2  Determine required vaccination(s) if any
 */
library IMMZD2DTPneumococcal2p1bLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTPneumococcalEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for pneumococcal vaccination" then "Client is not due for pneumococcal vaccination Guidance"
    when "Client is due for pneumococcal vaccination" then "Client is due for pneumococcal vaccination Guidance"
    when "Pneumococcal immunization schedule is complete" then "Pneumococcal immunization schedule is complete Guidance"
    when "Client is due for pneumococcal booster dose" then "Client is due for pneumococcal booster dose Guidance"
    when "Client is not due for pneumococcal booster dose" then "Client is not due for pneumococcal booster dose Guidance"
    when "Clinical judgement is required. Create a clinical note" then "Clinical judgement is required. Create a clinical note Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for pneumococcal vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal vaccination Case 1":
  Encounter."The client's age is less than 6 weeks"

/*
@output: Client is not due for pneumococcal vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal vaccination Case 2":
  Encounter."One pneumococcal primary series dose was administered"
    and Encounter."The client's age is less than or equal to 5 years"
    and Encounter."The first pneumococcal dose was administered within 24 months post birth"
    and Encounter."The latest pneumococcal dose was administered less than 8 weeks ago"

/*
@output: Client is not due for pneumococcal vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal vaccination Case 3":
  Encounter."One pneumococcal primary series dose was administered"
    and Encounter."The client's age is less than or equal to 5 years"
    and Encounter."The first pneumococcal dose was administered after 24 months post birth"
    and Encounter."The latest pneumococcal dose was administered less than 8 weeks ago"
    and Encounter."Client is at high risk for pneumococcal infection"

/*
@output: Client is not due for pneumococcal vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal vaccination":
  "Client is not due for pneumococcal vaccination Case 1"
    or "Client is not due for pneumococcal vaccination Case 2"
    or "Client is not due for pneumococcal vaccination Case 3"

/*
@output: Client is not due for pneumococcal vaccination Guidance
@guidance: Should not vaccinate client with first pneumococcal dose as client's age is less than 6 weeks. Check for any vaccines due and inform the caregiver of when to come back for the first dose.
@guidance: Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 8 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 8 weeks ago and client is at high risk for pneumococcal infection. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
*/
define "Client is not due for pneumococcal vaccination Guidance":
  case
    when "Client is not due for pneumococcal vaccination Case 1" then 'Should not vaccinate client with first pneumococcal dose as client\'s age is less than 6 weeks. Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when "Client is not due for pneumococcal vaccination Case 2" then 'Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 8 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for pneumococcal vaccination Case 3" then 'Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 8 weeks ago and client is at high risk for pneumococcal infection. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    else ''
  end

/*
@output: Client is due for pneumococcal vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal vaccination Case 1":
  Encounter."No pneumococcal primary series doses were administered"
    and Encounter."The client's age is between 6 weeks and 5 years"

/*
@output: Client is due for pneumococcal vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal vaccination Case 2":
  Encounter."One pneumococcal primary series dose was administered"
    and Encounter."The client's age is less than or equal to 5 years"
    and Encounter."The first pneumococcal dose was administered within 24 months post birth"
    and Encounter."The latest pneumococcal dose was administered more than 8 weeks ago"

/*
@output: Client is due for pneumococcal vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal vaccination Case 3":
  Encounter."One pneumococcal primary series dose was administered"
    and Encounter."The client's age is less than or equal to 5 years"
    and Encounter."The first pneumococcal dose was administered after 24 months post birth"
    and Encounter."The latest pneumococcal dose was administered more than 8 weeks ago"
    and Encounter."Client is at high risk for pneumococcal infection"

/*
@output: Client is due for pneumococcal vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal vaccination":
  "Client is due for pneumococcal vaccination Case 1"
    or "Client is due for pneumococcal vaccination Case 2"
    or "Client is due for pneumococcal vaccination Case 3"

/*
@output: Client is due for pneumococcal vaccination Guidance
@guidance: Should vaccinate client with first pneumococcal dose as no pneumococcal doses were administered and client is within the appropriate age range.
Check for contraindications.
@guidance: Should vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered more than 8 weeks ago. 
Check for contraindications.
@guidance: Should vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered more than 8 weeks ago and client is at high risk for pneumococcal infection. 
Check for contraindications.
*/
define "Client is due for pneumococcal vaccination Guidance":
  case
    when "Client is due for pneumococcal vaccination Case 1" then 'Should vaccinate client with first pneumococcal dose as no pneumococcal doses were administered and client is within the appropriate age range.
Check for contraindications.'
    when "Client is due for pneumococcal vaccination Case 2" then 'Should vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered more than 8 weeks ago. 
Check for contraindications.'
    when "Client is due for pneumococcal vaccination Case 3" then 'Should vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered more than 8 weeks ago and client is at high risk for pneumococcal infection. 
Check for contraindications.'
    else ''
  end

/*
@output: Pneumococcal immunization schedule is complete Case 1
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Pneumococcal immunization schedule is complete Case 1":
  Encounter."One pneumococcal primary series dose was administered"
    and Encounter."The client's age is less than or equal to 5 years"
    and Encounter."The first pneumococcal dose was administered after 24 months post birth"
    and Encounter."Client is not at high risk for pneumococcal infection"

/*
@output: Pneumococcal immunization schedule is complete Case 2
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Pneumococcal immunization schedule is complete Case 2":
  Encounter."Two pneumococcal primary series doses were administered"
    and Encounter."No pneumococcal booster dose was administered"
    and Encounter."The client's age is less than or equal to 5 years"
    and Encounter."The first pneumococcal dose was administered after 12 months post birth"

/*
@output: Pneumococcal immunization schedule is complete Case 3
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Pneumococcal immunization schedule is complete Case 3":
  Encounter."Two pneumococcal primary series doses were administered"
    and Encounter."One pneumococcal booster dose was administered"
    and Encounter."The client's age is more than or equal to 12 months and less than 24 months"
    and Encounter."The latest pneumococcal dose was administered after 12 months post birth"

/*
@output: Pneumococcal immunization schedule is complete Case 4
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Pneumococcal immunization schedule is complete Case 4":
  Encounter."Two pneumococcal primary series doses were administered"
    and Encounter."One pneumococcal booster dose was administered"
    and Encounter."Client's HIV status is negative or unknown"
    and Encounter."Client did not have preterm birth"

/*
@output: Pneumococcal immunization schedule is complete Case 5
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Pneumococcal immunization schedule is complete Case 5":
  Encounter."Two pneumococcal primary series doses were administered"
    and Encounter."One pneumococcal booster dose was administered"
    and Encounter."The client's age is more than or equal to 24 months"

/*
@output: Pneumococcal immunization schedule is complete Case 6
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Pneumococcal immunization schedule is complete Case 6":
  Encounter."Two pneumococcal primary series doses were administered"
    and Encounter."Two pneumococcal booster doses were administered"

/*
@output: Pneumococcal immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Pneumococcal immunization schedule is complete":
  "Pneumococcal immunization schedule is complete Case 1"
    or "Pneumococcal immunization schedule is complete Case 2"
    or "Pneumococcal immunization schedule is complete Case 3"
    or "Pneumococcal immunization schedule is complete Case 4"
    or "Pneumococcal immunization schedule is complete Case 5"
    or "Pneumococcal immunization schedule is complete Case 6"

/*
@output: Pneumococcal immunization schedule is complete Guidance
@guidance: Pneumococcal immunization schedule is complete. One primary series dose was administered. 
Check for any other vaccines due.
@guidance: Pneumococcal immunization schedule is complete. Two pneumococcal primary series doses were administered. 
Check for any other vaccines due.
@guidance: Pneumococcal immunization schedule is complete.  Two pneumococcal primary series doses and one booster dose were administered.
Check for any other vaccines due.
@guidance: Pneumococcal immunization schedule is complete.  Two pneumococcal primary series doses and one booster dose were administered.
Check for any other vaccines due.
@guidance: Pneumococcal immunization schedule is complete.  Two pneumococcal primary series doses and one booster dose were administered.
Check for any other vaccines due.
@guidance: Pneumococcal immunization schedule is complete. Two pneumococcal primary series doses and two booster doses were administered. 
Check for any other vaccines due.
*/
define "Pneumococcal immunization schedule is complete Guidance":
  case
    when "Pneumococcal immunization schedule is complete Case 1" then 'Pneumococcal immunization schedule is complete. One primary series dose was administered. 
Check for any other vaccines due.'
    when "Pneumococcal immunization schedule is complete Case 2" then 'Pneumococcal immunization schedule is complete. Two pneumococcal primary series doses were administered. 
Check for any other vaccines due.'
    when "Pneumococcal immunization schedule is complete Case 3" then 'Pneumococcal immunization schedule is complete.  Two pneumococcal primary series doses and one booster dose were administered.
Check for any other vaccines due.'
    when "Pneumococcal immunization schedule is complete Case 4" then 'Pneumococcal immunization schedule is complete.  Two pneumococcal primary series doses and one booster dose were administered.
Check for any other vaccines due.'
    when "Pneumococcal immunization schedule is complete Case 5" then 'Pneumococcal immunization schedule is complete.  Two pneumococcal primary series doses and one booster dose were administered.
Check for any other vaccines due.'
    when "Pneumococcal immunization schedule is complete Case 6" then 'Pneumococcal immunization schedule is complete. Two pneumococcal primary series doses and two booster doses were administered. 
Check for any other vaccines due.'
    else ''
  end

/*
@output: Client is due for pneumococcal booster dose Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal booster dose Case 1":
  Encounter."Two pneumococcal primary series doses were administered"
    and Encounter."No pneumococcal booster dose was administered"
    and Encounter."The client's age is less than or equal to 5 years"
    and Encounter."The first pneumococcal dose was administered within 12 months post birth"

/*
@output: Client is due for pneumococcal booster dose Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal booster dose Case 2":
  Encounter."Two pneumococcal primary series doses were administered"
    and Encounter."One pneumococcal booster dose was administered"
    and Encounter."The client's age is more than or equal to 12 months and less than 24 months"
    and Encounter."The latest pneumococcal dose was administered within 12 months post birth"
    and Encounter."Client's HIV status is positive"

/*
@output: Client is due for pneumococcal booster dose Case 3
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal booster dose Case 3":
  Encounter."Two pneumococcal primary series doses were administered"
    and Encounter."One pneumococcal booster dose was administered"
    and Encounter."The client's age is more than or equal to 12 months and less than 24 months"
    and Encounter."The latest pneumococcal dose was administered within 12 months post birth"
    and Encounter."Client had preterm birth"

/*
@output: Client is due for pneumococcal booster dose
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal booster dose":
  "Client is due for pneumococcal booster dose Case 1"
    or "Client is due for pneumococcal booster dose Case 2"
    or "Client is due for pneumococcal booster dose Case 3"

/*
@output: Client is due for pneumococcal booster dose Guidance
@guidance: Should vaccinate client with first pneumococcal booster dose as first pneumococcal dose was administered within 12 months post birth. 
Check for contraindications.
@guidance: Should vaccinate client with second pneumococcal booster dose as client is HIV positive and latest pneumococcal dose was administered within 12 months post birth.
Check for contraindications.
@guidance: Should vaccinate client with second pneumococcal booster dose as client had preterm birth and latest pneumococcal dose was administered within 12 months post birth.
Check for contraindications.
*/
define "Client is due for pneumococcal booster dose Guidance":
  case
    when "Client is due for pneumococcal booster dose Case 1" then 'Should vaccinate client with first pneumococcal booster dose as first pneumococcal dose was administered within 12 months post birth. 
Check for contraindications.'
    when "Client is due for pneumococcal booster dose Case 2" then 'Should vaccinate client with second pneumococcal booster dose as client is HIV positive and latest pneumococcal dose was administered within 12 months post birth.
Check for contraindications.'
    when "Client is due for pneumococcal booster dose Case 3" then 'Should vaccinate client with second pneumococcal booster dose as client had preterm birth and latest pneumococcal dose was administered within 12 months post birth.
Check for contraindications.'
    else ''
  end

/*
@output: Client is not due for pneumococcal booster dose Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal booster dose Case 1":
  Encounter."Two pneumococcal primary series doses were administered"
    and Encounter."One pneumococcal booster dose was administered"
    and Encounter."The client's age is less than 12 months"
    and Encounter."Client's HIV status is positive"

/*
@output: Client is not due for pneumococcal booster dose Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal booster dose Case 2":
  Encounter."Two pneumococcal primary series doses were administered"
    and Encounter."One pneumococcal booster dose was administered"
    and Encounter."The client's age is less than 12 months"
    and Encounter."Client had preterm birth"

/*
@output: Client is not due for pneumococcal booster dose
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal booster dose":
  "Client is not due for pneumococcal booster dose Case 1"
    or "Client is not due for pneumococcal booster dose Case 2"

/*
@output: Client is not due for pneumococcal booster dose Guidance
@guidance: Should not vaccinate client with second pneumococcal booster dose as client's age is less than 12 months and client is HIV positive. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with second pneumococcal booster dose as client's age is less than 12 months and client had preterm birth. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
*/
define "Client is not due for pneumococcal booster dose Guidance":
  case
    when "Client is not due for pneumococcal booster dose Case 1" then 'Should not vaccinate client with second pneumococcal booster dose as client\'s age is less than 12 months and client is HIV positive. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for pneumococcal booster dose Case 2" then 'Should not vaccinate client with second pneumococcal booster dose as client\'s age is less than 12 months and client had preterm birth. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    else ''
  end

/*
@output: Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note":
  Encounter."The client's age is more than 5 years"

/*
@output: Clinical judgement is required. Create a clinical note Guidance
@guidance: Members States should update this action according to the national immunization programme.
*/
define "Clinical judgement is required. Create a clinical note Guidance":
  'Members States should update this action according to the national immunization programme.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.3' then "Client is not due for pneumococcal vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first pneumococcal dose as client\'s age is less than 6 weeks. Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '09.13' then "Client is due for pneumococcal vaccination Case 1" and "Guidance" = 'Should vaccinate client with first pneumococcal dose as no pneumococcal doses were administered and client is within the appropriate age range.
Check for contraindications.'
    when Patient.id = '10.1345' then "Client is not due for pneumococcal vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 8 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '11.1345' then "Client is due for pneumococcal vaccination Case 2" and "Guidance" = 'Should vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered more than 8 weeks ago. 
Check for contraindications.'
    when Patient.id = '12.13456' then "Client is not due for pneumococcal vaccination Case 3" and "Guidance" = 'Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 8 weeks ago and client is at high risk for pneumococcal infection. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '13.13456' then "Client is due for pneumococcal vaccination Case 3" and "Guidance" = 'Should vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered more than 8 weeks ago and client is at high risk for pneumococcal infection. 
Check for contraindications.'
    when Patient.id = '14.1346' then "Pneumococcal immunization schedule is complete Case 1" and "Guidance" = 'Pneumococcal immunization schedule is complete. One primary series dose was administered. 
Check for any other vaccines due.'
    when Patient.id = '15.1234' then "Client is due for pneumococcal booster dose Case 1" and "Guidance" = 'Should vaccinate client with first pneumococcal booster dose as first pneumococcal dose was administered within 12 months post birth. 
Check for contraindications.'
    when Patient.id = '16.1234' then "Pneumococcal immunization schedule is complete Case 2" and "Guidance" = 'Pneumococcal immunization schedule is complete. Two pneumococcal primary series doses were administered. 
Check for any other vaccines due.'
    when Patient.id = '17.1237' then "Client is not due for pneumococcal booster dose Case 1" and "Guidance" = 'Should not vaccinate client with second pneumococcal booster dose as client\'s age is less than 12 months and client is HIV positive. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '18.1238' then "Client is not due for pneumococcal booster dose Case 2" and "Guidance" = 'Should not vaccinate client with second pneumococcal booster dose as client\'s age is less than 12 months and client had preterm birth. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '19.12347' then "Client is due for pneumococcal booster dose Case 2" and "Guidance" = 'Should vaccinate client with second pneumococcal booster dose as client is HIV positive and latest pneumococcal dose was administered within 12 months post birth.
Check for contraindications.'
    when Patient.id = '20.12348' then "Client is due for pneumococcal booster dose Case 3" and "Guidance" = 'Should vaccinate client with second pneumococcal booster dose as client had preterm birth and latest pneumococcal dose was administered within 12 months post birth.
Check for contraindications.'
    when Patient.id = '21.1234' then "Pneumococcal immunization schedule is complete Case 3" and "Guidance" = 'Pneumococcal immunization schedule is complete.  Two pneumococcal primary series doses and one booster dose were administered.
Check for any other vaccines due.'
    when Patient.id = '22.1278' then "Pneumococcal immunization schedule is complete Case 4" and "Guidance" = 'Pneumococcal immunization schedule is complete.  Two pneumococcal primary series doses and one booster dose were administered.
Check for any other vaccines due.'
    when Patient.id = '23.123' then "Pneumococcal immunization schedule is complete Case 5" and "Guidance" = 'Pneumococcal immunization schedule is complete.  Two pneumococcal primary series doses and one booster dose were administered.
Check for any other vaccines due.'
    when Patient.id = '24.12' then "Pneumococcal immunization schedule is complete Case 6" and "Guidance" = 'Pneumococcal immunization schedule is complete. Two pneumococcal primary series doses and two booster doses were administered. 
Check for any other vaccines due.'
    when Patient.id = '25.3' then "Clinical judgement is required. Create a clinical note" and "Guidance" = 'Members States should update this action according to the national immunization programme.'
    else 'No test case set'
  end
