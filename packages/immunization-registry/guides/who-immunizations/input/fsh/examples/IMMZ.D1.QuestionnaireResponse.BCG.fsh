Instance: Example.IMMZ.D1.QuestionnaireResponse.BCG
InstanceOf: QuestionnaireResponse
Title: "Example QuestionnaireReponse for Capture Client History for BCG"
Description: """
Example QuestionnaireReponse for IMMZ.D1.Capture or update client history.
For patient receiving BCG vaccine.
"""
Usage: #example
* status = #completed
* authored = "2025-01-13T19:20:20.913Z"
* questionnaire = Canonical(QIMMZD1)
* subject = Reference(IMMZ.C.Patient.1)

* insert QRItem( Coding, typeOfDose, IMMZ.D#DE259 "Primary series" )
* insert QRItem( Boolean, completedThePrimaryVaccinationSeries, true )
* insert QRItem( Boolean, completedTheBoosterSeries, false )
* insert QRItem( Date, dateWhenPrimaryVaccinationSeriesWasCompleted, "2020-07-01" )
* insert QRItem( Coding, hivStatus, IMMZ.D#DE206 "HIV-negative" )
* insert QRItem( Boolean, pretermBirth, false )
* insert QRItem( Boolean, immunocompromised, false )
* insert QRItem( Coding, typeOfTbInfectionTestPerformed, IMMZ.D#DE244 "IGRA" ) //
* insert QRItem( Coding, tbInfectionTestResult, IMMZ.D#DE248 "Negative" ) //
* insert QRItem( Boolean, immunologicallyStable, true ) //
* insert QRItem( Boolean, clinicallyWell, true ) //
* insert QRItem( Decimal, birthWeightInGrams, 3255.7 ) //
* insert QRItem( Coding, vaccineType, IMMZ.Z#DE1 "BCG vaccines" )
* insert QRItem( DateTime, dateAndTimeOfVaccination, "2020-07-01T04:00:00Z")
* insert QRItem( Date, contactDate, "2020-07-01" )
* insert QRItem( Integer, doseNumber, 1 )
