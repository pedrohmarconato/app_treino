/**
 * SaveExitModal.js - Modal de Confirmação de Saída de Treino
 * Implementa padrões de acessibilidade WCAG 2.2 e UX consistente
 */

import { ComponentConfig } from '../templates/COMPONENT_CONFIG.js';

export class SaveExitModal {
    constructor(workoutData = {}) {
        this.workoutData = workoutData;
        this.modalElement = null;
        this.isVisible = false;
        this.resolve = null;
        this.focusTrap = null;
        
        // Configuração das opções do modal
        this.options = [
            { 
                id: 'save-exit', 
                text: 'Salvar e Sair', 
                primary: true,
                icon: '💾',
                description: 'Salva o progresso atual e volta para a tela inicial'
            },
            { 
                id: 'exit-no-save', 
                text: 'Sair sem Salvar', 
                destructive: true,
                icon: '🚪',
                description: 'Perde todo o progresso do treino atual'
            },
            { 
                id: 'cancel', 
                text: 'Cancelar', 
                neutral: true,
                icon: '↩️',
                description: 'Continua o treino'
            }
        ];
        
        // Bind methods
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
    }

    /**
     * Exibe o modal e retorna uma Promise com a escolha do usuário
     * @returns {Promise<string>} 'save-exit' | 'exit-no-save' | 'cancel'
     */
    async show() {
        return new Promise((resolve) => {
            this.resolve = resolve;
            this.render();
            this.setupEventListeners();
            this.setupFocusTrap();
            this.announceToScreenReader();
        });
    }

    /**
     * Renderiza o modal no DOM
     */
    render() {
        const existingModal = document.getElementById('save-exit-modal');
        if (existingModal) {
            existingModal.remove();
        }

        this.modalElement = this.createElement();
        document.body.appendChild(this.modalElement);
        
        // Delay para animação
        setTimeout(() => {
            this.modalElement.classList.add('visible');
            this.isVisible = true;
        }, ComponentConfig.performance.modalDisplayTarget);
    }

    /**
     * Cria o elemento do modal
     */
    createElement() {
        const modal = document.createElement('div');
        modal.id = 'save-exit-modal';
        modal.className = 'modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'save-exit-title');
        modal.setAttribute('aria-describedby', 'save-exit-description');

        const workoutInfo = this.generateWorkoutSummary();
        
        modal.innerHTML = `
            <div class="modal-backdrop" aria-hidden="true"></div>
            <div class="modal-container">
                <div class="modal-content">
                    <!-- Header -->
                    <header class="modal-header">
                        <div class="modal-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 12l2 2 4-4"/>
                                <circle cx="12" cy="12" r="10"/>
                            </svg>
                        </div>
                        <h2 id="save-exit-title" class="modal-title">
                            Sair do Treino
                        </h2>
                        <button type="button" class="modal-close" aria-label="Fechar modal" data-action="cancel">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </header>

                    <!-- Body -->
                    <main class="modal-body">
                        <div id="save-exit-description" class="modal-description">
                            <p>Você tem um treino em andamento. O que deseja fazer?</p>
                        </div>

                        <!-- Workout Summary -->
                        <div class="workout-summary">
                            <div class="summary-item">
                                <span class="summary-label">Tempo decorrido:</span>
                                <span class="summary-value">${workoutInfo.timeElapsed}</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">Exercícios completados:</span>
                                <span class="summary-value">${workoutInfo.exercisesCompleted}</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">Progresso:</span>
                                <span class="summary-value">${workoutInfo.progress}%</span>
                            </div>
                        </div>
                    </main>

                    <!-- Actions -->
                    <footer class="modal-actions">
                        ${this.renderActionButtons()}
                    </footer>
                </div>
            </div>
        `;

        this.applyStyles(modal);
        return modal;
    }

    /**
     * Renderiza os botões de ação
     */
    renderActionButtons() {
        return this.options.map(option => `
            <button 
                type="button"
                class="modal-btn ${this.getButtonClass(option)}"
                data-action="${option.id}"
                ${option.primary ? 'data-primary="true"' : ''}
                aria-describedby="${option.id}-description"
            >
                <span class="btn-icon" aria-hidden="true">${option.icon}</span>
                <span class="btn-text">${option.text}</span>
                <span id="${option.id}-description" class="btn-description sr-only">
                    ${option.description}
                </span>
            </button>
        `).join('');
    }

