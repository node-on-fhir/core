Instance: Example.IMMZ.D13.QuestionnaireResponse.Measles
InstanceOf: QuestionnaireResponse
Title: "Example QuestionnaireReponse for Update Client History for Measles"
Description: """
Example QuestionnaireReponse for IMMZ.D13.Update client record.
For patient receiving Measles vaccine.
"""
Usage: #example
* status = #completed
* authored = "2025-01-30T19:20:20.913Z"
* questionnaire = Canonical(QIMMZD13)
* subject = Reference(IMMZ.C.Patient.1)

* insert QRItem( Coding, typeOfDose, IMMZ.D#DE259 "Primary series" )
* insert QRItem( Boolean, completedThePrimaryVaccinationSeries, false )
* insert QRItem( Boolean, completedTheBoosterSeries, false )
* insert QRItem( Coding, hivStatus, IMMZ.D#DE205 "HIV-positive" )
* insert QRItem( Coding, vaccineType, IMMZ.Z#DE9 "Measles-containing vaccines" )
* insert QRItem( DateTime, dateAndTimeOfVaccination, "2021-04-01T04:00:00Z")
* insert QRItem( Date, contactDate, "2021-04-01" )
* insert QRItem( Integer, doseNumber, 1 )
* insert QRItem( Coding, immunizationEventStatus, IMMZ.D#DE2 "Completed" )
* insert QRItem( Coding, vaccineBrand, IMMZ.Ex#brand "Example Brand" )
* insert QRItem( Boolean, liveVaccine, true )
* insert QRItem( Coding, countryOfVaccination, urn:iso:std:iso:3166#ZAF "South Africa" )
* insert QRItem( Coding, administrativeArea, urn:iso:std:iso:3166-2#ZA-WC "Western Cape" )
* insert QRItem( Coding, vaccineManufacturer, IMMZ.Ex#manufacturer "Example Manufacturer" )
* insert QRItem( String, vaccineBatchNumber, "454981" )
* insert QRItem( Coding, vaccineMarketAuthorizationHolder, IMMZ.Ex#marketauth "Example Market Authorization Holder" )
* insert QRItem( Date, expirationDate, "2024-01-01" )
* insert QRItem( Quantity, doseQuantity, 0.5 'mL')
* insert QRItem( String, healthWorkerIdentifier, "8723487" )
* insert QRItem( Decimal, totalDosesInSeries, 2 )
* insert QRItem( Coding, diseaseTargeted, IMMZ.D#DE129 "Measles" )
* insert QRItem( Date, dueDateOfNextDose, "2021-10-01" )
