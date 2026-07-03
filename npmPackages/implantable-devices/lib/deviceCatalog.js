// npmPackages/implantable-devices/lib/deviceCatalog.js
//
// Isomorphic, plain-data device catalog shared by the client UI (browse/display)
// and the server (seeding catalog Device records). NO JSX here — category icons
// are rendered client-side via getCategoryIcon(categoryKey); only `name`, `color`
// and `devices[]` are read off catalog entries.
//
// Image policy: only attach an `image` when an asset in assets/ genuinely depicts
// that device type (e.g. Artificial_Knee.jpg → a knee). Devices without a matching
// asset simply omit `image`; the device-image card hides itself for them. The
// available assets and their honest matches:
//   Pacemaker.jpg                      → cardiac pacemaker
//   X-Ray_after_LVAD_Implantation.jpg  → ventricular assist device (LVAD)
//   Artificial_Knee.jpg                → total knee replacement
//   BreastImplant09.jpeg               → breast implant
//   Orbital_Prosthesis.jpg             → ocular/orbital prosthesis (prosthetic eye)
//   Saline_Orbital_Sphere.jpg          → orbital sphere implant
//   Hydrogel_Orbital_Expander.jpg      → orbital tissue expander
//   Eyelid_Springs.jpg                 → eyelid spring/weight implant

// Static device images are copied by the workflow parser from this package's
// assets/ directory into public/workflows/implantable-devices/ and served here.
export const DEVICE_IMAGE_BASE = '/workflows/implantable-devices/';

