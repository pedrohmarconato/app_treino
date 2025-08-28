/**
 * 💪 MAPEAMENTO DE GRUPOS MUSCULARES - Muscle Group Icons
 *
 * FUNÇÃO: Definir mapeamento entre grupos musculares e seus respectivos ícones SVG.
 *
 * RESPONSABILIDADES:
 * - Mapear grupos musculares para arquivos SVG específicos
 * - Definir variações de ícones para diferentes contextos (primary, variants)
 * - Estabelecer paleta de cores para cada grupo muscular
 * - Listar músculos incluídos em cada grupo
 * - Suportar tipos especiais (cardio, folga) com tratamento diferenciado
 * - Fornecer estrutura consistente para o sistema de ícones
 *
 * ESTRUTURA DOS GRUPOS:
 * - primary: ícone principal do grupo muscular
 * - variants: variações específicas (lats, traps, quads, etc.)
 * - color: cor padrão para o grupo (#ffffff para músculos)
 * - muscles: lista de músculos incluídos no grupo
 * - icon: emoji de fallback (removido para melhor consistência)
 *
 * GRUPOS INCLUÍDOS:
 * - Peito: peitoral completo
 * - Costas: dorsais e trapézio com variações
 * - Pernas: quadríceps, posterior, panturrilha, glúteos
 * - Ombro: deltoides
 * - Braço: bíceps e tríceps
 * - Core: abdominais
 * - Especiais: cardio e folga com cores diferenciadas
 *
 * INTEGRAÇÃO: Usado pelo MuscleGroupIcon component para renderização de ícones
 */

// Mapeamento de grupos musculares para ícones SVG
const muscleGroups = {
  Peito: {
    primary: './assets/muscle-groups/peito/chest-full.svg',
    color: '#ffffff', // Branco
    muscles: ['Peitoral'],
  },
  Costas: {
    primary: './assets/muscle-groups/costas/lats.svg',
    variants: {
      lats: './assets/muscle-groups/costas/lats.svg',
      traps: './assets/muscle-groups/costas/traps.svg',
    },
    color: '#ffffff', // Branco
    muscles: ['Dorsais', 'Trapézio'],
  },
  Pernas: {
    primary: './assets/muscle-groups/pernas/quads.svg',
    variants: {
      quads: './assets/muscle-groups/pernas/quads.svg',
      hamstrings: './assets/muscle-groups/pernas/hamstrings.svg',
      calves: './assets/muscle-groups/pernas/calves.svg',
      glutes: './assets/muscle-groups/pernas/glutes.svg',
    },
    color: '#ffffff', // Branco
    muscles: ['Quadríceps', 'Posterior', 'Panturrilha', 'Glúteos'],
  },
  Ombro: {
    primary: './assets/muscle-groups/costas/traps.svg', // Usando trapézio como referência
    color: '#ffffff', // Branco
    muscles: ['Deltoides'],
  },
  Braço: {
    primary: './assets/muscle-groups/braco/biceps.svg',
    variants: {
      biceps: './assets/muscle-groups/braco/biceps.svg',
      triceps: './assets/muscle-groups/braco/triceps.svg',
    },
    color: '#ffffff', // Branco
    muscles: ['Bíceps', 'Tríceps'],
  },
  'Ombro e Braço': {
    primary: './assets/muscle-groups/braco/biceps.svg',
    variants: {
      biceps: './assets/muscle-groups/braco/biceps.svg',
      triceps: './assets/muscle-groups/braco/triceps.svg',
      shoulders: './assets/muscle-groups/costas/traps.svg',
    },
    color: '#ffffff', // Branco
    muscles: ['Deltoides', 'Bíceps', 'Tríceps'],
  },
  Core: {
    primary: './assets/muscle-groups/core/abs.svg',
    color: '#ffffff', // Branco
    muscles: ['Abdominais'],
  },
  cardio: {
    primary: './SVG_MUSCLE/cardio.svg',
    color: '#f59e0b',
    icon: '', // Removido emoji
  },
  folga: {
    primary: './SVG_MUSCLE/folga.svg',
    color: '#666666',
    icon: '', // Removido emoji
  },
  descanso: {
    primary: './SVG_MUSCLE/folga.svg',
    color: '#666666',
    icon: '', // Removido emoji
  },
};

export default muscleGroups;
