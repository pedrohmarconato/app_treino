// Teste para debugging da conclusão de treino
console.log('[test-conclusao-treino.js] 🧪 Arquivo de teste carregado');

// Função para testar modal de disposição
window.testarModalDisposicao = () => {
    console.log('🧪 ==> TESTANDO MODAL DE DISPOSIÇÃO <==');
    
    if (typeof window.DisposicaoInicioModal !== 'undefined') {
        window.DisposicaoInicioModal.solicitar().then(valor => {
            console.log('✅ Modal de disposição retornou:', valor);
        }).catch(erro => {
            console.error('❌ Erro no modal de disposição:', erro);
        });
    } else {
        console.error('❌ DisposicaoInicioModal não disponível');
    }
};

// Função para forçar nova coleta de disposição (ignorar se já coletou hoje)
window.forcarModalDisposicao = async () => {
    console.log('🔧 ==> FORÇANDO NOVA COLETA DE DISPOSIÇÃO <==');
    
    try {
        // Obter usuário atual
        const currentUser = AppState.get('currentUser');
        const userId = currentUser?.id || 1;
        console.log('👤 Usuário atual:', currentUser?.nome, 'ID:', userId);
        
        // Forçar limpeza de qualquer cache
        const cacheKey = `disposicao_${userId}_${new Date().toDateString()}`;
        localStorage.removeItem(cacheKey);
        console.log('🧹 Cache local limpo');
        
        // Solicitar disposição diretamente
        if (typeof window.DisposicaoInicioModal !== 'undefined') {
            console.log('🚀 Exibindo modal de disposição...');
            const energiaNivel = await window.DisposicaoInicioModal.solicitar();
            
            if (energiaNivel) {
                console.log('✅ Energia coletada:', energiaNivel);
                
                // Salvar no backend
                const salvamento = await window.DisposicaoInicioModal.salvarValor(userId, energiaNivel);
                if (salvamento.success) {
                    console.log('✅ Energia salva no backend com sucesso');
                    AppState.set('energiaPreTreino', energiaNivel);
                    console.log('✅ Energia salva no AppState');
                    
                    if (window.showNotification) {
                        window.showNotification(`Energia ${energiaNivel} registrada com sucesso!`, 'success');
                    }
                } else {
                    console.error('❌ Erro ao salvar energia:', salvamento.error);
                    if (window.showNotification) {
                        window.showNotification('Erro ao salvar disposição', 'error');
                    }
                }
            } else {
                console.log('❌ Usuário cancelou disposição');
            }
        } else {
            console.error('❌ DisposicaoInicioModal não disponível');
        }
    } catch (error) {
        console.error('❌ Erro ao forçar modal disposição:', error);
    }
};

// Função para testar conclusão de treino
window.testarConclusaoTreino = () => {
    console.log('🧪 ==> TESTANDO CONCLUSÃO DE TREINO <==');
    
    // Verificar se função existe
    if (typeof window.finalizarTreino === 'function') {
        console.log('✅ Função finalizarTreino disponível');
        
        // Simular dados de treino
        const dadosSimulados = {
            grupo_muscular: 'Teste',
            energia_pre_treino: 3,
            resumo: {
                tempo_total_segundos: 120,
                exercicios_realizados: 1,
                series_completadas: 3,
                treino_nome: 'Treino Teste'
            }
        };
        
        console.log('🚀 Executando teste de finalização...');
        window.finalizarTreino(dadosSimulados);
        
    } else {
        console.error('❌ Função finalizarTreino não disponível');
    }
};

