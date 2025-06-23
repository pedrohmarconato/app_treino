// Mapeamento de grupos musculares para ícones SVG
const muscleGroups = {
  'Peito': {
    primary: '/assets/muscle-groups/peito/chest-full.svg',
    color: '#ffffff', // Branco
    muscles: ['Peitoral']
  },
  'Costas': {
    primary: '/assets/muscle-groups/costas/lats.svg',
    variants: {
      lats: '/assets/muscle-groups/costas/lats.svg',
      traps: '/assets/muscle-groups/costas/traps.svg'
    },
    color: '#ffffff', // Branco
    muscles: ['Dorsais', 'Trapézio']
  },
  'Pernas': {
    primary: '/assets/muscle-groups/pernas/quads.svg',
    variants: {
      quads: '/assets/muscle-groups/pernas/quads.svg',
      hamstrings: '/assets/muscle-groups/pernas/hamstrings.svg',
      calves: '/assets/muscle-groups/pernas/calves.svg',
      glutes: '/assets/muscle-groups/pernas/glutes.svg'
    },
    color: '#ffffff', // Branco
    muscles: ['Quadríceps', 'Posterior', 'Panturrilha', 'Glúteos']
  },
  'Ombro': {
    primary: '/assets/muscle-groups/costas/traps.svg', // Usando trapézio como referência
    color: '#ffffff', // Branco
    muscles: ['Deltoides']
  },
  'Braço': {
    primary: '/assets/muscle-groups/braco/biceps.svg',
    variants: {
      biceps: '/assets/muscle-groups/braco/biceps.svg',
      triceps: '/assets/muscle-groups/braco/triceps.svg'
    },
    color: '#ffffff', // Branco
    muscles: ['Bíceps', 'Tríceps']
  },
  'Ombro e Braço': {
    primary: '/assets/muscle-groups/braco/biceps.svg',
    variants: {
      biceps: '/assets/muscle-groups/braco/biceps.svg',
      triceps: '/assets/muscle-groups/braco/triceps.svg',
      shoulders: '/assets/muscle-groups/costas/traps.svg'
    },
    color: '#ffffff', // Branco
    muscles: ['Deltoides', 'Bíceps', 'Tríceps']
  },
  'Core': {
    primary: '/assets/muscle-groups/core/abs.svg',
    color: '#ffffff', // Branco
    muscles: ['Abdominais']
  },
  'cardio': {
    primary: null, // Cardio não tem SVG específico
    color: '#f59e0b',
    icon: '' // Removido emoji
  },
  'folga': {
    primary: '/SVG_MUSCLE/folga.svg',
    color: '#666666',
    icon: '' // Removido emoji
  },
  'descanso': {
    primary: '/SVG_MUSCLE/folga.svg',
    color: '#666666',
    icon: '' // Removido emoji
  }
};

export default muscleGroups;