    /**
     * Retorna a classe CSS apropriada para cada botão
     */
    getButtonClass(option) {
        if (option.primary) return 'btn-primary';
        if (option.destructive) return 'btn-destructive';
        if (option.neutral) return 'btn-neutral';
        return 'btn-secondary';
    }

    /**
     * Gera sumário do treino atual
     */
    generateWorkoutSummary() {
        const defaultSummary = {
            timeElapsed: '0 min',
            exercisesCompleted: '0 de 0',
            progress: '0'
        };

        if (!this.workoutData) return defaultSummary;

        try {
            const elapsed = this.workoutData.startTime 
                ? Math.round((Date.now() - this.workoutData.startTime) / 60000)
                : 0;
            
            const completed = this.workoutData.exerciciosExecutados?.length || 0;
            const total = this.workoutData.currentWorkout?.exercicios?.length || 0;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

            return {
                timeElapsed: elapsed > 0 ? `${elapsed} min` : '< 1 min',
                exercisesCompleted: `${completed} de ${total}`,
                progress: progress.toString()
            };
        } catch (error) {
            console.error('[SaveExitModal] Erro ao gerar sumário:', error);
            return defaultSummary;
        }
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Click nos botões
        this.modalElement.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action) {
                this.handleAction(action);
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeydown);

