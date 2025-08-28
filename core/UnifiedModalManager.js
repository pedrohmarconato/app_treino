// core/UnifiedModalManager.js
// Unified modal management system combining best features from both managers

export class UnifiedModalManager {
  constructor() {
    if (UnifiedModalManager.instance) {
      return UnifiedModalManager.instance;
    }

    this.activeModals = new Map();
    this.modalContainer = null;
    this.modalStack = [];
    this.backdropElement = null;
    this.initialized = false;

    // Configuration
    this.config = {
      maxConcurrentModals: 3,
      enableEscapeClose: true,
      enableBackdropClose: true,
      preserveScrollPosition: true,
    };

    // State management
    this.state = {
      bodyScrollPosition: 0,
      bodyOverflow: '',
      isScrollLocked: false,
    };

    UnifiedModalManager.instance = this;
  }

  /**
   * Initialize the modal system
   */
  async initialize() {
    if (this.initialized) return;

    console.log('[UnifiedModalManager] Initializing...');

    // Create or find modal container
    this.modalContainer = document.getElementById('modals-container');
    if (!this.modalContainer) {
      this.modalContainer = document.createElement('div');
      this.modalContainer.id = 'modals-container';
      this.modalContainer.className = 'modals-container';
      this.modalContainer.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.modalContainer);
    }

    // Create shared backdrop
    this.createBackdrop();

    // Add base styles
    this.injectStyles();

    // Setup listeners
    this.setupEventListeners();

