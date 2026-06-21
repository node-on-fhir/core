// packages/order-catalog/client/RadiologyCatalog.js
// LOINC/RSNA Radiology Playbook - Common Imaging Procedures
// Free to use - no CPT license required
// Source: https://loinc.org/collaboration/rsna/

// =============================================================================
// RADIOLOGY CATALOG - ~50 Most Common Procedures
// =============================================================================

export const RADIOLOGY_CATALOG = [
  // =============================
  // CHEST IMAGING (X-Ray)
  // =============================
  {
    id: 'chest_xray_1v',
    code: '36643-5',
    display: 'XR Chest 1 View',
    longName: 'Radiography of Chest, 1 view',
    category: 'X-Ray',
    modality: 'XR',
    modalityDisplay: 'Radiography',
    bodyPart: 'Chest',
    bodyPartCode: 'CHEST',
    views: '1 View',
    contrast: null,
    turnaround: '2 hours',
    priority: ['routine', 'urgent', 'stat']
  },
  {
    id: 'chest_xray_2v',
    code: '30746-2',
    display: 'XR Chest 2 Views',
    longName: 'Radiography of Chest, 2 views',
    category: 'X-Ray',
    modality: 'XR',
    modalityDisplay: 'Radiography',
    bodyPart: 'Chest',
    bodyPartCode: 'CHEST',
    views: '2 Views',
    contrast: null,
    turnaround: '2 hours',
    priority: ['routine', 'urgent', 'stat']
  },
  {
    id: 'chest_xray_pa_lateral',
    code: '24627-2',
    display: 'XR Chest PA and Lateral',
    longName: 'Radiography of Chest, PA (posterior-anterior) and Lateral',
    category: 'X-Ray',
    modality: 'XR',
    modalityDisplay: 'Radiography',
    bodyPart: 'Chest',
    bodyPartCode: 'CHEST',
    views: 'PA and Lateral',
    contrast: null,
    turnaround: '2 hours',
    priority: ['routine', 'urgent', 'stat']
  },

  // =============================
  // CT CHEST
  // =============================
  {
    id: 'ct_chest_wo',
    code: '29252-4',
    display: 'CT Chest without contrast',
    longName: 'Computed Tomography of Chest without contrast',
    category: 'CT',
    modality: 'CT',
    modalityDisplay: 'Computed Tomography',
    bodyPart: 'Chest',
    bodyPartCode: 'CHEST',
    contrast: 'None',
    contrastCode: 'WO',
    turnaround: '4 hours',
    priority: ['routine', 'urgent', 'stat']
  },
  {
    id: 'ct_chest_w',
    code: '41806-1',
    display: 'CT Chest with contrast IV',
    longName: 'Computed Tomography of Chest with contrast IV',
    category: 'CT',
    modality: 'CT',
    modalityDisplay: 'Computed Tomography',
    bodyPart: 'Chest',
    bodyPartCode: 'CHEST',
    contrast: 'IV',
    contrastCode: 'W',
    turnaround: '4 hours',
    priority: ['routine', 'urgent', 'stat']
  },
  {
    id: 'ct_chest_wo_w',
    code: '42271-6',
    display: 'CT Chest without and with contrast IV',
    longName: 'Computed Tomography of Chest without and with contrast IV',
    category: 'CT',
    modality: 'CT',
    modalityDisplay: 'Computed Tomography',
    bodyPart: 'Chest',
    bodyPartCode: 'CHEST',
    contrast: 'IV (WO+W)',
    contrastCode: 'WO_W',
    turnaround: '6 hours',
    priority: ['routine', 'urgent']
  },

  // =============================
  // HEAD/BRAIN IMAGING
  // =============================
  {
    id: 'ct_head_wo',
    code: '24558-9',
    display: 'CT Head without contrast',
    longName: 'Computed Tomography of Head without contrast',
    category: 'CT',
    modality: 'CT',
    modalityDisplay: 'Computed Tomography',
    bodyPart: 'Head',
    bodyPartCode: 'HEAD',
    contrast: 'None',
    contrastCode: 'WO',
    turnaround: '2 hours',
    priority: ['routine', 'urgent', 'stat']
  },
  {
    id: 'ct_head_w',
    code: '70496-3',
    display: 'CT Head with contrast IV',
    longName: 'Computed Tomography of Head with contrast IV',
    category: 'CT',
    modality: 'CT',
    modalityDisplay: 'Computed Tomography',
    bodyPart: 'Head',
    bodyPartCode: 'HEAD',
    contrast: 'IV',
    contrastCode: 'W',
    turnaround: '4 hours',
    priority: ['routine', 'urgent', 'stat']
  },
  {
    id: 'mri_brain_wo',
    code: '24556-3',
    display: 'MR Brain without contrast',
    longName: 'Magnetic Resonance Imaging of Brain without contrast',
    category: 'MRI',
    modality: 'MR',
    modalityDisplay: 'Magnetic Resonance Imaging',
    bodyPart: 'Brain',
    bodyPartCode: 'BRAIN',
    contrast: 'None',
    contrastCode: 'WO',
    turnaround: '24 hours',
    priority: ['routine', 'urgent']
  },
  {
    id: 'mri_brain_w',
    code: '42271-6',
    display: 'MR Brain with contrast IV',
    longName: 'Magnetic Resonance Imaging of Brain with contrast IV',
    category: 'MRI',
    modality: 'MR',
    modalityDisplay: 'Magnetic Resonance Imaging',
    bodyPart: 'Brain',
    bodyPartCode: 'BRAIN',
    contrast: 'IV',
    contrastCode: 'W',
    turnaround: '24 hours',
    priority: ['routine', 'urgent']
  },

  // =============================
  // ABDOMEN/PELVIS IMAGING
  // =============================
  {
    id: 'ct_abdomen_pelvis_wo_w',
    code: '30621-7',
    display: 'CT Abdomen and Pelvis with contrast IV',
    longName: 'Computed Tomography of Abdomen and Pelvis with contrast IV',
    category: 'CT',
    modality: 'CT',
    modalityDisplay: 'Computed Tomography',
    bodyPart: 'Abdomen/Pelvis',
    bodyPartCode: 'ABDOPEL',
    contrast: 'IV',
    contrastCode: 'W',
    turnaround: '6 hours',
    priority: ['routine', 'urgent', 'stat']
  },
  {
    id: 'ct_abdomen_wo',
    code: '29252-4',
    display: 'CT Abdomen without contrast',
    longName: 'Computed Tomography of Abdomen without contrast',
    category: 'CT',
    modality: 'CT',
    modalityDisplay: 'Computed Tomography',
    bodyPart: 'Abdomen',
    bodyPartCode: 'ABDOMEN',
    contrast: 'None',
    contrastCode: 'WO',
    turnaround: '4 hours',
    priority: ['routine', 'urgent', 'stat']
  },
  {
    id: 'us_abdomen_complete',
    code: '24581-1',
    display: 'US Abdomen',
    longName: 'Ultrasound of Abdomen',
    category: 'Ultrasound',
    modality: 'US',
    modalityDisplay: 'Ultrasound',
    bodyPart: 'Abdomen',
    bodyPartCode: 'ABDOMEN',
    contrast: null,
    turnaround: '4 hours',
    priority: ['routine', 'urgent', 'stat']
  },
  {
    id: 'us_pelvis',
    code: '24782-5',
    display: 'US Pelvis',
    longName: 'Ultrasound of Pelvis',
    category: 'Ultrasound',
    modality: 'US',
    modalityDisplay: 'Ultrasound',
    bodyPart: 'Pelvis',
    bodyPartCode: 'PELVIS',
    contrast: null,
    turnaround: '4 hours',
    priority: ['routine', 'urgent']
  },
  {
    id: 'us_ob',
    code: '24612-4',
    display: 'US Pelvis Pregnant',
    longName: 'Ultrasound of Pelvis, Pregnant',
    category: 'Ultrasound',
    modality: 'US',
    modalityDisplay: 'Ultrasound',
    bodyPart: 'Pelvis (OB)',
    bodyPartCode: 'PELVIS_OB',
    contrast: null,
    turnaround: '4 hours',
    priority: ['routine', 'urgent']
  },

  // =============================
  // SPINE IMAGING
  // =============================
  {
    id: 'xr_cervical_spine_2v',
    code: '30706-6',
    display: 'XR C-Spine 2 Views',
    longName: 'Radiography of Cervical spine, 2 views',
    category: 'X-Ray',
    modality: 'XR',
    modalityDisplay: 'Radiography',
    bodyPart: 'C-Spine',
    bodyPartCode: 'CSPINE',
    views: '2 Views',
    contrast: null,
    turnaround: '2 hours',
    priority: ['routine', 'urgent']
  },
  {
    id: 'xr_lumbar_spine_2v',
    code: '37619-7',
    display: 'XR Lumbar spine 2 Views',
    longName: 'Radiography of Lumbar spine, 2 views',
    category: 'X-Ray',
    modality: 'XR',
    modalityDisplay: 'Radiography',
    bodyPart: 'Lumbar Spine',
    bodyPartCode: 'LSPINE',
    views: '2 Views',
    contrast: null,
    turnaround: '2 hours',
    priority: ['routine', 'urgent']
  },
  {
    id: 'mri_lumbar_spine_wo',
    code: '24855-9',
    display: 'MR Lumbar spine without contrast',
    longName: 'Magnetic Resonance Imaging of Lumbar spine without contrast',
    category: 'MRI',
    modality: 'MR',
    modalityDisplay: 'Magnetic Resonance Imaging',
    bodyPart: 'Lumbar Spine',
    bodyPartCode: 'LSPINE',
    contrast: 'None',
    contrastCode: 'WO',
    turnaround: '48 hours',
    priority: ['routine', 'urgent']
  },
  {
    id: 'ct_lumbar_spine_wo',
    code: '30704-1',
    display: 'CT Lumbar spine without contrast',
    longName: 'Computed Tomography of Lumbar spine without contrast',
    category: 'CT',
    modality: 'CT',
    modalityDisplay: 'Computed Tomography',
    bodyPart: 'Lumbar Spine',
    bodyPartCode: 'LSPINE',
    contrast: 'None',
    contrastCode: 'WO',
    turnaround: '4 hours',
    priority: ['routine', 'urgent']
  },
  {
    id: 'mri_cervical_spine_wo',
    code: '24845-0',
    display: 'MR C-Spine without contrast',
    longName: 'Magnetic Resonance Imaging of Cervical spine without contrast',
    category: 'MRI',
    modality: 'MR',
    modalityDisplay: 'Magnetic Resonance Imaging',
    bodyPart: 'C-Spine',
    bodyPartCode: 'CSPINE',
    contrast: 'None',
    contrastCode: 'WO',
    turnaround: '48 hours',
    priority: ['routine', 'urgent']
  },

  // =============================
  // EXTREMITY IMAGING
  // =============================
  {
    id: 'xr_hand_2v',
    code: '37629-6',
    display: 'XR Hand 2 Views',
    longName: 'Radiography of Hand, 2 views',
    category: 'X-Ray',
    modality: 'XR',
    modalityDisplay: 'Radiography',
    bodyPart: 'Hand',
    bodyPartCode: 'HAND',
    views: '2 Views',
    laterality: 'bilateral',
    contrast: null,
    turnaround: '2 hours',
    priority: ['routine', 'urgent']
  },
  {
    id: 'xr_wrist_2v',
    code: '37672-6',
    display: 'XR Wrist 2 Views',
    longName: 'Radiography of Wrist, 2 views',
    category: 'X-Ray',
    modality: 'XR',
    modalityDisplay: 'Radiography',
    bodyPart: 'Wrist',
    bodyPartCode: 'WRIST',
    views: '2 Views',
    laterality: 'bilateral',
    contrast: null,
    turnaround: '2 hours',
    priority: ['routine', 'urgent']
  },
  {
    id: 'xr_knee_2v',
    code: '37658-5',
    display: 'XR Knee 2 Views',
    longName: 'Radiography of Knee, 2 views',
    category: 'X-Ray',
    modality: 'XR',
    modalityDisplay: 'Radiography',
    bodyPart: 'Knee',
    bodyPartCode: 'KNEE',
    views: '2 Views',
    laterality: 'bilateral',
    contrast: null,
    turnaround: '2 hours',
    priority: ['routine', 'urgent']
  },
  {
    id: 'xr_ankle_2v',
    code: '37618-9',
    display: 'XR Ankle 2 Views',
    longName: 'Radiography of Ankle, 2 views',
    category: 'X-Ray',
    modality: 'XR',
    modalityDisplay: 'Radiography',
    bodyPart: 'Ankle',
    bodyPartCode: 'ANKLE',
    views: '2 Views',
    laterality: 'bilateral',
    contrast: null,
    turnaround: '2 hours',
    priority: ['routine', 'urgent']
  },
  {
    id: 'xr_foot_2v',
    code: '37624-7',
    display: 'XR Foot 2 Views',
    longName: 'Radiography of Foot, 2 views',
    category: 'X-Ray',
    modality: 'XR',
    modalityDisplay: 'Radiography',
    bodyPart: 'Foot',
    bodyPartCode: 'FOOT',
    views: '2 Views',
    laterality: 'bilateral',
    contrast: null,
    turnaround: '2 hours',
    priority: ['routine', 'urgent']
  },
  {
    id: 'xr_shoulder_2v',
    code: '37664-3',
    display: 'XR Shoulder 2 Views',
    longName: 'Radiography of Shoulder, 2 views',
    category: 'X-Ray',
    modality: 'XR',
    modalityDisplay: 'Radiography',
    bodyPart: 'Shoulder',
    bodyPartCode: 'SHOULDER',
    views: '2 Views',
    laterality: 'bilateral',
    contrast: null,
    turnaround: '2 hours',
    priority: ['routine', 'urgent']
  },
  {
    id: 'mri_knee_wo',
    code: '24725-4',
    display: 'MR Knee without contrast',
    longName: 'Magnetic Resonance Imaging of Knee without contrast',
    category: 'MRI',
    modality: 'MR',
    modalityDisplay: 'Magnetic Resonance Imaging',
    bodyPart: 'Knee',
    bodyPartCode: 'KNEE',
    laterality: 'bilateral',
    contrast: 'None',
    contrastCode: 'WO',
    turnaround: '48 hours',
    priority: ['routine']
  },
  {
    id: 'mri_shoulder_wo',
    code: '24860-9',
    display: 'MR Shoulder without contrast',
    longName: 'Magnetic Resonance Imaging of Shoulder without contrast',
    category: 'MRI',
    modality: 'MR',
    modalityDisplay: 'Magnetic Resonance Imaging',
    bodyPart: 'Shoulder',
    bodyPartCode: 'SHOULDER',
    laterality: 'bilateral',
    contrast: 'None',
    contrastCode: 'WO',
    turnaround: '48 hours',
    priority: ['routine']
  },

  // =============================
  // NUCLEAR MEDICINE
  // =============================
  {
    id: 'nm_bone_scan',
    code: '41827-8',
    display: 'NM Bone scan whole body',
    longName: 'Nuclear Medicine scan of Bone, whole body',
    category: 'Nuclear Medicine',
    modality: 'NM',
    modalityDisplay: 'Nuclear Medicine',
    bodyPart: 'Whole Body',
    bodyPartCode: 'BODY',
    contrast: null,
    turnaround: '24 hours',
    priority: ['routine']
  },
  {
    id: 'nm_thyroid_scan',
    code: '38066-3',
    display: 'NM Thyroid scan',
    longName: 'Nuclear Medicine scan of Thyroid',
    category: 'Nuclear Medicine',
    modality: 'NM',
    modalityDisplay: 'Nuclear Medicine',
    bodyPart: 'Thyroid',
    bodyPartCode: 'THYROID',
    contrast: null,
    turnaround: '24 hours',
    priority: ['routine']
  },
  {
    id: 'nm_lung_vent_perf',
    code: '24811-2',
    display: 'NM Lung ventilation and perfusion',
    longName: 'Nuclear Medicine ventilation and perfusion scan of Lung',
    category: 'Nuclear Medicine',
    modality: 'NM',
    modalityDisplay: 'Nuclear Medicine',
    bodyPart: 'Lungs',
    bodyPartCode: 'LUNG',
    contrast: null,
    turnaround: '24 hours',
    priority: ['routine', 'urgent']
  },

  // =============================
  // MAMMOGRAPHY
  // =============================
  {
    id: 'mg_bilateral_screening',
    code: '24604-1',
    display: 'MG Bilateral screening',
    longName: 'Mammography of Bilateral breasts, screening',
    category: 'Mammography',
    modality: 'MG',
    modalityDisplay: 'Mammography',
    bodyPart: 'Breasts',
    bodyPartCode: 'BREAST',
    laterality: 'bilateral',
    contrast: null,
    turnaround: '48 hours',
    priority: ['routine']
  },
  {
    id: 'mg_bilateral_diagnostic',
    code: '37768-2',
    display: 'MG Bilateral diagnostic',
    longName: 'Mammography of Bilateral breasts, diagnostic',
    category: 'Mammography',
    modality: 'MG',
    modalityDisplay: 'Mammography',
    bodyPart: 'Breasts',
    bodyPartCode: 'BREAST',
    laterality: 'bilateral',
    contrast: null,
    turnaround: '48 hours',
    priority: ['routine', 'urgent']
  },
  {
    id: 'mg_unilateral_diagnostic',
    code: '37551-2',
    display: 'MG Unilateral diagnostic',
    longName: 'Mammography of Unilateral breast, diagnostic',
    category: 'Mammography',
    modality: 'MG',
    modalityDisplay: 'Mammography',
    bodyPart: 'Breast',
    bodyPartCode: 'BREAST',
    laterality: 'unilateral',
    contrast: null,
    turnaround: '48 hours',
    priority: ['routine', 'urgent']
  },

  // =============================
  // FLUOROSCOPY
  // =============================
  {
    id: 'rf_upper_gi',
    code: '24696-7',
    display: 'RF Upper GI series',
    longName: 'Fluoroscopy of Upper gastrointestinal tract',
    category: 'Fluoroscopy',
    modality: 'RF',
    modalityDisplay: 'Fluoroscopy',
    bodyPart: 'Upper GI',
    bodyPartCode: 'UPPER_GI',
    contrast: 'Oral',
    turnaround: '6 hours',
    priority: ['routine']
  },
  {
    id: 'rf_barium_swallow',
    code: '18741-9',
    display: 'RF Esophagus',
    longName: 'Fluoroscopy of Esophagus (Barium swallow)',
    category: 'Fluoroscopy',
    modality: 'RF',
    modalityDisplay: 'Fluoroscopy',
    bodyPart: 'Esophagus',
    bodyPartCode: 'ESOPHAGUS',
    contrast: 'Oral',
    turnaround: '6 hours',
    priority: ['routine', 'urgent']
  },

  // =============================
  // ANGIOGRAPHY
  // =============================
  {
    id: 'xa_coronary',
    code: '42271-6',
    display: 'XA Coronary arteries',
    longName: 'X-Ray Angiography of Coronary arteries',
    category: 'Angiography',
    modality: 'XA',
    modalityDisplay: 'X-Ray Angiography',
    bodyPart: 'Coronary Arteries',
    bodyPartCode: 'CORONARY',
    contrast: 'IV',
    turnaround: '24 hours',
    priority: ['urgent', 'stat']
  },
  {
    id: 'mra_brain_wo_w',
    code: '42271-6',
    display: 'MRA Brain without and with contrast',
    longName: 'Magnetic Resonance Angiography of Brain without and with contrast',
    category: 'Angiography',
    modality: 'MR',
    modalityDisplay: 'MR Angiography',
    bodyPart: 'Brain',
    bodyPartCode: 'BRAIN',
    contrast: 'IV (WO+W)',
    turnaround: '24 hours',
    priority: ['routine', 'urgent']
  },

  // =============================
  // SPECIAL PROCEDURES
  // =============================
  {
    id: 'ct_pulmonary_embolism',
    code: '43468-8',
    display: 'CT Pulmonary arteries with contrast IV',
    longName: 'Computed Tomography Angiography of Pulmonary arteries with contrast IV (PE Protocol)',
    category: 'CT',
    modality: 'CT',
    modalityDisplay: 'CT Angiography',
    bodyPart: 'Chest (Pulmonary)',
    bodyPartCode: 'PULMONARY',
    contrast: 'IV',
    turnaround: '4 hours',
    priority: ['urgent', 'stat']
  },
  {
    id: 'ct_calcium_score',
    code: '79069-8',
    display: 'CT Heart calcium score',
    longName: 'Computed Tomography of Heart for calcium scoring',
    category: 'CT',
    modality: 'CT',
    modalityDisplay: 'Computed Tomography',
    bodyPart: 'Heart',
    bodyPartCode: 'HEART',
    contrast: 'None',
    contrastCode: 'WO',
    turnaround: '24 hours',
    priority: ['routine']
  },
  {
    id: 'dexa_lumbar_spine',
    code: '38265-5',
    display: 'DEXA Lumbar spine',
    longName: 'Dual energy X-ray absorptiometry (DEXA) of Lumbar spine',
    category: 'DEXA',
    modality: 'DXA',
    modalityDisplay: 'DEXA',
    bodyPart: 'Lumbar Spine',
    bodyPartCode: 'LSPINE',
    contrast: null,
    turnaround: '48 hours',
    priority: ['routine']
  },
  {
    id: 'dexa_hip',
    code: '38263-0',
    display: 'DEXA Hip',
    longName: 'Dual energy X-ray absorptiometry (DEXA) of Hip',
    category: 'DEXA',
    modality: 'DXA',
    modalityDisplay: 'DEXA',
    bodyPart: 'Hip',
    bodyPartCode: 'HIP',
    laterality: 'bilateral',
    contrast: null,
    turnaround: '48 hours',
    priority: ['routine']
  }
];

