// packages/vital-signs/lib/valueSets/units/LengthUnits.js

export const LengthUnits = {
  resourceType: "ValueSet",
  id: "length-units",
  url: "http://hl7.org/fhir/ValueSet/ucum-vitals-length",
  version: "1.0.0",
  name: "LengthUnits",
  title: "Length Units",
  status: "active",
  experimental: false,
  date: "2025-01-01",
  publisher: "HL7 International",
  description: "Common UCUM units for measuring length/height in vital signs",
  compose: {
    include: [{
      system: "http://unitsofmeasure.org",
      concept: [
        {
          code: "cm",
          display: "centimeter"
        },
        {
          code: "m",
          display: "meter"
        },
        {
          code: "[in_i]",
          display: "inch (international)"
        },
        {
          code: "[ft_i]",
          display: "foot (international)"
        },
        {
          code: "mm",
          display: "millimeter"
        }
      ]
    }]
  }
};

export default LengthUnits;