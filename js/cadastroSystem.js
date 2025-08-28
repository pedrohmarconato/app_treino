/**
 * 🆕 SISTEMA DE CADASTRO - INTEGRAÇÃO GLOBAL
 *
 * Script para carregar e disponibilizar o sistema de cadastro
 * de forma compatível com o projeto existente.
 */

// Mock trackEvent para compatibilidade
if (!window.trackEvent) {
  window.trackEvent = function (event, data) {
    console.log(`📊 [trackEvent] ${event}`, data);
  };
}

// Função para carregar o sistema de cadastro
async function loadCadastroSystem() {
  console.log('[cadastroSystem] 🔧 Carregando sistema de cadastro...');

  try {
    console.log('[cadastroSystem] 📦 Importando módulos...');

    // Carregar módulos ES6 dinamicamente
    console.log('[cadastroSystem] 1/3 - Carregando userRegistrationService...');
    const registrationModule = await import('../services/userRegistrationService.js');
    console.log(
      '[cadastroSystem] ✅ userRegistrationService carregado:',
      !!registrationModule.cadastrarNovoUsuario
    );

    console.log('[cadastroSystem] 2/3 - Carregando userValidationService...');
    const validationModule = await import('../services/userValidationService.js');
    console.log(
      '[cadastroSystem] ✅ userValidationService carregado:',
      !!validationModule.validateUserData
    );

    console.log('[cadastroSystem] 3/3 - Carregando CadastroUsuarioModal...');
    const modalModule = await import('../components/CadastroUsuarioModal.js');
    console.log('[cadastroSystem] ✅ CadastroUsuarioModal carregado:', !!modalModule.default);

    const { cadastrarNovoUsuario } = registrationModule;

    const { validateUserData, checkRateLimit, resetRateLimit, logLGPDConsent } = validationModule;

    const CadastroUsuarioModal = modalModule.default;

    // Disponibilizar globalmente
    window.CadastroSystem = {
      cadastrarNovoUsuario,
      validateUserData,
      checkRateLimit,
      resetRateLimit,
      logLGPDConsent,
      CadastroUsuarioModal,
    };

    console.log('[cadastroSystem] ✅ Sistema carregado com sucesso');
    return true;
  } catch (error) {
    console.error('[cadastroSystem] ❌ Erro ao carregar sistema:', error);
    return false;
  }
}

// Função para abrir questionário de usuário
async function abrirQuestionarioUsuario(usuario) {
  console.log('[abrirQuestionarioUsuario] 📋 Iniciando questionário para:', usuario.nome);

  try {
    // Carregar modal do questionário
    console.log('[abrirQuestionarioUsuario] 📦 Carregando QuestionnaireModal...');
    const { default: QuestionnaireModal } = await import('../components/QuestionnaireModal.js');

    // Carregar CSS do questionário
    const linkExists = document.getElementById('questionnaire-styles');
    if (!linkExists) {
      const link = document.createElement('link');
      link.id = 'questionnaire-styles';
      link.rel = 'stylesheet';
      link.href = './css/questionnaire-modal.css';
      document.head.appendChild(link);

      // Aguardar CSS carregar
      await new Promise((resolve) => {
        link.onload = resolve;
        setTimeout(resolve, 100); // fallback
      });
    }

    console.log('[abrirQuestionarioUsuario] ✅ QuestionnaireModal carregado');

    // Criar instância do modal
    const modal = new QuestionnaireModal();
    console.log('[abrirQuestionarioUsuario] 🚀 Abrindo questionário...');

    // Mostrar questionário
    const resultado = await modal.show(usuario);

    if (resultado) {
      console.log('[abrirQuestionarioUsuario] ✅ Questionário concluído:', Object.keys(resultado));

      // Salvar dados do questionário no banco
      try {
        console.log('[abrirQuestionarioUsuario] 💾 Salvando questionário no banco...');
        const { salvarQuestionario } = await import('../services/questionnaireService.js');

        const resultadoSalvar = await salvarQuestionario(resultado);

        if (resultadoSalvar.success) {
          console.log('[abrirQuestionarioUsuario] ✅ Questionário salvo com sucesso no banco');
        } else {
          console.error(
            '[abrirQuestionarioUsuario] ❌ Erro ao salvar questionário:',
            resultadoSalvar.error
          );
        }
      } catch (saveError) {
        console.error('[abrirQuestionarioUsuario] ❌ Erro no serviço de questionário:', saveError);
      }

      return resultado;
    } else {
      console.log('[abrirQuestionarioUsuario] ℹ️ Questionário cancelado');
      return null;
    }
  } catch (error) {
    console.error('[abrirQuestionarioUsuario] ❌ Erro:', error);
    throw error;
  }
}

