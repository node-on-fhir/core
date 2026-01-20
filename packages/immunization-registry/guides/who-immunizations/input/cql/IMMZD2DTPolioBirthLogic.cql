
/*
 * Library: IMMZD2DTPolioBirthLogic (IMMZ.D2.DT.Polio.Birth dose)
 * Rule: Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
 * Decision Table: Birth dose administration as part of "bivalent oral polio vaccine (bOPV) plus inactivated polio vaccine (IPV)" schedule (in countries that are poliomyelitis (polio)-endemic countries or at high risk of importation and subsequent spread of polio that follow the combined bOPV–IPV schedule)
 * Trigger: IMMZ.D2  Determine required vaccination(s) if any
 */
library IMMZD2DTPolioBirthLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTPolioEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is due for the bOPV birth dose" then "Client is due for the bOPV birth dose Guidance"
    when "Client is not due for the bOPV birth dose" then "Client is not due for the bOPV birth dose Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is due for the bOPV birth dose
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV")
*/
define "Client is due for the bOPV birth dose":
  Encounter."bOPV birth dose (a zero dose) was not administered"
    and Encounter."Client's age is less than 1 week"

/*
@output: Client is due for the bOPV birth dose Guidance
@guidance: Should vaccinate client with bOPV birth dose (a zero dose) as poliovirus birth dose was not administered and client's age is less than 1 week. Check for contraindications.
*/
define "Client is due for the bOPV birth dose Guidance":
  'Should vaccinate client with bOPV birth dose (a zero dose) as poliovirus birth dose was not administered and client\'s age is less than 1 week. Check for contraindications.'

/*
@output: Client is not due for the bOPV birth dose Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for the bOPV birth dose Case 1":
  Encounter."bOPV birth dose (a zero dose) was not administered"
    and Encounter."Client's age is more than or equal to 1 week"

/*
@output: Client is not due for the bOPV birth dose Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for the bOPV birth dose Case 2":
  Encounter."bOPV birth dose (a zero dose) was administered"

/*
@output: Client is not due for the bOPV birth dose
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for the bOPV birth dose":
  "Client is not due for the bOPV birth dose Case 1"
    or "Client is not due for the bOPV birth dose Case 2"

/*
@output: Client is not due for the bOPV birth dose Guidance
@guidance: Should not vaccinate client with bOPV birth dose (a zero dose) as client's age is more than or equal to 1 week. Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Poliovirus birth dose was already administered. Check poliovirus immunization schedule.
*/
define "Client is not due for the bOPV birth dose Guidance":
  case
    when "Client is not due for the bOPV birth dose Case 1" then 'Should not vaccinate client with bOPV birth dose (a zero dose) as client\'s age is more than or equal to 1 week. Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for the bOPV birth dose Case 2" then 'Poliovirus birth dose was already administered. Check poliovirus immunization schedule.'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.Alt1w' then "Client is due for the bOPV birth dose" and "Guidance" = 'Should vaccinate client with bOPV birth dose (a zero dose) as poliovirus birth dose was not administered and client\'s age is less than 1 week. Check for contraindications.'
    when Patient.id = '09.Agt1w' then "Client is not due for the bOPV birth dose Case 1" and "Guidance" = 'Should not vaccinate client with bOPV birth dose (a zero dose) as client\'s age is more than or equal to 1 week. Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '10.D1' then "Client is not due for the bOPV birth dose Case 2" and "Guidance" = 'Poliovirus birth dose was already administered. Check poliovirus immunization schedule.'
    else 'No test case set'
  end
