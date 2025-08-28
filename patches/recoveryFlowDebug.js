/**
 * Patch temporário para debug do fluxo de recuperação
 * Adiciona logs detalhados e tratamento de erros
 */

(function () {
  console.log('[PATCH] Aplicando debug de recuperação de treino...');

  // 1. Interceptar o método resumeWorkout do ContextualWorkoutButton
  if (window.ContextualWorkoutButton) {
    const originalResumeWorkout = window.ContextualWorkoutButton.prototype.resumeWorkout;

    window.ContextualWorkoutButton.prototype.resumeWorkout = async function () {
      console.log('[PATCH] 🎯 resumeWorkout interceptado no ContextualWorkoutButton');
      console.log('[PATCH] Estado atual do botão:', this.currentState);
      console.log('[PATCH] Dados do estado:', this.stateData);

      try {
        console.log('[PATCH] Obtendo workoutState...');
        const workoutState = await TreinoCacheService.getWorkoutState();
        console.log('[PATCH] WorkoutState obtido:', workoutState);

        if (!workoutState) {
          throw new Error('Nenhum estado de treino encontrado no cache');
        }

        console.log('[PATCH] Verificando métodos disponíveis...');
        console.log('[PATCH] - window.resumeWorkout:', typeof window.resumeWorkout);
        console.log('[PATCH] - window.workoutExecutionManager:', !!window.workoutExecutionManager);

        if (window.resumeWorkout) {
          console.log('[PATCH] Chamando window.resumeWorkout...');
          const result = await window.resumeWorkout(workoutState);
          console.log('[PATCH] ✅ Resultado do resumeWorkout:', result);
          return result;
        } else if (window.workoutExecutionManager?.resumeFromCache) {
          console.log('[PATCH] Chamando workoutExecutionManager.resumeFromCache...');
          const result = await window.workoutExecutionManager.resumeFromCache(workoutState);
          console.log('[PATCH] ✅ Resultado do resumeFromCache:', result);
          return result;
        } else {
          throw new Error('Nenhum método de recuperação disponível');
        }
      } catch (error) {
        console.error('[PATCH] ❌ Erro em resumeWorkout:', error);
        console.error('[PATCH] Stack trace:', error.stack);

        if (window.showNotification) {
          window.showNotification(`Erro ao recuperar treino: ${error.message}`, 'error');
        }

        throw error;
      }
    };
  }

  // 2. Interceptar o handleClick do ContextualWorkoutButton
  if (window.ContextualWorkoutButton) {
    const originalHandleClick = window.ContextualWorkoutButton.prototype.handleClick;

    window.ContextualWorkoutButton.prototype.handleClick = async function (event) {
      console.log('[PATCH] 🖱️ handleClick interceptado');
      console.log('[PATCH] Evento:', {
        type: event.type,
        target: event.target,
        currentTarget: event.currentTarget,
        defaultPrevented: event.defaultPrevented,
      });
      console.log('[PATCH] Estado do botão:', {
        state: this.currentState,
        disabled: this.element.disabled,
        action: this.buttonStates[this.currentState]?.action,
      });

      try {
        return await originalHandleClick.call(this, event);
      } catch (error) {
        console.error('[PATCH] ❌ Erro em handleClick:', error);
        throw error;
      }
    };
  }

  // 3. Interceptar o resumeFromCache do WorkoutExecutionManager
  if (window.workoutExecutionManager) {
    const originalResumeFromCache = window.workoutExecutionManager.resumeFromCache;

    window.workoutExecutionManager.resumeFromCache = async function (cacheData) {
      console.log('[PATCH] 🔄 resumeFromCache interceptado no WorkoutExecutionManager');
      console.log('[PATCH] Cache data recebido:', cacheData);
      console.log('[PATCH] Estado atual do manager:', {
        isInitialized: this.isInitialized,
        currentWorkout: !!this.currentWorkout,
        exerciciosExecutados: this.exerciciosExecutados?.length || 0,
      });

      try {
        const result = await originalResumeFromCache.call(this, cacheData);
        console.log('[PATCH] ✅ resumeFromCache concluído com sucesso:', result);
        return result;
      } catch (error) {
        console.error('[PATCH] ❌ Erro em resumeFromCache:', error);
        console.error('[PATCH] Stack trace:', error.stack);
        throw error;
      }
    };
  }

  // 4. Interceptar navegarParaTelaWorkout
  if (window.workoutExecutionManager) {
    const originalNavegar = window.workoutExecutionManager.navegarParaTelaWorkout;

    window.workoutExecutionManager.navegarParaTelaWorkout = async function () {
      console.log('[PATCH] 📱 navegarParaTelaWorkout interceptado');
      console.log('[PATCH] Estado antes da navegação:', {
        currentScreen: document.querySelector('.screen.active')?.id,
        workoutScreenExists: !!document.querySelector('#workout-screen'),
        renderTemplate: typeof window.renderTemplate,
      });

      try {
        const result = await originalNavegar.call(this);

        console.log('[PATCH] Estado após navegação:', {
          currentScreen: document.querySelector('.screen.active')?.id,
          workoutScreenVisible: document.querySelector('#workout-screen')?.style.display,
        });

        return result;
      } catch (error) {
        console.error('[PATCH] ❌ Erro em navegarParaTelaWorkout:', error);
        throw error;
      }
    };
  }

  // 5. Adicionar listener global para detectar cliques no botão
  document.addEventListener(
    'click',
    function (event) {
      const button = event.target.closest('#contextual-workout-btn');
      if (button) {
        console.log('[PATCH] 🎯 Clique detectado no botão contextual');
        console.log('[PATCH] Estado do botão:', {
          dataState: button.getAttribute('data-state'),
          dataAction: button.getAttribute('data-action'),
          disabled: button.disabled,
          classList: Array.from(button.classList),
        });
      }
    },
    true
  ); // Usar captura para pegar o evento antes

  // 6. Verificar estado inicial
  setTimeout(() => {
    console.log('[PATCH] 🔍 Verificação inicial após 2 segundos:');

    const button = document.getElementById('contextual-workout-btn');
    if (button) {
      console.log('[PATCH] Botão encontrado:', {
        state: button.getAttribute('data-state'),
        action: button.getAttribute('data-action'),
        disabled: button.disabled,
      });
    }

    console.log('[PATCH] Métodos globais:', {
      resumeWorkout: typeof window.resumeWorkout,
      workoutExecutionManager: !!window.workoutExecutionManager,
      renderTemplate: typeof window.renderTemplate,
    });

    // Verificar se há dados salvos
    TreinoCacheService.hasActiveWorkout().then((hasActive) => {
      console.log('[PATCH] Treino ativo no cache:', hasActive);

      if (hasActive) {
        TreinoCacheService.getWorkoutState().then((state) => {
          console.log('[PATCH] Estado do treino:', {
            exerciciosExecutados: state?.exerciciosExecutados?.length || 0,
            currentWorkout: state?.currentWorkout?.nome || 'N/A',
          });
        });
      }
    });
  }, 2000);

  console.log('[PATCH] ✅ Debug de recuperação aplicado com sucesso');

  // Expor função para aplicar patch manualmente se necessário
  window.applyRecoveryDebugPatch = function () {
    console.log('[PATCH] Patch já foi aplicado automaticamente');
  };
})();
