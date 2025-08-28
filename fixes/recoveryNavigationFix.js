/**
 * Fix para o problema de navegação na recuperação de treino
 * O problema: quando clica em "Voltar ao Treino", nada acontece
 * A solução: garantir que a navegação funcione corretamente
 */

(function () {
  console.log('[FIX] Aplicando correção de navegação de recuperação...');

  // 1. Verificar e corrigir o método navegarParaTelaWorkout
  if (window.workoutExecutionManager) {
    const originalNavegar = window.workoutExecutionManager.navegarParaTelaWorkout;

    window.workoutExecutionManager.navegarParaTelaWorkout = async function () {
      console.log('[FIX] 📱 Navegando para tela de workout (com fix)...');

      try {
        // Primeiro tentar o método original
        if (originalNavegar) {
          await originalNavegar.call(this);
        }

        // Verificar se a navegação funcionou
        await new Promise((resolve) => setTimeout(resolve, 500));

        const workoutScreen = document.querySelector('#workout-screen');
        const isVisible =
          workoutScreen && window.getComputedStyle(workoutScreen).display !== 'none';

        if (!isVisible) {
          console.log('[FIX] ⚠️ Navegação original falhou, aplicando fix...');

          // Fix: Forçar navegação
          // 1. Esconder todas as telas
          document.querySelectorAll('.screen').forEach((screen) => {
            screen.classList.remove('active');
            screen.style.display = 'none';
          });

          // 2. Verificar se existe workout-screen
          let workoutScreenEl = document.querySelector('#workout-screen');

          if (!workoutScreenEl) {
            console.log('[FIX] 🔨 Criando tela de workout...');

            // Tentar renderizar via template
            if (window.renderTemplate) {
              try {
                await window.renderTemplate('workout');
                await new Promise((resolve) => setTimeout(resolve, 500));
                workoutScreenEl = document.querySelector('#workout-screen');
              } catch (error) {
                console.error('[FIX] Erro ao renderizar template:', error);
              }
            }

            // Se ainda não existir, criar manualmente
            if (!workoutScreenEl) {
              workoutScreenEl = document.createElement('div');
              workoutScreenEl.id = 'workout-screen';
              workoutScreenEl.className = 'screen';
              workoutScreenEl.innerHTML = '<div class="loading">Carregando treino...</div>';
              document.getElementById('app').appendChild(workoutScreenEl);
            }
          }

          // 3. Mostrar a tela
          workoutScreenEl.style.display = 'block';
          workoutScreenEl.classList.add('active');

          // 4. Atualizar URL se necessário
          if (window.history && window.history.pushState) {
            window.history.pushState({ page: 'workout' }, '', '#workout');
          }

          console.log('[FIX] ✅ Navegação forçada concluída');
        }

        return true;
      } catch (error) {
        console.error('[FIX] ❌ Erro na navegação:', error);

        // Último recurso: recarregar com hash
        console.log('[FIX] 🔄 Recarregando página para workout...');
        window.location.href = '/#workout';
        window.location.reload();
      }
    };
  }

  // 2. Garantir que resumeFromCache complete a navegação
  if (window.workoutExecutionManager) {
    const originalResumeFromCache = window.workoutExecutionManager.resumeFromCache;

    window.workoutExecutionManager.resumeFromCache = async function (cacheData) {
      console.log('[FIX] 🔄 Executando resumeFromCache com fix...');

      try {
        // Chamar método original
        let result = false;
        if (originalResumeFromCache) {
          result = await originalResumeFromCache.call(this, cacheData);
        }

        // Aguardar um pouco
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Verificar se estamos na tela de workout
        const workoutScreen = document.querySelector('#workout-screen');
        const isVisible =
          workoutScreen && window.getComputedStyle(workoutScreen).display !== 'none';

        if (!isVisible) {
          console.log('[FIX] ⚠️ Não estamos na tela de workout após resume, forçando navegação...');
          await this.navegarParaTelaWorkout();

          // Aguardar e re-renderizar se necessário
          await new Promise((resolve) => setTimeout(resolve, 500));

          if (this.renderizar) {
            await this.renderizar();
          }
        }

        // Mostrar notificação de sucesso
        if (window.showNotification) {
          window.showNotification('Treino recuperado com sucesso!', 'success');
        }

        return result;
      } catch (error) {
        console.error('[FIX] ❌ Erro em resumeFromCache:', error);

        if (window.showNotification) {
          window.showNotification('Erro ao recuperar treino: ' + error.message, 'error');
        }

        throw error;
      }
    };
  }

  // 3. Fix direto no botão contextual
  setTimeout(() => {
    const button = document.getElementById('contextual-workout-btn');
    if (button) {
      // Adicionar listener de emergência
      button.addEventListener(
        'click',
        async function (e) {
          if (
            this.getAttribute('data-state') === 'resume' &&
            this.getAttribute('data-action') === 'resumeWorkout'
          ) {
            console.log('[FIX] 🚨 Listener de emergência ativado');

            // Prevenir múltiplos cliques
            if (this.dataset.processing === 'true') {
              console.log('[FIX] ⏳ Já processando, ignorando clique');
              return;
            }

            this.dataset.processing = 'true';

            try {
              // Obter estado do cache
              const workoutState = await TreinoCacheService.getWorkoutState();

              if (!workoutState) {
                throw new Error('Nenhum treino salvo encontrado');
              }

              // Tentar resumir
              if (
                window.workoutExecutionManager &&
                window.workoutExecutionManager.resumeFromCache
              ) {
                await window.workoutExecutionManager.resumeFromCache(workoutState);
              } else if (window.resumeWorkout) {
                await window.resumeWorkout(workoutState);
              } else {
                throw new Error('Função de recuperação não disponível');
              }
            } catch (error) {
              console.error('[FIX] Erro no listener de emergência:', error);
              if (window.showNotification) {
                window.showNotification('Erro: ' + error.message, 'error');
              }
            } finally {
              this.dataset.processing = 'false';
            }
          }
        },
        true
      ); // Usar captura para garantir que seja executado primeiro
    }
  }, 2000);

  // 4. Função auxiliar para debug
  window.debugRecoveryNavigation = async function () {
    console.log('=== DEBUG NAVEGAÇÃO DE RECUPERAÇÃO ===');

    const checks = {
      workoutScreen: document.querySelector('#workout-screen'),
      workoutScreenVisible: false,
      activeScreen: document.querySelector('.screen.active')?.id,
      renderTemplate: typeof window.renderTemplate,
      workoutExecutionManager: !!window.workoutExecutionManager,
      cachedState: await TreinoCacheService.getWorkoutState(),
    };

    if (checks.workoutScreen) {
      checks.workoutScreenVisible =
        window.getComputedStyle(checks.workoutScreen).display !== 'none';
    }

    console.table(checks);

    return checks;
  };

  // 5. Função para forçar navegação manual
  window.forceNavigateToWorkout = async function () {
    console.log('[FIX] Forçando navegação para workout...');

    try {
      if (window.workoutExecutionManager && window.workoutExecutionManager.navegarParaTelaWorkout) {
        await window.workoutExecutionManager.navegarParaTelaWorkout();
      } else if (window.renderTemplate) {
        await window.renderTemplate('workout');
      } else if (window.mostrarTela) {
        window.mostrarTela('workout-screen');
      } else {
        // Navegação manual
        document.querySelectorAll('.screen').forEach((s) => {
          s.classList.remove('active');
          s.style.display = 'none';
        });

        const workout = document.querySelector('#workout-screen');
        if (workout) {
          workout.style.display = 'block';
          workout.classList.add('active');
        }
      }

      console.log('[FIX] ✅ Navegação forçada concluída');
    } catch (error) {
      console.error('[FIX] ❌ Erro ao forçar navegação:', error);
    }
  };

  console.log('[FIX] ✅ Correção de navegação aplicada');
  console.log('[FIX] Use debugRecoveryNavigation() para verificar estado');
  console.log('[FIX] Use forceNavigateToWorkout() para forçar navegação');
})();
