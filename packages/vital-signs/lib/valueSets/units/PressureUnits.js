// packages/vital-signs/lib/valueSets/units/PressureUnits.js

export const PressureUnits = {
  resourceType: "ValueSet",
  id: "pressure-units",
  url: "http://hl7.org/fhir/ValueSet/ucum-vitals-pressure",
  version: "1.0.0",
  name: "PressureUnits",
  title: "Pressure Units",
  status: "active",
  experimental: false,
  date: "2025-01-01",
  publisher: "HL7 International",
  description: "Common UCUM units for measuring blood pressure and other pressure measurements in vital signs",
  compose: {
    include: [{
      system: "http://unitsofmeasure.org",
      concept: [
        {
          code: "mm[Hg]",
          display: "millimeter of mercury"
        },
        {
          code: "kPa",
          display: "kilopascal"
        },
        {
          code: "cm[H2O]",
          display: "centimeter of water"
        }
      ]
    }]
  }
};

export default PressureUnits;