// Função para testar APENAS o botão finalizar
window.testarBotaoFinalizar = () => {
    console.log('🧪 ==> TESTANDO BOTÃO FINALIZAR <==');
    
    const modal = document.getElementById('modal-avaliacao-treino');
    if (!modal) {
        console.error('❌ Modal não encontrado. Execute window.testarModalAvaliacao() primeiro');
        return;
    }
    
    const btn = modal.querySelector('#btn-finalizar-treino');
    if (!btn) {
        console.error('❌ Botão finalizar não encontrado no modal');
        return;
    }
    
    console.log('✅ Botão encontrado:', btn);
    console.log('✅ Disabled:', btn.disabled);
    console.log('✅ Classes:', btn.className);
    
    // Verificar se alguma opção foi selecionada
    const opcoesSelecionadas = modal.querySelectorAll('.likert-option.selected');
    console.log('📊 Opções selecionadas:', opcoesSelecionadas.length);
    
    if (opcoesSelecionadas.length === 0) {
        console.log('⚠️ Nenhuma opção selecionada. Forçando seleção...');
        const opcao = modal.querySelector('.likert-option[data-value="3"]');
        if (opcao) {
            opcao.click();
            console.log('✅ Opção 3 selecionada automaticamente');
            
            // Aguardar um pouco e verificar se botão foi habilitado
            setTimeout(() => {
                console.log('🔄 Status do botão após seleção:', btn.disabled);
                if (!btn.disabled) {
                    console.log('🖱️ Agora simulando clique...');
                    btn.click();
                } else {
                    console.log('🔧 Forçando habilitação do botão...');
                    btn.disabled = false;
                    btn.classList.add('ready');
                    console.log('🖱️ Simulando clique no botão forçadamente habilitado...');
                    btn.click();
                }
            }, 100);
        } else {
            console.error('❌ Opção de teste não encontrada');
        }
    } else {
        console.log('🖱️ Simulando clique...');
        if (btn.disabled) {
            console.log('🔧 Botão disabled, forçando habilitação...');
            btn.disabled = false;
        }
        btn.click();
    }
};

