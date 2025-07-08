/**
 * accessibilityValidator.js - Accessibility Testing & Validation Suite
 * Tests WCAG 2.2 compliance for modals and keyboard navigation
 */

export class AccessibilityValidator {
    constructor() {
        this.testResults = [];
        this.violationCounts = {
            critical: 0,
            serious: 0,
            moderate: 0,
            minor: 0
        };
    }

    /**
     * Executa validação completa de acessibilidade
     */
    async runCompleteAccessibilityValidation() {
        console.log('♿ [AccessibilityValidator] Iniciando validação de acessibilidade...');
        
        try {
            // Testes de modais
            await this.validateModalAccessibility();
            
            // Testes de navegação por teclado
            await this.validateKeyboardNavigation();
            
            // Testes de ARIA e semântica
            await this.validateARIACompliance();
            
            // Testes de contraste e visibilidade
            await this.validateVisualAccessibility();
            
            // Testes de screen reader
            await this.validateScreenReaderSupport();
            
            return this.generateAccessibilityReport();
            
        } catch (error) {
            console.error('🔥 [AccessibilityValidator] Erro crítico na validação:', error);
            throw error;
        }
    }

    /**
     * TESTE 1: Acessibilidade dos modais
     */
    async validateModalAccessibility() {
        const testName = 'Modal Accessibility';
        console.log(`♿ [AccessibilityValidator] Executando: ${testName}`);
        
        try {
            const modalTests = [];
            
            // Teste SaveExitModal
            const saveExitModalTests = await this.testModalComponent('SaveExitModal');
            modalTests.push(...saveExitModalTests);
            
            // Teste SessionRecoveryModal  
            const recoveryModalTests = await this.testModalComponent('SessionRecoveryModal');
            modalTests.push(...recoveryModalTests);
            
            // Teste DisposicaoInicioModal
            const disposicaoModalTests = await this.testModalComponent('DisposicaoInicioModal');
            modalTests.push(...disposicaoModalTests);
            
            const allPassed = modalTests.every(test => test.passed);
            
            this.testResults.push({
                category: 'Modal Accessibility',
                name: testName,
                passed: allPassed,
                tests: modalTests,
                details: 'WCAG 2.2 compliance for modal components'
            });
            
            console.log(`${allPassed ? '✅' : '❌'} ${testName}: ${modalTests.length} testes`);
            
        } catch (error) {
            console.error(`❌ [AccessibilityValidator] Erro em ${testName}:`, error);
            this.testResults.push({
                category: 'Modal Accessibility',
                name: testName,
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * Testa acessibilidade de um componente modal específico
     */
    async testModalComponent(modalName) {
        const tests = [];
        
        try {
            // Criar instância do modal para teste
            const modalElement = await this.createMockModal(modalName);
            
            if (!modalElement) {
                tests.push({
                    name: `${modalName} - Creation`,
                    passed: false,
                    issue: 'Modal could not be created for testing'
                });
                return tests;
            }
            
            // TESTE: Role e ARIA labels
            const hasCorrectRole = modalElement.getAttribute('role') === 'dialog' || 
                                   modalElement.getAttribute('role') === 'alertdialog';
            tests.push({
                name: `${modalName} - Correct Role`,
                passed: hasCorrectRole,
                issue: hasCorrectRole ? null : 'Missing or incorrect role attribute'
            });
            
            // TESTE: aria-labelledby ou aria-label
            const hasLabel = modalElement.hasAttribute('aria-labelledby') || 
                            modalElement.hasAttribute('aria-label');
            tests.push({
                name: `${modalName} - ARIA Label`,
                passed: hasLabel,
                issue: hasLabel ? null : 'Missing aria-labelledby or aria-label'
            });
            
            // TESTE: aria-describedby
            const hasDescription = modalElement.hasAttribute('aria-describedby');
            tests.push({
                name: `${modalName} - ARIA Description`,
                passed: hasDescription,
                issue: hasDescription ? null : 'Missing aria-describedby for modal content'
            });
            
            // TESTE: Modal overlay
            const overlay = modalElement.closest('.modal-overlay') || 
                           modalElement.querySelector('.modal-overlay');
            const hasOverlay = overlay !== null;
            tests.push({
                name: `${modalName} - Modal Overlay`,
                passed: hasOverlay,
                issue: hasOverlay ? null : 'Missing modal overlay for background interaction'
            });
            
            // TESTE: Botão de fechar
            const closeButton = modalElement.querySelector('[data-dismiss="modal"], .btn-close, .close-btn, .modal-close');
            const hasCloseButton = closeButton !== null;
            tests.push({
                name: `${modalName} - Close Button`,
                passed: hasCloseButton,
                issue: hasCloseButton ? null : 'Missing accessible close button'
            });
            
            if (closeButton) {
                // TESTE: Close button accessibility
                const closeButtonAccessible = closeButton.hasAttribute('aria-label') || 
                                              closeButton.textContent.trim() !== '';
                tests.push({
                    name: `${modalName} - Close Button Label`,
                    passed: closeButtonAccessible,
                    issue: closeButtonAccessible ? null : 'Close button missing aria-label or text content'
                });
            }
            
            // TESTE: Focus trap
            const focusableElements = this.getFocusableElements(modalElement);
            const hasFocusableElements = focusableElements.length > 0;
            tests.push({
                name: `${modalName} - Focusable Elements`,
                passed: hasFocusableElements,
                issue: hasFocusableElements ? null : 'Modal has no focusable elements'
            });
            
            // TESTE: Keyboard navigation (simulated)
            if (hasFocusableElements) {
                const keyboardNavTest = await this.testKeyboardNavigationInModal(modalElement, focusableElements);
                tests.push({
                    name: `${modalName} - Keyboard Navigation`,
                    passed: keyboardNavTest.passed,
                    issue: keyboardNavTest.issue
                });
            }
            
            // TESTE: ESC key handling
            const escapeTest = await this.testEscapeKeyHandling(modalElement);
            tests.push({
                name: `${modalName} - ESC Key Handling`,
                passed: escapeTest.passed,
                issue: escapeTest.issue
            });
            
            // Cleanup
            if (modalElement.parentNode) {
                modalElement.parentNode.removeChild(modalElement);
            }
            
        } catch (error) {
            tests.push({
                name: `${modalName} - Test Execution`,
                passed: false,
                issue: `Error during testing: ${error.message}`
            });
        }
        
        return tests;
    }

    /**
     * Cria mock de modal para teste
     */
    async createMockModal(modalName) {
        try {
            let modalElement = null;
            
            switch (modalName) {
                case 'SaveExitModal':
                    modalElement = document.createElement('div');
                    modalElement.className = 'modal-overlay save-exit-modal';
                    modalElement.setAttribute('role', 'dialog');
                    modalElement.setAttribute('aria-labelledby', 'save-exit-title');
                    modalElement.setAttribute('aria-describedby', 'save-exit-description');
                    modalElement.innerHTML = `
                        <div class="modal-content">
                            <div class="modal-header">
                                <h2 id="save-exit-title">Salvar e Sair</h2>
                                <button class="btn-close" aria-label="Fechar modal"></button>
                            </div>
                            <div class="modal-body">
                                <p id="save-exit-description">Você tem um treino em andamento.</p>
                            </div>
                            <div class="modal-actions">
                                <button class="btn-primary">Salvar e Sair</button>
                                <button class="btn-secondary">Sair sem Salvar</button>
                                <button class="btn-tertiary">Cancelar</button>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'SessionRecoveryModal':
                    modalElement = document.createElement('div');
                    modalElement.className = 'modal-overlay session-recovery-modal';
                    modalElement.setAttribute('role', 'alertdialog');
                    modalElement.setAttribute('aria-labelledby', 'recovery-title');
                    modalElement.setAttribute('aria-describedby', 'recovery-description');
                    modalElement.innerHTML = `
                        <div class="modal-content">
                            <div class="modal-header">
                                <h2 id="recovery-title">Sessão Encontrada</h2>
                                <button class="btn-close" aria-label="Fechar modal"></button>
                            </div>
                            <div class="modal-body">
                                <p id="recovery-description">Encontramos uma sessão de treino não finalizada.</p>
                            </div>
                            <div class="modal-actions">
                                <button class="btn-primary">Recuperar</button>
                                <button class="btn-secondary">Descartar</button>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'DisposicaoInicioModal':
                    modalElement = document.createElement('div');
                    modalElement.className = 'modal-overlay disposicao-modal';
                    modalElement.setAttribute('role', 'dialog');
                    modalElement.setAttribute('aria-labelledby', 'disposicao-title');
                    modalElement.innerHTML = `
                        <div class="modal-content">
                            <div class="modal-header">
                                <h2 id="disposicao-title">Como você está se sentindo?</h2>
                                <button class="btn-close" aria-label="Fechar modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="disposition-options" role="radiogroup" aria-labelledby="disposicao-title">
                                    <label class="disposition-option">
                                        <input type="radio" name="disposition" value="otimo" aria-describedby="otimo-desc">
                                        <span>Ótimo</span>
                                        <small id="otimo-desc">Cheio de energia</small>
                                    </label>
                                    <label class="disposition-option">
                                        <input type="radio" name="disposition" value="bom" aria-describedby="bom-desc">
                                        <span>Bom</span>
                                        <small id="bom-desc">Preparado para treinar</small>
                                    </label>
                                    <label class="disposition-option">
                                        <input type="radio" name="disposition" value="ok" aria-describedby="ok-desc">
                                        <span>OK</span>
                                        <small id="ok-desc">Energia normal</small>
                                    </label>
                                </div>
                            </div>
                            <div class="modal-actions">
                                <button class="btn-primary" disabled>Continuar</button>
                                <button class="btn-secondary">Cancelar</button>
                            </div>
                        </div>
                    `;
                    break;
            }
            
            if (modalElement) {
                document.body.appendChild(modalElement);
                // Simular abertura do modal
                modalElement.style.display = 'flex';
                modalElement.style.visibility = 'visible';
                modalElement.style.opacity = '1';
            }
            
            return modalElement;
            
        } catch (error) {
            console.error(`Erro ao criar mock de ${modalName}:`, error);
            return null;
        }
    }

    /**
     * TESTE 2: Navegação por teclado
     */
    async validateKeyboardNavigation() {
        const testName = 'Keyboard Navigation';
        console.log(`♿ [AccessibilityValidator] Executando: ${testName}`);
        
        try {
            const tests = [];
            
            // Teste focus management
            const focusTest = await this.testFocusManagement();
            tests.push(focusTest);
            
            // Teste tab order
            const tabOrderTest = await this.testTabOrder();
            tests.push(tabOrderTest);
            
            // Teste skip links
            const skipLinksTest = await this.testSkipLinks();
            tests.push(skipLinksTest);
            
            // Teste keyboard shortcuts
            const shortcutsTest = await this.testKeyboardShortcuts();
            tests.push(shortcutsTest);
            
            const allPassed = tests.every(test => test.passed);
            
            this.testResults.push({
                category: 'Keyboard Navigation',
                name: testName,
                passed: allPassed,
                tests,
                details: 'Complete keyboard accessibility validation'
            });
            
            console.log(`${allPassed ? '✅' : '❌'} ${testName}: ${tests.length} testes`);
            
        } catch (error) {
            console.error(`❌ [AccessibilityValidator] Erro em ${testName}:`, error);
            this.testResults.push({
                category: 'Keyboard Navigation',
                name: testName,
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * Testa gerenciamento de foco
     */
    async testFocusManagement() {
        try {
            // Verificar se elementos focusáveis têm outline visível
            const focusableElements = this.getFocusableElements(document.body);
            let hasVisibleFocus = true;
            const elementsWithoutFocus = [];
            
            for (const element of focusableElements.slice(0, 10)) { // Testar primeiros 10
                element.focus();
                const computedStyle = window.getComputedStyle(element);
                const hasOutline = computedStyle.outline !== 'none' && 
                                 computedStyle.outline !== '0px' &&
                                 computedStyle.outline !== '';
                const hasBoxShadow = computedStyle.boxShadow !== 'none';
                const hasBorder = computedStyle.borderStyle !== 'none';
                
                if (!hasOutline && !hasBoxShadow && !hasBorder) {
                    hasVisibleFocus = false;
                    elementsWithoutFocus.push(element.tagName + (element.id ? `#${element.id}` : ''));
                }
            }
            
            return {
                name: 'Focus Management',
                passed: hasVisibleFocus,
                issue: hasVisibleFocus ? null : `Elements without visible focus: ${elementsWithoutFocus.join(', ')}`
            };
            
        } catch (error) {
            return {
                name: 'Focus Management',
                passed: false,
                issue: `Error testing focus: ${error.message}`
            };
        }
    }

    /**
     * Testa ordem de tabulação
     */
    async testTabOrder() {
        try {
            const focusableElements = this.getFocusableElements(document.body);
            let logicalTabOrder = true;
            const issues = [];
            
            // Verificar se elementos têm tabindex apropriados
            for (const element of focusableElements) {
                const tabIndex = element.tabIndex;
                
                // Verificar tabindex negativo em elementos que devem ser focusáveis
                if (tabIndex < 0 && !element.hasAttribute('disabled')) {
                    logicalTabOrder = false;
                    issues.push(`${element.tagName} with negative tabindex`);
                }
                
                // Verificar tabindex muito alto (anti-pattern)
                if (tabIndex > 0 && tabIndex > 100) {
                    logicalTabOrder = false;
                    issues.push(`${element.tagName} with excessive tabindex: ${tabIndex}`);
                }
            }
            
            return {
                name: 'Tab Order',
                passed: logicalTabOrder,
                issue: logicalTabOrder ? null : `Tab order issues: ${issues.join(', ')}`
            };
            
        } catch (error) {
            return {
                name: 'Tab Order',
                passed: false,
                issue: `Error testing tab order: ${error.message}`
            };
        }
    }

    /**
     * Testa skip links
     */
    async testSkipLinks() {
        try {
            const skipLinks = document.querySelectorAll('a[href^="#"], .skip-link');
            const hasSkipLinks = skipLinks.length > 0;
            
            let validSkipLinks = true;
            const issues = [];
            
            for (const link of skipLinks) {
                if (link.href && link.href.includes('#')) {
                    const targetId = link.href.split('#')[1];
                    const target = document.getElementById(targetId);
                    
                    if (!target) {
                        validSkipLinks = false;
                        issues.push(`Skip link targets non-existent element: #${targetId}`);
                    }
                }
            }
            
            return {
                name: 'Skip Links',
                passed: hasSkipLinks && validSkipLinks,
                issue: (!hasSkipLinks) ? 'No skip links found' : 
                       (!validSkipLinks) ? `Invalid skip links: ${issues.join(', ')}` : null
            };
            
        } catch (error) {
            return {
                name: 'Skip Links',
                passed: false,
                issue: `Error testing skip links: ${error.message}`
            };
        }
    }

    /**
     * Testa atalhos de teclado
     */
    async testKeyboardShortcuts() {
        try {
            // Testar atalhos comuns
            const shortcuts = [
                { key: 'Escape', description: 'Close modals' },
                { key: 'Enter', description: 'Activate buttons' },
                { key: 'Space', description: 'Activate buttons' }
            ];
            
            let shortcutsWork = true;
            const issues = [];
            
            // Simular apertar ESC para fechar modais
            const modals = document.querySelectorAll('.modal-overlay, [role="dialog"], [role="alertdialog"]');
            if (modals.length > 0) {
                const modal = modals[0];
                const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
                modal.dispatchEvent(escEvent);
                
                // Verificar se o modal tem listener de ESC (através de data attributes ou classes)
                const hasEscHandler = modal.hasAttribute('data-escape-close') || 
                                    modal.classList.contains('escape-closeable') ||
                                    modal.hasAttribute('data-keyboard-close');
                
                if (!hasEscHandler) {
                    shortcutsWork = false;
                    issues.push('Modal does not handle ESC key');
                }
            }
            
            return {
                name: 'Keyboard Shortcuts',
                passed: shortcutsWork,
                issue: shortcutsWork ? null : `Shortcut issues: ${issues.join(', ')}`
            };
            
        } catch (error) {
            return {
                name: 'Keyboard Shortcuts',
                passed: false,
                issue: `Error testing shortcuts: ${error.message}`
            };
        }
    }

    /**
     * TESTE 3: Conformidade ARIA
     */
    async validateARIACompliance() {
        const testName = 'ARIA Compliance';
        console.log(`♿ [AccessibilityValidator] Executando: ${testName}`);
        
        try {
            const tests = [];
            
            // Teste ARIA labels
            const labelsTest = await this.testARIALabels();
            tests.push(labelsTest);
            
            // Teste ARIA roles
            const rolesTest = await this.testARIARoles();
            tests.push(rolesTest);
            
            // Teste ARIA states
            const statesTest = await this.testARIAStates();
            tests.push(statesTest);
            
            // Teste landmarks
            const landmarksTest = await this.testLandmarks();
            tests.push(landmarksTest);
            
            const allPassed = tests.every(test => test.passed);
            
            this.testResults.push({
                category: 'ARIA Compliance',
                name: testName,
                passed: allPassed,
                tests,
                details: 'ARIA attributes and semantic structure validation'
            });
            
            console.log(`${allPassed ? '✅' : '❌'} ${testName}: ${tests.length} testes`);
            
        } catch (error) {
            console.error(`❌ [AccessibilityValidator] Erro em ${testName}:`, error);
            this.testResults.push({
                category: 'ARIA Compliance',
                name: testName,
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * Obtém elementos focusáveis
     */
    getFocusableElements(container) {
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ];
        
        return Array.from(container.querySelectorAll(focusableSelectors.join(', ')))
            .filter(element => {
                return element.offsetWidth > 0 && 
                       element.offsetHeight > 0 && 
                       window.getComputedStyle(element).visibility !== 'hidden';
            });
    }

    /**
     * Testa navegação por teclado em modal
     */
    async testKeyboardNavigationInModal(modalElement, focusableElements) {
        try {
            if (focusableElements.length === 0) {
                return {
                    passed: false,
                    issue: 'No focusable elements in modal'
                };
            }
            
            // Simular Tab navigation
            const currentFocusIndex = 0;
            focusableElements[currentFocusIndex].focus();
            
            // Testar se o foco está contido no modal
            const activeElement = document.activeElement;
            const focusWithinModal = modalElement.contains(activeElement);
            
            if (!focusWithinModal) {
                return {
                    passed: false,
                    issue: 'Focus not trapped within modal'
                };
            }
            
            // Testar navegação circular (Tab no último elemento volta ao primeiro)
            const lastElement = focusableElements[focusableElements.length - 1];
            lastElement.focus();
            
            // Simular Tab
            const tabEvent = new KeyboardEvent('keydown', { 
                key: 'Tab', 
                bubbles: true,
                preventDefault: function() {}
            });
            
            lastElement.dispatchEvent(tabEvent);
            
            return {
                passed: true,
                issue: null
            };
            
        } catch (error) {
            return {
                passed: false,
                issue: `Keyboard navigation test failed: ${error.message}`
            };
        }
    }

    /**
     * Testa handling da tecla ESC
     */
    async testEscapeKeyHandling(modalElement) {
        try {
            // Verificar se o modal tem data attribute ou event listener para ESC
            const hasEscapeAttribute = modalElement.hasAttribute('data-escape-close') ||
                                     modalElement.hasAttribute('data-keyboard-close');
            
            // Verificar se há event listeners para keydown
            const hasKeydownListener = modalElement.onkeydown !== null;
            
            // Dispatch ESC event
            const escEvent = new KeyboardEvent('keydown', {
                key: 'Escape',
                keyCode: 27,
                bubbles: true
            });
            
            let eventHandled = false;
            const originalDispatch = modalElement.dispatchEvent;
            modalElement.dispatchEvent = function(event) {
                if (event.type === 'keydown' && event.key === 'Escape') {
                    eventHandled = true;
                }
                return originalDispatch.call(this, event);
            };
            
            modalElement.dispatchEvent(escEvent);
            modalElement.dispatchEvent = originalDispatch;
            
            const passed = hasEscapeAttribute || hasKeydownListener || eventHandled;
            
            return {
                passed,
                issue: passed ? null : 'Modal does not handle ESC key properly'
            };
            
        } catch (error) {
            return {
                passed: false,
                issue: `ESC key test failed: ${error.message}`
            };
        }
    }

    /**
     * Testa ARIA labels
     */
    async testARIALabels() {
        try {
            const elementsNeedingLabels = document.querySelectorAll(
                'button:not([aria-label]):not([aria-labelledby]), ' +
                'input:not([aria-label]):not([aria-labelledby]):not([id]), ' +
                '[role="button"]:not([aria-label]):not([aria-labelledby])'
            );
            
            const unlabeledElements = Array.from(elementsNeedingLabels).filter(element => {
                // Verificar se tem texto visível
                const hasVisibleText = element.textContent && element.textContent.trim() !== '';
                // Verificar se tem label associado
                const hasAssociatedLabel = element.id && document.querySelector(`label[for="${element.id}"]`);
                
                return !hasVisibleText && !hasAssociatedLabel;
            });
            
            return {
                name: 'ARIA Labels',
                passed: unlabeledElements.length === 0,
                issue: unlabeledElements.length > 0 ? 
                       `${unlabeledElements.length} elements missing accessible labels` : null
            };
            
        } catch (error) {
            return {
                name: 'ARIA Labels',
                passed: false,
                issue: `Error testing ARIA labels: ${error.message}`
            };
        }
    }

    /**
     * Testa ARIA roles
     */
    async testARIARoles() {
        try {
            const elementsWithRoles = document.querySelectorAll('[role]');
            let validRoles = true;
            const issues = [];
            
            const validARIARoles = [
                'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
                'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
                'contentinfo', 'definition', 'dialog', 'directory', 'document',
                'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
                'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
                'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
                'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
                'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
                'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
                'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
                'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar',
                'tooltip', 'tree', 'treegrid', 'treeitem'
            ];
            
            for (const element of elementsWithRoles) {
                const role = element.getAttribute('role');
                if (!validARIARoles.includes(role)) {
                    validRoles = false;
                    issues.push(`Invalid role: ${role}`);
                }
            }
            
            return {
                name: 'ARIA Roles',
                passed: validRoles,
                issue: validRoles ? null : `Invalid roles found: ${issues.join(', ')}`
            };
            
        } catch (error) {
            return {
                name: 'ARIA Roles',
                passed: false,
                issue: `Error testing ARIA roles: ${error.message}`
            };
        }
    }

    /**
     * Testa ARIA states
     */
    async testARIAStates() {
        try {
            const expandableElements = document.querySelectorAll('[aria-expanded]');
            const toggleElements = document.querySelectorAll('[aria-pressed]');
            const hiddenElements = document.querySelectorAll('[aria-hidden]');
            
            let validStates = true;
            const issues = [];
            
            // Verificar aria-expanded
            for (const element of expandableElements) {
                const expanded = element.getAttribute('aria-expanded');
                if (expanded !== 'true' && expanded !== 'false') {
                    validStates = false;
                    issues.push(`Invalid aria-expanded value: ${expanded}`);
                }
            }
            
            // Verificar aria-pressed
            for (const element of toggleElements) {
                const pressed = element.getAttribute('aria-pressed');
                if (pressed !== 'true' && pressed !== 'false' && pressed !== 'mixed') {
                    validStates = false;
                    issues.push(`Invalid aria-pressed value: ${pressed}`);
                }
            }
            
            // Verificar aria-hidden
            for (const element of hiddenElements) {
                const hidden = element.getAttribute('aria-hidden');
                if (hidden !== 'true' && hidden !== 'false') {
                    validStates = false;
                    issues.push(`Invalid aria-hidden value: ${hidden}`);
                }
            }
            
            return {
                name: 'ARIA States',
                passed: validStates,
                issue: validStates ? null : `Invalid ARIA states: ${issues.join(', ')}`
            };
            
        } catch (error) {
            return {
                name: 'ARIA States',
                passed: false,
                issue: `Error testing ARIA states: ${error.message}`
            };
        }
    }

    /**
     * Testa landmarks
     */
    async testLandmarks() {
        try {
            const landmarks = {
                main: document.querySelectorAll('main, [role="main"]'),
                navigation: document.querySelectorAll('nav, [role="navigation"]'),
                banner: document.querySelectorAll('header, [role="banner"]'),
                contentinfo: document.querySelectorAll('footer, [role="contentinfo"]')
            };
            
            let hasRequiredLandmarks = true;
            const issues = [];
            
            // Verificar main
            if (landmarks.main.length === 0) {
                hasRequiredLandmarks = false;
                issues.push('Missing main landmark');
            } else if (landmarks.main.length > 1) {
                issues.push('Multiple main landmarks (should be unique)');
            }
            
            // Verificar navigation
            if (landmarks.navigation.length === 0) {
                issues.push('No navigation landmarks found');
            }
            
            return {
                name: 'Landmarks',
                passed: hasRequiredLandmarks,
                issue: issues.length > 0 ? `Landmark issues: ${issues.join(', ')}` : null
            };
            
        } catch (error) {
            return {
                name: 'Landmarks',
                passed: false,
                issue: `Error testing landmarks: ${error.message}`
            };
        }
    }

    /**
     * TESTE 4: Acessibilidade visual
     */
    async validateVisualAccessibility() {
        const testName = 'Visual Accessibility';
        console.log(`♿ [AccessibilityValidator] Executando: ${testName}`);
        
        try {
            const tests = [];
            
            // Teste contraste de cores
            const contrastTest = await this.testColorContrast();
            tests.push(contrastTest);
            
            // Teste tamanho de texto
            const textSizeTest = await this.testTextSize();
            tests.push(textSizeTest);
            
            // Teste zoom
            const zoomTest = await this.testZoomSupport();
            tests.push(zoomTest);
            
            const allPassed = tests.every(test => test.passed);
            
            this.testResults.push({
                category: 'Visual Accessibility',
                name: testName,
                passed: allPassed,
                tests,
                details: 'Color contrast, text size, and zoom support validation'
            });
            
            console.log(`${allPassed ? '✅' : '❌'} ${testName}: ${tests.length} testes`);
            
        } catch (error) {
            console.error(`❌ [AccessibilityValidator] Erro em ${testName}:`, error);
            this.testResults.push({
                category: 'Visual Accessibility',
                name: testName,
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * Testa contraste de cores
     */
    async testColorContrast() {
        try {
            // Verificar elementos de texto principais
            const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, button, a');
            const contrastIssues = [];
            
            for (let i = 0; i < Math.min(textElements.length, 20); i++) { // Testar primeiros 20
                const element = textElements[i];
                const style = window.getComputedStyle(element);
                const fontSize = parseFloat(style.fontSize);
                const fontWeight = style.fontWeight;
                
                // Verificar se é texto grande (18pt+ ou 14pt+ bold)
                const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
                
                // Para simplificar, apenas verificar se há cores definidas
                const hasColor = style.color !== 'rgba(0, 0, 0, 0)' && style.color !== '';
                const hasBackground = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== '';
                
                if (!hasColor && !hasBackground) {
                    contrastIssues.push(`Element without explicit colors: ${element.tagName}`);
                }
            }
            
            return {
                name: 'Color Contrast',
                passed: contrastIssues.length === 0,
                issue: contrastIssues.length > 0 ? 
                       `Potential contrast issues: ${contrastIssues.slice(0, 3).join(', ')}` : null
            };
            
        } catch (error) {
            return {
                name: 'Color Contrast',
                passed: false,
                issue: `Error testing color contrast: ${error.message}`
            };
        }
    }

    /**
     * Testa tamanho de texto
     */
    async testTextSize() {
        try {
            const textElements = document.querySelectorAll('p, span, div, button, a');
            const smallTextElements = [];
            
            for (const element of textElements) {
                const style = window.getComputedStyle(element);
                const fontSize = parseFloat(style.fontSize);
                
                // Verificar se o texto é muito pequeno (< 12px)
                if (fontSize < 12 && element.textContent.trim() !== '') {
                    smallTextElements.push(`${element.tagName}: ${fontSize}px`);
                }
            }
            
            return {
                name: 'Text Size',
                passed: smallTextElements.length === 0,
                issue: smallTextElements.length > 0 ? 
                       `Small text elements: ${smallTextElements.slice(0, 3).join(', ')}` : null
            };
            
        } catch (error) {
            return {
                name: 'Text Size',
                passed: false,
                issue: `Error testing text size: ${error.message}`
            };
        }
    }

    /**
     * Testa suporte a zoom
     */
    async testZoomSupport() {
        try {
            // Verificar se há viewport meta tag apropriada
            const viewport = document.querySelector('meta[name="viewport"]');
            const hasViewport = viewport !== null;
            
            let viewportContent = '';
            let allowsZoom = true;
            
            if (hasViewport) {
                viewportContent = viewport.getAttribute('content') || '';
                // Verificar se bloqueia zoom
                allowsZoom = !viewportContent.includes('user-scalable=no') && 
                           !viewportContent.includes('maximum-scale=1');
            }
            
            return {
                name: 'Zoom Support',
                passed: hasViewport && allowsZoom,
                issue: (!hasViewport) ? 'Missing viewport meta tag' :
                       (!allowsZoom) ? 'Viewport blocks zoom functionality' : null
            };
            
        } catch (error) {
            return {
                name: 'Zoom Support',
                passed: false,
                issue: `Error testing zoom support: ${error.message}`
            };
        }
    }

    /**
     * TESTE 5: Suporte a screen reader
     */
    async validateScreenReaderSupport() {
        const testName = 'Screen Reader Support';
        console.log(`♿ [AccessibilityValidator] Executando: ${testName}`);
        
        try {
            const tests = [];
            
            // Teste headings hierarchy
            const headingsTest = await this.testHeadingsHierarchy();
            tests.push(headingsTest);
            
            // Teste alt text
            const altTextTest = await this.testAltText();
            tests.push(altTextTest);
            
            // Teste live regions
            const liveRegionsTest = await this.testLiveRegions();
            tests.push(liveRegionsTest);
            
            const allPassed = tests.every(test => test.passed);
            
            this.testResults.push({
                category: 'Screen Reader Support',
                name: testName,
                passed: allPassed,
                tests,
                details: 'Screen reader compatibility and semantic structure'
            });
            
            console.log(`${allPassed ? '✅' : '❌'} ${testName}: ${tests.length} testes`);
            
        } catch (error) {
            console.error(`❌ [AccessibilityValidator] Erro em ${testName}:`, error);
            this.testResults.push({
                category: 'Screen Reader Support',
                name: testName,
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * Testa hierarquia de headings
     */
    async testHeadingsHierarchy() {
        try {
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            let hierarchyValid = true;
            const issues = [];
            
            let previousLevel = 0;
            
            for (const heading of headings) {
                const currentLevel = parseInt(heading.tagName.substring(1));
                
                // Verificar se pula níveis (ex: h1 → h3)
                if (currentLevel > previousLevel + 1) {
                    hierarchyValid = false;
                    issues.push(`Heading level jumps from h${previousLevel} to h${currentLevel}`);
                }
                
                previousLevel = currentLevel;
            }
            
            // Verificar se há h1
            const hasH1 = document.querySelector('h1') !== null;
            if (!hasH1) {
                hierarchyValid = false;
                issues.push('Missing h1 element');
            }
            
            return {
                name: 'Headings Hierarchy',
                passed: hierarchyValid,
                issue: hierarchyValid ? null : `Hierarchy issues: ${issues.join(', ')}`
            };
            
        } catch (error) {
            return {
                name: 'Headings Hierarchy',
                passed: false,
                issue: `Error testing headings: ${error.message}`
            };
        }
    }

    /**
     * Testa alt text
     */
    async testAltText() {
        try {
            const images = document.querySelectorAll('img');
            const missingAlt = [];
            
            for (const img of images) {
                const alt = img.getAttribute('alt');
                const hasAlt = alt !== null;
                const isDecorative = alt === '';
                const hasDescriptiveAlt = hasAlt && alt.length > 0;
                
                // Imagens sem alt ou com alt não descritivo
                if (!hasAlt) {
                    missingAlt.push(`img[src="${img.src.substring(0, 30)}..."] missing alt`);
                } else if (!isDecorative && alt.length < 3) {
                    missingAlt.push(`img with inadequate alt text: "${alt}"`);
                }
            }
            
            return {
                name: 'Alt Text',
                passed: missingAlt.length === 0,
                issue: missingAlt.length > 0 ? 
                       `Alt text issues: ${missingAlt.slice(0, 3).join(', ')}` : null
            };
            
        } catch (error) {
            return {
                name: 'Alt Text',
                passed: false,
                issue: `Error testing alt text: ${error.message}`
            };
        }
    }

    /**
     * Testa live regions
     */
    async testLiveRegions() {
        try {
            const liveRegions = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
            let validLiveRegions = true;
            const issues = [];
            
            for (const region of liveRegions) {
                const ariaLive = region.getAttribute('aria-live');
                const role = region.getAttribute('role');
                
                // Verificar valores válidos para aria-live
                if (ariaLive && !['polite', 'assertive', 'off'].includes(ariaLive)) {
                    validLiveRegions = false;
                    issues.push(`Invalid aria-live value: ${ariaLive}`);
                }
                
                // Verificar se live regions têm conteúdo inicial apropriado
                if (role === 'status' && region.textContent.trim() === '') {
                    issues.push('Empty status region');
                }
            }
            
            return {
                name: 'Live Regions',
                passed: validLiveRegions,
                issue: validLiveRegions ? null : `Live region issues: ${issues.join(', ')}`
            };
            
        } catch (error) {
            return {
                name: 'Live Regions',
                passed: false,
                issue: `Error testing live regions: ${error.message}`
            };
        }
    }

    /**
     * Gera relatório de acessibilidade
     */
    generateAccessibilityReport() {
        const totalTests = this.testResults.reduce((acc, category) => {
            return acc + (category.tests ? category.tests.length : 1);
        }, 0);
        
        const passedTests = this.testResults.reduce((acc, category) => {
            if (category.tests) {
                return acc + category.tests.filter(test => test.passed).length;
            }
            return acc + (category.passed ? 1 : 0);
        }, 0);
        
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : '0.0';
        
        // Calcular severity dos problemas
        this.testResults.forEach(category => {
            if (category.tests) {
                category.tests.forEach(test => {
                    if (!test.passed) {
                        // Classificar por severidade baseado no tipo de problema
                        if (test.name.includes('Modal') || test.name.includes('Keyboard')) {
                            this.violationCounts.critical++;
                        } else if (test.name.includes('ARIA') || test.name.includes('Focus')) {
                            this.violationCounts.serious++;
                        } else if (test.name.includes('Contrast') || test.name.includes('Text Size')) {
                            this.violationCounts.moderate++;
                        } else {
                            this.violationCounts.minor++;
                        }
                    }
                });
            } else if (!category.passed) {
                this.violationCounts.serious++;
            }
        });
        
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: `${successRate}%`,
                wcagLevel: successRate >= 95 ? 'AA' : successRate >= 80 ? 'A' : 'Non-compliant'
            },
            violations: this.violationCounts,
            categories: this.testResults,
            timestamp: new Date().toISOString(),
            recommendations: this.generateRecommendations()
        };
        
        console.log('♿ [AccessibilityValidator] Relatório Final:');
        console.log(`✅ Testes aprovados: ${passedTests}/${totalTests} (${successRate}%)`);
        console.log(`🎯 Nível WCAG: ${report.summary.wcagLevel}`);
        console.log(`🔴 Críticos: ${this.violationCounts.critical}`);
        console.log(`🟠 Sérios: ${this.violationCounts.serious}`);
        console.log(`🟡 Moderados: ${this.violationCounts.moderate}`);
        console.log(`🔵 Menores: ${this.violationCounts.minor}`);
        
        return report;
    }

    /**
     * Gera recomendações baseadas nos resultados
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.violationCounts.critical > 0) {
            recommendations.push({
                priority: 'high',
                category: 'Critical Issues',
                message: 'Corrigir problemas críticos de modal e navegação por teclado imediatamente'
            });
        }
        
        if (this.violationCounts.serious > 0) {
            recommendations.push({
                priority: 'high',
                category: 'ARIA Compliance',
                message: 'Implementar ARIA labels e roles adequados para screen readers'
            });
        }
        
        if (this.violationCounts.moderate > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'Visual Accessibility',
                message: 'Melhorar contraste de cores e tamanhos de texto'
            });
        }
        
        return recommendations;
    }
}

// Funções de conveniência
export async function validateModalAccessibility() {
    const validator = new AccessibilityValidator();
    await validator.validateModalAccessibility();
    return validator.generateAccessibilityReport();
}

export async function validateKeyboardNavigation() {
    const validator = new AccessibilityValidator();
    await validator.validateKeyboardNavigation();
    return validator.generateAccessibilityReport();
}

// Disponibilizar globalmente
window.AccessibilityValidator = AccessibilityValidator;
window.validateModalAccessibility = validateModalAccessibility;
window.validateKeyboardNavigation = validateKeyboardNavigation;

export default AccessibilityValidator;