// Função para abrir modal de cadastro (compatível com o projeto)
window.abrirModalCadastro = async function (e) {
  // Evitar que o clique que abriu o modal se propague e feche-o imediatamente
  if (e && e.stopPropagation) {
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    if (e.preventDefault) e.preventDefault();
  }

  console.log('[abrirModalCadastro] 🚀 Iniciando...');

  try {
    // Garantir que o sistema está carregado
    if (!window.CadastroSystem) {
      console.log('[abrirModalCadastro] Sistema não carregado, carregando...');
      const loaded = await loadCadastroSystem();
      if (!loaded) {
        throw new Error('Falha ao carregar sistema de cadastro');
      }
    }

    console.log('[abrirModalCadastro] 📋 Criando instância do modal...');
    console.log('[abrirModalCadastro] 🔍 CadastroSystem disponível:', !!window.CadastroSystem);
    console.log(
      '[abrirModalCadastro] 🔍 CadastroUsuarioModal disponível:',
      !!window.CadastroSystem.CadastroUsuarioModal
    );
    console.log('[abrirModalCadastro] 🔍 Corpo do documento:', !!document.body);
    console.log(
      '[abrirModalCadastro] 🔍 Modal existente no DOM:',
      !!document.getElementById('cadastro-modal-overlay')
    );

    // Blindagem contra fechamento imediato: marcar timestamp do clique
    window.__lastLoginActionAt = Date.now();

    const modal = new window.CadastroSystem.CadastroUsuarioModal();
    console.log('[abrirModalCadastro] ✅ Modal instanciado:', !!modal);
    console.log('[abrirModalCadastro] ✅ Método show disponível:', typeof modal.show);
    console.log('[abrirModalCadastro] 🚀 Chamando show()...');

    // Verificar se a função show existe
    if (typeof modal.show !== 'function') {
      throw new Error('Modal não possui método show()');
    }

    // Monitorar quando o modal é adicionado/removido do DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.id === 'cadastro-modal-overlay') {
            console.log('[abrirModalCadastro] ✅ Modal ADICIONADO ao DOM');
          }
        });
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.id === 'cadastro-modal-overlay') {
            console.log('[abrirModalCadastro] ⚠️ Modal REMOVIDO do DOM');
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const resultado = await modal.show();
    observer.disconnect();

    console.log('[abrirModalCadastro] 🎯 Modal finalizado com resultado:', resultado);

    if (resultado) {
      console.log('[abrirModalCadastro] ✅ Usuário cadastrado:', resultado.nome);

      // Notificação de sucesso
      if (window.showNotification) {
        window.showNotification(`Usuário ${resultado.nome} cadastrado com sucesso!`, 'success');
      }

      // 🆕 ABRIR QUESTIONÁRIO APÓS CADASTRO
      try {
        console.log('[abrirModalCadastro] 📋 Abrindo questionário para novo usuário...');
        const questionarioResultado = await abrirQuestionarioUsuario(resultado);

        if (questionarioResultado) {
          console.log('[abrirModalCadastro] ✅ Questionário preenchido com sucesso');
          if (window.showNotification) {
            window.showNotification('Perfil criado! Bem-vindo ao app!', 'success');
          }

          // Definir usuário atual e redirecionar para home
          if (window.AppState) {
            window.AppState.set('currentUser', resultado);
          }

          // Redirecionar para home após questionário
          setTimeout(() => {
            if (window.renderTemplate) {
              window.renderTemplate('home');
            }
          }, 1500);
        } else {
          console.log('[abrirModalCadastro] ℹ️ Questionário pulado pelo usuário');
          if (window.showNotification) {
            window.showNotification(
              'Cadastro concluído! Você pode preencher seu perfil depois.',
              'info'
            );
          }
        }
      } catch (questionarioError) {
        console.error('[abrirModalCadastro] ❌ Erro no questionário:', questionarioError);
        if (window.showNotification) {
          window.showNotification(
            'Usuário cadastrado, mas questionário não pôde ser aberto.',
            'warning'
          );
        }
      }
      return null;
    }
  } catch (error) {
    console.error('[abrirModalCadastro] ❌ Erro:', error);
    console.error('[abrirModalCadastro] ❌ Stack:', error.stack);

    if (window.showNotification) {
      window.showNotification('Erro ao abrir cadastro de usuário', 'error');
    } else {
      alert('Erro ao abrir cadastro de usuário: ' + error.message);
    }

    return null;
  }
};

// Função para teste do sistema
window.testarSistemaCadastro = async function () {
  console.log('[testarSistemaCadastro] 🧪 Iniciando testes...');

  try {
    const loaded = await loadCadastroSystem();
    if (!loaded) {
      console.error('[testarSistemaCadastro] ❌ Falha ao carregar sistema');
      return;
    }

    console.log('[testarSistemaCadastro] ✅ Sistema carregado');
    console.log(
      '[testarSistemaCadastro] 🎯 Funções disponíveis:',
      Object.keys(window.CadastroSystem)
    );

    // Testar validação
    console.log('[testarSistemaCadastro] 🔍 Testando validação...');
    try {
      await window.CadastroSystem.validateUserData({
        nome: 'Teste',
        email: 'teste@exemplo.com',
      });
      console.log('[testarSistemaCadastro] ✅ Validação OK');
    } catch (validationError) {
      console.log('[testarSistemaCadastro] ✅ Validação funcionando (erro esperado)');
    }

    // Testar rate limit
    console.log('[testarSistemaCadastro] 🚦 Testando rate limit...');
    const canProceed = await window.CadastroSystem.checkRateLimit();
    console.log('[testarSistemaCadastro] ✅ Rate limit:', canProceed ? 'OK' : 'Bloqueado');

    console.log('[testarSistemaCadastro] 🎉 Todos os testes concluídos');
  } catch (error) {
    console.error('[testarSistemaCadastro] ❌ Erro nos testes:', error);
  }
};

// Disponibilizar função de questionário globalmente
window.abrirQuestionarioUsuario = abrirQuestionarioUsuario;

// Auto-carregar o sistema quando o script for carregado
console.log('[cadastroSystem] 🚀 Script carregado, inicializando...');
loadCadastroSystem().then((success) => {
  if (success) {
    console.log('[cadastroSystem] 🎉 Sistema de cadastro pronto para uso!');
    console.log('[cadastroSystem] 💡 Use abrirModalCadastro() para abrir o modal');
    console.log(
      '[cadastroSystem] 📋 Use abrirQuestionarioUsuario(usuario) para abrir questionário'
    );
    console.log('[cadastroSystem] 🧪 Use testarSistemaCadastro() para executar testes');
  }
});

// Exportar para uso em outros módulos se necessário
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadCadastroSystem };
}
