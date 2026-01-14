Instance: Example.IMMZ.C.QuestionnaireResponse.1
InstanceOf: QuestionnaireResponse
Title: "Example QuestionnaireResponse for Client Registration"
Description: """
Example QuestionnaireResponse for
IMMZ.C4.Create client record
OR
IMMZ.C5.3.Update client details
"""
Usage: #example

* status = #completed
* authored = "2024-12-13T19:20:20.913Z"
* questionnaire = Canonical(QIMMZC4)

* insert QRItem( String, uniqueIdentifier, "12345-ZA" )
* insert QRItem( String, name, "Thabo Mbulelo Mbeki" )
* insert QRItem( String, firstName, "Thabo Mbulelo" )
* insert QRItem( String, familyName, "Mbeki" )
* insert QRItem( Coding, sex, IMMZ.C#DE6 "Male" )
* insert QRItem( Date, dateOfBirth, "2020-06-18" )
* insert QRItem( String, age, "4 years")
* item[+]
  * linkId = "caregiversMultiple"
  * insert QRItem( String, caregiversFullName, "Zanele Mbeki" )
  * insert QRItem( String, caregiversFirstName, "Zanele" )
  * insert QRItem( String, caregiversFamilyName, "Mbeki" )
* insert QRItem( String, contactPhoneNumber, "+27 21 465 8000" )
* insert QRItem( String, address, [["123 Main Street, Cape Town, Western Cape, 8001, ZA"]] )

