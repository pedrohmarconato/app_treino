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