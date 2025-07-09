/**
 * 🔗 DEPENDÊNCIAS DE COMPONENTES - Component Dependencies
 * 
 * FUNÇÃO: Mapear dependências entre componentes para facilitar debugging e manutenção.
 * 
 * RESPONSABILIDADES:
 * - Documentar imports necessários para cada componente
 * - Definir exports disponibilizados por cada módulo
 * - Mapear dependências globais (window, document)
 * - Estabelecer fluxos de integração entre componentes
 * - Facilitar identificação de dependências circulares
 * - Servir como referência para refatorações
 * 
 * ESTRUTURA DAS DEPENDÊNCIAS:
 * - imports: array de módulos importados pelo componente
 * - exports: array de classes/funções exportadas
 * - globals: dependências de objetos globais
 * - integration: fluxo de integração e uso do componente
 * 
 * COMPONENTES MAPEADOS:
 * - SaveExitModal: modal de saída com salvamento
 * - SessionRecoveryModal: modal de recuperação de sessão
 * - NavigationGuard: guarda de navegação para treinos
 * 
 * USO: Referência para desenvolvedores e sistemas de build
 */

// templates/COMPONENT_DEPENDENCIES.js
export const ComponentDependencies = {
    SaveExitModal: {
      imports: [
        'services/treinoCacheService.js',
        'state/appState.js',
        'utils/accessibility.js'
      ],
      exports: ['SaveExitModal'],
      globals: ['document', 'window'],
      integration: 'NavigationGuard → SaveExitModal → TreinoCacheService'
    },
  
    SessionRecoveryModal: {
      imports: [
        'services/treinoCacheService.js',
        'utils/timeFormatter.js',
        'utils/accessibility.js'
      ],
      exports: ['SessionRecoveryModal'],
      integration: 'ContextualButton → SessionRecoveryModal → WorkoutManager'
    },
  
    NavigationGuard: {
      imports: [
        'state/appState.js',
        'components/SaveExitModal.js',
        'services/treinoCacheService.js'
      ],
      exports: ['NavigationGuard'],
      integration: 'ui/navigation.js → NavigationGuard → Modal System'
    }
  };