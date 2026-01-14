Instance: Example.IMMZ.D13.QuestionnaireResponse.BCG
InstanceOf: QuestionnaireResponse
Title: "Example QuestionnaireReponse for Update Client History for BCG"
Description: """
Example QuestionnaireReponse for IMMZ.D13.Update client record.
For patient receiving BCG vaccine.
"""
Usage: #example
* status = #completed
* authored = "2025-01-30T19:20:20.913Z"
* questionnaire = Canonical(QIMMZD13)
* subject = Reference(IMMZ.C.Patient.1)

* insert QRItem( Coding, typeOfDose, IMMZ.D#DE259 "Primary series" )
* insert QRItem( Boolean, completedThePrimaryVaccinationSeries, true )
* insert QRItem( Boolean, completedTheBoosterSeries, false )
* insert QRItem( Date, dateWhenPrimaryVaccinationSeriesWasCompleted, "2020-07-01" )
* insert QRItem( Coding, hivStatus, IMMZ.D#DE206 "HIV-negative" )
* insert QRItem( Coding, vaccineType, IMMZ.Z#DE1 "BCG vaccines" )
* insert QRItem( DateTime, dateAndTimeOfVaccination, "2020-07-01T04:00:00Z")
* insert QRItem( Date, contactDate, "2020-07-01" )
* insert QRItem( Integer, doseNumber, 1 )
* insert QRItem( Coding, immunizationEventStatus, IMMZ.D#DE2 "Completed" )
* insert QRItem( Coding, vaccineBrand, IMMZ.Ex#brand "Example Brand" )
* insert QRItem( Boolean, liveVaccine, true )
* insert QRItem( Coding, countryOfVaccination, urn:iso:std:iso:3166#ZAF "South Africa" )
* insert QRItem( Coding, administrativeArea, urn:iso:std:iso:3166-2#ZA-WC "Western Cape" )
* insert QRItem( Coding, vaccineManufacturer, IMMZ.Ex#manufacturer "Example Manufacturer" )
* insert QRItem( String, vaccineBatchNumber, "148734" )
* insert QRItem( Coding, vaccineMarketAuthorizationHolder, IMMZ.Ex#marketauth "Example Market Authorization Holder" )
* insert QRItem( Date, expirationDate, "2022-01-01" )
* insert QRItem( Quantity, doseQuantity, 0.05 'mL')
* insert QRItem( String, healthWorkerIdentifier, "8723487" )
* insert QRItem( Decimal, totalDosesInSeries, 1 )
* insert QRItem( Coding, diseaseTargeted, IMMZ.D#DE139 "Tuberculosis" )
