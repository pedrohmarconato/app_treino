// components/BaseModal.js
// Base modal class with standardized Promise-based async pattern

export default class BaseModal {
  constructor(options = {}) {
    this.options = {
      id: options.id || `modal-${Date.now()}`,
      title: options.title || '',
      content: options.content || '',
      className: options.className || '',
      closable: options.closable !== false,
      backdrop: options.backdrop !== false,
      keyboard: options.keyboard !== false,
      focus: options.focus !== false,
      ...options,
    };

    this.element = null;
    this.isOpen = false;
    this.promise = null;
    this.resolve = null;
    this.reject = null;
    this._previouslyFocused = null;
  }

  /**
   * Show modal and return Promise
   * @param {Object} showOptions - Show options
   * @returns {Promise} Promise that resolves when modal is closed
   */
  show(showOptions = {}) {
    if (this.isOpen) {
      return this.promise;
    }

    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.promise = new Promise((res, rej) => {
        this.resolve = res;
        this.reject = rej;
      });

      try {
        this._show(showOptions);
      } catch (error) {
        this.reject(error);
      }
    });
  }

  /**
   * Internal show implementation
   * @param {Object} showOptions - Show options
   */
  _show(showOptions = {}) {
    // Store currently focused element
    this._previouslyFocused = document.activeElement;

    // Create modal element
    this.element = this.createElement();

    // Set z-index if provided
    if (showOptions.zIndex) {
      this.element.style.zIndex = showOptions.zIndex;
    }

    // Insert into container or body
    const container = showOptions.container || document.body;
    container.appendChild(this.element);

    // Setup event listeners
    this.setupEventListeners();

    // Show with animation
    requestAnimationFrame(() => {
      this.element.classList.add('show');
      this.isOpen = true;

      // Focus management
      if (this.options.focus) {
        this.focusModal();
      }

      // Trigger show callback
      if (showOptions.onShow) {
        showOptions.onShow(this);
      }
    });
  }

  /**
   * Hide modal
   * @param {*} result - Result to resolve with
   */
  hide(result = null) {
    if (!this.isOpen) return Promise.resolve();

    return new Promise((resolve) => {
      this.element.classList.remove('show');
      this.element.classList.add('hiding');

      // Wait for animation
      setTimeout(() => {
        this.cleanup();
        this.isOpen = false;

        // Resolve the modal promise
        if (this.resolve) {
          this.resolve(result);
        }

        resolve();
      }, 300);
    });
  }

  /**
   * Close modal with rejection
   * @param {Error} error - Error to reject with
   */
  close(error = null) {
    if (!this.isOpen) return;

    this.cleanup();
    this.isOpen = false;

    if (this.reject && error) {
      this.reject(error);
    } else if (this.resolve) {
      this.resolve(null);
    }
  }

  /**
   * Create modal DOM element
   * @returns {HTMLElement} Modal element
   */
  createElement() {
    const modal = document.createElement('div');
    modal.id = this.options.id;
    modal.className = `modal-unified ${this.options.className}`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    if (this.options.title) {
      modal.setAttribute('aria-labelledby', `${this.options.id}-title`);
    }

    modal.innerHTML = this.getTemplate();

    return modal;
  }

  /**
   * Get modal HTML template - override in subclasses
   * @returns {string} HTML template
   */
  getTemplate() {
    return `
            <div class="modal-content-unified">
                ${
                  this.options.title
                    ? `
                    <div class="modal-header">
                        <h2 id="${this.options.id}-title" class="modal-title">${this.options.title}</h2>
                        ${
                          this.options.closable
                            ? `
                            <button type="button" class="modal-close" aria-label="Fechar">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        `
                            : ''
                        }
                    </div>
                `
                    : ''
                }
                <div class="modal-body">
                    ${this.options.content}
                </div>
                ${this.getFooterTemplate()}
            </div>
        `;
  }

  /**
   * Get footer template - override in subclasses
   * @returns {string} Footer HTML
   */
  getFooterTemplate() {
    return '';
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close button
    const closeBtn = this.element.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Backdrop click
    if (this.options.backdrop) {
      this.element.addEventListener('click', (e) => {
        if (e.target === this.element) {
          this.hide();
        }
      });
    }

    // Keyboard events
    if (this.options.keyboard) {
      document.addEventListener('keydown', this.handleKeydown.bind(this));
    }
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeydown(e) {
    if (e.key === 'Escape' && this.options.keyboard) {
      this.hide();
    }

    // Focus trap
    if (e.key === 'Tab') {
      this.trapFocus(e);
    }
  }

  /**
   * Focus trap implementation
   * @param {KeyboardEvent} e - Tab event
   */
  trapFocus(e) {
    const focusableElements = this.element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }

  /**
   * Focus modal
   */
  focusModal() {
    const focusableElements = this.element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      this.element.focus();
    }
  }

  /**
   * Cleanup modal resources
   */
  cleanup() {
    if (this.element) {
      // Remove event listeners
      document.removeEventListener('keydown', this.handleKeydown.bind(this));

      // Remove from DOM
      this.element.remove();
      this.element = null;
    }

    // Restore focus
    if (this._previouslyFocused) {
      this._previouslyFocused.focus();
    }
  }

  /**
   * Update modal content
   * @param {string} content - New content
   */
  updateContent(content) {
    if (this.element) {
      const body = this.element.querySelector('.modal-body');
      if (body) {
        body.innerHTML = content;
      }
    }
  }

  /**
   * Update modal title
   * @param {string} title - New title
   */
  updateTitle(title) {
    if (this.element) {
      const titleEl = this.element.querySelector('.modal-title');
      if (titleEl) {
        titleEl.textContent = title;
      }
    }
  }

  /**
   * Handle window resize
   */
  onResize() {
    // Override in subclasses if needed
  }

  /**
   * Static method to show modal quickly
   * @param {Object} options - Modal options
   * @returns {Promise} Modal promise
   */
  static show(options = {}) {
    const modal = new this(options);
    return modal.show();
  }
}

// Add base modal styles
const style = document.createElement('style');
style.id = 'base-modal-styles';
style.textContent = `
    .modal-unified {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
        transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .modal-unified.show {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }

    .modal-unified.hiding {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 24px 0 24px;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 24px;
    }

    .modal-title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-secondary);
        padding: 8px;
        border-radius: var(--radius-sm);
        transition: background-color 0.2s ease;
    }

    .modal-close:hover {
        background-color: var(--bg-card-hover);
        color: var(--text-primary);
    }

    .modal-body {
        padding: 0 24px 24px 24px;
    }
`;

if (!document.getElementById('base-modal-styles')) {
  document.head.appendChild(style);
}
