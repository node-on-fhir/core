// packages/patient-characteristics/lib/phenotypeData.js

// 92 phenotype traits grouped by domain and panel.
// Source: data/clinical-phenotype-local-concepts.csv
// Each trait: { trait, description, valueType, localCode }

export const PHENOTYPE_DOMAINS = [
  {
    domain: 'Stable phenotype',
    panels: [
      {
        panel: 'Identity & baseline phenotype',
        traits: [
          { trait: 'Dominant hand', description: 'Handedness / dominant hand.', valueType: 'coded answer', localCode: 'dominant-hand' }
        ]
      },
      {
        panel: 'Visible phenotype',
        traits: [
          { trait: 'Eye color', description: 'Iris color as a stable visible trait.', valueType: 'coded answer', localCode: 'eye-color' },
          { trait: 'Fitzpatrick skin phototype', description: 'Skin phototype classification (I-VI).', valueType: 'coded answer', localCode: 'fitzpatrick-skin-phototype' },
          { trait: 'Scar inventory', description: 'Presence and inventory of stable scars.', valueType: 'narrative or repeating coded entries', localCode: 'scar-inventory' },
          { trait: 'Tattoo inventory', description: 'Presence and inventory of tattoos.', valueType: 'narrative or repeating coded entries', localCode: 'tattoo-inventory' },
          { trait: 'Birthmark inventory', description: 'Presence and inventory of birthmarks / nevi.', valueType: 'narrative or repeating coded entries', localCode: 'birthmark-inventory' }
        ]
      }
    ]
  },
  {
    domain: 'Anthropometry',
    panels: [
      {
        panel: 'Core anthropometry',
        traits: [
          { trait: 'Sitting height', description: 'Height from seated surface to top of head.', valueType: 'numeric', localCode: 'sitting-height' },
          { trait: 'Hip circumference', description: 'Circumference at widest point of hips.', valueType: 'numeric', localCode: 'hip-circumference' },
          { trait: 'Shoulder breadth', description: 'Biacromial width.', valueType: 'numeric', localCode: 'shoulder-breadth' },
          { trait: 'Hand span', description: 'Maximum thumb-to-little-finger span.', valueType: 'numeric', localCode: 'hand-span' },
          { trait: 'Foot length', description: 'Heel-to-toe foot length.', valueType: 'numeric', localCode: 'foot-length' },
          { trait: 'Inseam length', description: 'Crotch-to-floor inseam length.', valueType: 'numeric', localCode: 'inseam-length' },
          { trait: 'Standing reach envelope', description: 'Maximum reachable envelope while standing.', valueType: 'numeric', localCode: 'standing-reach-envelope' },
          { trait: 'Seated reach envelope', description: 'Maximum reachable envelope while seated.', valueType: 'numeric', localCode: 'seated-reach-envelope' }
        ]
      },
      {
        panel: 'Body composition',
        traits: [
          { trait: 'Body surface area', description: 'Calculated body surface area.', valueType: 'numeric', localCode: 'body-surface-area' },
          { trait: 'Lean body mass', description: 'Lean body mass estimate.', valueType: 'numeric', localCode: 'lean-body-mass' },
          { trait: 'Fat-free mass', description: 'Mass excluding body fat.', valueType: 'numeric', localCode: 'fat-free-mass' },
          { trait: 'Body fat percentage', description: 'Percent body fat by DXA/BIA/other method.', valueType: 'numeric', localCode: 'body-fat-percentage' },
          { trait: 'Visceral fat estimate', description: 'Visceral fat estimate from imaging/BIA/other method.', valueType: 'numeric', localCode: 'visceral-fat-estimate' },
          { trait: 'Skeletal muscle mass', description: 'Estimated skeletal muscle mass.', valueType: 'numeric', localCode: 'skeletal-muscle-mass' },
          { trait: 'Frame size', description: 'Small/medium/large body frame or metric equivalent.', valueType: 'coded answer', localCode: 'frame-size' }
        ]
      }
    ]
  },
  {
    domain: 'Physiology',
    panels: [
      {
        panel: 'Autonomic / wearable',
        traits: [
          { trait: 'Orthostatic tolerance', description: 'Tolerance to orthostatic challenge or stand test.', valueType: 'numeric or coded answer', localCode: 'orthostatic-tolerance' },
          { trait: 'Heart-rate recovery at 1 minute', description: 'Heart-rate decline one minute after exertion.', valueType: 'numeric', localCode: 'heart-rate-recovery-at-1-minute' }
        ]
      },
      {
        panel: 'Sleep / circadian',
        traits: [
          { trait: 'Sleep duration baseline', description: 'Typical nightly sleep duration.', valueType: 'numeric', localCode: 'sleep-duration-baseline' },
          { trait: 'Sleep efficiency baseline', description: 'Percent of time in bed spent asleep.', valueType: 'numeric', localCode: 'sleep-efficiency-baseline' },
          { trait: 'Circadian midpoint', description: 'Chronobiology midpoint of sleep or rhythm phase.', valueType: 'time-like value', localCode: 'circadian-midpoint' }
        ]
      },
      {
        panel: 'Sensory physiology',
        traits: [
          { trait: 'Dark adaptation time', description: 'Time required to adapt to low-light conditions.', valueType: 'numeric', localCode: 'dark-adaptation-time' },
          { trait: 'Hearing threshold baseline', description: 'Audiometric threshold baseline.', valueType: 'numeric', localCode: 'hearing-threshold-baseline' },
          { trait: 'Vestibular sensitivity baseline', description: 'Baseline sensitivity to vestibular provocation / motion.', valueType: 'numeric or coded answer', localCode: 'vestibular-sensitivity-baseline' }
        ]
      }
    ]
  },
  {
    domain: 'Performance',
    panels: [
      {
        panel: 'Strength',
        traits: [
          { trait: 'Bench press 1RM', description: 'Maximum single-repetition bench press.', valueType: 'numeric', localCode: 'bench-press-1rm' },
          { trait: 'Squat 1RM', description: 'Maximum single-repetition squat.', valueType: 'numeric', localCode: 'squat-1rm' },
          { trait: 'Deadlift 1RM', description: 'Maximum single-repetition deadlift.', valueType: 'numeric', localCode: 'deadlift-1rm' },
          { trait: 'Pull-up maximum reps', description: 'Maximum strict pull-ups.', valueType: 'numeric', localCode: 'pull-up-maximum-reps' },
          { trait: 'Push-up maximum reps', description: 'Maximum strict push-ups under defined protocol.', valueType: 'numeric', localCode: 'push-up-maximum-reps' }
        ]
      },
      {
        panel: 'Power',
        traits: [
          { trait: 'Vertical jump height', description: 'Maximum vertical jump height.', valueType: 'numeric', localCode: 'vertical-jump-height' }
        ]
      },
      {
        panel: 'Core endurance',
        traits: [
          { trait: 'Plank hold duration', description: 'Maximum plank hold duration.', valueType: 'numeric', localCode: 'plank-hold-duration' }
        ]
      },
      {
        panel: 'Speed',
        traits: [
          { trait: 'Sprint time 40 m', description: 'Time to complete a 40 m sprint.', valueType: 'numeric', localCode: 'sprint-time-40-m' }
        ]
      },
      {
        panel: 'Endurance',
        traits: [
          { trait: '4-minute mile equivalent', description: 'Derived indicator capturing elite running capacity or equivalent threshold.', valueType: 'derived / numeric', localCode: '4-minute-mile-equivalent' }
        ]
      },
      {
        panel: 'Agility',
        traits: [
          { trait: 'Agility T-test time', description: 'Agility test completion time.', valueType: 'numeric', localCode: 'agility-t-test-time' }
        ]
      },
      {
        panel: 'Dexterity',
        traits: [
          { trait: 'Tremor amplitude', description: 'Amplitude of physiologic or task tremor.', valueType: 'numeric', localCode: 'tremor-amplitude' },
          { trait: 'Pegboard / fine motor score', description: 'Fine-motor dexterity score (e.g., Purdue Pegboard style).', valueType: 'numeric', localCode: 'pegboard-fine-motor-score' },
          { trait: 'Typing speed', description: 'Typing speed baseline.', valueType: 'numeric', localCode: 'typing-speed' }
        ]
      },
      {
        panel: 'Task performance',
        traits: [
          { trait: 'Tool manipulation score', description: 'Performance score for manipulating tools under analog conditions.', valueType: 'numeric', localCode: 'tool-manipulation-score' }
        ]
      }
    ]
  },
  {
    domain: 'Cognition',
    panels: [
      {
        panel: 'Executive / working memory',
        traits: [
          { trait: 'Working memory score', description: 'Working-memory test score.', valueType: 'numeric', localCode: 'working-memory-score' },
          { trait: 'Executive function score', description: 'Executive-function composite score.', valueType: 'numeric', localCode: 'executive-function-score' }
        ]
      },
      {
        panel: 'Spatial cognition',
        traits: [
          { trait: 'Spatial reasoning score', description: 'Spatial reasoning / mental rotation score.', valueType: 'numeric', localCode: 'spatial-reasoning-score' }
        ]
      },
      {
        panel: 'Attention',
        traits: [
          { trait: 'Sustained attention score', description: 'Continuous-performance or analogous attention score.', valueType: 'numeric', localCode: 'sustained-attention-score' }
        ]
      },
      {
        panel: 'Processing speed',
        traits: [
          { trait: 'Processing speed score', description: 'Psychomotor or cognitive processing-speed score.', valueType: 'numeric', localCode: 'processing-speed-score' }
        ]
      },
      {
        panel: 'Language',
        traits: [
          { trait: 'Verbal fluency score', description: 'Category/letter fluency score.', valueType: 'numeric', localCode: 'verbal-fluency-score' }
        ]
      },
      {
        panel: 'Operational cognition',
        traits: [
          { trait: 'Stress tolerance score', description: 'Task performance or self-report stress-tolerance score under load.', valueType: 'numeric or coded answer', localCode: 'stress-tolerance-score' },
          { trait: 'Sleep deprivation resilience score', description: 'Performance-retention score under sleep loss.', valueType: 'numeric', localCode: 'sleep-deprivation-resilience-score' },
          { trait: 'Hazard recognition score', description: 'Accuracy/speed in identifying mission hazards.', valueType: 'numeric', localCode: 'hazard-recognition-score' },
          { trait: 'Situational awareness score', description: 'Mission or simulator situational-awareness metric.', valueType: 'numeric', localCode: 'situational-awareness-score' }
        ]
      }
    ]
  },
  {
    domain: 'Sensory & vestibular',
    panels: [
      {
        panel: 'Visual function',
        traits: [
          { trait: 'Visual acuity baseline', description: 'Visual acuity baseline under standard protocol.', valueType: 'numeric or coded answer', localCode: 'visual-acuity-baseline' },
          { trait: 'Contrast sensitivity', description: 'Contrast sensitivity baseline.', valueType: 'numeric', localCode: 'contrast-sensitivity' },
          { trait: 'Color vision status', description: 'Color discrimination / deficiency screen result.', valueType: 'coded answer', localCode: 'color-vision-status' }
        ]
      },
      {
        panel: 'Auditory function',
        traits: [
          { trait: 'Audiometric threshold', description: 'Baseline hearing threshold across frequencies.', valueType: 'numeric', localCode: 'audiometric-threshold' }
        ]
      },
      {
        panel: 'Vestibular function',
        traits: [
          { trait: 'Motion sickness susceptibility', description: 'Baseline susceptibility to motion sickness.', valueType: 'numeric or coded answer', localCode: 'motion-sickness-susceptibility' },
          { trait: 'Vestibular function score', description: 'Composite vestibular testing score.', valueType: 'numeric', localCode: 'vestibular-function-score' },
          { trait: 'Balance / posturography score', description: 'Static/dynamic balance score.', valueType: 'numeric', localCode: 'balance-posturography-score' },
          { trait: 'Nystagmus burden', description: 'Quantified nystagmus burden under provocation.', valueType: 'numeric', localCode: 'nystagmus-burden' }
        ]
      },
      {
        panel: 'Neurologic susceptibility',
        traits: [
          { trait: 'Migraine susceptibility', description: 'Baseline migraine susceptibility phenotype.', valueType: 'coded answer', localCode: 'migraine-susceptibility' },
          { trait: 'Photophobia threshold', description: 'Light sensitivity threshold.', valueType: 'numeric', localCode: 'photophobia-threshold' }
        ]
      }
    ]
  },
  {
    domain: 'Aerospace phenotype',
    panels: [
      {
        panel: 'Radiation',
        traits: [
          { trait: 'Bone marrow dose', description: 'Organ-specific bone marrow dose.', valueType: 'numeric', localCode: 'bone-marrow-dose' },
          { trait: 'Eye lens dose', description: 'Organ-specific eye lens dose.', valueType: 'numeric', localCode: 'eye-lens-dose' },
          { trait: 'Skin dose', description: 'Organ-specific skin dose.', valueType: 'numeric', localCode: 'skin-dose' },
          { trait: 'CNS dose', description: 'Organ-specific CNS dose.', valueType: 'numeric', localCode: 'cns-dose' }
        ]
      },
      {
        panel: 'Suit fit / geometry',
        traits: [
          { trait: 'Suit size class', description: 'Primary suit size classification.', valueType: 'coded answer', localCode: 'suit-size-class' },
          { trait: 'Glove size', description: 'Operational glove size for EVA / suit systems.', valueType: 'coded answer', localCode: 'glove-size' },
          { trait: 'Helmet size', description: 'Operational helmet size.', valueType: 'coded answer', localCode: 'helmet-size' },
          { trait: 'Neutral buoyancy ballast requirement', description: 'Ballast required for neutral buoyancy analog training.', valueType: 'numeric', localCode: 'neutral-buoyancy-ballast-requirement' },
          { trait: 'EVA reach envelope', description: 'Reach envelope while suited / EVA-configured.', valueType: 'numeric', localCode: 'eva-reach-envelope' }
        ]
      },
      {
        panel: 'Pressure tolerance',
        traits: [
          { trait: 'Dive clearance status', description: 'Medical clearance for diving / pressure exposure.', valueType: 'coded answer', localCode: 'dive-clearance-status' },
          { trait: 'Pressure tolerance score', description: 'Composite phenotype for pressure transitions / decompression tolerance.', valueType: 'numeric', localCode: 'pressure-tolerance-score' }
        ]
      },
      {
        panel: 'Biomechanics',
        traits: [
          { trait: 'Neck torque tolerance', description: 'Maximum tolerated neck torque or operational threshold.', valueType: 'numeric', localCode: 'neck-torque-tolerance' }
        ]
      },
      {
        panel: 'Thermal tolerance',
        traits: [
          { trait: 'Heat tolerance score', description: 'Operational heat-tolerance phenotype.', valueType: 'numeric', localCode: 'heat-tolerance-score' },
          { trait: 'Cold tolerance score', description: 'Operational cold-tolerance phenotype.', valueType: 'numeric', localCode: 'cold-tolerance-score' }
        ]
      },
      {
        panel: 'Operational performance',
        traits: [
          { trait: 'Underwater communication clarity score', description: 'Communication quality score in underwater/EVA analog environment.', valueType: 'numeric', localCode: 'underwater-communication-clarity-score' },
          { trait: 'EVA task performance score', description: 'Composite EVA analog task-performance score.', valueType: 'numeric', localCode: 'eva-task-performance-score' }
        ]
      }
    ]
  }
];
