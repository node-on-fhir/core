
/*
 * Library: IMMZD2DTRotavirusLogic (IMMZ.D2.DT.Rotavirus)
 * Rule: Determine if the client is due for a rotavirus vaccination according to the national immunization schedule
 * Decision Table: IMMZ.D2.DT.Rotavirus
 * Trigger: IMMZ.D2  Determine required vaccination(s) if any
 */
library IMMZD2DTRotavirusLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'
include IMMZCommon called Common
include IMMZD2DTRotavirusEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for rotavirus vaccination" then "Client is not due for rotavirus vaccination Guidance"
    when "Client is due for rotavirus vaccination" then "Client is due for rotavirus vaccination Guidance"
    when "Rotavirus immunization schedule is complete" then "Rotavirus immunization schedule is complete Guidance"
    when "Client is not due for rotavirus vaccination if immunization schedule is not complete." then "Client is not due for rotavirus vaccination if immunization schedule is not complete. Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for rotavirus vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for rotavirus vaccination Case 1":
  Encounter."Client's age is less than 6 weeks"

/*
@output: Client is not due for rotavirus vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for rotavirus vaccination Case 2":
  Encounter."No rotavirus primary series doses were administered"
    and Encounter."Client's age is between 6 weeks and 24 months"
    and Encounter."Live vaccine was administered in the last 4 weeks"

/*
@output: Client is not due for rotavirus vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for rotavirus vaccination Case 3":
  Encounter."One rotavirus primary series dose was administered"
    and Encounter."Client's age is between 6 weeks and 24 months"
    and Encounter."Live vaccine was administered in the last 4 weeks"

/*
@output: Client is not due for rotavirus vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for rotavirus vaccination Case 4":
  Encounter."Two rotavirus primary series doses were administered"
    and Encounter."Client's age is between 6 weeks and 24 months"
    and Encounter."Live vaccines was administered in the last 4 weeks"
    and Encounter."The series administered to the client is a mixed series or a series with unknown vaccine products"

/*
@output: Client is not due for rotavirus vaccination Case 5
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for rotavirus vaccination Case 5":
  Encounter."Two rotavirus primary series doses were administered"
    and Encounter."Client's age is between 6 weeks and 24 months"
    and Encounter."Live vaccine was administered in last 4 weeks"
    and Encounter."The series administered to the client contains the same product"
    and Encounter."The series contain more than two doses"

/*
@output: Client is not due for rotavirus vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for rotavirus vaccination":
  "Client is not due for rotavirus vaccination Case 1"
    or "Client is not due for rotavirus vaccination Case 2"
    or "Client is not due for rotavirus vaccination Case 3"
    or "Client is not due for rotavirus vaccination Case 4"
    or "Client is not due for rotavirus vaccination Case 5"

/*
@output: Client is not due for rotavirus vaccination Guidance
@guidance: Should not vaccinate client with first rotavirus dose as client's age is less than 6 weeks. Check for any other vaccines due and inform the caregiver of when to come back for the first dose.
@guidance: Should not vaccinate client with  first rotavirus dose as live vaccine was administered in last 4 weeks. Check for any vaccines due and inform the caregiver of when to come back for the first dose.
@guidance: Should not vaccinate client with second rotavirus dose as live vaccine was administered in the last 4 weeks. Check for any other vaccines due and inform the caregiver of when to come back for the next dose
@guidance: Should not vaccinate client with third rotavirus dose as live vaccine was administered in the last 4 weeks and series administered to client is a mixed or unknown series. Check for any other vaccines due and inform the caregiver of when to come back for the next dose
@guidance: Should not vaccinate client with third rotavirus dose as live vaccine was administered in the last 4 weeks. Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
*/
define "Client is not due for rotavirus vaccination Guidance":
  case
    when "Client is not due for rotavirus vaccination Case 1" then 'Should not vaccinate client with first rotavirus dose as client\'s age is less than 6 weeks. Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'
    when "Client is not due for rotavirus vaccination Case 2" then 'Should not vaccinate client with  first rotavirus dose as live vaccine was administered in last 4 weeks. Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when "Client is not due for rotavirus vaccination Case 3" then 'Should not vaccinate client with second rotavirus dose as live vaccine was administered in the last 4 weeks. Check for any other vaccines due and inform the caregiver of when to come back for the next dose'
    when "Client is not due for rotavirus vaccination Case 4" then 'Should not vaccinate client with third rotavirus dose as live vaccine was administered in the last 4 weeks and series administered to client is a mixed or unknown series. Check for any other vaccines due and inform the caregiver of when to come back for the next dose'
    when "Client is not due for rotavirus vaccination Case 5" then 'Should not vaccinate client with third rotavirus dose as live vaccine was administered in the last 4 weeks. Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    else ''
  end

