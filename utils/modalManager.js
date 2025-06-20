/**
 * ModalManager.js - Gerenciador Singleton de Modais
 * Gerencia ciclo de vida, stack e coordenação entre modais
 */

import { ComponentConfig } from '../templates/COMPONENT_CONFIG.js';

class ModalManager {
    constructor() {
        if (ModalManager.instance) {
            return ModalManager.instance;
        }

        this.modalStack = [];
        this.activeModals = new Map();
        this.isInitialized = false;
        
        // Configurações
        this.config = {
            maxConcurrentModals: 3,
            stackZIndexBase: ComponentConfig.modals.zIndex,
            enableEscapeClose: true,
            enableBackdropClose: true,
            preserveScrollPosition: true
        };

        // Estado global
        this.state = {
            bodyScrollPosition: 0,
            bodyOverflow: '',
            hasBodyScrollLock: false
        };

        ModalManager.instance = this;
        this.init();
    }

    /**
     * Inicializa o gerenciador
     */
    init() {
        if (this.isInitialized) return;

        this.setupGlobalEventListeners();
        this.injectGlobalStyles();
        this.isInitialized = true;

        console.log('[ModalManager] Inicializado com sucesso');
    }

    /**
     * Registra um modal no gerenciador
     * @param {string} id - ID único do modal
     * @param {Object} modalInstance - Instância do modal
     * @param {Object} options - Opções do modal
     */
    register(id, modalInstance, options = {}) {
        if (this.activeModals.has(id)) {
            console.warn(`[ModalManager] Modal ${id} já está registrado`);
            return false;
        }

        const modalConfig = {
            id,
            instance: modalInstance,
            element: null,
            zIndex: this.calculateZIndex(),
            isVisible: false,
            canClose: options.canClose !== false,
            persistent: options.persistent || false,
            backdrop: options.backdrop !== false,
            ...options
        };

        this.activeModals.set(id, modalConfig);
        this.modalStack.push(id);

        console.log(`[ModalManager] Modal ${id} registrado. Stack: [${this.modalStack.join(', ')}]`);
        return true;
    }

    /**
     * Remove um modal do gerenciador
     * @param {string} id - ID do modal
     */
    unregister(id) {
        if (!this.activeModals.has(id)) {
            console.warn(`[ModalManager] Modal ${id} não está registrado`);
            return false;
        }

        const modalConfig = this.activeModals.get(id);
        
        // Remover do stack
        const index = this.modalStack.indexOf(id);
        if (index > -1) {
            this.modalStack.splice(index, 1);
        }

        // Remover do mapa
        this.activeModals.delete(id);

        // Se era o último modal, restaurar scroll do body
        if (this.modalStack.length === 0) {
            this.restoreBodyScroll();
        }

        console.log(`[ModalManager] Modal ${id} removido. Stack: [${this.modalStack.join(', ')}]`);
        return true;
    }

    /**
     * Exibe um modal
     * @param {string} id - ID do modal
     */
    show(id) {
        const modalConfig = this.activeModals.get(id);
        if (!modalConfig) {
            console.error(`[ModalManager] Modal ${id} não encontrado`);
            return false;
        }

        // Verificar limite de modais
        if (this.getVisibleModalsCount() >= this.config.maxConcurrentModals) {
            console.warn(`[ModalManager] Limite de modais simultâneos atingido (${this.config.maxConcurrentModals})`);
            return false;
        }

        // Bloquear scroll do body se for o primeiro modal
        if (this.modalStack.length === 1) {
            this.lockBodyScroll();
        }

        // Atualizar configuração
        modalConfig.isVisible = true;
        modalConfig.zIndex = this.calculateZIndex();

        // Atualizar z-index do modal
        if (modalConfig.element) {
            modalConfig.element.style.zIndex = modalConfig.zIndex;
        }

        this.updateModalOrder();
        
        console.log(`[ModalManager] Modal ${id} exibido com z-index ${modalConfig.zIndex}`);
        return true;
    }