// Device catalog (data only). Category icons live in the client (getCategoryIcon).
export const DEVICE_CATALOG_DATA = {
  'cardiac': {
    name: 'Cardiac Devices',
    color: '#e91e63',
    devices: [
      {
        id: 'PM-2077',
        image: DEVICE_IMAGE_BASE + 'Pacemaker.jpg',
        name: 'NeuroPulse™ Pacemaker v3.0',
        manufacturer: 'Arasaka Medical',
        model: 'NP-3000',
        udi: '(01)10884521062856(11)141231(17)150707(10)A213B1(21)1234',
        type: 'Dual-chamber pacemaker',
        class: 'III',
        status: 'active',
        implantDate: '2023-06-15',
        battery: 85,
        connectivity: 'Bluetooth 5.0, NFC',
        features: ['AI rhythm optimization', 'Remote monitoring', 'MRI safe'],
        cybernetic: true,
        performance: 4.5
      },
      {
        id: 'ICD-4521',
        name: 'CardioGuard™ Defibrillator',
        manufacturer: 'Militech Biotech',
        model: 'CG-500X',
        udi: '(01)10884521062857(11)141232(17)150708(10)A213B2(21)5678',
        type: 'Implantable Cardioverter Defibrillator',
        class: 'III',
        status: 'active',
        implantDate: '2023-08-22',
        battery: 92,
        connectivity: 'Cellular, Wi-Fi',
        features: ['Predictive shock therapy', 'Cloud sync', 'Biometric encryption'],
        cybernetic: true,
        performance: 4.8
      },
      {
        id: 'LVAD-7700',
        image: DEVICE_IMAGE_BASE + 'X-Ray_after_LVAD_Implantation.jpg',
        name: 'VentriFlow™ Left Ventricular Assist Device',
        manufacturer: 'Trauma Team International',
        model: 'VF-HM3',
        udi: '(01)10884521062870(11)141240(17)150716(10)A213C1(21)2233',
        type: 'Left ventricular assist device (LVAD)',
        class: 'III',
        status: 'active',
        implantDate: '2024-03-12',
        battery: 'External controller (rechargeable)',
        connectivity: 'Wired controller, Bluetooth telemetry',
        features: ['Continuous-flow pump', 'Hemocompatibility monitoring', 'Low-battery alerts'],
        cybernetic: false,
        performance: 4.6
      },
      {
        id: 'LOOP-1130',
        name: 'RhythmWatch™ Insertable Loop Recorder',
        manufacturer: 'Dynalar Technologies',
        model: 'RW-ILR',
        udi: '(01)10884521062871(11)141241(17)150717(10)A213C2(21)2244',
        type: 'Implantable cardiac monitor',
        class: 'II',
        status: 'active',
        implantDate: '2023-10-02',
        battery: 88,
        connectivity: 'Bluetooth LE',
        features: ['Continuous ECG', 'Arrhythmia detection', '3-year monitoring'],
        cybernetic: false,
        performance: 4.1
      }
    ]
  },
  'neural': {
    name: 'Neural Interfaces',
    color: '#9c27b0',
    devices: [
      {
        id: 'NI-8923',
        name: 'CortexLink™ Neural Bridge',
        manufacturer: 'Raven Microcyber',
        model: 'CLB-2.1',
        udi: '(01)10884521062858(11)141233(17)150709(10)A213B3(21)9101',
        type: 'Brain-Computer Interface',
        class: 'III',
        status: 'active',
        implantDate: '2024-01-10',
        battery: 'Wireless charging',
        connectivity: 'Neural-link protocol v2',
        features: ['Direct neural control', 'Memory augmentation', 'Dream recording'],
        cybernetic: true,
        performance: 4.9,
        experimental: true
      },
      {
        id: 'SCS-3421',
        name: 'SpinalFlow™ Stimulator',
        manufacturer: 'Zetatech',
        model: 'SF-100',
        udi: '(01)10884521062859(11)141234(17)150710(10)A213B4(21)1112',
        type: 'Spinal Cord Stimulator',
        class: 'II',
        status: 'active',
        implantDate: '2023-11-05',
        battery: 78,
        connectivity: 'Bluetooth LE',
        features: ['Pain management AI', 'Adaptive stimulation', 'Motion sensing'],
        cybernetic: false,
        performance: 4.2
      },
      {
        id: 'DBS-2055',
        name: 'DeepThought™ Deep Brain Stimulator',
        manufacturer: 'Raven Microcyber',
        model: 'DT-2',
        udi: '(01)10884521062872(11)141242(17)150718(10)A213C3(21)2255',
        type: 'Deep brain stimulator',
        class: 'III',
        status: 'active',
        implantDate: '2023-09-29',
        battery: 81,
        connectivity: 'Bluetooth LE',
        features: ['Tremor suppression', 'Adaptive stimulation', 'Clinician telemetry'],
        cybernetic: false,
        performance: 4.4
      }
    ]
  },
  'sensory': {
    name: 'Sensory Augmentation',
    color: '#00bcd4',
    devices: [
      {
        id: 'RET-5577',
        name: 'OptiCyber™ Retinal Implant',
        manufacturer: 'Kiroshi Optics',
        model: 'MK.3',
        udi: '(01)10884521062860(11)141235(17)150711(10)A213B5(21)1314',
        type: 'Electronic retinal prosthesis',
        class: 'III',
        status: 'active',
        implantDate: '2023-09-18',
        battery: 'Bio-electric',
        connectivity: 'Direct neural interface',
        features: ['20x zoom', 'Night vision', 'AR overlay', 'Threat detection'],
        cybernetic: true,
        performance: 4.7,
        military_grade: true
      },
      {
        id: 'CI-8901',
        name: 'AudioMax™ Cochlear System',
        manufacturer: 'Dynalar Technologies',
        model: 'AM-7',
        udi: '(01)10884521062861(11)141236(17)150712(10)A213B6(21)1516',
        type: 'Cochlear Implant',
        class: 'III',
        status: 'active',
        implantDate: '2023-07-22',
        battery: 90,
        connectivity: 'Bluetooth 5.2',
        features: ['Frequency enhancement', 'Noise cancellation', 'Language translation'],
        cybernetic: true,
        performance: 4.4
      },
      {
        id: 'EYE-3300',
        image: DEVICE_IMAGE_BASE + 'Orbital_Prosthesis.jpg',
        name: 'Kiroshi™ Ocular Prosthesis',
        manufacturer: 'Kiroshi Optics',
        model: 'OP-1',
        udi: '(01)10884521062873(11)141243(17)150719(10)A213C4(21)2266',
        type: 'Prosthetic eye (ocular prosthesis)',
        class: 'I',
        status: 'active',
        implantDate: '2022-12-04',
        battery: 'N/A',
        connectivity: 'Passive',
        features: ['Custom iris match', 'Motility coupling'],
        cybernetic: false,
        performance: 4.0
      },
      {
        id: 'ORB-3310',
        image: DEVICE_IMAGE_BASE + 'Saline_Orbital_Sphere.jpg',
        name: 'OrbiSphere™ Orbital Implant',
        manufacturer: 'Kiroshi Optics',
        model: 'OS-20',
        udi: '(01)10884521062874(11)141244(17)150720(10)A213C5(21)2277',
        type: 'Orbital sphere implant',
        class: 'II',
        status: 'active',
        implantDate: '2022-12-04',
        battery: 'N/A',
        connectivity: 'Passive',
        features: ['Volume replacement', 'Porous integration'],
        cybernetic: false,
        performance: 3.9
      },
      {
        id: 'ORB-3320',
        image: DEVICE_IMAGE_BASE + 'Hydrogel_Orbital_Expander.jpg',
        name: 'HydroGrow™ Orbital Tissue Expander',
        manufacturer: 'Biotechnica',
        model: 'HG-3',
        udi: '(01)10884521062875(11)141245(17)150721(10)A213C6(21)2288',
        type: 'Orbital tissue expander',
        class: 'II',
        status: 'active',
        implantDate: '2024-02-19',
        battery: 'N/A',
        connectivity: 'Passive',
        features: ['Self-inflating hydrogel', 'Pediatric socket growth'],
        cybernetic: false,
        performance: 3.8
      },
      {
        id: 'LID-3330',
        image: DEVICE_IMAGE_BASE + 'Eyelid_Springs.jpg',
        name: 'LidLift™ Eyelid Spring Implant',
        manufacturer: 'Biotechnica',
        model: 'LL-1',
        udi: '(01)10884521062876(11)141246(17)150722(10)A213C7(21)2299',
        type: 'Eyelid spring/weight implant',
        class: 'II',
        status: 'active',
        implantDate: '2023-04-11',
        battery: 'N/A',
        connectivity: 'Passive',
        features: ['Lagophthalmos correction', 'Gold-weight loading'],
        cybernetic: false,
        performance: 3.7
      },
      {
        id: 'MAG-4400',
        name: 'MagSense™ Subdermal Magnet',
        manufacturer: 'Zetatech',
        model: 'MS-9',
        udi: '(01)10884521062877(11)141247(17)150723(10)A213C8(21)2300',
        type: 'Magnetic field sensor implant',
        class: 'I',
        status: 'active',
        implantDate: '2024-05-01',
        battery: 'Passive',
        connectivity: 'Passive (haptic)',
        features: ['Magnetic field sensing', 'Haptic feedback'],
        cybernetic: true,
        performance: 3.5,
        experimental: true
      }
    ]
  },
  'orthopedic': {
    name: 'Orthopedic Implants',
    color: '#795548',
    devices: [
      {
        id: 'KNEE-1000',
        image: DEVICE_IMAGE_BASE + 'Artificial_Knee.jpg',
        name: 'TitanFlex™ Total Knee System',
        manufacturer: 'Militech Biotech',
        model: 'TK-360',
        udi: '(01)10884521062880(11)141250(17)150726(10)A213D1(21)3001',
        type: 'Total knee replacement',
        class: 'II',
        status: 'active',
        implantDate: '2022-11-30',
        battery: 'N/A',
        connectivity: 'Passive',
        features: ['Cobalt-chrome bearing', 'Cementless fixation'],
        cybernetic: false,
        performance: 4.3
      },
      {
        id: 'HIP-1010',
        name: 'TitanFlex™ Total Hip System',
        manufacturer: 'Militech Biotech',
        model: 'TH-360',
        udi: '(01)10884521062881(11)141251(17)150727(10)A213D2(21)3002',
        type: 'Total hip replacement',
        class: 'II',
        status: 'active',
        implantDate: '2022-08-17',
        battery: 'N/A',
        connectivity: 'Passive',
        features: ['Ceramic-on-poly bearing', 'Porous-coated stem'],
        cybernetic: false,
        performance: 4.4
      },
      {
        id: 'DISC-1020',
        name: 'FlexCore™ Artificial Cervical Disc',
        manufacturer: 'Zetatech',
        model: 'AD-C',
        udi: '(01)10884521062882(11)141252(17)150728(10)A213D3(21)3003',
        type: 'Artificial intervertebral disc',
        class: 'III',
        status: 'active',
        implantDate: '2023-03-21',
        battery: 'N/A',
        connectivity: 'Passive',
        features: ['Motion preservation', 'Titanium endplates'],
        cybernetic: false,
        performance: 4.0
      },
      {
        id: 'SKULL-1030',
        name: 'CranioGuard™ Cranial Plate',
        manufacturer: 'Biotechnica',
        model: 'CP-PEEK',
        udi: '(01)10884521062883(11)141253(17)150729(10)A213D4(21)3004',
        type: 'Cranial / skull plate',
        class: 'II',
        status: 'active',
        implantDate: '2023-06-08',
        battery: 'N/A',
        connectivity: 'Passive',
        features: ['Patient-specific PEEK', 'Cranioplasty fixation'],
        cybernetic: false,
        performance: 4.1
      }
    ]
  },
  'prosthetics': {
    name: 'Cybernetic Prosthetics',
    color: '#ff9800',
    devices: [
      {
        id: 'ARM-9000',
        name: 'Mantis Blades™',
        manufacturer: 'Arasaka Cyberware',
        model: 'MB-X',
        udi: '(01)10884521062862(11)141237(17)150713(10)A213B7(21)1718',
        type: 'Arm Replacement',
        class: 'III',
        status: 'active',
        implantDate: '2024-02-01',
        battery: 'Kinetic charging',
        connectivity: 'Neural direct',
        features: ['Retractable blades', 'Enhanced strength', 'Thermal regulation'],
        cybernetic: true,
        performance: 5.0,
        combat_rated: true
      },
      {
        id: 'LEG-4455',
        name: 'Reinforced Tendons™',
        manufacturer: 'Zetatech',
        model: 'RT-2',
        udi: '(01)10884521062863(11)141238(17)150714(10)A213B8(21)1920',
        type: 'Leg Enhancement',
        class: 'II',
        status: 'active',
        implantDate: '2023-12-10',
        battery: 'N/A',
        connectivity: 'Passive',
        features: ['Double jump capability', 'Fall damage reduction', 'Silent movement'],
        cybernetic: true,
        performance: 4.6
      },
      {
        id: 'DENT-5500',
        name: 'EverSmile™ Dental Implant System',
        manufacturer: 'Dynalar Technologies',
        model: 'DI-OSSEO',
        udi: '(01)10884521062884(11)141254(17)150730(10)A213D5(21)3005',
        type: 'Endosseous dental implant',
        class: 'II',
        status: 'active',
        implantDate: '2023-02-14',
        battery: 'N/A',
        connectivity: 'Passive',
        features: ['Titanium osseointegration', 'Full-arch support'],
        cybernetic: false,
        performance: 4.2
      }
    ]
  },
  'reconstructive': {
    name: 'Reconstructive Implants',
    color: '#ad1457',
    devices: [
      {
        id: 'BREAST-6000',
        image: DEVICE_IMAGE_BASE + 'BreastImplant09.jpeg',
        name: 'ContourMax™ Silicone Breast Implant',
        manufacturer: 'Biotechnica',
        model: 'CM-410',
        udi: '(01)10884521062885(11)141255(17)150731(10)A213D6(21)3006',
        type: 'Silicone breast implant',
        class: 'III',
        status: 'active',
        implantDate: '2023-05-19',
        battery: 'N/A',
        connectivity: 'Passive',
        features: ['Cohesive silicone gel', 'Textured shell', 'UDI traceability'],
        cybernetic: false,
        performance: 4.3
      },
      {
        id: 'SKIN-6010',
        name: 'DermaWeave™ Bioengineered Skin Graft',
        manufacturer: 'Biotechnica',
        model: 'DW-2',
        udi: '(01)10884521062886(11)141256(17)150732(10)A213D7(21)3007',
        type: 'Bioengineered dermal graft',
        class: 'II',
        status: 'active',
        implantDate: '2024-01-27',
        battery: 'N/A',
        connectivity: 'Passive',
        features: ['Collagen scaffold', 'Burn reconstruction'],
        cybernetic: false,
        performance: 4.0
      }
    ]
  },
  'identification': {
    name: 'Identification & Sensors',
    color: '#607d8b',
    devices: [
      {
        id: 'NFC-7000',
        name: 'CipherTag™ Subdermal NFC Chip',
        manufacturer: 'Raven Microcyber',
        model: 'CT-NFC',
        udi: '(01)10884521062887(11)141257(17)150733(10)A213D8(21)3008',
        type: 'Subdermal NFC/RFID transponder',
        class: 'II',
        status: 'active',
        implantDate: '2024-04-09',
        battery: 'Passive (NFC harvested)',
        connectivity: 'NFC, RFID 13.56 MHz',
        features: ['Identity token', 'Access control', 'Encrypted payload'],
        cybernetic: true,
        performance: 3.8
      },
      {
        id: 'RFID-7010',
        name: 'BioTag™ Magnetic RFID Marker',
        manufacturer: 'Zetatech',
        model: 'BT-RF',
        udi: '(01)10884521062888(11)141258(17)150734(10)A213D9(21)3009',
        type: 'Implantable RFID surgical marker',
        class: 'II',
        status: 'active',
        implantDate: '2023-08-30',
        battery: 'Passive',
        connectivity: 'RFID',
        features: ['Surgical site marking', 'Wireless localization'],
        cybernetic: false,
        performance: 3.6
      }
    ]
  },
  'monitoring': {
    name: 'Monitoring Systems',
    color: '#4caf50',
    devices: [
      {
        id: 'MON-1122',
        name: 'BioMonitor™ Implant',
        manufacturer: 'Trauma Team International',
        model: 'BM-500',
        udi: '(01)10884521062864(11)141239(17)150715(10)A213B9(21)2122',
        type: 'Continuous Glucose Monitor',
        class: 'II',
        status: 'active',
        implantDate: '2023-05-20',
        battery: 95,
        connectivity: 'Cellular IoT',
        features: ['Real-time alerts', 'Predictive analytics', 'Emergency dispatch'],
        cybernetic: false,
        performance: 4.3
      }
    ]
  },
  'reproductive': {
    name: 'Reproductive Devices',
    color: '#8e24aa',
    devices: [
      {
        id: 'IUD-8000',
        name: 'LunaCycle™ Smart Intrauterine Device',
        manufacturer: 'Dynalar Technologies',
        model: 'IUD-S',
        udi: '(01)10884521062889(11)141259(17)150735(10)A213E1(21)3010',
        type: 'Intrauterine device (IUD)',
        class: 'III',
        status: 'active',
        implantDate: '2023-07-03',
        battery: 'Passive',
        connectivity: 'NFC telemetry',
        features: ['Hormonal release', 'Placement verification', '5-year lifespan'],
        cybernetic: false,
        performance: 4.1
      }
    ]
  }
};
