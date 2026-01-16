Instance:   IMMZ.C.Patient.1
InstanceOf: IMMZPatient
Title:	    "Thabo Mbulelo Mbeki"
Description:  "Example of a patient: Thabo Mbulelo Mbeki."
Usage:      #example

* identifier.value = "12345-ZA"
* name[immzName]
  * text = "Thabo Mbulelo Mbeki"
  * family = "Mbeki"
  * given[+] = "Thabo"
  * given[+] = "Mbulelo"
* gender = #male
* birthDate = "2020-06-18"
* address.text = "123 Main Street, Cape Town, Western Cape, 8001, ZA"
* telecom[immzPhone]
  * system = #phone
  * value = "+27 21 465 8000"
