Profile: MessageOrganization
Parent: USCoreOrganization
Id: icsr-messageorganization
Title: "MessageHeader Organization"
Description: "The fields needed to specify the sender or receiver of an ICSR Report."

* extension contains DepartmentName named departmentName 0..1
* type 0..1 MS
* telecom.system 1..1 MS
* telecom.value 1..1 MS
* telecom ^slicing.discriminator.type = #value
* telecom ^slicing.discriminator.path = "system"
* telecom ^slicing.rules = #open
* telecom ^slicing.description = "Slice based on the different telecom types (systems)"
* telecom contains Phone 0..1 and Fax 0..1 and Email 0..1
* telecom[Phone].system = #phone (exactly)
* telecom[Fax].system = #fax (exactly)
* telecom[Email].system = #email (exactly)
* address 0..*
* address.line 1..4
* address.city 1..1
* address.state 1..1
* address.postalCode 1..1
* address.country 1..1
* contact 0..* MS
* contact.name 1..1 MS

//Definition of DepartmentName extension
Extension: DepartmentName
Id: icsr-ext-departmentname
Description: "An organization's department name"
* ^context.type = #element
* ^context.expression = "Organization"
* value[x] only string

//Sender Organization example
Instance: SenderOrganization
InstanceOf: MessageOrganization
Title: "Sample Sender Organization"
Description: "An organization that is sending ICSR submissions."
* extension[departmentName].valueString = "sender department"
* type = OrgType#1 "Pharmaceutical Company"
* active = true
* name = "sender organization"
* telecom[Phone].value = "+01 123 456 78"
* telecom[Fax].value = "+01 123 456 89"
* telecom[Email].value = "email@city.us"
* address.line = "street"
* address.city = "city"
* address.state = "state"
* address.postalCode = "postcode"
* address.country = "US"
* contact.name.prefix = "sender title"
* contact.name.given = "sender gname"
* contact.name.family = "sender fname"

//Sender Organization example
Instance: ReceiverOrganization
InstanceOf: MessageOrganization
Title: "Receiver Organization for FAERS"
Description: "How to represent FDA in ICSR FAERS submissions."
* extension[departmentName].valueString = "Office of Surveillance and Epidemiology"
* type = OrgType#2 "Regulatory Authority"
* active = true
* name = "FDA"
* telecom[Email].value = "faersedub@fda.hhs.gov"
* address.line = "10903 New Hampshire Avenue"
* address.city = "Silver Spring"
* address.state = "MD"
* address.postalCode = "20993"
* address.country = "US"
* contact.name.given = "FAERS"
