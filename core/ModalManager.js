// core/ModalManager.js
// Sistema centralizado para gerenciamento de modais

import eventBus, { SystemEvents } from './EventBus.js';

export class ModalManager {
    constructor() {
        this.activeModals = new Map();
        this.modalContainer = null;
        this.modalStack = [];
        this.backdropElement = null;
        this.initialized = false;
    }
    
    /**
     * Inicializa o sistema de modais
     */
    async initialize() {
        if (this.initialized) return;
        
        console.log('[ModalManager] Initializing...');
        
        // Criar ou encontrar container de modais
        this.modalContainer = document.getElementById('modals-container');
        if (!this.modalContainer) {
            this.modalContainer = document.createElement('div');
            this.modalContainer.id = 'modals-container';
            this.modalContainer.className = 'modals-container';
            this.modalContainer.setAttribute('aria-live', 'polite');
            document.body.appendChild(this.modalContainer);
        }
        
        // Criar backdrop compartilhado
        this.createBackdrop();
        
        // Adicionar estilos base
        this.injectStyles();
        
        // Configurar listeners
        this.setupEventListeners();
        
        this.initialized = true;
        console.log('[ModalManager] ✅ Initialized');
    }
    
    /**
     * Mostra um modal
     */
    async show(ModalClass, options = {}) {
        await this.initialize();
        
        console.log(`[ModalManager] Showing modal: ${ModalClass.name}`);
        
        try {
            // Criar instância do modal
            const modal = new ModalClass(options);
            const modalId = modal.id || `modal-${Date.now()}`;
            
            // Configurar elemento do modal
            const modalElement = await this.createModalElement(modal, modalId);
            
            // Adicionar ao container
            this.modalContainer.appendChild(modalElement);
            
            // Registrar modal ativo
            this.activeModals.set(modalId, {
                instance: modal,
                element: modalElement,
                options
            });
            
            // Adicionar ao stack
            this.modalStack.push(modalId);
            
            // Atualizar backdrop
            this.updateBackdrop();
            
            // Focar no modal
            this.focusModal(modalElement);
            
            // Emitir evento
            eventBus.emit(SystemEvents.MODAL_OPENED, {
                modalId,
                modalClass: ModalClass.name
            });
            
            // Retornar promise que resolve com resultado do modal
            return new Promise((resolve, reject) => {
                modal.on('close', (result) => {
                    this.close(modalId, result);
                    resolve(result);
                });
                
                modal.on('error', (error) => {
                    this.close(modalId, null, error);
                    reject(error);
                });
            });
            
        } catch (error) {
            console.error('[ModalManager] Error showing modal:', error);
            throw error;
        }
    }
    
    /**
     * Fecha um modal específico
     */
    close(modalId, result = null, error = null) {
        const modalData = this.activeModals.get(modalId);
        if (!modalData) {
            console.warn(`[ModalManager] Modal not found: ${modalId}`);
            return;
        }
        
        console.log(`[ModalManager] Closing modal: ${modalId}`);
        
        try {
            // Chamar método de cleanup do modal se existir
            if (modalData.instance.cleanup) {
                modalData.instance.cleanup();
            }
            
            // Remover elemento do DOM
            modalData.element.remove();
            
            // Remover do registro
            this.activeModals.delete(modalId);
            
            // Remover do stack
            const stackIndex = this.modalStack.indexOf(modalId);
            if (stackIndex > -1) {
                this.modalStack.splice(stackIndex, 1);
            }
            
            // Atualizar backdrop
            this.updateBackdrop();
            
            // Restaurar foco
            this.restoreFocus();
            
            // Emitir evento
            eventBus.emit(SystemEvents.MODAL_CLOSED, {
                modalId,
                result,
                error
            });
            
        } catch (err) {
            console.error('[ModalManager] Error closing modal:', err);
        }
    }
    
    /**
     * Fecha todos os modais
     */
    closeAll() {
        console.log('[ModalManager] Closing all modals');
        
        // Fechar em ordem reversa (último primeiro)
        const modalIds = [...this.modalStack].reverse();
        
        modalIds.forEach(modalId => {
            this.close(modalId);
        });
    }
    
    /**
     * Fecha o modal mais recente
     */
    closeTopmost() {
        if (this.modalStack.length > 0) {
            const topmostId = this.modalStack[this.modalStack.length - 1];
            this.close(topmostId);
        }
    }
    