// Função para testar modal de avaliação diretamente
window.testarModalAvaliacao = () => {
    console.log('🧪 ==> TESTANDO MODAL DE AVALIAÇÃO <==');
    
    try {
        // Verificar se componente existe
        if (typeof AvaliacaoTreinoComponent === 'undefined') {
            console.error('❌ AvaliacaoTreinoComponent não disponível');
            return;
        }
        
        console.log('✅ AvaliacaoTreinoComponent disponível');
        
        // Dados simulados com resumo mais completo
        const dadosSimulados = {
            grupo_muscular: 'Costas',
            energia_pre_treino: 3,
            resumo: {
                tempo_total_segundos: 150,
                exercicios_realizados: 1,
                total_series: 3,
                peso_total_levantado: 120,
                tempo_treino: '2min 30s',
                treino_nome: 'Treino Costas Teste'
            }
        };
        
        console.log('🚀 Exibindo modal de avaliação...');
        AvaliacaoTreinoComponent.mostrarModalAvaliacao(dadosSimulados);
        
        // Verificar se modal foi criado e está visível após criação
        setTimeout(() => {
            const modal = document.getElementById('modal-avaliacao-treino');
            if (modal) {
                console.log('✅ Modal criado com z-index:', modal.style.zIndex);
                console.log('✅ Modal position:', modal.style.position);
                console.log('✅ Modal display:', modal.style.display);
                console.log('✅ Modal visibility:', modal.style.visibility);
                
                // Verificar se está realmente visível
                const rect = modal.getBoundingClientRect();
                console.log('📐 Modal dimensions:', {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    visible: rect.width > 0 && rect.height > 0
                });
                
                // Auto-selecionar uma opção de fadiga para permitir teste do botão
                const opcaoFadiga = modal.querySelector('.likert-option[data-value="3"]');
                if (opcaoFadiga) {
                    console.log('🎯 Auto-selecionando fadiga nível 3 para teste...');
                    opcaoFadiga.click();
                    
                    setTimeout(() => {
                        console.log('💡 Agora você pode testar: window.testarBotaoFinalizar()');
                    }, 1000);
                }
            } else {
                console.error('❌ Modal não encontrado após criação');
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ Erro ao testar modal de avaliação:', error);
    }
};

// Função para verificar estado do treino
window.verificarEstadoTreino = () => {
    console.log('🔍 ==> VERIFICANDO ESTADO DO TREINO <==');
    
    const estado = {
        workoutCompleted: AppState.get('workoutCompleted'),
        treinoFinalizandoOuFinalizado: AppState.get('treinoFinalizandoOuFinalizado'),
        currentWorkout: AppState.get('currentWorkout'),
        currentExercises: AppState.get('currentExercises'),
        currentExerciseIndex: AppState.get('currentExerciseIndex'),
        completedSeries: AppState.get('completedSeries')
    };
    
    console.table(estado);
    
    return estado;
};

// Função para resetar estado do treino
window.resetarEstadoTreino = () => {
    console.log('🔄 ==> RESETANDO ESTADO DO TREINO <==');
    
    AppState.set('workoutCompleted', false);
    AppState.set('treinoFinalizandoOuFinalizado', false);
    AppState.set('currentExerciseIndex', 0);
    AppState.set('completedSeries', 0);
    
    console.log('✅ Estado resetado');
};

// Função para forçar conclusão de treino
window.forcarConclusaoTreino = () => {
    console.log('🆘 ==> FORÇANDO CONCLUSÃO DE TREINO <==');
    
    try {
        // Definir estado como se tivesse um treino em andamento
        AppState.set('workoutStartTime', Date.now() - 120000); // 2 minutos atrás
        AppState.set('currentWorkout', {
            nome: 'Treino Teste Forçado',
            tipo: 'Teste',
            grupo_muscular: 'Teste'
        });
        AppState.set('currentExercises', [{
            exercicio_nome: 'Exercício Teste',
            series: 3
        }]);
        AppState.set('currentExerciseIndex', 0);
        AppState.set('completedSeries', 3);
        
        console.log('✅ Estado de treino simulado definido');
        
        // Forçar conclusão
        if (typeof mostrarTreinoConcluido === 'function') {
            mostrarTreinoConcluido();
            console.log('✅ mostrarTreinoConcluido() executado');
        } else {
            console.error('❌ Função mostrarTreinoConcluido não disponível');
        }
        
    } catch (error) {
        console.error('❌ Erro ao forçar conclusão:', error);
    }
};

// Função para verificar z-indexes de todos os modais
window.verificarZIndexes = () => {
    console.log('🔍 ==> VERIFICANDO Z-INDEXES DE MODAIS <==');
    
    const selectors = [
        '.modal-overlay',
        '.modal-disposicao-overlay', 
        '.avaliacao-modal',
        '#modal-avaliacao-treino',
        '#modal-disposicao-inicio'
    ];
    
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`📋 ${selector}:`, elements.length, 'elementos encontrados');
        
        elements.forEach((el, index) => {
            const style = window.getComputedStyle(el);
            console.log(`  - Elemento ${index + 1}:`, {
                id: el.id || 'sem-id',
                zIndex: style.zIndex,
                position: style.position,
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity
            });
        });
    });
    
    // Verificar elementos com z-index muito alto
    const allElements = document.querySelectorAll('*');
    const highZIndex = [];
    
    allElements.forEach(el => {
        const zIndex = parseInt(window.getComputedStyle(el).zIndex);
        if (zIndex > 10000) {
            highZIndex.push({
                element: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + Array.from(el.classList).join('.') : ''),
                zIndex: zIndex
            });
        }
    });
    
    console.log('⚡ Elementos com z-index > 10000:', highZIndex);
};