/*
@output: Client is due for rotavirus vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for rotavirus vaccination Case 1":
  Encounter."No rotavirus primary series doses were administered"
    and Encounter."Client's age is between 6 weeks and 24 months"
    and Encounter."No live vaccine was administered in the last 4 weeks"

/*
@output: Client is due for rotavirus vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for rotavirus vaccination Case 2":
  Encounter."One rotavirus primary series dose was administered"
    and Encounter."Client's age is between 6 weeks and 24 months"
    and Encounter."No live vaccine was administered in the last 4 weeks"

/*
@output: Client is due for rotavirus vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for rotavirus vaccination Case 3":
  Encounter."Two rotavirus primary series doses were administered"
    and Encounter."Client's age is between 6 weeks and 24 months"
    and Encounter."No live vaccine was administered in the last 4 weeks"
    and Encounter."The series administered to the client is a mixed series or a series with unknown vaccine products"

/*
@output: Client is due for rotavirus vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for rotavirus vaccination Case 4":
  Encounter."Two rotavirus primary series doses were administered"
    and Encounter."Client's age is between 6 weeks and 24 months"
    and Encounter."No live vaccine was administered in last 4 weeks"
    and Encounter."The series administered to the client contains the same product"
    and Encounter."The series contain more than two doses"

/*
@output: Client is due for rotavirus vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for rotavirus vaccination":
  "Client is due for rotavirus vaccination Case 1"
    or "Client is due for rotavirus vaccination Case 2"
    or "Client is due for rotavirus vaccination Case 3"
    or "Client is due for rotavirus vaccination Case 4"

/*
@output: Client is due for rotavirus vaccination Guidance
@guidance: Should vaccinate client with  first rotavirus dose as no rotavirus doses were administered, client's age is within appropriate age range and no live vaccine was administered in last 4 weeks.
Check for contraindications.
@guidance: Should vaccinate client with second rotavirus dose as client's age is within appropriate age range and no live vaccine was administered in the last 4 weeks.
Check for contraindications.
@guidance: Should vaccinate client with third rotavirus dose as no live vaccine was administered in the last 4 weeks and series administered to client is a mixed or unknown series.
Check for contraindications.
@guidance: Should vaccinate client with third rotavirus dose as series contains more than two doses and no live vaccine was administered in the last 4 weeks.
Check for contraindications.
*/
define "Client is due for rotavirus vaccination Guidance":
  case
    when "Client is due for rotavirus vaccination Case 1" then 'Should vaccinate client with  first rotavirus dose as no rotavirus doses were administered, client\'s age is within appropriate age range and no live vaccine was administered in last 4 weeks.
Check for contraindications.'
    when "Client is due for rotavirus vaccination Case 2" then 'Should vaccinate client with second rotavirus dose as client\'s age is within appropriate age range and no live vaccine was administered in the last 4 weeks.
Check for contraindications.'
    when "Client is due for rotavirus vaccination Case 3" then 'Should vaccinate client with third rotavirus dose as no live vaccine was administered in the last 4 weeks and series administered to client is a mixed or unknown series.
Check for contraindications.'
    when "Client is due for rotavirus vaccination Case 4" then 'Should vaccinate client with third rotavirus dose as series contains more than two doses and no live vaccine was administered in the last 4 weeks.
Check for contraindications.'
    else ''
  end

/*
@output: Rotavirus immunization schedule is complete Case 1
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Rotavirus immunization schedule is complete Case 1":
  Encounter."Two rotavirus primary series doses were administered"
    and Encounter."Client's age is between 6 weeks and 24 months"
    and Encounter."The series administered to the client contains the same product"
    and Encounter."The series contain less than or equal to two doses"

/*
@output: Rotavirus immunization schedule is complete Case 2
@pseudocode: '"Immunization recommendation status" = "Complete"
*/
define "Rotavirus immunization schedule is complete Case 2":
  Encounter."Three rotavirus primary series doses were administered"

