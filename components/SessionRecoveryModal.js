/**
 * SessionRecoveryModal.js - Modal de Recuperação de Sessão de Treino
 * Permite ao usuário recuperar treinos interrompidos com preview detalhado
 */

import { ComponentConfig } from '../templates/COMPONENT_CONFIG.js';

export class SessionRecoveryModal {
    constructor(cachedSession = {}) {
        this.sessionData = cachedSession;
        this.preview = this.generatePreview(cachedSession);
        this.modalElement = null;
        this.isVisible = false;
        this.resolve = null;
        this.focusTrap = null;
        
        // Configuração das opções do modal
        this.options = [
            { 
                id: 'recover', 
                text: 'Recuperar Treino', 
                primary: true,
                icon: '🔄',
                description: 'Continua o treino do ponto onde parou'
            },
            { 
                id: 'discard', 
                text: 'Descartar e Reiniciar', 
                destructive: true,
                icon: '🗑️',
                description: 'Remove os dados salvos e inicia um novo treino'
            },
            { 
                id: 'cancel', 
                text: 'Cancelar', 
                neutral: true,
                icon: '↩️',
                description: 'Volta para a tela anterior'
            }
        ];
        
        // Bind methods
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
    }

    /**
     * Gera preview da sessão salva
     */
    generatePreview(session) {
        const defaultPreview = {
            timeElapsed: 'Indisponível',
            exercisesCompleted: '0 de 0',
            lastActivity: 'Indisponível',
            progress: 0,
            workoutName: 'Treino Salvo',
            isValid: false
        };

        if (!session || !session.currentWorkout) {
            return defaultPreview;
        }

        try {
            // Calcular tempo decorrido
            const startTime = session.startTime || session.metadata?.savedAt;
            const elapsed = startTime 
                ? Math.round((Date.now() - new Date(startTime).getTime()) / 60000)
                : 0;

            // Calcular exercícios e séries completados
            const seriesCompleted = session.exerciciosExecutados?.length || 0;
            const exerciciosUnicos = new Set(session.exerciciosExecutados?.map(e => e.exercicio_id) || []);
            const uniqueExercisesCompleted = exerciciosUnicos.size;
            
            // Total de exercícios do treino
            const totalExercises = session.currentWorkout?.exercicios?.length || 0;
            
            // Calcular total de séries esperadas
            let totalSeries = 0;
            if (session.currentWorkout?.exercicios) {
                session.currentWorkout.exercicios.forEach(ex => {
                    totalSeries += (ex.series || 3); // Default 3 séries se não especificado
                });
            }
            
            // Se não temos informação do workout, estimar baseado nos dados existentes
            if (totalExercises === 0 && uniqueExercisesCompleted > 0) {
                // Assumir que cada exercício tem 3 séries em média
                totalSeries = Math.max(uniqueExercisesCompleted * 3, seriesCompleted + 2);
            }
            
            // Calcular progresso baseado em exercícios únicos (mais intuitivo para o usuário)
            const progress = totalExercises > 0 
                ? Math.round((uniqueExercisesCompleted / totalExercises) * 100) 
                : 0;
            
            // Texto de progresso mostrando séries
            const exercisesCompletedText = totalSeries > 0 
                ? `${seriesCompleted}/${totalSeries} séries (${uniqueExercisesCompleted}/${totalExercises} exercícios)`
                : `${seriesCompleted} séries completadas`;

            // Última atividade
            const lastUpdate = session.metadata?.savedAt || session.timestamp;
            const lastActivity = lastUpdate 
                ? this.formatTimestamp(lastUpdate)
                : 'Indisponível';

            return {
                timeElapsed: this.formatDuration(elapsed),
                exercisesCompleted: exercisesCompletedText,
                lastActivity,
                progress,
                workoutName: session.currentWorkout?.nome || 'Treino em Andamento',
                isValid: true,
                // Dados adicionais para debug
                debugInfo: {
                    uniqueExercisesCompleted,
                    totalExercises,
                    seriesCompleted,
                    totalSeries
                }
            };
        } catch (error) {
            console.error('[SessionRecoveryModal] Erro ao gerar preview:', error);
            return defaultPreview;
        }
    }

    /**
     * Formata duração em minutos para string legível
     */
    formatDuration(minutes) {
        if (minutes <= 0) return '< 1 min';
        if (minutes < 60) return `${minutes} min`;
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (remainingMinutes === 0) {
            return `${hours}h`;
        }
        
        return `${hours}h ${remainingMinutes}min`;
    }

    /**
     * Formata timestamp para string legível
     */
    formatTimestamp(timestamp) {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMinutes = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMinutes < 1) return 'Agora mesmo';
            if (diffMinutes < 60) return `${diffMinutes} min atrás`;
            if (diffHours < 24) return `${diffHours}h atrás`;
            if (diffDays === 1) return 'Ontem';
            if (diffDays < 7) return `${diffDays} dias atrás`;
            