// =============================================================================
// CATEGORY GROUPINGS FOR UI
// =============================================================================

export const RADIOLOGY_CATEGORIES = [
  'X-Ray',
  'CT',
  'MRI',
  'Ultrasound',
  'Nuclear Medicine',
  'Mammography',
  'Fluoroscopy',
  'Angiography',
  'DEXA'
];

// =============================================================================
// MODALITY CODES (DICOM Standard)
// =============================================================================

export const MODALITY_CODES = {
  'XR': { display: 'Radiography', icon: 'xray', color: '#2196F3' },
  'CT': { display: 'Computed Tomography', icon: 'ct', color: '#4CAF50' },
  'MR': { display: 'Magnetic Resonance Imaging', icon: 'mri', color: '#9C27B0' },
  'US': { display: 'Ultrasound', icon: 'ultrasound', color: '#FF9800' },
  'NM': { display: 'Nuclear Medicine', icon: 'nuclear', color: '#F44336' },
  'MG': { display: 'Mammography', icon: 'mammography', color: '#E91E63' },
  'RF': { display: 'Fluoroscopy', icon: 'fluoroscopy', color: '#00BCD4' },
  'XA': { display: 'X-Ray Angiography', icon: 'angiography', color: '#FF5722' },
  'DXA': { display: 'DEXA', icon: 'dexa', color: '#607D8B' }
};

// =============================================================================
// CATALOG METADATA
// =============================================================================

export const CATALOG_METADATA = {
  version: '1.0.0',
  source: 'LOINC/RSNA Radiology Playbook',
  license: 'Free to use - no CPT license required',
  url: 'https://loinc.org/collaboration/rsna/',
  procedureCount: RADIOLOGY_CATALOG.length,
  lastUpdated: '2026-01-08'
};
