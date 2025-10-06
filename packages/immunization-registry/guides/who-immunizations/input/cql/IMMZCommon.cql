library IMMZCommon

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'
include WHOCommon called WC

/**
 * @description Fetches a singleton protocol applied from an immunization
 * @comment The protocol list from the immunization
 */
define function Only(protocols List<FHIR.Immunization.ProtocolApplied>):
  singleton from protocols

/**
 * @description Fetches a singleton protocol applied from an immunization
 * @comment The protocol list from the immunization
 */
define fluent function only(protocols List<FHIR.Immunization.ProtocolApplied>):
  singleton from protocols

/**
 * @description Takes the date choice of a date/string choice (for Immunization date)
 */
define function ToDate(choice Choice<FHIR.date, FHIR.string>):
  case
	  when choice is FHIR.date then
    	choice as FHIR.date
		else
      Message(null as FHIR.date, true, '1', 'Error', 'Cannot compute a date from a String value')
	end

/**
 * @description Takes the date choice of a date/string choice (for Immunization date)
 */
define function ToDateTime(choice Choice<FHIR.dateTime, FHIR.string>):
  case
	  when choice is FHIR.dateTime then
    	choice as FHIR.dateTime
		else
      Message(null as FHIR.dateTime, true, '1', 'Error', 'Cannot compute a date from a String value')
	end


/**
 * @description Takes a choice of FHIR.string and FHIR.positiveInt and ensures the result is a FHIR.positiveInt
 */
define function ToPositiveInt(choice Choice<FHIR.positiveInt, FHIR.string>):
  case
	  when choice is FHIR.positiveInt then
    	choice as FHIR.positiveInt
		else
      Message(null as FHIR.positiveInt, true, '1', 'Error', 'Cannot compute a positive from a String value') // TODO: I'm sure that this is supported somehow?
	end


/**
 * @description Takes a choice between a Medication and a CodeableConcept and returns just the code of the medication
 */
define function ExtractMedicationCode(choice Choice<FHIR.CodeableConcept, FHIR.Reference>):
  case
	  when choice is FHIR.CodeableConcept then
    	choice as FHIR.CodeableConcept
    when choice is FHIR.Reference then
      First([Medication] M 
        where M.id = Last(Split(choice.reference, '/'))
        return M.code as FHIR.CodeableConcept)
		else
      Message(null as FHIR.CodeableConcept, true, '1', 'Error', 'Cannot compute a medication code') // TODO: I'm sure that this is supported somehow?
	end


/**
 * @description Takes a choice between a Medication and a CodeableConcept and returns just the code of the medication
 */
define function ExtractMedicationInitiationDate(choice Choice<FHIR.dateTime, FHIR.Period>):
  case
	  when choice is FHIR.Period then
    	start of (choice as FHIR.Period)
    when choice is FHIR.dateTime then
      choice as FHIR.dateTime
		else
      Message(null as FHIR.dateTime, true, '1', 'Error', 'Cannot compute medication treatment initiation date') // TODO: I'm sure that this is supported somehow?
	end

/**
 * @description: Gets the type of antigen dose extension value from an Immunization
 */
define fluent function typeOfDose(immz Immunization):
  (First(
    immz.extension E where E.url = 'http://smart.who.int/immunizations/StructureDefinition/IMMZTypeOfDose'
  )).value as FHIR.CodeableConcept

/**
 * @description: Gets the type of antigen dose extension value from an Immunization
 */
define fluent function brand(immz Immunization):
  (First(
    immz.extension E where E.url = 'http://smart.who.int/immunizations/StructureDefinition/IMMZVaccineBrand'
  )).value as FHIR.CodeableConcept

/**
 * @description: Gets a given immunization from a list that matches the dose number
 */
define fluent function getDose(immunizations List<Immunization>, doseNumber String):
  immunizations I where
    exists( I.protocolApplied pa where pa.doseNumber = doseNumber )

/**
 * @description: Gets a given immunization from a list that matches the dose number
 */
define fluent function getDose(immunization Immunization, doseNumber String):
  immunization I where
    exists( I.protocolApplied pa where pa.doseNumber = doseNumber )

/**
 * @description: Gets immunizations on or before a date
 */
define fluent function onOrBefore(immunizations List<Immunization>, beforeDate Date):
  immunizations I where
    I.occurrence.toInterval() same day or before beforeDate

/**
 * @description: Gets the series doses from an immunization
 */
define fluent function seriesDoses(immunization Immunization):
  First(immunization.protocolApplied pa where pa.seriesDoses is not null).seriesDoses

/**
 * @description: Gets observation from an encounter or on or before a date
 */
define fluent function encounterOrOnBefore(observations List<Observation>, EncounterId String, beforeDate Date):
  observations O where
    (O.encounter.references(EncounterId)
      or O.effective.toInterval() starts same day or before beforeDate)

/**
 * @description: Gets the doses from the primary series
 */
define fluent function seriesPrimary(immunizations List<Immunization>):
  immunizations I where
    exists( I.protocolApplied pa where pa.series = 'Primary series' )

/**
 * @description: Gets the doses from the dose 0 series
 */
define fluent function seriesDose0(immunizations List<Immunization>):
  immunizations I where
    exists( I.protocolApplied pa where pa.series = 'Dose 0' )

/**
 * @description: Gets the doses from the Booster series
 */
define fluent function seriesBooster(immunizations List<Immunization>):
  immunizations I where
    exists( I.protocolApplied pa where pa.series = 'Booster dose' )

/**
 * @description: Gets the doses from the Supplementary series
 */
define fluent function seriesSupplementary(immunizations List<Immunization>):
  immunizations I where
    exists( I.protocolApplied pa where pa.series = 'Supplementary dose' )

/**
 * @description: Sorts a list and returns the requested index
 */
define fluent function sortedIndex(immunizations List<Immunization>, idx Integer):
  if exists( immunizations ) then
    (immunizations I sort by start of occurrence.toInterval())[idx]
  else null