    /**
     * Cria elemento do modal
     */
    async createModalElement(modal, modalId) {
        // Container do modal
        const modalWrapper = document.createElement('div');
        modalWrapper.className = 'modal-wrapper';
        modalWrapper.id = modalId;
        modalWrapper.setAttribute('role', 'dialog');
        modalWrapper.setAttribute('aria-modal', 'true');
        modalWrapper.setAttribute('aria-labelledby', `${modalId}-title`);
        
        // Adicionar z-index baseado na posição no stack
        const zIndex = 1000 + (this.modalStack.length * 10);
        modalWrapper.style.zIndex = zIndex;
        
        // Renderizar conteúdo do modal
        let content;
        if (typeof modal.render === 'function') {
            content = await modal.render();
        } else if (typeof modal.getContent === 'function') {
            content = await modal.getContent();
        } else {
            throw new Error('Modal must implement render() or getContent() method');
        }
        
        // Se conteúdo é string HTML
        if (typeof content === 'string') {
            modalWrapper.innerHTML = content;
        } 
        // Se conteúdo é elemento DOM
        else if (content instanceof HTMLElement) {
            modalWrapper.appendChild(content);
        } else {
            throw new Error('Modal content must be string or HTMLElement');
        }
        
        // Configurar evento de fechar ao clicar fora
        modalWrapper.addEventListener('click', (e) => {
            if (e.target === modalWrapper && modal.closeOnBackdrop !== false) {
                this.close(modalId);
            }
        });
        
        // Adicionar classe de animação
        requestAnimationFrame(() => {
            modalWrapper.classList.add('modal-show');
        });
        
        return modalWrapper;
    }
    
    /**
     * Cria backdrop compartilhado
     */
    createBackdrop() {
        if (this.backdropElement) return;
        
        this.backdropElement = document.createElement('div');
        this.backdropElement.className = 'modal-backdrop';
        this.backdropElement.style.display = 'none';
        document.body.appendChild(this.backdropElement);
    }
    
    /**
     * Atualiza visibilidade do backdrop
     */
    updateBackdrop() {
        if (!this.backdropElement) return;
        
        if (this.activeModals.size > 0) {
            this.backdropElement.style.display = 'block';
            document.body.classList.add('modal-open');
            
            // Ajustar z-index do backdrop
            const lowestZIndex = 1000 + ((this.modalStack.length - 1) * 10) - 1;
            this.backdropElement.style.zIndex = lowestZIndex;
        } else {
            this.backdropElement.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }
    
    /**
     * Gerencia foco no modal
     */
    focusModal(modalElement) {
        // Salvar elemento focado anteriormente
        this.previousFocus = document.activeElement;
        
        // Procurar primeiro elemento focável no modal
        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        } else {
            modalElement.focus();
        }
        
        // Trap focus dentro do modal
        this.trapFocus(modalElement);
    }
    
    /**
     * Prende o foco dentro do modal
     */
    trapFocus(modalElement) {
        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        modalElement.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
    }
    
    /**
     * Restaura foco ao elemento anterior
     */
    restoreFocus() {
        if (this.previousFocus && this.activeModals.size === 0) {
            this.previousFocus.focus();
            this.previousFocus = null;
        }
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalStack.length > 0) {
                const topmostId = this.modalStack[this.modalStack.length - 1];
                const modalData = this.activeModals.get(topmostId);
                
                if (modalData && modalData.instance.closeOnEscape !== false) {
                    this.close(topmostId);
                }
            }
        });
    }
    
    /**
     * Injeta estilos base para modais
     */
    injectStyles() {
        if (document.getElementById('modal-manager-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'modal-manager-styles';
        styles.textContent = `
            .modals-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 0;
                height: 0;
                z-index: 1000;
                pointer-events: none;
            }
            
            .modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                animation: fadeIn 0.3s ease;
            }
            
            .modal-wrapper {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                pointer-events: auto;
                opacity: 0;
                animation: fadeIn 0.3s ease forwards;
            }
            
            .modal-wrapper.modal-show {
                opacity: 1;
            }
            
            .modal-wrapper > * {
                max-width: 90vw;
                max-height: 90vh;
                overflow: auto;
                animation: slideUp 0.3s ease;
            }
            
            body.modal-open {
                overflow: hidden;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(30px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    /**
     * Verifica se há modais ativos
     */
    hasActiveModals() {
        return this.activeModals.size > 0;
    }
    
    /**
     * Obtém modal ativo por ID
     */
    getModal(modalId) {
        const modalData = this.activeModals.get(modalId);
        return modalData ? modalData.instance : null;
    }
    
    /**
     * Obtém modal no topo do stack
     */
    getTopmostModal() {
        if (this.modalStack.length === 0) return null;
        
        const topmostId = this.modalStack[this.modalStack.length - 1];
        return this.getModal(topmostId);
    }
}

// Singleton
const modalManager = new ModalManager();

export default modalManager;