    /**
     * Oculta um modal
     * @param {string} id - ID do modal
     */
    hide(id) {
        const modalConfig = this.activeModals.get(id);
        if (!modalConfig) {
            console.error(`[ModalManager] Modal ${id} não encontrado`);
            return false;
        }

        modalConfig.isVisible = false;

        // Se foi o último modal visível, restaurar scroll
        if (this.getVisibleModalsCount() === 0) {
            this.restoreBodyScroll();
        }

        this.updateModalOrder();
        
        console.log(`[ModalManager] Modal ${id} ocultado`);
        return true;
    }

    /**
     * Fecha um modal específico
     * @param {string} id - ID do modal
     * @param {boolean} force - Forçar fechamento mesmo se persistente
     */
    close(id, force = false) {
        const modalConfig = this.activeModals.get(id);
        if (!modalConfig) {
            return false;
        }

        // Verificar se pode fechar
        if (modalConfig.persistent && !force) {
            console.log(`[ModalManager] Modal ${id} é persistente e não pode ser fechado`);
            return false;
        }

        if (!modalConfig.canClose && !force) {
            console.log(`[ModalManager] Modal ${id} não pode ser fechado`);
            return false;
        }

        // Chamar método close da instância se existir
        if (modalConfig.instance && typeof modalConfig.instance.close === 'function') {
            modalConfig.instance.close();
        }

        this.unregister(id);
        return true;
    }

    /**
     * Fecha todos os modais
     * @param {boolean} force - Forçar fechamento de modais persistentes
     */
    closeAll(force = false) {
        const modalsToClose = [...this.modalStack];
        let closedCount = 0;

        modalsToClose.forEach(id => {
            if (this.close(id, force)) {
                closedCount++;
            }
        });

        console.log(`[ModalManager] ${closedCount} modais fechados`);
        return closedCount;
    }

    /**
     * Retorna o modal no topo do stack
     */
    getTopModal() {
        const visibleModals = this.modalStack.filter(id => {
            const config = this.activeModals.get(id);
            return config && config.isVisible;
        });

        if (visibleModals.length === 0) return null;

        const topModalId = visibleModals[visibleModals.length - 1];
        return this.activeModals.get(topModalId);
    }

    /**
     * Conta modais visíveis
     */
    getVisibleModalsCount() {
        return Array.from(this.activeModals.values())
            .filter(config => config.isVisible).length;
    }

    /**
     * Calcula z-index para o próximo modal
     */
    calculateZIndex() {
        const baseZIndex = this.config.stackZIndexBase;
        const stackPosition = this.modalStack.length;
        return baseZIndex + (stackPosition * 10);
    }

    /**
     * Atualiza ordem dos modais no DOM
     */
    updateModalOrder() {
        this.modalStack.forEach((id, index) => {
            const modalConfig = this.activeModals.get(id);
            if (modalConfig && modalConfig.element) {
                const zIndex = this.config.stackZIndexBase + (index * 10);
                modalConfig.element.style.zIndex = zIndex;
                modalConfig.zIndex = zIndex;
            }
        });
    }

    /**
     * Bloqueia scroll do body
     */
    lockBodyScroll() {
        if (this.state.hasBodyScrollLock) return;

        const body = document.body;
        
        // Salvar estado atual
        this.state.bodyScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        this.state.bodyOverflow = body.style.overflow;

        // Aplicar lock
        body.style.overflow = 'hidden';
        body.style.position = 'fixed';
        body.style.top = `-${this.state.bodyScrollPosition}px`;
        body.style.width = '100%';

        this.state.hasBodyScrollLock = true;
        
        console.log('[ModalManager] Body scroll bloqueado');
    }

    /**
     * Restaura scroll do body
     */
    restoreBodyScroll() {
        if (!this.state.hasBodyScrollLock) return;

        const body = document.body;
        
        // Restaurar estilo
        body.style.overflow = this.state.bodyOverflow;
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';

        // Restaurar posição de scroll
        window.scrollTo(0, this.state.bodyScrollPosition);

        this.state.hasBodyScrollLock = false;
        
        console.log('[ModalManager] Body scroll restaurado');
    }

