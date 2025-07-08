// Componente para avaliação de qualidade do treino
import TreinoCacheService from '../services/treinoCacheService.js';
import TreinoFinalizacaoService from '../services/treinoFinalizacaoService.js';

export class AvaliacaoTreinoComponent {
    
    static mostrarModalAvaliacao(dadosAvaliacao) {
        const modal = this.criarModalHTML(dadosAvaliacao);
        document.body.insertAdjacentHTML('beforeend', modal);
        
        // Mostrar modal com animação
        setTimeout(() => {
            const modalElement = document.getElementById('modal-avaliacao-treino');
            if (modalElement) {
                modalElement.classList.add('show');
            }
        }, 10);
        
        // Configurar handlers
        this.configurarEventListeners();
        
        console.log('[AvaliacaoTreino] Modal de avaliação exibido');
    }
    
    static criarModalHTML(dados) {
        const resumo = dados.resumo;
        
        return `
            <div id="modal-avaliacao-treino" class="modal-overlay avaliacao-modal">
                <div class="modal-content avaliacao-content" onclick="event.stopPropagation()">
                    
                    <!-- Header -->
                    <div class="avaliacao-header">
                        <div class="header-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 12l2 2 4-4"/>
                                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                                <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
                                <path d="M12 21c0-1-1-3-3-3s-3 2-3 3 1 3 3 3 3-2 3-3"/>
                            </svg>
                        </div>
                        <div class="header-content">
                            <h2>Treino Concluído! 🎉</h2>
                            <p class="header-subtitle">Como foi seu treino de <strong>${dados.grupo_muscular}</strong>?</p>
                        </div>
                    </div>
                    
                    <!-- Resumo do Treino -->
                    <div class="treino-resumo">
                        <div class="resumo-grid">
                            <div class="resumo-item">
                                <div class="resumo-icon">💪</div>
                                <div class="resumo-texto">
                                    <span class="resumo-valor">${resumo.exercicios_realizados}</span>
                                    <span class="resumo-label">Exercícios</span>
                                </div>
                            </div>
                            
                            <div class="resumo-item">
                                <div class="resumo-icon">🔥</div>
                                <div class="resumo-texto">
                                    <span class="resumo-valor">${resumo.total_series}</span>
                                    <span class="resumo-label">Séries</span>
                                </div>
                            </div>
                            
                            <div class="resumo-item">
                                <div class="resumo-icon">⚖️</div>
                                <div class="resumo-texto">
                                    <span class="resumo-valor">${Math.round(resumo.peso_total_levantado)}kg</span>
                                    <span class="resumo-label">Total</span>
                                </div>
                            </div>
                            
                            <div class="resumo-item">
                                <div class="resumo-icon">⏱️</div>
                                <div class="resumo-texto">
                                    <span class="resumo-valor">${resumo.tempo_treino}</span>
                                    <span class="resumo-label">Duração</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Avaliação de Fadiga Pós-Treino -->
                    <div class="avaliacao-qualidade">
                        <h3>Qual seu nível de fadiga após o treino? 😴</h3>
                        <div class="escala-likert">
                            <div class="escala-labels">
                                <span class="label-inicio">Sem Fadiga</span>
                                <span class="label-fim">Exaustão Total</span>
                            </div>
                            <div class="escala-opcoes" id="escala-qualidade">
                                ${this.criarEscalaFadiga(0, 5)}
                            </div>
                            <div class="escala-numeros">
                                <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Informação sobre Energia Pré-Treino -->
                    <div class="energia-pre-info">
                        <div class="info-box">
                            <div class="info-icon">⚡</div>
                            <div class="info-text">
                                <h4>Energia antes do treino</h4>
                                <p>Você informou nível <strong id="energia-pre-valor">3</strong> de energia antes de começar</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Observações -->
                    <div class="observacoes-secao">
                        <label for="observacoes-treino">Observações sobre o treino (opcional):</label>
                        <textarea 
                            id="observacoes-treino" 
                            placeholder="Ex: senti dificuldade no supino, próxima vez diminuir peso..."
                            maxlength="500"
                        ></textarea>
                        <div class="char-count">
                            <span id="char-counter">0</span>/500
                        </div>
                    </div>
                    
                    <!-- Ações -->
                    <div class="avaliacao-actions">
                        <button 
                            id="btn-finalizar-treino" 
                            class="btn-primary btn-glow"
                            disabled
                        >
                            <span class="btn-text">Finalizar Treino</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 6L9 17l-5-5"/>
                            </svg>
                        </button>
                        
                        <button id="btn-salvar-rascunho" class="btn-secondary">
                            Salvar Rascunho
                        </button>
                    </div>
                    
                    <!-- Aviso -->
                    <div class="avaliacao-aviso">
                        <p>⚠️ <strong>Importante:</strong> Seus dados só serão salvos após a avaliação ser concluída.</p>
                    </div>
                    
                </div>
            </div>
        `;
    }
    