    this.initialized = true;
    console.log('[UnifiedModalManager] ✅ Initialized');
  }

  /**
   * Show a modal with Promise-based async pattern
   */
  async show(ModalClass, options = {}) {
    await this.initialize();

    const modalId = options.id || `modal-${Date.now()}`;

    // Check concurrent limit
    if (this.modalStack.length >= this.config.maxConcurrentModals) {
      console.warn('[UnifiedModalManager] Maximum concurrent modals reached');
      return null;
    }

    try {
      // Create modal instance
      const modalInstance = new ModalClass(options);

      // Add to tracking
      this.activeModals.set(modalId, modalInstance);
      this.modalStack.push(modalId);

      // Lock body scroll for first modal
      if (this.modalStack.length === 1) {
        this.lockBodyScroll();
      }

      // Show backdrop
      this.showBackdrop();

      // Calculate z-index
      const zIndex = this.calculateZIndex();

      // Show modal
      await modalInstance.show({
        container: this.modalContainer,
        zIndex,
        onClose: () => this.hide(modalId),
      });

      // Focus management
      this.manageFocus(modalInstance);

      console.log(`[UnifiedModalManager] Modal ${modalId} shown`);
      return modalInstance;
    } catch (error) {
      console.error('[UnifiedModalManager] Error showing modal:', error);
      this.cleanup(modalId);
      throw error;
    }
  }

  /**
   * Hide a specific modal
   */
  async hide(modalId) {
    const modalInstance = this.activeModals.get(modalId);
    if (!modalInstance) return false;

    try {
      // Hide modal
      await modalInstance.hide();

      // Remove from tracking
      this.activeModals.delete(modalId);
      const stackIndex = this.modalStack.indexOf(modalId);
      if (stackIndex > -1) {
        this.modalStack.splice(stackIndex, 1);
      }

      // Hide backdrop if no modals
      if (this.modalStack.length === 0) {
        this.hideBackdrop();
        this.unlockBodyScroll();
      }

      // Restore focus to previous modal or body
      this.restoreFocus();

      console.log(`[UnifiedModalManager] Modal ${modalId} hidden`);
      return true;
    } catch (error) {
      console.error('[UnifiedModalManager] Error hiding modal:', error);
      return false;
    }
  }

  /**
   * Hide all modals
   */
  async hideAll() {
    const hidePromises = Array.from(this.activeModals.keys()).map((id) => this.hide(id));
    await Promise.all(hidePromises);
  }

  /**
   * Create shared backdrop element
   */
  createBackdrop() {
    if (this.backdropElement) return;

    this.backdropElement = document.createElement('div');
    this.backdropElement.className = 'modal-backdrop-unified';
    this.backdropElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            z-index: var(--z-modal-backdrop);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        `;

    if (this.config.enableBackdropClose) {
      this.backdropElement.addEventListener('click', () => {
        this.hideAll();
      });
    }

    document.body.appendChild(this.backdropElement);
  }

  /**
   * Show backdrop
   */
  showBackdrop() {
    if (this.backdropElement) {
      this.backdropElement.style.opacity = '1';
      this.backdropElement.style.pointerEvents = 'auto';
    }
  }

  /**
   * Hide backdrop
   */
  hideBackdrop() {
    if (this.backdropElement) {
      this.backdropElement.style.opacity = '0';
      this.backdropElement.style.pointerEvents = 'none';
    }
  }

  /**
   * Calculate z-index for modal
   */
  calculateZIndex() {
    const baseZIndex =
      parseInt(getComputedStyle(document.documentElement).getPropertyValue('--z-modal').trim()) ||
      1030;
    return baseZIndex + this.modalStack.length * 10;
  }

  /**
   * Lock body scroll
   */
  lockBodyScroll() {
    if (this.state.isScrollLocked) return;

    this.state.bodyScrollPosition = window.pageYOffset;
    this.state.bodyOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = this.getScrollbarWidth() + 'px';

    this.state.isScrollLocked = true;
  }

  /**
   * Unlock body scroll
   */
  unlockBodyScroll() {
    if (!this.state.isScrollLocked) return;

    document.body.style.overflow = this.state.bodyOverflow;
    document.body.style.paddingRight = '';

    if (this.config.preserveScrollPosition) {
      window.scrollTo(0, this.state.bodyScrollPosition);
    }

    this.state.isScrollLocked = false;
  }

  /**
   * Get scrollbar width for padding compensation
   */
  getScrollbarWidth() {
    const scrollDiv = document.createElement('div');
    scrollDiv.style.cssText =
      'width: 100px; height: 100px; overflow: scroll; position: absolute; top: -9999px;';
    document.body.appendChild(scrollDiv);
    const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);
    return scrollbarWidth;
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // ESC key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.config.enableEscapeClose && this.modalStack.length > 0) {
        const topModalId = this.modalStack[this.modalStack.length - 1];
        this.hide(topModalId);
      }
    });

    // Window resize handler
    window.addEventListener('resize', () => {
      this.activeModals.forEach((modal) => {
        if (typeof modal.onResize === 'function') {
          modal.onResize();
        }
      });
    });
  }

  /**
   * Focus management
   */
  manageFocus(modalInstance) {
    // Store previous focus
    modalInstance._previouslyFocused = document.activeElement;

    // Focus first focusable element in modal
    setTimeout(() => {
      const focusableElements = modalInstance.element?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements?.length > 0) {
        focusableElements[0].focus();
      }
    }, 100);
  }

  /**
   * Restore focus after modal close
   */
  restoreFocus() {
    if (this.modalStack.length > 0) {
      // Focus previous modal
      const topModalId = this.modalStack[this.modalStack.length - 1];
      const topModal = this.activeModals.get(topModalId);
      if (topModal && topModal.element) {
        topModal.element.focus();
      }
    } else {
      // Focus previously focused element or body
      const lastModal = Array.from(this.activeModals.values()).pop();
      if (lastModal?._previouslyFocused) {
        lastModal._previouslyFocused.focus();
      } else {
        document.body.focus();
      }
    }
  }

  /**
   * Inject base modal styles
   */
  injectStyles() {
    if (document.getElementById('unified-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'unified-modal-styles';
    style.textContent = `
            .modals-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: var(--z-modal);
            }
            
            .modal-unified {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: auto;
                opacity: 0;
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
            
            .modal-unified.show {
                opacity: 1;
            }
            
            .modal-content-unified {
                background: var(--bg-card);
                border-radius: var(--radius-xl);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                border: 1px solid var(--border-color);
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            @media (max-width: 768px) {
                .modal-content-unified {
                    margin: 20px;
                    max-width: calc(100vw - 40px);
                    max-height: calc(100vh - 40px);
                }
            }
        `;
    document.head.appendChild(style);
  }

  /**
   * Cleanup modal resources
   */
  cleanup(modalId) {
    if (this.activeModals.has(modalId)) {
      this.activeModals.delete(modalId);
    }

    const stackIndex = this.modalStack.indexOf(modalId);
    if (stackIndex > -1) {
      this.modalStack.splice(stackIndex, 1);
    }

    if (this.modalStack.length === 0) {
      this.hideBackdrop();
      this.unlockBodyScroll();
    }
  }

  /**
   * Get current modal state
   */
  getState() {
    return {
      activeModals: this.activeModals.size,
      modalStack: [...this.modalStack],
      isScrollLocked: this.state.isScrollLocked,
    };
  }
}

// Create and export singleton instance
export const modalManager = new UnifiedModalManager();
export default modalManager;