/*
@output: Rotavirus immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Rotavirus immunization schedule is complete":
  "Rotavirus immunization schedule is complete Case 1"
    or "Rotavirus immunization schedule is complete Case 2"

/*
@output: Rotavirus immunization schedule is complete Guidance
@guidance: Rotavirus immunization schedule is complete. Two rotavirus doses were administered. Check for any other vaccines due.
@guidance: Rotavirus immunization schedule is complete. Three rotavirus primary series doses were administered. Check for any other vaccines due.
*/
define "Rotavirus immunization schedule is complete Guidance":
  case
    when "Rotavirus immunization schedule is complete Case 1" then 'Rotavirus immunization schedule is complete. Two rotavirus doses were administered. Check for any other vaccines due.'
    when "Rotavirus immunization schedule is complete Case 2" then 'Rotavirus immunization schedule is complete. Three rotavirus primary series doses were administered. Check for any other vaccines due.'
    else ''
  end

/*
@output: Client is not due for rotavirus vaccination if immunization schedule is not complete.
@pseudocode: "Immunization recommendation status" = "Not due" IF current "Immunization recommendation status" ≠ "Complete"
*/
define "Client is not due for rotavirus vaccination if immunization schedule is not complete.":
  Encounter."Client's age is more than 24 months"

/*
@output: Client is not due for rotavirus vaccination if immunization schedule is not complete. Guidance
@guidance: Should not vaccinate client with rotavirus dose as client's age is more than 24 months. Check for any other vaccines due.
*/
define "Client is not due for rotavirus vaccination if immunization schedule is not complete. Guidance":
  'Should not vaccinate client with rotavirus dose as client\'s age is more than 24 months. Check for any other vaccines due.'

define "test1":
  Encounter."The series administered to the client contains the same product"

define "test2":
  singleton from ((First(Encounter."Rotavirus Doses Administered to Patient".getDose('1')).brand()).coding).display

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '07.1' then "Client is not due for rotavirus vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first rotavirus dose as client\'s age is less than 6 weeks. Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '08.012' then "Client is due for rotavirus vaccination Case 1" and "Guidance" = 'Should vaccinate client with  first rotavirus dose as no rotavirus doses were administered, client\'s age is within appropriate age range and no live vaccine was administered in last 4 weeks.
Check for contraindications.'
    when Patient.id = '09.012' then "Client is not due for rotavirus vaccination Case 2" and "Guidance" = 'Should not vaccinate client with  first rotavirus dose as live vaccine was administered in last 4 weeks. Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '10.012' then "Client is due for rotavirus vaccination Case 2" and "Guidance" = 'Should vaccinate client with second rotavirus dose as client\'s age is within appropriate age range and no live vaccine was administered in the last 4 weeks.
Check for contraindications.'
    when Patient.id = '11.012' then "Client is not due for rotavirus vaccination Case 3" and "Guidance" = 'Should not vaccinate client with second rotavirus dose as live vaccine was administered in the last 4 weeks. Check for any other vaccines due and inform the caregiver of when to come back for the next dose'
    when Patient.id = '12.0123' then "Client is due for rotavirus vaccination Case 3" and "Guidance" = 'Should vaccinate client with third rotavirus dose as no live vaccine was administered in the last 4 weeks and series administered to client is a mixed or unknown series.
Check for contraindications.'
    when Patient.id = '13.0123' then "Client is not due for rotavirus vaccination Case 4" and "Guidance" = 'Should not vaccinate client with third rotavirus dose as live vaccine was administered in the last 4 weeks and series administered to client is a mixed or unknown series. Check for any other vaccines due and inform the caregiver of when to come back for the next dose'
    when Patient.id = '14.01234' then "Client is due for rotavirus vaccination Case 4" and "Guidance" = 'Should vaccinate client with third rotavirus dose as series contains more than two doses and no live vaccine was administered in the last 4 weeks.
Check for contraindications.'
    when Patient.id = '15.01234' then "Client is not due for rotavirus vaccination Case 5" and "Guidance" = 'Should not vaccinate client with third rotavirus dose as live vaccine was administered in the last 4 weeks. Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '16.0134' then "Rotavirus immunization schedule is complete Case 1" and "Guidance" = 'Rotavirus immunization schedule is complete. Two rotavirus doses were administered. Check for any other vaccines due.'
    when Patient.id = '17.0' then "Rotavirus immunization schedule is complete Case 2" and "Guidance" = 'Rotavirus immunization schedule is complete. Three rotavirus primary series doses were administered. Check for any other vaccines due.'
    when Patient.id = '18.1' then "Client is not due for rotavirus vaccination if immunization schedule is not complete." and "Guidance" = 'Should not vaccinate client with rotavirus dose as client\'s age is more than 24 months. Check for any other vaccines due.'
    else 'No test case set'
  end
