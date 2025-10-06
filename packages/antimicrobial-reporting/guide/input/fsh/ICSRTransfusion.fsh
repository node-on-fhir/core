Profile: ICSRTransfusion
Parent: USCoreProcedure
Id: icsr-transfusion
Title: "ICSR Transfusion"
Description: "The common fields needed to represent a transfusion."
* status MS
* code 1..1 MS
* code from https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.74/definition (extensible)
* subject MS 
* subject only Reference(ICSRPatient)
* reasonCode MS
* extension contains UsedProductAmount named usedProductAmount 0..1 MS
* usedReference.extension contains UsedProduct named usedProduct 0..1 MS

Profile: ICSRBloodProduct
Parent: BiologicallyDerivedProduct
Id: icsr-bloodproduct
Title: "ICSR Blood Product"
Description: "The common fields needed to represent a blood product used in a transfusion."
* productCategory 1..1 MS
* productCategory = #cells (exactly)
* productCode 1..1 MS
* productCode from ISBTBloodProductCodeVS (extensible)
* collection MS
* collection.extension contains DonationIdentificationNumber named donationIdentificationNumber 0..1 MS
* processing MS
* processing.procedure MS

Profile: ICSRConvalescentPlasma
Parent: BiologicallyDerivedProduct
Id: icsr-convalescentplasma
Title: "ICSR Convalescent Plasma"
Description: "The common fields needed to represent convalescent plasma used in a transfusion."
* productCategory 1..1 MS
* productCategory = #fluid (exactly)
* productCode 1..1 MS
* productCode from ISBTConvalescentPlasmaCodeVS (extensible)
* collection MS
* collection.extension contains DonationIdentificationNumber named donationIdentificationNumber 0..1 MS
* processing MS
* processing.procedure MS

Extension: UsedProduct
Id: icsr-ext-usedproduct
Description: "Include Biologically Derived Product as something that is used in the procedure"
* ^context.type = #element
* ^context.expression = "Procedure.usedReference"
* value[x] 1..1 MS
* value[x] only Reference(ICSRBloodProduct or ICSRConvalescentPlasma)

Extension: UsedProductAmount
Id: icsr-ext-usedproductamount
Description: "Indicates the amount of product (listed in usedReference or usedCode) that was used in the procedure"
* ^context.type = #element
* ^context.expression = "Procedure"
* value[x] 1..1 MS
* value[x] only Quantity

Extension: DonationIdentificationNumber
Id: icsr-ext-donationIdentificationNumber
Description: "Indicates the identifier for a donation"
* ^context.type = #element
* ^context.expression = "BiologicallyDerivedProduct.collection"
* value[x] 1..1 MS
* value[x] only Identifier
