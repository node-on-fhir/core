
/*
 * Library: IMMZD5DTPolioCILogic (IMMZ.D5.DT.Polio contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTPolioCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTPolioEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
@dynamicValue: Draft Medication Request ID for bOPV dose
*/
define "Draft Medication Request ID for bOPV dose":
	First(Encounter."Draft Medication Request for bOPV dose").id

/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Poliovirus vaccination could be contraindicated. Clinical judgement required" then "Poliovirus vaccination could be contraindicated. Clinical judgement required Guidance"
    when "Poliovirus vaccination with bOPV is contraindicated" then "Poliovirus vaccination with bOPV is contraindicated Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Poliovirus vaccination could be contraindicated. Clinical judgement required
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Poliovirus vaccination could be contraindicated. Clinical judgement required":
  Encounter."The client has history of severe allergic reactions"

/*
@output: Poliovirus vaccination could be contraindicated. Clinical judgement required Guidance
@guidance: Do not vaccinate client with inactivated polio vaccine (IPV) if client has had a previous severe reaction or known allergy to streptomycin, neomycin or polymyxin B.
Do not vaccinate client with oral polio vaccine (OPV) if client has had a allergic reaction to OPV or to the trace antibiotics contained.
*/
define "Poliovirus vaccination could be contraindicated. Clinical judgement required Guidance":
  'Do not vaccinate client with inactivated polio vaccine (IPV) if client has had a previous severe reaction or known allergy to streptomycin, neomycin or polymyxin B.
Do not vaccinate client with oral polio vaccine (OPV) if client has had a allergic reaction to OPV or to the trace antibiotics contained.'

/*
@output: Poliovirus vaccination with bOPV is contraindicated Case 1
@pseudocode: Clinical judgement is required if vaccination with IPV is considered
*/
define "Poliovirus vaccination with bOPV is contraindicated Case 1":
  Encounter."The client is severely immunocompromised"

/*
@output: Poliovirus vaccination with bOPV is contraindicated Case 2
@pseudocode: Clinical judgement is required if vaccination with IPV is considered
*/
define "Poliovirus vaccination with bOPV is contraindicated Case 2":
  Encounter."The client has immunodeficiency syndromes"

/*
@output: Poliovirus vaccination with bOPV is contraindicated
@pseudocode: Clinical judgement is required if vaccination with IPV is considered
*/
define "Poliovirus vaccination with bOPV is contraindicated":
  "Poliovirus vaccination with bOPV is contraindicated Case 1"
    or "Poliovirus vaccination with bOPV is contraindicated Case 2"

/*
@output: Poliovirus vaccination with bOPV is contraindicated Guidance
@guidance: For bOPV dose, do not vaccinate  client for bOPV dose as bOPV vaccination is contranindicated in severely immunocompromised clients. 
Check if vaccination with IPV is appropriate for the client, consider risks of vaccination and make a clinical judgement.
@guidance: For bOPV dose, do not vaccinate  client for bOPV dose as bOPV vaccination is contranindicated in clients with immunodeficiency disorders.
Check if vaccination with IPV is appropriate for the client, consider risks of vaccination and make a clinical judgement.
*/
define "Poliovirus vaccination with bOPV is contraindicated Guidance":
  case
    when "Poliovirus vaccination with bOPV is contraindicated Case 1" then 'For bOPV dose, do not vaccinate  client for bOPV dose as bOPV vaccination is contranindicated in severely immunocompromised clients. 
Check if vaccination with IPV is appropriate for the client, consider risks of vaccination and make a clinical judgement.'
    when "Poliovirus vaccination with bOPV is contraindicated Case 2" then 'For bOPV dose, do not vaccinate  client for bOPV dose as bOPV vaccination is contranindicated in clients with immunodeficiency disorders.
Check if vaccination with IPV is appropriate for the client, consider risks of vaccination and make a clinical judgement.'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '87.CI167' then "Poliovirus vaccination could be contraindicated. Clinical judgement required" and "Guidance" = 'Do not vaccinate client with inactivated polio vaccine (IPV) if client has had a previous severe reaction or known allergy to streptomycin, neomycin or polymyxin B.
Do not vaccinate client with oral polio vaccine (OPV) if client has had a allergic reaction to OPV or to the trace antibiotics contained.'
    when Patient.id = '88.CI200' then "Poliovirus vaccination with bOPV is contraindicated Case 1" and "Guidance" = 'For bOPV dose, do not vaccinate  client for bOPV dose as bOPV vaccination is contranindicated in severely immunocompromised clients. 
Check if vaccination with IPV is appropriate for the client, consider risks of vaccination and make a clinical judgement.'
    when Patient.id = '89.CI187' then "Poliovirus vaccination with bOPV is contraindicated Case 2" and "Guidance" = 'For bOPV dose, do not vaccinate  client for bOPV dose as bOPV vaccination is contranindicated in clients with immunodeficiency disorders.
Check if vaccination with IPV is appropriate for the client, consider risks of vaccination and make a clinical judgement.'
    else 'No test case set'
  end
