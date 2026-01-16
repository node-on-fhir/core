Instance:   IMMZ.C.Patient.2
InstanceOf: IMMZPatient
Title:	    "Zanele Mbeki"
Description:  "Example of a patient: Zanele Mbeki."
Usage:      #example

* identifier.value = "12345-ZA"
* name[immzName]
  * text = "Zanele Mbeki"
  * family = "Mbeki"
  * given[+] = "Zanele"
* gender = #male
* birthDate = "1998-09-22"
* address.text = "123 Main Street, Cape Town, Western Cape, 8001, ZA"
* telecom[immzPhone]
  * system = #phone
  * value = "+27 21 465 8000"