        // Click fora do modal
        this.modalElement.addEventListener('click', this.handleOutsideClick);
    }

    /**
     * Configura focus trap para acessibilidade
     */
    setupFocusTrap() {
        const focusableElements = this.modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        this.focusTrap = {
            firstElement,
            lastElement,
            elements: focusableElements
        };

        // Focar no primeiro elemento
        setTimeout(() => {
            firstElement?.focus();
        }, ComponentConfig.accessibility.focusTrapDelay);
    }

    /**
     * Manipula navegação por teclado
     */
    handleKeydown(e) {
        if (!this.isVisible) return;

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                this.handleAction('cancel');
                break;
                
            case 'Tab':
                this.handleTabNavigation(e);
                break;
                
            case 'Enter':
                if (e.target.dataset.action) {
                    e.preventDefault();
                    this.handleAction(e.target.dataset.action);
                }
                break;
        }
    }

    /**
     * Manipula navegação por Tab (focus trap)
     */
    handleTabNavigation(e) {
        const { firstElement, lastElement } = this.focusTrap;
        
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }

    /**
     * Manipula cliques fora do modal
     */
    handleOutsideClick(e) {
        if (e.target.classList.contains('modal-backdrop')) {
            this.handleAction('cancel');
        }
    }

    /**
     * Processa a ação selecionada pelo usuário
     */
    handleAction(action) {
        if (!this.resolve) return;

        console.log('[SaveExitModal] Ação selecionada:', action);
        
        this.close();
        this.resolve(action);
    }

    /**
     * Fecha o modal e limpa recursos
     */
    close() {
        if (!this.isVisible) return;

        this.isVisible = false;
        
        // Remover event listeners
        document.removeEventListener('keydown', this.handleKeydown);
        
        // Animação de saída
        this.modalElement.classList.remove('visible');
        
        setTimeout(() => {
            if (this.modalElement && this.modalElement.parentNode) {
                this.modalElement.parentNode.removeChild(this.modalElement);
            }
            this.modalElement = null;
        }, ComponentConfig.modals.animationDuration);
    }

    /**
     * Anuncia o modal para leitores de tela
     */
    announceToScreenReader() {
        setTimeout(() => {
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.textContent = 'Modal de confirmação de saída aberto. Use Tab para navegar pelas opções.';
            
            document.body.appendChild(announcement);
            
            setTimeout(() => {
                document.body.removeChild(announcement);
            }, ComponentConfig.accessibility.announceDelay);
        }, ComponentConfig.accessibility.announceDelay);
    }

    /**
     * Aplica estilos CSS ao modal
     */
    applyStyles(modal) {
        const styles = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: ${ComponentConfig.modals.zIndex};
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity ${ComponentConfig.modals.animationDuration}ms ease-in-out,
                           visibility ${ComponentConfig.modals.animationDuration}ms ease-in-out;
            }

            .modal-overlay.visible {
                opacity: 1;
                visibility: visible;
            }

            .modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, ${ComponentConfig.modals.overlayOpacity});
                cursor: pointer;
            }

            .modal-container {
                position: relative;
                max-width: 480px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                transform: scale(0.95) translateY(20px);
                transition: transform ${ComponentConfig.modals.animationDuration}ms ease-out;
            }

            .modal-overlay.visible .modal-container {
                transform: scale(1) translateY(0);
            }

            .modal-content {
                background: var(--bg-card, #1a1a1a);
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                border: 1px solid var(--border-color, #333);
                overflow: hidden;
            }

            .modal-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 24px 24px 16px;
                border-bottom: 1px solid var(--border-color, #333);
            }

            .modal-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(45deg, var(--accent-primary, #a8ff00), var(--accent-primary-dark, #8de000));
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #000;
            }

            .modal-title {
                flex: 1;
                margin: 0;
                font-size: 1.25rem;
                font-weight: 700;
                color: var(--text-primary, #fff);
            }

            .modal-close {
                width: 36px;
                height: 36px;
                background: var(--bg-secondary, #2a2a2a);
                border: 1px solid var(--border-color, #333);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--text-secondary, #aaa);
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .modal-close:hover {
                background: var(--bg-hover, #333);
                color: var(--text-primary, #fff);
            }

            .modal-body {
                padding: 24px;
            }

            .modal-description {
                margin-bottom: 20px;
            }

            .modal-description p {
                margin: 0;
                color: var(--text-primary, #fff);
                font-size: 1rem;
                line-height: 1.5;
            }

            .workout-summary {
                background: var(--bg-secondary, #2a2a2a);
                border-radius: 12px;
                padding: 16px;
                border: 1px solid var(--border-color, #333);
            }

            .summary-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
            }

            .summary-item:not(:last-child) {
                border-bottom: 1px solid var(--border-color, #333);
            }

            .summary-label {
                color: var(--text-secondary, #aaa);
                font-size: 0.875rem;
            }

            .summary-value {
                color: var(--text-primary, #fff);
                font-weight: 600;
            }

            .modal-actions {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 16px 24px 24px;
                background: var(--bg-secondary, #2a2a2a);
            }

            .modal-btn {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                border-radius: 12px;
                border: 1px solid transparent;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 1rem;
                font-weight: 600;
                text-align: left;
            }

            .modal-btn:focus {
                outline: 2px solid var(--accent-primary, #a8ff00);
                outline-offset: 2px;
            }

            .btn-primary {
                background: linear-gradient(45deg, var(--accent-primary, #a8ff00), var(--accent-primary-dark, #8de000));
                color: #000;
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(168, 255, 0, 0.3);
            }

            .btn-destructive {
                background: var(--bg-card, #1a1a1a);
                color: #ff4757;
                border-color: #ff4757;
            }

            .btn-destructive:hover {
                background: #ff4757;
                color: #fff;
            }

            .btn-neutral {
                background: var(--bg-card, #1a1a1a);
                color: var(--text-primary, #fff);
                border-color: var(--border-color, #333);
            }

            .btn-neutral:hover {
                background: var(--bg-hover, #333);
            }

            .btn-icon {
                font-size: 1.25rem;
            }

            .btn-text {
                flex: 1;
            }

            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }

            @media (max-width: 640px) {
                .modal-container {
                    width: 95%;
                }
                
                .modal-actions {
                    gap: 8px;
                }
                
                .modal-btn {
                    padding: 14px;
                }
            }
        `;

        // Adicionar estilos se ainda não existem
        if (!document.getElementById('save-exit-modal-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'save-exit-modal-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
    }
}

// Função utilitária para uso direto
export async function showSaveExitModal(workoutData) {
    const modal = new SaveExitModal(workoutData);
    return await modal.show();
}

export default SaveExitModal;