    static criarEscalaFadiga(min, max) {
        let html = '';
        for (let i = min; i <= max; i++) {
            const emojis = ['😎', '🙂', '😊', '😅', '🥵', '🥴'];
            const labels = ['Sem fadiga', 'Fadiga leve', 'Moderada', 'Intensa', 'Muito fadigado', 'Exaustão total'];
            
            html += `
                <div class="likert-option" data-value="${i}">
                    <div class="likert-emoji">${emojis[i]}</div>
                    <div class="likert-numero">${i}</div>
                    <div class="likert-label">${labels[i]}</div>
                </div>
            `;
        }
        return html;
    }
    
    static criarEscalaMini(min, max, tipo) {
        let html = '<div class="escala-mini-opcoes">';
        for (let i = min; i <= max; i++) {
            html += `
                <button class="escala-mini-btn" data-value="${i}" data-tipo="${tipo}">
                    ${i}
                </button>
            `;
        }
        html += '</div>';
        return html;
    }
    
    static configurarEventListeners() {
        const modal = document.getElementById('modal-avaliacao-treino');
        if (!modal) return;
        
        // Estado da avaliação
        const avaliacaoEstado = {
            post_workout: null,  // Nível de fadiga (0-5)
            observacoes: ''
        };
        
        // Escala Likert principal (obrigatória)
        modal.querySelectorAll('.likert-option').forEach(option => {
            option.addEventListener('click', () => {
                // Remover seleção anterior
                modal.querySelectorAll('.likert-option').forEach(opt => 
                    opt.classList.remove('selected'));
                
                // Selecionar atual
                option.classList.add('selected');
                avaliacaoEstado.post_workout = parseInt(option.dataset.value);
                
                // Habilitar botão finalizar
                this.atualizarBotaoFinalizar(avaliacaoEstado);
                
                console.log('[AvaliacaoTreino] Fadiga pós-treino selecionada:', avaliacaoEstado.post_workout);
            });
        });
        
        // Remover as escalas mini (não usadas mais)
        // As escalas mini foram substituídas pelo sistema simplificado
        
        // Observações
        const textarea = modal.querySelector('#observacoes-treino');
        const charCounter = modal.querySelector('#char-counter');
        
        textarea?.addEventListener('input', () => {
            const length = textarea.value.length;
            charCounter.textContent = length;
            avaliacaoEstado.observacoes = textarea.value;
            
            // Adicionar classe de aviso se próximo do limite
            if (length > 450) {
                charCounter.parentElement.classList.add('char-warning');
            } else {
                charCounter.parentElement.classList.remove('char-warning');
            }
        });
        
        // Botão Finalizar
        const btnFinalizar = modal.querySelector('#btn-finalizar-treino');
        btnFinalizar?.addEventListener('click', async () => {
            if (avaliacaoEstado.post_workout === null) {
                alert('Por favor, avalie seu nível de fadiga antes de finalizar.');
                return;
            }
            
            btnFinalizar.disabled = true;
            btnFinalizar.innerHTML = `
                <span class="btn-text">Finalizando...</span>
                <div class="loading-spinner-small"></div>
            `;
            
            await this.finalizarTreino(avaliacaoEstado);
        });
        
        // Botão Salvar Rascunho
        const btnRascunho = modal.querySelector('#btn-salvar-rascunho');
        btnRascunho?.addEventListener('click', () => {
            this.salvarRascunho(avaliacaoEstado);
        });
        
        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.mostrarConfirmacaoSaida();
            }
        });
        
        // Prevenir fechamento acidental
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.mostrarConfirmacaoSaida();
            }
        });
    }
    
    static atualizarBotaoFinalizar(estado) {
        const btn = document.getElementById('btn-finalizar-treino');
        if (!btn) return;
        
        const podeFinalizar = estado.post_workout !== null;
        btn.disabled = !podeFinalizar;
        
        if (podeFinalizar) {
            btn.classList.add('ready');
        } else {
            btn.classList.remove('ready');
        }
    }
    
    static async finalizarTreino(avaliacaoEstado) {
        try {
            console.log('[AvaliacaoTreino] Finalizando treino com avaliação:', avaliacaoEstado);
            
            // Obter userId atual
            const userId = 1; // TODO: implementar sistema de usuários
            
            // Finalizar treino usando o novo serviço
            const resultado = await TreinoFinalizacaoService.finalizarTreino(userId, {
                post_workout: avaliacaoEstado.post_workout,
                observacoes: avaliacaoEstado.observacoes
            });
            
            if (!resultado.success) {
                throw new Error(resultado.mensagem || resultado.erro);
            }
            
            // Limpar cache local após sucesso
            await TreinoCacheService.limparSessaoAtiva();
            
            // Mostrar sucesso
            this.mostrarSucesso({
                execucoes_salvas: resultado.execucoes_finalizadas,
                sessao_id: resultado.sessao_id
            });
            
        } catch (error) {
            console.error('[AvaliacaoTreino] Erro ao finalizar:', error);
            this.mostrarErro(error.message);
        }
    }
    
    static mostrarSucesso(resultado) {
        const modal = document.getElementById('modal-avaliacao-treino');
        if (!modal) return;
        
        // Substituir conteúdo por mensagem de sucesso
        modal.querySelector('.avaliacao-content').innerHTML = `
            <div class="sucesso-content">
                <div class="sucesso-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                </div>
                <h2>Treino Finalizado! 🎉</h2>
                <p>Suas ${resultado.execucoes_salvas} execuções foram salvas com sucesso.</p>
                <button id="btn-voltar-home" class="btn-primary">
                    Voltar ao Início
                </button>
            </div>
        `;
        
        // Handler para voltar
        modal.querySelector('#btn-voltar-home')?.addEventListener('click', () => {
            this.fecharModal();
            
            // Voltar ao dashboard
            if (window.workoutExecutionManager?.voltarParaHome) {
                window.workoutExecutionManager.voltarParaHome();
            } else if (window.carregarDashboard) {
                window.carregarDashboard();
            } else {
                // Fallback - recarregar página
                window.location.reload();
            }
        });
        
        // Auto-fechar após 3 segundos
        setTimeout(() => {
            this.fecharModal();
            if (window.carregarDashboard) {
                window.carregarDashboard();
            }
        }, 3000);
    }
    
    static mostrarErro(mensagem) {
        const btn = document.getElementById('btn-finalizar-treino');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `
                <span class="btn-text">Tentar Novamente</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                </svg>
            `;
        }
        
        // Mostrar erro temporário
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `⚠️ Erro: ${mensagem}`;
        
        const modal = document.querySelector('.avaliacao-content');
        modal?.insertBefore(errorDiv, modal.firstChild);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
    
    static salvarRascunho(estado) {
        localStorage.setItem('avaliacao_rascunho', JSON.stringify({
            ...estado,
            timestamp: new Date().toISOString()
        }));
        
        // Feedback visual
        const btn = document.getElementById('btn-salvar-rascunho');
        const textoOriginal = btn.textContent;
        btn.textContent = '✓ Salvo';
        btn.classList.add('saved');
        
        setTimeout(() => {
            btn.textContent = textoOriginal;
            btn.classList.remove('saved');
        }, 2000);
        
        console.log('[AvaliacaoTreino] Rascunho salvo');
    }
    
    static mostrarConfirmacaoSaida() {
        if (confirm('⚠️ Tem certeza que quer sair sem avaliar?\n\nSeus dados do treino serão perdidos!')) {
            // Marcar como falta
            TreinoCacheService.marcarTreinoComoFalta('Usuário saiu sem avaliar');
            this.fecharModal();
        }
    }
    
    static fecharModal() {
        const modal = document.getElementById('modal-avaliacao-treino');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }
}

export default AvaliacaoTreinoComponent;