            return window.dateUtils ? 
                window.dateUtils.formatInSP(date, 'dd/MM/yyyy') : 
                date.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
        } catch (error) {
            console.error('[SessionRecoveryModal] Erro ao formatar timestamp:', error);
            return 'Indisponível';
        }
    }

    /**
     * Exibe o modal e retorna uma Promise com a escolha do usuário
     * @returns {Promise<string>} 'recover' | 'discard' | 'cancel'
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
        const existingModal = document.getElementById('session-recovery-modal');
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
        modal.id = 'session-recovery-modal';
        modal.className = 'modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'recovery-title');
        modal.setAttribute('aria-describedby', 'recovery-description');

        modal.innerHTML = `
            <div class="modal-backdrop" aria-hidden="true"></div>
            <div class="modal-container">
                <div class="modal-content">
                    <!-- Header -->
                    <header class="modal-header">
                        <div class="modal-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                                <path d="M21 3v5h-5"/>
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                                <path d="M8 16H3v5"/>
                            </svg>
                        </div>
                        <h2 id="recovery-title" class="modal-title">
                            Treino Interrompido Detectado
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
                        <div id="recovery-description" class="modal-description">
                            <p>Foi encontrado um treino que não foi finalizado. Deseja recuperá-lo?</p>
                        </div>

                        <!-- Session Preview -->
                        <div class="session-preview">
                            <div class="preview-header">
                                <h3 class="preview-title">${this.preview.workoutName}</h3>
                                <div class="preview-status ${this.preview.isValid ? 'status-valid' : 'status-invalid'}">
                                    <span class="status-indicator"></span>
                                    <span class="status-text">${this.preview.isValid ? 'Válido' : 'Corrompido'}</span>
                                </div>
                            </div>

                            <div class="preview-grid">
                                <div class="preview-item">
                                    <div class="preview-icon">⏱️</div>
                                    <div class="preview-content">
                                        <span class="preview-label">Tempo Decorrido</span>
                                        <span class="preview-value">${this.preview.timeElapsed}</span>
                                    </div>
                                </div>

                                <div class="preview-item">
                                    <div class="preview-icon">✅</div>
                                    <div class="preview-content">
                                        <span class="preview-label">Exercícios</span>
                                        <span class="preview-value">${this.preview.exercisesCompleted}</span>
                                    </div>
                                </div>

                                <div class="preview-item">
                                    <div class="preview-icon">📊</div>
                                    <div class="preview-content">
                                        <span class="preview-label">Progresso</span>
                                        <span class="preview-value">${this.preview.progress}%</span>
                                    </div>
                                </div>

                                <div class="preview-item">
                                    <div class="preview-icon">🕐</div>
                                    <div class="preview-content">
                                        <span class="preview-label">Última Atividade</span>
                                        <span class="preview-value">${this.preview.lastActivity}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Progress Bar -->
                            <div class="progress-container">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${this.preview.progress}%"></div>
                                </div>
                                <span class="progress-text">${this.preview.progress}% concluído</span>
                            </div>
                        </div>

                        ${!this.preview.isValid ? this.renderWarning() : ''}
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
     * Renderiza aviso para dados corrompidos
     */
    renderWarning() {
        return `
            <div class="warning-box">
                <div class="warning-icon">⚠️</div>
                <div class="warning-content">
                    <strong>Atenção:</strong> Os dados do treino podem estar corrompidos. 
                    Recomenda-se descartar e iniciar um novo treino.
                </div>
            </div>
        `;
    }

    /**
     * Renderiza os botões de ação
     */
    renderActionButtons() {
        return this.options.map(option => {
            const isDisabled = !this.preview.isValid && option.id === 'recover';
            
            return `
                <button 
                    type="button"
                    class="modal-btn ${this.getButtonClass(option)} ${isDisabled ? 'btn-disabled' : ''}"
                    data-action="${option.id}"
                    ${option.primary ? 'data-primary="true"' : ''}
                    ${isDisabled ? 'disabled aria-disabled="true"' : ''}
                    aria-describedby="${option.id}-description"
                >
                    <span class="btn-icon" aria-hidden="true">${option.icon}</span>
                    <span class="btn-text">${option.text}</span>
                    <span id="${option.id}-description" class="btn-description sr-only">
                        ${option.description}
                    </span>
                </button>
            `;
        }).join('');
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
     * Configura event listeners
     */
    setupEventListeners() {
        // Click nos botões
        this.modalElement.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (button && !button.disabled) {
                const action = button.dataset.action;
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
            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
                if (e.target.dataset.action && !e.target.disabled) {
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

        console.log('[SessionRecoveryModal] Ação selecionada:', action);
        
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
            announcement.textContent = `Modal de recuperação de sessão aberto. Treino ${this.preview.isValid ? 'válido' : 'corrompido'} detectado. Use Tab para navegar.`;
            
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
            .session-preview {
                background: var(--bg-secondary, #2a2a2a);
                border-radius: 12px;
                padding: 20px;
                border: 1px solid var(--border-color, #333);
                margin-top: 16px;
            }

            .preview-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 16px;
                border-bottom: 1px solid var(--border-color, #333);
            }

            .preview-title {
                margin: 0;
                font-size: 1.125rem;
                font-weight: 700;
                color: var(--text-primary, #fff);
            }

            .preview-status {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .status-valid {
                background: rgba(76, 175, 80, 0.1);
                color: #4caf50;
                border: 1px solid rgba(76, 175, 80, 0.3);
            }

            .status-invalid {
                background: rgba(255, 71, 87, 0.1);
                color: #ff4757;
                border: 1px solid rgba(255, 71, 87, 0.3);
            }

            .status-indicator {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: currentColor;
            }

            .preview-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: 16px;
                margin-bottom: 20px;
            }

            .preview-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: var(--bg-card, #1a1a1a);
                border-radius: 8px;
                border: 1px solid var(--border-color, #333);
            }

            .preview-icon {
                font-size: 1.25rem;
                width: 32px;
                text-align: center;
            }

            .preview-content {
                flex: 1;
                min-width: 0;
            }

            .preview-label {
                display: block;
                color: var(--text-secondary, #aaa);
                font-size: 0.75rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 2px;
            }

            .preview-value {
                display: block;
                color: var(--text-primary, #fff);
                font-weight: 600;
                font-size: 0.875rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .progress-container {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .progress-bar {
                flex: 1;
                height: 8px;
                background: var(--bg-card, #1a1a1a);
                border-radius: 4px;
                overflow: hidden;
                border: 1px solid var(--border-color, #333);
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--accent-primary, #a8ff00), var(--accent-primary-dark, #8de000));
                border-radius: 4px;
                transition: width 0.3s ease;
                box-shadow: 0 0 8px rgba(168, 255, 0, 0.3);
            }

            .progress-text {
                color: var(--text-secondary, #aaa);
                font-size: 0.875rem;
                font-weight: 600;
                min-width: 80px;
                text-align: right;
            }

            .warning-box {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 16px;
                background: rgba(255, 193, 7, 0.1);
                border: 1px solid rgba(255, 193, 7, 0.3);
                border-radius: 8px;
                margin-top: 16px;
            }

            .warning-icon {
                font-size: 1.25rem;
                margin-top: 2px;
            }

            .warning-content {
                flex: 1;
                color: #ffc107;
                font-size: 0.875rem;
                line-height: 1.4;
            }

            .btn-disabled {
                opacity: 0.5;
                cursor: not-allowed;
                pointer-events: none;
            }

            @media (max-width: 640px) {
                .preview-grid {
                    grid-template-columns: 1fr;
                }
                
                .preview-header {
                    flex-direction: column;
                    gap: 12px;
                    align-items: flex-start;
                }
                
                .progress-container {
                    flex-direction: column;
                    gap: 8px;
                    align-items: stretch;
                }
                
                .progress-text {
                    text-align: center;
                    min-width: auto;
                }
            }
        `;

        // Reutilizar estilos base do SaveExitModal se existirem
        if (!document.getElementById('session-recovery-modal-styles')) {
            const baseStyles = document.getElementById('save-exit-modal-styles');
            
            const styleSheet = document.createElement('style');
            styleSheet.id = 'session-recovery-modal-styles';
            styleSheet.textContent = (baseStyles ? '' : this.getBaseModalStyles()) + styles;
            document.head.appendChild(styleSheet);
        }
    }

    /**
     * Retorna estilos base do modal (caso SaveExitModal não tenha sido carregado)
     */
    getBaseModalStyles() {
        return `
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
                max-width: 520px;
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
                margin-bottom: 16px;
            }

            .modal-description p {
                margin: 0;
                color: var(--text-primary, #fff);
                font-size: 1rem;
                line-height: 1.5;
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

            .btn-primary:hover:not(.btn-disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(168, 255, 0, 0.3);
            }

            .btn-destructive {
                background: var(--bg-card, #1a1a1a);
                color: #ff4757;
                border-color: #ff4757;
            }

            .btn-destructive:hover:not(.btn-disabled) {
                background: #ff4757;
                color: #fff;
            }

            .btn-neutral {
                background: var(--bg-card, #1a1a1a);
                color: var(--text-primary, #fff);
                border-color: var(--border-color, #333);
            }

            .btn-neutral:hover:not(.btn-disabled) {
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
        `;
    }
}

// Função utilitária para uso direto
export async function showSessionRecoveryModal(cachedSession) {
    const modal = new SessionRecoveryModal(cachedSession);
    return await modal.show();
}

export default SessionRecoveryModal;