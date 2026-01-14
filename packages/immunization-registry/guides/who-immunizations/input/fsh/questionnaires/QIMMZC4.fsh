Instance:     QIMMZC4
InstanceOf:   sdc-questionnaire-extr-smap
Title:        "IMMZ.C4.Create client record"
Description:  "Questionnaire for IMMZ.C4.Create client record"
Usage: #definition

* version = "0.2.0"
* status = #draft
* subjectType = #Patient
* language = #en
* contained[+] = IMMZ.C.DE5
* extension[+].url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-targetStructureMap"
* extension[=].valueCanonical = "http://smart.who.int/immunizations/StructureMap/IMMZ.C4.QRToPatient"

* insert Question(uniqueIdentifier, Unique identifier, string, true, false)
* item[=]
  * code[+] = IMMZ.C#DE1
* insert Question(name, Name, string, true, false)
* item[=]
  * code[+] = IMMZ.C#DE2
  * code[+] = $LNC#54125-0 "Patient name"
  * code[+] = $SCT#371484003 "Patient name (observable entity)"
* insert Question(firstName, First name, string, false, false)
* item[=]
  * code[+] = IMMZ.C#DE3
  * code[+] = $LNC#45392-8 "First name"
  * code[+] = $SCT#184095009 "Patient forename (observable entity)"
* insert Question(familyName, Family name, string, false, false)
* item[=]
  * code[+] = IMMZ.C#DE4
  * code[+] = $LNC#45394-4 "Last name"
  * code[+] = $SCT#184096005 "Patient surname (observable entity)"
* insert Question(sex, Sex, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.C.DE5)
  * code[+] = IMMZ.C#DE5
  * code[+] = $LNC#46098-0 "Sex"
  * code[+] = $SCT#184100006 "Patient sex (observable entity)"
* insert Question(dateOfBirth , Date of birth, date, true, false)
* item[=]
  * code[+] = IMMZ.C#DE10
  * code[+] = $LNC#21112-8 "Birth date"
  * code[+] = $SCT#184099003 "Date of birth (observable entity)"
* insert Question(age, Age, string, false, false)
* item[=]
  * code[+] = IMMZ.C#DE13
  * code[+] = $LNC#63900-5 "Current age or age at death"
* insert Question(caregiversMultiple, [[Caregivers (multiple)]], group, false, true)
* item[=]
  * code[+] = IMMZ.C#DE14
  * code[+] = $SCT#184140000 "Caregiver details (observable entity)"
  * insert Question(caregiversFullName, Caregiver's full name, string, false, false)
  * item[=]
    * code[+] = IMMZ.C#DE15
    * code[+] = $SCT#184140000 "Caregiver details (observable entity)"
  * insert Question(caregiversFirstName, Caregiver's first name, string, false, false)
  * item[=]
    * code[+] = IMMZ.C#DE16
    * code[+] = $LNC#45392-8 "First name"
  * insert Question(caregiversFamilyName, Caregiver's family name, string, false, false)
  * item[=]
    * code[+] = IMMZ.C#DE17
    * code[+] = $LNC#45394-4 "Last name"
* insert Question(contactPhoneNumber, Contact phone number, string, true, false)
* item[=]
  * code[+] = IMMZ.C#DE18
  * code[+] = $LNC#42077-8 "Patient Phone number"
  * code[+] = $SCT#184103008 "Patient telephone number (observable entity)"
* insert Question(address, Address, string, true, false)
* item[=]
  * code[+] = IMMZ.C#DE19
  * code[+] = $LNC#56799-0 "Address"
  * code[+] = $SCT#184097001 "Patient address (observable entity)"
