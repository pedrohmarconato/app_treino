// utils/buttonEnhancer.js
// Enhanced button functionality with loading states and error handling

import { showNotification } from '../ui/notifications.js';

export class ButtonEnhancer {
    /**
     * Enhance button with loading state and error handling
     * @param {HTMLElement|string} button - Button element or selector
     * @param {Function} asyncAction - Async function to execute
     * @param {Object} options - Configuration options
     */
    static async enhanceButton(button, asyncAction, options = {}) {
        const btn = typeof button === 'string' ? document.querySelector(button) : button;
        if (!btn) {
            console.error('[ButtonEnhancer] Button not found:', button);
            return;
        }

        const config = {
            loadingText: options.loadingText || 'Processando...',
            successMessage: options.successMessage || null,
            errorMessage: options.errorMessage || 'Erro ao processar ação',
            disableOnClick: options.disableOnClick !== false,
            showSpinner: options.showSpinner !== false,
            timeout: options.timeout || 30000,
            ...options
        };

        // Store original state
        const originalText = btn.textContent;
        const originalDisabled = btn.disabled;
        const originalClasses = btn.className;

        try {
            // Set loading state
            if (config.disableOnClick) {
                btn.disabled = true;
            }

            if (config.showSpinner) {
                btn.innerHTML = `
                    <span class="spinner-small"></span>
                    ${config.loadingText}
                `;
                btn.classList.add('btn-loading');
            } else {
                btn.textContent = config.loadingText;
            }

            // Execute action with timeout
            const actionPromise = asyncAction();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), config.timeout)
            );

            const result = await Promise.race([actionPromise, timeoutPromise]);

            // Show success message if configured
            if (config.successMessage) {
                showNotification(config.successMessage, 'success');
            }

            return result;

        } catch (error) {
            console.error('[ButtonEnhancer] Action failed:', error);
            
            // Show error message
            const errorMsg = error.message === 'Timeout' 
                ? 'Operação demorou muito para responder'
                : config.errorMessage;
                
            showNotification(errorMsg, 'error');
            
            throw error;

        } finally {
            // Restore original state
            btn.textContent = originalText;
            btn.disabled = originalDisabled;
            btn.className = originalClasses;
        }
    }

    /**
     * Add global loading spinner styles
     */
    static injectSpinnerStyles() {
        if (document.getElementById('button-enhancer-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'button-enhancer-styles';
        style.textContent = `
            .btn-loading {
                position: relative;
                pointer-events: none;
            }
            
            .spinner-small {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid transparent;
                border-top: 2px solid currentColor;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 8px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .btn-loading .spinner-small {
                opacity: 0.7;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Enhanced click handler with automatic error handling
     * @param {HTMLElement|string} button - Button element or selector
     * @param {Function} handler - Click handler function
     * @param {Object} options - Configuration options
     */
    static addClickHandler(button, handler, options = {}) {
        const btn = typeof button === 'string' ? document.querySelector(button) : button;
        if (!btn) {
            console.error('[ButtonEnhancer] Button not found:', button);
            return;
        }

        // Inject styles
        this.injectSpinnerStyles();

        btn.addEventListener('click', async (event) => {
            event.preventDefault();
            
            try {
                await this.enhanceButton(btn, () => handler(event), options);
            } catch (error) {
                // Error already handled in enhanceButton
                console.debug('[ButtonEnhancer] Click handler error handled:', error.message);
            }
        });
    }

    /**
     * Enhance form submission with loading state
     * @param {HTMLFormElement|string} form - Form element or selector
     * @param {Function} submitHandler - Submit handler function
     * @param {Object} options - Configuration options
     */
    static enhanceForm(form, submitHandler, options = {}) {
        const formEl = typeof form === 'string' ? document.querySelector(form) : form;
        if (!formEl) {
            console.error('[ButtonEnhancer] Form not found:', form);
            return;
        }

        const submitBtn = formEl.querySelector('button[type="submit"], input[type="submit"]');
        if (!submitBtn) {
            console.error('[ButtonEnhancer] Submit button not found in form');
            return;
        }

        formEl.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            try {
                await this.enhanceButton(submitBtn, () => submitHandler(event), {
                    loadingText: 'Salvando...',
                    successMessage: 'Salvo com sucesso!',
                    errorMessage: 'Erro ao salvar',
                    ...options
                });
            } catch (error) {
                console.debug('[ButtonEnhancer] Form submission error handled:', error.message);
            }
        });
    }

    /**
     * Create a debounced version of a function
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     */
    static debounce(func, delay = 300) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Add debounced click handler
     * @param {HTMLElement|string} button - Button element or selector
     * @param {Function} handler - Click handler function
     * @param {number} delay - Debounce delay in milliseconds
     * @param {Object} options - Configuration options
     */
    static addDebouncedClickHandler(button, handler, delay = 300, options = {}) {
        const debouncedHandler = this.debounce(handler, delay);
        this.addClickHandler(button, debouncedHandler, options);
    }
}

// Auto-inject styles when module loads
ButtonEnhancer.injectSpinnerStyles();

export default ButtonEnhancer;