    /**
     * Configura event listeners globais
     */
    setupGlobalEventListeners() {
        // ESC para fechar modal do topo
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.config.enableEscapeClose) {
                const topModal = this.getTopModal();
                if (topModal) {
                    this.close(topModal.id);
                }
            }
        });

        // Detectar novos modais sendo adicionados
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && 
                        node.classList?.contains('modal-overlay')) {
                        this.handleNewModalElement(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.mutationObserver = observer;
    }

    /**
     * Manipula novos elementos de modal detectados
     */
    handleNewModalElement(element) {
        const modalId = element.id;
        if (!modalId) return;

        // Atualizar referência do elemento na configuração
        const modalConfig = this.activeModals.get(modalId);
        if (modalConfig) {
            modalConfig.element = element;
            
            // Aplicar z-index correto
            element.style.zIndex = modalConfig.zIndex;
            
            console.log(`[ModalManager] Elemento do modal ${modalId} detectado e configurado`);
        }
    }

    /**
     * Injeta estilos globais para coordenação de modais
     */
    injectGlobalStyles() {
        if (document.getElementById('modal-manager-styles')) return;

        const styles = `
            /* Modal Manager Global Styles */
            .modal-manager-backdrop {
                background: rgba(0, 0, 0, 0.1);
                backdrop-filter: blur(2px);
            }

            .modal-overlay + .modal-overlay .modal-backdrop {
                background: rgba(0, 0, 0, 0.3);
            }

            .modal-stack-indicator {
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.75rem;
                z-index: 1;
                pointer-events: none;
            }

            /* Animações para stack de modais */
            .modal-overlay:not(.visible) {
                pointer-events: none;
            }

            .modal-overlay.modal-behind {
                filter: brightness(0.8) blur(1px);
                transform: scale(0.98);
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.id = 'modal-manager-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    /**
     * Adiciona indicador visual de stack (para debug)
     */
    addStackIndicator(modalElement, position) {
        if (!modalElement || document.getElementById('modal-stack-indicator')) return;

        const indicator = document.createElement('div');
        indicator.id = 'modal-stack-indicator';
        indicator.className = 'modal-stack-indicator';
        indicator.textContent = `Stack: ${position + 1}/${this.modalStack.length}`;
        
        modalElement.appendChild(indicator);
    }

    /**
     * Retorna informações de debug
     */
    getDebugInfo() {
        return {
            activeModals: Array.from(this.activeModals.keys()),
            modalStack: [...this.modalStack],
            visibleCount: this.getVisibleModalsCount(),
            topModal: this.getTopModal()?.id || null,
            bodyScrollLocked: this.state.hasBodyScrollLock,
            config: this.config
        };
    }

    /**
     * Limpa todos os recursos (para cleanup)
     */
    destroy() {
        this.closeAll(true);
        
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        this.restoreBodyScroll();
        
        // Remover estilos
        const styles = document.getElementById('modal-manager-styles');
        if (styles) {
            styles.remove();
        }

        console.log('[ModalManager] Destruído');
    }
}

// Criar e exportar instância singleton
const modalManager = new ModalManager();

// Funções utilitárias para uso direto
export const registerModal = (id, instance, options) => modalManager.register(id, instance, options);
export const unregisterModal = (id) => modalManager.unregister(id);
export const showModal = (id) => modalManager.show(id);
export const hideModal = (id) => modalManager.hide(id);
export const closeModal = (id, force) => modalManager.close(id, force);
export const closeAllModals = (force) => modalManager.closeAll(force);
export const getTopModal = () => modalManager.getTopModal();
export const getModalDebugInfo = () => modalManager.getDebugInfo();

// Disponibilizar globalmente para debug
window.modalManager = modalManager;
window.getModalDebugInfo = getModalDebugInfo;

export default modalManager;