// Função para debug completo do modal de avaliação
window.debugModalAvaliacao = () => {
    console.log('🔍 ==> DEBUG COMPLETO DO MODAL DE AVALIAÇÃO <==');
    
    const modal = document.getElementById('modal-avaliacao-treino');
    if (!modal) {
        console.error('❌ Modal não encontrado');
        return;
    }
    
    console.log('✅ Modal encontrado');
    console.log('📍 Modal HTML structure:', modal.outerHTML.substring(0, 500) + '...');
    
    // Verificar botão
    const btn = modal.querySelector('#btn-finalizar-treino');
    console.log('🔘 Botão finalizar:', !!btn);
    if (btn) {
        console.log('  - Disabled:', btn.disabled);
        console.log('  - Classes:', btn.className);
        console.log('  - Text:', btn.textContent.trim());
        console.log('  - Style display:', btn.style.display);
        console.log('  - Computed display:', window.getComputedStyle(btn).display);
    }
    
    // Verificar opções likert
    const opcoes = modal.querySelectorAll('.likert-option');
    console.log('📊 Opções likert encontradas:', opcoes.length);
    opcoes.forEach((opcao, index) => {
        console.log(`  - Opção ${index + 1}: valor=${opcao.dataset.value}, selected=${opcao.classList.contains('selected')}`);
    });
    
    // Verificar listeners dos eventos
    console.log('🎧 Verificando listeners...');
    const events = ['click', 'mousedown', 'touchstart'];
    events.forEach(eventType => {
        const listeners = btn?.getEventListeners ? btn.getEventListeners(eventType) : null;
        console.log(`  - ${eventType}:`, listeners ? listeners.length : 'N/A');
    });
    
    // Verificar se AvaliacaoTreinoComponent está disponível
    console.log('🧩 AvaliacaoTreinoComponent disponível:', typeof window.AvaliacaoTreinoComponent);
    
    return { modal, btn, opcoes };
};

// Função para verificar integridade dos containers HTML
window.verificarContainersHTML = () => {
    console.log('🏗️ ==> VERIFICANDO CONTAINERS HTML <==');
    
    const containers = [
        { id: 'app', descricao: 'Container principal da aplicação' },
        { id: 'modals-container', descricao: 'Container de modais normais' },
        { id: 'high-priority-modals', descricao: 'Container de modais de alta prioridade' },
        { id: 'global-loading', descricao: 'Loading global' }
    ];
    
    containers.forEach(({ id, descricao }) => {
        const element = document.getElementById(id);
        console.log(`📦 ${id}:`, {
            existe: !!element,
            descricao,
            filhos: element ? element.children.length : 'N/A',
            display: element ? window.getComputedStyle(element).display : 'N/A',
            zIndex: element ? window.getComputedStyle(element).zIndex : 'N/A',
            position: element ? window.getComputedStyle(element).position : 'N/A'
        });
    });
    
    // Verificar se há modais órfãos no DOM
    const modaisOrfaos = document.querySelectorAll('.modal-overlay, .modal-disposicao-overlay, .avaliacao-modal');
    console.log('👻 Modais órfãos encontrados:', modaisOrfaos.length);
    
    modaisOrfaos.forEach((modal, index) => {
        console.log(`  - Modal ${index + 1}:`, {
            id: modal.id || 'sem-id',
            classes: modal.className,
            parent: modal.parentElement?.id || 'body',
            display: window.getComputedStyle(modal).display,
            zIndex: window.getComputedStyle(modal).zIndex
        });
    });
    
    return { containers, modaisOrfaos };
};

// Auto-registro das funções
setTimeout(() => {
    console.log('[test-conclusao-treino.js] 💡 Funções disponíveis:');
    console.log('- window.testarModalDisposicao()');
    console.log('- window.testarConclusaoTreino()');
    console.log('- window.testarModalAvaliacao()');
    console.log('- window.verificarEstadoTreino()');
    console.log('- window.resetarEstadoTreino()');
    console.log('- window.forcarConclusaoTreino()');
    console.log('- window.verificarZIndexes()');
    console.log('- window.testarBotaoFinalizar()');
    console.log('- window.debugModalAvaliacao()');
    console.log('- window.verificarContainersHTML()');
    console.log('- window.forcarModalDisposicao()');
}, 1000);

console.log('[test-conclusao-treino.js] ✅ Arquivo carregado');