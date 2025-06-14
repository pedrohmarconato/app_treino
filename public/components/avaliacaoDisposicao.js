/**
 * Componente de Avaliação de Disposição Pré-Treino
 * Avalia a disposição do usuário antes de iniciar o treino
 */

class AvaliacaoDisposicaoComponent {
    constructor() {
        this.modalId = 'modal-avaliacao-disposicao';
        this.disposicao = null;
        this.callback = null;
    }

    /**
     * Exibe o modal de avaliação de disposição
     * @param {Function} onComplete - Callback chamado após avaliação
     * @param {Object} treinoInfo - Informações do treino a ser iniciado
     */
    mostrar(onComplete, treinoInfo = {}) {
        this.callback = onComplete;
        this.criarModal(treinoInfo);
        this.configurarEventListeners();
        this.mostrarModal();
    }

    /**
     * Cria o HTML do modal
     */
    criarModal(treinoInfo) {
        const modalHTML = `
            <div id="${this.modalId}" class="modal-overlay disposicao-modal">
                <div class="modal-content disposicao-content">
                    <div class="modal-header disposicao-header">
                        <h2>Como você está se sentindo?</h2>
                        <p class="disposicao-subtitle">
                            Avalie sua disposição antes de começar o treino
                            ${treinoInfo.grupoMuscular ? `de ${treinoInfo.grupoMuscular}` : ''}
                        </p>
                    </div>
                    
                    <div class="modal-body disposicao-body">
                        <div class="disposicao-info">
                            <div class="info-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 12l2 2 4-4"/>
                                    <circle cx="12" cy="12" r="10"/>
                                </svg>
                            </div>
                            <p>Esta avaliação nos ajuda a entender seu estado atual e pode influenciar as sugestões do treino.</p>
                        </div>

                        <div class="escala-disposicao">
                            <label class="escala-label">
                                Como está sua disposição para treinar hoje?
                                <span class="campo-obrigatorio">*</span>
                            </label>
                            
                            <div class="escala-likert disposicao-escala">
                                ${this.criarOpcoesDisposicao()}
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer disposicao-footer">
                        <button type="button" class="btn btn-secondary" onclick="avaliacaoDisposicao.cancelar()">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" id="btn-continuar-treino" disabled>
                            Começar Treino
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente se houver
        const modalExistente = document.getElementById(this.modalId);
        if (modalExistente) {
            modalExistente.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Cria as opções da escala de disposição
     */
    criarOpcoesDisposicao() {
        const opcoes = [
            { valor: 0, emoji: '😴', label: 'Sem energia' },
            { valor: 1, emoji: '😞', label: 'Pouca disposição' },
            { valor: 2, emoji: '😐', label: 'Neutro' },
            { valor: 3, emoji: '🙂', label: 'Bem disposto' },
            { valor: 4, emoji: '😊', label: 'Muito disposto' },
            { valor: 5, emoji: '🔥', label: 'Cheio de energia' }
        ];

        return opcoes.map(opcao => `
            <div class="likert-option disposicao-option" data-valor="${opcao.valor}">
                <div class="emoji">${opcao.emoji}</div>
                <div class="label">${opcao.label}</div>
                <div class="valor">${opcao.valor}</div>
            </div>
        `).join('');
    }

    /**
     * Configura os event listeners
     */
    configurarEventListeners() {
        const modal = document.getElementById(this.modalId);
        if (!modal) return;

        // Event listeners para as opções de disposição
        const opcoes = modal.querySelectorAll('.disposicao-option');
        opcoes.forEach(opcao => {
            opcao.addEventListener('click', (e) => {
                this.selecionarDisposicao(parseInt(e.currentTarget.dataset.valor));
            });
        });

        // Botão continuar
        const btnContinuar = modal.querySelector('#btn-continuar-treino');
        if (btnContinuar) {
            btnContinuar.addEventListener('click', () => {
                this.confirmarAvaliacao();
            });
        }

        // Tecla ESC para cancelar
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.cancelar();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Armazenar referência para remover depois
        modal.dataset.escapeHandler = 'attached';
    }

    /**
     * Seleciona uma opção de disposição
     */
    selecionarDisposicao(valor) {
        const modal = document.getElementById(this.modalId);
        if (!modal) return;

        // Remover seleção anterior
        const opcoes = modal.querySelectorAll('.disposicao-option');
        opcoes.forEach(opcao => {
            opcao.classList.remove('selected');
        });

        // Selecionar nova opção
        const opcaoSelecionada = modal.querySelector(`[data-valor="${valor}"]`);
        if (opcaoSelecionada) {
            opcaoSelecionada.classList.add('selected');
            this.disposicao = valor;

            // Habilitar botão continuar
            const btnContinuar = modal.querySelector('#btn-continuar-treino');
            if (btnContinuar) {
                btnContinuar.disabled = false;
                btnContinuar.classList.add('enabled');
            }
        }
    }

    /**
     * Confirma a avaliação e chama o callback
     */
    async confirmarAvaliacao() {
        if (this.disposicao === null) {
            this.mostrarErro('Por favor, selecione sua disposição atual.');
            return;
        }

        try {
            // Chamar callback com a avaliação
            if (this.callback) {
                await this.callback({
                    disposicao: this.disposicao,
                    timestamp: new Date().toISOString()
                });
            }

            this.fecharModal();
        } catch (error) {
            console.error('[AvaliacaoDisposicao] Erro ao confirmar avaliação:', error);
            this.mostrarErro('Erro ao salvar avaliação. Tente novamente.');
        }
    }

    /**
     * Cancela a avaliação
     */
    cancelar() {
        if (this.callback) {
            this.callback(null); // Indica cancelamento
        }
        this.fecharModal();
    }

    /**
     * Mostra o modal com animação
     */
    mostrarModal() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
        }
    }

    /**
     * Fecha o modal
     */
    fecharModal() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.classList.add('closing');
            modal.classList.remove('show');

            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
            }, 300);
        }

        // Reset do estado
        this.disposicao = null;
        this.callback = null;
    }

    /**
     * Mostra mensagem de erro
     */
    mostrarErro(mensagem) {
        const modal = document.getElementById(this.modalId);
        if (!modal) return;

        // Remover erro anterior
        const erroAnterior = modal.querySelector('.erro-message');
        if (erroAnterior) {
            erroAnterior.remove();
        }

        // Adicionar nova mensagem de erro
        const erroHTML = `
            <div class="erro-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                ${mensagem}
            </div>
        `;

        const footer = modal.querySelector('.disposicao-footer');
        if (footer) {
            footer.insertAdjacentHTML('beforebegin', erroHTML);

            // Remover erro após 5 segundos
            setTimeout(() => {
                const erro = modal.querySelector('.erro-message');
                if (erro) {
                    erro.remove();
                }
            }, 5000);
        }
    }
}

// Instância global
window.avaliacaoDisposicao = new AvaliacaoDisposicaoComponent();

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvaliacaoDisposicaoComponent;
}